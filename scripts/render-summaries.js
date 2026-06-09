/**
 * render-summaries.js — Schema-driven generators for the summary tables on
 * the Schema Architecture page.
 *
 * These tables used to be hand-written in schema-architecture.mdx and drifted
 * every time the schema changed (a new entity kind, a new document block, a
 * renamed metadata kind). Each generator here derives its table directly from
 * the split schema files, so the rendered page is always 1:1 with the schema —
 * the same principle as render-prop-table.js, extended from per-def property
 * tables to the cross-cutting summary tables.
 *
 * Exports (each returns an HTML fragment):
 *   renderEntityTable        — entity kind → array → entity → defining file
 *   renderMetadataKindsTable — the entityMetadata union (metadata array kinds)
 *   renderBlockScopeTable    — which document blocks each entity accepts
 *   renderBlockTypesTable    — every document block kind, container, scope
 *   renderSchemaTree         — the spec/schema/ file tree with $defs comments
 */

const fs = require("fs");
const path = require("path");
const { esc, escWithCode, slug, linkToRef, buildDefIndex } = require("./render-prop-table.js");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");
const SPLIT_GROUPS = ["common", "metadata", "document-blocks", "entities"];

// Maps each *DocumentBlock union to its display label and a row priority for
// the scope table. Derived labels — not a second source of truth for which
// blocks belong to which union (that comes from the unions themselves).
const UNION_LABELS = {
  componentDocumentBlock: "Component",
  patternDocumentBlock: "Pattern",
  foundationDocumentBlock: "Foundation",
  guideDocumentBlock: "Guide",
  tokenDocumentBlock: "Token",
};
const UNION_ORDER = Object.keys(UNION_LABELS);

// ---------------------------------------------------------------------------
// Schema loading
// ---------------------------------------------------------------------------

/**
 * Merge every $defs entry across the split schema files (plus the root) into
 * one flat map, and return the root schema alongside. Reads source files
 * directly (not the bundle) so generation reflects the working tree even
 * before a rebundle.
 */
function loadAllDefs(schemaDir = SCHEMA_DIR) {
  const defs = {};
  for (const group of SPLIT_GROUPS) {
    const dir = path.join(schemaDir, group);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".schema.json")).sort()) {
      let data;
      try {
        data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      } catch {
        continue;
      }
      for (const [name, body] of Object.entries(data.$defs || {})) defs[name] = body;
    }
  }
  let root = {};
  try {
    root = JSON.parse(fs.readFileSync(path.join(schemaDir, "dsds.schema.json"), "utf-8"));
  } catch {
    /* ignore */
  }
  for (const [name, body] of Object.entries(root.$defs || {})) defs[name] = body;
  return { defs, root };
}

// First sentence of a description, for compact table cells.
function firstSentence(text) {
  if (!text) return "";
  const s = typeof text === "string" ? text : text.value || "";
  const m = s.match(/^.*?[.](?=\s|$)/);
  return m ? m[0] : s;
}

const kindConst = (def) =>
  def && def.properties && def.properties.kind && def.properties.kind.const;

const code = (s) => `<ds-code inline>${esc(String(s))}</ds-code>`;

function typeRef(name, defIndex) {
  const t = defIndex[name];
  return t
    ? `<ds-type-ref href="${t.pageSlug}.html#${slug(name)}">${esc(name)}</ds-type-ref>`
    : esc(name);
}

// Generic <ds-table> renderer. Cells are raw HTML (callers escape).
function renderTable(headers, rows) {
  const head = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
  const body =
    `<tbody>` +
    rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("\n") +
    `</tbody>`;
  return `<ds-table>\n<table>\n${head}\n${body}\n</table>\n</ds-table>`;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Entity discriminator table: `kind` value → array → entity → defining file. */
function renderEntityTable(opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const defIndex = opts.defIndex || buildDefIndex({ schemaDir });
  const { defs, root } = loadAllDefs(schemaDir);

  const entityNames = ((root.properties && root.properties.entity && root.properties.entity.oneOf) || [])
    .map((o) => linkToRef(o.$ref))
    .filter(Boolean);

  // Map entity def name → the documentationGroup array that holds it.
  const groupProps = (defs.documentationGroup && defs.documentationGroup.properties) || {};
  const arrayByEntity = {};
  for (const [arrayName, schema] of Object.entries(groupProps)) {
    const oneOf = schema.items && schema.items.oneOf;
    if (!oneOf) continue;
    for (const alt of oneOf) {
      const ref = linkToRef(alt.$ref);
      if (ref && ref !== "fileRef") arrayByEntity[ref] = arrayName;
    }
  }

  const rows = entityNames.map((name) => {
    const def = defs[name] || {};
    const kc = kindConst(def) || name;
    const arr = arrayByEntity[name];
    const file = (defIndex[name] && defIndex[name].filename) || "";
    const fileCell = defIndex[name]
      ? `<ds-type-ref href="${defIndex[name].pageSlug}.html">${code("entities/" + file)}</ds-type-ref>`
      : code("entities/" + file);
    return [
      code(`"${kc}"`),
      arr ? code(arr) : "—",
      escWithCode(firstSentence(def.description)),
      fileCell,
    ];
  });

  return renderTable(["`kind` value", "Array", "Entity", "Defined in"], rows);
}

/** Entity metadata kinds: the entityMetadata union, with what each carries. */
function renderMetadataKindsTable(opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const { defs } = loadAllDefs(schemaDir);
  const order = ((defs.entityMetadata && defs.entityMetadata.oneOf) || [])
    .map((o) => linkToRef(o.$ref))
    .filter(Boolean);

  // File-level descriptions give the best one-liners for metadata kinds.
  const fileDesc = {};
  const mdir = path.join(schemaDir, "metadata");
  for (const f of fs.existsSync(mdir) ? fs.readdirSync(mdir) : []) {
    if (!f.endsWith(".schema.json") || f === "metadata.schema.json") continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(mdir, f), "utf-8"));
      for (const name of Object.keys(data.$defs || {})) fileDesc[name] = data.description;
    } catch {
      /* ignore */
    }
  }

  const rows = order.map((name) => {
    const def = defs[name] || {};
    const kc = kindConst(def) || name;
    const carries = Object.keys(def.properties || {}).filter((p) => p !== "kind");
    return [
      code(kc),
      carries.map(code).join(", ") || "—",
      escWithCode(firstSentence(fileDesc[name] || def.description)),
    ];
  });

  return renderTable(["Metadata `kind`", "Carries", "Purpose"], rows);
}

// Resolve a block def to its { container, itemRef } pair.
function blockContainer(def) {
  const props = def.properties || {};
  const data = Object.keys(props).filter((p) => p !== "kind" && p !== "agents");
  const arrays = data.filter((p) => props[p].type === "array");
  if (props.items && props.items.type === "array") {
    const it = props.items.items || {};
    return { container: "items", itemRef: it.$ref ? linkToRef(it.$ref) : it.type || "—" };
  }
  if (arrays.length === 1) {
    const it = props[arrays[0]].items || {};
    return { container: arrays[0], itemRef: it.$ref ? linkToRef(it.$ref) : it.type || "—" };
  }
  if (data.length === 1) {
    const p = props[data[0]];
    return { container: data[0], itemRef: p.$ref ? linkToRef(p.$ref) : p.type || "—" };
  }
  return { container: "Named properties", itemRef: "various" };
}

// For every block def: which unions reference it → scope label.
// Unions reference the general kinds indirectly, via a single
// `generalDocumentBlock` branch. Expand that branch into its member kinds so
// the general kinds (guideline, purpose, accessibility, content, section) are
// attributed to every union that includes general, not lost one level down.
function buildBlockScope(defs) {
  const generalNames = new Set(
    ((defs.generalDocumentBlock && defs.generalDocumentBlock.oneOf) || [])
      .map((o) => linkToRef(o.$ref))
      .filter(Boolean),
  );
  const scopeByBlock = {}; // block def name → Set of entity labels
  const add = (block, label) => {
    (scopeByBlock[block] = scopeByBlock[block] || new Set()).add(label);
  };
  for (const union of UNION_ORDER) {
    const u = defs[union];
    if (!u) continue;
    for (const alt of u.oneOf || []) {
      const b = linkToRef(alt.$ref);
      if (!b) continue;
      if (b === "generalDocumentBlock") {
        for (const g of generalNames) add(g, UNION_LABELS[union]);
      } else {
        add(b, UNION_LABELS[union]);
      }
    }
  }
  return { generalNames, scopeByBlock };
}

/** Document block types: kind → container → item type → scope → description. */
function renderBlockTypesTable(opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const defIndex = opts.defIndex || buildDefIndex({ schemaDir });
  const { defs } = loadAllDefs(schemaDir);
  const { generalNames, scopeByBlock } = buildBlockScope(defs);

  // Every block that appears in any union.
  const blockNames = Object.keys(scopeByBlock);

  const rows = blockNames
    .map((name) => {
      const def = defs[name] || {};
      const kc = kindConst(def) || name;
      const { container, itemRef } = blockContainer(def);
      const isGeneral = generalNames.has(name);
      const scope = isGeneral
        ? "General"
        : Array.from(scopeByBlock[name]).join(", ");
      // Sort key: General first, then by scope, then kind.
      const sortKey = (isGeneral ? "0" : "1") + scope + kc;
      return {
        sortKey,
        row: [
          code(`"${kc}"`),
          container === "Named properties" ? container : code(container),
          itemRef === "various" ? itemRef : typeRef(itemRef, defIndex),
          scope,
          escWithCode(firstSentence(def.description)),
        ],
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((x) => x.row);

  return renderTable(
    ["Kind value", "Container property", "Item type", "Scope", "Description"],
    rows,
  );
}

/**
 * Compact block table for the Quick Start page: Kind | Applies To | Description.
 * "Applies To" is the lowercased list of entities that accept the block (or
 * "all" for general blocks). Derived from the same union membership as the
 * full block-types table, so the two pages can never disagree on scope.
 */
function renderBlockAppliesTable(opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const { defs } = loadAllDefs(schemaDir);
  const { generalNames, scopeByBlock } = buildBlockScope(defs);

  const rows = Object.keys(scopeByBlock)
    .map((name) => {
      const def = defs[name] || {};
      const kc = kindConst(def) || name;
      const isGeneral = generalNames.has(name);
      const applies = isGeneral
        ? "all"
        : Array.from(scopeByBlock[name]).map((l) => l.toLowerCase()).join(", ");
      const sortKey = (isGeneral ? "0" : "1") + applies + kc;
      return {
        sortKey,
        row: [code(kc), applies, escWithCode(firstSentence(def.description))],
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((x) => x.row);

  return renderTable(["Kind", "Applies To", "Description"], rows);
}

/** Scope table: each entity's union → entities that use it → blocks accepted. */
function renderBlockScopeTable(opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const { defs, root } = loadAllDefs(schemaDir);
  const generalNames = new Set(
    ((defs.generalDocumentBlock && defs.generalDocumentBlock.oneOf) || []).map((o) => linkToRef(o.$ref)),
  );

  // entity def name → union it uses (via its documentBlocks ref).
  const entityNames = ((root.properties && root.properties.entity && root.properties.entity.oneOf) || [])
    .map((o) => linkToRef(o.$ref))
    .filter(Boolean);
  const usedBy = {}; // union name → [entity kind consts]
  for (const name of entityNames) {
    const def = defs[name];
    const dbRef =
      def && def.properties && def.properties.documentBlocks && def.properties.documentBlocks.items;
    const union = dbRef && linkToRef(dbRef.$ref);
    if (!union) continue;
    (usedBy[union] = usedBy[union] || []).push(kindConst(def) || name);
  }

  const rows = UNION_ORDER.filter((u) => defs[u]).map((union) => {
    const members = (defs[union].oneOf || []).map((o) => linkToRef(o.$ref)).filter(Boolean);
    // General kinds arrive via a `generalDocumentBlock` branch (or, legacy, inlined).
    const hasGeneral =
      members.includes("generalDocumentBlock") || members.some((m) => generalNames.has(m));
    const specific = members.filter((m) => m !== "generalDocumentBlock" && !generalNames.has(m));
    const accepts = specific.length
      ? specific.map((m) => code(kindConst(defs[m]) || m)).join(", ") + (hasGeneral ? " + general" : "")
      : hasGeneral
        ? "general only"
        : "—";
    return [
      `**${UNION_LABELS[union]}**`,
      (usedBy[union] || []).map(code).join(", ") || "—",
      accepts,
    ];
  });

  // Render the bold label as <strong> (this fragment bypasses markdown).
  const rendered = rows.map((r) => [r[0].replace(/^\*\*(.+)\*\*$/, "<strong>$1</strong>"), r[1], r[2]]);
  return renderTable(["Scope", "Used by", "Accepts"], rendered);
}

/** The spec/schema/ file tree, with each file's $defs as a comment. */
function renderSchemaTree(opts = {}) {
  const schemaDir = opts.schemaDir || SCHEMA_DIR;
  const lines = ["spec/schema/"];
  lines.push("├── dsds.schema.json                    # Root document schema");
  lines.push("├── dsds.bundled.schema.json            # Auto-generated single-file bundle");

  const pad = (s, n) => (s.length >= n ? s + " " : s + " ".repeat(n - s.length));
  SPLIT_GROUPS.forEach((group, gi) => {
    const dir = path.join(schemaDir, group);
    if (!fs.existsSync(dir)) return;
    const lastGroup = gi === SPLIT_GROUPS.length - 1;
    lines.push(`${lastGroup ? "└──" : "├──"} ${group}/`);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".schema.json")).sort();
    files.forEach((f, fi) => {
      const lastFile = fi === files.length - 1;
      const branch = lastGroup ? "    " : "│   ";
      let defNames = "";
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
        defNames = Object.keys(data.$defs || {}).join(", ");
      } catch {
        /* ignore */
      }
      const entry = `${branch}${lastFile ? "└──" : "├──"} ${f}`;
      lines.push(`${pad(entry, 48)}# ${defNames}`);
    });
  });

  return `<ds-code>${esc(lines.join("\n"))}</ds-code>`;
}

module.exports = {
  renderEntityTable,
  renderMetadataKindsTable,
  renderBlockScopeTable,
  renderBlockTypesTable,
  renderBlockAppliesTable,
  renderSchemaTree,
  loadAllDefs,
};
