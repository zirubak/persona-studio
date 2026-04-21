"""Post-meeting factual-grounding audit for simulation transcripts.

Given a transcript markdown file, this module:

  1. Parses the YAML frontmatter to extract participants.
  2. Walks each H2 (round / agenda section) and H3 (speaker block).
  3. For each blockquote line spoken by an avatar, runs the pipeline:
     ``extract_claims`` → ``verify_claim`` against the avatar's retrieved
     evidence → aggregates per-avatar statistics.
  4. Appends a ``## Factual Grounding`` section to the transcript with
     per-avatar grounding scores and the top unsupported claims.

This module is idempotent: if the section is already present, the append
is a no-op (the second call overwrites with the current stats but produces
the same serialized output).

CLI::

    python -m persona_studio.grounding.audit <path/to/transcript.md>

Returns the path of the transcript (unchanged) and prints a short summary
to stderr. All file operations are local; this module never touches the
network.
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from persona_studio.grounding.annotator import strip_annotations
from persona_studio.grounding.claims import extract_claims
from persona_studio.grounding.retriever import retrieve_evidence
from persona_studio.grounding.types import (
    ClaimKind,
    EvidenceChunk,
    VerifyResult,
    VerifyStatus,
)
from persona_studio.grounding.verifier import verify_claim


def _merge_evidence(
    primary: list[EvidenceChunk], secondary: list[EvidenceChunk]
) -> list[EvidenceChunk]:
    """Deduplicate evidence chunks by (source, line_start) and sort by score."""
    seen: set[tuple[str, int]] = set()
    merged: list[EvidenceChunk] = []
    for chunk in list(primary) + list(secondary):
        key = (chunk.source, chunk.line_start)
        if key in seen:
            continue
        seen.add(key)
        merged.append(chunk)
    merged.sort(key=lambda c: c.score, reverse=True)
    return merged


# --- Public API ---------------------------------------------------------------


@dataclass(frozen=True)
class AvatarStat:
    """Aggregated grounding statistics for one avatar in one transcript.

    ``external_verified`` / ``external_unverified`` count inline
    ``[VERIFIED-EXTERNAL: ...]`` and ``[UNVERIFIED-EXTERNAL]`` tags that
    Tier-2 verification (Perplexity / WebSearch, orchestrated by the
    simulate-* commands at runtime) produced. Score treats externally
    verified claims as supported.
    """

    total_claims: int
    supported: int
    unsupported: int
    unverifiable: int
    external_verified: int = 0
    external_unverified: int = 0
    grounding_score: float = 0.0
    top_unsupported: list[str] = field(default_factory=list)


@dataclass
class AuditReport:
    """Top-level audit report for a transcript."""

    avatars: dict[str, AvatarStat] = field(default_factory=dict)


_SECTION_HEADER = "## Factual Grounding"
_SECTION_BLOCK_RE = re.compile(
    r"(?ms)^## Factual Grounding.*?(?=^## |\Z)"
)

_H2_RE = re.compile(r"^## (.+)$", re.MULTILINE)
_H3_RE = re.compile(r"^### (.+)$", re.MULTILINE)
_BLOCKQUOTE_RE = re.compile(r"^>\s?(.*)$", re.MULTILINE)
_FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
_PARTICIPANTS_RE = re.compile(r"^participants:\s*\[([^\]]*)\]", re.MULTILINE)

_EXTERNAL_VERIFIED_RE = re.compile(r"\[VERIFIED-EXTERNAL:[^\]]+\]")
_EXTERNAL_UNVERIFIED_RE = re.compile(r"\[UNVERIFIED-EXTERNAL\]")


def audit_transcript(path: Path) -> AuditReport:
    """Audit a transcript in place, appending or updating the grounding section.

    Raises FileNotFoundError if the path does not exist.
    """
    if not path.exists():
        raise FileNotFoundError(str(path))

    text = path.read_text(encoding="utf-8")
    participants = _parse_participants(text)

    report = AuditReport()
    for avatar in participants:
        stat = _audit_avatar(avatar, text)
        if stat is not None:
            report.avatars[avatar] = stat

    rendered = render_audit_section(report)

    # Idempotent append: strip any existing section first.
    existing = _SECTION_BLOCK_RE.sub("", text).rstrip() + "\n"
    updated = existing + "\n" + rendered + "\n"
    if updated != text:
        path.write_text(updated, encoding="utf-8")
    return report


def render_audit_section(report: AuditReport) -> str:
    """Render an AuditReport as a markdown section."""
    lines = [_SECTION_HEADER, ""]
    if not report.avatars:
        lines.append("_No avatars detected in transcript; audit skipped._")
        return "\n".join(lines)

    lines.append(
        "| Avatar | Total | Supported | Unsupported | Unverifiable | "
        "External-verified | External-unverified | Score |"
    )
    lines.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
    for avatar, stat in sorted(report.avatars.items()):
        lines.append(
            f"| {avatar} | {stat.total_claims} | {stat.supported} | "
            f"{stat.unsupported} | {stat.unverifiable} | "
            f"{stat.external_verified} | {stat.external_unverified} | "
            f"{stat.grounding_score:.2f} |"
        )

    top_any = any(s.top_unsupported for s in report.avatars.values())
    if top_any:
        lines.append("")
        lines.append("### Top unsupported claims")
        for avatar, stat in sorted(report.avatars.items()):
            if not stat.top_unsupported:
                continue
            lines.append(f"- **{avatar}**:")
            for claim_text in stat.top_unsupported[:3]:
                preview = claim_text.strip().replace("\n", " ")
                if len(preview) > 180:
                    preview = preview[:177] + "..."
                lines.append(f"    - {preview}")

    return "\n".join(lines).rstrip() + "\n"


# --- Internal helpers ---------------------------------------------------------


def _parse_participants(text: str) -> list[str]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return []
    fm = m.group(1)
    pm = _PARTICIPANTS_RE.search(fm)
    if not pm:
        return []
    raw = pm.group(1)
    items = [p.strip().strip("'\"") for p in raw.split(",") if p.strip()]
    return items


def _audit_avatar(avatar: str, transcript_text: str) -> AvatarStat | None:
    """Collect all blockquote lines attributed to an avatar and audit them.

    Retrieval strategy for the audit path: per-claim retrieval rather than
    per-topic. Each claim is its own query; this recovers evidence for facts
    that live in the corpus even when the debate topic keywords don't overlap
    with the corpus keywords. Pre-turn retrieval (in simulate-*.md commands)
    remains topic-based — its job is prompt priming, not audit precision.

    Phase B additions: count inline ``[VERIFIED-EXTERNAL: ...]`` and
    ``[UNVERIFIED-EXTERNAL]`` tags already present on the turns (inserted
    at runtime by the simulate-* commands after a Tier-2 call). External
    verifications count toward ``supported`` in the score formula.
    """
    quoted_lines = _collect_avatar_quotes(avatar, transcript_text)
    if not quoted_lines:
        return None

    # Count pre-existing external tags BEFORE stripping annotations.
    raw_joined = " ".join(quoted_lines)
    external_verified = len(_EXTERNAL_VERIFIED_RE.findall(raw_joined))
    external_unverified = len(_EXTERNAL_UNVERIFIED_RE.findall(raw_joined))

    full_text = strip_annotations(raw_joined)
    claims = extract_claims(full_text)

    topic = _parse_topic(transcript_text) or avatar
    topic_evidence = retrieve_evidence(avatar, topic=topic, k=8)

    results: list[VerifyResult] = []
    for claim in claims:
        # Combine topic-level evidence with claim-specific evidence so the
        # verifier can match against whichever chunk is most relevant.
        claim_evidence = retrieve_evidence(avatar, topic=claim.text, k=6)
        merged = _merge_evidence(topic_evidence, claim_evidence)
        results.append(verify_claim(claim, merged))

    total_fact = sum(1 for r in results if r.claim.kind is ClaimKind.FACT_ASSERTION)
    supported = sum(1 for r in results if r.status is VerifyStatus.SUPPORTED)
    unsupported = sum(1 for r in results if r.status is VerifyStatus.UNSUPPORTED)
    unverifiable = sum(
        1
        for r in results
        if r.status is VerifyStatus.UNVERIFIABLE
        and r.claim.kind is ClaimKind.FACT_ASSERTION
    )

    # When the transcript carried external annotations, we pick the larger
    # of (internal_total, annotation_count) as the effective denominator.
    # This keeps ratios sensible when Tier-2 marked claims Tier-1's claim
    # extractor may not have classified as fact-assertions.
    effective_total = max(
        total_fact,
        supported + unsupported + unverifiable + external_verified + external_unverified,
    )

    # Score semantics: SUPPORTED + EXTERNAL_VERIFIED both count as +1; the
    # rest contribute nothing. "No factual claims" → 10.0 so short opinion
    # turns don't drag the score down.
    if effective_total == 0:
        score = 10.0
    else:
        score = round(
            10.0 * (supported + external_verified) / max(effective_total, 1),
            2,
        )

    top_unsupported = [
        r.claim.text for r in results if r.status is VerifyStatus.UNSUPPORTED
    ][:5]

    return AvatarStat(
        total_claims=effective_total,
        supported=supported,
        unsupported=unsupported,
        unverifiable=unverifiable,
        external_verified=external_verified,
        external_unverified=external_unverified,
        grounding_score=score,
        top_unsupported=top_unsupported,
    )


def _collect_avatar_quotes(avatar: str, transcript_text: str) -> list[str]:
    """Return every blockquote line that appears under an H3 == avatar name.

    Simple scan: walk lines, track the most recent H3, and grab blockquote
    bodies while that H3 matches the avatar.
    """
    lines = transcript_text.splitlines()
    current_speaker: str | None = None
    quotes: list[str] = []
    for raw in lines:
        h3 = _H3_RE.match(raw)
        if h3:
            # H3 may include decorations like "Lead — alice" or just "alice".
            header = h3.group(1).strip().lower()
            current_speaker = (
                avatar
                if header == avatar.lower() or avatar.lower() in header
                else None
            )
            continue
        if current_speaker == avatar:
            bm = _BLOCKQUOTE_RE.match(raw)
            if bm:
                quotes.append(bm.group(1).strip())
    return quotes


_TOPIC_RE = re.compile(r"^topic:\s*(.+)$", re.MULTILINE)


def _parse_topic(transcript_text: str) -> str | None:
    m = _FRONTMATTER_RE.match(transcript_text)
    if not m:
        return None
    tm = _TOPIC_RE.search(m.group(1))
    if not tm:
        return None
    return tm.group(1).strip().strip("'\"")


# --- CLI ----------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m persona_studio.grounding.audit",
        description="Append a factual-grounding audit section to a transcript.",
    )
    parser.add_argument("path", type=Path, help="Path to transcript markdown")
    ns = parser.parse_args(argv)

    try:
        report = audit_transcript(ns.path)
    except FileNotFoundError as err:
        print(f"error: {err}", file=sys.stderr)
        return 2

    for avatar, stat in sorted(report.avatars.items()):
        print(
            f"{avatar}: score={stat.grounding_score:.2f} "
            f"supported={stat.supported} unsupported={stat.unsupported} "
            f"unverifiable={stat.unverifiable}",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
