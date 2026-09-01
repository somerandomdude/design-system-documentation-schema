#!/usr/bin/env node
/**
 * check-markdown-mirrors.mjs — Regression guard for the agent-facing
 * markdown mirror of the Schema page (site/dist/schema.md).
 *
 * The `<ds-*>` web components render their real content (title, definition
 * names/descriptions, field names/types) into shadow DOM from attributes —
 * a non-JS fetch of the HTML page sees none of it. schema.md exists to
 * carry that data as plain text instead. This script is the backstop: it
 * asserts schema.md actually contains every schema file's own def name(s)
 * and every field name nested inside each — the exact data that's
 * otherwise trapped in attributes. If the markdown generator regresses or
 * drifts from the schema, this fails loudly instead of silently shipping
 * an incomplete mirror.
 *
 * Def resolution (allOf flattening, `$ref` lookups) reuses the same
 * helpers build-site.js itself calls, so this can't drift into checking a
 * different notion of "every schema definition" than what actually gets
 * built.
 *
 * Run via `npm run check:markdown-mirrors`.
 *
 * Exits non-zero if schema.md is missing or missing any expected name.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadSchemaYaml,
  resolveSchema,
  buildDefIndex,
  ROOT_FILES,
  DEFAULT_SCHEMA_GROUPS,
} from "./render-prop-table.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "schema");
const DIST_DIR = path.join(ROOT, "site", "dist");

function collectSchemaFiles() {
  const { schemaById } = buildDefIndex({ schemaDir: SCHEMA_DIR });
  const files = [];

  function addFile(group, filePath, filename) {
    const raw = loadSchemaYaml(filePath);
    const baseName = filename.replace(/\.schema\.yaml$/, "");
    const slug = group === "root" ? baseName : `${group}-${baseName}`;
    const title = raw.title || baseName;

    // Same shape build-site.js's own discoverPages()/makePage() produces:
    // one "def" per file — the file's own resolved top-level shape, keyed
    // by its title — plus every local $defs entry alongside it.
    const defs = { [title]: resolveSchema(raw, schemaById) };
    for (const [defName, def] of Object.entries(raw.$defs || {})) {
      defs[defName] = def;
    }
    files.push({ slug, defs });
  }

  for (const filename of ROOT_FILES) {
    const filePath = path.join(SCHEMA_DIR, filename);
    if (fs.existsSync(filePath)) addFile("root", filePath, filename);
  }

  for (const group of DEFAULT_SCHEMA_GROUPS) {
    const dirPath = path.join(SCHEMA_DIR, group);
    if (!fs.existsSync(dirPath)) continue;
    for (const filename of fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.yaml"))
      .sort()) {
      addFile(group, path.join(dirPath, filename), filename);
    }
  }

  return files;
}

const missingNames = []; // { slug, kind, name }

const schemaFiles = collectSchemaFiles();
const mdPath = path.join(DIST_DIR, "schema.md");

if (!fs.existsSync(mdPath)) {
  console.error("\n  ✗ site/dist/schema.md is missing.\n");
  process.exit(1);
}

const md = fs.readFileSync(mdPath, "utf-8");

// Every def name (each file's own top-level shape, plus each local $defs
// entry), and every field name nested inside each, must appear somewhere
// in the one combined schema.md.
for (const file of schemaFiles) {
  for (const [defName, defSchema] of Object.entries(file.defs)) {
    if (!md.includes(defName)) {
      missingNames.push({ slug: file.slug, kind: "def", name: defName });
    }
    for (const fieldName of Object.keys(defSchema.properties || {})) {
      if (!md.includes(fieldName)) {
        missingNames.push({
          slug: file.slug,
          kind: "field",
          name: `${defName}.${fieldName}`,
        });
      }
    }
  }
}

if (missingNames.length) {
  console.error(`\n  ✗ ${missingNames.length} name(s) missing from schema.md:`);
  for (const m of missingNames) {
    console.error(`      ${m.slug} — ${m.kind} "${m.name}"`);
  }
  console.error(
    "\n  This means an agent fetching the page without executing JS would " +
      "not see this data as text — check buildSchemaMarkdown()/" +
      "renderDefinitionMarkdown() in scripts/build-site.js.\n",
  );
  process.exit(1);
}

console.log(`\n  ✓ site/dist/schema.md has a mirror for all ${schemaFiles.length} schema file(s).`);
console.log("  ✓ Every top-level property, def name, and field name appears in it.\n");
