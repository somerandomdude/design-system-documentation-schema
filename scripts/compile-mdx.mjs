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
 *   5. Preprocess: replace <ds-prop-table schema="…" def="…" /> with a
 *      placeholder; render the table from the schema via
 *      ./render-prop-table; substitute the rendered HTML after MDX compiles.
 *   6. Compile MDX via @mdx-js/mdx
 *   7. Evaluate with string-based JSX runtime → HTML string
 *   8. Post-process: map markdown HTML elements → web components AND
 *      substitute the ds-prop-table placeholders with their rendered HTML.
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
import { createRequire } from "node:module";

// Load the shared CommonJS schema-to-HTML renderer so this ESM module
// can call the same primitives build-site.js uses for per-schema pages.
const require = createRequire(import.meta.url);
const {
  renderPropertyTableForRef,
  buildDefIndex: buildSharedDefIndex,
} = require("./render-prop-table.js");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "site", "content");
const EXAMPLES_DIR = path.join(ROOT, "examples");
const SCHEMA_DIR = path.join(ROOT, "schema");

// ---------------------------------------------------------------------------
// Canonical spec version (single source of truth)
//
// The DSDS version lives in schema/dsds.bundled.yaml's own `$id`
// (ex: "https://.../v0.20.0/dsds.bundled.yaml") — see nav.js's
// readSpecVersion() for the same extraction (matched against raw file text,
// no parse, so it doesn't care which text format the bundle is in).
// Content pages NEVER hardcode a version — they reference it through the
// {{VERSION}} token, which is substituted here at build time. The bundle
// script, nav, and footer read the same source, so one `npm run bundle`
// propagates to every rendered page.
// ---------------------------------------------------------------------------

let CACHED_VERSION = null;
function readSpecVersion() {
  if (CACHED_VERSION !== null) return CACHED_VERSION;
  try {
    const raw = fs.readFileSync(path.join(SCHEMA_DIR, "dsds.bundled.yaml"), "utf-8");
    const match = /\/v([^/\s"']+)\/dsds\.bundled\.yaml/.exec(raw);
    CACHED_VERSION = match ? match[1] : "";
  } catch {
    CACHED_VERSION = "";
  }
  return CACHED_VERSION;
}

/**
 * Replace the {{VERSION}} token (with optional inner whitespace) with the
 * canonical spec version. Run before any other processing so no downstream
 * step — frontmatter parsing, code-fence handling, MDX compilation — ever
 * sees the token.
 */
function substituteVersion(source) {
  return source.replace(/\{\{\s*VERSION\s*\}\}/g, readSpecVersion());
}

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
 * Strip MDX/JSX comment nodes (curly-brace + slash-star … star-slash +
 * curly-brace) outside fenced code blocks. These are authoring notes meant to
 * be invisible. MDX would normally drop them, but because escapeCurlyBraces()
 * escapes the leading brace, MDX never recognizes them as comments and they
 * leak into the rendered HTML as literal text — so we remove them here first.
 * Inside code fences they are left untouched.
 */
function stripJsxComments(source) {
  const parts = source.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")))
    .join("");
}

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
 * Per-pipeline state: raw HTML that needs to survive MDX compilation
 * byte-for-byte — mainly <ds-code>'s own content (YAML/JSON, full of `{`/
 * `<` that MDX would otherwise try to parse as JSX). Each blob is swapped
 * in for a plain, empty, self-closing placeholder before MDX ever sees the
 * source, then substituted back into the final HTML once MDX (and the rest
 * of postProcess) has finished running.
 *
 * This replaces an earlier approach that round-tripped through a markdown
 * fenced code block's "meta string" (```yaml label="…") to carry the label
 * across MDX compilation, the same way GFM code fences carry a language.
 * That never actually worked with this project's MDX setup — by default,
 * @mdx-js/mdx's compiled output simply discards a fenced block's meta
 * string; nothing in this pipeline's remark plugins (just remark-gfm)
 * preserves it. The result: every `label` on every <ds-example> across the
 * whole site silently rendered as nothing, undetected until traced with a
 * real compile and a byte-for-byte check of the output, not just read from
 * the source. Building the final <ds-code> HTML directly, the same way
 * createPropTableSlots() below already does for schema-driven property
 * tables, sidesteps the meta string entirely rather than trying to fix
 * whatever dropped it.
 */
function createHtmlSlots() {
  return [];
}

function pushHtmlSlot(slots, html) {
  const idx = slots.push(html) - 1;
  // Self-closing custom element placeholder: MDX preserves this verbatim
  // because the tag name is hyphenated (custom element), and there's
  // nothing inside it for MDX to try to parse as JSX.
  return `<ds-html-slot idx="${idx}" />`;
}

function substituteHtmlSlotPlaceholders(html, slots) {
  if (!slots || slots.length === 0) return html;
  // After MDX compiles a self-closing custom element it may emit either
  // `<ds-html-slot idx="N" />` (void element form) or
  // `<ds-html-slot idx="N"></ds-html-slot>` (paired form). Match both, and
  // tolerate an optional surrounding <p>…</p> wrapper that markdown
  // inserts around block-level content — same pattern
  // substitutePropTablePlaceholders() uses below.
  const slotRe =
    /<p>\s*<ds-html-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-html-slot>)\s*<\/p>|<ds-html-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-html-slot>)/g;
  return html.replace(slotRe, (match, idxA, idxB) => {
    const idxStr = idxA !== undefined ? idxA : idxB;
    const n = parseInt(idxStr, 10);
    return Number.isInteger(n) && slots[n] !== undefined ? slots[n] : match;
  });
}

/**
 * Convert explicit `<ds-code language="…" label="…">…</ds-code>` blocks
 * straight to their final HTML (see createHtmlSlots() above for why this
 * builds the real tag directly instead of round-tripping through a fenced
 * code block). `language` is optional — a block with no language at all
 * (ASCII art, plain text) still needs this same protection, not just
 * highlighted code: without it, a blank line inside the block reaches
 * MDX's own JSX-children markdown parsing, which reads it as a paragraph
 * break and splits the block into two sibling <p>s - <ds-code>'s own
 * textContent then concatenates their text back together with no
 * separator at all (found this the hard way: a two-part example rendered
 * as one run-on line with no newline between the parts). Skips `inline`
 * spans - those are never written by hand in source (only ever produced
 * by postProcess()'s own backtick-to-<ds-code> conversion, which runs
 * after this step), but excluded on purpose in case a future page ever
 * does write one directly. Any other author-written attributes (`wrap`,
 * `slot="…"`, …) pass through verbatim — they're already valid HTML
 * attribute syntax in the source, nothing to escape.
 */
function preprocessDsCodeBlocks(source, slots) {
  return source.replace(
    /<ds-code((?:\s+[a-zA-Z-]+(?:="[^"]*")?)*)\s*>([\s\S]*?)<\/ds-code>/g,
    (match, attrsRaw, content) => {
      if (/(?:^|\s)inline(?:\s|=|$)/.test(attrsRaw)) return match;
      const langMatch = /\blanguage="([^"]*)"/.exec(attrsRaw);
      const labelMatch = /\blabel="([^"]*)"/.exec(attrsRaw);
      const lang = langMatch ? langMatch[1] : "";
      const trimmed = content.trim();
      const langAttr = lang ? ` language="${esc(lang)}"` : "";
      const labelAttr = labelMatch ? ` label="${esc(labelMatch[1])}"` : "";
      const restAttrs = attrsRaw
        .replace(/\s+language="[^"]*"/, "")
        .replace(/\s+label="[^"]*"/, "");
      const html = `<ds-code${langAttr}${labelAttr}${restAttrs}>${esc(trimmed)}</ds-code>`;
      return pushHtmlSlot(slots, html);
    },
  );
}

/**
 * Expand `<ds-example file="…" label="…" slot="…" />` into a real
 * <ds-code> element by reading the corresponding file from `examples/`.
 */
function preprocessExamples(source, slots) {
  return source.replace(
    /<ds-example\s+file="([^"]+)"(?:\s+label="([^"]*)")?(?:\s+slot="([^"]*)")?\s*\/>/g,
    (_match, file, label, slot) => {
      const filePath = path.join(EXAMPLES_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.error(`    ⚠  <ds-example> file not found: ${file}`);
        return `{/* Example not found: ${file} */}`;
      }
      let lang, raw;
      // YAML example files (most of examples/ as of the 0.20.0 schema) are
      // embedded as-authored, no reformatting — unlike JSON, YAML's own
      // whitespace/comments are part of what the example is demonstrating.
      if (/\.ya?ml$/.test(file)) {
        lang = "yaml";
        raw = fs.readFileSync(filePath, "utf-8").trimEnd();
      } else {
        try {
          const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          lang = "json";
          raw = JSON.stringify(json, null, 2);
        } catch (err) {
          console.error(`    ⚠  Failed to parse ${file}: ${err.message}`);
          return `{/* Failed to load example: ${file} */}`;
        }
      }
      // label="" (not omitted) opts <ds-code> out of its own default-to-
      // language-name fallback - every <ds-example> caller today (Quick
      // start) wants no label chip at all, not even a bare "yaml" tag.
      const labelAttr = ` label="${esc(label || "")}"`;
      const slotAttr = slot ? ` slot="${esc(slot)}"` : "";
      // wrap unconditionally: an example's natural home is a column half
      // the page's width or narrower (Quick start's split layout, or a
      // normal reading-width column), where a long line should break
      // instead of forcing horizontal scroll.
      const html = `<ds-code language="${lang}"${labelAttr}${slotAttr} wrap>${esc(raw)}</ds-code>`;
      return pushHtmlSlot(slots, html);
    },
  );
}

// ===========================================================================
// Schema-driven property table shortcode
//
//   <ds-prop-table schema="<group>/<base>" def="<defName>" />
//
// Examples:
//   <ds-prop-table schema="entities/component" def="component" />
//   <ds-prop-table schema="common/agents" def="agents" />
//   <ds-prop-table schema="root" def="entityGroup" />
//
// Pass `def="$root"` to render the schema's top-level `properties` (used
// by schemas that put their fields at the
// root instead of in a $defs entry).
//
// The rendered HTML contains void/inline elements like <br>, <small>,
// and <ds-code> that MDX/JSX would otherwise complain about. The
// preprocessor therefore replaces each shortcode with a self-closing
// custom element placeholder (<ds-prop-table-slot idx="N" />) which MDX
// preserves verbatim. After MDX finishes compiling we substitute each
// placeholder for the rendered HTML in `postProcess`.
// ===========================================================================

// Shared cross-reference index, built lazily on first preprocess. Holds
// both halves buildSharedDefIndex() returns: `index` (the $ref → page/anchor
// lookup describeType() needs) and `schemaById` (the raw-schema-by-$id
// registry resolveSchema() needs to flatten an allOf chain).
let MDX_DEF_INDEX = null;
function getMdxDefIndex() {
  if (MDX_DEF_INDEX === null) {
    MDX_DEF_INDEX = buildSharedDefIndex({ schemaDir: SCHEMA_DIR });
  }
  return MDX_DEF_INDEX;
}

/**
 * Per-pipeline state: maps placeholder index → rendered HTML. Reset on
 * each call to `preprocess()` so concurrent file compiles don't bleed.
 */
function createPropTableSlots() {
  return [];
}

function preprocessPropTables(source, slots) {
  // Match both self-closing (`/>`) and open/close (`></ds-prop-table>`)
  // forms so authors can be loose with the syntax.
  return source.replace(
    /<ds-prop-table\s+([^>]*?)\s*(?:\/>|><\/ds-prop-table>)/g,
    (_match, attrs) => {
      const schemaMatch = attrs.match(/schema="([^"]+)"/);
      const defMatch = attrs.match(/def="([^"]+)"/);
      if (!schemaMatch || !defMatch) {
        console.error(
          `    ⚠  <ds-prop-table> missing required schema="…" or def="…" attribute`,
        );
        return `{/* ds-prop-table: missing attributes */}`;
      }
      const schemaRef = schemaMatch[1];
      const defName = defMatch[1];

      // Optional `delta` (omit the common entity envelope) and `omit="a,b"`
      // (omit an explicit list) — used by per-entity tables that should show
      // only the properties unique to that entity.
      const isDelta = /(^|\s)delta(\s|$|=)/.test(attrs);
      const omitMatch = attrs.match(/omit="([^"]+)"/);
      const pathMatch = attrs.match(/path="([^"]+)"/);

      const { schemaById, index } = getMdxDefIndex();
      const html = renderPropertyTableForRef(schemaRef, defName, {
        schemaDir: SCHEMA_DIR,
        defIndex: index,
        schemaById,
        delta: isDelta,
        omit: omitMatch ? omitMatch[1].split(",").map((s) => s.trim()) : undefined,
        path: pathMatch ? pathMatch[1] : undefined,
      });

      // Comments that start with `{/* ds-prop-table:` indicate a render
      // failure (missing schema, missing def, parse error). Pass those
      // through directly so they remain visible in the output as a
      // diagnostic — MDX comment syntax, not `<!-- -->`, since this is
      // substituted straight into MDX source before compilation.
      if (html.startsWith("{/*")) return html;

      const idx = slots.push(html) - 1;
      // Self-closing custom element placeholder: MDX preserves this
      // verbatim because the tag name is hyphenated (custom element).
      return `<ds-prop-table-slot idx="${idx}" />`;
    },
  );
}

function substitutePropTablePlaceholders(html, slots) {
  if (!slots || slots.length === 0) return html;
  // After MDX compiles a self-closing custom element it may emit either
  // `<ds-prop-table-slot idx="N" />` (void element form) or
  // `<ds-prop-table-slot idx="N"></ds-prop-table-slot>` (paired form).
  // Match both, and tolerate an optional surrounding <p>…</p> wrapper that
  // markdown inserts around block-level content.
  const slotRe =
    /<p>\s*<ds-prop-table-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-prop-table-slot>)\s*<\/p>|<ds-prop-table-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-prop-table-slot>)/g;
  return html.replace(slotRe, (match, idxA, idxB) => {
    const idxStr = idxA !== undefined ? idxA : idxB;
    const n = parseInt(idxStr, 10);
    return Number.isInteger(n) && slots[n] !== undefined ? slots[n] : match;
  });
}

/**
 * Run all preprocessing steps in order. Returns the transformed source
 * plus per-pipeline state (the ds-prop-table and raw-HTML slot arrays)
 * that postProcess needs to finish the job.
 */
function preprocess(source) {
  const propTableSlots = createPropTableSlots();
  const htmlSlots = createHtmlSlots();
  let s = source;
  s = preprocessDsCodeBlocks(s, htmlSlots);
  s = preprocessExamples(s, htmlSlots);
  s = preprocessPropTables(s, propTableSlots);
  s = stripJsxComments(s);
  s = escapeCurlyBraces(s);
  return { source: s, propTableSlots, htmlSlots };
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
    /<p>\s*(<(?:ds-code|ds-table|ds-heading|ds-callout|ds-example|ds-def-section|ds-badge)[^>]*>[\s\S]*?<\/(?:ds-code|ds-table|ds-heading|ds-callout|ds-example|ds-def-section|ds-badge)>)\s*<\/p>/g,
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

  // 0. Inject the canonical spec version wherever {{VERSION}} appears
  //    (frontmatter title, headings, example snippets, $schema URLs). Runs
  //    first so the token never reaches frontmatter parsing or MDX compile.
  const templated = substituteVersion(raw);

  // 1. Frontmatter
  const { meta, body } = parseFrontmatter(templated);

  // 2. Preprocessing
  const { source: processed, propTableSlots, htmlSlots } = preprocess(body);

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

  // 7. Substitute the ds-prop-table and raw-HTML (<ds-code>) placeholders
  //    with their real content. Done AFTER postProcess so neither kind of
  //    pre-rendered markup is mangled by the markdown-to-web-component
  //    transformations above.
  html = substitutePropTablePlaceholders(html, propTableSlots);
  html = substituteHtmlSlotPlaceholders(html, htmlSlots);

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
