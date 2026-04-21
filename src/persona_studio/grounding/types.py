"""Shared data types for the factual-grounding layer."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ClaimKind(str, Enum):
    """Category of an extracted span within a turn's text."""

    FACT_ASSERTION = "fact_assertion"
    OPINION = "opinion"
    NARRATIVE = "narrative"


class VerifyStatus(str, Enum):
    """Outcome of verifying a single claim against evidence."""

    SUPPORTED = "supported"
    UNSUPPORTED = "unsupported"
    UNVERIFIABLE = "unverifiable"


@dataclass(frozen=True)
class EvidenceChunk:
    """A retrieved passage from a persona's corpus or perplexity notes.

    line_start / line_end are 1-based inclusive line numbers in the source file.
    score is a normalized retrieval score in [0, 1] — higher means better match.
    """

    persona: str
    source: str
    line_start: int
    line_end: int
    text: str
    score: float


@dataclass(frozen=True)
class Claim:
    """A factual-looking span extracted from a turn's text.

    span_start / span_end are character offsets in the source turn (0-based,
    end exclusive). is_high_risk flags claims that warrant deeper verification:
    statistics with units, attributed quotes, or specific dates.
    """

    text: str
    span_start: int
    span_end: int
    kind: ClaimKind
    is_high_risk: bool


@dataclass(frozen=True)
class VerifyResult:
    """Outcome of verifying one claim.

    citation follows the format "<source>:<start>-<end>" when status is
    SUPPORTED, otherwise None. score is confidence in [0, 1]. reasoning is a
    one-line explanation for transcript transparency.
    """

    claim: Claim
    status: VerifyStatus
    citation: str | None
    score: float
    reasoning: str
