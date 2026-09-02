#!/usr/bin/env node
/**
 * lint-docs.js — Editorial lint for DSDS documents (the advisory tier).
 *
 * Schema validation answers "is this document allowed?" scripts/validate.js's
 * DSDS-01–DSDS-10 answer "is this document internally consistent?" This lint
 * answers "is this documentation good?" It runs on documents that already
 * validate, reports quality gaps, and NEVER fails the build for a
 * documentation finding — warnings are warnings, and the exit code is 0.
 *
 * schema/conformance-rules.yaml is the source of truth, same as the
 * semantic tier. At startup this loads the catalog, takes every rule with
 * `enforcement: advisory`, and runs the matching check implementation
 * (keyed by rule `name`, below). Removing a rule from the catalog disables
 * it here with no code change. The one way this script exits non-zero is
 * catalog/code drift — a bidirectional check, same shape as
 * scripts/check-rule-catalog.js's own semantic-tier check: an advisory
 * catalog entry with no implementation, or an implementation with no
 * catalog entry. That's a tooling bug, not a documentation finding, and it
 * should fail loudly.
 *
 * Ported from origin/0.16.0's identical-purpose scripts/lint-docs.js, which
 * itself ported PR #33 (DSDS-011, `token-description-restates-identifier`,
 * by Cody Clark). That version's checks were written against the pre-0.20.0
 * model (`.dsds.json`, `entity.documentBlocks`, `criteria`) — re-implemented
 * here against 0.20.0's `entries`/`sections`/`items` shape instead of
 * carried over verbatim; see each check below for what changed and why.
 *
 * Usage:
 *   node scripts/lint-docs.js [paths…]   # files or directories
 *   npm run lint:docs                    # defaults to the same corpus validate.js does
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { rootDir, loadYaml, defaultTargets, entriesIn } = require("./lib");

const CATALOG_PATH = path.join(rootDir, "schema/conformance-rules.yaml");

function loadCatalog() {
  return loadYaml(CATALOG_PATH);
}

/**
 * Build the active rule set: catalog rules with `enforcement: advisory`,
 * joined to their check implementations. Exits non-zero on drift in either
 * direction — the catalog and this file must agree exactly.
 */
function activeRules() {
  const catalog = loadCatalog();
  const advisoryRules = catalog.filter((r) => r.enforcement === "advisory");

  const missingImpl = advisoryRules.filter((r) => !(r.name in IMPLEMENTATIONS));
  const catalogNames = new Set(advisoryRules.map((r) => r.name));
  const orphanImpl = Object.keys(IMPLEMENTATIONS).filter((name) => !catalogNames.has(name));

  if (missingImpl.length || orphanImpl.length) {
    for (const r of missingImpl) {
      console.error(`✗ catalog drift: ${r.id} '${r.name}' is enforcement: advisory in schema/conformance-rules.yaml but has no implementation in scripts/lint-docs.js`);
    }
    for (const name of orphanImpl) {
      console.error(`✗ catalog drift: '${name}' is implemented in scripts/lint-docs.js but has no enforcement: advisory entry in schema/conformance-rules.yaml`);
    }
    process.exit(1);
  }

  return advisoryRules.map((r) => ({ id: r.id, name: r.name, check: IMPLEMENTATIONS[r.name] }));
}

// ---------------------------------------------------------------------------
// Check implementations, keyed by catalog rule `name`.
//
// Each receives (entry, emit) once per top-level entry/shared entity (see
// lib.js's entriesIn()) and calls emit(pointer, message) per finding. The
// message follows the same "what's wrong + what to do" formula
// validate.js's own error strings use.
// ---------------------------------------------------------------------------

function normalizeProse(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Every `guidelines` section item across an entry's sections, with a
// pointer for each - the 0.20.0 equivalent of 0.16.0's eachGuidelineItem()
// walk over documentBlocks/criteria, which has no analogue in this model
// (guidelines items live directly under sections[].items, not nested
// inside a second criteria array).
function eachGuidelineItem(entry, fn) {
  (entry.sections || []).forEach((section, si) => {
    if (!section || section.kind !== "guidelines") return;
    (section.items || []).forEach((item, ii) => {
      if (item) fn(item, `/sections/${si}/items/${ii}`);
    });
  });
}

const LOWERCASE_RFC_REGEX = /(?<![A-Za-z])(must|should)(?: not)?(?![A-Za-z])/g;

const IMPLEMENTATIONS = {
  // Direct port of 0.16.0's check of the same name - only the walk changed
  // (guideline items live at sections[].items now, not
  // documentBlocks[].items), the regex and reasoning are identical.
  "rfc-keywords-lowercase-in-normative-prose": (entry, emit) => {
    eachGuidelineItem(entry, (item, p) => {
      if (typeof item.statement !== "string") return;
      const hits = item.statement.match(LOWERCASE_RFC_REGEX);
      if (hits) {
        emit(
          `${p}/statement`,
          `guideline in "${entry.id}" uses lowercase '${hits[0]}' in its statement — capitalize RFC 2119 keywords in normative prose (${hits[0].toUpperCase()}) so the conformance weight is explicit.`,
        );
      }
    });
  },

  // Ported from PR #33 (DSDS-011, by Cody Clark) - same algorithm
  // (normalize both strings, flag an exact restatement or a bare value
  // literal), adapted to a token entry's own id/name/description fields
  // directly (0.20.0 has no separate token-group kind to also check).
  "token-description-restates-identifier": (entry, emit) => {
    if (entry.kind !== "token") return;
    const desc = entry.description;
    if (typeof desc !== "string" || !desc.trim()) return;
    const raw = desc.trim();
    const d = normalizeProse(desc);
    if (!d) return;
    const id = normalizeProse(entry.id || "");
    const name = normalizeProse(entry.name || "");
    const restatesName = (id && d === id) || (name && d === name);
    const isBareValue =
      /^#[0-9a-f]{3,8}$/i.test(raw) ||
      /^(rgb|hsl)a?\([^)]*\)$/i.test(raw) ||
      /^-?\d*\.?\d+(px|rem|em|%|pt|vh|vw)?$/i.test(raw);
    if (restatesName || isBareValue) {
      emit(
        "/description",
        `token "${entry.id}" has a description that only ${restatesName ? "restates its id or name" : "gives a raw value"} — a token description should state the token's role or when to use it, not repeat what the id or the DTCG source value already says. Drop it (description is optional here) or state its purpose.`,
      );
    }
  },

  // No analogue in 0.16.0 - that model's "criterion-missing-verification"
  // checked a separate accessibility-criteria array 0.20.0 doesn't have.
  // The equivalent gap in this model is a hard-requirement guideline
  // (level: must/must-not) with no checkedBy at all: a tool has no way to
  // tell whether it's automatable, so it stays invisible to any dashboard
  // built off checkedBy. DSDS-03 already blocks the narrower case
  // (checkedBy: automated with no checks ref); this flags the case DSDS-03
  // can't see - checkedBy left out entirely.
  "guideline-missing-checkedby": (entry, emit) => {
    eachGuidelineItem(entry, (item, p) => {
      if ((item.level === "must" || item.level === "must-not") && !item.checkedBy) {
        emit(
          `${p}/checkedBy`,
          `guideline in "${entry.id}" is a hard requirement (level: ${item.level}) with no checkedBy — declare 'automated', 'assisted', or 'manual' so a tool can tell whether this rule is verifiable at all.`,
        );
      }
    });
  },

  // Adapted from 0.16.0's "entity-missing-use-cases" (which checked for a
  // documentBlocks entry of kind: use-cases). 0.20.0 folds that content
  // into a guidelines section with framing: when-to-use instead of a
  // separate block kind - this checks for that section's presence on a
  // component the same way the original checked for the block's.
  "component-missing-when-to-use": (entry, emit) => {
    if (entry.kind !== "component") return;
    const hasWhenToUse = (entry.sections || []).some(
      (s) => s && s.kind === "guidelines" && s.framing === "when-to-use",
    );
    if (!hasWhenToUse) {
      emit(
        "/sections",
        `component "${entry.id}" has no guidelines section with framing: when-to-use — "when do I use this?" is usually the first question documentation must answer. Add one, or note in metadata why it doesn't apply.`,
      );
    }
  },
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function main() {
  const rules = activeRules();

  const args = process.argv.slice(2);
  const targets = args.length
    ? args.flatMap((t) => {
        const stat = fs.existsSync(t) && fs.statSync(t);
        if (!stat) {
          console.error(`✗ Not found: ${t}`);
          return [];
        }
        if (stat.isFile()) return [t];
        return fs.readdirSync(t).filter((f) => f.endsWith(".yaml")).map((f) => path.join(t, f));
      })
    : defaultTargets();

  console.log("\nDSDS Doc Lint (warnings only — never fails the build)");
  console.log(`  ${rules.length} rule(s) from schema/conformance-rules.yaml: ${rules.map((r) => r.id).join(", ")}\n`);

  let totalFindings = 0;
  let cleanFiles = 0;

  for (const target of targets) {
    let doc;
    try {
      doc = loadYaml(target);
    } catch {
      continue; // not this tool's job - validate.js reports parse errors
    }
    const rel = path.relative(process.cwd(), target);
    const findings = [];
    for (const entry of entriesIn(doc)) {
      for (const rule of rules) {
        rule.check(entry, (p, message) => findings.push({ id: rule.id, rule: rule.name, path: p, message }));
      }
    }
    if (findings.length === 0) {
      cleanFiles++;
      continue;
    }
    console.log(`  ${rel}`);
    for (const f of findings) {
      console.log(`    ⚠ [${f.id} ${f.rule}] ${f.path}: ${f.message}`);
      totalFindings++;
    }
    console.log("");
  }

  console.log(`  ${targets.length} file(s) linted: ${cleanFiles} clean, ${totalFindings} warning(s).\n`);
}

main();
