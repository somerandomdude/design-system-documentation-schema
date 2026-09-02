#!/usr/bin/env node
/**
 * check-internal-links.mjs — Regression guard for this repo's own internal
 * links: every markdown-style `[text](target)` link and every bare
 * `https://designsystemdocspec.org/...` URL in README.md, AGENTS.md,
 * site/content/**\/*.mdx, and schema/conformance-rules.yaml, resolved
 * against the already-built site/dist/ (run `npm run build` first — this
 * doesn't build the site itself, same as check-markdown-mirrors.mjs).
 *
 * Exists because a page restructure silently breaks a link nothing else
 * catches: when conformance.mdx/gaps.mdx merged into overview.mdx, and
 * again when 23 schema pages collapsed into one schema.html, several links
 * elsewhere in the repo kept pointing at the pages that no longer exist
 * (one such link, in schema/conformance-rules.yaml, was still broken when
 * this script was first written - fixed as part of adding it).
 *
 * What this does NOT check: external links (a different domain), versioned
 * schema/bundle artifact URLs (/v<n>/...), or README/AGENTS.md's own bare
 * `#anchor` links (those are GitHub's/a plain-markdown reader's own
 * same-page anchors, not this site's rendered HTML - only an absolute
 * designsystemdocspec.org link out of those two files is this site's
 * concern).
 *
 * Run via `npm run check:internal-links`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "site", "dist");
const CONTENT_DIR = path.join(ROOT, "site", "content");

// Which built page a source file's own bare `#anchor` links (and a
// relative link with no filename) resolve against. site/content/*.mdx
// files compile 1:1 to a page of the same name except these two - see
// build-site.js's own build() for where each one lands.
const PAGE_FOR_SOURCE = {
  "overview.mdx": "index",
  "quickstart.mdx": "quickstart",
  "extending.mdx": "extending",
  "fragments/404.mdx": "404",
  "fragments/schema-intro.mdx": "schema",
};

const MD_LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;
const ABS_URL_RE = /https:\/\/designsystemdocspec\.org(\/[^\s")'<>]*)?/g;

function extractLinks(text) {
  const links = new Set();
  for (const m of text.matchAll(MD_LINK_RE)) links.add(m[1]);
  for (const m of text.matchAll(ABS_URL_RE)) links.add(m[0]);
  return [...links];
}

// A link worth checking against this site's own build: a relative
// "<page>.html" (optionally with "#anchor"), a bare "#anchor", the root
// "/", or an absolute designsystemdocspec.org link to one of those. Not
// worth checking: any other external URL, mailto:, or a versioned
// artifact path (/v<n>/... - a schema/bundle file, not a doc page; also
// where an uncompiled {{VERSION}} placeholder would otherwise look like a
// broken path in the raw .mdx source).
function isSiteDocLink(link) {
  let rel = link;
  if (rel.startsWith("https://designsystemdocspec.org")) {
    rel = rel.slice("https://designsystemdocspec.org".length) || "/";
  } else if (/^https?:\/\//.test(rel) || rel.startsWith("mailto:")) {
    return false;
  }
  if (/^\/v[\w.{}]/.test(rel)) return false; // versioned schema/bundle artifact
  return rel === "/" || rel.startsWith("#") || /^\/?[\w-]+\.html(#.*)?$/.test(rel);
}

function toDistTarget(link, currentPage) {
  let rel = link.startsWith("https://designsystemdocspec.org")
    ? link.slice("https://designsystemdocspec.org".length) || "/"
    : link;
  rel = rel.replace(/^\//, "");
  // A bare "#anchor" (no filename) means "this same page" - only
  // meaningful for a source file that compiles to one (site/content/*.mdx).
  // An empty path (root "/") always means the home page, regardless of
  // which source file it was found in.
  if (rel.startsWith("#")) {
    return { file: `${currentPage}.html`, anchor: rel.slice(1) };
  }
  if (rel === "") {
    return { file: "index.html", anchor: "" };
  }
  const [file, anchor = ""] = rel.split("#");
  return { file, anchor };
}

const anchorCache = new Map();
function anchorExists(file, anchor) {
  if (!anchor) return true;
  if (!anchorCache.has(file)) {
    const filePath = path.join(DIST_DIR, file);
    anchorCache.set(file, fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : null);
  }
  const html = anchorCache.get(file);
  if (html == null) return false;
  return html.includes(`id="${anchor}"`) || html.includes(`anchor="${anchor}"`);
}

function collectMdxFiles(dir, base = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMdxFiles(full, rel));
    else if (entry.name.endsWith(".mdx")) out.push(rel);
  }
  return out;
}

const sources = [
  { label: "README.md", path: path.join(ROOT, "README.md"), page: null },
  { label: "AGENTS.md", path: path.join(ROOT, "AGENTS.md"), page: null },
  { label: "schema/conformance-rules.yaml", path: path.join(ROOT, "schema/conformance-rules.yaml"), page: null },
  ...collectMdxFiles(CONTENT_DIR).map((rel) => ({
    label: `site/content/${rel}`,
    path: path.join(CONTENT_DIR, rel),
    page: PAGE_FOR_SOURCE[rel] || null,
  })),
];

let ok = true;
let checked = 0;

for (const source of sources) {
  const text = fs.readFileSync(source.path, "utf-8");
  for (const link of extractLinks(text)) {
    if (!isSiteDocLink(link)) continue;
    if (link.startsWith("#") && !source.page) continue; // README/AGENTS.md's own bare anchors aren't this site's concern
    checked++;
    const { file, anchor } = toDistTarget(link, source.page);
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`✗ ${source.label}: "${link}" -> site/dist/${file} does not exist`);
      ok = false;
      continue;
    }
    if (!anchorExists(file, anchor)) {
      console.error(`✗ ${source.label}: "${link}" -> site/dist/${file} exists, but no id/anchor "${anchor}" found in it`);
      ok = false;
    }
  }
}

if (ok) {
  console.log(`✓ ${checked} internal link(s) across ${sources.length} source file(s) all resolve against site/dist/.`);
}
process.exit(ok ? 0 : 1);
