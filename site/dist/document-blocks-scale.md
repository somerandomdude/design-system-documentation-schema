# Scale document block

An ordered progression of values — a type scale, spacing scale, elevation scale, or similar. Each step links to a token, with an optional name, display value, and usage notes. A scale is the limited set designers and engineers choose from, instead of picking arbitrary values.

Source: `document-blocks/scale.schema.json`

**2 definitions** in this file: `scale`, `scaleStep`

## scale {#scale}

An ordered scale — a deliberate progression that keeps design decisions consistent. Used for spacing, type, elevation, and similar graduated systems. Steps run smallest to largest; tools SHOULD keep this order.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"scale"` | ✓ | Identifies this block as a scale spec. |
| `identifier` | string | ✓ | Machine-readable identifier for the scale (ex: 'spacing-scale', 'type-scale'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What the scale is, how it was built (ex: geometric progression), and how to use it — why these values, and when it's okay to deviate. |
| `steps` | [scaleStep](document-blocks-scale.md#scalestep)[] | ✓ | The steps, smallest to largest. Tools SHOULD keep this order. When adjusting a value, consumers SHOULD move to the adjacent step. (Min items: 1) |
| `name` | string |  | Human-readable name of the scale (ex: 'Spacing Scale', 'Type Scale', 'Elevation Levels'). |

**References:** [richText](common-rich-text.md#richtext), [scaleStep](document-blocks-scale.md#scalestep)

**Example:**

```json
{
  "kind": "scale",
  "identifier": "spacing-scale",
  "name": "Spacing Scale",
  "description": "A 4px-based progression that constrains all spacing decisions to a consistent set of steps. Each step doubles or adds the base unit so adjacent values stay visually distinct. Use the nearest step rather than a custom value; deviation is appropriate only for optical alignment that the scale cannot express.",
  "steps": [
    {
      "token": "space-1",
      "value": "4px",
      "description": "Tight groupings — icon-to-label gaps.",
      "name": "xs"
    },
    {
      "token": "space-2",
      "value": "8px",
      "description": "Compact component padding.",
      "name": "sm"
    },
    {
      "token": "space-3",
      "value": "16px",
      "description": "The base unit — default component padding.",
      "name": "md"
    },
    {
      "token": "space-4",
      "value": "24px",
      "description": "Gaps between related groups.",
      "name": "lg"
    },
    {
      "token": "space-5",
      "value": "32px",
      "description": "Separation between major sections.",
      "name": "xl"
    }
  ]
}
```

## scaleStep {#scalestep}

One step in the scale — a `token` (if it's token-backed), a literal `value` (if not), or both. At least one is required. Don't invent a token identifier just to pass validation; a value-only step is fine.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `token` | string | at least 1 | The token that supplies this step's value. MUST match a token defined elsewhere in the system. Omit if this step isn't token-backed and use `value` instead. |
| `value` | string | at least 1 | The resolved value, for display (ex: '16px'). Just a convenience — the real value lives in the token. Tools MAY fill this in automatically. |
| `name` | string |  | A short name for this step (ex: 'sm', 'lg', 'heading-1') — the shorthand people use to talk about it without naming a raw value. |
| `description` | [richText](common-rich-text.md#richtext) |  | Usage notes — when to use this step, what it pairs with, and any limits (ex: 'The base unit; use for default padding.'). |

**Constraint:** At least one of `token`, `value` must be present.

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "token": "space-1",
    "value": "4px",
    "description": "The smallest step. Use for tight groupings such as the gap between an icon and its label.",
    "name": "xs"
  },
  {
    "token": "space-2",
    "value": "8px",
    "description": "Default internal padding for compact components like badges and tags.",
    "name": "sm"
  },
  {
    "token": "space-3",
    "value": "16px",
    "description": "The base unit. Use for default internal component padding and the gap between related fields.",
    "name": "md"
  },
  {
    "token": "space-4",
    "value": "24px",
    "description": "Separates distinct groups within a section.",
    "name": "lg"
  },
  {
    "token": "space-5",
    "value": "32px",
    "description": "Separates major sections of a page.",
    "name": "xl"
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/scale.schema.json",
  "title": "Scale document block",
  "description": "An ordered progression of values — a type scale, spacing scale, elevation scale, or similar. Each step links to a token, with an optional name, display value, and usage notes. A scale is the limited set designers and engineers choose from, instead of picking arbitrary values.",
  "$defs": {
    "scaleStep": {
      "type": "object",
      "description": "One step in the scale — a `token` (if it's token-backed), a literal `value` (if not), or both. At least one is required. Don't invent a token identifier just to pass validation; a value-only step is fine.",
      "anyOf": [
        {
          "required": [
            "token"
          ]
        },
        {
          "required": [
            "value"
          ]
        }
      ],
      "properties": {
        "token": {
          "type": "string",
          "description": "The token that supplies this step's value. MUST match a token defined elsewhere in the system. Omit if this step isn't token-backed and use `value` instead."
        },
        "name": {
          "type": "string",
          "description": "A short name for this step (ex: 'sm', 'lg', 'heading-1') — the shorthand people use to talk about it without naming a raw value."
        },
        "value": {
          "type": "string",
          "description": "The resolved value, for display (ex: '16px'). Just a convenience — the real value lives in the token. Tools MAY fill this in automatically."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Usage notes — when to use this step, what it pairs with, and any limits (ex: 'The base unit; use for default padding.')."
        }
      },
      "additionalProperties": false
    },
    "scale": {
      "type": "object",
      "description": "An ordered scale — a deliberate progression that keeps design decisions consistent. Used for spacing, type, elevation, and similar graduated systems. Steps run smallest to largest; tools SHOULD keep this order.",
      "required": [
        "kind",
        "identifier",
        "description",
        "steps"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "scale",
          "description": "Identifies this block as a scale spec."
        },
        "identifier": {
          "type": "string",
          "description": "Machine-readable identifier for the scale (ex: 'spacing-scale', 'type-scale')."
        },
        "name": {
          "type": "string",
          "description": "Human-readable name of the scale (ex: 'Spacing Scale', 'Type Scale', 'Elevation Levels')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What the scale is, how it was built (ex: geometric progression), and how to use it — why these values, and when it's okay to deviate."
        },
        "steps": {
          "type": "array",
          "description": "The steps, smallest to largest. Tools SHOULD keep this order. When adjusting a value, consumers SHOULD move to the adjacent step.",
          "items": {
            "$ref": "#/$defs/scaleStep"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    }
  }
}
```
