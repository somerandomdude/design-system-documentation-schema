# DSDS Links Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines typed references to external resources associated with a documented artifact — source code repositories, design files and variables, interactive demos, documentation pages, and published packages. Links are a first-class property, distinct from vendor-specific extensions.

---

## 12. Links

The optional `links` array provides typed references to external resources associated with an artifact. Unlike `related` (which references other DSDS artifacts within the system), `links` point outward — to source code, design files, interactive demos, and other tools where the artifact lives.

### 12.1 Link Object

Each element of the `links` array _MUST_ be an object with the following properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | Yes | The category of the linked resource. See [§11.2 Link Types](#112-link-types). |
| `url` | `string` | Yes | The URL of the linked resource. _MUST_ be a valid absolute URI. |
| `label` | `string` | No | A human-readable label describing the specific resource (e.g., `"Component source"`, `"Design file — variants"`, `"Primary story"`). If omitted, tools _MAY_ derive a display label from the `type`. |

### 12.2 Link Types

The `type` property classifies the linked resource. The following standard values are defined by this specification:

| Type | Description | Typical destinations |
|---|---|---|
| `"source"` | Source code for the artifact's implementation. | File or directory URLs in any hosted code repository. |
| `"design"` | Design file, node, or variable associated with the artifact. | URLs to files, frames, or variables in any design tool. |
| `"storybook"` | Interactive component documentation or demo. | Storybook story or docs page URLs, or compatible interactive demo tools. |
| `"documentation"` | External documentation page for the artifact. | Documentation platform URLs or custom doc site pages. |
| `"package"` | Published package containing the artifact. | Package registry URLs (npm, PyPI, Maven, CocoaPods, etc.). |
| `"repository"` | The top-level repository containing the artifact's source. | Repository root URLs in any hosted code platform. |

Design systems _MAY_ use additional custom `type` values beyond those listed above. Custom values _SHOULD_ be lowercase strings matching the pattern `^[a-z][a-z0-9-]*$`.

Tools _MUST NOT_ reject a link because its `type` is not in the standard list. Unknown types _MUST_ be preserved.

### 12.3 Multiple Links of the Same Type

An artifact _MAY_ have multiple links with the same `type`. This is common when a component has separate source files for different frameworks, or when a design artifact spans multiple files in a design tool.

When multiple links share a `type`, the `label` property _SHOULD_ be provided to distinguish them.

### 12.4 Example

```json
{
  "links": [
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/packages/components/src/button/button.tsx",
      "label": "React component source"
    },
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/packages/web-components/src/button/button.ts",
      "label": "Web component source"
    },
    {
      "type": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
      "label": "Design file — component"
    },
    {
      "type": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=5678:9012",
      "label": "Design file — variants"
    },
    {
      "type": "storybook",
      "url": "https://storybook.acme.com/?path=/docs/components-button--docs",
      "label": "Storybook docs"
    },
    {
      "type": "storybook",
      "url": "https://storybook.acme.com/?path=/story/components-button--primary",
      "label": "Primary variant story"
    },
    {
      "type": "package",
      "url": "https://www.npmjs.com/package/@acme/components",
      "label": "npm package"
    }
  ]
}
```

### 12.5 Links vs. Extensions

Links are a first-class property because source code, design files, and interactive demos are universal to design system documentation — not vendor-specific metadata. Data that is specific to a tool's internal representation (e.g., design tool component keys, Storybook story IDs, internal build hashes) _SHOULD_ remain in `$extensions`.

**Rule of thumb:** If the data is a URL that a human would click to navigate to a resource, it belongs in `links`. If the data is an internal identifier consumed programmatically by a specific tool, it belongs in `$extensions`.

---