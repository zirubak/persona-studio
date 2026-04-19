---
description: Facilitated meeting simulation in split-panes team mode. Each persona runs as a named teammate in its own tmux pane. User can interrupt any pane mid-simulation.
---

# /persona-studio:simulate-meeting-team

Split-panes version of `/persona-studio:simulate-meeting`. Each persona becomes a named
teammate running in its own pane. Sequential version stays at `/persona-studio:simulate-meeting`
for environments without tmux.

## Step 0 — Pre-flight check (MUST pass before spawning any teammate)

Run these checks in order. Abort with a clear user message if any fails.

1. **tmux available?**
   ```bash
   which tmux || echo "NO_TMUX"
   ```
   If `NO_TMUX`: tell user (Korean) "tmux가 필요합니다. `brew install tmux` 후 새 터미널에서 다시 시도하세요." and stop.

2. **Inside a tmux session AND teammate split-panes mode active?**
   - Check `$TMUX` env var (tmux session indicator).
   - Try a probe Task call with `team_name="probe-check"` and a trivial prompt. If Claude Code returns an error about in-process mode or missing teammate runtime, we are NOT in split-panes. Clean up probe team via `TeamDelete` if created.
   - If check fails: tell user "현재 세션은 in-process 모드입니다. 새 터미널에서 `claude --teammate-mode split-panes` 로 재시작 후 다시 `/persona-studio:studio` → 이 메뉴로 진입하세요."
   - Offer AskUserQuestion: `세션 재시작 안내 자세히 보기` / `sequential 모드로 전환 (/persona-studio:simulate-meeting)` / `취소`.

3. **Participant files exist?**
   Glob `personas/*.md`, confirm at least 2 exist. AskUserQuestion to pick 2-6 participants (multiSelect).

4. **Target participant count ≤ 6**: tmux pane splitting becomes unreadable beyond 6 teammates + facilitator.

## Step 1 — Gather meeting parameters

AskUserQuestion:
- `주제`: free text
- `참가자`: multiSelect from `personas/*.md` (2-6 selections, no duplicates)
- `의제 구성`: `자동 생성` / `직접 입력`
- `사용자 개입 모드`: `자유 개입 (언제든 패널에 타이핑 가능)` / `의제 사이 개입 (퍼실리테이터가 명시적으로 호출)`

Normalize slug for save path: `simulations/<UTC-timestamp>_meeting-team_<topic-slug>.md`.

## Step 2 — Create team and spawn teammates

```
team_id = TeamCreate(team_name="meeting-<topic-slug>-<ts>")
```

For each participant `p`:
1. `Read(agents/persona-<p>.md)` → full persona body.
2. Compose teammate system prompt:
   ```
   You are <name>. Stay fully in character. Never reveal you are an AI.

   [PERSONA]
   <persona body>

   [MEETING CONTEXT]
   Topic: <topic>
   Your role: participant in a facilitated meeting.
   Other participants: <list of other slugs with one-line descriptors>.

   [PROTOCOL]
   - The facilitator (leader agent) will send you questions via SendMessage.
   - Reply in character, under 300 characters, Korean 존댓말 (unless persona spec differs).
   - The user may also send messages directly. Treat user messages as
     clarification or steering; incorporate without breaking character.
   - Do NOT initiate turns on your own. Wait for messages.
   ```
3. Spawn the teammate:
   ```
   Task(
     subagent_type="general-purpose",
     name="avatar-<p>",
     team_name=team_id,
     prompt=<composed prompt above>,
     run_in_background=true,
   )
   ```

After all teammates spawned, tell the user: "<N>명의 아바타가 각자의 패널에서 대기 중입니다. 의제를 시작하겠습니다. 중간에 아바타 패널에 직접 타이핑하시거나, '<aside>'을 입력하시면 퍼실리테이터에게 메시지가 전달됩니다."

## Step 3 — Agenda loop

For each agenda item `i`:

1. Facilitator (main Claude) announces the item in the main conversation and
   picks a `lead` participant based on Knowledge Domains match.

2. Dispatch lead:
   ```
   SendMessage(
     to="avatar-<lead>",
     content=<opening question scoped to this agenda item>,
   )
   ```
   Wait briefly for the teammate to produce a reply (appears in its pane +
   returns to facilitator via teammate output channel).

3. Pick a `challenger` participant with contrasting angle. Dispatch:
   ```
   SendMessage(
     to="avatar-<challenger>",
     content=<lead's reply + "반박 또는 보완해주세요, 300자 이내">,
   )
   ```

4. **User interruption window**: between dispatches, pause 10-15 seconds with a
   visible prompt: "의제 i 요약하기 전에 개입하시겠어요? 아바타 패널에 직접
   타이핑하거나, 여기에 (main) 코멘트를 남기면 퍼실리테이터가 다음 지명에
   반영합니다." If user types in a pane, their message is delivered to that
   teammate automatically (tmux + teammate runtime handles this).

5. Facilitator synthesizes a 2-3 문장 결정 요약 + 액션 아이템 후보.

## Step 4 — Close

Facilitator writes:
- 합의 (bullet list)
- 액션 아이템 (담당·기한 표)
- 후속 질문

Announce close in each teammate's context:
```
for p in participants:
    SendMessage(to="avatar-<p>", content="오늘 회의는 여기서 마칩니다. 의견 감사합니다.")
```

Then `TeamDelete(team_name=team_id)` to free the panes.

## Step 5 — Save transcript (same markdown contract as /persona-studio:simulate-meeting)

Build the markdown from the collected teammate replies + facilitator narration,
using the structure required by `scripts/simulation_to_docs.py`:

- YAML frontmatter: `kind: meeting-team`, `topic`, `participants`, `agenda`,
  `generated`, plus `mode: split-panes` and `user_interruptions: N` if user
  intervened.
- H1 title, H2 per agenda item + `## 종료 요약`, H3 per speaker role.

Save to `simulations/<UTC-timestamp>_meeting-team_<topic-slug>.md`.

## Step 6 — Generate Word (.docx) and PowerPoint (.pptx)

Same pipeline as `/persona-studio:simulate-meeting` Step 5:

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

## Step 7 — Report

Show three paths (md/docx/pptx) + interruption count. Return to caller.

---

## Non-negotiable rules

- Never spawn teammates without passing the pre-flight check.
- `subagent_type` must be `general-purpose` for every teammate (per `~/.claude/CLAUDE.md` Agent Teams rule).
- Always TeamDelete on normal close or any error path (leaked panes are a
  real UX problem).
- Persona body is the teammate's SYSTEM prompt — do not inject user data
  into it to avoid prompt injection upstream.
- If a teammate stops responding (no reply within 60 s), notify the user
  and offer to re-send the question or skip that speaker.
