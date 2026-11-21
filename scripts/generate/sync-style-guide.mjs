#!/usr/bin/env node
/**
 * Generates site/content/style-guide.mdx from STYLE_GUIDE.md, so the guide is published on the
 * site without becoming a second copy of itself. STYLE_GUIDE.md stays the file people edit -
 * it's what README, the lint messages, and the rule catalog all cite - and this rewrites it
 * into the form the site build expects.
 *
 * Three things have to change on the way across:
 *   1. Frontmatter, which the root file has none of and every page needs.
 *   2. Links to schema files. `schema/entries/entry.schema.yaml` is a real path on GitHub but
 *      nothing the site serves; the site serves the same file at /v<version>/entries/... So
 *      those are rewritten to the versioned artifact path, which is also the form
 *      check-internal-links.mjs deliberately skips (a versioned artifact, not a page).
 *   3. Absolute designsystemdocspec.org links, which are right on GitHub and wrong on the site
 *      itself - a page shouldn't send a reader out to the network to reach its own sibling.
 *
 * Run with --check to assert the committed .mdx matches what STYLE_GUIDE.md would produce.
 * Wired into `npm run generate` and `npm run generate:check`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SOURCE = path.join(ROOT, "STYLE_GUIDE.md");
const TARGET = path.join(ROOT, "site", "content", "style-guide.mdx");

// Absolute links to this site's own pages, in the extensionless form the site publishes.
const SITE_ORIGIN = "https://designsystemdocspec.org";

const BANNER = [
  "# GENERATED FILE - do not edit. Source: STYLE_GUIDE.md, rewritten by",
  "# scripts/generate/sync-style-guide.mjs. Edit the root file instead; `npm run generate`",
  "# rewrites this one and `npm run generate:check` fails if the two drift.",
].join("\n");

function build(markdown) {
  const lines = markdown.split("\n");

  // The h1 becomes the frontmatter title, and the body drops it: every page's <ds-header> is
  // built from frontmatter, and build-site.js strips a leading h1 from both the HTML and the
  // .md mirror to avoid printing the title twice.
  const h1 = lines.findIndex((l) => /^# /.test(l));
  if (h1 === -1) throw new Error("STYLE_GUIDE.md has no h1 to take a title from");
  const heading = lines[h1].replace(/^# /, "").trim();
  let body = lines.slice(h1 + 1).join("\n").trimStart();

  // The first paragraph after the h1 is the page description. Kept in the body too - it reads
  // as the opening line there, and <ds-header> renders the description separately.
  const lede = body.split("\n").find((l) => l.trim() !== "");
  if (!lede) throw new Error("STYLE_GUIDE.md has no opening paragraph to describe the page");

  // schema/<path> -> /v<version>/<path>. The site mirrors every schema file, including the two
  // at the schema root, under its versioned directory.
  body = body.replace(/\]\(schema\/([^)]+)\)/g, "](/v{{VERSION}}/$1)");

  // An absolute link to this site, from a page on this site, becomes a relative page link.
  body = body.replace(
    new RegExp(`\\]\\(${SITE_ORIGIN}/([\\w-]+)(#[\\w.-]+)?\\)`, "g"),
    (_m, page, anchor = "") => `](${page}.html${anchor})`,
  );

  // Anything still pointing at a bare repo path would 404 here. Better to fail the build than
  // publish a dead link: every such path either needs a rule above or shouldn't be a link.
  // Code spans and fenced blocks are skipped: a link written inside code is text, not a link.
  const prose = body.replace(/^```[\s\S]*?^```/gm, "").replace(/(`+)[^`\n][\s\S]*?\1/g, "");
  const stray = [...prose.matchAll(/\]\((?!https?:|\/|#|[\w-]+\.html)([^)]+)\)/g)].map((m) => m[1]);
  if (stray.length) {
    throw new Error(
      `STYLE_GUIDE.md links to repo path(s) the site doesn't serve: ${[...new Set(stray)].join(", ")}. ` +
        "Add a rewrite rule in sync-style-guide.mjs, or make it an absolute link.",
    );
  }

  const frontmatter = [
    "---",
    BANNER,
    `title: "${heading} — DSDS {{VERSION}}"`,
    "slug: style-guide",
    `description: ${JSON.stringify(lede.trim())}`,
    "---",
  ].join("\n");

  return `${frontmatter}\n\n# ${heading}\n\n${body.replace(/\s*$/, "")}\n`;
}

const wanted = build(fs.readFileSync(SOURCE, "utf-8"));
const checkOnly = process.argv.includes("--check");
const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf-8") : null;

if (checkOnly) {
  if (current === wanted) {
    console.log("✓ site/content/style-guide.mdx is in sync with STYLE_GUIDE.md.");
    process.exit(0);
  }
  console.error(
    current === null
      ? "✗ site/content/style-guide.mdx is missing — run `npm run generate`."
      : "✗ site/content/style-guide.mdx has drifted from STYLE_GUIDE.md — run `npm run generate`.",
  );
  process.exit(1);
}

if (current === wanted) {
  console.log("✓ site/content/style-guide.mdx already up to date.");
} else {
  fs.writeFileSync(TARGET, wanted, "utf-8");
  console.log("✓ site/content/style-guide.mdx written from STYLE_GUIDE.md.");
}
