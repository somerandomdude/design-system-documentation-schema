#!/usr/bin/env node
/**
 * validate.js — Validate DSDS example files and spec module JSON snippets.
 *
 * Validates:
 *   1. All .dsds.json files in spec/examples/ against the bundled schema
 *   2. All JSON code blocks in spec/modules/*.md against individual schema
 *      definitions (where the snippet is a recognizable fragment)
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
const MODULES_DIR = path.join(ROOT, "spec/modules");
const SCHEMA_DIR = path.join(ROOT, "spec/schema");

// Schema directories that have matching example directories
const SCHEMA_EXAMPLE_DIRS = [
  "common",
  "components",
  "tokens",
  "style",
  "patterns",
];

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

  const files = fs
    .readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith(".dsds.json"))
    .sort();

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const file of files) {
    const filePath = path.join(EXAMPLES_DIR, file);
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
// Part 2: Extract and validate JSON snippets from markdown modules
// ---------------------------------------------------------------------------

/**
 * Extract fenced JSON code blocks from markdown text.
 * Returns an array of { lineNumber, code } objects.
 */
function extractJsonBlocks(markdownText) {
  const blocks = [];
  const lines = markdownText.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^```json\s*$/i.test(line.trim())) {
      const startLine = i + 1;
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        lineNumber: startLine + 1, // 1-based
        code: codeLines.join("\n"),
      });
    }
    i++;
  }

  return blocks;
}

/**
 * Try to identify what schema definition a JSON snippet represents,
 * based on its shape (duck typing).
 */
function identifySnippetType(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  // Full DSDS document
  if (data.dsdsVersion && data.documentType) {
    return { name: "dsdsDocument", ref: null };
  }

  // Guidelines object (has guidance + rationale)
  if (data.guidance && data.rationale) {
    return { name: "guideline", ref: "#/$defs/guideline" };
  }

  // Use cases object
  if (
    data.useCases &&
    (data.useCases.whenToUse || data.useCases.whenNotToUse)
  ) {
    return { name: "useCases (wrapper)", ref: null };
  }
  if (data.whenToUse || data.whenNotToUse) {
    return { name: "useCases", ref: "#/$defs/useCases" };
  }

  // Example with presentation
  if (data.presentation && data.presentation.type) {
    return { name: "example", ref: "#/$defs/example" };
  }

  // Accessibility object
  if (
    data.accessibility &&
    (data.accessibility.wcagLevel || data.accessibility.keyboardInteraction)
  ) {
    return { name: "accessibility (wrapper)", ref: null };
  }

  // Link array
  if (data.links && Array.isArray(data.links)) {
    return { name: "links (wrapper)", ref: null };
  }

  // Principles
  if (data.principles && Array.isArray(data.principles)) {
    return { name: "principles (wrapper)", ref: null };
  }

  // Scale
  if (data.scales && Array.isArray(data.scales)) {
    return { name: "scales (wrapper)", ref: null };
  }

  // Token API
  if (data.api && (data.api.cssCustomProperty || data.api.scssVariable)) {
    return { name: "token (partial)", ref: null };
  }

  // Component with anatomy
  if (data.anatomy && data.anatomy.parts) {
    return { name: "component (partial)", ref: null };
  }

  // Components array
  if (data.components && Array.isArray(data.components)) {
    return { name: "pattern (partial)", ref: null };
  }

  // Token groups
  if (data.tokenGroups && Array.isArray(data.tokenGroups)) {
    return { name: "style (partial)", ref: null };
  }

  // Interactions
  if (data.interactions && Array.isArray(data.interactions)) {
    return { name: "interactions (wrapper)", ref: null };
  }

  // Examples array
  if (data.examples && Array.isArray(data.examples)) {
    return { name: "examples (wrapper)", ref: null };
  }

  // Guidelines array (flat)
  if (data.guidelines && Array.isArray(data.guidelines)) {
    return { name: "guidelines (wrapper)", ref: null };
  }

  return null;
}

function validateModuleSnippets(ajv) {
  console.log("━━━ Validating spec module JSON snippets ━━━\n");

  // Load the bundled schema for definition-level validation
  const schema = JSON.parse(fs.readFileSync(BUNDLED_SCHEMA_PATH, "utf-8"));
  const defs = schema.$defs || {};

  // Pre-compile validators for known definitions
  const defValidators = {};
  for (const [name, defSchema] of Object.entries(defs)) {
    try {
      // Create a standalone schema from the definition
      const standalone = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: schema.$defs,
        ...defSchema,
      };
      defValidators[name] = ajv.compile(standalone);
    } catch (e) {
      // Some defs may not compile standalone — skip them
    }
  }

  const mdFiles = fs
    .readdirSync(MODULES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  let totalBlocks = 0;
  let validJson = 0;
  let invalidJson = 0;
  let schemaValidated = 0;
  let schemaFailed = 0;
  let skipped = 0;
  const errors = [];

  for (const file of mdFiles) {
    const filePath = path.join(MODULES_DIR, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const blocks = extractJsonBlocks(text);

    if (blocks.length === 0) continue;

    console.log(
      `  ${file} (${blocks.length} JSON block${blocks.length === 1 ? "" : "s"})`,
    );

    for (const block of blocks) {
      totalBlocks++;
      let data;

      // Skip blocks with ellipsis — these are intentional abbreviations in spec prose
      if (block.code.includes("...") || block.code.includes("…")) {
        console.log(
          `    ~ Line ${block.lineNumber}: abbreviated snippet (contains ellipsis — skipped)`,
        );
        skipped++;
        continue;
      }

      try {
        data = JSON.parse(block.code);
      } catch (e) {
        console.error(
          `    ✗ Line ${block.lineNumber}: Invalid JSON — ${e.message}`,
        );
        invalidJson++;
        errors.push({
          file,
          line: block.lineNumber,
          error: `Invalid JSON: ${e.message}`,
        });
        continue;
      }

      validJson++;

      // Try to identify and validate against a specific definition
      const snippetType = identifySnippetType(data);

      if (snippetType && snippetType.ref) {
        const defName = snippetType.ref.split("/").pop();
        const validator = defValidators[defName];

        if (validator) {
          const valid = validator(data);
          if (valid) {
            console.log(
              `    ✓ Line ${block.lineNumber}: valid ${snippetType.name}`,
            );
            schemaValidated++;
          } else {
            console.error(
              `    ✗ Line ${block.lineNumber}: invalid ${snippetType.name}`,
            );
            for (const err of validator.errors.slice(0, 5)) {
              const loc = err.instancePath || "(root)";
              const msg = err.message || JSON.stringify(err.params);
              console.error(`        ${loc}: ${msg}`);
              errors.push({
                file,
                line: block.lineNumber,
                type: snippetType.name,
                path: loc,
                message: msg,
              });
            }
            schemaFailed++;
          }
        } else {
          console.log(
            `    ~ Line ${block.lineNumber}: valid JSON, ${snippetType.name} (no standalone validator)`,
          );
          skipped++;
        }
      } else if (snippetType) {
        console.log(
          `    ~ Line ${block.lineNumber}: valid JSON, ${snippetType.name} (partial — not schema-validated)`,
        );
        skipped++;
      } else {
        console.log(
          `    ~ Line ${block.lineNumber}: valid JSON (unrecognized shape — skipped)`,
        );
        skipped++;
      }
    }
  }

  console.log(
    `\n  ${totalBlocks} blocks: ${validJson} valid JSON, ${invalidJson} invalid JSON`,
  );
  console.log(
    `  Schema validation: ${schemaValidated} passed, ${schemaFailed} failed, ${skipped} skipped\n`,
  );

  return {
    totalBlocks,
    validJson,
    invalidJson,
    schemaValidated,
    schemaFailed,
    skipped,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Part 3: Validate per-definition example files against their schema defs
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

  for (const dir of SCHEMA_EXAMPLE_DIRS) {
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

  console.log(`\n  ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  return { passed, failed, skipped, errors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("\nDSDS Schema Validation\n");
  console.log(`Schema: ${path.relative(ROOT, BUNDLED_SCHEMA_PATH)}`);
  console.log(`Examples: ${path.relative(ROOT, EXAMPLES_DIR)}/`);
  console.log(`Modules: ${path.relative(ROOT, MODULES_DIR)}/\n`);

  const ajv = createValidator();

  // Part 1: Validate full document example files
  const exampleResults = validateExamples(ajv);

  // Part 2: Validate module snippets (fresh Ajv instance to avoid schema conflicts)
  const snippetAjv = createValidator();
  const snippetResults = validateModuleSnippets(snippetAjv);

  // Part 3: Validate per-definition example files
  const defAjv = createValidator();
  const defResults = validateDefinitionExamples(defAjv);

  // Summary
  console.log("━━━ Summary ━━━\n");

  const totalPassed =
    exampleResults.passed + snippetResults.schemaValidated + defResults.passed;
  const totalFailed =
    exampleResults.failed +
    snippetResults.invalidJson +
    snippetResults.schemaFailed +
    defResults.failed;

  console.log(
    `  Documents: ${exampleResults.passed} passed, ${exampleResults.failed} failed`,
  );
  console.log(
    `  Snippets:  ${snippetResults.validJson} valid JSON, ${snippetResults.invalidJson} invalid`,
  );
  console.log(
    `             ${snippetResults.schemaValidated} schema-validated, ${snippetResults.schemaFailed} schema-failed, ${snippetResults.skipped} skipped`,
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
