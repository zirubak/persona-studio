"""Unit tests for persona_builder.ingest.web."""

from __future__ import annotations

from pathlib import Path

import pytest

from persona_builder.ingest import web


class TestIsSafeHttpUrl:
    @pytest.mark.parametrize(
        "url",
        [
            "https://example.com",
            "http://example.com/path?q=1",
            "https://sub.example.co.kr/",
        ],
    )
    def test_valid_http_urls(self, url: str) -> None:
        assert web.is_safe_http_url(url) is True

    @pytest.mark.parametrize(
        "url",
        [
            "file:///etc/passwd",
            "ftp://example.com/file",
            "gopher://example.com/",
            "javascript:alert(1)",
            "http://",  # no host
            "https://",
            "not-a-url",
            "",
        ],
    )
    def test_unsafe_or_malformed_urls_rejected(self, url: str) -> None:
        """CRITICAL-2 regression: only http/https with a host are accepted."""
        assert web.is_safe_http_url(url) is False


class TestSlugFor:
    def test_stable_and_deterministic(self) -> None:
        s1 = web._slug_for("https://example.com/a/b")
        s2 = web._slug_for("https://example.com/a/b")
        assert s1 == s2

    def test_removes_scheme_and_sanitizes(self) -> None:
        s = web._slug_for("https://example.com/path?q=1")
        assert s.startswith("example-com")
        # 8-char hash suffix guarantees uniqueness
        assert len(s.split("-")[-1]) == 8

    def test_different_urls_get_different_slugs(self) -> None:
        a = web._slug_for("https://example.com/a")
        b = web._slug_for("https://example.com/b")
        assert a != b


class TestFetchUrlsCommentAndEmptyHandling:
    def test_empty_urls_file_returns_empty(self, tmp_path: Path) -> None:
        urls = tmp_path / "urls.txt"
        urls.write_text("", encoding="utf-8")
        assert web.fetch_urls(urls, tmp_path / "articles") == []

    def test_comment_only_file_returns_empty_without_importing_trafilatura(
        self, tmp_path: Path
    ) -> None:
        """Regression: previous bug tried to import trafilatura even when only comments present."""
        urls = tmp_path / "urls.txt"
        urls.write_text("# just a comment\n# another\n", encoding="utf-8")
        assert web.fetch_urls(urls, tmp_path / "articles") == []

    def test_missing_file_returns_empty(self, tmp_path: Path) -> None:
        assert web.fetch_urls(tmp_path / "nope.txt", tmp_path / "articles") == []

    def test_unsafe_scheme_is_rejected_without_network(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Verify CRITICAL-2 fix blocks the request before trafilatura is invoked."""
        urls = tmp_path / "urls.txt"
        urls.write_text("file:///etc/passwd\nftp://x.example/\n", encoding="utf-8")

        # Sentinel: if trafilatura is imported and called, fail loudly.
        called = {"count": 0}

        def _should_not_be_called(*_a, **_kw):
            called["count"] += 1
            raise AssertionError("network fetch should not happen for unsafe URLs")

        import sys
        fake = type(sys)("trafilatura")
        fake.fetch_url = _should_not_be_called  # type: ignore[attr-defined]
        fake.extract = _should_not_be_called  # type: ignore[attr-defined]
        monkeypatch.setitem(sys.modules, "trafilatura", fake)

        results = web.fetch_urls(urls, tmp_path / "articles")
        assert len(results) == 2
        assert all(not r.ok for r in results)
        assert all(r.error == "unsafe_scheme" for r in results)
        assert called["count"] == 0
