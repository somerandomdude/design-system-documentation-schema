# Design System Documentation Standard (DSDS) 0.1

**Draft Specification — February 2026**

**Latest version:** https://github.com/somerandomdude/design-system-documentation-schema

**Editors:**
- PJ Onori

**Feedback:** [GitHub Issues](https://github.com/pjonori/design-system-documentation-schema/issues)

---

## Abstract

This document defines a standard, machine-readable format for design system documentation. The format covers five core domains: **components**, **design tokens**, **styles**, **patterns**, and **collections**. Its purpose is to establish a portable, tool-agnostic structure that enables software to create, edit, validate, and display design system documentation consistently.

This specification is complementary to the [W3C Design Tokens Format Module](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/). Where the Design Tokens Format Module defines the interchange format for token _values_, DSDS defines the interchange format for the _documentation_ that surrounds components, tokens, styles, and patterns.

## Status of This Document

This is a draft specification and is subject to change. It has not been endorsed by any standards body. Feedback and contributions are welcome via GitHub.

---

## Specification Modules

The DSDS specification is organized into focused modules. Each module is a self-contained document that can be read independently. Together, they define the complete format.

### Common

**[Common Module](modules/common.md)** — The foundation of the specification.

- Conformance language (RFC 2119)
- Introduction and design philosophy
- Terminology definitions
- File format (JSON structure, MIME types, document types, metadata, collections)
- Common properties shared across all artifact types (identification, `summary`, `description` with CommonMark, status, tags, related artifacts, links)
- Extensions (`$extensions` for vendor-specific metadata)
- Conformance levels (Level 1: Core, Level 2: Complete)
- Normative and informative references

### Components

**[Components Module](modules/components.md)** — Documenting reusable UI elements.

- Component structure and required fields
- Category classification
- Anatomy (named sub-elements of visual structure)
- Code-level API with single-platform and multi-platform forms
  - Properties with JSON Schema support (following OpenAPI patterns)
  - Events, slots, CSS custom properties, CSS parts, data attributes, methods
  - `since` tracking on all API members
- Variants and states
- Design specifications (tokens, spacing, sizing, responsive behavior)
- Content guidelines

### Tokens

**[Tokens Module](modules/tokens.md)** — Documenting design tokens and token groups.

- Token documentation structure
- Token types aligned with the W3C Design Tokens Format Module
- Semantic categories (base, semantic, component)
- Value representation and DTCG file references
- Platform-specific API mappings (CSS, SCSS, JS, iOS, Android, design tools)
- Token group documentation for related sets of tokens

### Styles

**[Styles Module](modules/styles.md)** — Documenting macro-level visual style guidelines.

- Style documentation structure
- Categories (color, typography, spacing, elevation, motion, shape)
- Principles and token group references
- Ordered scales (type scales, spacing scales)

### Patterns

**[Patterns Module](modules/patterns.md)** — Documenting broad interaction patterns.

- Pattern documentation structure
- Component references with roles
- Interaction flows (triggers, descriptions, involved components)
- Use cases (when to use, when not to use with alternatives)

### Examples

**[Examples Module](modules/examples.md)** — A unified model for visual and interactive demonstrations.

- Four media types: image, video, code, and Storybook
- Alt text requirements for images and videos
- Code examples with language metadata
- Storybook story references (URL and/or story ID)
- Component previews, variant previews, state previews
- Rich examples in guidelines (do/don't illustrations)

### Guidelines

**[Guidelines Module](modules/guidelines.md)** — Structuring actionable, justified usage guidance.

- Guidelines object (`bestPractices`, `contentGuidelines`)
- Required `guidance` + `rationale` pairing
- Severity levels (`required`, `encouraged`, `informational`, `discouraged`, `prohibited`)
- Examples in guidelines (simple strings, text objects, rich media)
- Writing guidelines (non-normative)

### Use Cases

**[Use Cases Module](modules/usecases.md)** — Scenario-driven guidance for when to use and when not to use an artifact.

- Use cases object (`whenToUse`, `whenNotToUse`)
- Structured alternatives with `name` and `rationale`
- Appears on components, styles, and patterns

### Accessibility

**[Accessibility Module](modules/accessibility.md)** — Documenting accessibility requirements.

- WCAG conformance level targeting
- Accessibility-specific guidelines with WCAG criteria references
- Keyboard interaction specifications
- ARIA attribute documentation
- Screen reader behavior and focus management
- Color contrast ratio documentation

### Links

**[Links Module](modules/links.md)** — Typed references to external resources.

- Link object structure (`type`, `url`, `label`)
- Standard link types: `source`, `design`, `storybook`, `documentation`, `package`, `repository`
- Multiple links of the same type
- Boundary between links and `$extensions`

---

## Companion Files

| File | Description |
|---|---|
| [`schema/dsds.schema.json`](schema/dsds.schema.json) | JSON Schema for validating DSDS documents. |
| [`examples/button.dsds.json`](examples/button.dsds.json) | Complete Level 2 component documentation (Button). |
| [`examples/color-tokens.dsds.json`](examples/color-tokens.dsds.json) | Token group documentation (Text Colors). |
| [`examples/spacing-style.dsds.json`](examples/spacing-style.dsds.json) | Style documentation (Spacing). |
| [`examples/error-messaging.dsds.json`](examples/error-messaging.dsds.json) | Pattern documentation (Error Messaging). |

---

## Quick Reference

### Document Types

| `documentType` | Description | Defined in |
|---|---|---|
| `"component"` | A reusable UI component | [Components Module](modules/components.md) |
| `"token"` | A single design token | [Tokens Module](modules/tokens.md) |
| `"tokenGroup"` | A group of related tokens | [Tokens Module](modules/tokens.md) |
| `"style"` | A macro-level visual style (color, typography, spacing) | [Styles Module](modules/styles.md) |
| `"pattern"` | A broad interaction pattern (navigation, error messaging) | [Patterns Module](modules/patterns.md) |
| `"collection"` | A bundle of multiple artifacts | [Common Module](modules/common.md) |

### Conformance Levels

| Level | Requirement |
|---|---|
| **Level 1: Core** | `name`, `displayName`, `description`, `status` (+ `tokenType` for tokens, `category` for styles and patterns) |
| **Level 2: Complete** | Level 1 + at least one substantive section (anatomy/api/guidelines for components, api/guidelines/value for tokens, principles/guidelines/scales for styles, components/interactions/guidelines for patterns) |

### Common Properties (all artifact types)

| Property | Required | Description |
|---|---|---|
| `name` | Yes | Machine-readable identifier (`^[a-z][a-z0-9-]*$`) |
| `displayName` | Yes | Human-readable name |
| `summary` | No | One-line plain-text summary for compact display |
| `description` | Yes | Description with CommonMark support |

| `status` | Yes | `draft`, `experimental`, `stable`, `deprecated` |
| `since` | No | Version introduced |
| `tags` | No | Freeform tags |
| `related` | No | References to other DSDS artifacts |
| `links` | No | Typed external links (source, design, storybook, etc.) |
| `$extensions` | No | Vendor-specific metadata |

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

*End of overview. See individual modules for the complete specification.*
