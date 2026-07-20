# Presentation definitions

Typed presentation objects for visual and interactive demos: image, video, code snippet, or URL. Used by `example` and any schema that embeds a demo.

Source: `common/presentation.schema.json`

**6 definitions** in this file: `presentationImage`, `presentationVideo`, `presentationCode`, `presentationUrl`, `mediaUrl`, `mediaAlt`

## presentationImage {#presentationimage}

An image. Represents a screenshot, diagram, mockup, or exported design frame.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"image"` | ✓ | Identifies this presentation as an image. |
| `url` | [mediaUrl](common-presentation.md#mediaurl) | ✓ | URL or relative path to the image file. |
| `alt` | [mediaAlt](common-presentation.md#mediaalt) | ✓ | Alt text for the image. MUST NOT be empty. |

**References:** [mediaUrl](common-presentation.md#mediaurl), [mediaAlt](common-presentation.md#mediaalt)

**Example:**

```json
{
  "kind": "image",
  "url": "https://design.acme.com/assets/button-primary-default.png",
  "alt": "A primary button in its default state, with a solid blue background and white label text reading Save."
}
```

## presentationVideo {#presentationvideo}

A video — screen recording, animated transition, or interaction walkthrough.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"video"` | ✓ | Identifies this presentation as a video. |
| `url` | [mediaUrl](common-presentation.md#mediaurl) | ✓ | URL or relative path to the video file. |
| `alt` | [mediaAlt](common-presentation.md#mediaalt) | ✓ | Alt text for the video. MUST NOT be empty. |

**References:** [mediaUrl](common-presentation.md#mediaurl), [mediaAlt](common-presentation.md#mediaalt)

**Example:**

```json
{
  "kind": "video",
  "url": "https://design.acme.com/assets/button-loading-interaction.mp4",
  "alt": "A user clicks a primary button labeled Save. The label is replaced by a spinner animation while the button maintains its width. After two seconds, the spinner is replaced by a checkmark and the label changes to Saved."
}
```

## presentationCode {#presentationcode}

A source code snippet showing how to use the artifact.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"code"` | ✓ | Identifies this presentation as a code snippet. |
| `code` | string | ✓ | The source code of the example. |
| `language` | string | ✓ | The language or syntax (ex: 'tsx', 'html', 'css', 'swift', 'kotlin'). |

**Example:**

```json
{
  "kind": "code",
  "code": "<ButtonGroup>\n  <Button variant=\"secondary\">Cancel</Button>\n  <Button variant=\"primary\">Save</Button>\n</ButtonGroup>",
  "language": "jsx"
}
```

## presentationUrl {#presentationurl}

A link to a web resource — live demo, interactive example, docs page, or hosted story (Storybook, CodeSandbox, StackBlitz, etc.).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"url"` | ✓ | Identifies this presentation as a URL. |
| `url` | string (uri) | ✓ | URL to the web resource (ex: a Storybook story or CodeSandbox link). |

**Example:**

```json
{
  "kind": "url",
  "url": "https://storybook.acme.com/?path=/story/components-button--primary"
}
```

## mediaUrl {#mediaurl}

URL or relative path to a media file. Relative paths resolve against the referencing document.

## mediaAlt {#mediaalt}

Alt text for assistive technology. MUST NOT be empty.

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/presentation.schema.json",
  "title": "Presentation definitions",
  "description": "Typed presentation objects for visual and interactive demos: image, video, code snippet, or URL. Used by `example` and any schema that embeds a demo.",
  "$defs": {
    "mediaUrl": {
      "type": "string",
      "format": "uri-reference",
      "description": "URL or relative path to a media file. Relative paths resolve against the referencing document."
    },
    "mediaAlt": {
      "type": "string",
      "minLength": 1,
      "description": "Alt text for assistive technology. MUST NOT be empty."
    },
    "presentationImage": {
      "type": "object",
      "description": "An image. Represents a screenshot, diagram, mockup, or exported design frame.",
      "required": [
        "kind",
        "url",
        "alt"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "image",
          "description": "Identifies this presentation as an image."
        },
        "url": {
          "$ref": "#/$defs/mediaUrl",
          "description": "URL or relative path to the image file."
        },
        "alt": {
          "$ref": "#/$defs/mediaAlt",
          "description": "Alt text for the image. MUST NOT be empty."
        }
      },
      "additionalProperties": false
    },
    "presentationVideo": {
      "type": "object",
      "description": "A video — screen recording, animated transition, or interaction walkthrough.",
      "required": [
        "kind",
        "url",
        "alt"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "video",
          "description": "Identifies this presentation as a video."
        },
        "url": {
          "$ref": "#/$defs/mediaUrl",
          "description": "URL or relative path to the video file."
        },
        "alt": {
          "$ref": "#/$defs/mediaAlt",
          "description": "Alt text for the video. MUST NOT be empty."
        }
      },
      "additionalProperties": false
    },
    "presentationCode": {
      "type": "object",
      "description": "A source code snippet showing how to use the artifact.",
      "required": [
        "kind",
        "code",
        "language"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "code",
          "description": "Identifies this presentation as a code snippet."
        },
        "code": {
          "type": "string",
          "description": "The source code of the example.",
          "minLength": 1
        },
        "language": {
          "type": "string",
          "description": "The language or syntax (ex: 'tsx', 'html', 'css', 'swift', 'kotlin')."
        }
      },
      "additionalProperties": false
    },
    "presentationUrl": {
      "type": "object",
      "description": "A link to a web resource — live demo, interactive example, docs page, or hosted story (Storybook, CodeSandbox, StackBlitz, etc.).",
      "required": [
        "kind",
        "url"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "url",
          "description": "Identifies this presentation as a URL."
        },
        "url": {
          "type": "string",
          "format": "uri",
          "description": "URL to the web resource (ex: a Storybook story or CodeSandbox link)."
        }
      },
      "additionalProperties": false
    }
  }
}
```
