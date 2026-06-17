"""FastAPI application factory for the Phase 1 web runtime.

Exposes two read-only routes and a static mount:

- ``GET /api/personas`` — delegates to :func:`.personas.list_personas`.
- ``GET /api/simulations`` — delegates to :func:`.simulations.list_simulations`.
- ``GET /*`` (any static path) — serves files from ``<cwd>/web/`` so the
  browser prototype loads via ``GET /hifi-v2.html``.

The application is built via :func:`create_app` (factory pattern) so
each test gets a fresh instance. This matters because the underlying
listing helpers read the current working directory, and pytest fixtures
use ``monkeypatch.chdir(tmp_path)`` to isolate per-test filesystem state.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from persona_studio.web.personas import list_personas
from persona_studio.web.simulations import list_simulations


def create_app() -> FastAPI:
    """Build and return a FastAPI instance for the Phase 1 web runtime."""
    app = FastAPI(
        title="Persona Studio — Web",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
    )

    @app.get("/api/personas")
    def _get_personas() -> JSONResponse:
        return JSONResponse(content=list_personas())

    @app.get("/api/simulations")
    def _get_simulations() -> JSONResponse:
        return JSONResponse(content=list_simulations())

    web_dir = Path.cwd() / "web"
    if web_dir.exists():
        app.mount(
            "/",
            StaticFiles(directory=str(web_dir), html=True),
            name="web",
        )

    return app
