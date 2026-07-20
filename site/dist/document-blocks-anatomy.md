# Anatomy document block

Documents the visual structure of a component or pattern: its named sub-elements (parts), their design tokens, and optional annotated examples. Anatomy blocks break an artifact into the parts that designers and engineers need to understand, style, and test. For components, parts are rendered UI sub-elements (container, label, icon). For patterns, parts are sections of the pattern's visual layout (image, title, body, primary action).

Source: `document-blocks/anatomy.schema.json`

**2 definitions** in this file: `anatomy`, `anatomyEntry`

## anatomy {#anatomy}

Documents the visual structure of a component or pattern by listing its named sub-elements (parts). Each part can link to the design tokens that style it, tying visual design to token architecture. Optional examples show annotated diagrams of the assembled structure. For components, parts are rendered UI sub-elements (ex: container, label, icon, focus-ring). For patterns, parts are structural sections of the layout (ex: image, title, body, primary action).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"anatomy"` | ✓ | Identifies this document block as an anatomy spec. |
| `parts` | [anatomyEntry](document-blocks-anatomy.md#anatomyentry)[] | ✓ | The named sub-elements of the artifact, in visual order (typically outside-in or top-to-bottom). Each part documents an element that can be styled, tested, or referenced independently. (Min items: 1) |
| `description` | [richText](common-rich-text.md#richtext) |  | Provides an overview of the artifact's visual structure: how the parts relate and any notable structural constraints. |
| `examples` | [example](common-example.md#example)[] |  | Examples of the anatomy, typically annotated diagrams with numbered callouts that map to the parts array. Multiple examples allow different views (ex: expanded vs. collapsed, with icon vs. without). (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [anatomyEntry](document-blocks-anatomy.md#anatomyentry), [example](common-example.md#example), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "description": "The Button is composed of a container, a text label, and an optional leading or trailing icon. A focus ring appears on keyboard focus.",
  "parts": [
    {
      "identifier": "container",
      "name": "Container",
      "description": "The outer wrapper element that defines the button's clickable area and visual boundary.",
      "required": true,
      "tokens": {
        "background": "button-background",
        "border-color": "button-border-color",
        "border-radius": "button-border-radius"
      }
    },
    {
      "identifier": "label",
      "name": "Label",
      "description": "The text content of the button.",
      "required": true,
      "tokens": {
        "text-color": "button-text-color",
        "font-size": "button-font-size"
      }
    },
    {
      "identifier": "icon",
      "name": "Icon",
      "description": "An optional icon displayed before or after the label.",
      "required": false,
      "tokens": {
        "size": "button-icon-size",
        "color": "button-icon-color"
      }
    },
    {
      "identifier": "focus-ring",
      "name": "Focus Ring",
      "description": "A visible outline that appears when the button receives keyboard focus.",
      "required": false,
      "tokens": {
        "color": "button-focus-ring-color",
        "width": "button-focus-ring-width"
      }
    }
  ],
  "kind": "anatomy",
  "$extensions": {
    "com.figma": {
      "nodeId": "1234:5678"
    }
  }
}
```

## anatomyEntry {#anatomyentry}

A named sub-element of a component's or pattern's visual structure.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | Machine-readable identifier for the part (ex: 'container', 'label', 'icon', 'focus-ring'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What this part is, what it does, and any constraints on its content or appearance. |
| `name` | string |  | Human-readable name (ex: 'Container', 'Label', 'Leading Icon'). |
| `required` | boolean |  | Whether this part is always present in the rendered output. Defaults to false. When false, the part is conditionally rendered based on props or content. (Default: `false`) |
| `tokens` | [tokenOverrides](common-token-overrides.md#tokenoverrides) |  | Design tokens applied to this part, as the shared token-override map: keys are token-purpose names, values are documented token identifiers. |
| `links` | [link](common-link.md#link)[] |  | Links to resources for this anatomy part: design tool nodes, source code blocks, documentation sections, or other addressable references. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [tokenOverrides](common-token-overrides.md#tokenoverrides), [link](common-link.md#link)

**Example:**

```json
[
  {
    "identifier": "container",
    "name": "Container",
    "description": "The outer wrapper element that defines the button's clickable area and visual boundary.",
    "required": true,
    "tokens": {
      "background": "button-background",
      "border-color": "button-border-color",
      "border-radius": "button-border-radius",
      "padding-horizontal": "button-padding-horizontal",
      "padding-vertical": "button-padding-vertical"
    },
    "links": [
      {
        "kind": "source",
        "url": "https://code.acme.com/design-system/src/components/button/button.tsx#L42-L58",
        "label": "Source — container element"
      },
      {
        "kind": "design",
        "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
        "label": "Design node — container"
      }
    ]
  },
  {
    "identifier": "label",
    "name": "Label",
    "description": "The text content of the button. Communicates the action that will occur when activated.",
    "required": true,
    "tokens": {
      "text-color": "button-text-color",
      "font-size": "button-font-size",
      "font-weight": "button-font-weight",
      "line-height": "button-line-height"
    }
  },
  {
    "identifier": "icon",
    "name": "Icon",
    "description": "An optional icon displayed before (leading) or after (trailing) the label. Reinforces the label's meaning visually.",
    "required": false,
    "tokens": {
      "size": "button-icon-size",
      "color": "button-icon-color",
      "gap": "button-icon-gap"
    }
  },
  {
    "identifier": "focus-ring",
    "name": "Focus Ring",
    "description": "A visible outline that appears when the button receives keyboard focus. Must be visible in all color modes.",
    "required": false,
    "tokens": {
      "color": "button-focus-ring-color",
      "width": "button-focus-ring-width",
      "offset": "button-focus-ring-offset"
    }
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/anatomy.schema.json",
  "title": "Anatomy document block",
  "description": "Documents the visual structure of a component or pattern: its named sub-elements (parts), their design tokens, and optional annotated examples. Anatomy blocks break an artifact into the parts that designers and engineers need to understand, style, and test. For components, parts are rendered UI sub-elements (container, label, icon). For patterns, parts are sections of the pattern's visual layout (image, title, body, primary action).",
  "$defs": {
    "anatomyEntry": {
      "type": "object",
      "description": "A named sub-element of a component's or pattern's visual structure.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "Machine-readable identifier for the part (ex: 'container', 'label', 'icon', 'focus-ring')."
        },
        "name": {
          "type": "string",
          "description": "Human-readable name (ex: 'Container', 'Label', 'Leading Icon')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this part is, what it does, and any constraints on its content or appearance."
        },
        "required": {
          "type": "boolean",
          "default": false,
          "description": "Whether this part is always present in the rendered output. Defaults to false. When false, the part is conditionally rendered based on props or content."
        },
        "tokens": {
          "$ref": "../common/token-overrides.schema.json#/$defs/tokenOverrides",
          "description": "Design tokens applied to this part, as the shared token-override map: keys are token-purpose names, values are documented token identifiers."
        },
        "links": {
          "type": "array",
          "description": "Links to resources for this anatomy part: design tool nodes, source code blocks, documentation sections, or other addressable references.",
          "items": {
            "$ref": "../common/link.schema.json#/$defs/link"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "anatomy": {
      "type": "object",
      "description": "Documents the visual structure of a component or pattern by listing its named sub-elements (parts). Each part can link to the design tokens that style it, tying visual design to token architecture. Optional examples show annotated diagrams of the assembled structure. For components, parts are rendered UI sub-elements (ex: container, label, icon, focus-ring). For patterns, parts are structural sections of the layout (ex: image, title, body, primary action).",
      "required": [
        "kind",
        "parts"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "anatomy",
          "description": "Identifies this document block as an anatomy spec."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Provides an overview of the artifact's visual structure: how the parts relate and any notable structural constraints."
        },
        "parts": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/anatomyEntry"
          },
          "minItems": 1,
          "description": "The named sub-elements of the artifact, in visual order (typically outside-in or top-to-bottom). Each part documents an element that can be styled, tested, or referenced independently."
        },
        "examples": {
          "type": "array",
          "description": "Examples of the anatomy, typically annotated diagrams with numbered callouts that map to the parts array. Multiple examples allow different views (ex: expanded vs. collapsed, with icon vs. without).",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false
    }
  }
}
```
