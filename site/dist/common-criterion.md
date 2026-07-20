# Criterion definitions

Definitions for testable success criteria, conformance, and external standard references. Criteria are the test-definition layer of DSDS documentation: each has a unique identifier with an objectively verifiable statement, an optional conformance `level`, a `verification` mode (automated, assisted, or manual), and an optional machine-dispatchable `check`. Test cases with declared outcomes make criteria self-verifying. Used by guideline entries and accessibility document blocks. Observed results belong in a guideline entry's `evidence`.

Source: `common/criterion.schema.json`

**6 definitions** in this file: `criterion`, `conformanceLevel`, `verificationMode`, `criterionCheck`, `criterionTestCase`, `reference`

## criterion {#criterion}

A testable success criterion: an objectively verifiable condition an implementation must meet. `statement` is the human-readable source of truth; `check` describes what tool is used to run the test and is not a replacement for `statement`. Pair with `techniques` (how to pass), `failures` (what failing looks like), `references` (external standards), and `examples` (test cases with declared outcomes).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | ✓ | Stable identifier for this criterion, unique within the parent entity (ex: 'touch-target-minimum', 'single-primary-action'). MUST be lowercase kebab-case. Test runs report pass/fail against this identifier, so it SHOULD NOT change once checks depend on it. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `statement` | [richText](common-rich-text.md#richtext) | ✓ | The testable statement of what success looks like. MUST be objectively verifiable by inspection, static analysis, or runtime measurement. Statements should be concrete and measurable (ex: 'Interactive elements present a hit area of at least 44×44 px'). |
| `title` | string |  | A short display name for the criterion (ex: 'Touch Target Minimum'). Tools SHOULD render it in docs and test reports beside the identifier. |
| `techniques` | [richText](common-rich-text.md#richtext)[] |  | Sufficient ways to satisfy this criterion — the passing patterns (ex: 'Apply `min-height: 44px` to every interactive element', 'Use the `<Button>` component without overriding its default height'). (Min items: 1) |
| `failures` | [richText](common-rich-text.md#richtext)[] |  | Known failure modes. A list of conditions that count as failing this criterion (ex: 'Setting `height` below 44px on an interactive element', 'Removing `aria-label` from an icon-only button'). (Min items: 1) |
| `references` | [reference](common-criterion.md#reference)[] |  | External standards this criterion aligns with or derives from (ex: a matching WCAG success criterion, a platform guideline). (Min items: 1) |
| `examples` | [criterionTestCase](common-criterion.md#criteriontestcase)[] |  | Verification test cases — typically one passing and one failing implementation, each with a declared `outcome`. (Min items: 1) |
| `tags` | string[] |  | Freeform keywords that relate criteria across guidelines and entities (ex: 'a11y', 'contrast', 'touch-target'). |
| `level` | [conformanceLevel](common-criterion.md#conformancelevel) |  | The conformance level of this criterion. A criterion referenced by a guideline SHOULD inherit the guideline's `level` when omitted; a standalone criterion SHOULD declare its own. |
| `verification` | [verificationMode](common-criterion.md#verificationmode) |  |  |
| `check` | [criterionCheck](common-criterion.md#criterioncheck) |  |  |
| `since` | string |  | The design system version in which this criterion was introduced (ex: '1.0.0', '2.3.0'). Criterion identifiers are stable: once published, an identifier MUST NOT be reused for a different requirement — retire the identifier and make a new one instead. |

**References:** [richText](common-rich-text.md#richtext), [reference](common-criterion.md#reference), [criterionTestCase](common-criterion.md#criteriontestcase), [conformanceLevel](common-criterion.md#conformancelevel), [verificationMode](common-criterion.md#verificationmode), [criterionCheck](common-criterion.md#criterioncheck)

**Example:**

```json
[
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
  },
  {
    "identifier": "icon-button-name-present",
    "title": "Icon Button Accessible Name Present",
    "statement": "Every icon-only button exposes a non-empty accessible name.",
    "level": "must",
    "verification": "automated",
    "check": {
      "scheme": "axe-core",
      "rule": "button-name"
    },
    "since": "2.0.0",
    "techniques": [
      "Set `aria-label` on the button (ex: `aria-label=\"Close dialog\"`).",
      "Use visually hidden text inside the button instead of `aria-label`."
    ],
    "failures": [
      "Rendering an icon-only button whose accessible name resolves to an empty string."
    ],
    "examples": [
      {
        "title": "Labelled icon button",
        "outcome": "pass",
        "presentation": {
          "kind": "code",
          "code": "<Button aria-label=\"Close dialog\"><CloseIcon /></Button>",
          "language": "jsx"
        }
      },
      {
        "title": "Unlabelled icon button",
        "outcome": "fail",
        "presentation": {
          "kind": "code",
          "code": "<Button><CloseIcon /></Button>",
          "language": "jsx"
        }
      }
    ]
  },
  {
    "identifier": "icon-button-name-length",
    "title": "Icon Button Name Is Concise",
    "statement": "Icon-only button accessible names are 40 characters or fewer.",
    "level": "should",
    "verification": "assisted",
    "check": {
      "scheme": "com.acme.a11y-lint",
      "rule": "label-length",
      "maxLength": 40
    },
    "techniques": [
      "Name the action, not the icon (ex: 'Close dialog', not 'X mark symbol button')."
    ],
    "failures": [
      "Accessible names that read as sentences rather than action labels."
    ]
  },
  {
    "identifier": "icon-button-name-describes-action",
    "title": "Icon Button Name Describes the Action",
    "statement": "Every icon-only button's accessible name describes the action the button performs, not the icon's appearance.",
    "level": "must",
    "verification": "manual",
    "techniques": [
      "Name the outcome of activation (ex: 'Close dialog', 'Copy link', 'Delete row').",
      "Review names alongside the rendered UI so the action context is visible."
    ],
    "failures": [
      "Names that describe the glyph (ex: 'X icon', 'Trash can') rather than the action.",
      "The same generic name (ex: 'Button') on multiple buttons that perform different actions."
    ],
    "examples": [
      {
        "title": "Action-describing name",
        "outcome": "pass",
        "value": "aria-label=\"Copy link\""
      },
      {
        "title": "Appearance-describing name",
        "outcome": "fail",
        "value": "aria-label=\"Chain icon\""
      }
    ]
  }
]
```

## conformanceLevel {#conformancelevel}

Conformance level, named for RFC 2119 requirement levels: 'must' and 'must-not' are absolute requirements (non-compliance is a failure); 'should' and 'should-not' are recommendations that can be overridden. Values in the schema are lowercase kebab-case (ex: must, should-not); the uppercase RFC 2119 spellings are used only when writing documentation, where they carry conformance weight.

Allowed values:

- `must`
- `should`
- `should-not`
- `must-not`

## verificationMode {#verificationmode}

How a result for this criterion is determined. 'automated': a fully objective test checked programmatically; a `check` MUST be present. 'assisted': a tool surfaces candidates but remains a subjective decision; `check` diagnostics are advisory. 'manual': pure subjective judgment; no `check` applies — `techniques` and `failures` serve as the reviewer's steps. Named procedures (ex: a design review) belong in `techniques`. When omitted, tools MUST NOT assume the criterion is automatable.

Allowed values:

- `automated`
- `assisted`
- `manual`

## criterionCheck {#criterioncheck}

Defines the tool used for testing (ex: 'axe-core', 'vitest', 'stylelint', 'lighthouse'). DSDS only defines the tool. It doesn't define tools' configuration values or settings. Any process that doesn't recognize the tool MUST report the criterion as skipped, never as passing. Like `extensions`, this object is intentionally open: execution details do not live in this specification.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `scheme` | string | ✓ | Identifier of the rule system or runner this check dispatches to. MUST be lowercase; dots permitted for namespacing (e.g. 'com.acme.contract-tests'). (Pattern: `^[a-z][a-z0-9.-]*$`) |

**Example:**

```json
[
  {
    "scheme": "axe-core",
    "rule": "button-name"
  },
  {
    "scheme": "vitest",
    "suite": "button.contract.test.ts",
    "testName": "renders a minimum 44px hit area"
  },
  {
    "scheme": "com.acme.contract-tests",
    "endpoint": "https://ci.acme.com/checks/touch-target"
  }
]
```

## criterionTestCase {#criteriontestcase}

An example with a defined outcome, used as a test case for a criterion. Identical to `example` plus a required `outcome`. This intentionally copies the shape of `example`. `example` is a closed schema, so allOf-extension cannot add `outcome`. When `example` changes, update this definition to match. Test cases make criteria self-verifying: a conformance runner SHOULD execute the criterion's `check` (when present) against each test case and confirm the declared outcome is reproduced — a 'fail' test case that passes means the check no longer detects what it claims to.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | any | at least 1 | A literal value carried by the example. Use it for API property examples, where the content is a concrete value rather than a visual demo. It can display code that reflects the example. Accepts any JSON type: string, number, boolean, object, array, or null. When given without a presentation, this value alone is the example. Do not use `value` for display text. Use `title` and `description` instead. |
| `presentation` | [presentationImage](common-presentation.md#presentationimage) \| [presentationVideo](common-presentation.md#presentationvideo) \| [presentationCode](common-presentation.md#presentationcode) \| [presentationUrl](common-presentation.md#presentationurl) | at least 1 | The visual or interactive presentation for the example. Required when no `value` is set. Optional when `value` is present. |
| `outcome` | `"pass"` \| `"fail"` | at least 1 | Whether this test case satisfies ('pass') or violates ('fail') the criterion. |
| `title` | string |  | A human-readable caption for the example (ex: 'Primary button in default state'). For API property examples, use `value` for the literal content and `title` for the display label. |
| `description` | string |  | An explanation of the example and why it's encouraged, discouraged, or important. |

**Constraint:** At least one of `presentation`, `outcome`, `value`, `outcome` must be present.

**References:** [presentationImage](common-presentation.md#presentationimage), [presentationVideo](common-presentation.md#presentationvideo), [presentationCode](common-presentation.md#presentationcode), [presentationUrl](common-presentation.md#presentationurl)

**Example:**

```json
[
  {
    "title": "Icon-only button with an accessible name",
    "outcome": "pass",
    "presentation": {
      "kind": "code",
      "code": "<Button aria-label=\"Close dialog\"><CloseIcon /></Button>",
      "language": "jsx"
    }
  },
  {
    "title": "Icon-only button with no accessible name",
    "outcome": "fail",
    "presentation": {
      "kind": "code",
      "code": "<Button><CloseIcon /></Button>",
      "language": "jsx"
    }
  }
]
```

## reference {#reference}

A citation of an external standard or requirement. This is a published rule the docs address (ex: WCAG, platform guidelines, vendor compliance frameworks).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string (uri) | ✓ | URL to the external standard or requirement (ex: 'https://www.w3.org/TR/WCAG22/#contrast-minimum'). |
| `label` | string |  | A display label for the citation (ex: '1.4.3 Contrast (Minimum)', 'WCAG 2.5.8 Target Size'). When omitted, tools MAY build a label from the URL. |

**Example:**

```json
[
  {
    "url": "https://www.w3.org/TR/WCAG22/#contrast-minimum",
    "label": "WCAG 1.4.3 Contrast (Minimum)"
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/common/criterion.schema.json",
  "title": "Criterion definitions",
  "description": "Definitions for testable success criteria, conformance, and external standard references. Criteria are the test-definition layer of DSDS documentation: each has a unique identifier with an objectively verifiable statement, an optional conformance `level`, a `verification` mode (automated, assisted, or manual), and an optional machine-dispatchable `check`. Test cases with declared outcomes make criteria self-verifying. Used by guideline entries and accessibility document blocks. Observed results belong in a guideline entry's `evidence`.",
  "$defs": {
    "conformanceLevel": {
      "type": "string",
      "enum": [
        "must",
        "should",
        "should-not",
        "must-not"
      ],
      "description": "Conformance level, named for RFC 2119 requirement levels: 'must' and 'must-not' are absolute requirements (non-compliance is a failure); 'should' and 'should-not' are recommendations that can be overridden. Values in the schema are lowercase kebab-case (ex: must, should-not); the uppercase RFC 2119 spellings are used only when writing documentation, where they carry conformance weight."
    },
    "verificationMode": {
      "type": "string",
      "enum": [
        "automated",
        "assisted",
        "manual"
      ],
      "description": "How a result for this criterion is determined. 'automated': a fully objective test checked programmatically; a `check` MUST be present. 'assisted': a tool surfaces candidates but remains a subjective decision; `check` diagnostics are advisory. 'manual': pure subjective judgment; no `check` applies — `techniques` and `failures` serve as the reviewer's steps. Named procedures (ex: a design review) belong in `techniques`. When omitted, tools MUST NOT assume the criterion is automatable."
    },
    "criterionCheck": {
      "type": "object",
      "description": "Defines the tool used for testing (ex: 'axe-core', 'vitest', 'stylelint', 'lighthouse'). DSDS only defines the tool. It doesn't define tools' configuration values or settings. Any process that doesn't recognize the tool MUST report the criterion as skipped, never as passing. Like `extensions`, this object is intentionally open: execution details do not live in this specification.",
      "required": [
        "scheme"
      ],
      "properties": {
        "scheme": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9.-]*$",
          "description": "Identifier of the rule system or runner this check dispatches to. MUST be lowercase; dots permitted for namespacing (e.g. 'com.acme.contract-tests')."
        }
      },
      "additionalProperties": true
    },
    "criterionTestCase": {
      "type": "object",
      "description": "An example with a defined outcome, used as a test case for a criterion. Identical to `example` plus a required `outcome`. This intentionally copies the shape of `example`. `example` is a closed schema, so allOf-extension cannot add `outcome`. When `example` changes, update this definition to match. Test cases make criteria self-verifying: a conformance runner SHOULD execute the criterion's `check` (when present) against each test case and confirm the declared outcome is reproduced — a 'fail' test case that passes means the check no longer detects what it claims to.",
      "anyOf": [
        {
          "required": [
            "presentation",
            "outcome"
          ]
        },
        {
          "required": [
            "value",
            "outcome"
          ]
        }
      ],
      "properties": {
        "title": {
          "type": "string",
          "description": "A human-readable caption for the example (ex: 'Primary button in default state'). For API property examples, use `value` for the literal content and `title` for the display label."
        },
        "description": {
          "type": "string",
          "description": "An explanation of the example and why it's encouraged, discouraged, or important."
        },
        "value": {
          "description": "A literal value carried by the example. Use it for API property examples, where the content is a concrete value rather than a visual demo. It can display code that reflects the example. Accepts any JSON type: string, number, boolean, object, array, or null. When given without a presentation, this value alone is the example. Do not use `value` for display text. Use `title` and `description` instead."
        },
        "presentation": {
          "description": "The visual or interactive presentation for the example. Required when no `value` is set. Optional when `value` is present.",
          "oneOf": [
            {
              "$ref": "presentation.schema.json#/$defs/presentationImage"
            },
            {
              "$ref": "presentation.schema.json#/$defs/presentationVideo"
            },
            {
              "$ref": "presentation.schema.json#/$defs/presentationCode"
            },
            {
              "$ref": "presentation.schema.json#/$defs/presentationUrl"
            }
          ]
        },
        "outcome": {
          "type": "string",
          "enum": [
            "pass",
            "fail"
          ],
          "description": "Whether this test case satisfies ('pass') or violates ('fail') the criterion."
        }
      },
      "additionalProperties": false
    },
    "reference": {
      "type": "object",
      "description": "A citation of an external standard or requirement. This is a published rule the docs address (ex: WCAG, platform guidelines, vendor compliance frameworks).",
      "required": [
        "url"
      ],
      "properties": {
        "url": {
          "type": "string",
          "format": "uri",
          "description": "URL to the external standard or requirement (ex: 'https://www.w3.org/TR/WCAG22/#contrast-minimum')."
        },
        "label": {
          "type": "string",
          "description": "A display label for the citation (ex: '1.4.3 Contrast (Minimum)', 'WCAG 2.5.8 Target Size'). When omitted, tools MAY build a label from the URL."
        }
      },
      "additionalProperties": false
    },
    "criterion": {
      "type": "object",
      "description": "A testable success criterion: an objectively verifiable condition an implementation must meet. `statement` is the human-readable source of truth; `check` describes what tool is used to run the test and is not a replacement for `statement`. Pair with `techniques` (how to pass), `failures` (what failing looks like), `references` (external standards), and `examples` (test cases with declared outcomes).",
      "required": [
        "identifier",
        "statement"
      ],
      "properties": {
        "identifier": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Stable identifier for this criterion, unique within the parent entity (ex: 'touch-target-minimum', 'single-primary-action'). MUST be lowercase kebab-case. Test runs report pass/fail against this identifier, so it SHOULD NOT change once checks depend on it."
        },
        "title": {
          "type": "string",
          "description": "A short display name for the criterion (ex: 'Touch Target Minimum'). Tools SHOULD render it in docs and test reports beside the identifier."
        },
        "statement": {
          "$ref": "rich-text.schema.json#/$defs/richText",
          "description": "The testable statement of what success looks like. MUST be objectively verifiable by inspection, static analysis, or runtime measurement. Statements should be concrete and measurable (ex: 'Interactive elements present a hit area of at least 44×44 px')."
        },
        "techniques": {
          "type": "array",
          "description": "Sufficient ways to satisfy this criterion — the passing patterns (ex: 'Apply `min-height: 44px` to every interactive element', 'Use the `<Button>` component without overriding its default height').",
          "items": {
            "$ref": "rich-text.schema.json#/$defs/richText"
          },
          "minItems": 1
        },
        "failures": {
          "type": "array",
          "description": "Known failure modes. A list of conditions that count as failing this criterion (ex: 'Setting `height` below 44px on an interactive element', 'Removing `aria-label` from an icon-only button').",
          "items": {
            "$ref": "rich-text.schema.json#/$defs/richText"
          },
          "minItems": 1
        },
        "references": {
          "type": "array",
          "description": "External standards this criterion aligns with or derives from (ex: a matching WCAG success criterion, a platform guideline).",
          "items": {
            "$ref": "#/$defs/reference"
          },
          "minItems": 1
        },
        "examples": {
          "type": "array",
          "description": "Verification test cases — typically one passing and one failing implementation, each with a declared `outcome`.",
          "items": {
            "$ref": "#/$defs/criterionTestCase"
          },
          "minItems": 1
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Freeform keywords that relate criteria across guidelines and entities (ex: 'a11y', 'contrast', 'touch-target')."
        },
        "level": {
          "$ref": "#/$defs/conformanceLevel",
          "description": "The conformance level of this criterion. A criterion referenced by a guideline SHOULD inherit the guideline's `level` when omitted; a standalone criterion SHOULD declare its own."
        },
        "verification": {
          "$ref": "#/$defs/verificationMode"
        },
        "check": {
          "$ref": "#/$defs/criterionCheck"
        },
        "since": {
          "type": "string",
          "description": "The design system version in which this criterion was introduced (ex: '1.0.0', '2.3.0'). Criterion identifiers are stable: once published, an identifier MUST NOT be reused for a different requirement — retire the identifier and make a new one instead."
        }
      },
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "properties": {
              "verification": {
                "const": "automated"
              }
            },
            "required": [
              "verification"
            ]
          },
          "then": {
            "required": [
              "check"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "verification": {
                "const": "manual"
              }
            },
            "required": [
              "verification"
            ]
          },
          "then": {
            "not": {
              "required": [
                "check"
              ]
            }
          }
        },
        {
          "if": {
            "required": [
              "check"
            ]
          },
          "then": {
            "required": [
              "verification"
            ]
          }
        }
      ]
    }
  }
}
```
