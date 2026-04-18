"""CLI-layer tests including the CRITICAL-1 path traversal regression."""

from __future__ import annotations

from pathlib import Path

import pytest
import typer
from typer.testing import CliRunner

from persona_builder import cli


runner = CliRunner()


class TestPersonDirValidation:
    """CRITICAL-1 regression: _person_dir must reject traversal attempts."""

    @pytest.mark.parametrize(
        "name",
        [
            "minjoon-park",
            "Jane_Doe",
            "abc",
            "A1",
        ],
    )
    def test_accepts_safe_names(self, name: str) -> None:
        result = cli._person_dir(name)
        assert result == cli.DATA_ROOT / name

    @pytest.mark.parametrize(
        "name",
        [
            "../escape",
            "../../etc/passwd",
            "a/b",
            ".hidden",
            "",
            "name with spaces",
            "-leading-dash",
            "_leading_underscore",  # starts with underscore — rejected by [A-Za-z0-9] prefix
            "name;whoami",
            "foo$(bash)",
            "a" * 100,  # exceeds 64-char limit
        ],
    )
    def test_rejects_unsafe_names(self, name: str) -> None:
        with pytest.raises(typer.BadParameter):
            cli._person_dir(name)


class TestExtractCommandSurface:
    def test_extract_rejects_unsafe_name(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.chdir(tmp_path)
        # Ensure DATA_ROOT (relative path) won't exist — not that it matters, since
        # validation runs before any filesystem access.
        result = runner.invoke(cli.app, ["extract", "../etc"])
        assert result.exit_code != 0
        assert "name must match" in result.output or "name escapes" in result.output

    def test_extract_reports_missing_person_dir(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.chdir(tmp_path)
        result = runner.invoke(cli.app, ["extract", "nonexistent"])
        assert result.exit_code != 0
        assert "person directory not found" in result.output

    def test_list_on_empty_dir(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.chdir(tmp_path)
        result = runner.invoke(cli.app, ["list"])
        assert result.exit_code == 0
        assert "no people yet" in result.output

    def test_extract_end_to_end_on_tmp_person(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.chdir(tmp_path)
        person = tmp_path / "data" / "people" / "alice" / "raw"
        person.mkdir(parents=True)
        (person / "note.md").write_text("hello", encoding="utf-8")

        result = runner.invoke(cli.app, ["extract", "alice"])
        assert result.exit_code == 0
        assert "ok=1 fail=0" in result.output
        assert (tmp_path / "data" / "people" / "alice" / "extracted" / "corpus.md").exists()
