# GuidelinesSection

Rules for an entry. When and how to use it. Each item pairs a rule with why it exists. When an item carries a `level` and a ref but no `statement`, a conforming consumer SHOULD show the level and the link rather than rendering it as empty content. An author who expects a person to read the guideline without following the link SHOULD add a `statement` instead.

Source: `sections/guidelines.schema.yaml`

## GuidelinesSection {#sections-guidelines}

Rules for an entry. When and how to use it. Each item pairs a rule with why it exists. When an item carries a `level` and a ref but no `statement`, a conforming consumer SHOULD show the level and the link rather than rendering it as empty content. An author who expects a person to read the guideline without following the link SHOULD add a `statement` instead.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"guidelines"` | ✓ | Marks this section as guidelines. |
| `for` | `"all"` \| `"human"` \| `"agent"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | [Markdown](schema.md#common-markdown) |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `tags` | string[] |  | What this section is about. A section tagged `accessibility` holds the accessibility rules for its entry, and nothing else. (Min items: 1) |
| `items` | object[] |  | The rules, in order. (Min items: 1) |
| `freeform` | [freeformEntry](schema.md#sections-section-freeformentry)[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |
| `framing` | `"when-to-use"` \| `"how-to-use"` |  | Which kind of guidance this section holds. (Default: `"how-to-use"`) |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [RequirementLevel](schema.md#common-requirement-level), [Markdown](schema.md#common-markdown), [Example](schema.md#common-example), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [freeformEntry](schema.md#sections-section-freeformentry)

**Example:**

```yaml
- kind: guidelines
  for: agent
  framing: when-to-use
  title: When to use
  description: Whether button is the right choice for this action.
  context: acme.fit-check
  items:
    - statement: Do not use button when the action navigates to a new URL; use the link entry instead.
      level: must-not
      alternatives:
        - to: link
  freeform:
    - title: Why this matters
      body: A button that navigates breaks browser back/forward and "open in new tab."
  $extensions:
    com.acme: {...}
```
