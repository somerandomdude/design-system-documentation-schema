#!/usr/bin/env node
/**
 * migrate-to-0.14.js — Migrate DSDS 0.13.x documents to 0.14.0.
 *
 * 0.14.0 is the breaking window announced on the Stability page: every
 * recorded naming exception is executed and every deprecated surface is
 * removed, together, once. The mechanical transforms:
 *
 *   1. Block kind `useCases` → `use-cases` (documentBlocks,
 *      agentDocumentBlocks, and `docOrigin.blocks` keys).
 *   2. Step entries: `title` → `label` (steps blocks).
 *   3. Scale steps: `label` → `name` (scale blocks).
 *   4. `systemInfo`: `systemName` → `name`, `systemVersion` → `version`.
 *   5. Status object forms (entity metadata and per-platform):
 *      `description` → `note`.
 *   6. API events: `returns` → `payload`.
 *   7. Chunk shorthand: top-level `guidelines`/`useCases` arrays become
 *      equivalent blocks in `documentBlocks` (merged into an existing
 *      same-kind block when one is present — the block was authoritative).
 *   8. Deprecated link forms: `role`/`required` are dropped from url-links
 *      (reported); identifier-bearing relationship links are NOT auto-
 *      converted — run `scripts/migrate-relationship-links.js` first, which
 *      handles the unambiguous cases and reports the rest. Any that remain
 *      are reported here for a human decision.
 *
 * Also bumps `dsdsVersion` and any designsystemdocspec.org $schema URL.
 *
 * Usage:
 *   node scripts/migrate-to-0.14.js <files-or-dirs…> [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const TARGET_VERSION = "0.14.0";

function migrateDoc(doc, report) {
  let changed = false;

  if (typeof doc.dsdsVersion === "string" && doc.dsdsVersion !== TARGET_VERSION) {
    doc.dsdsVersion = TARGET_VERSION;
    changed = true;
  }
  if (typeof doc.$schema === "string") {
    const updated = doc.$schema.replace(/\/v0\.1[0-3](\.\d+)?\//, `/v${TARGET_VERSION}/`);
    if (updated !== doc.$schema) { doc.$schema = updated; changed = true; }
  }

  // 4. systemInfo renames (root-level only).
  if (doc.systemInfo && typeof doc.systemInfo === "object") {
    const si = doc.systemInfo;
    if ("systemName" in si) { si.name = si.systemName; delete si.systemName; changed = true; }
    if ("systemVersion" in si) { si.version = si.systemVersion; delete si.systemVersion; changed = true; }
  }

  function renameKey(obj, from, to) {
    if (obj && typeof obj === "object" && !Array.isArray(obj) && from in obj) {
      obj[to] = obj[from];
      delete obj[from];
      changed = true;
      return true;
    }
    return false;
  }

  function walk(node, p) {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${p}/${i}`));
    if (!node || typeof node !== "object") return;

    // 1. Block kind rename.
    if (node.kind === "useCases") { node.kind = "use-cases"; changed = true; }

    // 1b. docOrigin per-block override keys.
    const blocks = node.docOrigin && node.docOrigin.blocks;
    if (blocks && typeof blocks === "object" && "useCases" in blocks) {
      blocks["use-cases"] = blocks.useCases;
      delete blocks.useCases;
      changed = true;
    }

    // 2. Step entries: title → label.
    if (node.kind === "steps" && Array.isArray(node.items)) {
      node.items.forEach((it) => renameKey(it, "title", "label"));
    }

    // 3. Scale steps: label → name.
    if (node.kind === "scale" && Array.isArray(node.steps)) {
      node.steps.forEach((st) => renameKey(st, "label", "name"));
    }

    // 5. Status object forms: description → note.
    if (node.metadata && node.metadata.status && typeof node.metadata.status === "object") {
      const st = node.metadata.status;
      renameKey(st, "description", "note");
      if (st.platforms && typeof st.platforms === "object") {
        for (const ps of Object.values(st.platforms)) renameKey(ps, "description", "note");
      }
    }

    // 6. API events: returns → payload.
    if (node.kind === "api" && Array.isArray(node.events)) {
      node.events.forEach((ev) => renameKey(ev, "returns", "payload"));
    }

    // 7. Chunk shorthand → documentBlocks. When an equivalent block already
    // exists, that block is authoritative (the 0.13 rule) — merge in only the
    // shorthand items it does not already contain, never a duplicate block.
    if (node.kind === "chunk") {
      for (const [prop, kind] of [["guidelines", "guidelines"], ["useCases", "use-cases"]]) {
        if (!Array.isArray(node[prop])) continue;
        const items = node[prop];
        delete node[prop];
        changed = true;
        if (items.length === 0) {
          report.migrated.push(`${p}: empty top-level ${prop} removed`);
          continue;
        }
        node.documentBlocks = node.documentBlocks || [];
        const existing = node.documentBlocks.find((b) => b && b.kind === kind);
        if (!existing) {
          node.documentBlocks.push({ kind, items });
          report.migrated.push(`${p}: top-level ${prop} → documentBlocks ${kind} block`);
          continue;
        }
        const seen = new Set((existing.items || []).map((it) => JSON.stringify(it)));
        const fresh = items.filter((it) => !seen.has(JSON.stringify(it)));
        existing.items = (existing.items || []).concat(fresh);
        report.migrated.push(
          `${p}: top-level ${prop} merged into existing ${kind} block ` +
            `(${fresh.length} item(s) added, ${items.length - fresh.length} duplicate(s) dropped)`,
        );
      }
    }

    // 8. Deprecated link forms.
    if (Array.isArray(node.links)) {
      node.links.forEach((link, i) => {
        if (!link || typeof link !== "object") return;
        if (typeof link.identifier === "string") {
          report.manual.push(
            `${p}/links/${i}: identifier-bearing link ('${link.kind}' → '${link.identifier}') no longer validates — ` +
              `run scripts/migrate-relationship-links.js to convert it to a relationships edge, or rewrite it by hand`,
          );
        }
        for (const legacy of ["role", "required"]) {
          if (legacy in link) {
            delete link[legacy];
            changed = true;
            report.migrated.push(`${p}/links/${i}: dropped deprecated '${legacy}'`);
          }
        }
      });
    }

    for (const [k, v] of Object.entries(node)) {
      if (k === "$extensions") continue; // vendor blobs are opaque — never rewrite inside them
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
    console.error("Usage: node scripts/migrate-to-0.14.js <files-or-dirs…> [--dry-run]");
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

module.exports = { migrateDoc };
if (require.main === module) main();
