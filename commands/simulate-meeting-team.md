---
description: Facilitated meeting simulation in split-panes team mode. Each persona runs as a named teammate in its own tmux pane. User can interrupt any pane mid-simulation.
---

# /persona-studio:simulate-meeting-team

Split-panes version of `/persona-studio:simulate-meeting`. Each persona becomes a named
teammate running in its own pane. Sequential version stays at `/persona-studio:simulate-meeting`
for environments without tmux.

## Preamble — session grounding flag check

```bash
if [ "$(.venv/bin/python -m persona_studio.grounding.session status)" = "disabled" ]; then
    GROUNDING_ENABLED=false
    echo "[grounding] disabled for this session — skipping the grounding pipeline"
else
    GROUNDING_ENABLED=true
fi
```

When `GROUNDING_ENABLED=false`: SKIP the `[EVIDENCE BANK]` dispatch,
`verify_claims` calls, Tier-2 external-verification fallback, the
fact-checker teammate spawn, and post-meeting audit. The meeting still
runs with avatar teammates only.

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
   Glob BOTH `./personas/*.md` AND `$HOME/.persona-studio/personas/*.md`,
   dedupe by filename stem with project-local winning on conflict, confirm at
   least 2 survive. AskUserQuestion to pick 2-6 participants (multiSelect;
   scope-prefix each option with `[project]` or `[global]` so the user knows
   where each comes from). For each selection, resolve the agent file with
   project-priority (`./agents/persona-<p>.md` first,
   `$HOME/.persona-studio/agents/persona-<p>.md` as fallback).

4. **Target participant count ≤ 6**: tmux pane splitting becomes unreadable beyond 6 teammates + facilitator.

## Step 1 — Gather meeting parameters

AskUserQuestion:
- `Topic`: free text
- `Participants`: multiSelect from the combined persona library (both scopes,
  project-priority dedup; scope-prefixed labels) — 2-6 selections, no duplicates
- `Agenda composition`: `Auto-generate` / `Enter manually`
- `User interruption mode`: `Open (type in any pane at any time)` / `Between agenda items (explicit facilitator invitation only)`

Normalize slug for save path: `simulations/<UTC-timestamp>_meeting-team_<topic-slug>.md`.

## Step 2 — Create team and spawn teammates

```
team_id = TeamCreate(team_name="meeting-<topic-slug>-<ts>")
```

For each participant `p`:
1. `Read(<resolved_agent_path_for_p>)` → full persona body. Use the
   project-priority path resolved in Step 0.
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

After all avatar teammates spawned, also spawn ONE silent `fact-checker`
teammate (same team, but never speaks in the meeting):

```
Task(
  subagent_type="general-purpose",
  name="fact-checker",
  team_name=team_id,
  prompt="""
    You are a SILENT fact-checker. You NEVER speak in the meeting. Your job:

    1. When the facilitator sends you a message containing an avatar turn
       plus its EVIDENCE BANK, extract factual claims via:
         .venv/bin/python -m persona_studio.grounding.verify_claims \\
             --persona <avatar> --topic <topic> --only-high-risk
       (the avatar slug and topic are in the facilitator's message header).

    2. For each UNVERIFIABLE high-risk claim, run Chain-of-Verification
       (CoVe) via the two cove.py CLI modes:
         a. printf '%s' "<claim>" | .venv/bin/python \\
                -m persona_studio.grounding.cove generate-question
         b. Answer the generated question YOURSELF, strictly from the
            EVIDENCE BANK the facilitator provided. If the evidence does
            not contain the answer, say exactly: unknown.
         c. .venv/bin/python -m persona_studio.grounding.cove compare \\
                --claim "<claim>" --answer "<your-answer>"

    3. Reply to the facilitator ONLY with JSON, no prose:
         {"verdicts": [
           {"claim": "...", "status": "consistent|discrepancy|inconclusive",
            "reason": "..."}
         ]}

    4. Never post into the meeting transcript. Never address the avatars.
  """,
  run_in_background=true,
)
```

Then tell the user: "<N> avatars are standing by in their own panes. Starting the agenda. You can type directly into any avatar's pane during the meeting, or type `<aside>` here to send a message to the facilitator."

## Step 3 — Agenda loop

Before the first agenda item, initialize the CoVe budget counters (facilitator
state, NOT inside the fact-checker):

```bash
COVE_BUDGET_PER_AVATAR=5
# for each participant p:
declare "COVE_USED_<p>=0"
```

For each agenda item `i`:

1. Facilitator (main Claude) announces the item in the main conversation and
   picks a `lead` participant based on Knowledge Domains match.

2. Retrieve the lead's evidence bank for this agenda item, then dispatch:
   ```bash
   .venv/bin/python -c "
   from persona_studio.grounding.retriever import retrieve_evidence
   chunks = retrieve_evidence('<lead>', '<topic> <item>', k=8)
   for c in chunks:
       print(f'- [{c.source}:{c.line_start}-{c.line_end}] {c.text[:240]}')
   "
   ```
   ```
   SendMessage(
     to="avatar-<lead>",
     content="[EVIDENCE BANK]\n<retrieved chunks>\n\n[CITATION RULE] For stats/dates/quotes, cite from EVIDENCE BANK or mark [OPINION]/[INFERENCE]. Never fabricate sources.\n\n<opening question scoped to this agenda item>",
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

5. **Tier-2 external verification pass** on both lead and challenger replies
   (same pattern as `/persona-studio:simulate-debate` Step 3.5). Pipe each reply
   through `python -m persona_studio.grounding.verify_claims --only-high-risk`;
   for UNVERIFIABLE high-risk claims call Perplexity (if MCP available) or
   WebSearch; insert `[VERIFIED-EXTERNAL]` / `[UNVERIFIED-EXTERNAL]` tags
   inline. Tool preference from `data/grounding-config.json`.

5b. **Fact-checker CoVe routing** (team-mode equivalent of
   `/persona-studio:simulate-debate` Step 3.6). Run for EACH of the lead and
   challenger replies in this agenda item. Skip entirely for an avatar if
   `COVE_USED_<avatar> >= COVE_BUDGET_PER_AVATAR` — annotate remaining
   UNVERIFIABLE high-risk claims `[UNVERIFIABLE — CoVe budget exceeded]`
   and move on.

   Otherwise:
   ```
   SendMessage(
     to="fact-checker",
     content="""
       [avatar]: <avatar-slug>
       [topic]: <topic>
       [agenda item]: <item>
       [turn]:
       <reply text>

       [EVIDENCE BANK]
       <EVIDENCE BANK used to dispatch this turn>
     """,
   )
   ```
   Wait up to 15 s for the JSON reply `{"verdicts": [...]}`.

   For each verdict in order:
     - `"discrepancy"`:
       a. Post `[CHALLENGE — "<claim>" : <reason>]` into the main meeting
          transcript right after the flagged claim in this avatar's block.
       b. `SendMessage(to="avatar-<avatar>", content="Your statement
          '<claim>' could not be verified. Evidence suggests <reason>.
          Retract, cite, or restate with uncertainty within 15 seconds.
          Under 200 characters.")`
       c. Wait up to 15 s; append the reply to the avatar's block as a
          `[retract/defend]` line, marking the original portion
          `(original, flagged)`.
       d. Increment `COVE_USED_<avatar>` by 1.
     - `"inconclusive"`: leave the Tier-2 annotation. No challenge.
       Increment `COVE_USED_<avatar>` by 1.
     - `"consistent"`: no action. Increment `COVE_USED_<avatar>` by 1.

6. Facilitator synthesizes a 2-3 sentence decision summary + action item candidate.

## Step 4 — Close

Facilitator writes:
- Consensus (bullet list)
- Action items (owner / due date table)
- Follow-up questions

Announce close in each teammate's context (include the silent
`fact-checker`):
```
for p in participants:
    SendMessage(to="avatar-<p>", content="This meeting is closing. Thanks for your input.")
SendMessage(to="fact-checker", content="Meeting closed. No further verification required.")
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
