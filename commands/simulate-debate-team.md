---
description: Round-robin debate in split-panes team mode. 2-5 personas run as named teammates in separate tmux panes. User can interrupt any pane mid-debate.
---

# /persona-studio:simulate-debate-team

Split-panes version of `/persona-studio:simulate-debate`. Each persona becomes a named
teammate running in its own pane. Sequential version stays at
`/persona-studio:simulate-debate` for environments without tmux.

## Step 0 — Pre-flight check

Identical to `/persona-studio:simulate-meeting-team` Step 0:
1. `which tmux` must succeed.
2. `$TMUX` env var set AND Claude Code running in `--teammate-mode split-panes`
   (or `teammateMode: split-panes` in settings.json).
3. At least 2 persona files exist across both scopes combined
   (`./personas/*.md` + `$HOME/.persona-studio/personas/*.md`).
4. Participant count ≤ 5 (debate panes get dense above that).

Abort paths and AskUserQuestion fallback (`Switch to sequential`, `Cancel`) same as
meeting-team.

## Step 1 — Gather debate parameters

AskUserQuestion:
- `Topic`: free text
- `Participants`: multiSelect from the combined persona library (both scopes,
  project-priority dedup; scope-prefixed labels) — 2-5 selections.
- `Rounds`: `3` / `4` / `5` (default 4)
- `User interruption mode`: `Open intervention` / `Between rounds only`

For each selected participant, resolve the agent file with project-priority
(same rule as `/persona-studio:simulate-debate` Step 0).

## Step 2 — Create team and spawn teammates

Same pattern as `/persona-studio:simulate-meeting-team` Step 2, with one prompt difference —
the teammate SYSTEM prompt's PROTOCOL section:

```
[PROTOCOL]
- The facilitator (leader agent) will send you dispatch messages containing
  the prior transcript and the current round number.
- Reply in character, under 300 characters. Default to English unless the
  persona's Speech Patterns specify a different language or register.
- For rounds after the first, YOU MUST explicitly reference at least one
  prior speaker's name and quote or paraphrase the point you are responding to.
- The user may send messages directly. Treat as clarification/steering.
- Do NOT initiate turns on your own. Wait for dispatch.
```

## Step 3 — Round loop

For `r in 1..N`:
  For each participant `p` in declared order:
    1. Compose dispatch content:
       ```
       [Debate topic]: <topic>
       [Round]: <r> of <N>
       [Prior transcript, chronological]:
       (Round 1, <p1>): ...
       (Round 1, <p2>): ...
       ...
       [Your turn]: In under 300 characters, name the prior speaker whose point you most agree or disagree with and respond to them directly.
       ```
    2. `SendMessage(to="avatar-<p>", content=<dispatch>)`
    3. Collect reply from teammate output.
    4. Append to transcript as `(Round r, <p>): <reply>`.

  After each round, open a user interruption window (10 s):
  "Round <r> complete. Want to intervene? Type into any avatar pane, or leave a
  comment in the main pane and it will be factored into the next dispatch."

## Step 4 — Synthesis

Main Claude writes a neutral summary:
- Points of agreement
- Decisive divergence (whose argument split where)
- Open questions

Announce close to each teammate (SendMessage), then `TeamDelete`.

## Step 5 — Save transcript

Markdown contract for the docs pipeline:

```markdown
---
kind: debate-team
topic: <topic>
participants: [<p1>, <p2>, ...]
rounds: <N>
mode: split-panes
user_interruptions: <count>
generated: <ISO8601>
---

# Debate — <topic>

## Round 1
### <p1>
> <reply>

### <p2>
> <reply>

## Round 2
...

## Closing Summary

### Points of agreement
### Decisive divergence
### Open questions
```

Save to `simulations/<UTC-timestamp>_debate-team_<topic-slug>.md`.

## Step 6 — Generate Word (.docx) and PowerPoint (.pptx)

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

## Step 7 — Report

Show md/docx/pptx paths + round summary + interruption count. Return to caller.

---

## Non-negotiable rules

Identical to `/persona-studio:simulate-meeting-team`. The two commands share the same
pre-flight, spawn, and cleanup contracts; only the dispatch structure (round
loop vs agenda loop) differs.
