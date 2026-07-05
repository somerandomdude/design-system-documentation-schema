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

// The unions are kind-discriminated (enum + if/then branches), so the kind
// vocabulary is read from each union's `properties.kind.enum` — the single
// authoritative list — rather than from oneOf branch refs (which the unions
// no longer have).
const kindEnum = (def) =>
  (def && def.properties && def.properties.kind && def.properties.kind.enum) || [];

const entityKinds = kindEnum(defs.anyEntity);

const blockKinds = [
  ...new Set(
    Object.keys(defs)
      .filter((n) => n.endsWith("DocumentBlock"))
      .flatMap((u) => kindEnum(defs[u])),
  ),
];

// Self-check: an empty kind list means this script's schema-reading logic has
// drifted from the union structure (the exact failure mode that let empty
// tables ship in 0.13.0). Fail loudly instead of passing vacuously.
if (entityKinds.length === 0 || blockKinds.length === 0) {
  console.error(
    `✗ check-doc-coverage self-check failed: derived ${entityKinds.length} entity ` +
      `and ${blockKinds.length} document-block kinds from the unions. The union ` +
      `structure has changed and this script no longer reads it correctly.`,
  );
  process.exit(1);
}

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

// (c) Every $def in common/ and metadata/ must be exercised by a keyed fixture
//     in the matching spec/examples/ directory — that is how the relationship
//     and entity-ref fixture gaps accrued silently before 0.13.0. Leaf and
//     value defs that are always exercised inside a parent def's fixture are
//     allowlisted explicitly; a new def is either fixtured or consciously
//     added here, never silently uncovered.
const DEF_FIXTURE_ALLOWLIST = new Set([
  // common/ leaves — exercised inside their parent defs' fixtures
  "deprecationNotice", // inside status fixtures
  "mediaAlt", "mediaUrl", // presentation/thumbnail leaves
  "relationType", // value def, inside relationship
  // metadata/ nested defs — exercised inside governance / doc-origin fixtures
  "authorshipValue", "docOriginValue", "lastReviewed", "owner",
]);

const EX_COMMON_DIR = path.join(ROOT, "spec", "examples", "common");
const EX_METADATA_DIR = path.join(ROOT, "spec", "examples", "metadata");
const SCHEMA_COMMON_DIR = path.join(ROOT, "spec", "schema", "common");
const SCHEMA_METADATA_DIR = path.join(ROOT, "spec", "schema", "metadata");

const defCoverageMissing = [];
for (const [schemaDir, exDir, label] of [
  [SCHEMA_COMMON_DIR, EX_COMMON_DIR, "common"],
  [SCHEMA_METADATA_DIR, EX_METADATA_DIR, "metadata"],
]) {
  const dirDefs = new Set();
  for (const f of fs.readdirSync(schemaDir).filter((f) => f.endsWith(".schema.json"))) {
    const parsed = JSON.parse(fs.readFileSync(path.join(schemaDir, f), "utf-8"));
    for (const d of Object.keys(parsed.$defs || {})) dirDefs.add(d);
  }
  const fixtureKeys = new Set();
  for (const f of fs.readdirSync(exDir).filter((f) => f.endsWith(".json"))) {
    try {
      for (const k of Object.keys(JSON.parse(fs.readFileSync(path.join(exDir, f), "utf-8")))) {
        fixtureKeys.add(k);
      }
    } catch {
      // JSON validity is validate.js's job.
    }
  }
  for (const d of dirDefs) {
    if (!fixtureKeys.has(d) && !DEF_FIXTURE_ALLOWLIST.has(d)) {
      defCoverageMissing.push(
        `${label} def "${d}" has no keyed fixture in spec/examples/${label}/ (add one, or allowlist it in check-doc-coverage.mjs with a reason)`,
      );
    }
  }
}

const orphanKeys = [];
for (const dir of [EX_BLOCKS_DIR, EX_ENTITIES_DIR, EX_COMMON_DIR, EX_METADATA_DIR]) {
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
// 2c. Version consistency — the spec version is single-sourced.
//
//   The spec's own dogfood failure mode is publishing pages that disagree on
//   the version. This guard makes that impossible to ship:
//     • Source guard  — content pages MUST reference the version via the
//       {{VERSION}} token, never a hardcoded designsystemdocspec.org/vX.Y.Z.
//     • Rendered guard — after {{VERSION}} substitution, every versioned URL
//       on every compiled page MUST equal dsds.schema.json's `const`.
// ---------------------------------------------------------------------------

const SPEC_VERSION = (root && root.properties && root.properties.dsdsVersion && root.properties.dsdsVersion.const) || "";
const CONTENT_DIR = path.join(ROOT, "site", "content");
const versionProblems = [];
const contentFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

// dsds:include blocks are generated from version-stamped example files:
// bump-version.js rewrites the examples, sync-examples.js regenerates the
// blocks, and the rendered guard below still verifies their versions. Strip
// them before the hardcode scan so only hand-written URLs are flagged.
const INCLUDE_BLOCK_RE =
  /(\{\/\* dsds:include [\s\S]*?\{\/\* \/dsds:include \*\/\})|(<!-- dsds:include [\s\S]*?<!-- \/dsds:include -->)/g;
for (const file of contentFiles) {
  const src = fs
    .readFileSync(path.join(CONTENT_DIR, file), "utf-8")
    .replace(INCLUDE_BLOCK_RE, "");
  for (const m of src.matchAll(/designsystemdocspec\.org\/v(\d+\.\d+\.\d+)/g)) {
    versionProblems.push(`${file}: source hardcodes version URL v${m[1]} — use the {{VERSION}} token`);
  }
}
for (const file of contentFiles) {
  const { html } = await compileMdxFile(path.join(CONTENT_DIR, file));
  const seen = new Set();
  for (const m of html.matchAll(/designsystemdocspec\.org\/v(\d+\.\d+\.\d+)/g)) {
    if (m[1] !== SPEC_VERSION && !seen.has(m[1])) {
      seen.add(m[1]);
      versionProblems.push(`${file}: rendered version v${m[1]} ≠ spec const ${SPEC_VERSION}`);
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

if (missing.length || genErrors.length || exampleMissing.length || defCoverageMissing.length || orphanKeys.length || versionProblems.length) {
  if (versionProblems.length) {
    console.error(`\n  ✗ ${versionProblems.length} version-consistency problem(s) (spec const ${SPEC_VERSION}):`);
    for (const m of versionProblems) console.error(`      ${m}`);
    console.error(
      `\n  Every page's version must come from dsds.schema.json's const via {{VERSION}}.\n` +
        `  A mismatch means the published site would show inconsistent versions.`,
    );
  }
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
  if (defCoverageMissing.length) {
    console.error(`\n  ✗ ${defCoverageMissing.length} def(s) without a keyed example fixture:`);
    for (const m of defCoverageMissing) console.error(`      ${m}`);
  }
  if (orphanKeys.length) {
    console.error(`\n  ✗ ${orphanKeys.length} stale example fixture key(s):`);
    for (const m of orphanKeys) console.error(`      ${m}`);
  }
  process.exit(1);
}

console.log("\n  ✓ Every schema kind is surfaced on the page.");
console.log("  ✓ Every document-block has an example fixture; all fixture keys resolve.");
console.log("  ✓ Every common/ and metadata/ def is fixtured or allowlisted.");
console.log(`  ✓ All ${contentFiles.length} content pages render a single version (${SPEC_VERSION}).\n`);
