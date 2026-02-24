# Design System Documentation Standard (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a JSON-based format for documenting the three core artifacts of a design system:

- **Components** — API, anatomy, usage guidelines, accessibility, content guidance
- **Design tokens** — Semantic meaning, platform mappings, contrast ratios, usage rules
- **Foundations** — Principles, scales, and guidelines for color, typography, spacing, elevation, motion

The goal is simple: make design system documentation structured, portable, and consumable by tools — whether that tool is a documentation site, a linter, a code assistant, or a human reading JSON.

## Why?

Design system documentation today is trapped in tools. It lives in Notion, Storybook, Zeroheight, Confluence, or custom-built sites — each with its own structure, its own conventions, and no interoperability between them.

This creates real problems:

- **Migration is expensive.** Switching documentation tools means restructuring everything from scratch.
- **Consistency is accidental.** Without a shared structure, every team invents its own format. Consumers of different systems must relearn what to expect every time.
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

The W3C Design Tokens Community Group defines a format for exchanging token **values** between tools. DSDS defines a format for exchanging the **documentation** that describes how those tokens — and the components and foundations that use them — should be understood and applied.

The two formats are designed to work together. A DSDS token documentation file can reference a DTCG file for the token's authoritative value.

## Project Structure

```
spec/
├── dsds-spec.md                        # The full specification
├── schema/
│   └── dsds.schema.json                # JSON Schema for validation
└── examples/
    ├── button.dsds.json                # Component documentation (Button)
    ├── color-tokens.dsds.json          # Token group documentation (Text Colors)
    └── spacing-foundation.dsds.json    # Foundation documentation (Spacing)
```

## Quick Start

### 1. Read the spec

Start with [`spec/dsds-spec.md`](spec/dsds-spec.md). It defines the format, the rules, and the reasoning behind both.

### 2. Look at the examples

The [`spec/examples/`](spec/examples/) directory contains complete, realistic documentation files:

- **[`button.dsds.json`](spec/examples/button.dsds.json)** — A full Level 2 component doc covering anatomy, API, variants, states, design specs, best practices, accessibility, and content guidelines.
- **[`color-tokens.dsds.json`](spec/examples/color-tokens.dsds.json)** — A token group documenting semantic text color tokens with contrast ratios, platform mappings, and usage rules.
- **[`spacing-foundation.dsds.json`](spec/examples/spacing-foundation.dsds.json)** — A foundation doc covering the spacing scale, principles, guidelines, and accessibility considerations.

### 3. Validate your documents

Use the JSON Schema at [`spec/schema/dsds.schema.json`](spec/schema/dsds.schema.json) to validate your own DSDS files. Any JSON Schema-compatible tool works:

```bash
# Using ajv-cli (Node.js)
npx ajv validate -s spec/schema/dsds.schema.json -d my-button.dsds.json

# Using check-jsonschema (Python)
pip install check-jsonschema
check-jsonschema --schemafile spec/schema/dsds.schema.json my-button.dsds.json
```

Or reference the schema directly in your DSDS files for editor support:

```json
{
  "$schema": "./spec/schema/dsds.schema.json",
  "dspiVersion": "1.0",
  "documentType": "component",
  "component": {
    "name": "my-component",
    "displayName": "My Component",
    "description": "A brief description.",
    "status": "draft"
  }
}
```

## Conformance Levels

DSDS defines two conformance levels to support incremental adoption:

### Level 1: Core

The minimum metadata for a tool to catalog and display an artifact.

- `name`, `displayName`, `description`, `status`
- For tokens: `tokenType`
- For foundations: `category`

### Level 2: Complete

Enough information for a reader to understand how to use the artifact.

- **Components:** At least one of `anatomy`, `api`, or `guidelines`
- **Tokens:** At least one of `api`, `guidelines`, or `value`
- **Foundations:** At least one of `principles`, `guidelines`, or `scales`

Start with Level 1. Get to Level 2 when you can. The format supports you either way.

## Core Concepts

### Every guideline has a rationale

DSDS requires that every piece of guidance — best practices, accessibility rules, content guidelines — includes a `rationale` field explaining *why* it exists.

```json
{
  "guidance": "Limit each surface to one primary button.",
  "rationale": "Multiple primary buttons dilute visual hierarchy. When everything is emphasized, nothing is."
}
```

This is not optional. Guidance without justification is incomplete. It doesn't help the reader understand the system. It doesn't hold the system team accountable. And it doesn't give consumers the information they need to make informed decisions when they need to diverge.

### Documentation is structured, not prose

DSDS doesn't use freeform Markdown for guidelines. Each guideline is a structured object — self-contained, filterable, and individually addressable by tools. A linter can flag a component missing accessibility guidelines. An AI assistant can retrieve the specific rationale for a spacing rule. A doc site can render guidelines as a checklist.

### Links are first-class

Source code, design files, and interactive demos are universal to design system documentation — not vendor-specific metadata. DSDS gives them a dedicated, typed `links` array rather than burying them in extensions.

```json
{
  "links": [
    {
      "type": "source",
      "url": "https://github.com/acme/design-system/blob/main/src/button/button.tsx",
      "label": "React component source"
    },
    {
      "type": "design",
      "url": "https://figma.com/file/abc123/Acme-DS?node-id=1234:5678",
      "label": "Figma component"
    },
    {
      "type": "storybook",
      "url": "https://storybook.acme.com/?path=/docs/components-button--docs",
      "label": "Storybook docs"
    }
  ]
}
```

Each link has a `type` that classifies what kind of resource it points to. The spec defines six standard types:

| Type | Description |
|---|---|
| `source` | Source code (GitHub, GitLab, Bitbucket) |
| `design` | Design file, node, or variable (Figma, Sketch) |
| `storybook` | Interactive component demos (Storybook, Chromatic) |
| `documentation` | External documentation pages (Zeroheight, Notion) |
| `package` | Published packages (npm, PyPI) |
| `repository` | Top-level repository root |

Custom types are allowed. Multiple links of the same type are allowed (e.g., separate source files for React and Web Component implementations). When there are multiple links of the same type, use the `label` field to distinguish them.

**Rule of thumb:** If it's a URL a human would click to navigate to a resource, it belongs in `links`. If it's an internal identifier consumed programmatically by a specific tool (like a Figma component key or a Storybook story ID), it belongs in `$extensions`.

### Extensions preserve interoperability

Tool-specific internal identifiers go in `$extensions` using namespaced keys. Tools that don't understand another tool's extensions must preserve them. The core documentation remains fully comprehensible without any extension data.

```json
{
  "$extensions": {
    "com.figma": { "componentKey": "abc123def456" },
    "com.storybook": { "storyId": "components-button--primary" }
  }
}
```

## Design Principles

The following principles guided the design of this specification:

1. **Documentation is a product.** It deserves the same rigor as the components it describes.
2. **Structure enables quality.** Unstructured documentation tends toward inconsistency. A defined format creates a floor of quality and completeness.
3. **Guidance without justification is incomplete.** Every recommendation should be answerable with "why?"
4. **Documentation should be portable.** Teams change tools. Documentation should survive the transition.
5. **Education is a responsibility.** Documentation should explain not just *what* to do, but *why* and *how*.
6. **Specificity over subjectivity.** "Use sparingly" is not guidance. "Limit to one per surface" is.


## Contributing

This is an early-stage specification. Feedback is welcome:

- **Open an issue** for questions, suggestions, or problems with the spec.
- **Open a PR** for proposed changes to the spec, schema, or examples.

## License

This project is open source. See [LICENSE](LICENSE) for details.
