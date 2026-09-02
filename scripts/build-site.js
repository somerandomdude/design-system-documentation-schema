#!/usr/bin/env node
/**
 * build-site.js — Schema-driven site generator for the DSDS specification.
 *
 * Auto-discovers JSON Schema files from the schema directory structure and
 * generates one HTML page per schema file. Each page documents the definitions
 * within that file with property tables, type references, and cross-references.
 *
 * Narrative pages (overview, quickstart, schema-architecture) are compiled
 * from MDX content in site/content/ by scripts/compile-mdx.mjs, which can
 * embed schema-driven property tables via the <ds-prop-table /> shortcode.
 *
 * Usage:
 *   node scripts/build-site.js
 *
 * Output:
 *   site/dist/  — The generated static site
 */

const fs = require("fs");
const path = require("path");

const { buildSpecNav, buildFooter, DIR_GROUPS, readSpecVersion, TOP_LINKS } = require("./nav");
const { renderTemplate } = require("./render-template");
const {
  esc,
  escWithCode,
  slug,
  describeType: describeTypeShared,
  renderPropertyTable: renderPropertyTableShared,
  renderPropertyTableMarkdown: renderPropertyTableMarkdownShared,
  typeToMarkdown,
  buildDefIndex: buildDefIndexShared,
  resolveSchema,
  loadSchemaYaml,
  ROOT_FILES,
} = require("./render-prop-table");

// MDX compiler (ESM) — loaded dynamically in build()
let compileMdxModule = null;
async function loadMdxCompiler() {
  if (!compileMdxModule) {
    compileMdxModule = await import("./compile-mdx.mjs");
  }
  return compileMdxModule;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");

// Canonical site origin and the fallback description used by pages that
// don't declare their own (MDX frontmatter `description`, or a schema
// file's top-level `description`).
const SITE_URL = "https://designsystemdocspec.org";
const DEFAULT_DESCRIPTION =
  "A machine-readable format for design system documentation. DSDS structures a design system as a graph of entries (systems, components, tokens, themes, and custom kinds) and sections (definitions, guidelines, steps, and freeform content) for humans, parsers, and agents.";
const SCHEMA_DIR = path.join(ROOT, "schema");
const SITE_DIR = path.join(ROOT, "site");
const CONTENT_DIR = path.join(SITE_DIR, "content");
const DIST_DIR = path.join(SITE_DIR, "dist");
const EXAMPLES_DIR = path.join(ROOT, "examples");
const TEMPLATES_DIR = path.join(SITE_DIR, "templates");
const PAGE_TEMPLATE_PATH = path.join(TEMPLATES_DIR, "page.template.html");
const SUBTEMPLATES_DIR = path.join(TEMPLATES_DIR, "subtemplates");

/**
 * Render one of the content-block subtemplates in site/templates/subtemplates/.
 * Each subtemplate is a single, self-contained block of markup (a def-section
 * wrapper, a callout, an example, ...) with its own {%placeholders%} — the
 * same substitution model as the page shell, just scoped to one block instead
 * of the whole page. Trimmed so a template file's own trailing newline
 * doesn't introduce stray blank lines when callers join blocks together.
 */
function renderSub(name, vars) {
  return renderTemplate(
    path.join(SUBTEMPLATES_DIR, `${name}.template.html`),
    vars,
  ).trim();
}

/**
 * Auto-discover schema files and build the full page registry.
 *
 * Unlike the old spec/schema/ (many named `$defs` bundled per file), each
 * schema/*.schema.yaml file is one definition, usually built by extending a
 * shared base via `allOf` (see render-prop-table.js's resolveSchema). Each
 * page's `data.$defs` holds that one resolved, flattened definition (keyed
 * by the file's own `title`) plus any of the file's own local `$defs` (ex:
 * component's `traitValue`) — the same shape discoverPages() has always
 * produced, so renderSchemaPage()/buildSchemaMarkdown() below don't need to
 * know the difference between the two schema generations.
 *
 * There's no per-definition example file the way spec/examples/{group}/
 * {baseName}.json worked (examples/ is organized by purpose — quickstart,
 * base, invalid — not mirroring schema/'s own directories), so `examples`
 * is always null here; a schema page just doesn't render one.
 *
 * Returns an array of page descriptors:
 *   { slug, title, group, groupLabel, filename, filePath, data, examples }
 */
function discoverPages(schemaById) {
  const pages = [];

  function makePage(group, groupLabel, filename, filePath) {
    const raw = loadSchemaYaml(filePath);
    const baseName = filename.replace(/\.schema\.yaml$/, "");
    const pageSlug = group === "root" ? baseName : `${group}-${baseName}`;
    const title = raw.title || baseName;

    const defs = { [title]: resolveSchema(raw, schemaById) };
    for (const [defName, def] of Object.entries(raw.$defs || {})) {
      defs[defName] = def;
    }

    return {
      slug: pageSlug,
      title,
      group,
      groupLabel,
      filename,
      filePath,
      data: { title, description: raw.description, $id: raw.$id, $defs: defs },
      raw,
      examples: null,
    };
  }

  for (const filename of ROOT_FILES) {
    const filePath = path.join(SCHEMA_DIR, filename);
    if (!fs.existsSync(filePath)) continue;
    pages.push(makePage("root", "Base", filename, filePath));
  }

  for (const group of DIR_GROUPS) {
    const dirPath = path.join(SCHEMA_DIR, group.dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.yaml"))
      .sort();

    // Pin the group's own open-base file (ex: entry.schema.yaml in
    // entries/) first, ahead of the rest, which stay alphabetical — the
    // order the Schema page's def-sections appear in within this group.
    if (group.primary) {
      const primaryFile = `${group.primary}.schema.yaml`;
      const idx = files.indexOf(primaryFile);
      if (idx > 0) {
        files.splice(idx, 1);
        files.unshift(primaryFile);
      }
    }

    for (const filename of files) {
      pages.push(makePage(group.dir, group.label, filename, path.join(dirPath, filename)));
    }
  }

  return pages;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

// Global definition index for cross-references: { [$ref]: { pageSlug,
// anchor, title, description } }, built once in build() by
// ./render-prop-table's buildDefIndex (shared with the MDX shortcode
// preprocessor, so both stay 1:1 with the same schema files).
let DEF_INDEX = {};

// ---------------------------------------------------------------------------
// Type description rendering
//
// The real implementation lives in ./render-prop-table. We wrap it here so
// callers in this file can continue calling `describeType(prop)` without
// threading DEF_INDEX through every invocation.
// ---------------------------------------------------------------------------

function describeType(prop) {
  return describeTypeShared(prop, DEF_INDEX);
}

// ---------------------------------------------------------------------------
// Property table rendering
// ---------------------------------------------------------------------------

/**
 * Render a property table for a definition's properties.
 *
 * Thin wrapper around ./render-prop-table so MDX preprocessing and the
 * schema-page generator emit identical markup from the same source.
 */
function renderPropertyTable(defSchema) {
  return renderPropertyTableShared(defSchema, DEF_INDEX);
}

/** Markdown counterpart of renderPropertyTable() — see buildSchemaMarkdown. */
function renderPropertyTableMarkdown(defSchema) {
  return renderPropertyTableMarkdownShared(defSchema, DEF_INDEX);
}

// ---------------------------------------------------------------------------
// Curated per-definition examples
//
// A short, illustrative snippet for every definition on the Schema page -
// one entry per definition, root or nested $def alike - keyed by the exact
// same anchor buildDefIndex() (render-prop-table.js) and renderSchemaPage()
// below already compute for it (a root definition's is its file's own
// baseSlug; a local $def's is `${baseSlug}-${slug(defName)}`). Each example
// aims to touch every one of that definition's own top-level properties at
// least once - condensed with flow-style YAML (`{...}`/`[...]`) or `...`
// where spelling one out in full would just add length without adding
// information, not left out. A definition with no entry here renders
// without the split layout/example column.
// ---------------------------------------------------------------------------

const CURATED_EXAMPLES = {
  base: {
    file: "examples/base/starter-kit.dsds.yaml",
    yaml: `schemaVersion: "0.20.0"
name: Acme Design System
$schema: https://designsystemdocspec.org/v0.20.0/dsds.bundled.yaml

entries:
  - id: acme-design-system
    kind: system
    ...

shared:
  - id: shared-a11y
    ...

refs:
  - href: ./starter-kit-fragments/button.dsds.yaml
    rel: file

$extensions:
  com.acme: {...}`,
  },
  shared: {
    file: "examples/base/starter-kit.dsds.yaml",
    yaml: `- id: shared-a11y
  name: Shared Accessibility Rules
  description: Cross-cutting accessibility rules, stated once and referenced from every entry they apply to.
  metadata:
    status: {status: stable}
  refs:
    - href: https://www.w3.org/WAI/WCAG21/quickref/
      rel: external-link
  sections:
    - kind: guidelines
      for: all
      items:
        - id: touch-target
          statement: Minimum touch target 44x44px.
          level: must
  $extensions:
    com.acme: {...}`,
  },
  "common-combo": {
    file: "examples/entries/color-action-primary.yaml",
    yaml: `combos:
  - subject: "{color.action.primary}"
    level: must
    items: ["{color.surface.default}", "{color.surface.raised}"]
    note: Contrast is verified only against these surfaces; on any other background the label ratio is unproven.`,
  },
  "common-combo-target": {
    file: "examples/entries/color-action-primary.yaml",
    yaml: `size.large               # a bare id
"{color.action.primary}"  # or a token reference`,
  },
  "common-example": {
    file: "examples/entries/button.yaml",
    yaml: `example:
  title: One primary action per surface
  description: A toolbar with one filled primary button and two lower-emphasis secondary buttons.
  showcase:
    kind: image
    url: https://cdn.acme.example/ds/showcase/button-primary-surface.png
    alt: A toolbar with one filled primary button and two lower-emphasis secondary buttons.
  ref:
    href: https://storybook.acme.example/?path=/story/button--primary
    rel: storybook`,
  },
  "common-example-list": {
    file: "examples/entries/button.yaml",
    yaml: `- title: One primary action per surface
  showcase: {kind: image, url: https://cdn.acme.example/ds/showcase/button-primary-surface.png}
- title: Loading state
  ref: {href: ./stories/button.stories.tsx, rel: storybook}`,
  },
  "common-extensions": {
    file: "examples/entries/button.yaml",
    yaml: `$extensions:
  com.acme:
    rationale: Multiple primary buttons compete for attention and force the user to guess which action is actually the recommended one.
    failureMode: A dialog ships with two primary-styled buttons (e.g. "Save" and "Save as draft"), and usability testing shows users default to the wrong one.`,
  },
  "common-id": {
    file: "examples/entries/color-action-primary.yaml",
    yaml: `id: color.action.primary`,
  },
  "common-id-tokenid": {
    file: "examples/entries/space-4.yaml",
    yaml: `color/action/primary`,
  },
  "common-id-namespaced": {
    file: "examples/entries/button.yaml",
    yaml: `acme.icon-library`,
  },
  "common-markdown": {
    file: "examples/entries/button.yaml",
    yaml: `statement: Do not use button when the action navigates to a new URL; use the link entry instead.`,
  },
  "common-ref": {
    file: "examples/entries/button.yaml",
    yaml: `- href: https://example.atlassian.net/browse/DS-482
  rel: external-link
  role: Tracks the two-primary-buttons issue
  note: Filed after a usability test surfaced the ambiguity.
# or, pointing inside this document instead of outside it:
- to: shared-a11y#touch-target
  rel: same-as`,
  },
  "common-ref-list": {
    file: "examples/entries/button.yaml",
    yaml: `- to: button
  rel: depends-on
- href: https://storybook.acme.example
  rel: storybook`,
  },
  "common-requirement-level": {
    file: "examples/entries/button.yaml",
    yaml: `- statement: Limit each surface to one primary button.
  level: should
- statement: Use buttons only for in-page actions, never navigation.
  level: must`,
  },
  "common-showcase": {
    file: "examples/entries/button.yaml",
    yaml: `showcase:
  kind: image
  url: https://cdn.acme.example/ds/showcase/button-primary-surface.png
  alt: A toolbar with one filled primary button and two lower-emphasis secondary buttons.
  note: Captured from the Storybook build, light theme.`,
  },
  "common-since": {
    file: "examples/entries/space-4.yaml",
    yaml: `since: 1.4.0`,
  },
  "metadata-metadata": {
    file: "examples/interop/my-element.dsds.yaml",
    yaml: `metadata:
  tags: [actions, button, cta]
  owner: ds@acme.example
  reviewed:
    - date: 2026-05-01
      by: human:ahormati
      note: Copy and contrast ratios re-checked; no changes needed.
  context: Introduced to give agents extra information for how to use this entry.
  updated:
    date: 2026-06-02
    note: Added the loading trait and its guideline.
  origin:
    method: generated
    author: machine-generated
    note: Generated from custom-elements.json (CEM schemaVersion 2.1.0) by cem-to-dsds.
  $extensions:
    com.acme: {...}`,
  },
  "metadata-metadata-note": {
    file: "examples/entries/button.yaml",
    yaml: `Reviewed against the latest Figma file; no changes needed.`,
  },
  "metadata-metadata-isodate": {
    file: "examples/entries/button.yaml",
    yaml: `2026-06-02`,
  },
  "metadata-entry-metadata": {
    file: "examples/entries/button.yaml",
    yaml: `metadata:
  status: {status: stable}
  since: 1.4.0
  group: color.action
  aliases: [btn]
  tags: [actions, button, cta, form-control]
  owner: ds@acme.example
  reviewed:
    - date: 2026-05-01
      by: human:ahormati
  context: Introduced to give agents extra information for how to use this entry.
  updated: {date: 2026-06-02, note: Added the loading trait and its guideline.}
  origin: {method: authored, author: human}
  preview: {kind: image, url: https://cdn.acme.example/ds/showcase/button.png}
  $extensions:
    com.acme: {...}`,
  },
  "metadata-entry-metadata-statusvalue": {
    file: "examples/entries/button.yaml",
    yaml: `stable`,
  },
  "metadata-system-metadata": {
    file: "examples/base/starter-kit.dsds.yaml",
    yaml: `metadata:
  version: 1.4.0
  organization: Acme Corp
  url: https://design.acme.example
  license: MIT
  platforms: [react, web-component]
  tags: [design-system]
  owner: ds@acme.example
  reviewed:
    - date: 2026-05-01
      by: human:ahormati
  context: Why this system exists, for an agent reading it.
  updated: {date: 2026-06-02}
  origin: {method: authored, author: human}
  $extensions:
    com.acme: {...}`,
  },
  "entries-entry": {
    file: "examples/entries/empty-state.yaml",
    yaml: `id: empty-state
kind: entry
name: Empty State
description: Composition of components shown when a view has no content to display yet.
purpose: Tells the user why an area is empty and what to do next.
metadata:
  status: {status: stable}
related:
  - to: error-state
    rel: alternative-to
extends:
  - to: base-dialog
    rel: extends
refs:
  - href: https://github.com/acme/ds/tree/main/patterns/empty-state
    rel: source
sections:
  - kind: guidelines
    for: all
    items:
      - statement: Use an empty state the first time a list or grid has no content.
        level: should
$extensions:
  com.acme: {...}`,
  },
  "entries-entry-dispatch": {
    file: "examples/entries/empty-state.yaml",
    yaml: `- id: empty-state
  kind: entry
  name: Empty State
  description: Composition of components shown when a view has no content yet.
- id: button
  kind: component
  ...`,
  },
  "entries-component": {
    file: "examples/entries/button.yaml",
    yaml: `id: button
kind: component
name: Button
description: Triggers an action.
purpose: Gives users a single, consistent way to trigger an action.
metadata: {status: {status: stable}}
related: [{to: link, rel: alternative-to}]
extends: [{to: base-dialog, rel: extends}]
refs: [{href: https://github.com/acme/ds/react/button, rel: source}]
sections:
  - kind: guidelines
    for: all
    items: [{statement: Limit each surface to one primary button., level: should}]
$extensions:
  com.acme: {...}
sourceFiles:
  - platform: react
    file: ./src/Button.tsx
imports:
  - platform: react
    package: "@acme/ui"
traits:
  - kind: boolean
    id: loading
    description: Shows a spinner in place of the label and blocks interaction while active.
    setBy: consumer
combos:
  - subject: loading
    level: must-not
    items: [disabled]
    note: A control can't be simultaneously loading and disabled...
specs:
  - rel: contract
    href: ./contracts/button.contract.json
    role: DS Contracts`,
  },
  "entries-component-traitsetby": {
    file: "examples/entries/button.yaml",
    yaml: `consumer   # the caller passes this in, like size or variant
component  # the component sets this on its own, like hover or loading`,
  },
  "entries-component-traitvalue": {
    file: "examples/entries/button.yaml",
    yaml: `id: loading
name: Loading
description: Shows a spinner in place of the label and blocks interaction while active.
purpose: Prevents duplicate submissions while an action is in flight.
examples:
  - title: Default loading state
    showcase: {kind: image, url: https://cdn.acme.example/ds/showcase/button-loading.png}
since: 1.4.0`,
  },
  "entries-system": {
    file: "examples/base/starter-kit.dsds.yaml",
    yaml: `id: acme-design-system
kind: system
name: Acme Design System
description: Acme's cross-platform design system.
purpose: One source of truth for how Acme builds and documents interfaces.
metadata:
  version: 1.4.0
  organization: Acme Corp
  url: https://design.acme.example
  license: MIT
  platforms: [react, web-component]
  status: {status: stable}
related: [{to: acme-brand-system, rel: pairs-with}]
extends: [{to: base-design-system, rel: extends}]
refs: [{to: button, rel: composes}]
sections:
  - kind: section
    for: all
    title: Getting started
    freeform: [{title: Install, body: Add the package and its peer dependencies.}]
$extensions:
  com.acme: {...}`,
  },
  "entries-theme": {
    file: "examples/entries/dark.yaml",
    yaml: `id: dark
kind: theme
name: Dark
description: Inverted-luminance theme for low-light surfaces and user preference.
purpose: Lets a product opt into a dark color scheme without redefining every token.
metadata: {status: {status: stable}}
related: [{to: light, rel: pairs-with}]
extends:
  - to: light
    rel: extends
refs:
  - href: https://www.figma.com/file/acme-dark-theme
    rel: design
sections:
  - kind: guidelines
    for: all
    items: [{statement: Test contrast against both themes before shipping., level: should}]
$extensions:
  com.acme: {...}
source: tokens/dark.tokens.json
colorScheme: dark`,
  },
  "entries-token": {
    file: "examples/entries/space-4.yaml",
    yaml: `id: space-4
kind: token
name: Space 4
description: A single step on the base spacing scale - 4 times the 4px base unit.
purpose: Keeps spacing consistent across components without hand-picked pixel values.
metadata: {status: {status: stable}, group: space}
related: [{to: space-8, rel: pairs-with}]
extends: [{to: space-base, rel: extends}]
refs: [{href: https://www.figma.com/file/acme-spacing-scale, rel: design}]
sections:
  - kind: guidelines
    for: all
    items: [{statement: Use for default padding/gap; use space-8 for section spacing., level: should}]
$extensions:
  com.acme: {...}
tokenType: spacing
source: ./tokens.dtcg.json
combos:
  - subject: "{color.action.primary}"
    level: must
    items: ["{color.surface.default}", "{color.surface.raised}"]`,
  },
  "sections-definitions": {
    file: "examples/entries/button.yaml",
    yaml: `- kind: definitions
  for: all
  title: Terms
  description: Words used in this component's copy.
  context: terms
  metadata: {status: {status: stable}}
  items:
    - term: OK
      definition: To confirm an action.
    - term: Cancel
      definition: To cancel an action.
  freeform:
    - title: About
      body: These terms match the ones used in product copy guidelines.
  $extensions:
    com.acme: {...}`,
  },
  "sections-guidelines": {
    file: "examples/entries/button.yaml",
    yaml: `- kind: guidelines
  for: agent
  framing: when-to-use
  title: When to use
  description: Whether button is the right choice for this action.
  context: acme.fit-check
  metadata: {status: {status: stable}}
  items:
    - statement: Do not use button when the action navigates to a new URL; use the link entry instead.
      level: must-not
      alternatives:
        - to: link
          rel: alternative-to
  freeform:
    - title: Why this matters
      body: A button that navigates breaks browser back/forward and "open in new tab."
  $extensions:
    com.acme: {...}`,
  },
  "sections-steps": {
    file: "examples/entries/button.yaml",
    yaml: `- kind: steps
  for: agent
  ordered: false
  title: Pre-release checklist
  description: Run through before shipping a change to this component.
  context: acme.checklist
  metadata: {status: {status: stable}}
  items:
    - title: Focus ring is visible in both light and dark themes.
    - title: Loading state announces to screen readers.
    - title: Works with a custom icon in the leading-icon slot.
      optional: true
  freeform:
    - title: Why this matters
      body: Skipping this checklist is how contrast regressions ship.
  $extensions:
    com.acme: {...}`,
  },
  "sections-section": {
    file: "examples/entries/getting-started.yaml",
    yaml: `- kind: section
  for: all
  title: Troubleshooting
  description: Common problems and how to fix them.
  context: acme.troubleshooting
  metadata: {status: {status: stable}}
  items:
    - title: Note
      body: Generic items have no fixed shape - use freeform for prose instead.
  freeform:
    - title: Styles don't apply
      body: Confirm the base theme is imported before any component renders - a component's own CSS assumes the theme's custom properties already exist.
  $extensions:
    com.acme: {...}`,
  },
  "sections-section-dispatch": {
    file: "examples/entries/button.yaml",
    yaml: `- kind: guidelines
  for: all
  items:
    - statement: Limit each surface to one primary button.
      level: should
- kind: steps
  ...`,
  },
  "sections-section-freeformentry": {
    file: "examples/entries/getting-started.yaml",
    yaml: `title: Install
id: install
body: Add the package and its peer dependencies.
examples:
  - title: Install with the CLI
    ref: {href: ./install.sh, rel: file}
refs:
  - to: getting-started
    rel: see-also
items:
  - title: Peer dependencies
    body: React 18+ and a theme provider higher in the tree.
$extensions:
  com.acme: {...}`,
  },
};

// ---------------------------------------------------------------------------
// Definition rendering
// ---------------------------------------------------------------------------

// No-JS fallback content for <ds-def-section> — 36 definitions on the
// Schema page whose heading/type/description text only exists inside a
// JS-attached shadow root today (unlike <ds-heading>/<ds-header>, which got
// a real Declarative Shadow DOM template this same effort; def-section's
// own sticky/docked-border/eyebrow markup is involved enough that
// replicating it Node-side wasn't worth it for what's just a heading and
// two lines of text). Ported from origin/0.16.0's identical-purpose
// renderHeaderFallback()/renderDefSectionFallback(): plain light-DOM
// elements, marked with a slot name ("_fallback") that def-section.js's
// own shadow template never declares a <slot> for. Without JS there's no
// shadow root at all, so these render as ordinary page content; the
// instant JS *does* attach a shadow root, the flattening algorithm finds
// no matching slot for them and drops them from the render tree
// automatically — no duplicate text, no change needed in def-section.js
// itself.
function renderDefSectionFallback(anchor, name, type, description, eyebrow) {
  let html = "";
  if (eyebrow) html += `<p slot="_fallback">${esc(eyebrow)}</p>`;
  html += `<h2 slot="_fallback" id="${esc(anchor)}">${esc(name)}</h2>`;
  if (type) html += `<p slot="_fallback">${esc(type)}</p>`;
  if (description) html += `<p slot="_fallback">${escWithCode(description)}</p>`;
  return html;
}

/**
 * Render a single $defs definition as an HTML section.
 *
 * `anchor`/`source` come from the caller (renderSchemaPage()), which
 * already knows the owning file's baseSlug and whether this defName is
 * that file's own root definition or one of its local $defs - see
 * render-prop-table.js's buildDefIndex() for the same anchor scheme.
 * `exampleYaml`, when present (from CURATED_EXAMPLES above), renders into
 * def-section.js's named "example" slot with layout="split"; when absent,
 * the section renders as a single column, same as before this existed.
 */
function renderDefinition(defName, defSchema, { anchor, source, exampleYaml, eyebrow }) {
  const sourceAttr = source ? ` source="${esc(source)}"` : "";
  const layoutAttr = exampleYaml ? ` layout="split"` : "";
  const eyebrowAttr = eyebrow ? ` eyebrow="${esc(eyebrow)}"` : "";
  const fallback = renderDefSectionFallback(anchor, defName, defSchema.type, defSchema.description, eyebrow);
  const example = exampleYaml
    ? `<ds-code language="yaml" label="" slot="example" wrap>${esc(exampleYaml)}</ds-code>`
    : "";
  const content = [];

  // If it's a simple string (like requirement-level, or id's pattern), show
  // that and stop — a bare string def has no properties/oneOf/anyOf/example
  // content to add.
  if (defSchema.type === "string" && !defSchema.properties) {
    if (defSchema.enum) {
      const items = defSchema.enum
        .map((val) => `<li><ds-code inline>${esc(String(val))}</ds-code></li>`)
        .join("\n");
      content.push(renderSub("enum-values", { items }));
    }
    if (defSchema.pattern) {
      content.push(
        renderSub("callout-warning", {
          label: "Pattern",
          message: `Values must match <ds-code inline>${esc(defSchema.pattern)}</ds-code>.`,
        }),
      );
    }
    return renderSub("def-section", {
      name: esc(defName),
      anchor,
      description_attr: defSchema.description
        ? ` description="${esc(defSchema.description)}"`
        : "",
      type_attr: defSchema.type ? ` type="${esc(defSchema.type)}"` : "",
      source_attr: sourceAttr,
      layout_attr: layoutAttr,
      eyebrow_attr: eyebrowAttr,
      content: content.join("\n"),
      example,
      fallback,
    });
  }

  // If it's a oneOf (like richText), show the alternatives
  if (defSchema.oneOf) {
    const items = [];
    for (const alt of defSchema.oneOf) {
      if (alt.$ref) {
        const target = DEF_INDEX[alt.$ref];
        items.push(
          target
            ? `<li><a href="${target.pageSlug}.html#${target.anchor}">${esc(target.title)}</a></li>`
            : `<li><ds-code inline>${esc(alt.$ref)}</ds-code></li>`,
        );
      } else if (alt.type === "string") {
        items.push(
          `<li><strong>string</strong>${alt.description ? ` — ${esc(alt.description)}` : ""}</li>`,
        );
      } else if (alt.type === "object") {
        // The property table must nest inside the <li>, not sit as a
        // sibling of it — a <ul> may only directly contain <li> elements.
        items.push(
          `<li><strong>object</strong>${alt.description ? ` — ${esc(alt.description)}` : ""}` +
            (alt.properties ? renderPropertyTable(alt) : "") +
            "</li>",
        );
      } else {
        items.push(`<li>${describeType(alt)}</li>`);
      }
    }
    content.push(renderSub("oneof-alternatives", { items: items.join("\n") }));
  }

  // Property table
  if (defSchema.properties) {
    content.push(renderPropertyTable(defSchema));
  }

  // additionalProperties (open maps like tokenApi)
  if (
    defSchema.type === "object" &&
    defSchema.additionalProperties &&
    typeof defSchema.additionalProperties === "object" &&
    !defSchema.properties
  ) {
    content.push(
      renderSub("additional-properties", {
        value_type: esc(defSchema.additionalProperties.type || "any"),
      }),
    );
  }

  // anyOf constraints (like presentationStory requiring url or storyId,
  // or collectionDoc requiring at least one of components/tokens/etc.)
  if (defSchema.anyOf) {
    // Check if ALL branches are simple {required: [name]} constraints
    const allSimpleRequired = defSchema.anyOf.every(
      (alt) =>
        alt.required &&
        Array.isArray(alt.required) &&
        Object.keys(alt).length === 1,
    );

    if (allSimpleRequired && defSchema.anyOf.length > 1) {
      // "At least one of" pattern — already shown via conditional-badge in the table
      const propNames = defSchema.anyOf.map((alt) =>
        alt.required
          .map((r) => `<ds-code inline>${esc(r)}</ds-code>`)
          .join(", "),
      );
      content.push(
        renderSub("callout-warning", {
          label: "Constraint",
          message: `At least one of ${propNames.join(", ")} must be present.`,
        }),
      );
    } else {
      // Mixed anyOf — show each branch
      const items = defSchema.anyOf
        .filter((alt) => alt.required)
        .map(
          (alt) =>
            `<li>${alt.required.map((r) => `<ds-code inline>${esc(r)}</ds-code>`).join(", ")} must be present</li>`,
        )
        .join("\n");
      content.push(renderSub("anyof-constraints", { items }));
    }
  }

  // if/then (conditional requirements like deprecation)
  if (defSchema.if && defSchema.then) {
    const ifProps = defSchema.if.properties || {};
    const thenReq = defSchema.then.required || [];
    const conditions = Object.entries(ifProps)
      .map(
        ([k, v]) =>
          `<ds-code inline>${esc(k)}</ds-code> is <ds-code inline>"${esc(String(v.const || ""))}"</ds-code>`,
      )
      .join(" and ");
    const requirements = thenReq
      .map((r) => `<ds-code inline>${esc(r)}</ds-code>`)
      .join(", ");
    if (conditions && requirements) {
      content.push(
        renderSub("callout-warning", {
          label: "Conditional",
          message: `When ${conditions}, then ${requirements} is required.`,
        }),
      );
    }
  }

  // Cross-references: list all $ref targets in this definition
  const refs = collectRefs(defSchema);
  if (refs.length > 0) {
    const refLinks = refs.map((ref) => {
      const target = DEF_INDEX[ref];
      if (target) {
        return `<ds-type-ref href="${target.pageSlug}.html#${target.anchor}">${esc(target.title)}</ds-type-ref>`;
      }
      return `<ds-code inline>${esc(ref)}</ds-code>`;
    });
    content.push(renderSub("cross-refs", { refs: refLinks.join(", ") }));
  }

  return renderSub("def-section", {
    name: esc(defName),
    anchor,
    description_attr: defSchema.description
      ? ` description="${esc(defSchema.description)}"`
      : "",
    type_attr: defSchema.type ? ` type="${esc(defSchema.type)}"` : "",
    source_attr: sourceAttr,
    layout_attr: layoutAttr,
    eyebrow_attr: eyebrowAttr,
    content: content.join("\n"),
    example,
    fallback,
  });
}

/**
 * Collect all unique $ref target strings from a schema object.
 */
function collectRefs(obj, seen = new Set()) {
  if (Array.isArray(obj)) {
    for (const item of obj) collectRefs(item, seen);
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (key === "$ref" && typeof value === "string") {
        seen.add(value);
      } else {
        collectRefs(value, seen);
      }
    }
  }
  return [...seen];
}

// ---------------------------------------------------------------------------
// Page rendering for a single schema file
// ---------------------------------------------------------------------------

/**
 * Collect the names of sibling $defs that `node` references (via any `$ref`
 * pointing at `#/$defs/<name>`). Cross-file refs are ignored by the caller,
 * which filters against the file's own def names.
 */
function collectSiblingRefs(node, out) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSiblingRefs(n, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string") {
        const m = value.match(/\$defs\/(\w+)/);
        if (m) out.add(m[1]);
      } else {
        collectSiblingRefs(value, out);
      }
    }
  }
}

/**
 * Order a file's $defs so a definition appears BEFORE the definitions it
 * references — i.e., the top-level block/entity first, its nested entry shapes
 * (the granular details) after. Implemented as a level-order topological sort
 * over the in-file reference graph; ties and any reference cycles fall back to
 * the original file order for stability.
 */
function orderDefsByReference(defs) {
  const names = Object.keys(defs);
  const nameSet = new Set(names);

  const refs = {}; // def -> Set of sibling defs it references
  const inDegree = {};
  for (const name of names) inDegree[name] = 0;
  for (const name of names) {
    const found = new Set();
    collectSiblingRefs(defs[name], found);
    found.delete(name); // ignore self-reference (recursive defs)
    refs[name] = new Set([...found].filter((r) => nameSet.has(r)));
  }
  for (const a of names) for (const b of refs[a]) inDegree[b]++;

  const ordered = [];
  const emitted = new Set();
  let remaining = names.slice();
  while (remaining.length) {
    const ready = remaining.filter((n) => inDegree[n] === 0); // file order preserved
    if (ready.length === 0) {
      ordered.push(...remaining); // cycle — keep file order
      break;
    }
    for (const n of ready) {
      ordered.push(n);
      emitted.add(n);
      for (const b of refs[n]) inDegree[b]--;
    }
    remaining = remaining.filter((n) => !emitted.has(n));
  }
  return ordered;
}

// Returns the schema page's own content blocks separately (definitions,
// defNames, baseSlug) instead of one flattened string — the caller
// (build()'s schema-page assembly) drops each into the combined Schema
// page, grouped by file, with its own group heading between files from a
// different schema/ subdirectory.
function renderSchemaPage(page) {
  const defs = page.data.$defs || {};
  const defNames = orderDefsByReference(defs);

  const relPath = page.group && page.group !== "root" ? `${page.group}/${page.filename}` : page.filename;
  // Matches render-prop-table.js's buildDefIndex() exactly - the root
  // definition's own anchor is the file's baseSlug; a local $def's anchor
  // is baseSlug-defNameSlug. Both need to agree, or a cross-reference
  // built from DEF_INDEX would land somewhere this page didn't actually
  // anchor.
  const baseName = page.filename.replace(/\.schema\.yaml$/, "");
  const baseSlug = page.group === "root" ? baseName : `${page.group}-${baseName}`;
  // The page-level "Base"/"Common"/"Metadata"/"Entries"/"Sections" group
  // headings are gone (see build()'s schema-page assembly) - this is
  // their replacement, one directory label per definition instead of one
  // heading per group. `root` (base.schema.yaml) has no real subdirectory
  // of its own, so it gets no eyebrow rather than a made-up "base/".
  const eyebrow = page.group && page.group !== "root" ? `${page.group}/` : "";

  if (defNames.length === 0) {
    // Root-only schemas (no $defs). Every file currently has at least one
    // $defs entry - its own resolved root schema, added in discoverPages()
    // - so this branch doesn't fire today. Kept for a schema file that
    // genuinely has none.
    return { definitions: "", defNames, baseSlug };
  }

  // Render each definition with its curated example (if one exists)
  const definitions = defNames
    .map((defName) => {
      const isRoot = defName === page.title;
      const anchor = isRoot ? baseSlug : `${baseSlug}-${slug(defName)}`;
      // CURATED_EXAMPLES is keyed by the exact same anchor every definition
      // (root or a local $def) already renders under, so every def - not
      // just a file's own root - can carry its own curated example.
      const curated = CURATED_EXAMPLES[anchor];
      return renderDefinition(defName, defs[defName], {
        anchor,
        source: relPath,
        exampleYaml: curated ? curated.yaml : undefined,
        eyebrow,
      });
    })
    .join("\n");

  return { definitions, defNames, baseSlug };
}

// ---------------------------------------------------------------------------
// Markdown mirror for a single schema file
//
// A plain-text/GFM-markdown equivalent of renderSchemaPage()/renderDefinition()
// for agents that fetch the page without executing JS: the HTML pages carry
// their real content (title, field names/types, descriptions) as attributes
// on <ds-header>/<ds-def-section>/<ds-prop> for the shadow-DOM components to
// render, which a non-JS fetch never sees. Every fact here is pulled from the
// exact same page/def/example data — and property tables from the exact same
// propTableRows() — as the HTML path, so the two can't drift apart.
// ---------------------------------------------------------------------------

/**
 * Markdown counterpart of renderDefinition() for one $defs entry.
 */
function renderDefinitionMarkdown(defName, defSchema, exampleData) {
  const hid = slug(defName);
  const lines = [`## ${defName} {#${hid}}`, ""];

  if (defSchema.description) {
    lines.push(defSchema.description, "");
  }

  // Bare string/enum def (e.g. a status vocabulary) — show the enum and stop,
  // mirroring renderDefinition()'s early return for the same shape.
  if (defSchema.type === "string" && !defSchema.properties) {
    if (defSchema.enum) {
      lines.push("Allowed values:", "");
      for (const val of defSchema.enum) lines.push(`- \`${val}\``);
      lines.push("");
    }
    if (defSchema.pattern) {
      lines.push(`**Pattern:** \`${defSchema.pattern}\``, "");
    }
    return lines.join("\n");
  }

  // oneOf alternatives (e.g. richText's string | object forms)
  if (defSchema.oneOf) {
    lines.push("One of:", "");
    for (const alt of defSchema.oneOf) {
      if (alt.$ref) {
        const target = DEF_INDEX[alt.$ref];
        lines.push(
          target
            ? `- [${target.title}](${target.pageSlug}.md#${target.anchor})`
            : `- \`${alt.$ref}\``,
        );
      } else if (alt.type === "string") {
        lines.push(`- **string**${alt.description ? ` — ${alt.description}` : ""}`);
      } else if (alt.type === "object") {
        lines.push(`- **object**${alt.description ? ` — ${alt.description}` : ""}`);
        if (alt.properties) {
          lines.push("", renderPropertyTableMarkdown(alt));
        }
      } else {
        lines.push(`- ${typeToMarkdown(describeType(alt))}`);
      }
    }
    lines.push("");
  }

  // Property table
  if (defSchema.properties) {
    const table = renderPropertyTableMarkdown(defSchema);
    if (table) lines.push(table, "");
  }

  // additionalProperties (open maps like tokenApi)
  if (
    defSchema.type === "object" &&
    defSchema.additionalProperties &&
    typeof defSchema.additionalProperties === "object" &&
    !defSchema.properties
  ) {
    lines.push(
      `Open map — values are \`${defSchema.additionalProperties.type || "any"}\`.`,
      "",
    );
  }

  // anyOf constraints
  if (defSchema.anyOf) {
    const allSimpleRequired = defSchema.anyOf.every(
      (alt) =>
        alt.required &&
        Array.isArray(alt.required) &&
        Object.keys(alt).length === 1,
    );
    if (allSimpleRequired && defSchema.anyOf.length > 1) {
      const propNames = defSchema.anyOf.map((alt) =>
        alt.required.map((r) => `\`${r}\``).join(", "),
      );
      lines.push(
        `**Constraint:** At least one of ${propNames.join(", ")} must be present.`,
        "",
      );
    } else {
      const items = defSchema.anyOf.filter((alt) => alt.required);
      if (items.length) {
        lines.push("**Constraints:**", "");
        for (const alt of items) {
          lines.push(
            `- ${alt.required.map((r) => `\`${r}\``).join(", ")} must be present`,
          );
        }
        lines.push("");
      }
    }
  }

  // if/then (conditional requirements like deprecation)
  if (defSchema.if && defSchema.then) {
    const ifProps = defSchema.if.properties || {};
    const thenReq = defSchema.then.required || [];
    const conditions = Object.entries(ifProps)
      .map(([k, v]) => `\`${k}\` is \`"${v.const || ""}"\``)
      .join(" and ");
    const requirements = thenReq.map((r) => `\`${r}\``).join(", ");
    if (conditions && requirements) {
      lines.push(
        `**Conditional:** When ${conditions}, then ${requirements} is required.`,
        "",
      );
    }
  }

  // Cross-references
  const refs = collectRefs(defSchema);
  if (refs.length > 0) {
    const refLinks = refs.map((ref) => {
      const target = DEF_INDEX[ref];
      return target
        ? `[${target.title}](${target.pageSlug}.md#${target.anchor})`
        : `\`${ref}\``;
    });
    lines.push(`**References:** ${refLinks.join(", ")}`, "");
  }

  // Example
  if (exampleData !== undefined && exampleData !== null) {
    lines.push(
      "**Example:**",
      "",
      "```json",
      JSON.stringify(exampleData, null, 2),
      "```",
      "",
    );
  }

  return lines.join("\n");
}

/**
 * Markdown counterpart of renderSchemaPage() for a whole schema file —
 * title, description, root properties (if any), each $def in reference
 * order, and a trailing fenced YAML block with the full source.
 */
function buildSchemaMarkdown(page) {
  const defs = page.data.$defs || {};
  const defNames = orderDefsByReference(defs);
  const examples = page.examples || {};
  const relSource =
    page.group && page.group !== "root" ? `${page.group}/${page.filename}` : page.filename;

  const lines = [`# ${page.title}`, ""];
  if (page.data.description) lines.push(page.data.description, "");
  lines.push(`Source: \`${relSource}\``, "");

  if (defNames.length === 0) {
    // Root-only schemas (no $defs) can still ship an example — same
    // convention as renderSchemaPage(): the whole example file is one
    // root-level example document.
    if (page.examples !== null && page.examples !== undefined) {
      lines.push(
        "## Example",
        "",
        "```json",
        JSON.stringify(page.examples, null, 2),
        "```",
        "",
      );
    }
  } else {
    if (defNames.length > 1) {
      lines.push(
        `**${defNames.length} definitions** in this file: ` +
          defNames.map((n) => `\`${n}\``).join(", "),
        "",
      );
    }
    for (const defName of defNames) {
      const exampleData =
        examples[defName] !== undefined ? examples[defName] : null;
      lines.push(renderDefinitionMarkdown(defName, defs[defName], exampleData));
    }
  }

  lines.push(
    "## Full schema source",
    "",
    "```yaml",
    fs.readFileSync(page.filePath, "utf-8").trimEnd(),
    "```",
    "",
  );

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// ---------------------------------------------------------------------------
// <link rel="alternate"> + JSON-LD — standards-based affordances that let a
// generic crawler/agent discover the machine-readable forms of a page (its
// .md mirror, and for schema pages the bundled schema) and get structured
// name/description/version metadata without parsing the visible HTML at all.
// ---------------------------------------------------------------------------

function buildAlternateLinks(activeSlug, pageType, version) {
  const links = [
    `  <link rel="alternate" type="text/markdown" href="${esc(activeSlug)}.md">`,
  ];
  if (pageType === "schema") {
    links.push(
      `  <link rel="alternate" type="application/schema+yaml" href="${SITE_URL}/v${esc(version)}/dsds.bundled.yaml">`,
    );
  }
  return links.join("\n");
}

function buildJsonLd({ name, description, url, version, pageType, activeSlug, defEntries }) {
  const data = {
    "@context": "https://schema.org",
    "@type": pageType === "schema" ? "APIReference" : "TechArticle",
    name,
    description,
    url,
    version,
    isPartOf: {
      "@type": "WebSite",
      name: "Design System Doc Spec",
      url: `${SITE_URL}/`,
    },
    // The .md mirror is the same content in another format — schema.org's
    // definition of sameAs ("a reference page that unambiguously indicates
    // the item's identity") fits an exact-content alternate representation
    // as well as it fits a cross-site equivalence.
    sameAs: `${SITE_URL}/${activeSlug}.md`,
  };
  // Schema pages are generated straight from one $defs entry (or more) in
  // the bundled schema — subjectOf points at that source data.
  if (pageType === "schema") {
    data.subjectOf = `${SITE_URL}/v${version}/dsds.bundled.yaml`;
  }
  // hasPart — the page's own definition sections, so a consumer that only
  // reads JSON-LD still sees the page isn't a single flat document (mirrors
  // the def-index the HTML/markdown both already show). Anchors come from
  // the caller (already matching buildDefIndex()'s scheme) rather than a
  // bare slug(name) here - a nested $def's real anchor is baseSlug-prefixed,
  // not just its own name, now that every definition lives on one page.
  if (defEntries && defEntries.length) {
    data.hasPart = defEntries.map((entry) => ({
      "@type": "DefinedTerm",
      name: entry.name,
      url: `${url}#${entry.anchor}`,
    }));
  }
  // Escape "<" so a description containing "</script>" can't break out of
  // the script tag early — the standard safe way to embed JSON in <script>.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `  <script type="application/ld+json">${json}</script>`;
}

// ---------------------------------------------------------------------------
// Declarative Shadow DOM for <ds-heading>/<ds-header>
//
// Every heading on the site - the page's own <h1> (<ds-header>) and every
// <h2>-<h6> under it (<ds-heading>) - only became a real, semantic heading
// once client JS ran and built each one's shadow DOM. A crawler, an agent,
// or any other tool that parses the HTML without executing script saw none
// of that structure: no <h1>, no <h2>, nothing an accessibility tree or a
// readability parser recognizes as a heading at all - confirmed directly
// against the live site (curl | grep for <h1>/<h2>/<h3> turned up zero
// matches on every page) after an agentic-readiness scan flagged exactly
// this. <ds-heading>'s own text was at least present as light-DOM slot
// content; <ds-header>'s title/description live only as attribute values,
// worse still.
//
// Declarative Shadow DOM fixes this without giving up the shadow-DOM
// component itself: a <template shadowrootmode="open"> as an element's
// first child is parsed and attached as a real shadow root by the browser
// during HTML parsing, before any script runs - so the exact same <h1>/
// <h2> markup these components already build in JS is now *also* present
// verbatim in the static HTML. `_shared.js`'s createShadow() reuses
// `el.shadowRoot` if one already exists instead of always calling
// attachShadow() (which throws once one does), so heading.js/header.js's
// own client-side render still runs on top of this with no changes and no
// behavior difference - it just recomputes the same shadow content the
// declarative template already provided, once JS is available.
//
// HEADING_CSS/HEADER_CSS and the markup shape below are hand-kept in sync
// with site/components/heading.js's/header.js's own HEADING_CSS/HEADER_CSS
// and _render() - the same "small pure logic duplicated across the
// Node/browser boundary, single comment on each side" approach this file
// already uses for other build-time/client-time pairs (see readSpecVersion()
// across nav.js/compile-mdx.mjs). No shared import: heading.js/header.js
// are browser ES modules (`export class ... extends HTMLElement`, which
// throws immediately if evaluated in Node, since HTMLElement doesn't
// exist there), and bundleComponents() below resolves site/components'
// own import graph with a regex scan of index.js's barrel imports only,
// not a real module resolver - introducing a new cross-component import
// between two component files isn't something it would pick up correctly.
// ---------------------------------------------------------------------------

const HEADING_CSS_SSR = `
  :host { display: inline-block; box-sizing: border-box; }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
  :host { display: block; }

  .heading {
    display: block;
    color: var(--ds-color-text);
    font-family: var(--ds-font-mono);
    line-height: var(--ds-line-height-snug);
    letter-spacing: -0.0125em;
  }

  .heading--1 { font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-bold); margin: 0 0 var(--ds-space-4); }
  .heading--2 { font-size: var(--ds-font-size-xl); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-8) 0 var(--ds-space-2); }
  .heading--3 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-8) 0 var(--ds-space-2); }
  .heading--4 { font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
  .heading--5 { font-size: var(--ds-font-size-base); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
  .heading--6 { font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-2) 0 var(--ds-space-2); }

  .anchor-link {
    display: inline;
    opacity: 0;
    margin-inline-start: var(--ds-space-2);
    color: var(--ds-color-text);
    text-decoration: none;
    font-size: 0.75em;
    vertical-align: baseline;
    transition: opacity var(--ds-duration-fast) var(--ds-ease-standard);
  }
  :where(.heading:hover) .anchor-link { opacity: 0.6; }
  .anchor-link:hover { opacity: 1; }
`;

const HEADER_CSS_SSR = `
  :host { display: inline-block; box-sizing: border-box; }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
  :host { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; background: var(--ds-color-bg-accent); justify-content: end; padding-block-start: var(--ds-height-nav, 64px); }

  h1 {
    font-size: clamp(2em, 4vw, 4em);
    font-family: var(--ds-font-mono);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.025em;
    word-spacing: -0.25em;
    margin: 0 0 var(--ds-space-4);
    color: var(--ds-color-text);
    word-break: break-word;
  }
  .header-container {
    max-width: var(--ds-width-content);
    margin: 0 auto;
    padding: var(--ds-space-8) var(--ds-space-8);
    width: 100%;
    padding-block-end: 64px;
    padding-block-start: 128px;
  }

  .desc {
    color: var(--ds-color-text);
    font-family: var(--ds-font-body);
    margin: 0 0 var(--ds-space-4);
    max-width: 65ch;
    font-size: clamp(1.05em, 1.7vw, 1.375em);
    font-weight: 500;
    line-height: 1.4;
  }
  .source {
    font-size: var(--ds-font-size-sm);
    margin: 0 0 var(--ds-space-8);
    display: none;
  }
`;

// Reverses esc()'s four entities - needed because attrs come from the
// already-built HTML string (HTML-attribute-escaped), but the shadow
// markup below needs the raw text back to re-escape correctly as element
// content instead (attribute escaping and text-node escaping agree on
// all four of these entities, so a plain reverse is safe either way).
function unescAttr(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function declarativeHeadingTemplate(level, anchor) {
  const lvl = Math.min(6, Math.max(1, parseInt(level, 10) || 2));
  const tag = "h" + lvl;
  return (
    `<template shadowrootmode="open"><style>${HEADING_CSS_SSR}</style>` +
    `<${tag} class="heading heading--${lvl}" part="heading"><slot></slot> ` +
    `<a class="anchor-link" href="#${esc(anchor)}" part="anchor">#</a></${tag}>` +
    `</template>`
  );
}

function declarativeHeaderTemplate({ title, description, source }) {
  let inner = `<div class="header-container"><h1>${esc(title)}<slot></slot></h1>`;
  if (source) {
    inner += `<p class="source">Source: <ds-code inline>${esc(source)}</ds-code></p>`;
  }
  if (description) {
    inner += `<p class="desc">${escWithCode(description)}</p>`;
  }
  inner += "</div>";
  return `<template shadowrootmode="open"><style>${HEADER_CSS_SSR}</style>${inner}</template>`;
}

// Single post-processing pass over an already-assembled page's HTML,
// finding every <ds-heading>/<ds-header> opening tag and inserting the
// matching declarative shadow root as its first child. Run once, on the
// fully assembled page (pageHtml() below), so it catches every occurrence
// regardless of which code path (compile-mdx.mjs's markdown->component
// pass, or this file's own header rendering) produced the tag.
function injectDeclarativeShadowDom(html) {
  let out = html.replace(/<ds-heading\s+([^>]*)>/g, (match, attrs) => {
    const levelMatch = /\blevel="(\d+)"/.exec(attrs);
    const anchorMatch = /\banchor="([^"]*)"/.exec(attrs);
    const level = levelMatch ? levelMatch[1] : "2";
    const anchor = anchorMatch ? anchorMatch[1] : "";
    // Mirrors heading.js's own `this.id = anchor` (set in JS, at render
    // time) - a no-JS reader needs it as a real attribute instead.
    const attrsWithId = /\bid="/.test(attrs) ? attrs : `${attrs} id="${esc(anchor)}"`;
    return `<ds-heading ${attrsWithId}>${declarativeHeadingTemplate(level, anchor)}`;
  });

  out = out.replace(/<ds-header\s+([^>]*)>/g, (match, attrs) => {
    const titleMatch = /\btitle="([^"]*)"/.exec(attrs);
    const descMatch = /\bdescription="([^"]*)"/.exec(attrs);
    const sourceMatch = /\bsource="([^"]*)"/.exec(attrs);
    const title = unescAttr(titleMatch ? titleMatch[1] : "");
    const description = unescAttr(descMatch ? descMatch[1] : "");
    const source = unescAttr(sourceMatch ? sourceMatch[1] : "");
    return `<ds-header ${attrs}>${declarativeHeaderTemplate({ title, description, source })}`;
  });

  return out;
}

// ---------------------------------------------------------------------------
// Overview page — rendered from markdown
// ---------------------------------------------------------------------------

function pageHtml(
  title,
  activeSlug,
  mainHtml,
  pages,
  version,
  description,
  pageType = "guide",
  defEntries,
) {
  // Derive the spec version from the schema if the caller didn't pass one
  // explicitly. This keeps every `DSDS <v>` string in the rendered HTML
  // tied to dsds.schema.json#/properties/dsdsVersion/const — the same
  // single source of truth that the bundle script and nav use.
  const v = version || readSpecVersion() || "";

  // Skip the `— DSDS <v>` suffix when the title already names the
  // version (ex: the overview page title is "Design System Documentation
  // Spec 0.2"). Otherwise the tab text reads "… Spec 0.2 — DSDS 0.2".
  // A bare `.includes(v)` check is precise enough — a 2-character version
  // like "0.2" is unlikely to appear coincidentally in a page title.
  const titleHasVersion = v && title.includes(v);
  const titleSuffix = v && !titleHasVersion ? ` — DSDS ${v}` : "";

  // The live server resolves extensionless paths; the root page is the
  // bare origin rather than /index.
  const pageUrl =
    activeSlug === "index" ? `${SITE_URL}/` : `${SITE_URL}/${activeSlug}`;
  const desc = description || DEFAULT_DESCRIPTION;
  const fullTitle = `${title}${titleSuffix}`;

  // Each top-level section of the page (<head>, skip link, main content
  // area) is its own subtemplate, so the page shell below is just the
  // order they're assembled in — reorder or restructure a section by
  // editing its file, not by hunting through the whole page shell. The
  // main content area itself is built by the caller (renderMainGuide()/
  // renderMainSchema() below), since its own structure is type-specific -
  // this shell doesn't need to know or care which type it's wrapping.
  const head = renderSub("head", {
    title: esc(fullTitle),
    description: esc(desc),
    canonical: pageUrl,
    version: esc(v),
    alternates: buildAlternateLinks(activeSlug, pageType, v),
    jsonld: buildJsonLd({
      name: fullTitle,
      description: desc,
      url: pageUrl,
      version: v,
      pageType,
      activeSlug,
      defEntries,
    }),
  });
  const skipLink = renderSub("skip-link", {});

  const rendered = renderTemplate(PAGE_TEMPLATE_PATH, {
    head,
    skip_link: skipLink,
    nav: buildSpecNav(activeSlug, pages, v),
    main: mainHtml,
    footer: buildFooter(v),
  });
  // Every <ds-heading>/<ds-header> on the page, wherever it came from
  // (compile-mdx.mjs's markdown pass, this file's own header rendering) -
  // see injectDeclarativeShadowDom()'s own comment above for why this
  // runs once, here, on the fully assembled page rather than per call site.
  return injectDeclarativeShadowDom(rendered);
}

// content--full removes the reading-width cap some pages want (ex: a wide
// property table). Shared by both page types below since either could
// need it in principle, even though only guide pages use it today.
function contentClassFor(layout) {
  return "content" + (layout === "full" ? " content--full" : "");
}

// The "plain content" page type (site/templates/subtemplates/
// main-guide.template.html) - a header plus one block of already-rendered
// body content (compiled MDX), nothing else structural.
function renderMainGuide({ header, content, layout }) {
  return renderSub("main-guide", {
    content_class: contentClassFor(layout),
    header,
    content,
    back_to_top: renderSub("back-to-top", {}),
  });
}

// The schema-docs page type (site/templates/subtemplates/
// main-schema.template.html) - a header, then the definitions themselves
// (each carrying its own source file attribution inline via def-section.js's
// source attribute - a single page-level "view raw source" toggle stopped
// making sense once every schema file's definitions moved onto one page
// instead of their own).
// Full-width (content--full), not the shared reading-width cap - the
// side-by-side def/example columns need the room.
function renderMainSchema({ header, definitions }) {
  return renderSub("main-schema", {
    content_class: contentClassFor("full"),
    header,
    definitions,
    back_to_top: renderSub("back-to-top", {}),
  });
}

// ---------------------------------------------------------------------------
// Agent/crawler-facing indexes
//
// sitemap.xml is for search engines; llms.txt (https://llmstxt.org/) is the
// equivalent convention for AI agents — a single curated, plain-markdown
// index of every page, plus a link to the bundled JSON Schema (every
// definition, machine-readable, in one versioned file), so an agent can get
// a full picture of the spec without crawling or JS-rendering HTML. Both are
// generated from the same page metadata the HTML build already collects —
// one source of truth, no separate authoring.
// ---------------------------------------------------------------------------

function urlForSlug(slug) {
  return slug === "index" ? `${SITE_URL}/` : `${SITE_URL}/${slug}`;
}

function buildSitemapXml(entries) {
  const urls = entries
    .map((e) => {
      // <lastmod> from the source file's own mtime — the file that actually
      // changed when this page's content last changed (the .mdx source, or
      // the .schema.json), not the build output (which touches every file
      // on every run and would make every entry "changed today").
      let lastmod = "";
      if (e.sourcePath && fs.existsSync(e.sourcePath)) {
        lastmod = `<lastmod>${fs.statSync(e.sourcePath).mtime.toISOString().slice(0, 10)}</lastmod>`;
      }
      return `  <url><loc>${urlForSlug(e.slug)}</loc>${lastmod}</url>`;
    })
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
}

/**
 * Format one llms.txt bullet, appending a `([markdown](...))` link when the
 * entry has a `.md` mirror (see `hasMarkdown` on sitemapEntries) — the single
 * place both the guides and schema-group loops go through, so the two can't
 * drift into different link formats.
 */
function formatLlmsEntry(entry) {
  const mdLink = entry.hasMarkdown
    ? ` ([markdown](${SITE_URL}/${entry.slug}.md))`
    : "";
  return `- [${entry.title}](${urlForSlug(entry.slug)}): ${entry.description}${mdLink}`;
}

function buildLlmsTxt(entries, version) {
  // Schema is just one more top-level page now (TOP_LINKS' last entry),
  // grouped and ordered here the same as Overview/Quick start/Extending -
  // no separate per-schema-group section anymore, since there's no
  // per-file page left to group.
  const guideOrder = TOP_LINKS.map((l) => l.slug);
  const guides = entries
    .filter((e) => e.group === "Guides")
    .sort((a, b) => guideOrder.indexOf(a.slug) - guideOrder.indexOf(b.slug));

  const lines = [];
  lines.push(`# Design System Doc Spec (DSDS)`);
  lines.push("");
  lines.push(`> ${DEFAULT_DESCRIPTION}`);
  lines.push("");
  lines.push(
    "This site documents DSDS, a versioned JSON Schema. Every page below " +
      "has an HTML version (for people) and a plain-markdown mirror at the " +
      "same path with a `.md` extension (e.g. `/quickstart.md`, " +
      "`/schema.md`) — the full content as text, no HTML/JS to parse. The " +
      "Schema page's markdown includes every definition's field names, " +
      "types, and requiredness; the bundled schema below is the " +
      "single-file version of the same data.",
  );
  lines.push("");
  lines.push("## Machine-readable schema");
  lines.push("");
  lines.push(
    `- [manifest.json](${SITE_URL}/manifest.json): the typed machine index — every entity kind, the block kinds it accepts, and links to its page/markdown/schema/example. Start here.`,
  );
  lines.push(
    `- [Bundled schema, v${version}](${SITE_URL}/v${version}/dsds.bundled.yaml): every definition in one file`,
  );
  lines.push(
    `- [llms-full.txt](${SITE_URL}/llms-full.txt): every guide's full text plus the bundled schema, in one file for one-request ingestion`,
  );
  lines.push(
    `- [AGENTS.md](${SITE_URL}/AGENTS.md): how to consume these docs as an agent — where to start, what's normative, how to self-check your work`,
  );
  lines.push(
    `- [sitemap.xml](${SITE_URL}/sitemap.xml): every page on this site`,
  );
  lines.push("");
  lines.push("## Guides");
  lines.push("");
  for (const g of guides) {
    lines.push(formatLlmsEntry(g));
  }
  lines.push("");
  return lines.join("\n").trimEnd() + "\n";
}

/**
 * A single file with everything: every guide's full text (byte-identical to
 * its own .md mirror), then the complete bundled schema JSON — one request
 * for an agent that wants the whole spec instead of following links.
 * Deliberately does NOT repeat every schema page's markdown too: that would
 * just re-express the same bundled JSON in per-page form, redundantly.
 * llms.txt is still the place for direct per-definition links.
 */
function buildLlmsFullTxt(guideDocs, bundledSchema, version) {
  const lines = [`# Design System Doc Spec (DSDS) — full text`, ""];
  lines.push(`> ${DEFAULT_DESCRIPTION}`, "");
  lines.push(
    "Everything needed to understand DSDS in one file: every guide below " +
      "in full, then the complete bundled JSON Schema (every entity, " +
      "document block, and shared definition). For direct links to each " +
      "definition's own page, see llms.txt instead.",
    "",
  );
  for (const doc of guideDocs) {
    lines.push(doc.markdown.trim(), "", "---", "");
  }
  lines.push(
    `## Bundled schema (v${version})`,
    "",
    "```json",
    JSON.stringify(bundledSchema, null, 2),
    "```",
    "",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** "component" -> "Component", "token-group" -> "Token group". */
function titleCaseKind(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1).replace(/-/g, " ");
}

/**
 * manifest.json — the typed machine index; the first file an agent should
 * fetch. Every field is derived from data the build already has in memory
 * (discoverPages()'s `pages`) — nothing here is hand-authored, so it can't
 * drift from the schema.
 *
 * Unlike the old spec/schema/ (a fixed entity→block-kind acceptance graph,
 * since each entity kind only accepted a scoped union of block kinds), the
 * new schema has no placement gate: any entry kind may use any section
 * kind (see docs-new-ported architecture notes on sections/section.schema.yaml).
 * So this indexes the two open vocabularies directly instead — the 4
 * well-known entry kinds (`entries/*.schema.yaml`, plus the generic `entry`
 * kind, which has no dedicated file) and the 3 well-known section kinds
 * (`sections/*.schema.yaml`, plus the generic `section` kind) — rather than
 * which kind accepts which.
 *
 * Returns `{ manifestJson, entryDescriptors }`: the manifest itself, plus
 * one small standalone descriptor per entry kind — the same data as that
 * kind's manifest entry, addressable at its own canonical `@id`
 * (/id/entry/<kind>) instead of only reachable inside the array. Same
 * source of truth, a second, independently-fetchable serialization of it.
 */
function buildManifest(pages, version) {
  const entryPages = pages.filter((p) => p.group === "entries");
  const sectionPages = pages.filter((p) => p.group === "sections");

  // Every entry kind's own definition now lives at an anchor on the one
  // Schema page, not its own page - anchor = baseSlug, matching
  // render-prop-table.js's buildDefIndex() (entries-component, etc.).
  const entries = entryPages.map((page) => {
    const kind = page.filename.replace(/\.schema\.yaml$/, "");
    const anchor = `entries-${kind}`;
    return {
      kind,
      page: `${SITE_URL}/schema#${anchor}`,
      markdown: `${SITE_URL}/schema.md#${anchor}`,
      schema: `${SITE_URL}/v${version}/dsds.bundled.yaml`,
    };
  });
  entries.sort((a, b) => a.kind.localeCompare(b.kind));

  const sectionKinds = sectionPages
    .map((page) => page.filename.replace(/\.schema\.yaml$/, ""))
    .sort();

  const manifest = {
    schemaVersion: version,
    bundledSchema: `${SITE_URL}/v${version}/dsds.bundled.yaml`,
    // No `mcp` field: dsds-mcp@0.3.0 bundles v0.15.2's schema and checks
    // an incoming document's `dsdsVersion` field, which 0.20.0 documents
    // don't carry (renamed to `schemaVersion`) - it rejects every valid
    // 0.20.0 document. Pointing agents at it here would be actively worse
    // than omitting it. Restore once a 0.20-compatible build of dsds-mcp
    // ships (see notes/dsds-0.20.0-improvement-plan.md, Phase 1 #3).
    indexes: {
      llms: `${SITE_URL}/llms.txt`,
      llmsFull: `${SITE_URL}/llms-full.txt`,
      agents: `${SITE_URL}/AGENTS.md`,
      sitemap: `${SITE_URL}/sitemap.xml`,
    },
    // Both vocabularies are open — a namespaced custom kind (ex:
    // "acme.icon-library") is always valid alongside these well-known ones.
    // The generic "entry"/"section" fallback kinds are already included
    // here: entries/entry.schema.yaml and sections/section.schema.yaml are
    // real files in their own right, not just a conceptual fallback.
    entryKinds: entries.map((e) => e.kind).sort(),
    sectionKinds: [...sectionKinds].sort(),
    entries,
  };

  const entryDescriptors = entries.map((e) => ({
    kind: e.kind,
    json:
      JSON.stringify(
        {
          "@context": "https://schema.org",
          "@id": `${SITE_URL}/id/entry/${e.kind}`,
          "@type": "APIReference",
          identifier: e.kind,
          name: titleCaseKind(e.kind),
          page: e.page,
          markdown: e.markdown,
          schema: e.schema,
        },
        null,
        2,
      ) + "\n",
  }));

  return { manifestJson: JSON.stringify(manifest, null, 2) + "\n", entryDescriptors };
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

async function build() {
  console.log("Building DSDS specification site (schema-driven)...\n");

  // Clean and create dist.
  //
  // Versioned subdirectories (`v<n>/`) hold published schema bundles whose
  // URLs are public contracts — we MUST NOT blow them away on rebuild.
  // Everything else under dist is regenerated each build, so we wipe it
  // and recreate. The versioned subdirectory write step further down is
  // also defensive (refuses to overwrite an existing versioned bundle),
  // but this is the primary safeguard.
  if (fs.existsSync(DIST_DIR)) {
    for (const entry of fs.readdirSync(DIST_DIR, { withFileTypes: true })) {
      // Preserve site/dist/v<version>/ directories. The leading `v`
      // followed by a digit matches v0.1, v0.2, v1.0.0, v1.0.0-beta.2,
      // etc. without touching unrelated directories that happen to
      // start with `v`.
      if (entry.isDirectory() && /^v\d/.test(entry.name)) continue;
      fs.rmSync(path.join(DIST_DIR, entry.name), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Build the global definition index for cross-references first — pages
  // are resolved (allOf flattened) against schemaById, which the index
  // build already loaded every schema/*.schema.yaml file into.
  const { schemaById, index } = buildDefIndexShared({ schemaDir: SCHEMA_DIR });
  DEF_INDEX = index;
  console.log(
    `  Indexed ${Object.keys(DEF_INDEX).length} definitions for cross-referencing.\n`,
  );

  // Discover all schema pages
  const pages = discoverPages(schemaById);
  console.log(
    `  Discovered ${pages.length} schema files across ${DIR_GROUPS.length + 1} directories (including the schema root).\n`,
  );

  // Copy tokens
  fs.copyFileSync(
    path.join(SITE_DIR, "tokens.css"),
    path.join(DIST_DIR, "tokens.css"),
  );

  // Copy favicon
  fs.copyFileSync(
    path.join(SITE_DIR, "favicon.svg"),
    path.join(DIST_DIR, "favicon.svg"),
  );

  // Copy stylesheets
  fs.copyFileSync(
    path.join(SITE_DIR, "style.css"),
    path.join(DIST_DIR, "style.css"),
  );

  // Copy icon/logo assets — components fetch these by page-relative path
  // ("assets/<file>.svg") at runtime, so they need to exist alongside the
  // built pages, not just in the source tree.
  fs.cpSync(path.join(SITE_DIR, "assets"), path.join(DIST_DIR, "assets"), {
    recursive: true,
  });

  // Copy self-hosted font files — tokens.css references them by
  // page-relative path ("fonts/<file>.ttf").
  fs.cpSync(path.join(SITE_DIR, "fonts"), path.join(DIST_DIR, "fonts"), {
    recursive: true,
  });

  // Copy robots.txt verbatim (points crawlers/agents at sitemap.xml).
  fs.copyFileSync(
    path.join(SITE_DIR, "robots.txt"),
    path.join(DIST_DIR, "robots.txt"),
  );

  // The whole examples/ tree, exposed at /examples/ — the same documents
  // scripts/validate.js validates on every build, so nothing served here
  // can drift from the schema.
  fs.cpSync(EXAMPLES_DIR, path.join(DIST_DIR, "examples"), { recursive: true });

  // Bundle web components into a single IIFE for file:// compatibility.
  bundleComponents(SITE_DIR, DIST_DIR);

  // Metadata for every page, collected as both page-writing loops run below —
  // feeds sitemap.xml and llms.txt (see "Agent/crawler-facing indexes" above)
  // so those stay in lockstep with whatever pages actually got built.
  const sitemapEntries = [];
  // Guide markdown, collected in the same loop — feeds llms-full.txt so its
  // guide text is byte-identical to each guide's own .md mirror.
  const guideMarkdownDocs = [];

  // ── MDX content pages ─────────────────────────────────────────────────
  const { compileAllMdx, compileMdxFile } = await loadMdxCompiler();
  console.log("  Compiling MDX content…");
  const mdxPages = await compileAllMdx();
  for (const mdxPage of mdxPages) {
    const slug = mdxPage.meta.slug || mdxPage.file.replace(".mdx", "");
    const title = mdxPage.meta.title || slug;
    const layout = mdxPage.meta.layout || null;
    const badge = mdxPage.meta.badge || null;

    let body = mdxPage.html;

    // Every page opens with <ds-header> built from frontmatter. The title now
    // lives there, so drop a leading compiled <h1> (its text duplicates the
    // frontmatter title). Pages that open at h2 have no h1 to strip.
    body = body.replace(
      /^\s*<ds-heading\b[^>]*\blevel="1"[^>]*>[\s\S]*?<\/ds-heading>\s*/,
      "",
    );

    const header = renderSub("header", {
      title: esc(title),
      description_attr: mdxPage.meta.description
        ? ` description="${esc(mdxPage.meta.description)}"`
        : "",
      source_attr: "",
      badge: badge ? `<ds-badge>${esc(badge)}</ds-badge>` : "",
    });

    const mainHtml = renderMainGuide({ header, content: body, layout });
    const html = pageHtml(
      title,
      slug,
      mainHtml,
      pages,
      undefined,
      mdxPage.meta.description,
    );
    fs.writeFileSync(path.join(DIST_DIR, `${slug}.html`), html, "utf-8");

    // Raw markdown mirror alongside the HTML — strips the YAML frontmatter
    // (replacing it with a plain title heading, since the compiled HTML gets
    // its H1 from <ds-header> instead) so an agent gets the actual prose
    // (any <ds-*/> shortcodes included, verbatim) without parsing HTML or
    // running JS. Named for the llms.txt convention of exposing plain-text/
    // markdown alternates.
    const rawMdx = fs.readFileSync(
      path.join(CONTENT_DIR, mdxPage.file),
      "utf-8",
    );
    // Strip the frontmatter, then a leading "# " h1 if the source opens with
    // one (its text duplicates the frontmatter title) — mirrors the HTML
    // path's equivalent strip of a leading level-1 <ds-heading> above, so
    // there's exactly one h1 (the one we prepend next) either way.
    const mdBody = rawMdx
      .replace(/^---\n[\s\S]*?\n---\n/, "")
      .trimStart()
      .replace(/^#[ \t]+[^\n]*\n\s*/, "");
    fs.writeFileSync(
      path.join(DIST_DIR, `${slug}.md`),
      `# ${title}\n\n${mdBody}`,
      "utf-8",
    );

    const sourcePath = path.join(CONTENT_DIR, mdxPage.file);
    sitemapEntries.push({
      slug,
      title,
      description: mdxPage.meta.description || DEFAULT_DESCRIPTION,
      group: "Guides",
      hasMarkdown: true,
      sourcePath,
    });
    guideMarkdownDocs.push({ title, markdown: `# ${title}\n\n${mdBody}` });
  }
  console.log(`  ${mdxPages.length} MDX page(s) compiled.\n`);

  // ── Custom 404 page ──────────────────────────────────────────────────
  // Not part of the MDX-pages loop above on purpose: a 404 isn't real
  // content a crawler/agent should ever be deliberately pointed at, so it
  // stays out of sitemapEntries/guideMarkdownDocs (no sitemap.xml row, no
  // llms-full.txt entry) - just a real page at the well-known path Netlify
  // already looks for automatically (site/dist/404.html, served for any
  // unmatched route with no netlify.toml rule needed), with real recovery
  // links instead of a bare status code and no page body. Lives in
  // fragments/ for the same reason the schema-page intro/conformance
  // fragments do: compileAllMdx()'s directory scan skips it, so it's
  // compiled directly instead of falling into the loop above.
  const notFoundPath = path.join(CONTENT_DIR, "fragments", "404.mdx");
  const notFoundFragment = await compileMdxFile(notFoundPath);
  const notFoundTitle = notFoundFragment.meta.title || "Page not found";
  const notFoundHeader = renderSub("header", {
    title: esc(notFoundTitle),
    description_attr: notFoundFragment.meta.description
      ? ` description="${esc(notFoundFragment.meta.description)}"`
      : "",
    source_attr: "",
    badge: "",
  });
  const notFoundHtml = pageHtml(
    notFoundTitle,
    "404",
    renderMainGuide({ header: notFoundHeader, content: notFoundFragment.html, layout: null }),
    pages,
    undefined,
    notFoundFragment.meta.description,
  );
  fs.writeFileSync(path.join(DIST_DIR, "404.html"), notFoundHtml, "utf-8");
  const notFoundBody = fs
    .readFileSync(notFoundPath, "utf-8")
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .trimStart();
  fs.writeFileSync(
    path.join(DIST_DIR, "404.md"),
    `# ${notFoundTitle}\n\n${notFoundBody}`,
    "utf-8",
  );
  console.log("  ✓  site/dist/404.html  ← custom 404 page\n");

  // ── Schema page — one page, every definition ────────────────────────────
  //
  // Used to be one HTML/markdown page per schema file (23 of them). Now
  // every file's def-section(s) render onto one combined "schema" page, in
  // the same order the old nav's groups used (Base, Common, Metadata,
  // Entries, Sections) — `pages` is already in that order (see
  // discoverPages()). The HTML page no longer marks a group boundary with
  // its own heading (36 definitions under 5 headings, vs. one small
  // directory eyebrow per definition - see renderSchemaPage()'s own
  // `eyebrow` and def-section.js) - the markdown mirror keeps its `##`
  // group headings, though, since flat text has no per-definition eyebrow
  // equivalent to fall back on.
  const GROUP_LABELS = { root: "Base", common: "Common", metadata: "Metadata", entries: "Entries", sections: "Sections" };
  let schemaDefinitions = [];
  let schemaMarkdownParts = [];
  let schemaDefEntries = []; // {name, anchor} - anchor already matches buildDefIndex()'s scheme
  let lastGroup = null;

  // Intro, before every definition - hand-authored MDX (site/content/
  // fragments/), not schema-driven, so it's compiled through the same
  // pipeline as the narrative guide pages above. Lives in fragments/
  // specifically so compileAllMdx()'s directory scan skips it - this isn't
  // a standalone page with its own nav entry, sitemap row, or URL, just a
  // block of content spliced onto the top of the Schema page. Pushed
  // before the per-page loop below so it lands first in both
  // schemaDefinitions and schemaMarkdownParts.
  const introFragmentPath = path.join(
    CONTENT_DIR,
    "fragments",
    "schema-intro.mdx",
  );
  const introFragment = await compileMdxFile(introFragmentPath);
  schemaDefinitions.push(introFragment.html);
  schemaMarkdownParts.push(fs.readFileSync(introFragmentPath, "utf-8").trim());

  for (const page of pages) {
    const { definitions, defNames, baseSlug } = renderSchemaPage(page);
    if (page.group !== lastGroup) {
      lastGroup = page.group;
      const label = GROUP_LABELS[page.group] || page.group;
      schemaMarkdownParts.push(`## ${label}`, "");
    }
    schemaDefinitions.push(definitions);
    schemaMarkdownParts.push(buildSchemaMarkdown(page));
    // Used by buildJsonLd()'s hasPart - reuses the same anchor scheme
    // renderSchemaPage() and buildDefIndex() (render-prop-table.js) already
    // agree on.
    for (const defName of defNames) {
      const anchor = defName === page.title ? baseSlug : `${baseSlug}-${slug(defName)}`;
      schemaDefEntries.push({ name: defName, anchor });
    }
  }

  const schemaHeader = renderSub("header", {
    title: "Schema",
    description_attr: ` description="${esc("Every DSDS schema definition, on one page: the base document, every entry kind, every section kind, and every shared common shape - each with a real, working example next to it.")}"`,
    source_attr: "",
    badge: "",
  });
  const schemaMainHtml = renderMainSchema({
    header: schemaHeader,
    definitions: schemaDefinitions.join("\n"),
  });
  const schemaHtml = pageHtml(
    "Schema",
    "schema",
    schemaMainHtml,
    pages,
    undefined,
    "Every DSDS schema definition, on one page, each with a real example next to it.",
    "schema",
    schemaDefEntries,
  );
  fs.writeFileSync(path.join(DIST_DIR, "schema.html"), schemaHtml, "utf-8");
  fs.writeFileSync(
    path.join(DIST_DIR, "schema.md"),
    `# Schema\n\n${schemaMarkdownParts.join("\n")}`,
    "utf-8",
  );
  console.log(`  ✓  site/dist/schema.html  ← ${pages.length} schema files (${schemaDefEntries.length} definitions)`);

  sitemapEntries.push({
    slug: "schema",
    title: "Schema",
    description: "Every DSDS schema definition, on one page, each with a real example next to it.",
    group: "Guides",
    hasMarkdown: true,
    sourcePath: path.join(SCHEMA_DIR, "dsds.bundled.yaml"),
  });

  // ── Versioned bundled schema ──────────────────────────────────────
  //
  // Versioned dist directories (site/dist/v<n>/) hold the bundled schema
  // at the URL it's published at — e.g., site/dist/v0.1/dsds.bundled.schema.json
  // is served at https://designsystemdocspec.org/v0.1/dsds.bundled.schema.json.
  // Older versions published JSON and stay JSON, frozen, under their own
  // v<n>/ directory forever - the bundle is YAML starting with this version
  // (see scripts/bundle.js's own comment for why). This block doesn't
  // hardcode either extension: it copies whatever file scripts/bundle.js
  // actually wrote, under its own real name, so it never needs to change
  // again the next time the bundle's format does.
  //
  // The versioned bundle is the working artifact for the CURRENT version.
  // The build ALWAYS refreshes it so a rebuild is atomic — the published
  // v<current>/ output can never lag the schema source (the desync this
  // guards against). Older v<n>/ archives are never touched here: the build
  // only writes the directory named after the current `const`, and the dist
  // clean step preserves every v*/ directory. Immutability of a *released*
  // version is enforced at release/deploy time (git tag + atomic deploy),
  // not by skipping the write — skipping is what let the site go stale.
  const BUNDLE_FILENAME = "dsds.bundled.yaml";
  // scripts/bundle.js also writes a JSON projection of the same bundle
  // (every version through v0.15.2 published one; Ajv/jsonschema CLIs and
  // editor $schema resolution expect it) - mirrored alongside the YAML one
  // whenever it exists, same as-atomic-as-the-rest-of-the-build treatment.
  const BUNDLE_FILENAME_JSON = "dsds.bundled.schema.json";
  const bundledSchemaPath = path.join(SCHEMA_DIR, BUNDLE_FILENAME);
  const bundledSchemaPathJson = path.join(SCHEMA_DIR, BUNDLE_FILENAME_JSON);
  if (fs.existsSync(bundledSchemaPath)) {
    const version = readSpecVersion();
    if (version) {
      const versionDir = path.join(DIST_DIR, `v${version}`);
      const versionedBundle = path.join(versionDir, BUNDLE_FILENAME);
      const relTarget = `site/dist/v${version}/${BUNDLE_FILENAME}`;
      const changed =
        !fs.existsSync(versionedBundle) ||
        fs.readFileSync(versionedBundle, "utf-8") !==
          fs.readFileSync(bundledSchemaPath, "utf-8");
      fs.mkdirSync(versionDir, { recursive: true });
      fs.copyFileSync(bundledSchemaPath, versionedBundle);
      console.log(
        `  ✓  ${relTarget}  ← schema/${BUNDLE_FILENAME}${changed ? " (refreshed)" : ""}\n`,
      );
      if (fs.existsSync(bundledSchemaPathJson)) {
        const versionedBundleJson = path.join(versionDir, BUNDLE_FILENAME_JSON);
        fs.copyFileSync(bundledSchemaPathJson, versionedBundleJson);
        console.log(
          `  ✓  site/dist/v${version}/${BUNDLE_FILENAME_JSON}  ← schema/${BUNDLE_FILENAME_JSON}\n`,
        );
      }

      // ── Versioned split schema files ────────────────────────────────
      //
      // Every split schema file's `$id` (ex: "https://.../v0.20.0/common/
      // ref.schema.yaml") is a promise that the file is servable at that
      // exact URL. Mirror the whole schema/ tree — root files and every
      // group subdirectory — into site/dist/v<version>/ so each $id
      // resolves instead of 404ing. The bundle above is copied separately
      // since it isn't part of this walk (it has no group subdirectory).
      const splitSchemaFiles = ROOT_FILES.map((f) => path.join(SCHEMA_DIR, f));
      for (const group of DIR_GROUPS) {
        const dirPath = path.join(SCHEMA_DIR, group.dir);
        if (!fs.existsSync(dirPath)) continue;
        for (const filename of fs.readdirSync(dirPath)) {
          if (filename.endsWith(".schema.yaml")) {
            splitSchemaFiles.push(path.join(dirPath, filename));
          }
        }
      }
      for (const srcPath of splitSchemaFiles) {
        const relPath = path.relative(SCHEMA_DIR, srcPath);
        const destPath = path.join(versionDir, relPath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
      console.log(
        `  ✓  site/dist/v${version}/{${DIR_GROUPS.map((g) => g.dir).join(",")}}/*.schema.yaml  ← schema/ (${splitSchemaFiles.length} files mirrored)\n`,
      );
    }
  }

  // ── Agent/crawler indexes ──────────────────────────────────────────
  const version = readSpecVersion() || "";
  fs.writeFileSync(
    path.join(DIST_DIR, "sitemap.xml"),
    buildSitemapXml(sitemapEntries),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(DIST_DIR, "llms.txt"),
    buildLlmsTxt(sitemapEntries, version),
    "utf-8",
  );

  const bundledSchemaForFullTxt = fs.existsSync(bundledSchemaPath)
    ? loadSchemaYaml(bundledSchemaPath)
    : {};
  fs.writeFileSync(
    path.join(DIST_DIR, "llms-full.txt"),
    buildLlmsFullTxt(guideMarkdownDocs, bundledSchemaForFullTxt, version),
    "utf-8",
  );

  // Static root agent entry doc — copied verbatim, like robots.txt.
  fs.copyFileSync(
    path.join(ROOT, "AGENTS.md"),
    path.join(DIST_DIR, "AGENTS.md"),
  );

  const { manifestJson, entryDescriptors } = buildManifest(pages, version);
  fs.writeFileSync(path.join(DIST_DIR, "manifest.json"), manifestJson, "utf-8");

  // Standalone canonical descriptors — /id/entry/<kind>.json — the same
  // data as each entry kind's manifest.json entry, independently
  // addressable by its own @id instead of only reachable inside the array.
  const entryIdDir = path.join(DIST_DIR, "id", "entry");
  fs.mkdirSync(entryIdDir, { recursive: true });
  for (const { kind, json } of entryDescriptors) {
    fs.writeFileSync(path.join(entryIdDir, `${kind}.json`), json, "utf-8");
  }

  console.log(
    `  ✓  site/dist/sitemap.xml, site/dist/llms.txt, site/dist/llms-full.txt, ` +
      `site/dist/AGENTS.md, site/dist/manifest.json, site/dist/id/entry/*.json  ← ${sitemapEntries.length} pages indexed\n`,
  );

  console.log(
    `\nDone. ${mdxPages.length + pages.length + 1} pages built to site/dist/\n`,
  );
}

// ---------------------------------------------------------------------------
// Component bundler
// ---------------------------------------------------------------------------

/**
 * Bundle all component ES modules from site/components/ into a single
 * components.js IIFE that works from file:// protocol.
 *
 * Strategy:
 *   1. Read _shared.js — extract its exported symbols as local variables
 *   2. Read each component file — strip `import` and `export` statements
 *   3. Read index.js — extract the registry array and registration loop
 *   4. Wrap everything in an IIFE
 */
function bundleComponents(siteDir, distDir) {
  const componentsDir = path.join(siteDir, "components");
  const indexSrc = fs.readFileSync(
    path.join(componentsDir, "index.js"),
    "utf-8",
  );

  // Parse the barrel file to find all imported file names (in dependency order)
  const importRe = /from\s+["']\.\/([^"']+)["']/g;
  const fileOrder = ["_shared.js"]; // _shared.js MUST come first
  const seen = new Set(["_shared.js"]);
  let m;
  while ((m = importRe.exec(indexSrc)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      fileOrder.push(m[1]);
    }
  }

  // Extract the registry and registration code from index.js
  const registryMatch = indexSrc.match(
    /const registry = \[[\s\S]*?\];\s*\n\s*for \([\s\S]*?\{[\s\S]*?\}\s*\}/,
  );
  const registrationCode = registryMatch ? registryMatch[0] : "";

  // Build the bundle
  const parts = [];
  parts.push("(function () {");
  parts.push('  "use strict";');
  parts.push("");

  for (const file of fileOrder) {
    const filePath = path.join(componentsDir, file);
    if (!fs.existsSync(filePath)) continue;

    let code = fs.readFileSync(filePath, "utf-8");

    // Strip import statements
    code = code.replace(
      /^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];\s*$/gm,
      "",
    );

    // Strip 'export ' keyword from declarations (export class, export function, export const)
    code = code.replace(/^export\s+(class|function|const|let|var)\s/gm, "$1 ");

    // Remove blank lines left by stripping
    code = code.replace(/\n{3,}/g, "\n\n");

    parts.push(`  // ── ${file} ──`);
    // Indent the code
    const indented = code
      .trim()
      .split("\n")
      .map((line) => (line ? "  " + line : ""))
      .join("\n");
    parts.push(indented);
    parts.push("");

    // fetch() of a same-directory file is blocked outright under file://
    // (opening a built page directly, no server), which this bundle
    // otherwise supports. Inline every icon's file contents right after
    // _shared.js defines seedIcons()/loadIcon(), so no runtime fetch is
    // ever needed in the built site. Keep this file list in sync with
    // ICON_FILES in site/components/_shared.js.
    if (file === "_shared.js") {
      const ICON_FILES = {
        menu: "icon-menu.svg",
        close: "icon-close.svg",
        info: "icon-info.svg",
        flask: "icon-flask.svg",
        dot: "icon-dot.svg",
        lightbulb: "icon-lightbulb.svg",
        warning: "icon-warning.svg",
        brackets: "icon-brackets.svg",
        logo: "dsds.svg",
      };
      const assetsDir = path.join(siteDir, "assets");
      const seeded = {};
      for (const [name, iconFile] of Object.entries(ICON_FILES)) {
        const iconPath = path.join(assetsDir, iconFile);
        if (fs.existsSync(iconPath)) {
          seeded[name] = fs.readFileSync(iconPath, "utf-8");
        }
      }
      parts.push("  // ── inlined icon assets (build-time, see above) ──");
      parts.push(`  seedIcons(${JSON.stringify(seeded)});`);
      parts.push("");
    }
  }

  // Add registration code (strip imports already handled)
  if (registrationCode) {
    parts.push("  // ── Registration ──");
    const indented = registrationCode
      .trim()
      .split("\n")
      .map((line) => (line ? "  " + line : ""))
      .join("\n");
    parts.push(indented);
  }

  parts.push("})();");

  const bundle = parts.join("\n") + "\n";
  fs.writeFileSync(path.join(distDir, "components.js"), bundle, "utf-8");

  const kb = (Buffer.byteLength(bundle, "utf-8") / 1024).toFixed(1);
  console.log(
    `  Bundled ${fileOrder.length} component files → components.js (${kb} KB)`,
  );
}

build().catch((err) => {
  console.error("\n✗ Build failed:", err.message);
  process.exit(1);
});
