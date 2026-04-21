"""Tests for persona_studio.grounding.annotator."""
from __future__ import annotations

from persona_studio.grounding import (
    Claim,
    ClaimKind,
    VerifyResult,
    VerifyStatus,
)
from persona_studio.grounding.annotator import annotate_turn, strip_annotations


def _claim(text: str, start: int, end: int, *, kind: ClaimKind = ClaimKind.FACT_ASSERTION, high: bool = True) -> Claim:
    return Claim(
        text=text,
        span_start=start,
        span_end=end,
        kind=kind,
        is_high_risk=high,
    )


def _result(claim: Claim, status: VerifyStatus, citation: str | None = None, reasoning: str = "ok") -> VerifyResult:
    return VerifyResult(
        claim=claim,
        status=status,
        citation=citation,
        score=0.9 if status == VerifyStatus.SUPPORTED else 0.0,
        reasoning=reasoning,
    )


class TestAnnotateTurn:
    def test_supported_claim_gets_citation_tag(self) -> None:
        text = "Alice founded Acme in 2015."
        c = _claim(text, 0, len(text))
        r = _result(c, VerifyStatus.SUPPORTED, citation="corpus.md:10-12")
        out = annotate_turn(text, [r])
        assert "[SUPPORTED: corpus.md:10-12]" in out
        assert text in out

    def test_unsupported_claim_gets_flag(self) -> None:
        text = "Alice founded Acme in 2003."
        c = _claim(text, 0, len(text))
        r = _result(c, VerifyStatus.UNSUPPORTED)
        out = annotate_turn(text, [r])
        assert "[UNSUPPORTED]" in out

    def test_unverifiable_opinion_gets_opinion_tag(self) -> None:
        text = "I think remote work is overrated."
        c = _claim(text, 0, len(text), kind=ClaimKind.OPINION, high=False)
        r = _result(c, VerifyStatus.UNVERIFIABLE, reasoning="Opinion")
        out = annotate_turn(text, [r])
        assert "[OPINION]" in out

    def test_unverifiable_non_opinion_gets_unverifiable_tag(self) -> None:
        text = "75% of developers use dark mode."
        c = _claim(text, 0, len(text))
        r = _result(c, VerifyStatus.UNVERIFIABLE, reasoning="No evidence")
        out = annotate_turn(text, [r])
        assert "[UNVERIFIABLE]" in out

    def test_idempotent_annotation(self) -> None:
        """Running annotate_turn twice on the same text yields the same output."""
        text = "Alice founded Acme in 2015."
        c = _claim(text, 0, len(text))
        r = _result(c, VerifyStatus.SUPPORTED, citation="corpus.md:10-12")
        once = annotate_turn(text, [r])
        twice = annotate_turn(once, [r])
        assert once == twice

    def test_multiple_claims_annotated_in_source_order(self) -> None:
        text = "She founded Acme in 2015. I think she is brilliant."
        c1 = _claim("She founded Acme in 2015.", 0, 25)
        c2 = _claim(
            "I think she is brilliant.",
            26,
            len(text),
            kind=ClaimKind.OPINION,
            high=False,
        )
        r1 = _result(c1, VerifyStatus.SUPPORTED, citation="corpus.md:10-12")
        r2 = _result(c2, VerifyStatus.UNVERIFIABLE, reasoning="Opinion")
        out = annotate_turn(text, [r1, r2])
        i1 = out.find("[SUPPORTED:")
        i2 = out.find("[OPINION]")
        assert i1 != -1 and i2 != -1
        assert i1 < i2

    def test_empty_results_returns_text_unchanged(self) -> None:
        text = "Hello world."
        assert annotate_turn(text, []) == text

    def test_strip_annotations_restores_original(self) -> None:
        text = "Alice founded Acme in 2015."
        c = _claim(text, 0, len(text))
        r = _result(c, VerifyStatus.SUPPORTED, citation="corpus.md:10-12")
        annotated = annotate_turn(text, [r])
        assert strip_annotations(annotated).strip() == text.strip()
