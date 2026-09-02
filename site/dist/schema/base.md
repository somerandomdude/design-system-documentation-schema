# Base

A DSDS document. Acts as the container for all content. Can be optionally extended or split across other DSDS documents.

Source: `base.schema.yaml`

## Base {#base}

A DSDS document. Acts as the container for all content. Can be optionally extended or split across other DSDS documents.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `schemaVersion` | string | ✓ | The version of this spec the document follows. |
| `name` | string | ✓ | The name of the design system this document describes. |
| `entries` | [dispatch](schema.md#entries-entry-dispatch)[] | ✓ | Every entry this document owns, listed directly. (Min items: 1) |
| `$schema` | string (uri-reference) |  | An optional hint for editor tools, like autocomplete or validate-on-save. |
| `shared` | [Shared](schema.md#shared)[] |  | Reusable content that is not itself a design system artifact, for example an accessibility rule or a guideline that applies broadly. (Min items: 1) |
| `refs` | [list](schema.md#common-ref-list) |  | The same pointer type entries use. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool-specific document-level data, keyed by namespace. |

**References:** [dispatch](schema.md#entries-entry-dispatch), [Shared](schema.md#shared), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions)
