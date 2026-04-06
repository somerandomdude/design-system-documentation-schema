#!/usr/bin/env node
/**
 * build-samples.js — Build the interactive samples page from example JSON files.
 *
 * Reads entity examples from spec/examples/, injects them into the HTML
 * template at site/samples-template.html, and writes the result to
 * site/dist/samples.html.
 *
 * Adding a new example:
 *   1. Add an entry to the SAMPLES array below with:
 *      - file:  path to the example JSON file (relative to EXAMPLES_DIR)
 *      - key:   the top-level key inside that file to extract
 *      - id:    a unique slug used for the tab id and data script id
 *      - label: the human-readable tab label
 *   2. Run `node scripts/build-samples.js`
 *
 * Usage:
 *   node scripts/build-samples.js
 *
 * Output:
 *   site/dist/samples.html
 */

const fs = require("fs");
const path = require("path");
const { buildSpecNav } = require("./nav");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const EXAMPLES_DIR = path.join(ROOT, "spec", "examples");
const TEMPLATE_PATH = path.join(ROOT, "site", "samples-template.html");
const OUTPUT_DIR = path.join(ROOT, "site", "dist");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "samples.html");

// ---------------------------------------------------------------------------
// Sample definitions
//
// Each entry describes one tab in the samples page.
//   file  — path to the example JSON file, relative to EXAMPLES_DIR
//   key   — the top-level key inside that JSON file to extract
//   id    — unique slug (used as tab id, script id, renderer key)
//   label — human-readable tab label
// ---------------------------------------------------------------------------

const SAMPLES = [
  {
    file: "entities/component.json",
    key: "component",
    id: "component",
    label: "Button Component",
  },
  {
    file: "entities/token.json",
    key: "token",
    id: "token",
    label: "Color Token",
  },
  {
    file: "entities/pattern.json",
    key: "pattern",
    id: "pattern",
    label: "Error Messaging Pattern",
  },
  {
    file: "entities/style.json",
    key: "style",
    id: "style",
    label: "Spacing Style",
  },
  {
    file: "entities/theme.json",
    key: "theme",
    id: "theme",
    label: "Dark Theme",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new SyntaxError(
      `Failed to parse ${path.relative(ROOT, filePath)}: ${err.message}`,
    );
  }
}

function escHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function buildSamples() {
  console.log("Building samples page...\n");

  // 1. Read the template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(
      `  ✗ Template not found: ${path.relative(ROOT, TEMPLATE_PATH)}`,
    );
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  // 2. Load and extract example data for each sample
  const tabButtons = [];
  const tabContents = [];
  const dataScripts = [];

  for (let i = 0; i < SAMPLES.length; i++) {
    const sample = SAMPLES[i];
    const filePath = path.join(EXAMPLES_DIR, sample.file);

    if (!fs.existsSync(filePath)) {
      console.error(
        `  ✗ Example file not found: ${path.relative(ROOT, filePath)}`,
      );
      process.exit(1);
    }

    const fullData = readJSON(filePath);
    const entityData = fullData[sample.key];

    if (!entityData) {
      console.error(
        `  ✗ Key "${sample.key}" not found in ${path.relative(ROOT, filePath)}`,
      );
      console.error(`    Available keys: ${Object.keys(fullData).join(", ")}`);
      process.exit(1);
    }

    const isFirst = i === 0;
    const activeClass = isFirst ? " active" : "";
    const jsonStr = JSON.stringify(entityData, null, 4);

    // Tab button
    tabButtons.push(
      `<button class="tab-btn${activeClass}" data-tab="${escHtml(sample.id)}">${escHtml(sample.label)}</button>`,
    );

    // Tab content container
    tabContents.push(
      `<div class="tab-content${activeClass}" id="tab-${escHtml(sample.id)}"></div>`,
    );

    // Data script block
    dataScripts.push(
      `<script id="${escHtml(sample.id)}-data" type="application/json">\n${jsonStr}\n</script>`,
    );

    console.log(
      `  ✓  ${sample.label} ← ${path.relative(ROOT, filePath)} [${sample.key}]`,
    );
  }

  // 3. Build the sample registry that the client-side JS will use.
  //    This tells the browser which data blocks to load and which
  //    renderer function to call for each tab.
  //
  //    Renderer mapping:
  //      kind === "component" | "pattern" | "style"  → renderComponent
  //      kind === "token"                            → renderToken
  //      kind === "theme"                            → renderToken (similar shape)
  //      (extensible — add more mappings as renderers are built)
  const sampleRegistryEntries = SAMPLES.map(function (s) {
    return `{ id: ${JSON.stringify(s.id)}, key: ${JSON.stringify(s.key)} }`;
  });
  const sampleRegistryJS = `[${sampleRegistryEntries.join(", ")}]`;

  // 4. Substitute placeholders in the template
  let html = template;
  html = html.replace("{{NAV}}", buildSpecNav("samples"));
  html = html.replace("{{TAB_BUTTONS}}", tabButtons.join("\n            "));
  html = html.replace("{{TAB_CONTENTS}}", tabContents.join("\n        "));
  html = html.replace("{{DATA_SCRIPTS}}", dataScripts.join("\n\n        "));
  html = html.replace("{{SAMPLE_REGISTRY}}", sampleRegistryJS);

  // 5. Write output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, html, "utf-8");

  const kb = (Buffer.byteLength(html, "utf-8") / 1024).toFixed(1);
  console.log(`\n  Written to ${path.relative(ROOT, OUTPUT_PATH)} (${kb} KB)`);
  console.log("Done.");
}

module.exports = { buildSamples };

// Run standalone when invoked directly
if (require.main === module) {
  buildSamples();
}
