# Plan 003: Generate deterministic agent context packages

> **Executor instructions**: Implement the retrieval-only baseline in this
> plan. Do not add an LLM call. Run every verification gate and update Plan 003
> in `plans/README.md` when done.
>
> **Drift check (run first)**:
> `git diff --stat 1964319..HEAD -- docs/prd-local-context-cli.md tools/dsds-local spec/examples/site-kit.dsds.json`
> If Plans 001 or 002 are not complete, stop.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED — defines the primary output contract and ranking behavior
- **Depends on**: Plans 001 and 002
- **Category**: direction / architecture
- **Planned at**: commit `1964319`, 2026-07-22
- **PRD story**: Story 1, “Generate an agent context package”

## Why this matters

The model should improve synthesis, not own factual discovery. A deterministic
context-package baseline makes source selection, citations, implementation
targets, and missing guidance testable before Ollama is introduced.

## Current state

- `docs/prd-local-context-cli.md:58-69` defines Story 1 acceptance criteria.
- `docs/prd-local-context-cli.md:215-240` defines the minimum package contract,
  including `implementationTargets` and evidence.
- Plan 001 supplies validated documents and deterministic source ordering.
- Plan 002 supplies `spec/examples/site-kit.dsds.json` and its implementation
  extension.
- DSDS entities expose `documentBlocks`, `agentDocumentBlocks`, metadata tags,
  and relationships; `site/content/humans-and-agents.mdx` states agents read
  both block arrays.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Existing validation | `npm run validate` | exit 0 |
| Local tests | `npm run test:local` | exit 0 |
| JSON smoke test | `npm run dsds-local -- context "Build a schema reference page with a warning" --source spec/examples/site-kit.dsds.json --format json` | valid package on stdout |
| Markdown smoke test | same command with `--format markdown` | headings for recommendations, evidence, uncertainties, and missing guidance |

## Scope

**In scope**

- `tools/dsds-local/schema/context-package.schema.json`
- `tools/dsds-local/src/entities.js`
- `tools/dsds-local/src/tokenize.js`
- `tools/dsds-local/src/retrieve.js`
- `tools/dsds-local/src/context-package.js`
- `tools/dsds-local/src/export-json.js`
- `tools/dsds-local/src/export-markdown.js`
- `tools/dsds-local/src/cli-context.js`
- `tools/dsds-local/bin/dsds-local.js`
- `tools/dsds-local/test/context-package.test.js`
- `tools/dsds-local/test/retrieve.test.js`
- `tools/dsds-local/test/export.test.js`
- `tools/dsds-local/test/cli-context.test.js`

**Out of scope**

- Ollama, prompts, retries, Gum, embeddings, SQLite, repository-wide code review
- Applying generated code or editing DSDS input
- More than one relationship hop

## Git workflow

- Suggested branch: `local-context/003-context-package`
- Commit by logical unit: schema/extraction, retrieval, exporters/CLI.
- Do not push unless instructed.

## Steps

### Step 1: Define and validate context-package schema version 1

Require:

- `schemaVersion: "1"`
- status enum: `supported`, `partially_supported`, `insufficient_evidence`
- task, summary, recommendations, constraints
- implementation targets with platform, elements, entrypoint, and source
- evidence with source, entity identifier/kind, block array, block index/kind
- uncertainties and missing guidance

Disallow unknown top-level properties. Export a validator returning structured
errors. Empty recommendation/evidence arrays are valid only for
`insufficient_evidence`.

**Verify**: `npm run test:local -- --test-name-pattern=context-package` → valid
fixtures pass; missing/unknown fields and inconsistent statuses fail.

### Step 2: Normalize entities and searchable evidence

Flatten single entities, entity groups, and nested token-group entities into a
stable array. Preserve source path and JSON pointers. Index both
`documentBlocks` and `agentDocumentBlocks`; never merge away which array a block
came from. Extract the Site Kit extension into normalized implementation
targets.

**Verify**: `npm run test:local -- --test-name-pattern=entities` → stable order,
unique identifiers, pointers, both block arrays, and Site Kit targets.

### Step 3: Implement explainable lexical retrieval

Lowercase and tokenize words plus kebab-case segments. Remove a small,
hard-coded stop-word set. Score exact identifier `+8`, name `+6`, metadata tag
`+5`, description `+3`, block text `+2`, and implementation tag `+8`. Return
the top five entities with a score breakdown. Expand direct relationships one
hop after ranking; expanded entities retain reason `relationship` and never
displace a direct top result.

Store scoring constants in one exported object. Do not add dependencies.

**Verify**: `npm run test:local -- --test-name-pattern=retrieve` → the warning
page task ranks `ds-callout`, code tasks rank `ds-code`, property-table tasks
rank `ds-prop-table`, unsupported tasks return no result above threshold, and
score breakdowns are stable.

### Step 4: Build the deterministic package

Create a concise package from ranked evidence. Set:

- `supported` when at least one direct result exceeds the documented threshold
  and required implementation guidance is present
- `partially_supported` when evidence exists but one requested capability is
  absent
- `insufficient_evidence` when no result exceeds the threshold

Recommendations must quote or closely summarize evidence and cite its exact
block pointer. Implementation targets come only from documented extensions.

**Verify**: package unit tests cover all three statuses and reject invented
elements.

### Step 5: Add JSON and Markdown CLI output

Implement:

```text
dsds-local context "<task>" --source <path> --format json|markdown [--output <path>]
```

Default format is Markdown for a terminal and JSON when stdout is not a TTY.
If `--output` exists, refuse overwrite unless `--force`. Keep diagnostics on
stderr. JSON is byte-stable for unchanged input.

**Verify**: `npm run test:local` and both smoke commands pass.

## Test plan

Use the Site Kit corpus plus compact inline fixtures. Cover query ranking,
relationship expansion, agent-only blocks, status decisions, citation
pointers, target extraction, no-result behavior, output stability, overwrite
protection, stdout/stderr, and exit codes.

## Done criteria

- [ ] `npm run validate` and `npm run test:local` exit 0.
- [ ] The CLI emits schema-valid JSON and readable Markdown.
- [ ] Every recommendation resolves to an indexed evidence pointer.
- [ ] Implementation targets come only from documented source data.
- [ ] Unsupported tasks produce `insufficient_evidence`.
- [ ] No model/runtime dependency exists yet.
- [ ] Plan 003 is marked `DONE`.

## STOP conditions

- Plans 001 or 002 are incomplete.
- DSDS permits duplicate identifiers in a scope the normalizer cannot
  disambiguate with source and pointer.
- A useful implementation target requires parsing arbitrary code.
- A ranking requirement cannot be expressed with deterministic fixtures.

## Maintenance notes

Treat schema version 1 and scoring constants as reviewable public contracts.
Plan 004 must consume this baseline rather than reimplement retrieval. Keep the
retrieval-only path permanently available for evaluation and debugging.
