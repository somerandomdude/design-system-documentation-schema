# DSDS Core Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the foundational elements of the specification: conformance language, terminology, file format, and common properties shared across all artifact types. It also covers extensions, conformance levels, and normative references.

---

## 1. Conformance

As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are non-normative. Everything else in this specification is normative.

The key words _MAY_, _MUST_, _MUST NOT_, _SHOULD_, and _SHOULD NOT_ in this document are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/rfc/rfc2119) [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

---

## 2. Introduction

_This section is non-normative._

Design systems produce three categories of artifacts that require documentation:

1. **Components** — Reusable UI elements with defined APIs, behavior, and usage guidance.
2. **Design tokens** — Named values representing design decisions (colors, spacing, typography, etc.).
3. **Foundations** — Principles and guidelines governing the use of visual and interaction primitives (color systems, type scales, spacing scales, elevation, motion).

Today, design system documentation exists in many forms — Storybook pages, Notion docs, Markdown files, Zeroheight sites, Supernova exports, custom-built doc sites — each with its own structure, conventions, and limitations. There is no standard format for the documentation itself.

This creates several problems:

- **Migration cost.** Moving between documentation tools requires restructuring content from scratch.
- **Inconsistency.** Each team invents its own documentation structure. Consumers of different systems must relearn what to expect.
- **Tooling gaps.** Tools cannot reliably consume documentation from other tools because there is no shared schema.
- **AI readiness.** Language models and code assistants benefit from structured, predictable documentation. Ad hoc formats limit their effectiveness.

DSDS addresses these problems by defining a JSON-based format for design system documentation. The format is:

- **Structured** — Every section has a defined shape. Consumers know what to expect.
- **Machine-readable** — Tools can parse, generate, validate, and transform documentation programmatically.
- **Portable** — Documentation is decoupled from any specific tool or platform.
- **Extensible** — Vendor-specific metadata can be added without breaking interoperability.
- **Complementary** — DSDS does not replace the W3C Design Tokens format. It wraps documentation around it.

### 2.1 Relationship to W3C Design Tokens Format

The W3C Design Tokens Community Group defines a format for exchanging token _values_ between tools. DSDS defines a format for exchanging the _documentation_ that describes how those tokens — and the components and foundations that use them — should be understood and applied.

A DSDS token documentation file _MAY_ reference a Design Tokens Format file for the token's value. The two formats are designed to work together, not compete.

### 2.2 Design Philosophy

_This section is non-normative._

This specification follows several documentation principles:

- **Succinctness.** Each field has a clear purpose. Optional fields are optional for a reason.
- **Predictability.** All component docs have the same shape. All token docs have the same shape. A reader — human or machine — learns the format once.
- **Actionability.** Guidelines are structured as concrete, self-contained statements with rationale. Not essays.
- **Justification.** Every best practice includes a `rationale` field. Guidance without explanation is incomplete.
- **Encapsulation.** Each guideline is self-contained. A reader should understand it without reading every other guideline.

---

## 3. Terminology

### 3.1 DSDS Document

A JSON file conforming to this specification that contains documentation for one or more design system artifacts (components, tokens, or foundations).

### 3.2 Component

A reusable user interface element with a defined API, visual presentation, and usage context. Examples include buttons, text inputs, modals, and tooltips.

### 3.3 Design Token

A named design decision expressed as a value. Design tokens follow the definition established by the [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/): a name/value pair with an associated type.

### 3.4 Foundation

A category of design guidance that governs the use of a visual or interaction primitive across an entire system. Examples include color, typography, spacing, elevation, and motion.

### 3.5 Guideline

A single, self-contained piece of usage guidance. In DSDS, a guideline is always a structured object containing at minimum a `guidance` statement and a `rationale` explanation.

### 3.6 Anatomy Part

A named sub-element of a component's visual structure. For example, a Button component might have anatomy parts: `container`, `label`, `icon`, `focus-ring`.

### 3.7 API Property

A configurable input of a component. In web contexts this maps to HTML attributes, framework props, CSS custom properties, or slots. In other contexts it maps to the equivalent configuration surface.

### 3.8 Status

The lifecycle stage of a documented artifact: `draft`, `experimental`, `stable`, or `deprecated`.

### 3.9 Variant

A named configuration of a component that changes its visual presentation or behavior. Examples include size variants (`small`, `medium`, `large`) and style variants (`primary`, `secondary`, `ghost`).

---

## 4. File Format

### 4.1 Encoding

DSDS documents are JSON files as defined in [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259). Files _MUST_ use UTF-8 encoding.

### 4.2 File Extensions

DSDS files _SHOULD_ use one of the following extensions:

- `.dsds.json` — Preferred. Clearly identifies the file as a DSDS document.
- `.dsds` — Shorter alternative.

### 4.3 MIME Type

When serving DSDS files over HTTP, the following MIME type _SHOULD_ be used:

- `application/dsds+json`

The generic `application/json` MIME type _MAY_ be used as a fallback.

### 4.4 Document Structure

A DSDS document _MUST_ be a JSON object with the following root-level properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `$schema` | `string` | No | URI reference to the DSDS JSON Schema for validation. |
| `dspiVersion` | `string` | Yes | The version of this specification the document conforms to. _MUST_ be `"1.0"` for this version. |
| `documentType` | `string` | Yes | The type of artifact documented. _MUST_ be one of: `"component"`, `"token"`, `"tokenGroup"`, `"foundation"`, `"collection"`. |
| `metadata` | `object` | No | System-level metadata about the design system this document belongs to. |
| `component` | `object` | Conditional | The component documentation. Required when `documentType` is `"component"`. |
| `token` | `object` | Conditional | The token documentation. Required when `documentType` is `"token"`. |
| `tokenGroup` | `object` | Conditional | The token group documentation. Required when `documentType` is `"tokenGroup"`. |
| `foundation` | `object` | Conditional | The foundation documentation. Required when `documentType` is `"foundation"`. |
| `collection` | `object` | Conditional | A collection of multiple artifacts. Required when `documentType` is `"collection"`. |
| `$extensions` | `object` | No | Vendor-specific extensions. See [§11 Extensions](#11-extensions). |

A document _MUST_ include exactly one of `component`, `token`, `tokenGroup`, `foundation`, or `collection`, matching the `documentType` value.

### 4.5 Collection Documents

A collection document aggregates multiple artifacts into a single file. This is useful for bundling related documentation.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Human-readable name of the collection. |
| `description` | `string` | No | Description of the collection. |
| `components` | `array` | No | Array of component documentation objects. |
| `tokens` | `array` | No | Array of token documentation objects. |
| `tokenGroups` | `array` | No | Array of token group documentation objects. |
| `foundations` | `array` | No | Array of foundation documentation objects. |

At least one of `components`, `tokens`, `tokenGroups`, or `foundations` _MUST_ be present.

### 4.6 Metadata

The optional `metadata` object provides context about the design system.

| Property | Type | Required | Description |
|---|---|---|---|
| `systemName` | `string` | No | The name of the design system (e.g., "Carbon", "Polaris", "Spectrum"). |
| `systemVersion` | `string` | No | The version of the design system. |
| `organization` | `string` | No | The organization that maintains the system. |
| `url` | `string` | No | URL to the system's documentation site. |
| `license` | `string` | No | SPDX license identifier or license URL. |

**Example:**

```json
{
  "$schema": "https://designsystemdocspec.org/v1/dsds.schema.json",
  "dspiVersion": "1.0",
  "documentType": "component",
  "metadata": {
    "systemName": "Acme Design System",
    "systemVersion": "4.1.0",
    "organization": "Acme Corp",
    "url": "https://design.acme.com"
  },
  "component": {
    "name": "button",
    "displayName": "Button",
    "description": "A clickable element that triggers an action.",
    "status": "stable"
  }
}
```

---

## 5. Common Properties

Several properties are shared across component, token, and foundation documentation objects. This section defines them once.

### 5.1 Identification

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | A machine-readable identifier. _MUST_ match the pattern `^[a-z][a-z0-9-]*$` (lowercase, hyphen-separated). |
| `displayName` | `string` | Yes | A human-readable name for display in documentation. |
| `summary` | `string` | No | A one-line, plain-text summary of the artifact. Intended for compact display contexts such as list views, tooltips, search results, and card layouts. _MUST NOT_ contain markup of any kind. Always a bare string. When omitted, tools _MAY_ truncate `description` for these contexts. |
| `description` | `richText` | Yes | A description of the artifact. Accepts a bare string or a content format object. See [§5.1.1 Content Formats](#511-content-formats-richtext). |

### 5.1.1 Content Formats (`richText`)

Many fields in DSDS contain human-written prose — descriptions, guidelines, rationale, accessibility notes. These fields use a shared type called **`richText`** that supports three content formats: plain text, Markdown, and HTML.

#### String Form (backward compatible)

A `richText` field _MAY_ be a bare JSON string. When a bare string is provided, the format is assumed to be **`markdown`** for backward compatibility with DSDS 0.1 documents.

```json
{
  "description": "An interactive element that triggers an action when activated."
}
```

This is equivalent to:

```json
{
  "description": {
    "value": "An interactive element that triggers an action when activated.",
    "format": "markdown"
  }
}
```

#### Object Form (explicit format)

A `richText` field _MAY_ be an object with a `value` and a `format` property, both required:

| Property | Type | Required | Description |
|---|---|---|---|
| `value` | `string` | Yes | The text content. |
| `format` | `string` | Yes | The content format. _MUST_ be one of: `"plain"`, `"markdown"`, `"html"`. |

**Format definitions:**

| Format | Description |
|---|---|
| `"plain"` | Unformatted text. No markup of any kind. Tools _MUST_ render as-is. Suitable for short descriptions, labels, and content consumed by systems that cannot render markup. |
| `"markdown"` | [CommonMark](https://spec.commonmark.org/) syntax. Where tooling renders rich text, it _MUST_ support, at a minimum, CommonMark as described by [CommonMark 0.27](https://spec.commonmark.org/0.27/). Tooling _MAY_ support extensions but _SHOULD NOT_ rely on them for interoperability. This is the default format when a bare string is used. |
| `"html"` | Sanitized HTML. Tools _MUST_ sanitize HTML content before rendering to prevent script injection and other security risks. Suitable for content migrated from CMS platforms or documentation tools that produce HTML output. |

**Examples:**

```json
{
  "description": {
    "value": "An interactive element that triggers an action when activated.",
    "format": "plain"
  }
}
```

```json
{
  "description": {
    "value": "An interactive element that triggers an action when activated. See the [usage guidelines](#guidelines) for placement rules.",
    "format": "markdown"
  }
}
```

```json
{
  "description": {
    "value": "<p>An interactive element that triggers an action when activated.</p><p>See the <a href=\"#guidelines\">usage guidelines</a> for placement rules.</p>",
    "format": "html"
  }
}
```

#### Where `richText` Applies

The `richText` type is used for all fields that contain human-written prose. This includes:

- `description` — on all artifacts, anatomy parts, API properties, events, slots, CSS custom properties, CSS parts, data attributes, methods, scale steps, and responsive entries
- `guidance` and `rationale` — in guideline and accessibility guideline objects
- `acceptedContent` — on slot objects
- `screenReaderBehavior`, `focusManagement`, and `motionConsiderations` — on accessibility objects

The `summary` field is _not_ a `richText` field. It is always a plain string and _MUST NOT_ contain markup.

#### Tool Behavior

Tools _MUST_ accept both the string form and the object form for any `richText` field. When encountering a bare string, tools _MUST_ treat it as `format: "markdown"`.

Tools that do not support a particular format _SHOULD_ fall back gracefully:
- For `"markdown"` content, tools that cannot render Markdown _SHOULD_ strip formatting and display the plain text.
- For `"html"` content, tools that cannot render HTML _SHOULD_ strip tags and display the plain text.
- For `"plain"` content, tools _MUST_ render as-is without applying any markup interpretation.

#### Security Considerations

When `format` is `"html"`, tools _MUST_ sanitize the content before rendering. At minimum, tools _MUST_ remove or neutralize `<script>` elements, `on*` event handler attributes, `javascript:` URIs, and any other vectors for script injection. Tools _MAY_ restrict the allowed HTML elements and attributes to a safe subset (e.g., headings, paragraphs, lists, links, code, emphasis, tables).

### 5.2 Status

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | The lifecycle status. _MUST_ be one of: `"draft"`, `"experimental"`, `"stable"`, `"deprecated"`. |
| `deprecationNotice` | `string` | Conditional | Required when `status` is `"deprecated"`. _MUST_ explain what to use instead. |
| `since` | `string` | No | The version of the design system in which this artifact was introduced. |

**Status definitions:**

| Status | Meaning |
|---|---|
| `draft` | Under development. Not ready for use. |
| `experimental` | Available for use. API and behavior may change without notice. |
| `stable` | Ready for production use. Changes follow semantic versioning. |
| `deprecated` | Scheduled for removal. `deprecationNotice` explains the replacement. |

### 5.3 Tags

| Property | Type | Required | Description |
|---|---|---|---|
| `tags` | `string[]` | No | An array of freeform tags for categorization and search. |

### 5.4 Related Artifacts

| Property | Type | Required | Description |
|---|---|---|---|
| `related` | `array` | No | An array of related artifact references. |

Each element of `related` _MUST_ be an object with:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The `name` of the related artifact. |
| `type` | `string` | Yes | The artifact type: `"component"`, `"token"`, `"tokenGroup"`, `"foundation"`. |
| `relationship` | `string` | Yes | A description of the relationship (e.g., `"alternative"`, `"parent"`, `"child"`, `"related"`). |

### 5.5 Links

| Property | Type | Required | Description |
|---|---|---|---|
| `links` | `array` | No | An array of external links to resources related to this artifact. See [§11 Links](#11-links). |

---

## 13. Extensions

### 13.1 The `$extensions` Property

The optional `$extensions` property is an object where tools _MAY_ add proprietary, user-, team-, or vendor-specific data. This property _MAY_ appear on any object within a DSDS document.

Each key within `$extensions` _MUST_ use a vendor-specific namespace. Reverse domain name notation is recommended to avoid naming collisions.

```json
{
  "$extensions": {
    "com.designTool": {
      "componentId": "abc123def456"
    },
    "com.storybook": {
      "storyId": "components-button--primary"
    }
  }
}
```

Note that navigable URLs belong in `links` (see [§12 Links](#12-links)), while tool-specific internal identifiers belong here.

### 13.2 Preservation

Tools that process DSDS files _MUST_ preserve any `$extensions` data they do not understand. If a DSDS document contains extensions from Tool A and is processed by Tool B, Tool B _MUST_ include Tool A's extension data when saving the document.

### 13.3 Non-interference

Extension data _SHOULD_ be restricted to metadata that is not essential for understanding the documented artifact. The core documentation _MUST_ be fully comprehensible without any extension data.

---

## 14. Conformance Levels

DSDS defines two conformance levels. These levels help design system teams adopt the format incrementally.

### 14.1 Level 1: Core

A **Level 1** conformant document _MUST_ include:

- Valid `dspiVersion` and `documentType` root properties.
- The corresponding artifact object (e.g., `component`, `token`, `foundation`).
- All required common properties: `name`, `displayName`, `description`, `status`.
- For tokens: `tokenType`.
- For foundations: `category`.

A Level 1 document provides the minimum metadata for a tool to catalog and display the artifact.

### 14.2 Level 2: Complete

A **Level 2** conformant document _MUST_ include everything in Level 1, plus:

- **For components:** At least one of `anatomy`, `api`, or `guidelines`.
- **For tokens:** At least one of `api`, `guidelines`, or `value`.
- **For foundations:** At least one of `principles`, `guidelines`, or `scales`.

A Level 2 document provides enough information for a reader to understand how to use the artifact.

### 14.3 Validation

Tools _SHOULD_ indicate the conformance level of a DSDS document. Tools _MAY_ provide warnings for documents that meet Level 1 but not Level 2, encouraging completeness without blocking adoption.

---

## A. JSON Schema

A JSON Schema for validating DSDS documents is provided as a companion file:

- `dsds.schema.json`

The schema validates the structure defined in this specification and can be used by editors, CI pipelines, and documentation tools to ensure DSDS documents are well-formed.

See the `spec/schema/` directory for the full schema.

---

## B. Examples

Complete examples are provided in the `spec/examples/` directory:

| File | Description |
|---|---|
| `button.dsds.json` | A complete Level 2 component documentation example for a Button. |
| `color-tokens.dsds.json` | Token documentation for a set of color tokens. |
| `spacing-foundation.dsds.json` | Foundation documentation for a spacing system. |

---

## C. Design Principles

_This section is non-normative._

The following principles guided the design of this specification:

### C.1 Documentation is a product

Design system documentation is consumed by designers, engineers, QA, product managers, and (increasingly) AI models. It deserves the same rigor as the components it describes.

### C.2 Structure enables quality

Unstructured documentation tends toward inconsistency. A defined format creates a floor of quality and completeness.

### C.3 Guidance without justification is incomplete

Every recommendation should be answerable with "why?". The `rationale` field exists to make design system teams accountable for their guidance — and to help consumers understand the thinking behind the rules.

### C.4 Documentation should be portable

Teams change tools. Documentation should survive the transition. A standard format makes migration tractable.

### C.5 Education is a responsibility

Design systems that hide complexity create dependency. Documentation should explain not just _what_ to do, but _why_ and _how_ — building the reader's understanding of fundamentals along the way.

### C.6 Specificity over subjectivity

"Use sparingly" is not guidance. "Limit to one per surface" is. DSDS's structure nudges authors toward concrete, testable statements.

---

## D. References

### D.1 Normative References

- **[RFC2119]** Bradner, S. "Key words for use in RFCs to Indicate Requirement Levels." BCP 14, RFC 2119. March 1997. https://www.rfc-editor.org/rfc/rfc2119
- **[RFC8174]** Leiba, B. "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words." BCP 14, RFC 8174. May 2017. https://www.rfc-editor.org/rfc/rfc8174
- **[RFC8259]** Bray, T., Ed. "The JavaScript Object Notation (JSON) Data Interchange Format." RFC 8259. December 2017. https://www.rfc-editor.org/rfc/rfc8259

### D.2 Informative References

- **[DTCG-FORMAT]** Design Tokens Community Group. "Design Tokens Format Module 2025.10." W3C Community Group Final Report. October 2025. https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
- **[DTCG-COLOR]** Design Tokens Community Group. "Design Tokens Color Module 2025.10." W3C Community Group Final Report. October 2025. https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/
- **[DTCG-RESOLVER]** Design Tokens Community Group. "Design Tokens Resolver Module 2025.10." W3C Community Group Final Report. October 2025. https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/
- **[OPENAPI]** OpenAPI Initiative. "OpenAPI Specification v3.2.0." September 2025. https://spec.openapis.org/oas/v3.2.0.html
- **[CommonMark]** CommonMark Spec. https://spec.commonmark.org/
- **[CommonMark-0.27]** CommonMark Spec, Version 0.27. John MacFarlane. 18 November 2016. https://spec.commonmark.org/0.27/
- **[JSON-Schema-2020-12]** JSON Schema: A Media Type for Describing JSON Documents. Draft 2020-12. Austin Wright; Henry Andrews; Ben Hutton; Greg Dennis. IETF. 10 June 2022. https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-01
- **[WCAG21]** W3C. "Web Content Accessibility Guidelines (WCAG) 2.1." W3C Recommendation. June 2018. https://www.w3.org/TR/WCAG21/
- **[WAI-ARIA]** W3C. "Accessible Rich Internet Applications (WAI-ARIA) 1.2." W3C Recommendation. June 2023. https://www.w3.org/TR/wai-aria-1.2/

---

*End of specification.*
