# Foundation definitions

A foundation document covers a broad design domain a system is built on — color, typography, spacing, elevation, motion, shape, accessibility, content. It holds the domain's identity and metadata (see metadata/metadata.schema.json), plus its docs.

Source: `entities/foundation.schema.json`

## foundation {#foundation}

The principles, scales, and rules that govern a design domain — color, typography, spacing, elevation, motion, accessibility, content. A domain can be visual (color, spacing) or cross-cutting (accessibility, content). Its identity is `identifier`, `name`, and `description`; its docs cover principles, scale, motion, guidelines, accessibility, content, and more.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"foundation"` | ✓ | Identifies this entity as a foundation. |
| `identifier` | string | ✓ | Machine-readable identifier for the foundation (ex: 'color', 'typography', 'spacing', 'elevation', 'motion', 'shape', 'accessibility', 'content'). MUST be unique within its entity group. (Pattern: `^[a-z][a-z0-9-]*$`) |
| `name` | string | ✓ | Display name shown in docs (ex: 'Color', 'Typography', 'Spacing', 'Elevation', 'Accessibility', 'Content'). |
| `description` | [richText](common-rich-text.md#richtext) |  | What this foundation covers, the design domain it governs, and its role in the system. CommonMark supported. |
| `metadata` | [entityMetadata](metadata-metadata.md#entitymetadata) |  | Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json). |
| `relationships` | [relationships](common-relationship.md#relationships) |  | Links from this foundation to other entities — e.g. 'depends-on' the tokens it builds on. Tools derive the reverse edges. Use `links` metadata for external resources instead. |
| `documentBlocks` | [foundationDocumentBlock](document-blocks-document-blocks.md#foundationdocumentblock)[] |  | All structured docs for this foundation, in order. Accepts the foundation-specific kinds (principles, scale, motion) plus every general kind. Tools SHOULD keep this order for display. Put internal links (like a token group reference) in `links` metadata, not in a block entry. (Min items: 1) |
| `agentDocumentBlocks` | [foundationDocumentBlock](document-blocks-document-blocks.md#foundationdocumentblock)[] |  | Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [entityMetadata](metadata-metadata.md#entitymetadata), [relationships](common-relationship.md#relationships), [foundationDocumentBlock](document-blocks-document-blocks.md#foundationdocumentblock), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "foundation",
  "identifier": "spacing",
  "name": "Spacing",
  "description": "A spatial system built on a 4px base unit. Defines the scale and rules for all whitespace, padding, margin, and gap values across the system. Eliminates ad hoc pixel values and reduces visual inconsistency caused by individual interpretation of spatial relationships.",
  "metadata": {
    "status": "stable",
    "since": "1.0.0",
    "lastUpdated": {
      "date": "2026-03-02",
      "note": "Added the 96px step to the scale and revised the rhythm principle to clarify when to deviate."
    },
    "category": "spacing",
    "tags": [
      "layout",
      "spatial",
      "whitespace",
      "padding",
      "margin",
      "gap",
      "spacing",
      "scale",
      "density"
    ],
    "summary": "A constrained spacing scale built on a 4px base unit.",
    "links": [
      {
        "kind": "source",
        "url": "https://code.acme.com/design-system/src/tokens/spacing.tokens.json",
        "label": "Token source file"
      },
      {
        "kind": "design",
        "url": "https://design-tool.acme.com/file/abc123?node-id=200:1",
        "label": "Design file — spacing variables"
      },
      {
        "kind": "documentation",
        "url": "https://design.acme.com/style/spacing",
        "label": "Documentation site"
      }
    ]
  },
  "documentBlocks": [
    {
      "kind": "principles",
      "items": [
        {
          "title": "Use the scale",
          "description": "Every spacing value must reference a token from the spacing scale. No hard-coded values."
        },
        {
          "title": "Density over decoration",
          "description": "Spacing exists to create clear relationships between elements, not to fill empty areas."
        },
        {
          "title": "Consistent internal, flexible external",
          "description": "Internal spacing within a component is fixed by the component's design specification. External spacing between components is determined by the layout context."
        }
      ]
    },
    {
      "kind": "scale",
      "identifier": "spacing-scale",
      "name": "Spacing Scale",
      "description": "A geometric spacing scale based on a 4px unit.",
      "steps": [
        {
          "token": "space-0",
          "value": "0px",
          "name": "0"
        },
        {
          "token": "space-1",
          "value": "2px",
          "name": "4xs"
        },
        {
          "token": "space-2",
          "value": "4px",
          "name": "3xs"
        },
        {
          "token": "space-3",
          "value": "8px",
          "name": "2xs"
        },
        {
          "token": "space-4",
          "value": "12px",
          "name": "xs"
        },
        {
          "token": "space-5",
          "value": "16px",
          "name": "sm"
        },
        {
          "token": "space-6",
          "value": "24px",
          "name": "md"
        },
        {
          "token": "space-7",
          "value": "32px",
          "name": "lg"
        },
        {
          "token": "space-8",
          "value": "48px",
          "name": "xl"
        }
      ]
    },
    {
      "kind": "motion",
      "description": "Easing curves used when spacing values are animated — for example, when a container expands from space-0 to space-6 or when layout gaps transition between density settings.",
      "items": [
        {
          "identifier": "expand",
          "name": "Expand Ease",
          "description": "Used when a spatial value increases — a container opening, a gap growing, or a panel expanding. The curve starts slow and accelerates into the final position, making the expansion feel deliberate rather than abrupt.",
          "function": [
            0.05,
            0.7,
            0.1,
            1
          ],
          "token": "motion-ease-expand",
          "usage": "container expansion, gap growth, panel open",
          "duration": {
            "min": "200ms",
            "max": "400ms",
            "description": "Scale duration with the distance traveled — use 200ms for small spacing transitions (space-2 to space-4) and up to 400ms for large layout changes."
          }
        },
        {
          "identifier": "collapse",
          "name": "Collapse Ease",
          "description": "Used when a spatial value decreases — a container closing, a gap shrinking, or a panel collapsing. The curve accelerates early and decelerates into the final position, making the collapse feel responsive.",
          "function": [
            0.3,
            0,
            0.8,
            0.15
          ],
          "token": "motion-ease-collapse",
          "usage": "container collapse, gap shrink, panel close",
          "duration": {
            "min": "150ms",
            "max": "300ms",
            "description": "Collapse transitions should be faster than expand transitions to feel snappy."
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Use the spacing scale tokens for all padding, margin, and gap properties. Do not use hard-coded values.",
          "rationale": "Hard-coded values create visual inconsistency and are not responsive to system-wide spacing changes. Tokens enable global adjustment of spatial density from a single source of truth.",
          "level": "must",
          "category": "visual-design"
        },
        {
          "guidance": "Components must not apply external margin. Margin between components is the responsibility of the parent layout.",
          "rationale": "Components that own their margins create unpredictable spacing when composed. A button with built-in margin-bottom behaves differently depending on what follows it. Delegating margin to layout makes spacing composable and predictable.",
          "level": "must",
          "category": "visual-design"
        },
        {
          "guidance": "Select spacing based on the relationship between elements, not their size. Related elements use smaller spacing. Unrelated elements use larger spacing.",
          "rationale": "Gestalt proximity principle: objects that are closer together are perceived as related. Spacing encodes information hierarchy. A label 4px from its input is clearly associated with it. A label 32px from an input appears disconnected.",
          "level": "should",
          "category": "visual-design"
        },
        {
          "guidance": "Do not use spacing tokens for non-spatial properties such as border-width, font-size, or icon-size. Use the tokens designated for those properties.",
          "rationale": "Spacing tokens are tuned for whitespace. A spacing scale step that works well as padding produces incorrect results as a border-width or icon-size. Using the wrong token category couples unrelated visual properties.",
          "level": "must-not",
          "category": "development"
        },
        {
          "guidance": "Use CSS gap (in Flexbox or Grid) as the primary mechanism for spacing between sibling elements. Reserve margin for spacing between non-sibling elements or layout-level offset.",
          "rationale": "Gap applies spacing uniformly between children without affecting the first or last child. Margin requires :first-child/:last-child overrides to prevent unwanted space at container edges.",
          "level": "should",
          "category": "development"
        },
        {
          "guidance": "For responsive layouts, reduce spacing density at smaller breakpoints by stepping down the scale. Do not introduce arbitrary breakpoint-specific values.",
          "rationale": "Stepping down the scale (ex: space-7 at desktop becoming space-5 at mobile) maintains proportional relationships while conserving space. Arbitrary values break out of the scale and undermine system consistency.",
          "level": "should",
          "category": "visual-design"
        },
        {
          "guidance": "Ensure all interactive elements maintain a minimum 44x44 CSS pixel touch target, inclusive of padding.",
          "rationale": "Users with motor impairments and touch device users require a minimum target size to interact reliably. WCAG 2.5.8 requires 24x24px minimum and recommends 44x44px. The spacing system's role is to ensure padding contributes to meeting this target.",
          "level": "must",
          "category": "accessibility",
          "references": [
            {
              "url": "https://www.w3.org/TR/WCAG22/#target-size-minimum"
            }
          ]
        },
        {
          "guidance": "When users increase text size to 200% via browser settings, spacing must not collapse to zero or cause content to overlap.",
          "rationale": "Users with low vision enlarge text. If spacing is defined in fixed pixel units that do not scale, text enlargement causes overlap and loss of content. Use rem-based spacing tokens where possible, and test all layouts at 200% text zoom.",
          "level": "must",
          "category": "accessibility",
          "references": [
            {
              "url": "https://www.w3.org/TR/WCAG22/#resize-text"
            }
          ]
        }
      ]
    },
    {
      "kind": "use-cases",
      "items": [
        {
          "description": "When defining padding, margin, or gap values for any layout or component. All spatial values in production code must reference the spacing scale.",
          "stance": "recommended"
        },
        {
          "description": "When establishing vertical rhythm between content sections, form groups, or card layouts.",
          "stance": "recommended"
        },
        {
          "description": "When setting internal padding for containers such as cards, dialogs, panels, and page regions.",
          "stance": "recommended"
        },
        {
          "description": "When controlling the gap between sibling elements in Flexbox or Grid layouts.",
          "stance": "recommended"
        },
        {
          "description": "When defining border widths, outline offsets, or stroke values.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "border-width",
            "rationale": "Border tokens are tuned for visual weight at sub-pixel and single-pixel sizes. Spacing tokens start at 0px and jump to values optimized for whitespace, which produce incorrect visual results when applied to borders."
          }
        },
        {
          "description": "When setting font sizes or line heights.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "typography",
            "rationale": "Typographic tokens follow a modular scale designed for readability and vertical rhythm. Spacing tokens follow a geometric scale designed for whitespace. The two scales serve different purposes and should not be interchanged."
          }
        },
        {
          "description": "When sizing icons or illustration containers.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "icon-size",
            "rationale": "Icon size tokens are calibrated to optical alignment with adjacent text at each type scale step. Spacing tokens do not account for optical sizing and produce misaligned icons."
          }
        }
      ]
    },
    {
      "kind": "sections",
      "items": [
        {
          "title": "Why a 4px base unit",
          "anchor": "why-4px-base",
          "body": "The scale is built on a 4px base. Doubling and adding from that base keeps adjacent steps visually distinct while staying dense enough for data-heavy UI. A 4px grid also aligns cleanly with common icon and line-height values, so spacing and typography share one rhythm.",
          "sections": [
            {
              "title": "When to break the scale",
              "anchor": "breaking-the-scale",
              "body": "Deviate only for optical alignment the scale cannot express — for example, nudging an icon by 1px so it sits on its baseline. Document any such exception next to the component that needs it."
            }
          ]
        }
      ]
    }
  ],
  "agentDocumentBlocks": [
    {
      "kind": "use-cases",
      "purpose": "Document spacing scale tokens and enforce their consistent application across layout, components, and typography.",
      "items": [
        {
          "description": "Spacing governs whitespace and layout gaps; typography governs type size, weight, and line height.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "typography foundation"
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Do not substitute spacing tokens with typography or icon-size tokens.",
          "level": "must-not"
        },
        {
          "guidance": "Always use the next scale step up or down rather than custom values.",
          "level": "should"
        }
      ]
    }
  ],
  "relationships": [
    {
      "relation": "depends-on",
      "target": "spacing-scale",
      "role": "Provides all spatial tokens from space-0 (0px) through space-8 (48px), built on a 4px base unit."
    }
  ]
}
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/entities/foundation.schema.json",
  "title": "Foundation definitions",
  "description": "A foundation document covers a broad design domain a system is built on — color, typography, spacing, elevation, motion, shape, accessibility, content. It holds the domain's identity and metadata (see metadata/metadata.schema.json), plus its docs.",
  "$defs": {
    "foundation": {
      "type": "object",
      "description": "The principles, scales, and rules that govern a design domain — color, typography, spacing, elevation, motion, accessibility, content. A domain can be visual (color, spacing) or cross-cutting (accessibility, content). Its identity is `identifier`, `name`, and `description`; its docs cover principles, scale, motion, guidelines, accessibility, content, and more.",
      "required": [
        "kind",
        "identifier",
        "name"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "foundation",
          "description": "Identifies this entity as a foundation."
        },
        "identifier": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Machine-readable identifier for the foundation (ex: 'color', 'typography', 'spacing', 'elevation', 'motion', 'shape', 'accessibility', 'content'). MUST be unique within its entity group."
        },
        "name": {
          "type": "string",
          "description": "Display name shown in docs (ex: 'Color', 'Typography', 'Spacing', 'Elevation', 'Accessibility', 'Content')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this foundation covers, the design domain it governs, and its role in the system. CommonMark supported."
        },
        "metadata": {
          "$ref": "../metadata/metadata.schema.json#/$defs/entityMetadata",
          "description": "Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json)."
        },
        "relationships": {
          "$ref": "../common/relationship.schema.json#/$defs/relationships",
          "description": "Links from this foundation to other entities — e.g. 'depends-on' the tokens it builds on. Tools derive the reverse edges. Use `links` metadata for external resources instead."
        },
        "documentBlocks": {
          "type": "array",
          "description": "All structured docs for this foundation, in order. Accepts the foundation-specific kinds (principles, scale, motion) plus every general kind. Tools SHOULD keep this order for display. Put internal links (like a token group reference) in `links` metadata, not in a block entry.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/foundationDocumentBlock"
          },
          "minItems": 1
        },
        "agentDocumentBlocks": {
          "type": "array",
          "description": "Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/foundationDocumentBlock"
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
