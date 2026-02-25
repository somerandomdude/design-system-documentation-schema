# DSDS Accessibility Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

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

<!-- dsds:include spec/examples/common/accessibility.json#/accessibilityObject -->
```json
{
  "wcagLevel": "AA",
  "keyboardInteraction": [
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
      "action": "Moves focus to the next focusable element."
    }
  ],
  "ariaAttributes": [
    {
      "attribute": "aria-disabled",
      "value": "true | false",
      "description": "Set to true when the button is non-interactive.",
      "required": false
    },
    {
      "attribute": "aria-label",
      "value": "string",
      "description": "Provides an accessible name for icon-only buttons.",
      "required": false
    }
  ],
  "screenReaderBehavior": "Announced as '[label], button'. When disabled via aria-disabled, announced as '[label], button, dimmed' (VoiceOver) or '[label], button, unavailable' (NVDA/JAWS). When loading, announced as '[label], button, busy'.",
  "focusManagement": "The button participates in the normal tab order. It does not trap or redirect focus. When the button triggers a modal, focus is moved to the opened element by the modal component, not the button.",
  "colorContrast": [
    {
      "foreground": "color-text-on-action",
      "background": "color-action-primary",
      "contrastRatio": 7.2,
      "level": "AAA",
      "context": "Label text on primary button background in light mode."
    }
  ],
  "motionConsiderations": "The loading spinner animation respects the prefers-reduced-motion media query. When reduced motion is preferred, the spinner is replaced with a static ellipsis indicator."
}
```
<!-- /dsds:include -->

---

