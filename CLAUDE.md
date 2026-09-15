# UpSpeech translations (i18n), Claude wiring

@AGENTS.md

[`AGENTS.md`](AGENTS.md) is imported above, so it is already in context. It is
the entry point for every agent runtime and it holds this repo's conventions plus the workspace rules.

This file adds only what is specific to Claude Code.

## Skills

The workflow skills ship from `UpSpeech/agent-kit` as a plugin, which
`.claude/settings.json` registers. `updev` for any change here, `upstage` for one
stage of a numbered plan, `upselfreview` before a human sees the branch, `upship`
to take it all the way, `uppm` for the plans backlog, `code-review` for a diff or
a PR.

If they are missing:

```bash
claude plugin marketplace add UpSpeech/agent-kit
```

The repo is private, so `gh auth status` has to be healthy first.

## Subagents

Seven reviewer agents ship with the plugin: `security-reviewer`,
`correctness-reviewer`, `test-reviewer`, `performance-reviewer`,
`architecture-reviewer`, `style-reviewer`, `premise-verifier`. Spawn them in one
message so they run concurrently.

**Put the rule in `AGENTS.md`, never in a skill.** A skill carrying its own copy
of a rule drifts from it, and one runtime reads the stale half.
