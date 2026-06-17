"""TDD Cycle 1–3: list_personas() + frontmatter tolerance.

Per the Phase 1 plan, `list_personas()` globs both project-local
`./personas/*.md` and global `$HOME/.persona-studio/personas/*.md`,
dedupes by filename stem with project-local winning on collision, and
returns records shaped for the web UI with defensible fallbacks.

Route D in commands/studio.md (lines 116-129) is the canonical
algorithm — this module is that prose ported to Python.
"""
from __future__ import annotations

from pathlib import Path

import pytest


def _write_persona(dir_: Path, stem: str, frontmatter: str, body: str = "") -> None:
    dir_.mkdir(parents=True, exist_ok=True)
    (dir_ / f"{stem}.md").write_text(
        f"---\n{frontmatter}\n---\n{body}", encoding="utf-8"
    )


class TestListPersonasDualScope:
    def test_project_and_global_both_appear(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Personas from both scopes appear in the combined result."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(tmp_path / "personas", "alice", "name: alice", "# Background\nAlice is local.")
        _write_persona(
            tmp_path / "fake_home" / ".persona-studio" / "personas",
            "bob",
            "name: bob",
            "# Background\nBob is global.",
        )

        result = list_personas()
        names = {p["name"] for p in result}
        scopes = {p["name"]: p["scope"] for p in result}

        assert names == {"alice", "bob"}
        assert scopes["alice"] == "project"
        assert scopes["bob"] == "global"

    def test_project_priority_on_name_collision(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Same filename stem in both scopes → project wins, global hidden."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(
            tmp_path / "personas", "eve",
            "name: eve\nprimary_role: project-eve",
        )
        _write_persona(
            tmp_path / "fake_home" / ".persona-studio" / "personas", "eve",
            "name: eve\nprimary_role: global-eve",
        )

        result = list_personas()
        eves = [p for p in result if p["name"] == "eve"]

        assert len(eves) == 1, "dedup failed: duplicate eve entries"
        assert eves[0]["scope"] == "project"
        assert eves[0]["role"] == "project-eve"

    def test_empty_both_scopes_returns_empty_list(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """No personas in either scope → [], not raise."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        result = list_personas()
        assert result == []

    def test_missing_directories_tolerated(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Neither ./personas/ nor global ~/.persona-studio/personas/ exists."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "nowhere"))
        # Do NOT create any dirs.

        result = list_personas()
        assert result == []


class TestFrontmatterTolerance:
    def test_missing_frontmatter_no_background_uses_filename_defaults(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Persona file with neither frontmatter nor Background → empty role."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        (tmp_path / "personas").mkdir()
        (tmp_path / "personas" / "charlie.md").write_text(
            "Just a body, no frontmatter, no Background section.\n",
            encoding="utf-8",
        )

        result = list_personas()
        charlie = next(p for p in result if p["name"] == "charlie")
        assert charlie["scope"] == "project"
        assert charlie["role"] == ""
        assert charlie["mode"] == "public"

    def test_missing_frontmatter_with_background_uses_body(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """No frontmatter but Background section exists → role from body."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        (tmp_path / "personas").mkdir()
        (tmp_path / "personas" / "charlie.md").write_text(
            "# Background\nJust a body, no frontmatter.\n", encoding="utf-8"
        )

        result = list_personas()
        charlie = next(p for p in result if p["name"] == "charlie")
        assert charlie["role"] == "Just a body, no frontmatter."

    def test_malformed_yaml_does_not_raise(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Broken YAML frontmatter → no 500, frontmatter-field defaults apply.

        The spec path for role is ``primary_role`` > ``# Background`` first line
        > ``""``. A broken YAML frontmatter invalidates the first clause only;
        the Background body parse still runs independently. This test locks
        the NO-RAISE invariant plus the default ``mode`` fallback — those are
        the real concerns behind "malformed YAML" tolerance. The Background
        fallback for ``role`` is verified separately in
        ``test_missing_frontmatter_with_background_uses_body``.
        """
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        (tmp_path / "personas").mkdir()
        # Open bracket never closed; no Background so role resolves to "".
        (tmp_path / "personas" / "broken.md").write_text(
            "---\nname: [\n---\ntext without a Background heading\n",
            encoding="utf-8",
        )

        result = list_personas()  # must not raise
        broken = next(p for p in result if p["name"] == "broken")
        assert broken["role"] == ""
        assert broken["mode"] == "public"

    def test_primary_role_populates_role_field(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """If frontmatter has `primary_role`, surface as `role`."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(
            tmp_path / "personas", "dhh",
            "name: dhh\nprimary_role: Rails creator",
        )

        result = list_personas()
        dhh = next(p for p in result if p["name"] == "dhh")
        assert dhh["role"] == "Rails creator"

    def test_background_first_line_used_when_no_primary_role(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Fall back to first line of # Background section for role."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(
            tmp_path / "personas", "nn",
            "name: nn",
            "# Background\nFirst-line description of NN.\nSecond line should be ignored.",
        )

        result = list_personas()
        nn = next(p for p in result if p["name"] == "nn")
        assert nn["role"] == "First-line description of NN."

    def test_hue_is_deterministic(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """hue must be stable across reloads — same name → same hue."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(tmp_path / "personas", "stable", "name: stable")

        r1 = list_personas()
        r2 = list_personas()
        assert r1[0]["hue"] == r2[0]["hue"]
        assert 0 <= r1[0]["hue"] < 360

    def test_mode_defaults_to_public(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """If frontmatter doesn't set mode, default to 'public'."""
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(tmp_path / "personas", "nomode", "name: nomode")

        result = list_personas()
        assert result[0]["mode"] == "public"

    def test_mode_private_preserved(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.personas import list_personas

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        _write_persona(tmp_path / "personas", "priv", "name: priv\nmode: private")

        result = list_personas()
        assert result[0]["mode"] == "private"
