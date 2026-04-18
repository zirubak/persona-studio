"""Fetch YouTube transcripts (captions first, audio transcription as fallback)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from persona_builder.ingest.audio import transcribe as transcribe_audio

VIDEO_ID_RE = re.compile(
    r"(?:youtu\.be/|v=|embed/|shorts/)([A-Za-z0-9_-]{11})"
)


@dataclass(frozen=True)
class YouTubeResult:
    url: str
    video_id: str | None
    transcript_path: Path | None
    source: str  # "caption" | "transcribed" | "failed"
    error: str | None = None


def extract_video_id(url: str) -> str | None:
    match = VIDEO_ID_RE.search(url)
    return match.group(1) if match else None


def fetch_one(
    url: str,
    transcripts_dir: Path,
    audio_cache_dir: Path,
) -> YouTubeResult:
    video_id = extract_video_id(url)
    if not video_id:
        return YouTubeResult(url=url, video_id=None, transcript_path=None, source="failed", error="bad_url")

    transcripts_dir.mkdir(parents=True, exist_ok=True)
    cache_file = transcripts_dir / f"youtube_{video_id}.txt"
    if cache_file.exists() and cache_file.stat().st_size > 0:
        return YouTubeResult(url=url, video_id=video_id, transcript_path=cache_file, source="caption")

    caption_text = _try_captions(video_id)
    if caption_text:
        cache_file.write_text(caption_text, encoding="utf-8")
        return YouTubeResult(url=url, video_id=video_id, transcript_path=cache_file, source="caption")

    audio_path = _download_audio(url, audio_cache_dir, video_id)
    if not audio_path:
        return YouTubeResult(
            url=url, video_id=video_id, transcript_path=None, source="failed", error="no_captions_no_audio"
        )
    text = transcribe_audio(audio_path, transcripts_dir)
    cache_file.write_text(text, encoding="utf-8")
    return YouTubeResult(url=url, video_id=video_id, transcript_path=cache_file, source="transcribed")


def _try_captions(video_id: str) -> str | None:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        segments = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
        return "\n".join(s["text"].strip() for s in segments if s.get("text"))
    except Exception:
        return None


def _download_audio(url: str, audio_cache_dir: Path, video_id: str) -> Path | None:
    audio_cache_dir.mkdir(parents=True, exist_ok=True)
    output_template = str(audio_cache_dir / f"{video_id}.%(ext)s")
    try:
        from yt_dlp import YoutubeDL

        ydl_opts: dict = {
            "format": "bestaudio/best",
            "outtmpl": output_template,
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [
                {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "128"}
            ],
        }
        with YoutubeDL(ydl_opts) as ydl:  # type: ignore[arg-type]
            ydl.download([url])
    except Exception:
        return None
    candidate = audio_cache_dir / f"{video_id}.mp3"
    return candidate if candidate.exists() else None
