# DefinitionsSection

Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.

Source: `sections/definitions.schema.yaml`

## DefinitionsSection {#definitionssection}

Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"definitions"` | ✓ | Marks this section as term-definition documentation. |
| `for` | `"human"` \| `"agent"` \| `"all"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | string |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `metadata` | [Metadata](schema.md#metadata-metadata) |  | Optional information about an element. |
| `items` | object[] |  | One entry per term. (Min items: 1) |
| `freeform` | `freeformEntry`[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [Metadata](schema.md#metadata-metadata), `#/$defs/freeformEntry`
