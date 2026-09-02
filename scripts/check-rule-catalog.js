#!/usr/bin/env node
// The rule catalog (schema/conformance-rules.yaml) is the single source of
// truth scripts/validate.js's own RULES map is built from (see validate.js's
// own comment on why: so a fixture, a bug report, or an independent
// validator can cite a stable id). Nothing before this asserted the reverse
// direction: a catalog entry with a typo'd or renamed `name` produces
// `RULES.THAT_NAME === undefined` silently, and `err(undefined, message)`
// still returns a (wrong) string - the drift would only surface as a
// confusing test failure somewhere else, if at all.
//
// Every catalog entry also now declares `enforcement`
// (structural|semantic|advisory|none), matching the three tiers README.md's
// own "Enforcement tiers" table already documents (structural = the schema
// itself; semantic = scripts/validate.js's hand-written DSDS-XX checks;
// advisory = scripts/lint-docs.js's warnings-only tier) plus `none` for a
// documented-but-unenforced entry. `semantic` is the only tier checked for
// drift here - `advisory` entries are checked the same way, but by
// lint-docs.js's own startup self-check (activeRules()), since that file
// already owns the one list (IMPLEMENTATIONS) this would otherwise just be
// reading a second time.
"use strict";

const fs = require("fs");
const path = require("path");
const { rootDir, loadYaml } = require("./lib");

const CATALOG_PATH = path.join(rootDir, "schema/conformance-rules.yaml");
const VALIDATE_PATH = path.join(rootDir, "scripts/validate.js");

const ENFORCEMENT_VALUES = new Set(["structural", "semantic", "advisory", "none"]);

const catalog = loadYaml(CATALOG_PATH);
let ok = true;

for (const rule of catalog) {
  if (!ENFORCEMENT_VALUES.has(rule.enforcement)) {
    console.error(`✗ ${rule.id} '${rule.name}': enforcement is "${rule.enforcement}", expected one of [${[...ENFORCEMENT_VALUES].join(", ")}]`);
    ok = false;
  }
}

// Bidirectional drift check for the semantic tier: every catalog name with
// enforcement: semantic must be referenced in validate.js (catalog ->
// implementation), and every RULES.<NAME> validate.js actually references
// must have a catalog entry (implementation -> catalog) - a static text
// scan, not a runtime trace, so it catches a reference no code path
// currently exercises too.
const validateSrc = fs.readFileSync(VALIDATE_PATH, "utf-8");
const referencedNames = new Set([...validateSrc.matchAll(/\bRULES\.([A-Z_]+)\b/g)].map((m) => m[1]));

const semanticNames = new Set(catalog.filter((r) => r.enforcement === "semantic").map((r) => r.name));

for (const name of semanticNames) {
  if (!referencedNames.has(name)) {
    console.error(`✗ ${name}: enforcement: semantic in the catalog, but scripts/validate.js never references RULES.${name}`);
    ok = false;
  }
}
for (const name of referencedNames) {
  if (!semanticNames.has(name)) {
    console.error(`✗ RULES.${name}: referenced in scripts/validate.js but has no enforcement: semantic entry (or no entry at all) in the catalog`);
    ok = false;
  }
}

if (ok) {
  console.log(`✓ ${catalog.length} rule(s) in the catalog all declare a valid enforcement tier, and every semantic one matches scripts/validate.js exactly.`);
}
process.exit(ok ? 0 : 1);
