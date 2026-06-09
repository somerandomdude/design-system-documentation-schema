#!/usr/bin/env node
/**
 * check-doc-coverage.mjs — Drift guard for the Schema Architecture page.
 *
 * The summary tables on schema-architecture.mdx are now generated from the
 * schema (see render-summaries.js), so they cannot drift by hand. This guard
 * is the backstop: it compiles the page and asserts that EVERY entity kind,
 * document-block kind, and metadata kind defined in the schema is actually
 * surfaced on the rendered page. If a generator regresses, a shortcode is
 * removed, or a new kind somehow isn't picked up, the build fails loudly
 * instead of shipping a silently stale reference page.
 *
 * Run automatically as part of `npm run validate`.
 *
 * Exits non-zero when any schema kind is missing from the rendered page.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { compileMdxFile } from "./compile-mdx.mjs";

const require = createRequire(import.meta.url);
const { loadAllDefs } = require("./render-summaries.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "site", "content", "schema-architecture.mdx");
const SCHEMA_BLOCKS_DIR = path.join(ROOT, "spec", "schema", "document-blocks");
const EX_BLOCKS_DIR = path.join(ROOT, "spec", "examples", "document-blocks");
const EX_ENTITIES_DIR = path.join(ROOT, "spec", "examples", "entities");

const kindConst = (def) =>
  def && def.properties && def.properties.kind && def.properties.kind.const;
const refName = (ref) => (ref && ref.match(/\$defs\/(\w+)/) || [])[1];

// ---------------------------------------------------------------------------
// 1. Schema truth — every kind the page must surface
// ---------------------------------------------------------------------------

const { defs, root } = loadAllDefs();

const entityKinds = ((root.properties && root.properties.entity && root.properties.entity.oneOf) || [])
  .map((o) => kindConst(defs[refName(o.$ref)]))
  .filter(Boolean);

const blockKinds = [
  ...new Set(
    Object.keys(defs)
      .filter((n) => n.endsWith("DocumentBlock"))
      .flatMap((u) => (defs[u].oneOf || []).map((o) => refName(o.$ref)))
      .map((n) => kindConst(defs[n]))
      .filter(Boolean),
  ),
];

const metadataKinds = Object.keys(
  (defs.entityMetadata && defs.entityMetadata.properties) || {},
);

// ---------------------------------------------------------------------------
// 2. Render the page and check coverage
// ---------------------------------------------------------------------------

const { html } = await compileMdxFile(PAGE);

// The generators emit entity/block kinds as quoted code (`"foundation"`) and
// metadata kinds as bare code (`description`). Check for those exact tokens.
const quoted = (k) => `<ds-code inline>&quot;${k}&quot;</ds-code>`;
const bare = (k) => `<ds-code inline>${k}</ds-code>`;

const missing = [];
for (const k of entityKinds) if (!html.includes(quoted(k))) missing.push(`entity kind "${k}"`);
for (const k of blockKinds) if (!html.includes(quoted(k))) missing.push(`document-block kind "${k}"`);
for (const k of metadataKinds) if (!html.includes(bare(k))) missing.push(`metadata kind "${k}"`);

// Generator failures leave HTML comments; catch those too.
const genErrors = (html.match(/<!--\s*ds-[a-z-]+:[^>]*-->/g) || []);

// ---------------------------------------------------------------------------
// 2b. Example-fixture coverage — guard the spec/examples/ tree, not just docs
//
//   (a) Every document-block schema must ship a matching example fixture, so a
//       newly added block kind cannot land without a worked example.
//   (b) Every top-level key in a document-blocks/ or entities/ fixture must map
//       to a live $def. A key that no longer resolves is a stale fixture left
//       behind by a renamed or removed definition (the orphan best-practice.json
//       case). Validation silently SKIPS such keys, so the only backstop is here.
// ---------------------------------------------------------------------------

const blockSchemaBases = fs
  .readdirSync(SCHEMA_BLOCKS_DIR)
  .filter((f) => f.endsWith(".schema.json") && f !== "document-blocks.schema.json")
  .map((f) => f.replace(/\.schema\.json$/, ""));

const exampleMissing = [];
for (const base of blockSchemaBases) {
  if (!fs.existsSync(path.join(EX_BLOCKS_DIR, `${base}.json`))) {
    exampleMissing.push(
      `document-block "${base}" has no example fixture (expected spec/examples/document-blocks/${base}.json)`,
    );
  }
}

const orphanKeys = [];
for (const dir of [EX_BLOCKS_DIR, EX_ENTITIES_DIR]) {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    } catch {
      continue; // JSON validity is validate.js's job, not ours.
    }
    for (const key of Object.keys(data)) {
      if (!defs[key]) {
        orphanKeys.push(
          `${path.basename(dir)}/${file} → "${key}" is not a live schema $def (stale fixture from a renamed/removed definition?)`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Report
// ---------------------------------------------------------------------------

console.log("Schema Architecture doc-coverage check\n");
console.log(
  `  Schema kinds: ${entityKinds.length} entity, ${blockKinds.length} document-block, ${metadataKinds.length} metadata`,
);
console.log(
  `  Example fixtures: ${blockSchemaBases.length} document-block schema(s) checked`,
);

if (genErrors.length) {
  console.error(`\n  ✗ Generator errors on the page:`);
  for (const e of genErrors) console.error(`      ${e}`);
}

if (missing.length || genErrors.length || exampleMissing.length || orphanKeys.length) {
  if (missing.length) {
    console.error(`\n  ✗ ${missing.length} schema kind(s) not surfaced on schema-architecture.mdx:`);
    for (const m of missing) console.error(`      ${m}`);
    console.error(
      `\n  This usually means a summary generator (render-summaries.js) or its\n` +
        `  shortcode is broken, or a shortcode was removed from the page.`,
    );
  }
  if (exampleMissing.length) {
    console.error(`\n  ✗ ${exampleMissing.length} document-block(s) without an example fixture:`);
    for (const m of exampleMissing) console.error(`      ${m}`);
  }
  if (orphanKeys.length) {
    console.error(`\n  ✗ ${orphanKeys.length} stale example fixture key(s):`);
    for (const m of orphanKeys) console.error(`      ${m}`);
  }
  process.exit(1);
}

console.log("\n  ✓ Every schema kind is surfaced on the page.");
console.log("  ✓ Every document-block has an example fixture; all fixture keys resolve.\n");
