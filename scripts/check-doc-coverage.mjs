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

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { compileMdxFile } from "./compile-mdx.mjs";

const require = createRequire(import.meta.url);
const { loadAllDefs } = require("./render-summaries.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "site", "content", "schema-architecture.mdx");

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

const metadataKinds = ((defs.entityMetadata && defs.entityMetadata.oneOf) || [])
  .map((o) => kindConst(defs[refName(o.$ref)]))
  .filter(Boolean);

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
// 3. Report
// ---------------------------------------------------------------------------

console.log("Schema Architecture doc-coverage check\n");
console.log(
  `  Schema kinds: ${entityKinds.length} entity, ${blockKinds.length} document-block, ${metadataKinds.length} metadata`,
);

if (genErrors.length) {
  console.error(`\n  ✗ Generator errors on the page:`);
  for (const e of genErrors) console.error(`      ${e}`);
}

if (missing.length || genErrors.length) {
  if (missing.length) {
    console.error(`\n  ✗ ${missing.length} schema kind(s) not surfaced on schema-architecture.mdx:`);
    for (const m of missing) console.error(`      ${m}`);
    console.error(
      `\n  This usually means a summary generator (render-summaries.js) or its\n` +
        `  shortcode is broken, or a shortcode was removed from the page.`,
    );
  }
  process.exit(1);
}

console.log("\n  ✓ Every schema kind is surfaced on the page.\n");
