#!/usr/bin/env node
/**
 * Compiles .mdx content files to HTML for the DSDS spec site, using a lightweight
 * string-based JSX runtime (no React) so web components like <ds-callout>/<ds-table>
 * pass through as plain custom elements. Pipeline: parse frontmatter, preprocess
 * (escape stray {}, expand <ds-code>/<ds-example>/<ds-prop-table> shortcodes), compile
 * via @mdx-js/mdx, evaluate, then post-process markdown HTML into web components.
 * remark-gfm is optional but recommended for table/autolink/strikethrough support.
 */

import { compile, run } from "@mdx-js/mdx";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Load the shared CommonJS schema-to-HTML renderer so this ESM module can call the same
// primitives build-site.js uses for per-schema pages.
const require = createRequire(import.meta.url);
const {
  renderPropertyTableForRef,
  buildDefIndex: buildSharedDefIndex,
} = require("./render-prop-table.js");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "site", "content");
const EXAMPLES_DIR = path.join(ROOT, "examples");
const SCHEMA_DIR = path.join(ROOT, "schema");

// ---------------------------------------------------------------------------
// Canonical spec version: read from schema/dsds.bundled.yaml's own `$id` (see nav.js's
// matching readSpecVersion()). Content pages never hardcode a version - they use the
// {{VERSION}} token, substituted here at build time.
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
 * Replace the {{VERSION}} token with the canonical spec version, before any other
 * processing sees it. Exported because build-site.js also re-reads the raw .mdx directly
 * for the `.md` mirror and llms-full.txt, bypassing compileMdxFile() entirely.
 */
export function substituteVersion(source) {
  return source.replace(/\{\{\s*VERSION\s*\}\}/g, readSpecVersion());
}

// ---------------------------------------------------------------------------
// Optional remark-gfm (tables, autolinks, strikethrough)
// ---------------------------------------------------------------------------

let remarkGfm = null;
try {
  remarkGfm = (await import("remark-gfm")).default;
} catch {
  // Pipe-separated markdown tables will not render without remark-gfm.
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

// Strip JSX comment nodes ({/* ... */}) outside fenced code blocks. MDX would normally drop
// these, but escapeCurlyBraces() escapes the leading brace first, so they'd otherwise leak
// into the rendered HTML as literal text.
function stripJsxComments(source) {
  const parts = source.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")))
    .join("");
}

// Escape bare `{`/`}` outside fenced code blocks so MDX doesn't try to interpret them as JSX
// expressions - safe because the only `{}` occurrences in prose here are stray literals.
function escapeCurlyBraces(source) {
  const parts = source.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // inside a code fence, leave alone
      return part.replace(/(?<!\\)\{/g, "\\{").replace(/(?<!\\)\}/g, "\\}");
    })
    .join("");
}

/**
 * Per-pipeline state: raw HTML that must survive MDX compilation byte-for-byte - mainly
 * <ds-code>'s own content (YAML/JSON full of `{`/`<`). Each blob is swapped for a
 * self-closing placeholder before MDX runs, then substituted back afterward. Building the
 * final <ds-code> HTML directly (rather than round-tripping through a fenced code block's
 * meta string) sidesteps a real bug: @mdx-js/mdx silently discards fence meta strings, which
 * previously made every <ds-example> `label` render as nothing.
 */
function createHtmlSlots() {
  return [];
}

function pushHtmlSlot(slots, html) {
  const idx = slots.push(html) - 1;
  // Self-closing custom element: MDX preserves it verbatim since the hyphenated tag name
  // has nothing inside for MDX to parse as JSX.
  return `<ds-html-slot idx="${idx}" />`;
}

function substituteHtmlSlotPlaceholders(html, slots) {
  if (!slots || slots.length === 0) return html;
  // MDX may emit either the void or paired form, and may wrap it in a markdown-inserted <p>;
  // match both, same pattern substitutePropTablePlaceholders() uses below.
  const slotRe =
    /<p>\s*<ds-html-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-html-slot>)\s*<\/p>|<ds-html-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-html-slot>)/g;
  return html.replace(slotRe, (match, idxA, idxB) => {
    const idxStr = idxA !== undefined ? idxA : idxB;
    const n = parseInt(idxStr, 10);
    return Number.isInteger(n) && slots[n] !== undefined ? slots[n] : match;
  });
}

/**
 * Convert explicit `<ds-code language="…" label="…">…</ds-code>` blocks straight to their
 * final HTML rather than round-tripping through MDX's markdown parsing - without this, a
 * blank line inside the block gets read as a paragraph break, splitting it into two <p>s
 * whose text then concatenates back together with no separator. Skips `inline` spans (only
 * ever produced later, by postProcess()'s backtick conversion); other attributes pass through.
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
      // YAML examples are embedded as-authored, no reformatting - unlike JSON, their
      // whitespace/comments are part of what the example demonstrates.
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
      // label="" (not omitted) opts out of <ds-code>'s default-to-language-name fallback.
      const labelAttr = ` label="${esc(label || "")}"`;
      const slotAttr = slot ? ` slot="${esc(slot)}"` : "";
      // wrap unconditionally: an example's column is often half-width or narrower, where a
      // long line should break instead of forcing horizontal scroll.
      const html = `<ds-code language="${lang}"${labelAttr}${slotAttr} wrap>${esc(raw)}</ds-code>`;
      return pushHtmlSlot(slots, html);
    },
  );
}

// ===========================================================================
// Schema-driven property table shortcode: <ds-prop-table schema="<group>/<base>" def="<defName>" />
// (pass def="$root" for a schema whose fields live at the top level, not in a $defs entry).
// The rendered HTML has void/inline elements MDX/JSX would choke on, so it's swapped for a
// placeholder custom element and substituted back in after MDX compiles.
// ===========================================================================

// Shared cross-reference index, built lazily on first preprocess: `index` (the $ref →
// page/anchor lookup describeType() needs) and `schemaById` (for flattening allOf chains).
let MDX_DEF_INDEX = null;
function getMdxDefIndex() {
  if (MDX_DEF_INDEX === null) {
    MDX_DEF_INDEX = buildSharedDefIndex({ schemaDir: SCHEMA_DIR });
  }
  return MDX_DEF_INDEX;
}

// Per-pipeline state: maps placeholder index → rendered HTML, reset each call to preprocess()
// so concurrent file compiles don't bleed into each other.
function createPropTableSlots() {
  return [];
}

function preprocessPropTables(source, slots) {
  // Match both self-closing and open/close forms so authors can be loose with the syntax.
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

      // `delta` (omit the common entity envelope) and `omit="a,b"` let a per-entity table
      // show only properties unique to that entity.
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

      // A leading "{/* ds-prop-table:" marks a render failure - pass it through as a visible
      // diagnostic (MDX comment syntax, since this goes into MDX source before compilation).
      if (html.startsWith("{/*")) return html;

      const idx = slots.push(html) - 1;
      return `<ds-prop-table-slot idx="${idx}" />`;
    },
  );
}

function substitutePropTablePlaceholders(html, slots) {
  if (!slots || slots.length === 0) return html;
  // Match both the void and paired forms MDX may emit, and an optional surrounding <p> wrapper.
  const slotRe =
    /<p>\s*<ds-prop-table-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-prop-table-slot>)\s*<\/p>|<ds-prop-table-slot\s+idx="(\d+)"\s*(?:\/>|><\/ds-prop-table-slot>)/g;
  return html.replace(slotRe, (match, idxA, idxB) => {
    const idxStr = idxA !== undefined ? idxA : idxB;
    const n = parseInt(idxStr, 10);
    return Number.isInteger(n) && slots[n] !== undefined ? slots[n] : match;
  });
}

// Runs all preprocessing steps in order; returns the transformed source plus the
// ds-prop-table and raw-HTML slot arrays postProcess needs to finish the job.
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
// String-based JSX runtime: MDX compiles to calls to jsx(type, props); this renders those
// straight to HTML strings instead of DOM/virtual-DOM nodes, with no framework dependency.
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

// JSX factory called by the compiled MDX module for every element: Fragment concatenates
// children, a function type is called as a component, a string type renders as an HTML tag.
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

// MDX calls this to allow component overrides; returns empty since element→web-component
// mapping happens in post-processing instead, keeping the runtime dead-simple.
function useMDXComponents() {
  return {};
}

// ═══════════════════════════════════════════════════════════════════════════
// Post-processing (runs after MDX evaluation): converts standard HTML elements from the
// string JSX runtime into the site's web-component equivalents (ds-heading, ds-code, etc).
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

  // ── 2. Fenced code blocks with language: <pre><code class="language-xxx"> → <ds-code>,
  //    also extracting an optional label="…" preserved in the class string.
  // A raw `<dsds:button#variant.primary>` in a code block would be read by the browser as a
  // tag and dropped, so brackets are escaped here too. Already-escaped text has none.
  const escapeBrackets = (s) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  out = out.replace(
    /<pre><code\s+class="language-(\w+)(?:\s+label=&quot;([^&]*)&quot;)?">([\s\S]*?)<\/code><\/pre>/g,
    (_m, lang, label, content) => {
      const labelAttr = label ? ` label="${label}"` : "";
      return `<ds-code language="${lang}"${labelAttr}>${escapeBrackets(content)}</ds-code>`;
    },
  );

  // Fallback: language but no label in a simpler class format
  out = out.replace(
    /<pre><code\s+class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (_m, lang, content) => {
      return `<ds-code language="${lang}">${escapeBrackets(content)}</ds-code>`;
    },
  );

  // ── 3. Fenced code blocks without language ──────────────────────────
  out = out.replace(
    /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
    (_m, content) => `<ds-code>${escapeBrackets(content)}</ds-code>`,
  );

  // ── 4. Inline code → <ds-code inline>. Must run after fenced-code replacement, above.
  //    A raw `<` in the code (`<files-or-dirs…>`) would be read by the browser as a tag and
  //    dropped, so it's escaped here. Text already escaped has no raw brackets, so it's unchanged.
  out = out.replace(
    /<code>([\s\S]*?)<\/code>/g,
    (_m, content) => `<ds-code inline>${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</ds-code>`,
  );

  // ── 5. Wrap bare <table> in <ds-table>, skipping tables already inside one.
  out = out.replace(
    /<table>([\s\S]*?)<\/table>/g,
    (match, _inner, offset) => {
      const before = out.slice(Math.max(0, offset - 200), offset); // look backward for an unclosed <ds-table>
      if (/<ds-table[^>]*>\s*$/.test(before)) {
        return match; // Already wrapped
      }
      return `<ds-table>${match}</ds-table>`;
    },
  );

  // ── 6. Clean up paragraph-wrapped block elements: MDX sometimes wraps block-level web
  //    components in <p> tags.
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

  // 0. Inject the canonical spec version wherever {{VERSION}} appears, before frontmatter
  //    parsing or MDX compile ever see the token.
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

  // 7. Substitute placeholders with real content, after postProcess so the pre-rendered
  //    markup isn't mangled by the markdown-to-web-component transformations above.
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
