#!/usr/bin/env node
/**
 * lint-docs.js — Editorial lint for DSDS documents (the warning tier).
 *
 * Schema validation answers "is this document allowed?" This lint answers
 * "is this documentation good?" It runs on documents that already validate,
 * reports quality gaps, and NEVER fails the build for documentation
 * findings: warnings are warnings, and the exit code is 0.
 *
 * rules/rules.yaml is the source of truth. At startup the lint loads the
 * catalog, takes every rule with `enforcement: lint`, and runs the matching
 * check implementation (keyed by rule `name`, below). The catalog therefore
 * controls which rules exist, their IDs, and their levels; this file only
 * carries the predicates. Removing a rule from the catalog disables it here
 * with no code change.
 *
 * The one way this script exits non-zero is catalog/code drift: a lint rule
 * in the catalog with no implementation, or an implementation with no
 * catalog entry. That's a tooling bug, not a documentation finding, and it
 * should fail loudly.
 *
 * Usage:
 *   node scripts/lint-docs.js [paths…]   # files or directories
 *   npm run lint:docs                    # defaults to spec/examples/
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIR = path.join(ROOT, "spec", "examples");
const CATALOG_PATH = path.join(ROOT, "rules", "rules.yaml");

// Entity kinds the description rule applies to. Tokens and token groups are
// exempt: token.schema.json documents description as "optional — keep terse
// at scale", so flagging them would contradict the spec's own guidance.
const DESCRIBED_KINDS = ["component", "pattern", "foundation", "guide", "theme"];
const USE_CASE_KINDS = ["component", "pattern"];
const ENTITY_KINDS = [
  "component",
  "pattern",
  "foundation",
  "guide",
  "theme",
  "token",
  "token-group",
  "blueprint",
];

// ---------------------------------------------------------------------------
// Catalog — rules/rules.yaml is the source of truth
// ---------------------------------------------------------------------------

function loadCatalog() {
  const doc = yaml.load(fs.readFileSync(CATALOG_PATH, "utf-8"));
  if (!doc || !Array.isArray(doc.rules)) {
    console.error(`✗ ${path.relative(ROOT, CATALOG_PATH)}: expected a top-level \`rules\` array.`);
    process.exit(1);
  }
  return doc.rules;
}

/**
 * Build the active rule set: catalog rules with `enforcement: lint`, joined
 * to their check implementations. Exits non-zero on drift in either
 * direction — the catalog and this file must agree exactly.
 */
function activeRules() {
  const catalog = loadCatalog();
  const lintRules = catalog.filter((r) => r.enforcement === "lint");

  const missingImpl = lintRules.filter((r) => !(r.name in IMPLEMENTATIONS));
  const catalogNames = new Set(lintRules.map((r) => r.name));
  const orphanImpl = Object.keys(IMPLEMENTATIONS).filter(
    (name) => !catalogNames.has(name),
  );

  if (missingImpl.length || orphanImpl.length) {
    for (const r of missingImpl) {
      console.error(
        `✗ catalog drift: ${r.id} '${r.name}' is enforcement: lint in rules/rules.yaml but has no implementation in scripts/lint-docs.js`,
      );
    }
    for (const name of orphanImpl) {
      console.error(
        `✗ catalog drift: '${name}' is implemented in scripts/lint-docs.js but has no enforcement: lint entry in rules/rules.yaml`,
      );
    }
    process.exit(1);
  }

  return lintRules.map((r) => ({
    id: r.id,
    name: r.name,
    level: r.level,
    check: IMPLEMENTATIONS[r.name],
  }));
}

// ---------------------------------------------------------------------------
// Check implementations, keyed by catalog rule `name`.
//
// Each receives (entity, pointer, emit) once per entity (token-group
// children included) and calls emit(path, message) per finding. The message
// follows the validation-message formula: what's wrong + what to do.
// ---------------------------------------------------------------------------

// Normalize prose for the restatement check: lowercase, strip everything but
// letters/digits/spaces, collapse whitespace.
function normalizeProse(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function entityLabel(entity) {
  return `${entity.kind} '${entity.identifier || "?"}'`;
}

function blockArrays(entity) {
  return [
    ["documentBlocks", Array.isArray(entity.documentBlocks) ? entity.documentBlocks : []],
    ["agentDocumentBlocks", Array.isArray(entity.agentDocumentBlocks) ? entity.agentDocumentBlocks : []],
  ];
}

// Walk every criteria array on an entity: accessibility blocks carry
// `criteria` directly; guideline entries carry `criteria` per item.
function eachCriterion(entity, pointer, fn) {
  for (const [arrayName, arr] of blockArrays(entity)) {
    arr.forEach((block, bi) => {
      if (!block) return;
      if (block.kind === "accessibility") {
        (block.criteria || []).forEach((c, ci) =>
          fn(c, `${pointer}/${arrayName}/${bi}/criteria/${ci}`),
        );
      }
      if (block.kind === "guidelines") {
        (block.items || []).forEach((item, ii) => {
          if (!item) return;
          (item.criteria || []).forEach((c, ci) =>
            fn(c, `${pointer}/${arrayName}/${bi}/items/${ii}/criteria/${ci}`),
          );
        });
      }
    });
  }
}

function eachGuidelineItem(entity, pointer, fn) {
  for (const [arrayName, arr] of blockArrays(entity)) {
    arr.forEach((block, bi) => {
      if (!block || block.kind !== "guidelines") return;
      (block.items || []).forEach((item, ii) => {
        if (item) fn(item, `${pointer}/${arrayName}/${bi}/items/${ii}`);
      });
    });
  }
}

// Lowercase RFC 2119 keywords in normative prose (DSDS-009). Case-sensitive
// match: flags "must"/"should" (with optional "not") only when lowercase.
// `may` is excluded — too common as ordinary English.
const LOWERCASE_RFC_REGEX = /(?<![A-Za-z])(must|should)(?: not)?(?![A-Za-z])/g;

const IMPLEMENTATIONS = {
  "rfc-keywords-lowercase-in-normative-prose": (entity, pointer, emit) => {
    const flag = (text, p, fieldName) => {
      if (typeof text !== "string") return;
      const hits = text.match(LOWERCASE_RFC_REGEX);
      if (hits) {
        emit(
          p,
          `${fieldName} in ${entityLabel(entity)} uses lowercase '${hits[0]}' — capitalize RFC 2119 keywords in normative prose (${hits[0].toUpperCase()}) so the conformance weight is explicit.`,
        );
      }
    };
    eachGuidelineItem(entity, pointer, (item, p) => {
      flag(item.guidance, p, "guidance");
    });
    eachCriterion(entity, pointer, (criterion, p) => {
      if (criterion) flag(criterion.statement, p, "statement");
    });
  },

  "guideline-rationale-restates-guidance": (entity, pointer, emit) => {
    eachGuidelineItem(entity, pointer, (item, p) => {
      if (!item.rationale || !item.guidance) return;
      const g = normalizeProse(item.guidance);
      const r = normalizeProse(item.rationale);
      if (g && r && (g === r || g.includes(r) || r.includes(g))) {
        emit(
          p,
          `guideline in ${entityLabel(entity)} has a rationale that restates its guidance — the rationale should say why the rule is worth following, not repeat it.`,
        );
      }
    });
  },

  "criterion-missing-verification": (entity, pointer, emit) => {
    eachCriterion(entity, pointer, (criterion, p) => {
      if (criterion && !criterion.verification) {
        emit(
          p,
          `criterion '${criterion.identifier || "?"}' in ${entityLabel(entity)} declares no verification mode — tools must treat it as not automatable, so it stays invisible to conformance dashboards. Declare 'automated', 'assisted', or 'manual'.`,
        );
      }
    });
  },

  "guideline-missing-rationale": (entity, pointer, emit) => {
    eachGuidelineItem(entity, pointer, (item, p) => {
      // `evidence` satisfies the "why" as well as `rationale` does —
      // agent-facing rules in particular are meant to carry evidence.
      if (!item.rationale && !item.evidence) {
        emit(
          p,
          `guideline in ${entityLabel(entity)} has no rationale or evidence — rules with stated reasons get followed. Say why, or link evidence.`,
        );
      }
    });
  },

  "entity-missing-description": (entity, pointer, emit) => {
    if (DESCRIBED_KINDS.includes(entity.kind) && !entity.description) {
      emit(
        pointer,
        `${entityLabel(entity)} has no description — readers meet the name with no idea what it is or when it applies. Add one or two sentences.`,
      );
    }
  },

  "entity-missing-use-cases": (entity, pointer, emit) => {
    const blocks = Array.isArray(entity.documentBlocks)
      ? entity.documentBlocks
      : [];
    if (
      USE_CASE_KINDS.includes(entity.kind) &&
      !blocks.some((b) => b && b.kind === "useCases")
    ) {
      emit(
        pointer,
        `${entityLabel(entity)} has no useCases block — "when do I use this?" is the first question documentation must answer. Add at least one recommended scenario.`,
      );
    }
  },
};

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

function lintEntity(entity, pointer, rules, findings) {
  for (const rule of rules) {
    rule.check(entity, pointer, (p, message) => {
      findings.push({ id: rule.id, rule: rule.name, path: p, message });
    });
  }
  // Token groups nest entities.
  if (Array.isArray(entity.children)) {
    entity.children.forEach((child, i) => {
      if (child && ENTITY_KINDS.includes(child.kind)) {
        lintEntity(child, `${pointer}/children/${i}`, rules, findings);
      }
    });
  }
}

function lintDocument(doc, rules) {
  const findings = [];
  if (doc.entity && ENTITY_KINDS.includes(doc.entity.kind)) {
    lintEntity(doc.entity, "/entity", rules, findings);
  }
  (doc.entityGroups || []).forEach((group, gi) => {
    (group.entities || []).forEach((entity, ei) => {
      if (entity && !entity.$ref && ENTITY_KINDS.includes(entity.kind)) {
        lintEntity(entity, `/entityGroups/${gi}/entities/${ei}`, rules, findings);
      }
    });
  });
  return findings;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const out = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.name.endsWith(".dsds.json")) out.push(full);
  }
  return out.sort();
}

function main() {
  const rules = activeRules();

  const targets = process.argv.slice(2).map((p) => path.resolve(p));
  const files = (targets.length ? targets : [DEFAULT_DIR]).flatMap((t) => {
    if (!fs.existsSync(t)) {
      console.error(`✗ Not found: ${t}`);
      return [];
    }
    return collectFiles(t);
  });

  console.log("\nDSDS Doc Lint (warnings only — never fails the build)");
  console.log(
    `  ${rules.length} rule(s) from rules/rules.yaml: ${rules.map((r) => r.id).join(", ")}\n`,
  );

  let totalFindings = 0;
  let cleanFiles = 0;

  for (const filePath of files) {
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      continue; // not this tool's job — validate.js reports parse errors
    }
    const findings = lintDocument(doc, rules);
    const rel = path.relative(process.cwd(), filePath);
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

  console.log(
    `  ${files.length} file(s) linted: ${cleanFiles} clean, ${totalFindings} warning(s).\n`,
  );
}

main();
