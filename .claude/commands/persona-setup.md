---
description: Install ETL dependencies and pre-download the whisper model. Idempotent.
---

# /persona-setup

One-shot environment bootstrap. Safe to run multiple times.

## Steps

1. Check Python:
   ```bash
   python --version
   ```
   Must be 3.10 or newer. If not, tell the user to install a modern Python and stop.

2. Install the package in editable mode from the repo root:
   ```bash
   pip install -e .
   ```

3. Pre-download the whisper base (int8) model so the first audio file does not
   stall:
   ```bash
   python -m persona_builder.cli setup
   ```

4. Sanity check:
   ```bash
   python -m persona_builder.cli list
   ```

Report results in Korean, one line per step. If `pip install` fails because of
missing system packages (ffmpeg for `yt-dlp`, or a compiler for `faster-whisper`),
explain what the user needs to install and link to `README.md`.
