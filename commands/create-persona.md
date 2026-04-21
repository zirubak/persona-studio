---
description: Build a persona from files (private) or from a name (celebrity). Usage: /persona-studio:create-persona <name> [--mode private|celebrity]
---

# /persona-studio:create-persona

$ARGUMENTS

## Step 0 — Parse arguments and resolve persona home

Extract `<name>` (required, kebab-case). `--mode` is optional; if missing, ask
with AskUserQuestion (`Private` / `Celebrity`).

### Resolve `BASE` (persona home) by mode

Persona Studio splits stored personas into two locations so you can reuse
public-figure avatars across every project while keeping private materials tied
to the project they belong to:

- **Private mode** → project-local home (`./`). Project-scoped; typically tied
  to the repo the user is currently in.
- **Celebrity mode** → global home (`$HOME/.persona-studio/`). Public figures
  are reusable across every project, so they live in your personal library.

Route by mode:

```bash
if [[ "$MODE" == "celebrity" ]]; then
  BASE="$HOME/.persona-studio"
  mkdir -p "$BASE/personas" "$BASE/agents" "$BASE/data/people"
else
  BASE="."  # project-local
fi
```

All paths in the remaining steps are resolved relative to `$BASE`.

Compute:
- `person_dir = $BASE/data/people/<name>/`
- `raw_dir = $person_dir/raw/`
- `$BASE/personas/<name>.md` — source of truth
- `$BASE/agents/persona-<name>.md` — rendered subagent

Ensure both exist: `mkdir -p "$BASE/data/people/<name>/raw"`.

Write `$BASE/data/people/<name>/mode` = `private` or `celebrity` once chosen.

## Step 1 — Gather corpus

### Private mode

1. If `$BASE/data/people/<name>/raw/` is empty (`ls` shows nothing other than
   auto-generated dirs), show instructions:
   > "Place your source materials under `data/people/<name>/raw/`, then continue."
   > "Supported: PDF, DOCX, TXT, MD, HTML, MP3, WAV, M4A. Web links go in `urls.txt`, YouTube links in `youtube_urls.txt` — one URL per line."
   Then AskUserQuestion: `Continue` / `Cancel`. Loop until at least one file exists.

2. Run the Python ETL (`--base "$BASE"` if your installed version supports it;
   otherwise `cd "$BASE"` and run from there):
   ```bash
   cd "$BASE" && python -m persona_studio.cli extract <name>
   ```

3. Read `$BASE/data/people/<name>/extracted/corpus.md`.

4. **If any URL in `urls.txt` recorded `unsafe_scheme` or resulted in `[fetch failed: ...]`
   (403, 429, short content) in the manifest**: apply the browser fallback policy
   documented in `agents/celebrity-harvester.md` under "Browser fallback for
   bot-protected pages". Recover the URL via Playwright MCP, save the content to
   `$BASE/data/people/<name>/raw/<slug>.md` with the mandatory metadata header, then
   re-run the ETL. This keeps Private and Celebrity modes symmetric — both
   benefit from the same fallback.

### Celebrity mode

1. AskUserQuestion to gather hints:
   - Profession / field (actor, engineer, politician, etc.)
   - Country
   - Notable works or activities (free text)
2. Invoke the harvester — pass `target_base` so it writes into the global home:
   ```
   Agent(subagent_type="celebrity-harvester", prompt="<structured JSON with name + hints + target_base=$BASE>")
   ```
   Wait for completion. If your harvester version ignores `target_base`, `cd "$BASE"` before invoking so default relative paths land in the correct home.
3. After harvester populates `raw/articles/`, `urls.txt`, and `youtube_urls.txt`
   under `$BASE/data/people/<name>/`, run the ETL:
   ```bash
   cd "$BASE" && python -m persona_studio.cli extract <name>
   ```

## Step 2 — Demographic completion

Read `$BASE/data/people/<name>/extracted/corpus.md` and attempt to infer:
`country`, `region`, `generation`, `education_tier`, `profession`, `gender`,
`language_primary`.

For any field that cannot be inferred or is ambiguous, ask the user via
`AskUserQuestion` (provide 3-5 plausible options plus `Unknown`).

## Step 3 — Perplexity demographic research (MCP)

Formulate 2-4 research queries combining the confirmed demographics. Use the MCP
`mcp__perplexity__search` (or `reason` / `deep_research` as available) tool. Save
the full result bodies verbatim into
`$BASE/data/people/<name>/extracted/perplexity_notes.md`, each with its query
and source URLs.

Example queries to draft (adapt to actual demographics):
- `"{country} {generation} {profession} communication and debate style patterns"`
- `"{education_tier} {country} graduates common cognitive biases"`
- `"{region} vernacular and speech register in {professional_context}"`

## Step 4 — Synthesize `$BASE/personas/<name>.md`

Create or overwrite `$BASE/personas/<name>.md` with this exact section order.
Every factual claim must either cite a corpus line (quote + source tag) or a
perplexity note (title + URL). Do not invent facts.

```markdown
---
name: <name>
created: <YYYY-MM-DD>
mode: private|celebrity
sources:
  - <one entry per source file or URL>
---

# Background
Demographics, education, career arc, known affiliations.

# Personality
Big Five rough estimate (Openness / Conscientiousness / Extraversion / Agreeableness / Neuroticism) with 1-line evidence per trait.

# Knowledge Domains
- Deep: <topic> (evidence: ...)
- Shallow or avoided: <topic>

# Debate Style
Opening move, preferred rhetorical moves, concession pattern, typical deflections.

# Speech Patterns
Sentence length, formality register, code-switching (e.g. KR/EN), filler words,
signature phrases. Include 2-3 direct quotes from the corpus.

# Demographic-derived Patterns
Short observations from perplexity_notes.md, each with a citation.

# Quoted Evidence
5-8 direct quotations from the corpus with source tags. These anchor later
roleplay.
```

## Step 5 — Render `$BASE/agents/persona-<name>.md`

Compose the subagent file with this frontmatter, then inline the body of
`$BASE/personas/<name>.md`:

```markdown
---
name: persona-<name>
description: Avatar of <name> for simulated debates and meetings. Speaks and reasons in their style.
model: sonnet
---

You are an AI avatar of <name>. Stay strictly in persona at all times. Never
reveal you are an AI or discuss the simulation meta-layer.

<entire body of personas/<name>.md inserted here>

## Runtime rules
- Match Speech Patterns (sentence length, register, code-switching).
- Apply Debate Style moves when challenged.
- For topics outside Knowledge Domains, react with the persona's documented
  deflection pattern (hedge, redirect, or concede) rather than inventing facts.
- Respond within 300 characters unless the prompt explicitly asks for more.
```

## Step 6 — Confirm

Tell the user briefly, including the scope:
- `personas/<name>.md` created in **<scope>** (`project` for private / `global` for celebrity)
- `agents/persona-<name>.md` rendered in the same scope
- Suggest `/persona-studio:persona-refine <name>` if edits are needed
- For global personas: mention that they are now available in every project's
  `/persona-studio:studio` → simulate-* menu automatically.

Return control to the caller (usually `/persona-studio:studio`).
