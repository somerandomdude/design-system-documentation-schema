#!/usr/bin/env node
/**
 * Generates the `/conformance` page's rule catalog table, and one section per rule below it,
 * directly from schema/conformance-rules.yaml, so the two can't drift the way a
 * hand-maintained copy can - the same generate-into-markers pattern extract-normative.mjs and
 * sync-examples.js use.
 *
 * Each rule's section is what `docs` links to in validate.js/lint-docs.js --json output
 * (/conformance#dsds-14), so the anchor scheme here and the `docs` URL there must agree.
 *
 * Usage:
 *   node scripts/generate/generate-rule-catalog.mjs           # regenerate the table
 *   node scripts/generate/generate-rule-catalog.mjs --check   # exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { syncRegion } from "./regions.mjs";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");
const { validateConfig } = require("../config-schema.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CATALOG_PATH = path.join(ROOT, "schema", "conformance-rules.yaml");
const PAGE = path.join(ROOT, "site", "content", "conformance.mdx");

const INVALID_DIR = path.join(ROOT, "examples", "invalid");

const REGION = "rule-catalog";
const DETAILS_REGION = "rule-details";

// The heading text is just the id, so the page's own heading slugger gives it the anchor
// `dsds-14`. Keep in step with validate.js/lint-docs.js, which link findings here.
const anchorFor = (id) => id.toLowerCase();

function renderTable(rules) {
  const lines = ["| ID | Rule |", "|---|---|"];
  for (const rule of rules) {
    lines.push(`| [\`${rule.id}\`](#${anchorFor(rule.id)}) | ${rule.title} |`);
  }
  return lines.join("\n");
}

const TIER_LABEL = {
  semantic: "Checked by `dsds-validate`.",
  advisory: "A suggestion from `dsds-lint`. It never fails a build.",
  structural: "Enforced by the schema itself.",
  none: "Not checked by any tool.",
};

// The examples/invalid/ fixtures named after a rule (DSDS-05-*.yaml) are documents that break
// it on purpose; the conformance suite runs every one of them.
function fixturesFor(id) {
  if (!fs.existsSync(INVALID_DIR)) return [];
  return fs
    .readdirSync(INVALID_DIR)
    .filter((f) => f.startsWith(`${id}-`) && f.endsWith(".yaml"))
    .sort();
}

// Catalog prose is plain markdown, but this lands in MDX, where a bare `<word>` opens a tag.
// Show a `<word>` as code, and escape any other `<`, everywhere except inside `code spans`.
const oneLine = (text) =>
  String(text)
    .replace(/\s+/g, " ")
    .trim()
    .split(/(`[^`]*`)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(/<([A-Za-z][^<>]*)>|</g, (m, word) => (word === undefined ? "\\<" : "`" + m + "`")),
    )
    .join("");

function renderDetails(rules) {
  const blocks = [];
  for (const rule of rules) {
    const tier = rule.retired ? `Retired in ${rule.retired}. No tool checks it.` : TIER_LABEL[rule.enforcement];
    const lines = [`### ${rule.id}`, "", `**${oneLine(rule.title)}**`, "", `*${tier}*`, "", oneLine(rule.description), ""];
    lines.push(`**How to fix:** ${oneLine(rule.fix)}`, "");
    if (rule.note) lines.push(`**Note:** ${oneLine(rule.note)}`, "");
    const fixtures = fixturesFor(rule.id);
    if (fixtures.length) {
      const links = fixtures.map((f) => `[\`${f}\`](/examples/invalid/${f})`).join(", ");
      lines.push(`**Example that breaks it:** ${links}`, "");
    }
    blocks.push(lines.join("\n").trimEnd());
  }
  return blocks.join("\n\n");
}

function main() {
  const check = process.argv.includes("--check");

  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`✗ ${path.relative(ROOT, CATALOG_PATH)} not found.`);
    process.exit(1);
  }
  const rules = validateConfig(
    "conformance-rules",
    yaml.load(fs.readFileSync(CATALOG_PATH, "utf-8")),
    "schema/conformance-rules.yaml"
  );
  if (!Array.isArray(rules) || rules.length === 0) {
    console.error(`✗ ${path.relative(ROOT, CATALOG_PATH)} has no rules.`);
    process.exit(1);
  }

  syncRegion({
    file: PAGE,
    name: REGION,
    render: () => renderTable(rules),
    check,
    label: `Rule catalog table (${rules.length} rules)`,
  });
  syncRegion({
    file: PAGE,
    name: DETAILS_REGION,
    render: () => renderDetails(rules),
    check,
    label: `Rule details (${rules.length} rules)`,
  });
}

main();
