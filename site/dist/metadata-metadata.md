# Entity metadata

The metadata object every entity type accepts. Each field has its own schema file in this directory (status, since, last-updated, category, tags, aliases, summary, thumbnail, preview, links, governance, doc-origin); `extends` points at the shared entityExtends definition. Every field is optional, and each can appear only once. Simple fields are either a value or array ('since': '1.0.0', 'tags': [...]); status, lastUpdated, and docOrigin take a short string for the common case or an object for more detail.

Source: `metadata/metadata.schema.json`

## entityMetadata {#entitymetadata}

Optional metadata for an entity. Include only needed: lifecycle (status, since, lastUpdated), classification (category, tags, aliases), compact display (summary, thumbnail, preview), inheritance (extends), links (links), and who's accountable plus how the docs were made (governance, docOrigin).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `status` | [status](metadata-status.md#status) |  |  |
| `since` | [since](metadata-since.md#since) |  |  |
| `lastUpdated` | [lastUpdated](metadata-last-updated.md#lastupdated) |  |  |
| `category` | [category](metadata-category.md#category) |  |  |
| `tags` | [tags](metadata-tags.md#tags) |  |  |
| `aliases` | [aliases](metadata-aliases.md#aliases) |  |  |
| `summary` | [summary](metadata-summary.md#summary) |  |  |
| `thumbnail` | [thumbnail](metadata-thumbnail.md#thumbnail) |  |  |
| `preview` | [preview](metadata-preview.md#preview) |  |  |
| `extends` | [entityExtends](common-extends.md#entityextends) |  |  |
| `links` | [links](metadata-links.md#links) |  |  |
| `governance` | [governance](metadata-governance.md#governance) |  |  |
| `docOrigin` | [docOrigin](metadata-doc-origin.md#docorigin) |  |  |

**References:** [status](metadata-status.md#status), [since](metadata-since.md#since), [lastUpdated](metadata-last-updated.md#lastupdated), [category](metadata-category.md#category), [tags](metadata-tags.md#tags), [aliases](metadata-aliases.md#aliases), [summary](metadata-summary.md#summary), [thumbnail](metadata-thumbnail.md#thumbnail), [preview](metadata-preview.md#preview), [entityExtends](common-extends.md#entityextends), [links](metadata-links.md#links), [governance](metadata-governance.md#governance), [docOrigin](metadata-doc-origin.md#docorigin)

**Example:**

```json
[
  {
    "status": "stable",
    "since": "1.0.0",
    "lastUpdated": "2026-05-28",
    "category": "action",
    "tags": [
      "action",
      "interactive",
      "form",
      "cta",
      "submit"
    ],
    "summary": "Triggers an action or submits a form. The primary interactive element of the Acme Design System."
  },
  {
    "status": {
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
      }
    },
    "since": "1.0.0",
    "lastUpdated": {
      "date": "2026-05-28",
      "note": "Added focus-visible guidance and refreshed contrast requirements for inverse surfaces."
    },
    "aliases": [
      "btn",
      "cta",
      "action-button"
    ],
    "thumbnail": {
      "url": "https://design.acme.com/assets/thumbnails/button.png",
      "alt": "A primary button labeled 'Save changes'."
    },
    "preview": {
      "kind": "url",
      "url": "https://storybook.acme.com/?path=/story/components-button--primary"
    },
    "links": [
      {
        "kind": "source",
        "url": "https://code.acme.com/design-system/src/components/button/button.tsx",
        "label": "React component source"
      },
      {
        "kind": "design",
        "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
        "label": "Design file — Button variants"
      }
    ],
    "governance": {
      "owner": {
        "name": "@acme/design-system",
        "contact": "design-system@acme.com"
      },
      "lastReviewed": {
        "date": "2026-06-12",
        "reviewedAgainst": "@acme/ui@3.1.0"
      }
    },
    "docOrigin": {
      "overall": "authored",
      "authorship": "ai-assisted",
      "blocks": {
        "api": "generated"
      }
    }
  },
  {
    "status": {
      "overall": "deprecated",
      "deprecationNotice": "The legacy Button is deprecated as of 3.0.0. Use Button from @acme/components instead. See the migration guide at https://design.acme.com/migrations/button-v3."
    }
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/metadata.schema.json",
  "title": "Entity metadata",
  "description": "The metadata object every entity type accepts. Each field has its own schema file in this directory (status, since, last-updated, category, tags, aliases, summary, thumbnail, preview, links, governance, doc-origin); `extends` points at the shared entityExtends definition. Every field is optional, and each can appear only once. Simple fields are either a value or array ('since': '1.0.0', 'tags': [...]); status, lastUpdated, and docOrigin take a short string for the common case or an object for more detail.",
  "$defs": {
    "entityMetadata": {
      "type": "object",
      "description": "Optional metadata for an entity. Include only needed: lifecycle (status, since, lastUpdated), classification (category, tags, aliases), compact display (summary, thumbnail, preview), inheritance (extends), links (links), and who's accountable plus how the docs were made (governance, docOrigin).",
      "properties": {
        "status": {
          "$ref": "status.schema.json#/$defs/status"
        },
        "since": {
          "$ref": "since.schema.json#/$defs/since"
        },
        "lastUpdated": {
          "$ref": "last-updated.schema.json#/$defs/lastUpdated"
        },
        "category": {
          "$ref": "category.schema.json#/$defs/category"
        },
        "tags": {
          "$ref": "tags.schema.json#/$defs/tags"
        },
        "aliases": {
          "$ref": "aliases.schema.json#/$defs/aliases"
        },
        "summary": {
          "$ref": "summary.schema.json#/$defs/summary"
        },
        "thumbnail": {
          "$ref": "thumbnail.schema.json#/$defs/thumbnail"
        },
        "preview": {
          "$ref": "preview.schema.json#/$defs/preview"
        },
        "extends": {
          "$ref": "../common/extends.schema.json#/$defs/entityExtends"
        },
        "links": {
          "$ref": "links.schema.json#/$defs/links"
        },
        "governance": {
          "$ref": "governance.schema.json#/$defs/governance"
        },
        "docOrigin": {
          "$ref": "doc-origin.schema.json#/$defs/docOrigin"
        }
      },
      "additionalProperties": false,
      "minProperties": 1
    }
  }
}
```
