# Link definition

A typed pointer to an external resource — source, design, docs, packages. Every link needs a `kind` and a `url`. Use the `relationships` array for references between entities instead of links.

Source: `common/link.schema.json`

## link {#link}

The typed pointer to external content, defined by `url`. Standard `kind`s include 'source', 'design', 'storybook', 'documentation', 'package', 'repository', 'manifest'. Custom values allowed.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | string | ✓ | The resource category. Custom values MUST match ^[a-z][a-z0-9-]*$. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `url` | string (uri) | ✓ | The URL of the linked content. MUST be a valid absolute URI. |
| `label` | string |  | Display text for the link (ex: 'React component source'). When omitted, tools MAY build one from the URL. |

**Example:**

```json
[
  {
    "kind": "source",
    "url": "https://code.acme.com/design-system/src/components/button/button.tsx",
    "label": "React component source"
  },
  {
    "kind": "design",
    "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
    "label": "Design file — component"
  },
  {
    "kind": "documentation",
    "url": "https://design.acme.com/components/button",
    "label": "Button documentation"
  },
  {
    "kind": "storybook",
    "url": "https://storybook.acme.com/?path=/docs/components-button--docs",
    "label": "Interactive docs"
  },
  {
    "kind": "package",
    "url": "https://www.npmjs.com/package/@acme/components",
    "label": "npm package"
  },
  {
    "kind": "repository",
    "url": "https://code.acme.com/design-system",
    "label": "Repository root"
  },
  {
    "kind": "alternative",
    "url": "https://design.acme.com/components/link",
    "label": "Link component (alternative)"
  },
  {
    "kind": "parent",
    "url": "https://design.acme.com/components/button-group",
    "label": "Button Group (parent)"
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/link.schema.json",
  "title": "Link definition",
  "description": "A typed pointer to an external resource — source, design, docs, packages. Every link needs a `kind` and a `url`. Use the `relationships` array for references between entities instead of links.",
  "$defs": {
    "link": {
      "type": "object",
      "description": "The typed pointer to external content, defined by `url`. Standard `kind`s include 'source', 'design', 'storybook', 'documentation', 'package', 'repository', 'manifest'. Custom values allowed.",
      "required": [
        "kind",
        "url"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "The resource category. Custom values MUST match ^[a-z][a-z0-9-]*$."
        },
        "url": {
          "type": "string",
          "format": "uri",
          "description": "The URL of the linked content. MUST be a valid absolute URI."
        },
        "label": {
          "type": "string",
          "minLength": 1,
          "description": "Display text for the link (ex: 'React component source'). When omitted, tools MAY build one from the URL."
        }
      },
      "additionalProperties": false
    }
  }
}
```
