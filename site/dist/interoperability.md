# Interoperability — DSDS 0.15.2

No open standard covers the whole of design-system documentation — components, tokens, and guidelines together. The standards that do exist each cover one layer well. The [W3C Design Tokens format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) (DTCG) trades token **values**. [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM) describes component **code APIs**. DSDS sits in the layer above both: it documents meaning, usage, and intent, and **points at** the other formats instead of duplicating what they already own. This page spells out each relationship.

## What DSDS does not define

| Concern | Source of truth | How DSDS points at it |
|---|---|---|
| Token values and platform mappings | DTCG token files | `token`/`tokenGroup`/`theme` `source` (`file` + `path`) |
| Component code API facts | CEM manifest (web components) or framework typings | `api` block, generatable from the manifest; `links` kind `manifest` |
| Live component demos | Storybook or equivalent | `preview` metadata, `presentationUrl`, `links` kind `storybook` |
| Design artifacts | Design tool files | `links` kind `design`, `thumbnail` |
| Source code | The repository | `links` kinds `source` / `repository`, chunk `code.src` |

DSDS owns what none of those formats carry:

- usage guidance with rationale and RFC 2119 levels
- use cases and alternatives
- accessibility documentation with testable criteria
- anatomy
- the entity relationship graph
- agent-directed rules
- documentation provenance (`docOrigin`) and accountability (`governance`)

## DSDS and the W3C Design Tokens format

The DTCG file is the source of truth for values; DSDS is the documentation around them. The rules of the relationship:

- A DSDS `token` entity **references** its DTCG definition via `source` (`file` + JSON path). DSDS documents never carry resolved values, so values cannot fork between the two files.
- DSDS token `identifier`s are deliberately unrestricted (no kebab-case pattern) so DTCG-style names can be referenced as written.
- Theme `overrides` record **which token changes and why**. The override values themselves live in the theme's DTCG file, which the theme's `source` points to.
- Token-purpose maps elsewhere in DSDS (anatomy, states, variants) reference tokens by identifier, and are checked against the documented token layer to make sure they resolve.

DTCG has no schema or validator of its own. DSDS doesn't try to validate DTCG files — it only validates that DSDS documents point at them correctly.

### Worked example: one token, two files

The DTCG file owns the value:

{/* dsds:include spec/examples/interop/color-action-primary.tokens.json */}
```json
{
  "color": {
    "action": {
      "primary": {
        "$type": "color",
        "$value": "#0055ff",
        "$description": "Primary action color."
      }
    }
  }
}
```
{/* /dsds:include */}

The DSDS document owns the meaning, and points at it via `source` — no value is duplicated, so nothing can fork:

{/* dsds:include spec/examples/interop/color-action-primary.dsds.json */}
```json
{
  "$schema": "https://designsystemdocspec.org/v0.15.2/dsds.bundled.schema.json",
  "dsdsVersion": "0.15.2",
  "entity": {
    "kind": "token",
    "identifier": "color-action-primary",
    "name": "Action Primary",
    "description": "Background color for primary action surfaces — the one action we most want the user to take on a screen. The value itself lives in the DTCG file that `source` points to; this document only carries the meaning and usage rules around it.",
    "tokenType": "color",
    "source": {
      "file": "./color-action-primary.tokens.json",
      "path": "color.action.primary"
    },
    "documentBlocks": [
      {
        "kind": "guidelines",
        "items": [
          {
            "level": "should",
            "rationale": "Two competing primary actions split the user's attention and dilute the visual hierarchy the color exists to create.",
            "guidance": "Use for at most one action per surface."
          }
        ]
      }
    ],
    "metadata": {
      "summary": "Primary action background. Value defined in the DTCG token file; documented here."
    }
  }
}
```
{/* /dsds:include */}

Both files live in `spec/examples/interop/` and the DSDS half is validated by the test suite on every build, so this example cannot drift from the schema.

## DSDS and Custom Elements Manifest

CEM and the DSDS `api` block describe the same territory, member for member. By design, the `api` block can be generated straight from a manifest:

| CEM | DSDS `api` block |
|---|---|
| `ClassField` / `Attribute` | `apiProperty` (`identifier`, `type`, `defaultValue`, `deprecated`) |
| `Event` | `apiEvent` |
| `Slot` | `apiSlot` |
| `CssCustomProperty` | `apiCssCustomProperty` |
| `CssPart` | `apiCssPart` |
| `ClassMethod` | `apiMethod` |
| `summary` / `description` | `description` (richText) |

The intended pipeline for web-component systems: on each release, **generate** the `api` block from the manifest, and mark it `docOrigin.blocks.api = {"origin": "generated", "authorship": "machine-generated"}`. Keep the human-authored layers — guidelines, use cases, accessibility, anatomy — in the same entity. The `docOrigin` field exists so a document can carry both, and a consumer can tell which is which. Link the manifest itself from the entity's `links`, with kind `manifest`.

### Worked example: CEM's own sample manifest

The manifest below is the example from the CEM readme, verbatim:

{/* dsds:include spec/examples/interop/my-element.custom-elements.json */}
```json
{
  "schemaVersion": "2.1.0",
  "readme": "README.md",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "my-project/my-element.js",
      "declarations": [
        {
          "kind": "class",
          "customElement": true,
          "name": "MyElement",
          "tagName": "my-element",
          "description": "This is the description of the class",
          "members": [
            {
              "kind": "field",
              "name": "disabled"
            },
            {
              "kind": "method",
              "name": "fire"
            }
          ],
          "events": [
            {
              "name": "disabled-changed",
              "type": {
                "text": "Event"
              }
            }
          ],
          "attributes": [
            {
              "name": "disabled"
            }
          ],
          "superclass": {
            "name": "HTMLElement"
          }
        }
      ],
      "exports": [
        {
          "kind": "js",
          "name": "MyElement",
          "declaration": {
            "name": "MyElement"
          }
        },
        {
          "kind": "custom-element-definition",
          "name": "my-element",
          "declaration": {
            "name": "MyElement"
          }
        }
      ]
    }
  ]
}
```
{/* /dsds:include */}

Run through the mapping table above, it becomes this valid DSDS component document:

{/* dsds:include spec/examples/interop/my-element.dsds.json */}
```json
{
  "$schema": "https://designsystemdocspec.org/v0.15.2/dsds.bundled.schema.json",
  "dsdsVersion": "0.15.2",
  "entity": {
    "kind": "component",
    "identifier": "my-element",
    "name": "MyElement",
    "description": "This is the description of the class",
    "metadata": {
      "docOrigin": {
        "overall": "generated",
        "authorship": "machine-generated",
        "note": "Generated from custom-elements.json (CEM schemaVersion 2.1.0) by cem-to-dsds. Usage guidance has not been authored yet."
      },
      "links": [
        {
          "kind": "manifest",
          "url": "https://example.com/my-project/custom-elements.json",
          "label": "Custom Elements Manifest"
        },
        {
          "kind": "source",
          "url": "https://example.com/my-project/my-element.js",
          "label": "my-project/my-element.js"
        },
        {
          "kind": "documentation",
          "url": "https://example.com/my-project/README.md",
          "label": "README"
        }
      ]
    },
    "documentBlocks": [
      {
        "kind": "imports",
        "items": [
          {
            "platform": "web-component",
            "code": "import 'my-project/my-element.js';",
            "description": "Importing the module registers the `<my-element>` tag (custom-element-definition export)."
          }
        ]
      },
      {
        "kind": "api",
        "properties": [
          {
            "identifier": "disabled",
            "type": "boolean",
            "description": "Reflected property/attribute pair `disabled` (CEM field + attribute of the same name). The manifest carries no prose for this member; description pending human review."
          }
        ],
        "events": [
          {
            "identifier": "disabled-changed",
            "description": "Fired on `disabled` changes (inferred from the event name; the manifest carries no prose). Description pending human review.",
            "payload": "Event"
          }
        ],
        "methods": [
          {
            "identifier": "fire",
            "description": "Public method `fire` (CEM class method). The manifest carries no prose for this member; description pending human review."
          }
        ]
      }
    ]
  }
}
```
{/* /dsds:include */}

Three things to notice here — they are the interoperability story in miniature.

1. The `field` and `attribute`, both named `disabled`, become **one** `apiProperty`. CEM models the code surfaces separately; DSDS documents the logical property instead.
2. `superclass: HTMLElement` is deliberately dropped. CEM records implementation inheritance. DSDS `extends` means design-system inheritance. Mixing the two up would be wrong.
3. The friction here is visible, and intentional. DSDS requires a `description` on every API entry, and this minimal manifest has none. So the converter derives what it can, marks the gaps "pending human review," and labels the block `machine-generated` via `docOrigin`.

The generated document is valid, but visibly unfinished — which is exactly the right starting state. Everything CEM knows gets filled in. Every empty slot is one CEM never had. The editorial lint agrees: DSDS-006 flags this very document for its missing `use-cases` block. That warning is the authoring to-do list, on purpose.

What DSDS adds that CEM has no slot for: *when to use* the component, RFC 2119 usage rules with rationale, accessibility criteria with declared verification modes, variants and states as designed concepts (not just code enums), and the relationship graph.

## DSDS and Storybook, design tools, and code

These are display and authoring surfaces, not schemas, so DSDS integrates with them by pointer, not by schema mapping:

- `preview` metadata for the canonical embed
- `presentationUrl` presentations for per-example stories
- `links` kinds `storybook`, `design`, `source`, `package`, `repository`, and `documentation` for everything else

Chunks reference living source files directly (`code.src`), so a copy-paste starting point can share one canonical file with a running app.

## The positioning in one sentence

Wherever a machine-readable source of truth already exists, DSDS references it and documents around it. DSDS is only ever the source of truth for the documentation itself.
