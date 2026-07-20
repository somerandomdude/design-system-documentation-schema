# System info definition

The identity of the design system. Includes name, version, organization, URL, and license. Separate from the per-entity `metadata`.

Source: `common/system-info.schema.json`

## systemInfo {#systeminfo}

Identity of the design system.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✓ | Human-readable name of the design system (ex: 'Acme Design System'). Not a package name — those belong in `extends.system` or platform imports. |
| `version` | string |  | Version this documentation describes (ex: '2.3.0'). SHOULD follow semver so tools can compare it against `extends.version` and `reviewedAgainst`. |
| `organization` | string |  | The organization that maintains the system. |
| `url` | string (uri) |  | URL to the system's documentation site. |
| `license` | string |  | License as an SPDX identifier (ex: 'MIT', 'Apache-2.0') or a URL to the license text. |

**Example:**

```json
{
  "organization": "Acme Corp",
  "url": "https://design.acme.com",
  "license": "MIT",
  "name": "Acme Design System",
  "version": "2.4.0"
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/system-info.schema.json",
  "title": "System info definition",
  "description": "The identity of the design system. Includes name, version, organization, URL, and license. Separate from the per-entity `metadata`.",
  "$defs": {
    "systemInfo": {
      "type": "object",
      "description": "Identity of the design system.",
      "required": [
        "name"
      ],
      "properties": {
        "name": {
          "type": "string",
          "description": "Human-readable name of the design system (ex: 'Acme Design System'). Not a package name — those belong in `extends.system` or platform imports."
        },
        "version": {
          "type": "string",
          "description": "Version this documentation describes (ex: '2.3.0'). SHOULD follow semver so tools can compare it against `extends.version` and `reviewedAgainst`."
        },
        "organization": {
          "type": "string",
          "description": "The organization that maintains the system."
        },
        "url": {
          "type": "string",
          "format": "uri",
          "description": "URL to the system's documentation site."
        },
        "license": {
          "type": "string",
          "description": "License as an SPDX identifier (ex: 'MIT', 'Apache-2.0') or a URL to the license text."
        }
      },
      "additionalProperties": false
    }
  }
}
```
