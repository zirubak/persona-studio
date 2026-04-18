---
description: Round-robin debate in split-panes team mode. 2-5 personas run as named teammates in separate tmux panes. User can interrupt any pane mid-debate.
---

# /simulate-debate-team

Split-panes version of `/simulate-debate`. Each persona becomes a named
teammate running in its own pane. Sequential version stays at
`/simulate-debate` for environments without tmux.

## Step 0 — Pre-flight check

Identical to `/simulate-meeting-team` Step 0:
1. `which tmux` must succeed.
2. `$TMUX` env var set AND Claude Code running in `--teammate-mode split-panes`
   (or `teammateMode: split-panes` in settings.json).
3. At least 2 `personas/*.md` files exist.
4. Participant count ≤ 5 (debate panes get dense above that).

Abort paths and AskUserQuestion fallback (`sequential로 전환`, `취소`) same as
meeting-team.

## Step 1 — Gather debate parameters

AskUserQuestion:
- `주제`: free text
- `참가자`: multiSelect (2-5)
- `라운드 수`: `3` / `4` / `5` (default 4)
- `사용자 개입 모드`: `자유 개입` / `라운드 사이 개입`

## Step 2 — Create team and spawn teammates

Same pattern as `/simulate-meeting-team` Step 2, with one prompt difference —
the teammate SYSTEM prompt's PROTOCOL section:

```
[PROTOCOL]
- The facilitator (leader agent) will send you dispatch messages containing
  the prior transcript and the current round number.
- Reply in character, under 300 characters, Korean 존댓말 by default.
- For rounds after the first, YOU MUST explicitly reference at least one
  prior speaker's name and quote or paraphrase the point you are responding to.
- The user may send messages directly. Treat as clarification/steering.
- Do NOT initiate turns on your own. Wait for dispatch.
```

## Step 3 — Round loop

For `r in 1..N`:
  For each participant `p` in declared order:
    1. Compose dispatch content:
       ```
       [Debate topic]: <topic>
       [Round]: <r> of <N>
       [Prior transcript, chronological]:
       (라운드 1, <p1>): ...
       (라운드 1, <p2>): ...
       ...
       [Your turn]: 300자 이내로 앞 발언 중 가장 동의 또는 반대하는 지점을 지명해 응답하세요.
       ```
    2. `SendMessage(to="avatar-<p>", content=<dispatch>)`
    3. Collect reply from teammate output.
    4. Append to transcript as `(라운드 r, <p>): <reply>`.

  After each round, open a user interruption window (10 s):
  "라운드 <r> 종료. 개입하시겠어요? 아바타 패널에 타이핑하거나, main
  창에 코멘트를 남기면 다음 라운드 dispatch에 반영됩니다."

## Step 4 — Synthesis

Main Claude writes a neutral summary:
- 핵심 합의점
- 결정적 분기점 (누구의 주장이 어디서 갈라졌는지)
- 미해결 질문

Announce close to each teammate (SendMessage), then `TeamDelete`.

## Step 5 — Save transcript

Markdown contract for the docs pipeline:

```markdown
---
kind: debate-team
topic: <topic>
participants: [<p1>, <p2>, ...]
rounds: <N>
mode: split-panes
user_interruptions: <count>
generated: <ISO8601>
---

# Debate — <topic>

## 라운드 1
### <p1>
> <reply>

### <p2>
> <reply>

## 라운드 2
...

## 종료 요약

### 핵심 합의점
### 결정적 분기점
### 미해결 질문
```

Save to `simulations/<UTC-timestamp>_debate-team_<topic-slug>.md`.

## Step 6 — Generate Word (.docx) and PowerPoint (.pptx)

```bash
.venv/bin/python scripts/simulation_to_docs.py simulations/<stem>.md
```

## Step 7 — Report

Show md/docx/pptx paths + round summary + interruption count. Return to caller.

---

## Non-negotiable rules

Identical to `/simulate-meeting-team`. The two commands share the same
pre-flight, spawn, and cleanup contracts; only the dispatch structure (round
loop vs agenda loop) differs.
