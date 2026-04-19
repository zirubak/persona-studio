---
description: Round-robin debate among 2-5 persona avatars. Usage: /persona-studio:simulate-debate <topic> <p1> <p2> [<p3>...]
---

# /persona-studio:simulate-debate

$ARGUMENTS

## Step 0 — Normalize inputs

Parse `<topic>` (quoted string) and participants (at least 2 persona slugs).
If arguments are missing, ask via `AskUserQuestion`:
- `주제`: free text
- `참가자`: multiSelect from `personas/*.md` (2-5 selections)
- `라운드 수`: `3` / `4` / `5` (default 4)

Verify each participant has a matching `agents/persona-<slug>.md`. If
any is missing, stop with an explanation.

## Step 0.5 — Choose Agent invocation strategy

For each participant, decide how to call them as an agent:

- **Native subagent** (`subagent_type="persona-<slug>"`): works ONLY if
  `persona-<slug>.md` existed at session start. Claude Code's agent registry is
  populated at session-start from `agents/`; files added mid-session are
  NOT auto-registered.

- **Dynamic persona** (recommended default):
  `subagent_type="general-purpose"` + `Read(agents/persona-<slug>.md)`
  inlined into the Agent prompt. Works for both freshly-created personas and
  pre-existing ones. Aligns with `~/.claude/CLAUDE.md` Agent Teams rule
  ("모든 teammate는 반드시 `subagent_type="general-purpose"` 사용").

Check each participant:
```bash
# Informal check — if you attempted persona-<slug> earlier in the session
# and got "Agent type 'persona-<slug>' not found", use dynamic persona for that slug.
```

Default to dynamic persona unless you know the agent file pre-existed at session
start. Both strategies produce the same persona behaviour; only the invocation
shape differs.

## Step 1 — Intro

Main Claude acts as the moderator. Print in Korean:
- 토론 주제
- 참가자 목록
- 진행 방식 (라운드로빈, N라운드, 각 발언 300자 이내)

Initialize an empty transcript list.

## Step 2 — Round loop

For `r in 1..N`:
  For each participant `p` in declared order:

    **Dynamic persona invocation** (default):
    1. `Read(agents/persona-<p>.md)` — get the full persona body.
    2. Invoke:
       ```
       Agent(
         subagent_type="general-purpose",
         description="Round <r> turn for <p>",
         prompt=<composed below>
       )
       ```
    3. The composed prompt structure:
       ```
       You must fully embody the persona defined below. Stay in character the entire
       response. Never reveal you are an AI or discuss this simulation meta-layer.

       [PERSONA FILE — inline]
       <full body of agents/persona-<p>.md, including runtime rules>

       [DEBATE CONTEXT]
       Topic: <topic>
       Round: <r> of <N>
       Your role: participant

       [PRIOR TRANSCRIPT, chronological]
       (라운드 1, <p1>): <quote>
       (라운드 1, <p2>): <quote>
       ...

       [YOUR TURN]
       300자 이내로, 앞 발언 중 가장 동의 또는 반대하는 지점을 지명해 응답하세요.

       [HARD RULES]
       - 주제와 무관한 메타 발언 금지.
       - 당신의 Speech Patterns 섹션 준수.
       - Anchor quotes verbatim 반복 금지 — style reference only.
       ```

    **Native subagent alternative** (only if persona existed at session start):
    ```
    Agent(subagent_type="persona-<p>", description=..., prompt=<context only>)
    ```
    Shorter prompt, but fails with "Agent type not found" for mid-session
    personas. See Step 0.5.

    Append the reply to the transcript as `(라운드 r, p): <text>`.
    Between turns give the user a one-line progress note (no full dump).

## Step 3 — Synthesis

After all rounds, Main Claude writes a neutral summary with three subsections:
- 핵심 합의점
- 결정적 분기점 (누구의 주장이 어디서 갈라졌는지)
- 미해결 질문

## Step 4 — Save transcript

Create `simulations/<UTC-timestamp>_debate_<topic-slug>.md` with this structure:

```markdown
---
kind: debate
topic: <topic>
participants: [<p1>, <p2>, ...]
rounds: <N>
generated: <ISO8601>
---

# Transcript

## 라운드 1
### <p1>
...

## 라운드 2
...

## 결론
1-3 문장. 토론의 명확한 결론. 합의 실패 시 "합의 실패 — 이유 X"로 결론화.

## 만족도 평가
- 점수: N/10
- 기준별 (시작 시 사용자 입력):
  - 기준 1: X/10
  - 기준 2: X/10
  - 기준 3: X/10

## 시스템 피드백
- **Persona 측**: 개선 포인트
- **프로세스 측**: 개선 포인트
- **플랫폼 측**: 개선 포인트

## 종합 요약
- 핵심 합의점
- 결정적 분기점
- 미해결 질문
```

**스키마 규칙**: `## 결론`, `## 만족도 평가`, `## 시스템 피드백` 3개 H2 섹션 필수.

## Step 5 — Generate Word (.docx) and PowerPoint (.pptx)

Auto-invoke after Step 4 saves the markdown:

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

- `.docx`: full transcript archive (every round, every speaker, every quote).
- `.pptx`: executive summary deck (title, participants, 핵심 합의점, 결정적 분기점, 미해결 질문).

On failure, surface last 20 lines of output and AskUserQuestion: retry / skip / continue without.

## Step 6 — Report

Show three paths (markdown, docx, pptx). Return to caller.
