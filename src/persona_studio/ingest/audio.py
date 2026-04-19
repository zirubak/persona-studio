"""Transcribe audio files with faster-whisper.

Model is lazily loaded and cached per process. Transcripts are persisted so that
re-running the pipeline does not re-transcribe unchanged inputs.
"""

from __future__ import annotations

import hashlib
from functools import lru_cache
from pathlib import Path
from typing import Any

AUDIO_SUFFIXES: frozenset[str] = frozenset({".mp3", ".wav", ".m4a", ".flac", ".ogg", ".mp4"})

DEFAULT_MODEL_SIZE = "base"
DEFAULT_COMPUTE_TYPE = "int8"


def is_audio(path: Path) -> bool:
    return path.suffix.lower() in AUDIO_SUFFIXES


@lru_cache(maxsize=1)
def _load_model(model_size: str = DEFAULT_MODEL_SIZE, compute_type: str = DEFAULT_COMPUTE_TYPE) -> Any:
    from faster_whisper import WhisperModel

    return WhisperModel(model_size, compute_type=compute_type)


def transcribe(
    path: Path,
    cache_dir: Path,
    model_size: str = DEFAULT_MODEL_SIZE,
    compute_type: str = DEFAULT_COMPUTE_TYPE,
) -> str:
    """Transcribe ``path`` and cache the result under ``cache_dir``.

    If a transcript already exists for the same stem, it is reused unless the
    source audio is newer.
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    # Hash the full resolved path so that two audio files with the same stem
    # but different parent directories do not overwrite each other's transcript.
    path_key = hashlib.sha1(str(path.resolve()).encode("utf-8")).hexdigest()[:12]
    cache_file = cache_dir / f"{path.stem}-{path_key}.txt"
    if cache_file.exists() and cache_file.stat().st_mtime >= path.stat().st_mtime:
        return cache_file.read_text(encoding="utf-8")

    model = _load_model(model_size, compute_type)
    segments, _ = model.transcribe(str(path), beam_size=5)
    text = "\n".join(segment.text.strip() for segment in segments if segment.text.strip())
    cache_file.write_text(text, encoding="utf-8")
    return text
