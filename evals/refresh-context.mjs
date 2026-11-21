#!/usr/bin/env node
/**
 * Refreshes evals/context/ from the built site (site/dist/), so the agent eval reads the
 * pages of the current version and nothing else. Run `npm run build` first. It refuses to run
 * if the built site isn't the current version, and it keeps evals/context/tokens.dtcg.json,
 * which is a fixture, not a page.
 *
 *   node evals/refresh-context.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "site", "dist");
const CONTEXT = path.join(__dirname, "context");

// The pages an agent reads, by the name the eval's prompts list them under.
const PAGES = {
  "llms-small.txt": "llms-small.txt",
  "quickstart.md": "quickstart.md",
  "specification.md": "specification.md",
  "processing.md": "processing.md",
  "style-guide.md": "style-guide.md",
  ...Object.fromEntries(
    ["entries-component", "entries-token", "entries-theme", "entries-entry", "entries-system",
      "sections-guidelines", "sections-steps", "sections-definitions",
      "common-ref", "common-combo", "common-markdown"].map((n) => [`schema_${n}.md`, path.join("schema", `${n}.md`)]),
  ),
};

const current = fs.readFileSync(path.join(ROOT, "schema", "dsds.bundled.yaml"), "utf-8")
  .match(/^\$id:\s*https:\/\/designsystemdocspec\.org\/v([0-9.]+)\//m)?.[1];
if (!current) {
  console.error("✗ Couldn't read the current version from schema/dsds.bundled.yaml.");
  process.exit(1);
}
const quickstart = path.join(DIST, "quickstart.md");
if (!fs.existsSync(quickstart) || !fs.readFileSync(quickstart, "utf-8").includes(current)) {
  console.error(`✗ site/dist/ isn't a build of ${current}. Run npm run build, then try again.`);
  process.exit(1);
}

fs.mkdirSync(CONTEXT, { recursive: true });
for (const [name, source] of Object.entries(PAGES)) {
  const from = path.join(DIST, source);
  if (!fs.existsSync(from)) {
    console.error(`✗ ${from} is missing. Run npm run build.`);
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(CONTEXT, name));
}
console.log(`✓ evals/context/ holds ${Object.keys(PAGES).length} page(s) of ${current}.`);
