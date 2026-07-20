# Last updated metadata field

When this entity's documentation last changed. A bare ISO date covers the common case; the object form adds a note describing what changed.

Source: `metadata/last-updated.schema.json`

## lastUpdated {#lastupdated}

When this entity's documentation last changed. A bare ISO 8601 date string ('2026-05-28') covers the common case. Use the object form to add a note describing what changed.

One of:

- [isoDate](common-dated-note.md#isodate)
- **object** — Full lastUpdated form: the date plus a note describing what changed.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `date` | [isoDate](common-dated-note.md#isodate) | ✓ | ISO 8601 date (YYYY-MM-DD) of the most recent update to this entity's documentation. |
| `note` | [plainNote](common-dated-note.md#plainnote) |  | Plain-text note summarizing what changed in the most recent update (ex: 'Added focus-visible guidance', 'Revised contrast requirements for inverse surfaces'). MUST NOT contain markup. |

**References:** [isoDate](common-dated-note.md#isodate), [plainNote](common-dated-note.md#plainnote)

**Example:**

```json
[
  "2026-05-28",
  {
    "date": "2026-05-28",
    "note": "Added focus-visible guidance and refreshed contrast requirements for inverse surfaces."
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/last-updated.schema.json",
  "title": "Last updated metadata field",
  "description": "When this entity's documentation last changed. A bare ISO date covers the common case; the object form adds a note describing what changed.",
  "$defs": {
    "lastUpdated": {
      "description": "When this entity's documentation last changed. A bare ISO 8601 date string ('2026-05-28') covers the common case. Use the object form to add a note describing what changed.",
      "oneOf": [
        {
          "$ref": "../common/dated-note.schema.json#/$defs/isoDate",
          "description": "ISO 8601 date (YYYY-MM-DD) of the most recent update to this entity's documentation."
        },
        {
          "type": "object",
          "description": "Full lastUpdated form: the date plus a note describing what changed.",
          "required": [
            "date"
          ],
          "properties": {
            "date": {
              "$ref": "../common/dated-note.schema.json#/$defs/isoDate",
              "description": "ISO 8601 date (YYYY-MM-DD) of the most recent update to this entity's documentation."
            },
            "note": {
              "$ref": "../common/dated-note.schema.json#/$defs/plainNote",
              "description": "Plain-text note summarizing what changed in the most recent update (ex: 'Added focus-visible guidance', 'Revised contrast requirements for inverse surfaces'). MUST NOT contain markup."
            }
          },
          "additionalProperties": false
        }
      ]
    }
  }
}
```
