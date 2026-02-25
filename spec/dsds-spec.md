# Design System Documentation Standard (DSDS) 0.1

**Draft Specification — February 2026**

**Latest version:** https://github.com/somerandomdude/design-system-documentation-schema

**Editors:**
- PJ Onori

**Feedback:** [GitHub Issues](https://github.com/pjonori/design-system-documentation-schema/issues)

---

## Abstract

This document defines a standard, machine-readable format for design system documentation. The format covers five entity types: **components**, **design tokens** (including hierarchical token groups), **themes**, **styles**, and **patterns**. Its purpose is to establish a portable, tool-agnostic structure that enables software to create, edit, validate, and display design system documentation consistently.

All structured documentation — best practices, anatomy, API specifications, variants, states, accessibility specs, use cases, examples, design specifications, principles, scales, interactions, and artifact references — is expressed through a unified **guidelines** system. Each guideline is a typed container that holds an array of atomic items. Artifact types accept only the guideline types relevant to them: component guidelines accept component-specific and general types, style guidelines accept style-specific and general types, and so on.

This specification is complementary to the [W3C Design Tokens Format Module](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/). Where the Design Tokens Format Module defines the interchange format for token _values_, DSDS defines the interchange format for the _documentation_ that surrounds components, tokens, styles, and patterns.

## Status of This Document

This is a draft specification and is subject to change. It has not been endorsed by any standards body. Feedback and contributions are welcome via GitHub.

---

## Schema Architecture

The DSDS schema is organized into three directories plus a root schema:

| Directory | Contents |
|---|---|
| `common/` | Shared primitives used across all schemas — richText, statusObject, link, example, extensions, metadata |
| `entities/` | Artifact type schemas — component, token (including tokenGroup), theme, style, pattern |
| `guidelines/` | Guideline type schemas — best-practice, anatomy, api, variant, state, design-specifications, accessibility, purpose, scale, principle, interaction, artifact-reference, plus the scoped union (guideline.schema.json) |

```
spec/schema/
├── dsds.schema.json                    # Root document schema
├── dsds.bundled.schema.json            # Auto-generated single-file bundle
├── common/                             # Shared primitives
│   ├── example.schema.json             # example, examples (guideline container), presentations
│   ├── extensions.schema.json          # $extensions
│   ├── link.schema.json                # link
│   ├── metadata.schema.json            # metadata
│   ├── rich-text.schema.json           # richText
│   └── status.schema.json              # statusValue, statusObject, platformStatusEntry
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
    ├── artifact-reference.schema.json  # artifactReference, artifactReferenceEntry
    ├── best-practice.schema.json       # bestPractices, bestPracticeEntry
    ├── design-specifications.schema.json # designSpecifications, responsiveEntry
    ├── interaction.schema.json         # interactions, interactionEntry
    ├── principle.schema.json           # principles, principleEntry
    ├── scale.schema.json               # scale, scaleStep
    ├── state.schema.json               # states, stateEntry
    ├── purpose.schema.json           # useCases, useCase, inlineUseCases
    └── variant.schema.json             # variants, variantEntry, variantValue
```

---

## Document Structure

A DSDS file is a JSON object with a `dsdsVersion` string and a `documentation` array. Each documentation group is a named collection containing one or more arrays of typed artifacts.

### Root Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `$schema` | `string` | No | URI reference to the DSDS JSON Schema for validation. |
| `dsdsVersion` | `string` | Yes | The version of this specification the document conforms to. _MUST_ be `"0.1"` for this version. |
| `metadata` | `object` | No | System-level metadata about the design system. See [Metadata](#metadata). |
| `documentation` | `array` | Yes | One or more documentation groups. See [Documentation Groups](#document-groups). |
| `$extensions` | `object` | No | Vendor-specific extensions. |

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
| `"style"` | A macro-level visual style | `entities/style.schema.json` |
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
    { "type": "pattern", "name": "error-messaging", "..." }
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

---

## Entity Types

Every entity shares a common set of identity and metadata properties, plus a `guidelines` array for all structured documentation. The `guidelines` array accepts only the guideline types appropriate for that entity type. Every entity also carries a required `type` discriminator (see [Entity Type Discriminators](#entity-type-discriminators) above).

### Common Entity Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | Entity type discriminator: `"component"`, `"token"`, `"token-group"`, `"theme"`, `"style"`, or `"pattern"`. |
| `name` | `string` | Yes | Machine-readable identifier. Components, styles, patterns, and themes enforce `^[a-z][a-z0-9-]*$`. Token and token group names are intentionally unconstrained to accommodate DTCG and design tool naming conventions that use dots, slashes, or other separators (e.g., `color.text.primary`, `color/text/primary`). |
| `displayName` | `string` | Yes | Human-readable name. |
| `summary` | `string` | No | One-line plain-text summary for compact display. MUST NOT contain markup. |
| `description` | `richText` | Yes | Description with CommonMark support. |
| `status` | `statusObject` | Yes | Lifecycle status with optional per-platform readiness. See [Status](#status). |
| `since` | `string` | No | The version in which this artifact was introduced. |
| `tags` | `string[]` | No | Freeform keywords for categorization and search. |
| `aliases` | `string[]` | No | Alternative names this artifact is known by across teams, tools, or legacy systems (e.g., `["btn", "action-button", "CTA"]`). Useful for search, migration mapping, and cross-referencing. |
| `category` | `string` | No | Classification within the system's taxonomy (e.g., `"action"` for components, `"color"` for styles, `"feedback"` for patterns). |
| `guidelines` | `array` | No | Typed guideline objects. See [Guidelines](#guidelines). |
| `links` | `array` | No | Typed external links. See [Links](#links). |
| `$extensions` | `object` | No | Vendor-specific extensions. |

### Component

A reusable UI element. Accepts component-scoped guidelines (anatomy, api, variants, states, design-specifications) and all general guidelines.

### Token

A single design token. Accepts general guidelines only.

Additional properties: `tokenType` (required — DTCG-aligned type), `value` (tokenValue), `api` (tokenApi — platform-specific identifiers).

### Token Group

A hierarchical group of related tokens. The `children` array can contain token objects, nested token group objects, or a mix of both. Accepts general guidelines only.

Additional properties: `tokenType` (inherited default for children), `children` (recursive array of tokens and token groups).

### Theme

A named set of token value overrides that adapt the system to a specific context (color mode, density, brand variant). Accepts general guidelines.

Additional properties: `overrides` (required — array of token→value mappings).

### Style

A macro-level visual style governing a domain like color, typography, spacing, or elevation. Accepts style-scoped guidelines (principles, scale) and all general guidelines.

### Pattern

A broad interaction pattern — a recurring, multi-component solution to a common UX problem. Accepts pattern-scoped guidelines (interactions) and all general guidelines.

---

## Status

The `statusObject` consolidates lifecycle status, per-platform readiness, and deprecation notices into a single object. Every entity carries status as an object, not a bare string.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | Overall lifecycle status: `"draft"`, `"experimental"`, `"stable"`, `"deprecated"`. Custom values permitted. |
| `platformStatus` | `object` | No | Platform-specific readiness. Keys are platform identifiers (e.g., `"react"`, `"ios"`, `"figma"`). Values are platform status entries. |
| `deprecationNotice` | `string` | Conditional | Required when status is `"deprecated"`. MUST explain what to use instead. |

### Platform Status Entry

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | Lifecycle status on this platform. |
| `since` | `string` | No | Version available on this platform. |
| `deprecationNotice` | `string` | Conditional | Required when status is `"deprecated"`. |
| `description` | `string` | No | Notes about this platform's status. |

---

## Guidelines

Guidelines are the fundamental unit of structured documentation in DSDS. Every piece of documentation attached to an entity — best practices, anatomy breakdowns, API specifications, variant definitions, state descriptions, accessibility specs, use cases, examples, design specifications, principles, scales, interactions, and artifact references — is a guideline object with a `entryType` discriminator.

Every guideline is a **typed container** that holds an array of atomic items. This consistent model means all guidelines follow the same pattern established by anatomy (which has `parts`) and purpose (which has `whenToUse`/`whenNotToUse`).

### Scoped Guideline Unions

Each entity type accepts only the guideline types relevant to it:

| Scope | Used by | Accepts |
|---|---|---|
| **Component** | component | anatomy, api, variants, states, design-specifications + general |
| **Style** | style | principles, scale + general |
| **Pattern** | pattern | interactions + general |
| **Token** | token, tokenGroup, theme | general only |

**General** (available on all entity types): best-practices, purpose, accessibility, examples, artifact-references.

### Guideline Types

| Type value | Container property | Item type | Scope |
|---|---|---|---|
| `"best-practices"` | `items` | bestPracticeEntry (guidance + rationale + entryType) | General |
| `"purpose"` | `whenToUse`, `whenNotToUse` | useCase | General |
| `"accessibility"` | `keyboardInteraction`, `ariaAttributes`, `colorContrast`, etc. | various | General |
| `"examples"` | `items` | example (presentation-based) | General |
| `"artifact-reference"` | `references` | artifactReferenceEntry (name + role) | General |
| `"anatomy"` | `parts` | anatomyEntry | Component |
| `"api"` | `properties`, `events`, `slots`, etc. | apiProperty, apiEvent, etc. | Component |
| `"variants"` | `items` | variantEntry (dimension with values) | Component |
| `"states"` | `items` | stateEntry | Component |
| `"design-specifications"` | `tokens`, `spacing`, `sizing`, `typography`, `responsive` | various | Component |
| `"principles"` | `items` | principleEntry (title + description) | Style |
| `"scale"` | `steps` | scaleStep (token + label + value) | Style |
| `"interactions"` | `items` | interactionEntry (trigger + description) | Pattern |

### Best Practice Entry

Every best practice pairs an actionable guidance statement with a rationale explaining why. The optional `entryType` classifies the enforcement level.

| Property | Type | Required | Description |
|---|---|---|---|
| `guidance` | `richText` | Yes | The actionable guidance statement. |
| `rationale` | `richText` | Yes | Why this guidance exists. |
| `entryType` | `string` | No | The enforcement level: `"required"`, `"encouraged"`, `"informational"`, `"discouraged"`, `"prohibited"`. |
| `category` | `string` | No | Discipline grouping (e.g., `"visual-design"`, `"accessibility"`, `"content"`). |
| `target` | `string` | No | Anatomy part this applies to (e.g., `"label"`, `"icon"`). |
| `criteria` | `string[]` | No | URLs to external standards (e.g., WCAG success criteria). |
| `examples` | `array` | No | Example objects illustrating the guidance. |
| `tags` | `string[]` | No | Freeform keywords. |

---

## Links

The `links` array provides typed references to external resources and related artifacts.

| Property | Type | Required | Description |
|---|---|---|---|
| `entryType` | `string` | Yes | Category: `"source"`, `"design"`, `"storybook"`, `"documentation"`, `"package"`, `"repository"`, `"alternative"`, `"parent"`, `"child"`, `"related"`. Custom values permitted. |
| `url` | `string` | Yes | URL of the linked resource. MUST be a valid absolute URI. |
| `label` | `string` | No | Human-readable label for the link. |

---

## Rich Text

Fields that contain human-written prose use the `richText` type:

- **String form:** A bare JSON string, interpreted as CommonMark.
- **Object form:** `{ "value": "...", "format": "plain" | "markdown" | "html" }` for explicit format control.

---

## Extensions

The `$extensions` property is available on the root document, on each documentation group, and on each entity. Keys MUST use vendor-specific namespaces. Tools that do not recognize an extension MUST preserve it.

---

## Naming Conventions

### Token Name Exception

Most entity types enforce a strict `^[a-z][a-z0-9-]*$` pattern on the `name` property. Tokens and token groups are the intentional exception — their names are unconstrained to accommodate the naming conventions used by the W3C Design Tokens Format Module, design tool variable systems, and existing token architectures that use dots (`color.text.primary`), slashes (`color/text/primary`), or other separators. Token names _SHOULD_ still be lowercase and human-readable, but the schema does not enforce a pattern.

### Guideline Type Naming

Guideline type values follow two naming patterns based on their structural role:

- **Plural names** for guideline types that wrap a homogeneous list of items in an `items` array: `"best-practices"`, `"variants"`, `"states"`, `"principles"`, `"interactions"`, `"examples"`.
- **Singular names** for guideline types that are self-contained named entities with their own internal structure: `"scale"` (has `name`, `steps`), `"anatomy"` (has `parts`), `"api"` (has `properties`, `events`, etc.), `"accessibility"` (has `keyboardInteraction`, `ariaAttributes`, etc.), `"design-specifications"` (has `tokens`, `spacing`, etc.), `"artifact-reference"` (has `referenceType`, `references`), `"purpose"` (has `whenToUse`, `whenNotToUse`).

The distinction: plural types are containers of interchangeable items where the container itself has no identity beyond its type. Singular types have meaningful internal structure where the properties are named and semantically distinct (not a flat list).

---

## Companion Files

| File | Description |
|---|---|
| [`schema/dsds.schema.json`](schema/dsds.schema.json) | JSON Schema for validating DSDS documents. |
| [`schema/dsds.bundled.schema.json`](schema/dsds.bundled.schema.json) | Single-file bundled version (auto-generated). |
| [`examples/starter-kit.dsds.json`](examples/starter-kit.dsds.json) | Starter kit with components, tokens, a style, and a pattern. |
| [`examples/entities/component.json`](examples/entities/component.json) | Complete component documentation (Button). |
| [`examples/entities/token.json`](examples/entities/token.json) | Token documentation with value and API examples. |
| [`examples/entities/token-group.json`](examples/entities/token-group.json) | Hierarchical token group (color palette). |
| [`examples/entities/theme.json`](examples/entities/theme.json) | Dark mode theme with token overrides. |
| [`examples/entities/style.json`](examples/entities/style.json) | Style documentation (Spacing). |

---

## Conformance Levels

| Level | Requirement |
|---|---|
| **Level 1: Core** | `name`, `displayName`, `description`, `status` (+ `tokenType` for tokens, `overrides` for themes) |
| **Level 2: Complete** | Level 1 + at least one substantive guideline (anatomy/api/variants for components, principles/scale for styles, interactions for patterns, best-practices/purpose for tokens) |

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

*End of overview. See individual module files in `spec/modules/` for the complete specification of each section.*