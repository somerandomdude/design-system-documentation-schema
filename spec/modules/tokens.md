# DSDS Tokens Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the structure for documenting design tokens — their identity, semantic category, platform-specific API mappings, value references, usage guidelines, and accessibility considerations. It also covers **token groups** for organizing tokens into hierarchical families, and **themes** for documenting how token values change across named contexts such as color modes, density settings, or brand variants.

---

## 7. Token Documentation

A token documentation object describes the documentation — not the _value_ — of a single design token.

### 7.1 Structure

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | See [§5.1](#51-identification). The token name. _SHOULD_ match the token's name in the corresponding Design Tokens Format file. |
| `displayName` | `string` | Yes | See [§5.1](#51-identification). |
| `summary` | `string` | No | See [§5.1](#51-identification). |
| `description` | `richText` | Yes | See [§5.1](#51-identification). CommonMark supported. |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `platformStatus` | `object` | No | See [§5.2.1](#521-platform-status). Per-platform readiness. |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | See [§5.2](#52-status). |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `tokenType` | `string` | Yes | The type of token, aligned with the DTCG spec. See [§7.2](#72-token-type). |
| `category` | `string` | No | The token's semantic category. See [§7.3](#73-category). |
| `value` | `object` | No | A representation of the token's value for documentation purposes. See [§7.4](#74-value). |
| `aliases` | `string[]` | No | Names of other tokens that alias (reference) this token. |
| `api` | `object` | No | Platform-specific identifiers. See [§7.5](#75-api). |
| `useCases` | `object` | No | When to use and when not to use this token. See [§15 Use Cases](#15-use-cases). |
| `guidelines` | `array` | No | Usage guidance. See [§10 Guidelines Structure](#10-guidelines-structure). |
| `accessibility` | `object` | No | Accessibility documentation. See [§11 Accessibility Structure](#11-accessibility-structure). |
| `links` | `array` | No | See [§5.5](#55-links) and [§12 Links](#12-links). |
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

<!-- dsds:include spec/examples/tokens/token.json#/tokenDoc -->
```json
{
  "name": "color-text-primary",
  "displayName": "Text Primary",
  "description": "The default color for body text, headings, and labels. Provides the highest-contrast text color for standard reading content on default background surfaces.",
  "status": "stable",
  "since": "2.0.0",
  "tokenType": "color",
  "category": "semantic",
  "summary": "Default body text color for light and dark surfaces.",
  "tags": [
    "color",
    "text",
    "body"
  ],
  "value": {
    "resolved": "#1a1a1a",
    "reference": "color.neutral.900",
    "dtcgFile": "./tokens/color.tokens.json"
  },
  "aliases": [
    "color.text.default",
    "color.text.body"
  ],
  "api": {
    "cssCustomProperty": "--color-text-primary",
    "scssVariable": "$color-text-primary",
    "jsConstant": "colorTextPrimary",
    "iosToken": "Color.Text.primary",
    "androidToken": "colorTextPrimary",
    "designToolVariable": "color/text/primary"
  },
  "useCases": {
    "whenToUse": [
      {
        "description": "When applying color to body text, headings, and form labels on default background surfaces."
      },
      {
        "description": "When building components that display primary reading content that must adapt across color modes."
      }
    ],
    "whenNotToUse": [
      {
        "description": "When placing text on dark or colored background surfaces.",
        "alternative": {
          "name": "color-text-inverse",
          "rationale": "This token is optimized for contrast against light backgrounds. Using it on dark or saturated surfaces will fail contrast requirements."
        }
      },
      {
        "description": "When the text is inside a component that supplies its own scoped color tokens (e.g., text on a filled button).",
        "alternative": {
          "name": "color-text-on-action",
          "rationale": "Component-scoped tokens account for the specific background they sit on. Applying a general text token to a scoped context risks contrast failures."
        }
      }
    ]
  },
  "guidelines": [
    {
      "guidance": "Use for all body text, headings, and form labels on default background surfaces.",
      "rationale": "A single primary text color ensures visual consistency and meets WCAG 2.1 AA contrast requirements against the system's default background.",
      "type": "encouraged",
      "category": "visual-design"
    },
    {
      "guidance": "Do not override this token's value at the component level. Use color-text-secondary or color-text-tertiary for reduced emphasis.",
      "rationale": "Overriding the primary text color creates inconsistency. The system provides lower-emphasis text tokens for visual hierarchy.",
      "type": "prohibited",
      "category": "visual-design"
    },
    {
      "guidance": "This color meets a 15.3:1 contrast ratio against color-background-default in light mode.",
      "rationale": "Exceeds WCAG 2.1 AAA requirements (7:1 for normal text), ensuring readability for users with low vision.",
      "type": "informational",
      "category": "accessibility",
      "criteria": [
        "https://www.w3.org/TR/WCAG22/#contrast-minimum",
        "https://www.w3.org/TR/WCAG22/#contrast-enhanced"
      ]
    }
  ],
  "accessibility": {
    "wcagLevel": "AAA",
    "colorContrast": [
      {
        "foreground": "color-text-primary",
        "background": "color-background-default",
        "contrastRatio": 15.3,
        "level": "AAA",
        "context": "Primary text on default background in light mode."
      },
      {
        "foreground": "color-text-primary",
        "background": "color-background-subtle",
        "contrastRatio": 13.8,
        "level": "AAA",
        "context": "Primary text on subtle background (card surface) in light mode."
      }
    ]
  },
  "links": [
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/tokens/color/text.tokens.json",
      "label": "Token source file"
    },
    {
      "type": "documentation",
      "url": "https://design.acme.com/tokens/color-text-primary",
      "label": "Token documentation"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/tokens/color-text-secondary",
      "label": "color-text-secondary"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/tokens/color-text-tertiary",
      "label": "color-text-tertiary"
    }
  ]
}
```
<!-- /dsds:include -->

---

## 7.6 Token Group Documentation

A token group is a flexible organizational unit for collecting related tokens into a named, documented hierarchy. Token groups can represent structures at any level of granularity:

- A **full token collection** — all tokens in the system, organized by family
- A **token family** — all color tokens, all spacing tokens, all typography tokens
- A **token sub-family** — a single color hue with its grade scale (e.g., "Red — Pushpin" with grades 0–900), or the text color tokens within the broader color family
- A **component token set** — tokens scoped to a single component (e.g., all button tokens)

Token groups are **recursive**: a group's `children` array can contain individual `tokenDoc` objects, nested `tokenGroupDoc` objects, or a mix of both. This allows systems to model their token architecture at whatever depth is natural — from a flat list of tokens in a simple system, to a deeply nested hierarchy in a large-scale system with hundreds of tokens organized into families and sub-families.

### 7.6.1 Structure

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable identifier for the group (e.g., `"color-text"`, `"spacing"`, `"red-pushpin"`). Token group names are intentionally unconstrained by a pattern to accommodate DTCG and design tool naming conventions. |
| `displayName` | `string` | Yes | Human-readable name (e.g., `"Text Colors"`, `"Spacing Scale"`, `"Red — Pushpin"`). |
| `summary` | `string` | No | One-line plain-text summary. |
| `description` | `richText` | Yes | A description of the group's purpose and the tokens it contains. CommonMark supported. |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `platformStatus` | `object` | No | See [§5.2.1](#521-platform-status). Per-platform readiness. |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | The version in which this group was introduced. |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `tokenType` | `string` | No | When all tokens in this group share the same DTCG token type, it _MAY_ be declared here to avoid repetition on each child token. Individual `tokenDoc` objects within `children` _MAY_ override this value. |
| `category` | `string` | No | When all tokens in this group share the same semantic category, it _MAY_ be declared here. Individual `tokenDoc` objects within `children` _MAY_ override this value. |
| `children` | `array` | No | An ordered array of tokens and/or nested token groups. See [§7.6.2](#762-children). |
| `useCases` | `object` | No | When to use and when not to use the tokens in this group. |
| `guidelines` | `array` | No | Usage guidelines that apply to the group as a whole. Guidelines specific to individual tokens _SHOULD_ be placed on the `tokenDoc` within `children`. |
| `accessibility` | `object` | No | Accessibility documentation. |
| `links` | `array` | No | External resource links. |
| `$extensions` | `object` | No | Vendor-specific metadata. |

### 7.6.2 Children

The `children` array is the core mechanism for building token hierarchies. Each item in the array _MUST_ be one of:

- A **`tokenDoc`** object — an individual token with its full documentation (name, type, value, API mappings, etc.)
- A **`tokenGroupDoc`** object — a nested group containing its own `children`

The ordering of items in `children` is **significant**. Tools _SHOULD_ preserve the order for display, as it often represents a meaningful progression — a color grade scale from lightest to darkest, a spacing scale from smallest to largest, or a type scale from body to display.

Tools _MAY_ distinguish between a `tokenDoc` and a `tokenGroupDoc` by the presence of the `children` property (groups) or the `tokenType` property (tokens). When neither is present, the item _SHOULD_ be treated as a `tokenGroupDoc`.

### 7.6.3 Inherited Properties

When a `tokenGroupDoc` declares `tokenType` or `category`, these values serve as defaults for all `tokenDoc` children (direct and deeply nested). A child token _MAY_ override either value by declaring its own.

This inheritance is a documentation convenience — it reduces repetition in groups where all tokens share the same type or category. Tools that flatten a token group hierarchy _SHOULD_ resolve inherited values onto each leaf `tokenDoc`.

### 7.6.4 Examples

#### Flat group — semantic text color tokens

<!-- dsds:include spec/examples/tokens/token-group.json#/tokenGroupDoc -->
```json
{
  "name": "color-palette",
  "displayName": "Extended Color Palette",
  "description": "The full range of color options in the system. Colors are organized into named hue families, each with a grade scale from 0 (lightest) to 900 (darkest). The 450 grades are reserved for brand usage.",
  "status": "stable",
  "since": "1.0.0",
  "tokenType": "color",
  "category": "base",
  "tags": [
    "color",
    "palette",
    "base"
  ],
  "children": [
    {
      "name": "color-red-pushpin",
      "displayName": "Pushpin (Red)",
      "description": "The red hue family. Pushpin 450 is the system's primary hero color, used for brand moments and primary product actions.",
      "status": "stable",
      "since": "1.0.0",
      "tags": [
        "red",
        "brand",
        "hero"
      ],
      "children": [
        {
          "name": "color-red-pushpin-0",
          "displayName": "Pushpin 0",
          "description": "Lightest tint of the Pushpin red family. Suitable for large background surfaces and subtle error-state backgrounds.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#FFF7F7"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-0",
            "scssVariable": "$color-red-pushpin-0",
            "designToolVariable": "color/red/pushpin/0"
          }
        },
        {
          "name": "color-red-pushpin-50",
          "displayName": "Pushpin 50",
          "description": "Very light tint of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#FFEBEB"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-50",
            "scssVariable": "$color-red-pushpin-50",
            "designToolVariable": "color/red/pushpin/50"
          }
        },
        {
          "name": "color-red-pushpin-100",
          "displayName": "Pushpin 100",
          "description": "Light tint of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#FFE0E0"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-100",
            "scssVariable": "$color-red-pushpin-100",
            "designToolVariable": "color/red/pushpin/100"
          }
        },
        {
          "name": "color-red-pushpin-200",
          "displayName": "Pushpin 200",
          "description": "Light-medium tint of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#FCBBBB"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-200",
            "scssVariable": "$color-red-pushpin-200",
            "designToolVariable": "color/red/pushpin/200"
          }
        },
        {
          "name": "color-red-pushpin-300",
          "displayName": "Pushpin 300",
          "description": "Medium tint of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#F47171"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-300",
            "scssVariable": "$color-red-pushpin-300",
            "designToolVariable": "color/red/pushpin/300"
          }
        },
        {
          "name": "color-red-pushpin-400",
          "displayName": "Pushpin 400",
          "description": "Medium shade of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#EB4242"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-400",
            "scssVariable": "$color-red-pushpin-400",
            "designToolVariable": "color/red/pushpin/400"
          }
        },
        {
          "name": "color-red-pushpin-450",
          "displayName": "Pushpin 450",
          "description": "The system's primary hero color. Reserved for brand usage and primary product actions. Among the least accessible colors in the palette — do not use for functional color pairings without explicit contrast verification.",
          "status": "stable",
          "tokenType": "color",
          "tags": [
            "hero",
            "brand",
            "primary",
            "reserved"
          ],
          "value": {
            "resolved": "#E60023"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-450",
            "scssVariable": "$color-red-pushpin-450",
            "designToolVariable": "color/red/pushpin/450"
          },
          "guidelines": [
            {
              "guidance": "Reserve this color for brand moments and the primary product action. Do not use for general UI elements.",
              "rationale": "Pushpin 450 is the system's hero color. Overusing it dilutes its impact and creates accessibility challenges, as the 450 grades have limited contrast pairing options.",
              "type": "required",
              "category": "visual-design"
            }
          ]
        },
        {
          "name": "color-red-pushpin-500",
          "displayName": "Pushpin 500",
          "description": "Core red used for error states and critical status indicators.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#CC0000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-500",
            "scssVariable": "$color-red-pushpin-500",
            "designToolVariable": "color/red/pushpin/500"
          }
        },
        {
          "name": "color-red-pushpin-600",
          "displayName": "Pushpin 600",
          "description": "Dark shade of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#B60000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-600",
            "scssVariable": "$color-red-pushpin-600",
            "designToolVariable": "color/red/pushpin/600"
          }
        },
        {
          "name": "color-red-pushpin-700",
          "displayName": "Pushpin 700",
          "description": "Deep shade of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#9B0000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-700",
            "scssVariable": "$color-red-pushpin-700",
            "designToolVariable": "color/red/pushpin/700"
          }
        },
        {
          "name": "color-red-pushpin-800",
          "displayName": "Pushpin 800",
          "description": "Very dark shade of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#800000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-800",
            "scssVariable": "$color-red-pushpin-800",
            "designToolVariable": "color/red/pushpin/800"
          }
        },
        {
          "name": "color-red-pushpin-900",
          "displayName": "Pushpin 900",
          "description": "Darkest shade of the Pushpin red family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#660000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-900",
            "scssVariable": "$color-red-pushpin-900",
            "designToolVariable": "color/red/pushpin/900"
          }
        }
      ]
    },
    {
      "name": "color-blue-skycicle",
      "displayName": "Skycicle (Blue)",
      "description": "The blue hue family. Used for interactive elements, education surfaces, informational indicators, and shopping experiences.",
      "status": "stable",
      "since": "1.0.0",
      "tags": [
        "blue",
        "interactive",
        "info"
      ],
      "children": [
        {
          "name": "color-blue-skycicle-0",
          "displayName": "Skycicle 0",
          "description": "Lightest tint of the Skycicle blue family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#F7FBFF"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-0",
            "scssVariable": "$color-blue-skycicle-0",
            "designToolVariable": "color/blue/skycicle/0"
          }
        },
        {
          "name": "color-blue-skycicle-100",
          "displayName": "Skycicle 100",
          "description": "Light tint of the Skycicle blue family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#D7EDFF"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-100",
            "scssVariable": "$color-blue-skycicle-100",
            "designToolVariable": "color/blue/skycicle/100"
          }
        },
        {
          "name": "color-blue-skycicle-300",
          "displayName": "Skycicle 300",
          "description": "Medium tint of the Skycicle blue family. Used as the interactive element color in dark mode.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#75BFFF"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-300",
            "scssVariable": "$color-blue-skycicle-300",
            "designToolVariable": "color/blue/skycicle/300"
          }
        },
        {
          "name": "color-blue-skycicle-500",
          "displayName": "Skycicle 500",
          "description": "Core blue used for interactive elements, education surfaces, and shopping experiences in light mode.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#0074E8"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-500",
            "scssVariable": "$color-blue-skycicle-500",
            "designToolVariable": "color/blue/skycicle/500"
          }
        },
        {
          "name": "color-blue-skycicle-700",
          "displayName": "Skycicle 700",
          "description": "Deep shade of the Skycicle blue family. Used for link text in light mode.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#004BA9"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-700",
            "scssVariable": "$color-blue-skycicle-700",
            "designToolVariable": "color/blue/skycicle/700"
          }
        },
        {
          "name": "color-blue-skycicle-900",
          "displayName": "Skycicle 900",
          "description": "Darkest shade of the Skycicle blue family.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#002966"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-900",
            "scssVariable": "$color-blue-skycicle-900",
            "designToolVariable": "color/blue/skycicle/900"
          }
        }
      ]
    },
    {
      "name": "color-gray-roboflow",
      "displayName": "Roboflow (Gray)",
      "description": "The neutral gray family. The foundation of the system's layering model and the most commonly used color family in both light and dark modes.",
      "status": "stable",
      "since": "1.0.0",
      "tags": [
        "gray",
        "neutral"
      ],
      "children": [
        {
          "name": "color-gray-roboflow-50",
          "displayName": "Roboflow 50",
          "description": "Near-white neutral. Used for subtle background differentiation.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#F9F9F9"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-50",
            "scssVariable": "$color-gray-roboflow-50",
            "designToolVariable": "color/gray/roboflow/50"
          }
        },
        {
          "name": "color-gray-roboflow-200",
          "displayName": "Roboflow 200",
          "description": "Light gray. Used for secondary backgrounds and borders.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#E9E9E9"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-200",
            "scssVariable": "$color-gray-roboflow-200",
            "designToolVariable": "color/gray/roboflow/200"
          }
        },
        {
          "name": "color-gray-roboflow-500",
          "displayName": "Roboflow 500",
          "description": "Mid-gray. Used for subtle text, default borders, and disabled states in light mode. The minimum gray that meets WCAG AA contrast on white for large text.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#767676"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-500",
            "scssVariable": "$color-gray-roboflow-500",
            "designToolVariable": "color/gray/roboflow/500"
          }
        },
        {
          "name": "color-gray-roboflow-700",
          "displayName": "Roboflow 700",
          "description": "Dark gray.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#2B2B2B"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-700",
            "scssVariable": "$color-gray-roboflow-700",
            "designToolVariable": "color/gray/roboflow/700"
          }
        }
      ]
    },
    {
      "name": "color-white-mochimalist",
      "displayName": "Mochimalist (White)",
      "description": "The white value. Used as the default background surface in light mode and as inverse text in dark mode.",
      "status": "stable",
      "since": "1.0.0",
      "children": [
        {
          "name": "color-white-mochimalist-0",
          "displayName": "Mochimalist 0",
          "description": "Pure white.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#FFFFFF"
          },
          "api": {
            "cssCustomProperty": "--color-white-mochimalist-0",
            "scssVariable": "$color-white-mochimalist-0",
            "designToolVariable": "color/white/mochimalist/0"
          }
        }
      ]
    },
    {
      "name": "color-black-cosmicore",
      "displayName": "Cosmicore (Black)",
      "description": "The near-black value. Used as the default text color and background surface in dark mode.",
      "status": "stable",
      "since": "1.0.0",
      "children": [
        {
          "name": "color-black-cosmicore-900",
          "displayName": "Cosmicore 900",
          "description": "Near-black. The darkest color in the system — used for default text in light mode and the default background in dark mode.",
          "status": "stable",
          "tokenType": "color",
          "value": {
            "resolved": "#111111"
          },
          "api": {
            "cssCustomProperty": "--color-black-cosmicore-900",
            "scssVariable": "$color-black-cosmicore-900",
            "designToolVariable": "color/black/cosmicore/900"
          }
        }
      ]
    }
  ],
  "guidelines": [
    {
      "guidance": "The 450 colors are reserved for brand usage. Do not use 450 grades for functional UI elements without explicit accessibility verification.",
      "rationale": "The 450 grades are among the least accessible colors in the palette. They work best within larger brand moments and are not suitable for functional color pairings.",
      "type": "required",
      "category": "visual-design"
    },
    {
      "guidance": "Use the darkGray text color on any background color at grade 400 or below. Use white text on grade 500 and above.",
      "rationale": "Ensures WCAG 2.1 AA contrast compliance for text placed on palette colors.",
      "type": "required",
      "category": "accessibility",
      "criteria": [
        "https://www.w3.org/TR/WCAG22/#contrast-minimum"
      ]
    },
    {
      "guidance": "Do not use base palette tokens directly in product code. Use semantic tokens that reference these base values instead.",
      "rationale": "Semantic tokens adapt automatically across color modes. Direct use of base palette tokens bypasses the theming system and will produce incorrect results in dark mode.",
      "type": "prohibited",
      "category": "engineering"
    }
  ],
  "links": [
    {
      "type": "design",
      "url": "https://www.figma.com/file/abc123/color-palette",
      "label": "Figma — Extended Color Palette"
    },
    {
      "type": "documentation",
      "url": "https://gestalt.pinterest.systems/v1/foundations/color/palette",
      "label": "Color Palette documentation"
    }
  ]
}
```
<!-- /dsds:include -->

The full example file contains a deeply nested color palette hierarchy. The snippet above shows the top-level structure — see `spec/examples/tokens/token-group.json` for the complete example including hue families (Pushpin, Skycicle, Roboflow) with grade scales.

#### Nested hierarchy — color palette with hue families and grades

This example shows how a design system like Pinterest's Gestalt might model its extended color palette. The top-level group represents the full palette. Each child group represents a hue family (e.g., "Pushpin / Red"). Each leaf token represents a single grade within the hue. The following is the complete token group from the example file:

See `spec/examples/tokens/token-group.json` for the full source.

### 7.6.5 Token Groups vs. Styles

Token groups and styles serve complementary purposes. Understanding the distinction helps document authors place information in the right location.

| Concern | Belongs in Token Group | Belongs in Style |
|---|---|---|
| What tokens exist and what are their values? | ✓ | |
| What principles govern how color is used? | | ✓ |
| How are text color tokens organized by purpose? | ✓ | |
| Why does the system use three levels of text emphasis? | | ✓ |
| What is the grade scale for the red hue family? | ✓ | |
| When should I use a semantic token vs. a raw palette token? | | ✓ |
| What CSS custom property maps to `space-4`? | ✓ | |

Token groups are the **inventory** — the catalog of what tokens exist, their values, and their API mappings. Styles are the **strategy** — the principles, guidelines, and decision-making framework for how tokens are applied.

A `styleDoc` _MAY_ reference token groups via its `tokenGroups` property (which contains artifact references by name). This connects the macro-level guidance in a style to the concrete token values defined in token groups.

---

## 7.7 Theme Documentation

A theme provides alternative token values for a **named context** — such as a color mode (light, dark, high-contrast), a density setting (compact, comfortable, spacious), a brand variant, or a product-specific customization.

Themes are a critical part of modern design token architecture. Real-world design systems routinely document how token values change across contexts:

- **Carbon (IBM):** Four named themes (White, Gray 10, Gray 90, Gray 100) where every semantic token resolves to different hex values depending on the active theme.
- **Gestalt (Pinterest):** Light and dark modes where tokens like `color-text-default` resolve to `#111111` in light mode and `#ffffff` in dark mode.

DSDS themes address this by providing a **separate document type** that references existing tokens and supplies override values. This design keeps the token catalog as the single source of truth for what a token _is_ (its name, type, semantic purpose, API mappings, and documentation), while themes describe how token _values_ change across contexts.

### 7.7.1 Structure

A theme is intentionally lean — it is a simple mapping of tokens to alternative values, not a documentation artifact. Themes carry no `description`, `summary`, `guidelines`, or `accessibility` properties. Documentation about _why_ a theme exists or _how_ to use it belongs on the style or token group that references it, or in the `useCases` object on the theme itself.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable identifier (e.g., `"dark"`, `"high-contrast"`, `"compact"`, `"gray-100"`). Pattern: `^[a-z][a-z0-9-]*$`. |
| `displayName` | `string` | Yes | Human-readable name (e.g., `"Dark Mode"`, `"High Contrast"`, `"Gray 100 Theme"`). |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `platformStatus` | `object` | No | See [§5.2.1](#521-platform-status). Per-platform readiness. |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | The version in which this theme was introduced. |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `category` | `string` | No | The category of adaptation this theme represents. See [§7.7.2](#772-category). |
| `overrides` | `array` | Yes | The set of token value overrides. See [§7.7.3](#773-overrides). |
| `useCases` | `object` | No | When to apply and when not to apply this theme. See [§15 Use Cases](#15-use-cases). |
| `links` | `array` | No | External resource links. |
| `$extensions` | `object` | No | Vendor-specific metadata. |

### 7.7.2 Category

The optional `category` property classifies the type of adaptation the theme represents. Common values:

| Value | Description |
|---|---|
| `"color-mode"` | A color scheme variant such as light, dark, or high-contrast. |
| `"density"` | A spatial density variant such as compact, comfortable, or spacious. |
| `"brand"` | A brand or sub-brand variant that adjusts colors, typography, or other visual attributes. |
| `"product"` | Product-specific overrides within a shared design system. |

Design systems _MAY_ define additional categories.

### 7.7.3 Overrides

The `overrides` array is the core of a theme. Each entry references an existing token by name and supplies an alternative value for it within this theme's context.

Each token override object is a simple mapping — just a token name and a value:

| Property | Type | Required | Description |
|---|---|---|---|
| `token` | `string` | Yes | The name of the token being overridden. _MUST_ match the `name` of a `tokenDoc` defined elsewhere in the system. |
| `value` | `object` | Yes | The override value. Follows the same `tokenValue` structure as `tokenDoc.value` — a displayable representation containing a resolved value, alias reference, and/or DTCG file pointer. |

Only tokens whose values differ from the default need to be listed. Unlisted tokens retain their default values. This keeps theme documents focused — a dark mode theme only needs to list the tokens that change, not the entire token catalog.

### 7.7.4 Theme Examples

#### Color mode theme — dark mode

<!-- dsds:include spec/examples/tokens/theme.json#/themeDoc -->
```json
{
  "name": "dark",
  "displayName": "Dark Mode",
  "status": "stable",
  "since": "2.0.0",
  "category": "color-mode",
  "tags": [
    "dark-mode",
    "color-mode",
    "accessibility"
  ],
  "platformStatus": {
    "react": {
      "status": "stable",
      "since": "2.0.0"
    },
    "web-component": {
      "status": "stable",
      "since": "2.1.0"
    },
    "ios": {
      "status": "stable",
      "since": "2.0.0",
      "description": "Automatically applied when the device is set to dark appearance."
    },
    "android": {
      "status": "stable",
      "since": "2.2.0",
      "description": "Follows the system-level dark theme setting via AppCompat.DayNight."
    },
    "figma": {
      "status": "stable",
      "since": "2.0.0",
      "description": "Available as a dedicated mode in the Figma variable collection."
    }
  },
  "overrides": [
    {
      "token": "color-background-default",
      "value": {
        "resolved": "#111111",
        "reference": "color.black.cosmicore.900"
      }
    },
    {
      "token": "color-background-elevation-accent",
      "value": {
        "resolved": "#191919",
        "reference": "color.gray.roboflow.800"
      }
    },
    {
      "token": "color-background-elevation-floating",
      "value": {
        "resolved": "#2B2B2B",
        "reference": "color.gray.roboflow.700"
      }
    },
    {
      "token": "color-background-elevation-raised",
      "value": {
        "resolved": "#4A4A4A",
        "reference": "color.gray.roboflow.600"
      }
    },
    {
      "token": "color-background-secondary-base",
      "value": {
        "resolved": "#767676",
        "reference": "color.gray.roboflow.500"
      }
    },
    {
      "token": "color-background-inverse-base",
      "value": {
        "resolved": "#F9F9F9",
        "reference": "color.gray.roboflow.50"
      }
    },
    {
      "token": "color-background-error-base",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "color-background-error-weak",
      "value": {
        "resolved": "#660000",
        "reference": "color.red.pushpin.900"
      }
    },
    {
      "token": "color-background-success-base",
      "value": {
        "resolved": "#6BEC8C",
        "reference": "color.green.matchacado.300"
      }
    },
    {
      "token": "color-background-success-weak",
      "value": {
        "resolved": "#00422C",
        "reference": "color.green.matchacado.700"
      }
    },
    {
      "token": "color-background-info-base",
      "value": {
        "resolved": "#75BFFF",
        "reference": "color.blue.skycicle.300"
      }
    },
    {
      "token": "color-background-info-weak",
      "value": {
        "resolved": "#003C96",
        "reference": "color.blue.skycicle.800"
      }
    },
    {
      "token": "color-background-warning-base",
      "value": {
        "resolved": "#FDC900",
        "reference": "color.yellow.caramellow.300"
      }
    },
    {
      "token": "color-background-warning-weak",
      "value": {
        "resolved": "#7C2D00",
        "reference": "color.yellow.caramellow.800"
      }
    },
    {
      "token": "color-background-education",
      "value": {
        "resolved": "#75BFFF",
        "reference": "color.blue.skycicle.300"
      }
    },
    {
      "token": "color-background-recommendation-base",
      "value": {
        "resolved": "#B190FF",
        "reference": "color.purple.mysticool.300"
      }
    },
    {
      "token": "color-background-recommendation-weak",
      "value": {
        "resolved": "#550AA9",
        "reference": "color.purple.mysticool.700"
      }
    },
    {
      "token": "color-background-selected-base",
      "value": {
        "resolved": "#E9E9E9",
        "reference": "color.gray.roboflow.200"
      }
    },
    {
      "token": "color-text-default",
      "value": {
        "resolved": "#FFFFFF",
        "reference": "color.white.mochimalist.0"
      }
    },
    {
      "token": "color-text-subtle",
      "value": {
        "resolved": "#A5A5A5",
        "reference": "color.gray.roboflow.400"
      }
    },
    {
      "token": "color-text-disabled",
      "value": {
        "resolved": "#4A4A4A",
        "reference": "color.gray.roboflow.600"
      }
    },
    {
      "token": "color-text-inverse",
      "value": {
        "resolved": "#111111",
        "reference": "color.black.cosmicore.900"
      }
    },
    {
      "token": "color-text-error",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "color-text-success",
      "value": {
        "resolved": "#39D377",
        "reference": "color.green.matchacado.400"
      }
    },
    {
      "token": "color-text-warning",
      "value": {
        "resolved": "#E18D00",
        "reference": "color.yellow.caramellow.400"
      }
    },
    {
      "token": "color-text-link",
      "value": {
        "resolved": "#45A3FE",
        "reference": "color.blue.skycicle.400"
      }
    },
    {
      "token": "color-text-shopping",
      "value": {
        "resolved": "#75BFFF",
        "reference": "color.blue.skycicle.300"
      }
    },
    {
      "token": "color-icon-default",
      "value": {
        "resolved": "#FFFFFF",
        "reference": "color.white.mochimalist.0"
      }
    },
    {
      "token": "color-icon-subtle",
      "value": {
        "resolved": "#A5A5A5",
        "reference": "color.gray.roboflow.400"
      }
    },
    {
      "token": "color-icon-inverse",
      "value": {
        "resolved": "#111111",
        "reference": "color.black.cosmicore.900"
      }
    },
    {
      "token": "color-icon-disabled",
      "value": {
        "resolved": "#4A4A4A",
        "reference": "color.gray.roboflow.600"
      }
    },
    {
      "token": "color-icon-error",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "color-icon-success",
      "value": {
        "resolved": "#39D377",
        "reference": "color.green.matchacado.400"
      }
    },
    {
      "token": "color-icon-info",
      "value": {
        "resolved": "#75BFFF",
        "reference": "color.blue.skycicle.300"
      }
    },
    {
      "token": "color-icon-warning",
      "value": {
        "resolved": "#E18D00",
        "reference": "color.yellow.caramellow.400"
      }
    },
    {
      "token": "color-icon-recommendation",
      "value": {
        "resolved": "#B190FF",
        "reference": "color.purple.mysticool.300"
      }
    },
    {
      "token": "color-border-default",
      "value": {
        "resolved": "#CDCDCD",
        "reference": "color.gray.roboflow.300"
      }
    },
    {
      "token": "color-border-container",
      "value": {
        "resolved": "#767676",
        "reference": "color.gray.roboflow.500"
      }
    },
    {
      "token": "color-border-error",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "elevation-floating",
      "value": {
        "resolved": "none"
      }
    },
    {
      "token": "elevation-raised-top",
      "value": {
        "resolved": "0px 0.5px 0px 0px rgba(249, 249, 249, 0)"
      }
    },
    {
      "token": "elevation-raised-bottom",
      "value": {
        "resolved": "0px -0.5px 0px 0px rgba(249, 249, 249, 0)"
      }
    }
  ],
  "useCases": {
    "whenToUse": [
      {
        "description": "When the user's system preference is `prefers-color-scheme: dark` or they have explicitly selected dark mode in the application settings."
      },
      {
        "description": "When the application is used in low-light environments where a bright screen causes eye strain or discomfort."
      },
      {
        "description": "When embedding content in a context that is already dark (e.g., a media player, a code editor, or a presentation tool in dark mode)."
      }
    ],
    "whenNotToUse": [
      {
        "description": "When the user has not expressed a preference for dark mode. Default to the light theme.",
        "alternative": {
          "name": "light",
          "rationale": "Dark mode can reduce readability for users with certain visual impairments such as astigmatism, where light text on dark backgrounds causes halation. Defaulting to light ensures the broadest accessibility baseline."
        }
      },
      {
        "description": "When high-contrast accessibility is the primary concern rather than a dark aesthetic.",
        "alternative": {
          "name": "high-contrast",
          "rationale": "The dark theme is optimized for comfort in low-light environments, not maximum contrast. The high-contrast theme provides stronger contrast ratios that better serve users with low vision."
        }
      },
      {
        "description": "When the content is primarily photographic or illustrative and the surrounding chrome should not compete visually.",
        "alternative": {
          "name": "light",
          "rationale": "Photographic content often assumes a neutral white surround for accurate color perception. A dark surround shifts the viewer's perception of brightness and color in the images."
        }
      }
    ]
  },
  "links": [
    {
      "type": "design",
      "url": "https://www.figma.com/file/abc123/color-system?node-id=100:200",
      "label": "Figma — Dark mode variable collection"
    },
    {
      "type": "documentation",
      "url": "https://design.example.com/foundations/color/dark-mode",
      "label": "Dark mode usage guidelines"
    },
    {
      "type": "source",
      "url": "https://github.com/example/design-system/blob/main/tokens/themes/dark.tokens.json",
      "label": "Dark theme token source (DTCG format)"
    }
  ]
}
```
<!-- /dsds:include -->

#### Multi-theme system — Carbon's four themes

Carbon's design system uses four named themes, each based on a specific primary background color. This can be represented as four separate theme documents. Here is a minimal example of one:

```json
{
  "name": "gray-100",
  "displayName": "Gray 100",
  "status": "stable",
  "since": "1.0.0",
  "category": "color-mode",
  "tags": ["dark-mode"],
  "overrides": [
    { "token": "background", "value": { "resolved": "#161616" } },
    { "token": "layer-01", "value": { "resolved": "#262626" } },
    { "token": "layer-02", "value": { "resolved": "#393939" } },
    { "token": "layer-03", "value": { "resolved": "#525252" } },
    { "token": "text-primary", "value": { "resolved": "#f4f4f4" } },
    { "token": "text-secondary", "value": { "resolved": "#c6c6c6" } },
    { "token": "focus", "value": { "resolved": "#ffffff" } }
  ]
}
```

> _Note: This is an abbreviated inline example. The full dark mode theme with all overrides, useCases, platformStatus, and links is in `spec/examples/tokens/theme.json`._

#### Density theme — compact mode

Themes are not limited to color. A density theme overrides spacing and sizing tokens:

```json
{
  "name": "compact",
  "displayName": "Compact Density",
  "status": "experimental",
  "since": "3.1.0",
  "category": "density",
  "overrides": [
    { "token": "space-component-padding-vertical", "value": { "resolved": "4px", "reference": "space.100" } },
    { "token": "space-component-padding-horizontal", "value": { "resolved": "8px", "reference": "space.200" } },
    { "token": "space-component-gap", "value": { "resolved": "4px", "reference": "space.100" } },
    { "token": "size-component-height-default", "value": { "resolved": "32px" } }
  ],
  "useCases": {
    "whenToUse": [
      {
        "description": "When the interface is data-dense and information density is more important than touch-target size."
      }
    ],
    "whenNotToUse": [
      {
        "description": "When the interface is touch-primary (mobile, tablet, kiosk).",
        "alternative": {
          "name": "comfortable",
          "rationale": "Compact density reduces touch targets below the recommended 44×44px minimum."
        }
      }
    ]
  }
}
```

### 7.7.5 Themes vs. Token Groups

Themes and token groups serve different purposes and _MUST NOT_ be confused:

| Concern | Token Group | Theme |
|---|---|---|
| **What it defines** | Token identity, documentation, and organization | Alternative values for existing tokens |
| **Contains tokens?** | Yes — full `tokenDoc` objects with name, type, API, guidelines | No — only token name → value mappings |
| **Has descriptions?** | Yes — `description`, `summary`, `guidelines`, `accessibility` | No — themes carry no prose; use `useCases` for when-to-use guidance |
| **Hierarchy** | Recursive — groups within groups | Flat — a list of token name → value overrides |
| **Use case** | "What tokens exist in our system?" | "How do token values change in dark mode?" |
| **When to use** | Always — every token should live in a group | When the system supports multiple modes, densities, brands, or other contextual variations |

A design system that uses both would typically have:

1. A set of **token groups** documenting the full token catalog with default values
2. One or more **themes** documenting how those values change in specific contexts

### 7.7.6 Themes in a DSDS Document

Themes are included in the `themes` array of a document group within the root `documentGroups` array:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentGroups": [
    {
      "name": "Acme Design System — Themes",
      "description": "Color mode themes for the Acme Design System.",
      "themes": [
        {
          "name": "dark",
          "displayName": "Dark Mode",
          "status": "stable",
          "category": "color-mode",
          "overrides": [
            {
              "token": "color-background-default",
              "value": { "resolved": "#111111" }
            },
            {
              "token": "color-text-default",
              "value": { "resolved": "#ffffff" }
            }
          ]
        },
        {
          "name": "high-contrast",
          "displayName": "High Contrast",
          "status": "experimental",
          "category": "color-mode",
          "overrides": [
            {
              "token": "color-background-default",
              "value": { "resolved": "#000000" }
            },
            {
              "token": "color-text-default",
              "value": { "resolved": "#ffffff" }
            }
          ]
        }
      ]
    }
  ]
}
```

Themes can be combined with token groups and other artifacts in the same document group. This is the recommended approach for bundling a complete token system — default token definitions alongside their theme overrides:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentGroups": [
    {
      "name": "Acme Design System — Color",
      "description": "Color token definitions and theme overrides.",
      "tokenGroups": [
        {
          "name": "color",
          "displayName": "Color Tokens",
          "description": "All color tokens in the system.",
          "status": "stable",
          "children": ["..."]
        }
      ],
      "themes": [
        {
          "name": "dark",
          "displayName": "Dark Mode",
          "status": "stable",
          "overrides": ["..."]
        }
      ]
    }
  ]
}
```

---