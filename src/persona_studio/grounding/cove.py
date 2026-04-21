"""Chain-of-Verification (CoVe) deterministic bookends.

This module is the Python half of the Tier-2 / CoVe flow used by the
simulate-* markdown commands. It intentionally does NOT call any LLM,
MCP server, or the network — the actual "answer" step is driven from
the markdown layer via a Claude Agent call. All work here is rule-based
so the module is trivially testable and reproducible.

Two pure functions, both exposed as CLI subcommands:

``generate-question``
    Read a claim text on stdin, extract the primary anchor (year,
    percent, quantity-with-unit, or entity), build a verification
    question via a rule-based template, and emit JSON.

``compare``
    Given the original claim and an LLM-produced answer, extract anchor
    sets from both and emit a deterministic verdict — ``consistent``,
    ``discrepancy``, or ``inconclusive`` — along with the anchor
    inventory used for the decision.

The CLI contract is stable: stdout is machine-readable JSON; stderr is
for logging and error messages; argparse failures exit with code 2.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from typing import TypedDict

# --- Anchor regexes ----------------------------------------------------------
# Kept in sync with the conventions used in ``claims.py`` and ``verifier.py``
# so a "year anchor" in one module is also a "year anchor" here.

_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_PERCENT_RE = re.compile(r"\d+(?:\.\d+)?\s?%")
_QUANTITY_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s?"
    r"(?:million|billion|thousand|M|B|K|년|개|명|달러)\b",
    re.IGNORECASE,
)
# A proper noun: a capitalized word (length >= 2) that is not the very first
# token of the claim. This is a coarse heuristic — enough to power the
# fallback ``entity`` template when no numeric anchor is present.
_PROPER_NOUN_RE = re.compile(r"\b([A-Z][A-Za-z]{1,})\b")

# Common English words that happen to get capitalized sentence-initially —
# we don't want them treated as "entities" for the template.
_NON_ENTITY_CAPITALIZED = frozenset(
    {
        "The", "A", "An", "This", "That", "These", "Those",
        "I", "You", "We", "They", "He", "She", "It",
        "According", "Is", "Are", "Was", "Were", "Has", "Have", "Had",
        "Do", "Does", "Did", "Will", "Would", "Could", "Should",
        "Yes", "No", "What", "Why", "How", "When", "Where", "Who",
    }
)


class AnchorSet(TypedDict, total=False):
    """Anchor inventory for a piece of text, keyed by anchor type."""

    year: list[str]
    percent: list[str]
    quantity: list[str]
    entity: list[str]


# --- Public API --------------------------------------------------------------


def extract_anchors(text: str) -> AnchorSet:
    """Extract anchors of each supported type from ``text``.

    Order within each list reflects first-occurrence order, de-duplicated.
    Empty lists are omitted from the returned dict so consumers can test
    membership cheaply (``"year" in anchors``).
    """
    out: AnchorSet = {}
    if not text:
        return out

    years = _unique_in_order(_YEAR_RE.findall(text))
    if years:
        out["year"] = years

    percents = _unique_in_order(m.group(0) for m in _PERCENT_RE.finditer(text))
    if percents:
        out["percent"] = percents

    quantities = _unique_in_order(m.group(0) for m in _QUANTITY_RE.finditer(text))
    if quantities:
        out["quantity"] = quantities

    entities = _extract_entities(text)
    if entities:
        out["entity"] = entities

    return out


def generate_question(claim: str) -> dict[str, str]:
    """Build a rule-based verification question for ``claim``.

    Returns a dict with keys: ``question``, ``anchor_type``,
    ``anchor_value``, ``claim_snippet``. Anchor priority is
    year > percent > quantity > entity > fallback. This priority
    matches the order users find most salient in factual disputes.
    """
    snippet = _snippet(claim)
    anchors = extract_anchors(claim)

    if "year" in anchors:
        value = anchors["year"][0]
        return {
            "question": (
                f"Is {value} the correct year for: {snippet}?"
            ),
            "anchor_type": "year",
            "anchor_value": value,
            "claim_snippet": snippet,
        }

    if "percent" in anchors:
        value = anchors["percent"][0]
        return {
            "question": (
                f"What percentage do reliable sources report for: {snippet}? "
                f"(Claim states {value}.)"
            ),
            "anchor_type": "percent",
            "anchor_value": value,
            "claim_snippet": snippet,
        }

    if "quantity" in anchors:
        value = anchors["quantity"][0]
        return {
            "question": (
                f"Is the figure {value} correct for: {snippet}?"
            ),
            "anchor_type": "quantity",
            "anchor_value": value,
            "claim_snippet": snippet,
        }

    if "entity" in anchors:
        value = anchors["entity"][0]
        return {
            "question": (
                f"Is {value} correctly identified in the claim: {snippet}?"
            ),
            "anchor_type": "entity",
            "anchor_value": value,
            "claim_snippet": snippet,
        }

    return {
        "question": f"What do reliable sources say about: {snippet}?",
        "anchor_type": "fallback",
        "anchor_value": "",
        "claim_snippet": snippet,
    }


_NEGATION_RE = re.compile(
    r"\b(?:no|not|never|wrong|incorrect|actually|instead|isn't|wasn't|"
    r"aren't|weren't|false|mistake|mistaken|rather|correction)\b",
    re.IGNORECASE,
)


def _answer_negates_claim(answer: str, claim_axis_values: set[str]) -> bool:
    """Heuristic: does the answer contain a negation marker AND numeric
    anchors beyond the claim's?

    Catches the common LLM correction pattern ``"No, X is wrong; actually Y"``
    where the answer echoes the claim's number (negated) AND supplies the
    correct number. Without this check, the anchor-intersection rule would
    declare consistency because the claim's number does literally appear in
    the answer.
    """
    if not _NEGATION_RE.search(answer):
        return False
    # Look for negation within 40 chars of at least one claim value.
    for value in claim_axis_values:
        for m in re.finditer(re.escape(value), answer):
            window_start = max(0, m.start() - 40)
            window_end = min(len(answer), m.end() + 40)
            if _NEGATION_RE.search(answer[window_start:window_end]):
                return True
    return False


def compare(claim: str, answer: str) -> dict[str, object]:
    """Compare anchor sets between a claim and an LLM-produced answer.

    Verdict rules (first match wins):

    1. If both sides carry year anchors and the sets are disjoint →
       ``discrepancy``.
    2. Same rule for percent anchors.
    3. If the answer contains a negation marker near the claim's value AND
       introduces a different numeric anchor on the same axis → the answer
       is CORRECTING the claim. Returns ``discrepancy``. This handles
       responses like "No, X is wrong; actually Y".
    4. If at least one anchor type is present in both sides and every
       shared anchor type matches element-wise → ``consistent``.
    5. If the claim carries an anchor type that the answer does not →
       ``inconclusive``.
    6. Otherwise → ``inconclusive`` (no shared axis to compare).
    """
    claim_anchors = extract_anchors(claim)
    answer_anchors = extract_anchors(answer)

    # Rule 1 + 2 — disjoint numeric anchors on a shared axis = discrepancy.
    for axis in ("year", "percent"):
        cset = set(claim_anchors.get(axis, []))
        aset = set(answer_anchors.get(axis, []))
        if cset and aset and cset.isdisjoint(aset):
            reason = (
                f"claim {axis} {_fmt_set(cset)} differs from "
                f"answer {axis} {_fmt_set(aset)}"
            )
            return _verdict("discrepancy", reason, claim_anchors, answer_anchors)

    # Rule 3 — answer echoes the claim's value with negation context AND
    # introduces a different value on the same axis → discrepancy.
    for axis in ("year", "percent"):
        cset = set(claim_anchors.get(axis, []))
        aset = set(answer_anchors.get(axis, []))
        # answer has the claim value but also additional values, and the
        # claim value is surrounded by negation markers in the answer text.
        if cset and aset and cset.issubset(aset) and (aset - cset):
            if _answer_negates_claim(answer, cset):
                correct = sorted(aset - cset)
                reason = (
                    f"answer negates claim {axis} {_fmt_set(cset)} "
                    f"and asserts {axis} {_fmt_set(set(correct))}"
                )
                return _verdict(
                    "discrepancy", reason, claim_anchors, answer_anchors
                )

    # Rule 3 — shared axes all match → consistent.
    shared_axes = [
        axis
        for axis in ("year", "percent", "quantity", "entity")
        if axis in claim_anchors and axis in answer_anchors
    ]
    if shared_axes:
        all_match = all(
            set(claim_anchors[axis]) & set(answer_anchors[axis])
            for axis in shared_axes
        )
        if all_match:
            axis = shared_axes[0]
            matched = set(claim_anchors[axis]) & set(answer_anchors[axis])
            reason = (
                f"claim {axis} {_fmt_set(matched)} matches "
                f"answer {axis} {_fmt_set(matched)}"
            )
            return _verdict("consistent", reason, claim_anchors, answer_anchors)

    # Rule 4 — claim has anchor type T, answer doesn't → inconclusive.
    for axis in ("year", "percent", "quantity", "entity"):
        if axis in claim_anchors and axis not in answer_anchors:
            return _verdict(
                "inconclusive",
                "answer lacks same anchor type",
                claim_anchors,
                answer_anchors,
            )

    # Rule 5 — nothing to compare on.
    return _verdict(
        "inconclusive",
        "no overlapping anchor type between claim and answer",
        claim_anchors,
        answer_anchors,
    )


# --- CLI ---------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    """CLI entry point.

    Subcommands:

    * ``generate-question`` — reads stdin, emits JSON on stdout.
    * ``compare`` — takes ``--claim`` and ``--answer`` flags, emits JSON.

    argparse failures naturally exit with code 2 via ``SystemExit``. On
    success returns 0. Internal errors log to stderr and return 1.
    """
    parser = argparse.ArgumentParser(
        prog="python -m persona_studio.grounding.cove",
        description=(
            "Deterministic Chain-of-Verification bookends: generate "
            "verification questions and compare anchors between claim "
            "and answer. No LLM, no network."
        ),
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser(
        "generate-question",
        help="Read a claim on stdin, emit a verification question as JSON.",
    )

    compare_parser = subparsers.add_parser(
        "compare",
        help="Compare anchors between a claim and an answer; emit verdict JSON.",
    )
    compare_parser.add_argument("--claim", required=True, help="Original claim text")
    compare_parser.add_argument("--answer", required=True, help="LLM-produced answer text")

    ns = parser.parse_args(argv)

    if ns.command == "generate-question":
        claim_text = sys.stdin.read().strip()
        if not claim_text:
            print("cove: no claim text received on stdin", file=sys.stderr)
            return 1
        payload = generate_question(claim_text)
        json.dump(payload, sys.stdout, ensure_ascii=False)
        sys.stdout.write("\n")
        return 0

    if ns.command == "compare":
        payload = compare(ns.claim, ns.answer)
        json.dump(payload, sys.stdout, ensure_ascii=False)
        sys.stdout.write("\n")
        return 0

    # argparse with required=True guarantees we never reach here, but keep
    # an explicit fallback rather than an implicit ``None`` return.
    print(f"cove: unknown command {ns.command!r}", file=sys.stderr)
    return 1


# --- Internal helpers --------------------------------------------------------


def _unique_in_order(items: object) -> list[str]:
    """Deduplicate while preserving first-occurrence order."""
    seen: set[str] = set()
    out: list[str] = []
    for item in items:  # type: ignore[misc]
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def _extract_entities(text: str) -> list[str]:
    """Best-effort proper-noun extraction.

    Filters out sentence-initial capitalization of generic English words
    (``The``, ``This``, ``According``, ...) which are nearly always
    false positives for our template.
    """
    found: list[str] = []
    for match in _PROPER_NOUN_RE.finditer(text):
        token = match.group(1)
        if token in _NON_ENTITY_CAPITALIZED:
            continue
        # Drop sentence-initial capitalized words only if the previous
        # character is a sentence boundary or the very start of the string.
        idx = match.start()
        if idx == 0 and token in _NON_ENTITY_CAPITALIZED:
            continue
        found.append(token)
    return _unique_in_order(found)


def _snippet(text: str, max_len: int = 160) -> str:
    """Return a single-line, length-capped version of ``text``."""
    collapsed = " ".join(text.split())
    if len(collapsed) <= max_len:
        return collapsed
    return collapsed[: max_len - 1].rstrip() + "…"


def _fmt_set(values: set[str]) -> str:
    """Render a set of anchor strings deterministically for reasons strings."""
    if not values:
        return "∅"
    if len(values) == 1:
        return next(iter(values))
    return ", ".join(sorted(values))


def _verdict(
    verdict: str,
    reason: str,
    claim_anchors: AnchorSet,
    answer_anchors: AnchorSet,
) -> dict[str, object]:
    """Assemble the compare-mode JSON payload."""
    return {
        "verdict": verdict,
        "reason": reason,
        "claim_anchors": dict(claim_anchors),
        "answer_anchors": dict(answer_anchors),
    }


if __name__ == "__main__":
    raise SystemExit(main())
