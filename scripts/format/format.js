#!/usr/bin/env node
/**
 * dsds-format: puts a DSDS document's fields in the order STYLE_GUIDE.md asks for.
 *
 * It replaces the lint rules that only reported mechanical order - DSDS-17, DSDS-20, DSDS-22
 * and DSDS-23, retired in 0.22.0. Each of those orders has one right answer, read from the
 * schema files, so applying it beats reporting it. It reorders:
 *
 *   - the fields of a base document, an entry, a shared entry, `metadata`, a section, a section
 *     item, a trait, a trait value, a combo and a ref, in the order each one's schema file
 *     declares (STYLE_GUIDE.md §1-§6);
 *   - an entry's `combos`, so every combo for one subject sits together, in `level` order (§6).
 *
 * It never reorders sections, guideline items or entries. That's reading order, an author can
 * have a reason to break it, and DSDS-18, DSDS-19 and DSDS-21 still report it as advice.
 *
 * Only order changes. The original lines are moved, not re-serialised, so text, quoting, line
 * wrapping and comments survive; a comment moves with the field below it, and blank lines stay
 * where they were. Before anything is written, the result is re-parsed and must hold exactly
 * the same data and the same comments as the original. A field the schema doesn't know keeps
 * its place right after the field it followed.
 *
 * Usage: dsds-format [--check] [--json] [file-or-folder ...]. --help for more.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const jsYaml = require("js-yaml");
const { schemaDir, loadYaml, defaultTargets, declaredProps, entryFieldOrder, enumRanker } = require("../lib");

// ---------------------------------------------------------------------------
// The orders, all read out of the schema files - never transcribed. These moved here from
// lint-docs.js when the rules that checked them were retired.
// ---------------------------------------------------------------------------

const EXT_KEY = "$extensions";
const DOCUMENT_ORDER = declaredProps("base.schema.yaml");
const SHARED_ORDER = declaredProps("shared.schema.yaml");

// An object built from a shared file plus a more specific one: shared fields first, then the
// specific file's own, then `$extensions` last (STYLE_GUIDE.md §1).
function composedOrder(baseFile, memberFile) {
  const base = declaredProps(baseFile);
  const own = declaredProps(memberFile).filter((k) => !base.includes(k));
  return [...base.filter((k) => k !== EXT_KEY), ...own, EXT_KEY];
}

function itemOrder(kind) {
  const doc = loadYaml(path.join(schemaDir, "sections", `${kind}.schema.yaml`));
  const inline = (doc.allOf || []).find((m) => m.properties);
  const itemsRef = inline.properties.items.items;
  // The item shape is a named local $defs entry on every kind as of the docs-site exposure
  // work, each named for its own kind (`guidelineItem`, not a generic `item`) so the docs
  // page can tell the three apart - resolve by $ref instead of assuming a name. Falls back to
  // the pre-promotion inline shape in case a future kind skips naming it.
  if (itemsRef.$ref && itemsRef.$ref.startsWith("#/$defs/")) {
    const defName = itemsRef.$ref.slice("#/$defs/".length);
    return Object.keys(doc.$defs[defName].properties);
  }
  return Object.keys(itemsRef.properties);
}

const ENTRY_METADATA_ORDER = composedOrder("metadata/metadata.schema.yaml", "metadata/entry-metadata.schema.yaml");
// A system's metadata is every entry's metadata plus the system's own fields
// (entries/system.schema.yaml composes both). DSDS-22 left the middle file out, so it never
// checked where a system's `status` went.
const METADATA_ORDER = {
  entry: ENTRY_METADATA_ORDER,
  system: [
    ...ENTRY_METADATA_ORDER.filter((k) => k !== EXT_KEY),
    ...declaredProps("metadata/system-metadata.schema.yaml").filter((k) => !ENTRY_METADATA_ORDER.includes(k)),
    EXT_KEY,
  ],
};
const ITEM_ORDER = {
  guidelines: itemOrder("guidelines"),
  definitions: itemOrder("definitions"),
  steps: itemOrder("steps"),
};
const COMBO_ORDER = declaredProps("common/combo.schema.yaml");
// ref.schema.yaml is a oneOf (a bare string, or the object form); only the object has fields.
const REF_ORDER = Object.keys(
  loadYaml(path.join(schemaDir, "common", "ref.schema.yaml")).oneOf.find((m) => m.properties).properties,
);

// §4: a section leads with `kind`, `for`, then the one field its kind adds, then the rest of
// the shared order.
const SECTION_KIND_FIELD = { guidelines: "framing", steps: "ordered" };
const SECTION_TAIL = declaredProps("sections/section.schema.yaml").filter((k) => k !== "kind" && k !== "for");
const sectionOrder = (kind) => ["kind", "for", ...(SECTION_KIND_FIELD[kind] ? [SECTION_KIND_FIELD[kind]] : []), ...SECTION_TAIL];

// §2: a trait leads with `traitType`, then `kind`, then the fields every trait shares, then
// whatever its own boolean or enum branch adds.
const TRAIT_LEAD = ["traitType", "kind"];
const COMPONENT_SCHEMA = loadYaml(path.join(schemaDir, "entries", "component.schema.yaml"));
const TRAIT_BRANCHES = COMPONENT_SCHEMA.allOf.find((m) => m.properties).properties.traits.items.anyOf;
const TRAIT_VALUE_PROPS = Object.keys(COMPONENT_SCHEMA.$defs.traitValue.properties);
const TRAIT_VALUE_ORDER = [...TRAIT_VALUE_PROPS, "refs"];
const branchProps = (branch) => Object.keys(((branch.allOf || []).find((m) => m.properties) || {}).properties || {});
function traitOrder(kind) {
  const branch = TRAIT_BRANCHES.find(
    (b) => (((b.allOf || []).find((m) => m.properties) || {}).properties || {}).kind?.const === kind,
  );
  const tail = branch ? branchProps(branch).filter((k) => !TRAIT_LEAD.includes(k) && !TRAIT_VALUE_PROPS.includes(k)) : [];
  return [...TRAIT_LEAD, ...TRAIT_VALUE_PROPS, ...tail];
}

const levelRank = enumRanker("common/requirement-level.schema.yaml", (d) => d);

// ---------------------------------------------------------------------------
// What to order: walk the parsed document and attach an order to each collection
// ---------------------------------------------------------------------------

function pairOf(map, key) {
  if (!YAML.isMap(map)) return null;
  return map.items.find((p) => YAML.isScalar(p.key) && p.key.value === key) || null;
}

const scalar = (node) => (YAML.isScalar(node) ? node.value : undefined);
const keyOf = (pair) => (YAML.isScalar(pair.key) ? pair.key.value : undefined);
const escapePointer = (key) => String(key).replace(/~/g, "~0").replace(/\//g, "~1");

// Every collection that has an order, as { node, how, pointer, lead, parentPair }. `lead` says
// what sits before the collection's first item: the start of the file (`root`), a list dash on
// the same line (`dash`), or the key it's the value of (`key`).
function plan(doc) {
  const targets = [];
  const seen = new Set();
  const add = (node, how, pointer, lead, parentPair) => {
    if (!node || seen.has(node) || (!YAML.isMap(node) && !YAML.isSeq(node)) || !node.items.length) return;
    seen.add(node);
    targets.push({ node, how, pointer, lead, parentPair });
  };
  const child = (map, key) => {
    const pair = pairOf(map, key);
    return pair && pair.value ? { node: pair.value, pair } : null;
  };
  const eachItem = (map, key, pointer, fn) => {
    const c = child(map, key);
    if (!c || !YAML.isSeq(c.node)) return;
    c.node.items.forEach((item, i) => {
      if (YAML.isMap(item)) fn(item, `${pointer}/${key}/${i}`);
    });
  };

  function entity(map, order, pointer, lead) {
    const kind = scalar(pairOf(map, "kind")?.value);
    add(map, { keys: order }, pointer, lead);

    const meta = child(map, "metadata");
    if (meta) add(meta.node, { keys: kind === "system" ? METADATA_ORDER.system : METADATA_ORDER.entry }, `${pointer}/metadata`, "key", meta.pair);

    const combos = child(map, "combos");
    if (combos) add(combos.node, { combos: true }, `${pointer}/combos`, "key", combos.pair);
    eachItem(map, "combos", pointer, (item, p) => add(item, { keys: COMBO_ORDER }, p, "dash"));

    eachItem(map, "traits", pointer, (trait, p) => {
      add(trait, { keys: traitOrder(scalar(pairOf(trait, "kind")?.value)) }, p, "dash");
      eachItem(trait, "values", p, (value, vp) => add(value, { keys: TRAIT_VALUE_ORDER }, vp, "dash"));
    });

    eachItem(map, "sections", pointer, (section, p) => {
      const sectionKind = scalar(pairOf(section, "kind")?.value);
      add(section, { keys: sectionOrder(sectionKind) }, p, "dash");
      const order = ITEM_ORDER[sectionKind];
      if (order) eachItem(section, "items", p, (item, ip) => add(item, { keys: order }, ip, "dash"));
    });
  }

  const root = doc.contents;
  if (!YAML.isMap(root)) return targets;
  // A fragment of a base document (examples/base/starter-kit-fragments/) has `entries` or
  // `shared` but no `schemaVersion` of its own; it's ordered as the base it's composed into.
  const isBase = pairOf(root, "schemaVersion") || (!pairOf(root, "kind") && (pairOf(root, "entries") || pairOf(root, "shared")));
  if (isBase) {
    add(root, { keys: DOCUMENT_ORDER }, "", "root");
    eachItem(root, "entries", "", (entry, p) => entity(entry, entryFieldOrder(scalar(pairOf(entry, "kind")?.value)), p, "dash"));
    eachItem(root, "shared", "", (shared, p) => entity(shared, SHARED_ORDER, p, "dash"));
  } else {
    const kind = scalar(pairOf(root, "kind")?.value);
    entity(root, kind === undefined ? SHARED_ORDER : entryFieldOrder(kind), "", "root");
  }

  // Refs turn up all over a document (`refs`, `evidence`, `checks`, `source`, an example's `ref`,
  // ...), so they're found by what they hold rather than by field name. `$extensions` holds
  // vendor data, and an object in there that happens to carry `href` isn't a ref.
  (function walk(node, pointer, lead, parentPair) {
    if (YAML.isMap(node)) {
      if (pairOf(node, "to") || pairOf(node, "href")) add(node, { keys: REF_ORDER }, pointer, lead, parentPair);
      for (const pair of node.items) {
        if (keyOf(pair) === EXT_KEY) continue;
        walk(pair.value, `${pointer}/${escapePointer(keyOf(pair))}`, "key", pair);
      }
    } else if (YAML.isSeq(node)) {
      node.items.forEach((item, i) => walk(item, `${pointer}/${i}`, "dash", null));
    }
  })(root, "", "root", null);

  return targets;
}

// The order a collection's items should be in, as a list of original indexes.
function desiredOrder(target) {
  const items = target.node.items;
  if (target.how.combos) {
    // Grouping, not sorting: subjects keep the order they first appear in.
    const groups = new Map();
    const keys = items.map((item, i) => {
      const subject = JSON.stringify(YAML.isMap(item) ? scalar(pairOf(item, "subject")?.value) ?? null : null);
      if (!groups.has(subject)) groups.set(subject, groups.size);
      const level = YAML.isMap(item) ? scalar(pairOf(item, "level")?.value) : undefined;
      return [groups.get(subject), levelRank(level), i];
    });
    return sortedIndexes(keys);
  }
  // A field the schema doesn't declare keeps its place right after the field it followed.
  const rank = new Map(target.how.keys.map((k, i) => [k, i]));
  let previous = -1;
  const keys = items.map((pair, i) => {
    const key = YAML.isPair(pair) ? keyOf(pair) : undefined;
    if (rank.has(key)) {
      previous = rank.get(key);
      return [previous, 0, i];
    }
    return [previous, 1, i];
  });
  return sortedIndexes(keys);
}

function sortedIndexes(keys) {
  return [...keys]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
    .map((k) => k[2]);
}

// ---------------------------------------------------------------------------
// Moving lines
// ---------------------------------------------------------------------------

class Lines {
  constructor(text) {
    this.text = text;
    this.lines = text.split("\n");
    this.starts = [];
    let at = 0;
    for (const line of this.lines) {
      this.starts.push(at);
      at += line.length + 1;
    }
  }

  lineOf(offset) {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  col(offset) {
    return offset - this.starts[this.lineOf(offset)];
  }
}

const isBlank = (line) => line.trim() === "";
const isComment = (line) => /^\s*#/.test(line);
const indentOf = (line) => line.length - line.trimStart().length;

// Where an item starts (its key, or the node after its list dash) and where it ends.
function itemSpan(item) {
  if (YAML.isPair(item)) {
    if (!item.key || !item.key.range) return null;
    const end = item.value && item.value.range ? item.value.range[1] : item.key.range[1];
    return [item.key.range[0], end];
  }
  return item && item.range ? [item.range[0], item.range[1]] : null;
}

// The edit that puts a block-style collection's items in `order`, or { reason } when it can't
// be done safely. Each item owns the comments and blank lines above it; leading blank lines are
// positional, so the document's spacing stays where it was and only the content moves.
function blockEdit(target, order, src) {
  const { node, lead } = target;
  const isSeq = YAML.isSeq(node);
  const spans = node.items.map(itemSpan);
  if (spans.some((s) => !s)) return { reason: "an item has no position in the file" };

  const anchors = spans.map(([start]) => src.lineOf(start));
  const anchorCol = src.col(spans[0][0]);
  // A list item's first field is usually on the dash line (`- kind: x`). It can also start on
  // the next line, after a dash that carries only a comment (`- # note`). Then the dash line
  // stays where it is, and every field moves the way it would under a key.
  let dashLine = null;
  let fieldOnDash = lead === "dash" && !isSeq;
  if (fieldOnDash && /^\s*$/.test(src.lines[anchors[0]].slice(0, anchorCol))) {
    fieldOnDash = false;
    dashLine = anchors[0] - 1;
    while (dashLine >= 0 && !/^\s*-(\s|$)/.test(src.lines[dashLine])) {
      if (!isBlank(src.lines[dashLine]) && !isComment(src.lines[dashLine])) return { reason: "its list dash couldn't be found" };
      dashLine--;
    }
    if (dashLine < 0) return { reason: "its list dash couldn't be found" };
  }
  for (let i = 0; i < spans.length; i++) {
    const line = src.lines[anchors[i]];
    const before = line.slice(0, src.col(spans[i][0]));
    const dashed = /^\s*-\s+$/.test(before);
    if (i > 0 && anchors[i] <= anchors[i - 1]) return { reason: "two items share a line" };
    if (isSeq ? !dashed : i === 0 && fieldOnDash ? !dashed : !/^\s*$/.test(before)) {
      return { reason: "an item doesn't start its own line" };
    }
    if (!isSeq && src.col(spans[i][0]) !== anchorCol) return { reason: "its fields aren't indented the same" };
  }
  const itemCol = isSeq ? src.lines[anchors[0]].indexOf("-") : anchorCol;

  const ends = spans.map(([start, end], i) => {
    let last = Math.max(anchors[i], src.lineOf(Math.max(start, end - 1)));
    // A comment indented deeper than the item, right after it, belongs to it.
    const stop = i + 1 < anchors.length ? anchors[i + 1] : src.lines.length;
    while (last + 1 < stop && isComment(src.lines[last + 1]) && indentOf(src.lines[last + 1]) > itemCol) last++;
    return last;
  });

  let start0 = anchors[0];
  const ownerLine = dashLine !== null ? dashLine : lead === "key" && target.parentPair ? src.lineOf(target.parentPair.key.range[0]) : null;
  if (ownerLine !== null) {
    while (start0 - 1 > ownerLine && (isBlank(src.lines[start0 - 1]) || isComment(src.lines[start0 - 1]))) start0--;
  }

  const blocks = spans.map((_, i) => ({ start: i === 0 ? start0 : ends[i - 1] + 1, end: ends[i] }));
  for (const [i, block] of blocks.entries()) {
    for (let l = block.start; l < anchors[i]; l++) {
      if (!isBlank(src.lines[l]) && !isComment(src.lines[l])) return { reason: "content between two items couldn't be placed" };
    }
  }

  const parts = blocks.map(({ start, end }) => {
    let s = start;
    while (s <= end && isBlank(src.lines[s])) s++;
    return { blank: s - start, body: src.lines.slice(s, end + 1) };
  });

  const dashPrefix = fieldOnDash ? src.lines[anchors[0]].slice(0, anchorCol) : null;
  const out = [];
  order.forEach((from, to) => {
    for (let b = 0; b < parts[to].blank; b++) out.push("");
    const body = parts[from].body.slice();
    if (dashPrefix !== null) {
      // The list dash belongs to whichever field comes first.
      if (from === 0 && to !== 0) body[0] = " ".repeat(anchorCol) + body[0].slice(anchorCol);
      if (to === 0 && from !== 0) {
        // Its comments now sit above the dash, so they take the dash's indentation.
        const c = body.findIndex((l) => !isBlank(l) && !isComment(l));
        const dashIndent = dashPrefix.slice(0, indentOf(dashPrefix));
        for (let l = 0; l < c; l++) if (isComment(body[l])) body[l] = dashIndent + body[l].trimStart();
        body[c] = dashPrefix + body[c].slice(anchorCol);
      }
    }
    out.push(...body);
  });

  return { from: blocks[0].start, to: blocks[blocks.length - 1].end, lines: out };
}

// The same for a one-line flow collection (`{status: stable}`, `[a, b]`).
function flowEdit(target, order, src) {
  const { node } = target;
  const spans = node.items.map(itemSpan);
  if (spans.some((s) => !s)) return { reason: "an item has no position in the file" };
  const line = src.lineOf(node.range[0]);
  if (src.lineOf(node.range[1] - 1) !== line) return { reason: "it's written inline across several lines" };
  const text = src.text;
  const prefix = text.slice(node.range[0], spans[0][0]);
  const suffix = text.slice(spans[spans.length - 1][1], node.range[1]);
  const inner = order.map((i) => text.slice(spans[i][0], spans[i][1])).join(", ");
  const lineText = src.lines[line];
  const col = src.col(node.range[0]);
  const next = lineText.slice(0, col) + prefix + inner + suffix + lineText.slice(col + (node.range[1] - node.range[0]));
  return { from: line, to: line, lines: [next] };
}

// ---------------------------------------------------------------------------
// Formatting one document
// ---------------------------------------------------------------------------

// The data, with every map's keys sorted and `combos` lists sorted, so two documents that
// differ only in the order this tool changes compare equal.
function canonical(value, key) {
  if (Array.isArray(value)) {
    const items = value.map((v) => canonical(v));
    return key === "combos" ? items.map((v) => JSON.stringify(v)).sort() : items;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k], k)]));
  }
  return value;
}

const comments = (text) => text.split("\n").filter(isComment).map((l) => l.trim()).sort();

/**
 * Formats one document's text. Returns { text, changed, unfixable, error }. `unfixable` lists
 * collections that are out of order but couldn't be moved safely; they're left as they are.
 */
function formatText(original) {
  let text = original;
  const unfixable = new Map(); // pointer -> { pointer, reason, order }

  for (let pass = 0; pass < 100; pass++) {
    const doc = YAML.parseDocument(text);
    if (doc.errors.length) return { text: original, changed: false, unfixable: [], error: `doesn't parse: ${doc.errors[0].message}` };
    const src = new Lines(text);

    const needing = plan(doc)
      .map((target) => ({ target, order: desiredOrder(target) }))
      .filter(({ target, order }) => !unfixable.has(target.pointer) && order.some((from, to) => from !== to));
    if (!needing.length) break;

    // Innermost first: moving a block moves everything inside it, so a collection is only
    // edited once nothing inside it still needs to move. The next pass re-parses and continues.
    const contains = (a, b) => a !== b && a.range[0] <= b.range[0] && b.range[1] <= a.range[1];
    const innermost = needing.filter(({ target }) => !needing.some((other) => contains(target.node, other.target.node)));

    const edits = [];
    for (const { target, order } of innermost) {
      const edit = target.node.flow ? flowEdit(target, order, src) : blockEdit(target, order, src);
      if (edit.reason) {
        const names = target.how.keys
          ? order.map((i) => keyOf(target.node.items[i]))
          : order.map((i) => `#${i}`);
        unfixable.set(target.pointer, { pointer: target.pointer || "/", reason: edit.reason, order: names });
        continue;
      }
      if (edits.some((e) => e.from <= edit.to && edit.from <= e.to)) continue; // next pass
      edits.push(edit);
    }
    if (!edits.length) continue;

    const lines = [...src.lines];
    for (const { from, to, lines: replacement } of edits.sort((a, b) => b.from - a.from)) {
      lines.splice(from, to - from + 1, ...replacement);
    }
    text = lines.join("\n");
  }

  if (text !== original) {
    // Moving lines must never change what the document says. If it would, keep the original.
    const parse = (t) => jsYaml.load(t, { schema: jsYaml.JSON_SCHEMA });
    let same = false;
    try {
      same = JSON.stringify(canonical(parse(text))) === JSON.stringify(canonical(parse(original)));
    } catch {
      same = false;
    }
    const sameComments = JSON.stringify(comments(text)) === JSON.stringify(comments(original));
    const sameLength = text.split("\n").length === original.split("\n").length;
    if (!same || !sameComments || !sameLength) {
      return {
        text: original,
        changed: false,
        unfixable: [...unfixable.values()],
        error: "reordering would have changed the document's content, so it was left alone. This is a dsds-format bug - please report it",
      };
    }
  }
  return { text, changed: text !== original, unfixable: [...unfixable.values()] };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const HELP = `Usage: dsds-format [options] [file-or-folder ...]

Puts each DSDS document's fields in the order the style guide asks for, and
groups each entry's combos by subject. It only moves lines: text, comments and
wrapping stay as they are. Section, guideline-item and entry order are left
alone - dsds-lint reports those as advice. With no paths, formats the examples
that ship with DSDS.

Options:
  --check     Change nothing. Exit 1 if any file would change, or has
              something out of order that couldn't be moved automatically.
  --json      Print one JSON report to stdout instead of text.
  -h, --help  Show this help.

Exit codes:
  0  Done (or, with --check, nothing to change).
  1  With --check: a file needs formatting. Without it: a file couldn't be
     read, or a reorder was refused because it would have changed content.
  2  An option wasn't recognized.
`;

function collect(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(target, e.name);
    if (e.isDirectory()) return collect(p);
    return /\.ya?ml$/.test(e.name) ? [p] : [];
  });
}

function main() {
  const KNOWN = new Set(["--check", "--json", "--help", "-h"]);
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(HELP);
    return 0;
  }
  const unknown = args.filter((a) => a.startsWith("-") && !KNOWN.has(a));
  if (unknown.length) {
    console.error(`Unknown option: ${unknown.join(", ")}\n`);
    process.stderr.write(HELP);
    return 2;
  }
  const check = args.includes("--check");
  const json = args.includes("--json");
  const paths = args.filter((a) => !KNOWN.has(a));

  let files;
  try {
    files = paths.length ? paths.flatMap(collect) : defaultTargets();
  } catch (e) {
    console.error(`✗ ${e.message}`);
    return 1;
  }

  const results = files.map((file) => {
    const label = path.relative(process.cwd(), file);
    const original = fs.readFileSync(file, "utf-8");
    const result = formatText(original);
    if (result.changed && !check) fs.writeFileSync(file, result.text, "utf-8");
    return { file: label, ...result };
  });

  const changed = results.filter((r) => r.changed);
  const unfixable = results.filter((r) => r.unfixable.length);
  const errors = results.filter((r) => r.error);
  const failed = check ? changed.length > 0 || unfixable.length > 0 || errors.length > 0 : errors.length > 0;

  if (json) {
    const report = {
      tool: "dsds-format",
      check,
      ok: !failed,
      summary: { files: results.length, changed: changed.length, unfixable: unfixable.length, errors: errors.length },
      files: results.map(({ file, changed: c, unfixable: u, error }) => ({ file, changed: c, unfixable: u, error: error || null })),
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return failed ? 1 : 0;
  }

  for (const r of changed) console.log(`${check ? "✗ needs formatting" : "✓ formatted"}  ${r.file}`);
  for (const r of unfixable) {
    for (const u of r.unfixable) {
      console.log(`⚠ ${r.file} ${u.pointer}: out of order, but ${u.reason}. Reorder it by hand: ${u.order.join(", ")}`);
    }
  }
  for (const r of errors) console.error(`✗ ${r.file}: ${r.error}`);
  const verb = check ? "would change" : "changed";
  console.log(`\n${results.length} file(s) checked, ${changed.length} ${verb}${unfixable.length ? `, ${unfixable.length} with something to reorder by hand` : ""}.`);
  if (check && changed.length) console.log("Run dsds-format to fix.");
  return failed ? 1 : 0;
}

if (require.main === module) process.exit(main());

module.exports = { formatText, plan };
