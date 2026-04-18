"""Cover fetch-youtube CLI and its side effects on youtube_urls.txt."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from typer.testing import CliRunner

from persona_builder import cli
from persona_builder.ingest import youtube as yt_mod


runner = CliRunner()


class TestFetchYoutubeCommand:
    def test_records_url_on_success(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)

        fake_path = tmp_path / "fake_transcript.txt"
        fake_path.write_text("transcript body", encoding="utf-8")

        def fake_fetch_one(url: str, transcripts_dir: Path, audio_cache_dir: Path) -> Any:
            transcripts_dir.mkdir(parents=True, exist_ok=True)
            return yt_mod.YouTubeResult(
                url=url,
                video_id="abcdefghijk",
                transcript_path=fake_path,
                source="caption",
            )

        monkeypatch.setattr(cli, "fetch_youtube_one", fake_fetch_one)

        result = runner.invoke(cli.app, ["fetch-youtube", "jane", "https://youtu.be/abcdefghijk"])
        assert result.exit_code == 0, result.output
        assert "saved" in result.output

        urls_file = tmp_path / "data" / "people" / "jane" / "raw" / "youtube_urls.txt"
        assert urls_file.exists()
        assert "https://youtu.be/abcdefghijk" in urls_file.read_text(encoding="utf-8")

    def test_records_failure_and_no_url_append(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)

        def fake_fetch_one(url: str, transcripts_dir: Path, audio_cache_dir: Path) -> Any:
            return yt_mod.YouTubeResult(
                url=url,
                video_id=None,
                transcript_path=None,
                source="failed",
                error="bad_url",
            )

        monkeypatch.setattr(cli, "fetch_youtube_one", fake_fetch_one)
        result = runner.invoke(cli.app, ["fetch-youtube", "jane", "not-a-url"])
        assert "failed" in result.output

    def test_does_not_duplicate_existing_url(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        raw = tmp_path / "data" / "people" / "jane" / "raw"
        raw.mkdir(parents=True)
        existing = raw / "youtube_urls.txt"
        existing.write_text("https://youtu.be/abcdefghijk\n", encoding="utf-8")

        monkeypatch.setattr(
            cli,
            "fetch_youtube_one",
            lambda url, td, ad: yt_mod.YouTubeResult(
                url=url, video_id="abcdefghijk", transcript_path=None, source="failed"
            ),
        )
        runner.invoke(cli.app, ["fetch-youtube", "jane", "https://youtu.be/abcdefghijk"])
        lines = [l for l in existing.read_text(encoding="utf-8").splitlines() if l.strip()]
        assert lines.count("https://youtu.be/abcdefghijk") == 1


class TestListCommand:
    def test_list_with_person(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.chdir(tmp_path)
        person = tmp_path / "data" / "people" / "jane"
        person.mkdir(parents=True)
        (person / "mode").write_text("private", encoding="utf-8")

        result = runner.invoke(cli.app, ["list"])
        assert result.exit_code == 0
        assert "jane" in result.output
        assert "private" in result.output
