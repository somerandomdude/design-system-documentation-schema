# Category metadata field

Where this entity fits in the design system's taxonomy.

Source: `metadata/category.schema.json`

## category {#category}

Where this entity fits in the design system's taxonomy (ex: 'action', 'navigation', 'feedback', 'base', 'semantic'). MUST be lowercase kebab-case.

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/category.schema.json",
  "title": "Category metadata field",
  "description": "Where this entity fits in the design system's taxonomy.",
  "$defs": {
    "category": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Where this entity fits in the design system's taxonomy (ex: 'action', 'navigation', 'feedback', 'base', 'semantic'). MUST be lowercase kebab-case."
    }
  }
}
```
