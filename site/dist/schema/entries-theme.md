# ThemeEntry

A defined system theme.

Source: `entries/theme.schema.yaml`

## ThemeEntry {#themeentry}

A defined system theme.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"theme"` | ✓ | Marks this entry as a theme. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  |  |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |
| `source` | [Ref](schema.md#common-ref) |  | Path to the theme's DTCG source file. |
| `colorScheme` | `"light"` \| `"dark"` |  | Which native color-scheme setting this theme matches. (Default: `"light"`) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [Ref](schema.md#common-ref), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)
