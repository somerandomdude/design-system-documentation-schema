#!/usr/bin/env node
/**
 * The reference resolver: what a conforming consumer works out from a DSDS project, beyond what
 * is written in it. Implements the processing model (site/content/processing.mdx), and is what
 * the consumer test vectors in examples/vectors/ are generated from and checked against.
 *
 * Given every document in a project, it produces:
 *
 *   - every item's address (§2): its `id`, or the one derived from its text, or the one it
 *     inherits by reusing another item;
 *   - every reused item's effective content (§4): its own fields, with the rest taken from the
 *     item it reuses through `same-as`, following a chain to the item that states it;
 *   - every relationship seen from its target (§5), since a relationship is written only on its
 *     source;
 *   - every deprecated thing's successors (§7), following `replaced-by` through successors
 *     that are themselves deprecated;
 *   - every inline link in a Markdown field (§2.4): what it resolves to, and the text an
 *     autolink shows. Listed on its own, never as a relationship;
 *   - the problems found on the way, each with a code the processing model defines.
 *
 * It never merges an `extends` target into the entry that extends it (§6).
 *
 * Usage: node scripts/resolve/resolve.js <files…>   (prints the resolved project as JSON)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { loadYaml, entriesIn, findRefs, itemAddresses, resolveAddress, ownerOf, inlineLinksIn, TO_PATTERN } = require("../lib");

// The fields that make up an item's content, per section kind (§4).
const CONTENT_FIELDS = {
  guidelines: ["level", "statement", "checkedBy"],
  definitions: ["term", "definition", "usage"],
  steps: ["title", "description"],
};

// Relations a consumer follows from one thing to the next, and so must not loop (§9).
const CHAINED_RELS = ["uses", "extends", "same-as", "replaced-by"];

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

// JSON Pointers in document order: numeric segments compare as numbers.
function comparePointers(a, b) {
  const x = a.split("/");
  const y = b.split("/");
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] === y[i]) continue;
    const nx = Number(x[i]);
    const ny = Number(y[i]);
    if (Number.isInteger(nx) && Number.isInteger(ny)) return nx - ny;
    return x[i] < y[i] ? -1 : 1;
  }
  return x.length - y.length;
}

function isDeprecated(holder) {
  const status = holder && (holder.metadata ? holder.metadata.status : holder.status);
  const all = Array.isArray(status) ? status : status ? [status] : [];
  return all.some((s) => isObject(s) && s.status === "deprecated");
}

/**
 * Resolves a project. `documents` is a list of parsed DSDS documents (base documents or
 * standalone entries), already gathered the way §3 describes.
 */
function resolveProject(documents) {
  const problems = [];
  const problem = (code, at, message) => problems.push({ code, at, message });
  // A loop is one problem, however many of its members it's found from.
  const loopsSeen = new Set();
  const loop = (rel, members) => {
    const key = `${rel}:${[...new Set(members)].sort().join(",")}`;
    if (loopsSeen.has(key)) return;
    loopsSeen.add(key);
    problem("cycle", members[0], `${rel} chain loops: ${members.join(" -> ")}`);
  };

  // Entities, by id. The first definition of an id wins; a second is a problem (DSDS-04).
  const entities = new Map();
  for (const doc of documents) {
    for (const entity of entriesIn(doc)) {
      if (!isObject(entity) || typeof entity.id !== "string") continue;
      if (entities.has(entity.id)) {
        problem("duplicate-entry", entity.id, `"${entity.id}" is defined more than once in the project`);
        continue;
      }
      entities.set(entity.id, { entity, book: itemAddresses(entity) });
    }
  }

  // Every address, with the address it resolves to on its entity (§2).
  const lookup = (target) => {
    const hash = target.indexOf("#");
    const entityId = hash === -1 ? target : target.slice(0, hash);
    const known = entities.get(entityId);
    if (!known) return { error: "unresolved-entry", entityId };
    if (hash === -1) return { entityId, known };
    const address = target.slice(hash + 1);
    const { candidate, ambiguous } = resolveAddress(known.book, address);
    if (ambiguous) return { error: "ambiguous-address", entityId, address, ambiguous };
    if (!candidate) return { error: "unresolved-item", entityId, address };
    return { entityId, known, address, candidate };
  };
  const describe = (r, target) =>
    r.error === "unresolved-entry"
      ? `"${target}" names "${r.entityId}", which isn't in the project`
      : r.error === "ambiguous-address"
        ? `"${target}" names ${r.ambiguous.length} items on "${r.entityId}" (${r.ambiguous.map((c) => c.pointer).join(", ")})`
        : `"${target}" names no item on "${r.entityId}"`;

  // Every ref, once, with the thing that owns it: an item address, or the entity itself.
  const refs = [];
  for (const [id, { entity, book }] of entities) {
    const found = [];
    findRefs(entity, "", found);
    for (const ref of found) {
      if (ref.to.includes("://")) continue;
      const owner = ownerOf(book, ref.pointer);
      refs.push({ ...ref, from: id, owner, fromLabel: owner ? `${id}#${owner.address}` : id });
    }
  }

  // §4: an item's effective content, following same-as to the item that states it.
  function sameAsOf(item) {
    return Array.isArray(item.refs) ? item.refs.find((r) => isObject(r) && r.rel === "same-as" && typeof r.to === "string") : null;
  }
  // `seen` tracks locations, not addresses: an item that only reuses another takes its address,
  // so on one entry the two share it. Labels (`entity#address`) are for messages.
  function effective(entityId, address, candidate, seen = []) {
    const location = `${entityId}${candidate.pointer}`;
    const key = `${entityId}#${address}`;
    const fields = CONTENT_FIELDS[candidate.sectionKind] || [];
    const own = Object.fromEntries(fields.filter((f) => candidate.target[f] !== undefined).map((f) => [f, candidate.target[f]]));
    const link = sameAsOf(candidate.target);
    if (!link) return { content: own };
    if (seen.some((s) => s.location === location)) {
      const at = seen.findIndex((s) => s.location === location);
      return { content: own, cycle: [...seen.slice(at).map((s) => s.key), key] };
    }
    const r = lookup(link.to);
    if (r.error || !r.candidate) return { content: own, reuses: link.to, broken: r.error ? describe(r, link.to) : `"${link.to}" doesn't name an item` };
    if (r.candidate.type !== "item" || r.candidate.sectionKind !== candidate.sectionKind) {
      return { content: own, reuses: link.to, kindMismatch: `a ${candidate.sectionKind} item reuses ${r.candidate.sectionKind ? `a ${r.candidate.sectionKind} item` : `a ${r.candidate.type}`}` };
    }
    const next = effective(r.entityId, r.address, r.candidate, [...seen, { location, key }]);
    if (next.cycle || next.broken || next.kindMismatch) return { ...next, content: { ...next.content, ...own }, reuses: link.to };
    if (own.level !== undefined && next.content.level !== undefined && own.level !== next.content.level) {
      problem("level-mismatch", key, `declares level "${own.level}" but reuses "${link.to}", which declares "${next.content.level}"`);
    }
    return { content: { ...next.content, ...own }, reuses: link.to, origin: next.origin || `${r.entityId}#${r.address}` };
  }

  // §7: successors, following replaced-by through deprecated successors.
  const successorRefs = new Map(); // owner label -> [targets]
  for (const ref of refs) {
    if (ref.rel !== "replaced-by") continue;
    if (!successorRefs.has(ref.fromLabel)) successorRefs.set(ref.fromLabel, []);
    successorRefs.get(ref.fromLabel).push(ref.to);
  }
  function holderOf(label) {
    const r = lookup(label);
    if (r.error) return null;
    return r.candidate ? r.candidate.target : r.known.entity;
  }
  function successorsOf(label, path = [label]) {
    const out = [];
    for (const target of successorRefs.get(label) || []) {
      const r = lookup(target);
      if (r.error) {
        problem(r.error, label, `replaced-by ${describe(r, target)}`);
        continue;
      }
      const canonical = r.address ? `${r.entityId}#${r.address}` : r.entityId;
      if (path.includes(canonical)) {
        loop("replaced-by", [...path.slice(path.indexOf(canonical)), canonical]);
        continue;
      }
      const holder = holderOf(canonical);
      if (isDeprecated(holder) && successorRefs.has(canonical)) out.push(...successorsOf(canonical, [...path, canonical]));
      else out.push(canonical);
    }
    return [...new Set(out)];
  }
  const successionFor = (label, holder) => {
    if (!successorRefs.has(label)) return undefined;
    if (!isDeprecated(holder)) {
      problem("replaced-by-not-deprecated", label, "has a replaced-by ref but isn't deprecated");
    }
    const successors = successorsOf(label);
    return { replacedBy: successorRefs.get(label), successors, choose: successors.length > 1 };
  };

  // §9: uses and extends must not loop between entries. (same-as and replaced-by loops are
  // reported where they're followed, above.)
  for (const rel of ["uses", "extends"]) {
    const edges = new Map();
    for (const ref of refs) {
      if (ref.rel !== rel || ref.to.includes("#")) continue;
      if (!edges.has(ref.from)) edges.set(ref.from, []);
      edges.get(ref.from).push(ref.to);
    }
    const state = new Map();
    const stack = [];
    const visit = (node) => {
      state.set(node, 1);
      stack.push(node);
      for (const next of edges.get(node) || []) {
        if (state.get(next) === 1) loop(rel, [...stack.slice(stack.indexOf(next)), next]);
        else if (!state.has(next)) visit(next);
      }
      stack.pop();
      state.set(node, 2);
    };
    for (const node of edges.keys()) if (!state.has(node)) visit(node);
  }

  // Every ref with a target that doesn't resolve, and replaced-by where nothing can be replaced.
  for (const ref of refs) {
    if (ref.rel === "replaced-by" && ref.owner && !["trait", "value"].includes(ref.owner.candidate.type)) {
      problem("replaced-by-misplaced", ref.fromLabel, "replaced-by belongs on a deprecated entry, trait or trait value, not an item");
    }
    const r = lookup(ref.to);
    if (r.error) problem(r.error, ref.fromLabel, `${ref.rel} ${describe(r, ref.to)}`);
  }

  // Assemble, in document order.
  const out = [];
  for (const [id, { entity, book }] of entities) {
    const items = [];
    for (const [address, candidates] of book) {
      for (const c of candidates) {
        const item = { address, type: c.type, source: c.source, pointer: c.pointer };
        if (c.type === "item") {
          const e = effective(id, address, c);
          if (e.cycle) loop("same-as", e.cycle);
          if (e.kindMismatch) problem("same-as-kind", `${id}#${address}`, `same-as target is a different kind of item: ${e.kindMismatch}`);
          if (e.reuses) {
            item.reuses = e.reuses;
            if (e.origin) item.origin = e.origin;
          }
          item.content = e.content;
        }
        if (c.type === "trait" || c.type === "value") {
          const succession = successionFor(`${id}#${address}`, c.target);
          if (succession) item.succession = succession;
        }
        items.push(item);
      }
    }
    items.sort((a, b) => comparePointers(a.pointer, b.pointer));

    const incoming = refs
      .filter((ref) => {
        const hash = ref.to.indexOf("#");
        return (hash === -1 ? ref.to : ref.to.slice(0, hash)) === id;
      })
      .map((ref) => {
        const hash = ref.to.indexOf("#");
        // `pointer` says exactly which ref this is: two items on one entry can share an address.
        return { rel: ref.rel, from: ref.fromLabel, pointer: `${ref.from}${ref.pointer}`, ...(hash === -1 ? {} : { at: ref.to.slice(hash + 1) }) };
      })
      .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : comparePointers(a.pointer, b.pointer) || (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0)));

    const resolved = { id, kind: entity.kind ?? null, items };
    if (incoming.length) resolved.incoming = incoming;
    const succession = successionFor(id, entity);
    if (succession) resolved.succession = succession;
    out.push(resolved);
  }

  // §2.4: inline links. Kept apart from `incoming`: a mention isn't a relationship (§5).
  // The text an autolink shows: an entry's name, a definition's term, a step's or freeform
  // entry's title, a trait's or value's name - else the target itself. A reusing item's
  // effective content counts, so a reused definition shows the term it reuses.
  const displayText = (r, target) => {
    if (r.error) return target;
    if (!r.candidate) return typeof r.known.entity.name === "string" ? r.known.entity.name : target;
    const c = r.candidate;
    if (c.type === "item") {
      const content = effective(r.entityId, r.address, c).content;
      const field = { definitions: "term", steps: "title" }[c.sectionKind];
      return field && typeof content[field] === "string" ? content[field] : target;
    }
    if (c.type === "freeform") return typeof c.target.title === "string" ? c.target.title : target;
    if (c.type === "trait" || c.type === "value") return typeof c.target.name === "string" ? c.target.name : target;
    return target;
  };
  const inlineLinks = [];
  for (const [id, { entity, book }] of entities) {
    const { links, skipped } = inlineLinksIn(entity);
    if (skipped) problem("inline-links-skipped", id, `inline links weren't read: ${skipped}`);
    // Document order within each entry: by field, then by where the link starts in it.
    links.sort((a, b) => comparePointers(a.pointer, b.pointer) || a.offset - b.offset);
    for (const link of links) {
      const owner = ownerOf(book, link.pointer);
      const from = owner ? `${id}#${owner.address}` : id;
      const out = { from, pointer: `${id}${link.pointer}`, offset: link.offset, form: link.form, target: link.target };
      if (!TO_PATTERN.test(link.target)) {
        problem("malformed-link", from, `inline link "dsds:${link.target}" isn't shaped like a \`to\``);
        if (link.form !== "reference") out.text = link.form === "inline" ? link.text : link.target;
        inlineLinks.push(out);
        continue;
      }
      const r = lookup(link.target);
      if (r.error) problem(r.error, from, `inline link ${describe(r, link.target)}`);
      else out.resolves = r.address ? `${r.entityId}#${r.address}` : r.entityId;
      // A reference definition has no text of its own: the `[text][x]` that uses it does.
      if (link.form === "inline") out.text = link.text;
      else if (link.form === "autolink") out.text = displayText(r, link.target);
      inlineLinks.push(out);
    }
  }


  const seen = new Set();
  const unique = problems.filter((p) => {
    const key = JSON.stringify(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.code < b.code ? -1 : a.code > b.code ? 1 : a.message < b.message ? -1 : 1));
  // `inlineLinks` only when there are some, so a project without them resolves exactly as it
  // did before inline links existed.
  return { entries: out, ...(inlineLinks.length ? { inlineLinks } : {}), problems: unique };
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length || files.includes("--help") || files.includes("-h")) {
    console.log("Usage: node scripts/resolve/resolve.js <files…>\nResolves the files as one project and prints the result as JSON.");
    process.exit(files.length ? 0 : 1);
  }
  const docs = files.map((f) => loadYaml(path.resolve(f)));
  process.stdout.write(`${JSON.stringify(resolveProject(docs), null, 2)}\n`);
}

module.exports = { resolveProject, CHAINED_RELS, CONTENT_FIELDS };
