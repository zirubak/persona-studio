---
description: Round-robin debate among 2-5 persona avatars. Usage: /simulate-debate <topic> <p1> <p2> [<p3>...]
---

# /simulate-debate

$ARGUMENTS

## Step 0 — Normalize inputs

Parse `<topic>` (quoted string) and participants (at least 2 persona slugs).
If arguments are missing, ask via `AskUserQuestion`:
- `주제`: free text
- `참가자`: multiSelect from `personas/*.md` (2-5 selections)
- `라운드 수`: `3` / `4` / `5` (default 4)

Verify each participant has a matching `.claude/agents/persona-<slug>.md`. If
any is missing, stop with an explanation.

## Step 1 — Intro

Main Claude acts as the moderator. Print in Korean:
- 토론 주제
- 참가자 목록
- 진행 방식 (라운드로빈, N라운드, 각 발언 300자 이내)

Initialize an empty transcript list.

## Step 2 — Round loop

For `r in 1..N`:
  For each participant `p` in declared order:
    Invoke:
    ```
    Agent(
      subagent_type="persona-<p>",
      description="Round <r> turn for <p>",
      prompt=<see below>
    )
    ```
    The prompt MUST contain:
    1. `[Debate topic]: <topic>`
    2. `[Prior transcript, chronological]:` followed by every previous speaker's
       `(라운드 X, <name>): <quote>` line.
    3. `[Your turn]: 300자 이내로, 앞 발언 중 가장 동의/반대하는 지점을 지명해 응답하세요.`
    4. `[Hard rule]: 주제와 무관한 메타 발언 금지. 당신의 Speech Patterns 섹션에 있는 말투를 유지.`

    Append the agent's reply to the transcript as `(라운드 r, p): <text>`.
    Between turns, give the user a one-line progress note (no full dump).

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
### <p2>
...

## 라운드 2
...

# Synthesis
<main claude summary>
```

Show the user the file path and return to caller.
