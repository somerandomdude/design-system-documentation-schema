# API document block

Documents the code-level interface of a component: configurable properties, emitted events, content slots, CSS custom properties, CSS shadow parts, data attributes, and public methods. When a component supports multiple platforms, each platform gets its own API block. The `platform` property says which implementation it describes.

Source: `document-blocks/api.schema.json`

**8 definitions** in this file: `api`, `apiProperty`, `apiEvent`, `apiSlot`, `apiCssCustomProperty`, `apiCssPart`, `apiDataAttribute`, `apiMethod`

## api {#api}

Documents the code-level interface of a component on a single platform. Lists configurable properties, emitted events, content slots, CSS hooks, data attributes, and public methods. For multi-platform components (ex: React + Web Component + Vue), create one API block per platform. Use `platform` to tell them apart.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"api"` | ✓ | Identifies this document block as an API spec. |
| `properties` | [apiProperty](document-blocks-api.md#apiproperty)[] | at least 1 | Configurable properties (props, attributes, inputs) that consumers pass to the component. (Min items: 1) |
| `events` | [apiEvent](document-blocks-api.md#apievent)[] | at least 1 | Events emitted by the component that consumers can listen to. (Min items: 1) |
| `slots` | [apiSlot](document-blocks-api.md#apislot)[] | at least 1 | Content insertion points where consumers can project child content. (Min items: 1) |
| `cssCustomProperties` | [apiCssCustomProperty](document-blocks-api.md#apicsscustomproperty)[] | at least 1 | CSS custom properties exposed for external styling. (Min items: 1) |
| `cssParts` | [apiCssPart](document-blocks-api.md#apicsspart)[] | at least 1 | CSS shadow parts exposed for external styling via ::part() selectors. (Min items: 1) |
| `dataAttributes` | [apiDataAttribute](document-blocks-api.md#apidataattribute)[] | at least 1 | Data attributes that reflect component state or config into the DOM. (Min items: 1) |
| `methods` | [apiMethod](document-blocks-api.md#apimethod)[] | at least 1 | Public methods on the component instance. (Min items: 1) |
| `platform` | string |  | The platform or framework this API describes (ex: 'react', 'web-component', 'vue', 'angular', 'ios', 'android'). When omitted, the API is taken to be the single/default platform. |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**Constraint:** At least one of `properties`, `events`, `slots`, `cssCustomProperties`, `cssParts`, `dataAttributes`, `methods` must be present.

**References:** [apiProperty](document-blocks-api.md#apiproperty), [apiEvent](document-blocks-api.md#apievent), [apiSlot](document-blocks-api.md#apislot), [apiCssCustomProperty](document-blocks-api.md#apicsscustomproperty), [apiCssPart](document-blocks-api.md#apicsspart), [apiDataAttribute](document-blocks-api.md#apidataattribute), [apiMethod](document-blocks-api.md#apimethod), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "properties": [
    {
      "identifier": "variant",
      "type": "string",
      "values": [
        "primary",
        "secondary",
        "ghost",
        "danger"
      ],
      "description": "The visual style of the button.",
      "required": false,
      "defaultValue": "primary",
      "since": "1.0.0"
    },
    {
      "identifier": "disabled",
      "type": "boolean",
      "description": "When true, the button is non-interactive.",
      "required": false,
      "defaultValue": false,
      "since": "1.0.0"
    }
  ],
  "events": [
    {
      "identifier": "onClick",
      "description": "Fires when the button is activated.",
      "since": "1.0.0",
      "payload": "(event: MouseEvent) => void"
    }
  ],
  "slots": [
    {
      "identifier": "default",
      "description": "The primary content slot.",
      "acceptedContent": "Text, Icon, or a combination.",
      "since": "1.0.0"
    }
  ],
  "cssCustomProperties": [
    {
      "identifier": "--button-background",
      "description": "The background color of the button container.",
      "defaultValue": "var(--color-action-primary)",
      "type": "color",
      "since": "1.0.0"
    }
  ],
  "cssParts": [
    {
      "identifier": "base",
      "description": "The root container element of the button.",
      "since": "1.0.0"
    }
  ],
  "dataAttributes": [
    {
      "identifier": "data-variant",
      "description": "Reflects the current variant.",
      "values": [
        "primary",
        "secondary",
        "ghost",
        "danger"
      ],
      "since": "1.0.0"
    }
  ],
  "methods": [
    {
      "identifier": "focus",
      "description": "Programmatically moves focus to the button element.",
      "parameters": "(options?: FocusOptions)",
      "returnType": "void",
      "since": "1.0.0"
    }
  ],
  "kind": "api"
}
```

## apiProperty {#apiproperty}

A configurable property of a component.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The property identifier as used in code (ex: 'variant', 'size', 'disabled', 'onClick'). |
| `type` | string | ✓ | The property's type as it would appear in a type signature (ex: 'boolean', 'number', 'string', 'ReactNode', 'IconComponent'). For enum properties, use `values` instead of listing members here. When `schema` is present it is authoritative; `type` is its display summary and MUST NOT disagree with it. |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What this property controls, how it affects the component, and any constraints or side effects. |
| `values` | string[] |  | The accepted values for enum-like properties (ex: ['default', 'primary', 'ghost']). Use this instead of listing members in `type`. When `schema` is present it is authoritative; `values` is its display summary and MUST NOT disagree with it. (Min items: 1) |
| `schema` | object |  | A JSON Schema (Draft 2020-12) object that defines the property's type in machine-readable form. It follows the same conventions as OpenAPI parameter schemas. When present, `schema` is the authoritative type definition; `type` and `values` are display summaries of it and MUST NOT disagree. |
| `required` | boolean |  | Whether the consumer must provide this property. Defaults to false. (Default: `false`) |
| `defaultValue` | any |  | The default value in its native JSON type. Accepts any JSON type: string, number, boolean, object, array, or null. |
| `examples` | [example](common-example.md#example)[] |  | Example values for this property. (Min items: 1) |
| `since` | string |  | The version in which this property was introduced. |
| `deprecated` | boolean |  | Whether this property is deprecated. Defaults to false. (Default: `false`) |
| `deprecationNotice` | [deprecationNotice](common-status.md#deprecationnotice) |  | Required when `deprecated` is true. MUST say what to use instead (non-empty) and SHOULD give a migration path. |

**Conditional:** When `deprecated` is `"true"`, then `deprecationNotice` is required.

**References:** [richText](common-rich-text.md#richtext), [example](common-example.md#example), [deprecationNotice](common-status.md#deprecationnotice)

**Example:**

```json
[
  {
    "identifier": "variant",
    "type": "string",
    "values": [
      "primary",
      "secondary",
      "ghost",
      "danger"
    ],
    "schema": {
      "type": "string",
      "enum": [
        "primary",
        "secondary",
        "ghost",
        "danger"
      ],
      "default": "primary"
    },
    "description": "The visual style of the button. Determines background color, text color, and border treatment.",
    "required": false,
    "defaultValue": "primary",
    "examples": [
      {
        "value": "primary",
        "title": "High-emphasis — the main action on the surface",
        "presentation": {
          "kind": "code",
          "code": "<Button variant=\"primary\">Save</Button>",
          "language": "jsx"
        }
      },
      {
        "value": "danger",
        "title": "Destructive — delete, remove, disconnect",
        "presentation": {
          "kind": "code",
          "code": "<Button variant=\"danger\">Delete project</Button>",
          "language": "jsx"
        }
      }
    ],
    "since": "1.0.0"
  },
  {
    "identifier": "disabled",
    "type": "boolean",
    "schema": {
      "type": "boolean",
      "default": false
    },
    "description": "When true, the button is non-interactive. The cursor changes to not-allowed, and the button is visually dimmed to 40% opacity.",
    "required": false,
    "defaultValue": false,
    "since": "1.0.0"
  },
  {
    "identifier": "loading",
    "type": "boolean",
    "schema": {
      "type": "boolean",
      "default": false
    },
    "description": "When true, the label is replaced with a spinner and the button is non-interactive. The button retains its dimensions to prevent layout shift.",
    "required": false,
    "defaultValue": false,
    "since": "2.1.0"
  },
  {
    "identifier": "size",
    "type": "string",
    "values": [
      "small",
      "medium",
      "large"
    ],
    "schema": {
      "type": "string",
      "enum": [
        "small",
        "medium",
        "large"
      ],
      "default": "medium"
    },
    "description": "The size of the button. Affects padding, font size, icon size, and minimum target area.",
    "required": false,
    "defaultValue": "medium",
    "since": "1.0.0"
  }
]
```

## apiEvent {#apievent}

An event emitted by a component.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The event identifier (ex: 'onClick', 'onChange', 'onDismiss'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | When this event fires, what it communicates, and how consumers should respond. Add any behavioral context worth noting in documentation content (DOM propagation, cancelability, deprecation, and conditions under which it does not fire). This is the single home for event documentation. |
| `payload` | string |  | The event's payload or handler signature (ex: '(event: MouseEvent) => void', '{ value: string, index: number }') — what a listener receives. |
| `since` | string |  | The version in which this event was introduced. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "identifier": "onClick",
    "description": "Fires when the button is activated via mouse click, touch tap, Enter key, or Space key. Does not fire when the button is disabled or loading.",
    "since": "1.0.0",
    "payload": "(event: MouseEvent) => void"
  },
  {
    "identifier": "onFocus",
    "description": "Fires when the button receives focus.",
    "since": "1.0.0",
    "payload": "(event: FocusEvent) => void"
  },
  {
    "identifier": "onBlur",
    "description": "Fires when the button loses focus.",
    "since": "1.0.0",
    "payload": "(event: FocusEvent) => void"
  }
]
```

## apiSlot {#apislot}

A content insertion point of a component.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The slot identifier. Use 'default' for the unnamed/default slot. |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | The slot's purpose and where it renders in the component. Content rules belong in `acceptedContent`, not here. |
| `acceptedContent` | [richText](common-rich-text.md#richtext) |  | Allowed content (ex: 'Plain text or a text node. Do not nest interactive elements.'). |
| `since` | string |  | The version in which this slot was introduced. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "identifier": "default",
    "description": "The primary content slot. Accepts text, icons, or a combination of both. When both an icon and text are provided, the icon appears before the text by default.",
    "acceptedContent": "Text, Icon, or a combination. Avoid placing interactive elements inside the button.",
    "since": "1.0.0"
  }
]
```

## apiCssCustomProperty {#apicsscustomproperty}

A CSS custom property exposed by a component for external styling.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The full custom-property identifier including the -- prefix (ex: '--button-background', '--button-border-radius'). (Pattern: `^--`) |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What attribute this property controls. |
| `defaultValue` | string |  | The default value (ex: 'var(--color-action-primary)', '1rem', 'transparent'). |
| `type` | string |  | The expected CSS value type (ex: 'color', 'dimension', 'number'). |
| `since` | string |  | The version in which this custom property was introduced. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "identifier": "--button-background",
    "description": "The background color of the button container.",
    "defaultValue": "var(--color-action-primary)",
    "type": "color",
    "since": "1.0.0"
  },
  {
    "identifier": "--button-text-color",
    "description": "The color of the label text.",
    "defaultValue": "var(--color-text-on-action)",
    "type": "color",
    "since": "1.0.0"
  },
  {
    "identifier": "--button-border-radius",
    "description": "The border radius of the button container.",
    "defaultValue": "var(--radius-medium)",
    "type": "dimension",
    "since": "1.0.0"
  },
  {
    "identifier": "--button-padding-horizontal",
    "description": "The left and right padding inside the button container.",
    "defaultValue": "var(--space-4)",
    "type": "dimension",
    "since": "1.0.0"
  }
]
```

## apiCssPart {#apicsspart}

A CSS shadow part exposed by a web component for external styling via ::part() selectors.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The part identifier as used in ::part() selectors. |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What element this part exposes and what styling it enables. |
| `since` | string |  | The version in which this part was introduced. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "identifier": "base",
    "description": "The root container element of the button. Use for overriding background, border, and padding from outside the shadow DOM.",
    "since": "1.0.0"
  },
  {
    "identifier": "label",
    "description": "The text label element. Use for overriding font styles from outside the shadow DOM.",
    "since": "1.0.0"
  },
  {
    "identifier": "icon",
    "description": "The icon wrapper element. Use for adjusting icon size or color from outside the shadow DOM.",
    "since": "2.0.0"
  }
]
```

## apiDataAttribute {#apidataattribute}

A data attribute used by a component to reflect state or variant info into the DOM.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The full attribute identifier including the data- prefix (ex: 'data-state', 'data-variant'). (Pattern: `^data-`) |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What this attribute reflects and how to use it for styling or testing. |
| `values` | string[] |  | The set of possible values (ex: ['default', 'hover', 'active', 'disabled']). (Min items: 1) |
| `since` | string |  | The version in which this attribute was introduced. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "identifier": "data-variant",
    "description": "Reflects the current variant. Useful for parent-level conditional styling.",
    "values": [
      "primary",
      "secondary",
      "ghost",
      "danger"
    ],
    "since": "1.0.0"
  },
  {
    "identifier": "data-loading",
    "description": "Present when the button is in a loading state. Useful for CSS selectors that target loading buttons.",
    "values": [
      "true"
    ],
    "since": "2.1.0"
  }
]
```

## apiMethod {#apimethod}

A public method on a component instance.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | The method identifier (ex: 'focus', 'reset', 'scrollTo'). |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What this method does, when to call it, and any side effects. |
| `parameters` | string |  | The parameter signature (ex: '(options?: { preventScroll: boolean }) => void'). |
| `returnType` | string |  | The return value (ex: 'void', 'Promise<void>', 'HTMLElement \| null'). |
| `since` | string |  | The version in which this method was introduced. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "identifier": "focus",
    "description": "Programmatically moves focus to the button element. Useful after closing a modal or completing a flow that should return focus to the triggering button.",
    "parameters": "(options?: FocusOptions) — optional FocusOptions object with `preventScroll` boolean.",
    "returnType": "void",
    "since": "1.0.0"
  },
  {
    "identifier": "click",
    "description": "Programmatically triggers the button's click handler. Does not fire if the button is disabled or loading.",
    "parameters": "none",
    "returnType": "void",
    "since": "1.0.0"
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/api.schema.json",
  "title": "API document block",
  "description": "Documents the code-level interface of a component: configurable properties, emitted events, content slots, CSS custom properties, CSS shadow parts, data attributes, and public methods. When a component supports multiple platforms, each platform gets its own API block. The `platform` property says which implementation it describes.",
  "$defs": {
    "apiProperty": {
      "type": "object",
      "description": "A configurable property of a component.",
      "required": [
        "identifier",
        "type",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "The property identifier as used in code (ex: 'variant', 'size', 'disabled', 'onClick')."
        },
        "type": {
          "type": "string",
          "description": "The property's type as it would appear in a type signature (ex: 'boolean', 'number', 'string', 'ReactNode', 'IconComponent'). For enum properties, use `values` instead of listing members here. When `schema` is present it is authoritative; `type` is its display summary and MUST NOT disagree with it."
        },
        "values": {
          "type": "array",
          "description": "The accepted values for enum-like properties (ex: ['default', 'primary', 'ghost']). Use this instead of listing members in `type`. When `schema` is present it is authoritative; `values` is its display summary and MUST NOT disagree with it.",
          "items": {
            "type": "string"
          },
          "minItems": 1
        },
        "schema": {
          "type": "object",
          "description": "A JSON Schema (Draft 2020-12) object that defines the property's type in machine-readable form. It follows the same conventions as OpenAPI parameter schemas. When present, `schema` is the authoritative type definition; `type` and `values` are display summaries of it and MUST NOT disagree."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this property controls, how it affects the component, and any constraints or side effects."
        },
        "required": {
          "type": "boolean",
          "default": false,
          "description": "Whether the consumer must provide this property. Defaults to false."
        },
        "defaultValue": {
          "description": "The default value in its native JSON type. Accepts any JSON type: string, number, boolean, object, array, or null."
        },
        "examples": {
          "type": "array",
          "description": "Example values for this property.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        },
        "since": {
          "type": "string",
          "description": "The version in which this property was introduced."
        },
        "deprecated": {
          "type": "boolean",
          "default": false,
          "description": "Whether this property is deprecated. Defaults to false."
        },
        "deprecationNotice": {
          "$ref": "../common/status.schema.json#/$defs/deprecationNotice",
          "description": "Required when `deprecated` is true. MUST say what to use instead (non-empty) and SHOULD give a migration path."
        }
      },
      "if": {
        "properties": {
          "deprecated": {
            "const": true
          }
        },
        "required": [
          "deprecated"
        ]
      },
      "then": {
        "required": [
          "deprecationNotice"
        ]
      },
      "additionalProperties": false
    },
    "apiEvent": {
      "type": "object",
      "description": "An event emitted by a component.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "The event identifier (ex: 'onClick', 'onChange', 'onDismiss')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "When this event fires, what it communicates, and how consumers should respond. Add any behavioral context worth noting in documentation content (DOM propagation, cancelability, deprecation, and conditions under which it does not fire). This is the single home for event documentation."
        },
        "payload": {
          "type": "string",
          "description": "The event's payload or handler signature (ex: '(event: MouseEvent) => void', '{ value: string, index: number }') — what a listener receives."
        },
        "since": {
          "type": "string",
          "description": "The version in which this event was introduced."
        }
      },
      "additionalProperties": false
    },
    "apiSlot": {
      "type": "object",
      "description": "A content insertion point of a component.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "The slot identifier. Use 'default' for the unnamed/default slot."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "The slot's purpose and where it renders in the component. Content rules belong in `acceptedContent`, not here."
        },
        "acceptedContent": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Allowed content (ex: 'Plain text or a text node. Do not nest interactive elements.')."
        },
        "since": {
          "type": "string",
          "description": "The version in which this slot was introduced."
        }
      },
      "additionalProperties": false
    },
    "apiCssCustomProperty": {
      "type": "object",
      "description": "A CSS custom property exposed by a component for external styling.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "pattern": "^--",
          "description": "The full custom-property identifier including the -- prefix (ex: '--button-background', '--button-border-radius')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What attribute this property controls."
        },
        "defaultValue": {
          "type": "string",
          "description": "The default value (ex: 'var(--color-action-primary)', '1rem', 'transparent')."
        },
        "type": {
          "type": "string",
          "description": "The expected CSS value type (ex: 'color', 'dimension', 'number')."
        },
        "since": {
          "type": "string",
          "description": "The version in which this custom property was introduced."
        }
      },
      "additionalProperties": false
    },
    "apiCssPart": {
      "type": "object",
      "description": "A CSS shadow part exposed by a web component for external styling via ::part() selectors.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "The part identifier as used in ::part() selectors."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What element this part exposes and what styling it enables."
        },
        "since": {
          "type": "string",
          "description": "The version in which this part was introduced."
        }
      },
      "additionalProperties": false
    },
    "apiDataAttribute": {
      "type": "object",
      "description": "A data attribute used by a component to reflect state or variant info into the DOM.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "pattern": "^data-",
          "description": "The full attribute identifier including the data- prefix (ex: 'data-state', 'data-variant')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this attribute reflects and how to use it for styling or testing."
        },
        "values": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "The set of possible values (ex: ['default', 'hover', 'active', 'disabled']).",
          "minItems": 1
        },
        "since": {
          "type": "string",
          "description": "The version in which this attribute was introduced."
        }
      },
      "additionalProperties": false
    },
    "apiMethod": {
      "type": "object",
      "description": "A public method on a component instance.",
      "required": [
        "identifier",
        "description"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "The method identifier (ex: 'focus', 'reset', 'scrollTo')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this method does, when to call it, and any side effects."
        },
        "parameters": {
          "type": "string",
          "description": "The parameter signature (ex: '(options?: { preventScroll: boolean }) => void')."
        },
        "returnType": {
          "type": "string",
          "description": "The return value (ex: 'void', 'Promise<void>', 'HTMLElement | null')."
        },
        "since": {
          "type": "string",
          "description": "The version in which this method was introduced."
        }
      },
      "additionalProperties": false
    },
    "api": {
      "type": "object",
      "description": "Documents the code-level interface of a component on a single platform. Lists configurable properties, emitted events, content slots, CSS hooks, data attributes, and public methods. For multi-platform components (ex: React + Web Component + Vue), create one API block per platform. Use `platform` to tell them apart.",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "api",
          "description": "Identifies this document block as an API spec."
        },
        "platform": {
          "type": "string",
          "description": "The platform or framework this API describes (ex: 'react', 'web-component', 'vue', 'angular', 'ios', 'android'). When omitted, the API is taken to be the single/default platform."
        },
        "properties": {
          "type": "array",
          "description": "Configurable properties (props, attributes, inputs) that consumers pass to the component.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiProperty"
          }
        },
        "events": {
          "type": "array",
          "description": "Events emitted by the component that consumers can listen to.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiEvent"
          }
        },
        "slots": {
          "type": "array",
          "description": "Content insertion points where consumers can project child content.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiSlot"
          }
        },
        "cssCustomProperties": {
          "type": "array",
          "description": "CSS custom properties exposed for external styling.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiCssCustomProperty"
          }
        },
        "cssParts": {
          "type": "array",
          "description": "CSS shadow parts exposed for external styling via ::part() selectors.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiCssPart"
          }
        },
        "dataAttributes": {
          "type": "array",
          "description": "Data attributes that reflect component state or config into the DOM.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiDataAttribute"
          }
        },
        "methods": {
          "type": "array",
          "description": "Public methods on the component instance.",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/apiMethod"
          }
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {
          "required": [
            "properties"
          ]
        },
        {
          "required": [
            "events"
          ]
        },
        {
          "required": [
            "slots"
          ]
        },
        {
          "required": [
            "cssCustomProperties"
          ]
        },
        {
          "required": [
            "cssParts"
          ]
        },
        {
          "required": [
            "dataAttributes"
          ]
        },
        {
          "required": [
            "methods"
          ]
        }
      ]
    }
  }
}
```
