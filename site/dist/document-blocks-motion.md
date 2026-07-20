# Motion document block

The motion system for a foundation: named easing curves, how long to run them, and when to use each. Each item is one easing, with its curve, a recommended duration, and usage notes — enough for tools to generate CSS transitions or preview the curve.

Source: `document-blocks/motion.schema.json`

**3 definitions** in this file: `motion`, `motionEntry`, `motionDuration`

## motion {#motion}

The motion system for a foundation — named easings that designers and engineers pick from. List the most common ones first; tools SHOULD keep this order. Scoped to foundations. Pairs with `scale` (for duration progressions) and `guidelines` (for rules like reduced-motion handling).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"motion"` | ✓ | Identifies this block as a motion spec. |
| `items` | [motionEntry](document-blocks-motion.md#motionentry)[] | ✓ | The named easings, in order. Tools SHOULD keep this order for display. (Min items: 1) |
| `description` | [richText](common-rich-text.md#richtext) |  | An overview of the motion system — the philosophy behind it and any system-wide principles the individual easings don't cover. |

**References:** [richText](common-rich-text.md#richtext), [motionEntry](document-blocks-motion.md#motionentry)

**Example:**

```json
{
  "kind": "motion",
  "description": "The motion system defines how animated transitions behave across the product. Easing curves control the acceleration profile of animations, making movement feel natural and responsive. Duration is chosen based on transition size (smaller areas get shorter durations) and direction (enter transitions are longer than exit transitions to draw attention).",
  "items": [
    {
      "identifier": "expressive",
      "name": "Expressive Ease",
      "description": "The default easing for most transitions. Suitable for elements that change size or position within the viewport.",
      "function": [
        0.55,
        0,
        0,
        1
      ],
      "token": "motion-ease-expressive",
      "usage": "moving, pushing, resizing",
      "duration": {
        "description": "Depends on element size."
      }
    },
    {
      "identifier": "enter",
      "name": "Enter Ease",
      "description": "For elements entering the viewport from off-screen or snapping into position after a drag.",
      "function": [
        0.05,
        0.7,
        0.1,
        1
      ],
      "token": "motion-ease-enter",
      "usage": "entering elements",
      "duration": {
        "min": "300ms",
        "max": "500ms"
      }
    },
    {
      "identifier": "exit",
      "name": "Exit Ease",
      "description": "For elements passively leaving the viewport without direct user interaction.",
      "function": [
        0.3,
        0,
        0.8,
        0.15
      ],
      "token": "motion-ease-exit",
      "usage": "exiting elements",
      "duration": {
        "min": "200ms",
        "max": "300ms"
      }
    },
    {
      "identifier": "lateral",
      "name": "Lateral Ease",
      "description": "For horizontal transitions between peers at the same hierarchy level.",
      "function": [
        0.8,
        0,
        0.2,
        1
      ],
      "token": "motion-ease-lateral",
      "usage": "tab navigation, carousels",
      "duration": {
        "min": "400ms",
        "max": "500ms"
      }
    },
    {
      "identifier": "bounce",
      "name": "Bounce Ease",
      "description": "For playful micro-interactions on floating elements like toolbars.",
      "function": [
        0,
        0.4,
        0,
        1.4
      ],
      "token": "motion-ease-bounce",
      "usage": "floating elements, micro-interactions",
      "duration": {
        "min": "100ms",
        "max": "200ms"
      }
    },
    {
      "identifier": "linear",
      "name": "Linear Ease",
      "description": "For non-spatial property changes like opacity and color.",
      "function": [
        0,
        0,
        1,
        1
      ],
      "token": "motion-ease-linear",
      "usage": "opacity, color transitions"
    }
  ]
}
```

## motionEntry {#motionentry}

One named easing curve: its timing function, recommended usage, and duration. `function` is a four-number array [P1x, P1y, P2x, P2y] — the same format as the W3C Design Tokens cubicBezier type.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | Machine-readable identifier for the easing (ex: 'enter', 'exit', 'linear'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What this easing is for and when to use it — describe the curve's feel and what kind of transitions it suits. |
| `name` | string |  | Human-readable name of the easing (ex: 'Expressive Ease', 'Enter Ease', 'Exit Ease'). |
| `function` | array |  | The cubic-bezier curve as [P1x, P1y, P2x, P2y]. P1x and P2x MUST be between 0 and 1; P1y and P2y can be any number (values outside 0–1 give a bounce/overshoot). Maps directly to CSS cubic-bezier(). Leave it out if the curve is only described in words or via a `token`. (Min items: 4) |
| `token` | string |  | A token that defines this easing (ex: 'motion-ease-expressive'). If both `function` and `token` are set, `token` is the source of truth and `function` is just the display value. |
| `duration` | [motionDuration](document-blocks-motion.md#motionduration) |  | The recommended duration for this easing. Enter transitions are usually longer (300–500ms) to draw attention; exits are shorter (200–300ms) to feel snappy. |
| `usage` | string |  | A short, comma-separated list of when to use it (ex: 'entering elements, micro-interactions'). Put the full explanation in `description`. |
| `examples` | [example](common-example.md#example)[] |  | Examples of the easing in action — a recording, an interactive curve, or CSS code. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [motionDuration](document-blocks-motion.md#motionduration), [example](common-example.md#example)

**Example:**

```json
[
  {
    "identifier": "expressive",
    "name": "Expressive Ease",
    "description": "The most commonly used easing, and a reliable default choice when unsure. Suitable for elements that both begin and end within the user's field of view, such as size or position changes. Also appropriate for elements entering or exiting in sync with other visible elements.",
    "function": [
      0.55,
      0,
      0,
      1
    ],
    "token": "motion-ease-expressive",
    "usage": "moving, pushing, resizing",
    "duration": {
      "description": "Depends on element size — use shorter durations for small elements and longer durations for full-screen transitions."
    },
    "examples": [
      {
        "title": "Pin opening/closing animation",
        "presentation": {
          "kind": "url",
          "url": "https://storybook.acme.com/?path=/story/motion-expressive--pin-open"
        }
      }
    ]
  },
  {
    "identifier": "enter",
    "name": "Enter Ease",
    "description": "Used for elements that initially exist out of view and smoothly enter the screen. Also appropriate for elements that snap into position after being released from a drag interaction.",
    "function": [
      0.05,
      0.7,
      0.1,
      1
    ],
    "token": "motion-ease-enter",
    "usage": "entering elements, snap-to-position after drag",
    "duration": {
      "min": "300ms",
      "max": "500ms",
      "description": "Enter transitions use longer durations to help users direct their attention to new elements appearing on screen."
    }
  },
  {
    "identifier": "exit",
    "name": "Exit Ease",
    "description": "Used for elements that begin within the user's field of view and passively disappear from the screen without direct user interaction.",
    "function": [
      0.3,
      0,
      0.8,
      0.15
    ],
    "token": "motion-ease-exit",
    "usage": "passive exiting, dismissal",
    "duration": {
      "min": "200ms",
      "max": "300ms",
      "description": "Exit transitions use shorter durations as they require less user attention."
    }
  },
  {
    "identifier": "lateral",
    "name": "Lateral Ease",
    "description": "Used for smooth horizontal transitions of elements at the same hierarchy level, like swiping between tabs or navigating a carousel. Creates natural movement by starting slowly, accelerating in the middle, and slowing toward the end.",
    "function": [
      0.8,
      0,
      0.2,
      1
    ],
    "token": "motion-ease-lateral",
    "usage": "tab navigation, carousel swiping, horizontal transitions",
    "duration": {
      "min": "400ms",
      "max": "500ms"
    }
  },
  {
    "identifier": "bounce",
    "name": "Bounce Ease",
    "description": "Used for light and fun motion that allows users to interact playfully. The overshoot creates a sense of weightlessness. Commonly used for floating elements like toolbars.",
    "function": [
      0,
      0.4,
      0,
      1.4
    ],
    "token": "motion-ease-bounce",
    "usage": "floating elements, toolbar animations, micro-interactions",
    "duration": {
      "min": "100ms",
      "max": "200ms"
    }
  },
  {
    "identifier": "linear",
    "name": "Linear Ease",
    "description": "Used for properties unrelated to spatial motion, such as opacity and color changes. A background color change on hover or a fade-in/fade-out can happen linearly as it provides direct feedback about state without implying physical movement.",
    "function": [
      0,
      0,
      1,
      1
    ],
    "token": "motion-ease-linear",
    "usage": "opacity changes, color transitions, toggles, checkboxes",
    "duration": {
      "description": "Duration varies by context — use the shortest duration that produces a perceptible transition without feeling abrupt."
    }
  }
]
```

## motionDuration {#motionduration}

A recommended duration range, as a time value ('200ms') or token ('duration-quick'). Give both `min` and `max` for a range, just one for a single recommendation, or use `description` alone if it can't be expressed as numbers. At least one of the three is required.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `min` | string | at least 1 | Minimum recommended duration (ex: '200ms', 'duration-quick'). Left out, there's no minimum. |
| `max` | string | at least 1 | Maximum recommended duration (ex: '500ms', 'duration-slow'). Left out, there's no maximum. |
| `description` | [richText](common-rich-text.md#richtext) | at least 1 | Freeform guidance for when a min/max range doesn't fit (ex: 'Shorter for small elements, longer for full-screen transitions'). Also useful as extra notes alongside min/max. |

**Constraint:** At least one of `min`, `max`, `description` must be present.

**References:** [richText](common-rich-text.md#richtext)

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/motion.schema.json",
  "title": "Motion document block",
  "description": "The motion system for a foundation: named easing curves, how long to run them, and when to use each. Each item is one easing, with its curve, a recommended duration, and usage notes — enough for tools to generate CSS transitions or preview the curve.",
  "$defs": {
    "motionDuration": {
      "type": "object",
      "description": "A recommended duration range, as a time value ('200ms') or token ('duration-quick'). Give both `min` and `max` for a range, just one for a single recommendation, or use `description` alone if it can't be expressed as numbers. At least one of the three is required.",
      "anyOf": [
        {
          "required": [
            "min"
          ]
        },
        {
          "required": [
            "max"
          ]
        },
        {
          "required": [
            "description"
          ]
        }
      ],
      "properties": {
        "min": {
          "type": "string",
          "description": "Minimum recommended duration (ex: '200ms', 'duration-quick'). Left out, there's no minimum."
        },
        "max": {
          "type": "string",
          "description": "Maximum recommended duration (ex: '500ms', 'duration-slow'). Left out, there's no maximum."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Freeform guidance for when a min/max range doesn't fit (ex: 'Shorter for small elements, longer for full-screen transitions'). Also useful as extra notes alongside min/max."
        }
      },
      "additionalProperties": false
    },
    "motionEntry": {
      "type": "object",
      "description": "One named easing curve: its timing function, recommended usage, and duration. `function` is a four-number array [P1x, P1y, P2x, P2y] — the same format as the W3C Design Tokens cubicBezier type.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "Machine-readable identifier for the easing (ex: 'enter', 'exit', 'linear')."
        },
        "name": {
          "type": "string",
          "description": "Human-readable name of the easing (ex: 'Expressive Ease', 'Enter Ease', 'Exit Ease')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this easing is for and when to use it — describe the curve's feel and what kind of transitions it suits."
        },
        "function": {
          "type": "array",
          "description": "The cubic-bezier curve as [P1x, P1y, P2x, P2y]. P1x and P2x MUST be between 0 and 1; P1y and P2y can be any number (values outside 0–1 give a bounce/overshoot). Maps directly to CSS cubic-bezier(). Leave it out if the curve is only described in words or via a `token`.",
          "minItems": 4,
          "maxItems": 4,
          "prefixItems": [
            {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "P1x — MUST be in [0, 1]."
            },
            {
              "type": "number",
              "description": "P1y — any real number."
            },
            {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "P2x — MUST be in [0, 1]."
            },
            {
              "type": "number",
              "description": "P2y — any real number."
            }
          ]
        },
        "token": {
          "type": "string",
          "description": "A token that defines this easing (ex: 'motion-ease-expressive'). If both `function` and `token` are set, `token` is the source of truth and `function` is just the display value."
        },
        "duration": {
          "$ref": "#/$defs/motionDuration",
          "description": "The recommended duration for this easing. Enter transitions are usually longer (300–500ms) to draw attention; exits are shorter (200–300ms) to feel snappy."
        },
        "usage": {
          "type": "string",
          "description": "A short, comma-separated list of when to use it (ex: 'entering elements, micro-interactions'). Put the full explanation in `description`."
        },
        "examples": {
          "type": "array",
          "description": "Examples of the easing in action — a recording, an interactive curve, or CSS code.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "motion": {
      "type": "object",
      "description": "The motion system for a foundation — named easings that designers and engineers pick from. List the most common ones first; tools SHOULD keep this order. Scoped to foundations. Pairs with `scale` (for duration progressions) and `guidelines` (for rules like reduced-motion handling).",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "motion",
          "description": "Identifies this block as a motion spec."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "An overview of the motion system — the philosophy behind it and any system-wide principles the individual easings don't cover."
        },
        "items": {
          "type": "array",
          "description": "The named easings, in order. Tools SHOULD keep this order for display.",
          "items": {
            "$ref": "#/$defs/motionEntry"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    }
  }
}
```
