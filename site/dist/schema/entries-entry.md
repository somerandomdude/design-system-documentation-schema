# Entry

The structure every entry kind shares: `id`, `kind`, `name`, `description` (required), plus `purpose`, `metadata`, `related`, `extends`, `refs`, `sections`, `$extensions` (optional). This schema doubles as a general-use entry that isn't explicitly defined in the schema (ex: pattern, foundation, guideline). See schema/entries/ for each kind's own closing file.

Source: `entries/entry.schema.yaml`

**2 definitions** in this file: `Entry`, `dispatch`

## Entry {#entry}

The structure every entry kind shares: `id`, `kind`, `name`, `description` (required), plus `purpose`, `metadata`, `related`, `extends`, `refs`, `sections`, `$extensions` (optional). This schema doubles as a general-use entry that isn't explicitly defined in the schema (ex: pattern, foundation, guideline). See schema/entries/ for each kind's own closing file.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"system"` \| `"component"` \| `"token"` \| `"theme"` \| `"entry"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of thing this entry is, as a real design-system artifact: one of the 5 well-known kinds, or a namespaced custom kind. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | [EntryMetadata](schema.md#metadata-entry-metadata) |  | Information about a single entry, on top of the fields every metadata object shares. |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |

**References:** [namespaced](schema.md#common-id-namespaced), [EntryMetadata](schema.md#metadata-entry-metadata), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions), [ComponentEntry](schema.md#entries-component), [TokenEntry](schema.md#entries-token), [ThemeEntry](schema.md#entries-theme), [SystemEntry](schema.md#entries-system), [Entry](schema.md#entries-entry)

## dispatch {#dispatch}

Routes an entry to its own kind-specific schema by `kind` (`system`, `component`, `token`, `theme`), falling back to this open base for the generic `entry` kind or a namespaced custom kind.

**References:** [ComponentEntry](schema.md#entries-component), [TokenEntry](schema.md#entries-token), [ThemeEntry](schema.md#entries-theme), [SystemEntry](schema.md#entries-system), [Entry](schema.md#entries-entry)
