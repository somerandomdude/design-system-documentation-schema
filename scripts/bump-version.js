#!/usr/bin/env node
/**
 * bump-version.js — Cut a new versioned DSDS spec build.
 *
 * The DSDS spec version lives in `spec/schema/dsds.schema.json` at
 * `properties.dsdsVersion.const`, but it ALSO appears in the `$id` URL on
 * every split schema file (44 of them), in the root schema's title, in
 * the `$schema` URLs of example documents, and in code snippets in the
 * README. This script rewrites all of those places in one pass.
 *
 * The MDX content pages (site/content/) are NOT rewritten here: they use
 * the {{VERSION}} token, substituted at build time by compile-mdx.mjs from
 * dsds.schema.json#/properties/dsdsVersion/const. Bumping the const is all
 * the site pages need.
 *
 * Usage:
 *   node scripts/bump-version.js <new-version>          # bump and rebundle
 *   node scripts/bump-version.js <new-version> --dry-run # preview only
 *   node scripts/bump-version.js <new-version> --schemas-only
 *                                                       # only touch schemas
 *   node scripts/bump-version.js --help
 *
 * <new-version> is a bare version string (e.g., 0.2, 0.1.1, 1.0.0).
 * The leading "v" is not included — every URL in this repo is
 * constructed as `/v<version>/`.
 *
 * After a successful bump the script runs `npm run bundle` to regenerate
 * spec/schema/dsds.bundled.schema.json with the new version baked in.
 * Run `npm run build` separately to publish the versioned dist directory.
 *
 * Exits non-zero on:
 *   - Missing or malformed new version argument
 *   - New version equal to current version
 *   - No occurrences of the current version found anywhere (suggests a
 *     bug or a prior partial bump — abort rather than silently no-op)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");
const ROOT_SCHEMA = path.join(SCHEMA_DIR, "dsds.schema.json");
const BUNDLED_SCHEMA = path.join(SCHEMA_DIR, "dsds.bundled.schema.json");

// Where to search for stale version references beyond the schemas
// themselves. These paths are scanned for the literal `/v<old>/` URL
// pattern; we don't touch any other string.
const EXAMPLE_ROOTS = [
  path.join(ROOT, "spec", "examples"),
  path.join(ROOT, "test"),
];

// NOTE: the MDX content pages under site/content/ are intentionally NOT
// listed here. They never hardcode a version — they use the {{VERSION}}
// token, which scripts/compile-mdx.mjs substitutes from
// dsds.schema.json#/properties/dsdsVersion/const at build time. A bump of
// the const therefore propagates to every page on the next `npm run build`,
// with no string rewriting needed. README.md is a static GitHub file (not
// built through compile-mdx), so it still gets rewritten here.
const DOC_FILES = [
  path.join(ROOT, "README.md"),
];

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
bump-version — cut a new versioned DSDS spec build

Usage:
  node scripts/bump-version.js <new-version> [options]

Arguments:
  <new-version>     Bare version string (e.g., 0.2, 0.1.1, 1.0.0).

Options:
  --dry-run         Print planned changes without modifying anything.
  --schemas-only    Only touch files under spec/schema/. Skip examples and docs.
  --no-bundle       Skip the post-bump 'npm run bundle' step.
  --help, -h        Show this help.

Examples:
  node scripts/bump-version.js 0.2
  node scripts/bump-version.js 0.2 --dry-run
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

// A version is "loose semver" — one or more dot-separated identifiers.
// We're permissive on purpose so 0.1, 0.1.1, 1.0.0-beta.1, etc. all work.
if (!/^[A-Za-z0-9]+(\.[A-Za-z0-9-]+)*$/.test(NEW_VERSION)) {
  console.error(`✗ Invalid version string: "${NEW_VERSION}"`);
  console.error("  Expected something like 0.2, 0.1.1, or 1.0.0-beta.1.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read current version
// ---------------------------------------------------------------------------

if (!fs.existsSync(ROOT_SCHEMA)) {
  console.error(`✗ Root schema not found: ${path.relative(ROOT, ROOT_SCHEMA)}`);
  process.exit(1);
}

const rootJson = JSON.parse(fs.readFileSync(ROOT_SCHEMA, "utf-8"));
const CURRENT_VERSION =
  rootJson &&
  rootJson.properties &&
  rootJson.properties.dsdsVersion &&
  rootJson.properties.dsdsVersion.const;

if (!CURRENT_VERSION) {
  console.error(
    "✗ Could not read current version from " +
      `${path.relative(ROOT, ROOT_SCHEMA)}#/properties/dsdsVersion/const`,
  );
  process.exit(1);
}

console.log(`Bumping DSDS version to v${NEW_VERSION}`);
console.log(`  dsdsVersion.const currently: ${CURRENT_VERSION}`);
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

const schemaFiles = walkDir(
  SCHEMA_DIR,
  (p) => p.endsWith(".schema.json") && path.basename(p) !== "dsds.bundled.schema.json",
);

const exampleFiles = SCHEMAS_ONLY
  ? []
  : EXAMPLE_ROOTS.flatMap((dir) =>
      walkDir(dir, (p) => p.endsWith(".json")),
    );

const docFiles = SCHEMAS_ONLY
  ? []
  : DOC_FILES.filter((p) => fs.existsSync(p));

// ---------------------------------------------------------------------------
// Substitutions
// ---------------------------------------------------------------------------

// We rewrite any `designsystemdocspec.org/v<X>/` URL whose version is not
// already the target. Anchoring on the host avoids touching unrelated
// `/v<X>/`-shaped strings, and matching any prior version (not just the
// one in `dsdsVersion.const`) makes the bump idempotent and recovers
// from drift — e.g., when the const was hand-edited ahead of the URLs.
const URL_REGEX = /designsystemdocspec\.org\/v([A-Za-z0-9.\-]+)\//g;
const NEW_URL_FRAGMENT = `designsystemdocspec.org/v${NEW_VERSION}/`;

// In the root schema we also rewrite the title and the dsdsVersion.const
// literal. Both follow the same drift-tolerant approach: match any prior
// version, rewrite to the target.
const ROOT_TITLE_REGEX = /(Design System Documentation Spec \(DSDS\) v)[A-Za-z0-9.\-]+/g;
const DSDS_VERSION_CONST_REGEX = /("dsdsVersion"\s*:\s*\{[\s\S]*?"const"\s*:\s*")([^"]+)(")/;

// In docs and example content, two more string patterns reference the spec
// version and must move in lockstep with the const:
//
//   1. `"dsdsVersion": "<X>"` literals inside example JSON snippets (whether
//      in `.json` files or fenced code blocks inside MDX/markdown). These
//      represent example DSDS documents that conform to the current spec.
//
//   2. Free-form mentions of "Design System Documentation Spec <X>" or
//      "DSDS <X>" in narrative prose (page titles, headings). We require a
//      digit immediately after to avoid matching unrelated text like
//      "DSDS sections".
const DSDS_VERSION_LITERAL_REGEX = /("dsdsVersion"\s*:\s*")([A-Za-z0-9.\-]+)(")/g;
const SPEC_DISPLAY_NAME_REGEX = /(Design System Documentation Spec )(\d[A-Za-z0-9.\-]*)/g;
const DSDS_DISPLAY_NAME_REGEX = /(\bDSDS )(\d[A-Za-z0-9.\-]*)/g;

// Track per-file metrics so we can report what changed and warn on drift.
const urlVersionsSeen = new Map(); // version -> count across all files

function rewriteUrlsInText(text) {
  let count = 0;
  const updated = text.replace(URL_REGEX, (match, foundVersion) => {
    urlVersionsSeen.set(
      foundVersion,
      (urlVersionsSeen.get(foundVersion) || 0) + 1,
    );
    if (foundVersion === NEW_VERSION) return match;
    count++;
    return NEW_URL_FRAGMENT;
  });
  return { updated, count };
}

// For each of the three secondary patterns: only rewrite when the captured
// version differs from the target (so the bump is idempotent and tolerates
// drift across the file set).
function rewriteDsdsVersionLiterals(text) {
  let count = 0;
  const updated = text.replace(DSDS_VERSION_LITERAL_REGEX, (match, before, oldVer, after) => {
    if (oldVer === NEW_VERSION) return match;
    count++;
    return before + NEW_VERSION + after;
  });
  return { updated, count };
}

function rewriteSpecDisplayNames(text) {
  let count = 0;
  let s = text.replace(SPEC_DISPLAY_NAME_REGEX, (match, prefix, oldVer) => {
    if (oldVer === NEW_VERSION) return match;
    count++;
    return prefix + NEW_VERSION;
  });
  s = s.replace(DSDS_DISPLAY_NAME_REGEX, (match, prefix, oldVer) => {
    if (oldVer === NEW_VERSION) return match;
    count++;
    return prefix + NEW_VERSION;
  });
  return { updated: s, count };
}

function rewriteRootSchemaText(text) {
  // 1. URL fragments (drift-tolerant).
  let { updated: out, count: urls } = rewriteUrlsInText(text);

  // 2. Title: replace any "DSDS v<X>" with "DSDS v<NEW>".
  let titleChanged = false;
  out = out.replace(ROOT_TITLE_REGEX, (match, prefix) => {
    if (match === prefix + NEW_VERSION) return match;
    titleChanged = true;
    return prefix + NEW_VERSION;
  });

  // 3. dsdsVersion.const: rewrite via focused regex so JSON formatting
  //    is preserved (key order, indent, trailing newline).
  let constChanged = false;
  out = out.replace(DSDS_VERSION_CONST_REGEX, (_m, before, oldConst, after) => {
    if (oldConst === NEW_VERSION) return before + oldConst + after;
    constChanged = true;
    return before + NEW_VERSION + after;
  });

  return { updated: out, count: urls, titleChanged, constChanged };
}

function rewriteGenericFile(text, opts = {}) {
  let { updated, count } = rewriteUrlsInText(text);

  // For example .json files: also rewrite `"dsdsVersion": "<old>"` literals
  // so example documents stay valid against the bumped spec.
  if (opts.rewriteDsdsLiteral !== false) {
    const r = rewriteDsdsVersionLiterals(updated);
    updated = r.updated;
    count += r.count;
  }

  // For docs (.md, .mdx): also rewrite display-name strings and embedded
  // example `dsdsVersion` literals. We use the same pass on both kinds of
  // files; the regexes are narrow enough that JSON files won't get false
  // positives on prose patterns (which never appear there).
  if (opts.rewriteDisplayNames) {
    const r = rewriteSpecDisplayNames(updated);
    updated = r.updated;
    count += r.count;
  }

  return { updated, count };
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

let totalFiles = 0;
let totalReplacements = 0;
const changedFiles = [];
let rootTitleChanged = false;
let rootConstChanged = false;

function processFile(absPath, isRoot, opts) {
  const text = fs.readFileSync(absPath, "utf-8");
  let result;
  if (isRoot) {
    result = rewriteRootSchemaText(text);
    if (result.titleChanged) rootTitleChanged = true;
    if (result.constChanged) rootConstChanged = true;
  } else {
    result = rewriteGenericFile(text, opts);
  }
  if (result.updated === text) return false;

  totalReplacements += result.count;
  const rel = path.relative(ROOT, absPath);
  changedFiles.push(rel);
  if (!DRY_RUN) fs.writeFileSync(absPath, result.updated, "utf-8");
  return true;
}

// Root schema first (special handling for title + const).
if (processFile(ROOT_SCHEMA, true)) totalFiles++;
else if (rootTitleChanged || rootConstChanged) {
  // Edge case: title/const are already correct, but URL rewrite happened.
  // This branch shouldn't usually fire — processFile already returns true
  // when any of the three change. Defensive only.
}

// All other schemas. Schemas don't carry example `dsdsVersion` literals,
// but the regex is narrow enough that re-applying it is harmless; we
// disable it explicitly to keep the diff minimal.
for (const file of schemaFiles) {
  if (file === ROOT_SCHEMA) continue;
  if (processFile(file, false, { rewriteDsdsLiteral: false })) totalFiles++;
}

// Examples: each example .json carries a `$schema` URL (handled by the
// URL rewrite) and many also carry `"dsdsVersion": "<v>"` literals on the
// root document. Both move in lockstep with the spec version.
for (const file of exampleFiles) {
  if (processFile(file, false)) totalFiles++;
}

// Docs (README, MDX content pages): rewrite URL fragments, example
// `dsdsVersion` literals inside fenced code blocks, and free-form
// `Design System Documentation Spec <v>` / `DSDS <v>` display strings.
for (const file of docFiles) {
  if (processFile(file, false, { rewriteDisplayNames: true })) totalFiles++;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

// Surface drift between the const and the URLs as a separate, prominent
// note so the user understands what was reconciled.
const priorUrlVersions = Array.from(urlVersionsSeen.keys()).filter(
  (v) => v !== NEW_VERSION,
);
if (priorUrlVersions.length > 0) {
  console.log(
    `Detected URL versions before bump: ${priorUrlVersions
      .map((v) => `v${v} (${urlVersionsSeen.get(v)} occurrence(s))`)
      .join(", ")}`,
  );
  if (
    priorUrlVersions.length > 1 ||
    (priorUrlVersions[0] !== CURRENT_VERSION && CURRENT_VERSION !== NEW_VERSION)
  ) {
    console.log(
      `  ⚠  Drift: dsdsVersion.const was "${CURRENT_VERSION}" but URLs say ` +
        priorUrlVersions.map((v) => `v${v}`).join(", ") +
        `. All have been migrated to v${NEW_VERSION}.`,
    );
  }
  console.log();
}

const action = DRY_RUN ? "Would update" : "Updated";
console.log(
  `${action} ${totalFiles} file(s) (${totalReplacements} replacements):`,
);
console.log();
for (const f of changedFiles) console.log(`  ${f}`);
if (rootTitleChanged) console.log(`  (root schema title → v${NEW_VERSION})`);
if (rootConstChanged) console.log(`  (dsdsVersion.const → "${NEW_VERSION}")`);
console.log();

if (totalFiles === 0) {
  console.log(
    `Nothing to do. The project is already fully at v${NEW_VERSION}.`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Bundle (so the versioned dist build picks up the new version on `npm run build`)
// ---------------------------------------------------------------------------

if (DRY_RUN) {
  console.log("Dry run complete. Rerun without --dry-run to apply changes.");
  console.log("After applying: run `npm run build` to publish the versioned dist tree.");
  process.exit(0);
}

if (SKIP_BUNDLE) {
  console.log("Skipping bundle (--no-bundle).");
  console.log("Next steps:");
  console.log("  1. Run `npm run bundle` to regenerate the bundled schema.");
  console.log("  2. Run `npm run build` to publish the versioned dist tree.");
  process.exit(0);
}

console.log("Regenerating bundled schema…\n");
try {
  execFileSync("npm", ["run", "bundle"], {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch (err) {
  console.error("\n✗ Bundle step failed. Source files were updated, but the");
  console.error("  bundled schema is out of sync. Resolve the error and rerun");
  console.error("  `npm run bundle` manually.");
  process.exit(err.status || 1);
}

console.log("\n✓ Version bump complete.");
console.log(`  Next: run \`npm run build\` to publish site/dist/v${NEW_VERSION}/.`);
