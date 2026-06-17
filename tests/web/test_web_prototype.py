"""Static regression tests for the browser prototype under web/.

We don't run a full headless-browser E2E in CI — that requires a chromium
install and slows the suite down significantly for what is today a
static HTML bundle. Instead this test file guards the failure modes most
likely to break the prototype after a file move / rename / accidental
delete:

  * every JSX file referenced by <script> tags in hifi-v2.html actually
    exists on disk;
  * the HTML parses cleanly and has the expected entry markers;
  * the license disambiguation note survives at the top of web/README.md;
  * the top-level README (EN + KO) points at web/ for the browser
    prototype section.

The live clickable end-to-end — 9-screen navigation, localStorage
persistence, keyboard arrows, happy-path hotspots — was verified
manually via Playwright on 2026-04-23 (see web/README.md → "Testing the
prototype"). Re-run that procedure when making substantive UI changes.
"""
from __future__ import annotations

import html.parser
import re
from pathlib import Path

import pytest


REPO = Path(__file__).resolve().parent.parent.parent
WEB = REPO / "web"


class _ScriptSrcExtractor(html.parser.HTMLParser):
    """Collect `src=` values for every <script> tag we encounter."""

    def __init__(self) -> None:
        super().__init__()
        self.src_values: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script":
            return
        for k, v in attrs:
            if k.lower() == "src" and v:
                self.src_values.append(v)


def _script_sources(html_path: Path) -> list[str]:
    parser = _ScriptSrcExtractor()
    parser.feed(html_path.read_text(encoding="utf-8"))
    return parser.src_values


# --- file layout --------------------------------------------------------------


def test_web_dir_exists() -> None:
    assert WEB.is_dir(), f"web/ directory missing at {WEB}"


def test_hifi_v2_entry_exists() -> None:
    assert (WEB / "hifi-v2.html").is_file()


@pytest.mark.parametrize(
    "name",
    [
        "hifi-v2.html",
        "landing.html",
        "wireframes.html",
        "hifi.html",
        "hifi-atoms.jsx",
        "hifi-home.jsx",
        "hifi-library.jsx",
        "hifi-live.jsx",
        "hifi-live-animated.jsx",
        "hifi-results.jsx",
        "hifi-v2-screens.jsx",
        "hifi-auth-screens.jsx",
        "hifi-avatars.jsx",
        "design-canvas.jsx",
        "wireframes-screens.jsx",
        "README.md",
        "CONTRIBUTING.md",
    ],
)
def test_expected_file_present(name: str) -> None:
    assert (WEB / name).is_file(), f"expected web/{name}"


def test_docs_handoff_preserved() -> None:
    assert (WEB / "docs" / "HANDOFF.md").is_file()
    assert (WEB / "docs" / "design-chats").is_dir()
    # 4 chat transcripts from design session
    chats = sorted((WEB / "docs" / "design-chats").glob("chat*.md"))
    assert len(chats) == 4, f"expected 4 chat transcripts, found {len(chats)}"


# --- JSX import graph ---------------------------------------------------------


def test_hifi_v2_script_imports_resolve() -> None:
    """Every <script src="..."> relative to the HTML must exist on disk.

    A broken import here would show up at runtime as a blank screen with
    a 404 in the console. Static check catches the regression before the
    user ever opens the page.
    """
    html_path = WEB / "hifi-v2.html"
    for src in _script_sources(html_path):
        if src.startswith(("http://", "https://")):
            continue  # external CDN (React, Babel) — skip
        target = (WEB / src).resolve()
        assert target.is_file(), (
            f"hifi-v2.html references '{src}' but {target} does not exist"
        )


def test_hifi_v2_imports_the_8_core_jsx_modules() -> None:
    """Ensure the 8 JSX files the v2 prototype depends on are all imported.

    If someone removes one and forgets to update the HTML, either the
    script becomes a 404 (caught above) or the file is silently orphaned
    (caught here — we assert the HTML still references it).
    """
    html_text = (WEB / "hifi-v2.html").read_text(encoding="utf-8")
    required = {
        "hifi-atoms.jsx",
        "hifi-home.jsx",
        "hifi-library.jsx",
        "hifi-live.jsx",
        "hifi-results.jsx",
        "hifi-v2-screens.jsx",
        "hifi-live-animated.jsx",
        "hifi-auth-screens.jsx",
    }
    missing = {m for m in required if m not in html_text}
    assert not missing, f"hifi-v2.html no longer imports: {sorted(missing)}"


# --- README safeguards --------------------------------------------------------


def test_web_readme_disambiguation_note_present() -> None:
    """web/README.md is the design handoff's README, which carried an
    ELv2 badge. We preserved it unedited but added a top-of-file note
    clarifying that the actual repo license is MIT. That note must stay
    — otherwise a future reader sees ELv2 at the top and assumes wrong."""
    content = (WEB / "README.md").read_text(encoding="utf-8")
    assert "Heads-up for readers" in content, (
        "license disambiguation front-matter note missing from web/README.md"
    )
    assert "actual repo license is MIT" in content, (
        "MIT license clarification stripped from web/README.md front matter"
    )


def test_top_level_readme_mentions_browser_prototype() -> None:
    for readme in (REPO / "README.md", REPO / "README.ko.md"):
        content = readme.read_text(encoding="utf-8")
        assert "web/" in content and "Browser prototype" in content.replace(
            "브라우저 프로토타입", "Browser prototype"
        ), f"{readme.name} does not point at web/ for the browser prototype"


# --- prototype-level invariants ----------------------------------------------


def test_hifi_v2_has_nine_screen_definitions() -> None:
    """The SCREENS array in hifi-v2.html drives the nav pills. If a
    future edit drops a screen, the nav + happy-path logic silently
    loses it. Lock the count."""
    content = (WEB / "hifi-v2.html").read_text(encoding="utf-8")
    # Count lines inside the SCREENS array that look like `{ id: '...', ...`
    screens_match = re.search(
        r"const SCREENS = \[(.*?)\];",
        content,
        re.DOTALL,
    )
    assert screens_match, "SCREENS array not found in hifi-v2.html"
    screens_body = screens_match.group(1)
    ids = re.findall(r"id:\s*'([^']+)'", screens_body)
    # As of 2026-04-23 the Home→Library→Detail→Create→Setup→Live→Results→
    # Settings→Pricing flow gives exactly 9 screens.
    assert len(ids) == 9, f"expected 9 screens, found {len(ids)}: {ids}"


def test_auth_screens_removed_from_flow_but_kept_in_source() -> None:
    """OSS-first decision (see web/docs/design-chats/chat4.md): auth
    screens are hidden from SCREENS but the source JSX is preserved so
    a future managed/cloud build can re-enable them. Regression guard
    for both halves of that decision."""
    content = (WEB / "hifi-v2.html").read_text(encoding="utf-8")
    screens_match = re.search(r"const SCREENS = \[(.*?)\];", content, re.DOTALL)
    assert screens_match
    screens_body = screens_match.group(1)
    for auth_id in ("signin", "signup", "onboard", "upgrade"):
        assert auth_id not in screens_body, (
            f"auth screen '{auth_id}' leaked back into SCREENS"
        )
    assert (WEB / "hifi-auth-screens.jsx").is_file(), (
        "hifi-auth-screens.jsx source removed — should stay as dormant scaffolding"
    )


# --- Phase 1 fetch-wiring regression guards -----------------------------------


def test_hifi_library_fetches_api_personas() -> None:
    """LibraryA must fetch real personas from /api/personas (Phase 1 wiring)."""
    content = (WEB / "hifi-library.jsx").read_text(encoding="utf-8")
    assert "fetch('/api/personas')" in content, (
        "hifi-library.jsx no longer calls fetch('/api/personas') — Phase 1 wiring regressed"
    )
    # Must still tolerate offline: the useEffect should keep the PEOPLE
    # fallback intact (i.e. the `P` local from window.HF still appears).
    assert " P.map" not in content or "(people ?? P).map" in content or "(people || P).map" in content, (
        "LibraryA should render from fetched `people` with fallback to mock `P`"
    )


def test_hifi_results_fetches_api_simulations() -> None:
    """ResultsA must fetch real past simulations from /api/simulations."""
    content = (WEB / "hifi-results.jsx").read_text(encoding="utf-8")
    assert "fetch('/api/simulations')" in content, (
        "hifi-results.jsx no longer calls fetch('/api/simulations') — Phase 1 wiring regressed"
    )


def test_library_detail_hotspot_disabled_in_phase_1() -> None:
    """Clicking a real persona card must not land on the mock Paul Graham
    detail screen. Phase 1 disables the Library→Detail hotspot; Phase 2
    ships a real detail page."""
    content = (WEB / "hifi-v2.html").read_text(encoding="utf-8")
    # Find the HOTSPOTS.library block and assert no uncommented `to: 'detail'`
    lib_block_match = re.search(
        r"library:\s*\[(.*?)\]", content, re.DOTALL
    )
    assert lib_block_match, "HOTSPOTS.library block missing"
    lib_block = lib_block_match.group(1)
    # Strip // line comments before checking
    stripped = re.sub(r"//[^\n]*", "", lib_block)
    assert "to: 'detail'" not in stripped, (
        "Library→Detail hotspot is still active — Phase 1 must disable it "
        "(UX regression: clicking a real persona card lands on mock PG detail)"
    )


_ACTIVE_HIFI_V2_JSX = [
    "hifi-home.jsx",
    "hifi-library.jsx",
    "hifi-v2-screens.jsx",
    "hifi-live-animated.jsx",
    "hifi-live.jsx",
    "hifi-results.jsx",
]


# --- Production shell (index.html) --------------------------------------------
#
# `hifi-v2.html` is a DESIGN-REVIEW wrapper with prototype chrome (HI-FI v2
# badge, 9-pill screen navigation, fake Mac browser frame around the actual
# app). Users running `python -m persona_studio.web` should land on the REAL
# app — no prototype scaffolding. These tests lock in the difference.


def test_index_html_exists_as_production_shell() -> None:
    """Production entry at web/index.html — served at / via StaticFiles html=True."""
    assert (WEB / "index.html").is_file(), (
        "web/index.html missing — this is the production shell that renders "
        "one screen at a time via hash routing, without hifi-v2's prototype chrome"
    )


def test_index_html_has_no_prototype_chrome_markers() -> None:
    """index.html must NOT contain the hifi-v2 wrapper scaffolding."""
    content = (WEB / "index.html").read_text(encoding="utf-8")
    forbidden = [
        "HI-FI v2 · CLICKABLE",      # top badge
        "OSS · ELv2",                 # license chip (design-review only)
        "GUEST MODE · LOCAL ONLY",    # status pill
        "const SCREENS = [",          # 9-pill nav definition
        "HAPPY PATH",                 # flow-map footer
        "navpill",                    # prototype nav pill class
    ]
    offenders = [marker for marker in forbidden if marker in content]
    assert not offenders, (
        "index.html contains hifi-v2 prototype chrome markers; this should be "
        "a clean production shell. Found: " + ", ".join(offenders)
    )


def test_index_html_uses_hash_routing() -> None:
    """Navigation between screens uses URL hash so no SPA framework / build is needed."""
    content = (WEB / "index.html").read_text(encoding="utf-8")
    # Either hashchange event listener or a window.location.hash read must exist
    has_hash_read = "location.hash" in content or "window.location.hash" in content
    has_hash_listener = "hashchange" in content
    assert has_hash_read and has_hash_listener, (
        "index.html must implement hash-based routing: read window.location.hash "
        "to pick the initial screen + listen to 'hashchange' to re-render"
    )


def test_index_html_strips_fake_browser_chrome() -> None:
    """The fake Mac <Browser> chrome inside each screen must be overridden.

    Each screen component wraps itself in <Browser url="localhost:7777">
    (defined in hifi-atoms.jsx) which renders a fake red/yellow/green traffic
    lights + URL bar. In a real browser that's double chrome. index.html
    monkey-patches window.HF.Browser to a passthrough so screens render
    cleanly at full viewport height.
    """
    content = (WEB / "index.html").read_text(encoding="utf-8")
    # The override should mention HF.Browser on the left-hand side of an
    # assignment. Regex captures `window.HF.Browser =` or `HF.Browser =`.
    assert re.search(r"(?:window\.)?HF\.Browser\s*=", content), (
        "index.html must replace window.HF.Browser with a passthrough "
        "wrapper to strip the fake Mac-style browser chrome from each screen"
    )


def test_main_entrypoint_opens_index_not_hifi_v2() -> None:
    """`python -m persona_studio.web` should default to the production shell."""
    src_main = REPO / "src" / "persona_studio" / "web" / "__main__.py"
    content = src_main.read_text(encoding="utf-8")
    # Strip comments so mentions like "# design-review at /hifi-v2.html" in
    # a docblock don't false-trigger. We check actual code lines.
    code_only = "\n".join(
        line for line in content.splitlines() if not line.strip().startswith("#")
    )
    # The URL f-string that gets passed to webbrowser.open should NOT point
    # at hifi-v2.html. It should hit / (StaticFiles html=True → index.html).
    assert "/hifi-v2.html" not in code_only, (
        "__main__.py still opens /hifi-v2.html by default — should now land "
        "on / (production shell via index.html)"
    )


def test_designer_handoff_notes_removed_from_active_screens() -> None:
    """Designer-to-engineer handwritten margin notes (``<Note>`` elements
    carrying commentary like "one statement. one breath of air. like
    apple.com" or "portraits as big as the names") must NOT ship in the
    active hifi-v2 flow.

    These were handoff artifacts from claude.ai/design explaining design
    intent to the implementing engineer. They look like unfinished
    scaffolding to end users and must not appear in production UI.

    Wireframes (``wireframes-screens.jsx``) are intentionally excluded —
    that file is a historical exploration artifact kept for reference,
    not reachable from ``hifi-v2.html``.
    """
    offenders: list[str] = []
    for filename in _ACTIVE_HIFI_V2_JSX:
        path = WEB / filename
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8")
        # Count both <Note ...> and <Note>; a false positive on a
        # variable named "Notes" is unlikely here — JSX component
        # usage starts with a capital N followed by word-boundary.
        hits = re.findall(r"<Note[\s>]", content)
        if hits:
            offenders.append(f"{filename}: {len(hits)} <Note> tag(s)")
    assert not offenders, (
        "Designer handoff notes still present in active hifi-v2 screens:\n  "
        + "\n  ".join(offenders)
    )
