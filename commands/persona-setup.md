---
description: Idempotent first-run bootstrap — venv, deps, whisper model. Same as the auto-bootstrap invoked by /persona-studio:studio.
---

# /persona-studio:persona-setup

One-shot environment bootstrap. Safe to run multiple times. Delegates to
`scripts/setup.py`, which is stdlib-only and unit-tested.

## Steps

1. Run the bootstrap:

   ```bash
   python3 scripts/setup.py
   ```

   This creates `.venv/`, installs `-e ".[dev]"`, pre-downloads the whisper
   base model, and warns (but does not auto-install) missing ffmpeg.

2. Interpret the exit code and surface the result to the user:
   - `0` → "Environment ready. Run `/persona-studio:studio` to start."
   - `2` → "Python 3.10 or newer is required. Run `brew install python@3.12` and try again."
   - other → Show the last 20 lines of stdout and ask whether to retry.

3. (Optional) If the user wants to confirm the install, run:

   ```bash
   .venv/bin/pytest -q
   ```

   Expect 111+ passed. If failures, surface them and ask for next action.

## Non-goals

- Do NOT auto-install ffmpeg or other system packages. The bootstrap prints the
  correct platform-specific command; the user runs it themselves.
- Do NOT `source` or activate the venv. Everything downstream calls
  `.venv/bin/python` directly by absolute path.
