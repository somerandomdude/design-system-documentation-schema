# Design System Documentation Spec (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a JSON-based format for documenting the seven entity types of a design system:

- **Components** — Anatomy, API, variants, states, design specifications, best practices, accessibility, content
- **Tokens** — Semantic meaning, platform mappings, contrast ratios, usage rules
- **Token Groups** — Hierarchical organization of tokens into families and sub-families
- **Themes** — Named sets of token value overrides for color modes, density, brand variants
- **Foundations** — Broad design domains: color, typography, spacing, elevation, motion, shape, accessibility, and content — with principles, scales, motion definitions, and best practices
- **Patterns** — Broad interaction patterns like navigation, error messaging, and empty states — with anatomy, variants, states, interactions, and content
- **Guides** — Long-form, reading-oriented documentation like getting-started walkthroughs, contribution guides, tutorials, and migration guides — with narrative sections, step-by-step procedures, and best practices

All structured docs live in one **document block** system. Each entry is a typed container with a `kind` tag. The kinds cover guidelines, anatomy, API specs, variants, states, accessibility, examples, design specifications, principles, scales, motion, content, interactions, narrative sections, and step-by-step procedures.

The goal is simple: make design system docs structured, portable, and easy for tools to read. The tool can be a docs site, a linter, a code assistant, or a person reading JSON.

## Why?

Design system documentation today is trapped in tools. It lives in Notion, Storybook, Zeroheight, Confluence, or custom-built sites. Each one has its own structure and its own rules, and none of them work together.

This creates real problems:

- **Migration is expensive.** Switching docs tools means rebuilding everything from scratch.
- **Consistency is accidental.** With no shared structure, every team invents its own format. Readers must relearn what to expect each time.
- **Tooling can't help.** Tools can't reliably read docs from other tools, since there is no shared schema to build against.
- **AI needs structure.** LLMs and code assistants work far better with structured, predictable docs than with loose prose.

DSDS addresses these problems by defining a standard format that is:

| Quality | What it means |
|---|---|
| **Structured** | Every section has a defined shape. Consumers know what to expect. |
| **Machine-readable** | Tools can parse, generate, validate, and transform documentation. |
| **Portable** | Documentation is decoupled from any specific tool or platform. |
| **Extensible** | Vendor metadata can be added without breaking interoperability. |
| **Complementary** | Works alongside the [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), not against it. |

## Relationship to W3C Design Tokens

The W3C Design Tokens Community Group defines a format for trading token **values** between tools. DSDS defines a format for the **documentation** around them — how to read and apply those tokens, plus the components, foundations, and patterns that use them.

The two formats are built to work together. DSDS does not duplicate token values or platform identifiers. The W3C Design Tokens Format file is the source of truth for values. Use the `source` property on a token entity to link it back to its DTCG definition.

## Documentation

The authoritative reference for every schema, field, and document-block type is the **documentation site at [designsystemdocspec.org](https://designsystemdocspec.org/)**. Property tables there come straight from the schema JSON, so they cannot drift from the code.

Start here:

- **[Overview](https://designsystemdocspec.org/)** — What DSDS is, the entity model, and how the pieces fit together.
- **[Quick Start](https://designsystemdocspec.org/quickstart.html)** — Document structure, entity kinds, the document-block system, and minimal examples for every entity type.
- **[Schema Architecture](https://designsystemdocspec.org/schema-architecture.html)** — The full schema reference. Covers document structure, entity types, the `agents` property, status, the document-block system, links, extends, extensions, naming conventions, and conformance levels, all with live property tables sourced from the schema.
- **[Interactive Samples](https://designsystemdocspec.org/samples.html)** — Side-by-side JSON ↔ rendered docs for real-world entities (component, token, theme, foundation, pattern).

Per-schema reference pages sit next to the narrative pages — e.g. [entities/component](https://designsystemdocspec.org/entities-component.html), [document-blocks/guidelines](https://designsystemdocspec.org/document-blocks-guidelines.html), [common/use-cases](https://designsystemdocspec.org/common-use-cases.html). Each page is built from its matching `spec/schema/**/*.schema.json` file.

You can also build the site locally to browse offline or while you work on the spec. Run `npm run build` and open `site/dist/index.html`.

This README leaves out schema field listings, document-block catalogs, default values, enforcement levels, and example payloads on purpose. Those live on the documentation site as a single source of truth.

## Project Structure

```
spec/
├── schema/
│   ├── dsds.schema.json                                # Root JSON Schema (anyEntity, entityGroup, fileRef)
│   ├── dsds.bundled.schema.json                        # Auto-generated single-file bundle
│   ├── common/                                         # Shared primitives
│   │   ├── criterion.schema.json                       # criterion, reference (testable success criteria)
│   │   ├── example.schema.json                         # example
│   │   ├── extends.schema.json                         # documentExtends, entityExtends
│   │   ├── extensions.schema.json                      # $extensions
│   │   ├── link.schema.json                            # link
│   │   ├── presentation.schema.json                    # presentationImage, presentationVideo, presentationCode, presentationUrl
│   │   ├── rich-text.schema.json                       # richText (markdown string)
│   │   ├── status.schema.json                          # statusValue, platformStatus
│   │   ├── system-info.schema.json                     # systemInfo
│   │   └── use-cases.schema.json                       # useCases, useCase
│   ├── metadata/                                       # Entity metadata fields (one file per field)
│   │   ├── metadata.schema.json                        # entityMetadata (the aggregating object)
│   │   ├── aliases.schema.json                         # aliases
│   │   ├── category.schema.json                        # category
│   │   ├── extends.schema.json                         # extends
│   │   ├── last-updated.schema.json                    # lastUpdated
│   │   ├── links.schema.json                           # links
│   │   ├── preview.schema.json                         # preview
│   │   ├── since.schema.json                           # since
│   │   ├── status.schema.json                          # status
│   │   ├── summary.schema.json                         # summary
│   │   ├── tags.schema.json                            # tags
│   │   └── thumbnail.schema.json                       # thumbnail
│   ├── entities/                                       # Entity types
│   │   ├── component.schema.json                       # component
│   │   ├── foundation.schema.json                      # foundation
│   │   ├── guide.schema.json                           # guide
│   │   ├── pattern.schema.json                         # pattern
│   │   ├── theme.schema.json                           # theme, tokenOverride
│   │   └── token.schema.json                           # token, tokenGroup
│   └── document-blocks/                                # Document block types
│       ├── document-blocks.schema.json                 # Scoped unions (componentDocumentBlock, generalDocumentBlock, etc.)
│       ├── accessibility.schema.json                   # accessibility, keyboardInteraction, ariaAttribute, colorContrast
│       ├── anatomy.schema.json                         # anatomy, anatomyEntry
│       ├── api.schema.json                             # api, apiProperty, apiEvent, apiSlot, etc.
│       ├── content.schema.json                         # content, contentLabelEntry, localizationEntry
│       ├── design-specifications.schema.json           # designSpecifications, spacingSpec, sizingSpec, typographySpec, etc.
│       ├── guidelines.schema.json                      # guidelines, guidelineEntry
│       ├── imports.schema.json                         # imports, importEntry
│       ├── interactions.schema.json                    # interactions, interactionEntry
│       ├── motion.schema.json                          # motion, motionEntry, motionDuration
│       ├── principles.schema.json                      # principles, principleEntry
│       ├── scale.schema.json                           # scale, scaleStep
│       ├── sections.schema.json                        # sections, sectionEntry
│       ├── states.schema.json                          # states, stateEntry
│       ├── steps.schema.json                           # steps, stepEntry
│       └── variants.schema.json                        # variants, flagVariant, enumVariant, variantValue
└── examples/
    ├── starter-kit.dsds.json                           # Complete document with components, tokens, foundations, patterns
    ├── minimal/                                        # Lightweight examples showing the floor of documentation
    ├── common/                                         # Per-definition examples for common primitives
    ├── metadata/                                       # Per-field examples for entity metadata
    ├── entities/                                       # Per-definition examples for entity types (incl. empty-state pattern)
    └── document-blocks/                                # Per-definition examples for document block types (incl. motion, content)

scripts/
├── bundle.js                                           # Generates dsds.bundled.schema.json from split schemas
├── validate.js                                         # Validates all example files against the bundled schema
├── sync-examples.js                                    # Syncs markdown dsds:include directives with example JSON
├── migrate-to-0.7.js                                   # Migrates v0.5.x / v0.6 documents to the v0.7 shape
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

- **[`starter-kit.dsds.json`](spec/examples/starter-kit.dsds.json)** — A complete document with components, tokens, a foundation, and a pattern, showing the full architecture.
- **[`minimal/`](spec/examples/minimal/)** — Lightweight examples (8–30 lines each) showing the floor of documentation for each entity type.
- **[`entities/component.json`](spec/examples/entities/component.json)** — A full Button component with anatomy, API, variants (flag and enum types), states, design specs, guidelines, purpose, and accessibility.
- **[`entities/empty-state-pattern.json`](spec/examples/entities/empty-state-pattern.json)** — An Empty State pattern demonstrating anatomy, variants, states, interactions, content guidelines, and localization on a pattern entity.
- **[`entities/foundation.json`](spec/examples/entities/foundation.json)** — A Spacing foundation with principles, scale, motion definitions, and guidelines.
- **[`entities/token.json`](spec/examples/entities/token.json)** — A semantic color token with source reference, category, and guidelines.
- **[`entities/token-group.json`](spec/examples/entities/token-group.json)** — A hierarchical color palette with nested hue families and grade scales.
- **[`entities/theme.json`](spec/examples/entities/theme.json)** — A dark mode theme with token overrides, purpose, guidelines, and accessibility.
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

Reference `https://designsystemdocspec.org/v0.7.1/dsds.bundled.schema.json` from your DSDS files via the `$schema` keyword to get editor autocompletion and inline validation. See the [Quick Start docs page](https://designsystemdocspec.org/quickstart.html) for the single-entity and multi-entity document shapes.

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

- **Tabs** for each entity type: Button Component, Color Token, Error Messaging Pattern, Spacing Foundation, Dark Theme
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

## Cutting a release

The spec version lives in three coordinated places:

1. **`spec/schema/dsds.schema.json#/properties/dsdsVersion/const`** — the single source of truth. The bundle script, the nav, every page title, and the versioned dist directory all derive from this value.
2. **The `$id` URL on every schema file** — e.g., `https://designsystemdocspec.org/v0.7.1/metadata/last-updated.schema.json`. Every example document's `$schema` field and every `"dsdsVersion"` literal inside example JSON has to track the same version.
3. **`package.json#version`** — the npm package version. Conventionally kept in lockstep with `dsdsVersion.const`.

The `scripts/bump-version.js` script keeps the first two in sync across all 44 schema files, every example, and the README. `package.json` is handled separately because it's not a schema-consumer file.

### Version templating in MDX content

The MDX content pages (`site/content/*.mdx`) **never hardcode a version**. They reference it through the `{{VERSION}}` token, which `scripts/compile-mdx.mjs` substitutes at build time from `dsds.schema.json#/properties/dsdsVersion/const` — the single source of truth above. Use `{{VERSION}}` anywhere a page needs the spec version: page titles and headings, `$schema` URLs (`https://designsystemdocspec.org/v{{VERSION}}/…`), inline `"dsdsVersion": "{{VERSION}}"` examples, and prose.

This means a version bump propagates to every site page on the next `npm run build` with no string rewriting — so `bump-version.js` deliberately does **not** touch the MDX files. **Do not hardcode a version in MDX**, or it will silently drift the next time the spec is bumped. (Real example documents under `spec/examples/` are the exception: they carry literal, validatable versions and are version-stamped by `bump-version.js`.)

### Release types

| Change | Spec version | New URL path? | Old URL path |
|---|---|---|---|
| Schema additions (new optional fields, new union members, new entity kinds) | Bump patch (e.g. `0.2` → `0.2.1`) | Yes — published at `/v0.2.1/` | `/v0.2/` stays untouched as a historical artifact |
| Breaking changes (renamed/removed fields, new required fields, tightened constraints) | Bump minor or major (e.g. `0.2.1` → `0.3`) | Yes — published at `/v0.3/` | All older versions stay untouched |
| Documentation-only edits (typos, prose clarifications, no schema or example changes) | No bump | No | No change |

The versioned dist directories (`site/dist/v<n>/dsds.bundled.schema.json`) are **immutable public contracts**. `npm run build` refuses to overwrite an existing one. Every consumer that pins `$schema` to that URL relies on the file there never changing.

### Step-by-step

This is the exact sequence for cutting a release that includes schema changes. Skip steps 1–3 for a documentation-only release.

1. **Make your schema changes** under `spec/schema/`. Add new files, edit existing ones, or update the unions in `metadata/metadata.schema.json` / `document-blocks/document-blocks.schema.json` as needed.

2. **Add or update examples** under `spec/examples/`. Per-definition example files live in `spec/examples/{common,document-blocks,entities,metadata}/<schemaName>.json` and are picked up automatically by the docs site for each schema page. Update full-document examples (`starter-kit.dsds.json`, etc.) and entity examples (`entities/component.json`, etc.) to demonstrate the new feature in context.

3. **Update the README project structure listing** under `## Project Structure` if you added or removed schema files. (The site nav auto-discovers schemas, so no MDX updates are needed for that.)

4. **Bump `package.json#version`** to the target version (e.g. `0.2.0` → `0.2.1`).

5. **Add a CHANGELOG entry** at the top of `CHANGELOG`, mirroring the format of the prior release. Include a one-line header noting where the bundled schema is now served (e.g., "Schema files are now served at `https://designsystemdocspec.org/v0.7.1/...`") and an "Additions" or "Breaking changes" section describing every schema-visible change.

6. **Run the version bump.** Preview the change first:

   ```bash
   node scripts/bump-version.js 0.2.1 --dry-run
   ```

   Apply it:

   ```bash
   node scripts/bump-version.js 0.2.1
   ```

   This rewrites `dsdsVersion.const`, the root schema title, every `$id` URL across the 44 split schemas, every example's `$schema` URL and `"dsdsVersion"` literal, and the README — then regenerates `spec/schema/dsds.bundled.schema.json` so the bundle reflects the new version. The MDX content pages need no rewriting; they pick up the new version from `{{VERSION}}` on the next `npm run build` (see [Version templating in MDX content](#version-templating-in-mdx-content)). The script is drift-tolerant: it migrates any stale `/v<X>/` URL it finds, not just the one currently in `dsdsVersion.const`.

7. **Build the site.**

   ```bash
   npm run build
   ```

   This regenerates every page under `site/dist/` and publishes a new `site/dist/v<new-version>/dsds.bundled.schema.json`. If a versioned directory for the new version already exists with a differing bundle, the build will print a warning and skip the copy — delete the file manually and rerun the build to intentionally re-publish.

8. **Validate.**

   ```bash
   npm run validate
   ```

   All example documents and per-definition examples must pass. A failure here usually means an example file uses an old field name or a newly required field is missing.

9. **Spot-check the rendered site.** Confirm the version reads correctly in three places:

   - Page `<title>` tags (e.g., `DSDS Last Updated Metadata — DSDS 0.7.1`).
   - The nav title (`Design System Documentation Spec 0.7.1`).
   - The footer (`Design System Documentation Spec (DSDS) 0.2.1 — Draft Specification`).

   The new schema page should exist at `site/dist/<group>-<name>.html` (e.g., `site/dist/metadata-last-updated.html`), and the versioned bundle should exist at `site/dist/v<new-version>/dsds.bundled.schema.json`.

10. **Commit.** Stage the schema changes, example updates, README, CHANGELOG, `package.json`, and the entire `site/dist/` tree (including the new versioned subdirectory) in one commit. The historical versioned subdirectories under `site/dist/v<older>/` must stay untouched.

### Patch-release shortcut for documentation-only edits

For a typo fix or prose clarification that doesn't touch any schema or example:

```bash
npm run build   # regenerates HTML only; no version bump, no new versioned bundle
```

No changelog entry, no version bump, no new `/v<n>/` artifact. Commit the regenerated HTML.

## Design Principles

1. **Structure enables quality.** A defined format sets a floor for quality and completeness.
2. **Guidance without justification is incomplete.** Every best practice must answer "why?"
3. **Documentation should be portable.** Teams change tools. Docs should survive the move.
4. **Education is a responsibility.** Explain *what*, *why*, and *how*.
5. **Specificity over subjectivity.** "Use sparingly" is not guidance. "Limit to one per surface" is.
6. **Schema is the source of truth.** Property tables come from schema JSON, not hand-written copy. Prose gives context; schemas give structure.

## Contributing

This is an early-stage specification (v0.6). Feedback is welcome:

- **Open an issue** for questions, suggestions, or problems with the spec.
- **Open a PR** for proposed changes to the spec, schema, or examples.

## License

This project is open source. See [LICENSE](LICENSE) for details.
