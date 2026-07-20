# Example definition

The shared example schema used across DSDS. Each example shows a visual or interactive demo through a presentation and/or a literal value. Optional title and description add context. Presentations are typed objects defined in presentation.schema.json for images, videos, code snippets, and URLs. Other guideline items link to this as an `examples` array.

Source: `common/example.schema.json`

## example {#example}

A single example. It requires a presentation and/or value. The presentation shows a visual or interactive demo. When only a value is present, the example is a data point (ex: a prop value of 'primary' or a token value of 44). Tools SHOULD render value-only examples as table rows or inline displays. NOTE: `criterionTestCase` in criterion.schema.json is an intentional copy of this shape plus a required `outcome` (closed schemas prevent allOf-extension). When this definition changes, change criterionTestCase to match.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | any | at least 1 | A literal value carried by the example. Use it for API property examples, where the content is a concrete value rather than a visual demo. It can display code that reflects the example. Accepts any JSON type: string, number, boolean, object, array, or null. When given without a presentation, this value alone is the example. |
| `presentation` | [presentationImage](common-presentation.md#presentationimage) \| [presentationVideo](common-presentation.md#presentationvideo) \| [presentationCode](common-presentation.md#presentationcode) \| [presentationUrl](common-presentation.md#presentationurl) | at least 1 | The visual or interactive presentation for the example. Required when no `value` is set. Optional when `value` is present. |
| `title` | string |  | A human-readable caption for the example (ex: 'Primary button in default state'). For API property examples, use `value` for the literal content and `title` for the display label. |
| `description` | string |  | An explanation of the example and why it's encouraged, discouraged, or important. |

**Constraint:** At least one of `presentation`, `value` must be present.

**References:** [presentationImage](common-presentation.md#presentationimage), [presentationVideo](common-presentation.md#presentationvideo), [presentationCode](common-presentation.md#presentationcode), [presentationUrl](common-presentation.md#presentationurl)

**Example:**

```json
[
  {
    "title": "Primary button — default state",
    "description": "The high-emphasis button style used for the most important action on a surface.",
    "presentation": {
      "kind": "image",
      "url": "https://design.acme.com/assets/button-primary-default.png",
      "alt": "A primary button with a solid blue background and white label text reading Save."
    }
  },
  {
    "title": "JSX — button group with primary and secondary",
    "presentation": {
      "kind": "code",
      "code": "<ButtonGroup>\n  <Button variant=\"secondary\">Cancel</Button>\n  <Button variant=\"primary\">Save</Button>\n</ButtonGroup>",
      "language": "jsx"
    }
  },
  {
    "title": "Loading state transition",
    "description": "Shows the full loading lifecycle from click through completion.",
    "presentation": {
      "kind": "video",
      "url": "https://design.acme.com/assets/button-loading-interaction.mp4",
      "alt": "A user clicks Save. The label is replaced by a spinner. After two seconds, the spinner becomes a checkmark and the label changes to Saved."
    }
  },
  {
    "title": "Interactive primary button story",
    "presentation": {
      "kind": "url",
      "url": "https://storybook.acme.com/?path=/story/components-button--primary"
    }
  },
  {
    "title": "variant property — primary",
    "value": "primary",
    "presentation": {
      "kind": "code",
      "code": "<Button variant=\"primary\">Save</Button>",
      "language": "jsx"
    }
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/example.schema.json",
  "title": "Example definition",
  "description": "The shared example schema used across DSDS. Each example shows a visual or interactive demo through a presentation and/or a literal value. Optional title and description add context. Presentations are typed objects defined in presentation.schema.json for images, videos, code snippets, and URLs. Other guideline items link to this as an `examples` array.",
  "$defs": {
    "example": {
      "type": "object",
      "description": "A single example. It requires a presentation and/or value. The presentation shows a visual or interactive demo. When only a value is present, the example is a data point (ex: a prop value of 'primary' or a token value of 44). Tools SHOULD render value-only examples as table rows or inline displays. NOTE: `criterionTestCase` in criterion.schema.json is an intentional copy of this shape plus a required `outcome` (closed schemas prevent allOf-extension). When this definition changes, change criterionTestCase to match.",
      "anyOf": [
        {
          "required": [
            "presentation"
          ]
        },
        {
          "required": [
            "value"
          ]
        }
      ],
      "properties": {
        "title": {
          "type": "string",
          "description": "A human-readable caption for the example (ex: 'Primary button in default state'). For API property examples, use `value` for the literal content and `title` for the display label."
        },
        "description": {
          "type": "string",
          "description": "An explanation of the example and why it's encouraged, discouraged, or important."
        },
        "value": {
          "description": "A literal value carried by the example. Use it for API property examples, where the content is a concrete value rather than a visual demo. It can display code that reflects the example. Accepts any JSON type: string, number, boolean, object, array, or null. When given without a presentation, this value alone is the example."
        },
        "presentation": {
          "description": "The visual or interactive presentation for the example. Required when no `value` is set. Optional when `value` is present.",
          "oneOf": [
            {
              "$ref": "presentation.schema.json#/$defs/presentationImage"
            },
            {
              "$ref": "presentation.schema.json#/$defs/presentationVideo"
            },
            {
              "$ref": "presentation.schema.json#/$defs/presentationCode"
            },
            {
              "$ref": "presentation.schema.json#/$defs/presentationUrl"
            }
          ]
        }
      },
      "additionalProperties": false
    }
  }
}
```
