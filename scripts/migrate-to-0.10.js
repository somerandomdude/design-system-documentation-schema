#!/usr/bin/env node
/**
 * migrate-to-0.10.js — Migrate DSDS 0.8.x and 0.9.x documents to 0.10.0.
 *
 * The 0.9/0.10 breaking changes:
 *
 *   1. Conformance levels are lowercase kebab-case: MUST → must,
 *      MUST_NOT → must-not, SHOULD → should, SHOULD_NOT → should-not.
 *   2. A pattern's interaction `components` are entity references
 *      ({ identifier, role? }), not bare strings. Strings are converted:
 *      a string matching an entity's identifier is used as-is; a string
 *      matching an entity's display `name` is swapped for that entity's
 *      identifier; anything else is converted verbatim and reported for a
 *      human decision.
 *
 * Also bumps `dsdsVersion` and any designsystemdocspec.org $schema URL.
 *
 * Usage:
 *   node scripts/migrate-to-0.10.js <files-or-dirs…> [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const TARGET_VERSION = "0.10.0";
const LEVEL_MAP = {
  MUST: "must",
  MUST_NOT: "must-not",
  SHOULD: "should",
  SHOULD_NOT: "should-not",
};
const ENTITY_KINDS = new Set([
  "component", "pattern", "foundation", "guide", "theme", "token", "token-group",
]);

function collectEntities(doc) {
  const byIdentifier = new Set();
  const idByName = new Map();
  function scan(node) {
    if (Array.isArray(node)) return node.forEach(scan);
    if (!node || typeof node !== "object") return;
    if (ENTITY_KINDS.has(node.kind) && typeof node.identifier === "string") {
      byIdentifier.add(node.identifier);
      if (typeof node.name === "string") idByName.set(node.name, node.identifier);
    }
    Object.values(node).forEach(scan);
  }
  scan(doc);
  return { byIdentifier, idByName };
}

function migrateDoc(doc, report) {
  let changed = false;
  const { byIdentifier, idByName } = collectEntities(doc);

  if (typeof doc.dsdsVersion === "string" && doc.dsdsVersion !== TARGET_VERSION) {
    doc.dsdsVersion = TARGET_VERSION;
    changed = true;
  }
  if (typeof doc.$schema === "string") {
    const updated = doc.$schema.replace(/\/v0\.[789](\.\d+)?\//, `/v${TARGET_VERSION}/`);
    if (updated !== doc.$schema) { doc.$schema = updated; changed = true; }
  }

  function walk(node, p) {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${p}/${i}`));
    if (!node || typeof node !== "object") return;

    if (typeof node.level === "string" && node.level in LEVEL_MAP) {
      node.level = LEVEL_MAP[node.level];
      changed = true;
    }

    if (node.kind === "accessibility") {
      // Measured contrast fields are conformance results now, not documentation.
      for (const pair of node.colorContrast || []) {
        if (pair && (("contrastRatio" in pair) || ("wcagLevel" in pair))) {
          delete pair.contrastRatio;
          delete pair.wcagLevel;
          changed = true;
          report.migrated.push(`${p}/colorContrast: dropped measured fields — verify pairs with an automated contrast criterion instead`);
        }
      }
      // Prose fields became structured arrays; converting prose to entries
      // is a human judgment, not a heuristic's.
      for (const [old, neu] of [
        ["screenReaderBehavior", "announcements ({ context, announcement, screenReader? })"],
        ["focusManagement", "focusBehaviors ({ trigger, behavior })"],
        ["motionConsiderations", "reducedMotion ({ animation, behavior })"],
      ]) {
        if (old in node) {
          report.manual.push(`${p}/${old}: prose must be restructured by hand into ${neu} — see the 0.9 changelog`);
        }
      }
    }

    if (Array.isArray(node.components) && node.components.some((c) => typeof c === "string")) {
      node.components = node.components.map((c, i) => {
        if (typeof c !== "string") return c;
        changed = true;
        if (byIdentifier.has(c)) return { identifier: c };
        if (idByName.has(c)) {
          report.migrated.push(`${p}/components/${i}: name "${c}" → identifier "${idByName.get(c)}"`);
          return { identifier: idByName.get(c) };
        }
        report.manual.push(`${p}/components/${i}: "${c}" matches no documented entity — converted verbatim; confirm the identifier`);
        return { identifier: c };
      });
    }

    for (const [k, v] of Object.entries(node)) walk(v, `${p}/${k}`);
  }
  walk(doc, "");
  return changed;
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const out = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.name.endsWith(".dsds.json")) out.push(full);
  }
  return out.sort();
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const targets = args.filter((a) => !a.startsWith("--"));
  if (targets.length === 0) {
    console.error("Usage: node scripts/migrate-to-0.10.js <files-or-dirs…> [--dry-run]");
    process.exit(1);
  }

  let migrated = 0;
  let needsHuman = 0;
  for (const filePath of targets.flatMap(collectFiles)) {
    const doc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const report = { migrated: [], manual: [] };
    const changed = migrateDoc(doc, report);
    const rel = path.relative(process.cwd(), filePath);
    if (changed && !dryRun) fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n", "utf-8");
    if (changed) {
      migrated++;
      console.log(`  ${dryRun ? "would migrate" : "✓ migrated"} ${rel}`);
      for (const m of report.migrated) console.log(`      ${m}`);
    }
    for (const m of report.manual) { needsHuman++; console.log(`  ⚠ ${rel}${m}`); }
  }
  console.log(`\n${migrated} file(s) ${dryRun ? "would be " : ""}migrated, ${needsHuman} reference(s) need a human decision.`);
}

main();
