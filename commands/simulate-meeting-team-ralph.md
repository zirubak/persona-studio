---
description: Split-panes 회의 + 사용자 만족 점수 목표 + Ralph loop (미달 시 자동 재실행). Mandatory 결론·만족도·시스템 피드백 3축 스키마.
---

# /persona-studio:simulate-meeting-team-ralph

Split-panes 회의 위에 **Ralph loop + 사용자 만족 점수 gating** 을 얹은 변형. 기존 `/persona-studio:simulate-meeting-team` 의 기능 전부 + 시작 전 TUI 목표 설정 + 결과 스코어링 + 미달 시 재실행.

## Step 0 — Pre-flight + TUI 만족 점수 설정

1. `/persona-studio:simulate-meeting-team` Step 0과 동일한 tmux/teammate-mode 사전 체크 먼저 수행.

2. 추가 TUI 입력 (AskUserQuestion 연쇄):
   - `목표 점수 (0-10)`: 4 / 6 / 8 / 10 (기본 7)
   - `최대 Ralph iteration (1-5)`: 1 / 2 / 3 / 5 (기본 3)
   - `측정 기준 3개 (자유 텍스트)`: 사용자가 "무엇을 좋은 결과로 볼지" 3-bullet 직접 기술. 예:
     - 현실적 반박 교환 최소 3턴
     - 액션 아이템 구체성 (담당·기한 명시)
     - persona 말투 일관성 유지

   이 3개 기준은 매 iteration 마지막에 스코어링 근거로 고정 재사용 (퍼실리테이터 자가 점수 편차 방지).

## Step 1-3 — `/persona-studio:simulate-meeting-team` 흐름과 동일

참가자 선정 → TeamCreate → 아바타 스폰 → 의제 라운드 → 사용자 개입 윈도우.

## Step 4 — Ralph 스코어링 + gating

회의 종료 후:

1. 퍼실리테이터가 **3개 기준 각각에 0-10 점수** 매김. 총점 = 평균.
2. 사용자에게 AskUserQuestion: `<최종 판정>` — `목표 달성, 종료` / `재실행 (Ralph loop)` / `그만둠 (부분 저장)`
3. 사용자가 `재실행` 선택 시:
   - 현재 iteration을 `iter-N` 서브폴더로 보관
   - 퍼실리테이터 prompt 에 "이전 iteration에서 기준 X가 낮았음, 이번엔 ~에 집중" 보강
   - TeamDelete + 재 TeamCreate + 의제 재실행
   - iteration 카운트 증가
4. `max_iterations` 초과 또는 `<stop>` 입력 시 즉시 loop 종료.

## Step 5 — Transcript 저장 (topic-subfolder layout)

경로 규칙:
```
simulations/<topic-slug>/<timestamp>_meeting-team-ralph.md
simulations/<topic-slug>/<timestamp>_meeting-team-ralph.docx
simulations/<topic-slug>/<timestamp>_meeting-team-ralph.pptx
simulations/<topic-slug>/iter-1/<...>     # Ralph 재실행 이전 버전
simulations/<topic-slug>/iter-2/<...>
```

Markdown frontmatter 에 추가:
```yaml
mode: split-panes-ralph
satisfaction_goal: <사용자 설정 점수>
satisfaction_final: <마지막 iteration 평균>
satisfaction_criteria:
  - <기준 1>: <점수>
  - <기준 2>: <점수>
  - <기준 3>: <점수>
iterations_run: <N>
early_stop: <stop | max_reached | goal_met>
```

**본문 3축 섹션 의무**:
- `## 결론` — 최종 iteration의 명확한 결론
- `## 만족도 평가` — 기준별 점수 + iteration 히스토리
- `## 시스템 피드백` — persona / 프로세스 / 플랫폼 개선 포인트

## Step 6 — 공식 docx/pptx skill 사용 (우선) + python 폴백

```
Skill('document-skills:docx') — 전문(全文) 아카이브 .docx 생성 (모든 iteration 포함)
Skill('document-skills:pptx') — 요약 덱 .pptx 생성 (표지 / 의제 / 의제별 결론 / Ralph iteration 진화 / 만족도 대시보드 / 시스템 피드백)
```

Skill 로드 실패 시 `.venv/bin/python scripts/simulation_to_docs.py` 로 자동 폴백.

## Step 7 — 보고 + 메뉴 복귀

md/docx/pptx 경로 + iteration 요약 + 최종 점수 + 시스템 피드백 bullet 3개 사용자에게 보고.

---

## Non-negotiable rules

- Pre-flight 실패 시 절대 Team 생성 금지.
- 모든 iteration 종료 시 반드시 TeamDelete.
- `max_iterations` 초과 시 강제 종료, 부분 결과라도 저장 (`early_stop: max_reached`).
- 사용자 `<stop>` 는 언제든 loop 탈출 — 즉시 현재 상태로 저장.
- 3축 스키마 (`결론`·`만족도`·`시스템 피드백`) 누락 시 docs 파이프라인 경고 + 사용자에게 재작성 요청.
- Skill 우선, Python 폴백: 둘 다 실패하면 최소 markdown 만이라도 저장 보장.
