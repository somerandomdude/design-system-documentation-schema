# Entry

The structure every entry kind shares: `id`, `kind`, `name`, `description` (required), plus `metadata`, `sections`, `uses`, `extends`, `alternatives`, `refs`, `$extensions` (optional). This schema doubles as a general-use entry that isn't explicitly defined in the schema (ex: pattern, foundation, guideline). See schema/entries/ for each kind's own closing file.

Source: `entries/entry.schema.yaml`

**2 definitions** in this file: `Entry`, `dispatch`

## Entry {#entries-entry}

The structure every entry kind shares: `id`, `kind`, `name`, `description` (required), plus `metadata`, `sections`, `uses`, `extends`, `alternatives`, `refs`, `$extensions` (optional). This schema doubles as a general-use entry that isn't explicitly defined in the schema (ex: pattern, foundation, guideline). See schema/entries/ for each kind's own closing file.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"system"` \| `"token"` \| `"theme"` \| `"component"` \| `"entry"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of thing this entry is, as a real design-system artifact: one of the 5 well-known kinds, or a namespaced custom kind. |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | [Markdown](schema.md#common-markdown) | ✓ | What this entry is, and why it exists. Lead with what it is, in one sentence. |
| `uuid` | string |  | A stable machine identifier for this entry, independent of its `id` and `name`. It SHOULD NOT change once published. (Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`) |
| `metadata` | [EntryMetadata](schema.md#metadata-entry-metadata) |  | Information about a single entry, on top of the fields every metadata object shares. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `uses` | [targets](schema.md#common-ref-targets) |  | Entries this one is built from, needs, or follows (uses). No `rel`: this field says it. |
| `extends` | [targets](schema.md#common-ref-targets) |  | The entry this one inherits from (extends). No `rel`: this field says it. |
| `alternatives` | [targets](schema.md#common-ref-targets) |  | Entries to use instead of this one, in some situation (alternative-to). No `rel`: this field says it. |
| `refs` | [list](schema.md#common-ref-list) |  | Every other pointer from this entry, to entries and outside resources, each with its own `rel`. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. Each top-level key MUST be a dotted namespace, like `com.acme`, matching the Design Tokens Community Group's own `$extensions` convention. |

**References:** [Id](schema.md#common-id), [namespaced](schema.md#common-id-namespaced), [Markdown](schema.md#common-markdown), [EntryMetadata](schema.md#metadata-entry-metadata), [dispatch](schema.md#sections-section-dispatch), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions), [ComponentEntry](schema.md#entries-component), [TokenEntry](schema.md#entries-token), [ThemeEntry](schema.md#entries-theme), [SystemEntry](schema.md#entries-system), [Entry](schema.md#entries-entry)

**Example:**

```yaml
id: empty-state
kind: entry
name: Empty State
description: Composition of components shown when a view has no content to display yet. Tells the user why an area is empty and what to do next.
metadata:
  status: {status: stable}
uses:
  - to: button
extends:
  - to: base-dialog
alternatives:
  - to: error-state
refs:
  - href: https://github.com/acme/ds/tree/main/patterns/empty-state
    rel: source
sections:
  - kind: guidelines
    for: all
    items:
      - statement: Use an empty state the first time a list or grid has no content.
        level: should
$extensions:
  com.acme: {...}
```

## dispatch {#entries-entry-dispatch}

Routes an entry to its own kind-specific schema by `kind` (`system`, `component`, `token`, `theme`), falling back to this open base for the generic `entry` kind or a namespaced custom kind.

**References:** [ComponentEntry](schema.md#entries-component), [TokenEntry](schema.md#entries-token), [ThemeEntry](schema.md#entries-theme), [SystemEntry](schema.md#entries-system), [Entry](schema.md#entries-entry)

**Example:**

```yaml
- id: empty-state
  kind: entry
  name: Empty State
  description: Composition of components shown when a view has no content yet.
- id: button
  kind: component
  ...
```
