#!/usr/bin/env node
// Layer 3 of the conformance model (see overview.mdx's Conformance section): a fixture per
// semantic rule id (examples/invalid/DSDS-XX-*.yaml), each carrying
// a leading `# expect: DSDS-XXX` comment, run through the exact same
// validateDoc() tools/validate.js's own CLI uses - not a second copy of
// the validation logic. This is what lets an independent validator
// reimplementation (or our own CI) check "do I enforce the same rules,"
// not just "does mine pass on valid documents."
"use strict";

const fs = require("fs");
const path = require("path");
const { rootDir, loadYaml } = require("./lib");
const { validateDoc, RULES } = require("./validate");

const FIXTURES_DIR = path.join(rootDir, "examples/invalid");

function expectedIds(raw) {
  const match = raw.match(/^#\s*expect:\s*(.+)$/m);
  if (!match) return [];
  return match[1].split(",").map((s) => s.trim()).filter(Boolean);
}

function idsIn(errors) {
  const ids = new Set();
  for (const e of errors) {
    const m = e.match(/^\[(DSDS-\d+)\]/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".yaml")).sort();

let ok = true;

for (const file of files) {
  const filePath = path.join(FIXTURES_DIR, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const expected = expectedIds(raw);

  if (expected.length === 0) {
    console.error(`✗ ${file}: no "# expect: DSDS-XXX" comment - every fixture must declare what it's testing`);
    ok = false;
    continue;
  }

  const doc = loadYaml(filePath);
  const { errors, warnings } = validateDoc(doc, { filePath });
  // A rule can legitimately fire as either - a project-scope finding
  // (see validateItemRefs in validate.js) is a warning until --strict,
  // not an error - so a fixture proving one of those trips its rule id
  // needs both channels checked, not just errors.
  const fired = idsIn([...errors, ...warnings]);
  const missing = expected.filter((id) => !fired.has(id));

  if (missing.length) {
    console.error(`✗ ${file}: expected [${expected.join(", ")}] but got [${[...fired].join(", ") || "no rule ids at all"}]`);
    ok = false;
  } else {
    console.log(`✓ ${file} -> ${expected.join(", ")}`);
  }
}

// Every rule id the validator knows about should have at least one
// fixture - otherwise this corpus can't claim to cover the rule catalog.
const allIds = new Set(Object.values(RULES));
const coveredIds = new Set(files.flatMap((f) => expectedIds(fs.readFileSync(path.join(FIXTURES_DIR, f), "utf8"))));
const uncovered = [...allIds].filter((id) => !coveredIds.has(id));
if (uncovered.length) {
  console.error(`✗ no fixture covers: ${uncovered.join(", ")}`);
  ok = false;
}

process.exit(ok ? 0 : 1);
