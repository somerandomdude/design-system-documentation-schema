# Chunk definitions

A chunk is a ready-to-use block of code — a copy-paste starting point built from the system's components, like a layout or a settings form. A chunk document holds its identity, the code itself, and general docs (guidelines, use-cases, accessibility, and so on). Chunks sit alongside components: a component documents one building block, a chunk documents a composition of them, captured as code.

Source: `entities/chunk.schema.json`

## chunk {#chunk}

A ready-to-use block of code — a layout, a settings form, a confirmation dialog. It has an identity (`identifier`, `name`, optional `description`), the `code` consumers copy, and `documentBlocks`/`agentDocumentBlocks` for the general kinds (guidelines, use-cases, accessibility, content, sections, checklist). Chunks are simple by design: they document a composition of code, not a full anatomy/API surface like a component does.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"chunk"` | ✓ | Identifies this entity as a chunk. |
| `identifier` | string | ✓ | Machine-readable identifier for the chunk (ex: 'search-bar', 'settings-form', 'confirmation-dialog'). MUST be lowercase kebab-case and unique within its entity group. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `name` | string | ✓ | Display name shown in docs (ex: 'Search bar', 'Settings form', 'Confirmation dialog'). |
| `code` | object {code, language} \| object {src, language} | ✓ | The code consumers copy to use the chunk. Give it one of two ways: inline (`code` + `language`) when it travels with the document, or referenced (`src` + `language`) when it lives in an outside file. Referenced code keeps long sources readable and lets a chunk share one file with a live app. `src` is resolved when read — there's no build step. |
| `description` | [richText](common-rich-text.md#richtext) |  | What this chunk is, the pattern it captures, and which components it composes. CommonMark supported. |
| `documentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | Docs for this chunk — the general block kinds only (guidelines, use-cases, accessibility, content, sections, checklist). Chunks document a composition of code, not the anatomy/API surface a component has. (Min items: 1) |
| `agentDocumentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | Docs for AI agents only, using the same general block kinds as `documentBlocks`. Agent-only content: hard must/must-not rules, verification checklists, and constraints an agent needs when adapting this chunk into an app. Guidance for humans belongs in `documentBlocks`. (Min items: 1) |
| `relationships` | [relationships](common-relationship.md#relationships) |  | Links from this chunk to the entities it uses — mainly 'composes' the components it's built from (mark `required` true for the essential ones). Tools derive the reverse edges. |
| `metadata` | [entityMetadata](metadata-metadata.md#entitymetadata) |  | Optional metadata (see metadata/metadata.schema.json). Declare the components this chunk uses as `relationships`, not links. |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock), [relationships](common-relationship.md#relationships), [entityMetadata](metadata-metadata.md#entitymetadata), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "chunk",
  "identifier": "confirmation-dialog",
  "name": "Confirmation dialog",
  "description": "A modal that asks the user to confirm or cancel a destructive action before it runs. Composes Dialog, Stack, Text, and Button to present a clear question and two explicit choices.",
  "relationships": [
    {
      "relation": "composes",
      "target": "dialog",
      "role": "Hosts the confirmation in a modal surface",
      "required": true
    },
    {
      "relation": "composes",
      "target": "button",
      "role": "Renders the confirm and cancel actions",
      "required": true
    },
    {
      "relation": "depends-on",
      "target": "color-critical",
      "role": "Tones the destructive confirm action"
    }
  ],
  "metadata": {
    "status": "stable",
    "tags": [
      "modal",
      "confirm",
      "destructive",
      "dialog"
    ]
  },
  "code": {
    "language": "tsx",
    "src": "./chunks/confirmation-dialog.tsx"
  },
  "documentBlocks": [
    {
      "kind": "use-cases",
      "purpose": "Ask the user to confirm or cancel a destructive action before it runs.",
      "items": [
        {
          "description": "Guard a destructive or irreversible action — deleting, archiving, or overwriting — so the user confirms intent before it runs.",
          "stance": "recommended"
        },
        {
          "description": "Confirm low-stakes, easily reversible actions where an undo affordance would serve the user better.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "toast",
            "rationale": "A toast with an undo action keeps reversible flows fast and avoids interrupting the user with a modal."
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Label the confirm button with the action it performs (e.g. 'Delete') rather than a generic 'OK'.",
          "rationale": "An action-specific label tells the user what will happen, reducing accidental confirmations.",
          "level": "should",
          "category": "content"
        },
        {
          "guidance": "Give the destructive confirm button the 'critical' tone and keep the cancel action visually quieter.",
          "rationale": "Tone and weight signal the consequence and steer the user toward the safe default.",
          "level": "should",
          "category": "visual-design"
        },
        {
          "guidance": "Move focus into the dialog on open and return it to the trigger on close.",
          "rationale": "Keyboard and screen reader users lose their place when focus is not managed across the modal lifecycle.",
          "level": "must",
          "category": "accessibility"
        }
      ]
    }
  ],
  "agentDocumentBlocks": [
    {
      "kind": "checklist",
      "title": "Adapting this chunk",
      "items": [
        {
          "label": "Keep the confirm and cancel actions as Button components — do not replace them with raw button elements.",
          "level": "must"
        },
        {
          "label": "Replace the placeholder question and confirm label with copy naming the specific action being confirmed.",
          "level": "must"
        },
        {
          "label": "Preserve the focus-management wiring when restructuring the dialog contents.",
          "level": "must"
        }
      ]
    }
  ]
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/entities/chunk.schema.json",
  "title": "Chunk definitions",
  "description": "A chunk is a ready-to-use block of code — a copy-paste starting point built from the system's components, like a layout or a settings form. A chunk document holds its identity, the code itself, and general docs (guidelines, use-cases, accessibility, and so on). Chunks sit alongside components: a component documents one building block, a chunk documents a composition of them, captured as code.",
  "$defs": {
    "chunk": {
      "type": "object",
      "description": "A ready-to-use block of code — a layout, a settings form, a confirmation dialog. It has an identity (`identifier`, `name`, optional `description`), the `code` consumers copy, and `documentBlocks`/`agentDocumentBlocks` for the general kinds (guidelines, use-cases, accessibility, content, sections, checklist). Chunks are simple by design: they document a composition of code, not a full anatomy/API surface like a component does.",
      "required": [
        "kind",
        "identifier",
        "name",
        "code"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "chunk",
          "description": "Identifies this entity as a chunk."
        },
        "identifier": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Machine-readable identifier for the chunk (ex: 'search-bar', 'settings-form', 'confirmation-dialog'). MUST be lowercase kebab-case and unique within its entity group."
        },
        "name": {
          "type": "string",
          "description": "Display name shown in docs (ex: 'Search bar', 'Settings form', 'Confirmation dialog')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this chunk is, the pattern it captures, and which components it composes. CommonMark supported."
        },
        "code": {
          "description": "The code consumers copy to use the chunk. Give it one of two ways: inline (`code` + `language`) when it travels with the document, or referenced (`src` + `language`) when it lives in an outside file. Referenced code keeps long sources readable and lets a chunk share one file with a live app. `src` is resolved when read — there's no build step.",
          "oneOf": [
            {
              "type": "object",
              "title": "Inline code",
              "description": "The source travels inside the document as a string.",
              "required": [
                "code",
                "language"
              ],
              "properties": {
                "code": {
                  "type": "string",
                  "description": "The source code of the chunk — the block consumers copy and adapt."
                },
                "language": {
                  "type": "string",
                  "description": "The programming language or syntax of the code (ex: 'jsx', 'tsx', 'html', 'css', 'vue', 'svelte')."
                }
              },
              "additionalProperties": false
            },
            {
              "type": "object",
              "title": "Referenced code",
              "description": "The source lives in an external file the consumer resolves at read time.",
              "required": [
                "src",
                "language"
              ],
              "properties": {
                "src": {
                  "type": "string",
                  "pattern": "^(?![a-zA-Z][a-zA-Z0-9+.\\-]*:)(?!//)(?!/)",
                  "description": "A relative path to the file holding the chunk's code (ex: './chunks/confirmation-dialog.tsx'). MUST be relative — no absolute paths, protocol-relative paths, or scheme URIs (http:, file:, …). Resolvers SHOULD only fetch from an allow-list, the same rule a `$ref` fileRef follows. The file is read as-is — no build step.",
                  "minLength": 1
                },
                "language": {
                  "type": "string",
                  "description": "The programming language or syntax of the referenced file (ex: 'jsx', 'tsx', 'html', 'css', 'vue', 'svelte')."
                }
              },
              "additionalProperties": false
            }
          ]
        },
        "documentBlocks": {
          "type": "array",
          "description": "Docs for this chunk — the general block kinds only (guidelines, use-cases, accessibility, content, sections, checklist). Chunks document a composition of code, not the anatomy/API surface a component has.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
          },
          "minItems": 1
        },
        "agentDocumentBlocks": {
          "type": "array",
          "description": "Docs for AI agents only, using the same general block kinds as `documentBlocks`. Agent-only content: hard must/must-not rules, verification checklists, and constraints an agent needs when adapting this chunk into an app. Guidance for humans belongs in `documentBlocks`.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
          },
          "minItems": 1
        },
        "relationships": {
          "$ref": "../common/relationship.schema.json#/$defs/relationships",
          "description": "Links from this chunk to the entities it uses — mainly 'composes' the components it's built from (mark `required` true for the essential ones). Tools derive the reverse edges."
        },
        "metadata": {
          "$ref": "../metadata/metadata.schema.json#/$defs/entityMetadata",
          "description": "Optional metadata (see metadata/metadata.schema.json). Declare the components this chunk uses as `relationships`, not links."
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
