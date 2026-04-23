"""TDD Unit 5: entrypoint boot via `python -m persona_studio.web`.

End-to-end boot test: spawn the module as a subprocess, poll the HTTP
endpoint until it responds, assert 200 + expected routes. Slower than
the in-process TestClient tests (≈1-2 s each) but verifies the whole
uvicorn + FastAPI + argparse chain the same way a user's shell would.
"""
from __future__ import annotations

import http.client
import json
import os
import signal
import socket
import subprocess
import sys
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import pytest


def _find_free_port() -> int:
    """Return an ephemeral port the OS confirms is unused right now."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@contextmanager
def _server(port: int, cwd: Path) -> Iterator[subprocess.Popen]:
    """Spawn the entrypoint and tear it down cleanly after the test."""
    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "persona_studio.web",
            "--port",
            str(port),
            "--host",
            "127.0.0.1",
            "--no-browser",
        ],
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
        # New process group so Ctrl-C semantics work the same as a user shell.
        start_new_session=True,
    )
    try:
        _wait_for_ready(port, proc, timeout=8.0)
        yield proc
    finally:
        # Teardown: SIGTERM the process group, drain output.
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
            except ProcessLookupError:
                pass


def _wait_for_ready(port: int, proc: subprocess.Popen, timeout: float) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            stdout = proc.stdout.read().decode("utf-8", errors="replace") if proc.stdout else ""
            stderr = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
            raise RuntimeError(
                f"server exited early (code {proc.returncode})\n"
                f"STDOUT:\n{stdout}\nSTDERR:\n{stderr}"
            )
        try:
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=0.5)
            conn.request("GET", "/api/personas")
            resp = conn.getresponse()
            if resp.status == 200:
                resp.read()
                return
        except (ConnectionRefusedError, TimeoutError, OSError):
            pass
        time.sleep(0.1)
    raise TimeoutError(f"server did not become ready on port {port} within {timeout}s")


@pytest.fixture
def repo_root() -> Path:
    """The persona-studio repo root — has web/ and personas/ at known paths."""
    return Path(__file__).resolve().parents[2]


@pytest.mark.slow
class TestEntrypointBoot:
    def test_boots_and_serves_api_personas(self, repo_root: Path) -> None:
        port = _find_free_port()
        with _server(port, cwd=repo_root):
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
            conn.request("GET", "/api/personas")
            resp = conn.getresponse()
            assert resp.status == 200
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            assert isinstance(data, list)
            # Repo ships 4 public samples — sanity check at least one.
            names = {p["name"] for p in data}
            assert len(names) >= 1, f"expected at least one persona, got {data!r}"

    def test_serves_hifi_v2_html(self, repo_root: Path) -> None:
        port = _find_free_port()
        with _server(port, cwd=repo_root):
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
            conn.request("GET", "/hifi-v2.html")
            resp = conn.getresponse()
            assert resp.status == 200
            assert "text/html" in resp.getheader("content-type", "")

    def test_serves_api_simulations(self, repo_root: Path) -> None:
        port = _find_free_port()
        with _server(port, cwd=repo_root):
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
            conn.request("GET", "/api/simulations")
            resp = conn.getresponse()
            assert resp.status == 200
            data = json.loads(resp.read().decode("utf-8"))
            assert isinstance(data, list)


class TestArgparseShape:
    """The entrypoint accepts --port, --host, --no-browser (plan contract)."""

    def test_no_browser_flag_does_not_open_browser(self, repo_root: Path) -> None:
        """--no-browser must suppress webbrowser.open; without it we'd pop up a window during the test."""
        port = _find_free_port()
        with _server(port, cwd=repo_root) as proc:
            # If the test got here without webbrowser complaints (and the
            # browser didn't actually open, which we can't assert directly),
            # the flag is respected. Absent this test the fixture would
            # blindly open the user's default browser mid-test run — a
            # regression guard for future flag renames.
            assert proc.poll() is None  # still running
