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


class TestVerifierTuning:
    """Improvements: any-chunk anchor match, relaxed contradiction, KO tokens."""

    def test_supported_when_anchor_chunk_has_lower_overlap_than_noise_chunk(
        self,
    ) -> None:
        """Realistic failure: a noise chunk scores higher on content overlap
        than the chunk actually containing the numeric anchor.

        Before the fix: verifier ranked the noise chunk as best, then
        :func:`_all_anchors_present` on just that chunk returned False →
        UNVERIFIABLE. After the fix: anchor presence is checked across
        ALL chunks, not only the top-overlap one.
        """
        evidence = [
            # Chunk A: high content overlap (3 words), NO percent anchor.
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=1,
                line_end=3,
                text=(
                    "Every team debates design docs vs prototypes. "
                    "Prototypes iterate faster; design docs are structured."
                ),
                score=0.9,
            ),
            # Chunk B: lower content overlap (1 word) but HAS the percent.
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=10,
                line_end=12,
                text="95% 의 경우 prototype 이 더 낫다.",
                score=0.5,
            ),
        ]
        claim = _make_claim("95% of the time prototypes beat design docs.")
        result = verify_claim(claim, evidence)
        assert result.status == VerifyStatus.SUPPORTED
        # Must cite Chunk B, which actually contains the anchor.
        assert result.citation == "corpus.md:10-12"

    def test_unsupported_with_single_content_word_overlap(self) -> None:
        """Contradiction fires on >= 1 content word + disjoint numbers (was 2)."""
        evidence = [
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=1,
                line_end=3,
                text="Our prototype-first features had 18% bug rate last quarter.",
                score=0.9,
            ),
        ]
        claim = _make_claim(
            "Our prototype-first features had 99% bug rate actually."
        )
        result = verify_claim(claim, evidence)
        assert result.status == VerifyStatus.UNSUPPORTED
        assert "99" in result.reasoning or "18" in result.reasoning

    def test_bilingual_content_overlap_via_script_split(self) -> None:
        """Mixed EN+KO tokens like 'doc보다' must split into 'doc' + '보다'
        so that 'design doc' in claim overlaps with 'design doc보다' in evidence."""
        evidence = [
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=1,
                line_end=3,
                text="95% 의 경우 프로토타입이 design doc보다 낫다.",
                score=0.9,
            ),
        ]
        claim = _make_claim("95% of the time prototypes beat a design doc.")
        result = verify_claim(claim, evidence)
        assert result.status == VerifyStatus.SUPPORTED

    def test_korean_particle_stripping_improves_overlap(self) -> None:
        """프로토타입이 should match 프로토타입 as content anchor."""
        evidence = [
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=1,
                line_end=3,
                text="프로토타입이 design doc 보다 낫다.",
                score=0.9,
            ),
        ]
        claim = _make_claim("프로토타입 접근법이 효과적이다.")
        # No numeric anchors, but content overlap should exceed 0.
        result = verify_claim(claim, evidence)
        assert result.score > 0

    def test_hallucinated_claim_with_unrelated_chunk_stays_unverifiable(
        self,
    ) -> None:
        """A hallucinated claim whose only overlap with corpus is one generic
        word must NOT be flagged as UNSUPPORTED (false positive) — it should
        remain UNVERIFIABLE (honest "we don't know")."""
        evidence = [
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=1,
                line_end=3,
                text="The team released a new feature in 2023.",
                score=0.9,
            ),
        ]
        claim = _make_claim("Google released GPT-7 in 2027.")
        result = verify_claim(claim, evidence)
        # Only 'released' overlaps — below contradiction threshold.
        assert result.status == VerifyStatus.UNVERIFIABLE

    def test_anchor_match_does_not_false_positive_across_chunks(self) -> None:
        """Anchor in chunk A must not count as support for claim overlapping chunk B only."""
        evidence = [
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=1,
                line_end=3,
                text="Acme raised $10M Series A in 2015.",
                score=0.9,
            ),
            EvidenceChunk(
                persona="p",
                source="corpus.md",
                line_start=20,
                line_end=22,
                text="Widgets Inc was founded in 2015 in Berlin.",
                score=0.9,
            ),
        ]
        # Claim's subject is Acme but year 2015 matches BOTH chunks.
        # Result should still be SUPPORTED via the Acme chunk (higher content overlap).
        claim = _make_claim("Acme raised $10M Series A in 2015.")
        result = verify_claim(claim, evidence)
        assert result.status == VerifyStatus.SUPPORTED
        # Must cite the Acme chunk, not the Widgets chunk.
        assert result.citation is not None
        assert "1-3" in result.citation
