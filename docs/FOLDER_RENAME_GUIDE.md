# Folder Rename Guide — `human_ai_agent_creator` → `persona-studio`

The Python package (`persona_builder` → `persona_studio`) and all project
metadata have already been renamed in `aa3381b`. The **repository directory
itself** is the last piece remaining. This must be run by the user in a
terminal *outside* an active Claude Code session on this project, because:

1. `.venv/` contains shebangs hardcoded to the old absolute path.
2. Claude Code derives its per-project memory and session-history directory
   names from the working directory path, so a rename requires migration.
3. The `.bkit` plugin caches state keyed on path; a rename needs a reset.

Follow these steps in order.

---

## Step 1 — Close the current session

Exit any active Claude Code session for this project. Make sure no editor,
shell, or process is holding the `human_ai_agent_creator` path open.

## Step 2 — Commit everything and push (optional but recommended)

```bash
cd ~/Documents/GitHub/human_ai_agent_creator
git status                 # should be clean
git push origin main       # if a remote exists
```

## Step 3 — Rename the directory

```bash
mv ~/Documents/GitHub/human_ai_agent_creator \
   ~/Documents/GitHub/persona-studio
cd ~/Documents/GitHub/persona-studio
```

## Step 4 — Recreate the virtualenv

The old `.venv/` is unusable (absolute-path shebangs). Wipe and rebuild:

```bash
rm -rf .venv
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -e '.[dev]'
```

Verify:

```bash
.venv/bin/pytest -q
.venv/bin/persona-studio --help   # entry-point should resolve
```

## Step 5 — Migrate Claude Code per-project memory

Claude Code stores memory under a path-derived directory:

```
~/.claude/projects/-Users-<you>-Documents-GitHub-<slug>/
```

Old slug: `-Users-jhbaek-Documents-GitHub-human-ai-agent-creator`
New slug: `-Users-jhbaek-Documents-GitHub-persona-studio`

```bash
OLD=~/.claude/projects/-Users-jhbaek-Documents-GitHub-human-ai-agent-creator
NEW=~/.claude/projects/-Users-jhbaek-Documents-GitHub-persona-studio

if [ -d "$OLD" ] && [ ! -d "$NEW" ]; then
  mv "$OLD" "$NEW"
fi
ls "$NEW/memory/"   # should list MEMORY.md + *.md
```

The memory files themselves are path-agnostic, so no edits are needed
inside `MEMORY.md` or the individual entries.

## Step 6 — Reset `.bkit` runtime cache

The bkit plugin caches session fingerprints and context paths. After a
rename, clear the transient runtime state so bkit recomputes cleanly on
first launch:

```bash
cd ~/Documents/GitHub/persona-studio
rm -f .bkit/runtime/session-ctx-fp.json \
      .bkit/runtime/agent-state.json \
      .bkit/runtime/control-state.json
```

Committed bkit artifacts (`.bkit/audit/*.jsonl`, `.bkit/state/*`,
`.bkit/snapshots/`) are safe to keep; they are path-tagged but still
readable from the new location.

## Step 7 — Symlink for backward compatibility (optional)

If other tools, scripts, or shell aliases still reference the old path, add
a symlink so they keep working:

```bash
ln -s ~/Documents/GitHub/persona-studio \
      ~/Documents/GitHub/human_ai_agent_creator
```

Remove the symlink once you've updated every reference.

## Step 8 — Update shell history & tool configs

Grep for residual references outside the repo:

```bash
grep -R "human_ai_agent_creator" \
  ~/.zshrc ~/.bash_profile ~/.config 2>/dev/null
```

Update or delete any matches. Typical offenders: shell aliases, `cd`
shortcuts, launchd plists, VS Code recent workspaces, tmux session files.

## Step 9 — Verify end-to-end

Start a fresh Claude Code session in the renamed directory:

```bash
cd ~/Documents/GitHub/persona-studio
claude          # or however you invoke it
```

Inside the session:

1. Confirm `MEMORY.md` entries are visible.
2. Run `/persona-studio` — it should open the TUI without errors.
3. Pick a no-op route (e.g., "List existing personas") to smoke-test the
   CLI subprocess dispatch.

If all three pass, the rename is complete.

---

## Rollback

Everything above is reversible. To roll back:

```bash
mv ~/Documents/GitHub/persona-studio ~/Documents/GitHub/human_ai_agent_creator
rm -rf ~/Documents/GitHub/human_ai_agent_creator/.venv
cd ~/Documents/GitHub/human_ai_agent_creator
python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'
# Reverse the ~/.claude/projects/ rename with the same mv pattern.
```

No git history is touched by any step in this guide.
