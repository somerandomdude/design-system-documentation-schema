# Imports document block

How to install and import a component in code, across platforms. Also reused on guides for setup steps. One entry per platform (React, Vue, Web Components, etc.), each with the package name and the import code.

Source: `document-blocks/imports.schema.json`

**2 definitions** in this file: `imports`, `importEntry`

## imports {#imports}

How to import a component across platforms, one entry per platform. List the main/recommended platform first.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"imports"` | ✓ | Identifies this block as an imports spec. |
| `items` | [importEntry](document-blocks-imports.md#importentry)[] | ✓ | The per-platform import entries, primary platform first. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [importEntry](document-blocks-imports.md#importentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "imports",
  "items": [
    {
      "platform": "react",
      "package": "@acme/ui",
      "code": "import { Button } from '@acme/ui'",
      "language": "tsx",
      "description": "The recommended import path for React applications."
    },
    {
      "platform": "web-component",
      "package": "@acme/ui-elements",
      "code": "import '@acme/ui-elements/button'",
      "language": "js"
    }
  ]
}
```

## importEntry {#importentry}

One platform's import instructions. Includes the platform, and the code to import/use the component.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `code` | string | ✓ | The import code. SHOULD be copy-paste ready. Use newlines for multi-line snippets. |
| `platform` | string |  | The platform this applies to (ex: 'react', 'vue', 'ios'). Use the same identifiers as the `api` block. When left out, it's assumed to be the only/default platform. |
| `package` | string |  | The package to install (ex: '@acme/ui'), exactly as it appears in the package manager. |
| `language` | string |  | The language or format of the code (ex: 'tsx', 'js', 'vue', 'swift', 'kotlin'). Omit when obvious from the platform. |
| `description` | [richText](common-rich-text.md#richtext) |  | Extra context to describe when to use this path over another, version requirements, or setup steps. |
| `since` | string |  | The version in which this import path became available. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
[
  {
    "platform": "react",
    "package": "@acme/ui",
    "code": "import { Button } from '@acme/ui'",
    "language": "tsx",
    "description": "The primary, recommended import path for React applications."
  },
  {
    "platform": "vue",
    "package": "@acme/ui-vue",
    "code": "import { AcButton } from '@acme/ui-vue'",
    "language": "vue",
    "since": "2.1.0"
  },
  {
    "platform": "web-component",
    "package": "@acme/ui-elements",
    "code": "import '@acme/ui-elements/button'\n// then use <ac-button> in markup",
    "language": "js",
    "description": "Framework-agnostic custom element. Registers the <ac-button> tag globally on import."
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/imports.schema.json",
  "title": "Imports document block",
  "description": "How to install and import a component in code, across platforms. Also reused on guides for setup steps. One entry per platform (React, Vue, Web Components, etc.), each with the package name and the import code.",
  "$defs": {
    "importEntry": {
      "type": "object",
      "description": "One platform's import instructions. Includes the platform, and the code to import/use the component.",
      "required": [
        "code"
      ],
      "properties": {
        "platform": {
          "type": "string",
          "description": "The platform this applies to (ex: 'react', 'vue', 'ios'). Use the same identifiers as the `api` block. When left out, it's assumed to be the only/default platform."
        },
        "package": {
          "type": "string",
          "description": "The package to install (ex: '@acme/ui'), exactly as it appears in the package manager."
        },
        "code": {
          "type": "string",
          "description": "The import code. SHOULD be copy-paste ready. Use newlines for multi-line snippets."
        },
        "language": {
          "type": "string",
          "description": "The language or format of the code (ex: 'tsx', 'js', 'vue', 'swift', 'kotlin'). Omit when obvious from the platform."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Extra context to describe when to use this path over another, version requirements, or setup steps."
        },
        "since": {
          "type": "string",
          "description": "The version in which this import path became available."
        }
      },
      "additionalProperties": false
    },
    "imports": {
      "type": "object",
      "description": "How to import a component across platforms, one entry per platform. List the main/recommended platform first.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "imports",
          "description": "Identifies this block as an imports spec."
        },
        "items": {
          "type": "array",
          "description": "The per-platform import entries, primary platform first.",
          "items": {
            "$ref": "#/$defs/importEntry"
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
