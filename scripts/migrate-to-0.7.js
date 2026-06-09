#!/usr/bin/env node
/**
 * migrate-to-0.7.js — Migrate DSDS documents to the v0.7 shape.
 *
 * Accepts v0.5.x and v0.6 documents. Transforms applied (growing as v0.7
 * lands; see v0.7-simplification-plan.md):
 *
 *   D1 — metadata array → metadata object keyed by field name.
 *        Wrapper entries lose their `kind` tag; single-value kinds unwrap
 *        to scalars/arrays; status and lastUpdated collapse to a string
 *        shorthand when they carry only the common-case value.
 *   D2 — the `description` metadata entry hoists to a top-level
 *        `description` property on the entity, beside `identifier`/`name`.
 *
 * The walk is generic: any object carrying a `metadata` array whose entries
 * all have a string `kind` is treated as an entity and transformed, wherever
 * it sits (root entity, documentation groups, token-group children, keyed
 * per-definition example files). Arrays with unknown kinds are left alone
 * and reported, never silently mangled.
 *
 * Usage:
 *   node scripts/migrate-to-0.7.js <file-or-dir> [...more]
 *   node scripts/migrate-to-0.7.js --check <file-or-dir>   # report only
 */

const fs = require("fs");
const path = require("path");

const KNOWN_KINDS = new Set([
  "description",
  "summary",
  "status",
  "since",
  "last-updated",
  "category",
  "tags",
  "aliases",
  "thumbnail",
  "preview",
  "extends",
  "links",
]);

// Canonical key order for the new metadata object.
const META_KEY_ORDER = [
  "status",
  "since",
  "lastUpdated",
  "category",
  "tags",
  "aliases",
  "summary",
  "thumbnail",
  "preview",
  "extends",
  "links",
];

// Preferred leading key order for entity objects after migration.
const ENTITY_KEY_ORDER = ["kind", "identifier", "name", "description", "metadata"];

const warnings = [];

/**
 * Convert one metadata wrapper entry. Returns { key, value } for the new
 * metadata object, { hoist: value } for the description entry, or null when
 * the entry carries no payload (legal empty wrappers in 0.6).
 */
function convertEntry(entry, file) {
  switch (entry.kind) {
    case "description":
      return { hoist: entry.value };
    case "summary":
      return { key: "summary", value: entry.value };
    case "since":
      return { key: "since", value: entry.value };
    case "category":
      return { key: "category", value: entry.value };
    case "tags":
      return { key: "tags", value: entry.items };
    case "aliases":
      return { key: "aliases", value: entry.items };
    case "links":
      return { key: "links", value: entry.items };
    case "status": {
      // 0.6 uses `overall`; 0.5.x used `status`.
      const overall = entry.overall !== undefined ? entry.overall : entry.status;
      const hasDetail = entry.platforms || entry.deprecationNotice;
      if (!hasDetail) return { key: "status", value: overall };
      const value = { overall };
      if (entry.platforms) value.platforms = entry.platforms;
      if (entry.deprecationNotice) value.deprecationNotice = entry.deprecationNotice;
      return { key: "status", value };
    }
    case "last-updated": {
      if (!entry.description) return { key: "lastUpdated", value: entry.value };
      return { key: "lastUpdated", value: { date: entry.value, note: entry.description } };
    }
    case "thumbnail":
      return { key: "thumbnail", value: { url: entry.url, alt: entry.alt } };
    case "preview":
      if (!entry.presentation) return null; // empty wrapper was legal in 0.6
      return { key: "preview", value: entry.presentation };
    case "extends":
      if (!entry.extends) return null; // empty wrapper was legal in 0.6
      return { key: "extends", value: entry.extends };
    default:
      warnings.push(`${file}: unknown metadata kind "${entry.kind}" left untouched`);
      return { unknown: entry };
  }
}

function isLegacyMetadataArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((e) => e && typeof e === "object" && typeof e.kind === "string")
  );
}

/** Rebuild an entity object with migrated metadata and stable key order. */
function migrateEntity(obj, file) {
  const meta = {};
  const unknown = [];
  let hoistedDescription;

  for (const entry of obj.metadata) {
    const result = convertEntry(entry, file);
    if (!result) continue;
    if (result.unknown) {
      unknown.push(result.unknown);
    } else if ("hoist" in result) {
      hoistedDescription = result.hoist;
    } else {
      if (meta[result.key] !== undefined) {
        warnings.push(`${file}: duplicate metadata kind "${entry.kind}" — keeping the first`);
        continue;
      }
      meta[result.key] = result.value;
    }
  }

  const orderedMeta = {};
  for (const key of META_KEY_ORDER) {
    if (meta[key] !== undefined) orderedMeta[key] = meta[key];
  }
  if (unknown.length > 0) orderedMeta.$legacyEntries = unknown;

  const next = {};
  for (const key of ENTITY_KEY_ORDER) {
    if (key === "description") {
      const desc = hoistedDescription !== undefined ? hoistedDescription : obj.description;
      if (desc !== undefined) next.description = desc;
    } else if (key === "metadata") {
      if (Object.keys(orderedMeta).length > 0) next.metadata = orderedMeta;
    } else if (obj[key] !== undefined) {
      next[key] = obj[key];
    }
  }
  for (const [key, value] of Object.entries(obj)) {
    if (!ENTITY_KEY_ORDER.includes(key)) next[key] = value;
  }
  return next;
}

function walk(node, file) {
  if (Array.isArray(node)) return node.map((item) => walk(item, file));
  if (!node || typeof node !== "object") return node;

  let current = node;
  if (isLegacyMetadataArray(node.metadata)) {
    current = migrateEntity(node, file);
  }
  const result = {};
  for (const [key, value] of Object.entries(current)) {
    result[key] = walk(value, file);
  }
  return result;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".json") ? [target] : [];
  const results = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(fullPath));
    else if (entry.name.endsWith(".json")) results.push(fullPath);
  }
  return results.sort();
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const targets = args.filter((a) => a !== "--check");

  if (targets.length === 0) {
    console.error("Usage: node scripts/migrate-to-0.7.js [--check] <file-or-dir> [...more]");
    process.exit(1);
  }

  let changed = 0;
  let unchanged = 0;

  for (const target of targets) {
    for (const file of collectFiles(path.resolve(target))) {
      const rel = path.relative(process.cwd(), file);
      const original = fs.readFileSync(file, "utf-8");
      let data;
      try {
        data = JSON.parse(original);
      } catch (e) {
        warnings.push(`${rel}: invalid JSON, skipped — ${e.message}`);
        continue;
      }
      const migrated = walk(data, rel);
      const output = JSON.stringify(migrated, null, 2) + "\n";
      const originalNormalized = JSON.stringify(data, null, 2) + "\n";
      if (output === originalNormalized) {
        unchanged++;
        continue;
      }
      changed++;
      if (check) {
        console.log(`  would migrate ${rel}`);
      } else {
        fs.writeFileSync(file, output);
        console.log(`  ✓ migrated ${rel}`);
      }
    }
  }

  console.log(`\n${changed} file(s) ${check ? "need migration" : "migrated"}, ${unchanged} unchanged`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  process.exit(warnings.length > 0 && check ? 1 : 0);
}

main();
