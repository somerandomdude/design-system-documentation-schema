---
name: dsds-specs
description: Everything about Design System Doc Spec (DSDS) — entry kinds, sections, schema structure, and how it fits into the ecosystem. Use when authoring, reviewing, or reasoning about DSDS specs and `*.dsds.yaml` files.
metadata:
  version: 0.20.0
---

# Design System Doc Spec (DSDS)

[DSDS](https://designsystemdocspec.org/) is a machine-readable YAML format for documenting design systems. DSDS specs are the **single source of truth** — everything else (React components, Figma, docs, AI catalogs) derives from them.

DSDS documents a graph of **entries** (a system, a component, a token, a theme, or the generic `entry` kind for anything else), each carrying typed **sections** (`definitions`, `guidelines`, `steps`, or the generic `section`). It never duplicates data a better source of truth already owns — a component's `sourceFiles` points at the real code instead of hand-typing its props; a token's `source` points at the real DTCG value instead of restating it.

## Schema Sources

When you need precise field-level details beyond this skill, consult these in order:

1. **Bundled schema**: `https://designsystemdocspec.org/v0.20.0/dsds.bundled.schema.json` (or `node_modules/design-system-documentation-schema/schema/dsds.bundled.schema.json` if installed as a dependency)
2. **Schema architecture reference**: https://designsystemdocspec.org/schema#how-the-schema-is-organized (and [Conformance](https://designsystemdocspec.org/conformance) for conformance classes and the full rule catalog)
3. **Quick start with examples**: https://designsystemdocspec.org/quickstart
4. **GitHub source** (split schema + examples): https://github.com/somerandomdude/design-system-documentation-schema/tree/main/schema

Key pages for field-level detail:

- Entry docs: https://designsystemdocspec.org/entries-component, `/entries-token`, `/entries-theme`, `/entries-system`, `/entries-entry`
- Section docs: https://designsystemdocspec.org/sections-definitions, `/sections-guidelines`, `/sections-steps`, `/sections-section`
- Shared shapes: https://designsystemdocspec.org/common-ref (the one pointer type), `/common-combo`, `/common-example`

## Entry Kinds

| Kind | Purpose | Suggested directory |
| --- | --- | --- |
| `system` | The design system as a whole — version, organization, url, license, platforms. One per project, usually the root `index.dsds.yaml`. | (root) |
| `component` | A reusable UI element — API (via `sourceFiles`), variants/states (via `traits`), accessibility, usage. | `components/` |
| `token` | A single design token. Points at its real value via `source`; never carries the value itself. | `tokens/` |
| `theme` | A named set of token overrides (dark mode, brand variant). Points at its DTCG source file. | `themes/` |
| `entry` (generic, or a namespaced custom kind like `acme.icon-library`) | Anything else — a foundation, a pattern, a guide. Organize by folder for clarity even though the schema `kind` is uniform. | `foundations/`, `patterns/`, `guides/`, etc. |

There is no `token-group` kind: a group of related tokens is a `metadata.group` fact on the tokens in it, not a separate artifact.

## Document Structure

A **standalone entry** file (most components, tokens, themes) has no wrapper — the entry's own fields sit at the file's top level:

```yaml
id: checkbox
kind: component
name: Checkbox
description: A styled checkbox input for boolean or indeterminate selection.
```

A **base document** (the root `index.dsds.yaml`, or any file meant to hold more than one entry) requires `schemaVersion`, `name`, and a non-empty `entries` array. System-wide facts live on that list's own `kind: system` entry:

```yaml
schemaVersion: "0.20.0"
name: Acme Design System

entries:
  - id: acme-design-system
    kind: system
    name: Acme Design System
    description: Acme's cross-platform design system.
    metadata:
      version: 1.4.0
      platforms: [react, web-component]

refs:
  - href: ./components/checkbox.dsds.yaml
    rel: file
    role: Checkbox component
```

Splitting a system across many files uses `refs` (`rel: file`) pointing at sibling documents — not a `$ref`/JSON-Pointer include. There's also `scripts/compose.js` upstream, for concatenating many hand-authored fragment files into one document before validation.

## Sections

Every entry's structured docs live in one `sections` array. Each section has a `kind` and a `for` (`human`, `agent`, or `all`, naming its audience):

- **`definitions`** — term/definition pairs. Use for anatomy, naming conventions, or a prop/event list when there's no real source file to extract from.
- **`guidelines`** — a `statement` paired with a `level` (`must`/`should`/`should-not`/`must-not`/`may`). Carries `context: when-to-use` (a fit judgment) or `how-to-use` (the default, an implementation rule).
- **`steps`** — an ordered procedure or unordered checklist.
- **`section`** (generic) — for anything else, or purely `freeform` narrative prose.

Every section kind can also carry `freeform`: headed, nestable prose alongside its own structured `items`.

## A Component's Own Fields

Not sections — facts about the component as a build artifact:

- **`sourceFiles`** — one entry per platform, pointing a tool at the real file to extract the API from. Prefer this over hand-typing props in a `definitions` section.
- **`imports`** — one entry per platform: install package + import statement.
- **`traits`** — every variant (`kind: enum`) and state (`kind: boolean`) the component can be in.
- **`combos`** — pairing rules between traits, tokens, or entries (e.g. "loading and disabled must not both be set").

## Agent-Only Sections

Mark a section `for: agent` for firm, ready-to-act notes a person wouldn't need — hard MUST/MUST NOT rules, notes that keep an agent from confusing this entry with a similar one, checks an agent can run against its own output. Tools never surface these to people. It must extend the human-facing sections on the same entry, never contradict or repeat them.

## Schema Validation

The bundled schema is published at `https://designsystemdocspec.org/v0.20.0/dsds.bundled.schema.json`, using JSON Schema draft 2020-12. Validate with:

```bash
npx dsds-validate <files-or-globs>
```

See the `dsds-validate` skill for the full rule catalog (`DSDS-01`–`DSDS-15`) and how to interpret failures.

## Deep-Dive References

Fetch these pages when authoring specific pieces:

| Topic | Reference |
| --- | --- |
| Component (sourceFiles, imports, traits, combos) | https://designsystemdocspec.org/entries-component |
| Token | https://designsystemdocspec.org/entries-token |
| Theme | https://designsystemdocspec.org/entries-theme |
| System | https://designsystemdocspec.org/entries-system |
| Definitions section | https://designsystemdocspec.org/sections-definitions |
| Guidelines section | https://designsystemdocspec.org/sections-guidelines |
| Steps section | https://designsystemdocspec.org/sections-steps |
| The one pointer type | https://designsystemdocspec.org/common-ref |
| Metadata | https://designsystemdocspec.org/metadata-entry-metadata |

## Gotchas

- A standalone entry file has no `entity`/`entityGroups` wrapper — `id`/`kind`/`name`/`description` sit at the top level directly. A base document requires `schemaVersion`, `name`, and a non-empty `entries` array.
- `id` must match the filename without `.dsds.yaml` (e.g. `checkbox` → `checkbox.dsds.yaml`).
- Requirement levels: `must`, `should`, `should-not`, `must-not`, `may` (lowercase, hyphenated — RFC 2119).
- `metadata.status` is always an object: `{status: "stable"}`, optionally scoped with `platform`, `since`, `deprecationNotice`, `note`. There's no bare-string shorthand.
- All pointers — dependencies, composition, citations, external links — use one shape: `common/ref` (`to` for this document's own graph, `href` for outside it, plus a `rel`). There's no separate "relationship" or "link" type.
