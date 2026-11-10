# DefinitionsSection

Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.

Source: `sections/definitions.schema.yaml`

## DefinitionsSection {#sections-definitions}

Term definitions. Can describe content labels within components or patterns, define naming conventions, act as a glossary, or be a simple way to outline component props/APIs.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"definitions"` | ✓ | Marks this section as term-definition documentation. |
| `for` | `"all"` \| `"human"` \| `"agent"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | [Markdown](schema.md#common-markdown) |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `tags` | string[] |  | What this section is about. A section tagged `accessibility` holds the accessibility rules for its entry, and nothing else. (Min items: 1) |
| `items` | object[] |  | One entry per term. (Min items: 1) |
| `freeform` | [freeformEntry](schema.md#sections-section-freeformentry)[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [freeformEntry](schema.md#sections-section-freeformentry)

**Example:**

```yaml
- kind: definitions
  for: all
  title: Terms
  description: Words used in this component's copy.
  context: terms
  items:
    - term: OK
      definition: To confirm an action.
    - term: Cancel
      definition: To cancel an action.
  freeform:
    - title: About
      body: These terms match the ones used in product copy guidelines.
  $extensions:
    com.acme: {...}
```
