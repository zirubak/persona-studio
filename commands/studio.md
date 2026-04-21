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
  6. `Exit` — "Exit the studio"

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
2. Glob `personas/*.md` and present participants via AskUserQuestion with
   `multiSelect: true`. Require 2-5 selections.
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

Glob `personas/*.md`, read each and print a one-line summary (name + first line of
`# Background`). Then return to the menu.

## Route E — Refine an avatar

1. AskUserQuestion with Glob-derived list to pick a persona.
2. Execute the steps from `commands/persona-refine.md` inline for that
   persona.

## Non-negotiable rules

- Every question to the user MUST be an `AskUserQuestion` call with `options`,
  never plain-text.
- Keep status updates short and in English.
- Never write files outside `data/`, `personas/`, `agents/`, `simulations/`.
- If a step fails, show the exact error and offer `Retry` / `Skip` / `Back to main menu`.
