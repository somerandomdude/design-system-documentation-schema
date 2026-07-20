# Entity reference definitions

References to other entities. `entityRef` is the standalone reference object; the `entityIdentifier` and `entityRole` defs are shared by `relationship`, use-case alternatives, and token overrides. Every identifier MUST match a documented entity. (Links, by contrast, address external resources by URL.)

Source: `common/entity-ref.schema.json`

**3 definitions** in this file: `entityRef`, `entityIdentifier`, `entityRole`

## entityRef {#entityref}

A reference to another entity by `identifier`, with an optional `role`. Use when a field in the schema points to a DSDS entity. Use `link` for external URLs.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | [entityIdentifier](common-entity-ref.md#entityidentifier) | ✓ |  |
| `role` | [entityRole](common-entity-ref.md#entityrole) |  |  |

**References:** [entityIdentifier](common-entity-ref.md#entityidentifier), [entityRole](common-entity-ref.md#entityrole)

**Example:**

```json
[
  {
    "identifier": "text-input",
    "role": "Carries the inline error"
  },
  {
    "identifier": "button"
  }
]
```

## entityIdentifier {#entityidentifier}

Identifier of a documented DSDS entity (ex: 'button', 'color-text-primary'). MUST match that entity's `identifier`. Tools SHOULD resolve it to build cross-references.

## entityRole {#entityrole}

What the referenced entity does here (ex: 'Displays the inline error'). The association is generic when `entityRole` isn't defined.

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/entity-ref.schema.json",
  "title": "Entity reference definitions",
  "description": "References to other entities. `entityRef` is the standalone reference object; the `entityIdentifier` and `entityRole` defs are shared by `relationship`, use-case alternatives, and token overrides. Every identifier MUST match a documented entity. (Links, by contrast, address external resources by URL.)",
  "$defs": {
    "entityIdentifier": {
      "type": "string",
      "description": "Identifier of a documented DSDS entity (ex: 'button', 'color-text-primary'). MUST match that entity's `identifier`. Tools SHOULD resolve it to build cross-references.",
      "minLength": 1
    },
    "entityRole": {
      "type": "string",
      "description": "What the referenced entity does here (ex: 'Displays the inline error'). The association is generic when `entityRole` isn't defined."
    },
    "entityRef": {
      "type": "object",
      "description": "A reference to another entity by `identifier`, with an optional `role`. Use when a field in the schema points to a DSDS entity. Use `link` for external URLs.",
      "required": [
        "identifier"
      ],
      "properties": {
        "identifier": {
          "$ref": "#/$defs/entityIdentifier"
        },
        "role": {
          "$ref": "#/$defs/entityRole"
        }
      },
      "additionalProperties": false
    }
  }
}
```
