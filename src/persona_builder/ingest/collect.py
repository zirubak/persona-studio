"""Collect all source material under ``data/people/<name>/`` into a single corpus.

The corpus is a plain markdown file with a delimited, source-labeled section per
input. A manifest records checksums and per-file outcomes so that re-runs can
skip unchanged material.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Iterable

from persona_builder.ingest.audio import is_audio, transcribe
from persona_builder.ingest.documents import extract_text, is_document
from persona_builder.ingest.web import fetch_urls
from persona_builder.ingest.youtube import fetch_one as fetch_youtube_one


@dataclass
class ManifestEntry:
    source: str
    type: str
    sha256: str | None
    ok: bool
    error: str | None = None


@dataclass
class CollectResult:
    corpus_path: Path
    manifest_path: Path
    entries: list[ManifestEntry] = field(default_factory=list)

    @property
    def ok_count(self) -> int:
        return sum(1 for e in self.entries if e.ok)

    @property
    def fail_count(self) -> int:
        return sum(1 for e in self.entries if not e.ok)


def collect(person_dir: Path) -> CollectResult:
    """Walk ``person_dir`` and build ``extracted/corpus.md`` + ``manifest.json``.

    Expected layout::

        person_dir/
        ├── raw/                 # documents, audio, HTML, articles/, urls.txt, youtube_urls.txt
        └── extracted/           # written here
    """
    raw_dir = person_dir / "raw"
    extracted_dir = person_dir / "extracted"
    transcripts_dir = person_dir / "transcripts"
    audio_cache_dir = raw_dir / "audio_cache"
    if not raw_dir.exists():
        raise FileNotFoundError(f"raw directory missing: {raw_dir}")
    extracted_dir.mkdir(parents=True, exist_ok=True)

    corpus_path = extracted_dir / "corpus.md"
    manifest_path = extracted_dir / "manifest.json"

    entries: list[ManifestEntry] = []
    sections: list[str] = [
        f"# Corpus for {person_dir.name}",
        f"Generated: {date.today().isoformat()}",
        "",
    ]

    for section, entry in _process_documents(raw_dir):
        sections.append(section)
        entries.append(entry)

    for section, entry in _process_audio(raw_dir, transcripts_dir):
        sections.append(section)
        entries.append(entry)

    for section, entry in _process_urls(raw_dir, transcripts_dir):
        sections.append(section)
        entries.append(entry)

    for section, entry in _process_youtube(raw_dir, transcripts_dir, audio_cache_dir):
        sections.append(section)
        entries.append(entry)

    corpus_path.write_text("\n\n".join(sections).strip() + "\n", encoding="utf-8")
    manifest_path.write_text(
        json.dumps([e.__dict__ for e in entries], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return CollectResult(corpus_path=corpus_path, manifest_path=manifest_path, entries=entries)


META_FILENAMES = {"urls.txt", "youtube_urls.txt"}
SKIP_SUBDIRS = {"articles", "audio_cache"}


def _process_documents(raw_dir: Path) -> Iterable[tuple[str, ManifestEntry]]:
    for path in sorted(raw_dir.rglob("*")):
        if not path.is_file():
            continue
        rel_parts = path.relative_to(raw_dir).parts
        if any(part in SKIP_SUBDIRS for part in rel_parts[:-1]):
            continue
        if path.name in META_FILENAMES:
            continue
        if not is_document(path):
            continue
        sha = _sha256(path)
        try:
            text = extract_text(path)
            section = _format_section(path.relative_to(raw_dir).as_posix(), "document", text)
            yield section, ManifestEntry(
                source=path.relative_to(raw_dir).as_posix(), type="document", sha256=sha, ok=True
            )
        except Exception as exc:
            yield (
                _format_section(path.name, "document", f"[extraction failed: {exc}]"),
                ManifestEntry(
                    source=path.relative_to(raw_dir).as_posix(),
                    type="document",
                    sha256=sha,
                    ok=False,
                    error=str(exc),
                ),
            )


def _process_audio(raw_dir: Path, transcripts_dir: Path) -> Iterable[tuple[str, ManifestEntry]]:
    for path in sorted(raw_dir.rglob("*")):
        if not path.is_file() or not is_audio(path):
            continue
        rel_parts = path.relative_to(raw_dir).parts
        if any(part in SKIP_SUBDIRS for part in rel_parts[:-1]):
            continue
        sha = _sha256(path)
        try:
            text = transcribe(path, transcripts_dir)
            yield (
                _format_section(path.relative_to(raw_dir).as_posix(), "audio", text),
                ManifestEntry(
                    source=path.relative_to(raw_dir).as_posix(), type="audio", sha256=sha, ok=True
                ),
            )
        except Exception as exc:
            yield (
                _format_section(path.name, "audio", f"[transcription failed: {exc}]"),
                ManifestEntry(
                    source=path.relative_to(raw_dir).as_posix(),
                    type="audio",
                    sha256=sha,
                    ok=False,
                    error=str(exc),
                ),
            )


def _process_urls(raw_dir: Path, transcripts_dir: Path) -> Iterable[tuple[str, ManifestEntry]]:
    del transcripts_dir  # reserved for future URL transcripts
    articles_dir = raw_dir / "articles"
    urls_file = raw_dir / "urls.txt"
    results = fetch_urls(urls_file, articles_dir)
    for result in results:
        if result.ok and result.output_path is not None:
            try:
                text = extract_text(result.output_path)
                yield (
                    _format_section(result.url, "web", text),
                    ManifestEntry(source=result.url, type="web", sha256=None, ok=True),
                )
            except Exception as exc:
                yield (
                    _format_section(result.url, "web", f"[post-extract failed: {exc}]"),
                    ManifestEntry(
                        source=result.url, type="web", sha256=None, ok=False, error=str(exc)
                    ),
                )
        else:
            yield (
                _format_section(result.url, "web", f"[fetch failed: {result.error}]"),
                ManifestEntry(
                    source=result.url, type="web", sha256=None, ok=False, error=result.error
                ),
            )


def _process_youtube(
    raw_dir: Path, transcripts_dir: Path, audio_cache_dir: Path
) -> Iterable[tuple[str, ManifestEntry]]:
    urls_file = raw_dir / "youtube_urls.txt"
    if not urls_file.exists():
        return
    for raw_line in urls_file.read_text(encoding="utf-8").splitlines():
        url = raw_line.strip()
        if not url or url.startswith("#"):
            continue
        result = fetch_youtube_one(url, transcripts_dir, audio_cache_dir)
        if result.transcript_path and result.source != "failed":
            text = result.transcript_path.read_text(encoding="utf-8")
            yield (
                _format_section(url, f"youtube:{result.source}", text),
                ManifestEntry(source=url, type="youtube", sha256=None, ok=True),
            )
        else:
            yield (
                _format_section(url, "youtube", f"[{result.error or 'unknown error'}]"),
                ManifestEntry(
                    source=url, type="youtube", sha256=None, ok=False, error=result.error
                ),
            )


def _format_section(source: str, kind: str, body: str) -> str:
    header = f"## [source: {source}, type: {kind}, extracted: {date.today().isoformat()}]"
    body = body.strip() or "[empty]"
    return f"{header}\n\n{body}\n\n---"


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()
