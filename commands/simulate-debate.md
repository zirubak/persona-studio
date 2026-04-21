---
description: Round-robin debate among 2-5 persona avatars. Usage: /persona-studio:simulate-debate <topic> <p1> <p2> [<p3>...]
---

# /persona-studio:simulate-debate

$ARGUMENTS

## Step 0 — Normalize inputs

Parse `<topic>` (quoted string) and participants (at least 2 persona slugs).
If arguments are missing, ask via `AskUserQuestion`:
- `Topic`: free text
- `Participants`: multiSelect from the combined persona library — Glob
  BOTH `./personas/*.md` AND `$HOME/.persona-studio/personas/*.md`, dedupe by
  filename stem with project-local winning (2-5 selections).
- `Rounds`: `3` / `4` / `5` (default 4)

For each selected participant, resolve the agent file with project-priority:
1. If `./agents/persona-<slug>.md` exists, use it (scope: project).
2. Else if `$HOME/.persona-studio/agents/persona-<slug>.md` exists, use it
   (scope: global).
3. Else stop with an explanation.

## Step 0.5 — Choose Agent invocation strategy

For each participant, decide how to call them as an agent:

- **Native subagent** (`subagent_type="persona-<slug>"`): works ONLY if
  `persona-<slug>.md` existed at session start. Claude Code's agent registry is
  populated at session-start from `agents/`; files added mid-session are
  NOT auto-registered.

- **Dynamic persona** (recommended default):
  `subagent_type="general-purpose"` + `Read(agents/persona-<slug>.md)`
  inlined into the Agent prompt. Works for both freshly-created personas and
  pre-existing ones. Aligns with the `~/.claude/CLAUDE.md` Agent Teams rule
  (every teammate must use `subagent_type="general-purpose"`).

Check each participant:
```bash
# Informal check — if you attempted persona-<slug> earlier in the session
# and got "Agent type 'persona-<slug>' not found", use dynamic persona for that slug.
```

Default to dynamic persona unless you know the agent file pre-existed at session
start. Both strategies produce the same persona behaviour; only the invocation
shape differs.

## Step 1 — Intro

Main Claude acts as the moderator. Print:
- Debate topic
- Participant list
- Flow (round-robin, N rounds, each reply under 300 characters)

Initialize an empty transcript list.

## Step 2 — Round loop

For `r in 1..N`:
  For each participant `p` in declared order:

    **Dynamic persona invocation** (default):
    1. `Read(<resolved_agent_path_for_p>)` — get the full persona body. Use the
       project-priority path resolved in Step 0 (`./agents/persona-<p>.md`
       preferred, `$HOME/.persona-studio/agents/persona-<p>.md` as fallback).
    1.5. Retrieve this avatar's evidence bank for the current topic:
       ```bash
       .venv/bin/python -c "
       import json
       from persona_studio.grounding.retriever import retrieve_evidence
       chunks = retrieve_evidence('<p>', '<topic>', k=8)
       for c in chunks:
           print(f'- [{c.source}:{c.line_start}-{c.line_end}] {c.text[:240]}')
       "
       ```
       Keep the output as `EVIDENCE_BANK_p` to inject in step 3.
       If the output is empty (persona has no corpus or nothing matched), use
       the literal string `(none — speak only from your own persona body)`.
    2. Invoke:
       ```
       Agent(
         subagent_type="general-purpose",
         description="Round <r> turn for <p>",
         prompt=<composed below>
       )
       ```
    3. The composed prompt structure:
       ```
       You must fully embody the persona defined below. Stay in character the entire
       response. Never reveal you are an AI or discuss this simulation meta-layer.

       [PERSONA FILE — inline]
       <full body of agents/persona-<p>.md, including runtime rules>

       [DEBATE CONTEXT]
       Topic: <topic>
       Round: <r> of <N>
       Your role: participant

       [PRIOR TRANSCRIPT, chronological]
       (Round 1, <p1>): <quote>
       (Round 1, <p2>): <quote>
       ...

       [EVIDENCE BANK — cite from here for factual claims]
       <EVIDENCE_BANK_p from step 1.5>

       [YOUR TURN]
       In under 300 characters, name the prior speaker whose point you most agree or disagree with and respond to them directly.

       [HARD RULES]
       - No meta commentary unrelated to the topic.
       - Stay within your Speech Patterns section.
       - Do not repeat anchor quotes verbatim — use them only as style reference.
       - For specific statistics, dates, or attributed quotes, quote or
         paraphrase from EVIDENCE BANK and cite the source tag. If a factual
         claim is NOT backed by the EVIDENCE BANK, mark it `[OPINION]` or
         `[INFERENCE]` inline. Never fabricate a source, statistic, or quote.
       ```

    **Native subagent alternative** (only if persona existed at session start):
    ```
    Agent(subagent_type="persona-<p>", description=..., prompt=<context only>)
    ```
    Shorter prompt, but fails with "Agent type not found" for mid-session
    personas. See Step 0.5.

    Append the reply to the transcript as `(Round r, p): <text>`.

    3.5. **Tier-2 external verification pass** (non-blocking, one pass per turn):
       Feed the just-produced reply through the Tier-1 verifier CLI and, for
       each UNVERIFIABLE high-risk claim, call the configured Tier-2 tool.

       ```bash
       # Get JSON list of claims with their Tier-1 verdicts
       CLAIMS_JSON=$(echo "<reply text>" | .venv/bin/python -m persona_studio.grounding.verify_claims \
           --persona <p> --topic "<topic>" --only-high-risk)

       # Load Tier-2 tool (perplexity / websearch / none)
       TIER2=$(.venv/bin/python -c "from persona_studio.grounding.config import load_config; c = load_config(); print(c.tier2_tool if c else 'websearch')")
       ```

       For each claim in `CLAIMS_JSON` where `status == "unverifiable"` and
       `is_high_risk == true`:

       1. If `TIER2 == "perplexity"` AND `mcp__perplexity__search` is
          available: call `mcp__perplexity__search(query=<claim.text>)`.
          If a credible source comes back (non-empty result, URL present),
          produce `[VERIFIED-EXTERNAL: perplexity <url>]` via
          `annotator.format_external_verified(<url>, "perplexity")`.
          Otherwise produce `[UNVERIFIED-EXTERNAL]`.
       2. Else (`TIER2 == "websearch"` or perplexity absent): call built-in
          `WebSearch(query=<claim.text>)`. Same verdict mapping.
       3. Else (`TIER2 == "none"`): skip — leave the Tier-1 annotation.

       Insert the resulting tag into the transcript line immediately after
       the claim sentence (use the claim's span from the JSON to locate).
       Do NOT re-run Tier-2 on claims already annotated SUPPORTED or
       UNSUPPORTED by Tier-1 — those have authoritative corpus-level
       verdicts.

       Between turns give the user a one-line progress note (no full dump).

## Step 3 — Synthesis

After all rounds, Main Claude writes a neutral summary with three subsections:
- Points of agreement
- Decisive divergence (whose argument split where)
- Open questions

## Step 4 — Save transcript

Create `simulations/<UTC-timestamp>_debate_<topic-slug>.md` with this structure:

```markdown
---
kind: debate
topic: <topic>
participants: [<p1>, <p2>, ...]
rounds: <N>
generated: <ISO8601>
---

# Transcript

## Round 1
### <p1>
...

## Round 2
...

## Conclusion
1-3 sentences. The debate's clear conclusion. If no consensus was reached, still conclude with "Consensus failed — reason X".

## Satisfaction
- Score: N/10
- Per-criterion (user input at start):
  - Criterion 1: X/10
  - Criterion 2: X/10
  - Criterion 3: X/10

## System Feedback
- **Persona side**: improvement points
- **Process side**: improvement points
- **Platform side**: improvement points

## Overall Summary
- Points of agreement
- Decisive divergence
- Open questions
```

**Schema rule**: the three H2 sections `## Conclusion`, `## Satisfaction`, `## System Feedback` are mandatory.

## Step 5 — Generate Word (.docx) and PowerPoint (.pptx)

Auto-invoke after Step 4 saves the markdown:

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

- `.docx`: full transcript archive (every round, every speaker, every quote).
- `.pptx`: executive summary deck (title, participants, points of agreement, decisive divergence, open questions).

On failure, surface last 20 lines of output and AskUserQuestion: retry / skip / continue without.

## Step 6 — Report

Show three paths (markdown, docx, pptx). Return to caller.
