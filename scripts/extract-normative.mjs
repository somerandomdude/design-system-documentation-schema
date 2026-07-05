#!/usr/bin/env node
/**
 * extract-normative.mjs — Generate the normative-statements index for the
 * Conformance page.
 *
 * DSDS keeps its normative language (RFC 2119 MUST/SHOULD/MAY sentences)
 * inside schema `description` strings, right next to the structures that
 * enforce it. That is deliberate — the second full schema review showed that
 * prose separated from structure drifts. But a citable specification needs a
 * single place where every normative statement can be found and referenced.
 *
 * This script derives that place instead of duplicating it: it walks every
 * split schema, extracts each sentence carrying an RFC 2119 keyword, assigns
 * it a stable location-based ID, and writes the index into
 * site/content/conformance.mdx between marker comments — the same
 * generate-into-markers pattern sync-examples.js uses. The schemas stay the
 * single source of truth; the index cannot drift because it is regenerated
 * on every build and guarded by --check in postvalidate.
 *
 * Statement IDs are location-based (`<dir>/<file>§<jsonPath>.<n>`), so they
 * are stable as long as the schema path is stable — moving or renaming a
 * definition changes its statement IDs, which is the correct signal that
 * citations need re-checking.
 *
 * Usage:
 *   node scripts/extract-normative.mjs           # regenerate the index
 *   node scripts/extract-normative.mjs --check   # exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");
const PAGE = path.join(ROOT, "site", "content", "conformance.mdx");

const BEGIN = "{/* dsds:normative-index */}";
const END = "{/* /dsds:normative-index */}";

// Strongest keyword present classifies the statement. Order matters:
// longest match first so "MUST NOT" is not classified as "MUST".
const LEVELS = ["MUST NOT", "MUST", "SHOULD NOT", "SHOULD", "MAY"];
const KEYWORD_RE = /\b(MUST NOT|MUST|SHOULD NOT|SHOULD|MAY)\b/;

// Sentence splitter tolerant of inline code and abbreviations: split on a
// period followed by whitespace and an uppercase/backtick/quote start, but
// never directly after "e.g." / "i.e." / "vs." / "etc." (fixed-length
// lookbehinds keep those sentences whole).
function sentences(text) {
  return text
    .split(/(?<=\.)(?<!e\.g\.)(?<!i\.e\.)(?<!\bvs\.)(?<!etc\.)\s+(?=[A-Z`'"(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function classify(sentence) {
  for (const level of LEVELS) {
    if (new RegExp(`\\b${level}\\b`).test(sentence)) return level;
  }
  return null;
}

// Walk a schema object collecting (jsonPath, description) pairs.
function collectDescriptions(node, jsonPath, out) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectDescriptions(v, `${jsonPath}/${i}`, out));
    return;
  }
  if (!node || typeof node !== "object") return;
  if (typeof node.description === "string") {
    out.push({ jsonPath, description: node.description });
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === "description") continue;
    collectDescriptions(v, `${jsonPath}/${k}`, out);
  }
}

// Compact a JSON path like /$defs/link/properties/kind to `link.kind`.
function compactPath(jsonPath) {
  return (
    jsonPath
      .replace(/\/\$defs\//g, "/")
      .replace(/\/properties\//g, ".")
      .replace(/\/(oneOf|anyOf|allOf|items|then|if|additionalProperties|prefixItems|propertyNames)\//g, "[$1]/")
      .replace(/\/(\d+)(?=\/|$|\.)/g, "[$1]")
      .replace(/^\//, "")
      .replace(/\//g, ".") || "(root)"
  );
}

function extract() {
  const files = [];
  (function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full);
      else if (
        entry.name.endsWith(".schema.json") &&
        entry.name !== "dsds.bundled.schema.json"
      )
        files.push(full);
    }
  })(SCHEMA_DIR);
  files.sort();

  const groups = new Map(); // relFile -> [{id, level, sentence}]
  const counts = { "MUST NOT": 0, MUST: 0, "SHOULD NOT": 0, SHOULD: 0, MAY: 0 };

  for (const file of files) {
    const rel = path
      .relative(SCHEMA_DIR, file)
      .replace(/\.schema\.json$/, "");
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
    const descs = [];
    collectDescriptions(parsed, "", descs);
    const statements = [];
    for (const { jsonPath, description } of descs) {
      let n = 0;
      for (const sentence of sentences(description)) {
        const level = classify(sentence);
        if (!level) continue;
        n += 1;
        const loc = compactPath(jsonPath);
        statements.push({
          id: `${rel}§${loc}.${n}`,
          level,
          sentence,
        });
        counts[level] += 1;
      }
    }
    if (statements.length) groups.set(rel, statements);
  }
  return { groups, counts };
}


// MDX treats raw {, } and < as JSX. Escape them in prose segments; text
// inside backtick code spans is already safe.
function mdxEscape(text) {
  return text
    .split(/(`[^`]*`)/)
    .map((seg, i) =>
      i % 2 === 1 ? seg : seg.replace(/([{}<])/g, "\\$1"),
    )
    .join("");
}

function renderIndex({ groups, counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const lines = [];
  lines.push(BEGIN);
  lines.push("");
  lines.push(
    `*Generated from the v{{VERSION}} schemas by \`scripts/extract-normative.mjs\` — do not edit by hand. ` +
      `${total} statements: ${counts["MUST"]} MUST, ${counts["MUST NOT"]} MUST NOT, ` +
      `${counts["SHOULD"]} SHOULD, ${counts["SHOULD NOT"]} SHOULD NOT, ${counts["MAY"]} MAY.*`,
  );
  lines.push("");
  let currentDir = null;
  for (const [rel, statements] of groups) {
    const dir = rel.includes(path.sep) ? rel.split(path.sep)[0] : "(root)";
    if (dir !== currentDir) {
      currentDir = dir;
      lines.push(`### ${dir === "(root)" ? "Root schema" : dir}`);
      lines.push("");
    }
    lines.push(`#### ${rel}`);
    lines.push("");
    for (const s of statements) {
      lines.push(`- **${s.level}** — ${mdxEscape(s.sentence)} <small>\`${s.id}\`</small>`);
    }
    lines.push("");
  }
  lines.push(END);
  return lines.join("\n");
}

function main() {
  const check = process.argv.includes("--check");
  if (!fs.existsSync(PAGE)) {
    console.error(`✗ ${path.relative(ROOT, PAGE)} not found — create the Conformance page first.`);
    process.exit(1);
  }
  const page = fs.readFileSync(PAGE, "utf-8");
  const begin = page.indexOf(BEGIN);
  const end = page.indexOf(END);
  if (begin === -1 || end === -1) {
    console.error(`✗ Marker comments missing in ${path.relative(ROOT, PAGE)}.`);
    process.exit(1);
  }
  const generated = renderIndex(extract());
  const updated = page.slice(0, begin) + generated + page.slice(end + END.length);

  if (check) {
    if (updated !== page) {
      console.error(
        "✗ Normative-statements index is out of date. Run `npm run normative` to regenerate.",
      );
      process.exit(1);
    }
    console.log("✓ Normative-statements index is up to date.");
    return;
  }
  fs.writeFileSync(PAGE, updated, "utf-8");
  const total = generated.split("\n- **").length - 1;
  console.log(
    `✓ Normative-statements index regenerated (${total} statements) in ${path.relative(ROOT, PAGE)}.`,
  );
}

main();
