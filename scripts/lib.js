// Shared helpers for validate.js and conformance-test.js - loading files and finding entries,
// so neither script has to redeclare the other's copy.
"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const rootDir = path.join(__dirname, "..");
const schemaDir = path.join(rootDir, "schema");
const exampleDirs = [
  path.join(rootDir, "examples/entries"),
  path.join(rootDir, "examples/base"),
  path.join(rootDir, "examples/base/starter-kit-fragments"),
  path.join(rootDir, "examples/quickstart"),
  path.join(rootDir, "examples/quickstart/components"),
  path.join(rootDir, "examples/anti-patterns"),
];

// Files that are deliberately not standalone documents. Everything else under exampleDirs is,
// and belongs in the sweep.
//
// 01-base-document.yaml is deliberately incomplete - the Quick Start page itself labels it
// "not valid on its own yet" (the first step of a build-up that only gets a real `entries`
// array at 03).
//
// The two starter-kit fragments are entry lists with no base-document wrapper: they exist to be
// joined by scripts/tools/compose.js, and the composed result IS validated - see
// check-composed-fragments.mjs. 00-system.dsds.yaml carries the wrapper and does validate alone,
// so it stays in the sweep.
const EXCLUDED_FROM_DEFAULT = new Set([
  path.join(rootDir, "examples/quickstart/01-base-document.yaml"),
  path.join(rootDir, "examples/base/starter-kit-fragments/01-tokens-and-themes.dsds.yaml"),
  path.join(rootDir, "examples/base/starter-kit-fragments/02-components.dsds.yaml"),
]);
// The repo's own dogfooding corpus: test/site-components documents this site's web components
// as real entries. `npm run check` already validates them, but they sat outside the lint
// sweep, so a field-order regression in them was invisible to `npm run lint`.
const docEntryDirs = [
  path.join(rootDir, "test/site-components"),
  path.join(rootDir, "test/site-components/components"),
];

// JSON_SCHEMA disables YAML's implicit !!timestamp type, which otherwise parses a bare
// `2026-06-02` into a JS Date instead of the string isoDate.schema.yaml requires. Scoped to
// this loader only, not a repo-wide js-yaml behavior change.
function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, "utf8"), { schema: yaml.JSON_SCHEMA });
}

// ---------------------------------------------------------------------------
// Schema-derived field order
// ---------------------------------------------------------------------------

// STYLE_GUIDE.md says to write a document's fields in the order the schema files list
// them, which makes those files the only place that order is recorded. Anything that needs
// a canonical field order reads it from here instead of keeping a copy, because a copy goes
// stale the moment a schema file is reordered and it goes stale silently.

const EXTENSIONS_KEY = "$extensions";

const declaredPropsCache = new Map();

// A schema file's own property names, in the order it declares them. Throws when a file
// turns out to declare none: every file callers ask for declares properties today, so an
// empty answer means the properties moved somewhere this function doesn't look - into an
// `allOf` branch, behind a `$ref`, down into `$defs`. Without the throw the callers would
// quietly stop working: a field-order check with an empty order passes every document, and
// an empty omit list turns a delta prop-table into a full one. Both look like success.
function declaredProps(relPath) {
  if (!declaredPropsCache.has(relPath)) {
    const doc = loadYaml(path.join(schemaDir, relPath));
    const inline = (doc.allOf || []).find((member) => member.properties);
    const keys = Object.keys(doc.properties || (inline && inline.properties) || {});
    if (keys.length === 0) {
      throw new Error(
        `schema/${relPath} declares no properties of its own, so no field order can be ` +
          `derived from it. Either the file was restructured, or the caller asked for the ` +
          `wrong one.`,
      );
    }
    declaredPropsCache.set(relPath, keys);
  }
  // A copy, so a caller that sorts or splices its result can't corrupt the cache.
  return declaredPropsCache.get(relPath).slice();
}

// The field order for an entry of `kind`: the fields every kind shares, from
// entries/entry.schema.yaml, then that kind's own fields, from entries/<kind>.schema.yaml,
// then `$extensions` last. It takes two lists because a kind's own fields live in a
// different file from the shared ones, and JSON Schema's `allOf` can't interleave them.
// `$extensions` has to be pinned because it's declared with the shared fields, so joining
// the two lists end to end would leave it stranded in the middle. A namespaced custom kind
// (`acme.icon-library`) has no schema file of its own and gets the shared fields alone -
// the same fallback entry.schema.yaml's own dispatch gives it.
function entryFieldOrder(kind) {
  const base = declaredProps("entries/entry.schema.yaml");
  const shared = base.filter((key) => key !== EXTENSIONS_KEY);
  const kindFile = `entries/${kind}.schema.yaml`;
  const own =
    kind && fs.existsSync(path.join(schemaDir, kindFile))
      ? declaredProps(kindFile).filter((key) => !base.includes(key))
      : [];
  return [...shared, ...own, EXTENSIONS_KEY];
}

// A schema file's enum values, in the order it declares them, together with the default it
// declares for that field. `locate` picks the field out of the loaded document because these
// sit at different depths: common/requirement-level.schema.yaml is an enum at its root,
// sections/section.schema.yaml keeps `for` under `properties`, sections/guidelines.schema.yaml
// keeps `framing` inside an `allOf` member. Throws for the same reason declaredProps does - a
// missing enum would turn a sort check into a no-op that passes every document, and a check
// that passes everything reads as success.
function declaredEnum(relPath, locate) {
  const field = locate(loadYaml(path.join(schemaDir, relPath)));
  const values = field && field.enum;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(
      `schema/${relPath} declares no enum where one was expected, so no order can be derived ` +
        `from it. Either the file was restructured, or the caller looked in the wrong place.`,
    );
  }
  return { values, fallback: field.default };
}

// Builds a rank function from a declared enum, for sorting values into the order the schema
// lists them. A field left out of a document ranks as the default the schema declares for it,
// which is the same thing a validator would read it as - not as unknown. A value the schema
// doesn't list at all ranks last, so an unrecognized one sorts to the end instead of throwing.
function enumRanker(relPath, locate) {
  const { values, fallback } = declaredEnum(relPath, locate);
  const rank = new Map(values.map((value, index) => [value, index]));
  return (value) => {
    const resolved = value === undefined || value === null ? fallback : value;
    return rank.has(resolved) ? rank.get(resolved) : values.length;
  };
}

// Only matches *.schema.yaml - excludes schema/conformance-rules.yaml, which lives alongside
// the schema files but isn't itself a JSON Schema document.
function walkYamlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkYamlFiles(full);
    return entry.name.endsWith(".schema.yaml") ? [full] : [];
  });
}

function defaultTargets() {
  return [...exampleDirs, ...docEntryDirs].flatMap((dir) =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir)
          .filter((f) => f.endsWith(".yaml"))
          .map((f) => path.join(dir, f))
          .filter((f) => !EXCLUDED_FROM_DEFAULT.has(f))
      : []
  );
}

function isBaseDoc(doc) {
  return typeof doc.schemaVersion !== "undefined";
}

// Every entity in a file, whether a standalone entry or a base document with several inline,
// so callers don't need to special-case either form. Includes `shared` alongside `entries`,
// since both share one id/refs/sections addressing space.
function entriesIn(doc) {
  return isBaseDoc(doc) ? [...(doc.entries || []), ...(doc.shared || [])] : [doc];
}

// Finds every {to, rel} object anywhere inside a value, regardless of what field it's
// under - one generic walk instead of a separate case for each place a ref can appear.
// `combos` subjects/items (bare strings, not {to, rel} objects) are a deliberately different,
// lighter pointer concept and aren't picked up here.
//
// Each result carries two locations: `at`, a readable label for messages (`sections[0].refs[1]`),
// and `pointer`, a JSON Pointer relative to `value` (`/sections/0/refs/1`) for tools. They're
// built separately because a key can contain a dot (`$extensions` keys always do), so `at`
// can't be turned back into a pointer reliably.
//
// A pointer in a field named for one kind of pointer (`evidence`, `checks`, ...) has no `rel`
// of its own; the field implies it (FIELD_RELS), and each result carries it as `rel`, with
// `field` set to the field's name.
const FIELD_RELS = {
  uses: "uses",
  replacedBy: "replaced-by",
  extends: "extends",
  alternatives: "alternative-to",
  evidence: "cites",
  checks: "checked-by",
  specs: "contract",
  refines: "refines",
};

function findRefs(value, at, out, pointer = "", impliedRel = null, field = null) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => findRefs(item, `${at}[${i}]`, out, `${pointer}/${i}`, impliedRel, field));
    return;
  }
  if (value && typeof value === "object") {
    const rel = typeof value.rel === "string" ? value.rel : impliedRel;
    if (typeof value.to === "string" && rel) {
      out.push({ to: value.to, rel, at, pointer, ...(impliedRel && field ? { field } : {}) });
    }
    for (const [key, val] of Object.entries(value)) {
      // A field's implied rel applies to its own list items only, not to anything nested in them.
      const implied = Array.isArray(val) && Object.prototype.hasOwnProperty.call(FIELD_RELS, key) ? FIELD_RELS[key] : null;
      findRefs(val, at ? `${at}.${key}` : key, out, `${pointer}/${escapePointer(key)}`, implied, implied ? key : null);
    }
  }
}

// ---------------------------------------------------------------------------
// Item addresses (processing model §2): what the part after `#` in `entryId#address` names
// ---------------------------------------------------------------------------

// The field an item's id is derived from, per section kind (common/id.schema.yaml).
const PRIMARY_TEXT = { guidelines: "statement", definitions: "term", steps: "title" };

// common/id.schema.yaml's derivation: lowercase, every run of characters outside [a-z0-9]
// becomes one dash, leading and trailing dashes trimmed. null when nothing is left.
function deriveId(text) {
  if (typeof text !== "string") return null;
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return id || null;
}

/**
 * Every address on one entry, as a Map of address -> [candidates]. A candidate is
 * { target, type, source, pointer, sectionKind }: `type` is item, freeform, nested, trait or
 * value; `source` is explicit, derived, inherited or trait. Pointers are relative to the entry.
 *
 * - A section item (guidelines, definitions, steps) or a freeform entry, at any depth, is
 *   addressed by its `id`, or failing that by the id derived from its primary text.
 * - An item with neither - a pure pointer that reuses another item through `same-as` - takes
 *   the address of the item it reuses (the part after `#`), with source `inherited`.
 * - Any other object inside an item that declares its own `id` is addressed by it.
 * - A component's trait is `traitId`; one value of an enum trait is `traitId.valueId`.
 *
 * Use resolveAddress() to look one up: an address can be ambiguous.
 */
function itemAddresses(entry) {
  const found = new Map();
  const add = (address, candidate) => {
    if (!address) return;
    if (!found.has(address)) found.set(address, []);
    found.get(address).push(candidate);
  };
  const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

  // Explicit ids on objects nested inside an item (an example, a sub-item, ...).
  function nested(value, pointer) {
    if (Array.isArray(value)) {
      value.forEach((v, i) => nested(v, `${pointer}/${i}`));
    } else if (isObject(value)) {
      if (typeof value.id === "string") add(value.id, { target: value, type: "nested", source: "explicit", pointer });
      for (const [k, v] of Object.entries(value)) if (Array.isArray(v)) nested(v, `${pointer}/${escapePointer(k)}`);
    }
  }

  function freeform(entries, pointer, sectionKind) {
    (entries || []).forEach((f, i) => {
      if (!isObject(f)) return;
      const p = `${pointer}/${i}`;
      const explicit = typeof f.id === "string";
      add(explicit ? f.id : deriveId(f.title), { target: f, type: "freeform", source: explicit ? "explicit" : "derived", pointer: p, sectionKind });
      freeform(f.items, `${p}/items`, sectionKind);
    });
  }

  (Array.isArray(entry.sections) ? entry.sections : []).forEach((section, si) => {
    if (!isObject(section)) return;
    const sp = `/sections/${si}`;
    (Array.isArray(section.items) ? section.items : []).forEach((item, ii) => {
      if (!isObject(item)) return;
      const p = `${sp}/items/${ii}`;
      const field = PRIMARY_TEXT[section.kind];
      const sameAs = Array.isArray(item.refs) && item.refs.find((r) => isObject(r) && r.rel === "same-as" && typeof r.to === "string");
      if (typeof item.id === "string") {
        add(item.id, { target: item, type: "item", source: "explicit", pointer: p, sectionKind: section.kind });
      } else if (field && deriveId(item[field])) {
        add(deriveId(item[field]), { target: item, type: "item", source: "derived", pointer: p, sectionKind: section.kind });
      } else if (sameAs && sameAs.to.includes("#")) {
        add(sameAs.to.slice(sameAs.to.indexOf("#") + 1), { target: item, type: "item", source: "inherited", pointer: p, sectionKind: section.kind });
      }
      for (const [k, v] of Object.entries(item)) if (Array.isArray(v)) nested(v, `${p}/${escapePointer(k)}`);
    });
    freeform(section.freeform, `${sp}/freeform`, section.kind);
  });

  (Array.isArray(entry.traits) ? entry.traits : []).forEach((trait, ti) => {
    if (!isObject(trait) || typeof trait.id !== "string") return;
    const p = `/traits/${ti}`;
    add(trait.id, { target: trait, type: "trait", source: "trait", pointer: p });
    for (const [k, v] of Object.entries(trait)) if (Array.isArray(v) && k !== "values") nested(v, `${p}/${escapePointer(k)}`);
    (Array.isArray(trait.values) ? trait.values : []).forEach((value, vi) => {
      if (isObject(value) && typeof value.id === "string") {
        const vp = `${p}/values/${vi}`;
        add(`${trait.id}.${value.id}`, { target: value, type: "value", source: "trait", pointer: vp });
        for (const [k, v] of Object.entries(value)) if (Array.isArray(v)) nested(v, `${vp}/${escapePointer(k)}`);
      }
    });
  });
  return found;
}

// The address that owns a location in an entry: the candidate whose pointer is the longest
// prefix of `pointer` (so a ref inside a guideline item belongs to that item), or null when the
// location sits on the entry itself.
function ownerOf(addresses, pointer) {
  let best = null;
  for (const [address, candidates] of addresses) {
    for (const c of candidates) {
      if ((pointer === c.pointer || pointer.startsWith(`${c.pointer}/`)) && (!best || c.pointer.length > best.candidate.pointer.length)) {
        best = { address, candidate: c };
      }
    }
  }
  return best;
}

/**
 * Looks up one address. Returns { candidate } on a match, { ambiguous: [candidates] } when it
 * names more than one thing, or {} when it names nothing. Precedence: an id written out (an
 * explicit `id`, or a trait's), then a derived one, then an inherited one. Two candidates at
 * the same, highest tier are ambiguous.
 */
const ADDRESS_TIER = { explicit: 0, trait: 0, derived: 1, inherited: 2 };
function resolveAddress(addresses, address) {
  const all = addresses.get(address) || [];
  if (!all.length) return {};
  const best = Math.min(...all.map((c) => ADDRESS_TIER[c.source]));
  const pool = all.filter((c) => ADDRESS_TIER[c.source] === best);
  return pool.length === 1 ? { candidate: pool[0] } : { ambiguous: pool };
}

// RFC 6901: `~` and `/` inside a key are written as `~0` and `~1`.
function escapePointer(key) {
  return String(key).replace(/~/g, "~0").replace(/\//g, "~1");
}

// ---------------------------------------------------------------------------
// Inline links (specification §2.5 and §6.5, processing model §2.4)
// ---------------------------------------------------------------------------

// The CommonMark parser is an optional dependency. It's loaded the first time a Markdown field
// actually contains `dsds:`, so a document with no inline links never needs it. It's ESM-only:
// Node 20.19 and later can require() it, and an older Node fails here like a missing package.
let markdownParser;
let markdownParserProblem = null;
function loadMarkdownParser() {
  if (markdownParser !== undefined) return markdownParser;
  try {
    markdownParser = require("mdast-util-from-markdown").fromMarkdown;
  } catch (e) {
    markdownParser = null;
    markdownParserProblem =
      e && e.code === "ERR_REQUIRE_ESM"
        ? `Node ${process.version} can't load the optional Markdown parser; Node 20.19 or later can`
        : "the optional Markdown parser (mdast-util-from-markdown) isn't installed";
  }
  return markdownParser;
}

// Every Markdown field on one entry (specification §2.5), as [value, pointer] with the pointer
// relative to the entry. Walked by structure rather than by field name, since `description`
// is Markdown on some objects and not on others.
function markdownFields(entry) {
  const out = [];
  const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
  const list = (v) => (Array.isArray(v) ? v : []);
  const text = (obj, key, pointer) => {
    if (isObject(obj) && typeof obj[key] === "string") out.push([obj[key], `${pointer}/${key}`]);
  };
  const examples = (holder, pointer) =>
    list(holder && holder.examples).forEach((ex, i) => text(ex, "description", `${pointer}/examples/${i}`));
  const freeform = (entries, pointer) =>
    list(entries).forEach((f, i) => {
      const p = `${pointer}/${i}`;
      text(f, "body", p);
      examples(f, p);
      freeform(isObject(f) && f.items, `${p}/items`);
    });

  if (!isObject(entry)) return out;
  text(entry, "description", "");
  list(entry.sections).forEach((section, si) => {
    const sp = `/sections/${si}`;
    text(section, "description", sp);
    list(isObject(section) && section.items).forEach((item, ii) => {
      const p = `${sp}/items/${ii}`;
      for (const key of ["statement", "definition", "usage", "description"]) text(item, key, p);
      examples(item, p);
      // A guideline item holds one `example` (singular), not a list.
      if (isObject(item) && isObject(item.example)) text(item.example, "description", `${p}/example`);
    });
    freeform(isObject(section) && section.freeform, `${sp}/freeform`);
  });
  list(entry.traits).forEach((trait, ti) => {
    const p = `/traits/${ti}`;
    text(trait, "description", p);
    examples(trait, p);
    list(isObject(trait) && trait.values).forEach((value, vi) => {
      text(value, "description", `${p}/values/${vi}`);
      examples(value, `${p}/values/${vi}`);
    });
  });
  return out;
}

const DSDS_SCHEME = /^dsds:/i;

// The shape a `to` must have, read from common/ref.schema.yaml, so an inline link's target is
// held to exactly the pattern the schema applies to a `to` field.
const TO_PATTERN = new RegExp(loadYaml(path.join(schemaDir, "common/ref.schema.yaml")).$defs.to.pattern);

// The visible text of an mdast node.
const nodeText = (node) =>
  typeof node.value === "string" ? node.value : (node.children || []).map(nodeText).join("");

/**
 * Every inline link on one entry. Returns { links, skipped }:
 *
 * - `links`: { pointer, offset, target, form, text } for each `dsds:` link. `pointer` is the
 *   Markdown field, relative to the entry; `offset` is the link's character offset in it;
 *   `form` is "inline" (`[text](dsds:…)`), "autolink" (`<dsds:…>`) or "reference" (a
 *   `[x]: dsds:…` definition, reported once, where the target is written); `text` is the
 *   author's text, or null for an autolink and a reference definition.
 * - `skipped`: null, or why the links weren't read - set only when a Markdown field mentions
 *   `dsds:` and the optional parser can't be loaded.
 *
 * A link in a code span or fenced block isn't a link, so the parser never reports one there.
 */
function inlineLinksIn(entry) {
  const fields = markdownFields(entry).filter(([value]) => /dsds:/i.test(value));
  if (!fields.length) return { links: [], skipped: null };
  const parse = loadMarkdownParser();
  if (!parse) return { links: [], skipped: markdownParserProblem };

  const links = [];
  for (const [value, pointer] of fields) {
    (function walk(node) {
      const isLink = node.type === "link" || node.type === "definition";
      if (isLink && typeof node.url === "string" && DSDS_SCHEME.test(node.url)) {
        const offset = node.position ? node.position.start.offset : 0;
        const form = node.type === "definition" ? "reference" : value[offset] === "<" ? "autolink" : "inline";
        let target = node.url.slice("dsds:".length);
        try {
          target = decodeURIComponent(target);
        } catch {
          // A stray `%` stays as written, and the target check reports it as malformed.
        }
        links.push({ pointer, offset, target, form, text: form === "inline" ? nodeText(node) : null });
      }
      (node.children || []).forEach(walk);
    })(parse(value));
  }
  return { links, skipped: null };
}

module.exports = {
  rootDir,
  schemaDir,
  exampleDirs,
  docEntryDirs,
  loadYaml,
  declaredProps,
  declaredEnum,
  enumRanker,
  entryFieldOrder,
  walkYamlFiles,
  defaultTargets,
  isBaseDoc,
  entriesIn,
  findRefs,
  FIELD_RELS,
  escapePointer,
  PRIMARY_TEXT,
  deriveId,
  itemAddresses,
  resolveAddress,
  ownerOf,
  markdownFields,
  inlineLinksIn,
  TO_PATTERN,
};
