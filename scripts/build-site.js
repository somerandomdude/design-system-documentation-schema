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

const { buildSpecNav, DIR_GROUPS, readSpecVersion } = require("./nav");
const { buildSamples } = require("./build-samples");
const {
  esc,
  slug,
  linkToRef,
  describeType: describeTypeShared,
  renderPropertyTable: renderPropertyTableShared,
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
const SPEC_DIR = path.join(ROOT, "spec");
const SCHEMA_DIR = path.join(SPEC_DIR, "schema");
const SITE_DIR = path.join(ROOT, "site");
const DIST_DIR = path.join(SITE_DIR, "dist");
const EXAMPLES_DIR = path.join(SPEC_DIR, "examples");

/**
 * Auto-discover schema files and build the full page registry.
 * Returns an array of page descriptors:
 *   { slug, title, group, groupLabel, filename, filePath, data }
 */
function discoverPages() {
  const pages = [];

  for (const group of DIR_GROUPS) {
    const dirPath = path.join(SCHEMA_DIR, group.dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.json"))
      .sort();

    for (const filename of files) {
      const filePath = path.join(dirPath, filename);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const baseName = filename.replace(".schema.json", "");
      const pageSlug = `${group.dir}-${baseName}`;

      // Look for a matching example file: spec/examples/{group}/{baseName}.json
      const examplePath = path.join(
        EXAMPLES_DIR,
        group.dir,
        `${baseName}.json`,
      );
      let examples = null;
      if (fs.existsSync(examplePath)) {
        try {
          examples = JSON.parse(fs.readFileSync(examplePath, "utf-8"));
        } catch (e) {
          console.error(
            `  ⚠  Failed to parse example ${examplePath}: ${e.message}`,
          );
        }
      }

      pages.push({
        slug: pageSlug,
        title: data.title || baseName,
        group: group.dir,
        groupLabel: group.label,
        filename,
        filePath,
        data,
        examples,
      });
    }
  }

  // Also include the root schema
  const rootPath = path.join(SCHEMA_DIR, "dsds.schema.json");
  if (fs.existsSync(rootPath)) {
    const rootData = JSON.parse(fs.readFileSync(rootPath, "utf-8"));
    pages.unshift({
      slug: "root",
      title: rootData.title || "Root Schema",
      group: "documentation",
      groupLabel: "Documentation",
      filename: "dsds.schema.json",
      navLabel: "Root schema",
      filePath: rootPath,
      data: rootData,
      examples: null,
    });
  }

  return pages;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/**
 * Build a definition index from the discovered pages.
 * Maps: defName -> { pageSlug, filename }
 *
 * Note: `esc`, `slug`, and `linkToRef` are imported from
 * ./render-prop-table so the MDX shortcode preprocessor and the
 * schema-page generator share one canonical implementation.
 */
function buildDefIndex(pages) {
  const index = {};
  for (const page of pages) {
    for (const defName of Object.keys(page.data.$defs || {})) {
      index[defName] = { pageSlug: page.slug, filename: page.filename };
    }
  }
  return index;
}

// Global definition index for cross-references
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

// ---------------------------------------------------------------------------
// Definition rendering
// ---------------------------------------------------------------------------

/**
 * Render a single $defs definition as an HTML section.
 * If `exampleData` is provided, it's rendered as a JSON code block after the definition.
 */
function renderDefinition(defName, defSchema, exampleData) {
  const parts = [];
  const hid = slug(defName);

  // Definition section wrapper — handles heading, description, type badge
  const descAttr = defSchema.description
    ? ` description="${esc(defSchema.description)}"`
    : "";
  const typeAttr = defSchema.type ? ` type="${esc(defSchema.type)}"` : "";
  parts.push(
    `<ds-def-section name="${esc(defName)}" anchor="${hid}"${descAttr}${typeAttr}>`,
  );

  // If it's a simple string (like status), show that
  if (defSchema.type === "string" && !defSchema.properties) {
    if (defSchema.enum) {
      parts.push(`<p><strong>Allowed values:</strong></p>`);
      parts.push(`<ul class="enum-list">`);
      for (const val of defSchema.enum) {
        parts.push(`<li><ds-code inline>${esc(String(val))}</ds-code></li>`);
      }
      parts.push(`</ul>`);
    }
    parts.push(`</ds-def-section>`);
    return parts.join("\n");
  }

  // If it's a oneOf (like richText), show the alternatives
  if (defSchema.oneOf) {
    parts.push(`<p><strong>Accepts one of:</strong></p>`);
    parts.push(`<ul>`);
    for (const alt of defSchema.oneOf) {
      if (alt.$ref) {
        const refName = linkToRef(alt.$ref);
        if (refName) {
          const target = DEF_INDEX[refName];
          if (target) {
            parts.push(
              `<li><a href="${target.pageSlug}.html#${slug(refName)}">${esc(refName)}</a></li>`,
            );
          } else {
            parts.push(`<li><ds-code inline>${esc(refName)}</ds-code></li>`);
          }
        }
      } else if (alt.type === "string") {
        parts.push(
          `<li><strong>string</strong>${alt.description ? ` — ${esc(alt.description)}` : ""}</li>`,
        );
      } else if (alt.type === "object") {
        parts.push(
          `<li><strong>object</strong>${alt.description ? ` — ${esc(alt.description)}` : ""}</li>`,
        );
        if (alt.properties) {
          parts.push(renderPropertyTable(alt));
        }
      } else {
        parts.push(`<li>${describeType(alt)}</li>`);
      }
    }
    parts.push(`</ul>`);
  }

  // Property table
  if (defSchema.properties) {
    parts.push(renderPropertyTable(defSchema));
  }

  // additionalProperties (open maps like tokenApi)
  if (
    defSchema.type === "object" &&
    defSchema.additionalProperties &&
    typeof defSchema.additionalProperties === "object" &&
    !defSchema.properties
  ) {
    parts.push(
      `<p><strong>Open map:</strong> keys are strings, values are <ds-code inline>${esc(defSchema.additionalProperties.type || "any")}</ds-code></p>`,
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
      parts.push(
        `<ds-note variant="warning"><strong>Constraint:</strong> At least one of ${propNames.join(", ")} must be present.</ds-note>`,
      );
    } else {
      // Mixed anyOf — show each branch
      parts.push(`<p><strong>Constraints:</strong> at least one of:</p>`);
      parts.push(`<ul>`);
      for (const alt of defSchema.anyOf) {
        if (alt.required) {
          parts.push(
            `<li>${alt.required.map((r) => `<ds-code inline>${esc(r)}</ds-code>`).join(", ")} must be present</li>`,
          );
        }
      }
      parts.push(`</ul>`);
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
      parts.push(
        `<ds-note variant="warning"><strong>Conditional:</strong> When ${conditions}, then ${requirements} is required.</ds-note>`,
      );
    }
  }

  // Cross-references: list all $ref targets in this definition
  const refs = collectRefs(defSchema);
  if (refs.length > 0) {
    parts.push(`<ds-cross-refs><strong>References:</strong> `);
    const refLinks = refs.map((refName) => {
      const target = DEF_INDEX[refName];
      if (target) {
        return `<ds-type-ref href="${target.pageSlug}.html#${slug(refName)}">${esc(refName)}</ds-type-ref>`;
      }
      return `<ds-code inline>${esc(refName)}</ds-code>`;
    });
    parts.push(refLinks.join(", "));
    parts.push(`</ds-cross-refs>`);
  }

  // Example — render the matching example if one was provided
  if (exampleData !== undefined && exampleData !== null) {
    parts.push(`<ds-def-example>`);
    const jsonStr = JSON.stringify(exampleData, null, 2);
    parts.push(
      `<ds-code language="json" label="example">${esc(jsonStr)}</ds-code>`,
    );
    parts.push(`</ds-def-example>`);
  }

  parts.push(`</ds-def-section>`);
  return parts.join("\n");
}

/**
 * Collect all unique $ref definition names from a schema object.
 */
function collectRefs(obj, seen = new Set()) {
  if (Array.isArray(obj)) {
    for (const item of obj) collectRefs(item, seen);
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (key === "$ref" && typeof value === "string") {
        const name = linkToRef(value);
        if (name) seen.add(name);
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

/**
 * Render a full page body for a single schema file.
 */
function renderSchemaPage(page) {
  const parts = [];
  const defs = page.data.$defs || {};
  const defNames = orderDefsByReference(defs);
  const examples = page.examples || {};

  // Page header — title, description, source
  const relPath = page.group ? `${page.group}/${page.filename}` : page.filename;
  const descAttr = page.data.description
    ? ` description="${esc(page.data.description)}"`
    : "";
  parts.push(
    `<ds-schema-header title="${esc(page.title)}"${descAttr} source="${esc(relPath)}"></ds-schema-header>`,
  );

  // Always render top-level properties when they exist (e.g., the root schema
  // has both its own properties AND $defs like documentationGroup)
  if (page.data.properties) {
    parts.push(
      `<ds-heading level="2" anchor="properties-heading">Root Properties</ds-heading>`,
    );
    parts.push(renderPropertyTable(page.data));
  }

  if (defNames.length === 0) {
    // Root-only schemas (no $defs) can still ship an example. By convention
    // the entire example file is treated as one root-level example document.
    if (page.examples !== null && page.examples !== undefined) {
      const jsonStr = JSON.stringify(page.examples, null, 2);
      parts.push(`<ds-def-example>`);
      parts.push(
        `<ds-code language="json" label="example">${esc(jsonStr)}</ds-code>`,
      );
      parts.push(`</ds-def-example>`);
    }
    return parts.join("\n");
  }

  // Definition index (if more than one definition)
  if (defNames.length > 1) {
    parts.push(`<ds-def-index>`);
    parts.push(
      `<p><strong>${defNames.length} definitions</strong> in this file:</p>`,
    );
    parts.push(`<ul>`);
    for (const defName of defNames) {
      parts.push(
        `<li><a href="#${slug(defName)}"><ds-code inline>${esc(defName)}</ds-code></a></li>`,
      );
    }
    parts.push(`</ul>`);
    parts.push(`</ds-def-index>`);
  }

  // Render each definition with its matching example (if any)
  for (const defName of defNames) {
    // The example file can have the defName as a key with an example value
    const exampleData =
      examples[defName] !== undefined ? examples[defName] : null;
    parts.push(renderDefinition(defName, defs[defName], exampleData));
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Overview page — rendered from markdown
// ---------------------------------------------------------------------------

function pageHtml(title, activeSlug, bodyHtml, hasToc, pages, layout, version) {
  const layoutCls = layout === "full" ? " content--full" : "";
  const tocCls = hasToc ? " content--with-toc" : "";
  const contentCls = "content" + layoutCls + tocCls;

  // Derive the spec version from the schema if the caller didn't pass one
  // explicitly. This keeps every `DSDS <v>` string in the rendered HTML
  // tied to dsds.schema.json#/properties/dsdsVersion/const — the same
  // single source of truth that the bundle script and nav use.
  const v = version || readSpecVersion() || "";

  // Skip the `— DSDS <v>` suffix when the title already names the
  // version (e.g., the overview page title is "Design System Documentation
  // Spec 0.2"). Otherwise the tab text reads "… Spec 0.2 — DSDS 0.2".
  // A bare `.includes(v)` check is precise enough — a 2-character version
  // like "0.2" is unlikely to appear coincidentally in a page title.
  const titleHasVersion = v && title.includes(v);
  const titleSuffix = v && !titleHasVersion ? ` — DSDS ${v}` : "";

  const footerTitle = v
    ? `Design System Documentation Spec (DSDS) ${v} — Draft Specification`
    : "Design System Documentation Spec (DSDS) — Draft Specification";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}${esc(titleSuffix)}</title>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="style.css">
  <script src="components.js"></script>
</head>
<body>
${buildSpecNav(activeSlug, pages, v)}
  <div class="${contentCls}">
    <main class="content__main" role="main">
      <div class="content__inner">
        ${bodyHtml}

        <ds-back-to-top></ds-back-to-top>

        <ds-footer>
          <p>${esc(footerTitle)}</p>
          <p><a href="https://github.com/somerandomdude/design-system-documentation-schema">GitHub</a></p>
        </ds-footer>
      </div>
    </main>
    ${hasToc && layout !== "full" ? '<ds-toc target=".content__inner" selector="h2[id], h3[id]"></ds-toc>' : ""}
  </div>
</body>
</html>
`;
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

  // Discover all schema pages (with examples attached)
  const pages = discoverPages();
  const withExamples = pages.filter((p) => p.examples !== null).length;
  console.log(
    `  Discovered ${pages.length} schema files across ${DIR_GROUPS.length} directories.`,
  );
  console.log(`  Found ${withExamples} matching example files.\n`);

  // Build the global definition index for cross-references
  DEF_INDEX = buildDefIndex(pages);
  console.log(
    `  Indexed ${Object.keys(DEF_INDEX).length} definitions for cross-referencing.\n`,
  );

  // Copy tokens
  fs.copyFileSync(
    path.join(SITE_DIR, "tokens.css"),
    path.join(DIST_DIR, "tokens.css"),
  );

  // Copy stylesheets
  fs.copyFileSync(
    path.join(SITE_DIR, "style.css"),
    path.join(DIST_DIR, "style.css"),
  );
  fs.copyFileSync(
    path.join(SITE_DIR, "samples.css"),
    path.join(DIST_DIR, "samples.css"),
  );

  // Bundle web components into a single IIFE for file:// compatibility.
  bundleComponents(SITE_DIR, DIST_DIR);

  // ── MDX content pages ─────────────────────────────────────────────────
  const { compileAllMdx } = await loadMdxCompiler();
  console.log("  Compiling MDX content…");
  const mdxPages = await compileAllMdx();
  for (const mdxPage of mdxPages) {
    const slug = mdxPage.meta.slug || mdxPage.file.replace(".mdx", "");
    const title = mdxPage.meta.title || slug;
    const layout = mdxPage.meta.layout || null;
    const badge = mdxPage.meta.badge || null;

    let body = mdxPage.html;

    // Inject badge into the first heading if specified in frontmatter
    if (badge) {
      body = body.replace(
        "<ds-heading",
        '<div class="spec-header"><ds-heading class="spec-header__title"',
      );
      body = body.replace(
        "</ds-heading>",
        ` <ds-badge>${esc(badge)}</ds-badge></ds-heading>`,
      );
    }

    const html = pageHtml(title, slug, body, true, pages, layout);
    fs.writeFileSync(path.join(DIST_DIR, `${slug}.html`), html, "utf-8");
  }
  console.log(`  ${mdxPages.length} MDX page(s) compiled.\n`);

  // ── Schema-driven pages ───────────────────────────────────────────────
  for (const page of pages) {
    const body = renderSchemaPage(page);
    const html = pageHtml(page.title, page.slug, body, true, pages);

    const outPath = path.join(DIST_DIR, `${page.slug}.html`);
    fs.writeFileSync(outPath, html, "utf-8");

    const relSource = page.group
      ? `${page.group}/${page.filename}`
      : page.filename;
    console.log(`  ✓  site/dist/${page.slug}.html  ← ${relSource}`);
  }

  // ── Samples page ────────────────────────────────────────────────────
  buildSamples();

  // ── Versioned bundled schema ──────────────────────────────────────
  //
  // Versioned dist directories (site/dist/v<n>/) hold the bundled schema
  // at the URL it's published at — e.g., site/dist/v0.1/dsds.bundled.schema.json
  // is served at https://designsystemdocspec.org/v0.1/dsds.bundled.schema.json.
  //
  // Once a versioned bundle has been published, the file at that URL is a
  // public contract: every DSDS document that pins its $schema to that URL
  // relies on the file there never changing. The build therefore refuses to
  // overwrite an existing versioned bundle. To intentionally re-publish a
  // version, delete the target file manually and rerun the build.
  const bundledSchemaPath = path.join(SCHEMA_DIR, "dsds.bundled.schema.json");
  if (fs.existsSync(bundledSchemaPath)) {
    const bundledSchema = JSON.parse(fs.readFileSync(bundledSchemaPath, "utf-8"));
    const version = bundledSchema.properties?.dsdsVersion?.const;
    if (version) {
      const versionDir = path.join(DIST_DIR, `v${version}`);
      const versionedBundle = path.join(versionDir, "dsds.bundled.schema.json");
      const relTarget = `site/dist/v${version}/dsds.bundled.schema.json`;

      if (fs.existsSync(versionedBundle)) {
        const existing = fs.readFileSync(versionedBundle, "utf-8");
        const current = fs.readFileSync(bundledSchemaPath, "utf-8");
        if (existing === current) {
          console.log(`  =  ${relTarget} (unchanged)\n`);
        } else {
          console.log(
            `  ⚠  ${relTarget} already exists and differs from the current\n` +
              `     bundle. Skipping to preserve the published artifact. Delete the\n` +
              `     file manually if you intend to re-publish v${version}.\n`,
          );
        }
      } else {
        fs.mkdirSync(versionDir, { recursive: true });
        fs.copyFileSync(bundledSchemaPath, versionedBundle);
        console.log(`  ✓  ${relTarget}  ← spec/schema/dsds.bundled.schema.json\n`);
      }
    }
  }

  console.log(
    `\nDone. ${mdxPages.length + pages.length + 1} pages built to site/dist/\n`,
  );
}

// ── bundleComponents (unchanged) ──────────────────────────────────────────

function processInline(text) {
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, "<ds-code inline>$1</ds-code>");
  return text;
}

function mdHeadingId(text) {
  let plain = text.replace(/<[^>]+>/g, "");
  plain = plain.replace(/[^\w\s-]/g, "");
  return plain.trim().replace(/[\s]+/g, "-").toLowerCase();
}

function mdToHtml(mdText) {
  const lines = mdText.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch) {
      const lang = codeMatch[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      const codeText = esc(codeLines.join("\n"));
      const langAttr = lang ? ` language="${lang}"` : "";
      out.push(`<ds-code${langAttr}>${codeText}</ds-code>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      const hid = mdHeadingId(text);
      out.push(
        `<ds-heading level="${level}" anchor="${hid}">${text}</ds-heading>`,
      );
      i++;
      continue;
    }

    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\|[\s\-:|]+\|/.test(lines[i + 1])
    ) {
      const headers = line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
      i += 2;
      const rows = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim().startsWith("|")
      ) {
        rows.push(
          lines[i]
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((c) => c.trim()),
        );
        i++;
      }
      out.push("<ds-table><table><thead><tr>");
      for (const h of headers) out.push(`<th>${processInline(h)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const row of rows) {
        out.push("<tr>");
        for (const cell of row) out.push(`<td>${processInline(cell)}</td>`);
        for (let j = row.length; j < headers.length; j++) out.push("<td></td>");
        out.push("</tr>");
      }
      out.push("</tbody></table></ds-table>");
      continue;
    }

    if (line.startsWith(">")) {
      const bqLines = [];
      while (
        i < lines.length &&
        (lines[i].startsWith(">") ||
          (lines[i].trim() !== "" && bqLines.length > 0))
      ) {
        bqLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
        if (i < lines.length && lines[i].trim() === "") break;
      }
      out.push(`<blockquote>${mdToHtml(bqLines.join("\n"))}</blockquote>`);
      continue;
    }

    if (/^[-*+]\s/.test(line)) {
      const items = [];
      while (
        i < lines.length &&
        (/^[-*+]\s/.test(lines[i]) ||
          (lines[i].startsWith("  ") && items.length > 0))
      ) {
        if (/^[-*+]\s/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*+]\s/, ""));
        } else {
          items[items.length - 1] += " " + lines[i].trim();
        }
        i++;
      }
      out.push("<ul>");
      for (const item of items) out.push(`<li>${processInline(item)}</li>`);
      out.push("</ul>");
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (
        i < lines.length &&
        (/^\d+\.\s/.test(lines[i]) ||
          (lines[i].startsWith("  ") && items.length > 0))
      ) {
        if (/^\d+\.\s/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s/, ""));
        } else {
          items[items.length - 1] += " " + lines[i].trim();
        }
        i++;
      }
      out.push("<ol>");
      for (const item of items) out.push(`<li>${processInline(item)}</li>`);
      out.push("</ol>");
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|```|---|\||[-*+]\s|\d+\.\s|>)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      out.push(`<p>${processInline(paraLines.join(" "))}</p>`);
      continue;
    }

    i++;
  }

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Extract page headings for TOC
// ---------------------------------------------------------------------------

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
