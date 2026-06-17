"""Phase 1 web runtime for persona-studio.

FastAPI-backed local server that serves the `web/` browser prototype and
exposes read-only REST endpoints over the project's persona library and
past simulation transcripts. No LLM calls, no write paths, no MCP
dependencies — that isolation is what makes Phase 1 small and reviewable.
"""
