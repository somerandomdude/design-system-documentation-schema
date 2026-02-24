# Design System Documentation Standard (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a JSON-based format for documenting the five core artifact types of a design system:

- **Components (In progress)** — API, anatomy, variants, states, use cases, guidelines, accessibility, design specifications
- **Design tokens (Early placeholder draft)** — Semantic meaning, platform mappings, contrast ratios, usage rules
- **Styles (Early placeholder draft)** — Macro-level visual guidelines for color, typography, spacing, elevation, and motion
- **Patterns (Early placeholder draft)** — Broad interaction patterns like navigation, error messaging, and empty states
- **Collections (Early placeholder draft)** — Bundles of multiple artifacts into a single document

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

The two formats are designed to work together. A DSDS token documentation file can reference a DTCG file for the token's authoritative value.

## Project Structure

```
spec/
├── dsds-spec.md                                    # The full specification overview
├── modules/                                        # Spec module documents
│   ├── core.md                                     # Common properties, file format, extensions
│   ├── components.md                               # Component documentation
│   ├── tokens.md                                   # Token and token group documentation
│   ├── styles.md                                   # Visual style documentation
│   ├── patterns.md                                 # Interaction pattern documentation
│   ├── usecases.md                                 # Use case documentation
│   ├── examples.md                                 # Example and presentation model
│   ├── guidelines.md                               # Guideline structure
│   ├── accessibility.md                            # Accessibility specifications
│   └── links.md                                    # External resource links
├── schema/
│   ├── dsds.schema.json                            # Root JSON Schema
│   ├── dsds.bundled.schema.json                    # Auto-generated bundled schema
│   ├── common/                                     # Shared definitions
│   │   ├── common.schema.json                      # richText, metadata, status, link, extensions
│   │   ├── example.schema.json                     # example + presentation types
│   │   ├── guideline.schema.json                   # unified guideline
│   │   ├── usecase.schema.json                     # use cases (whenToUse / whenNotToUse)
│   │   ├── accessibility.schema.json               # keyboard, ARIA, contrast, accessibility object
│   │   └── artifact-reference.schema.json          # shared artifact reference
│   ├── components/                                 # Component-specific definitions
│   │   ├── component.schema.json                   # componentDoc
│   │   ├── anatomy.schema.json                     # anatomyPart, anatomy
│   │   ├── api.schema.json                         # apiProperty, apiEvent, apiSlot, componentApi
│   │   ├── design-specifications.schema.json       # spacing, sizing, responsive
│   │   ├── variant.schema.json                     # variant, variantValue
│   │   └── state.schema.json                       # state
│   ├── tokens/                                     # Token-specific definitions
│   │   └── token.schema.json                       # tokenDoc, tokenGroupDoc, tokenApi
│   ├── style/                                      # Style-specific definitions
│   │   └── style.schema.json                       # styleDoc, principle, scale, scaleStep
│   └── patterns/                                   # Pattern-specific definitions
│       └── pattern.schema.json                     # patternDoc, interaction
└── examples/
    ├── button.dsds.json                            # Component documentation (Button)
    ├── color-tokens.dsds.json                      # Token group documentation (Text Colors)
    ├── spacing-style.dsds.json                     # Style documentation (Spacing)
    └── error-messaging.dsds.json                   # Pattern documentation (Error Messaging)

scripts/
├── bundle_schema.py                                # Auto-generates dsds.bundled.schema.json
├── migrate_examples.py                             # Migration script for example files
└── migrate_criteria.py                             # Migration script for criteria/category changes

site/
├── build.py                                        # Static site generator for the spec
├── style.css                                       # Site stylesheet
└── dist/                                           # Generated HTML site
```

## Quick Start

### 1. Read the spec

Start with [`spec/dsds-spec.md`](spec/dsds-spec.md). It defines the format, the rules, and the reasoning behind both.

### 2. Look at the examples

The [`spec/examples/`](spec/examples/) directory contains complete, realistic documentation files:

- **[`button.dsds.json`](spec/examples/button.dsds.json)** — A full component doc covering anatomy, API, variants (with dimension-based modeling), states, design specs, use cases, guidelines, accessibility, and links.
- **[`color-tokens.dsds.json`](spec/examples/color-tokens.dsds.json)** — A token group documenting semantic text color tokens with contrast ratios, platform mappings, and usage guidelines.
- **[`spacing-style.dsds.json`](spec/examples/spacing-style.dsds.json)** — A style doc covering the spacing scale, principles, token group references, guidelines, and accessibility considerations.
- **[`error-messaging.dsds.json`](spec/examples/error-messaging.dsds.json)** — A pattern doc covering the error messaging flow with component references, interaction steps, use cases, guidelines, and accessibility.

### 3. Validate your documents

Use the JSON Schema at [`spec/schema/dsds.schema.json`](spec/schema/dsds.schema.json) (split) or [`spec/schema/dsds.bundled.schema.json`](spec/schema/dsds.bundled.schema.json) (single file) to validate your own DSDS files:

```bash
# Using ajv-cli (Node.js)
npx ajv validate -s spec/schema/dsds.bundled.schema.json -d my-button.dsds.json

# Using check-jsonschema (Python)
pip install check-jsonschema
check-jsonschema --schemafile spec/schema/dsds.bundled.schema.json my-button.dsds.json
```

Reference the schema directly in your DSDS files for editor support:

```json
{
  "$schema": "./spec/schema/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "component",
  "component": {
    "name": "my-component",
    "displayName": "My Component",
    "description": "A brief description.",
    "status": "draft"
  }
}
```

### 4. Build the spec site

```bash
python3 site/build.py
# Open site/dist/index.html
```

### 5. Regenerate the bundled schema

After changing any split schema file, regenerate the bundled version:

```bash
python3 scripts/bundle_schema.py
```

## Document Types

| `documentType` | Description | Example |
|---|---|---|
| `"component"` | A reusable UI component | Button, Dialog, Form Field |
| `"token"` | A single design token | `color-text-primary` |
| `"tokenGroup"` | A group of related tokens | Text Colors |
| `"style"` | A macro-level visual style | Color, Typography, Spacing |
| `"pattern"` | A broad interaction pattern | Error Messaging, Navigation |
| `"collection"` | A bundle of multiple artifacts | — |

## Core Concepts

### Use cases tell you *when*. Guidelines tell you *how*.

DSDS separates two kinds of guidance:

- **Use cases** provide concrete scenarios for when to use and when *not* to use an artifact. They answer: "Is this the right tool for my situation?" Each `whenNotToUse` entry can recommend an alternative with a rationale.
- **Guidelines** provide concrete rules for how to use an artifact correctly *after* you've chosen it. They answer: "How do I implement this well?"

```json
{
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
  },
  "guidelines": [
    {
      "guidance": "Limit each surface to one primary button.",
      "rationale": "Multiple primary buttons dilute visual hierarchy.",
      "type": "required",
      "category": "visual-design"
    }
  ]
}
```

### Every guideline has a rationale

DSDS requires that every piece of guidance includes a `rationale` field explaining *why* it exists. This is not optional.

### Guidelines are categorized by discipline

Every guideline has an optional `category` that identifies the professional discipline it belongs to:

| Category | Discipline |
|---|---|
| `visual-design` | Color, typography, spacing, layout |
| `interaction` | Behavior, animation, transitions, gestures |
| `accessibility` | Inclusive design, assistive technology, WCAG |
| `content` | Text, imagery, tone, voice, labeling |
| `motion` | Animation timing, easing, reduced-motion |
| `development` | Implementation patterns, performance, code |

Custom categories are permitted. Cross-cutting topics like `rtl`, `localization`, or `validation` go in `tags` rather than `category`.

### Guidelines link to external criteria

Any guideline can reference external functional requirements via the `criteria` property — URLs to WCAG success criteria, platform guidelines, regulatory documents, or internal compliance standards:

```json
{
  "guidance": "Button label text must meet a minimum 4.5:1 contrast ratio.",
  "rationale": "Text contrast ensures readability for users with low vision.",
  "type": "required",
  "category": "accessibility",
  "criteria": [
    "https://www.w3.org/TR/WCAG22/#contrast-minimum"
  ]
}
```

### Variants model dimensions, not flat lists

Component variants are modeled as dimensions of variation, each with one or more values:

```json
{
  "variants": [
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

A variant with multiple values is an enumerated set (like size: small/medium/large). A variant with a single value is a boolean toggle (like full-width or icon-only). Both levels accept `useCases`.

### Examples require a presentation

Every example in DSDS requires a `presentation` — a visual or interactive demonstration. Four presentation types are supported:

| Type | What it shows |
|---|---|
| `presentationImage` | Screenshot, diagram, mockup |
| `presentationVideo` | Screen recording, animation |
| `presentationCode` | Source code snippet with language |
| `presentationStory` | Storybook story reference |

```json
{
  "title": "Primary button in default state",
  "presentation": {
    "type": "image",
    "url": "https://design.acme.com/assets/button-primary.png",
    "alt": "A primary button with a blue background and white label text 'Save'."
  }
}
```

### Token APIs are open maps

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

### Links handle both resources and relationships

DSDS uses a single `links` array for both external resources and artifact relationships. The `type` property classifies each link:

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

Standard types include `source`, `design`, `storybook`, `documentation`, `package`, `repository` (external resources) and `alternative`, `parent`, `child`, `related` (artifact relationships). Custom types are permitted.

### Extensions preserve interoperability

Tool-specific internal identifiers go in `$extensions` using namespaced keys:

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

The schema is organized into directories by concern:

| Directory | Contents |
|---|---|
| `common/` | Shared definitions used across all artifact types — richText, metadata, status, link, example, guideline, use case, accessibility, artifact reference |
| `components/` | Component-specific definitions — componentDoc, anatomy, API, design specs, variant, state |
| `tokens/` | Token and token group definitions — tokenDoc, tokenGroupDoc, tokenApi |
| `style/` | Visual style definitions — styleDoc, principle, scale |
| `patterns/` | Interaction pattern definitions — patternDoc, interaction |

The root `dsds.schema.json` ties everything together. The `dsds.bundled.schema.json` is auto-generated by `scripts/bundle_schema.py` for tools that require a single-file schema.

## Design Principles

1. **Structure enables quality.** A defined format creates a floor of quality and completeness.
2. **Guidance without justification is incomplete.** Every recommendation must answer "why?"
3. **Documentation should be portable.** Teams change tools. Documentation should survive the transition.
4. **Education is a responsibility.** Explain *what*, *why*, and *how*.
5. **Specificity over subjectivity.** "Use sparingly" is not guidance. "Limit to one per surface" is.

## Contributing

This is an early-stage specification (v0.1). Feedback is welcome:

- **Open an issue** for questions, suggestions, or problems with the spec.
- **Open a PR** for proposed changes to the spec, schema, or examples.

## License

This project is open source. See [LICENSE](LICENSE) for details.
