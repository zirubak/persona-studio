"""Tests for the verify_claims CLI used by simulate-* commands."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest


def _run_cli(args: list[str], cwd: Path, input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "persona_studio.grounding.verify_claims", *args],
        cwd=cwd,
        input=input_text,
        capture_output=True,
        text=True,
        env=None,
    )


@pytest.fixture
def persona_dir(tmp_path: Path) -> Path:
    """Minimal persona with corpus for CLI tests."""
    persona = tmp_path / "data" / "people" / "alice" / "extracted"
    persona.mkdir(parents=True)
    (persona / "corpus.md").write_text(
        "# corpus\n"
        "Alice founded Acme in 2015.\n"
        "She raised $10M Series A in 2018.\n",
        encoding="utf-8",
    )
    return tmp_path


class TestVerifyClaimsCli:
    def test_emits_json_list(self, persona_dir: Path) -> None:
        text = (
            "Alice founded Acme in 2015. "
            "She raised $10M Series A in 2018. "
            "I think she's brilliant."
        )
        result = _run_cli(
            ["--persona", "alice", "--topic", "Acme funding"],
            cwd=persona_dir,
            input_text=text,
        )
        assert result.returncode == 0, result.stderr
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        # 2 fact assertions + 1 opinion expected.
        assert len(data) >= 2

    def test_json_item_has_required_fields(self, persona_dir: Path) -> None:
        text = "Alice founded Acme in 2015."
        result = _run_cli(
            ["--persona", "alice", "--topic", "Acme"],
            cwd=persona_dir,
            input_text=text,
        )
        data = json.loads(result.stdout)
        assert data
        item = data[0]
        for field in ("text", "kind", "is_high_risk", "status", "citation", "score"):
            assert field in item

    def test_supported_claim_has_citation(self, persona_dir: Path) -> None:
        text = "Alice founded Acme in 2015."
        result = _run_cli(
            ["--persona", "alice", "--topic", "Acme"],
            cwd=persona_dir,
            input_text=text,
        )
        data = json.loads(result.stdout)
        supported = [d for d in data if d["status"] == "supported"]
        assert supported
        assert supported[0]["citation"] is not None
        assert "corpus.md" in supported[0]["citation"]

    def test_unverifiable_has_null_citation(self, persona_dir: Path) -> None:
        text = "75% of developers prefer dark mode in 2024."
        result = _run_cli(
            ["--persona", "alice", "--topic", "developer preferences"],
            cwd=persona_dir,
            input_text=text,
        )
        data = json.loads(result.stdout)
        unv = [d for d in data if d["status"] == "unverifiable"]
        assert unv
        assert unv[0]["citation"] is None

    def test_unknown_persona_returns_empty_list(self, tmp_path: Path) -> None:
        result = _run_cli(
            ["--persona", "nobody", "--topic", "anything"],
            cwd=tmp_path,
            input_text="Something happened in 2020.",
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        # All claims return UNVERIFIABLE with no evidence.
        assert isinstance(data, list)
        for item in data:
            assert item["status"] in ("unverifiable", "opinion", "narrative")

    def test_missing_persona_arg_exits_nonzero(self, persona_dir: Path) -> None:
        result = _run_cli(["--topic", "x"], cwd=persona_dir, input_text="hi")
        assert result.returncode != 0

    def test_only_high_risk_flag_filters_output(self, persona_dir: Path) -> None:
        """--only-high-risk limits output to claims flagged is_high_risk=True."""
        text = (
            "Alice founded Acme in 2015. "
            "She likes coffee in the morning."
        )
        result = _run_cli(
            ["--persona", "alice", "--topic", "Acme", "--only-high-risk"],
            cwd=persona_dir,
            input_text=text,
        )
        data = json.loads(result.stdout)
        for item in data:
            assert item["is_high_risk"] is True
