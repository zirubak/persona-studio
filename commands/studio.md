---
description: Persona Studio TUI - main entry point for non-developers. Full menu for creating avatars, debates, meetings.
---

# /persona-studio:studio

You are operating the Persona Studio control panel. The user may be a non-developer;
they should never need to type any other slash command or CLI during this session.
Drive everything through `AskUserQuestion` tool calls with explicit `options`.

## Step 1 — First-run auto-bootstrap (idempotent, ~1 minute after first install)

Before showing the menu, always run the bootstrap. It creates `.venv/`, installs
the package with all runtime + dev dependencies, warns if ffmpeg is missing, and
pre-downloads the whisper model. All steps are skipped if already satisfied, so
this is safe to run every session.

```bash
python3 scripts/setup.py
```

Interpret the exit code:
- `0` — ready, continue to Step 2
- `2` — Python version too old. Tell the user: "Python 3.10 or newer is required. Run `brew install python@3.12` and try again." Stop.
- Any other non-zero — show the final lines of the output and ask the user whether to retry or skip (AskUserQuestion).

If `ffmpeg not found` appears in the output, the bootstrap continues with a
warning. Audio and YouTube paths will fail until the user installs it. Mention
this with the platform-specific hint printed by the script (brew on darwin,
apt/dnf/pacman on linux).

## Step 1.5 — Factual-grounding Tier-2 detection (first-run only)

If `data/grounding-config.json` does not exist yet, detect the Tier-2
external-verification tool available in this session (`perplexity` if any
`mcp__perplexity__*` tool is visible in the tool list; otherwise
`websearch` — always available built-in; otherwise `none`) and persist:

```bash
.venv/bin/python - <<'PY'
from persona_studio.grounding.config import (
    GroundingConfig, load_config, save_config,
)
if load_config() is None:
    # Placeholder: command-layer substitutes the detected tool name here.
    save_config(GroundingConfig.now("websearch"))
    print("Factual grounding: Tier-1 (corpus) + Tier-2 (websearch)")
PY
```

If `perplexity` MCP is detected in the current session, pass
`"perplexity"` to `GroundingConfig.now(...)` instead. The message printed
here tells the user which Tier-2 tool will be used during simulations.

## Step 2 — Show the main menu (loop)

Use `AskUserQuestion` with this question, repeated until the user picks `Exit`:

- **question**: "What would you like to do?"
- **header**: "Persona Studio"
- **options** (all with `multiSelect: false`):
  1. `Create a new avatar` — "Build an avatar from documents/audio/web or from a public figure's name"
  2. `Debate simulation (round-robin)` — "Multiple avatars debate a topic, taking turns"
  3. `Meeting simulation (facilitated)` — "A facilitator-led meeting with an agenda"
  4. `List avatars` — "Summary of saved personas"
  5. `Refine an avatar` — "Update specific sections of one persona"
  6. `Toggle factual grounding` — "Turn grounding ON/OFF for this session (default: ON). Brainstorming sessions may want it OFF to welcome divergent claims."
  7. `Exit` — "Exit the studio"

Route to the matching sub-flow below. After each sub-flow returns, come back to
this menu instead of ending the session.

## Route A — Create a new avatar

1. AskUserQuestion: "Which mode?"
   - `Private (upload my files)`
   - `Celebrity (name only)`
2. Ask for the person's name (kebab-case slug is preferred). Sanitize spaces.
3. Delegate to `/persona-studio:create-persona <name> --mode <private|celebrity>` by invoking the
   command's instructions directly (Claude reads the file and follows it). Do not
   spawn it as a separate slash command; just execute its steps inline.

## Route B — Debate simulation

1. AskUserQuestion **3-way mode**:
   - `Sequential (fast, no tmux needed)` — single-screen text stream
   - `Real-time split-panes (tmux, user can interrupt)` — split-panes teammates
   - `Real-time split + Ralph loop (auto-rerun when score below goal)` — Ralph variant
2. Glob BOTH `./personas/*.md` AND `$HOME/.persona-studio/personas/*.md`,
   dedupe by filename stem with project-local priority, and present
   participants (scope-prefixed) via AskUserQuestion with `multiSelect: true`.
   Require 2-5 selections.
3. Ask for the topic (free text) and number of rounds (default 4).
4. Route by mode:
   - `Sequential` → Execute `commands/simulate-debate.md` inline.
   - `Real-time split-panes` → Execute `commands/simulate-debate-team.md` inline.
   - `Real-time split + Ralph loop` → Execute `commands/simulate-debate-team-ralph.md` inline (adds satisfaction-score TUI + Ralph iteration loop; same tmux/teammate-mode pre-flight).
5. Ralph and team variants auto-fallback to sequential with user confirmation if tmux/teammate-mode pre-flight fails.

## Route C — Meeting simulation

1. AskUserQuestion **3-way mode** (same 3 options as Route B).
2. Same participant selection as Route B (2-6 people).
3. Ask for the meeting topic. Offer to auto-generate the agenda or take a custom
   one (AskUserQuestion: `Auto-generate` / `Enter manually`).
4. Route by mode:
   - `Sequential` → Execute `commands/simulate-meeting.md` inline.
   - `Real-time split-panes` → Execute `commands/simulate-meeting-team.md` inline.
   - `Real-time split + Ralph loop` → Execute `commands/simulate-meeting-team-ralph.md` inline (adds satisfaction-score TUI + Ralph iteration loop; same tmux/teammate-mode pre-flight).

**Tips**:
- Real-time split-panes only works inside tmux with a `claude --teammate-mode split-panes` session.
- The Ralph loop asks for a target score (0-10), three measurement criteria, and a max iteration count (1-5) before starting, then scores each iteration at the end and auto-reruns when the score is below the goal. See `docs/TEAM_MODE_GUIDE.md` for details.
- Every simulation MUST include the three H2 sections `## Conclusion` / `## Satisfaction` / `## System Feedback`; the docs pipeline validates this.

## Route D — List avatars

Glob BOTH scopes:
- `./personas/*.md` (project-local)
- `$HOME/.persona-studio/personas/*.md` (global library)

Deduplicate by filename stem with project-local winning on conflict. Read each
surviving entry and print a one-line summary:

```
[<scope>] <name> — <first line of # Background>
```

where `<scope>` is `project` or `global`. Then return to the menu.

## Route E — Refine an avatar

1. Same dual-scope dual-glob + dedup as Route D. AskUserQuestion with the
   combined list (scope-prefixed) to pick one persona.
2. Execute the steps from `commands/persona-refine.md` inline for that persona
   — that command handles scope resolution internally and edits in-place (never
   crosses scopes silently).

## Route F — Toggle factual grounding

Session-scoped toggle for the entire factual-grounding pipeline
(`[EVIDENCE BANK]` injection, verify_claims, Tier-2 external verification,
Tier-3 CoVe, and post-meeting audit). Default: ON. Turning it OFF is the
escape hatch for pure-brainstorming sessions where divergent / speculative
claims are welcome and hallucinations should not be suppressed.

State lives in a single JSON file at the project root: `data/grounding-session.json`.

1. Read the current state:

```bash
.venv/bin/python - <<'PY'
import json, pathlib
path = pathlib.Path("data/grounding-session.json")
if path.exists():
    state = json.loads(path.read_text(encoding="utf-8"))
else:
    state = {"enabled": True, "until": "session"}
print(json.dumps(state))
PY
```

   - If the file does not exist, grounding is ON by default.

2. Flip the `enabled` boolean and write back. On first toggle (file missing)
   this writes `{"enabled": false, "until": "session"}`.

```bash
.venv/bin/python - <<'PY'
import json, pathlib
path = pathlib.Path("data/grounding-session.json")
path.parent.mkdir(parents=True, exist_ok=True)
if path.exists():
    state = json.loads(path.read_text(encoding="utf-8"))
    state["enabled"] = not bool(state.get("enabled", True))
else:
    state = {"enabled": False, "until": "session"}
state["until"] = "session"
path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
print(json.dumps(state))
PY
```

3. Print the new state to the user exactly as:
   - `Factual grounding: ON` (when `enabled` is true)
   - `Factual grounding: OFF (this session only)` (when `enabled` is false)

4. Return to the main menu.

**Flag contract (for `simulate-*.md` commands — follow-up task)**:

- Path: `data/grounding-session.json` (project-local, never committed —
  already covered by the `data/` entry in `.gitignore`).
- Shape: `{"enabled": bool, "until": "session"}`.
- Semantics: `enabled == false` means the simulate-* command SHOULD skip
  the entire grounding pipeline for that run — no `[EVIDENCE BANK]`
  injection, no `verify_claims` call, no Tier-2 external verification,
  no Tier-3 CoVe challenge pass, and no post-meeting
  `persona_studio.grounding.audit` invocation.
- Default: missing file == `enabled: true`. The `"until": "session"`
  field is advisory — the state persists across commands within the same
  project until the user toggles again or deletes the file manually.
- This task only wires up the toggle + documents the contract; the
  `simulate-*.md` commands will be updated in a follow-up task.

## Non-negotiable rules

- Every question to the user MUST be an `AskUserQuestion` call with `options`,
  never plain-text.
- Keep status updates short and in English.
- Never write files outside `data/`, `personas/`, `agents/`, `simulations/`
  (project-local) or `$HOME/.persona-studio/{data,personas,agents}/`
  (global persona library). `simulations/` output is always project-local.
- If a step fails, show the exact error and offer `Retry` / `Skip` / `Back to main menu`.
