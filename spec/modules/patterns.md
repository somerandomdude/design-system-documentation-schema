# DSDS Patterns Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the structure for documenting broad interaction patterns — recurring, multi-component solutions to common UX problems such as navigation, error messaging, form validation, empty states, loading sequences, and onboarding flows. Where the [Components Module](components.md) documents individual UI elements, the Patterns Module documents how those elements are composed to address a user need.

---

## 14. Pattern Documentation

A pattern documentation object describes a recurring interaction solution, the components it uses, the flow of interaction, and the guidance for implementing it correctly.

### 14.1 Structure

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | See [§5.1](#51-identification). Machine-readable identifier (e.g., `"error-messaging"`, `"navigation"`, `"empty-state"`). |
| `displayName` | `string` | Yes | See [§5.1](#51-identification). |
| `summary` | `string` | No | See [§5.1](#51-identification). |
| `description` | `string` | Yes | See [§5.1](#51-identification). CommonMark supported. |
| `status` | `string` | Yes | See [§5.2](#52-status). |
| `deprecationNotice` | `string` | Conditional | See [§5.2](#52-status). |
| `since` | `string` | No | See [§5.2](#52-status). |
| `tags` | `string[]` | No | See [§5.3](#53-tags). |
| `category` | `string` | Yes | The pattern category. See [§14.2](#142-category). |
| `components` | `array` | No | The components that participate in this pattern. See [§14.3](#143-component-references). |
| `interactions` | `array` | No | The interaction flow. See [§14.4](#144-interactions). |
| `useCases` | `object` | No | When to use and when not to use this pattern. See [§14.5](#145-use-cases). |
| `guidelines` | `object` | No | Usage guidance. See [§10 Guidelines Structure](#10-guidelines-structure). |
| `accessibility` | `object` | No | Accessibility documentation. See [§11 Accessibility Structure](#11-accessibility-structure). |
| `examples` | `array` | No | Examples illustrating the complete pattern in context. See [§9 Examples](#9-examples). |
| `related` | `array` | No | See [§5.4](#54-related-artifacts). |
| `links` | `array` | No | See [§5.5](#55-links) and [§12 Links](#12-links). |
| `$extensions` | `object` | No | See [§13 Extensions](#13-extensions). |

### 14.2 Category

The `category` property classifies the interaction problem the pattern solves. Common values:

| Value | Description |
|---|---|
| `"feedback"` | Communicating system status, errors, success, and warnings to the user. |
| `"navigation"` | Moving between views, sections, or pages within an application. |
| `"data-entry"` | Collecting input from the user — forms, search, filters, inline editing. |
| `"disclosure"` | Revealing and hiding content — accordions, drawers, modals, tooltips. |
| `"onboarding"` | Introducing the user to features, flows, or concepts on first use. |
| `"layout"` | Organizing content across screen sizes and contexts — responsive patterns, master-detail, dashboards. |
| `"selection"` | Choosing one or more items from a set — single select, multi-select, transfer lists. |
| `"loading"` | Communicating progress and managing user expectations during asynchronous operations. |

Design systems _MAY_ define additional categories.

### 14.3 Component References

The optional `components` array lists the components that participate in the pattern, with a description of the role each one plays.

Each component reference:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The name of the component. _MUST_ match a component name defined in a component schema document. |
| `role` | `string` | Yes | A short description of the role this component plays within the pattern (e.g., `"Primary navigation trigger"`, `"Error summary container"`). |
| `required` | `boolean` | No | Whether this component is required for the pattern to function. When `false`, the component is an optional enhancement. |

Listing a component here does not duplicate its documentation — it establishes a named relationship between the pattern and the component so that tools can cross-reference them.

**Example:**

```json
{
  "components": [
    {
      "name": "form-field",
      "role": "Container for individual inputs. Displays inline validation messages directly below the field when validation fails.",
      "required": true
    },
    {
      "name": "alert",
      "role": "Page-level error summary. Appears at the top of the form listing all current errors with anchor links to each invalid field.",
      "required": true
    },
    {
      "name": "toast",
      "role": "Transient notification for server-side or asynchronous errors that cannot be tied to a specific field.",
      "required": false
    }
  ]
}
```

### 14.4 Interactions

The optional `interactions` array describes the flow of the pattern as an ordered sequence of steps. Each step documents what triggers it, what happens, which components are involved, and optionally provides examples.

Each interaction:

| Property | Type | Required | Description |
|---|---|---|---|
| `trigger` | `string` | No | What initiates this step (e.g., `"User submits the form"`, `"API returns a 422 response"`). |
| `description` | `string` | Yes | What happens during this step. CommonMark supported. |
| `components` | `string[]` | No | The names of the components involved in this step. |
| `examples` | `array` | No | Examples illustrating this step. See [§9 Examples](#9-examples). |

The interaction sequence documents the _happy path_ and _error paths_ of the pattern. Authors _SHOULD_ include steps for:

- The initial trigger (e.g., user action, system event)
- The system's response (what changes on screen)
- Recovery or correction steps (how the user gets back to a good state)
- Completion (what indicates the pattern has concluded)

**Example:**

```json
{
  "interactions": [
    {
      "trigger": "User submits the form by activating the submit button.",
      "description": "Client-side validation runs on all required fields. If one or more fields are invalid, submission is prevented and the error state is activated.",
      "components": ["button", "form-field"]
    },
    {
      "trigger": "Client-side validation detects one or more invalid fields.",
      "description": "Each invalid field displays an inline error message directly below the input. The message describes what is wrong and, where possible, how to fix it.",
      "components": ["form-field", "icon"]
    },
    {
      "trigger": "User corrects an invalid field and moves focus away.",
      "description": "The inline error for that field is removed. If an error summary is visible, the corresponding entry is removed. When all errors are resolved, the summary is removed entirely.",
      "components": ["form-field", "alert"]
    }
  ]
}
```

### 14.5 Use Cases

The optional `useCases` object describes when to use and when not to use this pattern. This provides scenario-driven guidance that helps implementers choose the right pattern for their situation.

| Property | Type | Description |
|---|---|---|
| `whenToUse` | `array` | Scenarios in which this pattern is the appropriate choice. |
| `whenNotToUse` | `array` | Scenarios in which this pattern should not be used. Each entry _SHOULD_ include an `alternative`. |

Each use case entry:

| Property | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | Yes | A description of the scenario. |
| `alternative` | `object` | No | The recommended alternative. Contains a required `name` (the artifact name) and optional `rationale` (why the alternative is better). |
| `examples` | `array` | No | Examples illustrating the scenario. |

**Example:**

```json
{
  "useCases": {
    "whenToUse": [
      {
        "description": "When a user submits a form and one or more fields fail validation."
      },
      {
        "description": "When an asynchronous operation fails and the user needs to be informed."
      }
    ],
    "whenNotToUse": [
      {
        "description": "When the feedback is a successful outcome.",
        "alternative": {
          "name": "success-messaging",
          "rationale": "Success feedback uses the success color and icon. Reusing the error pattern for positive outcomes confuses the visual language and dilutes the urgency of actual errors."
        }
      },
      {
        "description": "When the entire page or view fails to load.",
        "alternative": {
          "name": "empty-state",
          "rationale": "Full-page failures are better handled by empty state patterns that replace the entire content area with an explanation and recovery action."
        }
      }
    ]
  }
}
```

### 14.6 Pattern Examples

The optional `examples` array provides demonstrations of the complete pattern in context. These are distinct from the per-interaction examples in [§14.4](#144-interactions) — pattern-level examples show the entire flow from start to finish, while interaction-level examples illustrate individual steps.

Pattern examples follow the standard example format defined in [§9 Examples](#9-examples). Videos and interactive Storybook stories are particularly effective for pattern-level examples because they can show the full interaction sequence.

**Example:**

```json
{
  "examples": [
    {
      "title": "Complete form validation flow",
      "description": "Demonstrates the full error messaging pattern from submission through correction and re-submission.",
      "presentation": {
        "type": "video",
        "url": "https://design.acme.com/assets/patterns/error-messaging-full-flow.mp4",
        "alt": "A user fills out a form and clicks Submit. Fields highlight with errors. The user corrects each field and resubmits successfully."
      }
    },
    {
      "title": "Error summary with anchor links",
      "presentation": {
        "type": "storybook",
        "url": "https://storybook.acme.com/?path=/story/patterns-error-messaging--summary",
        "storyId": "patterns-error-messaging--summary"
      }
    }
  ]
}
```

### 14.7 Patterns vs. Components

Patterns and components serve different levels of abstraction. Understanding the distinction helps document authors decide where information belongs.

| Concern | Belongs in Pattern | Belongs in Component |
|---|---|---|
| How do these components work together to handle errors? | ✓ | |
| What are the props of the Alert component? | | ✓ |
| What triggers the error summary to appear? | ✓ | |
| What ARIA attributes does a form field need? | | ✓ |
| What order should error recovery steps happen in? | ✓ | |
| What visual variants does the Toast component have? | | ✓ |
| Which components are required vs. optional for this flow? | ✓ | |
| How does focus move when the error summary appears? | ✓ | |

### 14.8 Patterns vs. Guidelines

Guidelines within a pattern describe _rules_ for implementing it (e.g., "Always move focus to the error summary"). Use cases describe _when_ to apply the pattern. Interactions describe _how_ it flows. These are complementary, not redundant.

- **Guidelines** answer: "What are the rules?"
- **Use cases** answer: "When does this apply?"
- **Interactions** answer: "What happens, step by step?"

---