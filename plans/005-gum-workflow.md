# Plan 005: Add the optional Gum-guided workflow

> **Executor instructions**: Gum is presentation only. Do not duplicate
> validation, retrieval, or synthesis in shell. Update Plan 005 in
> `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 1964319..HEAD -- tools/dsds-local package.json`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — shell quoting and overwrite behavior
- **Depends on**: Plans 003 and 004
- **Category**: DX
- **Planned at**: commit `1964319`, 2026-07-22
- **PRD story**: Story 2, “Use an approachable interactive CLI”

## Why this matters

Designers should be able to create a package without memorizing flags. Agents
and automation still need a stable non-interactive command, so Gum must remain
an optional adapter over the Node CLI.

## Current state

- `docs/prd-local-context-cli.md:71-80` defines source selection, task entry,
  format choice, preview, output, and Gum fallback requirements.
- Plans 003 and 004 provide the complete non-interactive context command.
- The repository currently has no Gum dependency or shell UI convention.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests without Gum | `PATH=/usr/bin:/bin npm run test:local -- --test-name-pattern=gum` | graceful fallback tests pass |
| Interactive smoke | `npm run dsds-local -- interactive` | guided flow when Gum is installed |
| Non-interactive regression | `npm run dsds-local -- context "warning page" --source spec/examples/site-kit.dsds.json --no-model --format json` | unchanged JSON behavior |

## Scope

**In scope**

- `tools/dsds-local/bin/dsds-local-gum.sh`
- `tools/dsds-local/src/gum.js`
- `tools/dsds-local/bin/dsds-local.js`
- `tools/dsds-local/test/gum.test.js`
- `tools/dsds-local/README.md`

**Out of scope**

- Installing Gum, model management, changes to retrieval/model logic
- Persisting user preferences
- A full-screen TUI, web UI, or desktop app

## Git workflow

- Suggested branch: `local-context/005-gum-workflow`
- Commit message: `feat: add optional Gum context workflow`
- Do not push unless instructed.

## Steps

### Step 1: Define detection and fallback

Implement `interactive` and make no-argument execution equivalent. Detect Gum
with `command -v gum`. If absent, print the exact equivalent non-interactive
command shape and installation reference, then exit `2`; never attempt install.

**Verify**: Gum tests with restricted PATH exit 2 and contain
`context "<task>" --source`.

### Step 2: Implement the guided flow

The shell adapter uses Gum to:

1. select a DSDS file or enter a directory;
2. collect the task with `gum write`;
3. choose Markdown or JSON;
4. choose model or deterministic mode;
5. preview via `gum pager`;
6. select an output path and confirm overwrite.

Pass values as separate arguments to the Node CLI. Never build a command string
for `eval`; never interpolate user input into shell code. Use a temporary file
created with `mktemp` and a cleanup trap.

**Verify**: a test Gum shim records argv and proves spaces, quotes, dollar
signs, and semicolons remain literal data.

### Step 3: Document both paths

Document prerequisites, interactive flow, non-interactive equivalents, exit
codes, model selection, and the fact that Gum is optional.

**Verify**: README examples use existing flags and the non-interactive smoke
command exits 0.

## Test plan

Use executable shims in a temporary PATH for `gum` and the Node CLI. Cover Gum
missing, cancel at each prompt, special characters, output preview, overwrite
decline/accept, temp-file cleanup, and propagation of CLI exit codes.

## Done criteria

- [ ] Core commands work without Gum.
- [ ] No user value is evaluated as shell code.
- [ ] Cancellation never writes an output file.
- [ ] Existing output requires explicit confirmation.
- [ ] `npm run test:local` passes without real Gum or Ollama.
- [ ] The interactive smoke flow works with installed Gum.
- [ ] Plan 005 is marked `DONE`.

## STOP conditions

- The flow requires parsing human-styled output instead of JSON.
- A desired Gum feature requires `eval`, unquoted expansion, or command
  substitution of user-controlled text.
- Plans 003/004 CLI flags are unstable.

## Maintenance notes

Treat the non-interactive CLI as canonical. When flags change, update the Gum
adapter and its argv tests together. Review shell quoting and cleanup on every
change.
