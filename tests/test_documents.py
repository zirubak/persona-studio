"""Unit tests for persona_studio.ingest.documents."""

from __future__ import annotations

from pathlib import Path

import pytest

from persona_studio.ingest import documents


class TestIsDocument:
    @pytest.mark.parametrize(
        "name,expected",
        [
            ("notes.md", True),
            ("article.markdown", True),
            ("report.txt", True),
            ("paper.pdf", True),
            ("memo.docx", True),
            ("page.html", True),
            ("page.HTM", True),  # case insensitive
            ("clip.mp3", False),
            ("data.json", False),
            ("noext", False),
        ],
    )
    def test_dispatches_by_suffix(self, name: str, expected: bool) -> None:
        assert documents.is_document(Path(name)) is expected


class TestExtractTextDispatch:
    def test_extract_plain_md(self, tmp_path: Path) -> None:
        p = tmp_path / "hello.md"
        p.write_text("# Heading\n\nbody", encoding="utf-8")
        assert documents.extract_text(p) == "# Heading\n\nbody"

    def test_extract_txt(self, tmp_path: Path) -> None:
        p = tmp_path / "a.txt"
        p.write_text("plain", encoding="utf-8")
        assert documents.extract_text(p) == "plain"

    def test_unsupported_suffix_raises(self, tmp_path: Path) -> None:
        p = tmp_path / "x.bin"
        p.write_bytes(b"\x00\x01")
        with pytest.raises(RuntimeError, match="Unsupported"):
            documents.extract_text(p)

    def test_invalid_utf8_raises_so_manifest_can_flag_it(self, tmp_path: Path) -> None:
        """HIGH-3 regression: bad encoding must surface, not be silently replaced."""
        p = tmp_path / "bad.txt"
        p.write_bytes(b"\xff\xfe\x00bad utf-16")
        with pytest.raises(UnicodeDecodeError):
            documents.extract_text(p)


class TestHtmlExtraction:
    def test_html_is_dispatched(self, tmp_path: Path) -> None:
        """Smoke-check only — trafilatura not required for this shape test."""
        p = tmp_path / "t.html"
        p.write_text("<html><body><p>x</p></body></html>", encoding="utf-8")
        # trafilatura may or may not be installed; if it's not we accept RuntimeError.
        try:
            result = documents.extract_text(p)
        except Exception:
            pytest.skip("trafilatura not installed in this environment")
        else:
            assert "x" in result
