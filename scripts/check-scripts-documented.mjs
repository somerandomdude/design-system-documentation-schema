#!/usr/bin/env node
/**
 * check-scripts-documented.mjs — Drift guard for CONTRIBUTING.md's
 * "Every script" reference.
 *
 * package.json's `scripts` block is the index of what this repo can do, and
 * for a long time it was the ONLY description of it: 33 entries, no
 * reference anywhere, and the real explanations one level down in each
 * script file's own header. That's how six scripts ended up referenced
 * nowhere at all, and how nobody noticed that `bundle` and
 * `sync-skill-versions` can't be renamed (scripts/bump-version.js shells out
 * to them by name).
 *
 * So the reference exists now — and this asserts it stays true, in both
 * directions:
 *
 *   - Every script in package.json appears in CONTRIBUTING.md. Add a script,
 *     say what it's for.
 *   - Every `npm run <name>` in CONTRIBUTING.md is a script that exists. A
 *     rename can't leave the table pointing at nothing.
 *
 * Deliberately checks presence, not prose quality: a one-line description
 * nobody maintains is still better than an entry that silently disappears.
 *
 * Run via `npm run check:docs`.
 *
 * Exits non-zero on drift in either direction.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const scripts = new Set(
  Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")).scripts),
);

const contributing = fs.readFileSync(path.join(ROOT, "CONTRIBUTING.md"), "utf-8");
// Only count a name inside backticks: prose like "run npm run check first"
// shouldn't satisfy the reference, and a fenced example shouldn't either.
const documented = new Set([...contributing.matchAll(/`npm run ([\w:.-]+)/g)].map((m) => m[1]));

let ok = true;

for (const name of [...scripts].sort()) {
  if (!documented.has(name)) {
    console.error(`✗ package.json's "${name}" script isn't in CONTRIBUTING.md's "Every script" reference`);
    ok = false;
  }
}

for (const name of [...documented].sort()) {
  if (!scripts.has(name)) {
    console.error(`✗ CONTRIBUTING.md documents \`npm run ${name}\`, which no longer exists in package.json`);
    ok = false;
  }
}

if (ok) {
  console.log(`✓ All ${scripts.size} npm script(s) are documented in CONTRIBUTING.md, and it documents no script that doesn't exist.`);
}
process.exit(ok ? 0 : 1);
