# Human AI Agent Creator

특정 개인(또는 유명인)의 자료를 바탕으로 **그 사람처럼 말하고 생각하는 AI
아바타**를 만들고, 여러 아바타들이 Claude Code 안에서 **가상 회의·토론을
시뮬레이션**할 수 있게 해주는 도구입니다.

실제 회의 전에 리허설하거나, 1인 창업자가 가상 팀을 운영하고 싶을 때 사용하세요.

---

## 비개발자용 빠른 시작

Claude Code만 있으면 됩니다. CLI 명령어를 직접 타이핑할 필요 없습니다.

### 1) 스튜디오 열기 (자동 설치 포함)

Claude Code에서:

```
/persona-studio
```

처음 실행 시 `scripts/setup.py`가 자동으로 실행되어:
- `.venv/` 가상환경 생성
- 필요한 Python 패키지 전체 설치 (`pip install -e ".[dev]"`)
- faster-whisper 모델 선다운로드
- `ffmpeg` 감지 (없으면 플랫폼별 설치 명령 안내)

두 번째 실행부터는 이미 준비된 것은 스킵하고 1초 내에 메뉴로 진입합니다.

### 2) 메뉴 따라가기

메뉴가 뜹니다. 화살표/Tab + Enter로 선택:

- **새 아바타 만들기** → `Private (내 파일 업로드)` 또는 `Celebrity (이름만)`
- **토론 시뮬레이션 (라운드로빈)** — 여러 아바타가 주제를 놓고 순서대로 발언
- **회의 시뮬레이션 (퍼실리테이터)** — 진행자가 의제별로 발언 유도
- **아바타 목록 보기**
- **아바타 수정** — 실제 인물과 다른 부분 교정
- **종료**

한 작업이 끝나면 자동으로 메뉴로 돌아옵니다.

### 3) Private 모드 — 내 자료로 아바타 만들기

자료를 다음 폴더에 넣으세요:

```
data/people/<원하는_이름>/raw/
├── interview.pdf          # PDF, DOCX, TXT, MD, HTML 지원
├── speech.mp3             # MP3, WAV, M4A (자동 전사)
├── urls.txt               # 한 줄에 한 URL (선택)
└── youtube_urls.txt       # 한 줄에 한 유튜브 URL (선택)
```

메뉴에서 `새 아바타 만들기 > Private`를 고르고 이름을 입력하면 나머지는
자동으로 진행됩니다.

### 4) Celebrity 모드 — 이름만으로 아바타 만들기

자료가 없어도 됩니다. 이름과 간단한 힌트(직업·국가 등)만 알려주면 Claude가
WebSearch, MCP-perplexity, YouTube 자막을 스스로 수집해 corpus를 구성합니다.

메뉴에서 `새 아바타 만들기 > Celebrity`를 선택하세요.

### 5) 샘플 체험

샘플 데이터가 이미 들어있습니다. 아바타 이름 `sample_private` 으로 시도해보세요.

---

## 무엇이 만들어지는가

각 아바타는 두 파일로 구성됩니다:

| 파일 | 역할 |
|---|---|
| `personas/<name>.md` | 사람이 읽고 수정할 수 있는 source-of-truth |
| `.claude/agents/persona-<name>.md` | Claude Code가 실행하는 서브에이전트 정의 |

`personas/*.md`를 직접 편집하고 `/persona-refine`으로 재렌더하면 됩니다.

시뮬레이션 결과는 `simulations/<timestamp>_*.md` 로 저장됩니다.

---

## 개발자용 참고

### 아키텍처

- `src/persona_builder/` — 결정론적 Python ETL (문서 추출, 오디오 전사,
  웹/유튜브 수집). LLM 추론 없음.
- `.claude/commands/` — Claude Code 슬래시 커맨드 (TUI + 합성 + 시뮬레이션).
- `.claude/agents/celebrity-harvester.md` — 유명인 자료 수집 전용 서브에이전트.
- MCP-perplexity — demographic 기반 성격/대화패턴 연구 보강.

### 직접 호출 (선택)

```bash
# ETL만 실행
python -m persona_builder.cli extract <name>

# 특정 유튜브 영상 하나만 추가
python -m persona_builder.cli fetch-youtube <name> <url>

# 사람 목록
python -m persona_builder.cli list
```

슬래시 커맨드도 개별적으로 호출 가능:

```
/create-persona sample_private --mode private
/simulate-debate "원격근무의 미래" sample_private <다른_아바타>
/simulate-meeting "Q3 제품 로드맵" <p1> <p2> <p3>
/persona-refine sample_private
```

### 시스템 요구사항

- Python 3.10 이상
- `ffmpeg` (yt-dlp 오디오 추출용)
- faster-whisper가 처음 실행 시 ~140MB 모델을 다운로드합니다 (int8 base)

### 확장

- 새 파일 타입 추가: `src/persona_builder/ingest/documents.py`의 `DOCUMENT_SUFFIXES`에
  확장자를 추가하고 디스패치 분기 하나 추가.
- 새로운 시뮬레이션 포맷(예: 1:1 인터뷰): `.claude/commands/`에 새 커맨드를
  만들고, `persona-studio.md`의 메뉴에 라우트 추가.

---

## 라이선스

MIT. `LICENSE` 참조.
