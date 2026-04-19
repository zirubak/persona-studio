"""Unit tests for persona_studio.ingest.youtube."""

from __future__ import annotations

import pytest

from persona_studio.ingest import youtube


class TestExtractVideoId:
    @pytest.mark.parametrize(
        "url,expected",
        [
            ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            (
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc&t=10",
                "dQw4w9WgXcQ",
            ),
        ],
    )
    def test_extracts_valid_ids(self, url: str, expected: str) -> None:
        assert youtube.extract_video_id(url) == expected

    @pytest.mark.parametrize(
        "url",
        [
            "https://vimeo.com/12345",
            "https://youtube.com/",
            "https://youtube.com/watch?v=tooShort",  # less than 11 chars
            "not a url",
            "",
        ],
    )
    def test_rejects_non_youtube_or_malformed(self, url: str) -> None:
        assert youtube.extract_video_id(url) is None


class TestYouTubeResultDataclass:
    def test_frozen(self) -> None:
        """YouTubeResult must be immutable (coding-style requirement)."""
        import dataclasses
        from pathlib import Path

        r = youtube.YouTubeResult(
            url="u", video_id="x", transcript_path=Path("/tmp/x"), source="caption"
        )
        with pytest.raises(dataclasses.FrozenInstanceError):
            r.source = "transcribed"  # type: ignore[misc]
