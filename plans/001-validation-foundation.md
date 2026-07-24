# Plan 001: Establish the CLI and DSDS validation foundation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before continuing. If a STOP condition occurs, stop and
> report it instead of widening scope. When done, update Plan 001 in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1964319..HEAD -- package.json scripts/validate.js spec/schema tools/dsds-local`
> If `package.json`, `scripts/validate.js`, or the bundled schema changed,
> compare the facts below with the live files before proceeding.

## Archive record

**Archived on:** 2026-07-23
**Reason:** The experiment established useful local validation contracts and
tests, but its discovery/validation CLI is superseded for the MVP by the
existing `dsds-tools` CLI and MCP server. Do not add features to
`tools/dsds-local/` as part of the product roadmap. Retain this plan and its
implementation as historical reference until the replacement workflow is
verified in Plan 003.

## Status

- **Current progress**: ARCHIVED EXPERIMENT — 001A (CLI shell, discovery, and
  AJV validation) is complete. The remaining repository post-validation issue
  is not a reason to extend this experimental CLI.
- **Priority**: P1
- **Effort**: M (one focused day or two side-project sessions)
- **Risk**: MED — establishes public CLI and error contracts
- **Depends on**: none
- **Category**: direction / DX
- **Planned at**: commit `1964319`, 2026-07-22
- **PRD story**: Story 5, “Verify source quality before inference”

## Why this matters

Every later feature needs one trusted path for finding, parsing, and validating
DSDS documents. Model output must never hide malformed source input. This plan
creates that foundation without changing the existing spec validator.

## Current state

- `package.json:15-35` defines root scripts; there is no local-context CLI or
  `node:test` command.
- `package.json:53` declares CommonJS.
- `package.json:58-60` already supplies AJV and `ajv-formats`.
- `scripts/validate.js:1-17` documents the current validation command.
- `scripts/validate.js:28-34` resolves the bundled schema and examples.
- `scripts/validate.js:47-55` configures AJV 2020 with all errors and formats.
- `scripts/validate.js` is a command script, not an importable API. Do not
  refactor it in this plan; the new tool may share the same dependencies and
  schema file while maintaining its own small adapter.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm install` | exit 0 |
| Existing suite | `npm run validate` | exit 0; all examples and negative fixtures pass |
| New tests | `npm run test:local` | exit 0; all local-context tests pass |
| Smoke test | `npm run dsds-local -- validate --source spec/examples/starter-kit.dsds.json` | exit 0 and one valid-source summary |

## Scope

**In scope**

- `package.json`
- `tools/dsds-local/bin/dsds-local.js`
- `tools/dsds-local/src/args.js`
- `tools/dsds-local/src/errors.js`
- `tools/dsds-local/src/discover.js`
- `tools/dsds-local/src/validate-dsds.js`
- `tools/dsds-local/test/fixtures/invalid.dsds.json`
- `tools/dsds-local/test/discover.test.js`
- `tools/dsds-local/test/validate-dsds.test.js`
- `tools/dsds-local/test/cli-validate.test.js`

**Out of scope**

- `scripts/validate.js`, schema files, and existing fixtures
- Retrieval, Ollama, Gum, benchmark scoring, and context-package generation
- Editing or migrating user documents
- TypeScript, workspaces, or publishing configuration

## Git workflow

- Suggested branch: `local-context/001-validation-foundation`
- Use conventional commits; the current branch uses messages such as
  `docs: add local DSDS context CLI PRD`.
- Do not push or open a PR unless the operator requests it.

## Steps

### Step 1: Add the CLI and test entry points

Add these root scripts:

- `test:local`: `node --test tools/dsds-local/test/*.test.js`
- `dsds-local`: `node tools/dsds-local/bin/dsds-local.js`

Create an executable CommonJS bin. Implement only:

```text
dsds-local validate --source <file-or-directory> [--json]
```

Unknown commands or missing values exit `2`. Source/validation failures exit
`1`. Success exits `0`. Diagnostics go to stderr; `--json` result data goes to
stdout.

**Verify**: `npm run dsds-local -- --help` → exit 0 and usage containing
`validate --source`.

### Step 2: Implement deterministic source discovery

For an explicit file, accept valid JSON regardless of whether the suffix is
`.json` or `.dsds.json`. For a directory, recurse through regular files ending
in `.dsds.json`, sort absolute paths lexically, and ignore `node_modules`,
`.git`, and symlinks. Reject nonexistent paths and an empty discovery result
with typed errors from `errors.js`.

**Verify**: `npm run test:local -- --test-name-pattern=discover` → exit 0;
tests cover file, nested directory, sorting, empty directory, ignored
directories, and missing path.

### Step 3: Validate without mutating input

Load `spec/schema/dsds.bundled.schema.json`, configure AJV 2020 as the existing
validator does, and validate each discovered document. Return structured
results:

```js
{ valid, source, dsdsVersion, errors: [{ path, keyword, message }] }
```

Catch file-read and JSON-parse failures separately. Do not rewrite files.
Cache the compiled schema for the life of the process.

**Verify**: `npm run test:local -- --test-name-pattern=validate` → exit 0;
valid starter kit passes, invalid fixture fails, malformed JSON is distinct,
and source bytes remain unchanged.

### Step 4: Wire the validate command

Human output lists each source and a final passed/failed count. JSON output is
one object with `command`, `valid`, `sources`, and `summary`. Ensure no ANSI
styling appears in JSON mode.

**Verify**:

- `npm run dsds-local -- validate --source spec/examples/starter-kit.dsds.json --json`
  → valid JSON, exit 0, `valid: true`.
- `npm run dsds-local -- validate --source tools/dsds-local/test/fixtures/invalid.dsds.json`
  → exit 1 with source path and JSON pointer.

## Test plan

Use `node:test`, `node:assert/strict`, and temporary directories created under
the OS temp directory. Spawn the bin for CLI tests rather than importing it.
Cover successful file/directory validation, invalid DSDS, malformed JSON,
missing flags, stable ordering, stdout/stderr separation, and exit codes.

## Done criteria

- [ ] `npm run validate` exits 0.
- [ ] `npm run test:local` exits 0.
- [ ] Valid, invalid, and malformed inputs return the documented exit codes.
- [ ] Directory discovery is deterministic and ignores `.git`/`node_modules`.
- [ ] No source document is modified.
- [ ] `git status --short` lists only in-scope files and `plans/README.md`.
- [ ] Plan 001 is marked `DONE`.

## STOP conditions

- The bundled schema cannot compile with the repository's installed AJV.
- Supporting directories requires following symlinks or reading outside the
  user-selected source root.
- A requirement appears to need changes to DSDS schemas or `scripts/validate.js`.
- Existing `npm run validate` fails before the new tool is added.

## Maintenance notes

Later plans depend on the error classes, discovery ordering, and validation
result shape. Review those as public contracts. If shared validation logic is
eventually extracted, preserve these tests and keep the spec validator's
friendlier error behavior.
