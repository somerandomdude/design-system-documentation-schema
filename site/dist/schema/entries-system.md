# SystemEntry

A DSDS design system. System-level information and guidance for the design system as a whole.

Source: `entries/system.schema.yaml`

## SystemEntry {#systementry}

A DSDS design system. System-level information and guidance for the design system as a whole.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"system"` | ✓ | Marks this entry as a design system. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  | Facts about the design system as a whole. |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [SystemMetadata](schema.md#metadata-system-metadata), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)
