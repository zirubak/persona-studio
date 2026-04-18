"""Smoke test: invoke the installed CLI as a subprocess on sample_private."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def test_cli_extract_sample_private() -> None:
    """Full end-to-end smoke: runs the real Python CLI on real sample data."""
    sample_dir = REPO_ROOT / "data" / "people" / "sample_private"
    if not sample_dir.exists():
        import pytest

        pytest.skip("sample_private not present in this checkout")

    env = {"PYTHONPATH": str(REPO_ROOT / "src")}
    result = subprocess.run(
        [sys.executable, "-m", "persona_builder.cli", "extract", "sample_private"],
        cwd=REPO_ROOT,
        env={**__import__("os").environ, **env},
        capture_output=True,
        text=True,
        timeout=60,
    )

    assert result.returncode == 0, result.stderr
    assert "ok=" in result.stdout
    assert "fail=0" in result.stdout

    manifest = json.loads(
        (sample_dir / "extracted" / "manifest.json").read_text(encoding="utf-8")
    )
    assert all(entry["ok"] for entry in manifest)
    assert len(manifest) >= 3  # interview.md + blog_post.md + slack_messages.txt
