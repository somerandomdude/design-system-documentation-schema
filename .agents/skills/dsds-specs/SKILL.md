---
name: dsds-specs
description: Everything about Design System Doc Spec (DSDS) — entry kinds, sections, schema structure, and how it fits into the ecosystem. Use when authoring, reviewing, or reasoning about DSDS specs and `*.dsds.yaml` files.
metadata:
  version: 0.21.2
---

# Design System Doc Spec (DSDS)

[DSDS](https://designsystemdocspec.org/) is a machine-readable YAML format for documenting design systems. DSDS specs are the **single source of truth** — everything else (React components, Figma, docs, AI catalogs) derives from them.

DSDS documents a graph of **entries** (a system, a component, a token, a theme, or the generic `entry` kind for anything else), each carrying typed **sections** (`definitions`, `guidelines`, `steps`, or the generic `section`). It never duplicates data a better source of truth already owns — a component's `sourceFiles` points at the real code instead of hand-typing its props; a token's `source` points at the real DTCG value instead of restating it.

## Schema Sources

When you need precise field-level details beyond this skill, consult these in order:

1. **Bundled schema**: `https://designsystemdocspec.org/v0.21.2/dsds.bundled.schema.json` (or `node_modules/design-system-documentation-schema/schema/dsds.bundled.schema.json` if installed as a dependency)
2. **Schema architecture reference**: https://designsystemdocspec.org/schema#how-the-schema-is-organized (and [Conformance](https://designsystemdocspec.org/conformance) for conformance classes and the full rule catalog)
3. **Quick start with examples**: https://designsystemdocspec.org/quickstart
   — and the [style guide](https://designsystemdocspec.org/style-guide)
   for the field order every example follows. The schema permits any order;
   the style guide picks one. It is a convention, not a constraint — the
   `DSDS-17`–`DSDS-23` rules that report deviations are advisory warnings
   from `npx dsds-lint`, never a validation failure.
4. **GitHub source** (split schema + examples): https://github.com/somerandomdude/design-system-documentation-schema/tree/main/schema

Key pages for field-level detail:

Each definition has its own small markdown mirror under `/schema/` — a few KB of field names,
types, requiredness and descriptions for that one shape, in the order the schema declares them.
Fetch one of these rather than the whole bundle when you need a single shape.

- Entry kinds: https://designsystemdocspec.org/schema/entries-component.md, and the same path for
  `entries-token`, `entries-theme`, `entries-system`, `entries-entry`
- Section kinds: https://designsystemdocspec.org/schema/sections-guidelines.md, and the same for
  `sections-definitions`, `sections-steps`, `sections-section`
- Shared building blocks: https://designsystemdocspec.org/schema/common-ref.md (the one pointer
  type), and the same for `common-combo`, `common-example`

The Schema page carries the same content for a human reader, one anchor per definition — for
example [/schema#entries-component](https://designsystemdocspec.org/schema#entries-component).

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
kind: component
id: checkbox
name: Checkbox
description: A styled checkbox input for boolean or indeterminate selection.
```

A **base document** (the root `index.dsds.yaml`, or any file meant to hold more than one entry) requires `schemaVersion`, `name`, and a non-empty `entries` array. System-wide facts live on that list's own `kind: system` entry:

```yaml
schemaVersion: "0.21.2"
name: Acme Design System

entries:
  - kind: system
    id: acme-design-system
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

Splitting a system across many files uses `refs` (`rel: file`) pointing at sibling documents — not a `$ref`/JSON-Pointer include. There's also `scripts/tools/compose.js` upstream, for concatenating many hand-authored fragment files into one document before validation.

## Sections

Every entry's structured docs live in one `sections` array. Each section has a `kind` and a `for` (`human`, `agent`, or `all`, naming its audience):

- **`definitions`** — term/definition pairs. Use for anatomy, naming conventions, or a prop/event list when there's no real source file to extract from.
- **`guidelines`** — a `statement` paired with a `level` (`must`/`should`/`may`/`should-not`/`must-not`). Carries `framing: when-to-use` (a fit judgment) or `how-to-use` (the default, an implementation rule).
- **`steps`** — an ordered procedure or unordered checklist.
- **`section`** (generic) — for anything else, or purely `freeform` narrative prose.

Every section kind can also carry `freeform`: headed, nestable prose alongside its own structured `items`.

Two optional fields on any section kind make it findable without matching on a human-written `title`:

- **`context`** — the job the section is doing: `anatomy`, `terms`, `keyboard`, `events`, or a namespaced custom value. Set it whenever the section has one of those jobs, so a tool can find "the anatomy table" by field rather than by heading text.
- **`tags`** — what the whole section is about (`[accessibility]`). The first tag is the primary one. A tag-scoped section sorts after the broader sections covering the same entry.

A `guidelines` item that claims `checkedBy: automated` must point `checks` at what actually runs the check — `rel: test` (the design system's own code), `rel: lint-rule` (static analysis), or `rel: agent-test` (a fixture that runs an AI agent against the guideline and grades what it generates). An `agent-test` usually reports a pass rate or a judged rubric rather than a strict pass/fail, so pair it with `checkedBy: assisted` unless its assertion really is deterministic.

## A Component's Own Fields

Not sections — facts about the component as a build artifact:

- **`sourceFiles`** — one entry per platform, pointing a tool at the real file to extract the API from (`Button.tsx`). Prefer this over hand-typing props in a `definitions` section.
- **`specs`** — the already-generated contract document, one step later in the same pipeline (a Custom Elements Manifest, a DS Contracts document, your own format), with `rel: contract`. DSDS points at it and never parses it, so any standard format works.
- **`imports`** — one entry per platform: install package + import statement.
- **`traits`** — every variant and state the component has. Each one declares `traitType: variant` (a dimension the caller configures, like `size`) or `traitType: state` (a condition the component can be in, like `hover`). Separately, `kind` says whether its value is a `boolean` toggle or an `enum` with named `values` — either `traitType` can be either `kind`. A trait's `id` mirrors the real prop or attribute name, so `isDisabled` stays as written.
- **`combos`** — pairing rules between traits, tokens, or entries (e.g. "loading and disabled must not both be set"). A combo addresses an enum value as `traitId.valueId`, which is why a dot is the one character a trait `id` can't contain.

## Agent-Only Sections

Mark a section `for: agent` for firm, ready-to-act notes a person wouldn't need — hard MUST/MUST NOT rules, notes that keep an agent from confusing this entry with a similar one, checks an agent can run against its own output. Tools never surface these to people. It must extend the human-facing sections on the same entry, never contradict or repeat them.

## Schema Validation

The bundled schema is published at `https://designsystemdocspec.org/v0.21.2/dsds.bundled.schema.json`, using JSON Schema draft 2020-12. Validate with:

```bash
npx dsds-validate <files-or-globs>   # is this document allowed?
npx dsds-lint <files-or-globs>       # is this documentation good? (advisory)
```

See the `dsds-validate` skill for the full rule catalog (`DSDS-01`–`DSDS-23`) and how to interpret failures.

## Deep-Dive References

Fetch these pages when authoring specific pieces:

| Topic | Reference |
| --- | --- |
| Component (sourceFiles, imports, traits, combos) | https://designsystemdocspec.org/schema/entries-component.md |
| Token | https://designsystemdocspec.org/schema/entries-token.md |
| Theme | https://designsystemdocspec.org/schema/entries-theme.md |
| System | https://designsystemdocspec.org/schema/entries-system.md |
| Definitions section | https://designsystemdocspec.org/schema/sections-definitions.md |
| Guidelines section | https://designsystemdocspec.org/schema/sections-guidelines.md |
| Steps section | https://designsystemdocspec.org/schema/sections-steps.md |
| The one pointer type | https://designsystemdocspec.org/schema/common-ref.md |
| Metadata | https://designsystemdocspec.org/schema/metadata-entry-metadata.md |

## Gotchas

- A standalone entry file has no `entity`/`entityGroups` wrapper — `id`/`kind`/`name`/`description` sit at the top level directly. A base document requires `schemaVersion`, `name`, and a non-empty `entries` array.
- `id` must match the filename without `.dsds.yaml` (e.g. `checkbox` → `checkbox.dsds.yaml`).
- Three id shapes, and they are not interchangeable: an **entry id** is lowercase dash-separated segments, optionally dot-chained (`color.action.primary`); a **trait id or enum value** copies a real API name in whatever case that API uses, no dots (`isDisabled`); a **token id** is the same but may also chain with a dot or a slash, so a Figma variable named `Color/Action/Primary` validates as written.
- Requirement levels: `must`, `should`, `should-not`, `must-not`, `may` (lowercase, hyphenated — RFC 2119).
- `metadata.status` is always an object: `{status: "stable"}`, optionally scoped with `platform`, `since`, `deprecationNotice`, `note`. There's no bare-string shorthand.
- All pointers — dependencies, composition, citations, external links — use one type: `common/ref` (`to` for this document's own graph, `href` for outside it, plus a `rel`). There's no separate "relationship" or "link" type.
