# DSDS Examples Module

**Part of the [Design System Documentation Standard (DSDS) 1.0](../dsds-spec.md)**

This module defines a unified, reusable example model for visual and interactive demonstrations. It supports images, videos, live code snippets, and Storybook stories — used consistently as component previews, variant illustrations, state visualizations, and inline guideline demonstrations.

---

## 9. Examples

Examples are visual or interactive demonstrations of a documented artifact. They appear as component previews, variant illustrations, state visualizations, and inline guideline demonstrations.

DSDS defines a single, reusable example model that supports four media types: images, videos, live code snippets, and Storybook stories. This model is used consistently wherever a visual example is needed.

### 9.1 Example Object

Each example _MUST_ be an object with a `type` property that determines which additional properties are required.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | The media type of the example. _MUST_ be one of: `"image"`, `"video"`, `"code"`, `"storybook"`. |
| `label` | `string` | No | A human-readable caption or title for the example. Tools _MAY_ display this alongside the rendered example. |

The remaining properties are conditional on the `type` value, as defined in the following subsections.

### 9.2 Image Examples

An image example displays a static visual representation — a screenshot, diagram, annotated mockup, or exported design frame.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | _MUST_ be `"image"`. |
| `url` | `string` | Yes | The URL or relative path to the image file. |
| `alt` | `string` | Yes | Alternative text describing the content of the image. _MUST_ be provided for accessibility. See [§9.6](#96-alt-text-requirements). |
| `label` | `string` | No | Caption for the image. |

**Example:**

```json
{
  "type": "image",
  "url": "https://design.acme.com/assets/button-primary-default.png",
  "alt": "A primary button in its default state, with a solid blue background and white label text reading 'Save'.",
  "label": "Primary button — default state"
}
```

### 9.3 Video Examples

A video example displays a recording or animation — a screen capture of an interaction, an animated transition, or a walkthrough.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | _MUST_ be `"video"`. |
| `url` | `string` | Yes | The URL or relative path to the video file. |
| `alt` | `string` | Yes | Alternative text describing the content of the video. _MUST_ be provided for accessibility. See [§9.6](#96-alt-text-requirements). |
| `label` | `string` | No | Caption for the video. |

**Example:**

```json
{
  "type": "video",
  "url": "https://design.acme.com/assets/button-loading-interaction.mp4",
  "alt": "A user clicks a primary button labeled 'Submit'. The label is replaced by a spinner animation. After two seconds, the spinner is replaced by a checkmark and the label changes to 'Done'.",
  "label": "Loading state transition"
}
```

### 9.4 Code Examples

A code example displays a live or rendered code snippet showing how to use the artifact. The code and its language metadata are provided directly in the document.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | _MUST_ be `"code"`. |
| `code` | `string` | Yes | The source code of the example. |
| `language` | `string` | Yes | The programming language or syntax of the code. Common values: `"jsx"`, `"tsx"`, `"html"`, `"css"`, `"vue"`, `"svelte"`, `"swift"`, `"kotlin"`, `"scss"`. |
| `label` | `string` | No | Caption for the code example. |

Tools _MAY_ render code examples as syntax-highlighted blocks, live previews, or interactive sandboxes depending on their capabilities.

**Example:**

```json
{
  "type": "code",
  "language": "jsx",
  "code": "<Button variant=\"primary\" onClick={handleSave}>Save</Button>",
  "label": "Basic primary button"
}
```

**Multi-line code example:**

```json
{
  "type": "code",
  "language": "html",
  "code": "<button class=\"btn btn--primary\" type=\"button\">\n  <span class=\"btn__label\">Save</span>\n</button>",
  "label": "HTML markup for primary button"
}
```

### 9.5 Storybook Examples

A Storybook example references an interactive component story hosted in Storybook (or a compatible tool such as Chromatic). This allows documentation tools to embed a live, interactive preview.

A Storybook example _MUST_ include at least one of `url` or `storyId`. Both _MAY_ be provided.

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | _MUST_ be `"storybook"`. |
| `url` | `string` | Conditional | The URL to the Storybook story or docs page. Required if `storyId` is not provided. |
| `storyId` | `string` | Conditional | The Storybook story identifier (e.g., `"components-button--primary"`). Required if `url` is not provided. |
| `label` | `string` | No | Caption for the embedded story. |

Tools _MAY_ use the `url` to render an iframe embed or a link. Tools _MAY_ use the `storyId` to integrate with a Storybook API for richer embedding. When both are present, `url` is preferred for display and `storyId` is available for programmatic access.

**Example:**

```json
{
  "type": "storybook",
  "url": "https://storybook.acme.com/?path=/story/components-button--primary",
  "storyId": "components-button--primary",
  "label": "Interactive primary button"
}
```

**URL-only example:**

```json
{
  "type": "storybook",
  "url": "https://storybook.acme.com/?path=/story/components-button--all-variants",
  "label": "All button variants"
}
```

### 9.6 Alt Text Requirements

Image and video examples _MUST_ include an `alt` property. Alt text serves users of assistive technology and ensures that the information conveyed by the visual example is available in text form.

When writing alt text for design system examples:

- **Describe what is shown, not what it means.** "A primary button with a blue background and white label 'Save'" is better than "The correct way to use a button."
- **Include relevant visual details.** Colors, sizes, states, and text content visible in the image or video should be mentioned when they are the point of the example.
- **Keep it concise but complete.** One to three sentences is typical. Cover enough that a reader who cannot see the example understands what it depicts.
- **For videos, describe the sequence of events.** "A user clicks the button. The label is replaced by a spinner. After two seconds, the button returns to its default state."

### 9.7 Where Examples Appear

Example objects are used in the following locations:

| Location | Property | Description |
|---|---|---|
| Component documentation | `preview` | The hero representation of the component, displayed alongside `displayName` and `description`. |
| Variant | `preview` | A visual demonstration of a specific variant. |
| State | `preview` | A visual demonstration of a specific interactive state. |
| Guideline examples | `encouraged` / `discouraged` | Inline visual examples within a guideline's `examples` object. See [§10.2](#102-examples-in-guidelines). |

The `preview` property is an array of example objects. This allows a component, variant, or state to show multiple representations — for instance, a static image alongside a live Storybook embed, or code examples in multiple frameworks.

**Component preview example:**

```json
{
  "name": "button",
  "displayName": "Button",
  "description": "An interactive element that triggers an action when activated.",
  "status": "stable",
  "preview": [
    {
      "type": "image",
      "url": "https://design.acme.com/assets/button-hero.png",
      "alt": "A row of four buttons showing the primary, secondary, ghost, and danger variants side by side, each in their default state.",
      "label": "All button variants"
    },
    {
      "type": "storybook",
      "url": "https://storybook.acme.com/?path=/story/components-button--primary",
      "storyId": "components-button--primary",
      "label": "Interactive primary button"
    }
  ]
}
```

**Variant preview example:**

```json
{
  "variants": [
    {
      "name": "danger",
      "displayName": "Danger",
      "description": "A high-emphasis variant that signals a destructive or irreversible action.",
      "preview": [
        {
          "type": "image",
          "url": "https://design.acme.com/assets/button-danger-states.png",
          "alt": "The danger button shown in four states: default (red background, white text), hover (darker red), active (darkest red), and disabled (red at 40% opacity)."
        },
        {
          "type": "code",
          "language": "jsx",
          "code": "<Button variant=\"danger\" onClick={handleDelete}>Delete project</Button>",
          "label": "Usage"
        }
      ]
    }
  ]
}
```

### 9.8 Examples in Guidelines

Example objects _MAY_ also appear inside a guideline's `examples.encouraged` and `examples.discouraged` arrays, alongside the simpler string and `{value, description}` formats. This allows guidelines to include visual do/don't illustrations.

When a rich example object (one with a `type` property) appears in an `encouraged` or `discouraged` array, it follows the same structure defined in this section. Tools _MUST_ be able to distinguish rich examples from simple examples by checking for the presence of the `type` property.

See [§10.2 Examples in Guidelines](#102-examples-in-guidelines) for the full specification of the combined format.

**Example — guideline with visual do/don't:**

```json
{
  "guidance": "Limit each surface to one primary button.",
  "rationale": "Multiple primary buttons dilute visual hierarchy. When everything is emphasized, nothing is.",
  "examples": {
    "encouraged": [
      {
        "type": "image",
        "url": "https://design.acme.com/assets/guideline-single-primary.png",
        "alt": "A dialog with a secondary 'Cancel' button on the left and a primary 'Save' button on the right. Only the primary button has a filled background.",
        "label": "One primary action per surface"
      },
      {
        "type": "code",
        "language": "jsx",
        "code": "<ButtonGroup>\n  <Button variant=\"secondary\">Cancel</Button>\n  <Button variant=\"primary\">Save</Button>\n</ButtonGroup>",
        "label": "Code example"
      }
    ],
    "discouraged": [
      {
        "type": "image",
        "url": "https://design.acme.com/assets/guideline-multiple-primary.png",
        "alt": "A dialog with two primary buttons, both with filled blue backgrounds. 'Cancel' and 'Save' compete for visual attention.",
        "label": "Multiple primary buttons create competing focal points"
      }
    ]
  }
}
```

---

