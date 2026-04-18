"""Unit tests for persona_builder.ingest.collect filters and helpers."""

from __future__ import annotations

from pathlib import Path

import pytest

from persona_builder.ingest import collect


class TestSkipConstants:
    def test_meta_filenames_contains_required(self) -> None:
        assert "urls.txt" in collect.META_FILENAMES
        assert "youtube_urls.txt" in collect.META_FILENAMES

    def test_skip_subdirs_contains_required(self) -> None:
        assert "articles" in collect.SKIP_SUBDIRS
        assert "audio_cache" in collect.SKIP_SUBDIRS


class TestProcessDocumentsFilters:
    def test_skips_meta_filenames(self, tmp_path: Path) -> None:
        raw = tmp_path / "raw"
        raw.mkdir()
        (raw / "urls.txt").write_text("https://example.com\n", encoding="utf-8")
        (raw / "youtube_urls.txt").write_text("https://youtu.be/abc\n", encoding="utf-8")
        (raw / "content.md").write_text("real content", encoding="utf-8")

        entries = list(collect._process_documents(raw))
        sources = {entry.source for _, entry in entries}
        assert sources == {"content.md"}

    def test_skips_articles_subdir(self, tmp_path: Path) -> None:
        raw = tmp_path / "raw"
        (raw / "articles").mkdir(parents=True)
        (raw / "articles" / "fetched.md").write_text("web content", encoding="utf-8")
        (raw / "manual.md").write_text("user content", encoding="utf-8")

        entries = list(collect._process_documents(raw))
        sources = {entry.source for _, entry in entries}
        assert sources == {"manual.md"}

    def test_skips_audio_cache_subdir(self, tmp_path: Path) -> None:
        raw = tmp_path / "raw"
        (raw / "audio_cache").mkdir(parents=True)
        (raw / "audio_cache" / "video.mp3").write_bytes(b"fake audio")
        (raw / "doc.txt").write_text("hi", encoding="utf-8")

        entries = list(collect._process_documents(raw))
        sources = {entry.source for _, entry in entries}
        assert sources == {"doc.txt"}


class TestFormatSection:
    def test_includes_source_type_and_body(self) -> None:
        out = collect._format_section("file.md", "document", "hello")
        assert "source: file.md" in out
        assert "type: document" in out
        assert "hello" in out
        assert out.endswith("---")

    def test_empty_body_marker(self) -> None:
        out = collect._format_section("x", "document", "")
        assert "[empty]" in out


class TestSha256Helper:
    def test_deterministic(self, tmp_path: Path) -> None:
        f = tmp_path / "a.txt"
        f.write_text("abc", encoding="utf-8")
        assert collect._sha256(f) == collect._sha256(f)

    def test_different_content_different_hash(self, tmp_path: Path) -> None:
        a = tmp_path / "a.txt"
        b = tmp_path / "b.txt"
        a.write_text("abc", encoding="utf-8")
        b.write_text("xyz", encoding="utf-8")
        assert collect._sha256(a) != collect._sha256(b)


class TestManifestEntryImmutability:
    def test_frozen(self) -> None:
        """MEDIUM-4 fix regression: ManifestEntry must be frozen."""
        import dataclasses

        entry = collect.ManifestEntry(
            source="x", type="document", sha256="abc", ok=True
        )
        with pytest.raises(dataclasses.FrozenInstanceError):
            entry.ok = False  # type: ignore[misc]
