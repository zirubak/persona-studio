"""Tier-1 local verification of extracted claims against an evidence bundle.

Phase A: deterministic rule-based verifier. For each :class:`Claim`, scan
the supplied list of :class:`EvidenceChunk` and decide:

* ``SUPPORTED`` — a chunk contains all of the claim's *salient tokens*,
  where salient tokens are numbers (years / percentages / numeric-with-unit)
  and content nouns. Produces a citation of the form ``source:start-end``.
* ``UNSUPPORTED`` — evidence contains a contradicting value for the same
  axis (e.g., claim says "2003", evidence says "2015" for the same
  subject+verb context).
* ``UNVERIFIABLE`` — no relevant evidence found OR the claim is OPINION /
  NARRATIVE (not a fact assertion).

Tier-2 verification (Perplexity MCP / WebSearch) is intentionally *not*
handled here; it's orchestrated from the markdown command layer so the
Python side stays network-free and deterministic.
"""
from __future__ import annotations

import re
from collections.abc import Iterable

from persona_studio.grounding.types import (
    Claim,
    ClaimKind,
    EvidenceChunk,
    VerifyResult,
    VerifyStatus,
)


_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_PERCENT_RE = re.compile(r"\d+(?:\.\d+)?\s?%")
_NUM_UNIT_RE = re.compile(
    r"\$?\d+(?:\.\d+)?\s?(?:M|B|K|million|billion|thousand|%)?",
    re.IGNORECASE,
)
_TOKEN_RE = re.compile(r"[A-Za-z0-9가-힣一-龥]+")


def verify_claim(claim: Claim, evidence: Iterable[EvidenceChunk]) -> VerifyResult:
    """Verify a single claim against a supplied evidence bundle.

    Does not fetch evidence itself — call ``retrieve_evidence`` first and
    pass the result here. This separation keeps the verifier pure and
    easy to test.
    """
    if claim.kind is ClaimKind.OPINION:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="Opinion claim; not subject to factual verification.",
        )
    if claim.kind is ClaimKind.NARRATIVE:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="Narrative; no factual anchor to verify.",
        )

    evidence_list = list(evidence)
    if not evidence_list:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="No evidence available for this persona/topic.",
        )

    salient = _salient_tokens(claim.text)
    if not salient:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="Claim lacks salient anchors (numbers, names) to verify.",
        )

    # Find the evidence chunk with maximum salient-token overlap.
    best: EvidenceChunk | None = None
    best_overlap: set[str] = set()
    for chunk in evidence_list:
        chunk_tokens = {t.lower() for t in _TOKEN_RE.findall(chunk.text)}
        overlap = salient & chunk_tokens
        if len(overlap) > len(best_overlap):
            best = chunk
            best_overlap = overlap

    if best is None or not best_overlap:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNVERIFIABLE,
            citation=None,
            score=0.0,
            reasoning="No evidence chunk matches the claim's anchors.",
        )

    # Detect contradiction: same context words but a different year/percent/number.
    contradiction = _detect_contradiction(claim.text, best.text, best_overlap)
    if contradiction:
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.UNSUPPORTED,
            citation=None,
            score=0.85,
            reasoning=f"Evidence contradicts: {contradiction}",
        )

    # All salient tokens must be present for SUPPORTED. If only some are, it's
    # partial — we still mark UNVERIFIABLE since Tier-1 is strict.
    if _all_anchors_present(claim.text, best.text):
        score = round(len(best_overlap) / max(len(salient), 1), 4)
        citation = f"{best.source}:{best.line_start}-{best.line_end}"
        return VerifyResult(
            claim=claim,
            status=VerifyStatus.SUPPORTED,
            citation=citation,
            score=score,
            reasoning=f"Anchors matched in {citation}: {', '.join(sorted(best_overlap))[:120]}",
        )

    return VerifyResult(
        claim=claim,
        status=VerifyStatus.UNVERIFIABLE,
        citation=None,
        score=round(len(best_overlap) / max(len(salient), 1), 4),
        reasoning="Partial anchor match only; insufficient for Tier-1 support.",
    )


# --- Internal helpers ---------------------------------------------------------


# Minimal English/Korean stopwords for salience filtering.
_STOPWORDS = frozenset(
    {
        "a", "an", "the", "and", "or", "but", "of", "for", "to", "in", "on",
        "with", "is", "are", "was", "were", "be", "it", "its", "this", "that",
        "as", "at", "by", "from", "has", "have", "had", "not", "no", "yes",
        "do", "did", "so", "if", "then", "than", "about", "into", "over",
        "i", "you", "he", "she", "we", "they", "them", "his", "her",
        "의", "가", "이", "은", "는", "을", "를", "에", "에서", "와", "과",
        "도", "만", "으로", "로", "하다", "있다", "없다", "그리고",
    }
)


def _salient_tokens(text: str) -> set[str]:
    """Return salient lowercased tokens: numbers + non-stopword content words."""
    tokens: set[str] = set()
    # Always include numeric anchors as-is (even if short).
    for m in _NUM_UNIT_RE.findall(text):
        piece = m.strip().lower()
        if piece and any(ch.isdigit() for ch in piece):
            tokens.add(piece)
    for m in _TOKEN_RE.findall(text):
        tok = m.lower()
        if len(tok) <= 2 and not tok.isdigit():
            continue
        if tok in _STOPWORDS:
            continue
        tokens.add(tok)
    return tokens


def _detect_contradiction(
    claim_text: str, evidence_text: str, overlap: set[str]
) -> str | None:
    """Return a short contradiction description or None.

    Contradiction heuristic: the claim and evidence mention the same context
    (at least 2 overlapping content words) but the YEARS or PERCENTAGES
    differ. We leave deeper semantic contradiction detection for Tier-2 /
    CoVe in Phase C.
    """
    if len(overlap) < 2:
        return None
    claim_years = set(_YEAR_RE.findall(claim_text))
    ev_years = set(_YEAR_RE.findall(evidence_text))
    if claim_years and ev_years and claim_years.isdisjoint(ev_years):
        return (
            f"claim year {sorted(claim_years)} vs evidence year "
            f"{sorted(ev_years)}"
        )
    claim_pct = set(_PERCENT_RE.findall(claim_text))
    ev_pct = set(_PERCENT_RE.findall(evidence_text))
    if claim_pct and ev_pct and claim_pct.isdisjoint(ev_pct):
        return f"claim pct {sorted(claim_pct)} vs evidence pct {sorted(ev_pct)}"
    return None


def _all_anchors_present(claim_text: str, evidence_text: str) -> bool:
    """Check that every year + every percent in the claim appears in evidence."""
    claim_years = set(_YEAR_RE.findall(claim_text))
    ev_years = set(_YEAR_RE.findall(evidence_text))
    if claim_years and not claim_years.issubset(ev_years):
        return False
    claim_pct = set(_PERCENT_RE.findall(claim_text))
    ev_pct = set(_PERCENT_RE.findall(evidence_text))
    if claim_pct and not claim_pct.issubset(ev_pct):
        return False
    return True
