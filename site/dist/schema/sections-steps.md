# StepsSection

A series of actions/steps/tasks, like a tutorial, a migration, a pattern's interaction flow, or checklist of things to verify.

Source: `sections/steps.schema.yaml`

## StepsSection {#stepssection}

A series of actions/steps/tasks, like a tutorial, a migration, a pattern's interaction flow, or checklist of things to verify.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"steps"` | ✓ | Marks this section as a stepped process or checklist. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `items` | object[] |  | The steps or checklist entries, in order. (Min items: 1) |
| `freeform` | `freeformEntry`[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |
| `ordered` | boolean |  | Whether entries must be done in order. Set to false for an unordered checklist. (Default: `true`) |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-ref-list), [list](schema.md#common-example-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`
