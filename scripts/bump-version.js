#!/usr/bin/env node
/**
 * bump-version.js — Cut a new versioned DSDS spec build.
 *
 * There's no single version field. Every `schema/**\/*.schema.yaml` file's
 * own `$id` (and every `$ref` inside it) independently encodes the version
 * as a `designsystemdocspec.org/v<version>/` URL segment. This script finds
 * every one of those and every other place the version is duplicated, and
 * rewrites them all in one pass:
 *
 *   - Every schema/**\/*.schema.yaml file's own $id/$ref URLs
 *   - scripts/bundle.js's two hardcoded literals ($id, title) — the
 *     bundled schema's version comes from these, not from reading the
 *     split files, since bundle.js writes it fresh on every run
 *   - Every example/test .dsds.yaml base document's `schemaVersion` value
 *   - README.md's one hardcoded $schema URL suggestion
 *   - package.json#version
 *
 * The MDX content pages (site/content/) are NOT rewritten here: they use
 * the {{VERSION}} token, substituted at build time by compile-mdx.mjs from
 * the same source this script reads the current version from
 * (schema/dsds.bundled.yaml's own $id). A bump therefore propagates
 * to every site page on the next `npm run build`, with no MDX rewriting.
 *
 * After a successful bump the script runs `npm run bundle` (regenerate the
 * bundled schema with the new version baked in) and
 * `npm run sync-skill-versions` (keep .agents/skills/dsds-*'s version
 * references in lockstep). Run `npm run build` separately to publish the
 * versioned dist directory, and `npm run check` to confirm everything
 * still validates.
 *
 * Usage:
 *   node scripts/bump-version.js <new-version>          # bump, bundle, sync skills
 *   node scripts/bump-version.js <new-version> --dry-run # preview only
 *   node scripts/bump-version.js <new-version> --schemas-only
 *                                                       # only touch schema/ + bundle.js
 *   node scripts/bump-version.js --help
 *
 * <new-version> is a bare version string (ex: 0.20.1, 0.21.0, 1.0.0).
 * The leading "v" is not included — every URL in this repo is
 * constructed as `/v<version>/`.
 *
 * Exits non-zero on:
 *   - Missing or malformed new version argument
 *   - New version equal to current version
 *   - Current version can't be read (run `npm run bundle` first)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readSpecVersion } = require("./nav");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "schema");
const BUNDLE_SCRIPT = path.join(ROOT, "scripts", "bundle.js");
const README = path.join(ROOT, "README.md");
const PKG = path.join(ROOT, "package.json");

// Base documents outside schema/ that carry their own `schemaVersion:
// "<version>"` value — every .dsds.yaml fixture/example in the repo.
const DSDS_DOC_ROOTS = [path.join(ROOT, "examples"), path.join(ROOT, "test")];

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
bump-version — cut a new versioned DSDS spec build

Usage:
  node scripts/bump-version.js <new-version> [options]

Arguments:
  <new-version>     Bare version string (ex: 0.20.1, 0.21.0, 1.0.0).

Options:
  --dry-run          Print planned changes without modifying anything.
  --schemas-only      Only touch schema/**/*.schema.yaml and bundle.js.
                      Skip examples, test fixtures, README, package.json.
  --no-bundle         Skip the post-bump 'npm run bundle' step.
  --no-sync-skills    Skip the post-bump 'npm run sync-skill-versions' step.
  --help, -h          Show this help.

Examples:
  node scripts/bump-version.js 0.20.1
  node scripts/bump-version.js 0.20.1 --dry-run
  node scripts/bump-version.js 1.0.0 --schemas-only --no-bundle
`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

if (positional.length !== 1) {
  console.error("✗ Expected exactly one positional argument: <new-version>");
  console.error("  Run with --help for usage.");
  process.exit(1);
}

const NEW_VERSION = positional[0];
const DRY_RUN = flags.has("--dry-run");
const SCHEMAS_ONLY = flags.has("--schemas-only");
const SKIP_BUNDLE = flags.has("--no-bundle");
const SKIP_SYNC_SKILLS = flags.has("--no-sync-skills");

// A version is "loose semver" — one or more dot-separated identifiers.
// We're permissive on purpose so 0.20.1, 1.0.0-beta.1, etc. all work.
if (!/^[A-Za-z0-9]+(\.[A-Za-z0-9-]+)*$/.test(NEW_VERSION)) {
  console.error(`✗ Invalid version string: "${NEW_VERSION}"`);
  console.error("  Expected something like 0.20.1, 0.21.0, or 1.0.0-beta.1.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read current version
// ---------------------------------------------------------------------------

const CURRENT_VERSION = readSpecVersion();

if (!CURRENT_VERSION) {
  console.error(
    "✗ Could not read the current version from schema/dsds.bundled.yaml's " +
      "own $id. Run `npm run bundle` first.",
  );
  process.exit(1);
}

if (CURRENT_VERSION === NEW_VERSION) {
  console.error(`✗ New version "${NEW_VERSION}" is the same as the current version.`);
  process.exit(1);
}

console.log(`Bumping DSDS version v${CURRENT_VERSION} → v${NEW_VERSION}`);
if (DRY_RUN) console.log("(dry run — no files will be written)");
console.log();

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function walkDir(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

const schemaFiles = walkDir(SCHEMA_DIR, (p) => p.endsWith(".schema.yaml"));

const dsdsDocFiles = SCHEMAS_ONLY
  ? []
  : DSDS_DOC_ROOTS.flatMap((dir) => walkDir(dir, (p) => p.endsWith(".yaml")));

// ---------------------------------------------------------------------------
// Substitutions
// ---------------------------------------------------------------------------

// Rewrite any `designsystemdocspec.org/v<X>/` URL whose version isn't
// already the target. Anchoring on the host avoids touching unrelated
// `/v<X>/`-shaped strings, and matching any prior version (not just
// CURRENT_VERSION) makes the bump idempotent and recovers from drift.
const URL_REGEX = /designsystemdocspec\.org\/v([A-Za-z0-9.\-]+)\//g;
const NEW_URL_FRAGMENT = `designsystemdocspec.org/v${NEW_VERSION}/`;

// examples/**/*.yaml and test/**/*.yaml base documents: the literal
// `schemaVersion: "<version>"` value.
const SCHEMA_VERSION_VALUE_REGEX = /(schemaVersion:\s*")([^"]+)(")/;

function rewriteUrlsInText(text) {
  let count = 0;
  const updated = text.replace(URL_REGEX, (match, foundVersion) => {
    if (foundVersion === NEW_VERSION) return match;
    count++;
    return NEW_URL_FRAGMENT;
  });
  return { updated, count };
}

function rewriteSchemaVersionValue(text) {
  let count = 0;
  const updated = text.replace(SCHEMA_VERSION_VALUE_REGEX, (match, before, oldVer, after) => {
    if (oldVer === NEW_VERSION) return match;
    count++;
    return before + NEW_VERSION + after;
  });
  return { updated, count };
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

let totalFiles = 0;
let totalReplacements = 0;
const changedFiles = [];

function processFile(absPath, rewriters) {
  const text = fs.readFileSync(absPath, "utf-8");
  let updated = text;
  let count = 0;
  for (const rewrite of rewriters) {
    const r = rewrite(updated);
    updated = r.updated;
    count += r.count;
  }
  if (updated === text) return false;
  totalReplacements += count;
  changedFiles.push(path.relative(ROOT, absPath));
  if (!DRY_RUN) fs.writeFileSync(absPath, updated, "utf-8");
  totalFiles++;
  return true;
}

// 1. Every schema/**/*.schema.yaml file's own $id/$ref URLs.
for (const file of schemaFiles) {
  processFile(file, [rewriteUrlsInText]);
}

// 2. bundle.js's two hardcoded literals ($id, title) — plain URL rewrite
//    covers the $id line; the title line ("...DSDS) v0.20.0 —...") needs
//    its own pattern since it isn't a URL.
const BUNDLE_TITLE_REGEX = /(Design System Doc Spec \(DSDS\) v)[A-Za-z0-9.\-]+/;
processFile(BUNDLE_SCRIPT, [
  rewriteUrlsInText,
  (text) => {
    let count = 0;
    const updated = text.replace(BUNDLE_TITLE_REGEX, (match, prefix) => {
      if (match === prefix + NEW_VERSION) return match;
      count++;
      return prefix + NEW_VERSION;
    });
    return { updated, count };
  },
]);

// 3. Every examples/**/*.yaml and test/**/*.yaml base document's
//    schemaVersion value, plus any $schema URL hint they carry.
for (const file of dsdsDocFiles) {
  processFile(file, [rewriteSchemaVersionValue, rewriteUrlsInText]);
}

// 4. README.md's hardcoded $schema URL suggestion (and any other stray
//    version URL that creeps in).
if (!SCHEMAS_ONLY && fs.existsSync(README)) {
  processFile(README, [rewriteUrlsInText]);
}

// 5. package.json#version.
if (!SCHEMAS_ONLY) {
  const pkg = JSON.parse(fs.readFileSync(PKG, "utf-8"));
  if (pkg.version !== NEW_VERSION) {
    pkg.version = NEW_VERSION;
    totalFiles++;
    totalReplacements++;
    changedFiles.push(`package.json (version → ${NEW_VERSION})`);
    if (!DRY_RUN) fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const action = DRY_RUN ? "Would update" : "Updated";
console.log(`${action} ${totalFiles} file(s) (${totalReplacements} replacements):`);
console.log();
for (const f of changedFiles) console.log(`  ${f}`);
console.log();

if (totalFiles === 0) {
  console.log(`Nothing to do. The project is already fully at v${NEW_VERSION}.`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log("Dry run complete. Rerun without --dry-run to apply changes.");
  console.log("After applying: run `npm run build` to publish the versioned dist tree.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Bundle + sync skill versions
// ---------------------------------------------------------------------------

function runStep(label, npmScript) {
  console.log(`${label}…\n`);
  try {
    execFileSync("npm", ["run", npmScript], { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    console.error(`\n✗ '${npmScript}' failed. Source files were updated, but this`);
    console.error(`  step didn't complete. Resolve the error and rerun \`npm run ${npmScript}\` manually.`);
    process.exit(err.status || 1);
  }
}

if (SKIP_BUNDLE) {
  console.log("Skipping bundle (--no-bundle).");
} else {
  runStep("Regenerating bundled schema", "bundle");
}

if (SKIP_SYNC_SKILLS) {
  console.log("Skipping skill version sync (--no-sync-skills).");
} else if (!SCHEMAS_ONLY) {
  runStep("Syncing agent skill versions", "sync-skill-versions");
}

console.log("\n✓ Version bump complete.");
console.log(`  Next: run \`npm run build\` to publish site/dist/v${NEW_VERSION}/, then \`npm run check\`.`);
