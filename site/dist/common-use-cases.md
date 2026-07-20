# Use cases definition

When an artifact is the right choice and when another fits better. An optional `purpose` sums up what it is for; `items` holds scenarios marked 'recommended' or 'discouraged'.

Source: `common/use-cases.schema.json`

**2 definitions** in this file: `useCases`, `useCase`

## useCases {#usecases}

When to use an artifact and when to choose something else. Optional `purpose` sums up what it is for; `items` holds `useCase` scenarios marked 'recommended' or 'discouraged'. Answers *whether* to use the artifact — for *how*, see `guidelines`; for domain beliefs, see `principles`; for look and behavior, see variants, states, and anatomy.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"use-cases"` | ✓ | Identifies this block as `use-cases`. |
| `items` | [useCase](common-use-cases.md#usecase)[] | ✓ | The use-case scenarios. Order matters: tools SHOULD keep it for display, and authors SHOULD lead with recommended scenarios. (Min items: 1) |
| `purpose` | [richText](common-rich-text.md#richtext) |  | One or two sentences on what the artifact is for, framing the `items` below (ex: 'Buttons trigger immediate actions within a surface.'). |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [useCase](common-use-cases.md#usecase), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "use-cases",
  "items": [
    {
      "stance": "recommended",
      "description": "When the user needs to commit a destructive or high-stakes action (ex: Save, Confirm, Delete) and that action is the primary task on the surface."
    },
    {
      "stance": "recommended",
      "description": "When triggering a state change inside the application — submitting a form, opening a dialog, or moving to the next step of a workflow."
    },
    {
      "stance": "discouraged",
      "description": "When the action navigates the user to a different page or external URL.",
      "alternative": {
        "identifier": "link",
        "rationale": "Links carry semantic meaning for navigation, are crawlable by assistive technology, and respect the user's default browser behavior (open in new tab, copy URL, etc.)."
      }
    }
  ]
}
```

## useCase {#usecase}

One scenario where an artifact is or isn't a good fit.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | The scenario. Describe the user's situation, not the artifact's features. |
| `stance` | `"recommended"` \| `"discouraged"` | ✓ | 'recommended' (use it here) or 'discouraged' (avoid it here). |
| `alternative` | object {identifier, rationale} |  | A better-suited artifact for this scenario. Usually set on discouraged scenarios. |

**References:** [richText](common-rich-text.md#richtext), [entityIdentifier](common-entity-ref.md#entityidentifier)

**Example:**

```json
[
  {
    "stance": "recommended",
    "description": "When the user needs to commit a destructive or high-stakes action (ex: Save, Confirm, Delete) and that action is the primary task on the surface."
  },
  {
    "stance": "recommended",
    "description": "When triggering a state change inside the application — submitting a form, opening a dialog, or moving to the next step of a workflow."
  },
  {
    "stance": "discouraged",
    "description": "When the action navigates the user to a different page or external URL.",
    "alternative": {
      "identifier": "link",
      "rationale": "Links carry semantic meaning for navigation, are crawlable by assistive technology, and respect the user's default browser behavior (open in new tab, copy URL, etc.)."
    }
  },
  {
    "stance": "discouraged",
    "description": "When the surface needs a long list of inline choices that the user can toggle on and off.",
    "alternative": {
      "identifier": "chip",
      "rationale": "Chips communicate selection and removal affordances. Using a button for each option implies an action rather than a togglable selection."
    }
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/use-cases.schema.json",
  "title": "Use cases definition",
  "description": "When an artifact is the right choice and when another fits better. An optional `purpose` sums up what it is for; `items` holds scenarios marked 'recommended' or 'discouraged'.",
  "$defs": {
    "useCase": {
      "type": "object",
      "description": "One scenario where an artifact is or isn't a good fit.",
      "required": [
        "description",
        "stance"
      ],
      "properties": {
        "description": {
          "$ref": "rich-text.schema.json#/$defs/richText",
          "description": "The scenario. Describe the user's situation, not the artifact's features."
        },
        "stance": {
          "type": "string",
          "enum": [
            "recommended",
            "discouraged"
          ],
          "description": "'recommended' (use it here) or 'discouraged' (avoid it here)."
        },
        "alternative": {
          "type": "object",
          "description": "A better-suited artifact for this scenario. Usually set on discouraged scenarios.",
          "required": [
            "identifier"
          ],
          "properties": {
            "identifier": {
              "$ref": "entity-ref.schema.json#/$defs/entityIdentifier",
              "description": "Identifier of the alternative artifact (ex: 'link', 'radio-group', 'empty-state')."
            },
            "rationale": {
              "$ref": "rich-text.schema.json#/$defs/richText",
              "description": "Why the alternative fits better (semantics, accessibility, or UX)."
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "useCases": {
      "type": "object",
      "description": "When to use an artifact and when to choose something else. Optional `purpose` sums up what it is for; `items` holds `useCase` scenarios marked 'recommended' or 'discouraged'. Answers *whether* to use the artifact — for *how*, see `guidelines`; for domain beliefs, see `principles`; for look and behavior, see variants, states, and anatomy.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "use-cases",
          "description": "Identifies this block as `use-cases`."
        },
        "purpose": {
          "$ref": "rich-text.schema.json#/$defs/richText",
          "description": "One or two sentences on what the artifact is for, framing the `items` below (ex: 'Buttons trigger immediate actions within a surface.')."
        },
        "items": {
          "type": "array",
          "description": "The use-case scenarios. Order matters: tools SHOULD keep it for display, and authors SHOULD lead with recommended scenarios.",
          "items": {
            "$ref": "#/$defs/useCase"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false
    }
  }
}
```
