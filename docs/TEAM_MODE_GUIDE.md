# Team Mode Guide — 분할 화면 실시간 시뮬레이션

**대상**: `/simulate-meeting-team` 또는 `/simulate-debate-team`을 쓰고 싶은 사용자.

## Team Mode가 뭐가 다른가

| 항목 | Sequential (`/simulate-meeting`) | Team (`/simulate-meeting-team`) |
|---|---|---|
| 실행 방식 | Main Claude가 한 명씩 순차 호출 | 각 아바타가 별도 tmux 패널에서 동시 실행 |
| 시각적 경험 | 본문 스크롤에 발언이 누적 | 3-6개 패널이 한 화면에, 실시간 진행 |
| 사용자 개입 | 발언 사이 main 창 코멘트만 | **아무 패널에 직접 타이핑**하면 해당 아바타에게 즉시 전달 |
| 소요 시간 | 순차라 총합 5-10분 | 병렬이라 2-3분 + 검토 여유 |
| 사전 조건 | Claude Code 만으로 충분 | tmux + `--teammate-mode split-panes` 필요 |
| 토큰 비용 | 낮음 | 아바타 수 × 페르소나 body = 2-3배 |

## 설치 (최초 1회)

### macOS

```bash
brew install tmux
# 또는 iTerm2 + it2 CLI 조합
```

tmux 0.9+ 권장. `tmux -V` 로 확인.

### Linux

```bash
sudo apt install tmux   # Debian/Ubuntu
sudo dnf install tmux   # Fedora
sudo pacman -S tmux     # Arch
```

## Claude Code 세션 시작

### 옵션 A — CLI 플래그

```bash
tmux new -s persona-studio
# tmux 세션 안에서:
cd ~/Documents/GitHub/human_ai_agent_creator
claude --teammate-mode split-panes
```

### 옵션 B — 설정 파일

`~/.claude/settings.json` 또는 프로젝트 `.claude/settings.json`:

```json
{
  "teammateMode": "split-panes"
}
```

그다음 tmux 세션에서 평소처럼 `claude` 실행.

### 옵션 C — 자동 감지

```json
{ "teammateMode": "auto" }
```

tmux 세션 안이면 자동으로 split-panes로 승격.

## 사용 흐름

1. Claude Code에서 `/persona-studio`
2. 메인 메뉴 → `토론 시뮬레이션` 또는 `회의 시뮬레이션`
3. `실시간 분할 화면 (tmux, 여러 패널 동시, 중간 개입 가능)` 선택
4. 참가자·주제·라운드 수 입력
5. tmux 창이 자동으로 세로/가로 분할되며 각 아바타가 자기 패널에서 대기 프롬프트 노출
6. 퍼실리테이터(main Claude)가 의제별 질문을 각 아바타에게 전달
7. 필요하면 **어떤 패널이든 직접 타이핑** — 해당 아바타에게 즉시 전달되어 persona-consistent한 응답이 돌아옴
8. 회의 종료 시 main Claude가 transcript를 `simulations/<stem>.md`로 저장 + docx/pptx 자동 생성

## 사용자 개입 3가지 방법

### 1. 패널 직접 타이핑 (가장 자연스러움)

tmux에서 `Ctrl+b` → 화살표 키로 원하는 패널로 이동 → 타이핑. 그 아바타가 해당 메시지를 user input으로 받아 응답.

**예시**: sample persona 패널에 직접 "당시 의사결정의 근거는?" 라고 적으면, 해당 teammate가 persona 톤으로 답.

### 2. Main 창에 "<aside>" 코멘트

Main Claude가 현재 진행 중일 때, main 창에 `<aside> sample-persona 님 발언을 좀 더 감정적으로 다시 받고 싶어요` 라고 쓰면 퍼실리테이터가 다음 dispatch에 반영.

### 3. SendMessage 직접 (고급)

Claude에게 "`SendMessage(to='avatar-<persona>', content='...')` 실행해주세요" 라고 요청하면 특정 teammate에게 메시지 주입.

## 종료/정리

회의가 정상 종료되면 command 자체가 `TeamDelete`를 호출해 모든 패널을 닫고 tmux 창을 원래대로 복원. 중간에 끊고 싶으면:

1. Main 창에 "회의 중단" 또는 "abort" 요청
2. Main Claude가 모든 teammate에게 종료 메시지 + TeamDelete
3. 여기까지의 transcript는 `simulations/`에 부분 저장됨 (`status: aborted`)

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| "Agent type 'general-purpose' not found" | 세션이 teammate 모드 미활성 | `claude --teammate-mode split-panes` 로 재시작 |
| 패널이 안 뜨고 그냥 in-process로 실행됨 | tmux 세션 밖 | `tmux new -s <name>` 로 먼저 세션 진입 후 claude 실행 |
| 특정 패널이 응답 없음 (60초+) | teammate 프로세스 stall | command가 알림 표시. 재전송/스킵 중 선택 |
| 아바타 말투가 무너짐 | persona body 주입 누락 | transcript 확인 → `/persona-refine` 으로 교정 |
| tmux가 macOS에서 색 깨짐 | `TERM` 설정 | `export TERM=screen-256color` |

## 언제 Sequential / 언제 Team 을 쓸까

**Sequential (`/simulate-meeting`, `/simulate-debate`)**:
- tmux 없는 환경 (SSH·CI·IDE 내부 터미널)
- 빠르게 결과만 필요할 때 (PR 리뷰 회고, 일회성 검증)
- 토큰 비용 최소화

**Team (`/simulate-meeting-team`, `/simulate-debate-team`)**:
- 실제 회의를 **시각적으로 연습**하고 싶을 때
- 아바타 말투의 **실시간 톤 확인**이 필요할 때
- 중간 개입·course correct가 잦은 시나리오 (ex: 면접 리허설, 전략 회의 사전 점검)
- 발표/녹화 데모

## 참고 자료

- Claude Code 공식 Agent Teams 문서 (설치된 Claude Code 버전의 `/doctor` 또는 공식 README)
- 프로젝트 내 sequential 버전 커맨드: `.claude/commands/simulate-meeting.md`, `.claude/commands/simulate-debate.md`
- Memory 엔트리: `~/.claude/projects/.../memory/feedback_team_mode_simulation.md`
