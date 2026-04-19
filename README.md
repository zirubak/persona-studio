<h1 align="center">Persona Studio</h1>

<p align="center">
  <strong>Build AI avatars of real people (or yourself), then rehearse meetings with them before the real thing.</strong>
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
  <img src="https://img.shields.io/badge/version-0.4.0-purple" alt="v0.4.0" />
</p>

<br/>

## What is this?

# Rehearse any meeting, with anyone, before it happens

Persona Studio is a **Claude Code plugin** that lets you:

1. **Build AI avatars** of real people from their interviews, podcasts, YouTube videos, or even just their name.
2. **Run meetings or debates** where several avatars talk to each other (in separate terminal panes, all at once).
3. **Automatically get Word and PowerPoint files** with the full transcript and a summary deck.

You don't need to write any code. You type a slash-command like `/persona-studio:studio`, answer a few questions with the arrow keys, and it does everything.

<br/>

## What can I do with this?

<table>
<tr>
<td><strong>Rehearse a pitch</strong></td>
<td>Build avatars of your investor panel from their public interviews. Pitch to them. See their pushback. Fix your deck before the real meeting.</td>
</tr>
<tr>
<td><strong>Stress-test a decision</strong></td>
<td>Build avatars of your CEO, CFO, and Head of Engineering. Propose a plan. Watch them argue. Adopt what survives.</td>
</tr>
<tr>
<td><strong>Prep for a job interview</strong></td>
<td>Build an avatar of the hiring manager (from their LinkedIn/podcast). Role-play the interview. Get a scorecard at the end.</td>
</tr>
<tr>
<td><strong>Draft a strategy deck</strong></td>
<td>Run a 3-person meeting about your strategy. The tool auto-generates a Word doc with the full conversation and a PowerPoint summary with action items.</td>
</tr>
<tr>
<td><strong>Write realistic dialogue</strong></td>
<td>Novelists and screenwriters: build avatars of your characters and let them debate a plot point. Use the transcript as your draft.</td>
</tr>
</table>

<br/>

## Who is this for?

- **Non-technical founders, consultants, writers, researchers** — anyone who prepares for important conversations.
- **Product managers & strategists** — rehearse stakeholder meetings.
- **Anyone learning a second language** — practice arguing with native-speaker avatars before real meetings.
- **Developers building with Claude Code** — a ready-made example of the Agent Teams + Ralph-loop pattern.

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

### Step 5 — Launch the menu

```
/persona-studio:studio
```

The first time you run this, the tool sets itself up (takes 2-3 minutes: it downloads some models and prepares a Python environment). After that, every launch is instant.

From here, use the arrow keys to navigate. **You don't need to type commands again.**

<br/>

## Your first 10 minutes

Try this sample run — it ships with a ready-made sample avatar so you don't need to upload anything:

1. Launch: `/persona-studio:studio`
2. Pick: **"Run a simulation"** → **"Debate"**
3. Topic: `The future of remote work`
4. Pick `sample_private` as one participant (it's included)
5. Pick `<your-new-avatar>` as the other (create one first via the menu, or use two copies of `sample_private` for a quick test)
6. Watch them argue for 3 rounds
7. Find your transcript at `simulations/<topic>/<timestamp>.md` (plus matching `.docx` and `.pptx`)

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
- [ ] **v0.5** — Auto-refine avatars from meeting feedback
- [ ] **v0.6** — Search across past meetings (RAG index)
- [ ] **v0.7** — Web dashboard (Streamlit) for non-CLI users
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
