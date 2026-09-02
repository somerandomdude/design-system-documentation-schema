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

// Prose claims ABOUT the catalog drift too, and nothing caught that: both
// README.md and AGENTS.md described the catalog as "DSDS-01 through
// DSDS-07" long after it reached ten rules, and again after fifteen. The
// range is derivable, so assert it rather than trusting a human to
// re-count. Matches "`DSDS-01`–`DSDS-07`", "`DSDS-01` through `DSDS-07`",
// and the same forms without backticks.
const numeric = (id) => Number(id.slice("DSDS-".length));
const byId = (a, b) => numeric(a) - numeric(b);
const ids = catalog.map((r) => r.id).filter((id) => /^DSDS-\d+$/.test(id)).sort(byId);
const lowestId = ids[0];
const highestId = ids[ids.length - 1];

// A range starting at the catalog's first id can legitimately describe
// either the whole catalog or one tier that happens to start there - the
// semantic tier runs DSDS-01–DSDS-11 and is cited on its own in both files,
// which is accurate, not drift. Any tier not starting at `lowestId` (the
// advisory tier, DSDS-12–DSDS-15) is cited as its own range and never
// matches the `from !== lowestId` guard below.
const tierEnds = new Map();
for (const rule of catalog) {
  if (!/^DSDS-\d+$/.test(rule.id)) continue;
  const tier = tierEnds.get(rule.enforcement) || [];
  tier.push(rule.id);
  tierEnds.set(rule.enforcement, tier);
}
const allowedEnds = new Set([highestId]);
for (const tierIds of tierEnds.values()) {
  const sorted = [...tierIds].sort(byId);
  if (sorted[0] === lowestId) allowedEnds.add(sorted[sorted.length - 1]);
}

const RANGE_RE = /`?(DSDS-\d+)`?\s*(?:–|—|-|through|to)\s*`?(DSDS-\d+)`?/g;
const PROSE_FILES = ["README.md", "AGENTS.md"];

for (const rel of PROSE_FILES) {
  const filePath = path.join(rootDir, rel);
  if (!fs.existsSync(filePath)) continue;
  const text = fs.readFileSync(filePath, "utf-8");
  for (const m of text.matchAll(RANGE_RE)) {
    const [claim, from, to] = m;
    // Only a range that starts at the catalog's own first id is claiming to
    // describe the whole catalog. A narrower range (ex: "DSDS-06 and
    // DSDS-07" discussing two specific rules) is prose about a subset.
    if (from !== lowestId) continue;
    if (!allowedEnds.has(to)) {
      const line = text.slice(0, m.index).split("\n").length;
      const expected = [...allowedEnds].sort(byId).map((id) => `${lowestId}–${id}`).join(" or ");
      console.error(`✗ ${rel}:${line}: describes the catalog as "${claim.replace(/\s+/g, " ")}", but the catalog runs ${expected} (${catalog.length} rules)`);
      ok = false;
    }
  }
}

if (ok) {
  console.log(`✓ ${catalog.length} rule(s) (${lowestId}–${highestId}) all declare a valid enforcement tier, every semantic one matches scripts/validate.js exactly, and README.md/AGENTS.md describe the catalog's real range.`);
}
process.exit(ok ? 0 : 1);
