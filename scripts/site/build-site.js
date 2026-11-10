#!/usr/bin/env node
/**
 * build-site.js — Schema-driven static site generator for the DSDS spec
 * site. Auto-discovers schema/**\/*.schema.yaml and renders each definition
 * with property tables and cross-references; narrative pages are compiled
 * from MDX via compile-mdx.mjs. Run with `node scripts/site/build-site.js`;
 * output goes to site/dist/.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

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
  withAbsoluteRefs,
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

const ROOT = path.resolve(__dirname, "..", "..");

// Fallback description for a page with no MDX frontmatter/schema description.
const SITE_URL = "https://designsystemdocspec.org";
const DEFAULT_DESCRIPTION =
  "A machine-readable format for design system documentation. DSDS structures a design system as a graph of entries (systems, components, tokens, themes, and custom kinds) and sections (definitions, guidelines, steps, and freeform content) for humans, parsers, and agents.";
const SCHEMA_DIR = path.join(ROOT, "schema");
const SITE_DIR = path.join(ROOT, "site");
const CONTENT_DIR = path.join(SITE_DIR, "content");
const DIST_DIR = path.join(SITE_DIR, "dist");
const EXAMPLES_DIR = path.join(ROOT, "examples");

// The Markdown mirror (and llms-full.txt) of a page: its shortcodes become what they show.
// <ds-example file="…"/> is the example file's own text, and <ds-code>…</ds-code> is a fenced
// block, so an agent reading the mirror gets the same examples a person sees. Without this a
// mirror had the tag and not the YAML inside it.
function expandShortcodesForMarkdown(text) {
  return text
    .replace(/<ds-example\s+file="([^"]+)"(?:\s+label="([^"]*)")?(?:\s+slot="([^"]*)")?\s*\/>/g, (_m, file, label) => {
      const full = path.join(EXAMPLES_DIR, file);
      if (!fs.existsSync(full)) return `(example not found: ${file})`;
      const lang = path.extname(file).slice(1).replace(/^yml$/, "yaml");
      const body = fs.readFileSync(full, "utf-8").replace(/\s+$/, "");
      return `${label ? `**${label}**\n\n` : ""}\`\`\`${lang}\n${body}\n\`\`\``;
    })
    .replace(/<ds-code(\s[^>]*)?>([\s\S]*?)<\/ds-code>/g, (_m, attrs = "", body) => {
      const content = body.replace(/^\n+|\n+$/g, "");
      if (/\binline\b/.test(attrs)) return `\`${content}\``;
      const lang = /language="([^"]+)"/.exec(attrs)?.[1] ?? "";
      return `\`\`\`${lang}\n${content}\n\`\`\``;
    });
}
const TEMPLATES_DIR = path.join(SITE_DIR, "templates");
const PAGE_TEMPLATE_PATH = path.join(TEMPLATES_DIR, "page.template.html");
const SUBTEMPLATES_DIR = path.join(TEMPLATES_DIR, "subtemplates");

/** Renders one subtemplate from site/templates/subtemplates/, trimmed so callers can join blocks without stray blank lines. */
function renderSub(name, vars) {
  return renderTemplate(
    path.join(SUBTEMPLATES_DIR, `${name}.template.html`),
    vars,
  ).trim();
}

/**
 * Auto-discovers schema/**\/*.schema.yaml and builds the page registry.
 * Each page's `data.$defs` holds its resolved root definition (via
 * render-prop-table.js's resolveSchema) plus any local `$defs`. Returns
 * `{ slug, title, group, groupLabel, filename, filePath, data, examples }[]`.
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

    // Pin the group's own open-base file (ex: entry.schema.yaml) first; the rest stay alphabetical.
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

// Global definition index for cross-references: { [$ref]: { pageSlug, anchor, title, description } }.
// Built once in build() by render-prop-table.js's buildDefIndex, shared with the MDX shortcode preprocessor.
let DEF_INDEX = {};

// Thin wrappers around ./render-prop-table so callers here don't have to thread DEF_INDEX through every call.
function describeType(prop) {
  return describeTypeShared(prop, DEF_INDEX);
}

function renderPropertyTable(defSchema) {
  return renderPropertyTableShared(defSchema, DEF_INDEX);
}

/** Markdown counterpart of renderPropertyTable(). */
function renderPropertyTableMarkdown(defSchema) {
  return renderPropertyTableMarkdownShared(defSchema, DEF_INDEX);
}

// A short example per definition on the Schema page, keyed by the same anchor buildDefIndex()/
// renderSchemaPage() compute (root def: baseSlug; local $def: `${baseSlug}-${slug(defName)}`).
// A definition with no entry here just renders without the example column.

// The spec's current version, so the curated examples can't go stale (they were stuck on 0.20.0).
const CURRENT_SPEC_VERSION = readSpecVersion();

const CURATED_EXAMPLES = {
  base: {
    file: "examples/base/starter-kit.dsds.yaml",
    yaml: `schemaVersion: "${CURRENT_SPEC_VERSION}"
name: Acme Design System
$schema: https://designsystemdocspec.org/v${CURRENT_SPEC_VERSION}/dsds.bundled.yaml

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
      rel: relates-to
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
    rel: demo`,
  },
  "common-example-list": {
    file: "examples/entries/button.yaml",
    yaml: `- title: One primary action per surface
  showcase: {kind: image, url: https://cdn.acme.example/ds/showcase/button-primary-surface.png}
- title: Loading state
  ref: {href: ./stories/button.stories.tsx, rel: demo}`,
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
  rel: relates-to
  role: Tracks the two-primary-buttons issue
  note: Filed after a usability test surfaced the ambiguity.
# or, pointing inside this document instead of outside it:
- to: shared-a11y#touch-target
  rel: same-as`,
  },
  "common-ref-list": {
    file: "examples/entries/button.yaml",
    yaml: `- to: getting-started
  rel: relates-to
- href: https://storybook.acme.example
  rel: demo`,
  },
  "common-ref-target": {
    file: "examples/entries/link.yaml",
    yaml: `# In a field named for one kind of pointer, like a guideline's evidence:
- href: https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html
  role: WCAG 2.2 SC 2.4.4 (A)
# or, the shorthand for an outside link:
- https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html`,
  },
  "common-ref-targets": {
    file: "examples/entries/button.yaml",
    yaml: `checks:
  - href: ./tests/button.a11y.test.ts
    role: test
  - to: release-checklist#focus-visible-check`,
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
  updated:
    date: 2026-06-02
    note: Added the loading trait and its guideline.
  origin:
    method: generated
    author: generated
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
description: Composition of components shown when a view has no content to display yet. Tells the user why an area is empty and what to do next.
metadata:
  status: {status: stable}
uses:
  - to: button
extends:
  - to: base-dialog
alternatives:
  - to: error-state
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
description: Triggers an action. Gives users a single, consistent way to trigger an action.
metadata: {status: {status: stable}}
uses: [{to: color.action.primary}]
extends: [{to: base-dialog}]
alternatives: [{to: link}]
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
  - traitType: state
    kind: boolean
    id: loading
    description: Shows a spinner in place of the label and blocks interaction while active.
combos:
  - subject: loading
    level: must-not
    items: [disabled]
    note: A control can't be simultaneously loading and disabled...
specs:
  - href: ./contracts/button.contract.json
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
description: Shows a spinner in place of the label and blocks interaction while active, so an action can't be submitted twice.
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
description: Acme's cross-platform design system. One source of truth for how Acme builds and documents interfaces.
metadata:
  version: 1.4.0
  organization: Acme Corp
  url: https://design.acme.example
  license: MIT
  platforms: [react, web-component]
  status: {status: stable}
extends: [{to: base-design-system}]
uses: [{to: button}]
refs: [{to: acme-brand-system, rel: relates-to}]
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
description: Inverted-luminance theme for low-light surfaces and user preference. Lets a product opt into a dark color scheme without redefining every token.
metadata: {status: {status: stable}}
extends:
  - to: light
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
description: A single step on the base spacing scale - 4 times the 4px base unit. Keeps spacing consistent across components without hand-picked pixel values.
metadata: {status: {status: stable}, group: space}
extends: [{to: space-base}]
alternatives: [{to: space-8}]
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
  items:
    - statement: Do not use button when the action navigates to a new URL; use the link entry instead.
      level: must-not
      alternatives:
        - to: link
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
  items:
    - title: Note
      body: Generic items have no fixed fields - use freeform for prose instead.
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
    rel: relates-to
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

// No-JS fallback for <ds-def-section>: plain light-DOM elements slotted "_fallback", a name
// def-section.js's shadow template never declares a <slot> for. With no JS there's no shadow
// root, so these render normally; once JS attaches one, the flattening algorithm drops them automatically.
function renderDefSectionFallback(anchor, name, type, description, eyebrow) {
  let html = "";
  if (eyebrow) html += `<p slot="_fallback">${esc(eyebrow)}</p>`;
  html += `<h2 slot="_fallback" id="${esc(anchor)}">${esc(name)}</h2>`;
  if (type) html += `<p slot="_fallback">${esc(type)}</p>`;
  if (description) html += `<p slot="_fallback">${escWithCode(description)}</p>`;
  return html;
}

/**
 * Renders one $defs definition as an HTML section. `anchor`/`source` come from the caller
 * (renderSchemaPage()); `exampleYaml`, when present, renders into the "example" slot with
 * layout="split", otherwise the section is single-column.
 */
function renderDefinition(defName, defSchema, { anchor, source, exampleYaml, eyebrow }) {
  const sourceAttr = source ? ` source="${esc(source)}"` : "";
  const layoutAttr = exampleYaml ? ` layout="split"` : "";
  const eyebrowAttr = eyebrow ? ` eyebrow="${esc(eyebrow)}"` : "";
  const fallback = renderDefSectionFallback(anchor, defName, defSchema.type, defSchema.description, eyebrow);
  const example = exampleYaml
    ? `<ds-code language="yaml" label="" slot="example" wrap><pre><code class="language-yaml">${esc(exampleYaml)}</code></pre></ds-code>`
    : "";
  const content = [];

  // A bare string def (ex: requirement-level, id's pattern) has no properties/oneOf/anyOf to add.
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
        // Nest the property table inside the <li> - a <ul> may only directly contain <li> elements.
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
      // Alternatives that are references, not required-field lists, leave nothing to list:
      // an empty "Constraints" heading would tell the reader there's a rule and show none.
      if (items) content.push(renderSub("anyof-constraints", { items }));
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

/** Collects all unique $ref target strings from a schema object. */
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

/** Collects the names of sibling $defs that `node` references via `$ref: #/$defs/<name>`. */
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

/** Orders a file's $defs so a definition appears before the definitions it references (topological sort; cycles/ties fall back to file order). */
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

// Returns the page's content blocks separately (definitions, defNames, baseSlug) instead of one
// flattened string, so build()'s schema-page assembly can group them by file with its own heading.
function renderSchemaPage(page) {
  const defs = page.data.$defs || {};
  const defNames = orderDefsByReference(defs);

  const relPath = page.group && page.group !== "root" ? `${page.group}/${page.filename}` : page.filename;
  // Must match render-prop-table.js's buildDefIndex(): root def anchor is the file's baseSlug, a local $def's is baseSlug-defNameSlug.
  const baseName = page.filename.replace(/\.schema\.yaml$/, "");
  const baseSlug = page.group === "root" ? baseName : `${page.group}-${baseName}`;
  // One directory-label eyebrow per definition, replacing the old page-level group headings. root (base.schema.yaml) gets none.
  const eyebrow = page.group && page.group !== "root" ? `${page.group}/` : "";

  if (defNames.length === 0) {
    // Every file has at least one $defs entry today (its own resolved root schema); kept for a file that genuinely has none.
    return { definitions: "", defNames, baseSlug };
  }

  const definitions = defNames
    .map((defName) => {
      const isRoot = defName === page.title;
      const anchor = isRoot ? baseSlug : `${baseSlug}-${slug(defName)}`;
      const curated = CURATED_EXAMPLES[anchor];
      return renderDefinition(defName, withAbsoluteRefs(defs[defName], page.data.$id), {
        anchor,
        source: relPath,
        exampleYaml: curated ? curated.yaml : undefined,
        eyebrow,
      });
    })
    .join("\n");

  return { definitions, defNames, baseSlug };
}

// Markdown mirror of renderSchemaPage()/renderDefinition(), for agents fetching without JS
// (the HTML relies on shadow-DOM components to render attributes into text). Pulls from the
// same page/def/example data and propTableRows() as the HTML path, so the two can't drift.

/** Markdown counterpart of renderDefinition() for one $defs entry. */
function renderDefinitionMarkdown(defName, defSchema, exampleData, curatedYaml, anchor) {
  const lines = [`## ${defName} {#${anchor}}`, ""];

  if (defSchema.description) {
    lines.push(defSchema.description, "");
  }

  // Bare string/enum def (e.g. a status vocabulary) — show the enum and stop,
  // mirroring renderDefinition()'s early return for the same case.
  if (defSchema.type === "string" && !defSchema.properties) {
    if (defSchema.enum) {
      lines.push("Allowed values:", "");
      for (const val of defSchema.enum) lines.push(`- \`${val}\``);
      lines.push("");
    }
    if (defSchema.pattern) {
      lines.push(`**Pattern:** \`${defSchema.pattern}\``, "");
    }
    if (curatedYaml) lines.push("**Example:**", "", "```yaml", curatedYaml.replace(/\s+$/, ""), "```", "");
    return lines.join("\n");
  }

  // oneOf alternatives (e.g. richText's string | object forms)
  if (defSchema.oneOf) {
    lines.push("**Accepts one of:**", "");
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
      `**Open map:** keys are strings, values are \`${defSchema.additionalProperties.type || "any"}\`.`,
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
        lines.push("**Constraints:** at least one of:", "");
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

  // Example: the same one the page shows (its curated YAML), else the schema's own example.
  if (curatedYaml) {
    lines.push("**Example:**", "", "```yaml", curatedYaml.replace(/\s+$/, ""), "```", "");
  } else if (exampleData !== undefined && exampleData !== null) {
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
 * Markdown counterpart of renderSchemaPage() for a whole schema file. `includeSource: false`
 * (used for the per-definition markdown files under site/dist/schema/) omits the trailing raw-YAML dump.
 */
function buildSchemaMarkdown(page, { includeSource = true } = {}) {
  const defs = page.data.$defs || {};
  const defNames = orderDefsByReference(defs);
  const examples = page.examples || {};
  const relSource =
    page.group && page.group !== "root" ? `${page.group}/${page.filename}` : page.filename;

  const lines = [`# ${page.title}`, ""];
  if (page.data.description) lines.push(page.data.description, "");
  lines.push(`Source: \`${relSource}\``, "");

  if (defNames.length === 0) {
    // A root-only schema (no $defs) can still ship an example - the whole example file, as one document.
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
    const baseName = page.filename.replace(/\.schema\.yaml$/, "");
    const baseSlug = page.group === "root" ? baseName : `${page.group}-${baseName}`;
    for (const defName of defNames) {
      const exampleData =
        examples[defName] !== undefined ? examples[defName] : null;
      const anchor = defName === page.title ? baseSlug : `${baseSlug}-${slug(defName)}`;
      lines.push(renderDefinitionMarkdown(defName, withAbsoluteRefs(defs[defName], page.data.$id), exampleData, CURATED_EXAMPLES[anchor]?.yaml, anchor));
    }
  }

  if (includeSource) {
    lines.push(
      "## Full schema source",
      "",
      "```yaml",
      fs.readFileSync(page.filePath, "utf-8").trimEnd(),
      "```",
      "",
    );
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// <link rel="alternate"> + JSON-LD let a crawler/agent discover a page's machine-readable
// forms (its .md mirror, and for schema pages the bundled schema) without parsing the HTML.

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
    sameAs: `${SITE_URL}/${activeSlug}.md`,
  };
  // Schema pages are generated from the bundled schema - subjectOf points at that source.
  if (pageType === "schema") {
    data.subjectOf = `${SITE_URL}/v${version}/dsds.bundled.yaml`;
  }
  // hasPart lists the page's own definition sections, so a JSON-LD-only consumer sees it isn't one flat document.
  if (defEntries && defEntries.length) {
    data.hasPart = defEntries.map((entry) => ({
      "@type": "DefinedTerm",
      name: entry.name,
      url: `${url}#${entry.anchor}`,
    }));
  }
  // Escape "<" so a description containing "</script>" can't break out of the script tag early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `  <script type="application/ld+json">${json}</script>`;
}

// Declarative Shadow DOM for <ds-heading>/<ds-header>: without it, headings only exist once
// client JS builds each shadow root, so a no-JS crawler/agent saw no real <h1>-<h6> at all.
// A <template shadowrootmode="open"> as the element's first child is parsed as a real shadow
// root during HTML parsing, before any script runs; createShadow() in _shared.js reuses that
// root instead of re-attaching one, so heading.js/header.js's own client render still works
// unchanged on top of it. HEADING_CSS_SSR/HEADER_CSS_SSR below are hand-kept in sync with
// heading.js/header.js's own CSS - no shared import, since those are browser-only ES modules.

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
  .anchor-link:focus { opacity: 1; }
  .anchor-link:focus-visible { opacity: 1; }
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

// Reverses esc()'s four entities: attrs are already HTML-attribute-escaped, but the shadow
// markup below needs the raw text back to re-escape as element content instead.
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

// Post-processing pass over an assembled page: finds every <ds-heading>/<ds-header> opening
// tag and inserts the matching declarative shadow root as its first child.
function injectDeclarativeShadowDom(html) {
  let out = html.replace(/<ds-heading\s+([^>]*)>/g, (match, attrs) => {
    const levelMatch = /\blevel="(\d+)"/.exec(attrs);
    const anchorMatch = /\banchor="([^"]*)"/.exec(attrs);
    const level = levelMatch ? levelMatch[1] : "2";
    const anchor = anchorMatch ? anchorMatch[1] : "";
    // Mirrors heading.js's own `this.id = anchor` (set in JS) - a no-JS reader needs it as a real attribute.
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

  // The live server resolves extensionless paths; the root page is the bare origin rather than /index.
  const pageUrl =
    activeSlug === "index" ? `${SITE_URL}/` : `${SITE_URL}/${activeSlug}`;
  const desc = description || DEFAULT_DESCRIPTION;
  const fullTitle = `${title}${titleSuffix}`;

  // Each top-level section (<head>, skip link, main content) is its own subtemplate; the main
  // content area itself comes from the caller (renderMainGuide()/renderMainSchema() below).
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
  return injectDeclarativeShadowDom(rendered);
}

// content--full removes the reading-width cap some pages want (ex: a wide property table).
function contentClassFor(layout) {
  return "content" + (layout === "full" ? " content--full" : "");
}

// The "plain content" page type: a header plus one block of already-rendered body content (compiled MDX).
function renderMainGuide({ header, content, layout }) {
  return renderSub("main-guide", {
    content_class: contentClassFor(layout),
    header,
    content,
    back_to_top: renderSub("back-to-top", {}),
  });
}

// The schema-docs page type: a header, then the definitions (each carrying its own source
// attribution via def-section.js). Full-width, since the side-by-side def/example columns need the room.
function renderMainSchema({ header, definitions }) {
  return renderSub("main-schema", {
    content_class: contentClassFor("full"),
    header,
    definitions,
    back_to_top: renderSub("back-to-top", {}),
  });
}

// Agent/crawler-facing indexes: sitemap.xml for search engines, llms.txt (llmstxt.org) for
// agents. Both generated from the same page metadata the HTML build already collects.

function urlForSlug(slug) {
  return slug === "index" ? `${SITE_URL}/` : `${SITE_URL}/${slug}`;
}

function buildSitemapXml(entries) {
  const urls = entries
    .map((e) => {
      // <lastmod> from the source file's own mtime, not the build output (which touches every file every run).
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

/** Formats one llms.txt bullet, appending a `([markdown](...))` link when the entry has a `.md` mirror. */
function formatLlmsEntry(entry) {
  const mdLink = entry.hasMarkdown
    ? ` ([markdown](${SITE_URL}/${entry.slug}.md))`
    : "";
  return `- [${entry.title}](${urlForSlug(entry.slug)}): ${entry.description}${mdLink}`;
}

function buildLlmsTxt(entries, version, definitionCount) {
  // Schema is just one more top-level page now (TOP_LINKS' last entry), ordered the same way.
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
    `- [manifest.json](${SITE_URL}/manifest.json): the typed machine index — every entry kind and section kind, with links to each one's page, markdown and schema. Start here.`,
  );
  lines.push(
    `- [Bundled schema, v${version}](${SITE_URL}/v${version}/dsds.bundled.yaml): every definition in one file`,
  );
  // The curated index used to send every agent to the 115 KB whole-schema mirror and never
  // mention the small ones, so the cheap route existed but nothing pointed at it.
  lines.push(
    `- **Per-definition markdown**: ${definitionCount} small files, one per ` +
      `schema definition, a few KB each and in the schema's own field order — e.g. ` +
      `[entries-component](${SITE_URL}/schema/entries-component.md) or ` +
      `[common-ref](${SITE_URL}/schema/common-ref.md). Fetch one of these to learn a single ` +
      `definition instead of the whole bundle; manifest.json lists all of them under \`definitions\`.`,
  );
  lines.push(
    `- [llms-small.txt](${SITE_URL}/llms-small.txt): a primer of about 5k tokens - the core model, the field and kind lists, one worked example, and how to validate. Read this first if you're short on context`,
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
 * A single file with everything: every guide's full text, then the complete bundled schema
 * JSON, for an agent that wants the whole spec in one request. llms.txt still has direct
 * per-definition links.
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

/**
 * llms-small.txt - a primer of about 5k tokens, for an agent that needs to read or write a DSDS
 * document but can't spend 100k+ tokens on llms-full.txt. The prose is hand-written in
 * site/content/fragments/llms-small.md; every list of field names, kinds and values in it is a
 * {{PLACEHOLDER}} filled from the schema files here, so the primer can't drift from the schema.
 */
const LLMS_SMALL_SOURCE = path.join(CONTENT_DIR, "fragments", "llms-small.md");
const LLMS_SMALL_EXAMPLE = path.join(EXAMPLES_DIR, "quickstart", "12-shared-sections.yaml");
// ~4 characters per token. Over this, the primer has stopped being small; trim it.
const LLMS_SMALL_MAX_CHARS = 22000;

function buildLlmsSmallTxt(version) {
  const { declaredProps, declaredEnum } = require("../lib");
  const code = (values) => values.map((v) => `\`${v}\``).join(", ");
  const kindEnum = (d) => d.properties.kind.oneOf.find((m) => m.enum);
  const ownFields = (file) => declaredProps(file).filter((f) => !["kind", "id", "metadata"].includes(f));

  const kindFields = ["component", "token", "theme", "system"].map((kind) => {
    const fields = ownFields(`entries/${kind}.schema.yaml`);
    if (kind === "system") {
      fields.push(...declaredProps("metadata/system-metadata.schema.yaml").map((f) => `metadata.${f}`));
    }
    return `- \`${kind}\`: ${code(fields)}`;
  });

  const values = {
    VERSION: version,
    SITE_URL,
    BASE_FIELDS: code(declaredProps("base.schema.yaml")),
    ENTRY_ENVELOPE: code(declaredProps("entries/entry.schema.yaml")),
    ENTRY_METADATA: code([
      ...declaredProps("metadata/entry-metadata.schema.yaml"),
      ...declaredProps("metadata/metadata.schema.yaml"),
    ]),
    ENTRY_KINDS: code(declaredEnum("entries/entry.schema.yaml", kindEnum).values),
    KIND_FIELDS: kindFields.join("\n"),
    SECTION_ENVELOPE: code(declaredProps("sections/section.schema.yaml")),
    SECTION_KINDS: code(declaredEnum("sections/section.schema.yaml", kindEnum).values),
    LEVELS: code(declaredEnum("common/requirement-level.schema.yaml", (d) => d).values),
    REL_VALUES: code(
      declaredEnum("common/ref.schema.yaml", (d) => d.$defs.rel.oneOf.find((m) => m.enum)).values,
    ),
    EXAMPLE: fs.readFileSync(LLMS_SMALL_EXAMPLE, "utf-8").trim(),
  };

  const text = fs.readFileSync(LLMS_SMALL_SOURCE, "utf-8").replace(/\{\{([A-Z_]+)\}\}/g, (match, name) => {
    if (!(name in values)) throw new Error(`llms-small.md uses {{${name}}}, which build-site.js doesn't fill.`);
    return values[name];
  });
  if (text.length > LLMS_SMALL_MAX_CHARS) {
    throw new Error(
      `llms-small.txt is ${text.length} characters (~${Math.round(text.length / 4)} tokens), over the ` +
        `${LLMS_SMALL_MAX_CHARS}-character budget. Trim site/content/fragments/llms-small.md.`,
    );
  }
  return text.trimEnd() + "\n";
}

/** "component" -> "Component", "token-group" -> "Token group". */
function titleCaseKind(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1).replace(/-/g, " ");
}

/**
 * manifest.json — the typed machine index, the first file an agent should fetch. Derived
 * entirely from discoverPages()'s `pages`, so it can't drift from the schema. Returns
 * `{ manifestJson, entryDescriptors }`: the manifest itself, plus one standalone descriptor
 * per entry kind addressable at its own `@id` (/id/entry/<kind>).
 */
function buildManifest(pages, version) {
  const entryPages = pages.filter((p) => p.group === "entries");
  const sectionPages = pages.filter((p) => p.group === "sections");

  // `schema` points at that kind's own split file, not the whole bundle, so a consumer wanting
  // one kind's fields doesn't have to fetch and re-parse every other kind's too.
  const entries = entryPages.map((page) => {
    const kind = page.filename.replace(/\.schema\.yaml$/, "");
    const anchor = `entries-${kind}`;
    return {
      kind,
      page: `${SITE_URL}/schema#${anchor}`,
      // The per-definition file (~a few KB), not an anchor into the ~111 KB
      // schema.md whole-schema mirror — see build()'s per-def markdown loop.
      markdown: `${SITE_URL}/schema/${anchor}.md`,
      schema: `${SITE_URL}/v${version}/entries/${kind}.schema.yaml`,
    };
  });
  entries.sort((a, b) => a.kind.localeCompare(b.kind));

  // Symmetric with `entries` above — a section kind previously appeared
  // only as a bare name in `sectionKinds`, with no page/markdown/schema
  // links of its own, unlike every entry kind. `sections-${kind}` matches
  // the anchor render-prop-table.js's buildDefIndex() already generates
  // for these definitions on the Schema page.
  const sections = sectionPages.map((page) => {
    const kind = page.filename.replace(/\.schema\.yaml$/, "");
    const anchor = `sections-${kind}`;
    return {
      kind,
      page: `${SITE_URL}/schema#${anchor}`,
      markdown: `${SITE_URL}/schema/${anchor}.md`,
      schema: `${SITE_URL}/v${version}/sections/${kind}.schema.yaml`,
    };
  });
  sections.sort((a, b) => a.kind.localeCompare(b.kind));

  // Every schema file's own small markdown mirror, not just the entry and section kinds. The
  // build emits 23 of these; the manifest linked the 9 that happen to be kinds, so the other 14
  // - `common-ref` among them, the shape behind refs/extends/alternatives/checks/evidence/specs/
  // alternatives - were reachable from nothing at all. An agent that can fetch 4 KB for one
  // definition will; one offered only the 115 KB whole-schema mirror guesses instead.
  const definitions = pages
    .map((page) => {
      const baseName = page.filename.replace(/\.schema\.yaml$/, "");
      const defSlug = page.group === "root" ? baseName : `${page.group}-${baseName}`;
      const relPath =
        page.group && page.group !== "root" ? `${page.group}/${page.filename}` : page.filename;
      return {
        name: page.title,
        page: `${SITE_URL}/schema#${defSlug}`,
        markdown: `${SITE_URL}/schema/${defSlug}.md`,
        schema: `${SITE_URL}/v${version}/${relPath}`,
      };
    })
    .sort((a, b) => a.markdown.localeCompare(b.markdown));

  const manifest = {
    schemaVersion: version,
    bundledSchema: `${SITE_URL}/v${version}/dsds.bundled.yaml`,
    // Prefer one of these over bundledSchema when you only need a single definition.
    definitions,
    // minVersion is the first dsds-mcp release that reads this schema version. dsds-mcp@0.5.0
    // vendors the 0.22.0 schema and runs this repo's own validator, so it reads 0.22.x only:
    // 0.22.0 is breaking, and a 0.21 document fails until it's migrated. dsds-mcp@0.4.0 reads
    // 0.20.x and 0.21.x. Re-test and update this with every schema release.
    mcp: {
      package: "dsds-mcp",
      minVersion: "0.5.0",
      schemaVersions: ">=0.22.0 <0.23.0",
      install: "npx dsds-mcp",
    },
    indexes: {
      llms: `${SITE_URL}/llms.txt`,
      llmsFull: `${SITE_URL}/llms-full.txt`,
      agents: `${SITE_URL}/AGENTS.md`,
      sitemap: `${SITE_URL}/sitemap.xml`,
    },
    // The rule catalog as data, versioned alongside the schema bundle, generated by generate-rule-catalog.mjs.
    conformance: {
      page: `${SITE_URL}/conformance`,
      markdown: `${SITE_URL}/conformance.md`,
      rules: `${SITE_URL}/v${version}/conformance-rules.yaml`,
      // The negative-fixture corpus + runner contract, as one versioned, language-agnostic artifact.
      suite: `${SITE_URL}/v${version}/conformance-suite/manifest.json`,
    },
    // The whole examples/ tree, mirrored to site/dist/examples/ and indexed by generate-examples-index.mjs.
    examples: {
      page: `${SITE_URL}/examples`,
      markdown: `${SITE_URL}/examples.md`,
      root: `${SITE_URL}/examples/`,
    },
    // .agents/skills/dsds-* mirrored to site/dist/skills/, kept current by sync-skill-versions.js --check.
    skills: (() => {
      const skillsRoot = path.join(ROOT, ".agents", "skills");
      if (!fs.existsSync(skillsRoot)) return null;
      const names = fs
        .readdirSync(skillsRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name.startsWith("dsds-"))
        .map((d) => d.name)
        .sort();
      return names.map((name) => ({
        name,
        file: `${SITE_URL}/skills/${name}/SKILL.md`,
      }));
    })(),
    // Both vocabularies are open - a namespaced custom kind (ex: "acme.icon-library") is always valid alongside these.
    entryKinds: entries.map((e) => e.kind).sort(),
    sectionKinds: sections.map((s) => s.kind).sort(),
    entries,
    sections,
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

// Released-version guard: /stability promises a tagged version's site/dist/v<n>/ stays frozen.
// bump-version.js enforces the release half; this is the build half, warning (not failing, unless
// --strict-versions/DSDS_STRICT_VERSIONS=1) when a build would rewrite a tagged version's bytes.
// Fails open (treats as unreleased) when tag state can't be determined, e.g. a shallow CI clone.

// Every file the tag actually published under this version's directory. Null means "can't tell" (no git/tag/shallow clone).
function releasedFilesAtTag(version) {
  const prefix = `site/dist/v${version}`;
  try {
    const out = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", `v${version}`, "--", prefix],
      { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return out ? out.split("\n") : [];
  } catch {
    return null;
  }
}

function blobAtTag(version, repoRelPath) {
  try {
    // No encoding: returns a Buffer, so this compares correctly even for a binary artifact.
    return execFileSync("git", ["show", `v${version}:${repoRelPath}`], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

function isReleasedVersion(version) {
  try {
    const found = execFileSync("git", ["tag", "--list", `v${version}`], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return found === `v${version}`;
  } catch {
    // No git, not a repo, or git failed - can't prove it's released.
    return false;
  }
}

function releasedVersionGuard(version, versionDir) {
  if (!isReleasedVersion(version)) return; // Not tagged: still in development.

  // Compare against the bytes the TAG published, not the pre-build working tree - stateless,
  // so drift is reported every build until actually resolved, and never when it isn't there.
  const released = releasedFilesAtTag(version);
  if (released === null || released.length === 0) return;

  const prefix = `site/dist/v${version}`;
  const moved = [];
  const seen = new Set();

  for (const repoRelPath of released) {
    const rel = path.relative(prefix, repoRelPath);
    seen.add(rel);
    const onDisk = path.join(versionDir, rel);
    if (!fs.existsSync(onDisk)) {
      moved.push(`${rel} (removed)`);
      continue;
    }
    const tagged = blobAtTag(version, repoRelPath);
    if (tagged === null) continue; // Unreadable at the tag; can't judge it.
    if (!tagged.equals(fs.readFileSync(onDisk))) moved.push(rel);
  }

  if (fs.existsSync(versionDir)) {
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const rel = path.relative(versionDir, full);
          if (!seen.has(rel)) moved.push(`${rel} (added)`);
        }
      }
    };
    walk(versionDir);
  }

  if (moved.length === 0) return;

  const strict =
    process.argv.includes("--strict-versions") || process.env.DSDS_STRICT_VERSIONS === "1";
  const lines = [
    "",
    `${strict ? "✗" : "⚠"}  v${version} is tagged (released), but this build changed ${moved.length} of its published artifact(s):`,
    ...moved.sort().map((rel) => `      site/dist/v${version}/${rel}`),
    "",
    "   /stability promises a released version stays frozen at the bytes it shipped with,",
    "   and anything pinning a v" + version + " $schema URL is relying on that.",
    "",
    "   Either bump the version so these land in a new directory, or revert them with",
    `      git checkout -- site/dist/v${version}`,
    strict
      ? "   (--strict-versions is set, so this is fatal. The files above have already been written.)"
      : "   Pass --strict-versions to make this fatal.",
    "",
  ];
  const message = lines.join("\n");
  if (strict) {
    console.error(message);
    process.exitCode = 1;
    throw new Error(`Released version v${version} was modified by this build.`);
  }
  console.warn(message);
}

async function build() {
  console.log("Building DSDS specification site (schema-driven)...\n");

  // Clean and recreate dist, preserving site/dist/v<n>/ (published, public-contract URLs).
  // The current version's directory is still refreshed every build; bump-version.js is what
  // stops a released version from being re-cut - see /stability's "Versioned artifacts" section.
  if (fs.existsSync(DIST_DIR)) {
    for (const entry of fs.readdirSync(DIST_DIR, { withFileTypes: true })) {
      // Leading `v` + digit matches v0.1, v1.0.0, v1.0.0-beta.2, etc. without touching unrelated dirs.
      if (entry.isDirectory() && /^v\d/.test(entry.name)) continue;
      fs.rmSync(path.join(DIST_DIR, entry.name), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Build the global cross-reference index first - pages resolve (allOf flattened) against schemaById.
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

  // Components fetch these by page-relative path ("assets/<file>.svg") at runtime.
  fs.cpSync(path.join(SITE_DIR, "assets"), path.join(DIST_DIR, "assets"), {
    recursive: true,
  });

  fs.cpSync(path.join(SITE_DIR, "fonts"), path.join(DIST_DIR, "fonts"), {
    recursive: true,
  });

  fs.copyFileSync(
    path.join(SITE_DIR, "robots.txt"),
    path.join(DIST_DIR, "robots.txt"),
  );

  // The whole examples/ tree, exposed at /examples/ - the same documents validate.js checks on every build.
  fs.cpSync(EXAMPLES_DIR, path.join(DIST_DIR, "examples"), { recursive: true });

  // The agent skills, exposed at /skills/ - kept current by sync-skill-versions.js --check.
  const skillsSrc = path.join(ROOT, ".agents", "skills");
  if (fs.existsSync(skillsSrc)) {
    fs.cpSync(skillsSrc, path.join(DIST_DIR, "skills"), { recursive: true });
  }

  // Bundle web components into a single IIFE for file:// compatibility.
  bundleComponents(SITE_DIR, DIST_DIR);

  // Metadata for every page, collected as both page-writing loops run below - feeds sitemap.xml/llms.txt.
  const sitemapEntries = [];
  // Guide markdown, collected in the same loop - feeds llms-full.txt.
  const guideMarkdownDocs = [];

  // ── MDX content pages ─────────────────────────────────────────────────
  const { compileAllMdx, compileMdxFile, substituteVersion } = await loadMdxCompiler();
  console.log("  Compiling MDX content…");
  const mdxPages = await compileAllMdx();
  for (const mdxPage of mdxPages) {
    const slug = mdxPage.meta.slug || mdxPage.file.replace(".mdx", "");
    const title = mdxPage.meta.title || slug;
    const layout = mdxPage.meta.layout || null;
    const badge = mdxPage.meta.badge || null;

    let body = mdxPage.html;

    // Every page opens with <ds-header> built from frontmatter, so drop a leading compiled <h1> (duplicate title).
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

    // Raw markdown mirror alongside the HTML, for an agent that wants the prose without parsing HTML/running JS.
    const rawMdx = fs.readFileSync(
      path.join(CONTENT_DIR, mdxPage.file),
      "utf-8",
    );
    // Strip frontmatter, then a leading "# " h1 if present (mirrors the HTML path's h1 strip above).
    const mdBody = expandShortcodesForMarkdown(
      substituteVersion(rawMdx)
        .replace(/^---\n[\s\S]*?\n---\n/, "")
        .trimStart()
        .replace(/^#[ \t]+[^\n]*\n\s*/, ""),
    );
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
  // Not part of the MDX-pages loop: a 404 isn't real content, so it's excluded from
  // sitemapEntries/guideMarkdownDocs. Lives in fragments/ so compileAllMdx()'s scan skips it.
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
  // Same steps as the MDX-pages loop's .md mirror above, so this page can't drift from the others.
  const notFoundBody = substituteVersion(fs.readFileSync(notFoundPath, "utf-8"))
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .trimStart()
    .replace(/^#[ \t]+[^\n]*\n\s*/, "");
  fs.writeFileSync(
    path.join(DIST_DIR, "404.md"),
    `# ${notFoundTitle}\n\n${notFoundBody}`,
    "utf-8",
  );
  console.log("  ✓  site/dist/404.html  ← custom 404 page\n");

  // ── Schema page — one page, every definition ────────────────────────────
  // Every file's def-section(s) render onto one combined page, in discoverPages()'s group
  // order. The HTML page marks group boundaries with a per-definition eyebrow (no page-level
  // heading); the markdown mirror keeps `##` group headings since flat text has no eyebrow equivalent.
  const GROUP_LABELS = { root: "Base", common: "Common", metadata: "Metadata", entries: "Entries", sections: "Sections" };
  let schemaDefinitions = [];
  let schemaMarkdownParts = [];
  let schemaDefEntries = []; // {name, anchor} - anchor already matches buildDefIndex()'s scheme
  let lastGroup = null;

  // Intro, before every definition - hand-authored MDX spliced onto the top of the Schema page,
  // not a standalone page of its own. Lives in fragments/ so compileAllMdx()'s scan skips it.
  const introFragmentPath = path.join(
    CONTENT_DIR,
    "fragments",
    "schema-intro.mdx",
  );
  const introFragment = await compileMdxFile(introFragmentPath);
  schemaDefinitions.push(introFragment.html);
  schemaMarkdownParts.push(
    expandShortcodesForMarkdown(substituteVersion(fs.readFileSync(introFragmentPath, "utf-8"))).trim(),
  );

  // One small markdown file per schema file, alongside the big schema.md mirror, so a
  // consumer wanting one kind's fields doesn't fetch the whole thing (minus the raw YAML dump).
  const perDefMarkdownDir = path.join(DIST_DIR, "schema");
  fs.mkdirSync(perDefMarkdownDir, { recursive: true });

  for (const page of pages) {
    const { definitions, defNames, baseSlug } = renderSchemaPage(page);
    if (page.group !== lastGroup) {
      lastGroup = page.group;
      const label = GROUP_LABELS[page.group] || page.group;
      schemaMarkdownParts.push(`## ${label}`, "");
    }
    schemaDefinitions.push(definitions);
    schemaMarkdownParts.push(buildSchemaMarkdown(page));
    fs.writeFileSync(
      path.join(perDefMarkdownDir, `${baseSlug}.md`),
      buildSchemaMarkdown(page, { includeSource: false }),
      "utf-8",
    );
    // Used by buildJsonLd()'s hasPart - same anchor scheme renderSchemaPage()/buildDefIndex() agree on.
    for (const defName of defNames) {
      const anchor = defName === page.title ? baseSlug : `${baseSlug}-${slug(defName)}`;
      schemaDefEntries.push({ name: defName, anchor });
    }
  }

  const schemaHeader = renderSub("header", {
    title: "Schema",
    description_attr: ` description="${esc("Every DSDS schema definition, on one page: the base document, every entry kind, every section kind, and every shared building block - each with a real, working example next to it.")}"`,
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
  // site/dist/v<n>/ holds the bundle at its published URL. The build always refreshes the
  // CURRENT version's directory (older v<n>/ archives are untouched); a released version's
  // immutability is enforced at release/deploy time, not by skipping this write.
  const BUNDLE_FILENAME = "dsds.bundled.yaml";
  // bundle.js also writes a JSON projection (older versions published JSON; Ajv/editor $schema resolution expect it).
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

      // The rule catalog, published alongside the bundle so a tool can read it instead of scraping the Conformance page.
      const conformanceRulesPath = path.join(SCHEMA_DIR, "conformance-rules.yaml");
      if (fs.existsSync(conformanceRulesPath)) {
        const versionedConformanceRules = path.join(versionDir, "conformance-rules.yaml");
        fs.copyFileSync(conformanceRulesPath, versionedConformanceRules);
        console.log(
          `  ✓  site/dist/v${version}/conformance-rules.yaml  ← schema/conformance-rules.yaml\n`,
        );
      }

      // The conformance suite: the manifest plus the fixture files, so an independent validator
      // in any language can self-certify against one versioned artifact without cloning this repo.
      const conformanceSuitePath = path.join(SCHEMA_DIR, "conformance-suite.json");
      if (fs.existsSync(conformanceSuitePath)) {
        const suiteDir = path.join(versionDir, "conformance-suite");
        fs.mkdirSync(suiteDir, { recursive: true });
        fs.copyFileSync(conformanceSuitePath, path.join(suiteDir, "manifest.json"));
        const fixturesSrc = path.join(EXAMPLES_DIR, "invalid");
        const fixturesDest = path.join(suiteDir, "examples", "invalid");
        fs.mkdirSync(fixturesDest, { recursive: true });
        for (const file of fs.readdirSync(fixturesSrc)) {
          if (file.endsWith(".yaml")) {
            fs.copyFileSync(path.join(fixturesSrc, file), path.join(fixturesDest, file));
          }
        }
        const vectorsSrc = path.join(EXAMPLES_DIR, "vectors");
        if (fs.existsSync(vectorsSrc)) {
          fs.cpSync(vectorsSrc, path.join(suiteDir, "examples", "vectors"), { recursive: true });
        }
        console.log(
          `  ✓  site/dist/v${version}/conformance-suite/  ← schema/conformance-suite.json + examples/invalid/ + examples/vectors/\n`,
        );
      }

      // ── Versioned split schema files ────────────────────────────────
      // Every split file's `$id` promises it's servable at that URL - mirror the whole schema/
      // tree into site/dist/v<version>/ so each $id resolves instead of 404ing.
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

      releasedVersionGuard(version, versionDir);
    }
  }

  // ── Agent/crawler indexes ──────────────────────────────────────────
  const version = readSpecVersion() || "";
  fs.writeFileSync(
    path.join(DIST_DIR, "sitemap.xml"),
    buildSitemapXml(sitemapEntries),
    "utf-8",
  );
  // Counted off the files actually written to site/dist/schema/, so llms.txt can't claim a
  // number the build doesn't emit.
  const schemaPageCount = fs
    .readdirSync(path.join(DIST_DIR, "schema"))
    .filter((f) => f.endsWith(".md")).length;
  fs.writeFileSync(
    path.join(DIST_DIR, "llms.txt"),
    buildLlmsTxt(sitemapEntries, version, schemaPageCount),
    "utf-8",
  );

  fs.writeFileSync(path.join(DIST_DIR, "llms-small.txt"), buildLlmsSmallTxt(version), "utf-8");

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

  // Standalone canonical descriptors, /id/entry/<kind>.json, addressable by their own @id.
  const entryIdDir = path.join(DIST_DIR, "id", "entry");
  fs.mkdirSync(entryIdDir, { recursive: true });
  for (const { kind, json } of entryDescriptors) {
    fs.writeFileSync(path.join(entryIdDir, `${kind}.json`), json, "utf-8");
  }

  console.log(
    `  ✓  site/dist/sitemap.xml, site/dist/llms.txt, site/dist/llms-full.txt, ` +
      `site/dist/llms-small.txt, site/dist/AGENTS.md, site/dist/manifest.json, site/dist/id/entry/*.json  ← ${sitemapEntries.length} pages indexed\n`,
  );

  console.log(
    `\nDone. ${mdxPages.length + pages.length + 1} pages built to site/dist/\n`,
  );
}

// ---------------------------------------------------------------------------
// Component bundler
// ---------------------------------------------------------------------------

/**
 * Bundles all component ES modules from site/components/ into a single components.js IIFE
 * that works from the file:// protocol: strips import/export statements from each file, in
 * index.js's own import order, and appends its registration loop.
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

    // fetch() is blocked under file://, which this bundle supports - inline every icon's
    // contents instead. Keep this list in sync with ICON_FILES in site/components/_shared.js.
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
