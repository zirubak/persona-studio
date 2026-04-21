"""Extract factual-looking claim spans from a turn's text.

This module uses lightweight regex + heuristics, never an LLM, so it runs
instantly and deterministically. It categorizes each sentence as one of:

* ``FACT_ASSERTION`` — contains a year, percentage, quantity-with-unit,
  attributed quote, or proper-noun-plus-assertion-verb pattern.
* ``OPINION`` — contains a first-person belief marker such as "I think",
  "in my opinion", "나는 ... 라고 생각한다", "I believe".
* ``NARRATIVE`` — neither of the above; a descriptive/background sentence.

Claims that combine numeric + unit, specific dates + events, or
attributed quotes are flagged :attr:`Claim.is_high_risk`, signaling to the
verifier that they warrant deeper verification (future Tier-2 / CoVe).
"""
from __future__ import annotations

import re

from persona_studio.grounding.types import Claim, ClaimKind


# Sentence splitter — handles English periods/question/exclamation,
# Korean periods (also "."), and common bilingual quote boundaries.
_SENT_SPLIT_RE = re.compile(
    r"(?<=[.!?。！？])\s+(?=[A-Za-z0-9가-힣\"'‘“])"
)

# Fact signals.
_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_PERCENT_RE = re.compile(r"\d+(?:\.\d+)?\s?%")
_NUMERIC_UNIT_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s?(?:million|billion|thousand|people|users|copies|"
    r"dollars?|\$|M|B|K|년|개|명|달러|원|만|억)\b",
    re.IGNORECASE,
)
_ATTRIBUTED_QUOTE_RE = re.compile(
    r"(?:said|wrote|argued|claimed|tweeted|말했다|적었다)\s*[:\-]?\s*[\"'‘“]"
    r"|[\"'‘“][^\"'’”]{6,}[\"'’”]"
)
_KOREAN_YEAR_RE = re.compile(r"\d{4}\s*년")

# Opinion signals.
_OPINION_RE = re.compile(
    r"\b(i\s+think|i\s+believe|i\s+feel|in\s+my\s+opinion|imo|personally,"
    r"|i\s+(?:would\s+)?argue|나는.{0,15}생각|내\s*생각|개인적으로|내\s*의견)\b",
    re.IGNORECASE,
)


def extract_claims(text: str) -> list[Claim]:
    """Tokenize a turn into claim spans and categorize each.

    Returns a list of Claim objects in source order. Empty input returns [].
    """
    if not text or not text.strip():
        return []

    claims: list[Claim] = []
    for start, end, sentence in _iter_sentences(text):
        stripped = sentence.strip()
        if not stripped:
            continue
        # Re-align offsets to the stripped substring inside the original.
        lead = len(sentence) - len(sentence.lstrip())
        trail = len(sentence) - len(sentence.rstrip())
        span_start = start + lead
        span_end = end - trail

        is_opinion = bool(_OPINION_RE.search(stripped))
        has_fact = _has_fact_signal(stripped)

        if is_opinion:
            kind = ClaimKind.OPINION
            high_risk = False
        elif has_fact:
            kind = ClaimKind.FACT_ASSERTION
            high_risk = _is_high_risk(stripped)
        else:
            kind = ClaimKind.NARRATIVE
            high_risk = False

        claims.append(
            Claim(
                text=stripped,
                span_start=span_start,
                span_end=span_end,
                kind=kind,
                is_high_risk=high_risk,
            )
        )
    return claims


# --- Internal helpers ---------------------------------------------------------


def _iter_sentences(text: str):
    """Yield (start_offset, end_offset, sentence_text) tuples.

    Uses a simple regex splitter; good enough for debate-turn text which is
    typically a handful of sentences per turn.
    """
    pos = 0
    for m in _SENT_SPLIT_RE.finditer(text):
        end = m.start()
        yield pos, end, text[pos:end]
        pos = m.end()
    if pos < len(text):
        yield pos, len(text), text[pos:]


def _has_fact_signal(sentence: str) -> bool:
    return bool(
        _YEAR_RE.search(sentence)
        or _PERCENT_RE.search(sentence)
        or _NUMERIC_UNIT_RE.search(sentence)
        or _ATTRIBUTED_QUOTE_RE.search(sentence)
        or _KOREAN_YEAR_RE.search(sentence)
    )


def _is_high_risk(sentence: str) -> bool:
    """High-risk claims combine a specific number/date/quote with context.

    Heuristic: any of percent, numeric+unit, year, Korean year, or
    attributed quote counts. Bare narrative years (e.g., "1999 was a
    strange year") still register — an imperfect but safe default.
    """
    return bool(
        _PERCENT_RE.search(sentence)
        or _NUMERIC_UNIT_RE.search(sentence)
        or _YEAR_RE.search(sentence)
        or _KOREAN_YEAR_RE.search(sentence)
        or _ATTRIBUTED_QUOTE_RE.search(sentence)
    )
