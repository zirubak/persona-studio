---
description: Build a persona from files (private) or from a name (celebrity). Usage: /create-persona <name> [--mode private|celebrity]
---

# /create-persona

$ARGUMENTS

## Step 0 — Parse arguments

Extract `<name>` (required, kebab-case). `--mode` is optional; if missing, ask
with AskUserQuestion (`Private` / `Celebrity`).

Compute paths:
- `person_dir = data/people/<name>/`
- `raw_dir = person_dir/raw/`
- `personas/<name>.md` — source of truth
- `.claude/agents/persona-<name>.md` — rendered subagent

Ensure both exist: `mkdir -p data/people/<name>/raw`.

Write `data/people/<name>/mode` = `private` or `celebrity` once chosen.

## Step 1 — Gather corpus

### Private mode

1. If `raw_dir` is empty (`ls` shows nothing other than auto-generated dirs), show
   instructions:
   > "다음 경로에 원본 자료를 넣은 후 계속하세요: `data/people/<name>/raw/`"
   > "PDF, DOCX, TXT, MD, HTML, MP3, WAV, M4A 지원. 웹 링크는 `urls.txt`에, 유튜브는 `youtube_urls.txt`에 한 줄씩."
   Then AskUserQuestion: `계속` / `취소`. Loop until at least one file exists.

2. Run the Python ETL:
   ```bash
   python -m persona_builder.cli extract <name>
   ```

3. Read `data/people/<name>/extracted/corpus.md`.

### Celebrity mode

1. AskUserQuestion to gather hints:
   - 직업/분야 (배우·엔지니어·정치인 등)
   - 국가
   - 대표 작품·활동 (자유 텍스트)
2. Invoke the harvester:
   ```
   Agent(subagent_type="celebrity-harvester", prompt="<structured JSON with name + hints + target paths>")
   ```
   Wait for completion.
3. After harvester populates `raw/articles/`, `urls.txt`, and `youtube_urls.txt`,
   run the same ETL as above:
   ```bash
   python -m persona_builder.cli extract <name>
   ```

## Step 2 — Demographic completion

Read `extracted/corpus.md` and attempt to infer: `country`, `region`, `generation`,
`education_tier`, `profession`, `gender`, `language_primary`.

For any field that cannot be inferred or is ambiguous, ask the user via
`AskUserQuestion` (provide 3-5 plausible options plus `모름`).

## Step 3 — Perplexity demographic research (MCP)

Formulate 2-4 research queries combining the confirmed demographics. Use the MCP
`mcp__perplexity__search` (or `reason` / `deep_research` as available) tool. Save
the full result bodies verbatim into
`data/people/<name>/extracted/perplexity_notes.md`, each with its query and source
URLs.

Example queries to draft (adapt to actual demographics):
- `"{country} {generation} {profession} communication and debate style patterns"`
- `"{education_tier} {country} graduates common cognitive biases"`
- `"{region} vernacular and speech register in {professional_context}"`

## Step 4 — Synthesize `personas/<name>.md`

Create or overwrite `personas/<name>.md` with this exact section order. Every
factual claim must either cite a corpus line (quote + source tag) or a
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
Sentence length, formality (존댓말/반말), code-switching (e.g. KR/EN), filler words,
signature phrases. Include 2-3 direct quotes from the corpus.

# Demographic-derived Patterns
Short observations from perplexity_notes.md, each with a citation.

# Quoted Evidence
5-8 direct quotations from the corpus with source tags. These anchor later
roleplay.
```

## Step 5 — Render `.claude/agents/persona-<name>.md`

Compose the subagent file with this frontmatter, then inline the body of
`personas/<name>.md`:

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

Tell the user (Korean, brief):
- `personas/<name>.md` 생성됨 (N 섹션)
- `.claude/agents/persona-<name>.md` 렌더됨
- 수정이 필요하면 `/persona-refine <name>` 제안

Return control to the caller (usually `/persona-studio`).
