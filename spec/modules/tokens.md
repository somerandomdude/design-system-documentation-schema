# DSDS Tokens Module

**Part of the [Design System Documentation Standard (DSDS) 1.0](../dsds-spec.md)**

This module defines the structure for documenting design tokens — their identity, semantic category, platform-specific API mappings, value references, usage guidelines, and accessibility considerations. It also covers token groups for documenting related sets of tokens together.

---

## 7. Token Documentation

A token documentation object describes the documentation — not the _value_ — of a single design token.

### 7.1 Structure

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | See [§5.1](#51-identification). The token name. _SHOULD_ match the token's name in the corresponding Design Tokens Format file. |
| `displayName` | `string` | Yes | See [§5.1](#51-identification). |
| `summary` | `string` | No | See [§5.1](#51-identification). |
| `description` | `string` | Yes | See [§5.1](#51-identification). CommonMark supported. |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | See [§5.2](#52-status). |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `tokenType` | `string` | Yes | The type of token, aligned with the DTCG spec. See [§7.2](#72-token-type). |
| `category` | `string` | No | The token's semantic category. See [§7.3](#73-category). |
| `value` | `object` | No | A representation of the token's value for documentation purposes. See [§7.4](#74-value). |
| `aliases` | `string[]` | No | Names of other tokens that alias (reference) this token. |
| `api` | `object` | No | Platform-specific identifiers. See [§7.5](#75-api). |
| `guidelines` | `object` | No | Usage guidance. See [§10 Guidelines Structure](#10-guidelines-structure). |
| `accessibility` | `object` | No | Accessibility documentation. See [§11 Accessibility Structure](#11-accessibility-structure). |
| `related` | `array` | No | See [§5.5](#55-related-artifacts). |
| `links` | `array` | No | See [§5.6](#56-links) and [§12 Links](#12-links). |
| `$extensions` | `object` | No | See [§13 Extensions](#13-extensions). |

### 7.2 Token Type

The `tokenType` property classifies the token's value type. Values _SHOULD_ align with the types defined in the W3C Design Tokens Format Module:

- `"color"`
- `"dimension"`
- `"fontFamily"`
- `"fontWeight"`
- `"duration"`
- `"cubicBezier"`
- `"number"`
- `"strokeStyle"`
- `"border"`
- `"transition"`
- `"shadow"`
- `"gradient"`
- `"typography"`

Additional custom values _MAY_ be used for types not yet covered by the DTCG specification.

### 7.3 Category

The `category` property describes the semantic purpose of the token within the system. Examples:

| Value | Description |
|---|---|
| `"base"` | A primitive, non-semantic value (e.g., `blue-500`). |
| `"semantic"` | A value with semantic meaning derived from a base token (e.g., `color-text-primary`). |
| `"component"` | A token scoped to a specific component (e.g., `button-background-primary`). |

### 7.4 Value

The `value` object provides a displayable representation of the token's value for documentation tools. It is _not_ the authoritative source of truth for the value — the Design Tokens Format file is.

| Property | Type | Required | Description |
|---|---|---|---|
| `resolved` | `string` | No | The resolved value as a human-readable string (e.g., `"#0066cc"`, `"16px"`, `"Helvetica, Arial, sans-serif"`). |
| `reference` | `string` | No | If this token is an alias, the name of the token it references (e.g., `"color.brand.primary"`). |
| `dtcgFile` | `string` | No | A URI or relative path to the Design Tokens Format file containing the authoritative value. |

### 7.5 API

The `api` object maps the token to its platform-specific identifiers. It is an open map — keys are platform names and values are the identifier strings for that platform. Additional platforms can be added to any token document without requiring a schema change.

#### Standard Keys (Non-normative)

_This table is non-normative._ The following keys are documented as conventions used across design systems. Design systems _MAY_ use any key name; these are the most common.

| Key | Value format | Description |
|---|---|---|
| `cssCustomProperty` | `--<name>` | The CSS custom property name (e.g., `"--color-text-primary"`). |
| `scssVariable` | `$<name>` | The SCSS variable name (e.g., `"$color-text-primary"`). |
| `lessVariable` | `@<name>` | The LESS variable name (e.g., `"@color-text-primary"`). |
| `jsConstant` | camelCase | The JavaScript/TypeScript constant name (e.g., `"colorTextPrimary"`). |
| `iosToken` | dot-notation | The Swift/iOS identifier (e.g., `"Color.Text.primary"`). |
| `androidToken` | camelCase | The Android/Kotlin identifier (e.g., `"colorTextPrimary"`). |
| `designToolVariable` | slash-path | The variable name or path in the design tool (e.g., `"color/text/primary"`). |
| `composeToken` | dot-notation | The Jetpack Compose token (e.g., `"Color.Text.Primary"`). |
| `flutterConstant` | camelCase | The Flutter/Dart constant name (e.g., `"colorTextPrimary"`). |

Custom keys _SHOULD_ use camelCase and follow the `<platform><Concept>` naming pattern (e.g., `swiftUIColor`, `tailwindClass`, `cssModulesExport`).

**Example:**

```json
{
  "name": "color-text-primary",
  "displayName": "Text Primary",
  "description": "The default color for body text. Provides a readable, high-contrast text color for use on standard background surfaces.",
  "status": "stable",
  "since": "2.0.0",
  "tokenType": "color",
  "category": "semantic",
  "value": {
    "resolved": "#1a1a1a",
    "reference": "color.neutral.900",
    "dtcgFile": "./tokens/color.tokens.json"
  },
  "api": {
    "cssCustomProperty": "--color-text-primary",
    "scssVariable": "$color-text-primary",
    "jsConstant": "colorTextPrimary",
    "designToolVariable": "color/text/primary"
  },
  "guidelines": [
    {
      "guidance": "Use for all body text, headings, and labels on default background surfaces.",
      "rationale": "A single primary text color ensures visual consistency and meets WCAG 2.1 AA contrast requirements against the system's default background.",
      "category": "visual-design"
    {
      "guidance": "Do not use on colored or dark background surfaces. Use color-text-on-primary or color-text-inverse instead.",
      "rationale": "The primary text color is optimized for contrast against light surfaces. Using it on dark surfaces will fail contrast requirements.",
      "category": "visual-design"
    }
  ],
  "accessibility": {
    "guidelines": [
      {
        "guidance": "This color meets a 15.3:1 contrast ratio against color-background-default.",
        "rationale": "Exceeds WCAG 2.1 AAA requirements (7:1 for normal text, 4.5:1 for large text), ensuring readability for users with low vision.",
        "category": "accessibility",
        "criteria": [
          "https://www.w3.org/TR/WCAG22/#contrast-minimum",
          "https://www.w3.org/TR/WCAG22/#contrast-enhanced"
        ]
      }
    ]
  }
}
```

---

