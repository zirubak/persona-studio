---
description: Facilitated meeting simulation. Usage: /simulate-meeting <topic> <p1> <p2> ...
---

# /simulate-meeting

$ARGUMENTS

## Step 0 — Normalize inputs

Same participant validation as `/simulate-debate`. 2-6 participants allowed.

Ask how the agenda is composed (AskUserQuestion):
- `자동 생성` — Main Claude drafts an agenda from the topic.
- `직접 입력` — user dictates 3-7 agenda items.

Record the final agenda as an ordered list.

## Step 1 — Facilitator sets the stage

Main Claude, acting as the facilitator, announces (Korean):
- 회의 주제
- 참가자
- 의제 목록
- 진행 방식: 의제별로 퍼실리테이터가 특정 참가자를 지명 → 다른 참가자 중 반론/보완 1명 지명 → 의제 합의 요약

## Step 2 — Agenda loop

For each agenda item `i` in order:
  a. Facilitator phrases a concrete opening question (≤ 2 문장).
  b. Pick a `lead` participant most relevant to item `i` based on their persona's
     Knowledge Domains. Invoke:
     ```
     Agent(subagent_type="persona-<lead>", prompt="의제 i에 대한 당신의 권고안을 300자 이내로 답하세요. 주제: <topic>. 의제: <item>.")
     ```
  c. Pick one `challenger` participant with a contrasting Debate Style or
     overlapping domain. Invoke:
     ```
     Agent(subagent_type="persona-<challenger>", prompt="lead의 답변을 읽고 300자 이내로 가장 약한 지점을 반박하거나 보완하세요. lead 답변: <quote>")
     ```
  d. Optional: if either mentioned an absent domain expert among participants,
     invoke that third persona with a direct question (one exchange max).
  e. Facilitator synthesizes a 2-3문장 결정 요약 + action item candidate.

## Step 3 — Meeting close

Main Claude writes:
- 합의 요약 (bullet list)
- 액션 아이템 (담당자 추정 + 기한은 TBD)
- 후속 질문

## Step 4 — Save transcript

Write `simulations/<UTC-timestamp>_meeting_<topic-slug>.md`:

```markdown
---
kind: meeting
topic: <topic>
participants: [...]
agenda: [...]
generated: <ISO8601>
---

# 회의록

## 의제 1: <title>
- **주도 발언 (<lead>)**: ...
- **반론/보완 (<challenger>)**: ...
- **추가 발언**: ...
- **결정 요약**: ...

## 의제 2: ...

# 종료 요약
- 합의: ...
- 액션 아이템: ...
- 후속 질문: ...
```

Show the file path and return to caller.
