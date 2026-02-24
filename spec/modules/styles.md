# DSDS Styles Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the structure for documenting macro-level visual styles — color, typography, spacing, elevation, motion, and other visual attributes. Where the [Tokens Module](tokens.md) documents individual token values and their architecture, the Styles Module documents the principles, guidelines, and usage rules that govern how those tokens are applied across the system.

---

## 8. Style Documentation

A style documentation object describes the rationale, principles, scales, and usage guidance for a visual attribute category. Each style connects to one or more token groups that supply its concrete values.

### 8.1 Structure

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | See [§5.1](#51-identification). Machine-readable identifier (e.g., `"color"`, `"typography"`, `"spacing"`). |
| `displayName` | `string` | Yes | See [§5.1](#51-identification). |
| `summary` | `string` | No | See [§5.1](#51-identification). |
| `description` | `string` | Yes | See [§5.1](#51-identification). CommonMark supported. |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | See [§5.2](#52-status). |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `category` | `string` | Yes | The visual attribute category. See [§8.2](#82-category). |
| `principles` | `array` | No | High-level principles governing this style. See [§8.3](#83-principles). |
| `tokenGroups` | `array` | No | References to the token groups that implement this style. See [§8.4](#84-token-group-references). |
| `scales` | `array` | No | Ordered scales (e.g., type scale, spacing scale). See [§8.5](#85-scales). |
| `useCases` | `object` | No | When to use and when not to use this style. See [§8.6](#86-use-cases). |
| `guidelines` | `object` | No | Usage guidance. See [§10 Guidelines Structure](#10-guidelines-structure). |
| `accessibility` | `object` | No | Accessibility documentation. See [§11 Accessibility Structure](#11-accessibility-structure). |
| `related` | `array` | No | See [§5.4](#54-related-artifacts). |
| `links` | `array` | No | See [§5.5](#55-links) and [§12 Links](#12-links). |
| `$extensions` | `object` | No | See [§13 Extensions](#13-extensions). |

### 8.2 Category

The `category` property classifies the visual attribute this style governs. Common values:

| Value | Description |
|---|---|
| `"color"` | Color system, palettes, semantic color usage, and color modes. |
| `"typography"` | Type hierarchy, font families, type scales, and typographic rules. |
| `"spacing"` | Spatial system, spacing scale, and layout rhythm. |
| `"elevation"` | Shadows, layering, z-index strategy, and depth. |
| `"motion"` | Animation timing, easing curves, transition patterns, and reduced-motion considerations. |
| `"shape"` | Border radius, corner treatments, and geometric conventions. |

Design systems _MAY_ define additional categories.

### 8.3 Principles

The optional `principles` array contains high-level guiding ideas for this visual style.

Each principle object:

| Property | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | A short name for the principle (e.g., "Purposeful motion", "Use the scale"). |
| `description` | `string` | Yes | What this principle means and how it guides decisions. |

**Example:**

```json
{
  "principles": [
    {
      "title": "Functional first",
      "description": "Color choices serve functional needs — status, hierarchy, interaction — before aesthetic ones."
    },
    {
      "title": "Accessible by default",
      "description": "All color combinations in the system meet WCAG 2.1 AA contrast requirements. AAA compliance is the goal for body text."
    }
  ]
}
```

### 8.4 Token Group References

The optional `tokenGroups` array connects the macro-level style to the token groups that implement it. This bridges the gap between high-level guidance ("use three levels of text emphasis") and the concrete token values that make it work.

Each token group reference:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The name of the referenced token group. _MUST_ match a token group name defined in a token schema document. |
| `description` | `string` | No | A short description of how this token group relates to the style (e.g., "Provides the primary, secondary, and tertiary text color tokens"). |

**Example:**

```json
{
  "tokenGroups": [
    {
      "name": "color-text",
      "description": "Semantic text color tokens for body, secondary, tertiary, link, error, success, and disabled text."
    },
    {
      "name": "color-background",
      "description": "Surface and container background tokens across light and dark modes."
    },
    {
      "name": "color-border",
      "description": "Border tokens for inputs, cards, dividers, and interactive states."
    }
  ]
}
```

### 8.5 Scales

The optional `scales` array documents ordered sequences of values, such as a type scale, spacing scale, or elevation scale. Each step in a scale references a design token.

Each scale object:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Machine-readable name of the scale (e.g., `"spacing-scale"`, `"type-scale"`). |
| `displayName` | `string` | No | Human-readable name. |
| `description` | `string` | Yes | What this scale is and how to use it. |
| `steps` | `array` | Yes | The ordered steps in the scale, from smallest/lowest to largest/highest. |

Each step object:

| Property | Type | Required | Description |
|---|---|---|---|
| `token` | `string` | Yes | The token name for this step. _MUST_ reference a token defined in the token schema. |
| `label` | `string` | No | A human-readable label (e.g., `"sm"`, `"md"`, `"lg"`, `"2xl"`). |
| `value` | `string` | No | The resolved value for display (e.g., `"16px"`, `"1rem"`, `"#1a1a1a"`). |
| `description` | `string` | No | Usage notes for this specific step. |

**Example:**

```json
{
  "scales": [
    {
      "name": "spacing-scale",
      "displayName": "Spacing Scale",
      "description": "A geometric spacing scale based on a 4px unit. Use these values for all padding, margin, and gap properties.",
      "steps": [
        { "token": "space-0", "label": "0", "value": "0px" },
        { "token": "space-1", "label": "4xs", "value": "2px" },
        { "token": "space-2", "label": "3xs", "value": "4px" },
        { "token": "space-3", "label": "2xs", "value": "8px" },
        { "token": "space-4", "label": "xs", "value": "12px" },
        { "token": "space-5", "label": "sm", "value": "16px", "description": "The base unit. Use for default internal component padding." },
        { "token": "space-6", "label": "md", "value": "24px" },
        { "token": "space-7", "label": "lg", "value": "32px" },
        { "token": "space-8", "label": "xl", "value": "48px" },
        { "token": "space-9", "label": "2xl", "value": "64px" }
      ]
    }
  ]
}
```

### 8.6 Use Cases

The optional `useCases` object describes when to use and when not to use this style. This provides scenario-driven guidance that complements the more abstract guidelines. See [§X Use Cases](#x-use-cases) for the full use case specification.

| Property | Type | Description |
|---|---|---|
| `whenToUse` | `array` | Scenarios in which this style is the appropriate choice. |
| `whenNotToUse` | `array` | Scenarios in which this style should not be used. Each entry _SHOULD_ include an `alternative`. |

Each use case entry:

| Property | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | Yes | A description of the scenario. |
| `alternative` | `object` | No | The recommended alternative. Contains a required `name` and optional `rationale`. |
| `examples` | `array` | No | Examples illustrating the scenario. |

**Example:**

```json
{
  "useCases": {
    "whenToUse": [
      {
        "description": "When applying color to text content rendered on standard light or dark background surfaces provided by the design system."
      }
    ],
    "whenNotToUse": [
      {
        "description": "When placing text on a brand-colored, gradient, or image background where the system's pre-validated contrast pairings do not apply.",
        "alternative": {
          "name": "color-palette",
          "rationale": "Raw palette tokens allow manual contrast verification against non-standard backgrounds. Semantic text tokens are only validated against the system's default surface tokens."
        }
      }
    ]
  }
}
```

### 8.7 Styles vs. Tokens

Styles and tokens serve complementary purposes. Understanding the distinction helps document authors place information in the right location.

| Concern | Belongs in Style | Belongs in Token |
|---|---|---|
| Why three levels of text emphasis? | ✓ | |
| What is the hex value of `color-text-primary`? | | ✓ |
| How does the spacing scale progress? | ✓ | |
| What CSS custom property maps to `space-4`? | | ✓ |
| When should I use the type scale vs. a custom size? | ✓ | |
| Which tokens alias `color-text-primary`? | | ✓ |

---