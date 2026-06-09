#!/usr/bin/env node
/**
 * lint-token-refs.mjs — Guard against truth forking from the token source.
 *
 * DSDS positions the docs as the spec and treats the design system's token
 * layer (ultimately the W3C DTCG file, linked via a token entity's `source`)
 * as the single source of truth for values. Several slots, however, accept
 * EITHER a token identifier OR a raw CSS value:
 *
 *   - design-specifications: `properties`, `spacing`, `sizing`, `typography`
 *     (and the same inside each variant / size / state / variant-state)
 *   - anatomy: each part's `tokens` map
 *   - states: each state's `tokens` map
 *
 * When a document HAS a token layer, a raw value in one of those slots is a
 * hardcoded copy that can silently drift from the token it duplicates. This
 * lint flags those raw values so they can be replaced with a token reference.
 *
 * Scope: only documents that declare a token layer (a `token` or `token-group`
 * entity) are checked — a token-less system legitimately uses raw values, and
 * has no source to fork from.
 *
 * Note: this is a structural check. It flags raw-value-SHAPED strings in token
 * slots; it does not resolve values against the DTCG file (those values are not
 * carried in the DSDS document). Resolving/comparing against a supplied DTCG
 * source is a possible future enhancement.
 *
 * Usage:
 *   node scripts/lint-token-refs.mjs [paths...]      # default: spec/examples + test
 *   node scripts/lint-token-refs.mjs --quiet         # findings only, no per-file OK lines
 *
 * Exits non-zero when any fork-prone raw value is found in a token-bearing doc.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const QUIET = args.includes("--quiet");
const inputs = args.filter((a) => !a.startsWith("--"));

// Raw-value shapes that can fork from a token's value: hex colors, numeric
// dimensions (with or without a unit), and CSS value functions. Token
// identifiers (e.g. `space-4`, `color-action-primary`) contain letters and a
// hyphen, so they never match these. Bare CSS keywords (`transparent`, `none`,
// `bold`) are intentionally NOT flagged — they do not shadow a token value.
const RAW_PATTERNS = [
  /^#[0-9a-fA-F]{3,8}$/,
  /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|fr|pt|cm|mm|s|ms|deg)?$/,
  /^(rgb|rgba|hsl|hsla|lab|lch|oklch|oklab|color|calc|clamp|min|max|var)\s*\(/,
];
// Zero is dimensionless and conventionally not tokenized — `0` / `0px` cannot
// drift from a token, so it is exempt and not treated as a fork-prone value.
const ZERO = /^-?0(\.0+)?(px|rem|em|%|vh|vw|vmin|vmax|ch|fr|pt|cm|mm|s|ms|deg)?$/;
const isRawValue = (v) => {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (ZERO.test(t)) return false;
  return RAW_PATTERNS.some((re) => re.test(t));
};

// --- discovery -------------------------------------------------------------

function gatherFiles(targets) {
  const out = [];
  const walk = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      for (const e of fs.readdirSync(p)) walk(path.join(p, e));
    } else if (p.endsWith(".json")) {
      out.push(p);
    }
  };
  for (const t of targets) {
    const abs = path.isAbsolute(t) ? t : path.join(ROOT, t);
    if (fs.existsSync(abs)) walk(abs);
  }
  return out.sort();
}

const hasTokenLayer = (node) => {
  if (Array.isArray(node)) return node.some(hasTokenLayer);
  if (node && typeof node === "object") {
    if (node.kind === "token" || node.kind === "token-group") return true;
    return Object.values(node).some(hasTokenLayer);
  }
  return false;
};

// --- slot scanners ---------------------------------------------------------

function scanMap(map, where, findings) {
  if (!map || typeof map !== "object") return;
  for (const [k, v] of Object.entries(map)) {
    if (isRawValue(v)) findings.push({ where: `${where}.${k}`, value: v });
  }
}

const SIZING_KEYS = ["minWidth", "maxWidth", "minHeight", "maxHeight"];
const TYPE_KEYS = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"];

// A "spec node" is the design-specifications block itself or one of its
// variant / size / state / variant-state entries — all share these carriers.
function scanSpecNode(node, where, findings) {
  if (!node || typeof node !== "object") return;
  scanMap(node.properties, `${where}.properties`, findings);
  if (node.spacing) {
    scanMap(node.spacing.internal, `${where}.spacing.internal`, findings);
    scanMap(node.spacing.external, `${where}.spacing.external`, findings);
  }
  if (node.sizing) {
    for (const k of SIZING_KEYS) {
      if (isRawValue(node.sizing[k])) findings.push({ where: `${where}.sizing.${k}`, value: node.sizing[k] });
    }
  }
  if (node.typography && typeof node.typography === "object") {
    for (const [el, t] of Object.entries(node.typography)) {
      if (!t || typeof t !== "object") continue;
      for (const k of TYPE_KEYS) {
        if (isRawValue(t[k])) findings.push({ where: `${where}.typography.${el}.${k}`, value: t[k] });
      }
    }
  }
}

function scanBlock(block, where, findings) {
  if (block.kind === "design-specifications") {
    // Baseline spec only — per-variant/state values live on the variants/states blocks.
    scanSpecNode(block, where, findings);
  } else if (block.kind === "variants") {
    (block.items || []).forEach((axis, i) => {
      // flag variants carry tokens directly; enum variants carry them per value
      scanMap(axis.tokens, `${where}.items[${i}](${axis.identifier || i}).tokens`, findings);
      (axis.values || []).forEach((val, j) =>
        scanMap(val.tokens, `${where}.items[${i}].values[${j}](${val.identifier || j}).tokens`, findings),
      );
    });
  } else if (block.kind === "anatomy") {
    (block.parts || []).forEach((p, i) =>
      scanMap(p.tokens, `${where}.parts[${i}](${p.identifier || i}).tokens`, findings),
    );
  } else if (block.kind === "states") {
    (block.items || []).forEach((s, i) =>
      scanMap(s.tokens, `${where}.items[${i}](${s.identifier || i}).tokens`, findings),
    );
  }
}

// Recursively find every block object with a token-bearing kind.
function findBlocks(node, where, findings) {
  if (Array.isArray(node)) {
    node.forEach((x, i) => findBlocks(x, `${where}[${i}]`, findings));
  } else if (node && typeof node === "object") {
    if (["design-specifications", "variants", "anatomy", "states"].includes(node.kind)) {
      scanBlock(node, where, findings);
    }
    for (const [k, v] of Object.entries(node)) findBlocks(v, `${where}.${k}`, findings);
  }
}

// --- run -------------------------------------------------------------------

const targets = inputs.length ? inputs : ["spec/examples", "test"];
const files = gatherFiles(targets);

let checked = 0;
let withFindings = 0;
let totalFindings = 0;

console.log("\nToken-reference lint (fork guard)\n");

for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    continue; // JSON validity is validate.js's job
  }
  if (!hasTokenLayer(data)) continue; // token-less doc: raw values are fine
  checked++;

  const findings = [];
  findBlocks(data, "", findings);
  const rel = path.relative(ROOT, file);

  if (findings.length === 0) {
    if (!QUIET) console.log(`  ✓ ${rel}`);
    continue;
  }
  withFindings++;
  totalFindings += findings.length;
  console.error(`  ✗ ${rel} — ${findings.length} raw value(s) in token slots:`);
  for (const f of findings) console.error(`      ${f.where.replace(/^\./, "")} = ${JSON.stringify(f.value)}`);
}

console.log(
  `\n  ${checked} token-bearing document(s) checked, ${withFindings} with findings, ${totalFindings} raw value(s) flagged.`,
);

if (totalFindings > 0) {
  console.error(
    `\n  These slots should reference token identifiers, not hardcoded values,\n` +
      `  in a system that has a token layer — a raw value here can drift from the\n` +
      `  token it duplicates. (Token-less systems are exempt and not checked.)\n`,
  );
  process.exit(1);
}
console.log("  ✓ No fork-prone raw values in token-bearing documents.\n");
