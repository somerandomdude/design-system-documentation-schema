# Preview metadata field

A visual or interactive preview.

Source: `metadata/preview.schema.json`

## preview {#preview}

A visual or interactive preview of the entity (ex: image, video, code snippet, or URL). The value is a presentation object. Its `kind` tag selects the media type.

One of:

- [presentationImage](common-presentation.md#presentationimage)
- [presentationVideo](common-presentation.md#presentationvideo)
- [presentationCode](common-presentation.md#presentationcode)
- [presentationUrl](common-presentation.md#presentationurl)

**References:** [presentationImage](common-presentation.md#presentationimage), [presentationVideo](common-presentation.md#presentationvideo), [presentationCode](common-presentation.md#presentationcode), [presentationUrl](common-presentation.md#presentationurl)

**Example:**

```json
[
  {
    "kind": "url",
    "url": "https://storybook.acme.com/?path=/story/components-button--primary"
  },
  {
    "kind": "image",
    "url": "https://design.acme.com/assets/previews/button-variants.png",
    "alt": "All Button variants shown side by side: primary, secondary, and ghost."
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/preview.schema.json",
  "title": "Preview metadata field",
  "description": "A visual or interactive preview.",
  "$defs": {
    "preview": {
      "description": "A visual or interactive preview of the entity (ex: image, video, code snippet, or URL). The value is a presentation object. Its `kind` tag selects the media type.",
      "oneOf": [
        {
          "$ref": "../common/presentation.schema.json#/$defs/presentationImage"
        },
        {
          "$ref": "../common/presentation.schema.json#/$defs/presentationVideo"
        },
        {
          "$ref": "../common/presentation.schema.json#/$defs/presentationCode"
        },
        {
          "$ref": "../common/presentation.schema.json#/$defs/presentationUrl"
        }
      ]
    }
  }
}
```
