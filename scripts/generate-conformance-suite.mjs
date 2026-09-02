#!/usr/bin/env node
/**
 * generate-conformance-suite.mjs — Builds a versioned, language-agnostic
 * conformance-suite manifest from examples/invalid/*.yaml, so a validator
 * implementation that isn't this repo's own scripts/validate.js can prove
 * it enforces the same rules, the same way, without reading this repo's
 * JS at all.
 *
 * Every fixture already carries its own contract in a leading comment (see
 * scripts/conformance-test.js's own header comment for why: `# rejectedBy:
 * schema|semantic`, `# expect: DSDS-XX[,DSDS-YY]`, optional `# errorAt:
 * /json/pointer`). This script is a second, independent reader of that same
 * contract — not a duplicate of the checking logic in conformance-test.js,
 * which stays the one thing that actually runs validateDoc() against each
 * fixture. This just serializes what conformance-test.js already parses
 * into a portable manifest.json + a copy of the fixtures themselves,
 * published at a versioned URL (site/dist/v<version>/conformance-suite/)
 * alongside the schema bundle and rule catalog.
 *
 * Usage:
 *   node scripts/generate-conformance-suite.mjs           # regenerate the manifest
 *   node scripts/generate-conformance-suite.mjs --check   # exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURES_DIR = path.join(ROOT, "examples", "invalid");
const MANIFEST_PATH = path.join(ROOT, "schema", "conformance-suite.json");

// Mirrors scripts/conformance-test.js's own leadingComment()/expectedIds() —
// see that file's header comment for the fixture-contract rationale. Kept
// as an independent reader rather than importing conformance-test.js
// itself: that file runs its checks as side effects at module load and
// calls process.exit(), so it isn't safe to require() as a library.
function leadingComment(raw, key) {
  const match = raw.match(new RegExp(`^#\\s*${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

function expectedIds(raw) {
  const value = leadingComment(raw, "expect");
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function readSchemaVersion() {
  const raw = fs.readFileSync(path.join(ROOT, "schema", "dsds.bundled.yaml"), "utf-8");
  const match = /\/v([^/\s"']+)\/dsds\.bundled\.yaml/.exec(raw);
  return match ? match[1] : "";
}

function buildManifest() {
  const version = readSchemaVersion();
  const files = fs
    .readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .sort();

  const fixtures = files.map((file) => {
    const filePath = path.join(FIXTURES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
    return {
      file: `examples/invalid/${file}`,
      rejectedBy: leadingComment(raw, "rejectedBy"),
      expect: expectedIds(raw),
      errorAt: leadingComment(raw, "errorAt"),
      // The document's own declared kind, when it has a single entry at
      // the root — a runner in another language can use this to decide
      // whether it even needs to parse the whole file before validating.
      kind: parsed && typeof parsed === "object" ? parsed.kind ?? null : null,
    };
  });

  return {
    schemaVersion: version,
    generatedBy: "scripts/generate-conformance-suite.mjs",
    runnerContract:
      "For each fixture: load it as YAML, validate it against the bundled schema at " +
      `v${version}, and confirm it is REJECTED. If rejectedBy is \"schema\", at least one ` +
      "resulting error must NOT carry a [DSDS-XX] rule id (a pure JSON Schema violation), and " +
      "if errorAt is set, one such error's instance path must equal it (\"/\" for the document " +
      "root). If rejectedBy is \"semantic\", every id in expect must appear among the resulting " +
      "errors or warnings (a semantic rule may report as either, depending on --strict) tagged " +
      "with that [DSDS-XX] id. A fixture that validates cleanly, or fails for a different " +
      "reason than it declares, is a conformance failure for the validator under test — not a " +
      "passing result.",
    fixtureCount: fixtures.length,
    fixtures,
  };
}

function main() {
  const check = process.argv.includes("--check");
  const manifest = buildManifest();
  const generated = JSON.stringify(manifest, null, 2) + "\n";

  if (check) {
    if (!fs.existsSync(MANIFEST_PATH) || fs.readFileSync(MANIFEST_PATH, "utf-8") !== generated) {
      console.error(
        "✗ Conformance suite manifest is out of date. Run `npm run generate-conformance-suite` to regenerate.",
      );
      process.exit(1);
    }
    console.log(`✓ Conformance suite manifest is up to date (${manifest.fixtureCount} fixtures).`);
    return;
  }

  fs.writeFileSync(MANIFEST_PATH, generated, "utf-8");
  console.log(
    `✓ Conformance suite manifest regenerated (${manifest.fixtureCount} fixtures) at ${path.relative(ROOT, MANIFEST_PATH)}.`,
  );
}

main();
