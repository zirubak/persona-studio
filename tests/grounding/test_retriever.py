"""Tests for persona_studio.grounding.retriever."""
from __future__ import annotations

from pathlib import Path

import pytest

from persona_studio.grounding import EvidenceChunk
from persona_studio.grounding.retriever import (
    Retriever,
    find_persona_data_dir,
    retrieve_evidence,
)


@pytest.fixture
def project_persona(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Create a minimal project-local persona with corpus + perplexity notes."""
    monkeypatch.chdir(tmp_path)
    persona_dir = tmp_path / "data" / "people" / "alice" / "extracted"
    persona_dir.mkdir(parents=True)
    (persona_dir / "corpus.md").write_text(
        "# corpus\n"
        "## interview_transcript\n"
        "Alice founded Acme in 2015 after leaving BigCo.\n"
        "Her main product is a CRM tool for dentists.\n"
        "She raised $10M Series A in 2018.\n"
        "\n"
        "## blog_post\n"
        "I think remote work is overrated for junior engineers.\n",
        encoding="utf-8",
    )
    (persona_dir / "perplexity_notes.md").write_text(
        "# perplexity notes\n"
        "Query: remote work productivity studies 2024\n"
        "Source: https://example.com/study\n"
        "Studies show 15% productivity drop for juniors when fully remote.\n",
        encoding="utf-8",
    )
    return tmp_path


@pytest.fixture
def global_persona(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Create a minimal global-home persona (Celebrity mode target)."""
    monkeypatch.chdir(tmp_path)
    fake_home = tmp_path / "fake_home"
    monkeypatch.setenv("HOME", str(fake_home))
    persona_dir = fake_home / ".persona-studio" / "data" / "people" / "bob" / "extracted"
    persona_dir.mkdir(parents=True)
    (persona_dir / "corpus.md").write_text(
        "# corpus\n"
        "Bob won the 2019 Nobel prize in literature for his novel 'Clouds'.\n"
        "He is from Chile.\n",
        encoding="utf-8",
    )
    # Intentionally NO perplexity_notes.md — retriever must tolerate this.
    return tmp_path


class TestFindPersonaDataDir:
    def test_project_local_wins(self, project_persona: Path) -> None:
        """Project-local persona resolves to ./data/people/<name>/."""
        found = find_persona_data_dir("alice")
        assert found is not None
        assert found == project_persona / "data" / "people" / "alice"

    def test_global_fallback(self, global_persona: Path) -> None:
        """When no project persona, global home resolves."""
        found = find_persona_data_dir("bob")
        assert found is not None
        assert ".persona-studio" in found.parts

    def test_project_priority_on_conflict(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Same name in both scopes → project wins."""
        monkeypatch.chdir(tmp_path)
        fake_home = tmp_path / "fake_home"
        monkeypatch.setenv("HOME", str(fake_home))
        (tmp_path / "data" / "people" / "eve" / "extracted").mkdir(parents=True)
        (fake_home / ".persona-studio" / "data" / "people" / "eve" / "extracted").mkdir(
            parents=True
        )
        found = find_persona_data_dir("eve")
        assert found is not None
        assert ".persona-studio" not in found.parts

    def test_missing_persona_returns_none(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))
        assert find_persona_data_dir("nobody") is None


class TestRetrieveEvidence:
    def test_returns_chunks_matching_topic_keywords(
        self, project_persona: Path
    ) -> None:
        chunks = retrieve_evidence("alice", topic="Series A funding", k=5)
        assert len(chunks) > 0
        assert all(isinstance(c, EvidenceChunk) for c in chunks)
        # The "Series A in 2018" line must match.
        assert any("Series A" in c.text or "$10M" in c.text for c in chunks)

    def test_includes_source_line_range(self, project_persona: Path) -> None:
        chunks = retrieve_evidence("alice", topic="Acme founding", k=3)
        assert chunks
        first = chunks[0]
        assert first.line_start >= 1
        assert first.line_end >= first.line_start
        assert first.source in ("corpus.md", "perplexity_notes.md")

    def test_respects_k_limit(self, project_persona: Path) -> None:
        chunks = retrieve_evidence("alice", topic="the", k=2)
        assert len(chunks) <= 2

    def test_empty_topic_returns_empty(self, project_persona: Path) -> None:
        assert retrieve_evidence("alice", topic="", k=5) == []

    def test_missing_persona_returns_empty(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))
        assert retrieve_evidence("nobody", topic="anything", k=5) == []

    def test_missing_perplexity_notes_tolerated(self, global_persona: Path) -> None:
        """bob has corpus.md but NO perplexity_notes.md — must not crash."""
        chunks = retrieve_evidence("bob", topic="Nobel prize", k=5)
        assert len(chunks) > 0
        assert all(c.source == "corpus.md" for c in chunks)

    def test_chunks_sorted_by_score_desc(self, project_persona: Path) -> None:
        chunks = retrieve_evidence("alice", topic="remote work productivity", k=10)
        scores = [c.score for c in chunks]
        assert scores == sorted(scores, reverse=True)

    def test_chunks_include_persona_name(self, project_persona: Path) -> None:
        chunks = retrieve_evidence("alice", topic="Acme", k=1)
        assert chunks
        assert chunks[0].persona == "alice"


class TestRetrieverProtocol:
    def test_protocol_has_retrieve_method(self) -> None:
        """Retriever protocol allows pluggable backends (future embeddings)."""
        # Verify that any object with retrieve(persona, topic, k) -> list conforms.

        class FakeRetriever:
            def retrieve(
                self, persona: str, topic: str, k: int
            ) -> list[EvidenceChunk]:
                return []

        fake: Retriever = FakeRetriever()
        assert fake.retrieve("x", "y", 3) == []
