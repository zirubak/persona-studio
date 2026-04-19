"""Unit tests for scripts/setup.py pure helpers.

The orchestration (`main`) is not unit-tested — it invokes pip/venv against a
real interpreter. We cover the decision logic that determines *what* to run.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
SETUP_PATH = REPO_ROOT / "scripts" / "setup.py"


@pytest.fixture(scope="module")
def setup_module():
    """Load scripts/setup.py as a module without requiring it to be on sys.path."""
    spec = importlib.util.spec_from_file_location("persona_setup", SETUP_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestPythonVersionCheck:
    def test_accepts_current_interpreter(self, setup_module) -> None:
        """Test env must be >=3.10 itself."""
        assert setup_module.python_version_ok(sys.version_info) is True

    def test_rejects_old(self, setup_module) -> None:
        from collections import namedtuple
        V = namedtuple("V", "major minor micro releaselevel serial")
        assert setup_module.python_version_ok(V(3, 9, 0, "final", 0)) is False

    @pytest.mark.parametrize(
        "major,minor,expected",
        [
            (3, 10, True),
            (3, 11, True),
            (3, 12, True),
            (3, 13, True),
            (3, 9, False),
            (2, 7, False),
            (4, 0, True),  # future-proof
        ],
    )
    def test_boundary_versions(
        self, setup_module, major: int, minor: int, expected: bool
    ) -> None:
        from collections import namedtuple
        V = namedtuple("V", "major minor micro releaselevel serial")
        assert setup_module.python_version_ok(V(major, minor, 0, "final", 0)) is expected


class TestFfmpegInstallHint:
    def test_darwin_suggests_brew(self, setup_module) -> None:
        assert "brew install ffmpeg" in setup_module.ffmpeg_install_hint("darwin")

    def test_linux_suggests_apt(self, setup_module) -> None:
        hint = setup_module.ffmpeg_install_hint("linux")
        assert "apt" in hint or "dnf" in hint or "pacman" in hint

    def test_unknown_platform_returns_generic(self, setup_module) -> None:
        hint = setup_module.ffmpeg_install_hint("sunos")
        assert "ffmpeg" in hint.lower()
        # does not falsely suggest brew on a non-mac platform
        assert "brew" not in hint


class TestVenvDecisions:
    def test_detects_missing_venv(self, setup_module, tmp_path: Path) -> None:
        assert setup_module.venv_exists(tmp_path / ".venv") is False

    def test_detects_existing_venv(self, setup_module, tmp_path: Path) -> None:
        venv = tmp_path / ".venv"
        (venv / "bin").mkdir(parents=True)
        (venv / "bin" / "python").write_text("")
        assert setup_module.venv_exists(venv) is True

    def test_python_for_venv_points_into_venv(self, setup_module, tmp_path: Path) -> None:
        venv = tmp_path / ".venv"
        result = setup_module.venv_python(venv)
        assert str(result).endswith("bin/python") or str(result).endswith("bin\\python.exe")
        assert str(venv) in str(result)


class TestPackageImportCheck:
    def test_installed_package_detected(self, setup_module) -> None:
        # pytest is always installed in the test environment
        assert setup_module.package_importable_in_venv(
            sys.executable, "pytest"
        ) is True

    def test_missing_package_detected(self, setup_module) -> None:
        assert setup_module.package_importable_in_venv(
            sys.executable, "definitely_not_a_real_pkg_xyz_123"
        ) is False


class TestStepOrder:
    """Sanity: setup_plan() returns steps in the right order."""

    def test_plan_includes_required_steps_in_order(self, setup_module) -> None:
        plan = setup_module.setup_plan(
            repo_root=Path("/tmp/fake"),
            venv_path=Path("/tmp/fake/.venv"),
            has_ffmpeg=True,
        )
        step_names = [s.name for s in plan]
        # venv creation must come before install; install before whisper download
        assert step_names.index("create_venv") < step_names.index("pip_install")
        assert step_names.index("pip_install") < step_names.index("download_whisper_model")

    def test_plan_adds_ffmpeg_warning_when_missing(self, setup_module) -> None:
        plan = setup_module.setup_plan(
            repo_root=Path("/tmp/fake"),
            venv_path=Path("/tmp/fake/.venv"),
            has_ffmpeg=False,
        )
        names = [s.name for s in plan]
        assert "warn_missing_ffmpeg" in names

    def test_plan_skips_ffmpeg_warning_when_present(self, setup_module) -> None:
        plan = setup_module.setup_plan(
            repo_root=Path("/tmp/fake"),
            venv_path=Path("/tmp/fake/.venv"),
            has_ffmpeg=True,
        )
        names = [s.name for s in plan]
        assert "warn_missing_ffmpeg" not in names
