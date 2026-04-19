# Persona Studio — Launch Drafts

Repository: <https://github.com/zirubak/persona-studio>

---

## 1. Show HN Post

### Title (80 chars max)

```
Show HN: Persona Studio – Rehearse meetings with AI avatars of real people
```

Alternate title if the above feels too long in the preview:

```
Show HN: Persona Studio – Parallel AI avatars in tmux, scored until good
```

### Body (≈220 words)

I kept walking into board meetings and investor calls wishing I'd rehearsed the pushback I was about to get. Doing it solo in my head never surfaced the hard questions. Doing it with ChatGPT role-play got me one generic voice that agreed with itself.

Persona Studio is what I built instead. It's a Claude Code plugin that (1) builds AI avatars from files you already have on someone — interviews, podcasts, YouTube transcripts, or just their name for public figures — and (2) runs them as separate agents in parallel tmux panes, so you see three or four people thinking at the same time.

A few things that were non-obvious to build:

- Each avatar runs in its own terminal pane as an independent Claude Code subagent. You can interrupt any of them mid-thought.
- Every simulation has a scored "Ralph loop": it grades itself against criteria you set (realistic pushback, concrete action items, in-voice dialogue) and re-runs with targeted feedback until the score clears your bar, capped at 5 iterations.
- Every transcript must end with Conclusion / Satisfaction Assessment / System Feedback. A validator rejects anything missing those. This is what turns "AI chat log" into "thing you'd actually re-read."

Stack: Claude Code plugin, Python 3.11 + tmux split-panes, faster-whisper for audio ingest, Anthropic document-skills for `.docx`/`.pptx` output with a Python fallback.

Repo + quickstart: <https://github.com/zirubak/persona-studio>

Happy to answer anything in the thread — especially about the Ralph loop scoring or the split-panes agent pattern.

### Pre-drafted responses to anticipated objections

**Objection 1 — "This is just ChatGPT role-play with extra steps."**

> Fair default skepticism. Three differences I found material in practice: (1) Parallel, not sequential — four personas in four panes means you watch them react to each other in real time, which catches disagreement single-threaded role-play flattens. (2) The Ralph loop actually measures the output. It scores "did they push back realistically?" against the criteria I specified, and re-runs with targeted feedback on the weakest criterion. I've had the same "debate" end at score 4 on try 1 and score 8 on try 3 after it noticed the CFO avatar had gone too agreeable. (3) Structured artifacts — every run drops a `.md` + `.docx` + `.pptx` with mandatory Conclusion / Satisfaction / Feedback sections, enforced by a schema validator. If any of those three aren't worth the "extra steps" for your workflow, the core idea really does reduce to role-play and you shouldn't install it.

**Objection 2 — "Ethics of impersonating real people."**

> Real concern, and I thought about this a lot. Two guardrails: (1) Celebrity mode only ingests publicly available material — interviews, podcasts, captioned videos. It refuses to operate on private documents you don't have a right to. (2) The README is explicit that this is a rehearsal tool, not a publishing tool. The output is labeled, saved locally, and git-ignored by default. Don't publish it as real quotes, and don't use commercial likeness rights you don't have. For the main use case I care about — rehearsing your own pitch against avatars of people who've already written books about how they invest — it's closer to studying interviews with a notebook than to deepfaking. For edge cases, review the generated profile before running. It's a plain markdown file. I'd rather users see and edit the avatar than have it be a black box.

**Objection 3 — "Why tmux? Seems overengineered."**

> I tried the single-window version first. Sequential rounds of "avatar 1 speaks, avatar 2 speaks, avatar 3 speaks" feel less like a meeting and more like reading a transcript with extra whitespace. Parallel panes changed the character of the output — avatars reference each other's in-flight reasoning, the facilitator can cut someone off mid-point, you can scroll back in one pane while another is still generating. tmux was the least-magic way to get that on a single machine without building a web UI. Claude Code already supports split-panes teammate mode, so the plugin just piggybacks on it — one flag (`--teammate-mode split-panes`) and a `tmux` binary on PATH. If someone wants a web dashboard, v0.7 on the roadmap is a Streamlit frontend; tmux is the CLI happy path, not the only one.

---

## 2. Reddit r/ClaudeAI Post

### Title

```
I built a Claude Code plugin that runs 4 AI personas in parallel tmux panes and scores the meeting until it's actually good
```

### Body (≈320 words)

Been using Claude Code daily since agent-teams split-panes shipped and I kept running into the same problem: I'd "rehearse" a pitch with Claude and get one smart, agreeable voice. No pushback. No disagreement. No "actually, that's the third time you've dodged the unit economics question."

So I built Persona Studio. It leans hard on Claude Code features you probably already have installed:

**What it uses**

- **Agent Teams (split-panes mode)** — each persona is its own Claude Code subagent in its own tmux pane. You watch 3–6 people think in parallel. You can interrupt any of them.
- **Anthropic document-skills** — `docx` and `pptx` skills generate the Word transcript and the summary deck. Falls back to a Python script if you don't have the skills installed.
- **Custom subagents** — personas live in `agents/persona-<name>.md` as proper Claude Code subagent definitions. Edit them by hand if the synthesized voice is off.
- **Ralph loop** — scored iteration, capped at 5 runs, with `<stop>` available at any time. This is the part I'm most happy with.

**The Ralph loop is the thing**

Before a meeting you set a goal score (0–10) and name the criteria. "Realistic pushback." "Action items with owners." "Stays in voice." After the meeting, the tool grades itself against each criterion. If the weighted score is below your goal, it asks whether to re-run with targeted feedback on the weakest criterion. Each iteration lands in `iter-1/`, `iter-2/`, etc., so you can compare. I've watched a boardroom sim go from "everyone nods" at iter-1 to "CFO won't drop the COGS question" at iter-3.

**Typical session**

```
claude --teammate-mode split-panes
/persona-studio:studio
→ Create avatar (Private: drop files in raw/, or Celebrity: just a name)
→ Run simulation → Meeting (Ralph) → 4 participants → Goal 8.0
→ Watch four panes go brrr
```

Repo: <https://github.com/zirubak/persona-studio>

MIT licensed. 112 tests. No marketplace listing yet — local install for now.

**What personas would you build first?** I'm genuinely curious. Mine are three VCs I've been trying to rehearse against, my former CTO, and my own avatar for self-critique (which is weirdly the most useful one).

---

## 3. Reddit r/LocalLLaMA Post

### Title

```
Interesting pattern: Evaluator-Optimizer loop + split-panes parallelism for multi-agent "meeting" simulations
```

### Body (≈300 words)

I want to share a pattern I've been building around, not pitch a tool. The tool is a concrete instance, but the interesting part ports to any agent framework that supports parallel child processes.

**The pattern**

1. **Evaluator-Optimizer loop over an N-agent simulation.** Classic Evaluator-Optimizer is single-generator + critic. I run it over a multi-agent "meeting": N personas speak, a facilitator runs the agenda, a separate evaluator scores the transcript against user-declared criteria, and the next iteration injects targeted feedback on the weakest criterion into the facilitator's system prompt. Hard-capped at 5 iterations with an early-stop when the score clears the threshold.

2. **Parallel panes instead of serialized turns.** Each persona is a separate process. Output is multiplexed (in my case via tmux, but any terminal multiplexer or even an MPI-style fan-out works). The character of the output changes noticeably once agents can see each other's in-flight reasoning instead of only the completed turn.

3. **Schema-validated transcripts.** Every run must end with Conclusion, Satisfaction Assessment, and System Feedback blocks. A lint step rejects runs missing any section. This is what makes the output reusable — without it you get chat logs.

**Why I'm posting here specifically**

The concrete implementation is on top of Claude Code (agent-teams split-panes, subagent definitions in `agents/persona-<name>.md`). That's a dependency, yes. But the pattern — scored multi-agent loop + parallel execution + structured output schema — has nothing Claude-specific in it. You could build this on Ollama + a tmux wrapper + your own evaluator prompt. I'd honestly love to see someone fork the ingest/evaluator/schema layer and swap the backend. I tried it briefly on local Llama 3 and the scoring step degraded below useful — the generator was fine, the evaluator needed a stronger model. That might be the interesting research question: how small can the evaluator go before self-scoring becomes noise?

Repo (for the pattern, not the sell): <https://github.com/zirubak/persona-studio>

Specifically look at `scripts/` for the loop controller and `tests/` for the schema validator.

Happy to hear how others are doing multi-agent meetings locally.

---

## 4. X/Twitter Thread (6 tweets, ≤280 chars each)

**Tweet 1 — Hook + link**

```
Persona Studio is public today.

Build AI avatars of real people (or yourself) from files or just a name. Run them as 4 parallel agents in tmux. Rehearse any meeting before the real thing.

Claude Code plugin, MIT.

github.com/zirubak/persona-studio
```

_(276 chars)_

**Tweet 2 — Problem**

```
The thing I kept wanting: rehearse an investor pitch with avatars of the people I'm about to pitch.

ChatGPT role-play gave me one agreeable voice.
Mock interviews with friends didn't scale.
I wanted 4 different minds pushing back at once.

So I built that.
```

_(257 chars)_

**Tweet 3 — Demo**

```
Here's a 3-person boardroom sim running in 3 tmux panes.

CEO, CFO, Head of Eng — each is a separate Claude Code subagent.
I pitched them a plan. They argued. The transcript, Word doc, and PowerPoint summary popped out at the end.

[GIF]
```

_(257 chars)_

**Tweet 4 — Ralph loop**

```
The novel bit: the Ralph loop.

You set a goal score and criteria ("realistic pushback", "concrete action items").
The tool scores its own meeting.
If it's below your goal, it re-runs with targeted feedback on the weakest criterion.
Capped at 5 iters. <stop> exits early.
```

_(276 chars)_

**Tweet 5 — Three-axis rule**

```
Every transcript MUST end with three blocks:

- Conclusion (what was decided)
- Satisfaction Assessment (scores per criterion)
- System Feedback (notes for next time)

A validator rejects anything missing a section.
This is what turns an AI chat log into a file you re-read.
```

_(278 chars)_

**Tweet 6 — What's next + CTA**

```
Next up:
- Auto-refine avatars from meeting feedback (v0.5)
- RAG across past meetings (v0.6)
- Streamlit dashboard for non-CLI users (v0.7)

Star the repo if this is useful. Reply with the persona you'd build first — I'm genuinely curious.

github.com/zirubak/persona-studio
```

_(268 chars)_

---

## 5. Launch Day Checklist

Operational plan for the morning of launch. Work top to bottom. Times in the poster's local timezone; convert for target audiences.

### T-24h — Pre-flight

- [ ] Re-read the README end to end as a first-time visitor. Fix any broken links, typos, or missing images.
- [ ] Confirm `sample_private` avatar still works from a fresh clone on a clean machine. A broken quickstart kills a Show HN in under an hour.
- [ ] Record the tmux split-panes GIF for the X thread. 10–15 seconds. Trim aggressively. Store at `docs/assets/launch-demo.gif`. Verify it auto-plays on X and on GitHub.
- [ ] Pre-write the top 5 FAQ answers in a local notes file so you can paste-edit, not type, under time pressure.
- [ ] Enable GitHub Issues, Discussions, and a pinned "Launch feedback" issue.
- [ ] Check star count. Screenshot it. You'll want the before/after.

### T-2h — Pre-warm

- [ ] DM (not group-blast) 8–15 people who have genuinely used the tool or care about the space. Ask them to upvote/comment if they find it useful — do not ask them to upvote without looking. HN ranking heavily penalizes visible ring-voting; authentic engagement from people who actually look at the page is the goal.
- [ ] Post a "soft" mention to any small Claude Code / agent-dev Slack or Discord you're in. Keep it honest: "I'm about to Show HN this, would love eyes on the README."
- [ ] Queue the X thread as a draft. Don't schedule — you post it manually after the HN submission lands.

### T-0 — Posting order and times

Target **Tuesday, Wednesday, or Thursday** for the HN submission. Avoid Fridays, weekends, US holidays.

Recommended posting window: **08:00–10:00 US Pacific / 11:00–13:00 US Eastern**. This catches the US morning + the late-afternoon EU wave.

Order:

1. **Show HN first.** Submit, then do NOT touch the post for 30 minutes. Don't edit. Don't ask for upvotes. Go get coffee.
2. **X thread, 10 minutes after HN submission.** Include the HN link in a reply tweet, not tweet 1. Tweet 1 links the repo, the reply links the HN thread so discoverers can pile on.
3. **Reddit r/ClaudeAI, ~45 minutes after HN.** Different audience, different tone — the audiences overlap but don't cross-pollinate negatively.
4. **Reddit r/LocalLLaMA, ~2 hours after HN.** Gives the HN thread air first. LocalLLaMA readers will absolutely click through to the HN thread anyway; posting later looks less like a carpet-bomb.

### T-0 to T+4h — Monitor and respond

- [ ] Keep HN open in one tab, X notifications in a second, Reddit inbox in a third. Use a timer — respond to comments in batches every 15 minutes, not continuously. Context-switching kills response quality.
- [ ] **Respond to every top-level HN comment within the first 2 hours.** This is the single biggest controllable lever for whether the post gains momentum. Use the pre-drafted objection responses as starting points, never paste them verbatim — tailor to the specific wording.
- [ ] If a comment is factually wrong about the project, correct it politely with a code or README reference. If a comment is a legitimate critique, acknowledge it explicitly and say what you'd change. HN rewards "you're right, I'll fix that" vastly more than defensiveness.
- [ ] **Never argue in the HN thread.** If someone is hostile or clearly not reading, state your position once, thank them, move on. Other readers judge your composure, not whether you "won."
- [ ] Screenshot any especially good comment threads for the retrospective. These become future blog material.

### If it dies on the front page

"Dying" means: posted, climbed to front page, then fell off before a full business-day cycle (say, dropped below #30 within 4 hours of posting). This happens to most Show HN submissions. It is not catastrophic.

- [ ] **Do not repost the same day.** You'll get shadow-penalized.
- [ ] Check the thread for high-quality comments you didn't respond to. Respond, even late. HN rewards long-tail engagement; a good comment reply at hour 8 can pull the thread back.
- [ ] Post a short retrospective to your own audience — "Launched, here's what I learned." This converts a dead HN post into a live personal-brand post, and people who missed HN will see it.
- [ ] Mine the comments for real critiques. Pick 1–2 that would genuinely improve the product. Ship them this week. A "thanks, fixed" tweet two weeks later is a legitimate second launch moment.
- [ ] You can resubmit to HN once after substantive changes — new features, new angle — but wait at least 2 weeks. Use a materially different title.

### T+24h — Cool-down

- [ ] Export the HN thread to a local file (comments change / get edited / deleted).
- [ ] Tally stars, issues, PRs, X followers gained. Log the before/after in a plain text note.
- [ ] Write a 1-page retrospective: what worked, what bombed, what you'd change for v0.5's launch. File it in `docs/launch-retro-<date>.md`. This is the compound-learning artifact.
- [ ] Reply to anyone who DMed offering help or collaboration within 48 hours. The best long-term wins from a launch are usually in the DMs, not the thread.

### Posture notes

- **You are not your launch.** The numbers are data about the post, not about the project or you. A 30-point HN thread with 3 serious users is a better outcome than a 900-point thread with zero installs.
- **Honesty beats hype on every channel you're targeting.** HN especially. If you find yourself typing a superlative, delete the sentence and state the fact.
- **Answer the question under the question.** "Why tmux" is usually "is this overengineered"; "ethics?" is usually "how do I explain this to my boss." Address the real concern.
