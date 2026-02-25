# Design System Documentation Standard (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a JSON-based format for documenting the six entity types of a design system:

- **Components** — Anatomy, API, variants, states, design specifications, best practices, accessibility
- **Tokens** — Semantic meaning, platform mappings, contrast ratios, usage rules
- **Token Groups** — Hierarchical organization of tokens into families and sub-families
- **Themes** — Named sets of token value overrides for color modes, density, brand variants
- **Styles** — Macro-level visual guidelines for color, typography, spacing, elevation, and motion
- **Patterns** — Broad interaction patterns like navigation, error messaging, and empty states

All structured documentation — best practices, anatomy, API specs, variants, states, accessibility, examples, design specifications, principles, scales, interactions, and artifact references — lives in a unified **guidelines** system. Each guideline is a typed container identified by a `type` discriminator.

The goal is simple: make design system documentation structured, portable, and consumable by tools — whether that tool is a documentation site, a linter, a code assistant, or a human reading JSON.

## Why?

Design system documentation today is trapped in tools. It lives in Notion, Storybook, Zeroheight, Confluence, or custom-built sites — each with its own structure, its own conventions, and no interoperability between them.

This creates real problems:

- **Migration is expensive.** Switching documentation tools means restructuring everything from scratch.
- **Consistency is accidental.** Without a shared structure, every team invents its own format. Consumers must relearn what to expect every time.
- **Tooling can't help.** Tools can't reliably consume documentation from other tools because there's no shared schema to build against.
- **AI needs structure.** LLMs and code assistants work dramatically better with structured, predictable documentation than with ad hoc prose.

DSDS addresses these problems by defining a standard format that is:

| Quality | What it means |
|---|---|
| **Structured** | Every section has a defined shape. Consumers know what to expect. |
| **Machine-readable** | Tools can parse, generate, validate, and transform documentation. |
| **Portable** | Documentation is decoupled from any specific tool or platform. |
| **Extensible** | Vendor metadata can be added without breaking interoperability. |
| **Complementary** | Works alongside the [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), not against it. |

## Relationship to W3C Design Tokens

The W3C Design Tokens Community Group defines a format for exchanging token **values** between tools. DSDS defines a format for exchanging the **documentation** that describes how those tokens — and the components, styles, and patterns that use them — should be understood and applied.

The two formats are designed to work together. A DSDS token entity can reference a DTCG file for the token's authoritative value.

## Project Structure

```
spec/
├── dsds-spec.md                                        # Specification overview
├── modules/                                            # Prose documentation
│   ├── common.md                                       # Shared primitives (richText, status, link, example, etc.)
│   ├── entities.md                                     # Entity types (component, token, theme, style, pattern)
│   └── guidelines.md                                   # Guideline types (best-practices, anatomy, api, variants, etc.)
├── schema/
│   ├── dsds.schema.json                                # Root JSON Schema
│   ├── dsds.bundled.schema.json                        # Auto-generated single-file bundle
│   ├── common/                                         # Shared primitives
│   │   ├── example.schema.json                         # example, examples, presentations
│   │   ├── extensions.schema.json                      # $extensions
│   │   ├── link.schema.json                            # link
│   │   ├── metadata.schema.json                        # metadata
│   │   ├── rich-text.schema.json                       # richText
│   │   ├── status.schema.json                          # statusObject, statusValue, platformStatusEntry
│   │   └── usecase.schema.json                         # useCase, useCases
│   ├── entities/                                       # Entity types
│   │   ├── component.schema.json                       # component
│   │   ├── pattern.schema.json                         # pattern
│   │   ├── style.schema.json                           # style
│   │   ├── theme.schema.json                           # theme, tokenOverride
│   │   └── token.schema.json                           # token, tokenGroup, tokenValue, tokenApi
│   └── guidelines/                                     # Guideline types
│       ├── guideline.schema.json                       # Scoped unions (componentGuideline, styleGuideline, etc.)
│       ├── accessibility.schema.json                   # accessibility, keyboardInteraction, ariaAttribute, colorContrast
│       ├── anatomy.schema.json                         # anatomy, anatomyEntry
│       ├── api.schema.json                             # api, apiProperty, apiEvent, apiSlot, etc.
│       ├── artifact-reference.schema.json              # artifactReference, artifactReferenceEntry
│       ├── best-practice.schema.json                   # bestPractices, bestPracticeEntry
│       ├── design-specifications.schema.json           # designSpecifications, spacingSpec, sizingSpec, typographySpec, etc.
│       ├── interaction.schema.json                     # interactions, interactionEntry
│       ├── principle.schema.json                       # principles, principleEntry
│       ├── purpose.schema.json                         # purpose (whenToUse / whenNotToUse)
│       ├── scale.schema.json                           # scale, scaleStep
│       ├── state.schema.json                           # states, stateEntry
│       └── variant.schema.json                         # variants, variantEntry, variantValue
└── examples/
    ├── starter-kit.dsds.json                           # Complete document with components, tokens, styles, patterns
    ├── common/                                         # Per-definition examples for common primitives
    ├── entities/                                       # Per-definition examples for entity types
    └── guidelines/                                     # Per-definition examples for guideline types

scripts/
├── bundle.js                                           # Generates dsds.bundled.schema.json from split schemas
├── validate.js                                         # Validates all example files against the bundled schema
├── sync-examples.js                                    # Syncs markdown dsds:include directives with example JSON
└── build-site.js                                       # Generates the static specification site

site/
├── style.css                                           # Site stylesheet
└── dist/                                               # Generated HTML site (auto-generated)
```

## Quick Start

### 1. Read the spec

Start with [`spec/dsds-spec.md`](spec/dsds-spec.md) for the architecture overview. Then read the three modules:

- [`spec/modules/common.md`](spec/modules/common.md) — Shared primitives (richText, status, link, example, extensions, metadata, use cases)
- [`spec/modules/entities.md`](spec/modules/entities.md) — The six entity types (component, token, token group, theme, style, pattern)
- [`spec/modules/guidelines.md`](spec/modules/guidelines.md) — The unified guideline system (13 guideline types with scoped unions)

### 2. Look at the examples

The [`spec/examples/`](spec/examples/) directory contains validated example files:

- **[`starter-kit.dsds.json`](spec/examples/starter-kit.dsds.json)** — A complete document with components, tokens, a style, and a pattern, showing the full architecture.
- **[`entities/component.json`](spec/examples/entities/component.json)** — A full Button component with anatomy, API, variants, states, design specs, best practices, purpose, and accessibility.
- **[`entities/token.json`](spec/examples/entities/token.json)** — A semantic color token with value, API mappings, and guidelines.
- **[`entities/token-group.json`](spec/examples/entities/token-group.json)** — A hierarchical color palette with nested hue families and grade scales.
- **[`entities/theme.json`](spec/examples/entities/theme.json)** — A dark mode theme with token overrides, purpose, best practices, and accessibility.
- **[`entities/style.json`](spec/examples/entities/style.json)** — A spacing style with principles, scales, token group references, and best practices.
- **[`entities/pattern.json`](spec/examples/entities/pattern.json)** — An error messaging pattern with interactions, component references, and accessibility.

### 3. Validate your documents

Install dependencies and run the validation suite:

```bash
npm install
npm run validate
```

This runs three steps automatically: syncs example includes, bundles the schema, and validates all example files.

To validate your own DSDS file:

```bash
npx ajv validate -s spec/schema/dsds.bundled.schema.json -d my-system.dsds.json
```

Reference the schema in your DSDS files for editor support:

```json
{
  "$schema": "./spec/schema/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentation": [
    {
      "name": "My Design System",
      "items": [
        {
          "type": "component",
          "name": "my-component",
          "displayName": "My Component",
          "description": "A brief description.",
          "status": { "status": "draft" }
        }
      ]
    }
  ]
}
```

### 4. Build the spec site

```bash
npm run build
# Open site/dist/index.html
```

The site is auto-generated from the schema JSON files — property tables, type descriptions, and cross-references are all derived directly from the schemas. The prose modules provide context and examples.

### 5. Regenerate the bundled schema

After changing any schema file, regenerate the bundled version:

```bash
npm run bundle
```

## Document Structure

A DSDS file has a `dsdsVersion` and a `documentation` array. Each entry in `documentation` is a named group containing an `items` array of typed entities. Entities of different types can be mixed freely:

```json
{
  "dsdsVersion": "0.1",
  "documentation": [
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
  ]
}
```

### Entity Types

Every entity carries a `type` discriminator, common identity properties (`name`, `displayName`, `description`, `status`), and a `guidelines` array for all structured documentation.

| `type` value | Entity | Description |
|---|---|---|
| `"component"` | Component | A reusable UI component |
| `"token"` | Token | A single design token |
| `"token-group"` | Token Group | A hierarchical group of related tokens (recursive) |
| `"theme"` | Theme | A named set of token value overrides |
| `"style"` | Style | A macro-level visual style |
| `"pattern"` | Pattern | A broad interaction pattern |

### Status

Every entity carries status as an object with the overall lifecycle stage and optional per-platform readiness:

```json
{
  "status": {
    "status": "stable",
    "platformStatus": {
      "react": { "status": "stable", "since": "1.0.0" },
      "ios": { "status": "experimental", "since": "3.0.0" },
      "figma": { "status": "stable", "since": "1.0.0" }
    }
  }
}
```

## Guidelines System

All structured documentation lives in the `guidelines` array on each entity. Each guideline is a typed container with a `type` discriminator. Entity types accept only the guideline types relevant to them through scoped unions:

| Scope | Used by | Specific types | General types (all entities) |
|---|---|---|---|
| **Component** | component | anatomy, api, variants, states, design-specifications | best-practices, purpose, accessibility, examples, artifact-references |
| **Style** | style | principles, scale | *(same)* |
| **Pattern** | pattern | interactions | *(same)* |
| **Token** | token, token-group, theme | *(none)* | *(same)* |

### Guideline Types

| Type value | Container | Items | Description |
|---|---|---|---|
| `"best-practices"` | `items` | bestPracticeEntry | Actionable usage rules with rationale and enforcement levels |
| `"purpose"` | `whenToUse`, `whenNotToUse` | useCase | When to use and when not to use the entity |
| `"accessibility"` | Named arrays | various | Keyboard, ARIA, screen reader, contrast, motion specs |
| `"examples"` | `items` | example | Images, videos, code snippets, URLs to demos |
| `"artifact-reference"` | `references` | artifactReferenceEntry | Named references to other entities with roles |
| `"anatomy"` | `parts` | anatomyEntry | Component visual structure with token references |
| `"api"` | Named arrays | various | Props, events, slots, CSS hooks, methods |
| `"variants"` | `items` | variantEntry | Dimensions of visual/behavioral variation |
| `"states"` | `items` | stateEntry | Interactive states with token overrides |
| `"design-specifications"` | Named properties | various | Tokens, spacing, sizing, typography, responsive |
| `"principles"` | `items` | principleEntry | High-level guiding beliefs |
| `"scale"` | `steps` | scaleStep | Ordered token value progressions |
| `"interactions"` | `items` | interactionEntry | Pattern flow steps |

### Naming Convention

Guideline types follow two naming patterns:

- **Plural names** for homogeneous lists: `"best-practices"`, `"variants"`, `"states"`, `"principles"`, `"interactions"`, `"examples"`
- **Singular names** for self-contained structures: `"scale"`, `"anatomy"`, `"api"`, `"accessibility"`, `"design-specifications"`, `"artifact-reference"`, `"purpose"`

### Purpose tells you *when*. Best practices tell you *how*.

DSDS separates two kinds of guidance:

- **Purpose** provides concrete scenarios for when to use and when *not* to use an entity. Each `whenNotToUse` entry recommends an alternative with a rationale.
- **Best practices** provide concrete rules for using an entity correctly *after* you've chosen it. Each rule pairs an actionable `guidance` statement with a `rationale` explaining why.

```json
{
  "guidelines": [
    {
      "type": "purpose",
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
    },
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "Limit each surface to one primary button.",
          "rationale": "Multiple primary buttons dilute visual hierarchy.",
          "entryType": "required",
          "category": "visual-design"
        }
      ]
    }
  ]
}
```

### Best Practice Enforcement Levels

The `entryType` property on each best practice entry classifies how strictly it should be followed:

| Value | RFC 2119 | Meaning |
|---|---|---|
| `"required"` | MUST | Non-compliance is a defect. |
| `"encouraged"` | SHOULD | Follow in most cases; exceptions need justification. |
| `"informational"` | MAY | Advisory context with no enforcement. |
| `"discouraged"` | SHOULD NOT | Avoid unless justified. |
| `"prohibited"` | MUST NOT | Violations are defects. |

### Best Practices Link to External Criteria

Any best practice can reference external standards via the `criteria` property:

```json
{
  "guidance": "Button label text must meet a minimum 4.5:1 contrast ratio.",
  "rationale": "Text contrast ensures readability for users with low vision.",
  "entryType": "required",
  "category": "accessibility",
  "criteria": [
    "https://www.w3.org/TR/WCAG22/#contrast-minimum"
  ]
}
```

### Variants Model Dimensions

Component variants are modeled as dimensions of variation inside a `"variants"` guideline, each dimension with one or more values:

```json
{
  "type": "variants",
  "items": [
    {
      "name": "emphasis",
      "displayName": "Emphasis",
      "description": "Controls the visual weight of the button.",
      "values": [
        { "name": "primary", "description": "High-emphasis — the main action." },
        { "name": "secondary", "description": "Medium-emphasis — important but not primary." },
        { "name": "ghost", "description": "Low-emphasis — tertiary actions." }
      ]
    },
    {
      "name": "full-width",
      "displayName": "Full Width",
      "description": "Stretches the button to fill its container.",
      "values": [
        { "name": "full-width", "description": "The button expands to 100% width." }
      ]
    }
  ]
}
```

A dimension with multiple values is an enumerated set (like size: small/medium/large). A dimension with a single value is a boolean toggle (like full-width or icon-only).

### Examples Use Presentations

Every example requires a `presentation` — a visual or interactive demonstration. Four media types are supported:

| `type` | What it shows |
|---|---|
| `"image"` | Screenshot, diagram, annotated mockup |
| `"video"` | Screen recording, animation, walkthrough |
| `"code"` | Source code snippet with language metadata |
| `"url"` | Link to any web resource (Storybook, CodeSandbox, etc.) |

```json
{
  "type": "examples",
  "items": [
    {
      "title": "Primary button in default state",
      "presentation": {
        "type": "image",
        "url": "https://design.acme.com/assets/button-primary.png",
        "alt": "A primary button with a blue background and white label text 'Save'."
      }
    }
  ]
}
```

### Token APIs Are Open Maps

The `tokenApi` object uses an open map — keys are platform names, values are identifier strings. New platforms can be added without schema changes:

```json
{
  "api": {
    "cssCustomProperty": "--color-text-primary",
    "scssVariable": "$color-text-primary",
    "jsConstant": "colorTextPrimary",
    "designToolVariable": "color/text/primary",
    "composeToken": "Color.Text.Primary"
  }
}
```

### Token Names Are Unconstrained

Most entity types enforce `^[a-z][a-z0-9-]*$` on the `name` property. Tokens and token groups are the intentional exception — their names are unconstrained to accommodate DTCG and design tool naming conventions that use dots (`color.text.primary`), slashes (`color/text/primary`), or other separators.

### Links Handle Both Resources and Relationships

The `links` array on each entity handles both external resources and entity relationships via a `type` discriminator:

```json
{
  "links": [
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/button/button.tsx",
      "label": "React component source"
    },
    {
      "type": "alternative",
      "url": "https://design.acme.com/components/link",
      "label": "Link component (alternative)"
    }
  ]
}
```

Standard external types: `source`, `design`, `storybook`, `documentation`, `package`, `repository`. Standard relationship types: `alternative`, `parent`, `child`, `related`. Custom types are permitted.

### Extensions Preserve Interoperability

Tool-specific internal identifiers go in `$extensions` using namespaced keys. Extensions are available on the root document, on each documentation group, and on each entity:

```json
{
  "$extensions": {
    "com.designTool": { "componentId": "abc123def456" },
    "com.storybook": { "storyId": "components-button--primary" }
  }
}
```

**Rule of thumb:** If it's a URL a human would click, it belongs in `links`. If it's an internal identifier consumed programmatically by a specific tool, it belongs in `$extensions`.

## Schema Architecture

The schema is organized into three directories plus a root schema:

| Directory | Contents |
|---|---|
| `common/` | Shared primitives — richText, statusObject, link, example, extensions, metadata, useCase |
| `entities/` | Entity types — component, token (+ tokenGroup), theme, style, pattern |
| `guidelines/` | Guideline types — 13 type schemas + scoped unions (componentGuideline, styleGuideline, patternGuideline, tokenGuideline) |

The root `dsds.schema.json` defines the document structure and references entity schemas via a `oneOf` discriminated union. The `dsds.bundled.schema.json` is auto-generated by `scripts/bundle.js` for tools that require a single-file schema.

Property tables on the [specification site](site/dist/index.html) are generated directly from the schema JSON — they are always in sync with the schema and cannot drift from the implementation.

## Design Principles

1. **Structure enables quality.** A defined format creates a floor of quality and completeness.
2. **Guidance without justification is incomplete.** Every best practice must answer "why?"
3. **Documentation should be portable.** Teams change tools. Documentation should survive the transition.
4. **Education is a responsibility.** Explain *what*, *why*, and *how*.
5. **Specificity over subjectivity.** "Use sparingly" is not guidance. "Limit to one per surface" is.
6. **Schema is the source of truth.** Property tables are generated from schema JSON, not hand-written. Prose provides context; schemas provide structure.

## Contributing

This is an early-stage specification (v0.1). Feedback is welcome:

- **Open an issue** for questions, suggestions, or problems with the spec.
- **Open a PR** for proposed changes to the spec, schema, or examples.

## License

This project is open source. See [LICENSE](LICENSE) for details.