# TokenEntry

A single design token, from the Design Tokens Community Group (DTCG) format.

Source: `entries/token.schema.yaml`

## TokenEntry {#entries-token}

A single design token, from the Design Tokens Community Group (DTCG) format.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"token"` | ✓ | Marks this entry as a token. |
| `id` | [tokenId](schema.md#common-id-tokenid) | ✓ | This token's unique id. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | [Markdown](schema.md#common-markdown) | ✓ | What this entry is, and why it exists. Lead with what it is, in one sentence. |
| `uuid` | string |  | A stable machine identifier for this entry, independent of its `id` and `name`. It SHOULD NOT change once published. (Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`) |
| `metadata` | object |  |  |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `uses` | [targets](schema.md#common-ref-targets) |  | Entries this one is built from, needs, or follows (uses). No `rel`: this field says it. |
| `extends` | [targets](schema.md#common-ref-targets) |  | The entry this one inherits from (extends). No `rel`: this field says it. |
| `alternatives` | [targets](schema.md#common-ref-targets) |  | Entries to use instead of this one, in some situation (alternative-to). No `rel`: this field says it. |
| `refs` | [list](schema.md#common-ref-list) |  | Every other pointer from this entry, to entries and outside resources, each with its own `rel`. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. Each top-level key MUST be a dotted namespace, like `com.acme`, matching the Design Tokens Community Group's own `$extensions` convention. |
| `tokenType` | string |  | The token's type, from DTCG. (Pattern: `^[a-z][a-zA-Z0-9]*$`) |
| `source` | [target](schema.md#common-ref-target) |  | The token's DTCG source file (rel: source). No `rel`: this field says it. |
| `combos` | [Combo](schema.md#common-combo)[] |  | Rules about which other tokens this one must or must never be paired with. (Min items: 1) |

**References:** [Entry](schema.md#entries-entry), [tokenId](schema.md#common-id-tokenid), [EntryMetadata](schema.md#metadata-entry-metadata), [target](schema.md#common-ref-target), [Combo](schema.md#common-combo), [Markdown](schema.md#common-markdown), [dispatch](schema.md#sections-section-dispatch), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions)

**Example:**

```yaml
id: space-4
kind: token
name: Space 4
description: A single step on the base spacing scale - 4 times the 4px base unit. Keeps spacing consistent across components without hand-picked pixel values.
metadata: {status: {status: stable}, group: space}
extends: [{to: space-base}]
alternatives: [{to: space-8}]
refs: [{href: https://www.figma.com/file/acme-spacing-scale, rel: design}]
sections:
  - kind: guidelines
    for: all
    items: [{statement: Use for default padding/gap; use space-8 for section spacing., level: should}]
$extensions:
  com.acme: {...}
tokenType: spacing
source: ./tokens.dtcg.json
combos:
  - subject: "{color.action.primary}"
    level: must
    items: ["{color.surface.default}", "{color.surface.raised}"]
```
