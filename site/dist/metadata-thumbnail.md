# Thumbnail metadata field

A single image thumbnail for compact display, defined as a URL plus required alt text.

Source: `metadata/thumbnail.schema.json`

## thumbnail {#thumbnail}

A single image thumbnail for compact display, defined as a URL plus required alt text.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | [mediaUrl](common-presentation.md#mediaurl) | ✓ | URL or relative path to the thumbnail image. |
| `alt` | [mediaAlt](common-presentation.md#mediaalt) | ✓ | Alt text for the thumbnail image. MUST NOT be empty. |

**References:** [mediaUrl](common-presentation.md#mediaurl), [mediaAlt](common-presentation.md#mediaalt)

**Example:**

```json
{
  "url": "https://design.acme.com/assets/thumbnails/button.png",
  "alt": "A primary button labeled 'Save changes'."
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/thumbnail.schema.json",
  "title": "Thumbnail metadata field",
  "description": "A single image thumbnail for compact display, defined as a URL plus required alt text.",
  "$defs": {
    "thumbnail": {
      "type": "object",
      "description": "A single image thumbnail for compact display, defined as a URL plus required alt text.",
      "required": [
        "url",
        "alt"
      ],
      "properties": {
        "url": {
          "$ref": "../common/presentation.schema.json#/$defs/mediaUrl",
          "description": "URL or relative path to the thumbnail image."
        },
        "alt": {
          "$ref": "../common/presentation.schema.json#/$defs/mediaAlt",
          "description": "Alt text for the thumbnail image. MUST NOT be empty."
        }
      },
      "additionalProperties": false
    }
  }
}
```
