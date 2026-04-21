# Factual Grounding

## Why

When you rehearse a job interview or run a team meeting against AI personas, a hallucinated answer is worse than no answer. A made-up statistic from "Paul Graham" sounds plausible enough that you might repeat it in the real interview the next day. A fabricated quote from your CTO avatar can shape a decision you were only supposed to be stress-testing. Factual grounding tells you at the line level which sentences are anchored in real evidence and which ones the model invented.

## The three tiers

Grounding runs as a staircase. Each tier only activates when the one above it cannot resolve a claim.

```
claim from avatar
   |
   v
Tier-1 corpus grep  --(match)-->  [SUPPORTED]
   |
   (miss on high-risk claim)
   |
   v
Tier-2 external (Perplexity MCP or WebSearch)  --(hit)-->  [VERIFIED-EXTERNAL]
   |
   (still unverifiable)
   |
   v
Tier-3 Chain-of-Verification  --(discrepancy)-->  [FACT-CHECKER CHALLENGE]
                                                  -> avatar retracts / cites / restates
```

**Tier-1 (always on, offline)** runs a grep-style keyword scorer over each persona's `data/people/<name>/extracted/corpus.md` and `perplexity_notes.md`. It fires on every claim, costs nothing, and produces four tags: `[SUPPORTED: source:line]`, `[UNSUPPORTED]` (corpus contradicts), `[UNVERIFIABLE]` (no relevant material), and `[OPINION]` (subjective, not a factual claim).

**Tier-2 (optional, detected at setup)** fires only on `[UNVERIFIABLE]` claims the rule engine flags as high-risk (numeric anchors, named entities, date-specific facts). If Perplexity MCP is installed, it is used first; otherwise built-in WebSearch runs. Tags become `[VERIFIED-EXTERNAL: tool url]` on a hit or `[UNVERIFIED-EXTERNAL]` when external sources can't confirm either.

**Tier-3 (budget of 5 per avatar)** is Chain-of-Verification. When Tier-2 still cannot verify a high-risk claim, the system generates verification questions from the claim, asks an independent LLM call to answer them using only the evidence bank, and diff-compares against the original. On discrepancy, a `[FACT-CHECKER CHALLENGE: <reason>]` tag is inserted and the avatar is re-invoked to retract, cite, or restate under a `[retract/defend]` blockquote.

## Reading your transcript

A single avatar turn, after all three tiers have run, looks like this:

```markdown
> **Paul Graham:** The best time to start a startup is your twenties [SUPPORTED: essays/before_the_startup.md:42].
> YC funded 4,300 companies in 2023 [UNVERIFIED-EXTERNAL].
> Most founders I know regret not starting sooner [OPINION].
> Ramen profitability takes about six weeks [FACT-CHECKER CHALLENGE: corpus says 3-6 months].
>
> [retract/defend]
> I need to correct that — ramen profitability typically takes three to six months, not six weeks [SUPPORTED: essays/ramen_profitable.md:18].
```

- `[SUPPORTED: source:line]` — Tier-1 found matching evidence. Safe to quote.
- `[UNSUPPORTED]` — Tier-1 found evidence that contradicts the claim. Read with suspicion.
- `[UNVERIFIABLE]` — Neither the corpus nor external search could confirm or deny.
- `[OPINION]` — Subjective statement, not fact-checkable by design.
- `[VERIFIED-EXTERNAL: tool url]` / `[UNVERIFIED-EXTERNAL]` — Tier-2 outcome.
- `[FACT-CHECKER CHALLENGE: reason]` — Tier-3 caught a discrepancy and forced a retraction.

## The Factual Grounding section

Every transcript ends with a `## Factual Grounding` section containing one table row per avatar:

| Avatar | Total | Supported | Unsupported | Unverifiable | External-verified | External-unverified | Score |
|---|---|---|---|---|---|---|---|

The score uses this formula:

```
score = 10 * (supported + external_verified) / effective_total
```

Where `effective_total` excludes `[OPINION]` lines (opinions are not fact-checkable, so they neither help nor hurt). A score of 9-10 means the avatar stuck to cited material; 6-8 means meaningful hallucination is present; below 6 means you should treat the transcript as creative fiction, not reference material. The section also lists each avatar's top-3 unsupported claims so you can see *what* was hallucinated, not just how much.

## Upgrading from WebSearch to Perplexity MCP

WebSearch is always available and works fine. Perplexity MCP improves Tier-2 quality because it returns ranked citations with excerpts instead of raw links, which lets the tagger attribute a specific URL to each verified claim. To add it, open Claude Code's plugin marketplace and search for "perplexity MCP"; persona-studio auto-detects it on the next `/persona-studio:persona-setup` run.

## Disabling for brainstorm sessions

Grounding is designed for rehearsal and verification. For pure brainstorming, where you *want* the avatars to speculate freely, use the `/persona-studio:studio` menu toggle to turn the entire layer off for a session. The transcript still gets written; it just skips the tagging pass and the `## Factual Grounding` table.

## Persona without a corpus

If a persona was added by name only (for example, `paul_graham` created with no uploaded files) and `data/people/paul_graham/extracted/corpus.md` does not exist, Tier-1 emits a stderr warning on retrieve and returns zero supported matches. Tier-2 and Tier-3 still run if available, so you will still get `[VERIFIED-EXTERNAL]` or `[UNVERIFIABLE]` tags where the web can help — the score will just be lower, and honestly so. To fix, run `/persona-studio:create-persona <name>` and drop real source material into the persona's input folder.

## Known limits

- Tier-1 keyword matching is strict on numeric anchors: "six months" and "6 months" should both match, but "roughly half a year" will not.
- Tier-3 is capped at 5 challenges per avatar per simulation (configurable via a bash env in the `simulate-*` command) to keep runs bounded.
- Negation detection is heuristic. "Y Combinator never funded Airbnb" vs. "Y Combinator funded Airbnb" can occasionally both match the same evidence line.
- The score rewards supported claims and penalizes unsupported ones, but retractions under `[retract/defend]` blocks are not yet weighted positively — a separate Phase D code change addresses this.
