---
description: Facilitated meeting simulation. Usage: /persona-studio:simulate-meeting <topic> <p1> <p2> ...
---

# /persona-studio:simulate-meeting

$ARGUMENTS

## Step 0 — Normalize inputs

Same participant validation as `/persona-studio:simulate-debate`. 2-6 participants allowed.

**Agent invocation strategy**: Default to **dynamic persona** pattern —
`subagent_type="general-purpose"` with the persona file body inlined into the
prompt. See `/persona-studio:simulate-debate` Step 0.5 for the full recipe and rationale.
This works for both pre-existing and session-fresh personas, unlike native
`persona-<slug>` subagent types which only work if the file existed at session
start.

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

## 결론
모든 시뮬레이션은 반드시 이 섹션 포함. 회의가 도달한 하나의 명확한 결론을 1-3 문장으로. 합의 안 된 경우에도 "합의 실패 — 이유 X"로 결론화.

## 만족도 평가
- 점수: N / 10 (시작 시 사용자가 설정한 기준 대비)
- 기준별 점수:
  - 기준 1 (사용자 사전 입력): X/10
  - 기준 2: X/10
  - 기준 3: X/10
- 미달 시 retry 여부 (Ralph 모드): yes/no

## 시스템 피드백
이 시뮬레이션을 더 잘하려면 개선 포인트 3-5개. 범주별:
- **Persona 측**: 어떤 persona 섹션을 refine 해야 하나
- **프로세스 측**: 의제 설계·진행 방식 개선점
- **플랫폼 측**: 툴·환경·UX 개선점

### 합의 · 액션 · 후속 질문
합의된 action items (표):
| # | 담당 | 내용 | 기한 |
|---|------|------|------|

미결 질문:
- ...
```

**스키마 규칙 (의무)**:
- `## 결론`, `## 만족도 평가`, `## 시스템 피드백` **3개 H2 섹션 반드시 포함**. 빠지면 docs 파이프라인이 경고 + 사용자 재작성 요청.
- `## 종료 요약` 은 위 3개와 `합의·액션·후속 질문` 서브섹션을 포괄하는 상위 그룹이거나, 각 섹션이 H2로 독립 — 두 패턴 모두 허용.

## Step 5 — Generate Word (.docx) and PowerPoint (.pptx)

Auto-invoke the docs pipeline right after the markdown transcript is saved:

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

Expected output: same directory, `<stem>.docx` and `<stem>.pptx`.

- `.docx`: full-fidelity archive — every 발언 원문, 퍼실리테이터 질문·요약, 의제·종료 요약 전부. 사내 회의록 또는 기록물 배포용.
- `.pptx`: executive-summary deck — 표지 + 의제 overview + 의제별 핵심 1-line + 종료 합의 + 액션 아이템. 사내 공유·Follow-up 발표용.

If the script fails, surface the last 20 lines of its output and ask the user
(AskUserQuestion) whether to retry, skip, or open the markdown directly.

## Step 6 — Report to user

Show three paths:
- `simulations/<stem>.md` (markdown 원본)
- `simulations/<stem>.docx` (전문 아카이브)
- `simulations/<stem>.pptx` (요약 배포)

Then return control to the caller (usually `/persona-studio:studio`).
