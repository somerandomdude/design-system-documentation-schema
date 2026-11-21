#!/usr/bin/env node
/**
 * Builds a versioned, language-agnostic conformance-suite manifest from
 * examples/invalid/*.yaml, so a validator implementation that isn't this repo's own
 * validate.js can prove it enforces the same rules without reading this repo's JS. Every
 * fixture carries its own contract in a leading comment (`# rejectedBy: schema|semantic`, `#
 * expect: DSDS-XX[,DSDS-YY]`, optional `# errorAt: /json/pointer`); this is a second,
 * independent reader of that contract, not a duplicate of conformance-test.js's checking
 * logic. Serializes it into a portable manifest.json plus a copy of the fixtures, published
 * at a versioned URL alongside the schema bundle and rule catalog.
 *
 * Usage:
 *   node scripts/generate/generate-conformance-suite.mjs           # regenerate the manifest
 *   node scripts/generate/generate-conformance-suite.mjs --check   # exit 1 if out of date
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const FIXTURES_DIR = path.join(ROOT, "examples", "invalid");
const MANIFEST_PATH = path.join(ROOT, "schema", "conformance-suite.json");
const VECTORS_DIR = path.join(ROOT, "examples", "vectors");

// Consumer test vectors (scripts/resolve/vectors.js): one folder per vector, every .yaml in it
// one project, expected.json what a conforming consumer works out from it.
function buildVectors() {
  if (!fs.existsSync(VECTORS_DIR)) return [];
  return fs
    .readdirSync(VECTORS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .map((name) => ({
      name,
      inputs: fs
        .readdirSync(path.join(VECTORS_DIR, name))
        .filter((f) => /\.ya?ml$/.test(f))
        .sort()
        .map((f) => `examples/vectors/${name}/${f}`),
      expected: `examples/vectors/${name}/expected.json`,
    }));
}

// Mirrors conformance-test.js's own leadingComment()/expectedIds(). Kept as an independent
// reader rather than importing that file, since it runs its checks as side effects at module
// load and calls process.exit(), so it isn't safe to require() as a library.
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
      // The document's own declared kind, when it has a single entry at the root - lets a
      // runner in another language decide whether to parse the whole file before validating.
      kind: parsed && typeof parsed === "object" ? parsed.kind ?? null : null,
    };
  });

  const vectors = buildVectors();
  return {
    schemaVersion: version,
    generatedBy: "scripts/generate/generate-conformance-suite.mjs",
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
    consumerContract:
      "For each vector: read every file in inputs as one project, resolve it the way the " +
      "processing model (https://designsystemdocspec.org/processing) says, and compare the " +
      "result with the JSON in expected. `entries` and each entry's `items`, `incoming` and " +
      "`succession` must match exactly, and so must `inlineLinks`, which is present only when " +
      "the project has inline links. `problems` must match on `code` and `at`; `message` is " +
      "prose for people and isn't compared. A consumer that implements only part of the model " +
      "can compare only the fields for the sections it implements, and should say which.",
    vectorCount: vectors.length,
    vectors,
  };
}

function main() {
  const check = process.argv.includes("--check");
  const manifest = buildManifest();
  const generated = JSON.stringify(manifest, null, 2) + "\n";

  if (check) {
    if (!fs.existsSync(MANIFEST_PATH) || fs.readFileSync(MANIFEST_PATH, "utf-8") !== generated) {
      console.error(
        "✗ Conformance suite manifest is out of date. Run `npm run generate` to regenerate.",
      );
      process.exit(1);
    }
    console.log(`✓ Conformance suite manifest is up to date (${manifest.fixtureCount} fixtures, ${manifest.vectorCount} vectors).`);
    return;
  }

  fs.writeFileSync(MANIFEST_PATH, generated, "utf-8");
  console.log(
    `✓ Conformance suite manifest regenerated (${manifest.fixtureCount} fixtures, ${manifest.vectorCount} vectors) at ${path.relative(ROOT, MANIFEST_PATH)}.`,
  );
}

main();
