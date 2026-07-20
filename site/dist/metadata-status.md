# Status metadata field

Lifecycle status of an entity. A bare string sets the overall status. The object form adds per-platform readiness, an optional explanatory note, and a deprecation notice.

Source: `metadata/status.schema.json`

## status {#status}

Lifecycle status of the entity. A bare string sets the overall status (ex: 'stable', 'beta') and covers the common case. Use the object form to add per-platform readiness, an explanatory note, or a deprecation notice. A deprecated entity MUST use the object form, because deprecation needs a deprecationNotice that says what to use instead.

One of:

- [statusValue](common-status.md#statusvalue)
- **object** — The full form: overall status, optional per-platform readiness, and a deprecation notice when needed. An entity MAY be 'stable' overall while some platforms are still 'experimental' or 'draft'.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `overall` | [statusValue](common-status.md#statusvalue) | ✓ | The entity's overall status. Status is an editorial call on maturity that doesn't have to match its most or least advanced platform. Tools SHOULD show this as the main status indicator. |
| `note` | [plainNote](common-dated-note.md#plainnote) |  | Optional plain-text note explaining what this status represents for the entity. Includes the reasoning behind it, its scope, or any caveats (ex: 'Stable on web; the API is frozen and changes follow semver. Mobile parity is still in progress.'). Separate from deprecationNotice, which covers only the deprecated case. Tools MAY surface this alongside the status indicator. |
| `platforms` | map<string, [platformStatus](common-status.md#platformstatus)> |  | Per-platform readiness. Keys are platform identifiers (freeform strings; common values include 'react', 'web-component', 'ios', 'android', 'flutter', 'figma', 'sketch', 'compose'). Values describe the entity's status on that platform. |
| `deprecationNotice` | [deprecationNotice](common-status.md#deprecationnotice) |  | Required when overall status is 'deprecated'. MUST say what to use instead (non-empty) and give a migration path. Tools SHOULD display this prominently next to the status indicator. |

**References:** [statusValue](common-status.md#statusvalue), [plainNote](common-dated-note.md#plainnote), [platformStatus](common-status.md#platformstatus), [deprecationNotice](common-status.md#deprecationnotice)

**Example:**

```json
[
  "stable",
  {
    "overall": "stable",
    "platforms": {
      "react": {
        "status": "stable",
        "since": "1.0.0"
      },
      "android": {
        "status": "experimental",
        "since": "3.0.0",
        "note": "Compose implementation available in preview. API may change before v4."
      },
      "figma": {
        "status": "stable",
        "since": "1.0.0"
      }
    },
    "note": "Stable on web; the API is frozen and changes follow semver. Mobile parity is still in progress."
  },
  {
    "overall": "deprecated",
    "deprecationNotice": "The legacy Button is deprecated as of 3.0.0. Use Button from @acme/components instead. See the migration guide at https://design.acme.com/migrations/button-v3.",
    "platforms": {
      "react": {
        "status": "deprecated",
        "since": "3.0.0",
        "deprecationNotice": "Use Button from @acme/components instead."
      }
    }
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/status.schema.json",
  "title": "Status metadata field",
  "description": "Lifecycle status of an entity. A bare string sets the overall status. The object form adds per-platform readiness, an optional explanatory note, and a deprecation notice.",
  "$defs": {
    "status": {
      "description": "Lifecycle status of the entity. A bare string sets the overall status (ex: 'stable', 'beta') and covers the common case. Use the object form to add per-platform readiness, an explanatory note, or a deprecation notice. A deprecated entity MUST use the object form, because deprecation needs a deprecationNotice that says what to use instead.",
      "oneOf": [
        {
          "$ref": "../common/status.schema.json#/$defs/statusValue",
          "not": {
            "const": "deprecated"
          }
        },
        {
          "type": "object",
          "description": "The full form: overall status, optional per-platform readiness, and a deprecation notice when needed. An entity MAY be 'stable' overall while some platforms are still 'experimental' or 'draft'.",
          "required": [
            "overall"
          ],
          "properties": {
            "overall": {
              "$ref": "../common/status.schema.json#/$defs/statusValue",
              "description": "The entity's overall status. Status is an editorial call on maturity that doesn't have to match its most or least advanced platform. Tools SHOULD show this as the main status indicator."
            },
            "note": {
              "$ref": "../common/dated-note.schema.json#/$defs/plainNote",
              "description": "Optional plain-text note explaining what this status represents for the entity. Includes the reasoning behind it, its scope, or any caveats (ex: 'Stable on web; the API is frozen and changes follow semver. Mobile parity is still in progress.'). Separate from deprecationNotice, which covers only the deprecated case. Tools MAY surface this alongside the status indicator."
            },
            "platforms": {
              "type": "object",
              "description": "Per-platform readiness. Keys are platform identifiers (freeform strings; common values include 'react', 'web-component', 'ios', 'android', 'flutter', 'figma', 'sketch', 'compose'). Values describe the entity's status on that platform.",
              "additionalProperties": {
                "$ref": "../common/status.schema.json#/$defs/platformStatus"
              },
              "minProperties": 1,
              "propertyNames": {
                "pattern": "^[a-z][a-z0-9-]*$"
              }
            },
            "deprecationNotice": {
              "$ref": "../common/status.schema.json#/$defs/deprecationNotice",
              "description": "Required when overall status is 'deprecated'. MUST say what to use instead (non-empty) and give a migration path. Tools SHOULD display this prominently next to the status indicator."
            }
          },
          "if": {
            "properties": {
              "overall": {
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
      ]
    }
  }
}
```
