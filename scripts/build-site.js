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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.join(ROOT, "spec");
const SCHEMA_DIR = path.join(SPEC_DIR, "schema");
const SITE_DIR = path.join(ROOT, "site");
const DIST_DIR = path.join(SITE_DIR, "dist");
const EXAMPLES_DIR = path.join(SPEC_DIR, "examples");

// ---------------------------------------------------------------------------
// Schema directory groups — defines the nav hierarchy
//
// Each group corresponds to a subdirectory under spec/schema/.
// Schema files within each directory are auto-discovered.
// ---------------------------------------------------------------------------

const DIR_GROUPS = [
  { dir: "common", label: "Common" },
  { dir: "entities", label: "Entities" },
  { dir: "guidelines", label: "Guidelines" },
];

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
      group: null,
      groupLabel: null,
      filename: "dsds.schema.json",
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
        return `<a href="${target.pageSlug}.html#${slug(defName)}" class="type-ref">${esc(defName)}</a>`;
      }
      return `<code>${esc(defName)}</code>`;
    }
    return `<code>$ref</code>`;
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
    return `<code>"${esc(String(prop.const))}"</code>`;
  }

  // enum
  if (prop.enum) {
    return prop.enum.map((v) => `<code>"${esc(String(v))}"</code>`).join(" | ");
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

  // Build row objects so we can sort them: required first, then at-least-one, then optional
  const rowObjects = [];
  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.has(propName);
    const isAnyOf = anyOfProps.has(propName);
    const typeStr = describeType(propSchema);
    const desc = propSchema.description || "";

    // Check for enum values to show
    let enumNote = "";
    if (propSchema.enum && propSchema.enum.length <= 8) {
      // Already shown in type for small enums
    } else if (propSchema.enum) {
      enumNote = `<br><small>Values: ${propSchema.enum.map((v) => `<code>${esc(String(v))}</code>`).join(", ")}</small>`;
    }

    // Check for pattern
    let patternNote = "";
    if (propSchema.pattern) {
      patternNote = `<br><small>Pattern: <code>${esc(propSchema.pattern)}</code></small>`;
    }

    // Check for minItems
    let minNote = "";
    if (propSchema.minItems) {
      minNote = `<br><small>Min items: ${propSchema.minItems}</small>`;
    }

    // Check for format on items
    let formatNote = "";
    if (
      propSchema.type === "array" &&
      propSchema.items &&
      propSchema.items.format
    ) {
      formatNote = `<br><small>Format: ${esc(propSchema.items.format)}</small>`;
    }

    let statusCell;
    let sortOrder;
    if (isRequired) {
      statusCell = '<span class="required-badge">required</span>';
      sortOrder = 0;
    } else if (isAnyOf) {
      statusCell = '<span class="conditional-badge">at least one</span>';
      sortOrder = 1;
    } else {
      statusCell = "optional";
      sortOrder = 2;
    }

    rowObjects.push({
      sortOrder,
      html:
        `<tr>` +
        `<td><code>${esc(propName)}</code></td>` +
        `<td>${typeStr}</td>` +
        `<td>${statusCell}</td>` +
        `<td>${esc(desc)}${enumNote}${patternNote}${minNote}${formatNote}</td>` +
        `</tr>`,
    });
  }

  // Stable sort: required → at least one → optional, preserving original order within each group
  rowObjects.sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = rowObjects.map((r) => r.html);

  return (
    `<table class="prop-table">` +
    `<thead><tr><th>Property</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>` +
    `<tbody>${rows.join("\n")}</tbody>` +
    `</table>`
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

  // Heading
  parts.push(`<section class="def-section" id="${hid}">`);
  parts.push(`<h3 id="${hid}">${esc(defName)}</h3>`);

  // Description
  if (defSchema.description) {
    parts.push(`<p class="def-description">${esc(defSchema.description)}</p>`);
  }

  // Type badge
  if (defSchema.type) {
    parts.push(
      `<p class="def-type"><span class="type-badge">${esc(defSchema.type)}</span></p>`,
    );
  }

  // If it's a simple string (like status), show that
  if (defSchema.type === "string" && !defSchema.properties) {
    if (defSchema.enum) {
      parts.push(`<p><strong>Allowed values:</strong></p>`);
      parts.push(`<ul class="enum-list">`);
      for (const val of defSchema.enum) {
        parts.push(`<li><code>${esc(String(val))}</code></li>`);
      }
      parts.push(`</ul>`);
    }
    parts.push(`</section>`);
    return parts.join("\n");
  }

  // If it's a oneOf (like richText), show the alternatives
  if (defSchema.oneOf) {
    parts.push(`<p><strong>Accepts one of:</strong></p>`);
    parts.push(`<ul class="oneof-list">`);
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
            parts.push(`<li><code>${esc(refName)}</code></li>`);
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
      `<p><strong>Open map:</strong> keys are strings, values are <code>${esc(defSchema.additionalProperties.type || "any")}</code></p>`,
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
        alt.required.map((r) => `<code>${esc(r)}</code>`).join(", "),
      );
      parts.push(
        `<p class="conditional-note"><strong>Constraint:</strong> At least one of ${propNames.join(", ")} must be present.</p>`,
      );
    } else {
      // Mixed anyOf — show each branch
      parts.push(`<p><strong>Constraints:</strong> at least one of:</p>`);
      parts.push(`<ul>`);
      for (const alt of defSchema.anyOf) {
        if (alt.required) {
          parts.push(
            `<li>${alt.required.map((r) => `<code>${esc(r)}</code>`).join(", ")} must be present</li>`,
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
          `<code>${esc(k)}</code> is <code>"${esc(String(v.const || ""))}"</code>`,
      )
      .join(" and ");
    const requirements = thenReq
      .map((r) => `<code>${esc(r)}</code>`)
      .join(", ");
    if (conditions && requirements) {
      parts.push(
        `<p class="conditional-note"><strong>Conditional:</strong> When ${conditions}, then ${requirements} is required.</p>`,
      );
    }
  }

  // Cross-references: list all $ref targets in this definition
  const refs = collectRefs(defSchema);
  if (refs.length > 0) {
    parts.push(`<p class="cross-refs"><strong>References:</strong> `);
    const refLinks = refs.map((refName) => {
      const target = DEF_INDEX[refName];
      if (target) {
        return `<a href="${target.pageSlug}.html#${slug(refName)}">${esc(refName)}</a>`;
      }
      return `<code>${esc(refName)}</code>`;
    });
    parts.push(refLinks.join(", "));
    parts.push(`</p>`);
  }

  // Example — render the matching example if one was provided
  if (exampleData !== undefined && exampleData !== null) {
    parts.push(`<div class="def-example">`);
    parts.push(`<p class="def-example__title"><strong>Example</strong></p>`);
    const jsonStr = JSON.stringify(exampleData, null, 2);
    parts.push(`<pre><code class="language-json">${esc(jsonStr)}</code></pre>`);
    parts.push(`</div>`);
  }

  parts.push(`</section>`);
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

  // Page title
  parts.push(`<h1>${esc(page.title)}</h1>`);

  // Schema description
  if (page.data.description) {
    parts.push(
      `<p class="schema-description">${esc(page.data.description)}</p>`,
    );
  }

  // Source file
  const relPath = page.group ? `${page.group}/${page.filename}` : page.filename;
  parts.push(
    `<p class="schema-source">Source: <code>${esc(relPath)}</code></p>`,
  );

  // Always render top-level properties when they exist (e.g., the root schema
  // has both its own properties AND $defs like documentationGroup)
  if (page.data.properties) {
    parts.push(`<h2 id="properties-heading">Root Properties</h2>`);
    parts.push(renderPropertyTable(page.data));
  }

  if (defNames.length === 0) {
    return parts.join("\n");
  }

  // Definition index (if more than one definition)
  if (defNames.length > 1) {
    parts.push(`<nav class="page-def-index">`);
    parts.push(
      `<p><strong>${defNames.length} definitions</strong> in this file:</p>`,
    );
    parts.push(`<ul>`);
    for (const defName of defNames) {
      parts.push(
        `<li><a href="#${slug(defName)}"><code>${esc(defName)}</code></a></li>`,
      );
    }
    parts.push(`</ul>`);
    parts.push(`</nav>`);
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

function renderOverviewPage() {
  const overviewPath = path.join(SPEC_DIR, "dsds-spec.md");
  if (!fs.existsSync(overviewPath)) {
    return "<h1>DSDS Specification</h1><p>Overview not found.</p>";
  }
  const mdText = fs.readFileSync(overviewPath, "utf-8");
  let body = mdToHtml(mdText);

  body = body.replace(
    "<h1",
    '<div class="spec-header"><h1 class="spec-header__title"',
  );
  body = body.replace("</h1>", ' <span class="badge">Draft</span></h1>');

  // Rewrite .md links to page slugs
  body = body.replace(/href="modules\/(\w+)\.md"/g, (match, name) => {
    // Map old module names to new schema-driven page slugs
    return `href="index.html"`;
  });

  return body;
}

// ---------------------------------------------------------------------------
// Minimal Markdown → HTML converter (for overview page only)
// ---------------------------------------------------------------------------

function processInline(text) {
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
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
      const langAttr = lang ? ` class="language-${lang}"` : "";
      out.push(`<pre><code${langAttr}>${codeText}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      const hid = mdHeadingId(text);
      out.push(`<h${level} id="${hid}">${text}</h${level}>`);
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
      out.push("<table><thead><tr>");
      for (const h of headers) out.push(`<th>${processInline(h)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const row of rows) {
        out.push("<tr>");
        for (const cell of row) out.push(`<td>${processInline(cell)}</td>`);
        for (let j = row.length; j < headers.length; j++) out.push("<td></td>");
        out.push("</tr>");
      }
      out.push("</tbody></table>");
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

function extractToc(bodyHtml) {
  const toc = [];
  const re = /<h([23])\s+id="([^"]+)">(.+?)<\/h\1>/g;
  let m;
  while ((m = re.exec(bodyHtml)) !== null) {
    toc.push({
      id: m[2],
      text: m[3].replace(/<[^>]+>/g, ""),
      level: parseInt(m[1], 10),
    });
  }
  return toc;
}

function renderToc(toc) {
  if (toc.length === 0) return "";
  const parts = [
    '<nav class="toc" aria-label="On this page">',
    '<p class="toc__title">On this page</p>',
    '<ul class="toc__list">',
  ];
  for (const entry of toc) {
    let cls = "toc__link";
    if (entry.level === 3) cls += " toc__link--sub";
    parts.push(
      `<li><a class="${cls}" href="#${entry.id}">${esc(entry.text)}</a></li>`,
    );
  }
  parts.push("</ul>", "</nav>");
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Navigation builder — one link per schema file, grouped by directory
// ---------------------------------------------------------------------------

function buildNav(activeSlug, pages) {
  const parts = [];

  // Overview link
  const overviewActive = activeSlug === "index" ? " nav__link--active" : "";
  parts.push(
    `<a class="nav__link${overviewActive}" href="index.html">Overview</a>`,
  );

  // Root schema link
  const rootActive = activeSlug === "root" ? " nav__link--active" : "";
  parts.push(
    `<a class="nav__link${rootActive}" href="root.html">Root Schema</a>`,
  );

  // Group pages by directory
  const groups = new Map();
  for (const page of pages) {
    if (!page.group) continue; // root is handled above
    if (!groups.has(page.group)) {
      groups.set(page.group, { label: page.groupLabel, pages: [] });
    }
    groups.get(page.group).pages.push(page);
  }

  for (const [, group] of groups) {
    const hasActive = group.pages.some((p) => p.slug === activeSlug);
    const openCls = hasActive ? " nav__group--open" : "";
    const ariaExpanded = hasActive ? "true" : "false";

    parts.push(`<div class="nav__group${openCls}">`);
    parts.push(
      `<button class="nav__group-toggle" aria-expanded="${ariaExpanded}"` +
        ` onclick="this.parentElement.classList.toggle('nav__group--open');` +
        `this.setAttribute('aria-expanded', this.parentElement.classList.contains('nav__group--open'))">` +
        `<span class="nav__group-label">${esc(group.label)}</span>` +
        `<span class="nav__group-arrow">›</span>` +
        `</button>`,
    );
    parts.push('<div class="nav__group-children">');

    for (const page of group.pages) {
      const activeCls = page.slug === activeSlug ? " nav__link--active" : "";
      // Use the schema file basename as the nav label (without .schema.json)
      const navLabel = page.filename.replace(".schema.json", "");
      parts.push(
        `<a class="nav__link nav__link--child${activeCls}" href="${page.slug}.html">${esc(navLabel)}</a>`,
      );
    }

    parts.push("</div>", "</div>");
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Page template
// ---------------------------------------------------------------------------

function pageHtml(title, activeSlug, bodyHtml, tocHtml, pages) {
  const nav = buildNav(activeSlug, pages);
  const hasToc = tocHtml.trim().length > 0;
  const contentCls = hasToc ? "content content--with-toc" : "content";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} — DSDS 0.1</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <button class="nav-toggle" onclick="document.querySelector('.nav').classList.toggle('nav--open')" aria-label="Toggle navigation">☰ Menu</button>
  <nav class="nav" role="navigation" aria-label="Specification navigation">
    <div class="nav__title"><a href="index.html">DSDS 0.1</a></div>
    <div class="nav__items">
      ${nav}
    </div>
  </nav>
  <div class="${contentCls}">
    <main class="content__main" role="main">
      <div class="content__inner">
        ${bodyHtml}

        <a href="#" class="back-to-top">↑ Back to top</a>

        <div class="footer">
          <p>Design System Documentation Standard (DSDS) 0.1 — Draft Specification</p>
          <p><a href="https://github.com/somerandomdude/design-system-documentation-schema">GitHub</a></p>
        </div>
      </div>
    </main>
    ${tocHtml}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

function build() {
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

  // Copy stylesheet
  fs.copyFileSync(
    path.join(SITE_DIR, "style.css"),
    path.join(DIST_DIR, "style.css"),
  );

  // 1. Build the overview page (from markdown)
  const overviewBody = renderOverviewPage();
  const overviewToc = extractToc(overviewBody);
  const overviewHtml = pageHtml(
    "Overview",
    "index",
    overviewBody,
    renderToc(overviewToc),
    pages,
  );
  fs.writeFileSync(path.join(DIST_DIR, "index.html"), overviewHtml, "utf-8");
  console.log("  ✓  site/dist/index.html (from markdown)");

  // 2. Build one page per schema file
  for (const page of pages) {
    const body = renderSchemaPage(page);
    const toc = extractToc(body);
    const html = pageHtml(page.title, page.slug, body, renderToc(toc), pages);

    const outPath = path.join(DIST_DIR, `${page.slug}.html`);
    fs.writeFileSync(outPath, html, "utf-8");

    const relSource = page.group
      ? `${page.group}/${page.filename}`
      : page.filename;
    console.log(`  ✓  site/dist/${page.slug}.html  ← ${relSource}`);
  }

  console.log(`\nDone. ${pages.length + 1} pages built to site/dist/\n`);
}

build();
