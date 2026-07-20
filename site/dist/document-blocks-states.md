# States document block

Every interactive state a component can be in — hover, focus, disabled, loading, and so on. Each item covers what triggers it, how it looks and behaves, and which tokens change.

Source: `document-blocks/states.schema.json`

**2 definitions** in this file: `states`, `stateEntry`

## states {#states}

Every interactive state of a component or pattern. List them in a sensible order — usually default, hover, focus, active, then disabled, loading, and other special states. A state is something entered at runtime (hover, disabled, loading); a choice made up front is a variant — document that in `variants` instead.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"states"` | ✓ | Identifies this block as a states spec. |
| `items` | [stateEntry](document-blocks-states.md#stateentry)[] | ✓ | The states, in order. Tools SHOULD keep this order for display. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [stateEntry](document-blocks-states.md#stateentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "states",
  "items": [
    {
      "identifier": "default",
      "name": "Default",
      "description": "The button's resting state when no interaction is occurring."
    },
    {
      "identifier": "hover",
      "name": "Hover",
      "description": "Triggered when the user's pointer moves over the button. The background darkens by 8% to indicate interactivity. Not applicable on touch devices.",
      "tokens": {
        "button-background": "color-action-primary-hover"
      }
    }
  ]
}
```

## stateEntry {#stateentry}

One state — a visual or behavioral change triggered by user interaction, a system event, or a data condition.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | Machine-readable state identifier (ex: 'default', 'hover', 'focus', 'active', 'disabled', 'loading', 'selected', 'error', 'read-only'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What triggers this state, how appearance and behavior change, and any constraints or side effects. |
| `name` | string |  | Human-readable name (ex: 'Default', 'Hover', 'Focus', 'Active / Pressed', 'Disabled', 'Loading'). |
| `tokens` | [tokenOverrides](common-token-overrides.md#tokenoverrides) |  | Token overrides for this state — only the ones that change from the default. The default values live on `design-specifications` for components (patterns don't have that block — their baseline lives in `anatomy`). |
| `rationale` | [richText](common-rich-text.md#richtext) |  | Why this state exists — the user need or design rationale it addresses. |
| `examples` | [example](common-example.md#example)[] |  | Examples showing the component in this state. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [tokenOverrides](common-token-overrides.md#tokenoverrides), [example](common-example.md#example)

**Example:**

```json
[
  {
    "identifier": "default",
    "name": "Default",
    "description": "The button's resting state when no interaction is occurring."
  },
  {
    "identifier": "hover",
    "name": "Hover",
    "description": "Triggered when the user's pointer moves over the button. The background darkens by 8% to indicate interactivity. Not applicable on touch devices.",
    "tokens": {
      "button-background": "color-action-primary-hover"
    },
    "examples": [
      {
        "title": "Primary button — hover state",
        "presentation": {
          "kind": "image",
          "url": "https://design.acme.com/assets/button-primary-hover.png",
          "alt": "A primary button with a slightly darker blue background indicating the hover state."
        }
      }
    ]
  },
  {
    "identifier": "active",
    "name": "Active / Pressed",
    "description": "Triggered while the button is being pressed (mousedown or touch start). The background darkens by 16% from the default to indicate activation.",
    "tokens": {
      "button-background": "color-action-primary-active"
    }
  },
  {
    "identifier": "focus",
    "name": "Focus",
    "description": "Triggered when the button receives keyboard focus. A 2px focus ring appears with a 2px offset from the container edge. The focus ring uses the system focus color.",
    "tokens": {
      "button-focus-ring-color": "color-focus-ring",
      "button-focus-ring-width": "border-width-focus",
      "button-focus-ring-offset": "space-focus-offset"
    },
    "examples": [
      {
        "title": "Primary button — focus state",
        "presentation": {
          "kind": "image",
          "url": "https://design.acme.com/assets/button-primary-focus.png",
          "alt": "A primary button with a visible 2px blue focus ring offset from the button edge by 2px."
        }
      }
    ]
  },
  {
    "identifier": "disabled",
    "name": "Disabled",
    "description": "The button is non-interactive. Opacity is reduced to 0.4. Pointer events are disabled. The button remains in the tab order when using aria-disabled instead of the HTML disabled attribute.",
    "rationale": "- Use when: When the user cannot interact with the button because a precondition has not been met (ex: required fields are empty).\n- Avoid when: When the button is processing an asynchronous operation. Use `loading` instead — The loading state provides feedback that an action is in progress. A disabled button gives no feedback."
  },
  {
    "identifier": "loading",
    "name": "Loading",
    "description": "The button label is replaced by a spinner animation. The button is non-interactive. The button maintains its dimensions from the default state to prevent layout shift.",
    "examples": [
      {
        "title": "Loading state transition",
        "presentation": {
          "kind": "video",
          "url": "https://design.acme.com/assets/button-loading-interaction.mp4",
          "alt": "A user clicks a primary button labeled Save. The label is replaced by a spinner animation while the button maintains its width. After two seconds, the spinner is replaced by a checkmark and the label changes to Saved."
        }
      }
    ]
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/states.schema.json",
  "title": "States document block",
  "description": "Every interactive state a component can be in — hover, focus, disabled, loading, and so on. Each item covers what triggers it, how it looks and behaves, and which tokens change.",
  "$defs": {
    "stateEntry": {
      "type": "object",
      "description": "One state — a visual or behavioral change triggered by user interaction, a system event, or a data condition.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "Machine-readable state identifier (ex: 'default', 'hover', 'focus', 'active', 'disabled', 'loading', 'selected', 'error', 'read-only')."
        },
        "name": {
          "type": "string",
          "description": "Human-readable name (ex: 'Default', 'Hover', 'Focus', 'Active / Pressed', 'Disabled', 'Loading')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What triggers this state, how appearance and behavior change, and any constraints or side effects."
        },
        "tokens": {
          "$ref": "../common/token-overrides.schema.json#/$defs/tokenOverrides",
          "description": "Token overrides for this state — only the ones that change from the default. The default values live on `design-specifications` for components (patterns don't have that block — their baseline lives in `anatomy`)."
        },
        "rationale": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Why this state exists — the user need or design rationale it addresses."
        },
        "examples": {
          "type": "array",
          "description": "Examples showing the component in this state.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "states": {
      "type": "object",
      "description": "Every interactive state of a component or pattern. List them in a sensible order — usually default, hover, focus, active, then disabled, loading, and other special states. A state is something entered at runtime (hover, disabled, loading); a choice made up front is a variant — document that in `variants` instead.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "states",
          "description": "Identifies this block as a states spec."
        },
        "items": {
          "type": "array",
          "description": "The states, in order. Tools SHOULD keep this order for display.",
          "items": {
            "$ref": "#/$defs/stateEntry"
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
