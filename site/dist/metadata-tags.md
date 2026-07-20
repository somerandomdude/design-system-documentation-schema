# Tags metadata field

Freeform keywords for grouping, search, and cross-referencing.

Source: `metadata/tags.schema.json`

## tags {#tags}

Freeform keywords for grouping, search, and cross-referencing.

**Example:**

```json
[
  [
    "action",
    "interactive",
    "form",
    "cta",
    "submit"
  ]
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/tags.schema.json",
  "title": "Tags metadata field",
  "description": "Freeform keywords for grouping, search, and cross-referencing.",
  "$defs": {
    "tags": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1,
      "description": "Freeform keywords for grouping, search, and cross-referencing.",
      "uniqueItems": true
    }
  }
}
```
