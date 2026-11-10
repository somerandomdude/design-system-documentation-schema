# StepsSection

A series of actions/steps/tasks, like a tutorial, a migration, a pattern's interaction flow, or checklist of things to verify.

Source: `sections/steps.schema.yaml`

## StepsSection {#sections-steps}

A series of actions/steps/tasks, like a tutorial, a migration, a pattern's interaction flow, or checklist of things to verify.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"steps"` | ✓ | Marks this section as a stepped process or checklist. |
| `for` | `"all"` \| `"human"` \| `"agent"` | ✓ | Who or what this section is written for. (Default: `"all"`) |
| `title` | string |  | An optional heading for the section. |
| `description` | [Markdown](schema.md#common-markdown) |  | An optional one-line intro for the section. |
| `context` | `"anatomy"` \| `"terms"` \| `"keyboard"` \| `"events"` \| [namespaced](schema.md#common-id-namespaced) |  | What job this section is doing. |
| `tags` | string[] |  | What this section is about. A section tagged `accessibility` holds the accessibility rules for its entry, and nothing else. (Min items: 1) |
| `items` | object[] |  | The steps or checklist entries, in order. (Min items: 1) |
| `freeform` | [freeformEntry](schema.md#sections-section-freeformentry)[] |  | Nestable written content that can include headings. Available on every section kind regardless of `items`' own structure. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this one section, keyed by namespace. |
| `ordered` | boolean |  | Whether entries must be done in order. Set to false for an unordered checklist. (Default: `true`) |

**References:** [Section](schema.md#sections-section), [Id](schema.md#common-id), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [targets](schema.md#common-ref-targets), [list](schema.md#common-ref-list), [Extensions](schema.md#common-extensions), [namespaced](schema.md#common-id-namespaced), [freeformEntry](schema.md#sections-section-freeformentry)

**Example:**

```yaml
- kind: steps
  for: agent
  ordered: false
  title: Pre-release checklist
  description: Run through before shipping a change to this component.
  context: acme.checklist
  items:
    - title: Focus ring is visible in both light and dark themes.
    - title: Loading state announces to screen readers.
    - title: Works with a custom icon in the leading-icon slot.
      optional: true
  freeform:
    - title: Why this matters
      body: Skipping this checklist is how contrast regressions ship.
  $extensions:
    com.acme: {...}
```
