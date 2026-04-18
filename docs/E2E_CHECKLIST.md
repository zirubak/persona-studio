# End-to-End Test Checklist

사용자가 직접 실행하면서 단계별 결과를 확인하는 수동 검증 절차입니다. 각
항목에 기대 결과와 실패 시 보고할 정보를 명시했습니다.

실행 환경: macOS/Linux + Claude Code CLI + Python 3.10+.
소요 시간: 전체 완주 약 45-60분 (Celebrity 모드 harvester와 YouTube 전사
시간 포함).

---

## Phase 0 — 환경 준비 (5분)

### 0.1 Python 가상환경 활성화

```bash
cd /Users/jhbaek/Documents/GitHub/human_ai_agent_creator
source .venv/bin/activate
```

**기대**: 프롬프트에 `(.venv)` 표시.

### 0.2 전체 의존성 설치

기존 venv는 최소 의존성(typer, pydantic)만 설치된 상태입니다. 실제 E2E에는
PDF/DOCX/오디오/YouTube 라이브러리가 필요합니다.

```bash
pip install -e ".[dev]"
pip install pypdf python-docx beautifulsoup4 trafilatura faster-whisper yt-dlp youtube-transcript-api
```

**기대**: 에러 없이 설치. `faster-whisper`는 네이티브 바이너리가 커서 수 분 소요.

**실패 시 보고**: `pip` 에러 메시지 전체 + `python --version` 결과.

### 0.3 ffmpeg 확인 (YouTube 오디오 다운로드 필요)

```bash
which ffmpeg && ffmpeg -version | head -1
```

**기대**: 경로 + 버전 출력. 없으면 `brew install ffmpeg`.

### 0.4 whisper 모델 선다운로드

```bash
python -m persona_builder.cli setup
```

**기대**: `Model ready.` 출력. 약 140MB 다운로드.

### 0.5 테스트 스위트 재확인

```bash
pytest --cov
```

**기대**: 91+ passed, 커버리지 80%+.

---

## Phase 1 — Private Mode (샘플 데이터) (5분)

### 1.1 ETL 단독 실행

```bash
python -m persona_builder.cli extract sample_private
```

**기대**: `corpus written: ... manifest written: ... ok=3 fail=0`

**확인**:
- `data/people/sample_private/extracted/corpus.md` 존재 (~4KB)
- `data/people/sample_private/extracted/manifest.json`에 3개 항목 모두 `ok: true`

### 1.2 재실행 시 결정론 확인

```bash
sha256sum data/people/sample_private/extracted/corpus.md
python -m persona_builder.cli extract sample_private
sha256sum data/people/sample_private/extracted/corpus.md
```

**기대**: 두 해시가 같아야 함. 다르면 `_format_section`에 `date.today()`가
박혀있어 다른 날 실행하면 달라짐 — 버그 아님, 설계.

### 1.3 Path traversal 방어 확인

```bash
python -m persona_builder.cli extract "../etc/passwd"
```

**기대**: `BadParameter: name must match ...` 에러로 즉시 종료. 파일 시스템에
어떤 파일도 만들지 않음.

**실패 시 보고**: 에러 없이 실행되거나 다른 에러 발생.

---

## Phase 2 — Private Mode (Claude Code TUI 경로) (15분)

Claude Code CLI를 새 세션으로 연 뒤:

### 2.1 TUI 진입

```
/persona-studio
```

**기대**:
- 환경 체크 (이미 설치돼 있어서 즉시 통과)
- AskUserQuestion으로 6개 항목 메뉴 표시 (`새 아바타 만들기` ~ `종료`)

**실패 시 보고**:
- 메뉴가 평문으로 출력되거나 AskUserQuestion이 안 뜨면 → Claude가 커맨드를
  잘못 해석. `persona-studio.md` 로딩 오류일 수 있음
- 메뉴는 뜨는데 선택 후 진행이 안 되면 → 해당 Route 단계

### 2.2 Private 아바타 생성

메뉴: `새 아바타 만들기` → `Private (내 파일 업로드)` → 이름 입력 `sample_private`

**기대**:
- Claude가 `raw/`에 파일이 있는지 확인
- `python -m persona_builder.cli extract sample_private` 호출
- `extracted/corpus.md` 읽음
- demographic 필드(국적/세대/직업 등) 추론 후 모호한 항목은 AskUserQuestion으로 되물음
- MCP-perplexity로 2-4개 연구 쿼리 실행
- `personas/sample_private.md` 생성 (섹션 7개)
- `.claude/agents/persona-sample_private.md` 렌더

**확인 후 알려주세요**:
- [ ] `personas/sample_private.md` 생성됨 (섹션 제목 7개 모두 있는지)
- [ ] 각 섹션에 corpus 인용(`quote` + `source: filename`) 포함 여부
- [ ] Perplexity 인용이 실제 URL을 포함하는지 (fabricated면 안 됨)
- [ ] `.claude/agents/persona-sample_private.md` frontmatter 4필드
      (`name`, `description`, `model`, 본문) 정상

**실패 시 보고**: 중단된 단계 + Claude의 마지막 메시지 스크린샷 또는 로그.

### 2.3 두 번째 아바타 (간단한 것 하나 더)

E2E 토론을 하려면 최소 2명 필요. 다음 중 하나:
- Private으로 본인의 Slack 내보내기/이메일 일부를 `data/people/myself/raw/`에
  넣고 동일 플로우
- 또는 샘플 문서를 복사해 `sample_private2`로 만들어 가볍게 변형

**기대**: 1.1과 동일한 성공 패턴.

---

## Phase 3 — Celebrity Mode (10-20분)

시간이 가장 많이 걸리는 경로입니다. 실제 네트워크 호출이 다수 발생합니다.

### 3.1 Celebrity 아바타 시작

`/persona-studio` → `새 아바타 만들기` → `Celebrity (이름만)` → 이름 (예:
`elon-musk` 또는 한국 유명인 `ahn-cheol-soo`)

### 3.2 Harvester 동작 확인

**기대**:
- Claude가 WebSearch로 10-20개 URL 수집
- 각 URL을 WebFetch로 본문 추출 → `data/people/<name>/raw/articles/*.md` 저장
- YouTube URL 수집 → `raw/youtube_urls.txt`
- MCP-perplexity로 overview 생성 → `raw/articles/perplexity_overview.md`
- 완료 후 harvester가 요약 JSON 반환

**확인**:
- [ ] `data/people/<name>/raw/articles/` 에 최소 5개 `.md` 파일
- [ ] `data/people/<name>/raw/youtube_urls.txt`에 최소 3개 URL
- [ ] `articles/perplexity_overview.md` 존재

**실패 가능 지점**:
- WebSearch가 빈 결과 → 이름이 너무 모호하거나 힌트 부족
- WebFetch가 모두 < 500자 → paywall 많은 유명인. 다른 이름 시도
- MCP-perplexity 미작동 → MCP 서버가 로딩 안 된 상태. `/mcp` 상태 확인

### 3.3 Corpus 빌드

harvester 이후 Claude가 자동으로:
```
python -m persona_builder.cli extract <name>
```

**기대**: YouTube 자막 fetch 단계에서 몇 분 대기 (자막 없으면 `yt-dlp` 다운 +
whisper 전사로 10분 이상 가능).

**확인**: `extracted/corpus.md` 10-50KB 규모, 다양한 source 라벨 포함.

### 3.4 Persona 합성

Phase 2.2와 동일한 단계. 단, demographic은 corpus에서 더 명확히 추출돼야
하므로 Claude 질문이 적어야 함.

**확인**:
- [ ] `personas/<name>.md`의 `Demographic-derived Patterns` 섹션이 Perplexity
      인용으로 실제 채워져 있는지
- [ ] `Speech Patterns` 섹션의 직접 인용이 corpus의 실제 문장과 일치하는지
      (grep으로 한 줄 골라서 확인)

---

## Phase 4 — 토론 시뮬레이션 (5분)

아바타가 2명 이상 준비된 상태에서:

### 4.1 라운드로빈 토론

`/persona-studio` → `토론 시뮬레이션 (라운드로빈)`

- 참가자 2명 선택
- 주제 입력: `원격근무의 미래`
- 라운드 수: 4

**기대**:
- 메인 Claude가 사회자 인트로
- 각 라운드마다 참가자별 `Agent(subagent_type="persona-<name>", ...)` 호출
- 발언이 각 아바타의 Speech Patterns에 부합 (말투·어휘·존댓말/반말)
- 4라운드 후 메인 Claude의 합의점/분기점/미해결 질문 요약
- `simulations/<timestamp>_debate_원격근무의-미래.md` 저장

**확인**:
- [ ] 전 발언이 300자 이내 규칙 준수
- [ ] 특정 아바타가 자기 Knowledge Domains 밖 주제에서 defleção 패턴 사용
- [ ] 파일이 실제로 `simulations/`에 저장됐고 yaml frontmatter + 라운드 섹션
      구조가 맞는지

**실패 시 보고**:
- 에이전트 호출 실패 메시지 (`.claude/agents/persona-X.md` not found 등)
- 특정 아바타가 persona를 벗어난 발언 (예: AI임을 인정, 메타 언급)
- 발언 길이 규칙 위반 (500자 초과 빈번)

### 4.2 회의 시뮬레이션

`/persona-studio` → `회의 시뮬레이션 (퍼실리테이터)`

- 참가자 2-3명
- 주제: `Q2 제품 로드맵`
- 의제: `자동 생성` (Claude가 3-5개 제안)

**기대**:
- 의제별 Lead/Challenger 지명 패턴
- 최종 합의/액션 아이템/후속 질문 섹션
- `simulations/<timestamp>_meeting_*.md` 저장

**확인**:
- [ ] 각 의제에 lead/challenger 발언 존재
- [ ] 액션 아이템 bullet에 담당자 추정 포함
- [ ] 합의 항목과 미결 항목이 구분돼 기록

---

## Phase 5 — Refine 피드백 (3분)

### 5.1 특정 섹션 수정

`/persona-studio` → `아바타 수정` → `sample_private` → `Speech Patterns`

피드백 예시: "이 사람은 실제로는 영어 코드스위칭을 전혀 안 해요. 한국어만 써요."

**기대**:
- `personas/sample_private.md`의 `# Speech Patterns` 섹션만 수정
- 다른 섹션은 diff 없음
- `.claude/agents/persona-sample_private.md` 재렌더

**확인**:
```bash
git diff personas/sample_private.md
```
변경된 청크가 딱 한 섹션인지 확인.

### 5.2 변경 후 동일 토론 재실행

4.1의 토론을 다시 실행. 해당 아바타의 영어 코드스위칭이 사라졌는지 육안
검증.

---

## 보고 포맷

각 Phase 종료 후 다음 형식으로 알려주세요:

```
Phase X.Y: [성공 | 실패 | 부분성공]
- 관찰: <1-3줄>
- 파일 위치: <생성된 파일 경로>
- 실패 원인 (해당 시): <에러 메시지 또는 행동 차이>
```

실패가 있을 때 함께 첨부 환영:
- Claude Code 세션 로그 (stdout 복사)
- 생성된 파일 내용
- `manifest.json` 전체

---

## 알려진 제약 / Non-goals

- 이 체크리스트는 **기능 검증**이지 **성능/정확도 벤치마크**가 아닙니다. 한 번의
  실행은 표본 1입니다.
- YouTube 음성 전사는 CPU int8 whisper로 수행되므로 1시간짜리 영상이 10-30분
  소요될 수 있습니다. 타임아웃이 나면 설정으로 base → small 모델로 업그레이드.
- Celebrity 모드의 WebFetch 품질은 대상 인물 공개 자료량에 전적으로 의존합니다.
  한국 비유명인은 아예 실패할 수 있음 — 이는 버그가 아니라 입력 부족.
- 시뮬레이션의 발언 스타일 충실도는 corpus 양과 `Speech Patterns` 추출 품질에
  비례합니다. 첫 시도에서 만족스럽지 않으면 `/persona-refine`으로 반복 개선.
