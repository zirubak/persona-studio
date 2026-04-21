"""CLI entry point used by simulate-* markdown commands to drive Tier-1 verify.

Reads a single turn's text from stdin, extracts fact-looking claims via
:mod:`.claims`, runs Tier-1 verification against the named persona's
corpus + perplexity_notes, and emits a JSON list on stdout. The command
layer parses that JSON and — when a claim comes back ``unverifiable`` /
``high_risk`` — decides whether to invoke Perplexity MCP or WebSearch
(Tier-2) and insert the corresponding external annotation into the
transcript.

Keeping Tier-2 orchestration in the command layer preserves the design
invariant that Python modules stay network-free and deterministic; the
CLI only ever touches the local corpus + perplexity_notes files.

Usage::

    echo "<turn text>" | python -m persona_studio.grounding.verify_claims \\
        --persona alice \\
        --topic "product strategy" \\
        [--only-high-risk]

Output is a JSON array. Each item::

    {
      "text": "...",
      "kind": "fact_assertion" | "opinion" | "narrative",
      "is_high_risk": true/false,
      "status": "supported" | "unsupported" | "unverifiable",
      "citation": "corpus.md:27-29" | null,
      "score": 0.0-1.0,
      "reasoning": "..."
    }
"""
from __future__ import annotations

import argparse
import json
import sys

from persona_studio.grounding.audit import _merge_evidence
from persona_studio.grounding.claims import extract_claims
from persona_studio.grounding.retriever import retrieve_evidence
from persona_studio.grounding.verifier import verify_claim


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m persona_studio.grounding.verify_claims",
        description="Tier-1 verify claims from stdin text against a persona's corpus.",
    )
    parser.add_argument("--persona", required=True, help="Persona slug")
    parser.add_argument(
        "--topic",
        default="",
        help="Topic string (used for retrieval alongside per-claim queries)",
    )
    parser.add_argument(
        "--only-high-risk",
        action="store_true",
        help="Emit only claims flagged is_high_risk=True",
    )
    ns = parser.parse_args(argv)

    text = sys.stdin.read()
    claims = extract_claims(text)

    topic_evidence = retrieve_evidence(ns.persona, topic=ns.topic or ns.persona, k=8)

    out: list[dict[str, object]] = []
    for claim in claims:
        if ns.only_high_risk and not claim.is_high_risk:
            continue
        claim_evidence = retrieve_evidence(ns.persona, topic=claim.text, k=6)
        merged = _merge_evidence(topic_evidence, claim_evidence)
        result = verify_claim(claim, merged)
        out.append(
            {
                "text": claim.text,
                "kind": claim.kind.value,
                "is_high_risk": claim.is_high_risk,
                "status": result.status.value,
                "citation": result.citation,
                "score": result.score,
                "reasoning": result.reasoning,
            }
        )

    json.dump(out, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
