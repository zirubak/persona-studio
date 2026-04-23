"""CLI entrypoint: ``python -m persona_studio.web``.

Starts a local uvicorn instance bound to ``127.0.0.1:7777`` by default
and opens the user's browser to the hi-fi prototype. The slash-command
menu item "Open in browser (experimental)" (``commands/studio.md`` Route
G) invokes this module.

Flags:
    --port INT           bind port (default 7777)
    --host STR           bind host (default 127.0.0.1)
    --no-browser         do not call webbrowser.open on startup
                         (tests and headless runs)
"""
from __future__ import annotations

import argparse
import webbrowser

import uvicorn

from persona_studio.web.server import create_app


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m persona_studio.web",
        description="Persona Studio — local web runtime (Phase 1, read-only).",
    )
    parser.add_argument("--port", type=int, default=7777, help="bind port (default 7777)")
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="bind host (default 127.0.0.1 — localhost-only)",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="skip webbrowser.open on startup (tests, headless environments)",
    )
    args = parser.parse_args(argv)

    if not args.no_browser:
        url = f"http://{args.host}:{args.port}/hifi-v2.html"
        # open() blocks until a browser is selected, but with new=2 it
        # opens in a new tab and returns quickly on macOS/Linux. If the
        # call fails entirely (no DISPLAY, no default browser), ignore —
        # the server still runs, and user can navigate manually.
        try:
            webbrowser.open(url, new=2)
        except Exception:
            pass

    uvicorn.run(
        create_app(),
        host=args.host,
        port=args.port,
        log_level="info",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
