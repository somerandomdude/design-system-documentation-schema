#!/usr/bin/env node
/**
 * generate-og-image.mjs — Generates the site's shared Open Graph image.
 *
 * Every page links the same image: the DSDS logo centered on the accent
 * background color, at the standard 1200×630 OG size. Rendered with a real
 * Chromium instance (via Playwright, already a project dependency for
 * axe-audit.mjs) loading tokens.css, so the image always matches the
 * current --ds-color-bg-accent / --ds-color-text values — no color
 * hardcoded here to fall out of sync with the design tokens.
 *
 * Usage:
 *   npm run og:generate
 */

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE_DIR = path.join(ROOT, "site");
const LOGO_PATH = path.join(SITE_DIR, "assets", "dsds.svg");
const OUTPUT_PATH = path.join(SITE_DIR, "assets", "og-image.png");
const TEMP_HTML_PATH = path.join(SITE_DIR, ".og-image-source.html");

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 360;

async function main() {
  const logoSvg = fs.readFileSync(LOGO_PATH, "utf8");

  // Loaded from site/ so the relative tokens.css link resolves the same way
  // it does for every real page. The logo's fill is set via CSS (not the
  // SVG file's own hardcoded fill="black") — a stylesheet rule always wins
  // over an SVG presentation attribute, the same technique <ds-logo> uses.
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="tokens.css">
<style>
  html, body { margin: 0; padding: 0; }
  .og {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-color-bg-accent);
  }
  .og svg {
    width: ${LOGO_SIZE}px;
    height: ${LOGO_SIZE}px;
  }
  .og svg path {
    fill: var(--ds-color-text);
  }
</style>
</head>
<body>
  <div class="og">${logoSvg}</div>
</body>
</html>
`;

  fs.writeFileSync(TEMP_HTML_PATH, html);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
    });
    await page.goto("file://" + TEMP_HTML_PATH);
    const og = page.locator(".og");
    await og.screenshot({ path: OUTPUT_PATH });
    console.log(`✓ Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
  } finally {
    await browser.close();
    fs.unlinkSync(TEMP_HTML_PATH);
  }
}

main();
