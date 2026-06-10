#!/usr/bin/env node
/**
 * lint-docs.js — Editorial lint for DSDS documents (the warning tier).
 *
 * Schema validation answers "is this document allowed?" This lint answers
 * "is this documentation good?" It runs on documents that already validate,
 * reports quality gaps, and NEVER fails the build: findings are warnings,
 * not errors, and the exit code is always 0.
 *
 * Rules (XS starter set):
 *   guideline-missing-rationale  Guideline entries without a `rationale`.
 *                                Rules with stated reasons get followed.
 *   entity-missing-description   Components, patterns, foundations, guides,
 *                                and themes without a `description`. Tokens
 *                                and token groups are exempt — the spec
 *                                keeps them terse at scale by design.
 *   entity-missing-use-cases     Components and patterns without a
 *                                `useCases` block. "When do I use this?" is
 *                                the first question docs must answer.
 *
 * Usage:
 *   node scripts/lint-docs.js [paths…]   # files or directories
 *   npm run lint:docs                    # defaults to spec/examples/
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DIR = path.join(ROOT, "spec", "examples");

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
];

// ---------------------------------------------------------------------------
// Rules — each takes (entity, pointer) and returns finding messages
// ---------------------------------------------------------------------------

function lintEntity(entity, pointer, findings) {
  const label = `${entity.kind} '${entity.identifier || "?"}'`;

  if (DESCRIBED_KINDS.includes(entity.kind) && !entity.description) {
    findings.push({
      rule: "entity-missing-description",
      path: pointer,
      message: `${label} has no description — readers meet the name with no idea what it is or when it applies. Add one or two sentences.`,
    });
  }

  const blocks = Array.isArray(entity.documentBlocks)
    ? entity.documentBlocks
    : [];

  if (
    USE_CASE_KINDS.includes(entity.kind) &&
    !blocks.some((b) => b && b.kind === "useCases")
  ) {
    findings.push({
      rule: "entity-missing-use-cases",
      path: pointer,
      message: `${label} has no useCases block — "when do I use this?" is the first question documentation must answer. Add at least one recommended scenario.`,
    });
  }

  for (const [arrayName, arr] of [
    ["documentBlocks", blocks],
    [
      "agentDocumentBlocks",
      Array.isArray(entity.agentDocumentBlocks)
        ? entity.agentDocumentBlocks
        : [],
    ],
  ]) {
    arr.forEach((block, bi) => {
      if (!block || block.kind !== "guidelines") return;
      (block.items || []).forEach((item, ii) => {
        // `evidence` satisfies the "why" as well as `rationale` does —
        // agent-facing rules in particular are meant to carry evidence.
        if (item && !item.rationale && !item.evidence) {
          findings.push({
            rule: "guideline-missing-rationale",
            path: `${pointer}/${arrayName}/${bi}/items/${ii}`,
            message: `guideline in ${label} has no rationale or evidence — rules with stated reasons get followed. Say why, or link evidence.`,
          });
        }
      });
    });
  }

  // Token groups nest entities.
  if (Array.isArray(entity.children)) {
    entity.children.forEach((child, i) => {
      if (child && ENTITY_KINDS.includes(child.kind)) {
        lintEntity(child, `${pointer}/children/${i}`, findings);
      }
    });
  }
}

function lintDocument(doc) {
  const findings = [];
  if (doc.entity && ENTITY_KINDS.includes(doc.entity.kind)) {
    lintEntity(doc.entity, "/entity", findings);
  }
  (doc.entityGroups || []).forEach((group, gi) => {
    (group.entities || []).forEach((entity, ei) => {
      if (entity && !entity.$ref && ENTITY_KINDS.includes(entity.kind)) {
        lintEntity(entity, `/entityGroups/${gi}/entities/${ei}`, findings);
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
  const targets = process.argv.slice(2).map((p) => path.resolve(p));
  const files = (targets.length ? targets : [DEFAULT_DIR]).flatMap((t) => {
    if (!fs.existsSync(t)) {
      console.error(`✗ Not found: ${t}`);
      return [];
    }
    return collectFiles(t);
  });

  console.log("\nDSDS Doc Lint (warnings only — never fails the build)\n");

  let totalFindings = 0;
  let cleanFiles = 0;

  for (const filePath of files) {
    let doc;
    try {
      doc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      continue; // not this tool's job — validate.js reports parse errors
    }
    const findings = lintDocument(doc);
    const rel = path.relative(process.cwd(), filePath);
    if (findings.length === 0) {
      cleanFiles++;
      continue;
    }
    console.log(`  ${rel}`);
    for (const f of findings) {
      console.log(`    ⚠ [${f.rule}] ${f.path}: ${f.message}`);
      totalFindings++;
    }
    console.log("");
  }

  console.log(
    `  ${files.length} file(s) linted: ${cleanFiles} clean, ${totalFindings} warning(s).\n`,
  );
}

main();
