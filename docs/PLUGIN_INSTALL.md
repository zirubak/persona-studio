# Persona Studio — Local Plugin Install

As of v0.4.0 the repo ships as a Claude Code plugin. All slash commands are namespaced under `/persona-studio:…`.

## Structure

```
persona-studio/
├── .claude-plugin/
│   └── plugin.json              # plugin manifest
├── commands/                    # 10 slash commands
│   ├── studio.md                # TUI entry point → /persona-studio:studio
│   ├── create-persona.md
│   ├── persona-refine.md
│   ├── persona-setup.md
│   ├── simulate-debate.md
│   ├── simulate-debate-team.md
│   ├── simulate-debate-team-ralph.md
│   ├── simulate-meeting.md
│   ├── simulate-meeting-team.md
│   └── simulate-meeting-team-ralph.md
├── agents/                      # 2 subagents (ships with sample only)
│   ├── celebrity-harvester.md
│   └── persona-sample_private.md
├── src/                         # persona_studio Python package
├── scripts/                     # setup + docx/pptx builders
├── simulations/                 # saved transcripts (topic subfolders)
└── personas/                    # persona source-of-truth markdown
```

## Install (local)

Claude Code installs plugins from a **marketplace**, not a raw directory. This repo ships its own local marketplace at `.claude-plugin/marketplace.json`. Two-step install:

```
# 1. Register this repo as a local marketplace
/plugin marketplace add /Users/jhbaek/Documents/GitHub/persona-studio

# 2. Install the plugin from it
/plugin install persona-studio@persona-studio-local
```

After install, restart Claude Code. All commands appear under the `persona-studio:` namespace.

### Updating

```
cd /Users/jhbaek/Documents/GitHub/persona-studio && git pull
/plugin marketplace update persona-studio-local
/plugin install persona-studio@persona-studio-local   # re-run to pick up changes
```

## Verify

```
/plugin list | grep persona-studio
```

Should show `persona-studio@0.4.0 (local)`.

Then try:

```
/persona-studio:studio          # TUI menu
/persona-studio:create-persona <name>
/persona-studio:simulate-meeting-team-ralph
```

## Command Rename Map (v0.3.0 → v0.4.0)

| Old (flat) | New (namespaced) |
|---|---|
| `/persona-studio` | `/persona-studio:studio` |
| `/create-persona` | `/persona-studio:create-persona` |
| `/persona-refine` | `/persona-studio:persona-refine` |
| `/persona-setup` | `/persona-studio:persona-setup` |
| `/simulate-debate` | `/persona-studio:simulate-debate` |
| `/simulate-debate-team` | `/persona-studio:simulate-debate-team` |
| `/simulate-debate-team-ralph` | `/persona-studio:simulate-debate-team-ralph` |
| `/simulate-meeting` | `/persona-studio:simulate-meeting` |
| `/simulate-meeting-team` | `/persona-studio:simulate-meeting-team` |
| `/simulate-meeting-team-ralph` | `/persona-studio:simulate-meeting-team-ralph` |

## Uninstall

```
/plugin uninstall persona-studio
```

## Future (marketplace)

To distribute publicly:

1. Add `.claude-plugin/marketplace.json` listing the plugin
2. Push to a public GitHub repo
3. Users install via `/plugin install github:<user>/persona-studio`

See Claude Code plugin docs for marketplace schema.
