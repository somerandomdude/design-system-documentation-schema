# Section

A logical documentation section. Supplies the fields every section kind shares — `kind`, `for`, `title`, `description`, `items`, `metadata`, `$extensions` — plus `freeform`, and is tagged with who it is for (human, agent, or all). Content always lives in `items`, never in a field named after the kind. Each sections/<kind>.schema.yaml file adds its own `kind` value (`definitions`, `guidelines`, `steps`, or the generic `section`) and its own structure for `items` on top of this shared base.

Source: `sections/section.schema.yaml`

**3 definitions** in this file: `Section`, `dispatch`, `freeformEntry`

## Section {#section}

A logical documentation section. Supplies the fields every section kind shares — `kind`, `for`, `title`, `description`, `items`, `metadata`, `$extensions` — plus `freeform`, and is tagged with who it is for (human, agent, or all). Content always lives in `items`, never in a field named after the kind. Each sections/<kind>.schema.yaml file adds its own `kind` value (`definitions`, `guidelines`, `steps`, or the generic `section`) and its own structure for `items` on top of this shared base.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"definitions"` \| `"guidelines"` \| `"steps"` \| `"section"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of content section this is. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `items` | object[] | at least 1 | The one universal list for this section kind's own structured content. |
| `freeform` | `freeformEntry`[] | at least 1 | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |

**Constraint:** At least one of `items`, `freeform` must be present.

**References:** [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`, [Extensions](schema.md#common-extensions), [DefinitionsSection](schema.md#sections-definitions), [GuidelinesSection](schema.md#sections-guidelines), [StepsSection](schema.md#sections-steps), [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [list](schema.md#common-ref-list)

## dispatch {#dispatch}

Routes a section to its own kind-specific schema by `kind` (`definitions`, `guidelines`, `steps`), falling back to this open base for the generic `section` kind or a namespaced custom kind.

**References:** [DefinitionsSection](schema.md#sections-definitions), [GuidelinesSection](schema.md#sections-guidelines), [StepsSection](schema.md#sections-steps), [Section](schema.md#sections-section)

## freeformEntry {#freeformentry}

One nestable, headed block of prose - a freeform section's own building block.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✓ | The entry's heading, for example 'Installation'. |
| `id` | [Id](schema.md#common-id) |  | A stable id for linking to this entry directly, unique within the section. |
| `body` | [Markdown](schema.md#common-markdown) |  | The entry's content. |
| `examples` | [list](schema.md#common-example-list) |  | One or more examples, in order. |
| `refs` | [list](schema.md#common-ref-list) |  | "See also" pointers for this entry. To point at another entry, use the entry's own top-level `refs` instead. |
| `items` | `freeformEntry`[] |  | Sub-entries nested beneath this one, to any depth. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one freeform entry, keyed by namespace. |

**References:** [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [list](schema.md#common-ref-list), `#/$defs/freeformEntry`, [Extensions](schema.md#common-extensions)
