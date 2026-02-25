# DSDS Common Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the shared primitive types used across all DSDS schemas. These types provide the building blocks that entity schemas and guideline schemas compose — text formatting, lifecycle status, external links, visual examples, vendor extensions, system metadata, and use case scenarios.

> **Property tables** for each type are auto-generated from the schema JSON files and available on the corresponding schema reference pages. This module provides prose context, usage guidance, and examples.

---

## 1. Rich Text (`richText`)

**Schema reference:** `common/rich-text.schema.json`

Many fields in DSDS contain human-written prose — descriptions, guidance, rationale, accessibility notes. These fields use the `richText` type, which supports three content formats: plain text, Markdown, and HTML.

### 1.1 String Form

A `richText` field _MAY_ be a bare JSON string. When a bare string is provided, the format is assumed to be **`markdown`**.

```json
{
  "description": "An interactive element that triggers an action when activated."
}
```

### 1.2 Object Form

A `richText` field _MAY_ be an object with `value` and `format` properties for explicit format control.

The three supported formats:

- **`"plain"`** — Unformatted text. No markup of any kind. Tools _MUST_ render as-is.
- **`"markdown"`** — [CommonMark](https://spec.commonmark.org/) syntax. Tools _MUST_ support CommonMark 0.27 at minimum. This is the default format when a bare string is used.
- **`"html"`** — Sanitized HTML. Tools _MUST_ sanitize content before rendering to prevent script injection.

```json
{
  "description": {
    "value": "An interactive element that triggers an action when activated. See the [usage guidelines](#guidelines) for placement rules.",
    "format": "markdown"
  }
}
```

### 1.3 Where `richText` Applies

The `richText` type is used for:

- `description` — on all entities, anatomy entries, API properties/events/slots, scale steps, and responsive entries
- `guidance` and `rationale` — in best practice entries
- `acceptedContent` — on API slot objects
- `screenReaderBehavior`, `focusManagement`, and `motionConsiderations` — on accessibility guidelines

The `summary` field is _not_ a `richText` field. It is always a plain string and _MUST NOT_ contain markup.

### 1.4 Tool Behavior

Tools _MUST_ accept both the string form and the object form for any `richText` field. When encountering a bare string, tools _MUST_ treat it as `format: "markdown"`.

Tools that do not support a particular format _SHOULD_ fall back gracefully:
- For `"markdown"` content, strip formatting and display plain text.
- For `"html"` content, strip tags and display plain text.
- For `"plain"` content, render as-is.

### 1.5 Security Considerations

When `format` is `"html"`, tools _MUST_ sanitize the content before rendering. At minimum, tools _MUST_ remove or neutralize `<script>` elements, `on*` event handler attributes, `javascript:` URIs, and any other vectors for script injection.

---

## 2. Status (`statusObject`)

**Schema reference:** `common/status.schema.json`

The `statusObject` consolidates lifecycle status, per-platform readiness, and deprecation notices into a single reusable object. Every entity carries status as an object, not a bare string.

See the schema reference page for the full property table covering `statusObject`, `statusValue`, and `platformStatusEntry`.

### 2.1 Status Values

Standard values for the `status` string:

- **`"draft"`** — Under development. Not ready for use.
- **`"experimental"`** — Available for use. API and behavior may change without notice.
- **`"stable"`** — Ready for production use. Changes follow semantic versioning.
- **`"deprecated"`** — Scheduled for removal. `deprecationNotice` explains the replacement.

Custom values are permitted and _SHOULD_ be lowercase kebab-case (e.g., `"sunset"`, `"archived"`, `"beta"`).

### 2.2 Platform Status

The optional `platformStatus` property provides per-platform readiness tracking. Keys are platform identifiers (freeform strings such as `"react"`, `"web-component"`, `"ios"`, `"android"`, `"flutter"`, `"figma"`, `"sketch"`, `"compose"`). Values are platform status entry objects, each carrying their own `status`, optional `since`, optional `deprecationNotice`, and optional `description`.

An entity _MAY_ be `"stable"` overall while individual platforms are still `"experimental"` or `"draft"`. Platform keys _MAY_ also represent testing readiness dimensions (e.g., `"a11y-keyboard"`, `"a11y-screen-reader"`) in addition to platform/framework names.

**Example:**

<!-- dsds:include spec/examples/common/status.json#/statusObject/1 -->
```json
{
  "status": "stable",
  "platformStatus": {
    "react": {
      "status": "stable",
      "since": "1.0.0"
    },
    "web-component": {
      "status": "experimental",
      "since": "3.2.0",
      "description": "Available as a Web Component wrapper. Native shadow DOM implementation planned for v4."
    },
    "ios": {
      "status": "stable",
      "since": "2.1.0"
    },
    "android": {
      "status": "draft",
      "description": "Compose implementation in progress. Expected in v4.0."
    },
    "figma": {
      "status": "stable",
      "since": "1.0.0"
    },
    "vue": {
      "status": "deprecated",
      "since": "1.5.0",
      "deprecationNotice": "The Vue wrapper is deprecated. Use the Web Component directly in Vue applications."
    }
  }
}
```
<!-- /dsds:include -->

### 2.3 Relationship to Top-Level Status

The top-level `status` property represents the entity's overall lifecycle stage. `platformStatus` provides detail that the top-level status cannot capture.

When both are present:

- Tools _SHOULD_ display the top-level `status` as the primary status indicator.
- Tools _MAY_ display `platformStatus` as supplementary detail (e.g., in a readiness matrix or per-platform badge row).

---

## 3. Links (`link`)

**Schema reference:** `common/link.schema.json`

The `links` array provides typed references to external resources and related artifacts. Links serve dual purposes: pointing to external resources (source code, design files, documentation, packages) and expressing relationships to other DSDS entities (alternatives, parents, children).

See the schema reference page for the full property table.

### 3.1 Standard Link Types

**External types:**

- `"source"` — Source code for the entity's implementation.
- `"design"` — Design file, node, or variable associated with the entity.
- `"storybook"` — Interactive component documentation or demo.
- `"documentation"` — External documentation page.
- `"package"` — Published package containing the entity.
- `"repository"` — The top-level repository containing the entity's source.

**Relationship types:**

- `"alternative"` — A different entity that serves a similar purpose.
- `"parent"` — The parent entity that contains or composes this one.
- `"child"` — A child entity contained within or composed by this one.
- `"related"` — A general association to another entity.

Custom `type` values are permitted and _SHOULD_ be lowercase strings matching `^[a-z][a-z0-9-]*$`. Tools _MUST NOT_ reject a link because its `type` is not in the standard list.

### 3.2 Multiple Links of the Same Type

An entity _MAY_ have multiple links with the same `type`. When multiple links share a `type`, the `label` property _SHOULD_ be provided to distinguish them.

### 3.3 Example

<!-- dsds:include spec/examples/common/link.json#/link -->
```json
[
  {
    "type": "source",
    "url": "https://code.acme.com/design-system/src/components/button/button.tsx",
    "label": "React component source"
  },
  {
    "type": "design",
    "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
    "label": "Design file — component"
  },
  {
    "type": "documentation",
    "url": "https://design.acme.com/components/button",
    "label": "Button documentation"
  },
  {
    "type": "storybook",
    "url": "https://storybook.acme.com/?path=/docs/components-button--docs",
    "label": "Interactive docs"
  },
  {
    "type": "package",
    "url": "https://www.npmjs.com/package/@acme/components",
    "label": "npm package"
  },
  {
    "type": "repository",
    "url": "https://code.acme.com/design-system",
    "label": "Repository root"
  },
  {
    "type": "alternative",
    "url": "https://design.acme.com/components/link",
    "label": "Link component (alternative)"
  },
  {
    "type": "parent",
    "url": "https://design.acme.com/components/button-group",
    "label": "Button Group (parent)"
  }
]
```
<!-- /dsds:include -->

### 3.4 Links vs. Extensions

Links are a first-class property because source code, design files, and interactive demos are universal to design system documentation — not vendor-specific metadata. Data that is specific to a tool's internal representation (e.g., design tool component keys, Storybook story IDs, internal build hashes) _SHOULD_ remain in `$extensions`.

**Rule of thumb:** If the data is a URL that a human would click to navigate to a resource, it belongs in `links`. If the data is an internal identifier consumed programmatically by a specific tool, it belongs in `$extensions`.

---

## 4. Examples (`example`, `examples`)

**Schema reference:** `common/example.schema.json`

Examples are visual or interactive demonstrations of a documented entity. They appear as hero previews, annotated diagrams, code snippets, video walkthroughs, and links to live interactive demos.

DSDS defines a single, reusable example model that supports four media types: images, videos, code snippets, and URLs. This model is used both for nesting within other guideline items (best-practice examples, variant previews, state previews, interaction illustrations) and as a top-level guideline container.

See the schema reference page for the full property tables covering `example`, `examples`, and the four presentation types.

### 4.1 The Two Example Shapes

**`example`** — The raw example object used for nesting within other structures (best-practice `examples`, variant `preview`, state `preview`, interaction `examples`, anatomy `preview`). Every example requires a `presentation` — one of the four media types.

**`examples`** — The guideline container used as a top-level guideline in an entity's `guidelines` array. Wraps individual example objects in an `items` array with a `type: "examples"` discriminator.

### 4.2 Presentation Types

Each presentation is a typed object with a `type` property that determines its shape:

- **`"image"`** — A static image. Requires `url` and `alt`.
- **`"video"`** — A video recording or animation. Requires `url` and `alt`.
- **`"code"`** — A source code snippet. Requires `code` and `language`.
- **`"url"`** — A link to any web resource (Storybook stories, CodeSandbox embeds, StackBlitz projects, etc.). Requires `url`.

### 4.3 Examples Container

When examples appear as a top-level guideline in an entity's `guidelines` array, they use the `examples` container:

<!-- dsds:include spec/examples/common/example.json#/examples -->
```json
{
  "type": "examples",
  "items": [
    {
      "title": "All button variants",
      "presentation": {
        "type": "image",
        "url": "https://design.acme.com/assets/button-hero.png",
        "alt": "A row of four buttons showing the primary, secondary, ghost, and danger variants side by side, each in their default state."
      }
    },
    {
      "title": "Interactive primary button",
      "presentation": {
        "type": "url",
        "url": "https://storybook.acme.com/?path=/story/components-button--primary"
      }
    },
    {
      "title": "Basic primary button usage",
      "presentation": {
        "type": "code",
        "code": "<Button variant=\"primary\" onClick={handleSave}>Save</Button>",
        "language": "jsx"
      }
    }
  ]
}
```
<!-- /dsds:include -->

### 4.4 Alt Text Requirements

Image and video examples _MUST_ include an `alt` property. When writing alt text:

- **Describe what is shown, not what it means.** "A primary button with a blue background and white label 'Save'" is better than "The correct way to use a button."
- **Include relevant visual details.** Colors, sizes, states, and text content visible in the image or video should be mentioned when they are the point of the example.
- **Keep it concise but complete.** One to three sentences is typical.
- **For videos, describe the sequence of events.** "A user clicks the button. The label is replaced by a spinner. After two seconds, the button returns to its default state."

### 4.5 Where Examples Appear

| Location | Schema type | Description |
|---|---|---|
| Entity `guidelines` array | `examples` container | Top-level hero previews and demonstrations. |
| Best practice `examples` | `example` (raw) | Inline visual examples within a best practice's guidance. |
| Variant value `preview` | `example` (raw) | Visual demonstration of a specific variant value. |
| State entry `preview` | `example` (raw) | Visual demonstration of a specific interactive state. |
| Interaction entry `examples` | `example` (raw) | Illustration of a specific interaction step within a pattern. |
| Anatomy `preview` | `example` (raw) | Annotated diagram of the assembled component structure. |

---

## 5. Extensions (`$extensions`)

**Schema reference:** `common/extensions.schema.json`

The `$extensions` property is available on the root document, on each documentation group, and on each entity. It provides an open object for vendor-specific metadata that does not belong in the core schema.

### 5.1 Rules

- Keys _MUST_ use vendor-specific namespaces (reverse domain name notation recommended).
- Tools that do not recognize an extension _MUST_ preserve it (round-trip safety).
- Extension data _SHOULD NOT_ duplicate information available in core schema fields.
- Extensions _MUST NOT_ alter the semantics of core schema properties.

**Example:**

```json
{
  "$extensions": {
    "com.designTool": {
      "componentId": "abc123def456",
      "lastSync": "2025-01-15T10:30:00Z"
    },
    "com.storybook": {
      "storyId": "components-button--primary"
    }
  }
}
```

---

## 6. Metadata (`metadata`)

**Schema reference:** `common/metadata.schema.json`

The optional `metadata` object on the root DSDS document provides context about the design system — its name, version, organization, URL, and license.

See the schema reference page for the full property table.

**Example:**

<!-- dsds:include spec/examples/common/metadata.json#/metadata -->
```json
{
  "systemName": "Acme Design System",
  "systemVersion": "2.4.0",
  "organization": "Acme Corp",
  "url": "https://design.acme.com",
  "license": "MIT"
}
```
<!-- /dsds:include -->

---

## 7. Use Cases (`useCase`, `useCases`)

**Schema reference:** `common/usecase.schema.json`

Use cases provide scenario-driven guidance for when to use and when not to use an entity or option. The use case types defined here are the raw data model — they carry no guideline `type` discriminator. They are used for nesting inside variant values, state entries, and as the content of the [purpose guideline type](guidelines.md).

See the schema reference page for the full property tables covering `useCase` and `useCases`.

### 7.1 Alternatives

Each `whenNotToUse` entry _SHOULD_ include an `alternative` object with the `name` of a recommended alternative entity and an optional `rationale` explaining why the alternative is more appropriate. Cite semantic differences, accessibility implications, or UX rationale when available.

### 7.2 Inline vs. Guideline Use

When use cases appear as a top-level guideline in an entity's `guidelines` array, they use the [purpose guideline type](guidelines.md), which wraps the same `useCase` data model with a `type: "purpose"` discriminator.

When use cases appear nested inside variant values or state entries, they use the `useCases` object directly (no `type` discriminator needed since the parent context provides the type).

### 7.3 Writing Guidance (Non-normative)

_This section is non-normative._

**`whenToUse` entries should be:**

- **Scenario-driven.** Describe the user's situation, not the entity's features. _"When the user needs to trigger an action"_ is better than _"When you need a clickable element."_
- **Concrete.** Include specific actions or contexts. _"When submitting a form, saving data, or opening a dialog"_ is better than _"When an action is needed."_

**`whenNotToUse` entries should:**

- **Always suggest an alternative.** A "don't use this" without a "use that instead" leaves the reader stuck.
- **Explain why the alternative is better.** The `rationale` should cite concrete reasons — semantic differences, accessibility implications, or user experience improvements.
- **Be specific about the boundary.** _"When the action navigates to a different page"_ draws a clear line. _"When a button isn't appropriate"_ does not.

---

## 8. Document Structure

**Schema reference:** `dsds.schema.json`

A DSDS file is a JSON object with a `dsdsVersion` string and a `documentation` array. See the root schema reference page for the full property tables covering the root document and `documentationGroup`.

### 8.1 Root Shape

The root object requires `dsdsVersion` and `documentation`. The optional `metadata` provides system-level context. The optional `$extensions` allows vendor-specific data at the document level.

### 8.2 Documentation Groups

Each entry in `documentation` is a named collection of typed entities. Entities of different types can be mixed freely in a single `items` array — each entity identifies itself via a `type` discriminator property.

### 8.3 Entity Type Discriminators

Every entity carries a required `type` property:

| `type` value | Entity | Description |
|---|---|---|
| `"component"` | Component | A reusable UI component |
| `"token"` | Token | A single design token |
| `"token-group"` | Token Group | A hierarchical group of related tokens (recursive) |
| `"theme"` | Theme | A named set of token value overrides |
| `"style"` | Style | A macro-level visual style |
| `"pattern"` | Pattern | A broad interaction pattern |

Entities of different types can be mixed in any order within the same `items` array.

---

*See [Entities Module](entities.md) for entity type documentation and [Guidelines Module](guidelines.md) for guideline type documentation.*