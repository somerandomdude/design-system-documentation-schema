#!/usr/bin/env node
/**
 * generate-examples-index.mjs — Generates the file listing on the Examples
 * page directly from the examples/ directory tree, so a new or removed
 * example file shows up (or disappears) without anyone remembering to edit
 * a hand-typed list. Same generate-into-markers pattern as
 * generate-rule-catalog.mjs and extract-normative.mjs.
 *
 * Every example is validated (`npm run check`), but until this script
 * existed, none of them were linkable from an absolute URL — a reader could
 * be told "see examples/entries/button.yaml" but had no site link to
 * actually open it. build-site.js mirrors examples/ into site/dist/examples/
 * verbatim so each file in the list below actually resolves.
 *
 * Usage:
 *   node scripts/generate-examples-index.mjs           # regenerate the list
 *   node scripts/generate-examples-index.mjs --check   # exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXAMPLES_DIR = path.join(ROOT, "examples");
const PAGE = path.join(ROOT, "site", "content", "examples.mdx");

const BEGIN = "{/* dsds:examples-index */}";
const END = "{/* /dsds:examples-index */}";

// One-line blurb per top-level category — hand-written, stable; the file
// list under each is what's generated.
const GROUP_BLURBS = {
  base: "Full base documents — a system with multiple entries, split across files via `rel: file`.",
  entries: "Standalone entry files, one per kind, plus the source/manifest/story files a couple of them point at.",
  quickstart: "The Quick Start guide's own snippets, one per step, building up from a bare base document to a described, related entry.",
  interop: "Worked pairs showing a DSDS entry pointing at a real DTCG token file or CEM manifest, instead of restating it.",
  invalid: "One broken example per semantic rule (`DSDS-XX-*.yaml`) plus schema-shape fixtures (`schema-*.yaml`) — the negative-test corpus `scripts/conformance-test.js` runs against.",
  "anti-patterns": "Documents that validate cleanly and are still worth avoiding — the schema checks structure, not judgment. See each file's own leading comment.",
};

function walk(dir, baseDir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, baseDir, out);
    } else {
      out.push(path.relative(baseDir, full).split(path.sep).join("/"));
    }
  }
}

function renderIndex() {
  const groups = fs
    .readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const lines = [BEGIN, ""];
  let total = 0;
  for (const group of groups) {
    const groupDir = path.join(EXAMPLES_DIR, group);
    const files = [];
    walk(groupDir, EXAMPLES_DIR, files);
    total += files.length;
    lines.push(`## ${group}/`);
    lines.push("");
    if (GROUP_BLURBS[group]) {
      lines.push(GROUP_BLURBS[group]);
      lines.push("");
    }
    for (const file of files) {
      lines.push(`- [\`${file}\`](/examples/${file})`);
    }
    lines.push("");
  }
  lines.push(`*${total} files across ${groups.length} categories, generated from the \`examples/\` directory by \`scripts/generate-examples-index.mjs\` — do not edit by hand.*`);
  lines.push("");
  lines.push(END);
  return lines.join("\n");
}

function main() {
  const check = process.argv.includes("--check");

  if (!fs.existsSync(PAGE)) {
    console.error(`✗ ${path.relative(ROOT, PAGE)} not found.`);
    process.exit(1);
  }
  const page = fs.readFileSync(PAGE, "utf-8");
  const begin = page.indexOf(BEGIN);
  const end = page.indexOf(END);
  if (begin === -1 || end === -1) {
    console.error(`✗ Marker comments missing in ${path.relative(ROOT, PAGE)}.`);
    process.exit(1);
  }

  const generated = renderIndex();
  const updated = page.slice(0, begin) + generated + page.slice(end + END.length);

  if (check) {
    if (updated !== page) {
      console.error(
        "✗ Examples index is out of date. Run `npm run generate-examples-index` to regenerate.",
      );
      process.exit(1);
    }
    console.log("✓ Examples index is up to date.");
    return;
  }

  fs.writeFileSync(PAGE, updated, "utf-8");
  console.log(`✓ Examples index regenerated in ${path.relative(ROOT, PAGE)}.`);
}

main();
