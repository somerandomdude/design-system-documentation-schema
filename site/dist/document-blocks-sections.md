# Sections document block

Free-form documentation content, organized into titled sections that can nest. Use it for anything that doesn't fit the structured blocks (api, anatomy, variants) — overviews, explanations, rationale. Each section has a heading, a body, examples, links, and optional sub-sections.

Source: `document-blocks/sections.schema.json`

**2 definitions** in this file: `sections`, `sectionEntry`

## sections {#sections}

One or more titled sections of documentation content. Use it for anything a guide needs that the structured blocks don't capture: overviews, concepts, rationale, FAQs.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"sections"` | ✓ | Identifies this block as sections. |
| `items` | [sectionEntry](document-blocks-sections.md#sectionentry)[] | ✓ | The sections, in order. Tools SHOULD keep this order. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [sectionEntry](document-blocks-sections.md#sectionentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "sections",
  "items": [
    {
      "title": "What is this design system?",
      "anchor": "what-is-this",
      "body": "A shared library of components, tokens, and patterns that keeps every Acme product visually and behaviorally consistent. Use it to build interfaces faster without reinventing the basics."
    },
    {
      "title": "Who is it for?",
      "anchor": "who-is-it-for",
      "body": "Product designers and frontend engineers building Acme applications. Designers work from the Figma library; engineers consume the published npm packages."
    }
  ]
}
```

## sectionEntry {#sectionentry}

One section: a heading, a body, and optionally examples, links, and nested sub-sections. Sub-sections let you build a heading hierarchy (h2 → h3 → h4). Only `title` is required — a section can be just a heading that groups its children.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✓ | The section heading (ex: 'Installation', 'Core concepts'). |
| `anchor` | string |  | A stable URL fragment for linking to this section (ex: 'installation'). MUST be lowercase kebab-case and unique in the block. Left out, tools MAY derive one from the title. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `body` | [richText](common-rich-text.md#richtext) |  | The section's content, as markdown. Can be omitted when the section only groups sub-sections. |
| `examples` | [example](common-example.md#example)[] |  | Examples for this section — code, images, videos, or live links. (Min items: 1) |
| `links` | [link](common-link.md#link)[] |  | 'See also' links for this section. To reference another entity, use `relationships` instead. (Min items: 1) |
| `sections` | [sectionEntry](document-blocks-sections.md#sectionentry)[] |  | Sub-sections nested beneath this one, to any depth. Tools SHOULD keep this order. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [example](common-example.md#example), [link](common-link.md#link), [sectionEntry](document-blocks-sections.md#sectionentry)

**Example:**

```json
{
  "title": "Core concepts",
  "anchor": "core-concepts",
  "body": "The design system is built on three layers: **tokens** carry raw values, **foundations** define design domains, and **components** compose both into UI. Understanding this hierarchy makes everything else easier to navigate.",
  "examples": [
    {
      "title": "Importing a component",
      "presentation": {
        "kind": "code",
        "language": "tsx",
        "code": "import { Button } from '@acme/ui'"
      }
    }
  ],
  "links": [
    {
      "kind": "related",
      "label": "Token reference",
      "url": "https://designsystemdocspec.org/tokens"
    }
  ],
  "sections": [
    {
      "title": "Tokens",
      "anchor": "tokens",
      "body": "Tokens are named design values — a color, a spacing step, a duration. Never hard-code a raw value when a token exists."
    }
  ]
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/sections.schema.json",
  "title": "Sections document block",
  "description": "Free-form documentation content, organized into titled sections that can nest. Use it for anything that doesn't fit the structured blocks (api, anatomy, variants) — overviews, explanations, rationale. Each section has a heading, a body, examples, links, and optional sub-sections.",
  "$defs": {
    "sectionEntry": {
      "type": "object",
      "description": "One section: a heading, a body, and optionally examples, links, and nested sub-sections. Sub-sections let you build a heading hierarchy (h2 → h3 → h4). Only `title` is required — a section can be just a heading that groups its children.",
      "required": [
        "title"
      ],
      "properties": {
        "title": {
          "type": "string",
          "description": "The section heading (ex: 'Installation', 'Core concepts')."
        },
        "anchor": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "A stable URL fragment for linking to this section (ex: 'installation'). MUST be lowercase kebab-case and unique in the block. Left out, tools MAY derive one from the title."
        },
        "body": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "The section's content, as markdown. Can be omitted when the section only groups sub-sections."
        },
        "examples": {
          "type": "array",
          "description": "Examples for this section — code, images, videos, or live links.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        },
        "links": {
          "type": "array",
          "description": "'See also' links for this section. To reference another entity, use `relationships` instead.",
          "items": {
            "$ref": "../common/link.schema.json#/$defs/link"
          },
          "minItems": 1
        },
        "sections": {
          "type": "array",
          "description": "Sub-sections nested beneath this one, to any depth. Tools SHOULD keep this order.",
          "items": {
            "$ref": "#/$defs/sectionEntry"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "sections": {
      "type": "object",
      "description": "One or more titled sections of documentation content. Use it for anything a guide needs that the structured blocks don't capture: overviews, concepts, rationale, FAQs.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "sections",
          "description": "Identifies this block as sections."
        },
        "items": {
          "type": "array",
          "description": "The sections, in order. Tools SHOULD keep this order.",
          "items": {
            "$ref": "#/$defs/sectionEntry"
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
