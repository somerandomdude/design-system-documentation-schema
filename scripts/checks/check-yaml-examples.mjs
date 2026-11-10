#!/usr/bin/env node
/**
 * Regression guard for YAML examples on the site. A DSDS example that isn't in a code block
 * loses its line breaks and indentation in the rendered page, and an agent reading the page
 * gets a jumble of keys. Checks two things:
 *
 *   - source: no content page (site/content/**\/*.mdx) has a DSDS key at the start of a line
 *     outside a fenced code block or a component;
 *   - built: no built page (site/dist/*.html) shows one as plain text. Code blocks
 *     (<ds-code>, <pre>, <code>) are fine; anything else is not.
 *
 * Run via `npm run check:docs`, after `npm run build` for the built half.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "site", "content");
const DIST_DIR = path.join(ROOT, "site", "dist");

// Keys a DSDS example starts with. Prose can say "Note: ..." without being flagged, because
// only these keys count, and only at the start of a line.
const DSDS_KEY = /^\s*(?:- )?(kind|schemaVersion|entries|shared|sections|statement|level|framing|traits|combos|items|checkedBy|tokenType|sourceFiles|description|name|id):\s/;

function mdxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return mdxFiles(full);
    return e.name.endsWith(".mdx") ? [full] : [];
  });
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name.startsWith("v") ? [] : htmlFiles(full); // versioned dirs are schema pages
    return e.name.endsWith(".html") ? [full] : [];
  });
}

let failures = 0;
const fail = (where, line) => {
  console.error(`✗ ${where}: a YAML example isn't in a code block: ${line.trim().slice(0, 90)}`);
  failures++;
};

// Source. Skip the frontmatter, fenced blocks, and JSX components (their bodies are code).
let sourceChecked = 0;
for (const file of mdxFiles(CONTENT_DIR)) {
  sourceChecked++;
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  let i = 0;
  if (lines[0] === "---") {
    i = lines.indexOf("---", 1) + 1;
  }
  let fenced = false;
  let inComponent = false;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (/^<ds-(example|code|guide-section|prop-table)\b/.test(line.trim())) inComponent = !/\/>\s*$/.test(line) && !/<\/ds-/.test(line);
    if (/^<\/ds-(example|code|guide-section|prop-table)>/.test(line.trim())) inComponent = false;
    if (inComponent) continue;
    if (DSDS_KEY.test(line)) fail(path.relative(ROOT, file), line);
  }
}

// Built. Drop everything that is a code block or not content, then look for DSDS keys at the
// start of a line of plain text.
let builtChecked = 0;
const CODE_OR_CHROME = /<(ds-code|pre|code|template|style|script|head|nav|footer|svg)\b[\s\S]*?<\/\1>/gi;
if (fs.existsSync(DIST_DIR)) {
  for (const file of htmlFiles(DIST_DIR)) {
    builtChecked++;
    const html = fs.readFileSync(file, "utf-8");
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? "";
    const text = main
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(CODE_OR_CHROME, "")
      .replace(/<\/(p|li|h[1-6]|div|br|tr)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "");
    for (const line of text.split("\n")) {
      if (DSDS_KEY.test(line)) fail(`built ${path.relative(ROOT, file)}`, line);
    }
    // A block <ds-code> keeps a plain <pre> fallback first, so its line breaks show without JavaScript.
    if (/<ds-code\b(?![^>]*\binline\b)[^>]*>(?!<pre><code)/.test(html)) {
      console.error(`✗ built ${path.relative(ROOT, file)}: a block <ds-code> has no plain <pre> fallback, so it shows as one line without JavaScript.`);
      failures++;
    }
  }
}

if (failures) {
  console.error(`\n${failures} YAML example(s) outside a code block. Put each one in a \`\`\`yaml fence.`);
  process.exit(1);
}
console.log(`✓ Every YAML example is in a code block: ${sourceChecked} content page(s) and ${builtChecked} built page(s) checked.`);
