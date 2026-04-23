<p align="center">
  <img src="docs/assets/hero.png" alt="Persona Studio — AI avatars running a virtual meeting in parallel tmux panes" width="900" />
</p>

<h1 align="center">Persona Studio</h1>

<p align="center">
  <strong>Rehearse tomorrow's meeting today. With avatars of the actual people who'll be in the room.</strong>
</p>

<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> &middot;
  <a href="#what-can-i-do-with-this"><strong>Examples</strong></a> &middot;
  <a href="#commands"><strong>Commands</strong></a> &middot;
  <a href="#faq"><strong>FAQ</strong></a> &middot;
  <a href="README.ko.md"><strong>한국어</strong></a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/claude--code-plugin-ff6f00" alt="Claude Code plugin" />
  <img src="https://img.shields.io/badge/no--coding--required-brightgreen" alt="No coding required" />
  <img src="https://img.shields.io/badge/python-3.11%2B-3776AB?logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/tmux-required-1BB91F?logo=tmux&logoColor=white" alt="tmux required" />
  <img src="https://img.shields.io/badge/version-0.5.0-purple" alt="v0.5.0" />
</p>

<br/>

## What is this?

# Nervous about tomorrow's meeting? Run it today. With everyone in the room.

Got a **job interview** with three people you've never met? Feed their LinkedIn and a podcast each to Persona Studio, and you'll spend the night before hearing the exact questions they actually ask — in their actual voices.

Got a **team meeting** where you need to pitch an idea to your boss, your PM, and the skeptical engineer? Build avatars of the three of them from their Slack messages and past All-Hands. Pitch to them. Watch them interrupt each other. Tweak your pitch. Do it again.

Persona Studio is a **Claude Code plugin** that turns real people's public (or private) material into AI avatars who talk back like the real thing — all at once, in separate terminal panes. You don't write any code. `/persona-studio:studio`, arrow keys, done.

<br/>

## What can I do with this?

<table>
<tr>
<td valign="top" width="26%"><strong>Job interview prep</strong><br/><sub>The most common use-case</sub></td>
<td>
Got a panel interview in three days? Drop the interviewers' LinkedIn pages, a podcast episode each, and any blog posts they've written into a folder. Persona Studio builds three avatars — the hiring manager, the senior engineer, the culture-fit screener — and runs your mock interview with all three at once, each in their own terminal pane.
<br/><br/>
They ask their actual questions. They react to your answers. They disagree with each other about whether you're a fit. You get a Word transcript of every question you stumbled on and a PowerPoint scorecard per interviewer. Tomorrow night you run it again with the feedback — and again, until you walk in on interview day having already heard every hard question forty times.
</td>
</tr>
<tr>
<td valign="top"><strong>Team meeting prep</strong></td>
<td>Tomorrow you pitch an idea to your boss, the PM, and an engineer who always pushes back. Build avatars of the three from their Slack messages and last quarter's All-Hands recording. Pitch. Watch them argue. Fix the weak bits. Walk into the real meeting knowing exactly where pushback will come from.</td>
</tr>
<tr>
<td valign="top"><strong>Brainstorming with smart friends</strong></td>
<td>Stuck on a problem at 11 PM and everyone you'd ask is asleep? Open a room with avatars of three thinkers you trust — a founder you follow, a professor from college, a senior engineer whose blog you read. Throw the problem on the table. Let them riff from completely different angles. The friction between their perspectives surfaces ideas you wouldn't reach solo. The repo ships with <code>paul_graham</code>, <code>naval_ravikant</code>, and <code>dhh</code> ready to go — try them first.</td>
</tr>
<tr>
<td valign="top"><strong>Difficult conversation rehearsal</strong></td>
<td>Performance review, salary negotiation, breaking up with a client, giving tough feedback to a direct report. Build an avatar of the other person from emails and past 1:1 notes. Run the conversation before you have it. See how they'll likely react. Adjust your approach.</td>
</tr>
<tr>
<td valign="top"><strong>Stakeholder stress-test</strong></td>
<td>Build avatars of your CEO, CFO, and Head of Engineering from board decks and All-Hands recordings. Propose a plan. Watch them argue. Adopt what survives. You end up with a Word doc of every objection and a PowerPoint of the action items that won.</td>
</tr>
<tr>
<td valign="top"><strong>Writing realistic dialogue</strong></td>
<td>Novelists and screenwriters: build avatars of your characters from their backstories, let them debate a plot point, use the transcript as first-draft dialogue. The friction between different "voices" is what makes characters feel real.</td>
</tr>
</table>

<br/>

## Who is this for?

- **Anyone interviewing for a job** — panel interviews are the killer use-case. Build avatars of the people on the other side of the table, rehearse all night, walk in calm.
- **Employees prepping for an important meeting** — the one where you pitch to your boss, PM, and the engineer who always pushes back. Know where the pushback will come from before you start.
- **People avoiding a hard conversation** — performance reviews, salary talks, breakups at work. Rehearse the other person's likely reactions before the real thing.
- **Founders & PMs** — stakeholder meetings, investor pitches, customer calls. Any room where more than one voice matters.
- **Writers & screenwriters** — characters that talk past each other instead of through each other. The friction is the whole point.
- **Developers using Claude Code** — a working reference for Agent Teams + Ralph loop + split-panes.

**If you can use a web browser and type a few commands into a terminal, you can use this.**

<br/>

## Quickstart

### Step 1 — Install Claude Code (5 minutes)

Follow Anthropic's guide: <https://docs.claude.com/en/docs/claude-code/quickstart>

You need a Claude account. The CLI runs on macOS, Linux, and Windows (WSL).

### Step 2 — Install a terminal helper (2 minutes)

You need **tmux** — a tool that lets multiple terminal windows share one screen. This is how avatars "appear to talk at the same time."

```bash
# macOS
brew install tmux

# Ubuntu / Debian / WSL
sudo apt install tmux
```

### Step 3 — Get Persona Studio (1 minute)

```bash
git clone https://github.com/zirubak/persona-studio.git
cd persona-studio
claude --teammate-mode split-panes
```

That last line opens Claude Code with "multi-pane mode" turned on.

### Step 4 — Install the plugin (30 seconds)

Inside Claude Code, type:

```
/plugin marketplace add /full/path/to/persona-studio
/plugin install persona-studio@persona-studio-local
/reload-plugins
```

> Tip: On macOS you can drag the folder into the terminal to get the full path automatically.

### Step 4.5 — Updating to a new version

Claude Code caches the plugin at install time. Pulling new code with `git pull` does NOT refresh the active plugin — you have to tell Claude Code explicitly:

```
/plugin marketplace update persona-studio-local
/plugin install persona-studio@persona-studio-local
/reload-plugins
```

After `/reload-plugins` you should see the new version active in the next `/persona-studio:studio` invocation. Check which version is actually loaded by running:

```bash
ls ~/.claude/plugins/cache/persona-studio-local/persona-studio/
```

Multiple version directories can coexist (old caches are not auto-pruned). The one Claude Code loads is whatever version matches the current `marketplace.json` in the repo. If you see a stale version after an update, restart the Claude Code session.

### Step 5 — Launch the menu

```
/persona-studio:studio
```

The first time you run this, the tool sets itself up (takes 2-3 minutes: it downloads some models and prepares a Python environment). After that, every launch is instant.

From here, use the arrow keys to navigate. **You don't need to type commands again.**

<br/>

## Your first 10 minutes

The repo ships **four ready-made sample avatars** so you can run a full meeting without uploading anything:

- `sample_private` — a fictional Korean engineering lead (shows the Private-mode format)
- `paul_graham` — YC founder, essayist (built from public essays + podcasts)
- `naval_ravikant` — AngelList founder, aphorist-philosopher
- `dhh` — Rails creator, Basecamp co-founder, direct-style debater

Try this:

1. Launch: `/persona-studio:studio`
2. Pick: **"Run a simulation"** → **"Meeting (with Ralph loop)"**
3. Topic: `Should a two-person team build a mobile app or a web app first in 2026?`
4. Participants: pick `paul_graham`, `naval_ravikant`, `dhh` (they will disagree — that's the point)
5. Goal score: `7`. Max iterations: `3`.
6. Watch them argue in three panes for three rounds
7. Find your transcript at `simulations/<topic>/<timestamp>.{md,docx,pptx}`

Then build your own avatar — Private mode (upload your files) or Celebrity mode (name + hint only).

<br/>

## Building your own avatar

### Option A — From files you have (Private mode)

Drop any of these into `data/people/<name>/raw/`:

- PDF, DOCX, TXT, HTML (interviews, articles, transcripts)
- MP3, WAV, M4A (podcast episodes, voice memos — auto-transcribed)
- `urls.txt` — one URL per line (news articles)
- `youtube_urls.txt` — one YouTube URL per line (auto-caption extracted)

Then from Claude Code:

```
/persona-studio:studio
  → "Create a new avatar" → "Private (upload)" → type the name
```

The tool reads everything, extracts the person's voice and perspective, and produces:

- `personas/<name>.md` — a plain-English profile you can read and hand-edit.
- `agents/persona-<name>.md` — the machine-readable version used during meetings.

### Option B — From a name only (Celebrity mode)

No files? Just a name? The tool can search the web, pull YouTube captions, and synthesize an avatar from public material:

```
/persona-studio:studio
  → "Create a new avatar" → "Celebrity (name only)" → type the name + a hint
```

Example hints: `"Korean film director, active 1990s-present"` or `"US software engineer, known for React"`.

> Persona Studio only uses **public material**. It does not impersonate real people for malicious use. Review the generated profile and edit anything that feels off.

<br/>

## What's a "Ralph loop" and why should I care?

Most AI meeting tools give you one answer and stop.

**Ralph loop** keeps re-running the meeting until you're actually satisfied:

1. Before the meeting, you set a **goal score** (0–10) and name the criteria you care about. Example: `"Realistic pushback between participants"`, `"Concrete action items with owners and deadlines"`, `"Characters stay in voice"`.
2. After the meeting, the tool scores itself against your criteria.
3. If the score is below your goal, it asks: `"Run again with feedback on what was weak?"`
4. If you say yes, it re-runs with a stronger prompt targeting the weak criterion.
5. Each re-run is saved in an `iter-1/`, `iter-2/` subfolder so you can compare.

You can stop the loop any time by typing `<stop>`. The tool hard-caps at 5 iterations by default.

<br/>

## Commands

Once the plugin is installed, every feature has a slash-command in Claude Code. **Most users only need one: `/persona-studio:studio`** (the menu).

<details>
<summary><strong>Avatar-building commands (4)</strong></summary>

| Command | What it does |
| --- | --- |
| `/persona-studio:studio` | Opens the TUI menu. Everything else is reachable from here. |
| `/persona-studio:create-persona <name> [--mode private\|celebrity]` | Build an avatar directly (skip the menu). |
| `/persona-studio:persona-refine <name>` | Edit specific parts of an existing avatar (fix a wrong catchphrase, update their position, etc.). |
| `/persona-studio:persona-setup` | Re-run the first-time setup (venv + dependencies + speech-to-text model). |

</details>

<details>
<summary><strong>Simulation commands (6)</strong></summary>

Two formats × three "modes":

| Command | Format | Mode |
| --- | --- | --- |
| `/persona-studio:simulate-debate` | Round-robin (everyone speaks in turn on the same topic) | Simple (no tmux needed) |
| `/persona-studio:simulate-debate-team` | Same, but with every avatar in its own terminal pane | Parallel (tmux) |
| `/persona-studio:simulate-debate-team-ralph` | Parallel + Ralph loop | Scored + auto re-run |
| `/persona-studio:simulate-meeting` | Facilitator-led (the tool plays the chairperson, calls on people per agenda item) | Simple |
| `/persona-studio:simulate-meeting-team` | Facilitator-led with parallel panes | Parallel (tmux) |
| `/persona-studio:simulate-meeting-team-ralph` | Facilitator-led + Ralph loop | Scored + auto re-run |

**Which should I pick?**

- New to this? Start with `/persona-studio:studio` and pick from the menu.
- Want a fast brainstorm? `simulate-debate`.
- Want a structured meeting with an agenda? `simulate-meeting`.
- Want the best possible output with automatic re-runs? `simulate-*-team-ralph`.

</details>

<br/>

## Persona Library — project-local vs. global

Avatars live in one of two places, chosen automatically by mode:

| Mode | Stored in | Why |
| --- | --- | --- |
| Private (your own files) | `./personas/` + `./agents/` inside the current project | Private materials are usually tied to one project. |
| Celebrity (public figure) | `$HOME/.persona-studio/` (global library) | Public figures are useful in every project — build once, reuse everywhere. |

Every `simulate-*` command globs **both** locations and lets you pick participants from the combined list. On name collision, the project-local version wins. Meeting outputs (`simulations/`) stay project-local — they are artifacts of the project they were run in.

Folder layout (only created when you first save a global persona):

```
~/.persona-studio/
├── personas/            # Source of truth
├── agents/              # Rendered Claude Code subagents
└── data/people/<name>/  # Raw materials + ETL output
```

Add it to your dotfiles-sync or backup set and your library travels with you across machines.

<br/>

## Factual grounding (hallucination reduction)

Every simulation runs a three-tier grounding stack by default, so the transcript tells you — at the line level — which sentences are anchored in real evidence and which ones the model invented. A `## Factual Grounding` table at the end of each transcript summarizes per-avatar scores, and the Ralph loop reads that score as a default 4th criterion (goal 8/10) to auto-trigger a re-run when an avatar hallucinates too much.

Tags you will see inline in the transcript:

- `[SUPPORTED: source:line]` — Tier-1 found matching evidence in the persona's local corpus.
- `[UNSUPPORTED]` / `[UNVERIFIABLE]` / `[OPINION]` — Tier-1 found contradicting, missing, or non-factual content.
- `[VERIFIED-EXTERNAL: tool url]` / `[UNVERIFIED-EXTERNAL]` — Tier-2 checked the claim via Perplexity MCP (if installed) or WebSearch.
- `[FACT-CHECKER CHALLENGE: reason]` — Tier-3 Chain-of-Verification caught a discrepancy and forced the avatar to retract, cite, or restate under a `[retract/defend]` block.

Disable the whole layer for pure-brainstorm sessions via the `/persona-studio:studio` menu. See [docs/FACTUAL_GROUNDING.md](docs/FACTUAL_GROUNDING.md) for the full mechanics.

<br/>

## Browser prototype (experimental)

Persona Studio has been a CLI plugin from day one, but a **clickable browser prototype** of the proposed web UI now lives in [`web/`](web/) — 9 screens (Home, Library, Avatar detail, Create, Setup, Live simulation, Results, Settings, Cloud · soon), built as a single HTML page that loads JSX files at runtime. **No build step required**.

```bash
cd web/
# Option 1 — any static server
python3 -m http.server 7777
# Option 2 — npx serve
npx --yes serve -l 7777 .
# then open http://localhost:7777/hifi-v2.html
```

What it does today:

- **Fully clickable flow** — use the nav pills or ← / → arrows to walk through the 9 screens; click hotspots on each screen to move forward on the "happy path" (Home → Setup → Live → Results).
- **Mock data only** — avatars, simulations, and transcripts shown are design placeholders. This prototype does not yet call the Python grounding or simulation pipeline under `src/persona_studio/`.
- **Guest mode indicator** — the chrome shows "GUEST MODE · LOCAL ONLY" to signal the future behavior; today there is no persistence beyond the nav selection in `localStorage`.

What it does NOT do yet:

- No real Ralph simulation (the Live view is animated with scripted turns, not actual LLM output).
- No write to `data/people/` or `simulations/`.
- No auth / account / Cloud features — those screens are intentionally hidden and labelled "Cloud · soon".

Want to help wire the prototype to the real backend? The next phase would be a Streamlit or FastAPI+React frontend that calls `persona_studio.grounding.audit`, `verify_claims`, and a new SSE/WebSocket endpoint for streaming live simulation turns. See the ROADMAP.

> The `web/` bundle is a [Claude Design](https://claude.ai/design) handoff. Original design README + chat transcripts are preserved under `web/docs/` for authorial intent. License note: the design recommended ELv2, but this repo stays MIT — see `LICENSE` at the repo root.

<br/>

## What gets generated?

Every meeting produces three files in `simulations/<your-topic>/`:

| File | What it is |
| --- | --- |
| `<timestamp>.md` | The full conversation, every word, in Markdown. Readable in any text editor. |
| `<timestamp>.docx` | The same conversation as a Word document with styled headings and tables. |
| `<timestamp>.pptx` | A summary PowerPoint deck — title slide, agenda, each participant's position, action items, satisfaction dashboard. |

If you run with Ralph loop, earlier attempts are kept as `iter-1/`, `iter-2/` subfolders.

<br/>

## The "Three-Axis Rule"

Every transcript **must** end with three sections:

- **Conclusion** — what the group decided (or admitted they couldn't agree).
- **Satisfaction Assessment** — scores per criterion + iteration history.
- **System Feedback** — notes for improving the avatars / process / platform next time.

This is enforced by a validator. If any section is missing, the tool shouts. The rule is what turns an AI chat log into a **useful artifact** you'd actually read again later.

<br/>

## FAQ

<details>
<summary><strong>Is this safe to use with private data?</strong></summary>

Yes. The tool runs entirely on your machine. Your persona files, meeting transcripts, and raw uploads all stay local. The only outbound traffic is what Claude Code normally does (sending prompts to Anthropic's API).

The `data/people/` and `simulations/` folders are **git-ignored by default**, so you won't accidentally commit personal material.

</details>

<details>
<summary><strong>Does this actually sound like the real person?</strong></summary>

For well-documented public figures: often uncannily close. For private individuals with limited material: more of a composite impression than a replica.

The ceiling is set by the **quality and volume** of the input. An interview transcript + a podcast episode + a book chapter is plenty. One LinkedIn post is not.

</details>

<details>
<summary><strong>Can I use this to impersonate someone?</strong></summary>

No. This tool is designed for **rehearsal and perspective-taking**, not impersonation. Don't publish avatar output as if it were real quotes. Don't use it to deceive.

In most jurisdictions, commercial use of someone's likeness (including their "voice" in this sense) requires their permission.

</details>

<details>
<summary><strong>I don't know what tmux is. Do I need it?</strong></summary>

Only if you want the "everyone talks at once in separate panes" experience. The `simulate-debate` and `simulate-meeting` commands work without tmux — they just run the conversation in one window, one speaker at a time.

</details>

<details>
<summary><strong>The Ralph loop keeps going forever. Make it stop.</strong></summary>

It won't. The tool hard-caps at your chosen max (default 3). You can also type `<stop>` at any point to exit immediately — whatever's been generated so far will still be saved.

</details>

<details>
<summary><strong>What AI model does this use?</strong></summary>

Whatever Claude Code is currently set to — typically Claude Opus, Sonnet, or Haiku. All avatars and the facilitator share one model for consistency.

</details>

<details>
<summary><strong>How is this different from just asking ChatGPT to role-play?</strong></summary>

Three things:

- **Parallel execution** — 3-6 personas run in separate terminal panes simultaneously. You can see everyone's thinking at once and interrupt any of them.
- **Scored iteration** — the Ralph loop actually measures output quality and re-runs with targeted feedback, instead of giving you one shot.
- **Structured artifacts** — every meeting produces a Word transcript, a PowerPoint summary, and mandatory Conclusion / Satisfaction / Feedback sections. Not just a chat log.

</details>

<br/>

## For developers

<details>
<summary><strong>How it works under the hood</strong></summary>

```
data/people/<name>/raw/*.{pdf,docx,mp3,wav,m4a,html,txt}
   │
   ▼
ingest/  ──  documents.py · audio.py (faster-whisper) · web.py · youtube.py (yt-dlp)
   │
   ▼
corpus/<name>.jsonl   (unified issue samples)
   │
   ▼
personas/<name>.md    (Claude synthesizes a three-axis profile: voice · experience · position)
   │
   ▼
agents/persona-<name>.md   (Claude Code subagent definition)
```

Meeting output is routed to `simulations/<topic-slug>/<timestamp>_*.md` with matching `.docx` and `.pptx` generated via Anthropic's `document-skills:docx` / `document-skills:pptx` (falling back to a Python script if the skills aren't available).

</details>

<details>
<summary><strong>Project structure</strong></summary>

```
persona-studio/
├── .claude-plugin/
│   ├── plugin.json                 # plugin manifest
│   └── marketplace.json            # local marketplace (swap "source" for public release)
├── commands/                       # 10 slash-commands (plugin-namespaced)
├── agents/                         # subagents (persona + celebrity-harvester)
├── src/persona_studio/             # Python package (TUI + ingest pipelines)
├── scripts/
│   ├── setup.py                    # idempotent bootstrap
│   ├── simulation_to_docs.py       # md → docx/pptx (Python fallback)
│   └── build_docx_skill.js         # md → docx (docx-js, for skill path)
├── personas/                       # human-editable source-of-truth per avatar
├── data/people/<name>/             # raw uploads + transcripts (git-ignored)
├── simulations/<topic>/            # meeting outputs (git-ignored)
├── tests/                          # 112 pytest cases
└── docs/
    ├── PLUGIN_INSTALL.md
    ├── TEAM_MODE_GUIDE.md
    └── E2E_CHECKLIST.md
```

</details>

<details>
<summary><strong>Local development</strong></summary>

```bash
# Create venv and install dev dependencies
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"

# Run the test suite
.venv/bin/pytest -q                              # 112 tests
.venv/bin/pytest --cov=src --cov-report=term-missing

# Run the Markdown schema validator standalone
.venv/bin/python scripts/simulation_to_docs.py <transcript.md> --strict

# Node-side docx builder (used by the docx skill path)
node scripts/build_docx_skill.js <input.md> <output.docx>
```

After editing a command or agent, reload the plugin in Claude Code:

```
/plugin marketplace update persona-studio-local
/reload-plugins
```

</details>

<br/>

## Roadmap

- [x] **v0.1** — Sequential simulations (debate / meeting)
- [x] **v0.2** — Split-panes agent teams
- [x] **v0.3** — Ralph loop + satisfaction gating + three-axis schema validator
- [x] **v0.4** — Plugin namespacing (`persona-studio:*`)
- [x] **v0.5** — Global persona library (celebrity-mode in `~/.persona-studio/`)
- [x] **v0.6** — Three-tier factual-grounding stack (corpus + Perplexity/WebSearch + CoVe) with retract/defend cycle
- [ ] **v0.7** — Auto-refine avatars from meeting feedback
- [ ] **v0.8** — Search across past meetings (RAG index over `simulations/`)
- [ ] **v0.9** — Web dashboard (Streamlit) for non-CLI users
- [ ] **v1.0** — Public marketplace release

<br/>

## Contributing

This is currently a private repository. External contributions open at the v1.0 public release. Internal contributors: see `docs/E2E_CHECKLIST.md`.

<br/>

## License

MIT — see [LICENSE](./LICENSE).

<br/>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zirubak/persona-studio&type=Date)](https://www.star-history.com/#zirubak/persona-studio&Date)

<br/>

---

<p align="center">
  Built with <a href="https://claude.com/claude-code">Claude Code</a> &middot; <a href="README.ko.md">한국어 문서</a> &middot; <a href="https://github.com/zirubak/persona-studio">GitHub</a>
</p>
