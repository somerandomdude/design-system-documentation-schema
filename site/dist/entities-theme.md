# Theme definitions

A theme documents an alternative set of token values — a color mode, density setting, or brand variant. DSDS captures its purpose, docs, and relationships; the actual override values live in the DTCG file `source` points to. Put internal links in `links` metadata, not a block.

Source: `entities/theme.schema.json`

**2 definitions** in this file: `theme`, `tokenOverride`

## theme {#theme}

A named context that adapts the system's token values — a color mode (light, dark, high-contrast), a density (compact, comfortable), a brand variant, or a product-specific tweak. DSDS captures the theme's purpose, docs, accessibility notes, and which tokens it affects; the override values live in the DTCG file `source` points to. The token catalog is still the source of truth for token identity, type, and docs.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"theme"` | ✓ | Identifies this entity as a theme. |
| `identifier` | string | ✓ | Machine-readable identifier for the theme (ex: 'dark', 'high-contrast', 'compact', 'brand-sub-brand'). (Pattern: `^[a-z][a-z0-9-]*$`) |
| `name` | string | ✓ | Display name for the theme (ex: 'Dark Mode', 'High Contrast', 'Compact Density'). |
| `description` | [richText](common-rich-text.md#richtext) |  | What this theme is for, the context it adapts the system to, and when to apply it. CommonMark supported. |
| `metadata` | [entityMetadata](metadata-metadata.md#entitymetadata) |  | Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json). |
| `source` | object {file, path} |  | Points to the DTCG (W3C Design Tokens) file. DSDS doesn't copy token values — the DTCG file is the source of truth for resolved values, aliases, and type. |
| `overrides` | [tokenOverride](entities-theme.md#tokenoverride)[] |  | The token overrides this theme applies. List only tokens that differ from the default — anything unlisted keeps its default. The values themselves live in the DTCG file `source` points to. (Min items: 1) |
| `relationships` | [relationships](common-relationship.md#relationships) |  | Links from this theme to other entities — e.g. 'depends-on' the tokens it overrides, 'extends' a base theme. Tools derive the reverse edges. |
| `documentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | All structured docs for this theme, in order. Themes accept the general kinds only (guidelines, use-cases, accessibility, content, sections, checklist). Tools SHOULD keep this order for display. (Min items: 1) |
| `agentDocumentBlocks` | [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock)[] |  | Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first. (Min items: 1) |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**References:** [richText](common-rich-text.md#richtext), [entityMetadata](metadata-metadata.md#entitymetadata), [tokenOverride](entities-theme.md#tokenoverride), [relationships](common-relationship.md#relationships), [generalDocumentBlock](document-blocks-document-blocks.md#generaldocumentblock), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "theme",
  "identifier": "dark",
  "name": "Dark Mode",
  "description": "The dark color mode theme. Inverts the default light surface/text relationship, using light text on dark backgrounds. Designed for low-light environments, user preference, and reduced eye strain. All override values have been validated to maintain WCAG AA contrast ratios against the dark background surfaces.",
  "metadata": {
    "status": {
      "overall": "stable",
      "platforms": {
        "react": {
          "status": "stable",
          "since": "2.0.0"
        },
        "web-component": {
          "status": "stable",
          "since": "2.1.0"
        },
        "ios": {
          "status": "stable",
          "since": "2.0.0",
          "note": "Automatically applied when the device is set to dark appearance."
        },
        "android": {
          "status": "stable",
          "since": "2.2.0",
          "note": "Follows the system-level dark theme setting via AppCompat.DayNight."
        },
        "figma": {
          "status": "stable",
          "since": "2.0.0",
          "note": "Available as a dedicated mode in the Figma variable collection."
        }
      }
    },
    "since": "2.0.0",
    "lastUpdated": {
      "date": "2026-04-12",
      "note": "Tuned surface elevation overrides to meet WCAG 2.2 contrast on layered cards."
    },
    "category": "color-mode",
    "tags": [
      "dark-mode",
      "color-mode",
      "accessibility",
      "night",
      "low-light",
      "theme",
      "override"
    ],
    "summary": "A dark color mode theme for low-light environments and user preference.",
    "links": [
      {
        "kind": "design",
        "url": "https://www.figma.com/file/abc123/color-system?node-id=100:200",
        "label": "Figma — Dark mode variable collection"
      },
      {
        "kind": "documentation",
        "url": "https://design.example.com/foundations/color/dark-mode",
        "label": "Dark mode usage guidelines"
      },
      {
        "kind": "source",
        "url": "https://github.com/example/design-system/blob/main/tokens/themes/dark.tokens.json",
        "label": "Dark theme token source (DTCG format)"
      }
    ]
  },
  "overrides": [
    {
      "token": "color-background-default",
      "description": "Inverted default surface for dark mode."
    },
    {
      "token": "color-background-elevation-accent",
      "description": "Slightly lighter accent surface for dark layering."
    },
    {
      "token": "color-background-elevation-floating",
      "description": "Floating surface, one step lighter than accent in dark mode."
    },
    {
      "token": "color-background-elevation-raised",
      "description": "Raised surface, lighter still to communicate depth in dark mode."
    },
    {
      "token": "color-background-secondary-base",
      "description": "Secondary background remapped for dark surfaces."
    },
    {
      "token": "color-background-inverse-base",
      "description": "Inverse background flipped to near-white for dark mode."
    },
    {
      "token": "color-background-error-base",
      "description": "Error background lightened for visibility on dark surfaces."
    },
    {
      "token": "color-background-error-weak",
      "description": "Subtle error background darkened for dark mode."
    },
    {
      "token": "color-background-success-base",
      "description": "Success background lightened for visibility on dark surfaces."
    },
    {
      "token": "color-background-success-weak",
      "description": "Subtle success background darkened for dark mode."
    },
    {
      "token": "color-background-info-base",
      "description": "Info background lightened for visibility on dark surfaces."
    },
    {
      "token": "color-background-info-weak",
      "description": "Subtle info background darkened for dark mode."
    },
    {
      "token": "color-background-warning-base",
      "description": "Warning background lightened for visibility on dark surfaces."
    },
    {
      "token": "color-background-warning-weak",
      "description": "Subtle warning background darkened for dark mode."
    },
    {
      "token": "color-background-selected-base",
      "description": "Selected-state background remapped for dark surfaces."
    },
    {
      "token": "color-text-default",
      "description": "Primary text switched to white for dark backgrounds."
    },
    {
      "token": "color-text-subtle",
      "description": "Subtle text lightened to maintain AA contrast on dark surfaces."
    },
    {
      "token": "color-text-disabled",
      "description": "Disabled text adjusted for dark mode."
    },
    {
      "token": "color-text-inverse",
      "description": "Inverse text switched to near-black for light-on-dark inversion."
    },
    {
      "token": "color-text-error",
      "description": "Error text lightened for contrast on dark backgrounds."
    },
    {
      "token": "color-text-success",
      "description": "Success text lightened for contrast on dark backgrounds."
    },
    {
      "token": "color-text-warning",
      "description": "Warning text adjusted for dark mode contrast."
    },
    {
      "token": "color-text-link",
      "description": "Link text shifted to a lighter blue for dark mode."
    },
    {
      "token": "color-icon-default",
      "description": "Default icon color switched to white for dark mode."
    },
    {
      "token": "color-icon-subtle",
      "description": "Subtle icon color lightened for dark surfaces."
    },
    {
      "token": "color-icon-inverse",
      "description": "Inverse icon color switched to near-black."
    },
    {
      "token": "color-icon-disabled",
      "description": "Disabled icon color adjusted for dark mode."
    },
    {
      "token": "color-icon-error",
      "description": "Error icon color lightened for dark backgrounds."
    },
    {
      "token": "color-icon-success",
      "description": "Success icon color lightened for dark backgrounds."
    },
    {
      "token": "color-icon-info",
      "description": "Info icon color lightened for dark backgrounds."
    },
    {
      "token": "color-icon-warning",
      "description": "Warning icon color adjusted for dark mode."
    },
    {
      "token": "color-icon-recommendation",
      "description": "Recommendation icon color lightened for dark backgrounds."
    },
    {
      "token": "color-border-default",
      "description": "Default border lightened for visibility on dark surfaces."
    },
    {
      "token": "color-border-container",
      "description": "Container border adjusted for dark mode."
    },
    {
      "token": "color-border-error",
      "description": "Error border lightened for dark backgrounds."
    },
    {
      "token": "elevation-floating",
      "description": "Floating elevation removed; dark mode uses surface color for depth."
    },
    {
      "token": "elevation-raised-top",
      "description": "Top raised shadow effectively invisible in dark mode."
    },
    {
      "token": "elevation-raised-bottom",
      "description": "Bottom raised shadow effectively invisible in dark mode."
    }
  ],
  "documentBlocks": [
    {
      "kind": "use-cases",
      "items": [
        {
          "description": "When the user's system preference is `prefers-color-scheme: dark` or they have explicitly selected dark mode in the application settings.",
          "stance": "recommended"
        },
        {
          "description": "When the application is used in low-light environments where a bright screen causes eye strain or discomfort.",
          "stance": "recommended"
        },
        {
          "description": "When embedding content in a context that is already dark (ex: a media player, a code editor, or a presentation tool in dark mode).",
          "stance": "recommended"
        },
        {
          "description": "When the user has not expressed a preference for dark mode. Default to the light theme.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "light",
            "rationale": "Dark mode can reduce readability for users with certain visual impairments such as astigmatism, where light text on dark backgrounds causes halation. Defaulting to light ensures the broadest accessibility baseline."
          }
        },
        {
          "description": "When high-contrast accessibility is the primary concern rather than a dark aesthetic.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "high-contrast",
            "rationale": "The dark theme is optimized for comfort in low-light environments, not maximum contrast. The high-contrast theme provides stronger contrast ratios that better serve users with low vision."
          }
        },
        {
          "description": "When the content is primarily photographic or illustrative and the surrounding chrome should not compete visually.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "light",
            "rationale": "Photographic content often assumes a neutral white surround for accurate color perception. A dark surround shifts the viewer's perception of brightness and color in the images."
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Apply the dark theme at the application root when the user's system preference is `prefers-color-scheme: dark` or when they explicitly select dark mode in the application settings.",
          "rationale": "Respecting the user's color scheme preference improves comfort in low-light environments and can reduce eye strain. Forcing a color mode against the user's preference creates friction.",
          "level": "must",
          "category": "development"
        },
        {
          "guidance": "In dark mode, layers become one step lighter with each added layer. Do not apply components that are darker than their background surface.",
          "rationale": "The dark theme's layering model uses increasing lightness to communicate depth. Reversing this — placing darker elements on lighter surfaces — breaks the spatial hierarchy and confuses the visual relationship between layers.",
          "level": "must",
          "category": "visual-design"
        },
        {
          "guidance": "Do not mix light-mode and dark-mode semantic tokens on the same surface. Use inline theme switching if a component must appear in the opposite mode.",
          "rationale": "Mixing tokens from different themes produces unpredictable contrast pairings. Semantic tokens are only validated for contrast within their own theme context.",
          "level": "must-not",
          "category": "visual-design"
        },
        {
          "guidance": "Shadows (elevation tokens) are replaced with surface color differentiation in dark mode. Do not add custom box-shadow values to create depth.",
          "rationale": "Dark backgrounds absorb shadow, making traditional drop shadows invisible or visually muddy. The dark theme communicates depth through lighter surface values instead.",
          "level": "should-not",
          "category": "visual-design"
        },
        {
          "guidance": "Ensure all custom illustrations, charts, and images remain legible in dark mode. Provide dark-mode variants of images that use light backgrounds or thin strokes.",
          "rationale": "Illustrations designed for light backgrounds may become invisible or illegible on dark surfaces. Custom visual content requires the same level of dark-mode adaptation as UI components.",
          "level": "should",
          "category": "visual-design"
        }
      ]
    },
    {
      "kind": "accessibility",
      "wcagLevel": "AA",
      "colorContrast": [
        {
          "foreground": "color-text-default",
          "background": "color-background-default",
          "context": "Primary text (#FFFFFF) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-subtle",
          "background": "color-background-default",
          "context": "Secondary/subtle text (#A5A5A5) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-link",
          "background": "color-background-default",
          "context": "Link text (#45A3FE) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-error",
          "background": "color-background-default",
          "context": "Error text (#F47171) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-default",
          "background": "color-background-elevation-accent",
          "context": "Primary text (#FFFFFF) on accent surface (#191919)."
        },
        {
          "foreground": "color-text-default",
          "background": "color-background-elevation-floating",
          "context": "Primary text (#FFFFFF) on floating surface (#2B2B2B)."
        }
      ]
    }
  ],
  "$extensions": {
    "com.designTool": {
      "variableCollectionId": "VariableCollectionId:dark-mode"
    }
  },
  "agentDocumentBlocks": [
    {
      "kind": "use-cases",
      "purpose": "Apply a dark color palette for low-light environments and user preference, maintaining WCAG AA contrast throughout.",
      "items": [
        {
          "description": "Use dark for low-light comfort; use high-contrast for users with low vision requiring maximum contrast.",
          "stance": "discouraged",
          "alternative": {
            "identifier": "high-contrast"
          }
        }
      ]
    },
    {
      "kind": "guidelines",
      "items": [
        {
          "guidance": "Always apply at the application root, not on individual components.",
          "level": "must"
        },
        {
          "guidance": "Do not mix dark-mode and light-mode semantic tokens on the same surface.",
          "level": "must-not"
        },
        {
          "guidance": "Applying dark theme only to part of a page while the rest remains light.",
          "rationale": "Instead: Use inline theme switching for isolated components; apply the theme at the root for global coverage.",
          "level": "must-not"
        }
      ]
    }
  ]
}
```

## tokenOverride {#tokenoverride}

One token override in a theme: which token changes, and why. The value itself lives in the DTCG file — this just records the intent.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `token` | string | ✓ | The token being overridden. MUST match a token's `identifier` defined elsewhere in the system. Token identifiers have no fixed pattern, to support DTCG and design-tool naming styles (dots, dashes, slashes). |
| `description` | [richText](common-rich-text.md#richtext) |  | What changes for this token in this theme, and why (ex: 'Lightened to meet WCAG AAA contrast on the dark background'). The resolved value lives in the DTCG file. |

**References:** [richText](common-rich-text.md#richtext)

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/entities/theme.schema.json",
  "title": "Theme definitions",
  "description": "A theme documents an alternative set of token values — a color mode, density setting, or brand variant. DSDS captures its purpose, docs, and relationships; the actual override values live in the DTCG file `source` points to. Put internal links in `links` metadata, not a block.",
  "$defs": {
    "tokenOverride": {
      "type": "object",
      "description": "One token override in a theme: which token changes, and why. The value itself lives in the DTCG file — this just records the intent.",
      "required": [
        "token"
      ],
      "properties": {
        "token": {
          "type": "string",
          "description": "The token being overridden. MUST match a token's `identifier` defined elsewhere in the system. Token identifiers have no fixed pattern, to support DTCG and design-tool naming styles (dots, dashes, slashes)."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What changes for this token in this theme, and why (ex: 'Lightened to meet WCAG AAA contrast on the dark background'). The resolved value lives in the DTCG file."
        }
      },
      "additionalProperties": false
    },
    "theme": {
      "type": "object",
      "description": "A named context that adapts the system's token values — a color mode (light, dark, high-contrast), a density (compact, comfortable), a brand variant, or a product-specific tweak. DSDS captures the theme's purpose, docs, accessibility notes, and which tokens it affects; the override values live in the DTCG file `source` points to. The token catalog is still the source of truth for token identity, type, and docs.",
      "required": [
        "kind",
        "identifier",
        "name"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "theme",
          "description": "Identifies this entity as a theme."
        },
        "identifier": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$",
          "description": "Machine-readable identifier for the theme (ex: 'dark', 'high-contrast', 'compact', 'brand-sub-brand')."
        },
        "name": {
          "type": "string",
          "description": "Display name for the theme (ex: 'Dark Mode', 'High Contrast', 'Compact Density')."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What this theme is for, the context it adapts the system to, and when to apply it. CommonMark supported."
        },
        "metadata": {
          "$ref": "../metadata/metadata.schema.json#/$defs/entityMetadata",
          "description": "Optional metadata: the shared entityMetadata fields (see metadata/metadata.schema.json)."
        },
        "source": {
          "type": "object",
          "description": "Points to the DTCG (W3C Design Tokens) file. DSDS doesn't copy token values — the DTCG file is the source of truth for resolved values, aliases, and type.",
          "required": [
            "file"
          ],
          "properties": {
            "file": {
              "type": "string",
              "description": "URI or relative path to the DTCG file containing this theme's token override definitions."
            },
            "path": {
              "type": "string",
              "description": "The dot-path to this theme's group within the DTCG file, if applicable."
            }
          },
          "additionalProperties": false
        },
        "overrides": {
          "type": "array",
          "description": "The token overrides this theme applies. List only tokens that differ from the default — anything unlisted keeps its default. The values themselves live in the DTCG file `source` points to.",
          "items": {
            "$ref": "#/$defs/tokenOverride"
          },
          "minItems": 1
        },
        "relationships": {
          "$ref": "../common/relationship.schema.json#/$defs/relationships",
          "description": "Links from this theme to other entities — e.g. 'depends-on' the tokens it overrides, 'extends' a base theme. Tools derive the reverse edges."
        },
        "documentBlocks": {
          "type": "array",
          "description": "All structured docs for this theme, in order. Themes accept the general kinds only (guidelines, use-cases, accessibility, content, sections, checklist). Tools SHOULD keep this order for display.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
          },
          "minItems": 1
        },
        "agentDocumentBlocks": {
          "type": "array",
          "description": "Docs for agents (AI/LLM) only, using the same block kinds as `documentBlocks`. Put anything a human needs in `documentBlocks` — that's the default. Use this only for things that would be noise to a person: hard must/must-not rules, notes that correct a mistake agents commonly make (like picking a similar but wrong entity), evidence-backed constraints, and machine-checkable criteria. A rule humans need too still belongs in `documentBlocks`. This adds to the human docs, it never replaces them. Tools MUST NOT show these blocks to humans. Agents SHOULD read both arrays, human docs first.",
          "items": {
            "$ref": "../document-blocks/document-blocks.schema.json#/$defs/generalDocumentBlock"
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
