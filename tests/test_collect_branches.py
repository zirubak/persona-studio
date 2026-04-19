"""Coverage completion: _process_urls, _process_youtube, failure paths."""

from __future__ import annotations

import sys
import types
from pathlib import Path

import pytest

from persona_studio.ingest import collect


class _FakeTrafilatura:
    """Deterministic stand-in — no network, controllable outcomes."""

    def __init__(self, outcome: str = "ok") -> None:
        self.outcome = outcome

    def fetch_url(self, url: str) -> str | None:
        if self.outcome == "download_fail":
            return None
        return f"<html><body>{url}</body></html>"

    def extract(self, raw: str, **_kwargs) -> str | None:
        if self.outcome == "extract_empty":
            return None
        return raw.replace("<html><body>", "").replace("</body></html>", "")


def _install_fake_trafilatura(
    monkeypatch: pytest.MonkeyPatch, outcome: str = "ok"
) -> None:
    mod = types.ModuleType("trafilatura")
    fake = _FakeTrafilatura(outcome)
    mod.fetch_url = fake.fetch_url  # type: ignore[attr-defined]
    mod.extract = fake.extract  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "trafilatura", mod)


class TestCollectWithUrls:
    def test_successful_url_fetch_merges_into_corpus(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _install_fake_trafilatura(monkeypatch)
        raw = tmp_path / "raw"
        raw.mkdir()
        (raw / "urls.txt").write_text("https://example.com/a\n", encoding="utf-8")
        (raw / "seed.md").write_text("seed", encoding="utf-8")

        result = collect.collect(tmp_path)

        corpus = result.corpus_path.read_text(encoding="utf-8")
        assert "https://example.com/a" in corpus
        assert "seed" in corpus
        ok_types = {e.type for e in result.entries if e.ok}
        assert "web" in ok_types

    def test_url_fetch_failure_recorded_as_fail(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _install_fake_trafilatura(monkeypatch, outcome="download_fail")
        raw = tmp_path / "raw"
        raw.mkdir()
        (raw / "urls.txt").write_text("https://example.com/x\n", encoding="utf-8")

        result = collect.collect(tmp_path)
        web_entries = [e for e in result.entries if e.type == "web"]
        assert len(web_entries) == 1
        assert web_entries[0].ok is False
        assert web_entries[0].error == "download_failed"

    def test_unsafe_scheme_is_recorded_as_fail_without_fetch(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        # If trafilatura is accidentally called for file:// URL, the fake will
        # still "succeed"; we assert the entry is rejected before that.
        _install_fake_trafilatura(monkeypatch)
        raw = tmp_path / "raw"
        raw.mkdir()
        (raw / "urls.txt").write_text("file:///etc/passwd\n", encoding="utf-8")

        result = collect.collect(tmp_path)
        web_entries = [e for e in result.entries if e.type == "web"]
        assert len(web_entries) == 1
        assert web_entries[0].ok is False
        assert web_entries[0].error == "unsafe_scheme"


class TestCollectWithYouTube:
    def test_missing_youtube_urls_file_is_noop(self, tmp_path: Path) -> None:
        raw = tmp_path / "raw"
        raw.mkdir()
        (raw / "note.md").write_text("content", encoding="utf-8")
        result = collect.collect(tmp_path)
        yt_entries = [e for e in result.entries if e.type == "youtube"]
        assert yt_entries == []

    def test_youtube_urls_with_bad_url_records_failure(
        self, tmp_path: Path
    ) -> None:
        raw = tmp_path / "raw"
        raw.mkdir()
        # Not a valid youtube URL → extract_video_id returns None → "failed"
        (raw / "youtube_urls.txt").write_text("https://vimeo.com/1234\n", encoding="utf-8")

        result = collect.collect(tmp_path)
        yt_entries = [e for e in result.entries if e.type == "youtube"]
        assert len(yt_entries) == 1
        assert yt_entries[0].ok is False


class TestDocumentsErrorPath:
    def test_document_extraction_error_recorded_in_manifest(
        self, tmp_path: Path
    ) -> None:
        raw = tmp_path / "raw"
        raw.mkdir()
        # Write UTF-16 — now strict, will raise.
        (raw / "bad.md").write_bytes(b"\xff\xfe\x00bad utf-16")
        (raw / "good.md").write_text("ok", encoding="utf-8")

        result = collect.collect(tmp_path)
        doc_entries = [e for e in result.entries if e.type == "document"]
        oks = [e for e in doc_entries if e.ok]
        fails = [e for e in doc_entries if not e.ok]
        assert {e.source for e in oks} == {"good.md"}
        assert {e.source for e in fails} == {"bad.md"}
        assert fails[0].error is not None
