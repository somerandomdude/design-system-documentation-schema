# ComponentEntry

A reusable UI element, like a button or a dialog.

Source: `entries/component.schema.yaml`

**3 definitions** in this file: `ComponentEntry`, `traitType`, `traitValue`

## ComponentEntry {#entries-component}

A reusable UI element, like a button or a dialog.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"component"` | ✓ | Marks this entry as a component. |
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
| `sourceFiles` | object {platform, file}[] |  | One entry per platform's source file. (Min items: 1) |
| `imports` | object {platform, code, package}[] |  | One entry per platform. (Min items: 1) |
| `specs` | [targets](schema.md#common-ref-targets) |  | Machine-readable API contract(s) for this component (props, slots, events, etc.) in a standard, tool-readable format (contract). No `rel`: this field says it. |
| `traits` | object \| object[] |  | The component's variants and states. Every item says which one it is with `traitType`, and carries a `kind` of `boolean` or `enum` for the form it takes - an enum has its own `values` list, a boolean is a plain toggle. (Min items: 1) |
| `combos` | [Combo](schema.md#common-combo)[] |  | Define which of this component's own boolean traits or enum values can or cannot be paired with each other. (Min items: 1) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [Id](schema.md#common-id), [target](schema.md#common-ref-target), [targets](schema.md#common-ref-targets), [traitValue](schema.md#entries-component-traitvalue), [traitType](schema.md#entries-component-traittype), [list](schema.md#common-ref-list), [Combo](schema.md#common-combo), [apiId](schema.md#common-id-apiid), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [Since](schema.md#common-since), [status](schema.md#metadata-entry-metadata-status), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)

**Example:**

```yaml
id: button
kind: component
name: Button
description: Triggers an action. Gives users a single, consistent way to trigger an action.
metadata: {status: {status: stable}}
uses: [{to: color.action.primary}]
extends: [{to: base-dialog}]
alternatives: [{to: link}]
refs: [{href: https://github.com/acme/ds/react/button, rel: source}]
sections:
  - kind: guidelines
    for: all
    items: [{statement: Limit each surface to one primary button., level: should}]
$extensions:
  com.acme: {...}
sourceFiles:
  - platform: react
    file: ./src/Button.tsx
imports:
  - platform: react
    package: "@acme/ui"
traits:
  - traitType: state
    kind: boolean
    id: loading
    description: Shows a spinner in place of the label and blocks interaction while active.
combos:
  - subject: loading
    level: must-not
    items: [disabled]
    note: A control can't be simultaneously loading and disabled...
specs:
  - href: ./contracts/button.contract.json
    role: DS Contracts
```

## traitType {#entries-component-traittype}

Whether this trait is a variant the caller configures, or a state the component can be in.

Allowed values:

- `variant`
- `state`

## traitValue {#entries-component-traitvalue}

The shared properties of a boolean trait or one enum value - what it is, and what it's for.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [apiId](schema.md#common-id-apiid) | ✓ | The machine-readable id. Mirrors the real prop, attribute or value name, so it accepts camelCase, PascalCase, snake_case and kebab-case. |
| `description` | [Markdown](schema.md#common-markdown) | ✓ | What this is, why it exists, how it looks or behaves, and any constraints. |
| `name` | string |  | The human-readable name. Uses `id` when left out. |
| `examples` | [list](schema.md#common-example-list) |  | Examples showing this in context. |
| `since` | [Since](schema.md#common-since) |  | The version this was introduced. |
| `status` | [status](schema.md#metadata-entry-metadata-status) |  | This trait's or value's own lifecycle status, when it differs from the component's. |

**References:** [apiId](schema.md#common-id-apiid), [Markdown](schema.md#common-markdown), [list](schema.md#common-example-list), [Since](schema.md#common-since), [status](schema.md#metadata-entry-metadata-status)

**Example:**

```yaml
id: loading
name: Loading
description: Shows a spinner in place of the label and blocks interaction while active, so an action can't be submitted twice.
examples:
  - title: Default loading state
    showcase: {kind: image, url: https://cdn.acme.example/ds/showcase/button-loading.png}
since: 1.4.0
```
