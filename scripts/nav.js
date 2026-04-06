/**
 * Shared navigation builder for the DSDS spec site.
 *
 * Discovers schema pages from spec/schema/ and produces the light-DOM
 * children markup expected by <ds-spec-nav>.
 *
 * Usage:
 *   const { buildSpecNav } = require("./nav");
 *   const navHtml = buildSpecNav("index");
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");

// Subdirectories of spec/schema/ that become nav groups.
const DIR_GROUPS = [
  { dir: "documentation", label: "Documentation" },
  { dir: "common", label: "Common" },
  { dir: "entities", label: "Entities" },
  { dir: "guidelines", label: "Guidelines" },
];

// Top-level (non-schema-driven) links that always appear first.
const TOP_LINKS = [
  { label: "Overview", href: "index.html", slug: "index" },
  { label: "Quick start", href: "quickstart.html", slug: "quickstart" },
  {
    label: "Schema architecture",
    href: "schema-architecture.html",
    slug: "schema-architecture",
  },
  { label: "Interactive samples", href: "samples.html", slug: "samples" },
];

function esc(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Scan spec/schema/ and return a lightweight list of page descriptors
 * sufficient for building the nav: { slug, group, groupLabel, filename }.
 */
function discoverNavPages() {
  const pages = [];

  // Root schema goes into the "documentation" group
  const rootPath = path.join(SCHEMA_DIR, "dsds.schema.json");
  if (fs.existsSync(rootPath)) {
    pages.push({
      slug: "root",
      group: "documentation",
      groupLabel: "Documentation",
      filename: "dsds.schema.json",
      navLabel: "Root schema",
    });
  }

  for (const group of DIR_GROUPS) {
    // "documentation" group is populated above, not from a directory
    if (group.dir === "documentation") continue;

    const dirPath = path.join(SCHEMA_DIR, group.dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.json"))
      .sort();

    for (const filename of files) {
      const baseName = filename.replace(".schema.json", "");
      pages.push({
        slug: `${group.dir}-${baseName}`,
        group: group.dir,
        groupLabel: group.label,
        filename,
      });
    }
  }

  return pages;
}

/**
 * Build the light-DOM children for <ds-spec-nav>.
 *
 * @param {string} activeSlug  — slug of the current page (for active highlight)
 * @param {Array}  [pages]     — page descriptors; auto-discovered when omitted
 * @returns {string} HTML string of <a> and <ds-nav-group> elements
 */
function buildNavChildren(activeSlug, pages) {
  if (!pages) pages = discoverNavPages();

  const lines = [];

  for (const link of TOP_LINKS) {
    lines.push(
      `    <a href="${esc(link.href)}" slug="${esc(link.slug)}">${esc(link.label)}</a>`,
    );
  }

  // Group pages by directory
  const groups = new Map();
  for (const page of pages) {
    if (!page.group) continue;
    if (!groups.has(page.group)) {
      groups.set(page.group, { label: page.groupLabel, pages: [] });
    }
    groups.get(page.group).pages.push(page);
  }

  for (const [, group] of groups) {
    lines.push(`    <ds-nav-group label="${esc(group.label)}">`);
    for (const page of group.pages) {
      const label = page.navLabel || page.filename.replace(".schema.json", "");
      lines.push(
        `      <a href="${esc(page.slug)}.html" slug="${esc(page.slug)}">${esc(label)}</a>`,
      );
    }
    lines.push(`    </ds-nav-group>`);
  }

  return lines.join("\n");
}

/**
 * Return the complete <ds-nav-toggle> + <ds-spec-nav> block ready to drop
 * into a page <body>.
 *
 * @param {string} activeSlug
 * @param {Array}  [pages]
 * @returns {string}
 */
function buildSpecNav(activeSlug, pages) {
  const children = buildNavChildren(activeSlug, pages);

  return (
    `  <ds-nav-toggle target="ds-spec-nav"></ds-nav-toggle>\n` +
    `  <ds-spec-nav title="DSDS 0.1" title-href="index.html" active="${esc(activeSlug)}">\n` +
    children +
    `\n  </ds-spec-nav>`
  );
}

module.exports = {
  discoverNavPages,
  buildNavChildren,
  buildSpecNav,
  TOP_LINKS,
  DIR_GROUPS,
};
