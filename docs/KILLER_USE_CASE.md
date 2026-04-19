# Killer Use-Case Proposal: YC Partner Panel Rehearsal

**Decision date**: 2026-04-19
**Author**: use-case strategy (pre-launch)
**Status**: Proposal — pending team-lead approval before README rewrite

---

## 1. Pick & Rationale

**Winner: YC pitch rehearsal against AI avatars of Michael Seibel, Garry Tan, and Jared Friedman.**

Three reasons this beats the other two finalists at launch:

1. **Distribution math.** GitHub README traffic on launch week comes from Hacker News + startup X/Twitter. That audience *is* YC. A founder seeing "rehearse your YC interview with AI Garry Tan" in a HN title clicks at 3–5x the rate of a generic pitch tool. Interview prep (TAM ~every job seeker) is bigger but lives inside Google/LinkedIn's ad funnel; it cannot win the HN homepage. Writer dialogue has no launch-week channel at all.
2. **Product-market fit with our two unique features.** Nobody else does concurrent multi-persona cross-talk in separate terminal panes with iterative scoring. A YC interview *is* three partners interrupting you in 10 minutes, then you iterating until demo day. Split-panes maps to the panel. Ralph loop maps to prep cycles. Competitors' single-role ChatGPT prompts cannot replicate this.
3. **Corpus density.** Seibel/Tan/Friedman have 500+ hours of public YouTube and 10,000+ posts. The Celebrity mode produces uncannily accurate avatars on day one — no user setup required. This is not true for the average hiring manager or a fictional character.

Supporting uses (interview prep, strategy decks, character dialogue) remain in the README as proof of breadth, not as the lead.

---

## 2. New Tagline (replaces line 4 subtitle)

> **Rehearse your YC interview against AI avatars of the partners. Ten minutes. A hundred times. Before it counts.**

---

## 3. Rewritten "What is this?" H1

Replaces line 28 (`# Rehearse any meeting, with anyone, before it happens`):

> # The YC interview is ten minutes. Rehearse it a hundred times.

Supporting subhead (new paragraph under H1, replaces lines 30–36):

Persona Studio is a **Claude Code plugin** that builds AI avatars of Michael Seibel, Garry Tan, Jared Friedman — or whoever you're about to pitch to — from their public interviews, podcasts, and X threads. Then it sits them across the table from you in separate terminal panes and lets them interrupt, push back, and disagree with each other about your deck. Every re-run scores itself against your prep goals and retries until the pushback feels real. Walk in on interview day having already heard the hardest question forty times.

You don't write any code. `/persona-studio:studio`, arrow keys, done. The rest of this README is proof.

---

## 4. "What can I do with this?" Table (rewritten, killer use-case as row 1)

Replaces lines 40–63. Row 1 gets 3x depth; rows 2–5 stay tight.

<table>
<tr>
<td valign="top" width="28%"><strong>Pitch to the YC partner panel (before YC does)</strong><br/><sub>The flagship use-case</sub></td>
<td>
Build avatars of Michael Seibel, Garry Tan, and Jared Friedman from their public interviews, YC office-hours videos, and X posts — Celebrity mode, no files needed. Put them in three terminal panes and pitch your ten-minute interview. They interrupt you. They interrupt each other. One challenges your growth rate. Another asks why you, why now. The third pushes back on your TAM. Every round, the Ralph loop scores the session against your goals ("realistic objections", "actionable deck fixes", "partners stay in voice") and, if the score is below your bar, automatically re-runs with targeted feedback until it lands.<br/><br/>
You get three files per run: a Word transcript of every question you couldn't answer, a PowerPoint summary of deck fixes with owners and deadlines, and a Markdown log you can diff across attempts. Iteration history is preserved in <code>iter-1/</code>, <code>iter-2/</code> folders so you can see your pitch tighten. By the real interview you've already heard the worst version of every question — forty times.<br/><br/>
<strong>Why this works here and nowhere else:</strong> ChatGPT does single role-play, one voice at a time, no scoring, no re-run. Real YC interviews are three partners talking over each other in ten minutes. Split-panes reproduces the cross-talk. Ralph loop reproduces the prep cycle. The avatars are uncanny because the corpus is enormous.
</td>
</tr>
<tr>
<td valign="top"><strong>Stress-test a strategic decision</strong></td>
<td>Build avatars of your CEO, CFO, and Head of Engineering from board decks and All-Hands recordings. Propose a plan. Watch them argue. Adopt what survives.</td>
</tr>
<tr>
<td valign="top"><strong>Prep for a hiring panel</strong></td>
<td>Build avatars of the hiring manager and two teammates from their LinkedIn, blog posts, and conference talks. Role-play the loop. Get a scorecard per interviewer.</td>
</tr>
<tr>
<td valign="top"><strong>Draft a strategy deck from a meeting</strong></td>
<td>Run a 3-person meeting on your strategy. You get a Word transcript and a PowerPoint summary with action items — already formatted, already assigned.</td>
</tr>
<tr>
<td valign="top"><strong>Write character dialogue that isn't flat</strong></td>
<td>Novelists and screenwriters: build avatars of your characters, let them debate a plot point, use the transcript as first-draft dialogue.</td>
</tr>
</table>

---

## 5. Three Copy-Pasteable Example Commands

A visitor lands on the README, wants to try the killer use-case in two minutes. These three commands, in order, take them from zero to scored YC panel.

### Command 1 — Build the three partner avatars (Celebrity mode, no upload)

```
/persona-studio:create-persona garry_tan --mode celebrity
```

At the hint prompt, paste:

```
YC President, former Initialized Capital GP, ex-Posthaven co-founder. Long X threads
on founder grit, distribution, and why most YC apps get rejected. Blunt, data-driven,
asks 'why you, why now' more than anything else.
```

Repeat for `michael_seibel` ("YC MD, former Justin.tv / Socialcam co-founder, hosts Startup School. Asks about founder-market fit and what the user does in a week.") and `jared_friedman` ("YC partner, former Scribd co-founder. Asks about TAM, distribution channel, and unit economics before he asks about the product.").

Three avatars, ~90 seconds total, zero files required.

### Command 2 — Run the ten-minute panel with Ralph loop

```
/persona-studio:simulate-meeting-team-ralph
```

When prompted, provide:

- **Topic**: `10-minute YC S26 interview. Startup: Airbnb for self-storage. $14K MRR, 40% MoM growth for 3 months, 2 technical co-founders, SF-based.`
- **Participants**: `garry_tan, michael_seibel, jared_friedman`
- **Goals (0–10, set bar at 8)**:
  - Realistic partner pushback (no softballs)
  - Concrete "fix this in the deck before demo day" list with owner + deadline
  - Partners disagree with each other at least once per round
  - Founder (you) gets interrupted mid-sentence at least twice

The loop runs the interview, scores it against your goals, and if any criterion is below 8, re-runs with a sharper prompt on that specific weakness. Hard-capped at 5 iterations. Type `<stop>` any time.

### Command 3 — Menu entry (if you skipped commands 1–2)

```
/persona-studio:studio
```

Arrow keys: **Run a simulation → Meeting (with Ralph loop) → pick the 3 partners → paste your topic → set goal score 8**. Same result, zero typing.

Output lands in `simulations/10-minute-yc-s26-interview/<timestamp>.{md,docx,pptx}`.

---

## 6. Proposed README Front-Matter Changes (first 60 lines)

Summary of edits needed to amplify the YC use-case across the fold. Every line earns its place.

| Line(s) | Current | Proposed | Why |
| --- | --- | --- | --- |
| 4 | "Build AI avatars of real people (or yourself), then rehearse meetings with them before the real thing." | Tagline from §2 above. | Current subtitle is generic ("real people", "meetings"). The new one names YC, names the stakes ("ten minutes"), and promises the core loop ("a hundred times"). |
| 15–22 badges | MIT / plugin / no-code / python / tmux / v0.4.0 | Keep all six. **Add one badge**: `<img src="https://img.shields.io/badge/built_for-YC_applicants-ff6600" alt="Built for YC applicants" />` | Free co-sign with Y Combinator's orange. Signals the core audience on first paint. |
| 7–12 nav | Quickstart · Examples · Commands · FAQ · 한국어 | Insert **YC Panel Demo** as first link, pointing to a new `#yc-panel-demo` anchor (the 3 commands from §5). | Gives HN readers a single anchor to click. "Examples" is too abstract. |
| 26–36 "What is this?" | 3-step bulleted explainer starting with "Build AI avatars". | Replace with §3 H1 + new subhead. | Current explainer front-loads the mechanism (build, run, export). New one front-loads the outcome (survive YC) and relegates the mechanism to a single paragraph. Outcome-first reads better on HN. |
| 40–63 table | 5 rows of equal weight. | Replace with §4 table — row 1 is the killer, rows 2–5 are tight. | Breadth is still shown, but the visitor's first second on the page is spent on the winning use-case, not comparing five equally-weighted bullets. |
| NEW after line 63 | — | Insert a new section `## YC Panel Demo — two commands, ninety seconds` containing the three commands from §5, a terminal GIF placeholder (`docs/assets/yc-panel-demo.gif`), and a single line: *"If you stop reading here, at least run this."* | Anchor target for the nav link. Visual proof. Forces the visitor to try it. |
| 67–74 "Who is this for?" | Founders / PMs / language learners / devs. | Reorder to lead with **"YC S26 / W27 applicants — this is for you first"**, then the rest. Keep the list short. | Explicit audience. The people who most need this should see themselves in the first line. |

### Secondary amplifiers (below the fold, later in the README)

These are not front-matter but support the YC framing downstream. Flag for follow-up edits if team-lead approves:

- **"Your first 10 minutes" section (line 132)**: change the sample run from `The future of remote work` debate to `YC S26 interview — rehearse the first 10 minutes` meeting with the three sample partners. This turns the onboarding sample into the killer use-case itself.
- **FAQ "How is this different from ChatGPT?" (line 318)**: rewrite the first bullet to lead with the YC example: *"ChatGPT role-plays one partner at a time. Garry doesn't get to interrupt Michael. In Persona Studio, they talk over each other in separate panes — which is what a real YC interview sounds like."*
- **"Can I use this to impersonate someone?" FAQ (line 288)**: strengthen the disclaimer — specifically call out that avatar output of public figures like YC partners is for private rehearsal only, never for published content or deceptive use. This protects us legally on the one use-case we're now leading with.

### What we do NOT change

- Badges other than the new YC one: keep all version/tmux/python signals. Audience is technical.
- Quickstart, Commands, FAQ body: mostly unchanged. They are reference, not pitch.
- Roadmap / License / Contributing: untouched.
- Korean README: defer translation of the new front matter to a follow-up.

---

## Risk Register (one paragraph, for team-lead awareness)

Leading with named YC partners is legally sensitive. Before launch we need: (1) a visible "for private rehearsal only, review before use, do not republish" banner above the YC demo section; (2) the existing line 288 FAQ tightened; (3) a one-line disclaimer inside every generated transcript header that includes a named public figure; (4) agreement that if any of the three partners objects publicly, we swap to generic "three YC-style partners" framing within 24h. None of this blocks launch — all four items are copy changes, not code changes.

---

## Decision Summary (one line)

Lead the README with "Rehearse your YC interview against AI Garry/Michael/Jared before it counts", restructure the first 60 lines per §6, and ship a GIF of the three-pane panel running a Ralph loop on `docs/assets/yc-panel-demo.gif` before any launch-week post goes live.
