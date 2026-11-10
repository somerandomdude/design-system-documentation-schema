/**
 * Shared schema-to-HTML rendering primitives, used by both build-site.js (per-schema docs
 * pages) and compile-mdx.mjs (the <ds-prop-table> shortcode) so field types, descriptions,
 * and requiredness never have a second source of truth. `resolveSchema()` flattens an `allOf`
 * chain into one renderable schema; `buildDefIndex()` keys every definition (whole-file and
 * local `$defs`) by its exact `$ref` string for direct cross-reference lookup.
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { declaredProps } = require("../lib");

const ROOT = path.resolve(__dirname, "..", "..");
const SCHEMA_DIR = path.join(ROOT, "schema");

// schema/base.schema.yaml and schema/shared.schema.yaml sit at the schema root, not in one of
// DEFAULT_SCHEMA_GROUPS's subdirectories.
const ROOT_FILES = ["base.schema.yaml", "shared.schema.yaml"];

// Same group directories build-site.js scans, in the same order. Kept in sync with nav.js's
// DIR_GROUPS.
const DEFAULT_SCHEMA_GROUPS = ["common", "metadata", "entries", "sections"];

// The fields every entry shares. A `delta` prop-table omits these so a per-kind table shows
// only the properties unique to that kind. Read from entries/entry.schema.yaml rather than
// transcribed, for the reason the missing SECTION_ENVELOPE note below gives - and this list
// had already gone stale proving the point: it still read `related, extends, refs, sections`
// after the schema was reordered to `sections, extends, related, refs`. Nothing broke, only
// because `omit` is used as a set, but the file was wrong about the schema either way.
const ENTRY_ENVELOPE = declaredProps("entries/entry.schema.yaml");

// There is deliberately no SECTION_ENVELOPE constant here. One existed as the
// section-level counterpart to ENTRY_ENVELOPE above, but nothing ever consumed it
// (ENTRY_ENVELOPE is real: renderPropertyTableForRef passes it as `omit` for delta
// tables), and being unused it had silently gone stale - it was missing `context`,
// which sections/section.schema.yaml has declared for a while. A dead constant that
// disagrees with the schema is worse than no constant, because AGENTS.md pointed
// readers at this file as the single source of truth for the envelope's fields. The schema
// file is that source; if a section-level omit list is ever needed, read it with
// `declaredProps("sections/section.schema.yaml")` rather than re-transcribing it here.

// JSON_SCHEMA disables YAML's implicit !!timestamp type, which otherwise parses a bare
// `2026-06-02` into a JS Date instead of a string - see lib.js's loadYaml.
function loadSchemaYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf-8"), { schema: yaml.JSON_SCHEMA });
}

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
 * HTML-escape `s`, converting backtick inline-code spans into <ds-code inline> elements.
 * Mirrors `escWithCode` in site/components/_shared.js so build-time and runtime descriptions
 * render the same way. Closing backticks must be on the same line as the opening one.
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

// The last path segment of a $ref (or its #/$defs/name fragment) - a fallback label when a
// $ref doesn't resolve to a known page, so the table shows something readable, not a full URL.
function refFallbackLabel(ref) {
  const hashIdx = ref.indexOf("#");
  if (hashIdx !== -1) {
    const frag = ref.slice(hashIdx + 1);
    const m = frag.match(/\$defs\/(\w+)/);
    if (m) return m[1];
  }
  const base = hashIdx !== -1 ? ref.slice(0, hashIdx) : ref;
  const file = base.split("/").pop() || base;
  return file.replace(/\.schema\.yaml$/, "");
}

// ---------------------------------------------------------------------------
// allOf resolution: most schema/ files declare themselves as `allOf: [{$ref: <base>}, {type:
// object, properties: {...}}]` rather than repeating the base's own fields. A property table
// needs the flattened result, so this walks `allOf`, resolving `$ref` branches against the
// schema registry and merging every branch's `properties`/`required` into one object.
// ---------------------------------------------------------------------------

// A `$ref: #/$defs/x` means the $defs of the file it's written in. Once a file's content is merged
// into another page, the ref has to name that file, so it's rewritten to its full $id form here.
function withAbsoluteRefs(node, baseId) {
  if (Array.isArray(node)) return node.map((n) => withAbsoluteRefs(n, baseId));
  if (node !== null && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [
        k,
        k === "$ref" && typeof v === "string" && v.startsWith("#") ? `${baseId}${v}` : withAbsoluteRefs(v, baseId),
      ]),
    );
  }
  return node;
}

function resolveSchema(schema, schemaById) {
  if (!schema || !schema.allOf) return schema;

  const properties = {};
  const required = new Set();

  function mergeBranch(branch) {
    if (!branch) return;
    if (branch.$ref) {
      const target = schemaById.get(stripFragment(branch.$ref));
      if (target) mergeBranch(resolveSchema(withAbsoluteRefs(target, target.$id), schemaById));
      return;
    }
    if (branch.allOf) {
      for (const b of branch.allOf) mergeBranch(b);
    }
    Object.assign(properties, branch.properties || {});
    for (const r of branch.required || []) required.add(r);
  }

  for (const branch of schema.allOf) mergeBranch(branch);

  return {
    ...schema,
    type: schema.type || "object",
    properties,
    required: [...required],
  };
}

function stripFragment(ref) {
  const i = ref.indexOf("#");
  return i === -1 ? ref : ref.slice(0, i);
}

// ---------------------------------------------------------------------------
// Schema discovery → definition index
// ---------------------------------------------------------------------------

function listGroupFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".schema.yaml"))
    .sort();
}

/**
 * Walk schema/ (root files + DEFAULT_SCHEMA_GROUPS subdirectories) and return
 * { schemaById, index }: schemaById is every loaded file keyed by its own $id (for
 * resolveSchema()'s $ref lookups); index has one entry per whole-file $ref and one per local
 * `$defs` entry, so a describeType() $ref lookup is a direct hit instead of a name match.
 */
function buildDefIndex({ schemaDir = SCHEMA_DIR, groups = DEFAULT_SCHEMA_GROUPS } = {}) {
  const schemaById = new Map();
  const index = {};

  const files = [];
  for (const filename of ROOT_FILES) {
    files.push({ group: "root", groupLabel: "Base", filename, filePath: path.join(schemaDir, filename) });
  }
  for (const group of groups) {
    const dirPath = path.join(schemaDir, group);
    for (const filename of listGroupFiles(dirPath)) {
      files.push({ group, groupLabel: group, filename, filePath: path.join(dirPath, filename) });
    }
  }

  for (const f of files) {
    let data;
    try {
      data = loadSchemaYaml(f.filePath);
    } catch (e) {
      continue;
    }
    if (!data || !data.$id) continue;
    schemaById.set(data.$id, data);

    const baseName = f.filename.replace(/\.schema\.yaml$/, "");
    const baseSlug = f.group === "root" ? baseName : `${f.group}-${baseName}`;
    const title = data.title || baseName;

    // pageSlug is the constant "schema" - every definition lives on one combined page, so
    // anchors need the file's own baseSlug prefixed to stay unique across files.
    index[data.$id] = {
      pageSlug: "schema",
      anchor: baseSlug,
      title,
      description: data.description || "",
    };

    for (const [defName, def] of Object.entries(data.$defs || {})) {
      index[`${data.$id}#/$defs/${defName}`] = {
        pageSlug: "schema",
        anchor: `${baseSlug}-${slug(defName)}`,
        title: defName,
        description: def.description || "",
      };
    }
  }

  return { schemaById, index };
}

// ---------------------------------------------------------------------------
// Type description rendering
// ---------------------------------------------------------------------------

// Produces a human-readable type string from a property schema fragment. The optional
// `defIndex` enables cross-reference links via <ds-type-ref>; omitted, $refs render as
// plain inline code instead.
function describeType(prop, defIndex = {}) {
  if (!prop || typeof prop !== "object") return "any";

  // $ref
  if (prop.$ref) {
    const target = defIndex[prop.$ref];
    if (target) {
      return `<ds-type-ref href="${target.pageSlug}.html#${target.anchor}">${esc(target.title)}</ds-type-ref>`;
    }
    return `<ds-code inline>${esc(refFallbackLabel(prop.$ref))}</ds-code>`;
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

  // allOf on a property (not a whole definition) - just describe it as an object.
  if (prop.allOf) {
    return "object";
  }

  // array
  if (prop.type === "array") {
    if (prop.items) {
      const itemType = describeType(prop.items, defIndex);
      return `${itemType}[]`;
    }
    return "array";
  }

  // object with additionalProperties (open maps like $extensions)
  if (prop.type === "object" && prop.additionalProperties) {
    if (typeof prop.additionalProperties === "object") {
      const valType = describeType(prop.additionalProperties, defIndex);
      return `map&lt;string, ${valType}&gt;`;
    }
    return "object (open)";
  }

  // object with properties (inline sub-object) - surface field names (ex: `object
  // {platform, file}`) rather than a bare "object"; falls back to "object" for wide objects.
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

  // description-only (no type constraint, e.g., a bare `value` field)
  if (prop.description) {
    return "any";
  }

  return "any";
}

// ---------------------------------------------------------------------------
// Property table rendering
// ---------------------------------------------------------------------------

/**
 * Walk a definition's `properties` map and produce one plain-data row per field - the single
 * source of truth both renderPropertyTable() (HTML) and renderPropertyTableMarkdown() render
 * from, so the two outputs can never drift out of sync with each other or the schema.
 */
function propTableRows(defSchema, defIndex = {}, opts = {}) {
  if (!defSchema || typeof defSchema !== "object") return [];
  const properties = defSchema.properties;
  if (!properties || Object.keys(properties).length === 0) return [];

  const omit = new Set(opts.omit || []);
  const required = new Set(defSchema.required || []);

  // Collect anyOf/required constraints to identify "at least one" groups.
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

  const rows = [];
  for (const [propName, propSchema] of Object.entries(properties)) {
    if (omit.has(propName)) continue;
    const isRequired = required.has(propName);
    const isAnyOf = anyOfProps.has(propName);
    const type = describeType(propSchema, defIndex);

    const notes = [];
    if (propSchema.enum && propSchema.enum.length > 8) {
      notes.push({ kind: "values", value: propSchema.enum.map(String) });
    }
    if (propSchema.pattern) {
      notes.push({ kind: "pattern", value: propSchema.pattern });
    }
    if (propSchema.minItems) {
      notes.push({ kind: "minItems", value: propSchema.minItems });
    }
    if (propSchema.default !== undefined) {
      notes.push({
        kind: "default",
        value: propSchema.default,
        isString: typeof propSchema.default === "string",
      });
    }
    if (
      propSchema.type === "array" &&
      propSchema.items &&
      propSchema.items.format
    ) {
      notes.push({ kind: "format", value: propSchema.items.format });
    }

    let status;
    let sortOrder;
    if (isRequired) {
      status = "required";
      sortOrder = 0;
    } else if (isAnyOf) {
      status = "conditional";
      sortOrder = 1;
    } else {
      status = "optional";
      sortOrder = 2;
    }

    // A bare $ref property with no local description inherits the referenced def's
    // description, so docs don't render an empty cell.
    let description = propSchema.description || "";
    if (!description && propSchema.$ref) {
      const refTarget = defIndex[propSchema.$ref];
      if (refTarget && refTarget.description) {
        description = refTarget.description;
      }
    }

    rows.push({
      sortOrder,
      name: propName,
      type,
      status,
      description,
      notes,
    });
  }

  // Stable sort: required → conditional → optional, preserving original order
  rows.sort((a, b) => a.sortOrder - b.sortOrder);
  return rows;
}

// Render one row's notes array as the `<br><small>...</small>` HTML suffix following the
// description text in the HTML table.
function notesToHtml(notes) {
  return notes
    .map((note) => {
      switch (note.kind) {
        case "values":
          return `<br><small>Values: ${note.value.map((v) => `<ds-code inline>${esc(v)}</ds-code>`).join(", ")}</small>`;
        case "pattern":
          return `<br><small>Pattern: <ds-code inline>${esc(note.value)}</ds-code></small>`;
        case "minItems":
          return `<br><small>Min items: ${note.value}</small>`;
        case "default": {
          const v = note.isString ? `"${esc(note.value)}"` : String(note.value);
          return `<br><small>Default: <ds-code inline>${v}</ds-code></small>`;
        }
        case "format":
          return `<br><small>Format: ${esc(note.value)}</small>`;
        default:
          return "";
      }
    })
    .join("");
}

// Render one row's notes array as a plain-text suffix for the markdown table - no HTML, since
// the .md mirror needs to be readable without a browser.
function notesToMarkdown(notes) {
  return notes
    .map((note) => {
      switch (note.kind) {
        case "values":
          return `Values: ${note.value.map((v) => `\`${v}\``).join(", ")}`;
        case "pattern":
          return `Pattern: \`${note.value}\``;
        case "minItems":
          return `Min items: ${note.value}`;
        case "default": {
          const v = note.isString ? `"${note.value}"` : String(note.value);
          return `Default: \`${v}\``;
        }
        case "format":
          return `Format: ${note.value}`;
        default:
          return "";
      }
    })
    .join("; ");
}

// Converts a describeType() HTML fragment into markdown via a targeted regex pass -
// describeType only ever emits a small fixed set of tags, so this is simpler and safer than
// a parallel markdown-emitting describeType.
function typeToMarkdown(typeHtml) {
  return typeHtml
    .replace(
      /<ds-type-ref href="([^"]+)\.html#([^"]+)">([^<]*)<\/ds-type-ref>/g,
      (m, pageSlug, anchor, label) => `[${label}](${pageSlug}.md#${anchor})`,
    )
    .replace(/<ds-code inline>([^<]*)<\/ds-code>/g, (m, code) => `\`${code}\``)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

// Escape a value for embedding in a GFM table cell: pipes would split the row, and a literal
// newline would break it entirely.
function escTableCell(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

// Render a property table for a definition's `properties` map as HTML, or "" when empty.
function renderPropertyTable(defSchema, defIndex = {}, opts = {}) {
  const rows = propTableRows(defSchema, defIndex, opts);
  if (rows.length === 0) return "";

  const statusAttr = { required: " required", conditional: " conditional", optional: "" };

  return (
    `<ds-prop-table>\n` +
    rows
      .map((row) => {
        const descHtml = escWithCode(row.description) + notesToHtml(row.notes);
        return (
          `  <ds-prop name="${esc(row.name)}" type="${esc(row.type)}"${statusAttr[row.status]}>` +
          descHtml +
          `</ds-prop>`
        );
      })
      .join("\n") +
    `\n</ds-prop-table>`
  );
}

// The .md mirror's equivalent of renderPropertyTable(), built from the same propTableRows()
// so field names/types/requiredness can never differ between the two.
function renderPropertyTableMarkdown(defSchema, defIndex = {}, opts = {}) {
  const rows = propTableRows(defSchema, defIndex, opts);
  if (rows.length === 0) return "";

  const requiredLabel = { required: "✓", conditional: "at least 1", optional: "" };

  const lines = [
    "| Property | Type | Required | Description |",
    "| --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    const notes = notesToMarkdown(row.notes);
    const description =
      escTableCell(row.description) + (notes ? ` (${escTableCell(notes)})` : "");
    lines.push(
      `| \`${escTableCell(row.name)}\` | ${escTableCell(typeToMarkdown(row.type))} | ${requiredLabel[row.status]} | ${description} |`,
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Convenience: resolve a (schemaRef, defName) pair into a property table
// ---------------------------------------------------------------------------

/**
 * Load a schema file by its path under schema/ (ex: `entries/component`) and render the
 * property table for one of its definitions. Pass `"$root"` as `defName` for the file's own
 * top-level definition, or a local `$defs` name otherwise.
 */
function renderPropertyTableForRef(schemaRef, defName, opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const filePath = path.join(schemaDir, `${schemaRef}.schema.yaml`);

  if (!fs.existsSync(filePath)) {
    return `{/* ds-prop-table: schema not found "${schemaRef}" */}`;
  }

  let data;
  try {
    data = loadSchemaYaml(filePath);
  } catch (e) {
    return `{/* ds-prop-table: failed to parse "${schemaRef}": ${e.message} */}`;
  }

  const { schemaById, index: builtIndex } = opts.defIndex
    ? { schemaById: opts.schemaById || new Map(), index: opts.defIndex }
    : buildDefIndex({ schemaDir });

  let target;
  if (defName === "$root") {
    target = resolveSchema(data, schemaById);
  } else {
    target = (data.$defs || {})[defName];
  }

  if (!target) {
    return `{/* ds-prop-table: def "${defName}" not found in "${schemaRef}" */}`;
  }

  // `path` navigates into a nested inline sub-schema (e.g. "constraints.items" →
  // def.properties.constraints.items); each segment is a property name except "items", which
  // steps into an array's item schema.
  if (opts.path) {
    for (const seg of String(opts.path).split(".")) {
      if (!target || typeof target !== "object") {
        target = null;
        break;
      }
      target = seg === "items" ? target.items : (target.properties || {})[seg];
    }
    if (!target) {
      return `{/* ds-prop-table: path "${opts.path}" not found in "${defName}" */}`;
    }
  }

  // `delta: true` omits the common entry envelope; an explicit `omit` array
  // takes precedence when provided.
  const omit = opts.omit || (opts.delta ? ENTRY_ENVELOPE : []);
  return renderPropertyTable(target, builtIndex, { omit });
}

module.exports = {
  esc,
  escWithCode,
  slug,
  describeType,
  propTableRows,
  typeToMarkdown,
  renderPropertyTable,
  renderPropertyTableMarkdown,
  renderPropertyTableForRef,
  buildDefIndex,
  resolveSchema,
  withAbsoluteRefs,
  loadSchemaYaml,
  ROOT_FILES,
  DEFAULT_SCHEMA_GROUPS,
  ENTRY_ENVELOPE,
};
