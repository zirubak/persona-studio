---
description: Split-panes 토론 + 만족도 Ralph loop. 3축 스키마 필수.
---

# /simulate-debate-team-ralph

`/simulate-debate-team` + `/simulate-meeting-team-ralph` 의 스코어링·Ralph 루프 패턴 결합. 의제 대신 라운드 종료 후 만족도 평가.

## Step 0 — Pre-flight + TUI

`/simulate-debate-team` Step 0 + `/simulate-meeting-team-ralph` TUI 입력 (목표 점수·iteration·3개 측정 기준).

## Step 1-3 — 토론 진행

`/simulate-debate-team` 과 동일한 라운드 루프 + 사용자 개입 윈도우.

## Step 4 — Ralph 스코어링

N 라운드 완료 → 3 기준별 점수 → 사용자 최종 판정 → 재실행/종료.
재실행 시 현재 iter를 `iter-N` 서브폴더 보관, 개선된 dispatch prompt 로 새 TeamCreate.

## Step 5-7 — 저장·docs·보고

저장 경로: `simulations/<topic-slug>/<ts>_debate-team-ralph.(md|docx|pptx)`
Markdown 프론트매터: `kind: debate-team-ralph`, `mode: split-panes-ralph`, `satisfaction_goal/final/criteria`, `iterations_run`, `early_stop`.
본문 3축 섹션 의무: `## 결론`, `## 만족도 평가`, `## 시스템 피드백`.
docs: `Skill('document-skills:docx')` + `Skill('document-skills:pptx')` 우선, python 폴백.
