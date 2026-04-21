---
description: Split-panes debate + satisfaction-score Ralph loop. Mandatory 3-axis schema.
---

# /persona-studio:simulate-debate-team-ralph

Combines `/persona-studio:simulate-debate-team` with the scoring + Ralph loop pattern from `/persona-studio:simulate-meeting-team-ralph`. Satisfaction is evaluated after the round loop instead of after an agenda.

## Step 0 — Pre-flight + TUI

Same as `/persona-studio:simulate-debate-team` Step 0 plus the `/persona-studio:simulate-meeting-team-ralph` TUI inputs (target score, max iterations, 3 measurement criteria, and the automatic **Factual Grounding 4th criterion** with default goal 8/10 — scored via `python -m persona_studio.grounding.audit`).

## Steps 1-3 — Debate execution

Same round loop and user interruption window as `/persona-studio:simulate-debate-team`.

## Step 4 — Ralph scoring

After N rounds complete:
1. Run `python -m persona_studio.grounding.audit <transcript>` to compute the
   4th (Factual Grounding) criterion score and append the audit section.
2. Score each of the 3 user criteria + the 4th (Factual Grounding).
3. User's final verdict → re-run or finish.
On re-run, archive the current iteration as `iter-N`, then TeamCreate again with an improved dispatch prompt. If grounding was the criterion that failed, emphasize "stick to EVIDENCE BANK for factual claims" in the next-iteration dispatch.

## Steps 5-7 — Save, docs, report

Save path: `simulations/<topic-slug>/<ts>_debate-team-ralph.(md|docx|pptx)`
Markdown frontmatter: `kind: debate-team-ralph`, `mode: split-panes-ralph`, `satisfaction_goal/final/criteria`, `iterations_run`, `early_stop`.
Mandatory 3-axis body sections: `## Conclusion`, `## Satisfaction`, `## System Feedback`.
Docs: prefer `Skill('document-skills:docx')` + `Skill('document-skills:pptx')`, fall back to Python.
