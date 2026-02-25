#!/usr/bin/env node
/**
 * bundle.js — Bundle all split DSDS schema files into dsds.bundled.schema.json.
 *
 * Reads every .schema.json file from the split schema directories, collects all
 * $defs into a single flat namespace, rewrites all $ref paths to use internal
 * #/$defs/name references, validates internal references, and writes the output.
 *
 * Usage:
 *   node scripts/bundle.js
 *
 * Output:
 *   spec/schema/dsds.bundled.schema.json
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");
const ROOT_SCHEMA = path.join(SCHEMA_DIR, "dsds.schema.json");
const OUTPUT = path.join(SCHEMA_DIR, "dsds.bundled.schema.json");

// Directories containing split schema files (stable order for deterministic output)
const SPLIT_DIRS = [
  path.join(SCHEMA_DIR, "common"),
  path.join(SCHEMA_DIR, "guidelines"),
  path.join(SCHEMA_DIR, "entities"),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively list all files matching a pattern in a directory.
 */
function listSchemaFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".schema.json"))
    .sort()
    .map((f) => path.join(dir, f));
}

/**
 * Read and parse a JSON file.
 */
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// ---------------------------------------------------------------------------
// Collect all $defs from split files
// ---------------------------------------------------------------------------

function collectDefs() {
  const allDefs = {};
  const seenFiles = [];

  for (const dir of SPLIT_DIRS) {
    for (const filePath of listSchemaFiles(dir)) {
      const data = readJSON(filePath);
      const defs = data.$defs || {};
      const relPath = path.relative(SCHEMA_DIR, filePath);

      for (const [name, body] of Object.entries(defs)) {
        if (name in allDefs) {
          console.error(
            `  ⚠  Duplicate $def '${name}' in ${relPath} (already collected). Using latest.`,
          );
        }
        allDefs[name] = body;
      }

      seenFiles.push(relPath);
    }
  }

  // Also collect $defs from the root schema itself (e.g., collectionDoc)
  const rootData = readJSON(ROOT_SCHEMA);
  for (const [name, body] of Object.entries(rootData.$defs || {})) {
    if (name in allDefs) {
      console.error(
        `  ⚠  Duplicate $def '${name}' in root schema (already collected). Using latest.`,
      );
    }
    allDefs[name] = body;
  }

  console.log(
    `  Collected ${Object.keys(allDefs).length} definitions from ${seenFiles.length + 1} files:`,
  );
  for (const f of seenFiles) {
    console.log(`    ${f}`);
  }
  console.log(`    dsds.schema.json (root)`);

  return allDefs;
}

// ---------------------------------------------------------------------------
// Rewrite $ref paths to internal #/$defs/name
// ---------------------------------------------------------------------------

/**
 * Convert a file-relative $ref to an internal #/$defs/name reference.
 *
 * Examples:
 *   "../common/rich-text.schema.json#/$defs/richText" -> "#/$defs/richText"
 *   "rich-text.schema.json#/$defs/richText"           -> "#/$defs/richText"
 *   "variant.schema.json#/$defs/variant"              -> "#/$defs/variant"
 *   "#/$defs/someLocal"                               -> "#/$defs/someLocal"
 *   "common/metadata.schema.json#/$defs/metadata"     -> "#/$defs/metadata"
 */
function resolveRef(ref) {
  // Already an internal ref
  if (ref.startsWith("#/")) {
    return ref;
  }

  // Split off the fragment
  const hashIndex = ref.indexOf("#");
  if (hashIndex !== -1) {
    const fragment = ref.slice(hashIndex + 1);
    const parts = fragment.replace(/^\//, "").split("/");
    if (parts.length === 2 && parts[0] === "$defs") {
      return `#/$defs/${parts[1]}`;
    }
  }

  // Can't parse — return as-is (shouldn't happen in valid schemas)
  return ref;
}

/**
 * Recursively rewrite all $ref values in a JSON object.
 */
function rewriteRefs(obj) {
  if (Array.isArray(obj)) {
    return obj.map(rewriteRefs);
  }
  if (obj !== null && typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "$ref" && typeof value === "string") {
        result[key] = resolveRef(value);
      } else {
        result[key] = rewriteRefs(value);
      }
    }
    return result;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Build the bundled schema
// ---------------------------------------------------------------------------

function buildBundled() {
  // Read the root schema as the base
  const root = readJSON(ROOT_SCHEMA);

  // Collect all definitions
  const allDefs = collectDefs();

  // Rewrite all $ref paths in every definition
  const rewrittenDefs = {};
  for (const [name, body] of Object.entries(allDefs)) {
    rewrittenDefs[name] = rewriteRefs(body);
  }

  // Build the bundled document
  const bundled = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://designsystemdocspec.org/v0.1/dsds.bundled.schema.json",
    title: "Design System Documentation Standard (DSDS) v0.1 — Bundled",
    description:
      "Single-file bundled version of the DSDS schema. " +
      "Auto-generated from the split schema files by scripts/bundle.js. " +
      "Use the split files for development; use this file for tools that require " +
      "a single schema document.",
  };

  // Copy top-level structural properties from root, rewriting refs
  if (root.type) bundled.type = root.type;
  if (root.required) bundled.required = root.required;
  if (root.properties) bundled.properties = rewriteRefs(root.properties);
  if (root.allOf) bundled.allOf = rewriteRefs(root.allOf);

  // Attach all definitions
  bundled.$defs = rewrittenDefs;

  return bundled;
}

// ---------------------------------------------------------------------------
// Validate internal references
// ---------------------------------------------------------------------------

/**
 * Check that every #/$defs/X reference points to an existing definition.
 */
function validateInternalRefs(bundled) {
  const available = new Set(Object.keys(bundled.$defs || {}));
  const issues = [];

  function check(obj, objPath) {
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => check(item, `${objPath}[${i}]`));
    } else if (obj !== null && typeof obj === "object") {
      for (const [key, value] of Object.entries(obj)) {
        if (
          key === "$ref" &&
          typeof value === "string" &&
          value.startsWith("#/$defs/")
        ) {
          const defName = value.split("/").pop();
          if (!available.has(defName)) {
            issues.push(`${objPath}.$ref -> ${value} (not found)`);
          }
        } else {
          check(value, `${objPath}.${key}`);
        }
      }
    }
  }

  check(bundled, "");
  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Bundling DSDS schemas...\n");

  const bundled = buildBundled();

  // Validate internal references
  console.log("\n  Validating internal references...");
  const issues = validateInternalRefs(bundled);

  if (issues.length > 0) {
    console.error(`\n  ✗ ${issues.length} broken reference(s):`);
    for (const issue of issues) {
      console.error(`    ${issue}`);
    }
    process.exit(1);
  } else {
    const defCount = Object.keys(bundled.$defs || {}).length;
    console.log(`  ✓ All references resolve (${defCount} definitions)`);
  }

  // Write output
  const output = JSON.stringify(bundled, null, 2) + "\n";
  fs.writeFileSync(OUTPUT, output, "utf-8");
  const relPath = path.relative(ROOT, OUTPUT);
  console.log(`\n  Written to ${relPath}`);

  // Final JSON parse check
  JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
  console.log("  ✓ Output is valid JSON");

  console.log("\nDone.");
}

main();
