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

  // Full DSDS document (new shape: dsdsVersion + documentGroups, no documentType)
  if (data.dsdsVersion && data.documentGroups) {
    return { name: "dsdsDocument", ref: null };
  }

  // Legacy DSDS document shape (dsdsVersion + documentType)
  if (data.dsdsVersion && data.documentType) {
    return { name: "dsdsDocument (legacy)", ref: null };
  }

  // ---------- Top-level artifact types ----------

  // tokenGroupDoc — has name + children (check BEFORE tokenDoc because groups
  // may also carry tokenType as an inherited default for their children)
  if (
    data.name &&
    data.displayName &&
    data.children &&
    Array.isArray(data.children)
  ) {
    return { name: "tokenGroupDoc", ref: "#/$defs/tokenGroupDoc" };
  }

  // tokenDoc — has name + tokenType (check BEFORE componentDoc to avoid misidentification)
  if (data.name && data.tokenType) {
    return { name: "tokenDoc", ref: "#/$defs/tokenDoc" };
  }

  // themeDoc — has name + displayName + overrides
  if (
    data.name &&
    data.displayName &&
    data.overrides &&
    Array.isArray(data.overrides)
  ) {
    return { name: "themeDoc", ref: "#/$defs/themeDoc" };
  }

  // componentDoc — has name + displayName + status + (anatomy | api | variants | states)
  if (
    data.name &&
    data.displayName &&
    data.status &&
    (data.anatomy || data.api || data.variants || data.states)
  ) {
    return { name: "componentDoc", ref: "#/$defs/componentDoc" };
  }

  // styleDoc — has name + displayName + category + (principles | scales | tokenGroups)
  if (
    data.name &&
    data.displayName &&
    data.category &&
    (data.principles || data.scales || data.tokenGroups)
  ) {
    return { name: "styleDoc", ref: "#/$defs/styleDoc" };
  }

  // patternDoc — has name + displayName + category + (components | interactions)
  if (
    data.name &&
    data.displayName &&
    data.category &&
    (data.components || data.interactions)
  ) {
    return { name: "patternDoc", ref: "#/$defs/patternDoc" };
  }

  // ---------- Reusable definition types ----------

  // Guidelines object (has guidance + rationale)
  if (data.guidance && data.rationale) {
    return { name: "guideline", ref: "#/$defs/guideline" };
  }

  // Use cases object (whenToUse / whenNotToUse)
  if (data.whenToUse || data.whenNotToUse) {
    return { name: "useCases", ref: "#/$defs/useCases" };
  }

  // Use cases wrapped in a parent object
  if (
    data.useCases &&
    (data.useCases.whenToUse || data.useCases.whenNotToUse)
  ) {
    return { name: "useCases (wrapper)", ref: null };
  }

  // Example with presentation
  if (data.presentation && data.presentation.type) {
    return { name: "example", ref: "#/$defs/example" };
  }

  // Presentation objects — recognized but NOT schema-validated standalone.
  // Spec prose shows these with extra illustrative properties (e.g., "label",
  // "storyId") that live on the parent `example` wrapper or belonged to an
  // earlier spec revision, not on the presentation schema itself.
  // They are validated when they appear inside an `example` object in the
  // per-definition example files.
  if (data.type === "image" && data.url && data.alt) {
    return { name: "presentationImage (illustrative)", ref: null };
  }
  if (data.type === "video" && data.url && data.alt) {
    return { name: "presentationVideo (illustrative)", ref: null };
  }
  if (data.type === "code" && data.code) {
    return { name: "presentationCode (illustrative)", ref: null };
  }
  if (data.type === "storybook" && data.url) {
    return { name: "presentationStorybook (illustrative)", ref: null };
  }
  if (data.type === "url" && data.url) {
    return { name: "presentationUrl (illustrative)", ref: null };
  }

  // Accessibility object (standalone)
  if (
    data.wcagLevel ||
    data.keyboardInteraction ||
    data.ariaAttributes ||
    data.colorContrast
  ) {
    return { name: "accessibilityObject", ref: "#/$defs/accessibilityObject" };
  }

  // Accessibility wrapped in parent
  if (
    data.accessibility &&
    (data.accessibility.wcagLevel || data.accessibility.keyboardInteraction)
  ) {
    return { name: "accessibility (wrapper)", ref: null };
  }

  // Link object (has type + url, no presentation-specific fields)
  // Only match when it looks like a standalone link, not a presentation type
  if (data.type && data.url && !data.alt && !data.code && !data.presentation) {
    return { name: "link", ref: "#/$defs/link" };
  }

  // Link array wrapper
  if (
    data.links &&
    Array.isArray(data.links) &&
    data.links.length > 0 &&
    data.links[0].type &&
    data.links[0].url
  ) {
    return { name: "links (wrapper)", ref: null };
  }

  // Principle (has title + description, no guidance)
  if (data.title && data.description && !data.guidance) {
    return { name: "principle", ref: "#/$defs/principle" };
  }

  // Principles array wrapper
  if (data.principles && Array.isArray(data.principles)) {
    return { name: "principles (wrapper)", ref: null };
  }

  // Scale (has name + steps)
  if (data.name && data.steps && Array.isArray(data.steps)) {
    return { name: "scale", ref: "#/$defs/scale" };
  }

  // Scales array wrapper
  if (data.scales && Array.isArray(data.scales)) {
    return { name: "scales (wrapper)", ref: null };
  }

  // Interaction (has trigger or description + components)
  if (data.trigger && data.description) {
    return { name: "interaction", ref: "#/$defs/interaction" };
  }

  // Token value (has resolved or reference or dtcgFile, nothing else artifact-like)
  if (
    (data.resolved || data.reference || data.dtcgFile) &&
    !data.name &&
    !data.displayName
  ) {
    return { name: "tokenValue", ref: "#/$defs/tokenValue" };
  }

  // Token override (has token + value)
  if (data.token && data.value && !data.name) {
    return { name: "tokenOverride", ref: "#/$defs/tokenOverride" };
  }

  // Anatomy (has parts array)
  if (data.parts && Array.isArray(data.parts)) {
    return { name: "anatomy", ref: "#/$defs/anatomy" };
  }

  // Anatomy wrapped in parent
  if (data.anatomy && data.anatomy.parts) {
    return { name: "anatomy (wrapper)", ref: null };
  }

  // Token API (open map with known keys)
  if (data.cssCustomProperty || data.scssVariable || data.jsConstant) {
    return { name: "tokenApi", ref: "#/$defs/tokenApi" };
  }

  // Token with api wrapper
  if (data.api && (data.api.cssCustomProperty || data.api.scssVariable)) {
    return { name: "token (partial)", ref: null };
  }

  // Component reference (has name + role)
  if (data.name && data.role && !data.displayName) {
    return { name: "artifactReference", ref: "#/$defs/artifactReference" };
  }

  // Components array wrapper (pattern-like)
  if (data.components && Array.isArray(data.components)) {
    return { name: "components (wrapper)", ref: null };
  }

  // Token groups wrapper
  if (data.tokenGroups && Array.isArray(data.tokenGroups)) {
    return { name: "tokenGroups (wrapper)", ref: null };
  }

  // Interactions array wrapper
  if (data.interactions && Array.isArray(data.interactions)) {
    return { name: "interactions (wrapper)", ref: null };
  }

  // Examples array wrapper
  if (data.examples && Array.isArray(data.examples)) {
    return { name: "examples (wrapper)", ref: null };
  }

  // Guidelines array (flat)
  if (data.guidelines && Array.isArray(data.guidelines)) {
    return { name: "guidelines (wrapper)", ref: null };
  }

  // Color contrast object
  if (data.foreground && data.background && data.contrastRatio) {
    return { name: "colorContrast", ref: "#/$defs/colorContrast" };
  }

  // Keyboard interaction
  if (data.key && data.action) {
    return { name: "keyboardInteraction", ref: "#/$defs/keyboardInteraction" };
  }

  // ARIA attribute
  if (data.attribute && data.description && !data.guidance) {
    return { name: "ariaAttribute", ref: "#/$defs/ariaAttribute" };
  }

  // Metadata
  if (data.systemName || data.systemVersion || data.organization) {
    return { name: "metadata", ref: "#/$defs/metadata" };
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
