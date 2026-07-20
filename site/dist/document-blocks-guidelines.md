# Guidelines document block

Usage rules for an artifact. Each item pairs a rule with why it exists. Guidelines say what to do (or not do), and why.

Source: `document-blocks/guidelines.schema.json`

**2 definitions** in this file: `guidelines`, `guidelineEntry`

## guidelines {#guidelines}

Usage rules for an artifact — each a do/don't statement with a reason. Answers *how* to use it correctly. For *whether* to use it, see `use-cases`; for the beliefs behind the rules (on foundations), see `principles`. Accessibility and content rules go here too (categories 'accessibility'/'content') — the `accessibility` and `content` blocks are for structured reference data, not rules.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `items` | [guidelineEntry](document-blocks-guidelines.md#guidelineentry)[] | ✓ | The rules, in order. Tools SHOULD keep this order; authors SHOULD lead with the most important or group by category. (Min items: 1) |
| `kind` | `"guidelines"` | ✓ | Identifies this block as a guidelines spec. |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [guidelineEntry](document-blocks-guidelines.md#guidelineentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "guidelines",
  "items": [
    {
      "guidance": "Use at most one primary (filled) button per visible surface.",
      "rationale": "Multiple primary buttons dilute visual hierarchy.",
      "level": "must",
      "category": "visual-design",
      "criteria": [
        {
          "identifier": "single-primary-action",
          "title": "Single Primary Action",
          "statement": "A surface contains at most one element with `variant=\"primary\"`."
        }
      ]
    },
    {
      "guidance": "Maintain a minimum tap target of 44×44 CSS pixels for all button sizes.",
      "rationale": "Touch devices require larger targets to prevent mis-taps.",
      "level": "must",
      "category": "accessibility",
      "criteria": [
        {
          "identifier": "touch-target-minimum",
          "title": "Touch Target Minimum",
          "statement": "Every interactive element exposes a hit area of at least 44×44 CSS pixels."
        }
      ],
      "references": [
        {
          "url": "https://www.w3.org/TR/WCAG22/#target-size-minimum",
          "label": "WCAG 2.5.8 Target Size (Minimum)"
        }
      ]
    }
  ]
}
```

## guidelineEntry {#guidelineentry}

One rule. `guidance` is the rule; `rationale` says why. `level` sets how strict it is. `category` groups it by discipline. `target` points at a specific part. `criteria` are tests that prove the rule holds. `references` cites outside standards like WCAG.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `guidance` | [richText](common-rich-text.md#richtext) | ✓ | The rule itself. MUST be concrete and clear — not 'use sparingly' or 'when possible'. |
| `level` | [conformanceLevel](common-criterion.md#conformancelevel) | ✓ | How strict the rule is: 'must' (breaking it is a defect), 'should' (follow it unless you have a good reason not to), 'should-not', or 'must-not'. Agents treat must/must-not as non-negotiable when writing or reviewing code. |
| `rationale` | [richText](common-rich-text.md#richtext) |  | Why the rule exists — cite evidence, accessibility standards, or research when you have it. MUST NOT just repeat the guidance. |
| `evidence` | string |  | Data backing this rule — test results, audit findings, or cited sources (ex: '9/10 agent test runs failed touch-target minimums below 36px'). Kept separate from `rationale` so tools can tell tested rules from conventional guidance. |
| `category` | string |  | Groups the rule by discipline: 'visual-design', 'interaction', 'accessibility', 'content', 'motion', or 'development'. Custom values allowed, in lowercase kebab-case. |
| `target` | string |  | The part this rule applies to (ex: 'label', 'icon'). Left out, it applies to the whole artifact. |
| `criteria` | [criterion](common-criterion.md#criterion)[] |  | Tests that prove this rule is met. Only add these when success can be objectively verified. Test results belong in `evidence`, not here. (Min items: 1) |
| `references` | [reference](common-criterion.md#reference)[] |  | Outside standards this rule follows (ex: WCAG, MDN, platform guidelines) — a URL and an optional label. (Min items: 1) |
| `examples` | [example](common-example.md#example)[] |  | Examples showing encouraged and discouraged approaches. (Min items: 1) |
| `tags` | string[] |  | Freeform keywords that relate guidelines across categories and disciplines (ex: 'rtl', 'localization', 'validation', 'contrast'). (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [conformanceLevel](common-criterion.md#conformancelevel), [criterion](common-criterion.md#criterion), [reference](common-criterion.md#reference), [example](common-example.md#example)

**Example:**

```json
[
  {
    "guidance": "Use at most one primary (filled) button per visible surface.",
    "rationale": "Multiple primary buttons on the same surface dilute visual hierarchy and confuse users about which action is most important.",
    "level": "must",
    "category": "visual-design",
    "criteria": [
      {
        "identifier": "single-primary-action",
        "title": "Single Primary Action",
        "statement": "A surface contains at most one element with `variant=\"primary\"`. Verifiable by static AST scan of the rendered tree.",
        "techniques": [
          "Use `variant=\"primary\"` for the most important action and `variant=\"secondary\"` for the next-most-important.",
          "When two actions appear adjacent (ex: Save / Cancel), assign primary to Save and secondary to Cancel."
        ],
        "failures": [
          "Rendering two or more elements with `variant=\"primary\"` inside the same form, dialog, or card."
        ],
        "examples": [
          {
            "title": "Correct — single primary action",
            "presentation": {
              "kind": "code",
              "code": "<ButtonGroup>\n  <Button variant=\"secondary\">Cancel</Button>\n  <Button variant=\"primary\">Save</Button>\n</ButtonGroup>",
              "language": "jsx"
            },
            "outcome": "pass"
          },
          {
            "title": "Incorrect — two primary actions on the same surface",
            "presentation": {
              "kind": "code",
              "code": "<ButtonGroup>\n  <Button variant=\"primary\">Cancel</Button>\n  <Button variant=\"primary\">Save</Button>\n</ButtonGroup>",
              "language": "jsx"
            },
            "outcome": "fail"
          }
        ],
        "tags": [
          "visual-hierarchy",
          "governance"
        ]
      }
    ]
  },
  {
    "guidance": "Maintain a minimum tap target of 44×44 CSS pixels for all button sizes.",
    "rationale": "Touch devices require larger targets to prevent mis-taps. WCAG 2.5.8 requires 24×24px minimum and recommends 44×44px.",
    "level": "must",
    "category": "accessibility",
    "criteria": [
      {
        "identifier": "touch-target-minimum",
        "title": "Touch Target Minimum",
        "statement": "Every interactive element exposes a hit area of at least 44×44 CSS pixels in all viewports. Verifiable via runtime measurement of bounding rectangles.",
        "techniques": [
          "Apply `min-height: 44px` and sufficient horizontal padding to every interactive element.",
          "Use the `<Button>` component without overriding its default height."
        ],
        "failures": [
          "Setting `height` below 44px on an interactive element.",
          "Removing default vertical padding from the component's CSS."
        ],
        "references": [
          {
            "url": "https://www.w3.org/TR/WCAG22/#target-size-minimum",
            "label": "WCAG 2.5.8 Target Size (Minimum)"
          }
        ],
        "tags": [
          "a11y",
          "touch-target",
          "governance"
        ]
      }
    ],
    "references": [
      {
        "url": "https://www.w3.org/TR/WCAG22/#target-size-enhanced",
        "label": "WCAG 2.5.5 Target Size (Enhanced)"
      }
    ]
  },
  {
    "guidance": "Button label text must meet a minimum 4.5:1 contrast ratio against the button background.",
    "rationale": "Text contrast ensures readability for users with low vision. Failing this criterion is a documented WCAG AA failure.",
    "level": "must",
    "category": "accessibility",
    "references": [
      {
        "url": "https://www.w3.org/TR/WCAG22/#contrast-minimum",
        "label": "WCAG 1.4.3 Contrast (Minimum)"
      }
    ]
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/guidelines.schema.json",
  "title": "Guidelines document block",
  "description": "Usage rules for an artifact. Each item pairs a rule with why it exists. Guidelines say what to do (or not do), and why.",
  "$defs": {
    "guidelineEntry": {
      "type": "object",
      "description": "One rule. `guidance` is the rule; `rationale` says why. `level` sets how strict it is. `category` groups it by discipline. `target` points at a specific part. `criteria` are tests that prove the rule holds. `references` cites outside standards like WCAG.",
      "required": [
        "guidance",
        "level"
      ],
      "properties": {
        "guidance": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "The rule itself. MUST be concrete and clear — not 'use sparingly' or 'when possible'."
        },
        "rationale": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "Why the rule exists — cite evidence, accessibility standards, or research when you have it. MUST NOT just repeat the guidance."
        },
        "level": {
          "$ref": "../common/criterion.schema.json#/$defs/conformanceLevel",
          "description": "How strict the rule is: 'must' (breaking it is a defect), 'should' (follow it unless you have a good reason not to), 'should-not', or 'must-not'. Agents treat must/must-not as non-negotiable when writing or reviewing code."
        },
        "evidence": {
          "type": "string",
          "description": "Data backing this rule — test results, audit findings, or cited sources (ex: '9/10 agent test runs failed touch-target minimums below 36px'). Kept separate from `rationale` so tools can tell tested rules from conventional guidance."
        },
        "category": {
          "type": "string",
          "description": "Groups the rule by discipline: 'visual-design', 'interaction', 'accessibility', 'content', 'motion', or 'development'. Custom values allowed, in lowercase kebab-case."
        },
        "target": {
          "type": "string",
          "description": "The part this rule applies to (ex: 'label', 'icon'). Left out, it applies to the whole artifact."
        },
        "criteria": {
          "type": "array",
          "description": "Tests that prove this rule is met. Only add these when success can be objectively verified. Test results belong in `evidence`, not here.",
          "items": {
            "$ref": "../common/criterion.schema.json#/$defs/criterion"
          },
          "minItems": 1
        },
        "references": {
          "type": "array",
          "description": "Outside standards this rule follows (ex: WCAG, MDN, platform guidelines) — a URL and an optional label.",
          "items": {
            "$ref": "../common/criterion.schema.json#/$defs/reference"
          },
          "minItems": 1
        },
        "examples": {
          "type": "array",
          "description": "Examples showing encouraged and discouraged approaches.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Freeform keywords that relate guidelines across categories and disciplines (ex: 'rtl', 'localization', 'validation', 'contrast').",
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "guidelines": {
      "type": "object",
      "description": "Usage rules for an artifact — each a do/don't statement with a reason. Answers *how* to use it correctly. For *whether* to use it, see `use-cases`; for the beliefs behind the rules (on foundations), see `principles`. Accessibility and content rules go here too (categories 'accessibility'/'content') — the `accessibility` and `content` blocks are for structured reference data, not rules.",
      "required": [
        "kind",
        "items"
      ],
      "properties": {
        "items": {
          "type": "array",
          "description": "The rules, in order. Tools SHOULD keep this order; authors SHOULD lead with the most important or group by category.",
          "items": {
            "$ref": "#/$defs/guidelineEntry"
          },
          "minItems": 1
        },
        "kind": {
          "type": "string",
          "const": "guidelines",
          "description": "Identifies this block as a guidelines spec."
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
