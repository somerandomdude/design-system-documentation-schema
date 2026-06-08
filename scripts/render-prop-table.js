/**
 * render-prop-table.js — Shared schema-to-HTML rendering primitives.
 *
 * Both build-site.js (per-schema docs pages) and compile-mdx.mjs (MDX
 * <ds-prop-table schema="..." def="..." /> shortcode) emit property tables.
 * This module owns the conversion from a JSON Schema `$defs` entry to the
 * <ds-prop-table>/<ds-prop> HTML fragment that the docs site renders. By
 * sharing this logic, both call sites stay 1:1 with the schema — there is
 * no second source of truth for field types, descriptions, requiredness,
 * or supplementary notes (pattern, default, min items, etc.).
 *
 * `buildDefIndex()` walks the schema directory itself so MDX preprocessing
 * (which runs before the schema-page generator builds its own index) can
 * still resolve cross-reference `$ref` links into <ds-type-ref> tags.
 *
 * Exports:
 *   esc                     — HTML escape (also used by callers for other tags)
 *   slug                    — text → URL-safe slug
 *   linkToRef               — extract a $defs name from a $ref string
 *   describeType            — schema fragment → human-readable type string
 *   renderPropertyTable     — defSchema → <ds-prop-table> HTML
 *   buildDefIndex           — walk schema dir → { defName: {pageSlug, filename, group} }
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");

// Same set of group directories build-site.js scans, in the same order.
// Kept in sync with nav.js / build-site.js conventions.
const DEFAULT_SCHEMA_GROUPS = [
  "common",
  "metadata",
  "document-blocks",
  "entities",
];

// The common "envelope" every entity shares. A `delta` prop-table omits these
// so a per-entity table can show only the properties unique to that entity
// (e.g., a token's `tokenType`/`source`) without re-listing the shared fields
// already documented in the Common entity properties section. Defined once
// here so the notion of "common" has a single source of truth.
const ENTITY_ENVELOPE = [
  "kind",
  "identifier",
  "name",
  "metadata",
  "documentBlocks",
  "agents",
  "$extensions",
];

// ---------------------------------------------------------------------------
// HTML escaping & slug helpers
// ---------------------------------------------------------------------------

function esc(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML-escape `s`, but also convert CommonMark-style backtick inline-code
 * spans (`like-this`) into <ds-code inline> elements. Mirrors
 * `escWithCode` in site/components/_shared.js so prop-table descriptions
 * (built into HTML here, at build time) and def-section / schema-header
 * descriptions (rendered at runtime by the web components) render the
 * same way.
 *
 * Closing backticks must appear on the same line as the opening one; an
 * unmatched ` falls through as a literal character.
 */
function escWithCode(s) {
  if (s == null) return "";
  const parts = String(s).split(/(`[^`\n]+`)/g);
  return parts
    .map((p) => {
      if (p.length >= 2 && p.startsWith("`") && p.endsWith("`")) {
        return `<ds-code inline>${esc(p.slice(1, -1))}</ds-code>`;
      }
      return esc(p);
    })
    .join("");
}

function slug(text) {
  return String(text)
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .toLowerCase();
}

function linkToRef(ref) {
  if (!ref) return null;
  const match = ref.match(/\$defs\/(\w+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Schema discovery → definition index
// ---------------------------------------------------------------------------

/**
 * Walk the split schema directories and produce an index mapping each
 * `$defs` name to the page slug + filename that documents it. Optionally
 * include the root schema (`dsds.schema.json`) under the slug `root`.
 *
 * Output shape:
 *   {
 *     [defName]: { pageSlug, filename, group }
 *   }
 */
function buildDefIndex({
  schemaDir = SCHEMA_DIR,
  groups = DEFAULT_SCHEMA_GROUPS,
  includeRoot = true,
} = {}) {
  const index = {};

  for (const group of groups) {
    const dirPath = path.join(schemaDir, group);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.json"))
      .sort();

    for (const filename of files) {
      const baseName = filename.replace(".schema.json", "");
      const pageSlug = `${group}-${baseName}`;
      const filePath = path.join(dirPath, filename);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        continue;
      }
      for (const defName of Object.keys(data.$defs || {})) {
        index[defName] = { pageSlug, filename, group };
      }
    }
  }

  if (includeRoot) {
    const rootPath = path.join(schemaDir, "dsds.schema.json");
    if (fs.existsSync(rootPath)) {
      try {
        const rootData = JSON.parse(fs.readFileSync(rootPath, "utf-8"));
        for (const defName of Object.keys(rootData.$defs || {})) {
          index[defName] = {
            pageSlug: "root",
            filename: "dsds.schema.json",
            group: "documentation",
          };
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return index;
}

// ---------------------------------------------------------------------------
// Type description rendering
// ---------------------------------------------------------------------------

/**
 * Produce a human-readable type string from a property schema fragment.
 * The optional `defIndex` enables cross-reference links via <ds-type-ref>.
 * When omitted, $refs render as plain inline code instead.
 */
function describeType(prop, defIndex = {}) {
  if (!prop || typeof prop !== "object") return "any";

  // $ref
  if (prop.$ref) {
    const defName = linkToRef(prop.$ref);
    if (defName) {
      const target = defIndex[defName];
      if (target) {
        return `<ds-type-ref href="${target.pageSlug}.html#${slug(defName)}">${esc(defName)}</ds-type-ref>`;
      }
      return `<ds-code inline>${esc(defName)}</ds-code>`;
    }
    return `<ds-code inline>$ref</ds-code>`;
  }

  // oneOf
  if (prop.oneOf) {
    const parts = prop.oneOf.map((alt) => describeType(alt, defIndex));
    return parts.join(" | ");
  }

  // anyOf
  if (prop.anyOf) {
    const parts = prop.anyOf.map((alt) => describeType(alt, defIndex));
    return parts.join(" | ");
  }

  // array
  if (prop.type === "array") {
    if (prop.items) {
      const itemType = describeType(prop.items, defIndex);
      return `${itemType}[]`;
    }
    return "array";
  }

  // object with additionalProperties
  if (prop.type === "object" && prop.additionalProperties) {
    if (typeof prop.additionalProperties === "object") {
      const valType = describeType(prop.additionalProperties, defIndex);
      return `map&lt;string, ${valType}&gt;`;
    }
    return "object (open)";
  }

  // object with properties (inline sub-object) — surface its field names so a
  // reader sees the shape (e.g., `object {file, path}`) rather than a bare
  // "object". Falls back to "object" for wide objects.
  if (prop.type === "object" && prop.properties) {
    const keys = Object.keys(prop.properties);
    return keys.length && keys.length <= 4
      ? `object {${keys.join(", ")}}`
      : "object";
  }

  // const
  if (prop.const !== undefined) {
    return `<ds-code inline>"${esc(String(prop.const))}"</ds-code>`;
  }

  // enum
  if (prop.enum) {
    return prop.enum
      .map((v) => `<ds-code inline>"${esc(String(v))}"</ds-code>`)
      .join(" | ");
  }

  // string with format
  if (prop.type === "string" && prop.format) {
    return `string (${esc(prop.format)})`;
  }

  // simple type
  if (prop.type) {
    return esc(prop.type);
  }

  // description-only (no type constraint, e.g., "value" that accepts any JSON)
  if (prop.description) {
    return "any";
  }

  return "any";
}

// ---------------------------------------------------------------------------
// Property table rendering
// ---------------------------------------------------------------------------

/**
 * Render a property table for a definition's `properties` map.
 *
 * @param {object} defSchema  A schema fragment with a `properties` map.
 *                            Optional `required` (string[]) and `anyOf`
 *                            (with `required` arrays) shape the badges.
 * @param {object} [defIndex] Optional cross-reference index for $ref links.
 * @returns {string}          HTML fragment (`<ds-prop-table>...</ds-prop-table>`)
 *                            or the empty string when there are no properties.
 */
function renderPropertyTable(defSchema, defIndex = {}, opts = {}) {
  if (!defSchema || typeof defSchema !== "object") return "";
  const properties = defSchema.properties;
  if (!properties || Object.keys(properties).length === 0) return "";

  const omit = new Set(opts.omit || []);
  const required = new Set(defSchema.required || []);

  // Collect anyOf/required constraints to identify "at least one" groups
  const anyOfGroups = [];
  if (defSchema.anyOf) {
    for (const alt of defSchema.anyOf) {
      if (alt.required && Array.isArray(alt.required)) {
        anyOfGroups.push(alt.required);
      }
    }
  }
  const anyOfProps = new Set();
  for (const group of anyOfGroups) {
    for (const name of group) {
      anyOfProps.add(name);
    }
  }

  const propElements = [];
  for (const [propName, propSchema] of Object.entries(properties)) {
    if (omit.has(propName)) continue;
    const isRequired = required.has(propName);
    const isAnyOf = anyOfProps.has(propName);
    const typeStr = describeType(propSchema, defIndex);
    const desc = propSchema.description || "";

    let descHtml = escWithCode(desc);

    if (propSchema.enum && propSchema.enum.length > 8) {
      descHtml += `<br><small>Values: ${propSchema.enum.map((v) => `<ds-code inline>${esc(String(v))}</ds-code>`).join(", ")}</small>`;
    }
    if (propSchema.pattern) {
      descHtml += `<br><small>Pattern: <ds-code inline>${esc(propSchema.pattern)}</ds-code></small>`;
    }
    if (propSchema.minItems) {
      descHtml += `<br><small>Min items: ${propSchema.minItems}</small>`;
    }
    if (propSchema.default !== undefined) {
      const defaultVal =
        typeof propSchema.default === "string"
          ? `"${esc(propSchema.default)}"`
          : String(propSchema.default);
      descHtml += `<br><small>Default: <ds-code inline>${defaultVal}</ds-code></small>`;
    }
    if (
      propSchema.type === "array" &&
      propSchema.items &&
      propSchema.items.format
    ) {
      descHtml += `<br><small>Format: ${esc(propSchema.items.format)}</small>`;
    }

    let sortOrder;
    let statusAttr = "";
    if (isRequired) {
      statusAttr = " required";
      sortOrder = 0;
    } else if (isAnyOf) {
      statusAttr = " conditional";
      sortOrder = 1;
    } else {
      sortOrder = 2;
    }

    propElements.push({
      sortOrder,
      html:
        `<ds-prop name="${esc(propName)}" type="${esc(typeStr)}"${statusAttr}>` +
        descHtml +
        `</ds-prop>`,
    });
  }

  // Nothing left after filtering (e.g., a delta table for an entity with no
  // properties beyond the common envelope) — render nothing.
  if (propElements.length === 0) return "";

  // Stable sort: required → conditional → optional, preserving original order
  propElements.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    `<ds-prop-table>\n` +
    propElements.map((p) => `  ${p.html}`).join("\n") +
    `\n</ds-prop-table>`
  );
}

// ---------------------------------------------------------------------------
// Convenience: resolve a (schemaRef, defName) pair into a property table
// ---------------------------------------------------------------------------

/**
 * Load a schema by relative path and produce the rendered property table
 * for one of its `$defs`. The schemaRef is the path under
 * `spec/schema/` without the `.schema.json` suffix (e.g., `entities/component`
 * or `common/agents`). Pass `"root"` to load `dsds.schema.json`.
 *
 * @param {string} schemaRef
 * @param {string} defName
 * @param {object} [opts]
 * @param {string} [opts.schemaDir]  Override the schema root (for tests).
 * @param {object} [opts.defIndex]   Pre-built cross-reference index.
 * @returns {string}  HTML fragment, or `<!-- ... -->` comment on failure.
 */
function renderPropertyTableForRef(schemaRef, defName, opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const filePath =
    schemaRef === "root"
      ? path.join(schemaDir, "dsds.schema.json")
      : path.join(schemaDir, `${schemaRef}.schema.json`);

  if (!fs.existsSync(filePath)) {
    return `<!-- ds-prop-table: schema not found "${schemaRef}" -->`;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return `<!-- ds-prop-table: failed to parse "${schemaRef}": ${e.message} -->`;
  }

  // `defName === "$root"` means the schema's top-level `properties` (no $defs).
  let target;
  if (defName === "$root") {
    target = data;
  } else {
    target = (data.$defs || {})[defName];
  }

  if (!target) {
    return `<!-- ds-prop-table: def "${defName}" not found in "${schemaRef}" -->`;
  }

  // `path` navigates into a nested inline sub-schema (e.g.
  // "constraints.items" → def.properties.constraints.items) so sub-objects
  // that aren't their own $def can still be rendered schema-driven. Each
  // segment is a property name, except "items" which steps into an array's
  // item schema.
  if (opts.path) {
    for (const seg of String(opts.path).split(".")) {
      if (!target || typeof target !== "object") {
        target = null;
        break;
      }
      target = seg === "items" ? target.items : (target.properties || {})[seg];
    }
    if (!target) {
      return `<!-- ds-prop-table: path "${opts.path}" not found in "${defName}" -->`;
    }
  }

  const defIndex = opts.defIndex || buildDefIndex({ schemaDir });
  // `delta: true` omits the common entity envelope; an explicit `omit` array
  // takes precedence when provided.
  const omit = opts.omit || (opts.delta ? ENTITY_ENVELOPE : []);
  return renderPropertyTable(target, defIndex, { omit });
}

module.exports = {
  esc,
  escWithCode,
  slug,
  linkToRef,
  describeType,
  renderPropertyTable,
  renderPropertyTableForRef,
  buildDefIndex,
  ENTITY_ENVELOPE,
};
