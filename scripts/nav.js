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

// Reference pages that belong to the spec but aren't part of the reading
// path the top nav describes. Conformance and Stability are the spec's own
// normative and forward-looking halves - cited constantly, read start to
// finish rarely - so they live in the footer rather than competing with the
// four pages someone actually works through in order.
//
// Same shape as TOP_LINKS on purpose: scripts/check-docs-coverage.mjs
// asserts every page in BOTH lists actually got built with real content, so
// a footer link can't rot into a 404 any more than a nav link can.
const FOOTER_LINKS = [
  { label: "Conformance", href: "conformance.html", slug: "conformance" },
  { label: "Stability", href: "stability.html", slug: "stability" },
  { label: "Security", href: "security.html", slug: "security" },
  { label: "Examples", href: "examples.html", slug: "examples" },
];

// Machine-readable entry points, and the repo. Not pages this site builds,
// so deliberately not covered by check-docs-coverage.mjs's build assertion -
// but check-internal-links.mjs does resolve the ones that are local files.
const FOOTER_RESOURCES = [
  { label: "llms.txt", href: "llms.txt" },
  { label: "AGENTS.md", href: "AGENTS.md" },
  { label: "manifest.json", href: "manifest.json" },
];

const REPO_URL = "https://github.com/somerandomdude/design-system-documentation-schema";

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

/**
 * Build the site footer: the spec's reference pages, its machine-readable
 * entry points, and the repo.
 *
 * Plain semantic HTML, no custom element - a footer is the one thing on
 * every page that a no-JS reader (and a crawler that doesn't run JS) should
 * never have to hydrate to see, and it has no behaviour worth a component.
 *
 * @param {string} [version] Override the spec version; derived when omitted.
 * @returns {string}
 */
function buildFooter(version) {
  const v = version || readSpecVersion() || "";
  const link = ({ label, href }) => `<a href="${esc(href)}">${esc(label)}</a>`;

  return [
    `  <footer class="site-footer">`,
    `    <div class="site-footer__inner">`,
    `      <nav class="site-footer__group" aria-label="Specification">`,
    `        <h2 class="site-footer__heading">Specification</h2>`,
    ...FOOTER_LINKS.map((l) => `        ${link(l)}`),
    `      </nav>`,
    `      <nav class="site-footer__group" aria-label="For machines">`,
    `        <h2 class="site-footer__heading">For machines</h2>`,
    ...FOOTER_RESOURCES.map((l) => `        ${link(l)}`),
    `      </nav>`,
    `      <nav class="site-footer__group" aria-label="Project">`,
    `        <h2 class="site-footer__heading">Project</h2>`,
    `        <a href="${esc(REPO_URL)}">GitHub</a>`,
    `        <a href="${esc(REPO_URL)}/blob/main/CHANGELOG">Changelog</a>`,
    `      </nav>`,
    `    </div>`,
    `    <p class="site-footer__meta">Design System Doc Spec${v ? ` ${esc(v)}` : ""} · Apache-2.0</p>`,
    `  </footer>`,
  ].join("\n");
}

module.exports = {
  buildNavChildren,
  buildSpecNav,
  buildFooter,
  readSpecVersion,
  TOP_LINKS,
  FOOTER_LINKS,
  FOOTER_RESOURCES,
  REPO_URL,
  DIR_GROUPS,
  ROOT_FILES,
};
