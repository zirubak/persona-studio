"""Tests for persona_studio.grounding.verifier."""
from __future__ import annotations

from pathlib import Path

import pytest

from persona_studio.grounding import (
    Claim,
    ClaimKind,
    EvidenceChunk,
    VerifyStatus,
)
from persona_studio.grounding.verifier import verify_claim


def _make_claim(text: str, *, kind: ClaimKind = ClaimKind.FACT_ASSERTION, high: bool = True) -> Claim:
    return Claim(
        text=text,
        span_start=0,
        span_end=len(text),
        kind=kind,
        is_high_risk=high,
    )


@pytest.fixture
def sample_evidence() -> list[EvidenceChunk]:
    return [
        EvidenceChunk(
            persona="alice",
            source="corpus.md",
            line_start=10,
            line_end=12,
            text="Alice founded Acme in 2015 after leaving BigCo.",
            score=0.9,
        ),
        EvidenceChunk(
            persona="alice",
            source="corpus.md",
            line_start=20,
            line_end=22,
            text="She raised $10M Series A in 2018.",
            score=0.8,
        ),
        EvidenceChunk(
            persona="alice",
            source="perplexity_notes.md",
            line_start=5,
            line_end=7,
            text="Studies show 15% productivity drop for juniors when fully remote.",
            score=0.7,
        ),
    ]


class TestVerifyClaim:
    def test_supported_fact_finds_citation(
        self, sample_evidence: list[EvidenceChunk]
    ) -> None:
        claim = _make_claim("Alice founded Acme in 2015.")
        result = verify_claim(claim, sample_evidence)
        assert result.status == VerifyStatus.SUPPORTED
        assert result.citation is not None
        assert "corpus.md:10" in result.citation

    def test_supported_numeric_claim(
        self, sample_evidence: list[EvidenceChunk]
    ) -> None:
        claim = _make_claim("The company raised $10M in 2018.")
        result = verify_claim(claim, sample_evidence)
        assert result.status == VerifyStatus.SUPPORTED
        assert result.citation is not None
        assert "2018" in result.reasoning or "10M" in result.reasoning or "$10M" in result.reasoning

    def test_unsupported_when_contradicted(
        self, sample_evidence: list[EvidenceChunk]
    ) -> None:
        # Claim contradicts a specific fact (wrong year).
        claim = _make_claim("Alice founded Acme in 2003.")
        result = verify_claim(claim, sample_evidence)
        assert result.status == VerifyStatus.UNSUPPORTED
        assert result.citation is None

    def test_unverifiable_when_no_evidence_match(
        self, sample_evidence: list[EvidenceChunk]
    ) -> None:
        claim = _make_claim("75% of developers use dark mode.")
        result = verify_claim(claim, sample_evidence)
        assert result.status == VerifyStatus.UNVERIFIABLE
        assert result.citation is None

    def test_empty_evidence_is_unverifiable(self) -> None:
        claim = _make_claim("Alice founded Acme in 2015.")
        result = verify_claim(claim, [])
        assert result.status == VerifyStatus.UNVERIFIABLE

    def test_opinion_claim_is_unverifiable_not_unsupported(
        self, sample_evidence: list[EvidenceChunk]
    ) -> None:
        """Opinions bypass fact-check — return UNVERIFIABLE, not UNSUPPORTED."""
        claim = _make_claim(
            "I think remote work is overrated.",
            kind=ClaimKind.OPINION,
            high=False,
        )
        result = verify_claim(claim, sample_evidence)
        assert result.status == VerifyStatus.UNVERIFIABLE
        assert "opinion" in result.reasoning.lower()

    def test_narrative_claim_is_unverifiable(
        self, sample_evidence: list[EvidenceChunk]
    ) -> None:
        claim = _make_claim(
            "She walked to the kitchen.",
            kind=ClaimKind.NARRATIVE,
            high=False,
        )
        result = verify_claim(claim, sample_evidence)
        assert result.status == VerifyStatus.UNVERIFIABLE

    def test_citation_format(self, sample_evidence: list[EvidenceChunk]) -> None:
        claim = _make_claim("Alice founded Acme in 2015.")
        result = verify_claim(claim, sample_evidence)
        assert result.citation is not None
        # Must include source and a line range.
        assert ":" in result.citation
        source, lines = result.citation.rsplit(":", 1)
        assert source == "corpus.md"
        assert "-" in lines
        start, end = lines.split("-")
        assert int(start) <= int(end)

    def test_score_range(self, sample_evidence: list[EvidenceChunk]) -> None:
        claim = _make_claim("Alice founded Acme in 2015.")
        result = verify_claim(claim, sample_evidence)
        assert 0.0 <= result.score <= 1.0
