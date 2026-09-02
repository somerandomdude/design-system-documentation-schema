# GuidelinesSection

Rules for an entry. How to use it and when it is the right choice. Each item pairs a rule with why it exists.

Source: `sections/guidelines.schema.yaml`

## GuidelinesSection {#guidelinessection}

Rules for an entry. How to use it and when it is the right choice. Each item pairs a rule with why it exists.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"guidelines"` | ✓ | Marks this section as guidelines. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `items` | any \| any[] |  | The rules, in order. (Min items: 1) |
| `freeform` | `freeformEntry`[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |
| `framing` | `"when-to-use"` \| `"how-to-use"` |  | Which kind of guidance this section holds. (Default: `"how-to-use"`) |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [RequirementLevel](schema.md#common-requirement-level), [Example](schema.md#common-example), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`
