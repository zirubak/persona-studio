---
description: Update specific sections of an existing persona based on user feedback. Usage: /persona-studio:persona-refine <name>
---

# /persona-studio:persona-refine

$ARGUMENTS

## Step 0 — Resolve target

If `<name>` missing, Glob `personas/*.md` and AskUserQuestion for the target.

Read `personas/<name>.md`. Confirm it exists and extract the section headings.

## Step 1 — Collect feedback

AskUserQuestion:
- `어느 섹션을 수정할까요?` → multiSelect across detected headings
  (Background / Personality / Knowledge Domains / Debate Style / Speech Patterns /
   Demographic-derived Patterns / Quoted Evidence).

For each selected section, ask a free-text follow-up:
- `이 섹션에서 실제 인물과 어떤 점이 다릅니까? 구체적인 관찰/예시를 알려주세요.`

## Step 2 — Apply edits

For each selected section:
1. Read the current content.
2. Rewrite only that section based on the feedback, preserving Markdown formatting
   and the evidence-citation discipline (every new claim must cite corpus or
   perplexity notes, or be marked `[user-confirmed]`).
3. Use the `Edit` tool on `personas/<name>.md` scoped to that section only.

Never touch other sections.

## Step 3 — Re-render subagent

Re-render `agents/persona-<name>.md` from the updated
`personas/<name>.md` (same template as `/persona-studio:create-persona` Step 5).

## Step 4 — Diff summary

Show the user which sections changed (one line each) and where the next
simulation will pick up the change. Return control to the caller.
