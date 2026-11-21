#!/usr/bin/env node
/**
 * One version, everywhere it's stated as the current version. The current version comes from
 * the bundled schema's own $id (schema/dsds.bundled.yaml), which bump-version.js rewrites with
 * everything else; package.json has to agree with it.
 *
 * Checks the places a reader or an agent takes "the current version" from:
 *   - built pages, Markdown mirrors and llms*.txt: "DSDS <version>" and "currently <version>";
 *   - manifest.json's own version fields and sitemap-independent schemaVersion values;
 *   - README, AGENTS, CONTRIBUTING and the bundled skills: the same phrases, plus schemaVersion.
 *
 * A version that's history (a "since 0.22.0" note, a CHANGELOG entry, a versioned URL) isn't
 * matched by these patterns, so it's left alone. Run via `npm run check:docs`, after
 * `npm run build` for the built half.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DIST_DIR = path.join(ROOT, "site", "dist");

const bundled = fs.readFileSync(path.join(ROOT, "schema", "dsds.bundled.yaml"), "utf-8");
const current = bundled.match(/^\$id:\s*https:\/\/designsystemdocspec\.org\/v([0-9.]+)\//m)?.[1];
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")).version;
if (!current) {
  console.error("✗ Couldn't read the current version from schema/dsds.bundled.yaml's $id.");
  process.exit(1);
}
let failures = 0;
if (pkg !== current) {
  console.error(`✗ package.json says ${pkg}, but the schema says ${current}. Run node scripts/tools/bump-version.js.`);
  failures++;
}

const PATTERNS = [
  { name: "DSDS <version>", re: /DSDS (\d+\.\d+\.\d+)/g },
  { name: "currently <version>", re: /currently (\d+\.\d+\.\d+)/g },
  // A key at the start of a line. Other `schemaVersion`s (a Custom Elements Manifest's own, say)
  // aren't DSDS's.
  { name: "schemaVersion", re: /^\s*"?schemaVersion"?:\s*"?(\d+\.\d+\.\d+)"?/gm },
  { name: "bundled spec version", re: /Bundled spec version:\*\*\s*(\d+\.\d+\.\d+)/g },
];

// A page's text as a reader sees it: entities decoded, so `schemaVersion: &quot;0.23.1&quot;` matches.
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const served = [];
const collect = (dir, keep) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    // Versioned folders hold each release's own files, which keep their own version.
    if (e.isDirectory()) {
      if (!/^v\d/.test(e.name)) collect(full, keep);
    } else if (keep(e.name)) served.push(full);
  }
};
collect(DIST_DIR, (name) => /\.(html|md|txt)$/.test(name) || name === "manifest.json");

const sources = [
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  ...fs.readdirSync(path.join(ROOT, ".agents", "skills")).map((s) => path.join(".agents", "skills", s, "SKILL.md")),
].map((f) => path.join(ROOT, f));

let checked = 0;
for (const file of [...served, ...sources]) {
  if (!fs.existsSync(file)) continue;
  checked++;
  const raw = fs.readFileSync(file, "utf-8");
  // Tags end a line: a YAML key that follows `<ds-code>` on the same line still starts one.
  const lined = decode(raw).replace(/<[^>]+>/g, "\n");
  const text = decode(raw).replace(/<[^>]+>/g, "");
  for (const { name, re } of PATTERNS) {
    const source = name === "schemaVersion" ? lined : text;
    for (const m of source.matchAll(re)) {
      if (m[1] !== current) {
        const line = source.slice(0, m.index).split("\n").length;
        console.error(`✗ ${path.relative(ROOT, file)}:${line}: "${name}" says ${m[1]}, current is ${current}`);
        failures++;
      }
    }
  }
}

// package-lock.json records the root package's version twice, and the bump script doesn't touch it.
const lock = JSON.parse(fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf-8"));
for (const [where, v] of [["package-lock.json version", lock.version], ["package-lock.json packages[\"\"].version", lock.packages?.[""]?.version]]) {
  if (v !== current) {
    console.error(`✗ ${where} is ${v}, current is ${current}`);
    failures++;
  }
}

const manifest = path.join(DIST_DIR, "manifest.json");
if (fs.existsSync(manifest)) {
  const m = JSON.parse(fs.readFileSync(manifest, "utf-8"));
  if (m.schemaVersion !== current) {
    console.error(`✗ site/dist/manifest.json: schemaVersion is ${m.schemaVersion}, current is ${current}`);
    failures++;
  }
}

if (failures) {
  console.error(`\n${failures} version string(s) differ from ${current}. Fix the source, then rebuild.`);
  process.exit(1);
}
console.log(`✓ Every current-version string says ${current}: ${checked} file(s) checked.`);
