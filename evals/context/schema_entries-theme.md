# ThemeEntry

A defined system theme.

Source: `entries/theme.schema.yaml`

## ThemeEntry {#entries-theme}

A defined system theme.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"theme"` | ✓ | Marks this entry as a theme. |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
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
| `colorScheme` | `"light"` \| `"dark"` |  | Which native color-scheme setting this theme matches. (Default: `"light"`) |
| `source` | [target](schema.md#common-ref-target) |  | The theme's DTCG source file (rel: source). No `rel`: this field says it. |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [target](schema.md#common-ref-target), [Markdown](schema.md#common-markdown), [dispatch](schema.md#sections-section-dispatch), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions)

**Example:**

```yaml
id: dark
kind: theme
name: Dark
description: Inverted-luminance theme for low-light surfaces and user preference. Lets a product opt into a dark color scheme without redefining every token.
metadata: {status: {status: stable}}
extends:
  - to: light
refs:
  - href: https://www.figma.com/file/acme-dark-theme
    rel: design
sections:
  - kind: guidelines
    for: all
    items: [{statement: Test contrast against both themes before shipping., level: should}]
$extensions:
  com.acme: {...}
source: tokens/dark.tokens.json
colorScheme: dark
```
