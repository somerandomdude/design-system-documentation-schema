#!/usr/bin/env node
/**
 * build-site.js — Schema-driven site generator for the DSDS specification.
 *
 * Auto-discovers JSON Schema files from the schema directory structure and
 * generates one HTML page per schema file. Each page documents the definitions
 * within that file with property tables, type references, and cross-references.
 *
 * The overview page (dsds-spec.md) is still rendered from markdown.
 *
 * Usage:
 *   node scripts/build-site.js
 *
 * Output:
 *   site/dist/  — The generated static site
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { buildSpecNav, DIR_GROUPS } = require("./nav");
const { buildSamples } = require("./build-samples");

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

function esc(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .toLowerCase();
}

function linkToRef(ref) {
  if (!ref) return null;
  const match = ref.match(/\$defs\/(\w+)/);
  return match ? match[1] : null;
}

/**
 * Build a definition index from the discovered pages.
 * Maps: defName -> { pageSlug, filename }
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
// ---------------------------------------------------------------------------

/**
 * Produce a human-readable type string from a property schema.
 */
function describeType(prop) {
  if (!prop || typeof prop !== "object") return "any";

  // $ref
  if (prop.$ref) {
    const defName = linkToRef(prop.$ref);
    if (defName) {
      const target = DEF_INDEX[defName];
      if (target) {
        return `<ds-type-ref href="${target.pageSlug}.html#${slug(defName)}">${esc(defName)}</ds-type-ref>`;
      }
      return `<ds-code inline>${esc(defName)}</ds-code>`;
    }
    return `<ds-code inline>$ref</ds-code>`;
  }

  // oneOf
  if (prop.oneOf) {
    const parts = prop.oneOf.map((alt) => describeType(alt));
    return parts.join(" | ");
  }

  // anyOf
  if (prop.anyOf) {
    const parts = prop.anyOf.map((alt) => describeType(alt));
    return parts.join(" | ");
  }

  // array
  if (prop.type === "array") {
    if (prop.items) {
      const itemType = describeType(prop.items);
      return `${itemType}[]`;
    }
    return "array";
  }

  // object with additionalProperties
  if (prop.type === "object" && prop.additionalProperties) {
    if (typeof prop.additionalProperties === "object") {
      const valType = describeType(prop.additionalProperties);
      return `map&lt;string, ${valType}&gt;`;
    }
    return "object (open)";
  }

  // object with properties (inline sub-object)
  if (prop.type === "object" && prop.properties) {
    return "object";
  }

  // const
  if (prop.const !== undefined) {
    return `<ds-code inline>"${esc(String(prop.const))}"</ds-code>`;
  }

  // enum
  if (prop.enum) {
    return prop.enum
      .map((v) => `<ds-code inline>"${esc(String(v))}"</ds-code>`)
      .join(" | ");
  }

  // string with format
  if (prop.type === "string" && prop.format) {
    return `string (${esc(prop.format)})`;
  }

  // simple type
  if (prop.type) {
    return esc(prop.type);
  }

  // description-only (no type constraint, e.g., "value" that accepts any JSON)
  if (prop.description) {
    return "any";
  }

  return "any";
}

// ---------------------------------------------------------------------------
// Property table rendering
// ---------------------------------------------------------------------------

/**
 * Render a property table for a definition's properties.
 */
function renderPropertyTable(defSchema) {
  const properties = defSchema.properties;
  if (!properties || Object.keys(properties).length === 0) return "";

  const required = new Set(defSchema.required || []);

  // Collect anyOf/required constraints to identify "at least one" groups
  const anyOfGroups = [];
  if (defSchema.anyOf) {
    for (const alt of defSchema.anyOf) {
      if (alt.required && Array.isArray(alt.required)) {
        anyOfGroups.push(alt.required);
      }
    }
  }
  // Build a set of all property names that participate in anyOf constraints
  const anyOfProps = new Set();
  for (const group of anyOfGroups) {
    for (const name of group) {
      anyOfProps.add(name);
    }
  }

  // Build <ds-prop> children for <ds-prop-table>
  const propElements = [];
  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.has(propName);
    const isAnyOf = anyOfProps.has(propName);
    const typeStr = describeType(propSchema);
    const desc = propSchema.description || "";

    // Build description with supplementary notes
    let descHtml = esc(desc);

    if (propSchema.enum && propSchema.enum.length > 8) {
      descHtml += `<br><small>Values: ${propSchema.enum.map((v) => `<ds-code inline>${esc(String(v))}</ds-code>`).join(", ")}</small>`;
    }
    if (propSchema.pattern) {
      descHtml += `<br><small>Pattern: <ds-code inline>${esc(propSchema.pattern)}</ds-code></small>`;
    }
    if (propSchema.minItems) {
      descHtml += `<br><small>Min items: ${propSchema.minItems}</small>`;
    }
    if (propSchema.default !== undefined) {
      const defaultVal =
        typeof propSchema.default === "string"
          ? `"${esc(propSchema.default)}"`
          : String(propSchema.default);
      descHtml += `<br><small>Default: <ds-code inline>${defaultVal}</ds-code></small>`;
    }
    if (
      propSchema.type === "array" &&
      propSchema.items &&
      propSchema.items.format
    ) {
      descHtml += `<br><small>Format: ${esc(propSchema.items.format)}</small>`;
    }

    // Determine sort order and status attribute
    let sortOrder;
    let statusAttr = "";
    if (isRequired) {
      statusAttr = " required";
      sortOrder = 0;
    } else if (isAnyOf) {
      statusAttr = " conditional";
      sortOrder = 1;
    } else {
      sortOrder = 2;
    }

    propElements.push({
      sortOrder,
      html:
        `<ds-prop name="${esc(propName)}" type="${esc(typeStr)}"${statusAttr}>` +
        descHtml +
        `</ds-prop>`,
    });
  }

  // Stable sort: required → conditional → optional, preserving original order within each group
  propElements.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    `<ds-prop-table>\n` +
    propElements.map((p) => `  ${p.html}`).join("\n") +
    `\n</ds-prop-table>`
  );
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
              `<li><a href="${target.slug}.html#${slug(refName)}">${esc(refName)}</a></li>`,
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
 * Render a full page body for a single schema file.
 */
function renderSchemaPage(page) {
  const parts = [];
  const defs = page.data.$defs || {};
  const defNames = Object.keys(defs);
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

function pageHtml(title, activeSlug, bodyHtml, hasToc, pages, layout) {
  const layoutCls = layout === "full" ? " content--full" : "";
  const tocCls = hasToc ? " content--with-toc" : "";
  const contentCls = "content" + layoutCls + tocCls;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — DSDS 0.1</title>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="style.css">
  <script src="components.js"></script>
</head>
<body>
${buildSpecNav(activeSlug, pages)}
  <div class="${contentCls}">
    <main class="content__main" role="main">
      <div class="content__inner">
        ${bodyHtml}

        <ds-back-to-top></ds-back-to-top>

        <ds-footer>
          <p>Design System Documentation Standard (DSDS) 0.1 — Draft Specification</p>
          <p><a href="https://github.com/somerandomdude/design-system-documentation-schema">GitHub</a></p>
        </ds-footer>
      </div>
    </main>
    ${hasToc && layout !== "full" ? '<ds-toc target=".content__inner" selector="h2[id], h3[id]"></ds-toc>' : ""}
  </div>
  <script src="agentation-bundle.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

async function build() {
  console.log("Building DSDS specification site (schema-driven)...\n");

  // Clean and create dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

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

  // Copy stylesheet
  fs.copyFileSync(
    path.join(SITE_DIR, "style.css"),
    path.join(DIST_DIR, "style.css"),
  );

  // Build agentation bundle
  try {
    execSync("node build-agentation.mjs", { cwd: SITE_DIR, stdio: "pipe" });
    console.log("  Bundled agentation → agentation-bundle.js");
  } catch (err) {
    console.error(
      "  ⚠  Agentation bundle failed:",
      err.stderr?.toString().trim() || err.message,
    );
  }

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
