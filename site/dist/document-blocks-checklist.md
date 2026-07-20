# Checklist document block

A checklist of things to check off — built for agents, but useful for people too. Each item is a short, actionable line, with optional extra detail, a level that marks how strict it is, and an optional link to the criterion that proves it. Use `checklist` for a hands-on pass over something; use `guidelines` for the rules behind it.

Source: `document-blocks/checklist.schema.json`

**2 definitions** in this file: `checklist`, `checklistItem`

## checklist {#checklist}

A checklist for an artifact — the concrete steps an agent (or a person) works through when building, reviewing, or integrating it. Turns rules into an actual pass, like 'accessibility review' or 'before you ship'. A general block kind, accepted on every entity type, and just as at home in `agentDocumentBlocks`.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"checklist"` | ✓ | Identifies this block as a checklist. |
| `items` | [checklistItem](document-blocks-checklist.md#checklistitem)[] | ✓ | The checklist items, in order. Order matters when `ordered` is true, so tools MUST preserve it. (Min items: 1) |
| `title` | string |  | An optional heading naming the checklist (ex: 'Accessibility review', 'Before you ship'). |
| `ordered` | boolean |  | Whether items must be done in order. Defaults to false — items can be checked off in any order. Set true when each item depends on the last. Tools SHOULD show unordered checklists as checkboxes and ordered ones as a numbered list. (Default: `false`) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [checklistItem](document-blocks-checklist.md#checklistitem), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "checklist",
  "title": "Button integration review",
  "ordered": false,
  "items": [
    {
      "label": "Use a single primary-emphasis button per surface.",
      "level": "must",
      "criterion": "single-primary-action",
      "category": "visual-design"
    },
    {
      "label": "Give every icon-only button an accessible name via aria-label.",
      "description": "The label should describe the action, not the icon (ex: 'Close dialog').",
      "level": "must",
      "criterion": "icon-button-accessible-name",
      "category": "accessibility"
    },
    {
      "label": "Use a link, not a button, for navigation to a different page or URL.",
      "level": "must-not",
      "category": "interaction"
    },
    {
      "label": "Confirm the touch target is at least 44×44 px on coarse-pointer devices.",
      "level": "should",
      "criterion": "touch-target-minimum",
      "category": "accessibility"
    },
    {
      "label": "Provide a loading state for buttons that trigger async actions.",
      "level": "should",
      "category": "interaction",
      "optional": true
    }
  ]
}
```

## checklistItem {#checklistitem}

One thing to check, do, or confirm. `label` is the action itself. `description` adds detail. `level` says how strict it is. `criterion` links to the test that proves it. `optional` lets it be skipped. Only `label` is required.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | [richText](common-rich-text.md#richtext) | ✓ | The check itself, written as an instruction you can act on and mark done or not (ex: 'Give every icon-only button an aria-label'). MUST be specific — not 'check accessibility'. |
| `description` | [richText](common-rich-text.md#richtext) |  | Extra detail — how to do it, what to watch for, or why it matters. Keep the instruction itself in `label`. |
| `level` | [conformanceLevel](common-criterion.md#conformancelevel) |  | How strict this item is: 'must' (a hard requirement), 'should' (do it unless you have a reason not to), 'should-not', or 'must-not'. Agents treat must/must-not as non-negotiable. Left out, it's just a recommendation. |
| `criterion` | string |  | Optional link to a testable criterion (from a guideline or accessibility block) that proves this item passes. MUST be lowercase kebab-case. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `category` | string |  | Groups items in a long checklist by discipline: 'visual-design', 'interaction', 'accessibility', 'content', 'motion', 'development', or a custom lowercase kebab-case value. |
| `optional` | boolean |  | Whether this item can be skipped. Defaults to false. Tools MAY mark optional items differently. (Default: `false`) |

**References:** [richText](common-rich-text.md#richtext), [conformanceLevel](common-criterion.md#conformancelevel)

**Example:**

```json
{
  "label": "Give every icon-only button an accessible name via aria-label.",
  "description": "Screen readers announce nothing for an icon with no text. The label should describe the action, not the icon (ex: 'Close dialog', not 'X icon').",
  "level": "must",
  "criterion": "icon-button-accessible-name",
  "category": "accessibility"
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/checklist.schema.json",
  "title": "Checklist document block",
  "description": "A checklist of things to check off — built for agents, but useful for people too. Each item is a short, actionable line, with optional extra detail, a level that marks how strict it is, and an optional link to the criterion that proves it. Use `checklist` for a hands-on pass over something; use `guidelines` for the rules behind it.",
  "$defs": {
    "checklistItem": {
      "type": "object",
      "description": "One thing to check, do, or confirm. `label` is the action itself. `description` adds detail. `level` says how strict it is. `criterion` links to the test that proves it. `optional` lets it be skipped. Only `label` is required.",
      "required": [
        "label"
      ],
      "properties": {
        "label": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "The check itself, written as an instruction you can act on and mark done or not (ex: 'Give every icon-only button an aria-label'). MUST be specific — not 'check accessibility'."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Extra detail — how to do it, what to watch for, or why it matters. Keep the instruction itself in `label`."
        },
        "level": {
          "$ref": "../common/criterion.schema.json#/$defs/conformanceLevel",
          "description": "How strict this item is: 'must' (a hard requirement), 'should' (do it unless you have a reason not to), 'should-not', or 'must-not'. Agents treat must/must-not as non-negotiable. Left out, it's just a recommendation."
        },
        "criterion": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Optional link to a testable criterion (from a guideline or accessibility block) that proves this item passes. MUST be lowercase kebab-case."
        },
        "category": {
          "type": "string",
          "description": "Groups items in a long checklist by discipline: 'visual-design', 'interaction', 'accessibility', 'content', 'motion', 'development', or a custom lowercase kebab-case value."
        },
        "optional": {
          "type": "boolean",
          "default": false,
          "description": "Whether this item can be skipped. Defaults to false. Tools MAY mark optional items differently."
        }
      },
      "additionalProperties": false
    },
    "checklist": {
      "type": "object",
      "description": "A checklist for an artifact — the concrete steps an agent (or a person) works through when building, reviewing, or integrating it. Turns rules into an actual pass, like 'accessibility review' or 'before you ship'. A general block kind, accepted on every entity type, and just as at home in `agentDocumentBlocks`.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "checklist",
          "description": "Identifies this block as a checklist."
        },
        "title": {
          "type": "string",
          "description": "An optional heading naming the checklist (ex: 'Accessibility review', 'Before you ship')."
        },
        "ordered": {
          "type": "boolean",
          "default": false,
          "description": "Whether items must be done in order. Defaults to false — items can be checked off in any order. Set true when each item depends on the last. Tools SHOULD show unordered checklists as checkboxes and ordered ones as a numbered list."
        },
        "items": {
          "type": "array",
          "description": "The checklist items, in order. Order matters when `ordered` is true, so tools MUST preserve it.",
          "items": {
            "$ref": "#/$defs/checklistItem"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false
    }
  }
}
```
