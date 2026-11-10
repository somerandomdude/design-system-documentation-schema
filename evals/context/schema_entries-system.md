# SystemEntry

A DSDS design system. System-level information and guidance for the design system as a whole.

Source: `entries/system.schema.yaml`

## SystemEntry {#entries-system}

A DSDS design system. System-level information and guidance for the design system as a whole.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"system"` | ✓ | Marks this entry as a design system. |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | [Markdown](schema.md#common-markdown) | ✓ | What this entry is, and why it exists. Lead with what it is, in one sentence. |
| `uuid` | string |  | A stable machine identifier for this entry, independent of its `id` and `name`. It SHOULD NOT change once published. (Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`) |
| `metadata` | object |  | Facts about the design system as a whole. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `uses` | [targets](schema.md#common-ref-targets) |  | Entries this one is built from, needs, or follows (uses). No `rel`: this field says it. |
| `extends` | [targets](schema.md#common-ref-targets) |  | The entry this one inherits from (extends). No `rel`: this field says it. |
| `alternatives` | [targets](schema.md#common-ref-targets) |  | Entries to use instead of this one, in some situation (alternative-to). No `rel`: this field says it. |
| `refs` | [list](schema.md#common-ref-list) |  | Every other pointer from this entry, to entries and outside resources, each with its own `rel`. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. Each top-level key MUST be a dotted namespace, like `com.acme`, matching the Design Tokens Community Group's own `$extensions` convention. |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [SystemMetadata](schema.md#metadata-system-metadata), [Markdown](schema.md#common-markdown), [dispatch](schema.md#sections-section-dispatch), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions)

**Example:**

```yaml
id: acme-design-system
kind: system
name: Acme Design System
description: Acme's cross-platform design system. One source of truth for how Acme builds and documents interfaces.
metadata:
  version: 1.4.0
  organization: Acme Corp
  url: https://design.acme.example
  license: MIT
  platforms: [react, web-component]
  status: {status: stable}
extends: [{to: base-design-system}]
uses: [{to: button}]
refs: [{to: acme-brand-system, rel: relates-to}]
sections:
  - kind: section
    for: all
    title: Getting started
    freeform: [{title: Install, body: Add the package and its peer dependencies.}]
$extensions:
  com.acme: {...}
```
