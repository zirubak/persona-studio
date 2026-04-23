# Persona Studio — Web Prototype

> **Heads-up for readers**: this README is the **design handoff original** from Claude Design. It lives here unedited so the design authorial intent stays readable. **The actual repo license is MIT** (see `LICENSE` at the repo root), not ELv2 as the badge below suggests. The ELv2 language was the design's license recommendation; we kept MIT for contributor friendliness at this stage. The "clone / run" paths below also reflect the design intent — the real runtime today is a static prototype (see `../README.md` → **Browser prototype** section for how to open it).
>
> TL;DR: this file is a design artifact. For canonical install / run / license info, read the project root README.

## Testing the prototype

**Static regression** (runs with every `pytest`, no browser needed):

```bash
pytest tests/web/ -v
```

Verifies that every JSX file imported by `hifi-v2.html` exists, the SCREENS array still has exactly 9 entries, auth screens stay out of the flow while their source files survive for future cloud mode, and the license disambiguation notes stay in place. Catches ~80% of "broke the prototype" regressions without spinning up a browser.

**Live end-to-end** (manual, Playwright — run after substantive UI edits):

```bash
cd web && python3 -m http.server 7780 &
# in another shell (or via Playwright MCP / a browser)
open http://localhost:7780/hifi-v2.html
```

Walkthrough checklist (verified 2026-04-23):

1. Page loads with zero application-level console errors (favicon 404 + Babel dev warning are expected).
2. Clicking each of the 9 nav pills renders a screen whose body text contains its expected marker (Home → "Rehearse tomorrow's", Library → "New avatar", Detail → "simulation", Create → "Upload", Setup → "Ralph", Live → "Live", Results → "transcript", Settings → "Data", Cloud → "soon").
3. Arrow keys navigate between screens (← previous, → next); `localStorage['ps_screen']` persists the selection across reloads.
4. On the Home screen, clicking the "Start a simulation →" hotspot overlay lands on Setup; "Build an avatar" lands on Create.
5. Reloading mid-flow restores the last visited screen from `localStorage`.

If any step fails, either a JSX file broke or the `SCREENS` / `HOTSPOTS` tables in `hifi-v2.html` drifted.

---

> Build AI personas from public writing, real conversations, or your own notes — then stress-test ideas against them before you ship.

[![License: ELv2](https://img.shields.io/badge/license-ELv2-1f6feb)]() [![Status: Alpha](https://img.shields.io/badge/status-alpha-c96442)]() [![PRs welcome](https://img.shields.io/badge/PRs-welcome-4a7c4e)]()

![Persona Studio — hero](./docs/hero.png)

---

## What is this?

Persona Studio lets you build a library of **AI avatars** grounded in real writing — essays, interviews, chat logs, your own notes — and then:

- **Simulate** — hand them a prompt, a pitch, a feature spec, and watch how they'd react, in voice, in character.
- **Grade** — score the response against a target rubric (Ralph score), see where it missed.
- **Iterate** — tweak the input, re-run, compare.

It's a thinking tool, not a chat toy. The point is to catch weaknesses in your ideas before a real audience does.

## Quick start

```bash
# Clone and run
git clone https://github.com/your-org/persona-studio
cd persona-studio
pnpm install
pnpm dev

# Open the prototype
open http://localhost:7777
```

No signup. No API key wall. First run drops you straight into **Guest Mode** — everything lives in `localStorage` until you decide to self-host properly or move to the Cloud build.

## Features

- **Avatar library** — public figures with curated corpora (Paul Graham, Naval, DHH…) + private mode for your own sources.
- **Live simulation** — real-time response playback with voice, pacing, interruptions.
- **Ralph score** — objective-ish rubric grading (0–10) against a target you define.
- **i18n** — English, Español, 한국어, 日本語.
- **Bring your own model** — OpenAI, Anthropic, local (Ollama, llama.cpp) via adapter.
- **Exportable** — avatars, simulations, and results are JSON. Own your data.

## Roadmap

- [x] Hi-fi prototype (clickable)
- [x] Guest mode (localStorage)
- [ ] Model adapter layer
- [ ] Avatar corpus ingestion CLI
- [ ] Voice pipeline (TTS + STT)
- [ ] Team workspace (Cloud build)
- [ ] SSO + audit log (Cloud build)

See [Issues](https://github.com/your-org/persona-studio/issues) for the full list. Good first issues are tagged `good first issue`.

## Contributing

We'd love your help. Before opening a PR, skim [`CONTRIBUTING.md`](./CONTRIBUTING.md). The short version:

1. Open an issue first for anything non-trivial — saves everyone time.
2. One change per PR. Small diffs get merged faster.
3. No new dependencies without a good reason.
4. Design changes: post a screenshot/GIF in the PR description.

Join the conversation:
- [GitHub Discussions](https://github.com/your-org/persona-studio/discussions) — ideas, questions, show-and-tell
- [Discord](https://discord.gg/persona-studio) — loose chat, office hours

## License

**Elastic License 2.0 (ELv2).** See [LICENSE](./LICENSE).

In plain English:

- ✅ Use it personally, internally at your company, in research, in your product.
- ✅ Fork it, modify it, ship it, embed it.
- ✅ Self-host for your own team.
- ❌ Resell it as a hosted/managed service that competes with the official Cloud build.

If that sounds like most of what people actually want to do with open-source software — it is. ELv2 exists to keep the project sustainable without locking the code away.

## The team

Persona Studio is built in the open by a small team of humans and a rotating cast of contributors.

---

<sub>Not affiliated with any of the public figures whose writing appears in the example library. All public-figure avatars are clearly labelled and sourced from publicly-available material.</sub>
