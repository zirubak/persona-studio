---
description: Persona Studio TUI - 비개발자용 메인 진입점. 아바타 생성·토론·회의 전체 메뉴.
---

# /persona-studio

You are operating the Persona Studio control panel. The user may be a non-developer;
they should never need to type any other slash command or CLI during this session.
Drive everything through `AskUserQuestion` tool calls with explicit `options`.

## Step 1 — First-run auto-bootstrap (idempotent, ~1 minute after first install)

Before showing the menu, always run the bootstrap. It creates `.venv/`, installs
the package with all runtime + dev dependencies, warns if ffmpeg is missing, and
pre-downloads the whisper model. All steps are skipped if already satisfied, so
this is safe to run every session.

```bash
python3 scripts/setup.py
```

Interpret the exit code:
- `0` — ready, continue to Step 2
- `2` — Python version too old. Tell the user (Korean): "Python 3.10 이상이 필요합니다. `brew install python@3.12` 후 다시 시도해주세요." Stop.
- Any other non-zero — show the final lines of the output and ask the user whether to retry or skip (AskUserQuestion).

If `ffmpeg not found` appears in the output, the bootstrap continues with a
warning. Audio and YouTube paths will fail until the user installs it. Mention
this in Korean with the platform-specific hint printed by the script (brew on
darwin, apt/dnf/pacman on linux).

## Step 2 — Show the main menu (loop)

Use `AskUserQuestion` with this question, repeated until the user picks `종료`:

- **question**: "무엇을 하시겠어요?"
- **header**: "Persona Studio"
- **options** (all with `multiSelect: false`):
  1. `새 아바타 만들기` — "문서·음성·웹 자료 또는 유명인 이름으로 아바타 생성"
  2. `토론 시뮬레이션 (라운드로빈)` — "여러 아바타가 주제 놓고 돌아가며 토론"
  3. `회의 시뮬레이션 (퍼실리테이터)` — "의제별 진행자가 이끄는 회의"
  4. `아바타 목록 보기` — "저장된 페르소나 요약"
  5. `아바타 수정` — "한 아바타의 특정 섹션만 업데이트"
  6. `종료` — "스튜디오 종료"

Route to the matching sub-flow below. After each sub-flow returns, come back to
this menu instead of ending the session.

## Route A — 새 아바타 만들기

1. AskUserQuestion: "어떤 모드로 만들까요?"
   - `Private (내 파일 업로드)`
   - `Celebrity (이름만)`
2. Ask for the person's name (kebab-case slug is preferred). Sanitize spaces.
3. Delegate to `/create-persona <name> --mode <private|celebrity>` by invoking the
   command's instructions directly (Claude reads the file and follows it). Do not
   spawn it as a separate slash command; just execute its steps inline.

## Route B — 토론 시뮬레이션

1. AskUserQuestion: `순차 (한 화면, 빠름)` / `실시간 분할 화면 (tmux, 여러 패널 동시, 중간 개입 가능)`.
2. Glob `personas/*.md` and present participants via AskUserQuestion with
   `multiSelect: true`. Require 2-5 selections.
3. Ask for the topic (free text) and number of rounds (default 4).
4. Route by mode:
   - `순차` → Execute `.claude/commands/simulate-debate.md` inline.
   - `실시간 분할 화면` → Execute `.claude/commands/simulate-debate-team.md` inline (includes pre-flight tmux + teammate-mode check; auto-fallback to sequential with user confirmation if check fails).

## Route C — 회의 시뮬레이션

1. AskUserQuestion: `순차 (한 화면, 빠름)` / `실시간 분할 화면 (tmux, 여러 패널 동시, 중간 개입 가능)`.
2. Same participant selection as Route B (2-6 people).
3. Ask for the meeting topic. Offer to auto-generate the agenda or take a custom
   one (AskUserQuestion: `자동 생성` / `직접 입력`).
4. Route by mode:
   - `순차` → Execute `.claude/commands/simulate-meeting.md` inline.
   - `실시간 분할 화면` → Execute `.claude/commands/simulate-meeting-team.md` inline (includes pre-flight tmux + teammate-mode check; auto-fallback to sequential with user confirmation if check fails).

**팁**: 실시간 분할 화면은 tmux + `claude --teammate-mode split-panes` 세션에서만 동작. 처음이면 `docs/TEAM_MODE_GUIDE.md` 참조.

## Route D — 아바타 목록

Glob `personas/*.md`, read each and print a one-line summary (name + first line of
`# Background`). Then return to the menu.

## Route E — 아바타 수정

1. AskUserQuestion with Glob-derived list to pick a persona.
2. Execute the steps from `.claude/commands/persona-refine.md` inline for that
   persona.

## Non-negotiable rules

- Every question to the user MUST be an `AskUserQuestion` call with `options`,
  never plain-text.
- Keep status updates short and in Korean.
- Never write files outside `data/`, `personas/`, `.claude/agents/`, `simulations/`.
- If a step fails, show the exact error and offer `재시도` / `건너뛰기` / `메인 메뉴로`.
