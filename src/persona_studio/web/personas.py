"""Read-only persona library listing for the Phase 1 web API.

Ports the dual-scope + project-priority-dedup algorithm described in
``commands/studio.md`` Route D (lines 116-129) to Python. Does NOT reuse
``grounding.retriever.find_persona_data_dir`` — that function resolves a
single persona's data directory, not the library. This is a distinct
traversal.

The returned records are shaped for the web UI's Library screen
(``web/hifi-atoms.jsx`` PEOPLE array fields). Real persona files have a
heterogeneous frontmatter subset; this module maps what exists and
supplies defensible fallbacks for what doesn't.
"""
from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path
from typing import Iterable

import yaml

_FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.DOTALL)
_BACKGROUND_RE = re.compile(
    r"^#\s*Background\s*\n+([^\n]+)", re.MULTILINE
)


def list_personas() -> list[dict]:
    """Return the combined persona library from project-local + global scopes."""
    project_dir = Path.cwd() / "personas"
    global_dir: Path | None = None
    home = os.environ.get("HOME")
    if home:
        global_dir = Path(home) / ".persona-studio" / "personas"

    records: list[dict] = []
    seen_stems: set[str] = set()

    for path in _glob_sorted(project_dir):
        stem = path.stem
        if stem in seen_stems:
            continue
        seen_stems.add(stem)
        records.append(_build_record(path, scope="project"))

    if global_dir is not None:
        for path in _glob_sorted(global_dir):
            stem = path.stem
            if stem in seen_stems:
                continue
            seen_stems.add(stem)
            records.append(_build_record(path, scope="global"))

    return records


def _glob_sorted(directory: Path) -> Iterable[Path]:
    if not directory.exists() or not directory.is_dir():
        return []
    return sorted(directory.glob("*.md"))


def _build_record(path: Path, *, scope: str) -> dict:
    frontmatter, body = _split_frontmatter(path)
    name = frontmatter.get("name") or path.stem
    return {
        "name": str(name),
        "scope": scope,
        "mode": _normalize_mode(frontmatter.get("mode")),
        "role": _resolve_role(frontmatter, body),
        "born": frontmatter.get("born_year"),
        "hue": _hue_for(str(name)),
    }


def _split_frontmatter(path: Path) -> tuple[dict, str]:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return {}, ""

    match = _FRONTMATTER_RE.match(raw)
    if match is None:
        return {}, raw

    fm_text, body = match.group(1), match.group(2)
    try:
        data = yaml.safe_load(fm_text)
    except yaml.YAMLError:
        return {}, body

    if not isinstance(data, dict):
        return {}, body
    return data, body


def _normalize_mode(value: object) -> str:
    if isinstance(value, str) and value.strip().lower() == "private":
        return "private"
    return "public"


def _resolve_role(frontmatter: dict, body: str) -> str:
    primary = frontmatter.get("primary_role")
    if isinstance(primary, str) and primary.strip():
        return primary.strip()

    match = _BACKGROUND_RE.search(body)
    if match:
        return match.group(1).strip()
    return ""


def _hue_for(name: str) -> int:
    """Deterministic hue in [0, 360) derived from name.

    Keeps avatar tint stable across reloads. MD5 is used as a
    well-distributed hash, not for security.
    """
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 360
