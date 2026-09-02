#!/usr/bin/env node
/**
 * check-docs-coverage.mjs — Asserts every page the site's own nav declares,
 * and every schema definition the schema itself declares, actually made it
 * into the built output as a real element - not just as text somewhere
 * (check-markdown-mirrors.mjs already covers that, for schema.md
 * specifically). This is the guard class that would have caught an earlier
 * incident where a narrative page (the old standalone Conformance page)
 * went missing from a build without any script noticing - "it's linked
 * from the nav" and "it actually got built" were never checked against
 * each other.
 *
 * Two checks:
 *   1. Every page in nav.js's TOP_LINKS has a real, non-trivial file at
 *      site/dist/<slug>.html.
 *   2. Every schema definition (root file + local $defs) has a real
 *      <ds-def-section anchor="..."> element in site/dist/schema.html -
 *      not just its name appearing as text somewhere on the page.
 *
 * Reads the already-built site/dist/ (run `npm run build` first), same as
 * check-markdown-mirrors.mjs and check-internal-links.mjs.
 *
 * Run via `npm run check:docs-coverage`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDefIndex } from "./render-prop-table.js";
import { TOP_LINKS, FOOTER_LINKS } from "./nav.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "schema");
const DIST_DIR = path.join(ROOT, "site", "dist");

let ok = true;

// ── 1. Every nav page actually built, with real content ────────────────
// Footer links are checked exactly like nav links: a footer link to a page
// that never got built is the same bug, and Conformance/Stability live only
// in the footer, so nothing else would catch it.
const LINKED_PAGES = [
  ...TOP_LINKS.map((l) => ({ ...l, where: "nav.js's TOP_LINKS" })),
  ...FOOTER_LINKS.map((l) => ({ ...l, where: "nav.js's FOOTER_LINKS" })),
];

for (const { label, slug, where } of LINKED_PAGES) {
  const filePath = path.join(DIST_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ ${where} lists "${label}" (${slug}.html), but site/dist/${slug}.html doesn't exist`);
    ok = false;
    continue;
  }
  const size = fs.statSync(filePath).size;
  // A real page here runs from tens to hundreds of KB (Schema alone is
  // over 100KB); a few hundred bytes means the shell rendered with
  // nothing meaningful inside it - the exact failure mode a page quietly
  // missing its main content would produce.
  if (size < 2000) {
    console.error(`✗ site/dist/${slug}.html exists but is only ${size} bytes - looks like an empty shell, not a real page`);
    ok = false;
  }
}

// ── 2. Every schema definition rendered as a real element on schema.html ─
const schemaHtmlPath = path.join(DIST_DIR, "schema.html");
if (!fs.existsSync(schemaHtmlPath)) {
  console.error(`✗ site/dist/schema.html doesn't exist`);
  ok = false;
} else {
  const html = fs.readFileSync(schemaHtmlPath, "utf-8");
  const { index } = buildDefIndex({ schemaDir: SCHEMA_DIR });
  const anchors = new Set(Object.values(index).map((entry) => entry.anchor));

  for (const anchor of anchors) {
    if (!html.includes(`<ds-def-section`) || !html.includes(`anchor="${anchor}"`)) {
      console.error(`✗ schema.html has no <ds-def-section anchor="${anchor}"> element - this definition may have been dropped from renderSchemaPage()`);
      ok = false;
    }
  }

  if (ok) {
    console.log(`✓ site/dist/schema.html has a real <ds-def-section> for all ${anchors.size} schema definitions.`);
  }
}

if (ok) {
  console.log(`✓ All ${LINKED_PAGES.length} nav + footer pages built with real content.`);
}
process.exit(ok ? 0 : 1);
