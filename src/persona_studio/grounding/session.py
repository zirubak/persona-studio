"""Session-scoped grounding toggle.

Lets a single `/persona-studio:studio` session turn the entire grounding
layer off (useful for pure-brainstorm scenarios where hallucinations are
welcome). Flag lives in ``data/grounding-session.json`` — it's scoped to
the checkout rather than the user, so different projects can hold
different stances.

Fail-safe default: missing file, malformed JSON, or a missing ``enabled``
key all resolve to ``is_enabled() == True``. A broken flag file never
silently disables grounding; the user must explicitly toggle off.

CLI::

    python -m persona_studio.grounding.session status   # prints "enabled" or "disabled"
    python -m persona_studio.grounding.session enable
    python -m persona_studio.grounding.session disable
    python -m persona_studio.grounding.session toggle

Exit code 0 for all successful operations; 2 on argparse failure.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

SESSION_FILE = Path("data") / "grounding-session.json"


def _session_path(base: Path | None = None) -> Path:
    return (base or Path.cwd()) / SESSION_FILE


def load_flag(base: Path | None = None) -> dict[str, object] | None:
    """Return the raw flag dict, or None if missing / unreadable."""
    path = _session_path(base)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def is_enabled(base: Path | None = None) -> bool:
    """Return True unless the flag explicitly sets ``enabled`` to False.

    Fail-safe: any error, missing file, or missing key → True.
    """
    data = load_flag(base)
    if data is None:
        return True
    value = data.get("enabled")
    if isinstance(value, bool):
        return value
    return True


def _write(enabled: bool, base: Path | None = None) -> Path:
    path = _session_path(base)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"enabled": enabled, "until": "session"}, indent=2, sort_keys=True)
        + "\n",
        encoding="utf-8",
    )
    return path


def enable(base: Path | None = None) -> bool:
    _write(True, base=base)
    return True


def disable(base: Path | None = None) -> bool:
    _write(False, base=base)
    return False


def toggle(base: Path | None = None) -> bool:
    """Flip the flag; return the new enabled state."""
    current = is_enabled(base=base)
    if current:
        disable(base=base)
        return False
    enable(base=base)
    return True


def _label(enabled: bool) -> str:
    return "enabled" if enabled else "disabled"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m persona_studio.grounding.session",
        description="Manage the session-scoped factual-grounding toggle.",
    )
    parser.add_argument(
        "action",
        choices=("status", "enable", "disable", "toggle"),
        help="What to do.",
    )
    ns = parser.parse_args(argv)

    if ns.action == "status":
        print(_label(is_enabled()))
        return 0
    if ns.action == "enable":
        enable()
        print(_label(True))
        return 0
    if ns.action == "disable":
        disable()
        print(_label(False))
        return 0
    # toggle
    new_state = toggle()
    print(_label(new_state))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
