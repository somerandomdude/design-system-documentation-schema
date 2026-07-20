# Steps document block

The steps a reader follows to complete a task, like getting started, a tutorial, or a migration. Each step has a short label, an instruction, optional examples, and an optional expected result so the reader knows it worked.

Source: `document-blocks/steps.schema.json`

**2 definitions** in this file: `steps`, `stepEntry`

## steps {#steps}

A procedure — the steps a reader works through start to finish, like installation or a migration.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"steps"` | ✓ | Identifies this block as a procedure. |
| `items` | [stepEntry](document-blocks-steps.md#stepentry)[] | ✓ | The steps, in order. Tools MUST preserve this order when `ordered` is true. (Min items: 1) |
| `title` | string |  | An optional heading for the whole procedure (ex: 'Installation', 'Build your first component', 'Submitting a contribution'). |
| `ordered` | boolean |  | Whether the steps must be done in order. Defaults to true. Set false for independent steps. Tools SHOULD show ordered steps as a numbered list, unordered ones as a checklist. (Default: `true`) |

**References:** [stepEntry](document-blocks-steps.md#stepentry)

**Example:**

```json
{
  "kind": "steps",
  "title": "Installation",
  "ordered": true,
  "items": [
    {
      "instruction": "Add the UI package to your project.",
      "examples": [
        {
          "title": "npm",
          "presentation": {
            "kind": "code",
            "language": "bash",
            "code": "npm install @acme/ui"
          }
        }
      ],
      "expectedResult": "`@acme/ui` appears in your `package.json` dependencies.",
      "label": "Install the package"
    },
    {
      "instruction": "Mount the `ThemeProvider` at the root of your application so every component inherits the theme.",
      "examples": [
        {
          "presentation": {
            "kind": "code",
            "language": "tsx",
            "code": "import { ThemeProvider } from '@acme/ui'\n\nexport default function App({ children }) {\n  return <ThemeProvider>{children}</ThemeProvider>\n}"
          }
        }
      ],
      "expectedResult": "Components render with Acme's default light theme.",
      "label": "Wrap your app in the provider"
    },
    {
      "instruction": "Pass the `dark` scheme to the provider to opt into the dark theme.",
      "optional": true,
      "label": "Enable dark mode"
    }
  ]
}
```

## stepEntry {#stepentry}

One step: a short label, an instruction for what to do, and optionally examples, an expected result, and whether it can be skipped. Only `label` is required.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | [richText](common-rich-text.md#richtext) | ✓ | A short label for the step (ex: 'Install the package', 'Wrap your app in the provider', 'Run the validator'). Concise enough to serve as a numbered list item or heading. |
| `instruction` | [richText](common-rich-text.md#richtext) |  | What the reader should do in this step. Supports markdown by default. MUST be concrete and actionable: describe the action, not the goal. |
| `examples` | [example](common-example.md#example)[] |  | Illustrative material for the step: a code snippet, a terminal command, a screenshot, or a live URL. Most procedural steps carry a single code example. (Min items: 1) |
| `expectedResult` | [richText](common-rich-text.md#richtext) |  | What the reader should see once the step succeeds (ex: 'The dev server starts on port 3000', 'A themed button renders'). Lets readers confirm progress and spot problems on their own. Most useful in tutorials and getting-started guides. |
| `optional` | boolean |  | Whether the step can be skipped without breaking the procedure. Defaults to false. Tools MAY render optional steps distinctly (ex: an 'optional' label). (Default: `false`) |

**References:** [richText](common-rich-text.md#richtext), [example](common-example.md#example)

**Example:**

```json
{
  "instruction": "Add the UI package to your project with your package manager.",
  "examples": [
    {
      "title": "npm",
      "presentation": {
        "kind": "code",
        "language": "bash",
        "code": "npm install @acme/ui"
      }
    }
  ],
  "expectedResult": "`@acme/ui` appears in your `package.json` dependencies.",
  "label": "Install the package"
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/steps.schema.json",
  "title": "Steps document block",
  "description": "The steps a reader follows to complete a task, like getting started, a tutorial, or a migration. Each step has a short label, an instruction, optional examples, and an optional expected result so the reader knows it worked.",
  "$defs": {
    "stepEntry": {
      "type": "object",
      "description": "One step: a short label, an instruction for what to do, and optionally examples, an expected result, and whether it can be skipped. Only `label` is required.",
      "required": [
        "label"
      ],
      "properties": {
        "label": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "A short label for the step (ex: 'Install the package', 'Wrap your app in the provider', 'Run the validator'). Concise enough to serve as a numbered list item or heading."
        },
        "instruction": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What the reader should do in this step. Supports markdown by default. MUST be concrete and actionable: describe the action, not the goal."
        },
        "examples": {
          "type": "array",
          "description": "Illustrative material for the step: a code snippet, a terminal command, a screenshot, or a live URL. Most procedural steps carry a single code example.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        },
        "expectedResult": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What the reader should see once the step succeeds (ex: 'The dev server starts on port 3000', 'A themed button renders'). Lets readers confirm progress and spot problems on their own. Most useful in tutorials and getting-started guides."
        },
        "optional": {
          "type": "boolean",
          "default": false,
          "description": "Whether the step can be skipped without breaking the procedure. Defaults to false. Tools MAY render optional steps distinctly (ex: an 'optional' label)."
        }
      },
      "additionalProperties": false
    },
    "steps": {
      "type": "object",
      "description": "A procedure — the steps a reader works through start to finish, like installation or a migration.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "steps",
          "description": "Identifies this block as a procedure."
        },
        "title": {
          "type": "string",
          "description": "An optional heading for the whole procedure (ex: 'Installation', 'Build your first component', 'Submitting a contribution')."
        },
        "ordered": {
          "type": "boolean",
          "default": true,
          "description": "Whether the steps must be done in order. Defaults to true. Set false for independent steps. Tools SHOULD show ordered steps as a numbered list, unordered ones as a checklist."
        },
        "items": {
          "type": "array",
          "description": "The steps, in order. Tools MUST preserve this order when `ordered` is true.",
          "items": {
            "$ref": "#/$defs/stepEntry"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    }
  }
}
```
