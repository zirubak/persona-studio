"""Tests for persona_studio.grounding.session — session toggle flag."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from persona_studio.grounding.session import (
    SESSION_FILE,
    disable,
    enable,
    is_enabled,
    load_flag,
    toggle,
)


class TestIsEnabled:
    def test_default_is_enabled_when_missing(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        assert is_enabled() is True

    def test_disabled_when_flag_set_false(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        path = tmp_path / SESSION_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"enabled": False}), encoding="utf-8")
        assert is_enabled() is False

    def test_enabled_when_flag_set_true(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        path = tmp_path / SESSION_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"enabled": True}), encoding="utf-8")
        assert is_enabled() is True

    def test_malformed_json_defaults_to_enabled(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Fail-safe: broken flag file must not disable grounding silently."""
        monkeypatch.chdir(tmp_path)
        path = tmp_path / SESSION_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("not json", encoding="utf-8")
        assert is_enabled() is True

    def test_missing_enabled_key_defaults_to_enabled(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        path = tmp_path / SESSION_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"other": "field"}), encoding="utf-8")
        assert is_enabled() is True


class TestToggle:
    def test_toggle_from_missing_disables(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        new_state = toggle()
        assert new_state is False
        assert is_enabled() is False

    def test_toggle_from_disabled_re_enables(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        disable()
        new_state = toggle()
        assert new_state is True
        assert is_enabled() is True

    def test_disable_then_enable(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        disable()
        assert is_enabled() is False
        enable()
        assert is_enabled() is True

    def test_load_flag_returns_dict(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        disable()
        flag = load_flag()
        assert flag is not None
        assert flag["enabled"] is False
        assert "until" in flag


class TestCli:
    def _run(
        self, args: list[str], cwd: Path
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-m", "persona_studio.grounding.session", *args],
            cwd=cwd,
            capture_output=True,
            text=True,
        )

    def test_status_default_enabled(self, tmp_path: Path) -> None:
        result = self._run(["status"], cwd=tmp_path)
        assert result.returncode == 0
        assert result.stdout.strip() == "enabled"

    def test_status_after_disable(self, tmp_path: Path) -> None:
        self._run(["disable"], cwd=tmp_path)
        result = self._run(["status"], cwd=tmp_path)
        assert result.stdout.strip() == "disabled"

    def test_toggle_flips_state(self, tmp_path: Path) -> None:
        r1 = self._run(["toggle"], cwd=tmp_path)
        assert "disabled" in r1.stdout
        r2 = self._run(["toggle"], cwd=tmp_path)
        assert "enabled" in r2.stdout

    def test_enable_is_idempotent(self, tmp_path: Path) -> None:
        r1 = self._run(["enable"], cwd=tmp_path)
        r2 = self._run(["enable"], cwd=tmp_path)
        assert r1.returncode == 0 and r2.returncode == 0
        result = self._run(["status"], cwd=tmp_path)
        assert result.stdout.strip() == "enabled"
