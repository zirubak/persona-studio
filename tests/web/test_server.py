"""TDD Unit 3-5: FastAPI server + REST endpoints.

Phase 1's server exposes two read-only routes:

- ``GET /api/personas`` — from ``persona_studio.web.personas.list_personas``.
- ``GET /api/simulations`` — from ``persona_studio.web.simulations.list_simulations``.

Plus a static mount at ``/`` serving the ``web/`` directory so the
browser prototype loads at ``GET /hifi-v2.html``.
"""
from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture
def app():
    """Build the FastAPI app fresh per test to avoid CWD leaking between tests."""
    from persona_studio.web.server import create_app

    return create_app()


@pytest.fixture
def client(app):
    from fastapi.testclient import TestClient

    return TestClient(app)


class TestApiPersonas:
    def test_get_personas_returns_json_list(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.server import create_app
        from fastapi.testclient import TestClient

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        (tmp_path / "personas").mkdir()
        (tmp_path / "personas" / "alice.md").write_text(
            "---\nname: alice\n---\n# Background\nAlice.\n", encoding="utf-8"
        )

        client = TestClient(create_app())
        response = client.get("/api/personas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(p["name"] == "alice" for p in data)

    def test_get_personas_empty_library_returns_empty_list(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.server import create_app
        from fastapi.testclient import TestClient

        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))

        client = TestClient(create_app())
        response = client.get("/api/personas")
        assert response.status_code == 200
        assert response.json() == []


class TestApiSimulations:
    def test_get_simulations_returns_json_list(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.server import create_app
        from fastapi.testclient import TestClient

        monkeypatch.chdir(tmp_path)
        sim_dir = tmp_path / "simulations"
        sim_dir.mkdir()
        (sim_dir / "s.md").write_text(
            "---\nkind: debate\ntopic: X\nparticipants: [a]\n"
            "generated: 2026-04-23T10:00:00+00:00\n---\nbody\n",
            encoding="utf-8",
        )

        client = TestClient(create_app())
        response = client.get("/api/simulations")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["topic"] == "X"

    def test_get_simulations_missing_dir_returns_empty(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from persona_studio.web.server import create_app
        from fastapi.testclient import TestClient

        monkeypatch.chdir(tmp_path)
        client = TestClient(create_app())
        response = client.get("/api/simulations")
        assert response.status_code == 200
        assert response.json() == []


class TestStaticMount:
    def test_serves_hifi_v2_html(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """The static mount at / serves files from web/.

        We run from the actual repo cwd (not tmp_path) because the static
        mount points at ``<cwd>/web/`` and we need the real bundle.
        """
        from persona_studio.web.server import create_app
        from fastapi.testclient import TestClient

        # cwd stays at the repo root so the StaticFiles mount finds web/
        client = TestClient(create_app())
        response = client.get("/hifi-v2.html")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "Persona Studio" in response.text

    def test_serves_hifi_library_jsx(self) -> None:
        from persona_studio.web.server import create_app
        from fastapi.testclient import TestClient

        client = TestClient(create_app())
        response = client.get("/hifi-library.jsx")
        assert response.status_code == 200


class TestCreateApp:
    def test_create_app_returns_distinct_instances(self) -> None:
        """create_app() should return a fresh FastAPI instance per call.

        This matters for tests that need to reset state; reusing a global
        app would cause CWD-dependent fixtures to leak.
        """
        from persona_studio.web.server import create_app

        a = create_app()
        b = create_app()
        assert a is not b
