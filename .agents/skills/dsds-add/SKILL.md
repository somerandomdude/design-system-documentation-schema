---
name: dsds-add
description: Author a new Design System Doc Spec (DSDS) spec from component implementation, Figma design, or written requirements. Triggers on "add spec", "create spec", "new spec", "author spec", "spec from component", "spec from Figma".
metadata:
  version: 0.23.1
---

# Add a DSDS Spec

Create a new standalone `.dsds.yaml` entry file in your project's documentation directory (see File Placement below for where a given kind lives).

## Procedure

1. Determine entry kind: `component`, `token`, `theme`, or the generic `entry` kind (for a foundation, pattern, guide, or anything else — use a namespaced custom kind like `acme.icon-library` instead if the document wants its own recognizable name).
2. Gather inputs — read the source (component source code, Figma frame, requirements doc).
3. Create `{directory}/{id}.dsds.yaml` using the template below.
4. Add a `refs` entry (`rel: file`) in `index.dsds.yaml` pointing at the new file.
5. Run `npx dsds-validate {directory}/{id}.dsds.yaml` — fix errors until it passes. Run `npx dsds-lint {directory}/{id}.dsds.yaml` for advisory documentation-quality warnings.
6. Keep the template's field order. It follows [the style guide](https://designsystemdocspec.org/style-guide), which asks you to write an entry's fields in the order the schema files list them — so the guide and the schema are the only two places that order lives, and this skill doesn't keep a third copy. Order never affects validity: `npx dsds-validate` won't mention it. Run `npx dsds-format` on the new file before you finish; it puts every field in place and changes nothing else.
7. If your project generates its own index or catalog from these documents, regenerate it now.

## File Placement

| Kind | Directory |
| --- | --- |
| `component` | `components/` |
| `token` | `tokens/` |
| `theme` | `themes/` |
| `entry` (foundation) | `foundations/` |
| `entry` (pattern) | `patterns/` |
| `entry` (guide) | `guides/` |

## Template (Component)

```yaml
kind: component
id: <filename-without-extension>
name: <PascalCase>
description: <one-sentence summary>

metadata:
  tags: [<action|feedback|form|disclosure|overlay|navigation|layout>]
  since: <version>
  status: {status: draft}

sections:
  - kind: guidelines
    for: all
    framing: when-to-use
    items:
      - level: should
        statement: <when this component is the right choice>
  - kind: guidelines
    for: all
    items:
      - level: must
        statement: <a rule for using it correctly>
        checkedBy: manual

sourceFiles:
  - platform: <react|web-component|...>
    file: <path to the real source file>

imports:
  - platform: <react|web-component|...>
    code: <import statement, written out>
    package: <package name>

traits:
  - traitType: variant
    kind: enum
    id: <the real prop or attribute name>
    description: <what this dimension controls>
    values:
      - id: <value name, as the API spells it>
        description: <what this value is for>
```

## Sections to Include (Components)

Include at minimum: a `guidelines` section (`framing: how-to-use`, the default) covering usage rules and accessibility requirements. Add `traits` (top-level, not a section) for variants/states, a `guidelines` section with `framing: when-to-use` for fit judgments, and a `definitions` section for props/anatomy only when there's no real source file to point `sourceFiles` at instead. Add a `for: agent` section for firm rules an agent needs but a person wouldn't.

When a section has a recognizable job, say so in `context` (`anatomy`, `terms`, `keyboard`, `events`) rather than relying on its `title` — that's the field a tool reads to find the anatomy table. Tag a single-subject section with `tags` (`[accessibility]`) and place it after the broader sections on the same entry.

## Extraction Guidelines

- **From code**: Point `sourceFiles` at the real file instead of hand-typing props — that's the whole point of the field. If your build already generates an API contract (a Custom Elements Manifest, a DS Contracts document), point `specs` at that generated document too, with `rel: contract`. Map variant/state props → `traits`, each tagged `traitType: variant` or `traitType: state`, with `kind: enum` or `kind: boolean` for the form its value takes. Give each trait the real prop or attribute name as its `id`, in whatever case the API uses — `isDisabled` stays `isDisabled`. Map CSS parts or named sub-elements → a `definitions` section with `context: anatomy`.
- **From Figma**: Map component properties → `traits`, layer structure → a `definitions` section with `context: anatomy`, variable bindings → token `refs`. A Figma variable's own name is a valid token `id` as written, slashes and capitals included.
- **From requirements**: Map acceptance criteria → `guidelines` items (`level` from RFC 2119: `must`/`should`/`should-not`/`must-not`/`may`), interaction requirements → a `definitions` section with `context: keyboard` (term = key, definition = action).

When a guideline claims `checkedBy: automated`, `checks` must point at what runs the check, as an `href` with `role: test`, `role: lint-rule`, or `role: agent-test` (a fixture that runs an AI agent against the guideline and grades its output). No `rel` in `uses`, `checks`, `evidence`, `alternatives`, `extends`, `specs` or `replacedBy`: each field says what its pointers are. Prefer `checkedBy: assisted` with an agent eval, whose result is usually a pass rate rather than a strict pass/fail.

## Schema References

When unsure about fields or required properties, consult:

- **Bundled schema**: `https://designsystemdocspec.org/v0.23.1/dsds.bundled.schema.json` (or `node_modules/design-system-documentation-schema/schema/dsds.bundled.schema.json` if DSDS is installed as a dependency)
- **One entry kind's fields**: `/schema/entries-<kind>.md` on this site — a few KB of field
  names, types, requiredness and descriptions for that kind alone, in the order the schema
  declares them. Prefer it over the whole bundle when you need one shape:
  [entries-component.md](https://designsystemdocspec.org/schema/entries-component.md).
- **One section kind's fields**: `/schema/sections-<kind>.md` — for example
  [sections-guidelines.md](https://designsystemdocspec.org/schema/sections-guidelines.md).
- **The same content for a human reader**: one Schema page anchor per definition, such as
  [/schema#entries-component](https://designsystemdocspec.org/schema#entries-component).
- **Quick start examples**: https://designsystemdocspec.org/quickstart

## Gotchas

- `id` must match the filename (e.g. `checkbox` → `checkbox.dsds.yaml`).
- A component's `sourceFiles`, `specs`, `imports`, `traits`, and `combos` are top-level fields on the entry, never inside a section.
- Every trait requires `traitType`. `kind` answers a different question and never substitutes for it. A trait carries no other classification field.
- Use RFC 2119 levels in guidelines: `must`, `should`, `should-not`, `must-not`, `may`.
- `metadata.status` is always an object (`{status: "draft"}`), never a bare string.
- When prose mentions another entry or rule, link it: `<dsds:link>` or `[keep the focus ring visible](dsds:shared-a11y#focus-visible)`, not `` `link` `` in backticks. If the entry depends on what it mentions, add a `uses` pointer as well.
