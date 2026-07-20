# Since metadata field

The design system version in which this entity was introduced.

Source: `metadata/since.schema.json`

## since {#since}

The design system version in which this entity was introduced (ex:, '1.0.0', '2.3.0').

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/since.schema.json",
  "title": "Since metadata field",
  "description": "The design system version in which this entity was introduced.",
  "$defs": {
    "since": {
      "type": "string",
      "description": "The design system version in which this entity was introduced (ex:, '1.0.0', '2.3.0').",
      "minLength": 1
    }
  }
}
```
