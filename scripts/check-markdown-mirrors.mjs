#!/usr/bin/env node
/**
 * check-markdown-mirrors.mjs — Regression guard for the agent-facing
 * markdown mirrors (site/dist/*.md).
 *
 * The `<ds-*>` web components render their real content (title, definition
 * names/descriptions, field names/types) into shadow DOM from attributes —
 * a non-JS fetch of the HTML page sees none of it. The `.md` mirror next to
 * every page exists to carry that data as plain text instead. This script
 * is the backstop: for every schema page, it asserts the generated `.md`
 * actually contains every top-level property name and every `$defs` name +
 * field name — the exact data that's otherwise trapped in attributes. If a
 * markdown generator regresses or drifts from the schema, this fails loudly
 * instead of silently shipping an incomplete mirror.
 *
 * Run automatically as part of `npm run validate`.
 *
 * Exits non-zero if any page is missing its .md mirror or any expected name.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");
const DIST_DIR = path.join(ROOT, "site", "dist");

const DIR_GROUPS = ["common", "entities", "document-blocks", "metadata"];

function collectSchemaPages() {
  const pages = [];
  for (const group of DIR_GROUPS) {
    const dirPath = path.join(SCHEMA_DIR, group);
    if (!fs.existsSync(dirPath)) continue;
    for (const filename of fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.json"))
      .sort()) {
      const filePath = path.join(dirPath, filename);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const baseName = filename.replace(".schema.json", "");
      pages.push({ slug: `${group}-${baseName}`, data, filePath });
    }
  }
  const rootPath = path.join(SCHEMA_DIR, "dsds.schema.json");
  if (fs.existsSync(rootPath)) {
    pages.unshift({
      slug: "root",
      data: JSON.parse(fs.readFileSync(rootPath, "utf-8")),
      filePath: rootPath,
    });
  }
  return pages;
}

const missingMirror = [];
const missingNames = []; // { slug, kind, name }

for (const page of collectSchemaPages()) {
  const mdPath = path.join(DIST_DIR, `${page.slug}.md`);
  if (!fs.existsSync(mdPath)) {
    missingMirror.push(page.slug);
    continue;
  }
  const md = fs.readFileSync(mdPath, "utf-8");

  // Every top-level property name (root schema, or a def-less schema file).
  for (const propName of Object.keys(page.data.properties || {})) {
    if (!md.includes(propName)) {
      missingNames.push({ slug: page.slug, kind: "property", name: propName });
    }
  }

  // Every $defs name, and every field name nested inside it.
  for (const [defName, defSchema] of Object.entries(page.data.$defs || {})) {
    if (!md.includes(defName)) {
      missingNames.push({ slug: page.slug, kind: "def", name: defName });
    }
    for (const fieldName of Object.keys(defSchema.properties || {})) {
      if (!md.includes(fieldName)) {
        missingNames.push({
          slug: page.slug,
          kind: "field",
          name: `${defName}.${fieldName}`,
        });
      }
    }
  }
}

if (missingMirror.length || missingNames.length) {
  if (missingMirror.length) {
    console.error(`\n  ✗ ${missingMirror.length} schema page(s) missing a .md mirror:`);
    for (const s of missingMirror) console.error(`      ${s}.md`);
  }
  if (missingNames.length) {
    console.error(`\n  ✗ ${missingNames.length} name(s) missing from their .md mirror:`);
    for (const m of missingNames) {
      console.error(`      ${m.slug}.md — ${m.kind} "${m.name}"`);
    }
  }
  console.error(
    "\n  This means an agent fetching the page without executing JS would " +
      "not see this data as text — check buildSchemaMarkdown()/" +
      "renderDefinitionMarkdown() in scripts/build-site.js.\n",
  );
  process.exit(1);
}

const pageCount = collectSchemaPages().length;
console.log(`\n  ✓ All ${pageCount} schema page(s) have a .md mirror.`);
console.log("  ✓ Every top-level property, $defs name, and field name appears in its mirror.\n");
