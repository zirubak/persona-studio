"""Tests for persona_studio.grounding.claims."""
from __future__ import annotations

from persona_studio.grounding import Claim, ClaimKind
from persona_studio.grounding.claims import extract_claims


class TestExtractClaims:
    def test_empty_text_returns_empty(self) -> None:
        assert extract_claims("") == []
        assert extract_claims("   \n  ") == []

    def test_numeric_with_unit_is_high_risk_fact(self) -> None:
        text = "70% of startups fail within 3 years according to studies."
        claims = extract_claims(text)
        assert claims
        fact = next(
            (c for c in claims if c.kind == ClaimKind.FACT_ASSERTION), None
        )
        assert fact is not None
        assert fact.is_high_risk is True
        assert "70%" in fact.text or "70" in fact.text

    def test_date_plus_event_is_high_risk_fact(self) -> None:
        text = "She founded Acme in 2015 after leaving BigCo."
        claims = extract_claims(text)
        fact = next(
            (c for c in claims if c.kind == ClaimKind.FACT_ASSERTION), None
        )
        assert fact is not None
        assert fact.is_high_risk is True
        assert "2015" in fact.text

    def test_attributed_quote_is_high_risk_fact(self) -> None:
        text = 'Paul Graham said "ideas are cheap, execution is everything" in his essay.'
        claims = extract_claims(text)
        fact = next(
            (c for c in claims if c.kind == ClaimKind.FACT_ASSERTION), None
        )
        assert fact is not None
        assert fact.is_high_risk is True

    def test_opinion_marker_detected(self) -> None:
        text = "I think remote work is overrated for junior engineers."
        claims = extract_claims(text)
        op = next((c for c in claims if c.kind == ClaimKind.OPINION), None)
        assert op is not None
        assert op.is_high_risk is False

    def test_narrative_text_not_high_risk(self) -> None:
        text = "She walked to the kitchen and poured herself a cup of coffee."
        claims = extract_claims(text)
        # Either no FACT_ASSERTION, or if any, not high-risk.
        facts = [c for c in claims if c.kind == ClaimKind.FACT_ASSERTION]
        for f in facts:
            assert f.is_high_risk is False

    def test_multiple_sentences_each_become_claims(self) -> None:
        text = (
            "Bob won the 2019 Nobel prize in literature. "
            "His novel sold 2 million copies. "
            "I believe his style is unmatched."
        )
        claims = extract_claims(text)
        assert len(claims) >= 3

    def test_span_indices_are_valid(self) -> None:
        text = "70% of startups fail in the first year."
        claims = extract_claims(text)
        for c in claims:
            assert 0 <= c.span_start < c.span_end <= len(text)
            assert text[c.span_start : c.span_end] == c.text

    def test_korean_date_fact(self) -> None:
        """Korean text with year + event should still register as high-risk fact."""
        text = "그는 2015년에 회사를 창업했다."
        claims = extract_claims(text)
        fact = next(
            (c for c in claims if c.kind == ClaimKind.FACT_ASSERTION), None
        )
        assert fact is not None
        assert fact.is_high_risk is True

    def test_claim_is_frozen_dataclass(self) -> None:
        """Claim must be immutable (frozen=True)."""
        claims = extract_claims("She founded Acme in 2015.")
        if claims:
            c = claims[0]
            assert isinstance(c, Claim)
            # Attempting to mutate should raise.
            try:
                c.text = "x"  # type: ignore[misc]
            except Exception:
                return
            raise AssertionError("Claim should be frozen (immutable)")
