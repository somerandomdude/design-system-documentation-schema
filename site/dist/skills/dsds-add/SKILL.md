---
name: dsds-add
description: Author a new Design System Doc Spec (DSDS) spec from component implementation, Figma design, or written requirements. Triggers on "add spec", "create spec", "new spec", "author spec", "spec from component", "spec from Figma".
metadata:
  version: 0.20.0
---

# Add a DSDS Spec

Create a new standalone `.dsds.yaml` entry file in your project's spec directory (see File Placement below for where a given kind lives).

## Procedure

1. Determine entry kind: `component`, `token`, `theme`, or the generic `entry` kind (for a foundation, pattern, guide, or anything else — use a namespaced custom kind like `acme.icon-library` instead if the document wants its own recognizable name).
2. Gather inputs — read the source (component source code, Figma frame, requirements doc).
3. Create `{directory}/{id}.dsds.yaml` using the template below.
4. Add a `refs` entry (`rel: file`) in `index.dsds.yaml` pointing at the new file.
5. Run `npx dsds-validate {directory}/{id}.dsds.yaml` — fix errors until it passes.
6. If your project generates its own index or catalog from spec files, regenerate it now.

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
id: <filename-without-extension>
kind: component
name: <PascalCase>
description: <one-sentence summary>

metadata:
  status: {status: draft}
  since: <version>
  tags: [<action|feedback|form|disclosure|overlay|navigation|layout>]

sourceFiles:
  - platform: <react|web-component|...>
    file: <path to the real source file>

imports:
  - platform: <react|web-component|...>
    code: <import statement, written out>
    package: <package name>

sections:
  - kind: guidelines
    for: all
    context: how-to-use
    items: []
```

## Sections to Include (Components)

Include at minimum: a `guidelines` section (`context: how-to-use`) covering usage rules and accessibility requirements. Add `traits` (top-level, not a section) for variants/states, a `guidelines` section with `context: when-to-use` for fit judgments, and a `definitions` section for props/anatomy only when there's no real source file to point `sourceFiles` at instead. Add a `for: agent` section for firm rules an agent needs but a person wouldn't.

## Extraction Guidelines

- **From code**: Point `sourceFiles` at the real file instead of hand-typing props — that's the whole point of the field. Map variant/state props → `traits` (`kind: enum` or `kind: boolean`). Map CSS parts or named sub-elements → a `definitions` section titled "Anatomy".
- **From Figma**: Map component properties → `traits`, layer structure → a `definitions` section, variable bindings → token `refs`.
- **From requirements**: Map acceptance criteria → `guidelines` items (`level` from RFC 2119: `must`/`should`/`should-not`/`must-not`/`may`), interaction requirements → a `definitions` section titled "Keyboard interactions" (term = key, definition = action).

## Schema References

When unsure about field shapes or required properties, consult:

- **Bundled schema**: `https://designsystemdocspec.org/v0.20.0/dsds.bundled.schema.json` (or `node_modules/design-system-documentation-schema/schema/dsds.bundled.schema.json` if DSDS is installed as a dependency)
- **Entry docs**: `https://designsystemdocspec.org/entries-{kind}` (e.g. `/entries-component`)
- **Section docs**: `https://designsystemdocspec.org/sections-{kind}` (e.g. `/sections-guidelines`)
- **Quick start examples**: https://designsystemdocspec.org/quickstart

## Gotchas

- `id` must match the filename (e.g. `checkbox` → `checkbox.dsds.yaml`).
- A component's `sourceFiles`, `imports`, `traits`, and `combos` are top-level fields on the entry, never inside a section.
- Use RFC 2119 levels in guidelines: `must`, `should`, `should-not`, `must-not`, `may`.
- `metadata.status` is always an object (`{status: "draft"}`), never a bare string.
