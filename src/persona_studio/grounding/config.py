"""Configuration for the factual-grounding layer.

Stores which Tier-2 external-verification tool is available in the current
install — Perplexity MCP if detected at setup time, WebSearch as the
always-present fallback, or ``none`` to disable Tier-2 entirely. Runtime
commands read this file to choose the fallback chain without re-detecting
on every invocation.

The file lives at ``./data/grounding-config.json`` relative to the project
root so it stays scoped to the current checkout. Detection + writing
happens during ``persona-setup.md`` / first ``studio.md`` run.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

Tier2Tool = Literal["perplexity", "websearch", "none"]
_VALID_TOOLS: frozenset[str] = frozenset({"perplexity", "websearch", "none"})
_FILENAME = Path("data") / "grounding-config.json"


@dataclass(frozen=True)
class GroundingConfig:
    """Detected Tier-2 verification tool + timestamp of detection."""

    tier2_tool: Tier2Tool
    detected_at: str

    @classmethod
    def now(cls, tool: Tier2Tool) -> "GroundingConfig":
        """Build a config stamped with the current UTC time (ISO 8601)."""
        return cls(
            tier2_tool=tool,
            detected_at=datetime.now(timezone.utc).isoformat(),
        )


def config_path(base: Path | None = None) -> Path:
    """Return the absolute path where grounding-config.json lives."""
    root = base or Path.cwd()
    return root / _FILENAME


def load_config(base: Path | None = None) -> GroundingConfig | None:
    """Load the grounding config, or None if missing / unreadable / invalid.

    A malformed file or unknown tool value is treated as "absent" rather
    than raising — the caller then typically re-runs detection.
    """
    path = config_path(base)
    if not path.exists():
        return None
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None

    tool = raw.get("tier2_tool")
    detected_at = raw.get("detected_at", "")
    if tool not in _VALID_TOOLS or not isinstance(detected_at, str):
        return None
    return GroundingConfig(tier2_tool=tool, detected_at=detected_at)


def save_config(config: GroundingConfig, base: Path | None = None) -> Path:
    """Write the config to disk (creates parent dirs). Returns the final path."""
    path = config_path(base)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(asdict(config), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return path
