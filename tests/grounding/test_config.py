"""Tests for persona_studio.grounding.config."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from persona_studio.grounding.config import (
    GroundingConfig,
    config_path,
    load_config,
    save_config,
)


class TestGroundingConfig:
    def test_now_produces_iso_timestamp(self) -> None:
        cfg = GroundingConfig.now("perplexity")
        assert cfg.tier2_tool == "perplexity"
        # ISO 8601 format, includes T separator + timezone marker.
        assert "T" in cfg.detected_at
        assert cfg.detected_at.endswith("+00:00") or cfg.detected_at.endswith("Z")

    def test_frozen(self) -> None:
        cfg = GroundingConfig.now("websearch")
        try:
            cfg.tier2_tool = "perplexity"  # type: ignore[misc]
        except Exception:
            return
        raise AssertionError("GroundingConfig must be frozen")


class TestLoadSave:
    def test_save_creates_file_with_expected_shape(self, tmp_path: Path) -> None:
        cfg = GroundingConfig.now("perplexity")
        written = save_config(cfg, base=tmp_path)
        assert written.exists()
        data = json.loads(written.read_text(encoding="utf-8"))
        assert data["tier2_tool"] == "perplexity"
        assert data["detected_at"] == cfg.detected_at

    def test_load_returns_none_when_missing(self, tmp_path: Path) -> None:
        assert load_config(base=tmp_path) is None

    def test_load_returns_config_after_save(self, tmp_path: Path) -> None:
        cfg = GroundingConfig.now("websearch")
        save_config(cfg, base=tmp_path)
        loaded = load_config(base=tmp_path)
        assert loaded is not None
        assert loaded.tier2_tool == "websearch"
        assert loaded.detected_at == cfg.detected_at

    def test_load_malformed_json_returns_none(self, tmp_path: Path) -> None:
        path = config_path(tmp_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("this is not json", encoding="utf-8")
        assert load_config(base=tmp_path) is None

    def test_load_invalid_tool_returns_none(self, tmp_path: Path) -> None:
        path = config_path(tmp_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps({"tier2_tool": "bogus", "detected_at": "x"}),
            encoding="utf-8",
        )
        assert load_config(base=tmp_path) is None

    def test_save_creates_parent_dir(self, tmp_path: Path) -> None:
        """Should mkdir -p the `data/` directory if missing."""
        cfg = GroundingConfig.now("none")
        save_config(cfg, base=tmp_path)
        assert (tmp_path / "data" / "grounding-config.json").exists()

    def test_roundtrip_preserves_none_tool(self, tmp_path: Path) -> None:
        cfg = GroundingConfig.now("none")
        save_config(cfg, base=tmp_path)
        loaded = load_config(base=tmp_path)
        assert loaded is not None
        assert loaded.tier2_tool == "none"


class TestConfigPath:
    def test_defaults_to_cwd_relative(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.chdir(tmp_path)
        path = config_path()
        assert path == tmp_path / "data" / "grounding-config.json"

    def test_explicit_base_wins(self, tmp_path: Path) -> None:
        path = config_path(tmp_path / "other")
        assert path.parent == tmp_path / "other" / "data"
