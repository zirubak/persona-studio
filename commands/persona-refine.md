---
description: Update specific sections of an existing persona based on user feedback. Usage: /persona-studio:persona-refine <name>
---

# /persona-studio:persona-refine

$ARGUMENTS

## Step 0 — Resolve target

Personas may live in two scopes (see `/persona-studio:create-persona` Step 0):
- Project-local: `./personas/*.md` and `./agents/persona-*.md`
- Global: `$HOME/.persona-studio/personas/*.md` and
  `$HOME/.persona-studio/agents/persona-*.md`

If `<name>` is missing, Glob BOTH scopes, dedupe by filename stem with the
**project-local winning on conflict**, and present the combined list via
AskUserQuestion (prefix each entry with `[project]` or `[global]` so the user
knows where it lives).

Once `<name>` is known, resolve the target file with project-priority:

1. If `./personas/<name>.md` exists → `SCOPE=project`, `BASE=.`
2. Else if `$HOME/.persona-studio/personas/<name>.md` exists →
   `SCOPE=global`, `BASE=$HOME/.persona-studio`
3. Else: stop and tell the user that `<name>` was not found in either scope.

All edits in this command apply to the resolved `$BASE`. Never move files
between scopes silently — if a user wants to promote a project persona to
global (or vice versa), that is a separate explicit copy step.

Extract the section headings from `$BASE/personas/<name>.md` for use in Step 1.

## Step 1 — Collect feedback

AskUserQuestion:
- `Which sections would you like to edit?` → multiSelect across detected headings
  (Background / Personality / Knowledge Domains / Debate Style / Speech Patterns /
   Demographic-derived Patterns / Quoted Evidence).

For each selected section, ask a free-text follow-up:
- `How does this section differ from the real person? Please share concrete observations or examples.`

## Step 2 — Apply edits

For each selected section:
1. Read the current content from `$BASE/personas/<name>.md`.
2. Rewrite only that section based on the feedback, preserving Markdown formatting
   and the evidence-citation discipline (every new claim must cite corpus or
   perplexity notes, or be marked `[user-confirmed]`).
3. Use the `Edit` tool on `$BASE/personas/<name>.md` scoped to that section only.

Never touch other sections.

## Step 3 — Re-render subagent

Re-render `$BASE/agents/persona-<name>.md` from the updated
`$BASE/personas/<name>.md` (same template as `/persona-studio:create-persona` Step 5).

## Step 4 — Diff summary

Show the user:
- Which sections changed (one line each).
- The scope the edits were applied in (`project` or `global`).
- That the next simulation in any project (for global personas) or in this
  project (for project personas) will pick up the change automatically.

Return control to the caller.
