# Design System Documentation Spec (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a JSON-based format for documenting the six entity types of a design system:

- **Components** — Anatomy, API, variants, states, design specifications, best practices, accessibility, content
- **Tokens** — Semantic meaning, platform mappings, contrast ratios, usage rules
- **Token Groups** — Hierarchical organization of tokens into families and sub-families
- **Themes** — Named sets of token value overrides for color modes, density, brand variants
- **Styles** — Foundations for color, typography, spacing, elevation, motion, and content — with principles, scales, motion definitions, and best practices
- **Patterns** — Broad interaction patterns like navigation, error messaging, and empty states — with anatomy, variants, states, interactions, and content

All structured documentation lives in a unified **document block** system. Each entry is a typed container identified by a `kind` tag. The kinds cover guidelines, anatomy, API specs, variants, states, accessibility, examples, design specifications, principles, scales, motion, content, and interactions.

The goal is simple: make design system documentation structured, portable, and consumable by tools. The tool can be a documentation site, a linter, a code assistant, or a human reading JSON.

## Why?

Design system documentation today is trapped in tools. It lives in Notion, Storybook, Zeroheight, Confluence, or custom-built sites. Each has its own structure, its own conventions, and no interoperability between them.

This creates real problems:

- **Migration is expensive.** Switching documentation tools means restructuring everything from scratch.
- **Consistency is accidental.** Without a shared structure, every team invents its own format. Consumers must relearn what to expect every time.
- **Tooling can't help.** Tools can't reliably consume documentation from other tools because there's no shared schema to build against.
- **AI needs structure.** LLMs and code assistants work dramatically better with structured, predictable documentation than with ad hoc prose.

DSDS addresses these problems by defining a standard format that is:

| Quality | What it means |
|---|---|
| **Structured** | Every section has a defined shape. Consumers know what to expect. |
| **Machine-readable** | Tools can parse, generate, validate, and transform documentation. |
| **Portable** | Documentation is decoupled from any specific tool or platform. |
| **Extensible** | Vendor metadata can be added without breaking interoperability. |
| **Complementary** | Works alongside the [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), not against it. |

## Relationship to W3C Design Tokens

The W3C Design Tokens Community Group defines a format for exchanging token **values** between tools. DSDS defines a format for exchanging the **documentation** that describes how to understand and apply those tokens, plus the components, styles, and patterns that use them.

The two formats are designed to work together. DSDS does not duplicate token values or platform identifiers. The W3C Design Tokens Format file is the source of truth for values. Use the `source` property on a token entity to link it back to its DTCG definition.

## Documentation

The authoritative reference for every schema, field, and document-block type is the **documentation site at [designsystemdocspec.org](https://designsystemdocspec.org/)**. Property tables there are generated directly from the schema JSON — they cannot drift from the implementation.

Start here:

- **[Overview](https://designsystemdocspec.org/)** — What DSDS is, the entity model, and how the pieces fit together.
- **[Quick Start](https://designsystemdocspec.org/quickstart.html)** — Document structure, entity kinds, the document-block system, and minimal examples for every entity type.
- **[Schema Architecture](https://designsystemdocspec.org/schema-architecture.html)** — The full schema reference. Covers document structure, entity types, the `agents` property, status, the document-block system, links, extends, extensions, naming conventions, and conformance levels, all with live property tables sourced from the schema.
- **[Interactive Samples](https://designsystemdocspec.org/samples.html)** — Side-by-side JSON ↔ rendered docs for real-world entities (component, token, theme, style, pattern).

Per-schema reference pages live alongside the narrative pages — e.g. [entities/component](https://designsystemdocspec.org/entities-component.html), [document-blocks/guideline](https://designsystemdocspec.org/document-blocks-guideline.html), [common/agents](https://designsystemdocspec.org/common-agents.html). Every page is auto-generated from its corresponding `spec/schema/**/*.schema.json` file.

The site can also be built locally for offline browsing or while developing the spec — run `npm run build` and open `site/dist/index.html`.

This README intentionally does **not** duplicate schema field listings, document-block type catalogs, default values, enforcement levels, or example payloads. Those live on the documentation site as a single source of truth.

## Project Structure

```
spec/
├── dsds-spec.md                                        # Legacy single-file spec, superseded by the docs site
├── schema/
│   ├── dsds.schema.json                                # Root JSON Schema
│   ├── dsds.bundled.schema.json                        # Auto-generated single-file bundle
│   ├── common/                                         # Shared primitives
│   │   ├── agent-collection.schema.json                # agentCollection (multi-entity agent context file)
│   │   ├── agents.schema.json                          # agents (agent context for AI/LLM consumption)
│   │   ├── example.schema.json                         # example
│   │   ├── extends.schema.json                         # documentExtends, entityExtends
│   │   ├── extensions.schema.json                      # $extensions
│   │   ├── link.schema.json                            # link
│   │   ├── system-metadata.schema.json                 # systemMetadata
│   │   ├── rich-text.schema.json                       # richText
│   │   ├── presentation.schema.json                    # presentationImage, presentationVideo, presentationCode, presentationUrl
│   │   ├── status.schema.json                          # status, statusObject, statusValue, platformStatus
│   │   └── purpose.schema.json                         # purpose, useCase
│   ├── metadata/                                       # Modular entity metadata kinds (entityMetadata union)
│   │   ├── metadata.schema.json                        # entityMetadata (oneOf union of every metadata kind)
│   │   ├── aliases.schema.json                         # aliasesMetadata
│   │   ├── category.schema.json                        # categoryMetadata
│   │   ├── description.schema.json                     # descriptionMetadata
│   │   ├── extends.schema.json                         # extendsMetadata
│   │   ├── last-updated.schema.json                    # lastUpdatedMetadata
│   │   ├── links.schema.json                           # linksMetadata
│   │   ├── preview.schema.json                         # previewMetadata
│   │   ├── since.schema.json                           # sinceMetadata
│   │   ├── status.schema.json                          # statusMetadata
│   │   ├── summary.schema.json                         # summaryMetadata
│   │   ├── tags.schema.json                            # tagsMetadata
│   │   └── thumbnail.schema.json                       # thumbnailMetadata
│   ├── entities/                                       # Entity types
│   │   ├── component.schema.json                       # component
│   │   ├── pattern.schema.json                         # pattern
│   │   ├── style.schema.json                           # style
│   │   ├── theme.schema.json                           # theme, tokenOverride
│   │   └── token.schema.json                           # token, tokenGroup
│   └── document-blocks/                                 # Document block types
│       ├── document-blocks.schema.json                  # Scoped unions (componentDocumentBlock, styleDocumentBlock, etc.)
│       ├── accessibility.schema.json                   # accessibility, keyboardInteraction, ariaAttribute, colorContrast
│       ├── anatomy.schema.json                         # anatomy, anatomyEntry
│       ├── api.schema.json                             # api, apiProperty, apiEvent, apiSlot, etc.
│       ├── guideline.schema.json                       # guideline, guidelineEntry, criterionReference, criterionDefinition
│       ├── content.schema.json                         # content, contentLabelEntry, localizationEntry
│       ├── design-specifications.schema.json           # designSpecifications, spacingSpec, sizingSpec, typographySpec, etc.
│       ├── events.schema.json                          # events, eventEntry
│       ├── import.schema.json                          # import, importEntry
│       ├── interaction.schema.json                     # interactions, interactionEntry
│       ├── motion.schema.json                          # motion, motionEntry, motionDuration
│       ├── principle.schema.json                       # principles, principleEntry
│       ├── scale.schema.json                           # scale, scaleStep
│       ├── state.schema.json                           # states, stateEntry
│       └── variant.schema.json                         # variants, flagVariant, enumVariant, variantValue
└── examples/
    ├── starter-kit.dsds.json                           # Complete document with components, tokens, styles, patterns
    ├── minimal/                                        # Lightweight examples showing the floor of documentation
    ├── common/                                         # Per-definition examples for common primitives
    ├── entities/                                       # Per-definition examples for entity types (incl. empty-state pattern)
    └── document-blocks/                                 # Per-definition examples for document block types (incl. motion, content)

scripts/
├── bundle.js                                           # Generates dsds.bundled.schema.json from split schemas
├── validate.js                                         # Validates all example files against the bundled schema
├── sync-examples.js                                    # Syncs markdown dsds:include directives with example JSON
├── build-site.js                                       # Generates the static specification site (orchestrator)
├── build-samples.js                                    # Generates the interactive sample viewer from example JSON
├── render-entity.js                                    # Server-side entity rendering used by build-samples.js
├── render-prop-table.js                                # Shared schema-to-HTML property table renderer (used by build-site + MDX)
├── compile-mdx.mjs                                     # MDX content compiler for narrative pages (overview, quickstart, schema-architecture)
├── nav.js                                              # Shared navigation builder for spec pages
└── visualize.js                                        # Generates schema architecture diagram (SVG + Mermaid)

site/
├── tokens.css                                          # Centralized design tokens (colors, fonts, spacing, radii, etc.)
├── style.css                                           # Core site stylesheet (layout, nav, typography — imports tokens.css)
├── pages.css                                           # Shared styles for standalone pages (samples, quickstart)
├── components/                                         # Reusable HTML web components (ES modules)
│   ├── index.js                                        # Barrel file — imports all components, registers custom elements
│   ├── _shared.js                                      # Shared utilities (createShadow, esc, BASE_RESET, FONT)
│   ├── badge.js                                        # <ds-badge> — status/category badges
│   ├── back-to-top.js                                  # <ds-back-to-top> — scroll-to-top link
│   ├── button.js                                       # <ds-button> — button with variants and sizes
│   ├── card.js                                         # <ds-card> — bordered content card
│   ├── code.js                                         # <ds-code> — syntax-highlighted code (block + inline)
│   ├── cross-refs.js                                   # <ds-cross-refs> — cross-reference links
│   ├── def-example.js                                  # <ds-def-example> — definition example block
│   ├── def-index.js                                    # <ds-def-index> — page-level definition index
│   ├── def-section.js                                  # <ds-def-section> — definition section container
│   ├── footer.js                                       # <ds-footer> — page footer
│   ├── heading.js                                      # <ds-heading> — section heading (h1–h6) with anchor
│   ├── note.js                                         # <ds-note> — callout/warning box
│   ├── prop-table.js                                   # <ds-prop-table> + <ds-prop> — schema property table
│   ├── schema-header.js                                # <ds-schema-header> — schema page header
│   ├── scrollspy.js                                    # <ds-scrollspy> — scroll position tracker
│   ├── sidebar.js                                      # <ds-sidebar> — collapsible sidebar panel
│   ├── sidenav.js                                      # <ds-sidenav> + <ds-nav-group> + <ds-nav-link>
│   ├── table.js                                        # <ds-table> — styled table wrapper
│   ├── tabs.js                                         # <ds-tabs> + <ds-tab> — tabbed content
│   ├── toc.js                                          # <ds-toc> — auto-built table of contents
│   ├── toolbar.js                                      # <ds-toolbar> — sticky top toolbar
│   └── type-ref.js                                     # <ds-type-ref> — type reference link
├── samples-template.html                               # Template for the interactive sample viewer
└── dist/                                               # Generated HTML site (auto-generated)
```

## Quick Start

### 1. Read the docs site

Visit [designsystemdocspec.org](https://designsystemdocspec.org/) for the canonical reference, or see the [Documentation](#documentation) section above for entry points. Property tables, type definitions, and cross-references are all rendered live from the schema.

### 2. Look at the examples

The [`spec/examples/`](spec/examples/) directory contains validated example files:

- **[`starter-kit.dsds.json`](spec/examples/starter-kit.dsds.json)** — A complete document with components, tokens, a style, and a pattern, showing the full architecture.
- **[`minimal/`](spec/examples/minimal/)** — Lightweight examples (8–30 lines each) showing the floor of documentation for each entity type.
- **[`entities/component.json`](spec/examples/entities/component.json)** — A full Button component with anatomy, API, variants (flag and enum types), states, design specs, best practices, purpose, and accessibility.
- **[`entities/empty-state-pattern.json`](spec/examples/entities/empty-state-pattern.json)** — An Empty State pattern demonstrating anatomy, variants, states, interactions, content guidelines, and localization on a pattern entity.
- **[`entities/style.json`](spec/examples/entities/style.json)** — A Spacing style with principles, scale, motion definitions, and best practices.
- **[`entities/token.json`](spec/examples/entities/token.json)** — A semantic color token with source reference, category, and guidelines.
- **[`entities/token-group.json`](spec/examples/entities/token-group.json)** — A hierarchical color palette with nested hue families and grade scales.
- **[`entities/theme.json`](spec/examples/entities/theme.json)** — A dark mode theme with token overrides, purpose, best practices, and accessibility.
- **[`entities/pattern.json`](spec/examples/entities/pattern.json)** — An error messaging pattern with interactions, component references, and accessibility.

### 3. Validate your documents

Install dependencies and run the validation suite:

```bash
npm install
npm run validate
```

This runs three steps automatically: syncs example includes, bundles the schema, and validates all example files.

To validate your own DSDS file:

```bash
npx ajv validate -s spec/schema/dsds.bundled.schema.json -d my-system.dsds.json
```

Reference `https://designsystemdocspec.org/v0.2/dsds.bundled.schema.json` from your DSDS files via the `$schema` keyword to get editor autocompletion and inline validation. See the [Quick Start docs page](https://designsystemdocspec.org/quickstart.html) for the single-entity and multi-entity document shapes.

### 4. Build the spec site

```bash
npm run build
# Open site/dist/index.html
```

The site is auto-generated from the schema JSON files. Property tables, type descriptions, and cross-references all come directly from the schemas. The prose modules add context and examples.

### 5. Regenerate the bundled schema

After changing any schema file, regenerate the bundled version:

```bash
npm run bundle
```

### 6. Visualize the schema architecture

Generate a diagram showing how all schema files relate to each other:

```bash
npm run visualize
```

This produces:

- `site/dist/schema-architecture.mmd` — Mermaid source (renders natively on GitHub)
- `site/dist/schema-architecture.svg` — Clean SVG with no CSS, compatible with Figma

Options:

```bash
node scripts/visualize.js --format=svg               # SVG only
node scripts/visualize.js --format=mmd               # Mermaid source only
node scripts/visualize.js --layout=root,entities,guidelines,common  # Custom column order
node scripts/visualize.js --layout=root+common,entities,guidelines  # Stack groups with +
node scripts/visualize.js --no-edges                  # Hide dependency edges
```

### 7. Build the interactive sample viewer

Generate a side-by-side documentation page that shows how DSDS JSON maps to rendered output:

```bash
npm run build-samples
```

This reads example JSON files from `spec/examples/` and produces `site/dist/samples.html` — a self-contained page with:

- **Tabs** for each entity type: Button Component, Color Token, Error Messaging Pattern, Spacing Style, Dark Theme
- **Side-by-side layout**: raw JSON on the left, rendered documentation on the right
- **Element-level highlighting**: hover over any rendered element to see its corresponding JSON, and vice versa
- **Color-coded section bars** mapping JSON sections to their visual output
- **Off-screen indicators** when highlighted code is scrolled out of view

To add a new example tab, add an entry to the `SAMPLES` array in `scripts/build-samples.js`:

```js
{
  file: "entities/component.json",  // path relative to spec/examples/
  key: "component",                 // top-level key to extract
  id: "component",                  // unique tab identifier
  label: "Button Component",        // human-readable tab label
}
```

### 8. Authoring narrative pages with schema-driven tables

Narrative content (`site/content/*.mdx` — the Overview, Quick Start, and Schema Architecture pages) is compiled to HTML by `scripts/compile-mdx.mjs`. Authors write prose alongside two custom shortcodes:

- `<ds-example file="..." label="..." />` — inlines a JSON example from `spec/examples/minimal/` as a fenced code block.
- `<ds-prop-table schema="..." def="..." />` — renders the property table for any `$defs` entry directly from the schema. Per-schema docs pages and narrative pages share the same renderer (`scripts/render-prop-table.js`), so a description change in a schema flows to every page automatically.

Example:

```mdx
### Anatomy entry

A component or pattern's anatomy entry has the following shape:

<ds-prop-table schema="document-blocks/anatomy" def="anatomyEntry" />
```

Special values:

- `schema="root"` — loads `spec/schema/dsds.schema.json`.
- `def="$root"` — renders the schema's top-level `properties` (used for schemas that don't use `$defs` at all).

The Quick Start page (`site/content/quickstart.mdx`) is compiled the same way as every other narrative page. There is no longer a separate build command for it: run `npm run build` and the page is regenerated at `site/dist/quickstart.html`.

## Design Principles

1. **Structure enables quality.** A defined format creates a floor of quality and completeness.
2. **Guidance without justification is incomplete.** Every best practice must answer "why?"
3. **Documentation should be portable.** Teams change tools. Documentation should survive the transition.
4. **Education is a responsibility.** Explain *what*, *why*, and *how*.
5. **Specificity over subjectivity.** "Use sparingly" is not guidance. "Limit to one per surface" is.
6. **Schema is the source of truth.** Property tables are generated from schema JSON, not hand-written. Prose provides context; schemas provide structure.

## Contributing

This is an early-stage specification (v0.1). Feedback is welcome:

- **Open an issue** for questions, suggestions, or problems with the spec.
- **Open a PR** for proposed changes to the spec, schema, or examples.

## License

This project is open source. See [LICENSE](LICENSE) for details.
