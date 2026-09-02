---
name: dsds-validate
description: Validate DSDS specs against the bundled schema and check for consistency issues. Triggers on "validate specs", "check specs", "spec errors", "run validation".
metadata:
  version: 0.20.0
---

# Validate DSDS Specs

Run schema and semantic validation on your `.dsds.yaml` spec files.

## Quick Command

```bash
npx dsds-validate <files-or-globs>
```

This validates every file given against the DSDS v0.20.0 bundled schema using Ajv2020, plus a set of semantic rules JSON Schema alone can't express — the `DSDS-01`–`DSDS-11` catalog (resolution, uniqueness, platform vocabulary, `composes`/`depends-on` cycles, and file-existence checks), each tagged `structural` or `semantic`. Pass `--strict` to promote the warning-only rules (`DSDS-05`, `DSDS-08`, `DSDS-09`, `DSDS-11`) to hard failures.

## Documentation-Quality Checks (advisory)

A second, separate tier (`DSDS-12`–`DSDS-15`) that answers "is this documentation good?" rather than "is this document allowed?" — RFC 2119 keyword casing, a token description that just restates its id, a hard-requirement guideline with no `checkedBy`, a component with no `when-to-use` guidance. Warnings only; never blocks a build on their own. Not part of the published `dsds-validate` package — it runs from a clone of the DSDS repo itself: `node scripts/lint-docs.js <files-or-globs>`.

## Full Validation

1. Schema compliance (every file validates against the bundled schema)
2. Semantic rules (`DSDS-01`–`DSDS-11`, via `npx dsds-validate`)
3. Documentation-quality advisories (`DSDS-12`–`DSDS-15`, informational, repo-only — see above)

## Interpreting Failures

| Error pattern | Fix |
| --- | --- |
| `must have required property 'id'/'kind'/'name'/'description'` | Every entry needs all four — add the missing field |
| `must have required property 'entries'` | A base document (has `schemaVersion`) needs a non-empty `entries` array |
| `must match pattern` (on `id`) | Use lowercase, dash-separated segments, optionally dot-chained (e.g. `color.action.primary`) |
| `[DSDS-04] id "..." is declared more than once` | Two entries (or an entry and a `shared` item) share an `id` — rename one |
| `[DSDS-05] ... targets unknown entry/shared / unknown item` | A ref's `to: "entryId#itemId"` doesn't resolve — check the target `id` and item `id` both exist |
| `[DSDS-06]`/`[DSDS-07]` cycle | A `composes` or `depends-on` ref chain loops back on itself — break the cycle |
| `[DSDS-11] ... doesn't exist on disk` | A relative `sourceFiles[].file`, `source`, or `rel: file` `href` doesn't resolve — warning-only unless run with `--strict` |
| Id doesn't match filename | Not validator-enforced, but a convention worth following anyway (e.g. `checkbox` → `checkbox.dsds.yaml`) — makes a spec discoverable by id alone |

## Validation Loop

1. Run `npx dsds-validate <files-or-globs>`
2. If errors, fix the first reported file
3. Re-run validation
4. Repeat until all pass

## Schema Sources

The validation schema comes from the [DSDS project](https://github.com/somerandomdude/design-system-documentation-schema):

- **Bundled schema** (used by `dsds-validate`): `https://designsystemdocspec.org/v0.20.0/dsds.bundled.schema.json`, or `node_modules/design-system-documentation-schema/schema/dsds.bundled.schema.json` if installed as a dependency
- This is a single-file version with every schema file's own `$id` still present, so `$ref`s resolve without needing to be inlined

If validation fails on a field you're unsure about, consult the relevant docs page:

- https://designsystemdocspec.org/schema#how-the-schema-is-organized (how the schema is organized)
- https://designsystemdocspec.org/conformance (full rule catalog and conformance classes)
- `https://designsystemdocspec.org/sections-{kind}` (per-section constraints)
- `https://designsystemdocspec.org/entries-{kind}` (per-entry constraints)

## When to Validate

- After creating or modifying any `.dsds.yaml` file
- Before committing changes
