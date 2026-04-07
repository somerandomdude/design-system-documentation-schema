#!/usr/bin/env node
/**
 * build-samples.js — Build the interactive samples page.
 *
 * Reads entity examples from spec/examples/, renders them at build time
 * using the render-entity module, and injects the pre-rendered HTML into
 * the samples template.
 *
 * The renderers run server-side — no client-side rendering is needed.
 * The only client-side JS handles tab switching and hover highlighting.
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
const { renderComponent, renderToken, resetFid } = require("./render-entity");

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
//   id    — unique slug (used as tab id)
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

/**
 * Pick the right renderer based on entity kind.
 * Components, patterns, and styles use renderComponent.
 * Tokens and themes use renderToken.
 */
function pickRenderer(kind) {
  return kind === "token" || kind === "theme" ? renderToken : renderComponent;
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

  // 2. Load examples, render at build time
  const tabPanels = [];

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

    // Reset field ID counter between samples so IDs don't collide
    resetFid();

    // Pick renderer and produce HTML at build time
    const kind = entityData.kind || sample.key;
    const renderer = pickRenderer(kind);
    const renderedHTML = renderer(entityData);

    // Tab panel — <ds-tabs> component handles switching
    tabPanels.push(
      `<ds-tab label="${escHtml(sample.label)}" id="tab-${escHtml(sample.id)}">${renderedHTML}</ds-tab>`,
    );

    console.log(
      `  ✓  ${sample.label} ← ${path.relative(ROOT, filePath)} [${sample.key}]`,
    );
  }

  // 3. Substitute placeholders in the template
  let html = template;
  html = html.replace("{{NAV}}", buildSpecNav("samples"));
  html = html.replace("{{TAB_CONTENTS}}", tabPanels.join("\n        "));

  // 4. Write output
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
