# DSDS Components Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the structure for documenting reusable UI components, including their identity, anatomy, code-level API (with platform-aware and JSON Schema support), variants, states, design specifications, and content guidelines.

---

## 6. Component Documentation

A component documentation object describes a single reusable UI component. It includes the component's identity, API, anatomy, visual specifications, and usage guidance.

### 6.1 Structure

A component object _MUST_ include the [common properties](#5-common-properties) (`name`, `displayName`, `description`, `status`) and _MAY_ include the properties defined below.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | See [§5.1](#51-identification). |
| `displayName` | `string` | Yes | See [§5.1](#51-identification). |
| `summary` | `string` | No | See [§5.1](#51-identification). |
| `description` | `string` | Yes | See [§5.1](#51-identification). CommonMark supported. |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | See [§5.2](#52-status). |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `category` | `string` | No | A classification for the component. See [§6.2](#62-category). |
| `preview` | `array` | No | Visual previews of the component. Displayed alongside `displayName` and `description` as the hero representation. See [§9 Examples](#9-examples). |
| `anatomy` | `object` | No | The visual structure of the component. See [§6.3](#63-anatomy). |
| `api` | `object` | No | The code-level API. Accepts a single API object or a platform-keyed map of API objects. See [§6.4](#64-api). |
| `variants` | `array` | No | Named visual/behavioral configurations. See [§6.5](#65-variants). |
| `states` | `array` | No | Interactive states. See [§6.6](#66-states). |
| `designSpecifications` | `object` | No | Visual design specs. See [§6.7](#67-design-specifications). |
| `guidelines` | `object` | No | Usage guidance. See [§10 Guidelines Structure](#10-guidelines-structure). |
| `accessibility` | `object` | No | Accessibility documentation. See [§11 Accessibility Structure](#11-accessibility-structure). |
| `contentGuidelines` | `array` | No | Guidelines for the content within the component. See [§6.8](#68-content-guidelines). |
| `related` | `array` | No | See [§5.5](#55-related-artifacts). |
| `links` | `array` | No | See [§5.6](#56-links) and [§12 Links](#12-links). |
| `$extensions` | `object` | No | See [§13 Extensions](#13-extensions). |

### 6.2 Category

The optional `category` property classifies the component within a design system's taxonomy. Common values include:

- `"action"` — Buttons, links, and other interactive triggers.
- `"input"` — Form elements and data entry controls.
- `"display"` — Elements for presenting content (cards, badges, avatars).
- `"feedback"` — Alerts, toasts, progress indicators.
- `"navigation"` — Tabs, breadcrumbs, menus.
- `"layout"` — Containers, grids, dividers.
- `"overlay"` — Modals, popovers, tooltips.

These values are recommendations, not an exhaustive list. Design systems _MAY_ define their own categories. The value _MUST_ be a lowercase string matching the pattern `^[a-z][a-z0-9-]*$`.

### 6.3 Anatomy

The `anatomy` property documents the named sub-elements that make up a component's visual structure.

| Property | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | No | A general description of the component's anatomy. |
| `parts` | `array` | Yes | An array of anatomy part objects. |

Each part object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable name of the part (e.g., `"container"`, `"label"`, `"icon"`). |
| `displayName` | `string` | No | Human-readable name. Defaults to `name` if omitted. |
| `description` | `string` | Yes | What this part is and what it does. |
| `required` | `boolean` | Yes | Whether this part is always present (`true`) or conditionally rendered (`false`). |
| `tokens` | `string[]` | No | Names of design tokens applied to this part. |

**Example:**

```json
{
  "anatomy": {
    "description": "The Button component is composed of a container, a text label, and an optional leading or trailing icon.",
    "parts": [
      {
        "name": "container",
        "displayName": "Container",
        "description": "The outer boundary of the button. Receives background color, border, and padding.",
        "required": true,
        "tokens": ["button-background", "button-border-radius", "button-padding-horizontal", "button-padding-vertical"]
      },
      {
        "name": "label",
        "displayName": "Label",
        "description": "The text content of the button.",
        "required": true,
        "tokens": ["button-font-family", "button-font-size", "button-font-weight", "button-text-color"]
      },
      {
        "name": "icon",
        "displayName": "Icon",
        "description": "An optional icon displayed before or after the label.",
        "required": false,
        "tokens": ["button-icon-size", "button-icon-gap"]
      }
    ]
  }
}
```

### 6.4 API

The `api` property documents the code-level interface of the component. It follows patterns established by the [OpenAPI Specification](https://spec.openapis.org/oas/latest.html), adapted from HTTP API description to UI component description.

#### 6.4.0 Single-Platform and Multi-Platform Forms

The `api` field _MAY_ take one of two forms:

**Single-platform form** — a single API object. Use this when the component has one canonical implementation (e.g., a React-only system or a Web Component).

```json
{
  "api": {
    "properties": [ ... ],
    "events": [ ... ]
  }
}
```

**Multi-platform form** — a map where each key is a platform or framework identifier and each value is an API object. Use this when the same component ships across multiple frameworks with different API surfaces.

```json
{
  "api": {
    "react": {
      "properties": [ ... ],
      "events": [ ... ]
    },
    "web-component": {
      "properties": [ ... ],
      "events": [ ... ],
      "slots": [ ... ],
      "cssCustomProperties": [ ... ],
      "cssParts": [ ... ]
    },
    "vue": {
      "properties": [ ... ],
      "events": [ ... ],
      "slots": [ ... ]
    }
  }
}
```

Platform keys _SHOULD_ be lowercase strings matching the pattern `^[a-z][a-z0-9-]*$`. Common values include: `"react"`, `"vue"`, `"angular"`, `"svelte"`, `"web-component"`, `"swift"`, `"kotlin"`, `"flutter"`.

Tools _MUST_ distinguish the two forms by inspecting the top-level keys: if any of the standard API object keys (`properties`, `events`, `slots`, `cssCustomProperties`, `cssParts`, `dataAttributes`, `methods`) are present, the value is a single-platform API object. Otherwise, each key is treated as a platform identifier.

This design mirrors the OpenAPI Specification's pattern of keying content descriptions by media type (§4.14 Media Type Object), adapted for the analogous problem of a single component having different API surfaces across platforms.

#### 6.4.1 API Object Structure

Each API object (whether the sole value or one of many in a platform-keyed map) _MAY_ contain:

| Property | Type | Required | Description |
|---|---|---|---|
| `properties` | `array` | No | Configurable properties (props, attributes). |
| `events` | `array` | No | Events emitted by the component. |
| `slots` | `array` | No | Content insertion points. |
| `cssCustomProperties` | `array` | No | CSS custom properties exposed for styling. |
| `cssParts` | `array` | No | CSS shadow parts for external styling. |
| `dataAttributes` | `array` | No | Data attributes used for state or styling hooks. |
| `methods` | `array` | No | Public methods callable on the component instance. |

#### 6.4.2 Properties

Each property object documents a configurable input of the component. The structure draws from the OpenAPI Specification's Parameter Object (§4.12), which pairs a human-readable `description` with a machine-readable `schema` for the same parameter.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The property name as used in code. |
| `type` | `string` | Yes | A human-readable type description for display in documentation (e.g., `"string"`, `"boolean"`, `"'primary' \| 'secondary' \| 'ghost'"`, `"ReactNode"`). |
| `schema` | `object` | No | A [JSON Schema](https://json-schema.org/draft/2020-12/json-schema-core) object defining the property's type in a machine-readable form. See [§6.4.2.1](#6421-the-schema-field). |
| `description` | `string` | Yes | What this property controls. CommonMark _MAY_ be used. |
| `required` | `boolean` | Yes | Whether this property is required. |
| `default` | `string` | No | The default value as a string representation for display. |
| `defaultValue` | | No | The default value in its native JSON type. When present, tools _SHOULD_ prefer this over `default` for machine consumption. |
| `examples` | `array` | No | Example values for this property. See [§6.4.2.2](#6422-property-examples). |
| `since` | `string` | No | The version of the design system in which this property was introduced. |
| `deprecated` | `boolean` | No | Whether this property is deprecated. |
| `deprecationNotice` | `string` | No | What to use instead, if deprecated. |

##### 6.4.2.1 The `schema` Field

The optional `schema` field provides a machine-readable type definition using [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-core). This follows the pattern established by the OpenAPI Specification (§4.24 Schema Object), where a schema allows tools to validate values, generate types, and power autocomplete — capabilities that the human-readable `type` string cannot support.

The `type` field (human-readable) and `schema` field (machine-readable) _MAY_ coexist on the same property. When both are present:
- `type` is the display string shown in documentation.
- `schema` is the source of truth for tools performing validation, code generation, or type checking.

When `schema` is absent, `type` is the only type information available and tools _MUST NOT_ attempt to parse it programmatically.

**Example — property with both `type` and `schema`:**

```json
{
  "name": "variant",
  "type": "'primary' | 'secondary' | 'ghost' | 'danger'",
  "schema": {
    "type": "string",
    "enum": ["primary", "secondary", "ghost", "danger"],
    "default": "primary"
  },
  "description": "The visual style of the button.",
  "required": false,
  "default": "'primary'",
  "defaultValue": "primary"
}
```

**Example — numeric property with constraints:**

```json
{
  "name": "maxLength",
  "type": "number",
  "schema": {
    "type": "integer",
    "minimum": 0,
    "maximum": 10000
  },
  "description": "The maximum number of characters the input accepts.",
  "required": false
}
```

**Example — complex property:**

```json
{
  "name": "columns",
  "type": "Column[]",
  "schema": {
    "type": "array",
    "items": {
      "type": "object",
      "required": ["key", "label"],
      "properties": {
        "key": { "type": "string" },
        "label": { "type": "string" },
        "sortable": { "type": "boolean", "default": false },
        "width": { "type": "string" }
      }
    }
  },
  "description": "Column definitions for the data table. Each column must have a unique `key` and a display `label`.",
  "required": true
}
```

##### 6.4.2.2 Property Examples

The optional `examples` array provides concrete usage examples for a property. Each element _MUST_ be an object with:

| Property | Type | Required | Description |
|---|---|---|---|
| `value` | | Yes | The example value, in its native JSON type. |
| `label` | `string` | No | A short description of the example. |

**Example:**

```json
{
  "name": "size",
  "type": "'small' | 'medium' | 'large'",
  "schema": {
    "type": "string",
    "enum": ["small", "medium", "large"],
    "default": "medium"
  },
  "description": "The size of the button. Affects padding, font size, and minimum target area.",
  "required": false,
  "default": "'medium'",
  "defaultValue": "medium",
  "examples": [
    { "value": "small", "label": "Compact density — for toolbars and dense layouts" },
    { "value": "large", "label": "Touch-optimized — for mobile-first surfaces" }
  ]
}
```

#### 6.4.3 Events

Each event object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The event name (e.g., `"onClick"`, `"change"`, `"close"`). |
| `description` | `string` | Yes | When this event fires and what it communicates. CommonMark _MAY_ be used. |
| `payload` | `string` | No | Description of the event payload shape. |
| `since` | `string` | No | The version in which this event was introduced. |

#### 6.4.4 Slots

Each slot object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The slot name. Use `"default"` for the unnamed/default slot. |
| `description` | `string` | Yes | What content belongs in this slot. CommonMark _MAY_ be used. |
| `acceptedContent` | `string` | No | Description of valid content types. |
| `since` | `string` | No | The version in which this slot was introduced. |

#### 6.4.5 CSS Custom Properties

Each CSS custom property object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The full property name including `--` prefix (e.g., `"--button-background"`). |
| `description` | `string` | Yes | What this property controls visually. CommonMark _MAY_ be used. |
| `default` | `string` | No | The default value. |
| `type` | `string` | No | The expected CSS value type (e.g., `"color"`, `"dimension"`, `"font-family"`). |
| `since` | `string` | No | The version in which this custom property was introduced. |

#### 6.4.6 CSS Parts

Each CSS part object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The part name as used in `::part()` selectors. |
| `description` | `string` | Yes | What visual element this part exposes. CommonMark _MAY_ be used. |
| `since` | `string` | No | The version in which this part was introduced. |

#### 6.4.7 Data Attributes

Each data attribute object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The full attribute name including `data-` prefix. |
| `description` | `string` | Yes | What this attribute represents. CommonMark _MAY_ be used. |
| `values` | `string[]` | No | The set of possible values, if applicable. |
| `since` | `string` | No | The version in which this attribute was introduced. |

#### 6.4.8 Methods

Each method object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The method name. |
| `description` | `string` | Yes | What calling this method does. CommonMark _MAY_ be used. |
| `parameters` | `string` | No | Description of the parameter signature. |
| `returnType` | `string` | No | Description of the return value. |
| `since` | `string` | No | The version in which this method was introduced. |

**Single-platform example (abbreviated):**

```json
{
  "api": {
    "properties": [
      {
        "name": "variant",
        "type": "'primary' | 'secondary' | 'ghost'",
        "schema": {
          "type": "string",
          "enum": ["primary", "secondary", "ghost"],
          "default": "primary"
        },
        "description": "The visual style of the button.",
        "required": false,
        "default": "'primary'",
        "defaultValue": "primary"
      },
      {
        "name": "size",
        "type": "'small' | 'medium' | 'large'",
        "schema": {
          "type": "string",
          "enum": ["small", "medium", "large"],
          "default": "medium"
        },
        "description": "The size of the button. Affects padding, font size, and minimum height.",
        "required": false,
        "default": "'medium'",
        "defaultValue": "medium",
        "examples": [
          { "value": "small", "label": "For dense layouts" },
          { "value": "large", "label": "For touch targets" }
        ]
      },
      {
        "name": "disabled",
        "type": "boolean",
        "schema": { "type": "boolean", "default": false },
        "description": "When true, the button is non-interactive and visually dimmed.",
        "required": false,
        "default": "false",
        "defaultValue": false
      }
    ],
    "events": [
      {
        "name": "onClick",
        "description": "Fires when the button is activated via click, tap, or keyboard.",
        "payload": "(event: MouseEvent) => void"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "The button's text label.",
        "acceptedContent": "Plain text. Avoid nesting interactive elements."
      },
      {
        "name": "icon-start",
        "description": "An icon rendered before the label.",
        "acceptedContent": "A single icon component."
      }
    ]
  }
}
```

**Multi-platform example (abbreviated):**

```json
{
  "api": {
    "react": {
      "properties": [
        {
          "name": "variant",
          "type": "'primary' | 'secondary' | 'ghost'",
          "schema": { "type": "string", "enum": ["primary", "secondary", "ghost"] },
          "description": "The visual style of the button.",
          "required": false,
          "default": "'primary'"
        },
        {
          "name": "children",
          "type": "ReactNode",
          "description": "The button's content. Typically a text label.",
          "required": true
        }
      ],
      "events": [
        {
          "name": "onClick",
          "description": "Fires when the button is activated.",
          "payload": "(event: React.MouseEvent<HTMLButtonElement>) => void"
        }
      ]
    },
    "web-component": {
      "properties": [
        {
          "name": "variant",
          "type": "'primary' | 'secondary' | 'ghost'",
          "schema": { "type": "string", "enum": ["primary", "secondary", "ghost"] },
          "description": "The visual style of the button. Reflected as an HTML attribute.",
          "required": false,
          "default": "'primary'"
        }
      ],
      "slots": [
        {
          "name": "default",
          "description": "The button's text label.",
          "acceptedContent": "Plain text or inline elements."
        }
      ],
      "cssCustomProperties": [
        {
          "name": "--button-background",
          "description": "The background color of the button container.",
          "default": "var(--color-action-primary)",
          "type": "color"
        }
      ],
      "cssParts": [
        {
          "name": "container",
          "description": "The outer button element."
        }
      ]
    }
  }
}
```

### 6.5 Variants

The `variants` array documents named configurations that change the component's visual presentation or behavior.

Each variant object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable variant name. |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `string` | Yes | What this variant is and when to use it. |
| `tokens` | `object` | No | Token overrides for this variant (key = token name, value = token reference). |
| `preview` | `array` | No | Visual previews of this specific variant. See [§9 Examples](#9-examples). |

**Example:**

```json
{
  "variants": [
    {
      "name": "primary",
      "displayName": "Primary",
      "description": "The default, high-emphasis variant. Use for the single most important action on a surface. Limit to one primary button per surface."
    },
    {
      "name": "secondary",
      "displayName": "Secondary",
      "description": "A medium-emphasis variant. Use for actions that are important but not the primary action."
    },
    {
      "name": "ghost",
      "displayName": "Ghost",
      "description": "A low-emphasis variant with no background. Use for tertiary actions or in dense layouts where visual weight must be minimized."
    }
  ]
}
```

### 6.6 States

The `states` array documents the interactive states a component can enter.

Each state object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable state name (e.g., `"default"`, `"hover"`, `"focus"`, `"active"`, `"disabled"`, `"loading"`, `"error"`). |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `string` | Yes | What triggers this state and how the component changes. |
| `tokens` | `object` | No | Token overrides for this state (key = token name, value = token reference). |
| `preview` | `array` | No | Visual previews of this specific state. See [§9 Examples](#9-examples). |

### 6.7 Design Specifications

The `designSpecifications` property documents visual details for designers and engineers.

| Property | Type | Required | Description |
|---|---|---|---|
| `tokens` | `string[]` | No | A list of all design token names used by this component. |
| `spacing` | `object` | No | Spacing specifications for the component's internal layout. |
| `sizing` | `object` | No | Width, height, and min/max dimension constraints. |
| `responsive` | `array` | No | Responsive behavior documentation. |

#### 6.7.1 Spacing

The `spacing` object uses token references or explicit values:

| Property | Type | Required | Description |
|---|---|---|---|
| `internal` | `object` | No | Padding and internal gaps. Keys are anatomy part names or descriptions; values are token names. |
| `external` | `object` | No | Recommended margins and spacing between this component and adjacent elements. |

#### 6.7.2 Sizing

| Property | Type | Required | Description |
|---|---|---|---|
| `minWidth` | `string` | No | Minimum width constraint (as a token name or explicit value). |
| `maxWidth` | `string` | No | Maximum width constraint. |
| `minHeight` | `string` | No | Minimum height constraint. |
| `maxHeight` | `string` | No | Maximum height constraint. |
| `aspectRatio` | `string` | No | Aspect ratio constraint (e.g., `"16:9"`, `"1:1"`). |

#### 6.7.3 Responsive

Each responsive entry:

| Property | Type | Required | Description |
|---|---|---|---|
| `breakpoint` | `string` | Yes | The breakpoint name or value (e.g., `"small"`, `"768px"`). |
| `description` | `string` | Yes | How the component adapts at this breakpoint. |

### 6.8 Content Guidelines

The `contentGuidelines` array provides guidance specific to the text, imagery, or data displayed within the component. These follow the same [Guideline Structure](#9-guidelines-structure) as other guidelines.

Each content guideline object:

| Property | Type | Required | Description |
|---|---|---|---|
| `target` | `string` | Yes | The anatomy part or content area this applies to (e.g., `"label"`, `"error-message"`, `"placeholder"`). |
| `guidance` | `string` | Yes | The concrete, actionable guidance. |
| `rationale` | `string` | Yes | Why this guidance exists. |
| `examples` | `object` | No | See [§9.1 Examples in Guidelines](#91-examples-in-guidelines). |

**Example:**

```json
{
  "contentGuidelines": [
    {
      "target": "label",
      "guidance": "Use a verb or verb phrase that describes the action the button performs. Two words maximum.",
      "rationale": "Action-oriented labels set clear expectations. Short labels prevent truncation and improve scannability.",
      "examples": {
        "encouraged": ["Save", "Add item", "Submit"],
        "discouraged": ["Click here", "OK", "Yes"]
      }
    },
    {
      "target": "label",
      "guidance": "Use sentence case capitalization.",
      "rationale": "Sentence case is easier to read than title case or all caps. It also localizes more predictably."
    }
  ]
}
```

---

