# Token and token group definitions

Docs for individual tokens and token groups. Token values, aliases, and type live in the DTCG file — DSDS documents only the purpose, guidelines, and organization. A token group is a flexible unit: a full collection, a family (all color tokens), or a sub-family (one hue). Groups can hold tokens, nested groups, or both, forming a hierarchy. Both tokens and groups have an optional display `name` — when it's left out, the `identifier` serves as the label. Description and status are optional, to keep things terse at scale.

Source: `entities/token.schema.json`

**2 definitions** in this file: `tokenGroup`, `token`

## tokenGroup {#tokengroup}

A group of related tokens — a full collection, a family (all color tokens), a sub-family (one hue with its scale), or any other grouping. Groups nest to form a hierarchy: a top-level 'color' group might hold 'color-text', 'color-background', and 'color-border', each with its own tokens. `name` is optional — left out, the `identifier` is the label. Description and status are also optional. A child that skips its own status inherits the group's.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"token-group"` | ✓ | Identifies this entity as a token-group. |
| `identifier` | string | ✓ | The token group identifier. No fixed pattern, to support DTCG and design-tool naming styles (dots, slashes, dashes). Also serves as the display label. |
| `name` | string |  | Optional display name (ex: 'Primary Text'). Left out, the `identifier` is the label — the same rule every entity follows. |
| `description` | [richText](common-rich-text.md#richtext) |  | What this token group covers and how it is organized. Optional, so keep it terse at scale. CommonMark supported. |
| `tokenType` | string |  | If every token in this group shares a type, declare it here instead of repeating it on each child. A child MAY override it. Common values: 'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'shadow'. |
| `source` | object {file, path} |  | Points to the DTCG (W3C Design Tokens) file. DSDS doesn't copy token values — the DTCG file is the source of truth for resolved values, aliases, and type. |
| `children` | [token](entities-token.md#token) \| [tokenGroup](entities-token.md#tokengroup)[] |  | The tokens and/or nested groups inside this group, in order. Order often shows a real progression (lightest to darkest, smallest to largest), so tools SHOULD keep it. Children inherit `tokenType` and status from this group when they skip their own. (Min items: 1) |
| `metadata` | [entityMetadata](metadata-metadata.md#entitymetadata) |  | Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json). |
| `relationships` | [relationships](common-relationship.md#relationships) |  | Links to other entities — e.g. 'depends-on' a token this one aliases, 'part-of' a token group. Tools derive the reverse edges. |
| `documentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | All structured docs for this group, in order — the general kinds only. Use this for docs about the group as a whole; put docs for individual tokens on the token itself, inside `children`. (Min items: 1) |
| `agentDocumentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [token](entities-token.md#token), [tokenGroup](entities-token.md#tokengroup), [entityMetadata](metadata-metadata.md#entitymetadata), [relationships](common-relationship.md#relationships), [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock), [extensions](common-extensions.md#extensions)

## token {#token}

One design token: identifier, type, use cases, guidelines, accessibility notes. `name` is optional — left out, the `identifier` is the display label. Description and status are also optional. When a token is inside a group and skips its own status, it inherits the group's.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"token"` | ✓ | Identifies this entity as a token. |
| `identifier` | string | ✓ | The token identifier. No fixed pattern, to support DTCG and design-tool naming styles (dots, slashes, dashes). Also serves as the display label. |
| `name` | string |  | Optional display name (ex: 'Primary Text'). Left out, the `identifier` is the label — the same rule every entity follows. |
| `tokenType` | string |  | The token's type, per the DTCG spec (ex: 'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'shadow'). MUST be set here unless a parent group already declares it — a token inherits the group's value if it skips its own. Every token needs a `tokenType` somewhere in its ancestry; having none anywhere is a defect. |
| `description` | [richText](common-rich-text.md#richtext) |  | What this token represents and when to use it. Optional, so keep it terse at scale. CommonMark supported. |
| `source` | object {file, path} |  | Points to the DTCG (W3C Design Tokens) file. DSDS doesn't copy token values — the DTCG file is the source of truth for resolved values, aliases, and type. |
| `metadata` | [entityMetadata](metadata-metadata.md#entitymetadata) |  | Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json). |
| `relationships` | [relationships](common-relationship.md#relationships) |  | Links to other entities — e.g. 'depends-on' a token this one aliases, 'part-of' a token group. Tools derive the reverse edges. |
| `documentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | All structured docs for this token, in order. Tokens accept the general kinds only. Tools SHOULD keep this order for display. (Min items: 1) |
| `agentDocumentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [entityMetadata](metadata-metadata.md#entitymetadata), [relationships](common-relationship.md#relationships), [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "token",
  "identifier": "color-text-primary",
  "description": "The default color for body text, headings, and labels. Provides the highest-contrast text color for standard reading content on default background surfaces.",
  "metadata": {
    "status": {
      "overall": "stable",
      "platforms": {
        "css": {
          "status": "stable",
          "since": "2.0.0"
        },
        "ios": {
          "status": "stable",
          "since": "2.1.0"
        },
        "android": {
          "status": "stable",
          "since": "2.2.0"
        },
        "figma": {
          "status": "stable",
          "since": "2.0.0"
        }
      }
    },
    "since": "2.0.0",
    "category": "semantic",
    "tags": [
      "color",
      "text",
      "body",
      "primary",
      "heading",
      "label",
      "foreground"
    ],
    "aliases": [
      "color.text.default",
      "color.text.body"
    ],
    "summary": "Default body text color for light and dark surfaces.",
    "links": [
      {
        "kind": "source",
        "url": "https://code.acme.com/design-system/src/tokens/color/text.tokens.json",
        "label": "Token source file"
      },
      {
        "kind": "documentation",
        "url": "https://design.acme.com/tokens/color-text-primary",
        "label": "Token documentation"
      },
      {
        "kind": "related",
        "url": "https://design.acme.com/tokens/color-text-secondary",
        "label": "color-text-secondary"
      },
      {
        "kind": "related",
        "url": "https://design.acme.com/tokens/color-text-tertiary",
        "label": "color-text-tertiary"
      }
    ]
  },
  "tokenType": "color",
  "source": {
    "file": "tokens/color.tokens.json",
    "path": "color.text.primary"
  },
  "documentBlocks": [
    {
      "kind": "use-cases",
      "items": [
        {
          "description": "When applying color to body text, headings, and form labels on default background surfaces.",
          "stance": "recommended"
        },
        {
          "description": "When building components that display primary reading content that must adapt across color modes.",
          "stance": "recommended"
        },
        {
          "description": "When placing text on dark or colored background surfaces.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "color-text-inverse",
            "rationale": "This token is optimized for contrast against light backgrounds. Using it on dark or saturated surfaces will fail contrast requirements."
          }
        },
        {
          "description": "When the text is inside a component that supplies its own scoped color tokens (ex: text on a filled button).",
          "stance": "discouraged",
          "alternative": {
            "identifier": "color-text-on-action",
            "rationale": "Component-scoped tokens account for the specific background they sit on. Applying a general text token to a scoped context risks contrast failures."
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Use for all body text, headings, and form labels on default background surfaces.",
          "rationale": "A single primary text color ensures visual consistency and meets WCAG 2.1 AA contrast requirements against the system's default background.",
          "level": "should",
          "category": "visual-design"
        },
        {
          "guidance": "Do not override this token's value at the component level. Use color-text-secondary or color-text-tertiary for reduced emphasis.",
          "rationale": "Overriding the primary text color creates inconsistency. The system provides lower-emphasis text tokens for visual hierarchy.",
          "level": "must-not",
          "category": "visual-design"
        },
        {
          "guidance": "This color meets a 15.3:1 contrast ratio against color-background-default in light mode.",
          "rationale": "Exceeds WCAG 2.1 AAA requirements (7:1 for normal text), ensuring readability for users with low vision.",
          "level": "should",
          "category": "accessibility",
          "references": [
            {
              "url": "https://www.w3.org/TR/WCAG22/#contrast-minimum"
            },
            {
              "url": "https://www.w3.org/TR/WCAG22/#contrast-enhanced"
            }
          ]
        }
      ]
    },
    {
      "kind": "accessibility",
      "wcagLevel": "AAA",
      "colorContrast": [
        {
          "foreground": "color-text-primary",
          "background": "color-background-default",
          "context": "Primary text on default background in light mode."
        },
        {
          "foreground": "color-text-primary",
          "background": "color-background-subtle",
          "context": "Primary text on subtle background (card surface) in light mode."
        }
      ]
    }
  ],
  "agentDocumentBlocks": [
    {
      "kind": "use-cases",
      "purpose": "Apply the primary text color for body content, headings, and labels on default background surfaces.",
      "items": [
        {
          "description": "Use primary for default reading content; use secondary for supporting or reduced-emphasis text.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "color-text-secondary"
          }
        },
        {
          "description": "Use primary on default surfaces; use on-action inside filled interactive components.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "color-text-on-action"
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Do not use on dark or colored background surfaces.",
          "level": "must-not"
        },
        {
          "guidance": "Do not override this token value at the component level.",
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
  "$id": "https://designsystemdocspec.org/v0.15.2/entities/token.schema.json",
  "title": "Token and token group definitions",
  "description": "Docs for individual tokens and token groups. Token values, aliases, and type live in the DTCG file — DSDS documents only the purpose, guidelines, and organization. A token group is a flexible unit: a full collection, a family (all color tokens), or a sub-family (one hue). Groups can hold tokens, nested groups, or both, forming a hierarchy. Both tokens and groups have an optional display `name` — when it's left out, the `identifier` serves as the label. Description and status are optional, to keep things terse at scale.",
  "$defs": {
    "token": {
      "type": "object",
      "description": "One design token: identifier, type, use cases, guidelines, accessibility notes. `name` is optional — left out, the `identifier` is the display label. Description and status are also optional. When a token is inside a group and skips its own status, it inherits the group's.",
      "required": [
        "kind",
        "identifier"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "token",
          "description": "Identifies this entity as a token."
        },
        "identifier": {
          "type": "string",
          "description": "The token identifier. No fixed pattern, to support DTCG and design-tool naming styles (dots, slashes, dashes). Also serves as the display label."
        },
        "name": {
          "type": "string",
          "description": "Optional display name (ex: 'Primary Text'). Left out, the `identifier` is the label — the same rule every entity follows."
        },
        "tokenType": {
          "type": "string",
          "description": "The token's type, per the DTCG spec (ex: 'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'shadow'). MUST be set here unless a parent group already declares it — a token inherits the group's value if it skips its own. Every token needs a `tokenType` somewhere in its ancestry; having none anywhere is a defect."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this token represents and when to use it. Optional, so keep it terse at scale. CommonMark supported."
        },
        "source": {
          "type": "object",
          "description": "Points to the DTCG (W3C Design Tokens) file. DSDS doesn't copy token values — the DTCG file is the source of truth for resolved values, aliases, and type.",
          "required": [
            "file"
          ],
          "properties": {
            "file": {
              "type": "string",
              "description": "URI or relative path to the DTCG file containing this token's definition."
            },
            "path": {
              "type": "string",
              "description": "The dot-path to this token within the DTCG file (ex: 'color.text.primary')."
            }
          },
          "additionalProperties": false
        },
        "metadata": {
          "$ref": "../metadata/metadata.schema.json#/$defs/entityMetadata",
          "description": "Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json)."
        },
        "relationships": {
          "$ref": "../common/relationship.schema.json#/$defs/relationships",
          "description": "Links to other entities — e.g. 'depends-on' a token this one aliases, 'part-of' a token group. Tools derive the reverse edges."
        },
        "documentBlocks": {
          "type": "array",
          "description": "All structured docs for this token, in order. Tokens accept the general kinds only. Tools SHOULD keep this order for display.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
          },
          "minItems": 1
        },
        "agentDocumentBlocks": {
          "type": "array",
          "description": "Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false
    },
    "tokenGroup": {
      "type": "object",
      "description": "A group of related tokens — a full collection, a family (all color tokens), a sub-family (one hue with its scale), or any other grouping. Groups nest to form a hierarchy: a top-level 'color' group might hold 'color-text', 'color-background', and 'color-border', each with its own tokens. `name` is optional — left out, the `identifier` is the label. Description and status are also optional. A child that skips its own status inherits the group's.",
      "required": [
        "kind",
        "identifier"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "token-group",
          "description": "Identifies this entity as a token-group."
        },
        "identifier": {
          "type": "string",
          "description": "The token group identifier. No fixed pattern, to support DTCG and design-tool naming styles (dots, slashes, dashes). Also serves as the display label."
        },
        "name": {
          "type": "string",
          "description": "Optional display name (ex: 'Primary Text'). Left out, the `identifier` is the label — the same rule every entity follows."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this token group covers and how it is organized. Optional, so keep it terse at scale. CommonMark supported."
        },
        "tokenType": {
          "type": "string",
          "description": "If every token in this group shares a type, declare it here instead of repeating it on each child. A child MAY override it. Common values: 'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number', 'shadow'."
        },
        "source": {
          "type": "object",
          "description": "Points to the DTCG (W3C Design Tokens) file. DSDS doesn't copy token values — the DTCG file is the source of truth for resolved values, aliases, and type.",
          "required": [
            "file"
          ],
          "properties": {
            "file": {
              "type": "string",
              "description": "URI or relative path to the DTCG file containing this group's definition."
            },
            "path": {
              "type": "string",
              "description": "The dot-path to this group within the DTCG file (ex: 'color.text')."
            }
          },
          "additionalProperties": false
        },
        "children": {
          "type": "array",
          "description": "The tokens and/or nested groups inside this group, in order. Order often shows a real progression (lightest to darkest, smallest to largest), so tools SHOULD keep it. Children inherit `tokenType` and status from this group when they skip their own.",
          "items": {
            "oneOf": [
              {
                "$ref": "#/$defs/token"
              },
              {
                "$ref": "#/$defs/tokenGroup"
              }
            ]
          },
          "minItems": 1
        },
        "metadata": {
          "$ref": "../metadata/metadata.schema.json#/$defs/entityMetadata",
          "description": "Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json)."
        },
        "relationships": {
          "$ref": "../common/relationship.schema.json#/$defs/relationships",
          "description": "Links to other entities — e.g. 'depends-on' a token this one aliases, 'part-of' a token group. Tools derive the reverse edges."
        },
        "documentBlocks": {
          "type": "array",
          "description": "All structured docs for this group, in order — the general kinds only. Use this for docs about the group as a whole; put docs for individual tokens on the token itself, inside `children`.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
          },
          "minItems": 1
        },
        "agentDocumentBlocks": {
          "type": "array",
          "description": "Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
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
