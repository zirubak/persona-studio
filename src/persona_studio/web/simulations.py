"""Read-only past-simulation listing for the Phase 1 web API.

Walks ``./simulations/**/*.md`` and returns transcript metadata records
for the Results screen. The parse here is intentionally a small
frontmatter-only implementation — it does NOT reuse
``grounding.audit._parse_topic`` or ``_collect_avatar_quotes`` (both
underscore-private) nor ``audit_transcript()`` (mutates files).

Per-simulation score, when present, is averaged from the final column of
the inline ``## Factual Grounding`` markdown table that
``persona_studio.grounding.audit.render_audit_section`` emits. When the
section is missing or malformed, ``score`` is ``None``.
"""
from __future__ import annotations

import datetime as _dt
import re
from pathlib import Path

import yaml

_FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.DOTALL)
_GROUNDING_SECTION_RE = re.compile(
    r"##\s*Factual Grounding\s*\n(.*?)(?=\n##\s|\Z)", re.DOTALL
)
# Empty string sorts smallest → with reverse=True, undated simulations
# land at the end (behind every dated one).
_MISSING_SORT_KEY = ""


def list_simulations() -> list[dict]:
    """Return simulation records newest-first."""
    root = Path.cwd() / "simulations"
    if not root.exists() or not root.is_dir():
        return []

    records: list[dict] = []
    for path in sorted(root.rglob("*.md")):
        record = _parse_transcript(path, root)
        if record is not None:
            records.append(record)

    records.sort(
        key=lambda r: r.get("generated") or _MISSING_SORT_KEY, reverse=True
    )
    return records


def _parse_transcript(path: Path, root: Path) -> dict | None:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return None

    frontmatter, body = _split_frontmatter(raw)
    if not frontmatter:
        return None

    return {
        "id": path.relative_to(root).as_posix(),
        "kind": _coerce_str(frontmatter.get("kind"), default=""),
        "topic": _coerce_str(frontmatter.get("topic"), default=""),
        "participants": _coerce_list(frontmatter.get("participants")),
        "generated": _coerce_generated(frontmatter.get("generated")),
        "score": _extract_average_score(body),
    }


def _split_frontmatter(raw: str) -> tuple[dict, str]:
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


def _coerce_str(value: object, *, default: str) -> str:
    if isinstance(value, str):
        return value
    if value is None:
        return default
    return str(value)


def _coerce_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    return []


def _coerce_generated(value: object) -> str | None:
    """Keep frontmatter timestamp as a string.

    YAML 1.1's ``safe_load`` auto-parses ISO 8601 timestamps into
    ``datetime`` objects. We restore the canonical ``isoformat()`` shape
    (with the ``T`` separator) so round-tripping through the API
    matches what the frontmatter file actually contained. Falls back to
    ``str(value)`` for anything non-datetime and non-string.
    """
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, (_dt.datetime, _dt.date)):
        return value.isoformat()
    return str(value)


def _extract_average_score(body: str) -> float | None:
    """Average the last-column (Score) values from a Factual Grounding table."""
    section = _GROUNDING_SECTION_RE.search(body)
    if section is None:
        return None

    scores: list[float] = []
    for line in section.group(1).splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not cells:
            continue
        try:
            scores.append(float(cells[-1]))
        except ValueError:
            continue

    if not scores:
        return None
    return sum(scores) / len(scores)
