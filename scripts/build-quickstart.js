#!/usr/bin/env node
/**
 * build-quickstart.js — Generate the DSDS Quick Start Guide.
 *
 * Reads minimal example JSON files from spec/examples/minimal/ and produces
 * a self-contained HTML page at site/dist/quickstart.html that uses the
 * shared web components library (components.js) for all UI elements.
 *
 * Usage:
 *   node scripts/build-quickstart.js
 *
 * Output:
 *   site/dist/quickstart.html
 */

const fs = require("fs");
const path = require("path");
const { buildSpecNav } = require("./nav");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const EXAMPLES_DIR = path.join(ROOT, "spec", "examples");
const MINIMAL_DIR = path.join(EXAMPLES_DIR, "minimal");
const OUTPUT_DIR = path.join(ROOT, "site", "dist");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "quickstart.html");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Format a JSON value as indented text suitable for embedding inside
 * a <ds-code> element. No syntax highlighting — the component handles it.
 */
function jsonRaw(obj) {
  const raw = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  return esc(raw);
}

/**
 * Produce a <ds-code> element for a JSON object.
 */
function codeBlock(obj, label) {
  const labelAttr = label ? ` label="${esc(label)}"` : "";
  return `<ds-code language="json"${labelAttr}>${esc(JSON.stringify(obj, null, 2))}</ds-code>`;
}

/**
 * Produce a <ds-code> element for plain text (bash, etc).
 */
function codeBlockPlain(text, label) {
  const labelAttr = label ? ` label="${esc(label)}"` : "";
  return `<ds-code${labelAttr}>${esc(text.trim())}</ds-code>`;
}

// ---------------------------------------------------------------------------
// Load examples
// ---------------------------------------------------------------------------

function loadMinimalExamples() {
  const examples = {};
  const files = [
    "minimal.dsds.json",
    "component.json",
    "token.json",
    "token-group.json",
    "theme.json",
    "style.json",
    "pattern.json",
  ];

  for (const file of files) {
    const filePath = path.join(MINIMAL_DIR, file);
    if (fs.existsSync(filePath)) {
      examples[file] = readJSON(filePath);
    }
  }
  return examples;
}

// ---------------------------------------------------------------------------
// Entity type card data
// ---------------------------------------------------------------------------

const ENTITY_CARDS = [
  {
    kind: "component",
    code: '"component"',
    desc: "A reusable UI element — buttons, inputs, modals. Supports anatomy, API, variants, states, and design specs.",
  },
  {
    kind: "token",
    code: '"token"',
    desc: "A single design token — color, spacing, typography. Carries a resolved value, platform API mappings, and usage rules.",
  },
  {
    kind: "token-group",
    code: '"token-group"',
    desc: "A hierarchical group of related tokens. Recursive — groups can contain groups.",
  },
  {
    kind: "theme",
    code: '"theme"',
    desc: "A named set of token value overrides — dark mode, high-contrast, compact density, brand variants.",
  },
  {
    kind: "style",
    code: '"style"',
    desc: "A macro-level visual foundation — color, typography, spacing, elevation. Carries principles, scales, and motion definitions.",
  },
  {
    kind: "pattern",
    code: '"pattern"',
    desc: "A broad interaction pattern — navigation, error messaging, empty states. Describes how components compose to solve a user need.",
  },
];

// ---------------------------------------------------------------------------
// Table helper — generates <ds-table><table>...</table></ds-table> markup
// ---------------------------------------------------------------------------

/**
 * Build a <ds-table> with a native <table> inside.
 * @param {string[]} headers — column header labels
 * @param {string[][]} rows — array of row arrays (cells can contain HTML)
 * @param {object} [opts] — optional { striped, compact } booleans
 */
function htmlTable(headers, rows, opts) {
  const attrs = [];
  if (opts && opts.striped) attrs.push(" striped");
  if (opts && opts.compact) attrs.push(" compact");

  const ths = headers.map((h) => `<th>${h}</th>`).join("");
  const trs = rows
    .map(
      (row) =>
        "<tr>" + row.map((cell) => `<td>${cell}</td>`).join("") + "</tr>",
    )
    .join("\n      ");

  return `<ds-table${attrs.join("")}>
    <table>
      <thead><tr>${ths}</tr></thead>
      <tbody>
      ${trs}
      </tbody>
    </table>
  </ds-table>`;
}

// ---------------------------------------------------------------------------
// HTML Generation
// ---------------------------------------------------------------------------

function buildPage() {
  const ex = loadMinimalExamples();

  const slimDoc = {
    dsdsVersion: "0.1",
    documentation: [
      {
        name: "My Design System",
        items: [
          { kind: "component", name: "button", "...": "" },
          { kind: "token", name: "color-text-primary", "...": "" },
          { kind: "theme", name: "dark", "...": "" },
        ],
      },
    ],
  };

  const purposeExample = {
    kind: "purpose",
    useCases: [
      {
        description:
          "When the user needs to trigger an action such as submitting a form.",
        kind: "positive",
      },
      {
        description: "When the action navigates to a different page.",
        kind: "negative",
        alternative: {
          name: "link",
          rationale: "Links carry native navigation semantics.",
        },
      },
    ],
  };

  const bestPracticeExample = {
    kind: "best-practices",
    items: [
      {
        guidance: "Limit each surface to one primary button.",
        rationale: "Multiple primary buttons dilute visual hierarchy.",
        kind: "required",
        category: "visual-design",
      },
    ],
  };

  // ── Entity cards HTML ────────────────────────────────────────────────
  const entityCardsHtml = ENTITY_CARDS.map(
    (c) =>
      `    <ds-card variant="outlined" padding="sm">
      <ds-badge variant="${c.kind === "token-group" ? "token" : c.kind === "component" ? "kind" : c.kind === "token" ? "stable" : c.kind === "theme" ? "experimental" : c.kind === "style" ? "category" : "deprecated"}" size="sm">${esc(c.kind)}</ds-badge>
      <ds-heading level="4"><ds-code inline>${c.code}</ds-code></ds-heading>
      <p>${esc(c.desc)}</p>
    </ds-card>`,
  ).join("\n");

  // ── Common properties table ──────────────────────────────────────────
  const commonPropsTable = htmlTable(
    ["Property", "Required", "Description"],
    [
      ["<ds-code inline>kind</ds-code>", "Yes", "Entity type discriminator"],
      [
        "<ds-code inline>name</ds-code>",
        "Yes*",
        "Machine-readable identifier (<ds-code inline>^[a-z][a-z0-9-]*$</ds-code>, except tokens)",
      ],
      ["<ds-code inline>displayName</ds-code>", "Yes*", "Human-readable label"],
      [
        "<ds-code inline>description</ds-code>",
        "Yes*",
        "What this entity is and does (CommonMark supported)",
      ],
      [
        "<ds-code inline>status</ds-code>",
        "No",
        '<ds-code inline>"stable"</ds-code>, <ds-code inline>"experimental"</ds-code>, <ds-code inline>"draft"</ds-code>, <ds-code inline>"deprecated"</ds-code> — or an object with per-platform status',
      ],
      [
        "<ds-code inline>guidelines</ds-code>",
        "No",
        "Array of typed guideline objects (see below)",
      ],
      [
        "<ds-code inline>links</ds-code>",
        "No",
        "External resources and entity relationships",
      ],
      [
        "<ds-code inline>$extensions</ds-code>",
        "No",
        "Vendor-specific metadata",
      ],
    ],
  );

  // ── Guideline table ──────────────────────────────────────────────────
  const guidelineTable = htmlTable(
    ["kind", "What it documents", "Available on"],
    [
      [
        '<ds-code inline>"purpose"</ds-code>',
        "When to use / when not to use",
        "All",
      ],
      [
        '<ds-code inline>"best-practices"</ds-code>',
        "Actionable rules with rationale",
        "All",
      ],
      [
        '<ds-code inline>"accessibility"</ds-code>',
        "Keyboard, ARIA, contrast, motion",
        "All",
      ],
      [
        '<ds-code inline>"content"</ds-code>',
        "Labels, terminology, localization",
        "All",
      ],
      [
        '<ds-code inline>"anatomy"</ds-code>',
        "Named parts with token references",
        "Component, Pattern",
      ],
      [
        '<ds-code inline>"api"</ds-code>',
        "Props, events, slots, CSS hooks",
        "Component",
      ],
      [
        '<ds-code inline>"variants"</ds-code>',
        "Enum + flag dimensions of variation",
        "Component, Pattern",
      ],
      [
        '<ds-code inline>"states"</ds-code>',
        "Interactive states with token overrides",
        "Component, Pattern",
      ],
      [
        '<ds-code inline>"design-specifications"</ds-code>',
        "Spacing, sizing, typography, responsive",
        "Component",
      ],
      [
        '<ds-code inline>"principles"</ds-code>',
        "High-level guiding beliefs",
        "Style",
      ],
      [
        '<ds-code inline>"scale"</ds-code>',
        "Ordered token progressions",
        "Style",
      ],
      [
        '<ds-code inline>"motion"</ds-code>',
        "Easing curves and durations",
        "Style",
      ],
      [
        '<ds-code inline>"interactions"</ds-code>',
        "Pattern flow steps",
        "Pattern",
      ],
    ],
  );

  // ── Next steps table ─────────────────────────────────────────────────
  const nextStepsTable = htmlTable(
    ["Resource", "What you'll find"],
    [
      [
        '<a href="index.html">Specification Site</a>',
        "Full schema reference with property tables, types, and cross-references",
      ],
      [
        '<a href="samples.html">Interactive Samples</a>',
        "Side-by-side JSON ↔ rendered documentation for every entity type",
      ],
      [
        '<a href="schema-architecture.svg">Schema Architecture</a>',
        "Visual diagram of how all schema files relate",
      ],
      [
        '<a href="https://github.com/somerandomdude/design-system-documentation-schema/blob/main/spec/dsds-spec.md">Full Specification</a>',
        "The complete spec — document structure, all entity types, all guidelines, naming conventions",
      ],
      [
        '<a href="https://github.com/somerandomdude/design-system-documentation-schema/tree/main/spec/examples">All Examples</a>',
        "Validated example files for every entity and guideline type",
      ],
    ],
  );

  // ── Minimal example sections ─────────────────────────────────────────
  function exampleSection(title, desc, fileKey, label) {
    const data = ex[fileKey];
    if (!data) return "";
    return `
  <ds-heading level="3">${title}</ds-heading>
  <p>${desc}</p>
  ${codeBlock(data, label)}`;
  }

  // ── Build the page ───────────────────────────────────────────────────

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DSDS Quick Start Guide — DSDS 0.1</title>
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="style.css">
<script src="components.js"></script>
</head>
<body>
${buildSpecNav("quickstart")}
  <div class="content">
    <main class="content__main" role="main">
      <div class="content__inner">

<ds-toolbar sticky>
  <span slot="start" style="font-weight: 700; font-size: 1.1rem">DSDS Quick Start Guide</span>
  <span slot="subtitle">Everything you need to start writing machine-readable design system documentation in 5 minutes.</span>
  <span slot="end">
    <ds-badge>JSON Schema</ds-badge>
    <ds-badge>6 Entity Types</ds-badge>
    <ds-badge>13 Guideline Types</ds-badge>
    <ds-badge>v0.1</ds-badge>
  </span>
  <a slot="nav" href="#what">What is DSDS?</a>
  <a slot="nav" href="#structure">Document Structure</a>
  <a slot="nav" href="#entities">Entity Types</a>
  <a slot="nav" href="#guidelines">Guidelines</a>
  <a slot="nav" href="#minimal">Minimal Examples</a>
  <a slot="nav" href="#validate">Validate</a>
  <a slot="nav" href="#next">Next Steps</a>
</ds-toolbar>

<div class="container">

<!-- ════════════════════════════════════════════════════════
     1. WHAT IS DSDS?
     ════════════════════════════════════════════════════════ -->
<section id="what">
  <ds-heading level="2" anchor="what"><span class="num">1</span> What is DSDS?</ds-heading>
  <p class="lead">DSDS (Design System Documentation Standard) is a JSON-based format for documenting design systems. It gives every piece of documentation — components, tokens, themes, styles, patterns — a predictable, machine-readable structure.</p>

  <div class="callout">
    <strong>Key idea:</strong> DSDS documents the <em>how and why</em> of your design system — not the token values themselves. It complements the <a href="https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/">W3C Design Tokens Format</a> which handles the <em>what</em>.
  </div>

  <ds-heading level="3">What you get</ds-heading>
  <ul>
    <li><strong>Structured</strong> — every section has a defined shape, no guessing</li>
    <li><strong>Machine-readable</strong> — tools can parse, generate, validate, and transform it</li>
    <li><strong>Portable</strong> — not locked to any documentation tool or platform</li>
    <li><strong>Extensible</strong> — add vendor metadata without breaking interoperability</li>
    <li><strong>Validatable</strong> — JSON Schema catches errors before they reach consumers</li>
  </ul>
</section>

<!-- ════════════════════════════════════════════════════════
     2. DOCUMENT STRUCTURE
     ════════════════════════════════════════════════════════ -->
<section id="structure">
  <ds-heading level="2" anchor="structure"><span class="num">2</span> Document Structure</ds-heading>
  <p class="lead">A DSDS file is a JSON document with a version and one or more documentation groups. Each group contains an array of typed entities.</p>

  ${codeBlock(slimDoc, "document.dsds.json")}

  <p>That's the entire top-level structure:</p>
  <ul>
    <li><ds-code inline>dsdsVersion</ds-code> — always <ds-code inline>"0.1"</ds-code> for this version</li>
    <li><ds-code inline>documentation</ds-code> — array of named groups, each with an <ds-code inline>items</ds-code> array</li>
    <li><ds-code inline>items</ds-code> — array of typed entities, mixed freely in any order</li>
  </ul>

  <div class="callout">
    <strong>Tip:</strong> You can organize entities into multiple groups — one for foundations, one for components, etc. — or put everything in a single group. The schema allows both.
  </div>
</section>

<!-- ════════════════════════════════════════════════════════
     3. ENTITY TYPES
     ════════════════════════════════════════════════════════ -->
<section id="entities">
  <ds-heading level="2" anchor="entities"><span class="num">3</span> Entity Types</ds-heading>
  <p class="lead">Every entity has a <ds-code inline>kind</ds-code> discriminator that tells tools what type of thing it is. There are six kinds.</p>

  <div class="card-grid">
${entityCardsHtml}
  </div>

  <ds-heading level="3">Common properties</ds-heading>
  <p>Every entity shares these fields:</p>
  ${commonPropsTable}
  <p><small>* Required for component, style, and pattern. Token requires <ds-code inline>name</ds-code> + <ds-code inline>tokenType</ds-code> + <ds-code inline>value</ds-code>.</small></p>

  <ds-heading level="3">Status: string or object</ds-heading>
  <p>For the simple case, status is just a string:</p>
  ${codeBlock({ status: "stable" })}
  <p>When you need per-platform tracking:</p>
  ${codeBlock({
    status: {
      overall: "stable",
      platforms: {
        react: { status: "stable", since: "1.0.0" },
        ios: { status: "experimental", since: "3.0.0" },
      },
    },
  })}
</section>

<!-- ════════════════════════════════════════════════════════
     4. GUIDELINES
     ════════════════════════════════════════════════════════ -->
<section id="guidelines">
  <ds-heading level="2" anchor="guidelines"><span class="num">4</span> The Guidelines System</ds-heading>
  <p class="lead">All structured documentation lives in the <ds-code inline>guidelines</ds-code> array on each entity. Each guideline is a typed container identified by <ds-code inline>kind</ds-code>.</p>

  ${guidelineTable}

  <ds-heading level="3">Purpose: when to use it</ds-heading>
  <p>The <ds-code inline>purpose</ds-code> guideline provides concrete scenarios. Each use case is <ds-code inline>"positive"</ds-code> (do use) or <ds-code inline>"negative"</ds-code> (don't use, with an alternative):</p>
  ${codeBlock(purposeExample, "purpose guideline")}

  <ds-heading level="3">Best practices: how to use it</ds-heading>
  <p>Each best practice pairs a <ds-code inline>guidance</ds-code> statement with a <ds-code inline>rationale</ds-code> and an enforcement level:</p>
  ${codeBlock(bestPracticeExample, "best-practices guideline")}
  <p>Enforcement levels:
    <ds-badge variant="required" size="sm">required</ds-badge> (MUST),
    <ds-badge variant="encouraged" size="sm">encouraged</ds-badge> (SHOULD),
    <ds-badge variant="informational" size="sm">informational</ds-badge> (MAY, default),
    <ds-badge variant="discouraged" size="sm">discouraged</ds-badge> (SHOULD NOT),
    <ds-badge variant="prohibited" size="sm">prohibited</ds-badge> (MUST NOT).
  </p>
</section>

<!-- ════════════════════════════════════════════════════════
     5. MINIMAL EXAMPLES
     ════════════════════════════════════════════════════════ -->
<section id="minimal">
  <ds-heading level="2" anchor="minimal"><span class="num">5</span> Minimal Examples</ds-heading>
  <p class="lead">These are the smallest valid entities — the floor of documentation. Copy one, fill in your content, and add guidelines as you go.</p>

  ${exampleSection(
    "Component",
    "A component needs <ds-code inline>kind</ds-code>, <ds-code inline>name</ds-code>, <ds-code inline>displayName</ds-code>, and <ds-code inline>description</ds-code>. Everything else is optional.",
    "component.json",
    "minimal component",
  )}

  ${exampleSection(
    "Token",
    "A token needs <ds-code inline>kind</ds-code>, <ds-code inline>name</ds-code>, <ds-code inline>tokenType</ds-code>, and a <ds-code inline>value</ds-code> with at least <ds-code inline>resolved</ds-code>.",
    "token.json",
    "minimal token",
  )}

  ${exampleSection(
    "Token Group",
    "Groups organize tokens into hierarchies. The <ds-code inline>children</ds-code> array can contain tokens or nested groups.",
    "token-group.json",
    "minimal token-group",
  )}

  ${exampleSection(
    "Theme",
    "A theme provides <ds-code inline>overrides</ds-code> — an array of token + value pairs that replace the default.",
    "theme.json",
    "minimal theme",
  )}

  ${exampleSection(
    "Style",
    "A style documents a visual foundation. Guidelines like <ds-code inline>principles</ds-code>, <ds-code inline>scale</ds-code>, and <ds-code inline>motion</ds-code> are specific to styles.",
    "style.json",
    "minimal style",
  )}

  ${exampleSection(
    "Pattern",
    "A pattern describes how components compose to solve a user need. It supports <ds-code inline>interactions</ds-code> for flow steps.",
    "pattern.json",
    "minimal pattern",
  )}

  <ds-heading level="3">Full document</ds-heading>
  <p>Here's a complete, minimal DSDS file with one of each entity type:</p>
  ${ex["minimal.dsds.json"] ? codeBlock(ex["minimal.dsds.json"], "minimal.dsds.json") : ""}
</section>

<!-- ════════════════════════════════════════════════════════
     6. VALIDATE
     ════════════════════════════════════════════════════════ -->
<section id="validate">
  <ds-heading level="2" anchor="validate"><span class="num">6</span> Validate Your Document</ds-heading>
  <p class="lead">DSDS includes a JSON Schema you can use to validate any document.</p>

  <ds-heading level="3">Using the bundled schema</ds-heading>
  <p>Point your <ds-code inline>$schema</ds-code> at the bundled schema for editor autocompletion and inline validation:</p>
  ${codeBlock({
    $schema: "https://designsystemdocspec.org/v0.1/dsds.bundled.schema.json",
    dsdsVersion: "0.1",
    documentation: [],
  })}

  <ds-heading level="3">Using the CLI</ds-heading>
  ${codeBlockPlain(
    `# Clone the repo
git clone https://github.com/somerandomdude/design-system-documentation-schema.git
cd design-system-documentation-schema
npm install

# Validate the built-in examples
npm run validate

# Validate your own file
npx ajv validate -s spec/schema/dsds.bundled.schema.json -d my-system.dsds.json`,
    "terminal",
  )}
</section>

<!-- ════════════════════════════════════════════════════════
     7. NEXT STEPS
     ════════════════════════════════════════════════════════ -->
<section id="next">
  <ds-heading level="2" anchor="next"><span class="num">7</span> Next Steps</ds-heading>
  <p class="lead">You've seen the basics. Here's where to go deeper.</p>

  ${nextStepsTable}

  <div class="callout">
    <strong>Getting started recipe:</strong>
    <ol style="margin:8px 0 0;padding-left:20px">
      <li>Copy the <a href="#minimal">minimal document</a> above</li>
      <li>Replace the example entities with your own design system's components and tokens</li>
      <li>Add <ds-code inline>guidelines</ds-code> to each entity as your documentation matures</li>
      <li>Validate with <ds-code inline>npm run validate</ds-code> to catch structural errors early</li>
    </ol>
  </div>
</section>

</div>

        <ds-back-to-top></ds-back-to-top>

        <ds-footer>
          <p>Design System Documentation Standard (DSDS) 0.1 — Quick Start Guide</p>
          <p><a href="https://github.com/somerandomdude/design-system-documentation-schema">GitHub</a> · <a href="index.html">Full Spec</a> · <a href="samples.html">Interactive Samples</a></p>
        </ds-footer>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Building quick start guide...\n");

  const html = buildPage();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Copy shared assets
  fs.copyFileSync(
    path.join(ROOT, "site", "tokens.css"),
    path.join(OUTPUT_DIR, "tokens.css"),
  );
  fs.copyFileSync(
    path.join(ROOT, "site", "style.css"),
    path.join(OUTPUT_DIR, "style.css"),
  );
  // Copy bundled web components file (generated by build-site.js)
  const bundledComponents = path.join(ROOT, "site", "dist", "components.js");
  if (fs.existsSync(bundledComponents)) {
    fs.copyFileSync(bundledComponents, path.join(OUTPUT_DIR, "components.js"));
  } else {
    console.error(
      "Warning: components.js not found in site/dist/. Run build-site.js first.",
    );
  }
  fs.writeFileSync(OUTPUT_PATH, html, "utf-8");

  const kb = (Buffer.byteLength(html, "utf-8") / 1024).toFixed(1);
  console.log(`  ✓  ${path.relative(ROOT, OUTPUT_PATH)} (${kb} KB)`);
  console.log("\nDone.");
}

main();
