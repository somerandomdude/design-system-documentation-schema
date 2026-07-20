# Guide definitions

A guide is long-form guidance not tied to one component, token, foundation, or pattern — a getting-started walkthrough, contribution guide, tutorial, overview, or migration guide. It holds identity and metadata; the `category` field says what kind of guide it is. Its docs are sections, procedures (steps), guidelines, and use-cases.

Source: `entities/guide.schema.json`

## guide {#guide}

A long-form document meant to be read: a getting-started walkthrough, a contribution guide, a tutorial, an overview, or a migration guide. Other entities each document one thing (a component, token, foundation, pattern); a guide fills the gap for a journey or a concept instead. Its identity is `identifier`, `name`, and `description`. Use `category` (ex: 'getting-started', 'tutorial', 'migration') to classify it, and `tags` for discovery. Its docs cover sections, steps, guidelines, use-cases, imports, accessibility, and content.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"guide"` | ✓ | Identifies this entity as a guide. |
| `identifier` | string | ✓ | Machine-readable identifier for the guide (ex: 'getting-started', 'contributing', 'theming-tutorial', 'migrating-to-v2'). MUST be lowercase kebab-case and unique within its entity group. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `name` | string | ✓ | Display name shown in docs (ex: 'Getting started', 'Contributing', 'Theming tutorial', 'Migrating to v2'). |
| `description` | [richText](common-rich-text.md#richtext) |  | What this guide covers, who it is for, and what the reader will accomplish. CommonMark supported. |
| `metadata` | [entityMetadata](metadata-metadata.md#entitymetadata) |  | Optional metadata (see metadata/metadata.schema.json). Use `category` to classify the guide (ex: 'getting-started', 'tutorial', 'migration'). |
| `relationships` | [relationships](common-relationship.md#relationships) |  | Links from this guide to the entities it covers or depends on. Tools derive the reverse edges. Use `links` metadata for external resources instead. |
| `documentBlocks` | [guideDocumentBlock](document-blocks-document-blocks.md#guidedocumentblock)[] |  | All structured docs for this guide, in order. Accepts `steps`, the reused `imports` kind for setup, and every general kind — `sections` is the backbone. A guide reads top to bottom, so tools SHOULD keep this order. Put external links in `links` metadata or a section's `links`; point at other entities through `relationships`. (Min items: 1) |
| `agentDocumentBlocks` | [guideDocumentBlock](document-blocks-document-blocks.md#guidedocumentblock)[] |  | Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [entityMetadata](metadata-metadata.md#entitymetadata), [relationships](common-relationship.md#relationships), [guideDocumentBlock](document-blocks-document-blocks.md#guidedocumentblock), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "guide",
  "identifier": "getting-started",
  "name": "Getting started",
  "description": "Install the Acme design system, theme your app, and render your first component.",
  "metadata": {
    "status": "stable",
    "category": "getting-started",
    "tags": [
      "onboarding",
      "setup",
      "install",
      "getting-started",
      "provider",
      "first-component"
    ]
  },
  "documentBlocks": [
    {
      "kind": "sections",
      "items": [
        {
          "title": "Overview",
          "anchor": "overview",
          "body": "The Acme design system is a shared library of components, tokens, and patterns. This guide takes you from an empty project to a themed app with a working component in three steps."
        },
        {
          "title": "Prerequisites",
          "anchor": "prerequisites",
          "body": "You need Node.js 18 or later and a React 18 project. No design tooling is required to follow this guide."
        }
      ]
    },
    {
      "kind": "imports",
      "items": [
        {
          "platform": "react",
          "package": "@acme/ui",
          "code": "import { Button, ThemeProvider } from '@acme/ui'"
        }
      ]
    },
    {
      "kind": "steps",
      "title": "Set up your app",
      "ordered": true,
      "items": [
        {
          "instruction": "Add the UI package to your project.",
          "examples": [
            {
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
          "instruction": "Mount the `ThemeProvider` at the root so every component inherits the theme.",
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
          "instruction": "Drop a `Button` anywhere inside the provider.",
          "examples": [
            {
              "presentation": {
                "kind": "code",
                "language": "tsx",
                "code": "<Button tone=\"primary\">Save changes</Button>"
              }
            }
          ],
          "expectedResult": "A themed primary button renders and responds to hover and focus.",
          "label": "Render your first component"
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Import components from the package root, not from deep internal paths.",
          "rationale": "Deep imports bypass the public API and break when internal file structure changes.",
          "level": "must",
          "category": "development"
        },
        {
          "guidance": "Render every Acme component inside a single ThemeProvider.",
          "rationale": "Components read theme values from context; outside the provider they fall back to unstyled defaults.",
          "level": "must",
          "category": "development"
        }
      ]
    },
    {
      "kind": "use-cases",
      "items": [
        {
          "stance": "recommended",
          "description": "Starting a new Acme product or prototype from scratch."
        },
        {
          "stance": "discouraged",
          "description": "Migrating an existing app from v1 — follow the migration guide instead."
        }
      ]
    }
  ],
  "agentDocumentBlocks": [
    {
      "kind": "use-cases",
      "purpose": "Guide a developer through installing the design system and rendering a first themed component.",
      "items": [
        {
          "description": "Getting started is for new projects; the migration guide is for upgrading an existing app between major versions.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "migration guide"
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Always wrap the app in ThemeProvider before using any component.",
          "level": "must"
        },
        {
          "guidance": "Do not import from deep internal package paths.",
          "level": "must-not"
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
  "$id": "https://designsystemdocspec.org/v0.15.2/entities/guide.schema.json",
  "title": "Guide definitions",
  "description": "A guide is long-form guidance not tied to one component, token, foundation, or pattern — a getting-started walkthrough, contribution guide, tutorial, overview, or migration guide. It holds identity and metadata; the `category` field says what kind of guide it is. Its docs are sections, procedures (steps), guidelines, and use-cases.",
  "$defs": {
    "guide": {
      "type": "object",
      "description": "A long-form document meant to be read: a getting-started walkthrough, a contribution guide, a tutorial, an overview, or a migration guide. Other entities each document one thing (a component, token, foundation, pattern); a guide fills the gap for a journey or a concept instead. Its identity is `identifier`, `name`, and `description`. Use `category` (ex: 'getting-started', 'tutorial', 'migration') to classify it, and `tags` for discovery. Its docs cover sections, steps, guidelines, use-cases, imports, accessibility, and content.",
      "required": [
        "kind",
        "identifier",
        "name"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "guide",
          "description": "Identifies this entity as a guide."
        },
        "identifier": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Machine-readable identifier for the guide (ex: 'getting-started', 'contributing', 'theming-tutorial', 'migrating-to-v2'). MUST be lowercase kebab-case and unique within its entity group."
        },
        "name": {
          "type": "string",
          "description": "Display name shown in docs (ex: 'Getting started', 'Contributing', 'Theming tutorial', 'Migrating to v2')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this guide covers, who it is for, and what the reader will accomplish. CommonMark supported."
        },
        "metadata": {
          "$ref": "../metadata/metadata.schema.json#/$defs/entityMetadata",
          "description": "Optional metadata (see metadata/metadata.schema.json). Use `category` to classify the guide (ex: 'getting-started', 'tutorial', 'migration')."
        },
        "relationships": {
          "$ref": "../common/relationship.schema.json#/$defs/relationships",
          "description": "Links from this guide to the entities it covers or depends on. Tools derive the reverse edges. Use `links` metadata for external resources instead."
        },
        "documentBlocks": {
          "type": "array",
          "description": "All structured docs for this guide, in order. Accepts `steps`, the reused `imports` kind for setup, and every general kind — `sections` is the backbone. A guide reads top to bottom, so tools SHOULD keep this order. Put external links in `links` metadata or a section's `links`; point at other entities through `relationships`.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/guideDocumentBlock"
          },
          "minItems": 1
        },
        "agentDocumentBlocks": {
          "type": "array",
          "description": "Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/guideDocumentBlock"
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
