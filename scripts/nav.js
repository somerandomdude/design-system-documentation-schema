/**
 * Shared navigation builder for the DSDS spec site.
 *
 * Produces the light-DOM children markup expected by <ds-spec-nav> — now a
 * flat top bar over 4 pages (Overview, Quick start, Extending, Schema), not
 * a grouped sidebar over 23+ schema-reference pages the way it used to be:
 * every schema definition now lives on the one Schema page instead of its
 * own page, so there's nothing left to group.
 *
 * Usage:
 *   const { buildSpecNav } = require("./nav");
 *   const navHtml = buildSpecNav("index");
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "schema");

// Root-level schema files (schema/base.schema.yaml, schema/shared.schema.yaml)
// that aren't inside one of DIR_GROUPS's subdirectories. Still used by
// build-site.js's own discoverPages()/versioned-mirror logic - unrelated to
// the nav now, but this constant name predates the nav simplification and
// other code still imports it from here.
const ROOT_FILES = ["base.schema.yaml", "shared.schema.yaml"];

// Subdirectories of schema/ that build-site.js walks to discover schema
// files and mirror them into site/dist/v<n>/ for $ref resolution. `primary`,
// when set, is the group's own open-base file (e.g. entry.schema.yaml, the
// base every kind in entries/ extends) — pinned first in that group's
// def-section order on the Schema page, ahead of the rest, which stay
// alphabetical.
const DIR_GROUPS = [
  { dir: "common", label: "Common" },
  { dir: "metadata", label: "Metadata", primary: "metadata" },
  { dir: "entries", label: "Entries", primary: "entry" },
  { dir: "sections", label: "Sections", primary: "section" },
];

// The site's entire nav, now that every schema definition lives on one
// Schema page instead of its own.
const TOP_LINKS = [
  { label: "Overview", href: "index.html", slug: "index" },
  { label: "Quick start", href: "quickstart.html", slug: "quickstart" },
  { label: "Extending the schema", href: "extending.html", slug: "extending" },
  { label: "Schema", href: "schema.html", slug: "schema" },
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
 * Build the light-DOM children for <ds-spec-nav> — just the 4 top links now.
 *
 * @param {string} activeSlug  — slug of the current page (for active highlight)
 * @returns {string} HTML string of <a> elements
 */
function buildNavChildren(activeSlug) {
  return TOP_LINKS.map(
    (link) =>
      `    <a href="${esc(link.href)}" slug="${esc(link.slug)}">${esc(link.label)}</a>`,
  ).join("\n");
}

/**
 * Read the current spec version from `schema/dsds.bundled.yaml`'s own
 * `$id` (ex: "https://designsystemdocspec.org/v0.20.0/dsds.bundled.yaml")
 * so the nav title, page <title> tags, and footer text always reflect what
 * the working tree says is current. This is the single source of truth for
 * "what version is the site at" — scripts/bundle.js writes that same `$id`.
 * Matched directly against the raw file text (no parse) so this keeps
 * working regardless of which text format the bundle happens to be in.
 */
function readSpecVersion() {
  try {
    const bundledPath = path.join(SCHEMA_DIR, "dsds.bundled.yaml");
    const raw = fs.readFileSync(bundledPath, "utf-8");
    const match = /\/v([^/\s"']+)\/dsds\.bundled\.yaml/.exec(raw);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Return the complete <ds-spec-nav> block ready to drop into a page <body>.
 * The mobile menu toggle is built into <ds-spec-nav> itself, not a
 * separate element.
 *
 * @param {string} activeSlug
 * @param {Array}  [pages]     Unused now (kept for call-site compatibility;
 *                              the nav no longer varies by page list).
 * @param {string} [version]  Override the spec version. When omitted,
 *                            derived from dsds.schema.json.
 * @returns {string}
 */
function buildSpecNav(activeSlug, pages, version) {
  const children = buildNavChildren(activeSlug);
  const v = version || readSpecVersion() || "";
  const navTitle = v
    ? `Design System Doc Spec ${v}`
    : "Design System Doc Spec";

  return (
    `  <ds-spec-nav title="${esc(navTitle)}" title-href="index.html" active="${esc(activeSlug)}">\n` +
    children +
    `\n  </ds-spec-nav>`
  );
}

module.exports = {
  buildNavChildren,
  buildSpecNav,
  readSpecVersion,
  TOP_LINKS,
  DIR_GROUPS,
  ROOT_FILES,
};
