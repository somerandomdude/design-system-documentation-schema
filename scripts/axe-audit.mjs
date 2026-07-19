#!/usr/bin/env node
/**
 * axe-audit.mjs — Automated accessibility audit for every built page.
 *
 * Spins up a static server over site/dist/, loads each page in a real
 * Chromium instance via Playwright, and runs axe-core against it.
 * Prints a violation summary per page and exits non-zero if any page
 * has violations, so it can gate CI the same way lint:tokens/lint:docs do.
 *
 * Usage:
 *   npm run test:a11y
 *   node scripts/axe-audit.mjs                  # all pages in site/dist/
 *   node scripts/axe-audit.mjs index.html        # a single page
 */

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST_DIR = path.join(ROOT, "site", "dist");
const PORT = 4310;
const BASE_URL = `http://localhost:${PORT}`;

function discoverPages() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (only.length) return only;
  return fs
    .readdirSync(DIST_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

function waitForServer(url, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      fetch(url)
        .then(() => resolve())
        .catch((err) => {
          if (Date.now() - start > timeoutMs) return reject(err);
          setTimeout(poll, 150);
        });
    })();
  });
}

async function main() {
  const pages = discoverPages();
  if (pages.length === 0) {
    console.error("No pages found in site/dist/. Run `npm run build` first.");
    process.exit(1);
  }

  const server = spawn(
    process.execPath,
    [path.join(ROOT, "scripts", "serve.js"), "--dist", "--port", String(PORT)],
    { stdio: "ignore" },
  );

  let browser;
  let totalViolations = 0;
  const report = [];

  try {
    await waitForServer(`${BASE_URL}/${pages[0]}`);
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const file of pages) {
      await page.goto(`${BASE_URL}/${file}`, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page }).analyze();
      totalViolations += results.violations.length;
      report.push({ file, violations: results.violations });
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  console.log(`\naxe-core audit — ${pages.length} page(s) checked\n`);

  for (const { file, violations } of report) {
    if (violations.length === 0) {
      console.log(`  ✓ ${file}`);
      continue;
    }
    console.log(`  ✗ ${file} — ${violations.length} violation(s)`);
    for (const v of violations) {
      console.log(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
      console.log(`        ${v.helpUrl}`);
      for (const node of v.nodes.slice(0, 5)) {
        console.log(`        - ${node.target.join(" ")}`);
      }
    }
  }

  console.log(
    `\n${totalViolations === 0 ? "✓" : "✗"} ${totalViolations} total violation(s) across ${pages.length} page(s).`,
  );

  process.exit(totalViolations === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
