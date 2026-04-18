"""Integration test: full collect() on a temp person_dir with md/txt only."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from persona_builder.ingest import collect


@pytest.fixture
def person_dir(tmp_path: Path) -> Path:
    raw = tmp_path / "raw"
    raw.mkdir()
    (raw / "interview.md").write_text("# Interview\n\nquote one", encoding="utf-8")
    (raw / "notes.txt").write_text("plain note", encoding="utf-8")
    # Meta files and skip dirs — should be excluded
    (raw / "urls.txt").write_text("# no urls\n", encoding="utf-8")
    (raw / "articles").mkdir()
    (raw / "articles" / "ignored.md").write_text("should not appear", encoding="utf-8")
    return tmp_path


class TestCollectEndToEnd:
    def test_builds_corpus_and_manifest(self, person_dir: Path) -> None:
        result = collect.collect(person_dir)

        assert result.corpus_path.exists()
        assert result.manifest_path.exists()
        assert result.ok_count == 2  # interview.md + notes.txt
        assert result.fail_count == 0

    def test_corpus_contains_all_accepted_sources(self, person_dir: Path) -> None:
        result = collect.collect(person_dir)
        corpus = result.corpus_path.read_text(encoding="utf-8")

        assert "interview.md" in corpus
        assert "notes.txt" in corpus
        assert "quote one" in corpus
        assert "plain note" in corpus
        # Meta and skipped
        assert "ignored.md" not in corpus
        assert "should not appear" not in corpus

    def test_corpus_has_section_delimiters(self, person_dir: Path) -> None:
        result = collect.collect(person_dir)
        corpus = result.corpus_path.read_text(encoding="utf-8")
        # Two sources → two "## [source:" headers and two "---" delimiters
        assert corpus.count("## [source:") == 2
        assert corpus.count("\n---") >= 2

    def test_manifest_is_valid_json_with_sha256(self, person_dir: Path) -> None:
        result = collect.collect(person_dir)
        data = json.loads(result.manifest_path.read_text(encoding="utf-8"))
        assert isinstance(data, list)
        assert len(data) == 2
        for entry in data:
            assert entry["ok"] is True
            assert entry["type"] == "document"
            assert len(entry["sha256"]) == 64  # sha256 hex

    def test_rerun_is_deterministic(self, person_dir: Path) -> None:
        """Re-running produces the same manifest (minus date in corpus header)."""
        r1 = collect.collect(person_dir)
        m1 = r1.manifest_path.read_text(encoding="utf-8")
        r2 = collect.collect(person_dir)
        m2 = r2.manifest_path.read_text(encoding="utf-8")
        assert m1 == m2

    def test_missing_raw_dir_raises(self, tmp_path: Path) -> None:
        empty = tmp_path / "empty"
        empty.mkdir()
        with pytest.raises(FileNotFoundError, match="raw directory missing"):
            collect.collect(empty)


class TestCollectResultImmutability:
    def test_entries_is_tuple(self, person_dir: Path) -> None:
        result = collect.collect(person_dir)
        assert isinstance(result.entries, tuple)

    def test_result_is_frozen(self, person_dir: Path) -> None:
        import dataclasses

        result = collect.collect(person_dir)
        with pytest.raises(dataclasses.FrozenInstanceError):
            result.corpus_path = Path("/tmp/other")  # type: ignore[misc]
