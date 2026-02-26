#!/usr/bin/env node
/**
 * validate.js — Validate DSDS example files against the bundled schema.
 *
 * Validates:
 *   1. All .dsds.json files in spec/examples/ (recursively) against the bundled schema
 *   2. All per-definition example files in spec/examples/{common,guidelines,entities}/
 *      against their matching $defs in the bundled schema
 *   3. Bare entity files (e.g. spec/examples/minimal/*.json) against their
 *      entity $def, detected via the top-level `type` property
 *
 * Usage:
 *   node scripts/validate.js
 *
 * Requires:
 *   npm install ajv ajv-formats
 */

const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const BUNDLED_SCHEMA_PATH = path.join(
  ROOT,
  "spec/schema/dsds.bundled.schema.json",
);
const EXAMPLES_DIR = path.join(ROOT, "spec/examples");
const SCHEMA_DIR = path.join(ROOT, "spec/schema");

// Directories containing keyed per-definition example files ({ defName: value })
const KEYED_EXAMPLE_DIRS = ["common", "guidelines", "entities"];

// Directories containing bare entity example files ({ type: "component", ... })
const BARE_ENTITY_DIRS = ["minimal"];

// ---------------------------------------------------------------------------
// Setup Ajv
// ---------------------------------------------------------------------------

function createValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: true,
  });
  addFormats(ajv);
  return ajv;
}

// ---------------------------------------------------------------------------
// Part 1: Validate example .dsds.json files against the bundled schema
// ---------------------------------------------------------------------------

/**
 * Recursively find all files matching a suffix under a directory.
 */
function findFilesRecursive(dir, suffix) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, suffix));
    } else if (entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function validateExamples(ajv) {
  console.log("━━━ Validating example files ━━━\n");

  const schemaText = fs.readFileSync(BUNDLED_SCHEMA_PATH, "utf-8");
  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (e) {
    console.error(`  ✗ Failed to parse bundled schema: ${e.message}`);
    return { passed: 0, failed: 1, errors: [] };
  }

  const validate = ajv.compile(schema);

  const files = findFilesRecursive(EXAMPLES_DIR, ".dsds.json");

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const filePath of files) {
    const file = path.relative(EXAMPLES_DIR, filePath);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error(`  ✗ ${file}: Invalid JSON — ${e.message}`);
      failed++;
      errors.push({ file, error: `Invalid JSON: ${e.message}` });
      continue;
    }

    const valid = validate(data);
    if (valid) {
      console.log(`  ✓ ${file}`);
      passed++;
    } else {
      console.error(`  ✗ ${file}`);
      for (const err of validate.errors) {
        const loc = err.instancePath || "(root)";
        const msg = err.message || JSON.stringify(err.params);
        console.error(`      ${loc}: ${msg}`);
        errors.push({ file, path: loc, message: msg });
      }
      failed++;
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}

// ---------------------------------------------------------------------------
// Part 2: Validate per-definition example files against their schema defs
// ---------------------------------------------------------------------------

function validateDefinitionExamples(ajv) {
  console.log("━━━ Validating per-definition example files ━━━\n");

  const schema = JSON.parse(fs.readFileSync(BUNDLED_SCHEMA_PATH, "utf-8"));
  const defs = schema.$defs || {};

  // Pre-compile validators for each definition
  const defValidators = {};
  for (const [name, defSchema] of Object.entries(defs)) {
    try {
      const standalone = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: schema.$defs,
        ...defSchema,
      };
      defValidators[name] = ajv.compile(standalone);
    } catch (e) {
      // Some defs may not compile standalone — skip
    }
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const errors = [];

  // --- Keyed example files: { defName: value | value[] } ---

  for (const dir of KEYED_EXAMPLE_DIRS) {
    const exampleDir = path.join(EXAMPLES_DIR, dir);
    if (!fs.existsSync(exampleDir)) continue;

    const files = fs
      .readdirSync(exampleDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const file of files) {
      const filePath = path.join(exampleDir, file);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.error(`  ✗ ${dir}/${file}: Invalid JSON — ${e.message}`);
        failed++;
        errors.push({
          file: `${dir}/${file}`,
          error: `Invalid JSON: ${e.message}`,
        });
        continue;
      }

      const defNames = Object.keys(data);
      let fileOk = true;

      for (const defName of defNames) {
        const exampleValue = data[defName];
        const validator = defValidators[defName];

        if (!validator) {
          console.log(
            `  ~ ${dir}/${file} → ${defName}: no standalone validator (skipped)`,
          );
          skipped++;
          continue;
        }

        // The example value can be a single instance or an array of instances
        const instances = Array.isArray(exampleValue)
          ? exampleValue
          : [exampleValue];

        for (let idx = 0; idx < instances.length; idx++) {
          const instance = instances[idx];
          const label = Array.isArray(exampleValue)
            ? `${defName}[${idx}]`
            : defName;

          const valid = validator(instance);
          if (valid) {
            passed++;
          } else {
            fileOk = false;
            console.error(`  ✗ ${dir}/${file} → ${label}`);
            for (const err of validator.errors.slice(0, 3)) {
              const loc = err.instancePath || "(root)";
              const msg = err.message || JSON.stringify(err.params);
              console.error(`      ${loc}: ${msg}`);
              errors.push({
                file: `${dir}/${file}`,
                def: label,
                path: loc,
                message: msg,
              });
            }
            failed++;
          }
        }
      }

      if (fileOk) {
        console.log(
          `  ✓ ${dir}/${file} (${defNames.length} definition${defNames.length === 1 ? "" : "s"})`,
        );
      }
    }
  }

  // --- Bare entity files: { type: "component", name: "...", ... } ---
  // Detected by a top-level `type` property whose value matches a known $def.

  for (const dir of BARE_ENTITY_DIRS) {
    const exampleDir = path.join(EXAMPLES_DIR, dir);
    if (!fs.existsSync(exampleDir)) continue;

    const files = fs
      .readdirSync(exampleDir)
      .filter((f) => f.endsWith(".json") && !f.endsWith(".dsds.json"))
      .sort();

    for (const file of files) {
      const filePath = path.join(exampleDir, file);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.error(`  ✗ ${dir}/${file}: Invalid JSON — ${e.message}`);
        failed++;
        errors.push({
          file: `${dir}/${file}`,
          error: `Invalid JSON: ${e.message}`,
        });
        continue;
      }

      // Determine the def name from the type property
      const typeName = data.type;
      const defName = typeName === "token-group" ? "tokenGroup" : typeName;
      const validator = defValidators[defName];

      if (!validator) {
        console.log(
          `  ~ ${dir}/${file}: type "${typeName}" has no standalone validator (skipped)`,
        );
        skipped++;
        continue;
      }

      const valid = validator(data);
      if (valid) {
        console.log(`  ✓ ${dir}/${file} (${defName})`);
        passed++;
      } else {
        console.error(`  ✗ ${dir}/${file} → ${defName}`);
        for (const err of validator.errors.slice(0, 3)) {
          const loc = err.instancePath || "(root)";
          const msg = err.message || JSON.stringify(err.params);
          console.error(`      ${loc}: ${msg}`);
          errors.push({
            file: `${dir}/${file}`,
            def: defName,
            path: loc,
            message: msg,
          });
        }
        failed++;
      }
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  return { passed, failed, skipped, errors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("\nDSDS Schema Validation\n");
  console.log(`Schema: ${path.relative(ROOT, BUNDLED_SCHEMA_PATH)}`);
  console.log(`Examples: ${path.relative(ROOT, EXAMPLES_DIR)}/\n`);

  const ajv = createValidator();

  // Part 1: Validate full document example files
  const exampleResults = validateExamples(ajv);

  // Part 2: Validate per-definition example files
  const defAjv = createValidator();
  const defResults = validateDefinitionExamples(defAjv);

  // Summary
  console.log("━━━ Summary ━━━\n");

  const totalPassed = exampleResults.passed + defResults.passed;
  const totalFailed = exampleResults.failed + defResults.failed;

  console.log(
    `  Documents: ${exampleResults.passed} passed, ${exampleResults.failed} failed`,
  );
  console.log(
    `  Defs:      ${defResults.passed} passed, ${defResults.failed} failed, ${defResults.skipped} skipped`,
  );
  console.log(`  Total:     ${totalPassed} passed, ${totalFailed} failed\n`);

  if (totalFailed > 0) {
    console.error("Validation failed.\n");
    process.exit(1);
  } else {
    console.log("All validations passed.\n");
    process.exit(0);
  }
}

main();
