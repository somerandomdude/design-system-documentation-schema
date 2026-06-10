#!/usr/bin/env node
/**
 * migrate-to-0.8.js — Migrate DSDS 0.7.x documents to 0.8.0.
 *
 * One breaking change: criterion fixtures (`criteria[].examples[]`) require a
 * declared `outcome: "pass" | "fail"`. Earlier documents commonly encoded the
 * outcome in title prose ("Correct — …", "Incorrect — …"). This codemod:
 *
 *   1. Bumps `dsdsVersion` (and any designsystemdocspec.org/v0.7.x/ $schema
 *      URL) to 0.8.0.
 *   2. Adds `outcome` to criterion fixtures by recognizing common title
 *      prefixes. Unrecognizable fixtures are left untouched and reported —
 *      deciding their outcome is a human call, not a heuristic's.
 *
 * Usage:
 *   node scripts/migrate-to-0.8.js <files-or-dirs…> [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const PASS_PREFIX = /^\s*(correct|pass(ing)?|do|good|valid|✓|✅)\b/i;
const FAIL_PREFIX = /^\s*(incorrect|fail(ing)?|don'?t|bad|invalid|wrong|✗|❌)\b/i;

const TARGET_VERSION = "0.8.0";

function inferOutcome(title) {
  if (typeof title !== "string") return null;
  if (PASS_PREFIX.test(title)) return "pass";
  if (FAIL_PREFIX.test(title)) return "fail";
  return null;
}

function migrateDoc(doc, report) {
  let changed = false;

  if (typeof doc.dsdsVersion === "string" && doc.dsdsVersion !== TARGET_VERSION) {
    doc.dsdsVersion = TARGET_VERSION;
    changed = true;
  }
  if (typeof doc.$schema === "string") {
    const updated = doc.$schema.replace(/\/v0\.7(\.\d+)?\//, `/v${TARGET_VERSION}/`);
    if (updated !== doc.$schema) {
      doc.$schema = updated;
      changed = true;
    }
  }

  function walk(node, p) {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${p}/${i}`));
      return;
    }
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.criteria)) {
      node.criteria.forEach((criterion, ci) => {
        (criterion.examples || []).forEach((fixture, fi) => {
          if (!fixture || fixture.outcome) return;
          const inferred = inferOutcome(fixture.title);
          const at = `${p}/criteria/${ci}/examples/${fi}`;
          if (inferred) {
            fixture.outcome = inferred;
            report.migrated.push(`${at} → "${inferred}" (from title "${fixture.title}")`);
            changed = true;
          } else {
            report.manual.push(`${at} — cannot infer outcome from title ${JSON.stringify(fixture.title || "(none)")}; set "pass" or "fail" by hand`);
          }
        });
      });
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === "criteria") continue;
      walk(v, `${p}/${k}`);
    }
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
    console.error("Usage: node scripts/migrate-to-0.8.js <files-or-dirs…> [--dry-run]");
    process.exit(1);
  }

  const files = targets.flatMap(collectFiles);
  let migrated = 0;
  let needsHuman = 0;

  for (const filePath of files) {
    const doc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const report = { migrated: [], manual: [] };
    const changed = migrateDoc(doc, report);
    const rel = path.relative(process.cwd(), filePath);

    if (changed && !dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n", "utf-8");
    }
    if (changed) {
      migrated++;
      console.log(`  ${dryRun ? "would migrate" : "✓ migrated"} ${rel}`);
      for (const m of report.migrated) console.log(`      outcome ${m}`);
    }
    for (const m of report.manual) {
      needsHuman++;
      console.log(`  ⚠ ${rel}${m}`);
    }
  }

  console.log(
    `\n${migrated} file(s) ${dryRun ? "would be " : ""}migrated, ${needsHuman} fixture(s) need a human decision.`,
  );
}

main();
