---
description: Facilitated meeting simulation in split-panes team mode. Each persona runs as a named teammate in its own tmux pane. User can interrupt any pane mid-simulation.
---

# /persona-studio:simulate-meeting-team

Split-panes version of `/persona-studio:simulate-meeting`. Each persona becomes a named
teammate running in its own pane. Sequential version stays at `/persona-studio:simulate-meeting`
for environments without tmux.

## Step 0 — Pre-flight check (MUST pass before spawning any teammate)

Run these checks in order. Abort with a clear user message if any fails.

1. **tmux available?**
   ```bash
   which tmux || echo "NO_TMUX"
   ```
   If `NO_TMUX`: tell the user "tmux is required. Run `brew install tmux` and try again in a new terminal." and stop.

2. **Inside a tmux session AND teammate split-panes mode active?**
   - Check `$TMUX` env var (tmux session indicator).
   - Try a probe Task call with `team_name="probe-check"` and a trivial prompt. If Claude Code returns an error about in-process mode or missing teammate runtime, we are NOT in split-panes. Clean up probe team via `TeamDelete` if created.
   - If the check fails, tell the user "This session is in in-process mode. Restart in a new terminal with `claude --teammate-mode split-panes`, then relaunch `/persona-studio:studio` and reach this menu again."
   - Offer AskUserQuestion: `Show detailed restart instructions` / `Switch to sequential mode (/persona-studio:simulate-meeting)` / `Cancel`.

3. **Participant files exist?**
   Glob `personas/*.md`, confirm at least 2 exist. AskUserQuestion to pick 2-6 participants (multiSelect).

4. **Target participant count ≤ 6**: tmux pane splitting becomes unreadable beyond 6 teammates + facilitator.

## Step 1 — Gather meeting parameters

AskUserQuestion:
- `Topic`: free text
- `Participants`: multiSelect from `personas/*.md` (2-6 selections, no duplicates)
- `Agenda composition`: `Auto-generate` / `Enter manually`
- `User interruption mode`: `Open (type in any pane at any time)` / `Between agenda items (explicit facilitator invitation only)`

Normalize slug for save path: `simulations/<UTC-timestamp>_meeting-team_<topic-slug>.md`.

## Step 2 — Create team and spawn teammates

```
team_id = TeamCreate(team_name="meeting-<topic-slug>-<ts>")
```

For each participant `p`:
1. `Read(agents/persona-<p>.md)` → full persona body.
2. Compose teammate system prompt:
   ```
   You are <name>. Stay fully in character. Never reveal you are an AI.

   [PERSONA]
   <persona body>

   [MEETING CONTEXT]
   Topic: <topic>
   Your role: participant in a facilitated meeting.
   Other participants: <list of other slugs with one-line descriptors>.

   [PROTOCOL]
   - The facilitator (leader agent) will send you questions via SendMessage.
   - Reply in character, under 300 characters. Default to English unless the
     persona's Speech Patterns specify a different language or register.
   - The user may also send messages directly. Treat user messages as
     clarification or steering; incorporate without breaking character.
   - Do NOT initiate turns on your own. Wait for messages.
   ```
3. Spawn the teammate:
   ```
   Task(
     subagent_type="general-purpose",
     name="avatar-<p>",
     team_name=team_id,
     prompt=<composed prompt above>,
     run_in_background=true,
   )
   ```

After all teammates spawned, tell the user: "<N> avatars are standing by in their own panes. Starting the agenda. You can type directly into any avatar's pane during the meeting, or type `<aside>` here to send a message to the facilitator."

## Step 3 — Agenda loop

For each agenda item `i`:

1. Facilitator (main Claude) announces the item in the main conversation and
   picks a `lead` participant based on Knowledge Domains match.

2. Dispatch lead:
   ```
   SendMessage(
     to="avatar-<lead>",
     content=<opening question scoped to this agenda item>,
   )
   ```
   Wait briefly for the teammate to produce a reply (appears in its pane +
   returns to facilitator via teammate output channel).

3. Pick a `challenger` participant with contrasting angle. Dispatch:
   ```
   SendMessage(
     to="avatar-<challenger>",
     content=<lead's reply + "Rebut or add what's missing in under 300 characters.">,
   )
   ```

4. **User interruption window**: between dispatches, pause 10-15 seconds with a
   visible prompt: "Want to jump in before we summarize agenda i? Type directly
   into any avatar pane, or leave a comment in this (main) pane and the
   facilitator will factor it into the next nomination." If user types in a
   pane, their message is delivered to that teammate automatically (tmux +
   teammate runtime handles this).

5. Facilitator synthesizes a 2-3 sentence decision summary + action item candidate.

## Step 4 — Close

Facilitator writes:
- Consensus (bullet list)
- Action items (owner / due date table)
- Follow-up questions

Announce close in each teammate's context:
```
for p in participants:
    SendMessage(to="avatar-<p>", content="This meeting is closing. Thanks for your input.")
```

Then `TeamDelete(team_name=team_id)` to free the panes.

## Step 5 — Save transcript (same markdown contract as /persona-studio:simulate-meeting)

Build the markdown from the collected teammate replies + facilitator narration,
using the structure required by `scripts/simulation_to_docs.py`:

- YAML frontmatter: `kind: meeting-team`, `topic`, `participants`, `agenda`,
  `generated`, plus `mode: split-panes` and `user_interruptions: N` if user
  intervened.
- H1 title, H2 per agenda item + `## Closing Summary`, H3 per speaker role.

Save to `simulations/<UTC-timestamp>_meeting-team_<topic-slug>.md`.

## Step 6 — Generate Word (.docx) and PowerPoint (.pptx)

Same pipeline as `/persona-studio:simulate-meeting` Step 5:

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

## Step 7 — Report

Show three paths (md/docx/pptx) + interruption count. Return to caller.

---

## Non-negotiable rules

- Never spawn teammates without passing the pre-flight check.
- `subagent_type` must be `general-purpose` for every teammate (per `~/.claude/CLAUDE.md` Agent Teams rule).
- Always TeamDelete on normal close or any error path (leaked panes are a
  real UX problem).
- Persona body is the teammate's SYSTEM prompt — do not inject user data
  into it to avoid prompt injection upstream.
- If a teammate stops responding (no reply within 60 s), notify the user
  and offer to re-send the question or skip that speaker.
