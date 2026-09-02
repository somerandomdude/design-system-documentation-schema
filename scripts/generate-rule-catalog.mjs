#!/usr/bin/env node
/**
 * generate-rule-catalog.mjs — Generates the `/conformance` page's rule
 * catalog table directly from schema/conformance-rules.yaml, so the two
 * can't drift the way a hand-maintained copy can.
 *
 * Before this script existed, the ID/Rule table on the Conformance page was
 * typed out by hand and only checked for drift after the fact
 * (scripts/check-rule-catalog.js, scripts/conformance-test.js) — a real
 * safety net, but one that still required a human to notice a failure and
 * fix the copy. This generates the table instead, the same
 * generate-into-markers pattern scripts/extract-normative.mjs and
 * scripts/sync-examples.js already use, so there is no copy left to drift.
 *
 * Usage:
 *   node scripts/generate-rule-catalog.mjs           # regenerate the table
 *   node scripts/generate-rule-catalog.mjs --check   # exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "schema", "conformance-rules.yaml");
const PAGE = path.join(ROOT, "site", "content", "conformance.mdx");

// MDX comment syntax, not `<!-- -->` — this is substituted straight into
// conformance.mdx source before MDX compilation, and a plain HTML comment
// isn't valid MDX (see compile-mdx.mjs's own note on the same point).
const BEGIN = "{/* dsds:rule-catalog */}";
const END = "{/* /dsds:rule-catalog */}";

function renderTable(rules) {
  const lines = [BEGIN, "", "| ID | Rule |", "|---|---|"];
  for (const rule of rules) {
    lines.push(`| \`${rule.id}\` | ${rule.title} |`);
  }
  lines.push("", END);
  return lines.join("\n");
}

function main() {
  const check = process.argv.includes("--check");

  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`✗ ${path.relative(ROOT, CATALOG_PATH)} not found.`);
    process.exit(1);
  }
  const rules = yaml.load(fs.readFileSync(CATALOG_PATH, "utf-8"));
  if (!Array.isArray(rules) || rules.length === 0) {
    console.error(`✗ ${path.relative(ROOT, CATALOG_PATH)} has no rules.`);
    process.exit(1);
  }

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

  const generated = renderTable(rules);
  const updated = page.slice(0, begin) + generated + page.slice(end + END.length);

  if (check) {
    if (updated !== page) {
      console.error(
        "✗ Rule catalog table is out of date. Run `npm run generate` to regenerate.",
      );
      process.exit(1);
    }
    console.log(`✓ Rule catalog table is up to date (${rules.length} rules).`);
    return;
  }

  fs.writeFileSync(PAGE, updated, "utf-8");
  console.log(`✓ Rule catalog table regenerated (${rules.length} rules) in ${path.relative(ROOT, PAGE)}.`);
}

main();
