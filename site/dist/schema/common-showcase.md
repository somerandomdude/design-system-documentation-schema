# Showcase

A visual sample of something. Can be a media file (image or video) or a link to a live page.

Source: `common/showcase.schema.yaml`

## Showcase {#showcase}

A visual sample of something. Can be a media file (image or video) or a link to a live page.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"image"` \| `"video"` \| `"sound"` \| `"html"` \| `"file"` \| `"code"` \| `"other"` | ✓ | What kind of media this showcase is. |
| `url` | string (uri-reference) | ✓ | Where the showcase lives. |
| `alt` | string |  | Alt text describing the image or video, for accessibility |
| `note` | string |  | Provides additional detail about the showcase if needed. |
