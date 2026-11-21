#!/usr/bin/env node
/**
 * Scores one run of the agent eval (evals/tasks.json). Each answer lives in
 * evals/results/<run>/<task-id>.md. A task passes when its answer:
 *   - has a YAML code block that parses,
 *   - validates with no errors (dsds-validate's own validator; warnings are reported, not
 *     counted, since a single-file answer can't always see the entries it points at), and
 *   - meets every check in the task.
 *
 *   node evals/score.mjs <run>              # e.g. node evals/score.mjs baseline
 *
 * Writes evals/results/<run>/summary.json and prints a table. It doesn't judge the answer's
 * wording; a failure is recorded so someone can say whether the site, the schema, or the
 * validator's message caused it.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VALIDATE = path.join(ROOT, "scripts", "validate", "validate.js");

const run = process.argv[2];
if (!run) {
  console.error("Usage: node evals/score.mjs <run>");
  process.exit(2);
}
// The eval supports one version: the one evals/context/ was refreshed from. A context from
// another version would test the wrong pages, so scoring refuses it.
const current = fs.readFileSync(path.join(ROOT, "schema", "dsds.bundled.yaml"), "utf-8")
  .match(/^\$id:\s*https:\/\/designsystemdocspec\.org\/v([0-9.]+)\//m)?.[1];
const contextQuickstart = fs.readFileSync(path.join(__dirname, "context", "quickstart.md"), "utf-8");
if (!current || !contextQuickstart.includes(current)) {
  console.error(`✗ evals/context/ isn't for ${current}. Run npm run build, then node evals/refresh-context.mjs.`);
  process.exit(1);
}

const runDir = path.join(__dirname, "results", run);
const tasks = JSON.parse(fs.readFileSync(path.join(__dirname, "tasks.json"), "utf-8")).tasks;

// The first YAML code block in the answer. An answer that's only prose, or has no fence, has none.
function firstYaml(text) {
  const m = text.match(/```(?:yaml|yml)\s*\n([\s\S]*?)```/);
  return m ? m[1] : null;
}

// dots and [n], as in "sections[0].items[0].level". Missing parts give undefined.
function at(doc, dotted) {
  return dotted.split(/\.|(?=\[)/).reduce((v, part) => {
    if (v === undefined || v === null) return undefined;
    const idx = part.match(/^\[(\d+)\]$/);
    return idx ? v[Number(idx[1])] : v[part];
  }, doc);
}

const matches = (item, partial) =>
  item && typeof item === "object" && Object.entries(partial).every(([k, v]) => {
    if (v && typeof v === "object") return matches(item[k], v);
    return item[k] === v;
  });

// Every value under any `checks` key, anywhere in the document, as one string.
function checksText(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => checksText(n, out));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "checks") out.push(JSON.stringify(v));
      checksText(v, out);
    }
  }
  return out.join("\n");
}

// A DTCG pointer ("#/color/action/primary") followed into the parsed file. Null when missing.
function dtcgToken(file, pointer) {
  let node = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf-8"));
  for (const raw of pointer.split("/").slice(1)) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (node === null || typeof node !== "object" || !(key in node)) return null;
    node = node[key];
  }
  return node && typeof node === "object" && "$value" in node ? node : null;
}

// A token's `source` (a bare string, or {href}) must point at a token in the task's DTCG file
// (the file the task names), and that token must hold the expected value.
function sourceToken(doc, dtcg, expectedValue) {
  const source = doc.source;
  const href = typeof source === "string" ? source : source?.href;
  if (typeof href !== "string" || !href.includes("#")) return false;
  const [fileName, pointer] = [href.slice(0, href.indexOf("#")), href.slice(href.indexOf("#") + 1)];
  if (path.basename(fileName) !== path.basename(dtcg)) return false;
  const token = dtcgToken(dtcg, pointer);
  if (!token) return false;
  return expectedValue === null || token.$value === expectedValue;
}

function check(doc, [p, op, value], task) {
  if (op === "deepContains") return checksText(doc).includes(value);
  if (op === "sourceToken") return sourceToken(doc, task.dtcg, value);
  const v = at(doc, p);
  switch (op) {
    case "eq": return v === value;
    case "exists": return v !== undefined && v !== null;
    case "notExists": return v === undefined;
    case "len>=": return Array.isArray(v) && v.length >= value;
    case "contains":
      return typeof v === "string" ? v.includes(value) : JSON.stringify(v ?? "").includes(value);
    case "notContains": return typeof v === "string" && !v.includes(value);
    case "some": return Array.isArray(v) && v.some((item) => matches(item, value));
    default: throw new Error(`unknown op ${op}`);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dsds-eval-"));
const summary = { run, tasks: [] };
for (const task of tasks) {
  const file = path.join(runDir, `${task.id}.md`);
  const row = { id: task.id, pass: false, validates: false, warnings: 0, failed: [], note: null };
  summary.tasks.push(row);
  if (!fs.existsSync(file)) {
    row.note = "no answer saved";
    continue;
  }
  const block = firstYaml(fs.readFileSync(file, "utf-8"));
  if (block === null) {
    row.note = "no YAML code block in the answer";
    continue;
  }
  let doc;
  try {
    doc = yaml.load(block, { schema: yaml.JSON_SCHEMA });
  } catch (err) {
    row.note = `YAML doesn't parse: ${err.message.split("\n")[0]}`;
    continue;
  }
  const docFile = path.join(tmp, `${task.id}.dsds.yaml`);
  fs.writeFileSync(docFile, block);
  let report;
  try {
    report = JSON.parse(execFileSync(process.execPath, [VALIDATE, "--json", docFile], { encoding: "utf-8" }));
  } catch (err) {
    report = JSON.parse(err.stdout || "{}");
  }
  const findings = report.files?.[0]?.findings ?? [];
  const errors = findings.filter((f) => f.severity === "error");
  row.warnings = findings.filter((f) => f.severity === "warning").length;
  row.validates = errors.length === 0;
  if (!row.validates) row.note = errors.slice(0, 2).map((e) => `${e.rule ?? "schema"} ${e.message}`).join(" | ").slice(0, 240);
  for (const c of task.checks) {
    let ok = false;
    try {
      ok = check(doc, c, task);
    } catch {
      ok = false;
    }
    if (!ok) row.failed.push(c.join(" "));
  }
  row.pass = row.validates && row.failed.length === 0;
}
fs.rmSync(tmp, { recursive: true, force: true });

summary.passed = summary.tasks.filter((t) => t.pass).length;
summary.validated = summary.tasks.filter((t) => t.validates).length;
summary.total = tasks.length;
fs.writeFileSync(path.join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

for (const t of summary.tasks) {
  const status = t.pass ? "PASS" : "FAIL";
  console.log(`${status}  ${t.id.padEnd(30)} valid=${t.validates ? "yes" : "no "}  ${t.failed.length ? `missed: ${t.failed.join("; ")}` : ""}${t.note ? `  note: ${t.note}` : ""}`);
}
console.log(`\n${run}: ${summary.passed}/${summary.total} passed; ${summary.validated}/${summary.total} validate.`);
