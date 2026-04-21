"""Local corpus retrieval for factual grounding.

Phase A implementation: pure-Python, grep-style keyword scoring over each
persona's extracted/corpus.md + perplexity_notes.md. No embeddings, no
external services. Designed as a first-win that ships without any dependency
beyond stdlib, and structured behind a Protocol so a future embedding-based
retriever can be swapped in without changing callers.

Scope resolution matches the rest of persona-studio: project-local
`./data/people/<name>/` wins, global `~/.persona-studio/data/people/<name>/`
is the fallback.
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Iterable, Protocol

from persona_studio.grounding.types import EvidenceChunk


# --- Public API ---------------------------------------------------------------


class Retriever(Protocol):
    """Pluggable retrieval interface.

    The Phase A implementation is in :func:`retrieve_evidence` (module-level
    function). Future embedding-based retrievers can implement this Protocol
    to be swapped in behind the same callers.
    """

    def retrieve(self, persona: str, topic: str, k: int) -> list[EvidenceChunk]:
        ...


def find_persona_data_dir(name: str) -> Path | None:
    """Locate a persona's data directory with project-first priority.

    Returns the first existing path among:
      1. ``./data/people/<name>/`` (project-local)
      2. ``$HOME/.persona-studio/data/people/<name>/`` (global library)

    Returns None if the persona exists in neither scope.
    """
    project = Path.cwd() / "data" / "people" / name
    if project.exists():
        return project
    home = os.environ.get("HOME")
    if home:
        global_home = Path(home) / ".persona-studio" / "data" / "people" / name
        if global_home.exists():
            return global_home
    return None


def retrieve_evidence(persona: str, topic: str, k: int = 8) -> list[EvidenceChunk]:
    """Return the top-k evidence chunks for a persona that match a topic.

    Reads ``<persona-dir>/extracted/corpus.md`` and (if present)
    ``<persona-dir>/extracted/perplexity_notes.md``, chunks each file on
    paragraph boundaries, scores chunks by keyword overlap with the topic,
    and returns the top-k sorted by descending score.

    If the persona is unknown or the topic is empty, returns an empty list.
    Missing ``perplexity_notes.md`` is tolerated silently — common for
    Private-mode personas that skipped the Perplexity step.
    """
    topic = topic.strip()
    if not topic or k <= 0:
        return []

    data_dir = find_persona_data_dir(persona)
    if data_dir is None:
        return []

    extracted = data_dir / "extracted"
    if not extracted.exists():
        return []

    query_tokens = _tokenize(topic)
    if not query_tokens:
        return []

    all_chunks: list[EvidenceChunk] = []
    for source_name in ("corpus.md", "perplexity_notes.md"):
        path = extracted / source_name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for chunk in _chunk_markdown(text, source_name, persona):
            score = _score_chunk(chunk.text, query_tokens)
            if score > 0:
                all_chunks.append(
                    EvidenceChunk(
                        persona=chunk.persona,
                        source=chunk.source,
                        line_start=chunk.line_start,
                        line_end=chunk.line_end,
                        text=chunk.text,
                        score=score,
                    )
                )

    all_chunks.sort(key=lambda c: c.score, reverse=True)
    return all_chunks[:k]


# --- Internal helpers ---------------------------------------------------------


# Keep Korean (Hangul) + alphanumeric + Chinese CJK Unified Ideographs; strip rest.
_TOKEN_RE = re.compile(r"[A-Za-z0-9가-힣一-龥]+")

# Minimal bilingual stopword list; aim is to cut common noise, not full NLP.
_STOPWORDS = frozenset(
    {
        "a", "an", "the", "and", "or", "but", "of", "for", "to", "in", "on",
        "with", "is", "are", "was", "were", "be", "been", "being", "it", "its",
        "this", "that", "these", "those", "as", "at", "by", "from", "has",
        "have", "had", "not", "no", "yes", "do", "does", "did", "so", "if",
        "then", "than", "about", "into", "over", "under", "up", "down", "out",
        "i", "you", "he", "she", "we", "they", "them", "us", "me", "my", "your",
        "our", "their", "his", "her",
        # Korean common particles / conjunctions
        "의", "가", "이", "은", "는", "을", "를", "에", "에서", "와", "과",
        "도", "만", "으로", "로", "하다", "있다", "없다", "그리고", "그래서",
        "하지만", "그런데", "또는",
    }
)


def _tokenize(text: str) -> list[str]:
    """Split text into lowercased, stopword-stripped tokens (EN+KO-aware)."""
    return [
        t
        for t in (m.group(0).lower() for m in _TOKEN_RE.finditer(text))
        if t and t not in _STOPWORDS and len(t) > 1
    ]


def _chunk_markdown(
    text: str, source: str, persona: str
) -> Iterable[EvidenceChunk]:
    """Split a markdown document into paragraph chunks with 1-based line ranges.

    A chunk is a contiguous run of non-blank lines. Score is filled in by
    the caller; we emit score=0.0 here as a placeholder.
    """
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        # Skip blank lines.
        while i < len(lines) and not lines[i].strip():
            i += 1
        if i >= len(lines):
            break
        start = i + 1  # 1-based
        buf: list[str] = []
        while i < len(lines) and lines[i].strip():
            buf.append(lines[i])
            i += 1
        end = i  # 1-based inclusive (i is one past the last non-blank)
        chunk_text = "\n".join(buf).strip()
        if chunk_text:
            yield EvidenceChunk(
                persona=persona,
                source=source,
                line_start=start,
                line_end=end,
                text=chunk_text,
                score=0.0,
            )


def _score_chunk(chunk_text: str, query_tokens: list[str]) -> float:
    """Score a chunk against query tokens via normalized keyword overlap.

    Returns a value in [0, 1]:
      score = (unique query tokens present in chunk) / (unique query tokens)
    A length penalty is applied so excessively long chunks do not dominate
    just because they happen to contain many words. A chunk with zero token
    overlap returns 0.0, signaling the caller to drop it.
    """
    if not query_tokens:
        return 0.0
    chunk_tokens = set(_tokenize(chunk_text))
    unique_query = set(query_tokens)
    matched = unique_query & chunk_tokens
    if not matched:
        return 0.0
    base = len(matched) / len(unique_query)
    # Very mild length penalty: chunks over ~400 words lose a bit.
    length_penalty = min(1.0, 400 / max(len(chunk_text.split()), 1))
    return round(base * length_penalty, 6)
