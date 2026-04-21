"""Factual-grounding layer for persona-studio.

This package provides retrieval, claim extraction, verification, annotation,
and audit primitives that reduce hallucinations during debate and meeting
simulations. It is INTENTIONALLY local-only: no MCP, no network, no live
external tools. Runtime Tier-2 verification (Perplexity MCP / WebSearch) is
orchestrated from the markdown command layer, not from here. Keeping the
Python side free of network dependencies makes it unit-testable, portable,
and reproducible.

Phase A (this package): Tier-1 grounding via local grep over each persona's
corpus.md and perplexity_notes.md. Turns are annotated inline with
[SUPPORTED: ...] / [UNSUPPORTED] / [OPINION] and a post-meeting audit section
is appended to transcripts.

Phase B+ adds Tier-2 live verification via the command layer's conditional
MCP/WebSearch fallback chain; the types here are stable across phases.
"""
from __future__ import annotations

from persona_studio.grounding.types import (
    Claim,
    ClaimKind,
    EvidenceChunk,
    VerifyResult,
    VerifyStatus,
)

__all__ = [
    "Claim",
    "ClaimKind",
    "EvidenceChunk",
    "VerifyResult",
    "VerifyStatus",
]
