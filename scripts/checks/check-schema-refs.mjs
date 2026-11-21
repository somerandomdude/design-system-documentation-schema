#!/usr/bin/env node
/**
 * Every reference on the schema page links to the definition it names. Checks the built
 * schema page (site/dist/schema.html) and its Markdown mirror (site/dist/schema.md):
 *
 *   - a "References:" list has no plain text in it: each name is a link;
 *   - each link's anchor exists on the page (an id in the HTML, a {#id} heading in the mirror).
 *
 * Run via `npm run check:docs`, after `npm run build`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "..", "site", "dist");

let failures = 0;
const SHOW = 12;
const fail = (msg) => {
  if (failures < SHOW) console.error(`✗ ${msg}`);
  failures++;
};

const html = fs.readFileSync(path.join(DIST_DIR, "schema.html"), "utf-8");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let links = 0;
const refBlocks = [...html.matchAll(/<ds-cross-refs>([\s\S]*?)<\/ds-cross-refs>/g)];
for (const [, body] of refBlocks) {
  const plain = body.replace(/<ds-type-ref\b[^>]*>[\s\S]*?<\/ds-type-ref>/g, "").replace(/<strong>[\s\S]*?<\/strong>/g, "").replace(/[,\s]/g, "");
  if (plain) {
    const text = body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    fail(`schema.html has a reference that isn't a link: "${text.slice(0, 120)}"`);
  }
  for (const [, anchor] of body.matchAll(/href="schema\.html#([^"]+)"/g)) {
    links++;
    if (!ids.has(anchor)) fail(`schema.html links to #${anchor}, which isn't on the page`);
  }
}

const md = fs.readFileSync(path.join(DIST_DIR, "schema.md"), "utf-8");
const headingIds = new Set([...md.matchAll(/\{#([^}]+)\}/g)].map((m) => m[1]));
for (const [, anchor] of md.matchAll(/\]\(schema\.md#([^)\s]+)\)/g)) {
  links++;
  if (!headingIds.has(anchor)) fail(`schema.md links to #${anchor}, which has no heading`);
}

if (failures) {
  if (failures > SHOW) console.error(`… and ${failures - SHOW} more.`);
  console.error(`\n${failures} problem(s) with references on the schema page.`);
  process.exit(1);
}
console.log(`✓ Every reference on the schema page links to its definition: ${refBlocks.length} reference list(s), ${links} link(s) checked.`);
