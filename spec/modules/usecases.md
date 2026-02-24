# DSDS Use Cases Module

**Part of the [Design System Documentation Standard (DSDS) 1.0](../dsds-spec.md)**

This module defines the structure for documenting when to use and when not to use a design system artifact. Use cases provide scenario-driven guidance that complements guidelines by framing decisions in terms of concrete situations rather than abstract rules. Use cases appear on components, styles, and patterns.

---

## 15. Use Cases

The optional `useCases` object describes scenarios in which an artifact is or is not the appropriate choice. It helps implementers make the right decision before they start building.

### 15.1 Structure

| Property | Type | Required | Description |
|---|---|---|---|
| `whenToUse` | `array` | No | Scenarios in which this artifact is the appropriate choice. |
| `whenNotToUse` | `array` | No | Scenarios in which this artifact should not be used. Each entry _SHOULD_ include an `alternative`. |

### 15.2 Use Case Entry

Each entry in the `whenToUse` or `whenNotToUse` array is an object with the following properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | Yes | A description of the scenario. CommonMark supported. |
| `alternative` | `object` | No | The recommended alternative artifact. See [§15.3](#153-alternatives). |
| `examples` | `array` | No | Examples illustrating the scenario. See [§9 Examples](#9-examples). |

### 15.3 Alternatives

The optional `alternative` object on a use case entry recommends a different artifact for the scenario. It is typically provided on `whenNotToUse` entries to direct the reader toward a more appropriate component, style, or pattern.

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The name of the recommended alternative component or artifact (e.g., `"link"`, `"radio-group"`, `"empty-state"`). |
| `rationale` | `string` | No | An explanation of why the alternative is more appropriate for this scenario. Cite semantic differences, accessibility implications, or UX rationale when available. CommonMark supported. |

The `rationale` property is only permitted when an `alternative` is present. It cannot appear as a standalone property on a use case entry.

### 15.4 When to Use — Writing Guidance (Non-normative)

_This section is non-normative._

`whenToUse` entries describe the situations where this artifact is the right tool for the job. Effective entries are:

- **Scenario-driven.** Describe the user's situation, not the artifact's features. _"When the user needs to trigger an action"_ is better than _"When you need a clickable element."_
- **Concrete.** Include specific actions or contexts. _"When submitting a form, saving data, or opening a dialog"_ is better than _"When an action is needed."_
- **Complementary to description.** The artifact's `description` says what it _is_. Use cases say _when_ to reach for it.

### 15.5 When Not to Use — Writing Guidance (Non-normative)

_This section is non-normative._

`whenNotToUse` entries describe situations where a different artifact is more appropriate. Effective entries:

- **Always suggest an alternative.** A "don't use this" without a "use that instead" leaves the reader stuck.
- **Explain why the alternative is better.** The `rationale` on the alternative should cite concrete reasons — semantic differences, accessibility implications, or user experience improvements.
- **Be specific about the boundary.** _"When the action navigates to a different page"_ draws a clear line. _"When a button isn't appropriate"_ does not.

### 15.6 Example

```json
{
  "useCases": {
    "whenToUse": [
      {
        "description": "When the user needs to trigger an action such as submitting a form, saving data, opening a dialog, or confirming a decision."
      },
      {
        "description": "When a destructive or irreversible action needs to be initiated, such as deleting a record or revoking access. Pair with a confirmation dialog."
      }
    ],
    "whenNotToUse": [
      {
        "description": "When the action navigates the user to a different page or URL.",
        "alternative": {
          "name": "link",
          "rationale": "Links carry native navigation semantics. Screen readers announce them as links, and browsers support standard navigation behaviors such as open-in-new-tab. Using a button for navigation creates a mismatch between the announced role and the actual behavior."
        }
      },
      {
        "description": "When the user needs to select one option from a set of mutually exclusive choices.",
        "alternative": {
          "name": "radio-group",
          "rationale": "Radio groups communicate exclusivity through their semantic role. A set of buttons styled to look like a selector does not convey mutual exclusivity to assistive technology."
        }
      },
      {
        "description": "When the only content is an icon with no visible text label.",
        "alternative": {
          "name": "icon-button",
          "rationale": "Icon buttons enforce an aria-label requirement and apply size adjustments for icon-only touch targets. A standard button with its label removed may fail accessibility requirements silently."
        }
      }
    ]
  }
}
```

### 15.7 Where Use Cases Appear

Use cases can appear on any artifact type:

| Artifact | Typical use |
|---|---|
| Component | When to use this component vs. a similar one (e.g., Button vs. Link, Select vs. Combobox). |
| Style | When to apply this visual style vs. raw tokens or a different style category. |
| Pattern | When to apply this interaction pattern vs. a simpler or more specific solution. |

---