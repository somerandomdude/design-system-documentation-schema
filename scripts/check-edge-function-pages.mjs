#!/usr/bin/env node
/**
 * check-edge-function-pages.mjs — Drift guard for
 * netlify/edge-functions/markdown-negotiation.js's page list.
 *
 * That edge function content-negotiates `Accept: text/markdown` on this
 * site's real pages, and its own header comment explains why its page list
 * (`PAGE_MD_PATH`) is a hand-written literal rather than something read from
 * nav.js at request time: an edge function is committed source Netlify's
 * deploy step discovers directly, not something `npm run build` produces
 * the way site/dist/ is - it has no access to nav.js's exports when a
 * request actually comes in.
 *
 * A hand-written copy of a list that already lives in nav.js is exactly the
 * kind of duplication that goes stale silently - add a page to
 * TOP_LINKS/FOOTER_LINKS (as Conformance/Stability/Security/Examples were)
 * and the edge function keeps negotiating only the old set, with no error
 * and no missing-page symptom a human would think to check for. This
 * doesn't regenerate the file (an edge function isn't a build artifact);
 * it fails loudly instead, the same shape check-docs-coverage.mjs already
 * uses for the nav itself.
 *
 * Run via `npm run check:docs`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOP_LINKS, FOOTER_LINKS } from "./nav.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EDGE_FN_PATH = path.join(ROOT, "netlify", "edge-functions", "markdown-negotiation.js");

let ok = true;

if (!fs.existsSync(EDGE_FN_PATH)) {
  console.error(`✗ ${path.relative(ROOT, EDGE_FN_PATH)} doesn't exist.`);
  process.exit(1);
}

const source = fs.readFileSync(EDGE_FN_PATH, "utf-8");
const match = source.match(/const PAGE_MD_PATH = new Map\(\[([\s\S]*?)\]\);/);
if (!match) {
  console.error(`✗ Couldn't find PAGE_MD_PATH in ${path.relative(ROOT, EDGE_FN_PATH)} — has its shape changed?`);
  process.exit(1);
}

const negotiatedPaths = new Set([...match[1].matchAll(/\["([^"]+)"/g)].map((m) => m[1]));

const expectedPaths = new Set(
  [...TOP_LINKS, ...FOOTER_LINKS].map(({ slug }) => (slug === "index" ? "/" : `/${slug}`)),
);

for (const p of expectedPaths) {
  if (!negotiatedPaths.has(p)) {
    console.error(
      `✗ nav.js links "${p}" but netlify/edge-functions/markdown-negotiation.js's PAGE_MD_PATH doesn't negotiate it — an agent sending Accept: text/markdown to this page silently gets HTML instead.`,
    );
    ok = false;
  }
}
for (const p of negotiatedPaths) {
  if (!expectedPaths.has(p)) {
    console.error(
      `✗ netlify/edge-functions/markdown-negotiation.js's PAGE_MD_PATH negotiates "${p}", which nav.js's TOP_LINKS/FOOTER_LINKS no longer lists — a removed/renamed page left behind.`,
    );
    ok = false;
  }
}

if (ok) {
  console.log(`✓ Edge function negotiates all ${expectedPaths.size} nav + footer pages, and no others.`);
}
process.exit(ok ? 0 : 1);
