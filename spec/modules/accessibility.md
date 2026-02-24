# DSDS Accessibility Module

**Part of the [Design System Documentation Standard (DSDS) 1.0](../dsds-spec.md)**

This module defines the structure for documenting accessibility requirements, keyboard interactions, ARIA attributes, screen reader behavior, focus management, and color contrast specifications. It ensures accessibility documentation is thorough, concrete, and anchored to established standards like WCAG.

---

## 11. Accessibility Structure

Accessibility documentation is critical. DSDS provides a dedicated structure to ensure it's thorough, concrete, and anchored to established standards.

### 11.1 Accessibility Object

The `accessibility` object _MAY_ appear in component, token, and foundation documentation. It contains:

| Property | Type | Required | Description |
|---|---|---|---|
| `wcagLevel` | `string` | No | The minimum WCAG conformance level the artifact is designed to meet: `"A"`, `"AA"`, or `"AAA"`. |
| `guidelines` | `array` | No | Accessibility-specific guidelines. |
| `keyboardInteraction` | `array` | No | Keyboard interaction specifications. |
| `ariaAttributes` | `array` | No | ARIA attribute documentation. |
| `screenReaderBehavior` | `string` | No | A description of how the component is announced by screen readers. |
| `focusManagement` | `string` | No | How focus moves into, within, and out of the component. |
| `colorContrast` | `array` | No | Contrast ratio documentation. |
| `motionConsiderations` | `string` | No | How the component respects `prefers-reduced-motion`. |

### 11.2 Accessibility Guidelines

Accessibility guidelines use the unified `guideline` type defined in [§10 Guidelines Structure](#10-guidelines-structure). Authors _SHOULD_ set `category` to `"accessibility"` and include `criteria` URLs on each guideline within this object.

| Property | Type | Required | Description |
|---|---|---|---|
| `guidance` | `string` | Yes | The accessibility requirement or recommendation. |
| `rationale` | `string` | Yes | Why this matters for accessibility. |
| `severity` | `string` | No | Enforcement level. See [§10.2](#102-severity-levels). |
| `category` | `string` | No | _SHOULD_ be `"accessibility"` for guidelines within this object. |
| `criteria` | `string[]` | No | URLs to external functional requirements this guideline addresses (e.g., `["https://www.w3.org/TR/WCAG22/#contrast-minimum"]`). See [§10 Guidelines](#10-guidelines-structure) for the full `criteria` specification. |

### 11.3 Keyboard Interaction

Each keyboard interaction object:

| Property | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | Yes | The key or key combination (e.g., `"Enter"`, `"Space"`, `"Tab"`, `"Escape"`, `"Arrow Down"`). |
| `action` | `string` | Yes | What happens when this key is pressed. |
| `context` | `string` | No | Any preconditions (e.g., "When the menu is open"). |

### 11.4 ARIA Attributes

Each ARIA attribute object:

| Property | Type | Required | Description |
|---|---|---|---|
| `attribute` | `string` | Yes | The ARIA attribute name (e.g., `"role"`, `"aria-label"`, `"aria-expanded"`). |
| `value` | `string` | No | The expected value or value pattern. |
| `description` | `string` | Yes | What this attribute communicates and when it should be applied. |
| `required` | `boolean` | No | Whether this attribute is always required. |

### 11.5 Color Contrast

Each color contrast object:

| Property | Type | Required | Description |
|---|---|---|---|
| `foreground` | `string` | Yes | The foreground token name or value. |
| `background` | `string` | Yes | The background token name or value. |
| `contrastRatio` | `number` | Yes | The contrast ratio as a decimal number (e.g., `4.5`, `7.2`, `15.3`). Represents the ratio N:1. Tools _MAY_ format for display as `"N:1"`. |
| `level` | `string` | Yes | The WCAG conformance level met: `"A"`, `"AA"`, or `"AAA"`. |
| `context` | `string` | No | Where this combination is used (e.g., `"Button label on primary background"`). |

**Example:**

```json
{
  "accessibility": {
    "wcagLevel": "AA",
    "guidelines": [
      {
        "guidance": "The button's accessible name is derived from its text label. When using an icon-only button, provide an aria-label.",
        "rationale": "Screen reader users need a text equivalent for every interactive control. Without one, the button is announced as 'button' with no indication of its purpose.",
        "category": "accessibility",
        "criteria": ["https://www.w3.org/TR/WCAG22/#name-role-value"]
      }
    ],
    "keyboardInteraction": [
      { "key": "Enter", "action": "Activates the button." },
      { "key": "Space", "action": "Activates the button." },
      { "key": "Tab", "action": "Moves focus to the next focusable element." },
      { "key": "Shift+Tab", "action": "Moves focus to the previous focusable element." }
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
        "description": "Set to 'true' when the button is non-interactive. Preferred over the disabled HTML attribute when the button should remain focusable for screen reader discoverability.",
        "required": false
      },
      {
        "attribute": "aria-label",
        "value": "string",
        "description": "Provides an accessible name for icon-only buttons that lack visible text.",
        "required": false
      }
    ],
    "screenReaderBehavior": "Announced as '[label], button'. When disabled, announced as '[label], button, dimmed' or '[label], button, unavailable' depending on the screen reader.",
    "focusManagement": "The button participates in the normal tab order. It does not trap or redirect focus.",
    "colorContrast": [
      {
        "foreground": "button-text-color-primary",
        "background": "button-background-primary",
        "contrastRatio": 7.1,
        "level": "AAA",
        "context": "Label text on primary button background."
      }
    ]
  }
}
```

---

