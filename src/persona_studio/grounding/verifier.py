"""Tier-1 local verification of extracted claims against an evidence bundle.

Phase A (v2) — deterministic rule-based verifier. For each :class:`Claim`,
scan the supplied list of :class:`EvidenceChunk` and decide:

* ``SUPPORTED`` — SOME chunk contains all of the claim's numeric anchors
  (years + percentages) AND at least one overlapping content word. The
  returned citation points to that anchor-bearing chunk, not to the chunk
  with the most content overlap. This matters when a persona's corpus has
  multiple chunks on the same topic and the anchor lives in a smaller one.
* ``UNSUPPORTED`` — some chunk shares ≥ 2 content words with the claim
  AND its numeric anchors on the same axis (year OR percent) are disjoint
  from the claim's. Threshold ≥ 2 avoids flagging unrelated chunks that
  just happen to share a single common word (e.g., claim about GPT-7 in
  2027 vs an unrelated corpus chunk with the word "released" in a 2023
  sentence). Same-subject contradictions like "99% vs 18% for the same
  prototype/bug/features context" naturally exceed 2.
* ``UNVERIFIABLE`` — no supporting or contradicting chunk OR the claim is
  OPINION / NARRATIVE.

Tokenization is script-aware: a run like ``doc보다`` splits into
``["doc", "보다"]`` so Latin and Hangul do not leak into each other. Korean
particles are stripped from evidence tokens (``프로토타입이`` also counts as
``프로토타입``) to widen content overlap without changing the source text.

Tier-2 verification (Perplexity MCP / WebSearch) is intentionally *not*
handled here; it's orchestrated from the markdown command layer so the
Python side stays network-free and deterministic.
"""
from __future__ import annotations

import re
from collections.abc import Iterable

from persona_studio.grounding.types import (
    Claim,
    ClaimKind,
    EvidenceChunk,
    VerifyResult,
    VerifyStatus,
)


_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_PERCENT_RE = re.compile(r"\d+(?:\.\d+)?\s?%")

# Script-aware token pattern: pure Latin/digit, pure Hangul/digit, or pure CJK/digit.
# Mixed-script runs like ``doc보다`` split into ``doc`` + ``보다`` without extra work.
_TOKEN_RE = re.compile(r"[A-Za-z0-9]+|[가-힣0-9]+|[一-龥0-9]+")

# Common Korean particles that trail nouns — stripping them widens overlap
# between claim and evidence without changing the original corpus text.
_KO_PARTICLES = (
    "으로써", "로써", "에서", "에게", "한테",
    "으로", "로",
    "짜리", "부터", "까지", "조차", "마저",
    "보다", "처럼", "같이",
    "은", "는", "이", "가", "을", "를", "의", "에", "도", "만", "와", "과",
)

# Minimal English/Korean stopwords for salience filtering.
_STOPWORDS = frozenset(
    {
        "a", "an", "the", "and", "or", "but", "of", "for", "to", "in", "on",
        "with", "is", "are", "was", "were", "be", "it", "its", "this", "that",
        "as", "at", "by", "from", "has", "have", "had", "not", "no", "yes",
        "do", "did", "so", "if", "then", "than", "about", "into", "over",
        "i", "you", "he", "she", "we", "they", "them", "his", "her",
        "의", "가", "이", "은", "는", "을", "를", "에", "에서", "와", "과",
        "도", "만", "으로", "로", "하다", "있다", "없다", "그리고", "경우",
    }
)


def verify_claim(claim: Claim, evidence: Iterable[EvidenceChunk]) -> VerifyResult:
    """Verify a single claim against an evidence bundle.

    Does not fetch evidence itself — call ``retrieve_evidence`` first and
    pass the result here. Pure function; separating retrieval from
    verification keeps each side trivially testable.
    """
    if claim.kind is ClaimKind.OPINION:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="Opinion claim; not subject to factual verification.",
        )
    if claim.kind is ClaimKind.NARRATIVE:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="Narrative; no factual anchor to verify.",
        )

    evidence_list = list(evidence)
    if not evidence_list:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="No evidence available for this persona/topic.",
        )

    claim_tokens = _content_tokens(claim.text)
    if not claim_tokens:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="Claim lacks salient anchors (numbers, names) to verify.",
        )

    claim_years = set(_YEAR_RE.findall(claim.text))
    claim_pcts = set(_PERCENT_RE.findall(claim.text))

    supporters: list[tuple[EvidenceChunk, set[str]]] = []
    contradictors: list[tuple[EvidenceChunk, set[str], str]] = []
    best_partial: tuple[EvidenceChunk, set[str]] | None = None

    for chunk in evidence_list:
        ev_tokens = _content_tokens(chunk.text)
        overlap = claim_tokens & ev_tokens
        if not overlap:
            continue

        if best_partial is None or len(overlap) > len(best_partial[1]):
            best_partial = (chunk, overlap)

        ev_years = set(_YEAR_RE.findall(chunk.text))
        ev_pcts = set(_PERCENT_RE.findall(chunk.text))

        year_match = not claim_years or claim_years.issubset(ev_years)
        pct_match = not claim_pcts or claim_pcts.issubset(ev_pcts)

        if year_match and pct_match:
            supporters.append((chunk, overlap))
            continue

        year_conflict = bool(
            claim_years and ev_years and claim_years.isdisjoint(ev_years)
        )
        pct_conflict = bool(
            claim_pcts and ev_pcts and claim_pcts.isdisjoint(ev_pcts)
        )
        # Require >= 2 overlapping content words so unrelated chunks that
        # happen to share a single generic word (e.g., "released") don't
        # trigger a false-positive UNSUPPORTED on well-formed hallucinations.
        if (year_conflict or pct_conflict) and len(overlap) >= 2:
            detail = _conflict_detail(
                claim_years,
                ev_years,
                claim_pcts,
                ev_pcts,
                year_conflict,
                pct_conflict,
            )
            contradictors.append((chunk, overlap, detail))

    if supporters:
        best, overlap = max(supporters, key=lambda p: len(p[1]))
        score = round(min(1.0, len(overlap) / max(len(claim_tokens), 1)), 4)
        citation = f"{best.source}:{best.line_start}-{best.line_end}"
        preview = ", ".join(sorted(overlap))[:120]
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.SUPPORTED,
            citation=citation,
            score=score,
            reasoning=f"Anchors matched in {citation}: {preview}",
        )

    if contradictors:
        detail = max(contradictors, key=lambda p: len(p[1]))[2]
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNSUPPORTED,
            citation=None,
            score=0.85,
            reasoning=f"Evidence contradicts: {detail}",
        )

    if best_partial is not None:
        _, overlap = best_partial
        score = round(len(overlap) / max(len(claim_tokens), 1), 4)
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=score,
            reasoning="Partial anchor match only; insufficient for Tier-1 support.",
        )

    return VerifyResult(
        claim=claim,
        status=VerifyStatus.UNVERIFIABLE,
        citation=None,
        score=0.0,
        reasoning="No evidence chunk matches the claim's anchors.",
    )


# --- Internal helpers ---------------------------------------------------------


def _content_tokens(text: str) -> set[str]:
    """Tokenize + normalize: script-split, lowercase, strip KO particles, stopword filter."""
    tokens: set[str] = set()
    for match in _TOKEN_RE.finditer(text):
        raw = match.group(0).lower()
        if not raw:
            continue
        variants = {raw}
        stripped = _strip_ko_particle(raw)
        if stripped and stripped != raw:
            variants.add(stripped)
        for token in variants:
            if len(token) <= 1 and not token.isdigit():
                continue
            if token in _STOPWORDS:
                continue
            tokens.add(token)
    return tokens


def _strip_ko_particle(token: str) -> str | None:
    """Return token with a trailing Korean particle removed, or None if N/A.

    Only applies to tokens that are purely Hangul (+ optional digits). Mixed
    or non-Korean tokens are returned unchanged (None).
    """
    if not token:
        return None
    if not all("가" <= ch <= "힣" or ch.isdigit() for ch in token):
        return None
    for particle in _KO_PARTICLES:
        if len(token) > len(particle) + 1 and token.endswith(particle):
            return token[: -len(particle)]
    return None


def _conflict_detail(
    claim_years: set[str],
    ev_years: set[str],
    claim_pcts: set[str],
    ev_pcts: set[str],
    year_conflict: bool,
    pct_conflict: bool,
) -> str:
    parts: list[str] = []
    if year_conflict:
        parts.append(
            f"claim year {sorted(claim_years)} vs evidence year {sorted(ev_years)}"
        )
    if pct_conflict:
        parts.append(
            f"claim pct {sorted(claim_pcts)} vs evidence pct {sorted(ev_pcts)}"
        )
    return "; ".join(parts) if parts else "numeric mismatch"
