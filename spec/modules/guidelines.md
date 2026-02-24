# DSDS Guidelines Module

**Part of the [Design System Documentation Standard (DSDS) 1.0](../dsds-spec.md)**

This module defines how usage guidance is structured across the specification. Every guideline is a self-contained, actionable statement paired with a rationale — whether it appears in component best practices, token usage rules, or foundation principles. The module also defines how rich examples (images, videos, code, Storybook stories) can be embedded within guidelines.

---

## 10. Guidelines Structure

Guidelines are the core of design system documentation. DSDS structures guidelines to be self-contained, actionable, and justified — regardless of where they appear.

### 10.1 Guidelines Object

The `guidelines` object appears in component, token, and foundation documentation. It _MAY_ contain any of the following arrays:

| Property | Type | Description |
|---|---|---|
| `bestPractices` | `array` | Usage guidance: when to use, how to use, when not to use. |
| `contentGuidelines` | `array` | Guidance for content within the artifact (text, imagery). Only applicable when defined at the component level. See [§6.8](#68-content-guidelines) for the inline version. |

Each guideline object follows the same shape:

| Property | Type | Required | Description |
|---|---|---|---|
| `guidance` | `string` | Yes | The actionable guidance statement. _MUST_ be concrete and unambiguous. Avoid subjective language like "use sparingly" or "when possible". |
| `rationale` | `string` | Yes | Why this guidance exists. Cite evidence, accessibility standards, or user research when available. |
| `severity` | `string` | No | The enforcement level of the guideline. _MUST_ be one of: `"required"`, `"encouraged"`, `"informational"`, `"discouraged"`, `"prohibited"`. See [§10.3](#103-severity-levels). When omitted, consumers _MAY_ treat the guideline as `"encouraged"`. |
| `examples` | `object` | No | Examples illustrating the guideline. See below. |
| `tags` | `string[]` | No | Tags for categorizing or filtering guidelines. |

### 10.2 Severity Levels

The optional `severity` property communicates how strictly a guideline should be followed. The values align with RFC 2119 requirement levels:

| Value | RFC 2119 Equivalent | Meaning |
|---|---|---|
| `"required"` | MUST | The guideline _MUST_ be followed. Non-compliance is considered a defect. |
| `"encouraged"` | SHOULD | The guideline _SHOULD_ be followed in most cases. Exceptions require justification. |
| `"informational"` | MAY | The guideline provides advisory context. It describes a pattern or consideration with no enforcement expectation. |
| `"discouraged"` | SHOULD NOT | The described practice _SHOULD NOT_ be used. Exceptions require justification. |
| `"prohibited"` | MUST NOT | The described practice _MUST NOT_ be used. Violations are considered defects. |

When `severity` is omitted, tools _MAY_ treat the guideline as `"encouraged"` for display and enforcement purposes.

**Choosing a severity level:**

- Use `"required"` and `"prohibited"` for guidelines rooted in accessibility requirements, platform constraints, or invariants that would break the system if violated.
- Use `"encouraged"` and `"discouraged"` for best practices that have well-understood rationale but where context may warrant exceptions.
- Use `"informational"` for background context, tips, or patterns that are helpful but have no enforcement expectation.

### 10.3 Examples in Guidelines

The optional `examples` object within a guideline:

| Property | Type | Required | Description |
|---|---|---|---|
| `encouraged` | `array` | No | An array of example items showing the encouraged approach. |
| `discouraged` | `array` | No | An array of example items showing the approach to avoid. Each discouraged example _SHOULD_ be paired with an encouraged alternative. |

Each item in the `encouraged` or `discouraged` array _MUST_ be one of the following three formats:

**1. Simple string** — a short text example.

```json
"Save changes"
```

**2. Text example object** — a text example with an explanation.

| Property | Type | Required | Description |
|---|---|---|---|
| `value` | `string` | Yes | The example content (code snippet, text, description). |
| `description` | `string` | No | Explanation of why this example is encouraged or discouraged. |

**3. Rich example object** — an image, video, code, or Storybook example as defined in [§9 Examples](#9-examples).

A rich example is distinguished from a text example by the presence of a `type` property. Tools _MUST_ treat any object with a `type` property set to `"image"`, `"video"`, `"code"`, or `"storybook"` as a rich example, and any object with a `value` property (and no `type`) as a text example.

All three formats _MAY_ be mixed within the same array. This allows a guideline to include a short text description alongside a visual illustration:

```json
{
  "encouraged": [
    {
      "value": "[Cancel (secondary)] [Save (primary)]",
      "description": "One primary action with a secondary alternative."
    },
    {
      "type": "image",
      "url": "https://design.acme.com/assets/button-group-correct.png",
      "alt": "A dialog footer with a secondary Cancel button on the left and a primary Save button on the right.",
      "label": "Correct button group layout"
    }
  ]
}
```

**Example:**

```json
{
  "guidelines": {
    "bestPractices": [
      {
        "guidance": "Place the primary button on the right side of a button group in left-to-right layouts.",
        "rationale": "Users scan left-to-right. Placing the primary action on the right aligns with the natural completion point of reading and mirrors the convention established by operating system dialogs.",
        "severity": "encouraged",
        "examples": {
          "encouraged": [
            {
              "value": "[Cancel] [Save]",
              "description": "Primary action on the right."
            }
          ],
          "discouraged": [
            {
              "value": "[Save] [Cancel]",
              "description": "Primary action on the left violates the expected reading order for action completion."
            }
          ]
        }
      },
      {
        "guidance": "Limit each surface to one primary button.",
        "rationale": "Multiple primary buttons dilute visual hierarchy. When everything is emphasized, nothing is. A single primary button draws the user toward the most important action.",
        "severity": "required"
      },
      {
        "guidance": "Do not use a button when the action navigates the user to a different page or URL. Use a link instead.",
        "rationale": "Buttons and links have different semantic meaning. Buttons perform actions. Links navigate. Conflating the two creates confusion for screen reader users who rely on element role to understand behavior.",
        "severity": "prohibited"
      }
    ]
  }
}
```

### 10.4 Writing Guidelines (Non-normative)

_This section is non-normative._

When authoring guideline text for DSDS documents, consider the following:

- **Be specific.** "Limit each surface to one primary button" is better than "Use primary buttons sparingly."
- **State what to do, not just what not to do.** If a "don't" is necessary, pair it with a "do this instead."
- **Write for action.** The reader is trying to build something right now. Help them do it.
- **Include the why.** Every `rationale` should be a real reason — not a restatement of the guidance.
- **Use simple language.** A junior developer or a non-native English speaker should be able to understand every guideline.
- **Keep it self-contained.** A reader should understand a single guideline without reading the entire document.

### 10.5 Guidelines vs. Use Cases

Guidelines and use cases are complementary but serve different purposes. Understanding the boundary helps authors place information in the right location.

| Concern | Guidelines | Use Cases |
|---|---|---|
| **Question answered** | _How_ should I use this? | _When_ should I use this? |
| **Focus** | Rules and best practices for correct implementation | Scenarios that help a reader decide whether this is the right artifact for their situation |
| **Scope** | Applies once the reader has already chosen this artifact | Applies before the reader has committed to this artifact |
| **Examples** | Show correct and incorrect implementation patterns | Show concrete situations where this artifact is or is not appropriate |
| **Structure** | Flat array of `guideline` objects with `guidance`, `rationale`, and optional `severity` | `useCases` object with `whenToUse` and `whenNotToUse` arrays |

**Rule of thumb:** If the advice helps someone _decide whether to reach for this artifact_, it belongs in use cases. If the advice helps someone _implement it correctly after choosing it_, it belongs in guidelines.

**Example — Button:**

- _Use case:_ "When the user needs to trigger an action such as submitting a form or opening a dialog." → This helps the reader decide whether to use a Button vs. a Link or a Menu Button.
- _Guideline:_ "Limit each surface to one primary button." → This helps the reader implement the Button correctly after choosing it.

---
