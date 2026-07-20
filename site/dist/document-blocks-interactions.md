# Interactions document block

The step-by-step flow of a pattern: what triggers each step, what happens, and which components are involved. Read the items in order to follow the user's journey from start to finish.

Source: `document-blocks/interactions.schema.json`

**2 definitions** in this file: `interactions`, `interactionEntry`

## interactions {#interactions}

The step-by-step flow of a pattern. Order matters — it's the timeline of the user's journey. Authors SHOULD cover the trigger, the response, any recovery steps, and completion. Add more than one `interactions` block to document alternate flows (ex: happy path vs. error path).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"interactions"` | ✓ | Identifies this block as an interactions spec. |
| `items` | [interactionEntry](document-blocks-interactions.md#interactionentry)[] | ✓ | The steps, in time order. Tools SHOULD keep this order so the sequence stays clear. (Min items: 1) |

**References:** [interactionEntry](document-blocks-interactions.md#interactionentry)

**Example:**

```json
{
  "kind": "interactions",
  "items": [
    {
      "trigger": "User activates the 'Add to cart' button on a product card.",
      "description": "The item is added to the cart. The cart badge increments and a brief confirmation toast appears.",
      "components": [
        {
          "identifier": "Button"
        },
        {
          "identifier": "Badge"
        },
        {
          "identifier": "Toast"
        }
      ]
    },
    {
      "trigger": "User opens the cart drawer.",
      "description": "The drawer slides in from the right, focus moves to the first interactive element inside it, and the rest of the page is marked inert.",
      "components": [
        {
          "identifier": "Drawer"
        }
      ]
    },
    {
      "description": "The user reviews the line items and proceeds to checkout. The drawer closes and the checkout view receives focus.",
      "components": [
        {
          "identifier": "Drawer"
        },
        {
          "identifier": "Button"
        }
      ]
    }
  ]
}
```

## interactionEntry {#interactionentry}

One step in the flow: what triggers it, what happens, which components are involved, and optional examples.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What happens — the system's response, visual changes, and feedback the user sees. |
| `trigger` | string |  | What starts this step — a user action, system event, or condition (ex: 'User submits the form'). Left out, this step just continues the last one. |
| `components` | [entityRef](common-entity-ref.md#entityref)[] |  | The components involved in this step. Each `identifier` MUST match a documented component; the optional `role` says what it does here. Links the pattern's flow back to each component's own docs. (Min items: 1) |
| `examples` | [example](common-example.md#example)[] |  | Examples of this step — a screenshot, a screen recording, or code. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [entityRef](common-entity-ref.md#entityref), [example](common-example.md#example)

**Example:**

```json
[
  {
    "trigger": "User submits the checkout form by activating the 'Place order' button.",
    "description": "The button enters its loading state and the form fields become read-only. The system validates the payment details and submits the order to the server.",
    "components": [
      {
        "identifier": "Button"
      },
      {
        "identifier": "TextInput"
      },
      {
        "identifier": "Form"
      }
    ]
  },
  {
    "trigger": "The server returns a 422 response because the billing address is incomplete.",
    "description": "The form exits its loading state. The offending field is marked invalid, an inline error message appears beneath it, and focus moves to the first invalid field so screen reader users hear the error.",
    "components": [
      {
        "identifier": "TextInput"
      },
      {
        "identifier": "InlineError"
      }
    ],
    "examples": [
      {
        "title": "Inline validation error state",
        "presentation": {
          "kind": "url",
          "url": "https://storybook.acme.com/?path=/story/patterns-checkout--validation-error"
        }
      }
    ]
  },
  {
    "description": "The user corrects the billing address and re-submits. The system re-validates, accepts the order, and the button returns to its loading state.",
    "components": [
      {
        "identifier": "Button"
      },
      {
        "identifier": "TextInput"
      }
    ]
  },
  {
    "trigger": "The server confirms the order.",
    "description": "The system navigates to the confirmation page and announces the success message via a live region.",
    "components": [
      {
        "identifier": "Toast"
      }
    ]
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/interactions.schema.json",
  "title": "Interactions document block",
  "description": "The step-by-step flow of a pattern: what triggers each step, what happens, and which components are involved. Read the items in order to follow the user's journey from start to finish.",
  "$defs": {
    "interactionEntry": {
      "type": "object",
      "description": "One step in the flow: what triggers it, what happens, which components are involved, and optional examples.",
      "required": [
        "description"
      ],
      "properties": {
        "trigger": {
          "type": "string",
          "description": "What starts this step — a user action, system event, or condition (ex: 'User submits the form'). Left out, this step just continues the last one."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What happens — the system's response, visual changes, and feedback the user sees."
        },
        "components": {
          "type": "array",
          "description": "The components involved in this step. Each `identifier` MUST match a documented component; the optional `role` says what it does here. Links the pattern's flow back to each component's own docs.",
          "items": {
            "$ref": "../common/entity-ref.schema.json#/$defs/entityRef"
          },
          "minItems": 1
        },
        "examples": {
          "type": "array",
          "description": "Examples of this step — a screenshot, a screen recording, or code.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "interactions": {
      "type": "object",
      "description": "The step-by-step flow of a pattern. Order matters — it's the timeline of the user's journey. Authors SHOULD cover the trigger, the response, any recovery steps, and completion. Add more than one `interactions` block to document alternate flows (ex: happy path vs. error path).",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "interactions",
          "description": "Identifies this block as an interactions spec."
        },
        "items": {
          "type": "array",
          "description": "The steps, in time order. Tools SHOULD keep this order so the sequence stays clear.",
          "items": {
            "$ref": "#/$defs/interactionEntry"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    }
  }
}
```
