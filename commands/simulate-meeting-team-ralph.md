---
description: Split-panes meeting + user satisfaction score goal + Ralph loop (auto-rerun when score below goal). Mandatory 3-axis schema (Conclusion / Satisfaction / System Feedback).
---

# /persona-studio:simulate-meeting-team-ralph

A variant of the split-panes meeting that adds a **Ralph loop + user-satisfaction score gate**. It keeps everything from `/persona-studio:simulate-meeting-team`, then adds a TUI goal-setting step before the meeting, post-meeting scoring, and an automatic re-run when the score is below the goal.

## Preamble — session grounding flag check

Inherits the same preamble as `/persona-studio:simulate-meeting-team`:

```bash
if [ "$(.venv/bin/python -m persona_studio.grounding.session status)" = "disabled" ]; then
    GROUNDING_ENABLED=false
fi
```

When `GROUNDING_ENABLED=false` the Ralph loop ALSO suppresses the automatic "Factual Grounding" 4th criterion (no audit score to read). User's 3 manual criteria remain the only gates.

## Step 0 — Pre-flight + TUI satisfaction-score setup

1. Run the same tmux / teammate-mode pre-flight checks as `/persona-studio:simulate-meeting-team` Step 0.

2. Additional TUI inputs (chained AskUserQuestion calls):
   - `Target score (0-10)`: 4 / 6 / 8 / 10 (default 7)
   - `Max Ralph iterations (1-5)`: 1 / 2 / 3 / 5 (default 3)
   - `Three measurement criteria (free text)`: the user writes 3 bullets describing what "a good result" means. Examples:
     - At least 3 rounds of realistic counter-arguments exchanged
     - Concrete action items (owner + due date specified)
     - Persona voice stays consistent throughout

   These 3 criteria are reused verbatim as scoring anchors at the end of every iteration (prevents facilitator self-score drift).

3. **Factual Grounding — automatic 4th criterion** (default goal 8/10):
   This criterion is added automatically in addition to the user's 3 and
   CANNOT be removed. Its score comes from the post-meeting audit:
   ```
   grounding_score = 10 * (1 - unsupported_claims / max(1, total_fact_claims))
   ```
   computed by `python -m persona_studio.grounding.audit <transcript.md>`.
   Display it alongside the user's 3 criteria at scoring time; if below the
   8/10 threshold, trigger a Ralph re-run just like any other missed criterion.

## Steps 1-3 — Same flow as `/persona-studio:simulate-meeting-team`

Pick participants → TeamCreate → spawn avatars → agenda rounds → user interruption window. The Tier-2 external-verification pass (Perplexity/WebSearch per `data/grounding-config.json`) from the team-mode template runs unchanged here — Ralph layers scoring on top; it does not replace the verification pipeline.

The silent **`fact-checker` teammate spawn + CoVe routing** from the parent `/persona-studio:simulate-meeting-team` (extra `Task(name="fact-checker", ...)` + Step 3 step 5b SendMessage routing, `COVE_BUDGET_PER_AVATAR=5`) runs unchanged under Ralph scoring — each iteration re-spawns the fact-checker and resets `COVE_USED_<p>=0`.

## Step 4 — Ralph scoring + gating

After the meeting ends:

1. Run the factual-grounding audit first (populates the 4th criterion score
   and appends a `## Factual Grounding` section to the transcript):
   ```bash
   .venv/bin/python -m persona_studio.grounding.audit <transcript-path>
   ```
   Read the resulting table's grounding_score per avatar; aggregate = the
   mean across avatars, rounded to 1 decimal.
2. The facilitator scores each of the **3 user criteria on a 0-10 scale** AND
   the **4th Factual Grounding criterion** (from step 1). Overall score =
   mean of all four.
2. Ask the user via AskUserQuestion `<Final verdict>` — `Goal met, finish` / `Re-run (Ralph loop)` / `Stop (partial save)`.
3. If the user picks `Re-run`:
   - Archive the current iteration under an `iter-N` subfolder.
   - Augment the facilitator prompt with "criterion X scored low last iteration; focus on ~ this time".
   - TeamDelete, then a fresh TeamCreate, then re-run the agenda.
   - Increment the iteration count.
4. Exit the loop immediately if `max_iterations` is reached or the user types `<stop>`.

## Step 5 — Save transcript (topic-subfolder layout)

Path convention:
```
simulations/<topic-slug>/<timestamp>_meeting-team-ralph.md
simulations/<topic-slug>/<timestamp>_meeting-team-ralph.docx
simulations/<topic-slug>/<timestamp>_meeting-team-ralph.pptx
simulations/<topic-slug>/iter-1/<...>     # pre-rerun iteration archive
simulations/<topic-slug>/iter-2/<...>
```

Additional markdown frontmatter:
```yaml
mode: split-panes-ralph
satisfaction_goal: <user-set score>
satisfaction_final: <last iteration average>
satisfaction_criteria:
  - <criterion 1>: <score>
  - <criterion 2>: <score>
  - <criterion 3>: <score>
  - factual_grounding: <score>   # default goal 8/10, auto-added
iterations_run: <N>
early_stop: <stop | max_reached | goal_met>
```

**Mandatory 3-axis body sections**:
- `## Conclusion` — a clear conclusion from the final iteration
- `## Satisfaction` — per-criterion scores + iteration history
- `## System Feedback` — persona / process / platform improvement points

## Step 6 — Use the official docx/pptx skills (preferred) + Python fallback

```
Skill('document-skills:docx') — full-fidelity .docx archive (includes every iteration)
Skill('document-skills:pptx') — summary .pptx deck (cover / agenda / per-agenda conclusions / Ralph iteration progression / satisfaction dashboard / system feedback)
```

If the Skill fails to load, auto-fallback to `.venv/bin/python scripts/simulation_to_docs.py`.

## Step 7 — Report + return to menu

Show the user the md/docx/pptx paths + iteration summary + final score + 3 bullets of system feedback.

---

## Non-negotiable rules

- Never create the team if pre-flight failed.
- Always TeamDelete at the end of every iteration.
- Force-exit on `max_iterations` and save partial results (`early_stop: max_reached`).
- User `<stop>` exits the loop at any time — save the current state immediately.
- If the 3-axis schema (`Conclusion` / `Satisfaction` / `System Feedback`) is missing, the docs pipeline warns and asks the user to rewrite.
- Prefer Skill, fall back to Python: if both fail, at minimum guarantee the markdown is saved.
