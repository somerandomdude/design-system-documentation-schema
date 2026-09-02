# Schema

<ds-guide-section>

## How the schema is organized

This spec is built from a small, fixed set of shapes, reused rather than reinvented per file — each definition below documents its own fields directly. See [Conformance in the README](https://github.com/somerandomdude/design-system-documentation-schema#conformance) for how it's all enforced.

Every entry has a `kind` field. There are 5 well-known values, plus an open option for anything else.

| Kind | Description |
|------|-------------|
| `system` | The design system as a whole — version, organization, url, license, platforms, plus system-wide documentation. |
| `component` | A reusable UI element — buttons, inputs, modals. Carries its own `sourceFiles`, `imports`, `traits` (variants and states), and `combos`, on top of the fields every entry shares. |
| `token` | A single design token. Carries `tokenType` and a `source` pointer to the real DTCG value — never the value itself. |
| `theme` | A named set of token overrides — dark mode, high-contrast, a brand variant. Points at its own DTCG source file. |
| `entry` | The generic, open kind for anything else — a foundation, a pattern, a guide. Has no fields beyond what every entry shares. |
| *(custom)* | A custom kind like `acme.icon-library`, for a document that wants its own recognizable name instead of the generic `entry`. |

<ds-code slot="example" center>
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@                                   @@
@@                                   @@
@@    @@@@@@@@@@@     @@@@@@@@@@     @@
@@    @@        @@   @@        @@    @@
@@    @@        @@   @@              @@
@@    @@        @@    @@@@@@@@@@     @@
@@    @@        @@             @@    @@
@@    @@        @@   @@        @@    @@
@@    @@@@@@@@@@@     @@@@@@@@@@     @@
@@                                   @@
@@    @@@@@@@@@@@     @@@@@@@@@@     @@
@@    @@        @@   @@        @@    @@
@@    @@        @@   @@              @@
@@    @@        @@    @@@@@@@@@@     @@
@@    @@        @@             @@    @@
@@    @@        @@   @@        @@    @@
@@    @@@@@@@@@@@     @@@@@@@@@@     @@
@@                                   @@
@@                                   @@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
</ds-code>




</ds-guide-section>
## Base

# Base

A DSDS document. Acts as the container for all content. Can be optionally extended or split across other DSDS documents.

Source: `base.schema.yaml`

## Base {#base}

A DSDS document. Acts as the container for all content. Can be optionally extended or split across other DSDS documents.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `schemaVersion` | string | ✓ | The version of this spec the document follows. |
| `name` | string | ✓ | The name of the design system this document describes. |
| `entries` | [dispatch](schema.md#entries-entry-dispatch)[] | ✓ | Every entry this document owns, listed directly. (Min items: 1) |
| `$schema` | string (uri-reference) |  | An optional hint for editor tools, like autocomplete or validate-on-save. |
| `shared` | [Shared](schema.md#shared)[] |  | Reusable content that is not itself a design system artifact, for example an accessibility rule or a guideline that applies broadly. (Min items: 1) |
| `refs` | [list](schema.md#common-ref-list) |  | The same pointer type entries use. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool-specific document-level data, keyed by namespace. |

**References:** [dispatch](schema.md#entries-entry-dispatch), [Shared](schema.md#shared), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/base.schema.yaml
title: Base
description: >-
  A DSDS document. Acts as the container for all content. Can be optionally extended or split across other DSDS documents.
$comment: >-
  Base only has one document structure. Unlike an entry or a section,
  nothing here varies by kind.
type: object
required: [schemaVersion, name, entries]
properties:
  schemaVersion:
    type: string
    description: The version of this spec the document follows.
    $comment: The one authoritative version marker. Distinct from `metadata.version`, which is the design system's own release version.
    example: "0.20.0"
  $schema:
    type: string
    format: uri-reference
    description: An optional hint for editor tools, like autocomplete or validate-on-save.
    $comment: "Usually a URL to the exact versioned schema file. Not authoritative: `schemaVersion` is the real source of truth for which version this document targets. The published bundle is YAML - most YAML-aware editors (ex: VS Code's YAML extension) resolve a YAML `$schema` target the same way they'd resolve a JSON one; a tool that only ever reads JSON schemas won't."
    example: https://designsystemdocspec.org/v0.20.0/dsds.bundled.yaml
  name:
    type: string
    description: The name of the design system this document describes.
    example: Acme Design System
  entries:
    type: array
    minItems: 1
    description: Every entry this document owns, listed directly.
    $comment: >-
      A single-entry file just has one item here. System-wide facts
      (version, organization, url, license, platforms) live on this
      list's own `kind: system` entry. Reusable content that is not
      a standalong artifact belongs in `shared`.
    items:
      $ref: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml#/$defs/dispatch
  shared:
    type: array
    minItems: 1
    description: Reusable content that is not itself a design system artifact, for example an accessibility rule or a guideline that applies broadly.
    $comment: >-
      Enables multiple artifacts to reference share content from one source. The content is agnostic to entry `kind`. A shared entry is never meant to be
      its own page.
    items:
      $ref: https://designsystemdocspec.org/v0.20.0/shared.schema.yaml
  refs:
    $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
    description: The same pointer type entries use.
    $comment: "Enables pointing at a parent document (rel: extends) and splitting a system across several files (rel: file, pointing at a sibling document that owns other entries in this same system)."
    example:
      - href: ./starter-kit.dsds.yaml
        rel: file
        role: core
  $extensions:
    $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
    description: Escape hatch for tool-specific document-level data, keyed by namespace.
    $comment: Same structure as an entry's own $extensions.
additionalProperties: false
```

# Shared

Reusable content other entries point at instead of restating. Not a design-system artifact in its own right.

Source: `shared.schema.yaml`

## Shared {#shared}

Reusable content other entries point at instead of restating. Not a design-system artifact in its own right.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [Id](schema.md#common-id) | ✓ | This entry's unique id. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this shared entry is for. |
| `metadata` | object |  |  |
| `refs` | [list](schema.md#common-ref-list) |  | Pointers from this entry to other things. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | The reusable content itself, in the same section structure an entry uses. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data or an outside id, the same structure as an entry's own $extensions. |

**References:** [Id](schema.md#common-id), [Metadata](schema.md#metadata-metadata), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/shared.schema.yaml
title: Shared
description: >-
  Reusable content other entries point at instead of restating. Not a
  design-system artifact in its own right.
$comment: >-
  Declares its own structure rather than extending `entry.schema.yaml` via
  `allOf`, even though the fields look similar. A shared item
  deliberately has no `kind`, `purpose`, `extends`, or `related`.
type: object
required: [id, name, description]
properties:
  id:
    $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
    description: This entry's unique id.
    $comment: A ref addresses it by this id, either directly or as the entryId half of an entryId#itemId address.
    example: shared-a11y
  name:
    type: string
    description: The human-readable display name.
    $comment: Kept separate from `id`, which is machine-readable.
    example: Shared accessibility rules
  description:
    type: string
    description: A one-line statement of what this shared entry is for.
    example: Accessibility rules that apply broadly across components.
  metadata:
    allOf:
      - $ref: https://designsystemdocspec.org/v0.20.0/metadata/metadata.schema.yaml
    unevaluatedProperties: false
  refs:
    $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
    description: Pointers from this entry to other things.
    example:
      - href: https://www.w3.org/WAI/WCAG21/quickref/
        rel: external-link
  sections:
    type: array
    minItems: 1
    description: The reusable content itself, in the same section structure an entry uses.
    items:
      $ref: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml#/$defs/dispatch
  $extensions:
    $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
    description: Escape hatch for tool data or an outside id, the same structure as an entry's own $extensions.
additionalProperties: false
```

## Common

# Combo

Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.

Source: `common/combo.schema.yaml`

**2 definitions** in this file: `Combo`, `target`

## Combo {#combo}

Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `subject` | `target` | ✓ | The subject of what elements can or cannot be paired with. Can be a trait, token, or entry id. |
| `items` | `target`[] | ✓ | The elements paired with the subject. (Min items: 1) |
| `level` | [RequirementLevel](schema.md#common-requirement-level) | ✓ | Whether the elements in `items` can or cannot be paired with the subject—and how strict the rule is. |
| `note` | string |  | Why this rule holds. |

**References:** `#/$defs/target`, [RequirementLevel](schema.md#common-requirement-level), [Id](schema.md#common-id)

## target {#target}

A bare id, or a token reference wrapped in braces.

**References:** [Id](schema.md#common-id)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/combo.schema.yaml
title: Combo
type: object
description: Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.
$comment: >-
  A combo is a pairing rule, It lives on the entry the rule is about
  (`subject`), naming what else (`items`) can or cannot be used with
  it, and how strict the rule is (`level`). `subject` and each of
  `items` do not need to be the same type.
required: [subject, items, level]
properties:
  subject:
    $ref: "#/$defs/target"
    description: "The subject of what elements can or cannot be paired with. Can be a trait, token, or entry id."
    example: size.large
  items:
    type: array
    minItems: 1
    uniqueItems: true
    items:
      $ref: "#/$defs/target"
    description: The elements paired with the subject.
    $comment: What `level` says (permitted or forbidden) applies to every entry here.
    example: ["{color.surface.default}", "{color.surface.raised}"]
  level:
    $ref: https://designsystemdocspec.org/v0.20.0/common/requirement-level.schema.yaml
    description: Whether the elements in `items` can or cannot be paired with the subject—and how strict the rule is.
    $comment: >-
      `must`/`should` make `items` allowed. `should-not`/`must-not` make `items`
      denied. `must`/`must-not` make the rule explicit. `should`/`should-not` make it a recommendation.
  note:
    type: string
    description: Why this rule holds.
    $comment: Provides rationale to the rule defined in `subject`/`items`/`level`.
    example: Contrast is verified only against these surfaces; on any other background the label ratio is unproven.
additionalProperties: false
$defs:
  target:
    description: A bare id, or a token reference wrapped in braces.
    anyOf:
      - $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
      - type: string
        pattern: '^\{[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\}$'
        description: A token reference, wrapped in braces.
    example: "{color.action.primary}"
```

# Example

A single example, illustrating something in context.

Source: `common/example.schema.yaml`

**2 definitions** in this file: `Example`, `list`

## Example {#example}

A single example, illustrating something in context.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | at least 1 | A short heading for the example. |
| `description` | string | at least 1 | Describes the example in detail. |
| `showcase` | [Showcase](schema.md#common-showcase) | at least 1 | A visual sample of this example. |
| `ref` | [Ref](schema.md#common-ref) | at least 1 | Where this example lives in code. |

**Constraint:** At least one of `title`, `description`, `showcase`, `ref` must be present.

**References:** [Showcase](schema.md#common-showcase), [Ref](schema.md#common-ref), [Example](schema.md#common-example)

## list {#list}

One or more examples, in order.

**References:** [Example](schema.md#common-example)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/example.schema.yaml
title: Example
type: object
description: A single example, illustrating something in context.
$comment: At least one of `title`, `description`, `showcase`, or `ref` must be given.

properties:
  title:
    type: string
    description: A short heading for the example.
    example: Loading state has an accessible announcement
  description:
    type: string
    description: Describes the example in detail.
    example: Renders with aria-live="polite" so the loading state is announced.
  showcase:
    $ref: https://designsystemdocspec.org/v0.20.0/common/showcase.schema.yaml
    description: A visual sample of this example.
    $comment: This property is used only when a visual example exists. Sometimes the example is only code or a file reference. Use `ref` in those cases.
  ref:
    $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml
    description: Where this example lives in code.
    $comment: "Use `rel: file` for a source file, or `rel: storybook`/`rel: external-link` for a live story."
anyOf:
  - required: [title]
  - required: [description]
  - required: [showcase]
  - required: [ref]
$defs:
  list:
    type: array
    minItems: 1
    description: One or more examples, in order.
    $comment: Every consumer expects an array of examples. Pulled out here so call sites don't have to redefine it.
    items:
      $ref: https://designsystemdocspec.org/v0.20.0/common/example.schema.yaml
```

# Extensions

Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern.

Source: `common/extensions.schema.yaml`

## Extensions {#extensions}

Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern.

Open map — values are `object`.

**References:** [namespaced](schema.md#common-id-namespaced)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
title: Extensions
type: object
description: Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern.
$comment: >-
  By convention, an outside id goes under
  `$extensions.<namespace>.displayName`. Worth noting: nothing enforces that
  specific key. Each top-level key MUST be a dotted namespace, like
  `com.acme`, matching the Design Tokens Community Group's own
  `$extensions` convention. This helps tools avoid unfamiliar data.

  Recommended: add a `context` key under each namespace explaining what
  the extension is for and how a tool should use it.
propertyNames:
  $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml#/$defs/namespaced
additionalProperties:
  type: object
  additionalProperties: true
example:
  com.figma:
    context: Links this entry to its source Figma component for design-file lookups.
    displayName: "Button/Primary"
    nodeId: "12:4045"
```

# Id

Lowercase, dash-separated segments, optionally chained with dots.

Source: `common/id.schema.yaml`

**3 definitions** in this file: `Id`, `tokenId`, `namespaced`

## Id {#id}

Lowercase, dash-separated segments, optionally chained with dots.

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$`

## tokenId {#tokenid}

The same as the base id format, but a segment can also be separated by a slash.

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*([./][a-z0-9]+(-[a-z0-9]+)*)*$`

## namespaced {#namespaced}

A dotted, namespaced custom value. The open extension point alongside a fixed set of well-known values.

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
title: Id
type: string
description: Lowercase, dash-separated segments, optionally chained with dots.
$comment: >-
  An id from an outside tool that doesn't fit this format goes under
  `$extensions.<namespace>.displayName` instead.

  A section item's own `id` is always optional to write, but a consuming tool MUST be able to address every item. An agent citing "why did you do that" needs something to cite, and same-as/refines/checks all point at an item by id. When an item has no `id`, a tool MUST derive one so content has a consistent id. Lowercase the item's own primary text field (a definitions item's `term`, a guidelines item's `statement`, a steps item's or freeform entry's `title`), replace each run of characters outside `[a-z0-9]` with a single dash, then trim any leading or trailing dash. This is the same rule this site's own `<ds-heading>` component already uses for a page's own heading
  anchors - one algorithm, not a new one invented for this.
pattern: '^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$'
example: color.action.primary
$defs:
  tokenId:
    type: string
    description: The same as the base id format, but a segment can also be separated by a slash.
    $comment: Only for token entries. Their id often comes from a design tool that names paths that way.
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*([./][a-z0-9]+(-[a-z0-9]+)*)*$'
    example: color/action/primary
  namespaced:
    type: string
    description: A dotted, namespaced custom value. The open extension point alongside a fixed set of well-known values.
    $comment: Same lowercase-dash-per-segment format as the base id, but requires at least one dot. This is so a custom value can't collide with existing ids.
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$'
    example: acme.icon-library
```

# Markdown

Markdown content, including headings, tables, code fences, etc.

Source: `common/markdown.schema.yaml`

## Markdown {#markdown}

Markdown content, including headings, tables, code fences, etc.

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
title: Markdown
type: string
description: Markdown content, including headings, tables, code fences, etc.
$comment: For a real code sample, prefer pointing a `ref` at a file instead of embedding one here.
example: Use for the single primary call-to-action on a surface.
```

# Ref

The one pointer type. "A points to B, and this is what kind of pointer it is."

Source: `common/ref.schema.yaml`

**2 definitions** in this file: `Ref`, `list`

## Ref {#ref}

The one pointer type. "A points to B, and this is what kind of pointer it is."

One of:

- **string** — Shorthand for an external link that doesn't need added definition. Equivalent to `{href: <string>}`.
- **object**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `rel` | `"depends-on"` \| `"composes"` \| `"part-of"` \| `"alternative-to"` \| `"replaces"` \| `"extends"` \| `"implements"` \| `"relates-to"` \| `"same-as"` \| `"refines"` \| `"lint-rule"` \| `"test"` \| `"file"` \| `"source"` \| `"design"` \| `"storybook"` \| `"package"` \| `"external-link"` \| `"contract"` \| `"pairs-with"` \| `"excludes"` \| `"see-also"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of pointer this is, or a namespaced custom value. |
| `to` | string |  | What this points at, inside this document's own graph. (Pattern: `^[a-z0-9]+(-[a-z0-9]+)*([./][a-z0-9]+(-[a-z0-9]+)*)*(#[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*)?$`) |
| `href` | string (uri-reference) |  | What this points at, outside this document. Such as a file, URL, or package. |
| `role` | string |  | What the thing being pointed at does in this context. |
| `note` | string |  | Additional info related to the connection of the two items. |

**References:** [namespaced](schema.md#common-id-namespaced), [Ref](schema.md#common-ref)

## list {#list}

One or more pointers, in order.

**References:** [Ref](schema.md#common-ref)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml
title: Ref
description: The one pointer type. "A points to B, and this is what kind of pointer it is."
$comment: >-
  The schema's pointer: "A points to B". `rel` says what
  kind of pointer it is. Dependencies, composition, extension,
  citations, and every other connection use this pointer with a
  different `rel`.

  Exactly one of `to` or `href` described B. `to` points inside this
  document (an entry id, or `entryId#itemId` for one item inside it).
  `href` points outside it (a file, URL, or package). This is
  independent of `rel`.

  Only add a new `rel` value if no existing one covers the idea.
  Otherwise extend that value's description instead.

  A bare string is shorthand for `{href: <string>}`. Bare strings can't
  be safely read as an internal id. Use the full object when the target
  is internal or an external link needs more description.
oneOf:
  - type: string
    format: uri-reference
    description: "Shorthand for an external link that doesn't need added definition. Equivalent to `{href: <string>}`."
    example: https://storybook.org/ds/button
  - type: object
    required: [rel]
    oneOf:
      - required: [to]
      - required: [href]
    properties:
      rel:
        oneOf:
          - type: string
            enum: [depends-on, composes, part-of, alternative-to, replaces, extends, implements, relates-to, same-as, refines, lint-rule, test, file, source, design, storybook, package, external-link, contract, pairs-with, excludes, see-also]
          - $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml#/$defs/namespaced
        description: What kind of pointer this is, or a namespaced custom value.
        $comment: >-
          Grouped by purpose: `depends-on`, `composes`, `part-of`,
          `alternative-to`, `replaces`, `extends`, `implements`, and
          `relates-to` describe how things connect. `same-as` and `refines`
          describe how content is written. `lint-rule` and `test` describe
          how a rule is checked. `file`, `source`, `design`, `storybook`,
          `package`, `external-link`, and `contract` point outside this
          spec. `pairs-with` and `excludes` are a light note about two
          things combining. `see-also` is a generic "worth reading too"
          for when nothing more specific fits.

          `implements` is a real, working version of something more
          general. Such as a component implementing a pattern, or a
          platform build implementing a cross-platform one. Different from
          `composes` ("built from these parts"), and from
          `design`/`storybook` (which say what kind of thing this is, not
          why it's linked).

          `same-as` means this item repeats content declared once
          elsewhere, instead of restating it. Point `to` at
          "<shared-id>#<item-id>" and skip the item's own `statement`.
          Different from `refines` (a genuine restatement for a different
          reader) and `alternative-to` (one thing standing in for another,
          not the same thing).

          `refines` is an agent-only rule that sharpens a human-facing
          one; `to` names that rule's id. `lint-rule` and `test` point a
          rule at whatever actually checks it, usually a test file via
          `href`. For a stricter combination rule than
          `pairs-with`/`excludes` gives you, use a combo instead. `file`
          is also how a theme entry points at its real source file,
          instead of listing every token it changes.

          Use `refs` with `rel: source` for an entry's primary source
          file (see button.yaml's GitHub link) - every tool reading
          `common/ref` already understands it, unlike a custom field or
          `$extensions`. Exception: a component uses its own
          `sourceFiles` instead, since it's structured (one entry per
          platform) and what tooling already extracts an API from.
          `metadata.preview` and `examples[].ref` are for a sample, not
          the real source.

          `contract` points at an already-generated, machine-readable
          API contract document (props, slots, events, etc. in some
          standard, tool-readable shape) - not the source `sourceFiles`
          extracts from, and not any one specific format: DSDS doesn't
          parse or validate the target's contents, only points at it.
          A component uses its own `specs` for this rather than `refs`,
          the same way it uses `sourceFiles` instead of `rel: source`.

          Namespaced custom values (ex: "acme.supersedes") are allowed
          too.
        example: depends-on
      to:
        type: string
        pattern: '^[a-z0-9]+(-[a-z0-9]+)*([./][a-z0-9]+(-[a-z0-9]+)*)*(#[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*)?$'
        description: What this points at, inside this document's own graph.
        $comment: >-
          A bare id points at a whole entry. Add `#itemId` (ex:
          `shared-a11y#focus-visible`) to point at one item inside it. The
          entry half accepts a token id's looser slash-separated form too
          (see common/id.schema.yaml's tokenId), since `to` can target a
          token entry.

          This pattern only checks the target is *shaped* like an id (or
          id#itemId) - not that it actually exists. A capitalized display
          name (`to: Button`) or a value with a space in it can never be a
          real id, whatever else is in the document, so this catches that
          class of mistake with no other file needed. Whether the target
          actually resolves is a separate, resolution-level check (see
          DSDS-05 for the #itemId form).
        example: "shared-a11y#focus-visible"
      href:
        type: string
        format: uri-reference
        description: What this points at, outside this document. Such as a file, URL, or package.
        $comment: A URI. Can be a relative path (`./tests/button.a11y.test.ts`) or a pseudo-scheme like `npm:@org/ds-react`.
        example: ./tests/button.a11y.test.ts
      role:
        type: string
        description: What the thing being pointed at does in this context.
        example: hosted docs
      note:
        type: string
        description: Additional info related to the connection of the two items.
        example: Component Story Format (CSF3) - the source the hosted docs above are built from.
    additionalProperties: false
$defs:
  list:
    type: array
    minItems: 1
    description: One or more pointers, in order.
    $comment: Every consumer expects an array of refs. Pulled out here so call sites don't have to redefine it.
    items:
      $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml
```

# RequirementLevel

How strict a rule is, from must to must-not.

Source: `common/requirement-level.schema.yaml`

## RequirementLevel {#requirementlevel}

How strict a rule is, from must to must-not.

Allowed values:

- `must`
- `should`
- `should-not`
- `must-not`
- `may`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/requirement-level.schema.yaml
title: RequirementLevel
type: string
description: How strict a rule is, from must to must-not.
$comment: The values come directly from [RFC 2119](https://www.rfc-editor.org/info/rfc2119/).

enum: [must, should, should-not, must-not, may]
```

# Showcase

A visual sample of something. Can be a media file (image or video) or a link to a live page.

Source: `common/showcase.schema.yaml`

## Showcase {#showcase}

A visual sample of something. Can be a media file (image or video) or a link to a live page.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"image"` \| `"video"` \| `"sound"` \| `"html"` \| `"file"` \| `"code"` \| `"other"` | ✓ | What kind of media this showcase is. |
| `url` | string (uri-reference) | ✓ | Where the showcase lives. |
| `alt` | string |  | Alt text describing the image or video, for accessibility |
| `note` | string |  | Provides additional detail about the showcase if needed. |

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/showcase.schema.yaml
title: Showcase
description: A visual sample of something. Can be a media file (image or video) or a link to a live page.
$comment: For code, point at a file or story with a `ref` instead.

required: [kind, url]
properties:
  kind:
    type: string
    enum: [image, video, sound, html, file, code, other]
    description: What kind of media this showcase is.
  url:
    type: string
    format: uri-reference
    description: Where the showcase lives.
    example: https://cdn.example.com/screenshots/button-primary.png
  alt:
    type: string
    description: Alt text describing the image or video, for accessibility
    example: Primary button in its default state, showing the filled blue background and white label.
  note:
    type: string
    description: Provides additional detail about the showcase if needed.
    example: Captured from the Storybook build, light theme.
additionalProperties: false
```

# Since

The version something was introduced in.

Source: `common/since.schema.yaml`

## Since {#since}

The version something was introduced in.

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/common/since.schema.yaml
title: Since
type: string
description: The version something was introduced in.
$comment: This value isn't pattern-validated since design system's own version scheme can vary.
example: 1.4.0
```

## Metadata

# Metadata

Optional information about an element.

Source: `metadata/metadata.schema.yaml`

**3 definitions** in this file: `Metadata`, `note`, `isoDate`

## Metadata {#metadata}

Optional information about an element.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `tags` | string[] |  | Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category. (Min items: 1) |
| `owner` | string |  | The owning team, role, or group. |
| `reviewed` | object {date, by, note}[] |  | Independent reviews confirming this item's documentation, each recording who confirmed it and when. (Min items: 1) |
| `context` | string |  | Why this entry was created, and how and why to use it. |
| `updated` | object {date, note} |  | Tools SHOULD treat `updated.date` as the cache key for this item's documentation specifically. `updated.date` is distinct from `metadata.version`/`since` which tracks the design system's own release. Always use `updated.date` as the source of truth for when to re-fetch or re-index. |
| `origin` | object {method, author, note} |  | How this entry's documentation came to exist, and who or what wrote it. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace. |

**References:** `#/$defs/isoDate`, [Extensions](schema.md#common-extensions)

## note {#note}

A plain-text note. MUST NOT contain markup.

## isoDate {#isodate}

An ISO 8601 date (YYYY-MM-DD).

**Pattern:** `^\d{4}-\d{2}-\d{2}$`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/metadata/metadata.schema.yaml
title: Metadata
type: object
description: Optional information about an element.
$comment: >-
  The shared foundation every entry's metadata builds on. Fields only meaningful
  for one kind live in a per-kind extension instead - entry-metadata.schema.yaml
  (every entry) or system-metadata.schema.yaml (a `kind: system` entry only).
$defs:
  isoDate:
    type: string
    format: date
    pattern: '^\d{4}-\d{2}-\d{2}$'
    description: An ISO 8601 date (YYYY-MM-DD).
    example: "2026-06-02"
  note:
    type: string
    description: A plain-text note. MUST NOT contain markup.
    example: Reviewed against the latest Figma file; no changes needed.
properties:
  tags:
    type: array
    description: Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category.
    $comment: >-
      The first tag can be used as a category.
    items:
      type: string
    minItems: 1
    uniqueItems: true
    example: [actions, button, cta, form-control]
  owner:
      type: string
      description: The owning team, role, or group.
      $comment: Follows mailbox standard (RFC 5322).
      example: ds@pizzapartysupertime.com
  reviewed:
    type: array
    minItems: 1
    description: Independent reviews confirming this item's documentation, each recording who confirmed it and when.
    $comment: A list of review events so human sign-offs and automated checks can both be recorded independently.
    items:
      type: object
      properties:
        date:
          $ref: "#/$defs/isoDate"
          description: The date of the review.
        by:
          type: string
          description: Who or what performed the review.
          $comment: >-
            Follows the actor convention: `human:<id>` for a person,
            `<producer>/<version>` for an agent or tool, `process:<id>`
            for an automated process. Adapted from the Open Knowledge
            Format (OKF) spec.
          example: human:ahormati
        note:
          type: string
          description: A plain-text note on the review outcome.
          example: Copy and contrast ratios re-checked; no changes needed.
  context:
    type: string
    description: Why this entry was created, and how and why to use it.
    example: Introduced to give provide agents extra information for how to ingest/use an entry.
  updated:
    type: object
    description: >-
      Tools SHOULD treat `updated.date` as the cache key for this item's
      documentation specifically. `updated.date` is distinct from
      `metadata.version`/`since` which tracks the design system's own release.
      Always use `updated.date` as the source of truth for when to re-fetch or
      re-index.
    $comment: A bare date, or a date with a change note.
    properties:
      date:
        $ref: "#/$defs/isoDate"
        description: The date of the change.
      note:
        type: string
        description: A plain-text note on what changed.
        example: Added the loading trait and its guideline.
  origin:
    type: object
    description: How this entry's documentation came to exist, and who or what wrote it.
    $comment: >-
      `method` and `author` both default to the common case
      (authored, by a human). A one-off exception, like
      "the accessibility section was reviewed by a
      person, unlike the rest," belongs as a `note`.
    properties:
      method:
        type: string
        enum: [authored, generated, extracted, reconstructed]
        default: authored
        description: How this documentation as a whole came to exist.
      author:
        type: string
        enum: [human, ai-assisted, ai-generated, machine-assisted, machine-generated]
        default: human
        description: Who or what actually wrote the content.
      note:
        type: string
        description: Free-text context about the origin, including any exceptions to `method` or `author`.
        example: The accessibility section was reviewed by a person, unlike the rest.
  $extensions:
    $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
    description: Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace.
```

# EntryMetadata

Information about a single entry, on top of the fields every metadata object shares.

Source: `metadata/entry-metadata.schema.yaml`

**3 definitions** in this file: `EntryMetadata`, `statusEntry`, `statusValue`

## EntryMetadata {#entrymetadata}

Information about a single entry, on top of the fields every metadata object shares.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `tags` | string[] |  | Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category. (Min items: 1) |
| `owner` | string |  | The owning team, role, or group. |
| `reviewed` | object {date, by, note}[] |  | Independent reviews confirming this item's documentation, each recording who confirmed it and when. (Min items: 1) |
| `context` | string |  | Why this entry was created, and how and why to use it. |
| `updated` | object {date, note} |  | Tools SHOULD treat `updated.date` as the cache key for this item's documentation specifically. `updated.date` is distinct from `metadata.version`/`since` which tracks the design system's own release. Always use `updated.date` as the source of truth for when to re-fetch or re-index. |
| `origin` | object {method, author, note} |  | How this entry's documentation came to exist, and who or what wrote it. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace. |
| `status` | `statusEntry` \| `statusEntry`[] |  | A lifecycle status, optionally scoped to one platform - or a list of them, one per platform, when an entry has reached different maturity on each. |
| `since` | [Since](schema.md#common-since) |  | The version this entry was first introduced. |
| `group` | string |  | A group name this entry belongs to, for example "color.action" on a set of related tokens, or "action" on a family of related components. |
| `aliases` | string[] |  | Other names this entry is also known or searched by, like a past name or a common misspelling. |
| `preview` | [Showcase](schema.md#common-showcase) |  | A visual sample of this entry, either a media file or a link. |

**References:** [Metadata](schema.md#metadata-metadata), `#/$defs/statusEntry`, [Since](schema.md#common-since), [Showcase](schema.md#common-showcase), [Id](schema.md#common-id), `#/$defs/statusValue`, `#/$defs/isoDate`, [Extensions](schema.md#common-extensions)

## statusEntry {#statusentry}

One lifecycle status, optionally scoped to a single platform.

**References:** [Id](schema.md#common-id), `#/$defs/statusValue`, [Since](schema.md#common-since)

## statusValue {#statusvalue}

A lowercase, dash-separated lifecycle word, for example "stable" or "deprecated".

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*$`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/metadata/entry-metadata.schema.yaml
title: EntryMetadata
description: Information about a single entry, on top of the fields every metadata object shares.
$comment: >-
  Adds fields that only make sense per-entry: `status`, `since`,
  `group`, `aliases`, `preview`. A system's own metadata adds a
  different set instead - see metadata/system-metadata.schema.yaml.

  Deliberately left open (no `unevaluatedProperties`) - a system entry
  needs this schema's fields AND system-metadata.schema.yaml's own
  fields to both apply to the same `metadata` object at once, so only
  the combined usage (entries/system.schema.yaml's own `metadata`
  property) can correctly close the union. Every other kind file
  (component/token/theme) closes its own `metadata` property locally
  instead, since only this schema applies there.

allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/metadata/metadata.schema.yaml
  - type: object
    properties:
      status:
        description: >-
          A lifecycle status, optionally scoped to one platform - or a list
          of them, one per platform, when an entry has reached different
          maturity on each.
        $comment: >-
          There is deliberately no `overall` field. A consumer SHOULD derive
          an entry's overall status from the aggregate of its per-platform
          entries rather than expect a separately authored overall value: a
          stated overall is a second source of truth that drifts the moment
          one platform moves, and any consumer needing one can compute it
          consistently from the entries already present. How to aggregate is
          the consumer's call - least-mature-wins answers "can I depend on
          this everywhere?", per-platform answers "can I depend on this
          here?". A producer using the list form SHOULD declare the system
          entry's `metadata.platforms` too, so an absent platform is
          distinguishable from an unsupported one (DSDS-02 then closes that
          vocabulary). A bare object with no `platform` still means what it
          always did - this entry's status, everywhere.
        oneOf:
          - $ref: "#/$defs/statusEntry"
          - type: array
            minItems: 1
            description: One status per platform.
            items:
              $ref: "#/$defs/statusEntry"
      since:
        $ref: https://designsystemdocspec.org/v0.20.0/common/since.schema.yaml
        description: The version this entry was first introduced.
      group:
        type: string
        description: A group name this entry belongs to, for example "color.action" on a set of related tokens, or "action" on a family of related components.
        $comment: >-
          Any entry can be grouped. Components, tokens, themes, etc. This
          property is used for simple organization and categorization.
        example: color.action
      aliases:
        type: array
        items:
          type: string
        uniqueItems: true
        description: Other names this entry is also known or searched by, like a past name or a common misspelling.
        example: [btn]
      preview:
        $ref: https://designsystemdocspec.org/v0.20.0/common/showcase.schema.yaml
        description: A visual sample of this entry, either a media file or a link.
        $comment: For a code sample, use a section's own examples instead, which can point at a real file or story.

$defs:
  statusEntry:
    description: One lifecycle status, optionally scoped to a single platform.
    $comment: >-
      Factored out of `status` so the single-object and one-per-platform
      list forms enforce exactly the same shape, including the
      deprecated-needs-a-notice conditional below.
    allOf:
      - type: object
        required: [status]
        properties:
          platform:
            $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
            description: Which platform this status applies to.
            $comment: >-
              This field isn't necessary if only one platform exists. It is
              required in practice for the list form to mean anything - two
              entries with no `platform` say the same thing twice.
            example: react
          status:
            $ref: "#/$defs/statusValue"
          since:
            $ref: https://designsystemdocspec.org/v0.20.0/common/since.schema.yaml
            description: The version this platform (or the system overall) reached this status.
          deprecationNotice:
            type: string
            description: What to use instead, and why.
            $comment: Required when `status` is deprecated.
            example: Use `icon-button` instead - this variant never got contrast-tested and is being removed in 2.0.
          note:
            type: string
            description: Free-text context.
            example: Still supported for legacy integrations only.
        additionalProperties: false
      - if:
          required: [status]
          properties: { status: { const: deprecated } }
        then:
          required: [deprecationNotice]

  statusValue:
    type: string
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*$'
    examples: [experimental, stable, deprecated, beta, planned]
    description: A lowercase, dash-separated lifecycle word, for example "stable" or "deprecated".
    $comment: This enum isn't closed. Any term is allowed.
```

# SystemMetadata

Information about the design system as a whole, on top of the fields every metadata object shares.

Source: `metadata/system-metadata.schema.yaml`

## SystemMetadata {#systemmetadata}

Information about the design system as a whole, on top of the fields every metadata object shares.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `tags` | string[] |  | Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category. (Min items: 1) |
| `owner` | string |  | The owning team, role, or group. |
| `reviewed` | object {date, by, note}[] |  | Independent reviews confirming this item's documentation, each recording who confirmed it and when. (Min items: 1) |
| `context` | string |  | Why this entry was created, and how and why to use it. |
| `updated` | object {date, note} |  | Tools SHOULD treat `updated.date` as the cache key for this item's documentation specifically. `updated.date` is distinct from `metadata.version`/`since` which tracks the design system's own release. Always use `updated.date` as the source of truth for when to re-fetch or re-index. |
| `origin` | object {method, author, note} |  | How this entry's documentation came to exist, and who or what wrote it. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace. |
| `version` | [Since](schema.md#common-since) |  | The current version of the design system. |
| `organization` | string |  | The team or company that owns the design system. |
| `url` | string (uri) |  | The main home page or repository for the design system. |
| `license` | string |  | The license this design system is published under. |
| `platforms` | [Id](schema.md#common-id)[] |  | The platforms this system ships on, for example "react" or "web-component". (Min items: 1) |

**References:** [Metadata](schema.md#metadata-metadata), [Since](schema.md#common-since), [Id](schema.md#common-id), `#/$defs/isoDate`, [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/metadata/system-metadata.schema.yaml
title: SystemMetadata
description: Information about the design system as a whole, on top of the fields every metadata object shares.
$comment: Adds fields specifically for the system. See metadata/entry-metadata.schema.yaml for the per-entry equivalent.

allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/metadata/metadata.schema.yaml
  - type: object
    properties:
      version:
        $ref: https://designsystemdocspec.org/v0.20.0/common/since.schema.yaml
        description: The current version of the design system.
      organization:
        type: string
        description: The team or company that owns the design system.
        example: Acme Inc.
      url:
        type: string
        format: uri
        description: The main home page or repository for the design system.
        example: https://github.com/acme/design-system
      license:
        type: string
        description: The license this design system is published under.
        example: MIT
      platforms:
        type: array
        description: The platforms this system ships on, for example "react" or "web-component".
        $comment: When this list is present, every other `platform` value used anywhere in the document MUST match one of these.
        minItems: 1
        uniqueItems: true
        items:
          $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
        example: [react, web-component, ios]
```

## Entries

# Entry

The structure every entry kind shares: `id`, `kind`, `name`, `description` (required), plus `purpose`, `metadata`, `related`, `extends`, `refs`, `sections`, `$extensions` (optional). This schema doubles as a general-use entry that isn't explicitly defined in the schema (ex: pattern, foundation, guideline). See schema/entries/ for each kind's own closing file.

Source: `entries/entry.schema.yaml`

**2 definitions** in this file: `Entry`, `dispatch`

## Entry {#entry}

The structure every entry kind shares: `id`, `kind`, `name`, `description` (required), plus `purpose`, `metadata`, `related`, `extends`, `refs`, `sections`, `$extensions` (optional). This schema doubles as a general-use entry that isn't explicitly defined in the schema (ex: pattern, foundation, guideline). See schema/entries/ for each kind's own closing file.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"system"` \| `"component"` \| `"token"` \| `"theme"` \| `"entry"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of thing this entry is, as a real design-system artifact: one of the 5 well-known kinds, or a namespaced custom kind. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | [EntryMetadata](schema.md#metadata-entry-metadata) |  | Information about a single entry, on top of the fields every metadata object shares. |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |

**References:** [namespaced](schema.md#common-id-namespaced), [EntryMetadata](schema.md#metadata-entry-metadata), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions), [ComponentEntry](schema.md#entries-component), [TokenEntry](schema.md#entries-token), [ThemeEntry](schema.md#entries-theme), [SystemEntry](schema.md#entries-system), [Entry](schema.md#entries-entry)

## dispatch {#dispatch}

Routes an entry to its own kind-specific schema by `kind` (`system`, `component`, `token`, `theme`), falling back to this open base for the generic `entry` kind or a namespaced custom kind.

**References:** [ComponentEntry](schema.md#entries-component), [TokenEntry](schema.md#entries-token), [ThemeEntry](schema.md#entries-theme), [SystemEntry](schema.md#entries-system), [Entry](schema.md#entries-entry)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml
title: Entry
type: object
description: >-
  The structure every entry kind shares: `id`, `kind`, `name`,
  `description` (required), plus `purpose`, `metadata`, `related`,
  `extends`, `refs`, `sections`, `$extensions` (optional). This schema
  doubles as a general-use entry that isn't explicitly defined in the
  schema (ex: pattern, foundation, guideline). See schema/entries/ for each
  kind's own closing file.
$comment: >-
  Shared fields for every entry kind. Kind-specific fields, like a token's `tokenType`, live in that kind's own entries/<kind>.schema.yaml file instead.

  `kind` is one of 5 well-known values (`system`, `component`, `token`,
  `theme`, `entry`) or a namespaced custom value like
  "acme.icon-library". Use `entry` for anything that doesn't need
  fields beyond this base. Only add a dedicated file once a kind
  needs a field none of the others do.

  Reusable content that isn't a design-system artifact (like a shared
  accessibility rule) doesn't belong here as a kind. Use the base
  document's `shared` list instead.

required: [id, kind, name, description]
properties:
  id:
    type: string
    description: This entry's unique id in the design system graph.
    $comment: >-
      Every ref that points at it uses this. A token entry's id uses a
      looser pattern (see entries/token.schema.yaml). Every other kind
      uses common/id.schema.yaml's standard pattern.
    example: button
  kind:
    description: "What kind of thing this entry is, as a real design-system artifact: one of the 5 well-known kinds, or a namespaced custom kind."
    $comment: Reusable content that is not an artifact at all (like a rule other entries point at instead of restating) belongs in the base document's `shared` list instead.
    oneOf:
      - type: string
        enum: [system, component, token, theme, entry]
        default: entry
      - $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml#/$defs/namespaced
        description: A namespaced custom kind.
        example: acme.icon-library
  name:
    type: string
    description: The human-readable display name.
    $comment: Kept separate from `id`, which is machine-readable.
    example: Button
  description:
    type: string
    description: A one-line statement of what this entry is or is for.
    $comment: The deeper explanation belongs in `sections`.
    example: An interactive element that triggers an action when activated.
  purpose:
    type: string
    description: Explains the entry's reason for existing.
    example: Gives users a single, consistent way to trigger an action across the product.
  metadata:
    $ref: https://designsystemdocspec.org/v0.20.0/metadata/entry-metadata.schema.yaml
  related:
    $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
    description: Pointers to another entry this one is similar to in usage or purpose.
    $comment: "rel: alternative-to, rel: pairs-with, and similar values are the common ones here."
    example:
      - to: link
        rel: alternative-to
  extends:
    $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
    description: "Pointers to another entry this one inherits from (rel: extends)."
    example:
      - to: base-dialog
        rel: extends
  refs:
    $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
    description: This entry's other pointers to entries and outside resources, not covered by `related` or `extends`.
    example:
      - href: https://github.com/org/ds/react/button
        rel: source
  sections:
    type: array
    minItems: 1
    description: Every documentation section for this entry.
    items:
      $ref: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml#/$defs/dispatch
  $extensions:
    $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
$defs:
  dispatch:
    description: >-
      Routes an entry to its own kind-specific schema by `kind`
      (`system`, `component`, `token`, `theme`), falling back to this
      open base for the generic `entry` kind or a namespaced custom kind.
    $comment: >-
      Routes an entry to its own entries/<kind>.schema.yaml by `kind`,
      falling back to this file (the open base) for the generic `entry`
      kind or a namespaced custom kind with no dedicated file. Used
      anywhere an entry is embedded (base.schema.yaml's own `entries`)
      instead of a bare $ref to this file, so the bundled schema enforces
      the same per-kind shape scripts/validate.js does in JS.
    if:
      required: [kind]
      properties:
        kind:
          const: component
    then:
      $ref: https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml
    else:
      if:
        required: [kind]
        properties:
          kind:
            const: token
      then:
        $ref: https://designsystemdocspec.org/v0.20.0/entries/token.schema.yaml
      else:
        if:
          required: [kind]
          properties:
            kind:
              const: theme
        then:
          $ref: https://designsystemdocspec.org/v0.20.0/entries/theme.schema.yaml
        else:
          if:
            required: [kind]
            properties:
              kind:
                const: system
          then:
            $ref: https://designsystemdocspec.org/v0.20.0/entries/system.schema.yaml
          else:
            $ref: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml
```

# ComponentEntry

A reusable UI element, like a button or a dialog.

Source: `entries/component.schema.yaml`

**3 definitions** in this file: `ComponentEntry`, `traitSetBy`, `traitValue`

## ComponentEntry {#componententry}

A reusable UI element, like a button or a dialog.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"component"` | ✓ | Marks this entry as a component. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  |  |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |
| `sourceFiles` | object {platform, file}[] |  | One entry per platform's source file. (Min items: 1) |
| `specs` | [list](schema.md#common-ref-list) |  | Machine-readable API contract(s) for this component - props, slots, events, etc. in a standard, tool-readable shape. |
| `imports` | object {platform, code, package}[] |  | One entry per platform. (Min items: 1) |
| `traits` | object \| object[] |  | The component's variants and states. Each item is tagged `kind: boolean` or `kind: enum`, since the two carry genuinely different fields - an enum's own `values` list vs. a boolean's plain toggle. (Min items: 1) |
| `combos` | [Combo](schema.md#common-combo)[] |  | Define which of this component's own boolean traits or enum values can or cannot be paired with each other. (Min items: 1) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [Id](schema.md#common-id), [Ref](schema.md#common-ref), [list](schema.md#common-ref-list), [traitValue](schema.md#entries-component-traitvalue), [traitSetBy](schema.md#entries-component-traitsetby), [Combo](schema.md#common-combo), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [Since](schema.md#common-since), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

## traitSetBy {#traitsetby}

Whether this trait's value is passed in by the consumer, or set by the component itself.

Allowed values:

- `consumer`
- `component`

## traitValue {#traitvalue}

The shared properties of a boolean trait or one enum value - what it is, and what it's for.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [Id](schema.md#common-id) | ✓ | The machine-readable id. |
| `description` | [Markdown](schema.md#common-markdown) | ✓ | What this is, how it looks or behaves, and any constraints. |
| `name` | string |  | The human-readable name. Uses `id` when left out. |
| `purpose` | [Markdown](schema.md#common-markdown) |  | Why this exists. |
| `examples` | [list](schema.md#common-example-list) |  | Examples showing this in context. |
| `since` | [Since](schema.md#common-since) |  | The version this was introduced. |

**References:** [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [Since](schema.md#common-since)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml
title: ComponentEntry
description: A reusable UI element, like a button or a dialog.
$comment: >-
  `traits`, `combos`, `imports`, `sourceFiles`, and `specs` live
  directly here rather than in a section, since they're facts about the
  component as a build artifact, not documentation content.
allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml
  - type: object
    properties:
      kind:
        const: component
        description: Marks this entry as a component.
      metadata:
        allOf:
          - $ref: https://designsystemdocspec.org/v0.20.0/metadata/entry-metadata.schema.yaml
        unevaluatedProperties: false
      sourceFiles:
        type: array
        minItems: 1
        description: One entry per platform's source file.
        $comment: >-
          Defining the source file in the schema enables a tool to
          extract the component's full API (properties, events, slots,
          CSS hooks) straight from the code. This avoids drift between
          docs and code. Points at raw source (e.g. `Button.tsx`) - a
          project whose tooling already generates a manifest *from* that
          source (a Custom Elements Manifest, or similar) points `specs`
          at the generated document itself instead of repeating the
          extraction here.
        items:
          type: object
          required: [platform, file]
          properties:
            platform:
              $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
              description: The platform or framework this interface applies to.
              $comment: When the document declares a `metadata.platforms` list, this MUST be one of its entries.
              example: react
            file:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml
              description: Path to the component's source file.
              $comment: A bare string is a plain file path (shorthand for href). Use the full ref object when role or note matters.
              example: ./src/Button.tsx
          additionalProperties: false

      specs:
        $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
        description: Machine-readable API contract(s) for this component - props, slots, events, etc. in a standard, tool-readable shape.
        $comment: >-
          Different from `sourceFiles`: that points at the source a tool
          extracts an API *from*; this points at an already-extracted
          contract document, in whatever standard format your tooling
          produces and consumes - for example a DS Contracts document
          (https://github.com/southleft/ds-contracts-poc) or a W3C
          Custom Elements Manifest. DSDS doesn't parse or validate the
          target's contents, only points at it, so any standard format
          works here. One entry per platform or format, if more than
          one exists; use `role` to name the format when it isn't
          obvious from the file extension.
        example:
          - rel: contract
            href: ./contracts/button.contract.json
            role: DS Contracts

      imports:
        type: array
        minItems: 1
        description: One entry per platform.
        $comment: List the primary platform first.
        items:
          type: object
          required: [platform, code]
          properties:
            platform:
              $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
              description: The platform this applies to.
              $comment: When the document declares a `metadata.platforms` list, this MUST be one of its entries.
              example: react
            code:
              type: string
              description: The import statement itself, written out.
              example: "import { Button } from '@acme/ui';"
            package:
              type: string
              description: The package to install, exactly as named in the package manager.
              example: "@acme/ui"
      traits:
        type: array
        description: >-
          The component's variants and states. Each item is tagged `kind:
          boolean` or `kind: enum`, since the two carry genuinely
          different fields - an enum's own `values` list vs. a boolean's
          plain toggle.
        $comment: >-
          Tagged with `kind` (`anyOf`) because the two shapes genuinely
          differ, not just which optional fields happen to be filled in -
          compare `sections/steps.schema.yaml`'s and
          `sections/guidelines.schema.yaml`'s own items, which stay one
          flexible shape with no `kind` tag for exactly that reason.
        minItems: 1
        items:
          anyOf:
            - allOf:
                - $ref: "https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml#/$defs/traitValue"
                - type: object
                  required: [kind]
                  properties:
                    kind:
                      const: boolean
                      description: Marks this trait as a yes/no toggle.
                      $comment: >-
                        This covers both a boolean prop variant choice
                        (like an `outlined` prop) and a runtime state
                        (like `hover`). Use `description` to explicitly
                        call out if necessary.
                    setBy:
                      $ref: "https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml#/$defs/traitSetBy"
                    refs:
                      $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
                      description: "Pointers to resources for this trait: a design tool entry, a source file, or a verifying test."
              unevaluatedProperties: false
            - allOf:
                - $ref: "https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml#/$defs/traitValue"
                - type: object
                  required: [kind, values]
                  properties:
                    kind:
                      const: enum
                      description: Marks this trait as an enumerated configuration dimension.
                    id:
                      description: The machine-readable name for the dimension, for example 'size'.
                    name:
                      description: The human-readable name of the dimension, for example 'Size'.
                    description:
                      description: What this dimension of variation controls.
                    setBy:
                      $ref: "https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml#/$defs/traitSetBy"
                    refs:
                      $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
                      description: "Pointers to resources for this dimension as a whole: a design tool entry, a source file, or a verifying test."
                    values:
                      type: array
                      minItems: 1
                      description: The possible values, in order. The first value is implied as the default.
                      $comment: Each value is a `traitValue`.
                      example:
                        - id: small
                          description: Compact size for dense layouts.
                        - id: medium
                          description: The default size for most surfaces.
                      items:
                        allOf:
                          - $ref: "https://designsystemdocspec.org/v0.20.0/entries/component.schema.yaml#/$defs/traitValue"
                        properties:
                          refs:
                            $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
                            description: "Pointers to resources for this specific value: a design tool entry, a source file, or a verifying test."
                        unevaluatedProperties: false
              unevaluatedProperties: false
      combos:
        type: array
        minItems: 1
        items:
          $ref: https://designsystemdocspec.org/v0.20.0/common/combo.schema.yaml
        description: Define which of this component's own boolean traits or enum values can or cannot be paired with each other.
        example:
          - subject: loading
            level: must-not
            items: [disabled]
            note: A control can't be simultaneously loading and disabled.
unevaluatedProperties: false
$defs:
  traitSetBy:
    type: string
    enum: [consumer, component]
    description: Whether this trait's value is passed in by the consumer, or set by the component itself.
    $comment: >-
      `consumer` is a value the caller chooses, like `size` or
      `variant`. `component` is a condition the component sets on its
      own, like `hover` or `loading` - the caller only observes it.
      Matters most for codegen: a `consumer`-set trait becomes a prop;
      a `component`-set trait never should. Optional.
  traitValue:
    type: object
    required: [id, description]
    description: The shared properties of a boolean trait or one enum value - what it is, and what it's for.
    $comment: >-
      The shared properties of boolean and enum traits. Contains all the details to describe
      a trait's value, what it is, and what it's for.
    properties:
      id:
        $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
        description: The machine-readable id.
        example: loading
      name:
        type: string
        description: The human-readable name. Uses `id` when left out.
        example: Loading
      description:
        $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
        description: What this is, how it looks or behaves, and any constraints.
        example: Shows a spinner in place of the label and blocks interaction while active.
      purpose:
        $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
        description: Why this exists.
        example: Prevents duplicate submissions while an action is in flight.
      examples:
        $ref: https://designsystemdocspec.org/v0.20.0/common/example.schema.yaml#/$defs/list
        description: Examples showing this in context.
      since:
        $ref: https://designsystemdocspec.org/v0.20.0/common/since.schema.yaml
        description: The version this was introduced.
```

# SystemEntry

A DSDS design system. System-level information and guidance for the design system as a whole.

Source: `entries/system.schema.yaml`

## SystemEntry {#systementry}

A DSDS design system. System-level information and guidance for the design system as a whole.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"system"` | ✓ | Marks this entry as a design system. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  | Facts about the design system as a whole. |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [SystemMetadata](schema.md#metadata-system-metadata), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/entries/system.schema.yaml
title: SystemEntry
description: A DSDS design system. System-level information and guidance for the design system as a whole.
$comment: >-
  Does not contain entries. A system points at its own
  components/tokens/etc with `refs` instead. It can reference other
  systems the same way to state a relationship (sibling, child,
  parent).

allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml
  - type: object
    properties:
      kind:
        const: system
        description: Marks this entry as a design system.
      metadata:
        description: Facts about the design system as a whole.
        $comment: >-
          Uses the same structure as every other entry's `metadata`
          (entry-metadata.schema.yaml), plus fields that only make
          sense for a whole system: `version`, `organization`, `url`,
          `license`, `platforms` (system-metadata.schema.yaml).
        allOf:
          - $ref: https://designsystemdocspec.org/v0.20.0/metadata/entry-metadata.schema.yaml
          - $ref: https://designsystemdocspec.org/v0.20.0/metadata/system-metadata.schema.yaml
        unevaluatedProperties: false
unevaluatedProperties: false
```

# ThemeEntry

A defined system theme.

Source: `entries/theme.schema.yaml`

## ThemeEntry {#themeentry}

A defined system theme.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"theme"` | ✓ | Marks this entry as a theme. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  |  |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |
| `source` | [Ref](schema.md#common-ref) |  | Path to the theme's DTCG source file. |
| `colorScheme` | `"light"` \| `"dark"` |  | Which native color-scheme setting this theme matches. (Default: `"light"`) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [Ref](schema.md#common-ref), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/entries/theme.schema.yaml
title: ThemeEntry
description: A defined system theme.
$comment: This entry doesn't list which tokens the theme overrides. `source` points to the DTCG JSON file which acts as the source of truth.
allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml
  - type: object
    properties:
      kind:
        const: theme
        description: Marks this entry as a theme.
      metadata:
        allOf:
          - $ref: https://designsystemdocspec.org/v0.20.0/metadata/entry-metadata.schema.yaml
        unevaluatedProperties: false
      source:
        $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml
        description: Path to the theme's DTCG source file.
        $comment: A bare string is a plain file path (shorthand for href); use the full ref object when role or note matters.
        example: tokens/dark.tokens.json
      colorScheme:
        type: string
        enum: [light, dark]
        default: light
        description: Which native color-scheme setting this theme matches.
unevaluatedProperties: false
```

# TokenEntry

A single design token, from the Design Tokens Community Group (DTCG) format.

Source: `entries/token.schema.yaml`

## TokenEntry {#tokenentry}

A single design token, from the Design Tokens Community Group (DTCG) format.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [tokenId](schema.md#common-id-tokenid) | ✓ | This token's unique id. |
| `kind` | `"token"` | ✓ | Marks this entry as a token. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  |  |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |
| `source` | [Ref](schema.md#common-ref) |  | Path to the token's DTCG source file's token reference. |
| `tokenType` | string |  | The token's type, from DTCG. (Pattern: `^[a-z][a-zA-Z0-9]*$`) |
| `combos` | [Combo](schema.md#common-combo)[] |  | Rules about which other tokens this one must or must never be paired with. (Min items: 1) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [tokenId](schema.md#common-id-tokenid), [Ref](schema.md#common-ref), [Combo](schema.md#common-combo), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/entries/token.schema.yaml
title: TokenEntry
$comment: >-
  Never stores the token's real value or type. `source` points to the DTCG JSON file which acts as the source of truth. This entry describes what the token is, why is exists, and how to use it.
description: A single design token, from the Design Tokens Community Group (DTCG) format.
allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/entries/entry.schema.yaml
  - type: object
    properties:
      kind:
        const: token
        description: Marks this entry as a token.
      metadata:
        allOf:
          - $ref: https://designsystemdocspec.org/v0.20.0/metadata/entry-metadata.schema.yaml
        unevaluatedProperties: false
      id:
        $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml#/$defs/tokenId
        description: This token's unique id.
        $comment: Looser than the standard id pattern. Allows slash separators too, to fit however a token layer or DTCG source already names things.
        example: color.action.primary
      source:
        $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml
        description: Path to the token's DTCG source file's token reference.
        $comment: A bare string is a plain file path (shorthand for href). Use the full ref object when role or note matters.
        example: ./tokens.dtcg.json
      tokenType:
        type: string
        pattern: "^[a-z][a-zA-Z0-9]*$"
        description: The token's type, from DTCG.
        $comment: >-
          Optional - a token can inherit its type from its
          `metadata.group` instead of stating its own. Left open as a
          pattern instead of a fixed list. Well-known values as of this
          writing: color, dimension, fontFamily, fontWeight, duration,
          cubicBezier, number, shadow.
        example: color
      combos:
        type: array
        minItems: 1
        items:
          $ref: https://designsystemdocspec.org/v0.20.0/common/combo.schema.yaml
        description: Rules about which other tokens this one must or must never be paired with.
        example:
          - subject: "{color.action.primary}"
            level: must
            items: ["{color.surface.default}", "{color.surface.raised}"]
unevaluatedProperties: false
```

## Sections

# Section

A logical documentation section. Supplies the fields every section kind shares — `kind`, `for`, `title`, `description`, `items`, `metadata`, `$extensions` — plus `freeform`, and is tagged with who it is for (human, agent, or all). Content always lives in `items`, never in a field named after the kind. Each sections/<kind>.schema.yaml file adds its own `kind` value (`definitions`, `guidelines`, `steps`, or the generic `section`) and its own structure for `items` on top of this shared base.

Source: `sections/section.schema.yaml`

**3 definitions** in this file: `Section`, `dispatch`, `freeformEntry`

## Section {#section}

A logical documentation section. Supplies the fields every section kind shares — `kind`, `for`, `title`, `description`, `items`, `metadata`, `$extensions` — plus `freeform`, and is tagged with who it is for (human, agent, or all). Content always lives in `items`, never in a field named after the kind. Each sections/<kind>.schema.yaml file adds its own `kind` value (`definitions`, `guidelines`, `steps`, or the generic `section`) and its own structure for `items` on top of this shared base.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"definitions"` \| `"guidelines"` \| `"steps"` \| `"section"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of content section this is. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `items` | object[] | at least 1 | The one universal list for this section kind's own structured content. |
| `freeform` | `freeformEntry`[] | at least 1 | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |

**Constraint:** At least one of `items`, `freeform` must be present.

**References:** [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`, [Extensions](schema.md#common-extensions), [DefinitionsSection](schema.md#sections-definitions), [GuidelinesSection](schema.md#sections-guidelines), [StepsSection](schema.md#sections-steps), [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [list](schema.md#common-ref-list)

## dispatch {#dispatch}

Routes a section to its own kind-specific schema by `kind` (`definitions`, `guidelines`, `steps`), falling back to this open base for the generic `section` kind or a namespaced custom kind.

**References:** [DefinitionsSection](schema.md#sections-definitions), [GuidelinesSection](schema.md#sections-guidelines), [StepsSection](schema.md#sections-steps), [Section](schema.md#sections-section)

## freeformEntry {#freeformentry}

One nestable, headed block of prose - a freeform section's own building block.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✓ | The entry's heading, for example 'Installation'. |
| `id` | [Id](schema.md#common-id) |  | A stable id for linking to this entry directly, unique within the section. |
| `body` | [Markdown](schema.md#common-markdown) |  | The entry's content. |
| `examples` | [list](schema.md#common-example-list) |  | One or more examples, in order. |
| `refs` | [list](schema.md#common-ref-list) |  | "See also" pointers for this entry. To point at another entry, use the entry's own top-level `refs` instead. |
| `items` | `freeformEntry`[] |  | Sub-entries nested beneath this one, to any depth. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one freeform entry, keyed by namespace. |

**References:** [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [list](schema.md#common-ref-list), `#/$defs/freeformEntry`, [Extensions](schema.md#common-extensions)

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml
title: Section
type: object
description: >-
  A logical documentation section. Supplies the fields every section kind
  shares — `kind`, `for`, `title`, `description`, `items`, `metadata`,
  `$extensions` — plus `freeform`, and is tagged with who it is for
  (human, agent, or all). Content always lives in `items`, never in a
  field named after the kind. Each sections/<kind>.schema.yaml file adds
  its own `kind` value (`definitions`, `guidelines`, `steps`, or the
  generic `section`) and its own structure for `items` on top of this
  shared base.
$comment: >-
  `freeform` lives here on the base so
  every kind can carry nested, headed content alongside its own
  structured `items`. A `guidelines` section can pair its rules with
  background reading, a `steps` section can pair its checklist with
  extra context, and so on. A section should use either `items` or
  `freeform`.A section that's only `freeform` content (this used to be
  its own `kind: freeform`) picks whichever kind fits it best.  If nothing fits, use the generic `kind: section` instead.

  This file doesn't close its own list of properties. Each
  sections/<kind>.schema.yaml file adds its own extra fields on top
  (steps' `ordered`, definitions' term/definition items), and closes
  the combined structure itself, at the item level.
required: [kind, for]
anyOf:
  - required: [items]
  - required: [freeform]
properties:
  kind:
    description: What kind of content section this is.
    $comment: One of the 3 specific content patterns, the generic `section`, or a namespaced custom kind, like "acme.custom-section".
    oneOf:
      - type: string
        enum: [definitions, guidelines, steps, section]
        default: section
      - $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml#/$defs/namespaced
        description: A namespaced custom kind.
        example: acme.custom-section
  for:
    type: string
    enum: [human, agent, all]
    default: all
    description: Who or what this section is written for.
  title:
    type: string
    description: An optional heading for the section.
    example: When to use
  description:
    type: string
    description: An optional one-line intro for the section.
    example: Rules for using this component correctly.
  context:
    description: What job this section is doing.
    $comment: >-
      Open, the same way `entry.kind`/`section.kind` are: one of the
      well-known values below, or a namespaced custom one (ex:
      "acme.slots"). Optional - a section with no stated `context` is
      just its kind's default shape. Named to match `metadata.context`
      (why this entry exists) - this is the same idea one level down,
      why this section exists. Lives on the shared base, not a single
      kind's file, since more than one kind can use it: a `definitions`
      section's anatomy table vs. glossary vs. prop list is the
      original case, but any section kind can be doing a distinguishable
      job its `title` alone doesn't make machine-readable.
    oneOf:
      - type: string
        enum: [anatomy, terms, keyboard, events]
      - $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml#/$defs/namespaced
        description: A namespaced custom value.
        example: acme.slots
    example: anatomy
  metadata:
    $ref: https://designsystemdocspec.org/v0.20.0/metadata/metadata.schema.yaml
  items:
    type: array
    description: The one universal list for this section kind's own structured content.
    $comment: Never under a kind-specific key like parts, steps, or properties.
    items:
      type: object
  freeform:
    type: array
    minItems: 1
    description: Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure.
    $comment: See this file's own $comment above for why this lives on the base instead of its own section kind.
    items:
      $ref: "#/$defs/freeformEntry"
    example:
      - title: Install
        body: Add the package and its peer dependencies.
  $extensions:
    $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
    description: Escape hatch for tool data scoped to just this one section, keyed by namespace.
    $comment: A tool that only cares about one section, like an api section, can stash its data here instead of using the whole entry's escape hatch.
$defs:
  dispatch:
    description: >-
      Routes a section to its own kind-specific schema by `kind`
      (`definitions`, `guidelines`, `steps`), falling back to this open
      base for the generic `section` kind or a namespaced custom kind.
    $comment: >-
      Routes a section to its own sections/<kind>.schema.yaml by `kind`,
      falling back to this file (the open base) for the generic `section`
      kind or a namespaced custom kind with no dedicated file. Used
      anywhere a section is embedded (an entry's or a shared item's own
      `sections`) instead of a bare $ref to this file, so the bundled
      schema enforces the same per-kind shape scripts/validate.js does
      in JS.
    if:
      required: [kind]
      properties:
        kind:
          const: definitions
    then:
      $ref: https://designsystemdocspec.org/v0.20.0/sections/definitions.schema.yaml
    else:
      if:
        required: [kind]
        properties:
          kind:
            const: guidelines
      then:
        $ref: https://designsystemdocspec.org/v0.20.0/sections/guidelines.schema.yaml
      else:
        if:
          required: [kind]
          properties:
            kind:
              const: steps
        then:
          $ref: https://designsystemdocspec.org/v0.20.0/sections/steps.schema.yaml
        else:
          $ref: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml
  freeformEntry:
    type: object
    required: [title]
    description: One nestable, headed block of prose - a freeform section's own building block.
    properties:
      id:
        $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
        description: A stable id for linking to this entry directly, unique within the section.
        $comment: You can leave this out - a tool MUST derive one from this item's own text (see common/id.schema.yaml's own $comment for the rule).
        example: install
      title:
        type: string
        description: The entry's heading, for example 'Installation'.
        example: Installation
      body:
        $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
        description: The entry's content.
        $comment: Can be left out when the entry only groups sub-entries.
        example: Add the package and its peer dependencies.
      examples:
        $ref: https://designsystemdocspec.org/v0.20.0/common/example.schema.yaml#/$defs/list
      refs:
        $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
        description: "\"See also\" pointers for this entry. To point at another entry, use the entry's own top-level `refs` instead."
        example:
          - to: button
            rel: relates-to
      items:
        type: array
        minItems: 1
        items:
          $ref: "#/$defs/freeformEntry"
        description: Sub-entries nested beneath this one, to any depth.
      $extensions:
        $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
        description: Escape hatch for tool data scoped to just this one freeform entry, keyed by namespace.
    additionalProperties: false
```

# DefinitionsSection

Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.

Source: `sections/definitions.schema.yaml`

## DefinitionsSection {#definitionssection}

Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"definitions"` | ✓ | Marks this section as term-definition documentation. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `items` | object[] |  | One entry per term. (Min items: 1) |
| `freeform` | `freeformEntry`[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/sections/definitions.schema.yaml
title: DefinitionsSection
description: Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.
$comment: >-
  A `definitions` section on an entry defines that entry's own terms.
  Distinct from `metadata.tags` or any other classification label.

  `definitions` does several genuinely different jobs - a component's
  anatomy, a glossary, a prop list stand-in, keyboard interactions,
  event names - told apart only by `title` until `context` existed.
  `context` (inherited from section.schema.yaml - see its own
  $comment) makes the job machine-readable: a renderer can find "the
  anatomy table" by checking `context: anatomy` instead of matching on
  a human-written heading string, which drifts and gets localized.
  `title` still carries the human-facing heading; `context` is what a
  tool reads.
allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml
  - type: object
    properties:
      kind:
        const: definitions
        description: Marks this section as term-definition documentation.
      items:
        type: array
        minItems: 1
        description: One entry per term.
        items:
          type: object
          required: [term, definition]
          properties:
            id:
              $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
              description: An optional stable id, so a ref or a same-as pointer can address this term directly.
              $comment: You can leave this out - a tool MUST derive one from this item's own text (see common/id.schema.yaml's own $comment for the rule).
            term:
              type: string
              description: The subject of the definition.
              example: OK
            definition:
              $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
              description: What the term means.
              example: To confirm an action.
            usage:
              $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
              description: When and how to use it, with formatting notes.
              example: Use as the confirming action's label in a destructive-action dialog.
            aliases:
              type: array
              minItems: 1
              uniqueItems: true
              items:
                type: string
                description: Related terms often confused with this one.
                example: Confirm
            $extensions:
              $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
              description: Escape hatch for tool data scoped to just this one term, keyed by namespace.
          additionalProperties: false

unevaluatedProperties: false
```

# GuidelinesSection

Rules for an entry. How to use it and when it is the right choice. Each item pairs a rule with why it exists.

Source: `sections/guidelines.schema.yaml`

## GuidelinesSection {#guidelinessection}

Rules for an entry. How to use it and when it is the right choice. Each item pairs a rule with why it exists.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"guidelines"` | ✓ | Marks this section as guidelines. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `items` | any \| any[] |  | The rules, in order. (Min items: 1) |
| `freeform` | `freeformEntry`[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |
| `framing` | `"when-to-use"` \| `"how-to-use"` |  | Which kind of guidance this section holds. (Default: `"how-to-use"`) |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [RequirementLevel](schema.md#common-requirement-level), [Example](schema.md#common-example), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/sections/guidelines.schema.yaml
title: GuidelinesSection
description: Rules for an entry. How to use it and when it is the right choice. Each item pairs a rule with why it exists.
$comment: >-
  The same structure covers both a how-to-build rule and a when-to-use
  judgment. Only `framing` is different (`framing: when-to-use` for a
  judgment). Named `framing`, not `context`, to stay clear of
  section.schema.yaml's own `context` field (what job this section is
  doing) - this one is narrower, just how-to-use vs. when-to-use.

  `statement` is required unless the item points somewhere else
  instead. Use `same-as` for a statement already declared once elsewhere
  (usually a shared item), or `external-link` for a rule tracked in
  another system, like a ticket. Both always go in `refs`.

  `alternatives`, `evidence`, `related`, and `checks` are `refs`
  lists with a specific name, so a tool can ask "what backs up this
  guideline" without checking every `refs` entry's `rel`. `refs` itself
  is the catch-all for anything that doesn't fit those four.

  `checkedBy` says what type of verification is used, not what does the
  checking. Point `checks` (rel: test or lint-rule) at the actual test
  or lint rule. `example` always matches `level`, so there's no need
  for a separate pass/fail flag.

  An `external-link` item with no `statement` (just `level` plus the
  `refs` entry) is intentional, not a gap: it says "this rule exists,
  at this strictness, tracked in another system" without restating text
  that lives there. It's genuinely unreadable on its own - there is no
  local summary to fall back on - so a reader who wants the actual rule
  MUST follow the link. A renderer SHOULD show the level and the link
  clearly (not hide a level-with-nothing-under-it as if it were
  empty content), and an author who expects a person to read the
  guideline without following the link SHOULD add a `statement` instead
  of leaving this form as the only text.

allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml
  - type: object
    properties:
      kind:
        const: guidelines
        description: Marks this section as guidelines.
      framing:
        type: string
        enum: [when-to-use, how-to-use]
        default: how-to-use
        description: Which kind of guidance this section holds.
        $comment: >-
          when-to-use is a fit judgment: whether, or when, this entry
          is the right choice at all. how-to-use is an implementation
          rule: how to apply or use it correctly, once chosen.
      items:
        type: array
        minItems: 1
        description: The rules, in order.
        items:
          type: object
          anyOf:
            - required: [statement]
            - required: [refs]
              properties:
                refs:
                  contains:
                    type: object
                    required: [rel]
                    properties:
                      rel:
                        enum: [same-as, external-link]
          required: [level]
          properties:
            id:
              $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
              description: A stable id for this guideline, so another item, like an agent-only refinement or a checklist entry, can point at it.
              $comment: You can leave this out - a tool MUST derive one from this item's own text (see common/id.schema.yaml's own $comment for the rule).
            statement:
              $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
              description: An individual, concrete usage rule.
              $comment: >-
                When the section's framing is when-to-use, this states
                a user situation. Leave it out only when `refs` carries a
                same-as or external-link pointer instead (see the file
                comment above).
              example: Limit each surface to one primary button.
            level:
              $ref: https://designsystemdocspec.org/v0.20.0/common/requirement-level.schema.yaml
            example:
              $ref: https://designsystemdocspec.org/v0.20.0/common/example.schema.yaml
              description: An example illustrating this rule.
              $comment: MUST reflect `level`. A `must-not` item's example MUST show what not to do.
            alternatives:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: "Pointers from this guideline to a better-suited alternative when this is a fit judgment."
              example:
                - to: link
                  rel: alternative-to
            evidence:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: "Pointers from this guideline to an outside standard this rule follows, like WCAG or MDN."
              example:
                - href: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
                  rel: external-link
            related:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: Pointers from this guideline to agent-only refinements pointing at the human rule it amends.
              example:
                - to: "button#loading-announcement"
                  rel: refines
            checks:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: "Pointers from this guideline to the lint rule or test that proves it (rel: test, rel: lint-rule)."
              example:
                - href: ./tests/button.a11y.test.ts
                  rel: test
            checkedBy:
              type: string
              enum: [automated, assisted, manual]
              description: How strict this rule's own verification is.
              $comment: >-
                `automated`: a tool checks this on its own. Point
                `checks` (rel: test, lint-rule) at the real tool that's
                doing the checking.

                `assisted`: a tool flags likely cases, but a person
                makes the call.

                `manual`: a person checks this by hand, no tool involved.
                Leave this out if you don't know yet how it'll be checked.
            tags:
              type: array
              description: Freeform keywords that relate guidelines across categories.
              items:
                type: string
              minItems: 1
              uniqueItems: true
              example: [accessibility, focus]
            refs:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: The general-purpose fallback for any pointer that doesn't fit `alternatives`/`evidence`/`related`/`checks`.
              $comment: "Includes rel: same-as and rel: external-link, which point at where the rule is really stated, instead of here (see `statement`'s own $comment)."
              example:
                - to: "shared-a11y#focus-visible"
                  rel: same-as
            $extensions:
              $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
              description: Escape hatch for tool data scoped to just this one guideline, keyed by namespace.
              $comment: >-
                A custom `kind` (ex: "acme.rule") can add its own typed
                fields directly. A well-known kind like `guidelines` can't —
                its item shape is closed so every tool that understands
                `guidelines` keeps understanding it — so this is the one way
                to attach org-specific data (a rationale, a failure mode, an
                internal ticket) to a single item without forking the kind.
          additionalProperties: false

unevaluatedProperties: false
```

# StepsSection

A series of actions/steps/tasks, like a tutorial, a migration, a pattern's interaction flow, or checklist of things to verify.

Source: `sections/steps.schema.yaml`

## StepsSection {#stepssection}

A series of actions/steps/tasks, like a tutorial, a migration, a pattern's interaction flow, or checklist of things to verify.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"steps"` | ✓ | Marks this section as a stepped process or checklist. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `items` | object[] |  | The steps or checklist entries, in order. (Min items: 1) |
| `freeform` | `freeformEntry`[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |
| `ordered` | boolean |  | Whether entries must be done in order. Set to false for an unordered checklist. (Default: `true`) |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-ref-list), [list](schema.md#common-example-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`

## Full schema source

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://designsystemdocspec.org/v0.20.0/sections/steps.schema.yaml
title: StepsSection
description: >-
  A series of actions/steps/tasks, like a tutorial, a migration, a pattern's
  interaction flow, or checklist of things to verify.
$comment: >-
  Useful whenever documenting a multi-phase process of job to be done.

allOf:
  - $ref: https://designsystemdocspec.org/v0.20.0/sections/section.schema.yaml
  - type: object
    properties:
      kind:
        const: steps
        description: Marks this section as a stepped process or checklist.
      ordered:
        type: boolean
        default: true
        description: Whether entries must be done in order. Set to false for an unordered checklist.
      items:
        type: array
        description: The steps or checklist entries, in order.
        minItems: 1
        items:
          type: object
          required: [title]
          properties:
            id:
              $ref: https://designsystemdocspec.org/v0.20.0/common/id.schema.yaml
              description: An optional stable id, so a ref or a same-as pointer can address this step directly.
              $comment: You can leave this out - a tool MUST derive one from this item's own text (see common/id.schema.yaml's own $comment for the rule).
            title:
              type: string
              description: "A short heading for this entry, for example 'Install the package' or 'Focus ring is visible'."
              example: Install the package
            description:
              $ref: https://designsystemdocspec.org/v0.20.0/common/markdown.schema.yaml
              description: What to do, what happens, and what success looks like.
              example: Run `npm install @org/ds-react`.
            checks:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: "Pointers from this checklist entry to the guideline or rule it verifies (rel: depends-on is the common value here)."
              example:
                - to: "button#loading-announcement"
                  rel: depends-on
            refs:
              $ref: https://designsystemdocspec.org/v0.20.0/common/ref.schema.yaml#/$defs/list
              description: "Other pointers from this step, for example the components involved in an interaction-flow entry."
              example:
                - to: button
                  rel: depends-on
            examples:
              $ref: https://designsystemdocspec.org/v0.20.0/common/example.schema.yaml#/$defs/list
              description: "A screenshot, recording, or live URL. For code, point at a file or story through the example's `ref` instead."
            optional:
              type: boolean
              default: false
              description: Whether this entry can be skipped without breaking the procedure or checklist.
            $extensions:
              $ref: https://designsystemdocspec.org/v0.20.0/common/extensions.schema.yaml
              description: Escape hatch for tool data scoped to just this one step, keyed by namespace.
          additionalProperties: false

unevaluatedProperties: false
```
