#!/usr/bin/env node
/**
 * Fails when a retired term reappears in prose. schema/terms.yaml records which word wins for
 * each concept; this is what stops the losing one drifting back in.
 *
 * Deliberately narrow. terms.yaml's `not` column lists every synonym a reviewer should push
 * back on, but most of them are ordinary English somewhere else — "tool" is right when it means
 * an actual tool, "item" is a real field name, "type" appears in every `type: string`. Grepping
 * the whole column would produce noise nobody reads. So this checks only terms that named a
 * thing the current model no longer has, where any occurrence in prose is a real mistake:
 *
 *   entity / entities   the pre-0.20.0 word for an entry
 *   documentBlock       the pre-0.20.0 word for a section
 *   spec file           a document; "spec" is the specification
 *
 * CHANGELOG and the migration guide are exempt: describing the old model is their job.
 *
 * Run via `npm run check:docs`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const RETIRED = [
  { pattern: /\bentit(y|ies)\b/gi, use: "entry", note: "the pre-0.20.0 model's word for an entry" },
  { pattern: /\bdocumentBlocks?\b/g, use: "section", note: "the pre-0.20.0 model's word for a section" },
  { pattern: /\bspec files?\b/gi, use: "document", note: "`spec` is the specification itself" },
];

// Files whose subject is the old model, or which are machine-written from something else.
const EXEMPT = [
  "CHANGELOG",
  "site/content/stability.mdx", // documents the pre-0.20 → 0.20.0 migration
  "site/content/style-guide.mdx", // generated from STYLE_GUIDE.md
  "dsds-work-2026-09-12",
];

const SOURCES = [
  "README.md",
  "AGENTS.md",
  "STYLE_GUIDE.md",
  "CONTRIBUTING.md",
  ...fs
    .readdirSync(path.join(ROOT, ".agents/skills"))
    .map((d) => `.agents/skills/${d}/SKILL.md`)
    .filter((p) => fs.existsSync(path.join(ROOT, p))),
  ...fs
    .readdirSync(path.join(ROOT, "site/content"))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => `site/content/${f}`),
].filter((f) => !EXEMPT.some((e) => f.startsWith(e)));

// Prose only. A retired word inside a fence or inline code is usually a field name, a historical
// id, or a quoted error string — none of which this is about.
// The terms table names every retired word on purpose - that's the point of its `not` column -
// so the generated region has to come out before the scan, or this check fails on its own
// source of truth.
function stripGeneratedRegions(text) {
  return text
    .replace(/<!-- dsds:[\w-]+ -->[\s\S]*?<!-- \/dsds:[\w-]+ -->/g, "")
    .replace(/\{\/\* dsds:[\w-]+ \*\/\}[\s\S]*?\{\/\* \/dsds:[\w-]+ \*\/\}/g, "");
}

function stripCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/https?:\/\/\S+/g, "");
}

let ok = true;
let scanned = 0;

for (const rel of SOURCES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  scanned += 1;
  const prose = stripCode(stripGeneratedRegions(fs.readFileSync(full, "utf8")));
  for (const { pattern, use, note } of RETIRED) {
    const hits = [...prose.matchAll(pattern)];
    if (!hits.length) continue;
    const shown = [...new Set(hits.map((h) => h[0]))].join(", ");
    console.error(
      `✗ ${rel}: uses "${shown}" (${note}) — say "${use}". schema/terms.yaml records the choice; ` +
        `if the old word is genuinely the subject here, add the file to EXEMPT in this check.`,
    );
    ok = false;
  }
}

if (ok) {
  console.log(`✓ No retired terms in ${scanned} prose file(s) (schema/terms.yaml records the choices).`);
}
process.exit(ok ? 0 : 1);
