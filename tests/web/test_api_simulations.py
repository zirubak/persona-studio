"""TDD Unit 2: list_simulations() helper.

Walks ``./simulations/**/*.md``, parses frontmatter plus the optional
``## Factual Grounding`` table, returns records newest-first. Tolerates
missing directory and malformed transcripts.

Per the Phase 1 plan, this intentionally does NOT reuse
``grounding.audit._parse_topic`` / ``_collect_avatar_quotes``. Those are
underscore-private, and ``audit_transcript()`` mutates files. A
frontmatter-only parser inlined here stays read-only.
"""
from __future__ import annotations

from pathlib import Path
from textwrap import dedent

import pytest


def _write_sim(
    dir_: Path,
    filename: str,
    *,
    kind: str = "debate",
    topic: str = "Sample topic",
    participants: list[str] | None = None,
    generated: str = "2026-04-23T10:00:00+00:00",
    body: str = "",
    grounding_table: str = "",
) -> None:
    dir_.mkdir(parents=True, exist_ok=True)
    parts = participants or ["alice", "bob"]
    fm = dedent(
        f"""\
        ---
        kind: {kind}
        topic: {topic}
        participants: [{", ".join(parts)}]
        generated: {generated}
        ---
        """
    )
    (dir_ / filename).write_text(fm + body + grounding_table, encoding="utf-8")


class TestListSimulationsBasic:
    def test_returns_empty_when_simulations_dir_missing(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        # Do NOT create simulations/.
        assert list_simulations() == []

    def test_returns_empty_when_simulations_dir_empty(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        (tmp_path / "simulations").mkdir()
        assert list_simulations() == []

    def test_parses_frontmatter_fields(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        _write_sim(
            tmp_path / "simulations",
            "s1.md",
            kind="debate",
            topic="Are design docs a waste of time?",
            participants=["sample_private", "paul_graham"],
            generated="2026-04-21T17:15:00+00:00",
        )

        result = list_simulations()
        assert len(result) == 1
        sim = result[0]
        assert sim["kind"] == "debate"
        assert sim["topic"] == "Are design docs a waste of time?"
        assert sim["participants"] == ["sample_private", "paul_graham"]
        assert sim["generated"] == "2026-04-21T17:15:00+00:00"

    def test_id_is_path_relative_to_simulations(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """id should be a stable identifier derived from the file path."""
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        _write_sim(tmp_path / "simulations" / "topic-slug", "2026-04-21_debate.md")

        result = list_simulations()
        assert len(result) == 1
        # Path relative to simulations/ as identifier
        assert result[0]["id"] == "topic-slug/2026-04-21_debate.md"

    def test_walks_subdirectories_recursively(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """simulations/<topic-slug>/<ts>.md structure is the canonical layout."""
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        _write_sim(tmp_path / "simulations" / "topic-a", "s1.md", topic="A")
        _write_sim(tmp_path / "simulations" / "topic-b", "s2.md", topic="B")
        _write_sim(tmp_path / "simulations" / "topic-a" / "iter-1", "s3.md", topic="A-iter1")

        result = list_simulations()
        topics = {s["topic"] for s in result}
        assert topics == {"A", "B", "A-iter1"}


class TestListSimulationsOrdering:
    def test_returns_newest_first(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        sim_dir = tmp_path / "simulations"
        _write_sim(sim_dir, "old.md", topic="Old", generated="2026-01-01T00:00:00+00:00")
        _write_sim(sim_dir, "new.md", topic="New", generated="2026-04-23T00:00:00+00:00")
        _write_sim(sim_dir, "mid.md", topic="Mid", generated="2026-03-15T00:00:00+00:00")

        result = list_simulations()
        topics_in_order = [s["topic"] for s in result]
        assert topics_in_order == ["New", "Mid", "Old"]

    def test_missing_generated_field_sorts_last(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Transcripts without a generated timestamp sort after dated ones."""
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        sim_dir = tmp_path / "simulations"
        _write_sim(sim_dir, "dated.md", generated="2026-04-23T00:00:00+00:00")
        # A transcript with no `generated:` field (intentionally missing)
        (sim_dir / "no_date.md").write_text(
            "---\nkind: debate\ntopic: Undated\nparticipants: [x]\n---\n",
            encoding="utf-8",
        )
        result = list_simulations()
        assert len(result) == 2
        assert result[0]["topic"] != "Undated"  # dated wins


class TestListSimulationsScoring:
    """Parse the ## Factual Grounding table when present; otherwise score=None."""

    def test_no_factual_grounding_section_score_is_none(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        _write_sim(tmp_path / "simulations", "s.md", body="# Transcript\n...\n")

        result = list_simulations()
        assert result[0]["score"] is None

    def test_factual_grounding_average_across_avatars(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        table = dedent(
            """

            ## Factual Grounding

            | Avatar | Total | Supported | Unsupported | Unverifiable | External-verified | External-unverified | Score |
            | --- | --- | --- | --- | --- | --- | --- | --- |
            | paul_graham | 6 | 0 | 0 | 4 | 2 | 0 | 3.33 |
            | sample_private | 5 | 5 | 0 | 0 | 0 | 0 | 10.00 |
            """
        )
        _write_sim(tmp_path / "simulations", "s.md", grounding_table=table)

        result = list_simulations()
        # Average of 3.33 and 10.00 = 6.665 — implementation must round or truncate; accept either.
        assert 6.5 <= result[0]["score"] <= 6.7

    def test_factual_grounding_single_avatar_score(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        table = dedent(
            """

            ## Factual Grounding

            | Avatar | Total | Supported | Unsupported | Unverifiable | External-verified | External-unverified | Score |
            | --- | --- | --- | --- | --- | --- | --- | --- |
            | alice | 3 | 3 | 0 | 0 | 0 | 0 | 10.00 |
            """
        )
        _write_sim(tmp_path / "simulations", "s.md", grounding_table=table)

        result = list_simulations()
        assert result[0]["score"] == 10.0

    def test_malformed_grounding_table_score_is_none(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Broken table rows → don't raise, score=None."""
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        bad = dedent(
            """

            ## Factual Grounding

            something went wrong, no table here
            """
        )
        _write_sim(tmp_path / "simulations", "s.md", grounding_table=bad)

        result = list_simulations()
        assert result[0]["score"] is None


class TestListSimulationsTolerance:
    def test_unreadable_file_skipped_not_raise(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A transcript with no frontmatter at all should not crash the list."""
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        sim_dir = tmp_path / "simulations"
        sim_dir.mkdir()
        (sim_dir / "no_frontmatter.md").write_text(
            "Just prose, no frontmatter.\n", encoding="utf-8"
        )
        _write_sim(sim_dir, "good.md", topic="valid")

        result = list_simulations()
        topics = {s["topic"] for s in result}
        assert "valid" in topics
        # no_frontmatter.md either skipped or included with filename-stem fallback —
        # either is acceptable; what matters is no exception.

    def test_malformed_yaml_frontmatter_does_not_raise(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.simulations import list_simulations

        monkeypatch.chdir(tmp_path)
        sim_dir = tmp_path / "simulations"
        sim_dir.mkdir()
        (sim_dir / "broken.md").write_text(
            "---\nkind: [\n---\nBody\n", encoding="utf-8"
        )
        # Must not raise; result may or may not include broken.md.
        list_simulations()
