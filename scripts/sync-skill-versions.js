#!/usr/bin/env node
/**
 * sync-skill-versions.js — Update agent skill files to match the spec version.
 *
 * Rewrites `.agents/skills/dsds-*` SKILL.md files so their YAML frontmatter
 * `metadata.version`, URL fragments, `schemaVersion` literals, and any other
 * remaining version strings all point at the current (or specified) spec
 * version.
 *
 * Usage:
 *   node scripts/sync-skill-versions.js              # use version from schema
 *   node scripts/sync-skill-versions.js <version>    # explicit target version
 *   node scripts/sync-skill-versions.js --dry-run    # preview only
 *   node scripts/sync-skill-versions.js --check      # exit 1 if stale (see below)
 *   node scripts/sync-skill-versions.js --help
 *
 * When run without a version argument, reads the target from
 * schema/dsds.bundled.yaml's own `$id` (ex:
 * "https://.../v0.20.0/dsds.bundled.yaml") — the same source
 * nav.js's readSpecVersion() uses — so running this after `npm run bundle`
 * picks up a freshly bumped version automatically.
 *
 * --check goes beyond the version string this script has always synced.
 * Bumping `metadata.version` on every release is exactly how the skills
 * kept "certifying" content that was actually stale on every other axis —
 * broken paths, a rule count six releases out of date — because nothing
 * ever checked those (see notes/dsds-0.20.0-improvement-plan.md's
 * contribution fold-back, F-4). --check additionally fails if:
 *   - the highest `DSDS-XX` id any skill mentions doesn't match the
 *     highest id actually in schema/conformance-rules.yaml, or
 *   - a skill references a bundled-schema filename that isn't one
 *     scripts/bundle.js actually writes.
 * Neither check can catch every way a skill can go stale — no automation
 * can — but it closes the specific failure mode that already happened
 * once: a version bump alone is no longer enough to look "in sync."
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BUNDLED_SCHEMA = path.join(ROOT, "schema", "dsds.bundled.yaml");
const SKILLS_DIR = path.join(ROOT, ".agents", "skills");

function readBundledVersion() {
  if (!fs.existsSync(BUNDLED_SCHEMA)) return null;
  const raw = fs.readFileSync(BUNDLED_SCHEMA, "utf-8");
  const match = /\/v([^/\s"']+)\/dsds\.bundled\.yaml/.exec(raw);
  return match ? match[1] : null;
}

function printHelp() {
  console.log(`
sync-skill-versions — sync agent skill DSDS version references

Usage:
  node scripts/sync-skill-versions.js [<version>] [--dry-run]

Arguments:
  <version>    Target version string (ex: 0.20.1). If omitted, reads from
               schema/dsds.bundled.yaml's own $id.

Options:
  --dry-run    Print planned changes without writing files.
  --check      Exit 1 if any skill's version, rule-count reference, or
               bundled-schema filename is stale. Makes no changes.
  --help, -h   Show this help.
`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const DRY_RUN = flags.has("--dry-run");
const CHECK = flags.has("--check");

let TARGET_VERSION;
if (positional.length > 1) {
  console.error("✗ Expected at most one positional argument: <version>");
  process.exit(1);
}

if (positional.length === 1) {
  TARGET_VERSION = positional[0];
} else {
  TARGET_VERSION = readBundledVersion();
  if (!TARGET_VERSION) {
    console.error(
      `✗ Could not read version from ${path.relative(ROOT, BUNDLED_SCHEMA)}'s own $id. ` +
        "Run `npm run bundle` first, or pass an explicit <version>.",
    );
    process.exit(1);
  }
}

if (!/^[A-Za-z0-9]+(\.[A-Za-z0-9-]+)*$/.test(TARGET_VERSION)) {
  console.error(`✗ Invalid version string: "${TARGET_VERSION}"`);
  process.exit(1);
}

const URL_REGEX = /designsystemdocspec\.org\/v([A-Za-z0-9.\-]+)\//g;
const NEW_URL_FRAGMENT = `designsystemdocspec.org/v${TARGET_VERSION}/`;
const SCHEMA_VERSION_LITERAL_REGEX = /(schemaVersion:\s*"?)([A-Za-z0-9.\-]+)("?)/g;
const FRONTMATTER_VERSION_REGEX = /(metadata:\s*\n\s*version:\s*)\S+/;

function rewriteUrlsInText(text) {
  let count = 0;
  const updated = text.replace(URL_REGEX, (match, foundVersion) => {
    if (foundVersion === TARGET_VERSION) return match;
    count++;
    return NEW_URL_FRAGMENT;
  });
  return { updated, count };
}

function rewriteSchemaVersionLiterals(text) {
  let count = 0;
  const updated = text.replace(SCHEMA_VERSION_LITERAL_REGEX, (match, before, oldVer, after) => {
    if (oldVer === TARGET_VERSION) return match;
    count++;
    return before + TARGET_VERSION + after;
  });
  return { updated, count };
}

if (!fs.existsSync(SKILLS_DIR)) {
  console.log("No .agents/skills directory found — nothing to do.");
  process.exit(0);
}

const skillFiles = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("dsds-"))
  .map((d) => path.join(SKILLS_DIR, d.name, "SKILL.md"))
  .filter((p) => fs.existsSync(p));

if (skillFiles.length === 0) {
  console.log("No dsds-* skill files found — nothing to do.");
  process.exit(0);
}

const CURRENT_SCHEMA_VERSION = readBundledVersion();

console.log(`Syncing agent skill versions to v${TARGET_VERSION}`);
if (DRY_RUN) console.log("(dry run — no files will be written)");
console.log();

let totalFiles = 0;
let totalReplacements = 0;
const changedFiles = [];

for (const file of skillFiles) {
  const original = fs.readFileSync(file, "utf-8");
  let text = original;
  let count = 0;

  // Frontmatter metadata.version → target version
  text = text.replace(FRONTMATTER_VERSION_REGEX, (m, prefix) => {
    if (m.slice(prefix.length) === TARGET_VERSION) return m;
    count++;
    return prefix + TARGET_VERSION;
  });

  // Body: rewrite URLs and schemaVersion literals
  let r = rewriteUrlsInText(text);
  text = r.updated; count += r.count;

  r = rewriteSchemaVersionLiterals(text);
  text = r.updated; count += r.count;

  // Catch-all: remaining literal version strings the regexes don't cover.
  if (CURRENT_SCHEMA_VERSION && CURRENT_SCHEMA_VERSION !== TARGET_VERSION) {
    const before = text;
    text = text.replaceAll(CURRENT_SCHEMA_VERSION, TARGET_VERSION);
    if (text !== before) {
      count += before.split(CURRENT_SCHEMA_VERSION).length - 1;
    }
  }

  if (text !== original) {
    totalFiles++;
    totalReplacements += count;
    changedFiles.push(path.relative(ROOT, file));
    if (!DRY_RUN && !CHECK) fs.writeFileSync(file, text, "utf-8");
  }
}

const versionDrift = totalFiles > 0;

if (!CHECK) {
  if (totalFiles === 0) {
    console.log(`All skill files already at v${TARGET_VERSION}. Nothing to do.`);
    process.exit(0);
  }

  const action = DRY_RUN ? "Would update" : "Updated";
  console.log(`${action} ${totalFiles} file(s) (${totalReplacements} replacements):`);
  for (const f of changedFiles) console.log(`  ${f}`);
  console.log();

  if (DRY_RUN) {
    console.log("Dry run complete. Rerun without --dry-run to apply.");
  } else {
    console.log("✓ Skill versions synced.");
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// --check: version drift (above) plus rule-count and bundle-filename drift —
// see this file's header comment for why these two are checked here rather
// than left to a version bump alone.
// ---------------------------------------------------------------------------

let checkFailed = versionDrift;
if (versionDrift) {
  console.error(`✗ Version drift — ${totalFiles} file(s) not at v${TARGET_VERSION}:`);
  for (const f of changedFiles) console.error(`  ${f}`);
}

const CONFORMANCE_RULES = path.join(ROOT, "schema", "conformance-rules.yaml");
const RULE_ID_REGEX = /^- id: (DSDS-\d+)/gm;
let highestRealRuleId = null;
if (fs.existsSync(CONFORMANCE_RULES)) {
  const raw = fs.readFileSync(CONFORMANCE_RULES, "utf-8");
  const ids = [...raw.matchAll(RULE_ID_REGEX)].map((m) => m[1]);
  if (ids.length) {
    highestRealRuleId = ids.sort((a, b) => Number(a.slice(5)) - Number(b.slice(5))).at(-1);
  }
}

// A skill that cites any DSDS-XX id at all should, somewhere, cite the
// catalog's actual current top id - checking the file's own HIGHEST
// mention (not every "DSDS-01-DSDS-NN" range individually) because a
// skill legitimately cites a sub-range for one tier alone (ex:
// "DSDS-01-DSDS-11" for the semantic tier, discussed separately from
// "DSDS-12-DSDS-15" for the advisory one) - that's correct, not stale, as
// long as the file's top mention overall keeps up with the catalog. A
// skill still topping out at DSDS-07 six releases after the catalog
// reached DSDS-15 is exactly the staleness a version-only sync already
// missed once (see this file's header comment).
const RULE_ID_MENTION_REGEX = /DSDS-(\d+)/g;
if (highestRealRuleId) {
  const highestRealN = Number(highestRealRuleId.slice(5));
  for (const file of skillFiles) {
    const text = fs.readFileSync(file, "utf-8");
    const mentioned = [...text.matchAll(RULE_ID_MENTION_REGEX)].map((m) => Number(m[1]));
    if (mentioned.length === 0) continue;
    const highestMentioned = Math.max(...mentioned);
    if (highestMentioned < highestRealN) {
      checkFailed = true;
      console.error(
        `✗ ${path.relative(ROOT, file)}: highest rule id mentioned is DSDS-${highestMentioned}, ` +
          `but the catalog's highest is ${highestRealRuleId} — this skill is citing a stale rule count.`,
      );
    }
  }
}

// A skill's bundled-schema filename should be one bundle.js actually
// writes, not a name from a dropped or renamed format.
const REAL_BUNDLE_FILENAMES = ["dsds.bundled.yaml", "dsds.bundled.schema.json"];
// Each dot-separated segment must start with a letter, so a sentence-ending
// period is not swallowed into the filename: "see dsds.bundled.yaml." used to
// capture "dsds.bundled.yaml." (trailing dot included), which matched no real
// filename and failed --check on correct prose.
const CITED_BUNDLE_FILENAME_REGEX = /dsds\.bundled\.[a-z]+(?:\.[a-z]+)*/g;
for (const file of skillFiles) {
  const text = fs.readFileSync(file, "utf-8");
  for (const m of text.matchAll(CITED_BUNDLE_FILENAME_REGEX)) {
    if (!REAL_BUNDLE_FILENAMES.includes(m[0])) {
      checkFailed = true;
      console.error(
        `✗ ${path.relative(ROOT, file)}: cites bundled-schema filename "${m[0]}", which ` +
          `scripts/bundle.js doesn't write. Real filenames: ${REAL_BUNDLE_FILENAMES.join(", ")}`,
      );
    }
  }
}

if (checkFailed) {
  console.error("\nRun `npm run sync-skill-versions` for the version drift, and fix the rest by hand.");
  process.exit(1);
}
console.log(`✓ All skill files are in sync: version, rule-count range, and bundle filenames.`);
