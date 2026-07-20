# Aliases metadata field

Alternative names for entities to support search, migration, and cross-referencing.

Source: `metadata/aliases.schema.json`

## aliases {#aliases}

Alternative names for this entity across teams, tools, or legacy systems. Used to assist with search, migration, and cross-referencing.

**Example:**

```json
[
  [
    "btn",
    "cta",
    "action-button"
  ]
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/aliases.schema.json",
  "title": "Aliases metadata field",
  "description": "Alternative names for entities to support search, migration, and cross-referencing.",
  "$defs": {
    "aliases": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1,
      "description": "Alternative names for this entity across teams, tools, or legacy systems. Used to assist with search, migration, and cross-referencing.",
      "uniqueItems": true
    }
  }
}
```
