# Principles document block

The beliefs behind a foundation's decisions — each a short title plus what it means in practice. Principles answer 'what do we believe?' and sit above individual `guidelines`, shaping the whole approach to a domain (ex: 'Functional first' for color, 'Use the scale' for spacing).

Source: `document-blocks/principles.schema.json`

**2 definitions** in this file: `principles`, `principleEntry`

## principles {#principles}

The beliefs behind a foundation's decisions — what the system believes and which trade-offs it accepts. Sits above `guidelines`: principles set direction, guidelines encode the specific rules. E.g., a spacing foundation might have 'Use the scale'; a color foundation might have 'Functional first'.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"principles"` | ✓ | Identifies this block as a principles spec. |
| `items` | [principleEntry](document-blocks-principles.md#principleentry)[] | ✓ | The principles, in order. Tools SHOULD keep this order; authors SHOULD lead with the most important. (Min items: 1) |

**References:** [principleEntry](document-blocks-principles.md#principleentry)

**Example:**

```json
{
  "kind": "principles",
  "items": [
    {
      "title": "Functional first",
      "description": "Color carries meaning before it carries style. Choose a color for the role it plays — danger, success, emphasis — and let the palette follow from those roles rather than from brand decoration."
    },
    {
      "title": "Accessible by default",
      "description": "Every foreground and background pairing in the system meets WCAG 2.2 AA contrast. A color combination that fails contrast is not offered as an option, so teams cannot reach for an inaccessible pairing by accident."
    },
    {
      "title": "Semantic, not literal",
      "description": "Reference colors by their role ('color-text-danger'), never by their value ('red-600'). This lets the system retheme — including dark mode — without touching product code."
    }
  ]
}
```

## principleEntry {#principleentry}

One principle: a short title and what it means in practice. Principles set direction, not specific rules — for actual rules, use `guidelines`; for whether to use something at all, use `use-cases`.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✓ | A short, memorable name (ex: 'Functional first', 'Use the scale') — short enough to work as a heading. |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What the principle means in practice — not just a restatement of the title. Answer: what does this look like day to day, and how would you use it to settle a disagreement? |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "title": "Use the scale",
    "description": "Every spacing value comes from the spacing scale. Reach for the nearest scale step rather than a custom value. When two adjacent steps both seem wrong, the layout — not the scale — usually needs rethinking."
  },
  {
    "title": "Density over decoration",
    "description": "Spacing exists to group and separate content, not to fill the canvas. Prefer the smallest spacing that still makes the grouping clear, so more content stays within reach without scrolling."
  },
  {
    "title": "Consistent rhythm",
    "description": "Related elements share the same spacing so the eye can predict where the next item begins. Vary spacing only to signal a change in relationship, never for visual variety alone."
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/principles.schema.json",
  "title": "Principles document block",
  "description": "The beliefs behind a foundation's decisions — each a short title plus what it means in practice. Principles answer 'what do we believe?' and sit above individual `guidelines`, shaping the whole approach to a domain (ex: 'Functional first' for color, 'Use the scale' for spacing).",
  "$defs": {
    "principleEntry": {
      "type": "object",
      "description": "One principle: a short title and what it means in practice. Principles set direction, not specific rules — for actual rules, use `guidelines`; for whether to use something at all, use `use-cases`.",
      "required": [
        "title",
        "description"
      ],
      "properties": {
        "title": {
          "type": "string",
          "description": "A short, memorable name (ex: 'Functional first', 'Use the scale') — short enough to work as a heading."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What the principle means in practice — not just a restatement of the title. Answer: what does this look like day to day, and how would you use it to settle a disagreement?"
        }
      },
      "additionalProperties": false
    },
    "principles": {
      "type": "object",
      "description": "The beliefs behind a foundation's decisions — what the system believes and which trade-offs it accepts. Sits above `guidelines`: principles set direction, guidelines encode the specific rules. E.g., a spacing foundation might have 'Use the scale'; a color foundation might have 'Functional first'.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "principles",
          "description": "Identifies this block as a principles spec."
        },
        "items": {
          "type": "array",
          "description": "The principles, in order. Tools SHOULD keep this order; authors SHOULD lead with the most important.",
          "items": {
            "$ref": "#/$defs/principleEntry"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    }
  }
}
```
