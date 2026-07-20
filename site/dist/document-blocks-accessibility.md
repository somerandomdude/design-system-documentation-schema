# Accessibility document block

Specialized, structured accessibility documentation: keyboard interactions, ARIA attributes, screen reader announcements, focus behaviors, color contrast pairs, and reduced-motion behaviors. Every entry is a verifiable statement of what the artifact does — a fact a test or review can confirm. For general documentation guidance — rules about what authors should do, with rationale and a conformance level — use a `guidelines` block (category 'accessibility').

Source: `document-blocks/accessibility.schema.json`

**7 definitions** in this file: `accessibility`, `keyboardInteraction`, `ariaAttribute`, `colorContrastEntry`, `announcement`, `focusBehavior`, `reducedMotionEntry`

## accessibility {#accessibility}

Specialized, structured accessibility documentation for an artifact. Every field is data: keyboard interactions, ARIA attributes, per-state announcements, per-trigger focus behaviors, color pairings, and per-animation reduced-motion behaviors. Each entry states what the artifact does with verification. This block carries no rules for documentation content. General documentation guidance, with rationale and a conformance level, belongs in a `guidelines` block (with  a category 'accessibility' value). The two blocks complement each other on the same artifact.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"accessibility"` | ✓ | Identifies this document block as an accessibility spec. |
| `wcagLevel` | `"A"` \| `"AA"` \| `"AAA"` | at least 1 | The minimum WCAG conformance level targeted by this artifact. |
| `criteria` | [criterion](common-criterion.md#criterion)[] | at least 1 | Testable accessibility success criteria for this artifact (ex: 'All interactive targets present a hit area of at least 44×44 px'). Each criterion pairs a stable identifier with an objectively verifiable statement. This lets accessibility checks run against the docs and report pass/fail. The structured data below (keyboard interactions, ARIA attributes, contrast pairs) shows how these conditions are met. (Min items: 1) |
| `keyboardInteractions` | [keyboardInteraction](document-blocks-accessibility.md#keyboardinteraction)[] | at least 1 | Keyboard interaction specs: what happens when each key or key combination is pressed while the artifact has focus. (Min items: 1) |
| `ariaAttributes` | [ariaAttribute](document-blocks-accessibility.md#ariaattribute)[] | at least 1 | ARIA attribute docs. Lists every ARIA attribute the artifact uses, what it communicates, and when to apply it. (Min items: 1) |
| `announcements` | [announcement](document-blocks-accessibility.md#announcement)[] | at least 1 | Screen reader announcements, one entry per state or situation. Name a specific screen reader on an entry when behavior differs between them. (Min items: 1) |
| `focusBehaviors` | [focusBehavior](document-blocks-accessibility.md#focusbehavior)[] | at least 1 | Focus movement, one entry per trigger: how focus enters, moves within, and leaves the artifact. Includes trapping and restoration. (Min items: 1) |
| `colorContrast` | [colorContrastEntry](document-blocks-accessibility.md#colorcontrastentry)[] | at least 1 | The foreground/background color pairings this artifact uses, one entry per pairing. Pairs are declarations of intent; measure them with an automated contrast criterion, not by hand. (Min items: 1) |
| `reducedMotion` | [reducedMotionEntry](document-blocks-accessibility.md#reducedmotionentry)[] | at least 1 | Animations and their prefers-reduced-motion behavior, one entry per animation. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**Constraint:** At least one of `wcagLevel`, `criteria`, `keyboardInteractions`, `ariaAttributes`, `announcements`, `focusBehaviors`, `colorContrast`, `reducedMotion` must be present.

**References:** [criterion](common-criterion.md#criterion), [keyboardInteraction](document-blocks-accessibility.md#keyboardinteraction), [ariaAttribute](document-blocks-accessibility.md#ariaattribute), [announcement](document-blocks-accessibility.md#announcement), [focusBehavior](document-blocks-accessibility.md#focusbehavior), [colorContrastEntry](document-blocks-accessibility.md#colorcontrastentry), [reducedMotionEntry](document-blocks-accessibility.md#reducedmotionentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "accessibility",
  "wcagLevel": "AA",
  "keyboardInteractions": [
    {
      "key": "Enter",
      "action": "Activates the button."
    },
    {
      "key": "Space",
      "action": "Activates the button."
    },
    {
      "key": "Tab",
      "action": "Moves focus to the next focusable element in the tab order."
    },
    {
      "key": "Shift+Tab",
      "action": "Moves focus to the previous focusable element in the tab order."
    }
  ],
  "ariaAttributes": [
    {
      "attribute": "role",
      "value": "button",
      "description": "Applied automatically by the <button> element. Only set explicitly when using a non-button element as a button.",
      "required": false
    },
    {
      "attribute": "aria-disabled",
      "value": "true | false",
      "description": "Set to 'true' when the button is non-interactive. Preferred over the HTML disabled attribute when the button should remain focusable for screen reader discoverability.",
      "required": false
    },
    {
      "attribute": "aria-label",
      "value": "string",
      "description": "Provides an accessible name for icon-only buttons that lack visible text. Not needed when a visible label is present.",
      "required": false
    },
    {
      "attribute": "aria-busy",
      "value": "true | false",
      "description": "Set to 'true' when the button is in the loading state. Communicates to assistive technology that the button's action is in progress.",
      "required": false
    }
  ],
  "colorContrast": [
    {
      "foreground": "color-text-on-action",
      "background": "color-action-primary",
      "context": "Label text on primary button background in light mode."
    },
    {
      "foreground": "color-action-primary",
      "background": "color-background-default",
      "context": "Secondary button border/text against the default page background in light mode."
    },
    {
      "foreground": "color-text-on-action",
      "background": "color-action-danger",
      "context": "Label text on danger button background in light mode."
    }
  ],
  "announcements": [
    {
      "context": "default",
      "announcement": "[label], button"
    },
    {
      "context": "disabled via aria-disabled",
      "announcement": "[label], button, dimmed",
      "screenReader": "VoiceOver"
    },
    {
      "context": "disabled via aria-disabled",
      "announcement": "[label], button, unavailable",
      "screenReader": "NVDA"
    },
    {
      "context": "disabled via aria-disabled",
      "announcement": "[label], button, unavailable",
      "screenReader": "JAWS"
    },
    {
      "context": "loading",
      "announcement": "[label], button, busy"
    }
  ],
  "focusBehaviors": [
    {
      "trigger": "default",
      "behavior": "Participates in the normal tab order; does not trap or redirect focus."
    },
    {
      "trigger": "triggers a modal or popover",
      "behavior": "Focus moves to the opened element — the modal or popover component owns that move."
    }
  ],
  "reducedMotion": [
    {
      "animation": "Loading spinner rotation",
      "behavior": "Replaced with a static ellipsis indicator."
    }
  ]
}
```

## keyboardInteraction {#keyboardinteraction}

A keyboard interaction spec documenting what happens when a specific key or key combination is pressed.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | string | ✓ | The key or key combination (ex: 'Enter', 'Space', 'Tab', 'Shift+Tab', 'Escape', 'Arrow Down', 'Home', 'End'). |
| `action` | string | ✓ | What happens when this key is pressed (ex: 'Activates the button', 'Moves focus to the next item in the list', 'Closes the dialog and returns focus to the trigger'). |
| `context` | string |  | Preconditions for this interaction (ex: 'When the menu is open', 'When focus is on the trigger element', 'When the component is not disabled'). When omitted, the interaction applies to all contexts. |

**Example:**

```json
[
  {
    "key": "Enter",
    "action": "Activates the button."
  },
  {
    "key": "Space",
    "action": "Activates the button."
  },
  {
    "key": "Tab",
    "action": "Moves focus to the next focusable element in the tab order."
  },
  {
    "key": "Shift+Tab",
    "action": "Moves focus to the previous focusable element in the tab order."
  },
  {
    "key": "Escape",
    "action": "Closes the dialog and returns focus to the trigger element.",
    "context": "When focus is inside an open dialog."
  }
]
```

## ariaAttribute {#ariaattribute}

An ARIA attribute used by the artifact: what it communicates and when to apply it.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `attribute` | string | ✓ | The ARIA attribute name (ex: 'role', 'aria-label', 'aria-expanded', 'aria-disabled', 'aria-live', 'aria-controls'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What this attribute communicates to assistive technology and when to apply it. Include guidance on dynamic value changes when applicable. |
| `value` | string |  | The expected value or value pattern (ex: 'true \| false', 'string', 'button', 'dialog', 'assertive \| polite'). |
| `required` | boolean |  | Whether this attribute is always required on the entity. Defaults to false, meaning the attribute is conditionally required or optional. (Default: `false`) |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "attribute": "role",
    "value": "button",
    "description": "Applied automatically by the <button> element. Only set explicitly when using a non-button element as a button.",
    "required": false
  },
  {
    "attribute": "aria-disabled",
    "value": "true | false",
    "description": "Set to 'true' when the button is non-interactive. Preferred over the HTML disabled attribute when the button should remain focusable for screen reader discoverability.",
    "required": false
  },
  {
    "attribute": "aria-label",
    "value": "string",
    "description": "Provides an accessible name for icon-only buttons that lack visible text. Not needed when a visible label is present.",
    "required": false
  },
  {
    "attribute": "aria-expanded",
    "value": "true | false",
    "description": "Indicates whether a controlled element (menu, dialog, tooltip) is currently expanded or collapsed. Set dynamically when the controlled element opens and closes.",
    "required": false
  },
  {
    "attribute": "aria-busy",
    "value": "true | false",
    "description": "Set to 'true' when the button is in the loading state. Communicates to assistive technology that the button's action is in progress.",
    "required": false
  }
]
```

## colorContrastEntry {#colorcontrastentry}

A foreground/background color pairing the artifact uses.  Verify pairing contrast ratios with a criterion (verification: automated) by computing the value from live token values. This helps ensure measurement is accurate.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `foreground` | string | ✓ | The foreground token name or resolved color value (ex: 'color-text-primary', '#1a1a1a', 'var(--button-text-color)'). |
| `background` | string | ✓ | The background token name or resolved color value (ex: 'color-background-default', '#ffffff', 'var(--button-background)'). |
| `context` | string |  | Where this foreground/background combination is used (ex: 'Label text on primary button background in light mode', 'Secondary text on card surface'). |

**Example:**

```json
[
  {
    "foreground": "color-text-on-action",
    "background": "color-action-primary",
    "context": "Label text on primary button background in light mode."
  },
  {
    "foreground": "color-text-on-action",
    "background": "color-action-danger",
    "context": "Label text on danger button background in light mode."
  },
  {
    "foreground": "color-action-primary",
    "background": "color-background-default",
    "context": "Secondary button border and text against the default page background."
  },
  {
    "foreground": "color-text-primary",
    "background": "color-background-default",
    "context": "Primary body text on the default background surface in light mode."
  }
]
```

## announcement {#announcement}

What a screen reader announces in one context or state.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `context` | string | ✓ | The state or situation being announced (ex: 'default', 'disabled via aria-disabled', 'loading', 'validation failure'). Use 'default' for the resting state. |
| `announcement` | string | ✓ | What is announced (ex: '[label], button, dimmed'). Use bracketed placeholders for content that varies. |
| `screenReader` | string |  | The specific screen reader this announcement applies to (ex: 'VoiceOver', 'NVDA', 'JAWS'). When omitted, the announcement applies to all screen readers. |

**Example:**

```json
[
  {
    "context": "default",
    "announcement": "[label], button"
  },
  {
    "context": "disabled via aria-disabled",
    "announcement": "[label], button, dimmed",
    "screenReader": "VoiceOver"
  }
]
```

## focusBehavior {#focusbehavior}

How focus moves at one moment in the artifact's lifecycle.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `trigger` | string | ✓ | The moment or event (ex: 'default', 'open', 'close', 'validation failure', 'disabled'). Use 'default' for normal tab-order participation. |
| `behavior` | string | ✓ | What focus does (ex: 'Moves to the error summary', 'Returns to the trigger element', 'Participates in the normal tab order'). |

**Example:**

```json
[
  {
    "trigger": "validation failure",
    "behavior": "Focus moves to the error summary."
  }
]
```

## reducedMotionEntry {#reducedmotionentry}

One animation and its behavior under prefers-reduced-motion.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `animation` | string | ✓ | The animation or transition (ex: 'loading spinner rotation', 'background-color 100ms transition'). |
| `behavior` | string | ✓ | What happens when reduced motion is preferred (ex: 'Replaced with a static ellipsis indicator', 'Transition removed; state changes apply instantly'). |

**Example:**

```json
[
  {
    "animation": "Loading spinner rotation",
    "behavior": "Replaced with a static ellipsis indicator."
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/accessibility.schema.json",
  "title": "Accessibility document block",
  "description": "Specialized, structured accessibility documentation: keyboard interactions, ARIA attributes, screen reader announcements, focus behaviors, color contrast pairs, and reduced-motion behaviors. Every entry is a verifiable statement of what the artifact does — a fact a test or review can confirm. For general documentation guidance — rules about what authors should do, with rationale and a conformance level — use a `guidelines` block (category 'accessibility').",
  "$defs": {
    "keyboardInteraction": {
      "type": "object",
      "description": "A keyboard interaction spec documenting what happens when a specific key or key combination is pressed.",
      "required": [
        "key",
        "action"
      ],
      "properties": {
        "key": {
          "type": "string",
          "description": "The key or key combination (ex: 'Enter', 'Space', 'Tab', 'Shift+Tab', 'Escape', 'Arrow Down', 'Home', 'End')."
        },
        "action": {
          "type": "string",
          "description": "What happens when this key is pressed (ex: 'Activates the button', 'Moves focus to the next item in the list', 'Closes the dialog and returns focus to the trigger')."
        },
        "context": {
          "type": "string",
          "description": "Preconditions for this interaction (ex: 'When the menu is open', 'When focus is on the trigger element', 'When the component is not disabled'). When omitted, the interaction applies to all contexts."
        }
      },
      "additionalProperties": false
    },
    "ariaAttribute": {
      "type": "object",
      "description": "An ARIA attribute used by the artifact: what it communicates and when to apply it.",
      "required": [
        "attribute",
        "description"
      ],
      "properties": {
        "attribute": {
          "type": "string",
          "description": "The ARIA attribute name (ex: 'role', 'aria-label', 'aria-expanded', 'aria-disabled', 'aria-live', 'aria-controls')."
        },
        "value": {
          "type": "string",
          "description": "The expected value or value pattern (ex: 'true | false', 'string', 'button', 'dialog', 'assertive | polite')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this attribute communicates to assistive technology and when to apply it. Include guidance on dynamic value changes when applicable."
        },
        "required": {
          "type": "boolean",
          "default": false,
          "description": "Whether this attribute is always required on the entity. Defaults to false, meaning the attribute is conditionally required or optional."
        }
      },
      "additionalProperties": false
    },
    "colorContrastEntry": {
      "type": "object",
      "description": "A foreground/background color pairing the artifact uses.  Verify pairing contrast ratios with a criterion (verification: automated) by computing the value from live token values. This helps ensure measurement is accurate.",
      "required": [
        "foreground",
        "background"
      ],
      "properties": {
        "foreground": {
          "type": "string",
          "description": "The foreground token name or resolved color value (ex: 'color-text-primary', '#1a1a1a', 'var(--button-text-color)')."
        },
        "background": {
          "type": "string",
          "description": "The background token name or resolved color value (ex: 'color-background-default', '#ffffff', 'var(--button-background)')."
        },
        "context": {
          "type": "string",
          "description": "Where this foreground/background combination is used (ex: 'Label text on primary button background in light mode', 'Secondary text on card surface')."
        }
      },
      "additionalProperties": false
    },
    "accessibility": {
      "type": "object",
      "description": "Specialized, structured accessibility documentation for an artifact. Every field is data: keyboard interactions, ARIA attributes, per-state announcements, per-trigger focus behaviors, color pairings, and per-animation reduced-motion behaviors. Each entry states what the artifact does with verification. This block carries no rules for documentation content. General documentation guidance, with rationale and a conformance level, belongs in a `guidelines` block (with  a category 'accessibility' value). The two blocks complement each other on the same artifact.",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "accessibility",
          "description": "Identifies this document block as an accessibility spec."
        },
        "wcagLevel": {
          "type": "string",
          "enum": [
            "A",
            "AA",
            "AAA"
          ],
          "description": "The minimum WCAG conformance level targeted by this artifact."
        },
        "criteria": {
          "type": "array",
          "description": "Testable accessibility success criteria for this artifact (ex: 'All interactive targets present a hit area of at least 44×44 px'). Each criterion pairs a stable identifier with an objectively verifiable statement. This lets accessibility checks run against the docs and report pass/fail. The structured data below (keyboard interactions, ARIA attributes, contrast pairs) shows how these conditions are met.",
          "items": {
            "$ref": "../common/criterion.schema.json#/$defs/criterion"
          },
          "minItems": 1
        },
        "keyboardInteractions": {
          "type": "array",
          "description": "Keyboard interaction specs: what happens when each key or key combination is pressed while the artifact has focus.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/keyboardInteraction"
          }
        },
        "ariaAttributes": {
          "type": "array",
          "description": "ARIA attribute docs. Lists every ARIA attribute the artifact uses, what it communicates, and when to apply it.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/ariaAttribute"
          }
        },
        "announcements": {
          "type": "array",
          "description": "Screen reader announcements, one entry per state or situation. Name a specific screen reader on an entry when behavior differs between them.",
          "items": {
            "$ref": "#/$defs/announcement"
          },
          "minItems": 1
        },
        "focusBehaviors": {
          "type": "array",
          "description": "Focus movement, one entry per trigger: how focus enters, moves within, and leaves the artifact. Includes trapping and restoration.",
          "items": {
            "$ref": "#/$defs/focusBehavior"
          },
          "minItems": 1
        },
        "colorContrast": {
          "type": "array",
          "description": "The foreground/background color pairings this artifact uses, one entry per pairing. Pairs are declarations of intent; measure them with an automated contrast criterion, not by hand.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/colorContrastEntry"
          }
        },
        "reducedMotion": {
          "type": "array",
          "description": "Animations and their prefers-reduced-motion behavior, one entry per animation.",
          "items": {
            "$ref": "#/$defs/reducedMotionEntry"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {
          "required": [
            "wcagLevel"
          ]
        },
        {
          "required": [
            "criteria"
          ]
        },
        {
          "required": [
            "keyboardInteractions"
          ]
        },
        {
          "required": [
            "ariaAttributes"
          ]
        },
        {
          "required": [
            "announcements"
          ]
        },
        {
          "required": [
            "focusBehaviors"
          ]
        },
        {
          "required": [
            "colorContrast"
          ]
        },
        {
          "required": [
            "reducedMotion"
          ]
        }
      ]
    },
    "announcement": {
      "type": "object",
      "description": "What a screen reader announces in one context or state.",
      "required": [
        "context",
        "announcement"
      ],
      "properties": {
        "context": {
          "type": "string",
          "description": "The state or situation being announced (ex: 'default', 'disabled via aria-disabled', 'loading', 'validation failure'). Use 'default' for the resting state."
        },
        "announcement": {
          "type": "string",
          "description": "What is announced (ex: '[label], button, dimmed'). Use bracketed placeholders for content that varies."
        },
        "screenReader": {
          "type": "string",
          "description": "The specific screen reader this announcement applies to (ex: 'VoiceOver', 'NVDA', 'JAWS'). When omitted, the announcement applies to all screen readers."
        }
      },
      "additionalProperties": false
    },
    "focusBehavior": {
      "type": "object",
      "description": "How focus moves at one moment in the artifact's lifecycle.",
      "required": [
        "trigger",
        "behavior"
      ],
      "properties": {
        "trigger": {
          "type": "string",
          "description": "The moment or event (ex: 'default', 'open', 'close', 'validation failure', 'disabled'). Use 'default' for normal tab-order participation."
        },
        "behavior": {
          "type": "string",
          "description": "What focus does (ex: 'Moves to the error summary', 'Returns to the trigger element', 'Participates in the normal tab order')."
        }
      },
      "additionalProperties": false
    },
    "reducedMotionEntry": {
      "type": "object",
      "description": "One animation and its behavior under prefers-reduced-motion.",
      "required": [
        "animation",
        "behavior"
      ],
      "properties": {
        "animation": {
          "type": "string",
          "description": "The animation or transition (ex: 'loading spinner rotation', 'background-color 100ms transition')."
        },
        "behavior": {
          "type": "string",
          "description": "What happens when reduced motion is preferred (ex: 'Replaced with a static ellipsis indicator', 'Transition removed; state changes apply instantly')."
        }
      },
      "additionalProperties": false
    }
  }
}
```
