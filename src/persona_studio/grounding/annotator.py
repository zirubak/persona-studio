"""Render verification results as inline annotations on a turn's text.

Annotation grammar (bracketed tags placed immediately after each claim):

* ``[SUPPORTED: <source>:<lineStart>-<lineEnd>]`` — matched a corpus chunk.
* ``[UNSUPPORTED]`` — evidence contradicted the claim.
* ``[UNVERIFIABLE]`` — no supporting evidence (non-opinion claim).
* ``[OPINION]`` — the claim is flagged as opinion and not fact-checked.

The function is idempotent: re-running it on already-annotated text
produces the same output (duplicate tags are suppressed). ``strip_annotations``
provides a reversible path for export pipelines that want the raw text.
"""
from __future__ import annotations

import re
from collections.abc import Sequence

from persona_studio.grounding.types import (
    ClaimKind,
    VerifyResult,
    VerifyStatus,
)


_TAG_RE = re.compile(
    r"\s*\[(?:SUPPORTED:[^\]]+|UNSUPPORTED|UNVERIFIABLE|OPINION)\]"
)


def annotate_turn(text: str, results: Sequence[VerifyResult]) -> str:
    """Return a copy of ``text`` with verification tags inserted after each claim.

    Claims are inserted in reverse offset order so that earlier span indices
    stay valid during mutation. If ``results`` is empty, the input is
    returned unchanged. Existing tags are stripped first so the operation
    is idempotent.
    """
    if not results:
        return text

    # Strip any prior tags so re-annotation is deterministic.
    cleaned = strip_annotations(text)

    # Sort claims by descending span_start so insertions don't shift offsets
    # of earlier claims.
    ordered = sorted(results, key=lambda r: r.claim.span_start, reverse=True)
    out = cleaned
    for result in ordered:
        tag = _tag_for(result)
        if not tag:
            continue
        insert_at = min(result.claim.span_end, len(out))
        # Pad with one space if the preceding char isn't already whitespace.
        sep = "" if insert_at == 0 or out[insert_at - 1].isspace() else " "
        out = out[:insert_at] + sep + tag + out[insert_at:]
    return out


def strip_annotations(text: str) -> str:
    """Remove all grounding tags; useful for exporters that want raw text."""
    return _TAG_RE.sub("", text)


def _tag_for(result: VerifyResult) -> str | None:
    """Map one VerifyResult to its bracketed tag string (or None to skip)."""
    if (
        result.status is VerifyStatus.UNVERIFIABLE
        and result.claim.kind is ClaimKind.OPINION
    ):
        return "[OPINION]"
    if result.status is VerifyStatus.SUPPORTED and result.citation:
        return f"[SUPPORTED: {result.citation}]"
    if result.status is VerifyStatus.UNSUPPORTED:
        return "[UNSUPPORTED]"
    if result.status is VerifyStatus.UNVERIFIABLE:
        return "[UNVERIFIABLE]"
    return None
