/**
 * Shared navigation builder for the DSDS spec site: produces the light-DOM children markup
 * for <ds-spec-nav>, a flat top bar over 4 pages (Overview, Quick start, Extending, Schema) -
 * every schema definition now lives on the one Schema page, so there's nothing left to group.
 *
 * Usage: const { buildSpecNav } = require("./nav"); buildSpecNav("index");
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SCHEMA_DIR = path.join(ROOT, "schema");

// Root-level schema files that aren't inside one of DIR_GROUPS's subdirectories. Still used
// by build-site.js's discoverPages()/versioned-mirror logic - unrelated to the nav now, but
// other code still imports this constant from here.
const ROOT_FILES = ["base.schema.yaml", "shared.schema.yaml"];

// Subdirectories of schema/ that build-site.js walks to discover schema files and mirror them
// into site/dist/v<n>/. `primary`, when set, is the group's own open-base file, pinned first
// in that group's def-section order on the Schema page, ahead of the rest (alphabetical).
const DIR_GROUPS = [
  { dir: "common", label: "Common" },
  { dir: "metadata", label: "Metadata", primary: "metadata" },
  { dir: "entries", label: "Entries", primary: "entry" },
  { dir: "sections", label: "Sections", primary: "section" },
];

// The site's entire nav, now that every schema definition lives on one Schema page.
const TOP_LINKS = [
  { label: "Overview", href: "index.html", slug: "index" },
  { label: "Specification", href: "specification.html", slug: "specification" },
  { label: "Quick start", href: "quickstart.html", slug: "quickstart" },
  { label: "Extending the schema", href: "extending.html", slug: "extending" },
  { label: "Schema", href: "schema.html", slug: "schema" },
];

// Reference pages that belong to the spec but aren't part of the top nav's reading path -
// cited constantly, read start to finish rarely, so they live in the footer instead. Same
// fields as TOP_LINKS on purpose: check-docs-coverage.mjs asserts every page in both lists
// actually got built, so a footer link can't rot into a 404 any more than a nav link can.
const FOOTER_LINKS = [
  { label: "Conformance", href: "conformance.html", slug: "conformance" },
  { label: "Processing model", href: "processing.html", slug: "processing" },
  { label: "Stability", href: "stability.html", slug: "stability" },
  { label: "Interoperability", href: "interoperability.html", slug: "interoperability" },
  { label: "Security", href: "security.html", slug: "security" },
  { label: "Examples", href: "examples.html", slug: "examples" },
  { label: "Style guide", href: "style-guide.html", slug: "style-guide" },
];

// Who runs the site and how to reach them. Same fields, and covered by the same checks, as the
// lists above. They sit in the footer's Project group, not under Specification.
const PROJECT_LINKS = [
  { label: "About", href: "about.html", slug: "about" },
  { label: "Contact", href: "contact.html", slug: "contact" },
  { label: "Privacy", href: "privacy.html", slug: "privacy" },
];

// Machine-readable entry points, and the repo. Not pages this site builds, so deliberately
// not covered by check-docs-coverage.mjs - but check-internal-links.mjs resolves local files.
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

// Build the light-DOM children for <ds-spec-nav> - just the 4 top links now.
function buildNavChildren(activeSlug) {
  return TOP_LINKS.map(
    (link) =>
      `    <a href="${esc(link.href)}" slug="${esc(link.slug)}">${esc(link.label)}</a>`,
  ).join("\n");
}

// Reads the current spec version from schema/dsds.bundled.yaml's own `$id`, the single
// source of truth bundle.js also writes. Matched against raw file text (no parse) so this
// keeps working regardless of the bundle's text format.
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

// Returns the complete <ds-spec-nav> block ready to drop into a page <body>; the mobile menu
// toggle is built into <ds-spec-nav> itself. `pages` is unused now, kept for call-site
// compatibility; `version` overrides the derived spec version when passed.
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

// Builds the site footer: reference pages, machine-readable entry points, and the repo. Plain
// semantic HTML, no custom element - a footer should never require JS to hydrate to see.
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
    ...PROJECT_LINKS.map((l) => `        ${link(l)}`),
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
  PROJECT_LINKS,
  FOOTER_RESOURCES,
  REPO_URL,
  DIR_GROUPS,
  ROOT_FILES,
};
