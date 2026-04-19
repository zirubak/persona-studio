"""Command-line entry point for the ETL pipeline.

Kept deliberately small: every LLM-driven step lives in Claude Code.
"""

from __future__ import annotations

import re
from pathlib import Path

import typer

from persona_studio.ingest.collect import collect
from persona_studio.ingest.youtube import fetch_one as fetch_youtube_one

app = typer.Typer(help="Persona Builder ETL.")

DATA_ROOT = Path("data") / "people"

# Prevents path traversal and filesystem-hostile names. Slashes, dots, etc. are
# rejected before any path join happens.
_SAFE_NAME_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}")


def _person_dir(name: str) -> Path:
    if not _SAFE_NAME_RE.fullmatch(name):
        raise typer.BadParameter(
            f"name must match [A-Za-z0-9][A-Za-z0-9_-]{{0,63}}, got: {name!r}"
        )
    resolved = (DATA_ROOT / name).resolve()
    root_resolved = DATA_ROOT.resolve()
    if not str(resolved).startswith(str(root_resolved) + "/") and resolved != root_resolved:
        raise typer.BadParameter("name escapes data root")
    return DATA_ROOT / name


@app.command()
def extract(name: str) -> None:
    """Build extracted/corpus.md + manifest.json for data/people/<name>/."""
    person_dir = _person_dir(name)
    if not person_dir.exists():
        raise typer.BadParameter(f"person directory not found: {person_dir}")
    result = collect(person_dir)
    typer.echo(f"corpus written: {result.corpus_path}")
    typer.echo(f"manifest written: {result.manifest_path}")
    typer.echo(f"ok={result.ok_count} fail={result.fail_count}")


@app.command("fetch-youtube")
def fetch_youtube(name: str, url: str) -> None:
    """Fetch a single YouTube transcript into data/people/<name>/transcripts/."""
    person_dir = _person_dir(name)
    raw_dir = person_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    transcripts_dir = person_dir / "transcripts"
    audio_cache_dir = raw_dir / "audio_cache"
    result = fetch_youtube_one(url, transcripts_dir, audio_cache_dir)
    if result.transcript_path:
        typer.echo(f"saved ({result.source}): {result.transcript_path}")
    else:
        typer.echo(f"failed ({result.error}): {url}")
    # also record the URL for future corpus rebuilds
    urls_file = raw_dir / "youtube_urls.txt"
    existing = urls_file.read_text(encoding="utf-8").splitlines() if urls_file.exists() else []
    if url not in existing:
        existing.append(url)
        urls_file.write_text("\n".join(existing) + "\n", encoding="utf-8")


@app.command()
def setup() -> None:
    """Pre-download the default whisper model so first run is fast."""
    typer.echo("Loading faster-whisper base model (int8)...")
    from persona_studio.ingest.audio import _load_model

    _load_model()
    typer.echo("Model ready. Cached under ~/.cache/huggingface/ or platform equivalent.")


@app.command("list")
def list_people() -> None:
    """List known people under data/people/."""
    if not DATA_ROOT.exists():
        typer.echo("(no people yet)")
        return
    for child in sorted(DATA_ROOT.iterdir()):
        if not child.is_dir():
            continue
        mode_file = child / "mode"
        mode = mode_file.read_text(encoding="utf-8").strip() if mode_file.exists() else "?"
        typer.echo(f"- {child.name} [{mode}]")


if __name__ == "__main__":
    app()
