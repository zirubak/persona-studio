"""Tests for persona_studio.grounding.audit."""
from __future__ import annotations

from pathlib import Path

import pytest

from persona_studio.grounding.audit import (
    AuditReport,
    AvatarStat,
    audit_transcript,
    render_audit_section,
)


@pytest.fixture
def sample_persona(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Create a project-local persona with corpus containing known facts."""
    monkeypatch.chdir(tmp_path)
    ext = tmp_path / "data" / "people" / "alice" / "extracted"
    ext.mkdir(parents=True)
    (ext / "corpus.md").write_text(
        "# corpus\n"
        "Alice founded Acme in 2015.\n"
        "She raised $10M Series A in 2018.\n",
        encoding="utf-8",
    )
    return tmp_path


@pytest.fixture
def transcript_with_claims(sample_persona: Path) -> Path:
    """Write a minimal simulate-debate transcript against the alice persona."""
    sim = sample_persona / "simulations"
    sim.mkdir()
    path = sim / "2026-04-21T00-00_debate_startup.md"
    path.write_text(
        "---\n"
        "kind: debate\n"
        "topic: Startup funding rounds\n"
        "participants: [alice]\n"
        "rounds: 2\n"
        "generated: 2026-04-21T00:00\n"
        "---\n"
        "\n"
        "# Transcript\n"
        "\n"
        "## Round 1\n"
        "### alice\n"
        "> Alice founded Acme in 2015. She raised $10M Series A in 2018.\n"
        "\n"
        "## Round 2\n"
        "### alice\n"
        "> 75% of developers use dark mode. I think it matters.\n"
        "\n"
        "## Conclusion\n"
        "The round was informative.\n",
        encoding="utf-8",
    )
    return path


class TestAuditTranscript:
    def test_returns_audit_report(self, transcript_with_claims: Path) -> None:
        report = audit_transcript(transcript_with_claims)
        assert isinstance(report, AuditReport)
        assert "alice" in report.avatars

    def test_avatar_stat_counts(self, transcript_with_claims: Path) -> None:
        report = audit_transcript(transcript_with_claims)
        alice: AvatarStat = report.avatars["alice"]
        assert alice.total_claims >= 2
        assert alice.supported >= 1
        assert 0.0 <= alice.grounding_score <= 10.0

    def test_appends_section_idempotent(
        self, transcript_with_claims: Path
    ) -> None:
        audit_transcript(transcript_with_claims)
        content_after_first = transcript_with_claims.read_text(encoding="utf-8")
        audit_transcript(transcript_with_claims)
        content_after_second = transcript_with_claims.read_text(encoding="utf-8")
        assert content_after_first == content_after_second

    def test_section_header_present(self, transcript_with_claims: Path) -> None:
        audit_transcript(transcript_with_claims)
        content = transcript_with_claims.read_text(encoding="utf-8")
        assert "## Factual Grounding" in content

    def test_unknown_transcript_path_raises(self, tmp_path: Path) -> None:
        with pytest.raises(FileNotFoundError):
            audit_transcript(tmp_path / "nonexistent.md")

    def test_no_participants_returns_empty_report(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        path = tmp_path / "empty.md"
        path.write_text(
            "---\nkind: debate\nparticipants: []\n---\n# Empty\n",
            encoding="utf-8",
        )
        report = audit_transcript(path)
        assert report.avatars == {}


class TestRenderAuditSection:
    def test_rendered_section_has_required_headings(self) -> None:
        report = AuditReport(
            avatars={
                "alice": AvatarStat(
                    total_claims=4,
                    supported=3,
                    unsupported=1,
                    unverifiable=0,
                    grounding_score=7.5,
                    top_unsupported=["Claim X", "Claim Y"],
                )
            }
        )
        out = render_audit_section(report)
        assert out.startswith("## Factual Grounding")
        assert "alice" in out
        assert "7.5" in out or "7.50" in out
        assert "Claim X" in out
