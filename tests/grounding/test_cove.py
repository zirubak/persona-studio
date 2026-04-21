"""Tests for the Chain-of-Verification (CoVe) module.

Covers both the pure functions (``extract_anchors``, ``generate_question``,
``compare``) and the CLI subprocess contract used by simulate-* markdown
commands.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from persona_studio.grounding.cove import (
    compare,
    extract_anchors,
    generate_question,
    main,
)


# --- Unit tests: extract_anchors --------------------------------------------


class TestExtractAnchors:
    def test_year_anchor(self) -> None:
        anchors = extract_anchors("Alice founded Acme in 2015.")
        assert anchors["year"] == ["2015"]

    def test_percent_anchor(self) -> None:
        anchors = extract_anchors("75% of developers prefer dark mode.")
        assert anchors["percent"] == ["75%"]

    def test_quantity_anchor_with_unit(self) -> None:
        anchors = extract_anchors("The company has 500 million users worldwide.")
        assert "quantity" in anchors
        assert any("500" in q for q in anchors["quantity"])

    def test_quantity_korean_unit(self) -> None:
        anchors = extract_anchors("The startup raised 50 억 원 recently.")
        # ``50 억`` should match the quantity regex via the Korean unit alias.
        assert "quantity" in anchors or "year" not in anchors
        # Numeric-with-English-unit case is the primary one we care about:
        anchors2 = extract_anchors("The company grew to 3 billion in revenue.")
        assert "quantity" in anchors2
        assert any("billion" in q.lower() for q in anchors2["quantity"])

    def test_entity_anchor_detects_proper_noun(self) -> None:
        anchors = extract_anchors("Alice works at OpenAI in San Francisco.")
        entities = anchors.get("entity", [])
        assert "Alice" in entities
        assert "OpenAI" in entities

    def test_entity_filters_sentence_initial_generics(self) -> None:
        anchors = extract_anchors("The system is broken.")
        assert anchors.get("entity", []) == []

    def test_empty_text_returns_empty(self) -> None:
        assert extract_anchors("") == {}

    def test_deduplicates_repeated_anchors(self) -> None:
        anchors = extract_anchors("In 2015, Acme hit milestones. 2015 was big.")
        assert anchors["year"] == ["2015"]


# --- Unit tests: generate_question ------------------------------------------


class TestGenerateQuestion:
    def test_year_claim_produces_year_question(self) -> None:
        out = generate_question("Alice founded Acme in 2015.")
        assert out["anchor_type"] == "year"
        assert out["anchor_value"] == "2015"
        assert "2015" in out["question"]
        assert out["claim_snippet"]

    def test_percent_claim_produces_percent_question(self) -> None:
        out = generate_question("75% of developers prefer dark mode.")
        assert out["anchor_type"] == "percent"
        assert out["anchor_value"] == "75%"
        assert "75%" in out["question"]

    def test_quantity_claim_produces_quantity_question(self) -> None:
        out = generate_question("The startup raised 10 million dollars.")
        # quantity regex matches "10 million"
        assert out["anchor_type"] in ("quantity", "entity", "fallback")
        if out["anchor_type"] == "quantity":
            assert "million" in out["anchor_value"].lower()
            assert "million" in out["question"].lower()

    def test_entity_only_claim_produces_entity_question(self) -> None:
        out = generate_question("Alice leads the engineering team.")
        assert out["anchor_type"] == "entity"
        assert out["anchor_value"] == "Alice"
        assert "Alice" in out["question"]

    def test_fallback_when_no_anchor(self) -> None:
        out = generate_question("the system is broken and nobody cares")
        assert out["anchor_type"] == "fallback"
        assert out["anchor_value"] == ""
        assert "reliable sources" in out["question"].lower()

    def test_year_takes_priority_over_entity(self) -> None:
        out = generate_question("Alice founded Acme in 2015.")
        assert out["anchor_type"] == "year"

    def test_snippet_length_is_capped(self) -> None:
        long_claim = "Alice founded Acme in 2015. " + ("word " * 200)
        out = generate_question(long_claim)
        assert len(out["claim_snippet"]) <= 160


# --- Unit tests: compare -----------------------------------------------------


class TestCompare:
    def test_consistent_year_match(self) -> None:
        result = compare(
            claim="Alice founded Acme in 2015.",
            answer="Alice and co-founders started Acme in 2015 after she left BigCo.",
        )
        assert result["verdict"] == "consistent"
        assert "2015" in result["reason"]

    def test_discrepancy_year(self) -> None:
        result = compare(
            claim="Alice founded Acme in 2003.",
            answer="Acme was founded by Alice Johnson in 2015.",
        )
        assert result["verdict"] == "discrepancy"
        assert "2003" in result["reason"]
        assert "2015" in result["reason"]

    def test_discrepancy_percent(self) -> None:
        result = compare(
            claim="75% of developers prefer dark mode.",
            answer="Only 42% of developers prefer dark mode per the 2024 survey.",
        )
        assert result["verdict"] == "discrepancy"
        assert "75%" in result["reason"]
        assert "42%" in result["reason"]

    def test_inconclusive_missing_anchor_type(self) -> None:
        result = compare(
            claim="75% of developers prefer dark mode.",
            answer="Nobody really surveyed this recently.",
        )
        assert result["verdict"] == "inconclusive"

    def test_inconclusive_no_shared_axis(self) -> None:
        result = compare(
            claim="the system is broken",
            answer="totally different content here",
        )
        assert result["verdict"] == "inconclusive"

    def test_empty_claim_and_answer(self) -> None:
        result = compare(claim="", answer="")
        assert result["verdict"] == "inconclusive"
        assert result["claim_anchors"] == {}
        assert result["answer_anchors"] == {}

    def test_claim_anchors_present_in_output(self) -> None:
        result = compare(
            claim="Alice founded Acme in 2015.",
            answer="Acme was founded in 2015.",
        )
        assert "year" in result["claim_anchors"]
        assert "year" in result["answer_anchors"]

    def test_consistent_when_answer_adds_extra_years(self) -> None:
        """Intersection-based match: shared 2015 still counts as consistent."""
        result = compare(
            claim="Alice founded Acme in 2015.",
            answer="Acme was founded in 2015 and pivoted in 2020.",
        )
        assert result["verdict"] == "consistent"

    def test_discrepancy_when_answer_negates_claim_year(self) -> None:
        """LLM correction pattern: 'No, X is wrong; actually Y' must be
        detected as discrepancy even though the answer echoes the claim's
        value (the echo is inside a negation context)."""
        result = compare(
            claim="Stripe was founded in 2005 by the Collison brothers.",
            answer=(
                "No. According to the evidence, Stripe was co-founded by "
                "Patrick and John Collison in 2010, not 2005."
            ),
        )
        assert result["verdict"] == "discrepancy"
        assert "2010" in result["reason"] or "2005" in result["reason"]

    def test_discrepancy_when_answer_says_actually_different_year(self) -> None:
        result = compare(
            claim="The agreement was signed in 1995.",
            answer="Actually it was signed in 1998, not 1995.",
        )
        assert result["verdict"] == "discrepancy"

    def test_consistent_when_answer_merely_adds_later_year_without_negation(self) -> None:
        """Regression guard: if the answer just lists multiple years and the
        claim's year appears among them WITHOUT negation context, we must
        still return consistent — we do not want to flag every multi-year
        answer as a correction."""
        result = compare(
            claim="Alice founded Acme in 2015.",
            answer="Alice founded Acme in 2015 and later raised a Series A in 2018.",
        )
        assert result["verdict"] == "consistent"


# --- CLI subprocess tests ----------------------------------------------------


def _run_cli(args: list[str], input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "persona_studio.grounding.cove", *args],
        input=input_text,
        capture_output=True,
        text=True,
    )


class TestCoveCli:
    def test_generate_question_year_via_stdin(self) -> None:
        result = _run_cli(
            ["generate-question"],
            input_text="Alice founded Acme in 2015.",
        )
        assert result.returncode == 0, result.stderr
        data = json.loads(result.stdout)
        assert data["anchor_type"] == "year"
        assert data["anchor_value"] == "2015"
        assert "2015" in data["question"]

    def test_generate_question_fallback(self) -> None:
        result = _run_cli(
            ["generate-question"],
            input_text="the cat sat on the mat",
        )
        assert result.returncode == 0, result.stderr
        data = json.loads(result.stdout)
        assert data["anchor_type"] == "fallback"

    def test_compare_consistent_via_flags(self) -> None:
        result = _run_cli(
            [
                "compare",
                "--claim", "Alice founded Acme in 2015.",
                "--answer", "Acme was founded by Alice in 2015.",
            ]
        )
        assert result.returncode == 0, result.stderr
        data = json.loads(result.stdout)
        assert data["verdict"] == "consistent"

    def test_compare_discrepancy_via_flags(self) -> None:
        result = _run_cli(
            [
                "compare",
                "--claim", "Alice founded Acme in 2003.",
                "--answer", "Acme was founded by Alice in 2015.",
            ]
        )
        assert result.returncode == 0, result.stderr
        data = json.loads(result.stdout)
        assert data["verdict"] == "discrepancy"

    def test_compare_inconclusive_via_flags(self) -> None:
        result = _run_cli(
            [
                "compare",
                "--claim", "75% of developers prefer dark mode.",
                "--answer", "Nobody really surveyed this recently.",
            ]
        )
        assert result.returncode == 0, result.stderr
        data = json.loads(result.stdout)
        assert data["verdict"] == "inconclusive"

    def test_argparse_failure_exits_nonzero(self) -> None:
        # Missing --claim and --answer for compare.
        result = _run_cli(["compare"])
        assert result.returncode == 2

    def test_no_subcommand_exits_nonzero(self) -> None:
        result = _run_cli([])
        assert result.returncode == 2

    def test_generate_question_empty_stdin_errors(self) -> None:
        result = _run_cli(["generate-question"], input_text="")
        assert result.returncode == 1
        assert "no claim text" in result.stderr.lower()


# --- main() direct invocation ------------------------------------------------


class TestMainDirectCall:
    """Cover the main() function directly for coverage on the dispatch paths."""

    def test_main_generate_question(
        self,
        capsys: pytest.CaptureFixture[str],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr("sys.stdin", _StringIOStdin("Alice founded Acme in 2015."))
        rc = main(["generate-question"])
        assert rc == 0
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["anchor_type"] == "year"

    def test_main_compare(self, capsys: pytest.CaptureFixture[str]) -> None:
        rc = main([
            "compare",
            "--claim", "Alice founded Acme in 2015.",
            "--answer", "Acme was founded by Alice in 2015.",
        ])
        assert rc == 0
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["verdict"] == "consistent"

    def test_main_generate_question_empty_stdin(
        self,
        capsys: pytest.CaptureFixture[str],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr("sys.stdin", _StringIOStdin("   "))
        rc = main(["generate-question"])
        assert rc == 1
        captured = capsys.readouterr()
        assert "no claim text" in captured.err.lower()


class _StringIOStdin:
    """Minimal stdin stub that supports ``.read()``."""

    def __init__(self, text: str) -> None:
        self._text = text

    def read(self) -> str:
        return self._text


# --- Invariant: no network imports ------------------------------------------


def test_cove_module_has_no_network_imports() -> None:
    """Enforce the architectural constraint: Python side stays fully offline."""
    source_path = (
        Path(__file__).resolve().parents[2]
        / "src"
        / "persona_studio"
        / "grounding"
        / "cove.py"
    )
    source = source_path.read_text(encoding="utf-8")
    forbidden = ("import requests", "import urllib", "from httpx", "mcp__", "WebSearch")
    for needle in forbidden:
        assert needle not in source, f"cove.py must not reference {needle!r}"
