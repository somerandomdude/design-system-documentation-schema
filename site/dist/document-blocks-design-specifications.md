# Design specifications document block

The visual specs of a component: property values, spacing, size limits, typography, and how it responds to breakpoints. Makes every visual decision explicit and measurable, so design and code stay in sync.

Source: `document-blocks/design-specifications.schema.json`

**8 definitions** in this file: `designSpecifications`, `designProperties`, `spacingSpec`, `sizingSpec`, `typographySpec`, `responsiveEntry`, `typographyEntrySpec`, `designValue`

## designSpecifications {#designspecifications}

The component's default, baseline specs — properties, spacing, size, typography, and responsive behavior. Per-variant and per-state overrides don't go here; they live on the `variants` and `states` blocks.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"design-specifications"` | ✓ | Identifies this block as a design specifications spec. |
| `properties` | [designProperties](document-blocks-design-specifications.md#designproperties) | at least 1 | The default property values (ex: 'background', 'border-radius'). |
| `spacing` | [spacingSpec](document-blocks-design-specifications.md#spacingspec) | at least 1 | The default spacing. |
| `sizing` | [sizingSpec](document-blocks-design-specifications.md#sizingspec) | at least 1 | The default size limits. |
| `typography` | [typographySpec](document-blocks-design-specifications.md#typographyspec) | at least 1 | The default typography. |
| `responsive` | [responsiveEntry](document-blocks-design-specifications.md#responsiveentry)[] | at least 1 | How the component adapts across breakpoints, smallest to largest. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**Constraint:** At least one of `properties`, `spacing`, `sizing`, `typography`, `responsive` must be present.

**References:** [designProperties](document-blocks-design-specifications.md#designproperties), [spacingSpec](document-blocks-design-specifications.md#spacingspec), [sizingSpec](document-blocks-design-specifications.md#sizingspec), [typographySpec](document-blocks-design-specifications.md#typographyspec), [responsiveEntry](document-blocks-design-specifications.md#responsiveentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "design-specifications",
  "properties": {
    "background": "button-bg",
    "text-color": "button-text",
    "border-color": "button-border",
    "border-width": "1px",
    "border-radius": "button-radius",
    "padding-horizontal": "button-padding-x",
    "padding-vertical": "button-padding-y",
    "font-family": "font-family-body",
    "font-size": "14px",
    "font-weight": "500",
    "line-height": "20px",
    "icon-size": "16px",
    "icon-color": "inherit",
    "icon-gap": "8px",
    "focus-ring-color": "color-focus",
    "focus-ring-width": "2px",
    "focus-ring-offset": "2px",
    "min-height": "40px",
    "min-width": "64px",
    "opacity": "1"
  },
  "spacing": {
    "internal": {
      "container-horizontal": "space-4",
      "container-vertical": "space-2",
      "icon-to-label": "space-2"
    },
    "external": {
      "button-to-button": "space-2",
      "button-group-gap": "space-3"
    }
  },
  "sizing": {
    "minWidth": "64px",
    "minHeight": "40px"
  },
  "typography": {
    "label": {
      "fontFamily": "font-family-body",
      "fontSize": "14px",
      "fontWeight": "500",
      "lineHeight": "20px",
      "typeToken": "$body-compact-01"
    }
  },
  "responsive": [
    {
      "breakpoint": "320px",
      "description": "Below 320px, buttons expand to full width automatically to maintain a usable tap target."
    },
    {
      "breakpoint": "768px",
      "description": "Below 768px, buttons in a button group stack vertically and expand to full width."
    },
    {
      "breakpoint": "1024px",
      "description": "Above 1024px, the minimum button width increases from 44px to 64px."
    }
  ]
}
```

## designProperties {#designproperties}

A map of property name to value. Keys say what the value controls (ex: 'background', 'min-height') and MUST be lowercase kebab-case. Values are token names ('color-action-primary') or raw CSS ('#0055b3', '16px') — use either, or mix them.

Open map — values are `any`.

**References:** [designValue](document-blocks-design-specifications.md#designvalue)

## spacingSpec {#spacingspec}

Spacing around and inside the component. `internal` is spacing the component owns; `external` is spacing it recommends but the parent layout controls.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `internal` | map<string, [designValue](document-blocks-design-specifications.md#designvalue)> |  | Padding and gaps inside the component. Keys name the relationship (ex: 'icon-to-label') and MUST be lowercase kebab-case. Values are token names or raw CSS (ex: 'space-4', '8px'). |
| `external` | map<string, [designValue](document-blocks-design-specifications.md#designvalue)> |  | Recommended margins between this component and its siblings or container. Keys name the relationship (ex: 'button-to-button') and MUST be lowercase kebab-case. This is a recommendation — the parent layout has final control. |

**References:** [designValue](document-blocks-design-specifications.md#designvalue)

## sizingSpec {#sizingspec}

The component's size limits — min/max width and height, and any aspect ratio.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `minWidth` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Minimum width as a token name or raw value (ex: 'size-button-min-width', '64px'). |
| `maxWidth` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Maximum width as a token name or raw value (ex: 'size-dialog-max-width', '600px', 'none'). |
| `minHeight` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Minimum height as a token name or raw value (ex: 'size-button-min-height', '44px'). |
| `maxHeight` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Maximum height as a token name or raw value. |
| `aspectRatio` | string |  | Aspect ratio as a ratio string (ex: '16/9', '1/1', '4/3'). |

**References:** [designValue](document-blocks-design-specifications.md#designvalue)

## typographySpec {#typographyspec}

Typography for each text element in the component. Keys name the element (ex: 'label', 'helper-text') and MUST be lowercase kebab-case.

Open map — values are `any`.

**References:** [typographyEntrySpec](document-blocks-design-specifications.md#typographyentryspec)

## responsiveEntry {#responsiveentry}

How the component adapts at one breakpoint.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `breakpoint` | string | ✓ | The breakpoint name or value at which this behavior applies (ex: 'small', 'medium', 'large', '768px', 'min-width: 1024px'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | How the component's layout, sizing, or behavior changes at this breakpoint. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "breakpoint": "320px",
    "description": "Below 320px, buttons expand to full width automatically to maintain a usable tap target."
  },
  {
    "breakpoint": "768px",
    "description": "Below 768px, buttons in a button group stack vertically and expand to full width."
  },
  {
    "breakpoint": "1024px",
    "description": "Above 1024px, the minimum button width increases from 44px to 64px to provide a more comfortable click target on desktop."
  }
]
```

## typographyEntrySpec {#typographyentryspec}

Typography for one text element in the component. Maps CSS typography properties to token names or raw values. If `typeToken` is set, the individual properties just document what it resolves to.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `fontFamily` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Font family as a token name or raw value (ex: 'font-family-body', 'Inter, sans-serif'). |
| `fontSize` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Font size as a token name or raw value (ex: 'font-size-body', '14px', '0.875rem'). |
| `fontWeight` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Font weight as a token name or raw value (ex: 'font-weight-regular', '400', 'bold'). |
| `lineHeight` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Line height as a token name or raw value (ex: 'line-height-body', '1.5', '20px'). |
| `letterSpacing` | [designValue](document-blocks-design-specifications.md#designvalue) |  | Letter spacing as a token name or raw value (ex: 'letter-spacing-body', '0.01em'). |
| `textTransform` | string |  | Text transform value (ex: 'uppercase', 'capitalize', 'none'). |
| `typeToken` | string |  | A single token covering multiple typography properties at once (ex: '$body-compact-01', 'type-scale-body-sm'). When set, the individual properties just describe what it resolves to. |

**References:** [designValue](document-blocks-design-specifications.md#designvalue)

## designValue {#designvalue}

A design value. If the system has tokens, this MUST be a token identifier (ex: 'color-action-primary', 'space-4'), not a raw value — that keeps it from drifting out of sync with the token system. A raw CSS value (ex: '#0055b3', '16px') is only allowed when there's no token layer.

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/design-specifications.schema.json",
  "title": "Design specifications document block",
  "description": "The visual specs of a component: property values, spacing, size limits, typography, and how it responds to breakpoints. Makes every visual decision explicit and measurable, so design and code stay in sync.",
  "$defs": {
    "designValue": {
      "description": "A design value. If the system has tokens, this MUST be a token identifier (ex: 'color-action-primary', 'space-4'), not a raw value — that keeps it from drifting out of sync with the token system. A raw CSS value (ex: '#0055b3', '16px') is only allowed when there's no token layer.",
      "type": "string"
    },
    "designProperties": {
      "type": "object",
      "description": "A map of property name to value. Keys say what the value controls (ex: 'background', 'min-height') and MUST be lowercase kebab-case. Values are token names ('color-action-primary') or raw CSS ('#0055b3', '16px') — use either, or mix them.",
      "additionalProperties": {
        "$ref": "#/$defs/designValue"
      },
      "propertyNames": {
        "pattern": "^[a-z][a-z0-9-]*$"
      },
      "examples": [
        {
          "background": "color-action-primary",
          "text-color": "color-text-on-action",
          "border-color": "transparent",
          "border-width": "0px",
          "border-radius": "radius-medium"
        },
        {
          "background": "#0055b3",
          "text-color": "#ffffff",
          "border-radius": "8px",
          "min-height": "40px"
        },
        {
          "background": "button-primary-bg",
          "text-color": "button-primary-text",
          "border-color": "button-primary-border"
        }
      ],
      "minProperties": 1
    },
    "spacingSpec": {
      "type": "object",
      "description": "Spacing around and inside the component. `internal` is spacing the component owns; `external` is spacing it recommends but the parent layout controls.",
      "properties": {
        "internal": {
          "type": "object",
          "description": "Padding and gaps inside the component. Keys name the relationship (ex: 'icon-to-label') and MUST be lowercase kebab-case. Values are token names or raw CSS (ex: 'space-4', '8px').",
          "additionalProperties": {
            "$ref": "#/$defs/designValue"
          },
          "propertyNames": {
            "pattern": "^[a-z][a-z0-9-]*$"
          },
          "minProperties": 1
        },
        "external": {
          "type": "object",
          "description": "Recommended margins between this component and its siblings or container. Keys name the relationship (ex: 'button-to-button') and MUST be lowercase kebab-case. This is a recommendation — the parent layout has final control.",
          "additionalProperties": {
            "$ref": "#/$defs/designValue"
          },
          "propertyNames": {
            "pattern": "^[a-z][a-z0-9-]*$"
          },
          "minProperties": 1
        }
      },
      "additionalProperties": false,
      "minProperties": 1
    },
    "sizingSpec": {
      "type": "object",
      "description": "The component's size limits — min/max width and height, and any aspect ratio.",
      "properties": {
        "minWidth": {
          "$ref": "#/$defs/designValue",
          "description": "Minimum width as a token name or raw value (ex: 'size-button-min-width', '64px')."
        },
        "maxWidth": {
          "$ref": "#/$defs/designValue",
          "description": "Maximum width as a token name or raw value (ex: 'size-dialog-max-width', '600px', 'none')."
        },
        "minHeight": {
          "$ref": "#/$defs/designValue",
          "description": "Minimum height as a token name or raw value (ex: 'size-button-min-height', '44px')."
        },
        "maxHeight": {
          "$ref": "#/$defs/designValue",
          "description": "Maximum height as a token name or raw value."
        },
        "aspectRatio": {
          "type": "string",
          "description": "Aspect ratio as a ratio string (ex: '16/9', '1/1', '4/3')."
        }
      },
      "additionalProperties": false,
      "minProperties": 1
    },
    "typographyEntrySpec": {
      "type": "object",
      "description": "Typography for one text element in the component. Maps CSS typography properties to token names or raw values. If `typeToken` is set, the individual properties just document what it resolves to.",
      "properties": {
        "fontFamily": {
          "$ref": "#/$defs/designValue",
          "description": "Font family as a token name or raw value (ex: 'font-family-body', 'Inter, sans-serif')."
        },
        "fontSize": {
          "$ref": "#/$defs/designValue",
          "description": "Font size as a token name or raw value (ex: 'font-size-body', '14px', '0.875rem')."
        },
        "fontWeight": {
          "$ref": "#/$defs/designValue",
          "description": "Font weight as a token name or raw value (ex: 'font-weight-regular', '400', 'bold')."
        },
        "lineHeight": {
          "$ref": "#/$defs/designValue",
          "description": "Line height as a token name or raw value (ex: 'line-height-body', '1.5', '20px')."
        },
        "letterSpacing": {
          "$ref": "#/$defs/designValue",
          "description": "Letter spacing as a token name or raw value (ex: 'letter-spacing-body', '0.01em')."
        },
        "textTransform": {
          "type": "string",
          "description": "Text transform value (ex: 'uppercase', 'capitalize', 'none')."
        },
        "typeToken": {
          "type": "string",
          "description": "A single token covering multiple typography properties at once (ex: '$body-compact-01', 'type-scale-body-sm'). When set, the individual properties just describe what it resolves to."
        }
      },
      "additionalProperties": false,
      "minProperties": 1
    },
    "typographySpec": {
      "type": "object",
      "description": "Typography for each text element in the component. Keys name the element (ex: 'label', 'helper-text') and MUST be lowercase kebab-case.",
      "additionalProperties": {
        "$ref": "#/$defs/typographyEntrySpec"
      },
      "propertyNames": {
        "pattern": "^[a-z][a-z0-9-]*$"
      },
      "minProperties": 1
    },
    "responsiveEntry": {
      "type": "object",
      "description": "How the component adapts at one breakpoint.",
      "required": [
        "breakpoint",
        "description"
      ],
      "properties": {
        "breakpoint": {
          "type": "string",
          "description": "The breakpoint name or value at which this behavior applies (ex: 'small', 'medium', 'large', '768px', 'min-width: 1024px')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "How the component's layout, sizing, or behavior changes at this breakpoint."
        }
      },
      "additionalProperties": false
    },
    "designSpecifications": {
      "type": "object",
      "description": "The component's default, baseline specs — properties, spacing, size, typography, and responsive behavior. Per-variant and per-state overrides don't go here; they live on the `variants` and `states` blocks.",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "design-specifications",
          "description": "Identifies this block as a design specifications spec."
        },
        "properties": {
          "$ref": "#/$defs/designProperties",
          "description": "The default property values (ex: 'background', 'border-radius')."
        },
        "spacing": {
          "$ref": "#/$defs/spacingSpec",
          "description": "The default spacing."
        },
        "sizing": {
          "$ref": "#/$defs/sizingSpec",
          "description": "The default size limits."
        },
        "typography": {
          "$ref": "#/$defs/typographySpec",
          "description": "The default typography."
        },
        "responsive": {
          "type": "array",
          "description": "How the component adapts across breakpoints, smallest to largest.",
          "items": {
            "$ref": "#/$defs/responsiveEntry"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "anyOf": [
        {
          "required": [
            "properties"
          ]
        },
        {
          "required": [
            "spacing"
          ]
        },
        {
          "required": [
            "sizing"
          ]
        },
        {
          "required": [
            "typography"
          ]
        },
        {
          "required": [
            "responsive"
          ]
        }
      ],
      "additionalProperties": false
    }
  }
}
```
