# ComponentEntry

A reusable UI element, like a button or a dialog.

Source: `entries/component.schema.yaml`

**3 definitions** in this file: `ComponentEntry`, `traitSetBy`, `traitValue`

## ComponentEntry {#componententry}

A reusable UI element, like a button or a dialog.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | ✓ | This entry's unique id in the design system graph. |
| `kind` | `"component"` | ✓ | Marks this entry as a component. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  |  |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |
| `sourceFiles` | object {platform, file}[] |  | One entry per platform's source file. (Min items: 1) |
| `specs` | [list](schema.md#common-ref-list) |  | Machine-readable API contract(s) for this component - props, slots, events, etc. in a standard, tool-readable shape. |
| `imports` | object {platform, code, package}[] |  | One entry per platform. (Min items: 1) |
| `traits` | object \| object[] |  | The component's variants and states. Each item is tagged `kind: boolean` or `kind: enum`, since the two carry genuinely different fields - an enum's own `values` list vs. a boolean's plain toggle. (Min items: 1) |
| `combos` | [Combo](schema.md#common-combo)[] |  | Define which of this component's own boolean traits or enum values can or cannot be paired with each other. (Min items: 1) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [Id](schema.md#common-id), [Ref](schema.md#common-ref), [list](schema.md#common-ref-list), [traitValue](schema.md#entries-component-traitvalue), [traitSetBy](schema.md#entries-component-traitsetby), [Combo](schema.md#common-combo), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [Since](schema.md#common-since), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

## traitSetBy {#traitsetby}

Whether this trait's value is passed in by the consumer, or set by the component itself.

Allowed values:

- `consumer`
- `component`

## traitValue {#traitvalue}

The shared properties of a boolean trait or one enum value - what it is, and what it's for.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [Id](schema.md#common-id) | ✓ | The machine-readable id. |
| `description` | [Markdown](schema.md#common-markdown) | ✓ | What this is, how it looks or behaves, and any constraints. |
| `name` | string |  | The human-readable name. Uses `id` when left out. |
| `purpose` | [Markdown](schema.md#common-markdown) |  | Why this exists. |
| `examples` | [list](schema.md#common-example-list) |  | Examples showing this in context. |
| `since` | [Since](schema.md#common-since) |  | The version this was introduced. |

**References:** [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [Since](schema.md#common-since)
