---
name: dsds-validate
description: Validate DSDS specs against the bundled schema and check for consistency issues. Triggers on "validate specs", "check specs", "spec errors", "run validation".
metadata:
  version: 0.23.1
---

# Validate DSDS Specs

Run schema and semantic validation on your `.dsds.yaml` documents.

## Quick Command

```bash
npx dsds-validate <files-or-globs>
```

This validates every file given against the DSDS v0.23.1 bundled schema using Ajv2020, plus a set of semantic rules JSON Schema alone can't express — `DSDS-01`–`DSDS-11`, `DSDS-24` and `DSDS-25` (resolution, uniqueness, platform vocabulary, loops in `uses`/`extends`/`same-as`/`replaced-by` chains, where `same-as` and `replaced-by` may sit, file-existence checks, and unknown fields on a generic `entry` or `section`), each tagged `structural` or `semantic`. Pass `--strict` to promote the warning-only rules (`DSDS-05`, `DSDS-08`, `DSDS-09`, `DSDS-11`, `DSDS-24`) to hard failures.

## Documentation-Quality Checks (advisory)

A second, separate tier (`DSDS-13`–`DSDS-21`) that answers "is this documentation good?" rather than "is this document allowed?" — a token description that just restates its id or its scale position, a hard-requirement guideline with no `checkedBy`, a component with no `when-to-use` guidance, and (`DSDS-18`, `DSDS-19`, `DSDS-21`) whether sections, guideline items and entries follow [the style guide](https://designsystemdocspec.org/style-guide)'s reading order. Warnings only; never blocks a build on their own. Ships in the published package as its own command:

```bash
npx dsds-lint <files-or-globs>
```

## Field Order

Field order isn't linted: `dsds-format` applies it. It puts every object's fields in the style guide's order and groups each entry's combos by subject, moving lines and nothing else.

```bash
npx dsds-format <files-or-folders>          # rewrite in place
npx dsds-format --check <files-or-folders>  # change nothing; exit 1 if a file needs it
```

## Machine-Readable Output

Add `--json` to either command to get one JSON report on stdout instead of text. Each finding has:

- `rule`: the rule id (`DSDS-08`), or `null` for a plain schema error
- `severity`: `error` or `warning` (`dsds-lint` findings are always `warning`)
- `pointer`: a JSON Pointer to the exact spot in the document (`/entries/0/refs/2/to`)
- `message`: what's wrong
- `fix`: how to fix it, or `null` when there's no single obvious fix
- `docs`: the rule's section on the Conformance page

Prefer `--json` when you're fixing findings yourself: the pointer tells you where to edit without parsing the message. `--help` prints the full usage.

## Full Validation

1. Schema compliance (every file validates against the bundled schema)
2. Semantic rules (`DSDS-01`–`DSDS-11`, `DSDS-24` and `DSDS-25`, via `npx dsds-validate`)
3. Documentation-quality advisories (`DSDS-13`–`DSDS-21`, informational, via `npx dsds-lint`)
4. Field order, via `npx dsds-format --check` (`npx dsds-format` fixes it)

## Interpreting Failures

| Error pattern | Fix |
| --- | --- |
| `must have required property 'id'/'kind'/'name'/'description'` | Every entry needs all four — add the missing field |
| `must have required property 'entries'` | A base document (has `schemaVersion`) needs a non-empty `entries` array |
| `must match pattern` (on an entry `id`) | Use lowercase, dash-separated segments, optionally dot-chained (e.g. `color.action.primary`) |
| `must match pattern` (on a trait `id` or enum value) | Copy the real prop/attribute name in whatever case it uses (`isDisabled`) — any case is accepted, but a dot never is, since a combo addresses a value as `traitId.valueId` |
| `must match pattern` (on a token `id`) | Same as a trait id, plus dot or slash chaining — a design tool's own path (`Color/Action/Primary`) is valid as written |
| `must have required property 'traitType'` | Every trait declares `traitType: variant` or `traitType: state` alongside its `kind` |
| `unevaluatedProperty` on a trait | A trait's fields are closed: `traitType`, `kind`, `id`, `name`, `description`, `examples`, `since`, `refs`, and `values` on an enum. A trait carries no `$extensions` of its own — put vendor data on the entry instead |
| `[DSDS-04] id "..." is declared more than once` | Two entries (or an entry and a `shared` item) share an `id` — rename one |
| `[DSDS-05] ... targets unknown entry/shared / unknown item` | A ref's `to: "entryId#itemId"` doesn't resolve — check the target `id` and item `id` both exist |
| `[DSDS-05]`/`[DSDS-08] ... inline link ...` | A `dsds:` link in prose doesn't resolve, or ("isn't shaped like a to") isn't written like a `to`. Fix the part after `dsds:`. `--json` gives the link's `offset` in the field |
| `inline links weren't checked: ...` | The optional Markdown parser isn't available. Run `npm install` (it's an optional dependency) on Node 20.19 or later. Fails `--strict` |
| `[DSDS-24] ... which no DSDS schema declares` | A generic `entry` or `section` has a field the schema doesn't know — usually a typo; the message suggests the closest real field. Warning-only unless run with `--strict` |
| `[DSDS-06]` cycle | A `uses`, `extends`, `same-as` or `replaced-by` chain loops back on itself — break the cycle |
| `[DSDS-25]` | A `same-as` points at a different kind of item, or a `replaced-by` sits on something that isn't deprecated — see [the processing model](https://designsystemdocspec.org/processing) |
| `[DSDS-11] ... doesn't exist on disk` | A relative `sourceFiles[].file`, `source`, or `rel: file`/`rel: source` `href` doesn't resolve — warning-only unless run with `--strict`. For code in another repo, set the system's `metadata.sourceRoot` |
| Id doesn't match filename | Not validator-enforced, but a convention worth following anyway (e.g. `checkbox` → `checkbox.dsds.yaml`) — makes a spec discoverable by id alone |

## Validation Loop

1. Run `npx dsds-validate --json <files-or-globs>`
2. If errors, fix the first reported file, using each finding's `pointer` and `fix`
3. Re-run validation
4. Repeat until all pass

## Schema Sources

The validation schema comes from the [DSDS project](https://github.com/somerandomdude/design-system-documentation-schema):

- **Bundled schema** (used by `dsds-validate`): `https://designsystemdocspec.org/v0.23.1/dsds.bundled.schema.json`, or `node_modules/design-system-documentation-schema/schema/dsds.bundled.schema.json` if installed as a dependency
- This is a single-file version with every schema file's own `$id` still present, so `$ref`s resolve without needing to be inlined

If validation fails on a field you're unsure about, consult the relevant docs page:

- https://designsystemdocspec.org/schema#how-the-schema-is-organized (how the schema is organized)
- https://designsystemdocspec.org/conformance (full rule catalog and conformance classes)
- `/schema/sections-<kind>.md` on this site (per-section constraints) — for example
  [sections-guidelines.md](https://designsystemdocspec.org/schema/sections-guidelines.md)
- `/schema/entries-<kind>.md` (per-entry constraints) — for example
  [entries-component.md](https://designsystemdocspec.org/schema/entries-component.md)

## When to Validate

- After creating or modifying any `.dsds.yaml` file
- Before committing changes
