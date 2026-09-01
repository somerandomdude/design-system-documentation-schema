# DSDS quick start guide

<ds-guide-section>

## What is DSDS?

DSDS (Design System Doc Spec) is a YAML format for documenting design systems. It puts every piece of docs — components, tokens, themes, and anything else — in a machine-readable shape: a graph of **entries**, each carrying typed **sections**.

Write your documents in YAML — every example on this site, the default `npm run check` sweep, and the tooling all assume it. The schema itself is written in [JSON Schema](https://json-schema.org/) (that's the language the *rules* are written in, a separate thing from the format your *documents* need to be in). Since YAML is a superset of JSON, a JSON document would technically still parse — but nothing in this repo discovers or exercises that path, so don't rely on it.

<ds-callout title="Key idea:">

DSDS documents the *how and why* of your design system — not the token values themselves. It complements the [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) which handles the *what*.

</ds-callout>

### What you get

- **Structured** — every section has a defined shape, no guessing
- **Machine-readable** — tools can parse, generate, validate, and transform it
- **Portable** — not locked to any docs tool or platform
- **Extensible** — add vendor metadata without breaking compatibility
- **Validatable** — the schema catches errors before they reach consumers

</ds-guide-section>

<ds-guide-section>

## Document structure

A DSDS document is a **base**: `schemaVersion`, a `name`, and a list of **entries**.

### The bare minimum

This much is valid YAML, but not a valid document yet — `entries` is required:

<ds-example file="quickstart/01-base-document.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### Adding a system entry

System-wide facts (version, organization, url, license, platforms) live on this list's own `kind: system` entry, not on the base document directly:

<ds-example file="quickstart/02-base-document-described.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### Adding more entries

Any entry — a component, a token, a theme, or the generic `entry` kind — can sit alongside the system entry in the same `entries` array. Here, a system entry plus a component entry:

<ds-example file="quickstart/03-base-document-entries.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### Splitting across files with `refs`

For a larger system, keep each entry in its own file and point at it with `refs` (`rel: file`) instead of inlining everything — pointing at a sibling document that owns another entry:

<ds-example file="quickstart/04-base-document-refs.yaml" slot="example" />

<ds-callout variant="tip" title="Tip:">

Use a multi-file split for large systems where a different team owns each component. Use one file with everything inlined for smaller systems. `scripts/compose.js` can concatenate many hand-authored fragment files into one document before validation — see the repo's own `examples/base/starter-kit-fragments/`.

</ds-callout>

</ds-guide-section>

<ds-guide-section>

## Entry kinds

Every entry has a `kind` field. There are 5 well-known values, plus an open option for anything else.

| Kind | Description |
|------|-------------|
| `system` | The design system as a whole — version, organization, url, license, platforms, plus system-wide documentation. |
| `component` | A reusable UI element — buttons, inputs, modals. Carries its own `sourceFiles`, `imports`, `traits` (variants and states), and `combos`, on top of the fields every entry shares. |
| `token` | A single design token. Carries `tokenType` and a `source` pointer to the real DTCG value — never the value itself. |
| `theme` | A named set of token overrides — dark mode, high-contrast, a brand variant. Points at its own DTCG source file. |
| `entry` | The generic, open kind for anything else — a foundation, a pattern, a guide. Has no fields beyond what every entry shares. |
| *(custom)* | A custom kind like `acme.icon-library`, for a document that wants its own recognizable name instead of the generic `entry`. |

</ds-guide-section>

<ds-guide-section>

### Fields every entry shares

Every entry kind shares one open base: `id`, `kind`, `name`, `description` (required), plus `purpose`, `metadata`, `related`, `extends`, `refs`, `sections`, `$extensions` (optional).

`related`, `extends`, and `refs` are three separate pointer lists, not three names for the same thing — each is scoped to a different kind of connection: `related` for entries that are similar in usage (`rel: alternative-to`, `rel: pairs-with`), `extends` for inheritance (`rel: extends`), and `refs` for anything else, including outside resources (`rel: source`, `rel: storybook`). This entry-level `refs` is the same field name as the base document's `refs` used above to split into files (`rel: file`) — same mechanism, different level, different job.

See [How the schema is organized](schema.html#how-the-schema-is-organized) for how the schema itself is put together.

</ds-guide-section>

<ds-guide-section>

### Status

Status lives in `metadata.status`, always as an object — there's no bare-string shorthand. A component-wide status:

<ds-code language="yaml" slot="example" wrap>
metadata:
  status: {status: stable}
</ds-code>

Scope a status to one platform when a component ships on more than one:

<ds-code language="yaml" slot="example" wrap>
metadata:
  status:
    platform: react
    status: deprecated
    deprecationNotice: Use icon-button instead — this variant never got contrast-tested.
</ds-code>

</ds-guide-section>

<ds-guide-section>

## The section system

Structured docs live in the `sections` array on each entry. Each section has a `kind` field naming its type — `guidelines`, `definitions`, `steps`, or the generic `section`. Any entry kind can use any section kind; nothing restricts which section kinds go with which entry kind.

Every section also carries a `for` field (`human`, `agent`, or `all`) naming its audience — see [Humans and agents on the Overview page](index.html#humans-and-agents).

</ds-guide-section>

<ds-guide-section>

### Guidelines: rules paired with why they exist

Each guideline item pairs a `statement` with a `level` (an RFC 2119 requirement level) and, optionally, `alternatives`, `evidence`, or a `checkedBy`/`checks` verification pair. A component with a guidelines section:

<ds-example file="quickstart/06-button-described.yaml" slot="example" />

The `level` field's values are lowercase kebab-case, like every DSDS vocabulary: `must`, `should`, `should-not`, `must-not`, `may`. Tools display them as badges: <ds-badge>MUST</ds-badge>, <ds-badge>SHOULD</ds-badge>, <ds-badge>SHOULD NOT</ds-badge>, <ds-badge>MUST NOT</ds-badge>. Agents treat `must`/`must-not` items as hard limits.

A `guidelines` section also carries `framing`: `when-to-use` for a fit judgment (is this entry the right choice at all), or `how-to-use` (the default) for an implementation rule once it's chosen.

</ds-guide-section>

<ds-guide-section>

### Definitions: a glossary, anatomy, or prop list

A `definitions` section pairs a `term` with its `definition` — use it for anatomy parts, naming conventions, or a component's own prop/event list when there's no real source file to extract from. `context` (a field every section kind can carry, not just `definitions` — see [sections/section](schema.html#sections-section)) names which of those jobs it's doing (`anatomy`, `terms`, `keyboard`, `events`, or a namespaced custom value) — optional, but it's what lets a tool find "the anatomy table" without matching on the human-facing `title`. Here's an anatomy definitions section:

<ds-code language="yaml" slot="example" wrap>
sections:
  - kind: definitions
    for: all
    title: Anatomy
    context: anatomy
    items:
      - term: Container
        definition: The interactive root element. Receives background, border, radius, and padding.
      - term: Label
        definition: The visible text of the button.
</ds-code>

</ds-guide-section>

<ds-guide-section>

### Steps: a procedure or checklist

A `steps` section is an ordered procedure or an unordered checklist (`ordered: false`). Each item can point back at the guideline it verifies via `checks` (`rel: depends-on`). A self-check checklist:

<ds-code language="yaml" slot="example" wrap>
sections:
  - kind: steps
    for: agent
    ordered: false
    title: Self-check before shipping
    items:
      - title: Icon-only buttons have an aria-label
        checks:
          - to: button#aria-label-required
            rel: depends-on
</ds-code>

</ds-guide-section>

<ds-guide-section>

### Freeform: narrative prose

Every section kind — including the generic `section` — can also carry `freeform`: headed, nestable prose alongside its own structured `items`:

<ds-code language="yaml" slot="example" wrap>
sections:
  - kind: section
    for: all
    title: Overview
    freeform:
      - title: About
        body: Button is the primary interactive primitive in this design system.
</ds-code>

</ds-guide-section>

<ds-guide-section>

## A component's own top-level fields

Unlike sections, a few facts about a component live directly on the entry, not inside a section — they're facts about the component as a build artifact, not documentation content:

- **`sourceFiles`** — one entry per platform, pointing at the real source file a tool can extract the component's API from. Replaces hand-typed prop tables.
- **`imports`** — one entry per platform, with the install package and the exact import statement.
- **`traits`** — every way the component can vary: a `kind: enum` dimension (like `size: sm | md | lg`) or a `kind: boolean` toggle (like `hover` or `loading`). A trait's own optional `setBy` (`consumer` or `component`) says whether it's a value the consumer sets, or a condition the component sets on its own — `kind` alone doesn't tell you that, since a boolean trait can be either (`disabled` is usually a prop the consumer passes in; `hover` never is).
- **`combos`** — pairing rules between traits, tokens, or entries (e.g. "loading and disabled must not both be set").

Here's `sourceFiles`, `traits`, and `combos` together:

<ds-code language="yaml" slot="example" wrap>
sourceFiles:
  - platform: react
    file: ./src/Button.tsx

traits:
  - id: tone
    kind: enum
    name: Tone
    setBy: consumer
    values:
      - id: default
        description: Neutral. General-purpose actions.
      - id: critical
        description: Destructive or irreversible actions only.
  - id: loading
    kind: boolean
    name: Loading
    description: An async operation triggered by the button is in progress.
    setBy: consumer
  - id: hover
    kind: boolean
    name: Hover
    description: Background darkens slightly when the pointer is over the button.
    setBy: component

combos:
  - subject: loading
    level: should-not
    items: [disabled]
    note: Loading already makes the button non-interactive.
</ds-code>

</ds-guide-section>

<ds-guide-section>

## Going beyond the basics

### `$extensions`

`$extensions` is a place for vendor or tool-specific data, at the document, entry, or section level. Keys MUST use a namespace (e.g. `com.figma`) so a tool integration never collides with a future field the spec adds. Here, linking a component to its Figma source:

<ds-example file="quickstart/07-button-custom.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### Custom kinds

When the generic `entry` kind isn't specific enough, use a custom kind instead — it's checked against the same open `entry.schema.yaml` base the generic kind is:

<ds-example file="quickstart/11-custom-entry.yaml" slot="example" />

See [Extending the schema](extending.html) for a third option too — profiles, for making an existing kind's optional fields required on your own project — and for more on when to reach for each of the three.

</ds-guide-section>

<ds-guide-section>

## Minimal examples

These are close to the smallest valid entry for each kind. Copy one, fill in your content, and add `sections` as your docs grow.

### Component

A minimal standalone component entry:

<ds-example file="quickstart/05-button-entry.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### Token

A token needs `id`, `kind`, `name`, `description`, and (usually) `tokenType`. Use `source` to point back at the DTCG file that holds the real value:

<ds-example file="quickstart/08-token-entry.yaml" slot="example" />

A described token adds `metadata.group` (the recommended way to group related tokens — there's no separate token-group kind) and a guideline:

<ds-example file="quickstart/09-token-described.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### A pattern, using the generic entry kind

A pattern, documented as a generic entry:

<ds-example file="quickstart/10-pattern-entry.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

### Shared content

Content that isn't itself a design-system artifact — an accessibility rule that applies to more than one entry, stated once and pointed at from everywhere it applies — lives in the base document's `shared` array, addressed via `entryId#itemId` and `rel: same-as` — a shared rule, referenced instead of restated:

<ds-example file="quickstart/12-shared-sections.yaml" slot="example" />

</ds-guide-section>

<ds-guide-section>

## Validate your document

### Using the bundled schema

Add `$schema` to get editor autocompletion and inline validation:

<ds-code language="yaml" slot="example" wrap>
$schema: https://designsystemdocspec.org/v{{VERSION}}/dsds.bundled.yaml
id: my-component
kind: component
name: My Component
description: What this component is and does.
</ds-code>

</ds-guide-section>

<ds-guide-section>

### Using the CLI

<ds-code language="bash" slot="example" wrap>
# Clone the repo
git clone https://github.com/somerandomdude/design-system-documentation-schema.git
cd design-system-documentation-schema
npm install

# Validate the built-in examples and test corpus
npm run check

# Validate your own file
node scripts/validate.js my-system.dsds.yaml
</ds-code>

</ds-guide-section>

<ds-guide-section>

## Next steps

You've seen the basics. Here's where to go deeper.

| Resource | Description |
|----------|-------------|
| [Full Spec](schema.html) | Complete schema reference for every field and constraint |
| [Schema files](https://github.com/somerandomdude/design-system-documentation-schema/tree/main/schema) | The raw `.schema.yaml` files — use for editor autocompletion |
| [Example files](https://github.com/somerandomdude/design-system-documentation-schema/tree/main/examples) | Complete, valid example documents for every entry and section kind |
| [GitHub Discussions](https://github.com/somerandomdude/design-system-documentation-schema/discussions) | Ask questions, share ideas, propose changes |

<ds-callout variant="tip" title="Getting started recipe:">

1. Copy the [minimal component example](#component) above
2. Replace it with your own design system's first component
3. Add `sections` as your docs grow
4. Validate with `npm run check` to catch schema errors early

</ds-callout>

</ds-guide-section>
