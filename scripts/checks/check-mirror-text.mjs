#!/usr/bin/env node
/**
 * Every page's Markdown mirror (site/dist/<slug>.md) has the same words as the page
 * (site/dist/<slug>.html). An agent that reads the mirror shouldn't miss a section a person
 * sees.
 *
 * Each text block in the page's <main> (paragraphs, list items, headings, table cells, code
 * blocks, quotes) must appear in the mirror's text, after both are normalised the same way:
 * entities decoded, markup and link targets removed, case folded, and every run of
 * non-letters and non-digits made one space. Punctuation and formatting differences don't
 * count; a missing word does.
 *
 * Run via `npm run check:docs`, after `npm run build`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DIST_DIR = path.join(ROOT, "site", "dist");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…" };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name] ?? m);

const normalise = (s) => decode(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Text inside a block element, with nested markup removed.
const BLOCKS = /<(p|li|h[1-6]|td|th|dt|dd|blockquote|ds-code|pre)\b[^>]*>([\s\S]*?)<\/\1>/gi;

function pageBlocks(html) {
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!main) return null;
  const body = main
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(template|style|script)\b[\s\S]*?<\/\1>/gi, "");
  const blocks = [];
  // A property table's rows are checked one property at a time. Its name and type are table cells,
  // so the whole table's text never reads the same as a list item's.
  for (const [, inner] of body.matchAll(/<ds-prop\b[^>]*>([\s\S]*?)<\/ds-prop>/g)) {
    const text = normalise(inner.replace(/<[^>]+>/g, " "));
    if (text) blocks.push(text);
  }
  const outside = body.replace(/<ds-prop-table\b[\s\S]*?<\/ds-prop-table>/g, "");
  for (const [, , inner] of outside.matchAll(BLOCKS)) {
    const text = normalise(inner.replace(/<[^>]+>/g, " "));
    if (text) blocks.push(text);
  }
  return blocks;
}

// Markdown's own syntax is dropped, the way a browser drops it: link targets, HTML tags and
// fence lines. Link targets stay inside a code span, since there they're text. `<dsds:…>` is
// an inline link's text, so it stays too: it isn't an HTML tag name.
// Fenced blocks are code, and code is text, so their link-looking syntax stays too.
function mirrorText(md) {
  const withoutLinkTargets = (s) => s.replace(/\]\([^)]*\)/g, "]");
  const stripProse = (s) =>
    s
      .split(/(`[^`\n]*`)/)
      .map((part, i) => (i % 2 === 1 ? part : withoutLinkTargets(part)))
      .join("");
  const pieces = md.split(/^\s*```[^\n]*\n([\s\S]*?)^\s*```\s*$/m);
  // List markers (`1.`, `-`) are layout, not words; a page's list has none.
  const text = pieces
    .map((piece, i) => (i % 2 === 1 ? piece : stripProse(piece)))
    .join("\n")
    .replace(/^\s*(?:\d+\.|[-*+])\s+/gm, "");
  // Only real HTML tags go. `<dir>` or `<file>` in a code span is a placeholder, and stays.
  return normalise(text.replace(/<\/?(?:small|br|sup|sub|span|div|p|details|summary|kbd|mark|abbr|em|strong|b|i|a)(?:\s[^>]*)?\/?>/gi, " "));
}

let failures = 0;
let pages = 0;
let blocks = 0;
for (const file of fs.readdirSync(DIST_DIR)) {
  if (!file.endsWith(".html")) continue;
  const mirror = path.join(DIST_DIR, file.replace(/\.html$/, ".md"));
  if (!fs.existsSync(mirror)) continue;
  const found = pageBlocks(fs.readFileSync(path.join(DIST_DIR, file), "utf-8"));
  if (!found) {
    console.error(`✗ ${file}: no <main> element to compare`);
    failures++;
    continue;
  }
  pages++;
  const text = mirrorText(fs.readFileSync(mirror, "utf-8"));
  for (const block of found) {
    blocks++;
    if (!text.includes(block)) {
      failures++;
      console.error(`✗ ${file}: the mirror is missing "${block.slice(0, 100)}${block.length > 100 ? "…" : ""}"`);
    }
  }
}

if (failures) {
  console.error(`\n${failures} block(s) on a page aren't in its Markdown mirror. Fix the generator, not the mirror by hand.`);
  process.exit(1);
}
console.log(`✓ Every Markdown mirror has the text of its page: ${blocks} block(s) on ${pages} page(s) checked.`);
