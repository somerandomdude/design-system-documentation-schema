# Extends definitions

Declares inheritance between DSDS documents and between entities, for a system inheriting from a parent system.

Source: `common/extends.schema.json`

**2 definitions** in this file: `documentExtends`, `entityExtends`

## documentExtends {#documentextends}

Declares that this document inherits from another DSDS document. The parent document supplies core entities; this document adds to or extends them. The declaration sets up the relationship; consuming tools handle merge and resolution.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `system` | string | ✓ | Name or package identifier of the base system (ex: 'Acme Core Design System', '@acme/design-system'), not a URL. Tools use it to resolve the base system. |
| `url` | string (uri-reference) |  | URL or relative path to the base DSDS document (ex: './core.dsds.json'). Relative paths resolve against this document. Tools MAY fetch it for merge, validation, or docs. |
| `version` | string |  | The parent system version this document extends (ex: '2.0.0', '^3.1.0'), as semver. When omitted, tools SHOULD use the latest. |
| `description` | [richText](common-rich-text.md#richtext) |  | What this extension adds, changes, or narrows relative to the parent. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
{
  "system": "acme-core",
  "url": "https://design.acme.com/v2/core.dsds.json",
  "version": "^2.0.0",
  "description": "Extends the Acme Core Design System with product-specific components, themes, and patterns used by the Acme Cloud Console."
}
```

## entityExtends {#entityextends}

Declares that this entity inherits from a parent entity in a parent system. The parent entity supplies the core definition (anatomy, API, variants, states, guidelines); this entity adds or overrides on top.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | Identifier of the parent entity (ex: 'button', 'color-text-primary'). MUST match the base entity's `identifier` in the parent system. |
| `system` | string |  | System that owns the parent entity. When omitted, resolves from the root document's `extends`; set it to extend a different system. |
| `url` | string (uri-reference) |  | URL or relative path to the parent entity's docs or definition, for cross-linking. |
| `version` | string |  | Version of the parent entity or system (ex: '2.0.0'). When omitted, inherits from the document-level `extends`. |
| `description` | [richText](common-rich-text.md#richtext) |  | What this entity adds or changes relative to the parent: new variants, more props, overridden guidelines, etc. |
| `modifications` | object {changeType, target, description}[] |  | Summary of changes relative to the parent, one entry per change. Tools MAY use them for changelogs, diffs, or migration guides; when omitted, tools must diff the entities. |

**References:** [richText](common-rich-text.md#richtext)

**Example:**

```json
{
  "identifier": "button",
  "system": "acme-core",
  "url": "https://design.acme.com/v2/components/button",
  "version": "2.0.0",
  "description": "Adds the **enterprise** variant for Acme Cloud Console workflows and tightens the minimum touch target for compliance with our internal accessibility audit.",
  "modifications": [
    {
      "changeType": "added",
      "target": "variant:enterprise",
      "description": "New `enterprise` variant with a heavier visual weight, used inside the Cloud Console primary surface."
    },
    {
      "changeType": "modified",
      "target": "prop:size",
      "description": "Default size is `medium` (was `small` in the base entity). The `small` size remains available."
    },
    {
      "changeType": "modified",
      "target": "guideline:accessibility",
      "description": "Minimum touch target raised to 44px in all viewports (base requires 44px on mobile only)."
    },
    {
      "changeType": "removed",
      "target": "variant:ghost",
      "description": "The `ghost` variant from the base entity is not exposed in this system. Use `tertiary` instead."
    },
    {
      "changeType": "inherited",
      "target": "anatomy",
      "description": "Anatomy is inherited unchanged from the base Button."
    }
  ]
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/extends.schema.json",
  "title": "Extends definitions",
  "description": "Declares inheritance between DSDS documents and between entities, for a system inheriting from a parent system.",
  "$defs": {
    "documentExtends": {
      "type": "object",
      "description": "Declares that this document inherits from another DSDS document. The parent document supplies core entities; this document adds to or extends them. The declaration sets up the relationship; consuming tools handle merge and resolution.",
      "required": [
        "system"
      ],
      "properties": {
        "system": {
          "type": "string",
          "description": "Name or package identifier of the base system (ex: 'Acme Core Design System', '@acme/design-system'), not a URL. Tools use it to resolve the base system."
        },
        "url": {
          "type": "string",
          "format": "uri-reference",
          "description": "URL or relative path to the base DSDS document (ex: './core.dsds.json'). Relative paths resolve against this document. Tools MAY fetch it for merge, validation, or docs."
        },
        "version": {
          "type": "string",
          "description": "The parent system version this document extends (ex: '2.0.0', '^3.1.0'), as semver. When omitted, tools SHOULD use the latest."
        },
        "description": {
          "$ref": "rich-text.schema.json#/$defs/richText",
          "description": "What this extension adds, changes, or narrows relative to the parent."
        }
      },
      "additionalProperties": false
    },
    "entityExtends": {
      "type": "object",
      "description": "Declares that this entity inherits from a parent entity in a parent system. The parent entity supplies the core definition (anatomy, API, variants, states, guidelines); this entity adds or overrides on top.",
      "required": [
        "identifier"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "description": "Identifier of the parent entity (ex: 'button', 'color-text-primary'). MUST match the base entity's `identifier` in the parent system."
        },
        "system": {
          "type": "string",
          "description": "System that owns the parent entity. When omitted, resolves from the root document's `extends`; set it to extend a different system."
        },
        "url": {
          "type": "string",
          "format": "uri-reference",
          "description": "URL or relative path to the parent entity's docs or definition, for cross-linking."
        },
        "version": {
          "type": "string",
          "description": "Version of the parent entity or system (ex: '2.0.0'). When omitted, inherits from the document-level `extends`."
        },
        "description": {
          "$ref": "rich-text.schema.json#/$defs/richText",
          "description": "What this entity adds or changes relative to the parent: new variants, more props, overridden guidelines, etc."
        },
        "modifications": {
          "type": "array",
          "description": "Summary of changes relative to the parent, one entry per change. Tools MAY use them for changelogs, diffs, or migration guides; when omitted, tools must diff the entities.",
          "items": {
            "type": "object",
            "required": [
              "changeType",
              "description"
            ],
            "properties": {
              "changeType": {
                "type": "string",
                "enum": [
                  "added",
                  "modified",
                  "removed",
                  "inherited"
                ],
                "description": "The kind of change: 'added' (new here), 'modified' (changed from the base), 'removed' (dropped from the base), 'inherited' (carried over unchanged)."
              },
              "target": {
                "type": "string",
                "description": "What changed (ex: 'variant:enterprise', 'prop:theme', 'state:read-only')."
              },
              "description": {
                "$ref": "rich-text.schema.json#/$defs/richText",
                "description": "A short description of the change."
              }
            },
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false
    }
  }
}
```
