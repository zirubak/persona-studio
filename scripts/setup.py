"""Idempotent first-run bootstrap for the persona-studio.

Runs under the *system* Python (not a venv). Creates a project-local `.venv/`,
installs the package in editable mode with dev extras, and pre-downloads the
whisper model so that audio ingest is fast on the very first run.

Used by `/persona-studio:studio` and `/persona-studio:persona-setup` slash commands. Also safe to run
standalone:

    python3 scripts/setup.py

Design notes:
- Pure functions (`python_version_ok`, `ffmpeg_install_hint`, `venv_exists`,
  `venv_python`, `package_importable_in_venv`, `setup_plan`) are unit-tested
  against this file via tests/test_setup.py. Orchestration (`main`) is exercised
  by running the script itself.
- Stdlib only — zero third-party imports at module load time.
- Cross-platform for macOS and Linux. Windows is not tested but `venv_python`
  returns the expected `Scripts\\python.exe` shape.
"""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Callable, Iterable, NamedTuple

MIN_PY = (3, 10)


# --- pure helpers ---------------------------------------------------------


def python_version_ok(version_info) -> bool:
    """True if the interpreter is >= MIN_PY."""
    return (version_info.major, version_info.minor) >= MIN_PY


def ffmpeg_install_hint(platform_name: str) -> str:
    """Return a user-facing one-liner telling them how to install ffmpeg."""
    p = platform_name.lower()
    if p == "darwin":
        return "brew install ffmpeg"
    if p.startswith("linux"):
        return (
            "sudo apt install ffmpeg   # Debian/Ubuntu\n"
            "sudo dnf install ffmpeg   # Fedora\n"
            "sudo pacman -S ffmpeg     # Arch"
        )
    return "Install ffmpeg from https://ffmpeg.org/download.html"


def venv_exists(venv_path: Path) -> bool:
    """A venv is considered present iff its python launcher exists."""
    return venv_python(venv_path).exists()


def venv_python(venv_path: Path) -> Path:
    """Absolute path to the interpreter inside a venv."""
    if os.name == "nt":  # pragma: no cover - not tested on CI
        return venv_path / "Scripts" / "python.exe"
    return venv_path / "bin" / "python"


def package_importable_in_venv(python_exe: str | Path, package: str) -> bool:
    """Return True if `python_exe -c 'import package'` succeeds."""
    try:
        result = subprocess.run(
            [str(python_exe), "-c", f"import {package}"],
            capture_output=True,
            timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired):
        return False
    return result.returncode == 0


# --- plan data ------------------------------------------------------------


class Step(NamedTuple):
    name: str
    description: str
    action: Callable[[], int]


def setup_plan(
    repo_root: Path,
    venv_path: Path,
    has_ffmpeg: bool,
    package_present: bool = False,
) -> list[Step]:
    """Compose the ordered steps required for a fresh setup.

    Only the structure and ordering are under test. The actual `action`
    callables are trivially thin wrappers over subprocess calls.
    """
    py = venv_python(venv_path)

    steps: list[Step] = []
    steps.append(Step(
        name="create_venv",
        description=f"Create virtual environment at {venv_path}",
        action=lambda: _run([sys.executable, "-m", "venv", str(venv_path)]),
    ))
    steps.append(Step(
        name="upgrade_pip",
        description="Upgrade pip inside the venv",
        action=lambda: _run([str(py), "-m", "pip", "install", "--quiet", "--upgrade", "pip"]),
    ))
    steps.append(Step(
        name="pip_install",
        description="Install persona-studio and dev extras",
        action=lambda: _run(
            [str(py), "-m", "pip", "install", "--quiet", "-e", ".[dev]"],
            cwd=repo_root,
        ),
    ))
    if not has_ffmpeg:
        steps.append(Step(
            name="warn_missing_ffmpeg",
            description="ffmpeg not detected (required for audio/YouTube)",
            action=lambda: _warn_ffmpeg(),
        ))
    steps.append(Step(
        name="download_whisper_model",
        description="Pre-download faster-whisper base model",
        action=lambda: _run(
            [str(py), "-m", "persona_studio.cli", "setup"],
            cwd=repo_root,
        ),
    ))
    del package_present  # reserved for future skip-if-already-installed optimisation
    return steps


# --- orchestration helpers ------------------------------------------------


def _run(cmd: list[str], cwd: Path | None = None) -> int:
    """Run a subprocess, streaming output, and return exit code."""
    print(f"  $ {' '.join(cmd)}", flush=True)
    completed = subprocess.run(cmd, cwd=str(cwd) if cwd else None)
    return completed.returncode


def _warn_ffmpeg() -> int:
    print(
        "  [WARN] ffmpeg not found on PATH. Audio and YouTube features will fail.",
        flush=True,
    )
    print(f"  [HINT] Install with: {ffmpeg_install_hint(platform.system())}", flush=True)
    return 0  # non-fatal


def _run_steps(steps: Iterable[Step]) -> int:
    for step in steps:
        print(f"\n==> {step.description}", flush=True)
        code = step.action()
        if code != 0:
            print(f"[FAIL] step '{step.name}' exited with code {code}", flush=True)
            return code
    return 0


# --- main -----------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Bootstrap persona-studio.")
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Project root (default: repo containing this script).",
    )
    parser.add_argument(
        "--venv",
        type=Path,
        default=None,
        help="Path to venv (default: <repo-root>/.venv).",
    )
    args = parser.parse_args(argv)

    repo_root: Path = args.repo_root.resolve()
    venv_path: Path = (args.venv or (repo_root / ".venv")).resolve()

    print(f"persona-studio bootstrap — repo_root={repo_root}")

    if not python_version_ok(sys.version_info):
        print(
            f"[ERROR] Python {MIN_PY[0]}.{MIN_PY[1]}+ required, got "
            f"{sys.version_info.major}.{sys.version_info.minor}."
        )
        return 2

    # Skip venv creation if it already exists and is usable.
    if venv_exists(venv_path):
        print(f"[OK] venv already present at {venv_path}")

    has_ffmpeg = shutil.which("ffmpeg") is not None
    steps = setup_plan(repo_root=repo_root, venv_path=venv_path, has_ffmpeg=has_ffmpeg)

    # Drop create_venv if venv already present (idempotency).
    if venv_exists(venv_path):
        steps = [s for s in steps if s.name != "create_venv"]

    # Skip whisper download if the model is already cached to avoid network each run.
    if _whisper_model_cached():
        steps = [s for s in steps if s.name != "download_whisper_model"]
        print("[OK] whisper base model already cached")

    code = _run_steps(steps)
    if code == 0:
        print("\n[SUCCESS] persona-studio is ready. Run /persona-studio:studio to start.")
    return code


def _whisper_model_cached() -> bool:
    """Heuristic: faster-whisper caches models under ~/.cache/huggingface/hub/."""
    candidate = Path.home() / ".cache" / "huggingface" / "hub"
    if not candidate.exists():
        return False
    return any("faster-whisper" in p.name or "Systran" in p.name for p in candidate.iterdir())


if __name__ == "__main__":
    sys.exit(main())
