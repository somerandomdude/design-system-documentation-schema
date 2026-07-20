# Links metadata field

Links to external resources.

Source: `metadata/links.schema.json`

## links {#links}

Links to external resources (ex: source code, design files, docs pages, packages). Links cannot express how entities relate.  Use `relationships` array for inter-entity references.

**References:** [link](common-link.md#link)

**Example:**

```json
[
  [
    {
      "kind": "source",
      "url": "https://code.acme.com/design-system/src/components/button/button.tsx",
      "label": "React component source"
    },
    {
      "kind": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
      "label": "Design file — Button variants"
    },
    {
      "kind": "documentation",
      "url": "https://design.acme.com/components/button",
      "label": "Button documentation"
    }
  ]
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/links.schema.json",
  "title": "Links metadata field",
  "description": "Links to external resources.",
  "$defs": {
    "links": {
      "type": "array",
      "items": {
        "$ref": "../common/link.schema.json#/$defs/link"
      },
      "minItems": 1,
      "description": "Links to external resources (ex: source code, design files, docs pages, packages). Links cannot express how entities relate.  Use `relationships` array for inter-entity references."
    }
  }
}
```
