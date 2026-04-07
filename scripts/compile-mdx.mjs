#!/usr/bin/env node
/**
 * compile-mdx.mjs — Compiles .mdx content files to HTML for the DSDS spec site.
 *
 * Transforms MDX source → HTML string using a lightweight, string-based JSX
 * runtime (no React dependency). Web components like <ds-callout>, <ds-table>,
 * <ds-badge> etc. pass through as custom elements.
 *
 * Pipeline per file:
 *   1. Parse YAML frontmatter
 *   2. Preprocess: escape stray {} outside code fences
 *   3. Preprocess: convert <ds-code>…</ds-code> blocks → fenced code blocks
 *   4. Preprocess: expand <ds-example file="…" /> → inline JSON code blocks
 *   5. Compile MDX via @mdx-js/mdx
 *   6. Evaluate with string-based JSX runtime → HTML string
 *   7. Post-process: map markdown HTML elements → web components
 *
 * Dependencies:
 *   @mdx-js/mdx   — MDX compiler (required)
 *   remark-gfm     — GFM table/autolink/strikethrough support (optional but
 *                    strongly recommended; install with `npm i -D remark-gfm`)
 *
 * Exports:
 *   compileMdxFile(filePath)  → Promise<{ meta, html }>
 *   compileAllMdx()           → Promise<Array<{ file, meta, html }>>
 */

import { compile, run } from "@mdx-js/mdx";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "site", "content");
const EXAMPLES_DIR = path.join(ROOT, "spec", "examples", "minimal");

// ---------------------------------------------------------------------------
// Optional remark-gfm (tables, autolinks, strikethrough)
// ---------------------------------------------------------------------------

let remarkGfm = null;
try {
  remarkGfm = (await import("remark-gfm")).default;
} catch {
  // Tables authored as pipe-separated markdown will not render without
  // remark-gfm. Install it: npm i -D remark-gfm
}

// ═══════════════════════════════════════════════════════════════════════════
// Frontmatter
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a simple YAML-ish frontmatter block delimited by `---`.
 * Returns { meta: Record<string,string>, body: string }.
 */
function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: source };

  const meta = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^\s*(\w[\w-]*)\s*:\s*(.+?)\s*$/);
    if (m) meta[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return { meta, body: match[2] };
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML escaping
// ═══════════════════════════════════════════════════════════════════════════

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════════════════
// Preprocessing — runs BEFORE MDX compilation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Escape `{` and `}` outside fenced code blocks and HTML/JSX tags so MDX
 * does not try to interpret them as JSX expressions.
 *
 * Fenced code blocks (``` … ```) are left untouched because MDX already
 * treats their content as raw text.
 */
function escapeCurlyBraces(source) {
  // Split on fenced code blocks (including language tag).  Odd indices are
  // the code blocks themselves.
  const parts = source.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      // Inside a code fence → leave alone
      if (i % 2 === 1) return part;

      // Outside code fences → escape bare { } that are NOT part of a JSX
      // expression wrapped in a recognized MDX pattern (import/export,
      // component prop expression).  For our content files the only {}
      // occurrences outside fences are stray literals in prose, so a
      // blanket escape is safe.
      return part.replace(/(?<!\\)\{/g, "\\{").replace(/(?<!\\)\}/g, "\\}");
    })
    .join("");
}

/**
 * Convert explicit `<ds-code language="…" label="…">…</ds-code>` blocks to
 * fenced code blocks.  This avoids MDX interpreting `{` inside the JSON
 * content as a JSX expression.
 */
function preprocessDsCodeBlocks(source) {
  return source.replace(
    /<ds-code\s+language="([^"]+)"(?:\s+label="([^"]*)")?[^>]*>([\s\S]*?)<\/ds-code>/g,
    (_match, lang, label, content) => {
      const trimmed = content.trim();
      const meta = label ? ` label="${label}"` : "";
      // Fenced code block — safe zone for MDX
      return "```" + lang + meta + "\n" + trimmed + "\n```";
    },
  );
}

/**
 * Expand `<ds-example file="…" label="…" />` into fenced JSON code blocks
 * by reading the corresponding file from `spec/examples/minimal/`.
 */
function preprocessExamples(source) {
  return source.replace(
    /<ds-example\s+file="([^"]+)"(?:\s+label="([^"]*)")?\s*\/>/g,
    (_match, file, label) => {
      const filePath = path.join(EXAMPLES_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.error(`    ⚠  <ds-example> file not found: ${file}`);
        return `<!-- Example not found: ${file} -->`;
      }
      try {
        const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const formatted = JSON.stringify(json, null, 2);
        const meta = label ? ` label="${label}"` : "";
        return "```json" + meta + "\n" + formatted + "\n```";
      } catch (err) {
        console.error(`    ⚠  Failed to parse ${file}: ${err.message}`);
        return `<!-- Failed to load example: ${file} -->`;
      }
    },
  );
}

/**
 * Run all preprocessing steps in order.
 */
function preprocess(source) {
  let s = source;
  s = preprocessDsCodeBlocks(s);
  s = preprocessExamples(s);
  s = escapeCurlyBraces(s);
  return s;
}

// ═══════════════════════════════════════════════════════════════════════════
// String-based JSX runtime
//
// MDX compiles markdown + JSX into calls to jsx(type, props).  This runtime
// renders those calls to HTML strings instead of DOM nodes or virtual-DOM
// objects, so we get a plain HTML string without any framework dependency.
// ═══════════════════════════════════════════════════════════════════════════

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Sentinel value used as the JSX Fragment type. */
const Fragment = Symbol.for("mdx.Fragment");

/** Recursively flatten and stringify children. */
function renderChildren(children) {
  if (children == null || children === false || children === true) return "";
  if (Array.isArray(children)) return children.map(renderChildren).join("");
  return String(children);
}

/**
 * JSX factory — called by the compiled MDX module for every element.
 *
 * - Fragment   → concatenate children
 * - Function   → call it (component)
 * - String     → render as HTML tag
 */
function jsx(type, props) {
  const { children, ...attrs } = props || {};
  const childStr = renderChildren(children);

  // Fragment — just return children
  if (type === Fragment) return childStr;

  // Component function — delegate
  if (typeof type === "function") {
    return type({ ...attrs, children: childStr });
  }

  // HTML / custom element — render as a tag
  const attrParts = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "key" || key === "ref") continue;
    const name = key === "className" ? "class" : key;
    if (value === true) {
      attrParts.push(name);
    } else {
      attrParts.push(`${name}="${esc(String(value))}"`);
    }
  }
  const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";

  if (VOID_ELEMENTS.has(type) && !childStr) {
    return `<${type}${attrStr} />`;
  }
  return `<${type}${attrStr}>${childStr}</${type}>`;
}

/** jsxs — same as jsx; MDX calls this for elements with static children. */
const jsxs = jsx;

/**
 * MDX calls useMDXComponents() to allow component overrides.  We return an
 * empty map because we handle element→web-component mapping in post-processing
 * rather than at the JSX level.  This keeps the runtime dead-simple.
 */
function useMDXComponents() {
  return {};
}

// ═══════════════════════════════════════════════════════════════════════════
// Post-processing — runs AFTER MDX evaluation
//
// Converts standard HTML elements produced by the string JSX runtime into
// the site's web-component equivalents (ds-heading, ds-code, ds-table, etc.)
// ═══════════════════════════════════════════════════════════════════════════

/** Generate a URL-safe anchor slug from heading text. */
function slugify(text) {
  return text
    .replace(/<[^>]+>/g, "") // strip tags
    .replace(/&[^;]+;/g, "") // strip HTML entities
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Transform markdown-standard HTML into the site's web components.
 */
function postProcess(html) {
  let out = html;

  // ── 1. Headings → <ds-heading level="N" anchor="…"> ────────────────
  out = out.replace(
    /<h([1-6])(?:\s+[^>]*)?>([^]*?)<\/h\1>/g,
    (_m, level, inner) => {
      const anchor = slugify(inner);
      return `<ds-heading level="${level}" anchor="${anchor}">${inner}</ds-heading>`;
    },
  );

  // ── 2. Fenced code blocks with language ─────────────────────────────
  //    <pre><code class="language-xxx">…</code></pre>  →  <ds-code language="xxx">
  //
  //    Also extract an optional `label="…"` that was preserved in the
  //    class string by some remark plugins (or our preprocessing).
  out = out.replace(
    /<pre><code\s+class="language-(\w+)(?:\s+label=&quot;([^&]*)&quot;)?">([\s\S]*?)<\/code><\/pre>/g,
    (_m, lang, label, content) => {
      const labelAttr = label ? ` label="${label}"` : "";
      return `<ds-code language="${lang}"${labelAttr}>${content}</ds-code>`;
    },
  );

  // Fallback: language but no label in a simpler class format
  out = out.replace(
    /<pre><code\s+class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (_m, lang, content) => {
      return `<ds-code language="${lang}">${content}</ds-code>`;
    },
  );

  // ── 3. Fenced code blocks without language ──────────────────────────
  out = out.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    (_m, content) => `<ds-code>${content}</ds-code>`,
  );

  // ── 4. Inline code → <ds-code inline> ──────────────────────────────
  //    Must run AFTER fenced-code replacement so we don't touch <code>
  //    inside <pre> (those are already gone).
  out = out.replace(
    /<code>([\s\S]*?)<\/code>/g,
    (_m, content) => `<ds-code inline>${content}</ds-code>`,
  );

  // ── 5. Wrap bare <table> in <ds-table> ──────────────────────────────
  //    Skip tables that are already inside a <ds-table>.
  out = out.replace(
    /<table>([\s\S]*?)<\/table>/g,
    (match, _inner, offset) => {
      // Look backwards for an unclosed <ds-table>
      const before = out.slice(Math.max(0, offset - 200), offset);
      if (/<ds-table[^>]*>\s*$/.test(before)) {
        return match; // Already wrapped
      }
      return `<ds-table>${match}</ds-table>`;
    },
  );

  // ── 6. Clean up paragraph-wrapped block elements ────────────────────
  //    MDX sometimes wraps block-level web components in <p> tags.
  out = out.replace(
    /<p>\s*(<(?:ds-code|ds-table|ds-heading|ds-callout|ds-card|ds-example|ds-note|ds-def-section|ds-badge|ds-card-grid)[^>]*>[\s\S]*?<\/(?:ds-code|ds-table|ds-heading|ds-callout|ds-card|ds-example|ds-note|ds-def-section|ds-badge|ds-card-grid)>)\s*<\/p>/g,
    "$1",
  );

  // Also for self-closing
  out = out.replace(
    /<p>\s*(<(?:ds-[a-z-]+)[^>]*\/>)\s*<\/p>/g,
    "$1",
  );

  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compile a single .mdx file to an HTML body string.
 *
 * @param {string} filePath — absolute or relative path to the .mdx file
 * @returns {Promise<{ meta: Record<string,string>, html: string }>}
 */
export async function compileMdxFile(filePath) {
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absPath, "utf-8");

  // 1. Frontmatter
  const { meta, body } = parseFrontmatter(raw);

  // 2. Preprocessing
  const processed = preprocess(body);

  // 3. Compile MDX → function-body JS string
  const remarkPlugins = remarkGfm ? [remarkGfm] : [];
  let compiled;
  try {
    compiled = await compile(processed, {
      outputFormat: "function-body",
      remarkPlugins,
      // Treat .mdx as MDX (not plain markdown)
      format: "mdx",
    });
  } catch (err) {
    const rel = path.relative(ROOT, absPath);
    throw new Error(`MDX compilation failed for ${rel}:\n  ${err.message}`);
  }

  // 4. Evaluate the compiled JS with our string JSX runtime
  let Content;
  try {
    const mod = await run(String(compiled), {
      jsx,
      jsxs,
      Fragment,
      useMDXComponents,
      baseUrl: import.meta.url,
    });
    Content = mod.default;
  } catch (err) {
    const rel = path.relative(ROOT, absPath);
    throw new Error(`MDX evaluation failed for ${rel}:\n  ${err.message}`);
  }

  // 5. Render to HTML string
  let html = Content({});
  if (typeof html !== "string") {
    // Safety net — if the runtime somehow returned something unexpected
    html = renderChildren(html);
  }

  // 6. Post-process: markdown HTML → web components
  html = postProcess(html);

  return { meta, html };
}

/**
 * Compile every .mdx file in site/content/.
 *
 * @returns {Promise<Array<{ file: string, meta: Record<string,string>, html: string }>>}
 */
export async function compileAllMdx() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`  ⚠  Content directory not found: ${CONTENT_DIR}`);
    return [];
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort();

  if (!files.length) {
    console.warn(`  ⚠  No .mdx files found in ${CONTENT_DIR}`);
    return [];
  }

  if (!remarkGfm) {
    console.warn(
      "  ⚠  remark-gfm not installed — markdown tables will not render.",
    );
    console.warn("     Install it: npm install -D remark-gfm\n");
  }

  const results = [];
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const { meta, html } = await compileMdxFile(filePath);
    results.push({ file, meta, html });
    console.log(`  ✓  ${file} → ${meta.slug || file.replace(".mdx", "")}`);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI entry point — run directly to test compilation
// ═══════════════════════════════════════════════════════════════════════════

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  console.log("Compiling MDX content files…\n");
  compileAllMdx()
    .then((results) => {
      console.log(`\nDone. ${results.length} file(s) compiled.`);
      // Optionally dump the first result for inspection
      if (process.argv.includes("--debug") && results.length) {
        console.log("\n── HTML preview (%s) ──\n", results[0].file);
        console.log(results[0].html.slice(0, 2000));
        if (results[0].html.length > 2000) console.log("\n… (truncated)");
      }
    })
    .catch((err) => {
      console.error("\n✗ " + err.message);
      process.exit(1);
    });
}
