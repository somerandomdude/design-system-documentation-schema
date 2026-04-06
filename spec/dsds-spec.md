# Design System Documentation Standard (DSDS) 0.1

**Draft Specification — February 2026**

**Latest version:** https://github.com/somerandomdude/design-system-documentation-schema

**Editors:**
- PJ Onori

**Feedback:** [GitHub Issues](https://github.com/somerandomdude/design-system-documentation-schema/issues)

---

## Abstract

This document defines a standard, machine-readable format for design system documentation. The format covers six entity types: **components**, **design tokens** (including hierarchical token groups), **themes**, **styles**, and **patterns**. Its purpose is to establish a portable, tool-agnostic structure that enables software to create, edit, validate, and display design system documentation consistently.

All structured documentation — best practices, anatomy, API specifications, variants, states, accessibility specs, use cases, examples, design specifications, principles, scales, motion definitions, content guidelines, and interactions — is expressed through a unified **guidelines** system. Each guideline is a typed container with a `type` discriminator. Artifact types accept only the guideline types relevant to them: component guidelines accept component-specific and general types, pattern guidelines accept pattern-specific and general types, and so on.

This specification is complementary to the [W3C Design Tokens Format Module](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/). Where the Design Tokens Format Module defines the interchange format for token _values_, DSDS defines the interchange format for the _documentation_ that surrounds components, tokens, styles, and patterns.

## Status of This Document

This is a draft specification and is subject to change. It has not been endorsed by any standards body. Feedback and contributions are welcome via GitHub.

---

## Schema Architecture

The DSDS schema is organized into three directories plus a root schema:

| Directory | Contents |
|---|---|
| `common/` | Shared primitives used across all schemas — richText, statusObject, link, example, extensions, metadata, useCases |
| `entities/` | Artifact type schemas — component, token (including tokenGroup), theme, style, pattern |
| `guidelines/` | Guideline type schemas — best-practice, anatomy, api, variant, state, design-specifications, accessibility, purpose, scale, principle, motion, content, interaction, plus the scoped union (guideline.schema.json) |

```
spec/schema/
├── dsds.schema.json                    # Root document schema
├── dsds.bundled.schema.json            # Auto-generated single-file bundle
├── common/                             # Shared primitives
│   ├── example.schema.json             # example, examples (guideline container), presentations
│   ├── extensions.schema.json          # $extensions
│   ├── link.schema.json                # link (external resources + internal artifact references)
│   ├── metadata.schema.json            # metadata
│   ├── rich-text.schema.json           # richText
│   ├── purpose.schema.json             # purpose, useCase
│   └── status.schema.json              # statusValue, statusObject, platformStatus
├── entities/                           # Artifact types
│   ├── component.schema.json           # component
│   ├── pattern.schema.json             # pattern
│   ├── style.schema.json               # style
│   ├── theme.schema.json               # theme, tokenOverride
│   └── token.schema.json               # token, tokenGroup, tokenValue, tokenApi
└── guidelines/                         # Guideline types
    ├── guideline.schema.json           # Scoped unions: componentGuideline, styleGuideline, etc.
    ├── accessibility.schema.json       # accessibility, keyboardInteraction, ariaAttribute, colorContrast
    ├── anatomy.schema.json             # anatomy, anatomyEntry
    ├── api.schema.json                 # api, apiProperty, apiEvent, apiSlot, etc.
    ├── best-practice.schema.json       # bestPractices, bestPracticeEntry
    ├── content.schema.json             # content, contentLabelEntry, localizationEntry
    ├── design-specifications.schema.json # designSpecifications, spacingSpec, sizingSpec, etc.
    ├── interaction.schema.json         # interactions, interactionEntry
    ├── motion.schema.json              # motion, motionEntry, motionDuration
    ├── principle.schema.json           # principles, principleEntry
    ├── scale.schema.json               # scale, scaleStep
    ├── state.schema.json               # states, stateEntry
    └── variant.schema.json             # variants, variantEntry, variantValue, variantExclusion
```

---

## Document Structure

A DSDS file is a JSON object with a `dsdsVersion` string and a `documentation` array. Each documentation group is a named collection containing one or more typed artifacts.

### Root Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `$schema` | `string` | No | URI reference to the DSDS JSON Schema for validation. |
| `dsdsVersion` | `string` | Yes | The version of this specification the document conforms to. _MUST_ be `"0.1"` for this version. |
| `metadata` | `object` | No | System-level metadata about the design system. See [Metadata](#metadata). |
| `purpose` | `object` | No | System-level purpose describing what the design system is for and when to adopt it. See [Root Purpose](#root-purpose). |
| `bestPractices` | `array` | No | System-level best practices that apply across the entire design system. See [Root Best Practices](#root-best-practices). |
| `documentation` | `array` | Yes | One or more documentation groups. See [Documentation Groups](#documentation-groups). |
| `extends` | `object` | No | Declares that this document extends another DSDS document — typically a core design system. See [Extends](#extends). |
| `$extensions` | `object` | No | Vendor-specific extensions. See [Extensions](#extensions). |

### Documentation Groups

Each entry in `documentation` is a named collection of typed entities. Entities of different types can be mixed freely in a single `items` array — there is no need to separate components from tokens from styles. Each entity identifies itself via a `type` discriminator property.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Human-readable name of the collection (e.g., `"Acme Design System"`, `"Color Foundations"`, `"Button Documentation"`). |
| `description` | `richText` | No | Description of the collection. |
| `items` | `array` | Yes | One or more typed entities. Each item is a component, token, token-group, theme, style, or pattern identified by its `type` property. Entities of different types can be mixed in any order. |
| `$extensions` | `object` | No | Vendor-specific extensions. |

### Entity Type Discriminators

Every entity in the `items` array carries a `type` property that identifies what kind of entity it is. The `type` is a required string const on every entity schema.

| `type` value | Entity | Defined in |
|---|---|---|
| `"component"` | A reusable UI component | `entities/component.schema.json` |
| `"token"` | A single design token | `entities/token.schema.json` |
| `"token-group"` | A hierarchical group of related tokens (recursive) | `entities/token.schema.json` |
| `"theme"` | A named set of token value overrides | `entities/theme.schema.json` |
| `"style"` | A macro-level visual style (foundation) | `entities/style.schema.json` |
| `"pattern"` | A broad interaction pattern | `entities/pattern.schema.json` |

This discriminated union model means a documentation group can contain any mix of entity types in a single flat array:

```json
{
  "name": "Acme Design System",
  "items": [
    { "type": "token", "name": "color-text-primary", "..." },
    { "type": "token-group", "name": "color-palette", "..." },
    { "type": "theme", "name": "dark", "..." },
    { "type": "style", "name": "spacing", "..." },
    { "type": "component", "name": "button", "..." },
    { "type": "pattern", "name": "empty-state", "..." }
  ]
}
```

### Metadata

| Property | Type | Required | Description |
|---|---|---|---|
| `systemName` | `string` | Yes | The name of the design system (e.g., "Carbon", "Gestalt", "Spectrum"). |
| `systemVersion` | `string` | No | The version of the design system. |
| `organization` | `string` | No | The organization that maintains the system. |
| `url` | `string` | No | URL to the system's documentation site. |
| `license` | `string` | No | SPDX license identifier or license URL. |

### Root Purpose

The optional `purpose` property on the root document describes what the design system is for, who it serves, and when teams should or should not adopt it. This is a **system-level** property — it applies to the design system as a whole, not to individual entities.

| Property | Type | Required | Description |
|---|---|---|---|
| `description` | `richText` | No | A high-level description of the design system's purpose and goals. |
| `useCases` | `array` | No | An array of use-case entries describing positive and negative adoption scenarios. |

Each use-case entry has the following shape:

| Property | Type | Required | Description |
|---|---|---|---|
| `description` | `richText` | Yes | The scenario being described. |
| `kind` | `string` | Yes | `"positive"` (when the system is the right choice) or `"negative"` (when it is not). |
| `alternative` | `object` | No | For negative entries, a recommended alternative with `name` and `rationale`. |

```json
{
  "purpose": {
    "description": "Acme DS provides a unified component library for all customer-facing web products.",
    "useCases": [
      {
        "description": "Building a new customer-facing web application on the Acme platform.",
        "kind": "positive"
      },
      {
        "description": "Building internal tooling with specialized data-heavy dashboards.",
        "kind": "negative",
        "alternative": {
          "name": "Acme Admin Kit",
          "rationale": "Admin Kit is optimized for data-dense internal interfaces."
        }
      }
    ]
  }
}
```

### Root Best Practices

The optional `bestPractices` property on the root document defines cross-cutting rules that apply to the entire design system — not to any single entity. These are system-wide conventions like "always use semantic tokens" or "test all components at 200% zoom."

Each entry in the `bestPractices` array has the following shape:

| Property | Type | Required | Description |
|---|---|---|---|
| `guidance` | `richText` | Yes | The actionable guidance statement. MUST be concrete and unambiguous. |
| `rationale` | `richText` | Yes | Why this guidance exists. MUST NOT be a restatement of the guidance. |
| `kind` | `string` | No | Enforcement level: `"required"`, `"encouraged"`, `"informational"`, `"discouraged"`, `"prohibited"`. Uses the same RFC 2119 alignment as entity-level best practice entries. |
| `category` | `string` | No | Discipline grouping (e.g., `"visual-design"`, `"accessibility"`, `"development"`). |
| `criteria` | `array` | No | URLs to external standards. Each entry has `url` and `label`. |

```json
{
  "bestPractices": [
    {
      "guidance": "Always use semantic tokens instead of raw color values.",
      "rationale": "Semantic tokens ensure consistent theming and make future design changes non-breaking.",
      "kind": "required",
      "category": "development"
    },
    {
      "guidance": "Test all components at 200% browser zoom.",
      "rationale": "WCAG 1.4.4 requires content to remain functional at 200% zoom.",
      "kind": "required",
      "category": "accessibility",
      "criteria": [
        {
          "url": "https://www.w3.org/TR/WCAG22/#resize-text",
          "label": "WCAG 1.4.4 Resize Text"
        }
      ]
    },
    {
      "guidance": "Do not override token values at the component level.",
      "rationale": "Component-level overrides break theme consistency and make system-wide updates unreliable.",
      "kind": "prohibited",
      "category": "development"
    }
  ]
}
```

> **System-level vs. entity-level:** The root `purpose` and `bestPractices` properties describe the design system _as a whole_. They are distinct from the entity-level `purpose` and `best-practices` guideline types that live inside each entity's `guidelines` array. Entity-level guidelines describe when and how to use a specific component, token, or pattern; system-level properties describe when and how to use the design system itself. Both levels follow the same structural conventions but serve different audiences and scopes.

---

## Entity Types

Every entity shares a common set of identity and metadata properties, plus a `guidelines` array for all structured documentation. The `guidelines` array accepts only the guideline types appropriate for that entity type. Every entity also carries a required `type` discriminator (see [Entity Type Discriminators](#entity-type-discriminators) above).

### Common Entity Properties

The following properties are available on all entity types. **Required** fields differ by entity type — see the notes column and the individual entity sections below.

| Property | Type | Required | Notes |
|---|---|---|---|
| `type` | `string` | Yes | Entity type discriminator. |
| `name` | `string` | Yes | Machine-readable identifier. Components, styles, patterns, and themes enforce `^[a-z][a-z0-9-]*$`. Token and token group names are intentionally unconstrained (see [Token Name Exception](#token-name-exception)). |
| `displayName` | `string` | Varies | Human-readable name. Required on component, style, pattern, theme. **Not present** on token or token-group — the token name serves as the display name. |
| `summary` | `string` | No | One-line plain-text summary for compact display. MUST NOT contain markup. |
| `description` | `richText` | Varies | Description with CommonMark support. Required on component, style, pattern, theme. **Optional** on token and token-group. |
| `status` | `statusObject` | Varies | Lifecycle status with optional per-platform readiness. Required on component, style, pattern, theme. **Optional** on token and token-group — when omitted inside a group, inherited from the parent. |
| `since` | `string` | No | The version in which this artifact was introduced. |
| `tags` | `string[]` | No | Freeform keywords for categorization and search. |
| `aliases` | `string[]` | No | Alternative names for search, migration mapping, and cross-referencing. |
| `category` | `string` | No | Classification within the system's taxonomy. |
| `guidelines` | `array` | No | Typed guideline objects. See [Guidelines](#guidelines). |
| `links` | `array` | No | Typed references to external resources and internal artifacts. See [Links](#links). |
| `extends` | `entityExtends` | No | Declares that this entity extends a base entity in a parent system. Available on component and token entities. See [Extends](#extends). |
| `$extensions` | `object` | No | Vendor-specific extensions. See [Extensions](#extensions). |

### Component

A reusable UI element. Accepts **component-scoped guidelines** (anatomy, api, variants, states, design-specifications) and all general guidelines.

Required properties: `type`, `name`, `displayName`, `description`, `status`.

### Token

A single design token. Accepts **general guidelines** only.

Required properties: `type`, `name`, `tokenType`.

Additional properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `tokenType` | `string` | Yes | DTCG-aligned token type (e.g., `"color"`, `"dimension"`, `"fontFamily"`, `"fontWeight"`, `"duration"`, `"cubicBezier"`, `"shadow"`). |
| `value` | `tokenValue` | No | Displayable representation of the token's value. See [Token Value](#token-value). |
| `api` | `tokenApi` | No | Platform-specific identifiers. See [Token API](#token-api). |
| `category` | `string` | No | Semantic category: `"base"`, `"semantic"`, `"component"`. Custom values permitted. |

The `displayName` property is intentionally absent from tokens. The token name itself serves as the human-readable display name, since token naming conventions (dots, slashes, kebab-case) are already human-readable in their native format.

The `description` and `status` properties are optional on tokens to reduce verbosity at scale. When omitted inside a token group, `status` is inherited from the parent group.

### Token Group

A hierarchical group of related tokens. The `children` array can contain token objects, nested token group objects, or a mix of both — forming an arbitrarily deep recursive hierarchy. Accepts **general guidelines** only.

Required properties: `type`, `name`.

Additional properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `tokenType` | `string` | No | Inherited default for children that omit their own `tokenType`. |
| `category` | `string` | No | Inherited default for children that omit their own `category`. |
| `children` | `array` | No | Recursive array of tokens and/or nested token groups. |

Like tokens, `displayName`, `description`, and `status` are optional. Children inherit `tokenType`, `category`, and `status` from the parent group when they omit their own values.

### Theme

A named set of token value overrides that adapt the system to a specific context (color mode, density, brand variant). Accepts **general guidelines**.

Required properties: `type`, `name`, `displayName`, `description`, `status`, `overrides`.

Additional properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `overrides` | `tokenOverride[]` | Yes | Array of token name → value mappings. Only tokens that differ from the default need to be listed. |

Each `tokenOverride` has two required properties: `token` (the token name to override) and `value` (a `tokenValue` object with the theme-specific resolved value and/or alias reference).

### Style

A macro-level visual style (foundation) governing a domain like color, typography, spacing, elevation, motion, or content. Accepts **style-scoped guidelines** (principles, scale, motion) and all general guidelines.

Required properties: `type`, `name`, `displayName`, `description`, `status`.

Styles are the entity type for documenting foundations — not just visual attributes like color and spacing, but also cross-cutting concerns like accessibility guidelines, motion systems, and content rules. The `category` property classifies the domain (e.g., `"color"`, `"typography"`, `"spacing"`, `"motion"`, `"accessibility"`, `"content"`).

### Pattern

A broad interaction pattern — a recurring, multi-component solution to a common UX problem. Accepts **pattern-scoped guidelines** (interactions) and **shared structural guidelines** (anatomy, variants, states) as well as all general guidelines.

Required properties: `type`, `name`, `displayName`, `description`, `status`.

Patterns reference their participating components through the `links` array (with `type: "component"`, `name`, and `role`) rather than through a dedicated guideline type.

---

## Token Value

The `tokenValue` object is a displayable representation of a token's value for documentation tools. It is **not** the authoritative source of truth — the W3C Design Tokens Format file is.

| Property | Type | Required | Description |
|---|---|---|---|
| `resolved` | `string` | No | The resolved value as a human-readable string (e.g., `"#1a1a1a"`, `"16px"`, `"400"`). |
| `reference` | `string` | No | If this token is an alias, the name of the referenced token (e.g., `"color.neutral.900"`). Corresponds to the W3C DTCG concept of an alias/reference (§3.8, §7). |
| `resolution` | `string` | No | How the value was derived: `"explicit"` (direct value, not an alias) or `"alias"` (value references another token). When omitted, tools SHOULD infer: if `reference` is present, the token is an alias; otherwise it is explicit. Terminology is aligned with the W3C Design Tokens Format Module (§3.8 "Alias/Reference", §7 "Aliases/References"). |
| `dtcgFile` | `string` | No | URI or relative path to the DTCG file containing the authoritative value. |

## Token API

The `tokenApi` object maps platform names to identifier strings. Keys are platform names (e.g., `"cssCustomProperty"`, `"scssVariable"`, `"jsConstant"`, `"iosToken"`, `"androidToken"`, `"designToolVariable"`). Values are the identifier strings for that platform. Additional platforms can be added without schema changes.

---

## Status

The `statusObject` consolidates lifecycle status, per-platform readiness, and deprecation notices into a single object. Every entity that carries status uses this object rather than a bare string.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `statusValue` | Yes | Overall lifecycle status. See [Status Values](#status-values). |
| `platformStatus` | `object` | No | Platform-specific readiness. Keys are platform identifiers (e.g., `"react"`, `"ios"`, `"figma"`). Values are platform status entries. |
| `deprecationNotice` | `string` | Conditional | Required when status is `"deprecated"`. MUST explain what to use instead. |

### Status Values

Status values MUST be lowercase kebab-case (pattern: `^[a-z][a-z0-9-]*$`). The four standard values are:

| Value | Meaning |
|---|---|
| `draft` | Under development, not ready for use. |
| `experimental` | Available but API may change without notice. |
| `stable` | Production-ready, changes follow semver. |
| `deprecated` | Scheduled for removal. `deprecationNotice` is required. |

Custom values are permitted (e.g., `"sunset"`, `"archived"`, `"beta"`) and MUST follow the same pattern.

### Platform Status Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `statusValue` | Yes | Lifecycle status on this platform. |
| `since` | `string` | No | Version available on this platform. |
| `deprecationNotice` | `string` | Conditional | Required when status is `"deprecated"`. |
| `description` | `string` | No | Notes about this platform's status. |

---

## Guidelines

Guidelines are the fundamental unit of structured documentation in DSDS. Every piece of documentation attached to an entity — best practices, anatomy breakdowns, API specifications, variant definitions, state descriptions, accessibility specs, use cases, examples, design specifications, principles, scales, motion definitions, content guidelines, and interactions — is a guideline object with a `type` discriminator.

### Scoped Guideline Unions

Each entity type accepts only the guideline types relevant to it. The scoping follows this rationale:

- **Components** get full structural documentation — they are rendered UI elements with code-level interfaces, visual anatomy, configurable dimensions, interactive states, and measurable design specifications.
- **Patterns** get structural documentation without code-level details — they have visual layouts (anatomy), sub-types (variants), and states, but they are not single-component code interfaces. They do not accept `api` or `design-specifications`.
- **Styles** get domain-level documentation — they govern a visual or cross-cutting domain through guiding principles, constrained value progressions (scales), and motion definitions.
- **Tokens** get only general guidelines — they are atomic values with usage guidance but no visual structure or interaction behavior.

| Scope | Used by | Accepts |
|---|---|---|
| **Component** | component | anatomy, api, variants, states, design-specifications + general |
| **Pattern** | pattern | interactions, anatomy, variants, states + general |
| **Style** | style | principles, scale, motion + general |
| **Token** | token, token-group, theme | general only |

**General** (available on all entity types): best-practices, purpose, accessibility, examples, content.

### Guideline Types

| Type value | Container property | Item type | Scope | Description |
|---|---|---|---|---|
| `"best-practices"` | `items` | bestPracticeEntry | General | Actionable usage rules with rationale and enforcement levels. |
| `"purpose"` | `useCases` | useCases (whenToUse/whenNotToUse) | General | Scenario-driven guidance for when to use and when not to use an artifact. |
| `"accessibility"` | Named properties | various | General | Structured a11y specs — keyboard, ARIA, screen reader, contrast, motion. |
| `"examples"` | `items` | example | General | Visual/interactive demonstrations — images, videos, code, URLs, values. |
| `"content"` | `labels`, `localization` | contentLabelEntry, localizationEntry | General | Recommended action labels and localization/i18n considerations. |
| `"anatomy"` | `parts` | anatomyEntry | Component, Pattern | Visual structure decomposed into named parts with token references. |
| `"api"` | Named arrays | various | Component | Code-level interface — props, events, slots, CSS hooks, methods. |
| `"variants"` | `items` | variantEntry | Component, Pattern | Dimensions of variation with enumerated values. Optional exclusions. |
| `"states"` | `items` | stateEntry | Component, Pattern | Interactive states with triggers, token overrides, and previews. |
| `"design-specifications"` | Named properties | various | Component | Token inventory, spacing, sizing, typography, responsive behavior. |
| `"principles"` | `items` | principleEntry | Style | High-level guiding beliefs that shape decision-making. |
| `"scale"` | `steps` | scaleStep | Style | Ordered progression of token values (spacing scale, type scale, etc.). |
| `"motion"` | `items` | motionEntry | Style | Named easing curves with cubic-bezier functions and recommended durations. |
| `"interactions"` | `items` | interactionEntry | Pattern | Ordered steps in a pattern's interaction flow. |

---

## General Guidelines

These guideline types are available on **all** entity types.

### Best Practices (`best-practices`)

Documents actionable usage rules for an artifact. Each item is a self-contained rule pairing an actionable guidance statement with a rationale explaining why. Best practices tell the reader _how_ to use the artifact correctly after they have chosen it. For guidance on _whether_ to use the artifact at all, see [Purpose](#purpose-purpose).

#### Best Practice Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `guidance` | `richText` | Yes | The actionable guidance statement. MUST be concrete and unambiguous. |
| `rationale` | `richText` | Yes | Why this guidance exists. MUST NOT be a restatement of the guidance. |
| `level` | `string` | No | Enforcement level: `"required"`, `"encouraged"`, `"informational"`, `"discouraged"`, `"prohibited"`. When omitted, consumers MAY treat as `"encouraged"`. |
| `category` | `string` | No | Discipline grouping (e.g., `"visual-design"`, `"accessibility"`, `"content"`, `"interaction"`, `"motion"`, `"development"`). |
| `target` | `string` | No | Anatomy part this applies to (e.g., `"label"`, `"icon"`). When omitted, applies to the artifact as a whole. |
| `criteria` | `string[]` | No | URLs to external standards (e.g., WCAG success criteria). |
| `examples` | `example[]` | No | Examples illustrating encouraged and discouraged approaches. |
| `tags` | `string[]` | No | Freeform keywords. |

Enforcement levels align with RFC 2119 requirement levels:

| Level | RFC 2119 | Meaning |
|---|---|---|
| `required` | MUST | Non-compliance is a defect. |
| `encouraged` | SHOULD | Follow in most cases; exceptions require justification. |
| `informational` | MAY | Advisory context with no enforcement expectation. |
| `discouraged` | SHOULD NOT | Avoid unless justified. |
| `prohibited` | MUST NOT | Violations are defects. |

### Purpose (`purpose`)

Documents what an artifact is used for — the concrete scenarios in which it is the right choice and the scenarios in which a different artifact would be more appropriate. Purpose guidelines help the reader decide _whether_ to reach for this artifact before they start implementing it.

The purpose guideline wraps the common `useCases` data model with a `type` discriminator:

```json
{
  "type": "purpose",
  "useCases": {
    "whenToUse": [
      { "description": "When the user needs to trigger an action such as submitting a form." }
    ],
    "whenNotToUse": [
      {
        "description": "When the action navigates to a different page.",
        "alternative": {
          "name": "link",
          "rationale": "Links carry native navigation semantics."
        }
      }
    ]
  }
}
```

This follows the same `useCases` shape used by variant values and state entries (see [Use Cases](#use-cases)).

### Accessibility (`accessibility`)

Documents structured accessibility specifications — keyboard interactions, ARIA attributes, screen reader behavior, focus management, color contrast pairs, and motion considerations. This guideline type captures _machine-readable specifications_. For actionable accessibility _rules_ with rationale (e.g., "Provide an aria-label for icon-only buttons"), use a best-practice entry with `category: "accessibility"` instead.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `"accessibility"` | Yes | Discriminator. |
| `wcagLevel` | `string` | No | Minimum WCAG conformance level: `"A"`, `"AA"`, `"AAA"`. |
| `keyboardInteraction` | `keyboardInteraction[]` | No | Key/action pairs. Each entry has `key`, `action`, and optional `context`. |
| `ariaAttributes` | `ariaAttribute[]` | No | ARIA attribute documentation. Each entry has `attribute`, `value`, `description`, `required`. |
| `screenReaderBehavior` | `richText` | No | How the artifact is announced by screen readers. |
| `focusManagement` | `richText` | No | How focus moves into, within, and out of the artifact. |
| `colorContrast` | `colorContrast[]` | No | Measured contrast ratios for foreground/background pairs. Each entry has `foreground`, `background`, `contrastRatio`, `level`, and optional `context`. |
| `motionConsiderations` | `richText` | No | How the artifact respects `prefers-reduced-motion`. |

### Examples (`examples`)

Documents visual or interactive demonstrations of an artifact. Each item is a single demonstration — a static image, a video recording, a code snippet, a URL to a live demo, or a literal value.

Each `example` requires at least a `presentation` or a `value` (or both):

- **Presentation**: A visual or interactive demonstration — one of `presentationImage`, `presentationVideo`, `presentationCode`, or `presentationUrl`.
- **Value**: A literal value for API property examples (e.g., `"primary"`, `44`, `true`). When provided without a presentation, the example represents a concrete data point.

Optional `title` and `description` provide context.

### Content (`content`)

Documents structured content guidelines — recommended action labels and localization/internationalization considerations. Content guidelines complement best-practice guidelines: best practices say "Use sentence case" (a _rule_), content guidelines say "Add: Takes an existing object and uses it in a new context" (a _reference_).

At least one of `labels` or `localization` must be present.

#### Content Label Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `term` | `string` | Yes | The canonical label text (e.g., `"Add"`, `"Cancel"`, `"Delete"`). |
| `definition` | `richText` | Yes | What this label means — the action it represents. |
| `usage` | `richText` | No | When and how to use this label. |
| `alternatives` | `string[]` | No | Related terms commonly confused with this one (e.g., Add lists `["Create", "Insert", "New"]`). |
| `context` | `string` | No | Where this label is commonly used (e.g., `"Buttons in dialogs"`, `"Toolbar actions"`). |
| `examples` | `example[]` | No | Visual examples showing the label in context. |

#### Localization Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `concern` | `string` | Yes | The i18n concern: `"rtl"`, `"text-expansion"`, `"pluralization"`, `"concatenation"`, `"date-format"`, `"number-format"`, `"currency"`, `"icon-direction"`, `"truncation"`, `"sorting"`. Custom values permitted. |
| `description` | `richText` | Yes | Actionable guidance for this concern. |
| `examples` | `example[]` | No | Visual examples illustrating the concern. |

---

## Component-Scoped Guidelines

These guideline types are only accepted on **component** entities.

### Anatomy (`anatomy`)

Documents the visual structure of a component or pattern by enumerating its named sub-elements (parts). Each part can reference the design tokens that style it, creating a bridge between the artifact's visual design and its token architecture.

For components, parts represent rendered UI sub-elements (container, label, icon, focus-ring). For patterns, parts represent the structural sections of the pattern's visual layout (image, title, body, primary action).

#### Anatomy Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable part name (e.g., `"container"`, `"label"`). |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `richText` | Yes | What this part is and any constraints. |
| `required` | `boolean` | Yes | Whether this part is always present in the rendered output. |
| `tokens` | `object` | No | Token map: keys are purposes (e.g., `"background"`, `"text-color"`), values are token names (e.g., `"color-action-primary"`). Same format as variant and state token references. |
| `links` | `link[]` | No | Links to design tool nodes, source code, etc. |

### API (`api`)

Documents the code-level interface of a component on a single platform. For multi-platform components, create one API guideline per platform using the `platform` property.

Sections: `properties` (apiProperty[]), `events` (apiEvent[]), `slots` (apiSlot[]), `cssCustomProperties` (apiCssCustomProperty[]), `cssParts` (apiCssPart[]), `dataAttributes` (apiDataAttribute[]), `methods` (apiMethod[]).

### Variants (`variants`)

Documents all dimensions of visual or behavioral variation. Each item represents a single axis of configuration (e.g., `"size"`, `"emphasis"`, `"full-width"`). Multiple axes document orthogonal dimensions that can be combined independently.

The optional `exclusions` array documents invalid combinations across dimensions:

```json
{
  "type": "variants",
  "items": [
    { "name": "emphasis", "description": "...", "values": [...] },
    { "name": "size", "description": "...", "values": [...] }
  ],
  "exclusions": [
    {
      "conditions": [
        { "dimension": "emphasis", "value": "ghost" },
        { "dimension": "size", "value": "sm" }
      ],
      "description": "Ghost emphasis at small size does not provide adequate visual affordance."
    }
  ]
}
```

Each exclusion requires at least two conditions (a single condition would exclude an entire value, which should be removed from the dimension's values array instead).

#### Variant Value

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable value name. |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `richText` | Yes | What this value looks like and when to use it. |
| `tokens` | `object` | No | Token overrides: keys are purposes, values are token names. |
| `preview` | `example[]` | No | Visual previews. |
| `useCases` | `useCases` | No | When to choose this value over others. |

### States (`states`)

Documents all interactive states — hover, focus, active, disabled, loading, selected, error, etc. — with triggers, token overrides, and previews.

#### State Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable state name. |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `richText` | Yes | Triggers, visual changes, and constraints. |
| `tokens` | `object` | No | Token overrides active in this state. Same map format as variants. |
| `preview` | `example[]` | No | Visual previews. |
| `useCases` | `useCases` | No | When this state is and is not appropriate. |

### Design Specifications (`design-specifications`)

Documents measurable visual specifications — token inventory, spacing relationships, dimension constraints, typography settings, and responsive behavior. At least one section must be present.

| Section | Type | Description |
|---|---|---|
| `properties` | `Record<string, string>` | Open map of design property names to values. Values are token names (e.g., `"button-background"`) or raw CSS values (e.g., `"#0055b3"`, `"16px"`). |
| `spacing` | `spacingSpec` | Internal padding/gaps and external recommended margins. Keys are named relationships (e.g., `"container-horizontal"`, `"icon-to-label"`), values are token names or resolved values. |
| `sizing` | `sizingSpec` | Dimension constraints: `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `aspectRatio`. |
| `typography` | `typographySpec` | Per-element typographic settings. Keys are anatomy part names, values are objects with `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textTransform`, `typeToken`. |
| `responsive` | `responsiveEntry[]` | Breakpoint-specific behavior. Each entry has `breakpoint` and `description`. |
| `variants` | `specVariant[]` | Design properties grouped by variant. Each entry has `name`, `properties`, and optional `spacing`, `sizing`, `typography`. |
| `sizes` | `specSize[]` | Design properties grouped by size. Each entry has `name`, `properties`, and optional `spacing`, `sizing`, `typography`. |
| `states` | `specState[]` | Design properties grouped by interactive state. Each entry has `name`, `properties`, and optional `spacing`, `sizing`, `typography`. |
| `variantStates` | `specVariantState[]` | Design properties for variant×state combinations. Each entry has `variant`, `state`, and `properties`. |

#### Variants, Sizes, and States

The base-level `properties` map defines the default specification — typically the primary variant at medium size in the default state. Values are always strings: either design token names (e.g., `"button-background"`, `"space-4"`) or raw CSS values (e.g., `"#0055b3"`, `"16px"`, `"transparent"`). Systems that do not use tokens simply provide raw values directly.

The `variants` array groups design properties by variant — each entry has a `name` and its own `properties` map, plus optional `spacing`, `sizing`, and `typography` sections. The `sizes` array groups properties by size, including size-specific spacing, sizing, and typography. The `states` array groups properties by interactive state (e.g., hover, focus, disabled).

The `variantStates` array handles variant×state combinations where the state's visual treatment differs across variants. Each entry specifies both a `variant` and a `state` along with the `properties` map for that combination.

Each entry is self-contained — it represents the complete set of values for that condition, not an override of the base properties. For example, a `"danger"` variant entry carries its own token names (like `"button-danger-bg"`) or raw values, independent of the base `properties`.

Note: the `tokens` field on state entries (in the states guideline) serves as a descriptive summary for designers — identifying *which* tokens change in a given state. The authoritative resolved values for each variant × state combination live in the `design-specifications` guideline's `variants`, `states`, and `variantStates` arrays.

---

## Style-Scoped Guidelines

These guideline types are only accepted on **style** entities.

### Principles (`principles`)

Documents high-level guiding principles that shape decision-making for a domain. Principles answer "what do we believe?" and "what constraints do we accept?" — they sit above individual best practices.

Each `principleEntry` has a `title` (short, memorable name) and a `description` (what it means in practice).

### Scale (`scale`)

Documents an ordered sequence of values forming a visual scale — a type scale, spacing scale, elevation scale, or any other progression of design token values.

Each `scaleStep` references a design token and optionally provides a `label`, `value` (display convenience), and `description` (usage notes). Steps are ordered from smallest/lowest to largest/highest.

The scale guideline requires a `name`, `description`, and `steps` array.

### Motion (`motion`)

Documents the motion system — named easing curves, their cubic-bezier timing functions, recommended durations, and usage guidance. Each item represents a single easing definition that designers and engineers select from when adding animation or transitions.

#### Motion Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable easing name (e.g., `"expressive"`, `"enter"`, `"exit"`). |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `richText` | Yes | Visual character, usage context, and UX effect. |
| `function` | `number[4]` | No | Cubic-bezier control points `[P1x, P1y, P2x, P2y]`, aligned with the W3C DTCG `cubicBezier` type (§8.6). |
| `token` | `string` | No | Reference to a DTCG cubicBezier or transition token. |
| `duration` | `motionDuration` | No | Recommended duration range: `min`, `max`, and/or `description`. |
| `usage` | `string` | No | Comma-separated usage contexts (e.g., `"entering elements, snap-to-position"`). |
| `examples` | `example[]` | No | Visual demonstrations. |

---

## Pattern-Scoped Guidelines

These guideline types are only accepted on **pattern** entities (in addition to the shared anatomy, variants, and states guidelines).

### Interactions (`interactions`)

Documents the interaction flow of a pattern as an ordered sequence of steps. The ordering is critical: it represents the chronological flow of the user journey.

#### Interaction Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `trigger` | `string` | No | What initiates this step. When omitted, the step continues the previous flow. |
| `description` | `richText` | Yes | What happens — system response, visual changes, state transitions. |
| `components` | `string[]` | No | Names of components involved. MUST match documented component names. |
| `examples` | `example[]` | No | Visual/interactive illustrations of this step. |

---

## Links

The `links` array provides typed references to external resources and internal DSDS artifact relationships. Links unify what was previously split between external URL references and internal artifact references into a single relationship model.

Every link requires a `type` and at least one of `url` (for external resources) or `name` (for internal DSDS artifact references). Both can be present when an internal artifact also has an addressable URL.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | Category of the link. See below. |
| `url` | `string` | Conditional | URL of the external resource. Required when `name` is not provided. |
| `name` | `string` | Conditional | Name of a referenced DSDS artifact. Required when `url` is not provided. |
| `label` | `string` | No | Display text for the link — what a user sees when it is rendered in documentation. |
| `role` | `string` | No | The functional relationship this artifact has to the current entity — what part it plays in the current context. Distinct from `label`: label names the thing, role describes its function here. |
| `required` | `boolean` | No | Whether this linked artifact is required for the parent entity to function correctly. |

### Standard Link Types

**External resource types:** `"source"`, `"design"`, `"storybook"`, `"documentation"`, `"package"`, `"repository"`.

**Relationship types:** `"alternative"`, `"parent"`, `"child"`, `"related"`.

**Artifact types (for internal references):** `"component"`, `"token"`, `"token-group"`, `"style"`, `"pattern"`, `"theme"`.

Custom values are permitted and SHOULD be lowercase strings matching `^[a-z][a-z0-9-]*$`.

---

## Rich Text

Fields that contain human-written prose use the `richText` type:

- **String form:** A bare JSON string, interpreted as CommonMark for backward compatibility.
- **Object form:** `{ "value": "...", "format": "plain" | "markdown" | "html" }` for explicit format control.

---

## Use Cases

The `useCases` data model provides scenario-driven guidance for when an artifact or option is and is not the right choice. It appears in three contexts:

1. **Purpose guideline** — wrapped with a `type: "purpose"` discriminator to appear in the guidelines array.
2. **Variant values** — inline `useCases` property on each variant value for "when to choose this value."
3. **State entries** — inline `useCases` property on each state entry for "when this state is appropriate."

In all three contexts, the shape is identical:

```json
{
  "whenToUse": [
    { "description": "Scenario description..." }
  ],
  "whenNotToUse": [
    {
      "description": "Scenario description...",
      "alternative": {
        "name": "alternative-artifact",
        "rationale": "Why the alternative is better."
      }
    }
  ]
}
```

Each `whenNotToUse` entry SHOULD include an `alternative` pointing to a more appropriate artifact.

---

## Extends

The `extends` mechanism enables **systems-of-systems** architectures — where an extension design system inherits from a core system. It operates at two levels:

### Document-Level Extends (`documentExtends`)

The root `extends` property declares that the entire DSDS document inherits from another DSDS document. This establishes the parent–child relationship between systems.

| Property | Type | Required | Description |
|---|---|---|---|
| `system` | `string` | Yes | The name or identifier of the base design system being extended (e.g., `"Acme Core Design System"`). |
| `url` | `string` (URI) | No | URL to the base DSDS document. Tooling MAY fetch and resolve the base document for merge operations. |
| `version` | `string` | No | Semver version of the base system this document extends. When omitted, tooling SHOULD resolve to the latest available version. |
| `description` | `richText` | No | Description of the relationship — what this extension adds, changes, or specializes. |

```json
{
  "extends": {
    "system": "Acme Core Design System",
    "url": "https://design.acme.com/v2/core.dsds.json",
    "version": "2.0.0",
    "description": "Adds enterprise-specific components, stricter accessibility requirements, and product-specific token overrides."
  }
}
```

### Entity-Level Extends (`entityExtends`)

Individual entities (components, tokens) can declare that they extend a base entity from a parent system. This is available on the `component` and `token` entity types.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The name of the base entity being extended. MUST match the `name` property of the base entity in the parent system. |
| `system` | `string` | No | The owning system of the base entity. When omitted, resolved from the document-level `extends.system`. |
| `url` | `string` (URI) | No | Direct URL to the base entity's documentation or DSDS definition. |
| `version` | `string` | No | Version of the base entity or system. When omitted, inherits from the document-level `extends.version`. |
| `description` | `richText` | No | Description of what this entity adds or changes relative to the base. |
| `modifications` | `array` | No | A human-readable changelog of modifications relative to the base entity. |

Each entry in `modifications` has the following shape:

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | `"added"`, `"modified"`, `"removed"`, or `"inherited"`. |
| `target` | `string` | No | What was modified — a property name, guideline kind, variant name, etc. (e.g., `"variant:enterprise"`, `"prop:theme"`, `"guideline:accessibility"`). |
| `description` | `richText` | Yes | A human-readable description of the modification. |

```json
{
  "kind": "component",
  "name": "button",
  "extends": {
    "name": "button",
    "system": "Acme Core Design System",
    "version": "2.0.0",
    "description": "Adds an 'enterprise' variant and a 'theme' prop for sub-brand theming.",
    "modifications": [
      { "type": "added", "target": "variant:enterprise", "description": "High-emphasis variant using enterprise brand color." },
      { "type": "added", "target": "prop:theme", "description": "Prop accepting 'default' or 'admin' for sub-brand palette switching." },
      { "type": "inherited", "target": "guideline:anatomy", "description": "Anatomy inherited from core without changes." }
    ]
  },
  "displayName": "Button",
  "description": "Enterprise Button extends core Button with additional variants and props.",
  "status": "stable"
}
```

> **Merge semantics are tooling's responsibility.** The `extends` declaration establishes the _relationship_ between systems and entities. How properties, guidelines, and tokens are merged, overridden, or inherited is determined by consuming tooling — the schema does not prescribe resolution rules. The `modifications` array provides a human-readable changelog that tooling MAY use for diff views, migration guides, or documentation generation.

See [`examples/extension-system.dsds.json`](examples/extension-system.dsds.json) for a complete enterprise extension system demonstrating both document-level and entity-level extends with modifications.

---

## Extensions

The `$extensions` property is available on the root document, on each documentation group, and on each entity. Keys MUST use vendor-specific namespaces (reverse domain name notation recommended). Tools that do not recognize an extension MUST preserve it. Extension data SHOULD NOT duplicate information available in core schema fields.

```json
{
  "$extensions": {
    "com.designTool": {
      "componentId": "1234:5678"
    },
    "com.storybook": {
      "storyId": "components-button--primary"
    }
  }
}
```

---

## Naming Conventions

### Token Name Exception

Most entity types enforce a strict `^[a-z][a-z0-9-]*$` pattern on the `name` property. Tokens and token groups are the intentional exception — their names are unconstrained to accommodate the naming conventions used by the W3C Design Tokens Format Module, design tool variable systems, and existing token architectures that use dots (`color.text.primary`), slashes (`color/text/primary`), or other separators. Token names _SHOULD_ still be lowercase and human-readable, but the schema does not enforce a pattern.

### Guideline Type Naming

Guideline type values follow two naming patterns based on their structural role:

- **Plural names** for guideline types that wrap a homogeneous list of items in an `items` array: `"best-practices"`, `"variants"`, `"states"`, `"principles"`, `"interactions"`, `"examples"`, `"motion"`, `"content"`.
- **Singular names** for guideline types that are self-contained entities with their own internal structure: `"scale"` (has `name`, `steps`), `"anatomy"` (has `parts`), `"api"` (has `properties`, `events`, etc.), `"accessibility"` (has `keyboardInteraction`, `ariaAttributes`, etc.), `"design-specifications"` (has `tokens`, `spacing`, etc.), `"purpose"` (has `useCases`).

The distinction: plural types are containers of interchangeable items where the container itself has no identity beyond its type. Singular types have meaningful internal structure where the properties are named and semantically distinct.

---

## Companion Files

| File | Description |
|---|---|
| [`schema/dsds.schema.json`](schema/dsds.schema.json) | JSON Schema for validating DSDS documents. |
| [`schema/dsds.bundled.schema.json`](schema/dsds.bundled.schema.json) | Single-file bundled version (auto-generated). |
| [`examples/starter-kit.dsds.json`](examples/starter-kit.dsds.json) | Starter kit with components, tokens, a style, and a pattern. |
| [`examples/minimal/`](examples/minimal/) | Minimal examples showing the floor of documentation for each entity type. |
| [`examples/entities/component.json`](examples/entities/component.json) | Complete component documentation (Button). |
| [`examples/entities/token.json`](examples/entities/token.json) | Token documentation with value, API, and resolution examples. |
| [`examples/entities/token-group.json`](examples/entities/token-group.json) | Hierarchical token group (color palette). |
| [`examples/entities/theme.json`](examples/entities/theme.json) | Dark mode theme with token overrides. |
| [`examples/entities/style.json`](examples/entities/style.json) | Style documentation (Spacing) with scale, motion, and best practices. |
| [`examples/entities/pattern.json`](examples/entities/pattern.json) | Pattern documentation (Error Messaging). |
| [`examples/entities/empty-state-pattern.json`](examples/entities/empty-state-pattern.json) | Pattern documentation (Empty State) with anatomy, variants, states, interactions, and content. |
| [`examples/extension-system.dsds.json`](examples/extension-system.dsds.json) | Enterprise extension system demonstrating document-level and entity-level `extends` with modifications. |

---

## Conformance Levels

| Level | Requirement |
|---|---|
| **Level 1: Core** | Identity fields only. For tokens: `type`, `name`, `tokenType`. For all others: `type`, `name`, `displayName`, `description`, `status` (+ `overrides` for themes). |
| **Level 2: Complete** | Level 1 + at least one substantive guideline (anatomy/api/variants for components, principles/scale for styles, interactions for patterns, best-practices/purpose for tokens). |

---

## Design Principles

_This section is non-normative._

1. **Documentation is a product.** It deserves the same rigor as the components it describes.
2. **Structure enables quality.** A defined format creates a floor of quality and completeness.
3. **Guidance without justification is incomplete.** Every recommendation must answer "why?"
4. **Documentation should be portable.** A standard format makes migration tractable.
5. **Education is a responsibility.** Explain _what_, _why_, and _how_.
6. **Specificity over subjectivity.** "Use sparingly" is not guidance. "Limit to one per surface" is.

---

*End of specification. See the schema files in `spec/schema/` for the normative JSON Schema definitions and the examples in `spec/examples/` for complete, validated demonstrations of each entity and guideline type.*
