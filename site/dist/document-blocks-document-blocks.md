# Document block — scoped unions

Defines which document-block kinds each artifact type accepts. Every block has a `kind` tag; each artifact type accepts its own special kinds plus every general kind. We use a `kind` enum plus `if`/`then` branches instead of `oneOf`, so an invalid block gives one clear error for its `kind` instead of a pile of errors from every possible kind. To describe how entities relate to each other, use the `relationships` array on the entity, not a block kind; use `links` for external resources.

Source: `document-blocks/document-blocks.schema.json`

**6 definitions** in this file: `generalDocumentBlock`, `componentDocumentBlock`, `foundationDocumentBlock`, `patternDocumentBlock`, `guideDocumentBlock`, `generalBranches`

## generalDocumentBlock {#generaldocumentblock}

The block kinds every artifact type accepts — general concerns like free-form documentation content and the agent-facing checklist.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"checklist"` \| `"guidelines"` \| `"use-cases"` \| `"accessibility"` \| `"content"` \| `"sections"` | ✓ |  |

**References:** [generalBranches](document-blocks-document-blocks.md#generalbranches)

## componentDocumentBlock {#componentdocumentblock}

The block kinds a component accepts: its own (imports, anatomy, API, variants, states, design specs) plus every general kind.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"checklist"` \| `"imports"` \| `"anatomy"` \| `"api"` \| `"variants"` \| `"states"` \| `"design-specifications"` \| `"guidelines"` \| `"use-cases"` \| `"accessibility"` \| `"content"` \| `"sections"` | ✓ |  (Values: `checklist`, `imports`, `anatomy`, `api`, `variants`, `states`, `design-specifications`, `guidelines`, `use-cases`, `accessibility`, `content`, `sections`) |

**References:** [imports](document-blocks-imports.md#imports), [anatomy](document-blocks-anatomy.md#anatomy), [api](document-blocks-api.md#api), [variants](document-blocks-variants.md#variants), [states](document-blocks-states.md#states), [designSpecifications](document-blocks-design-specifications.md#designspecifications), [generalBranches](document-blocks-document-blocks.md#generalbranches)

## foundationDocumentBlock {#foundationdocumentblock}

The block kinds a foundation accepts: its own (principles, scale, motion) plus every general kind.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"checklist"` \| `"principles"` \| `"scale"` \| `"motion"` \| `"guidelines"` \| `"use-cases"` \| `"accessibility"` \| `"content"` \| `"sections"` | ✓ |  (Values: `checklist`, `principles`, `scale`, `motion`, `guidelines`, `use-cases`, `accessibility`, `content`, `sections`) |

**References:** [principles](document-blocks-principles.md#principles), [scale](document-blocks-scale.md#scale), [motion](document-blocks-motion.md#motion), [generalBranches](document-blocks-document-blocks.md#generalbranches)

## patternDocumentBlock {#patterndocumentblock}

The block kinds a pattern accepts: interactions, the shared structural kinds (anatomy, variants, states), and every general kind.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"checklist"` \| `"interactions"` \| `"anatomy"` \| `"variants"` \| `"states"` \| `"guidelines"` \| `"use-cases"` \| `"accessibility"` \| `"content"` \| `"sections"` | ✓ |  (Values: `checklist`, `interactions`, `anatomy`, `variants`, `states`, `guidelines`, `use-cases`, `accessibility`, `content`, `sections`) |

**References:** [interactions](document-blocks-interactions.md#interactions), [anatomy](document-blocks-anatomy.md#anatomy), [variants](document-blocks-variants.md#variants), [states](document-blocks-states.md#states), [generalBranches](document-blocks-document-blocks.md#generalbranches)

## guideDocumentBlock {#guidedocumentblock}

The block kinds a guide accepts: `steps`, the reused `imports` kind for setup, and every general kind (including `checklist` — handy for a contribution or migration guide's final verification pass). Guides are for reading, so they lean on documentation content and steps rather than measurable specs like api or anatomy.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"steps"` \| `"imports"` \| `"checklist"` \| `"guidelines"` \| `"use-cases"` \| `"accessibility"` \| `"content"` \| `"sections"` | ✓ |  |

**References:** [steps](document-blocks-steps.md#steps), [imports](document-blocks-imports.md#imports), [generalBranches](document-blocks-document-blocks.md#generalbranches)

## generalBranches {#generalbranches}

The `if`/`then` rules for the general block kinds, shared by every artifact type's union via `allOf`. It doesn't define its own `kind` enum — the union that includes it does. If the block's `kind` isn't one of these, every check here is simply skipped.

**References:** [checklist](document-blocks-checklist.md#checklist), [guidelines](document-blocks-guidelines.md#guidelines), [useCases](common-use-cases.md#usecases), [accessibility](document-blocks-accessibility.md#accessibility), [content](document-blocks-content.md#content), [sections](document-blocks-sections.md#sections)

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/document-blocks.schema.json",
  "title": "Document block — scoped unions",
  "description": "Defines which document-block kinds each artifact type accepts. Every block has a `kind` tag; each artifact type accepts its own special kinds plus every general kind. We use a `kind` enum plus `if`/`then` branches instead of `oneOf`, so an invalid block gives one clear error for its `kind` instead of a pile of errors from every possible kind. To describe how entities relate to each other, use the `relationships` array on the entity, not a block kind; use `links` for external resources.",
  "$defs": {
    "generalBranches": {
      "description": "The `if`/`then` rules for the general block kinds, shared by every artifact type's union via `allOf`. It doesn't define its own `kind` enum — the union that includes it does. If the block's `kind` isn't one of these, every check here is simply skipped.",
      "allOf": [
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "checklist"
              }
            }
          },
          "then": {
            "$ref": "checklist.schema.json#/$defs/checklist"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "guidelines"
              }
            }
          },
          "then": {
            "$ref": "guidelines.schema.json#/$defs/guidelines"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "use-cases"
              }
            }
          },
          "then": {
            "$ref": "../common/use-cases.schema.json#/$defs/useCases"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "accessibility"
              }
            }
          },
          "then": {
            "$ref": "accessibility.schema.json#/$defs/accessibility"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "content"
              }
            }
          },
          "then": {
            "$ref": "content.schema.json#/$defs/content"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "sections"
              }
            }
          },
          "then": {
            "$ref": "sections.schema.json#/$defs/sections"
          }
        }
      ]
    },
    "generalDocumentBlock": {
      "description": "The block kinds every artifact type accepts — general concerns like free-form documentation content and the agent-facing checklist.",
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "checklist",
            "guidelines",
            "use-cases",
            "accessibility",
            "content",
            "sections"
          ]
        }
      },
      "allOf": [
        {
          "$ref": "#/$defs/generalBranches"
        }
      ]
    },
    "componentDocumentBlock": {
      "description": "The block kinds a component accepts: its own (imports, anatomy, API, variants, states, design specs) plus every general kind.",
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "checklist",
            "imports",
            "anatomy",
            "api",
            "variants",
            "states",
            "design-specifications",
            "guidelines",
            "use-cases",
            "accessibility",
            "content",
            "sections"
          ]
        }
      },
      "allOf": [
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "imports"
              }
            }
          },
          "then": {
            "$ref": "imports.schema.json#/$defs/imports"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "anatomy"
              }
            }
          },
          "then": {
            "$ref": "anatomy.schema.json#/$defs/anatomy"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "api"
              }
            }
          },
          "then": {
            "$ref": "api.schema.json#/$defs/api"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "variants"
              }
            }
          },
          "then": {
            "$ref": "variants.schema.json#/$defs/variants"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "states"
              }
            }
          },
          "then": {
            "$ref": "states.schema.json#/$defs/states"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "design-specifications"
              }
            }
          },
          "then": {
            "$ref": "design-specifications.schema.json#/$defs/designSpecifications"
          }
        },
        {
          "$ref": "#/$defs/generalBranches"
        }
      ]
    },
    "foundationDocumentBlock": {
      "description": "The block kinds a foundation accepts: its own (principles, scale, motion) plus every general kind.",
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "checklist",
            "principles",
            "scale",
            "motion",
            "guidelines",
            "use-cases",
            "accessibility",
            "content",
            "sections"
          ]
        }
      },
      "allOf": [
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "principles"
              }
            }
          },
          "then": {
            "$ref": "principles.schema.json#/$defs/principles"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "scale"
              }
            }
          },
          "then": {
            "$ref": "scale.schema.json#/$defs/scale"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "motion"
              }
            }
          },
          "then": {
            "$ref": "motion.schema.json#/$defs/motion"
          }
        },
        {
          "$ref": "#/$defs/generalBranches"
        }
      ]
    },
    "patternDocumentBlock": {
      "description": "The block kinds a pattern accepts: interactions, the shared structural kinds (anatomy, variants, states), and every general kind.",
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "checklist",
            "interactions",
            "anatomy",
            "variants",
            "states",
            "guidelines",
            "use-cases",
            "accessibility",
            "content",
            "sections"
          ]
        }
      },
      "allOf": [
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "interactions"
              }
            }
          },
          "then": {
            "$ref": "interactions.schema.json#/$defs/interactions"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "anatomy"
              }
            }
          },
          "then": {
            "$ref": "anatomy.schema.json#/$defs/anatomy"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "variants"
              }
            }
          },
          "then": {
            "$ref": "variants.schema.json#/$defs/variants"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "states"
              }
            }
          },
          "then": {
            "$ref": "states.schema.json#/$defs/states"
          }
        },
        {
          "$ref": "#/$defs/generalBranches"
        }
      ]
    },
    "guideDocumentBlock": {
      "description": "The block kinds a guide accepts: `steps`, the reused `imports` kind for setup, and every general kind (including `checklist` — handy for a contribution or migration guide's final verification pass). Guides are for reading, so they lean on documentation content and steps rather than measurable specs like api or anatomy.",
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "steps",
            "imports",
            "checklist",
            "guidelines",
            "use-cases",
            "accessibility",
            "content",
            "sections"
          ]
        }
      },
      "allOf": [
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "steps"
              }
            }
          },
          "then": {
            "$ref": "steps.schema.json#/$defs/steps"
          }
        },
        {
          "if": {
            "required": [
              "kind"
            ],
            "properties": {
              "kind": {
                "const": "imports"
              }
            }
          },
          "then": {
            "$ref": "imports.schema.json#/$defs/imports"
          }
        },
        {
          "$ref": "#/$defs/generalBranches"
        }
      ]
    }
  }
}
```
