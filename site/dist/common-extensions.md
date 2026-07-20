# Extensions

Vendor-specific extensions. An open object for tool metadata outside the core schema. Keys MUST use vendor namespaces.

Source: `common/extensions.schema.json`

## extensions {#extensions}

All vendor-specific extensions . Keys MUST use a namespace of at least two dot-separated segments (reverse domain recommended), Example: 'com.figma', 'acme.tooling'; the pattern is case-tolerant. Tools that don't recognize an extension MUST keep it. Extension data SHOULD NOT duplicate core schema fields.

**Example:**

```json
{
  "com.figma": {
    "componentId": "abc123def456",
    "variableCollectionId": "VariableCollectionId:1234:5678"
  },
  "com.storybook": {
    "storyId": "components-button--primary"
  },
  "com.internal": {
    "teamOwner": "design-systems",
    "jiraProject": "DS",
    "lastAuditDate": "2024-11-15"
  }
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/extensions.schema.json",
  "title": "Extensions",
  "description": "Vendor-specific extensions. An open object for tool metadata outside the core schema. Keys MUST use vendor namespaces.",
  "$defs": {
    "extensions": {
      "type": "object",
      "description": "All vendor-specific extensions . Keys MUST use a namespace of at least two dot-separated segments (reverse domain recommended), Example: 'com.figma', 'acme.tooling'; the pattern is case-tolerant. Tools that don't recognize an extension MUST keep it. Extension data SHOULD NOT duplicate core schema fields.",
      "propertyNames": {
        "pattern": "^[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)+$"
      },
      "additionalProperties": true
    }
  }
}
```
