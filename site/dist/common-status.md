# Status definition

Shared status vocabulary. `statusValue` is the lifecycle string (draft, experimental, stable, deprecated, or custom). `platformStatus` captures one platform's readiness, and requires a `deprecationNotice` when that platform is deprecated.

Source: `common/status.schema.json`

**3 definitions** in this file: `platformStatus`, `statusValue`, `deprecationNotice`

## platformStatus {#platformstatus}

Readiness of an artifact on one platform: lifecycle stage, the version it landed in, and an optional deprecation notice.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `status` | [statusValue](common-status.md#statusvalue) | ✓ | Lifecycle status on this platform. Same vocabulary as overall status; custom values allowed. |
| `since` | string |  | The version this entity became available on this platform. |
| `deprecationNotice` | [deprecationNotice](common-status.md#deprecationnotice) |  | Required when status is 'deprecated'; says what to use instead on this platform. |
| `note` | [plainNote](common-dated-note.md#plainnote) |  | Free-text notes on this platform's status (ex: 'Web Component wrapper; native implementation planned for v4'). |

**Conditional:** When `status` is `"deprecated"`, then `deprecationNotice` is required.

**References:** [statusValue](common-status.md#statusvalue), [deprecationNotice](common-status.md#deprecationnotice), [plainNote](common-dated-note.md#plainnote)

**Example:**

```json
[
  {
    "status": "stable",
    "since": "1.0.0"
  },
  {
    "status": "experimental",
    "since": "3.2.0",
    "note": "Available as a Web Component wrapper. Native shadow DOM implementation planned for v4."
  },
  {
    "status": "draft",
    "note": "Compose implementation in progress. Expected in v4.0."
  },
  {
    "status": "deprecated",
    "since": "1.5.0",
    "deprecationNotice": "The Vue wrapper is deprecated. Use the Web Component directly in Vue applications."
  }
]
```

## statusValue {#statusvalue}

A lifecycle status value. MUST be lowercase kebab-case. Standard values: 'draft' (in development), 'experimental' (available; API may change), 'stable' (production-ready, semver), 'deprecated' (scheduled for removal). Custom values (ex: 'sunset', 'beta') are allowed and MUST follow the same pattern.

## deprecationNotice {#deprecationnotice}

A non-empty notice for a deprecated artifact. MUST say what to use instead and, where one exists, give a migration path.

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/status.schema.json",
  "title": "Status definition",
  "description": "Shared status vocabulary. `statusValue` is the lifecycle string (draft, experimental, stable, deprecated, or custom). `platformStatus` captures one platform's readiness, and requires a `deprecationNotice` when that platform is deprecated.",
  "$defs": {
    "statusValue": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "A lifecycle status value. MUST be lowercase kebab-case. Standard values: 'draft' (in development), 'experimental' (available; API may change), 'stable' (production-ready, semver), 'deprecated' (scheduled for removal). Custom values (ex: 'sunset', 'beta') are allowed and MUST follow the same pattern."
    },
    "deprecationNotice": {
      "type": "string",
      "minLength": 1,
      "description": "A non-empty notice for a deprecated artifact. MUST say what to use instead and, where one exists, give a migration path."
    },
    "platformStatus": {
      "type": "object",
      "description": "Readiness of an artifact on one platform: lifecycle stage, the version it landed in, and an optional deprecation notice.",
      "required": [
        "status"
      ],
      "properties": {
        "status": {
          "$ref": "#/$defs/statusValue",
          "description": "Lifecycle status on this platform. Same vocabulary as overall status; custom values allowed."
        },
        "since": {
          "type": "string",
          "description": "The version this entity became available on this platform."
        },
        "deprecationNotice": {
          "$ref": "#/$defs/deprecationNotice",
          "description": "Required when status is 'deprecated'; says what to use instead on this platform."
        },
        "note": {
          "$ref": "dated-note.schema.json#/$defs/plainNote",
          "description": "Free-text notes on this platform's status (ex: 'Web Component wrapper; native implementation planned for v4')."
        }
      },
      "if": {
        "properties": {
          "status": {
            "const": "deprecated"
          }
        }
      },
      "then": {
        "required": [
          "deprecationNotice"
        ]
      },
      "additionalProperties": false
    }
  }
}
```
