---
description: Facilitated meeting simulation. Usage: /persona-studio:simulate-meeting <topic> <p1> <p2> ...
---

# /persona-studio:simulate-meeting

$ARGUMENTS

## Preamble — session grounding flag check

```bash
if [ "$(.venv/bin/python -m persona_studio.grounding.session status)" = "disabled" ]; then
    GROUNDING_ENABLED=false
    echo "[grounding] disabled for this session — skipping the grounding pipeline"
else
    GROUNDING_ENABLED=true
fi
```

When `GROUNDING_ENABLED=false`: SKIP the `[EVIDENCE BANK]` retrieval,
`verify_claims` calls, Tier-2 external-verification fallback, Tier-3 CoVe
pass, and post-meeting `audit.py` invocation. The meeting still runs and
produces a plain transcript. Users re-enable via `/persona-studio:studio`
→ Toggle factual grounding.

## Step 0 — Normalize inputs

Same participant validation as `/persona-studio:simulate-debate` (including the
dual-scope Glob over `./personas/*.md` + `$HOME/.persona-studio/personas/*.md`
with project-priority dedup, and project-priority agent-file lookup).
2-6 participants allowed.

**Agent invocation strategy**: Default to **dynamic persona** pattern —
`subagent_type="general-purpose"` with the persona file body inlined into the
prompt. See `/persona-studio:simulate-debate` Step 0.5 for the full recipe and rationale.
This works for both pre-existing and session-fresh personas, unlike native
`persona-<slug>` subagent types which only work if the file existed at session
start.

Ask how the agenda is composed (AskUserQuestion):
- `Auto-generate` — Main Claude drafts an agenda from the topic.
- `Enter manually` — user dictates 3-7 agenda items.

Record the final agenda as an ordered list.

## Step 1 — Facilitator sets the stage

Main Claude, acting as the facilitator, announces:
- Meeting topic
- Participants
- Agenda list
- Flow: for each agenda item the facilitator nominates one participant to lead, then picks one more for a rebuttal / complementary view, and closes the item with a consensus summary

## Step 2 — Agenda loop

For each agenda item `i` in order:
  a. Facilitator phrases a concrete opening question (≤ 2 sentences).
  b. Pick a `lead` participant most relevant to item `i` based on their persona's
     Knowledge Domains. Retrieve the lead's evidence bank for this agenda item:
     ```bash
     .venv/bin/python -c "
     from persona_studio.grounding.retriever import retrieve_evidence
     chunks = retrieve_evidence('<lead>', '<topic> <item>', k=8)
     for c in chunks:
         print(f'- [{c.source}:{c.line_start}-{c.line_end}] {c.text[:240]}')
     "
     ```
     Then invoke with the evidence bank appended to the prompt:
     ```
     Agent(subagent_type="persona-<lead>", prompt="[EVIDENCE BANK]\n<retrieved>\n\n[CITATION RULE] For stats/dates/quotes, cite from EVIDENCE BANK or mark [OPINION]/[INFERENCE]. Never fabricate sources.\n\nGive your recommendation for agenda item i in under 300 characters. Topic: <topic>. Item: <item>.")
     ```
  c. Pick one `challenger` participant with a contrasting Debate Style or
     overlapping domain. Invoke:
     ```
     Agent(subagent_type="persona-<challenger>", prompt="Read the lead's answer and, in under 300 characters, rebut the weakest point or add what's missing. Lead's answer: <quote>")
     ```
  d. Optional: if either mentioned an absent domain expert among participants,
     invoke that third persona with a direct question (one exchange max).
  e. **Tier-2 external verification pass** for both lead and challenger replies:
     Same pattern as `/persona-studio:simulate-debate` Step 3.5 — pipe each reply
     through `python -m persona_studio.grounding.verify_claims` with
     `--only-high-risk`, call the Tier-2 tool (Perplexity if available,
     WebSearch otherwise) for any UNVERIFIABLE high-risk claims, and insert
     `[VERIFIED-EXTERNAL: ...]` or `[UNVERIFIED-EXTERNAL]` tags inline.
  e2. **CoVe pass on residual UNVERIFIABLE high-risk claims** (same
     Chain-of-Verification flow as `/persona-studio:simulate-debate` Step 3.6).

     Before the first agenda item, initialize a per-avatar budget:
     ```bash
     COVE_BUDGET_PER_AVATAR=5
     # for each participant p:
     declare "COVE_USED_<p>=0"
     ```

     For each claim in the lead's and challenger's `CLAIMS_JSON` where
     `status == "unverifiable"` after Tier-2, `is_high_risk == true`, and
     `COVE_USED_<avatar> < COVE_BUDGET_PER_AVATAR`:

     1. Generate the verification question:
        ```bash
        Q_JSON=$(printf '%s' "<claim.text>" \
            | .venv/bin/python -m persona_studio.grounding.cove generate-question)
        ```
     2. Independently answer it via a sub-Agent
        (`subagent_type="general-purpose"`), prompt:
        ```
        Answer the following question strictly from the provided evidence.
        If the evidence does not contain the answer, reply with the single
        word: unknown.

        Question: <Q_JSON.question>
        Evidence: <EVIDENCE BANK for this avatar> + <Tier-2 search result, if any>
        ```
        Capture as `$COVE_ANSWER`.
     3. Compare:
        ```bash
        CMP_JSON=$(.venv/bin/python -m persona_studio.grounding.cove compare \
            --claim "<claim.text>" --answer "$COVE_ANSWER")
        ```
     4. Branch on `$CMP_JSON.verdict`:
        - `"discrepancy"`: insert `[FACT-CHECKER CHALLENGE: <reason>]` into
          the transcript line after the flagged claim AND re-invoke the
          avatar with a retract/defend prompt:
          "Your previous statement '<claim.text>' could not be verified.
          Evidence suggests <reason>. Please retract, cite a source, or
          restate with uncertainty. Under 200 characters." Append the
          response as a `[retract/defend]` blockquote line, marking the
          original portion `(original, flagged)`.
        - `"inconclusive"`: leave the Tier-2 annotation; no challenge.
        - `"consistent"`: no action.
     5. Increment `COVE_USED_<avatar>` by 1.

     When a CoVe budget is exhausted for an avatar, annotate remaining
     eligible claims `[UNVERIFIABLE — CoVe budget exceeded]` and stop
     calling CoVe for that avatar.
  f. Facilitator synthesizes a 2-3 sentence decision summary + action item candidate.

## Step 3 — Meeting close

Main Claude writes:
- Consensus summary (bullet list)
- Action items (owner best-guess, due date TBD)
- Follow-up questions

## Step 4 — Save transcript

Write `simulations/<UTC-timestamp>_meeting_<topic-slug>.md`:

```markdown
---
kind: meeting
topic: <topic>
participants: [...]
agenda: [...]
generated: <ISO8601>
---

# Minutes

## Agenda 1: <title>
- **Lead (<lead>)**: ...
- **Rebuttal / complement (<challenger>)**: ...
- **Additional remarks**: ...
- **Decision summary**: ...

## Agenda 2: ...

## Conclusion
Every simulation MUST include this section. Write the single clear conclusion the meeting reached in 1-3 sentences. If no consensus was reached, still conclude with "Consensus failed — reason X".

## Satisfaction
- Score: N / 10 (against the criteria the user set at the start)
- Per-criterion score:
  - Criterion 1 (user input): X/10
  - Criterion 2: X/10
  - Criterion 3: X/10
- Retry on miss (Ralph mode only): yes/no

## System Feedback
3-5 improvement points grouped by category:
- **Persona side**: which persona sections should be refined
- **Process side**: agenda design / facilitation improvements
- **Platform side**: tooling / environment / UX improvements

### Consensus · Actions · Follow-ups
Action items table:
| # | Owner | Content | Due |
|---|-------|---------|-----|

Open questions:
- ...
```

**Schema rule (mandatory)**:
- The three H2 sections `## Conclusion`, `## Satisfaction`, `## System Feedback` MUST be present. If missing, the docs pipeline warns and asks the user to rewrite.
- `## Closing Summary` is an optional parent section that may wrap the three sections above together with the `Consensus · Actions · Follow-ups` subsection, OR each of the three may stand as an independent H2 — both patterns are valid.

## Step 5 — Generate Word (.docx) and PowerPoint (.pptx)

Auto-invoke the docs pipeline right after the markdown transcript is saved:

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

Expected output: same directory, `<stem>.docx` and `<stem>.pptx`.

- `.docx`: full-fidelity archive — every utterance verbatim, facilitator questions and summaries, full agenda and closing summary. For internal minutes or archival distribution.
- `.pptx`: executive-summary deck — cover + agenda overview + one-line highlight per agenda item + closing consensus + action items. For internal sharing / follow-up presentations.

If the script fails, surface the last 20 lines of its output and ask the user
(AskUserQuestion) whether to retry, skip, or open the markdown directly.

## Step 6 — Report to user

Show three paths:
- `simulations/<stem>.md` (markdown source)
- `simulations/<stem>.docx` (full archive)
- `simulations/<stem>.pptx` (summary deck)

Then return control to the caller (usually `/persona-studio:studio`).
