---
name: dsds-validate
description: Validate DSDS specs against the bundled schema and check for consistency issues. Triggers on "validate specs", "check specs", "spec errors", "run validation".
metadata:
  version: 0.20.0
---

# Validate DSDS Specs

Run schema and semantic validation on spec files in `packages/specs/`.

## Quick Command

```bash
npm run validate -w packages/specs
```

This validates every `*.dsds.yaml` file against the DSDS v0.20.0 bundled schema using Ajv2020, plus a set of semantic rules JSON Schema alone can't express (the `DSDS-01`–`DSDS-07` catalog — resolution, uniqueness, platform vocabulary, and `composes`/`depends-on` cycles).

## Full Validation (with tests)

```bash
npm test -w packages/specs
```

Checks:

1. Schema compliance (every file validates against `schema/dsds.bundled.schema.json`)
2. Filename/id consistency (`id` matches the filename)
3. Semantic rules (`DSDS-01`–`DSDS-07`)

## Interpreting Failures

| Error pattern | Fix |
| --- | --- |
| `must have required property 'id'/'kind'/'name'/'description'` | Every entry needs all four — add the missing field |
| `must have required property 'entries'` | A base document (has `schemaVersion`) needs a non-empty `entries` array |
| `must match pattern` (on `id`) | Use lowercase, dash-separated segments, optionally dot-chained (e.g. `color.action.primary`) |
| `[DSDS-04] id "..." is declared more than once` | Two entries (or an entry and a `shared` item) share an `id` — rename one |
| `[DSDS-05] ... targets unknown entry/shared / unknown item` | A ref's `to: "entryId#itemId"` doesn't resolve — check the target `id` and item `id` both exist |
| `[DSDS-06]`/`[DSDS-07]` cycle | A `composes` or `depends-on` ref chain loops back on itself — break the cycle |
| Id/filename mismatch | Rename the entry's `id` to match the filename (without `.dsds.yaml`) |

## Validation Loop

1. Run `npm run validate -w packages/specs`
2. If errors, fix the first reported file
3. Re-run validation
4. Repeat until all pass

## Schema Sources

The validation schema comes from the [DSDS project](https://github.com/somerandomdude/design-system-documentation-schema):

- **Bundled schema** (used by `npm run validate`): `packages/specs/schema/dsds.bundled.schema.json`
- This is a single-file version with every schema file's own `$id` still present, so `$ref`s resolve without needing to be inlined

If validation fails on a field you're unsure about, consult the relevant docs page:

- https://designsystemdocspec.org/schema.html#how-the-schema-is-organized (how the schema is organized)
- https://github.com/somerandomdude/design-system-documentation-schema#conformance (full rule catalog and conformance classes)
- `https://designsystemdocspec.org/sections-{kind}` (per-section constraints)
- `https://designsystemdocspec.org/entries-{kind}` (per-entry constraints)

## When to Validate

- After creating or modifying any `.dsds.yaml` file
- Before committing changes
