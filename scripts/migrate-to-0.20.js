#!/usr/bin/env node
/**
 * migrate-to-0.20.js — Migrate DSDS 0.15.2 (`.dsds.json`, entity/
 * documentBlocks model) documents to 0.20.0 (`.dsds.yaml`, entry/sections
 * model).
 *
 * Unlike scripts/migrate-to-0.14.js (the template this borrows its CLI
 * shape and report convention from), 0.20.0 isn't a set of compatible
 * in-place renames — it's a different document model, so this transform
 * builds a brand-new document rather than mutating the old one. The
 * mapping is the CHANGELOG's own 0.20.0 "Breaking changes" list, applied
 * mechanically wherever a field has one clear new home, and reported via
 * `report.manual` wherever it doesn't (a few old shapes — most notably the
 * `api` block's inline property/event/slot documentation — have no 0.20.0
 * equivalent at all: 0.20.0 points `sourceFiles` at real source instead of
 * inlining an extracted API, and this script has no way to invent that
 * path from nothing).
 *
 * Never silently drops data it can't place: anything without a clean new
 * home is stashed under the migrated item's own `$extensions["com.dsds.
 * migration"]` (section items gained their own `$extensions` in 0.20.0
 * specifically so this kind of per-item escape hatch is possible) and
 * flagged in the report, instead of just vanishing.
 *
 * What this does NOT attempt:
 *   - `$ref`-based entities inside `entityGroups` (not resolved/followed —
 *     migrate the referenced file separately).
 *   - The `api` block's inline interface documentation (see above).
 *   - Re-deriving a schema-valid document on its own: run `npm run
 *     validate` on the output afterward. A best-effort migration plus a
 *     real validator catching what's still wrong is more honest than a
 *     migration that claims to always produce something valid.
 *
 * Usage:
 *   node scripts/migrate-to-0.20.js <files-or-dirs…> [--dry-run]
 *
 * Reads *.dsds.json (0.15.2), writes a sibling *.dsds.yaml (0.20.0) next
 * to it — never overwrites the input, so a bad migration costs nothing to
 * throw away and retry.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const TARGET_VERSION = "0.20.0";
// common/id.schema.yaml's own base pattern - used to sanity-check a value
// that's *supposed* to be an id before emitting a `to:` ref from it. A few
// 0.15.2 fields (use-case alternative.identifier in particular) were
// occasionally authored as free text instead of a real machine id.
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$/;
// Reset per migrateDoc() call (see there) - a token-group's own identifier
// stops existing once its children flatten to top-level entries, so a
// relationship/ref that pointed at the *group* (not one of its members) is
// now genuinely dangling. Tracked so that specific case gets its own
// clearer report line instead of an unexplained "unknown entry" warning
// from `npm run validate` afterward.
let DISSOLVED_GROUP_IDS = new Set();

// ---------------------------------------------------------------------------
// Relationship / link → ref
// ---------------------------------------------------------------------------

// Old link `kind` values with a direct 0.20.0 `rel` equivalent; anything
// else becomes `external-link` with the original kind preserved as `role`
// so it isn't lost, just no longer load-bearing.
const LINK_KIND_TO_REL = { source: "source", design: "design", storybook: "storybook", package: "package" };

function migrateRefs(old, report, label) {
  const refs = [];
  for (const rel of old.relationships || []) {
    if (typeof rel.target !== "string" || typeof rel.relation !== "string") {
      report.manual.push(`${label}: a relationship with no target/relation was dropped`);
      continue;
    }
    const ref = { to: rel.target, rel: rel.relation };
    if (rel.role) ref.note = rel.role;
    refs.push(ref);
  }
  const links = (old.metadata && old.metadata.links) || [];
  for (const link of links) {
    if (typeof link.url !== "string") continue;
    const rel = LINK_KIND_TO_REL[link.kind] || "external-link";
    const ref = { href: link.url, rel };
    if (rel === "external-link" && link.kind) ref.role = link.kind;
    if (link.label && rel !== "external-link") ref.role = link.label;
    refs.push(ref);
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

function migrateMetadata(old, report, label) {
  const m = old.metadata;
  if (!m || typeof m !== "object") return undefined;
  const out = {};

  // status/since/deprecationNotice/note/platform - already a compatible
  // shape, except 0.20.0 always requires the object form (no bare-string
  // shorthand the way 0.15.2 allowed for the common case), and except the
  // per-platform form handled below.
  if (typeof m.status === "string") {
    out.status = { status: m.status };
  } else if (m.status && (m.status.overall !== undefined || m.status.platforms !== undefined)) {
    // 0.15.2 modelled status as { overall, platforms: { react: {...}, … } }
    // - a map keyed by platform, plus a separately authored overall.
    // 0.20.0 keeps the per-platform facts and drops the authored overall:
    // `status` takes either one object or a list of them, each naming its
    // own `platform`, and a consumer derives the overall status from the
    // aggregate (see entry-metadata.schema.yaml's own $comment and the
    // Conformance page's "Status across platforms").
    //
    // So the map becomes a list, and `overall` is dropped rather than
    // carried across - it's derivable now, and keeping it would reintroduce
    // the second source of truth the list form exists to remove.
    const platforms = m.status.platforms;
    const platformNames = platforms && typeof platforms === "object" ? Object.keys(platforms) : [];

    if (platformNames.length) {
      out.status = platformNames.map((platform) => {
        const entry = platforms[platform];
        const base = typeof entry === "string" ? { status: entry } : { ...entry };
        return { platform, ...base };
      });
      if (m.status.overall !== undefined) {
        report.manual.push(`${label}: dropped the authored \`status.overall\` ("${m.status.overall}") - 0.20.0 infers an entry's overall status from its per-platform entries (${platformNames.join(", ")}) rather than storing a second copy. Confirm the aggregate still reads the way you intend.`);
      }
    } else if (m.status.overall !== undefined) {
      out.status = { status: m.status.overall };
    }
  } else if (m.status) {
    out.status = m.status;
  }
  // 0.20.0 keeps metadata.since (the version an entry was introduced),
  // unchanged from 0.15.2. It was silently dropped here.
  if (m.since !== undefined) out.since = m.since;
  if (Array.isArray(m.tags) && m.tags.length) out.tags = m.tags.slice();
  if (Array.isArray(m.aliases) && m.aliases.length) out.aliases = m.aliases.slice();

  if (m.governance && typeof m.governance === "object") {
    const owner = m.governance.owner;
    if (typeof owner === "string") out.owner = owner;
    else if (owner && typeof owner === "object") {
      // {name, contact} -> one mailbox-ish string, per the CHANGELOG's own
      // stated mapping. Prefer contact (usually the actual reachable
      // address/channel); fall back to name.
      out.owner = owner.contact || owner.name;
      if (owner.contact && owner.name && owner.contact !== owner.name) {
        report.manual.push(`${label}: governance.owner had both name ("${owner.name}") and contact ("${owner.contact}") - kept contact as the new plain-string owner, name dropped`);
      }
    }
    const lr = m.governance.lastReviewed;
    if (lr) {
      out.reviewed = out.reviewed || [];
      if (typeof lr === "string") out.reviewed.push({ date: lr });
      else out.reviewed.push({ date: lr.date, by: lr.reviewedBy, note: lr.note });
    }
  }

  if (m.docOrigin) {
    const o = typeof m.docOrigin === "string" ? { method: m.docOrigin } : m.docOrigin;
    out.origin = {};
    if (o.method) out.origin.method = o.method;
    if (o.author) out.origin.author = o.author;
    if (o.note) out.origin.note = o.note;
  }

  if (m.lastUpdated) {
    out.updated = typeof m.lastUpdated === "string" ? { date: m.lastUpdated } : { date: m.lastUpdated.date, note: m.lastUpdated.note };
  }

  // No clean 0.20.0 home: category (folded into tags[0]-as-category
  // convention instead - prepend it as the first tag), summary/thumbnail/
  // preview (compact-display fields with no equivalent), extends (entity
  // inheritance - 0.20.0's `extends` lives on the entry itself, not
  // metadata; not auto-migrated since it needs the *new* target id).
  if (m.category && !(out.tags || []).includes(m.category)) {
    out.tags = [m.category, ...(out.tags || [])];
  }
  for (const field of ["summary", "thumbnail", "preview", "extends"]) {
    if (m[field] !== undefined) {
      report.manual.push(`${label}: metadata.${field} has no 0.20.0 equivalent - review and place by hand (kept in $extensions for now)`);
    }
  }

  return { clean: out, dropped: { summary: m.summary, thumbnail: m.thumbnail, preview: m.preview, extends: m.extends } };
}

// ---------------------------------------------------------------------------
// documentBlocks / agentDocumentBlocks -> sections[] + top-level traits
// ---------------------------------------------------------------------------

function migrateGuidelineItem(old, report, label) {
  const item = { level: old.level || "should" };
  if (old.guidance) item.statement = old.guidance;
  else report.manual.push(`${label}: guideline had no guidance text`);

  if (old.category) item.tags = [old.category];

  if (Array.isArray(old.references) && old.references.length) {
    item.evidence = old.references
      .filter((r) => r && typeof r.url === "string")
      .map((r) => ({ href: r.url, rel: "external-link", ...(r.label ? { note: r.label } : {}) }));
  }

  if (Array.isArray(old.criteria) && old.criteria.length) {
    const [first, ...rest] = old.criteria;
    if (first.verification) item.checkedBy = first.verification;
    if (first.check && typeof first.check === "object" && first.check.target) {
      item.checks = [{ href: first.check.target, rel: "test" }];
    }
    if (rest.length) {
      report.manual.push(`${label}: guideline had ${old.criteria.length} criteria - 0.20.0 has one checkedBy per item, only the first was kept`);
    }
  }

  const extra = {};
  if (old.rationale) extra.rationale = old.rationale;
  if (typeof old.evidence === "string") extra.evidenceNote = old.evidence;
  if (old.target) extra.target = old.target;
  if (Object.keys(extra).length) {
    item.$extensions = { "com.dsds.migration": extra };
    report.manual.push(`${label}: rationale/evidence-note/target text couldn't be placed in a typed 0.20.0 field - preserved in $extensions["com.dsds.migration"], review and place by hand`);
  }
  return item;
}

function migrateBlock(block, sections, traits, entry, report, label, forAudience) {
  const kind = block.kind;
  switch (kind) {
    case "guidelines": {
      const items = (block.entries || block.items || []).map((g) => migrateGuidelineItem(g, report, `${label} guidelines`));
      if (items.length) sections.push({ kind: "guidelines", for: forAudience, items });
      return;
    }
    case "use-cases": {
      const items = (block.items || []).map((u) => {
        const item = {
          statement: u.description,
          level: u.stance === "recommended" ? "should" : "should-not",
        };
        if (u.alternative && u.alternative.identifier) {
          if (ID_PATTERN.test(u.alternative.identifier)) {
            item.alternatives = [{ to: u.alternative.identifier, rel: "alternative-to" }];
          } else {
            item.$extensions = { "com.dsds.migration": { alternative: u.alternative.identifier } };
            report.manual.push(`${label}: use-case alternative "${u.alternative.identifier}" isn't id-shaped (probably free text in the source) - can't become a \`to:\` ref, kept in $extensions`);
          }
        }
        return item;
      });
      if (items.length) sections.push({ kind: "guidelines", for: forAudience, framing: "when-to-use", items });
      return;
    }
    case "steps":
    case "checklist": {
      const items = (block.items || block.entries || []).map((s) => {
        const item = { title: s.label || s.title || "Untitled step" };
        const descParts = [s.instruction, s.expectedResult ? `Expected result: ${s.expectedResult}` : null].filter(Boolean);
        if (descParts.length) item.description = descParts.join("\n\n");
        return item;
      });
      if (items.length) sections.push({ kind: "steps", for: forAudience, ordered: kind === "steps", items });
      return;
    }
    case "anatomy": {
      const items = (block.entries || block.items || []).map((a) => {
        const item = { id: a.identifier, term: a.name || a.identifier, definition: a.description || "" };
        if (a.required) item.usage = "Always present in the rendered output.";
        return item;
      });
      if (items.length) sections.push({ kind: "definitions", for: forAudience, context: "anatomy", items });
      return;
    }
    case "accessibility": {
      const kb = block.keyboardInteractions || [];
      const items = kb.map((k) => ({ term: k.key, definition: k.context ? `${k.action} (${k.context})` : k.action }));
      if (items.length) sections.push({ kind: "definitions", for: forAudience, context: "keyboard", items });
      const otherFields = ["ariaAttributes", "screenReaderAnnouncements", "focusBehaviors", "colorContrastPairs", "reducedMotion"].filter((f) => block[f]);
      if (otherFields.length) {
        report.manual.push(`${label}: accessibility block's ${otherFields.join("/")} have no 0.20.0 structured equivalent - review and re-add by hand (as guidelines items, most likely)`);
      }
      return;
    }
    case "variants": {
      for (const dim of block.entries || block.items || []) {
        const trait = {
          kind: "enum",
          id: dim.identifier,
          name: dim.name,
          description: dim.description || "",
          values: (dim.values || []).map((v) => ({ id: v.identifier, name: v.name, description: v.description || "" })),
        };
        if (dim.type === "flag" || !Array.isArray(dim.values) || !dim.values.length) {
          traits.push({ kind: "boolean", id: dim.identifier, name: dim.name, description: dim.description || "" });
        } else {
          traits.push(trait);
        }
      }
      return;
    }
    case "states": {
      for (const st of block.entries || block.items || []) {
        traits.push({ kind: "boolean", id: st.identifier, name: st.name, description: st.description || "", setBy: "component" });
      }
      return;
    }
    case "api": {
      report.manual.push(`${label}: api block dropped - 0.20.0 points \`sourceFiles\` at real source instead of inlining an extracted API; add a sourceFiles entry by hand and delete this note`);
      return;
    }
    case "imports": {
      const items = (block.entries || block.items || []).filter((i) => i.platform && i.code);
      if (items.length) {
        entry.imports = (entry.imports || []).concat(
          items.map((i) => ({ platform: i.platform, code: i.code, ...(i.package ? { package: i.package } : {}) })),
        );
      }
      return;
    }
    default: {
      // content / sections (nested) / motion / principles / design-specifications
      // / anything else with no structural mapping - preserved as freeform
      // prose rather than dropped, flagged for a human to re-type properly.
      const freeformItems = [];
      const rawItems = block.entries || block.items || [];
      for (const it of rawItems) {
        const title = it.title || it.identifier || it.name || "Untitled";
        const body = it.body || it.description || JSON.stringify(it);
        freeformItems.push({ title, body: typeof body === "string" ? body : JSON.stringify(body) });
      }
      if (freeformItems.length) {
        sections.push({ kind: "section", for: forAudience, title: block.title || kind, context: undefined, freeform: freeformItems });
        report.manual.push(`${label}: "${kind}" block has no direct 0.20.0 section kind - converted to a generic freeform section, review and re-type as guidelines/definitions/steps if it fits one`);
      } else if (rawItems.length === 0 && Object.keys(block).length > 1) {
        report.manual.push(`${label}: "${kind}" block content couldn't be automatically converted - migrate by hand`);
      }
    }
  }
}

function migrateBlocks(blocks, forAudience, sections, traits, entry, report, label) {
  for (const block of blocks) {
    if (!block || typeof block.kind !== "string") continue;
    migrateBlock(block, sections, traits, entry, report, `${label} (${forAudience})`, forAudience);
  }
}

// ---------------------------------------------------------------------------
// Entity -> entry
// ---------------------------------------------------------------------------

const KIND_MAP = { foundation: "entry", pattern: "entry", guide: "entry" };

function migrateEntity(old, report) {
  if (!old || typeof old !== "object") return [];

  if (old.kind === "token-group") {
    const groupLabel = old.name || old.identifier || "group";
    const children = old.children || [];
    if (!children.length) {
      report.manual.push(`token-group "${old.identifier}" has no children - nothing to flatten`);
    }
    if (old.identifier) DISSOLVED_GROUP_IDS.add(old.identifier);
    return children.flatMap((child) => {
      const migrated = migrateEntity(child, report);
      for (const c of migrated) {
        c.metadata = c.metadata || {};
        c.metadata.group = groupLabel;
      }
      return migrated;
    });
  }

  if (typeof old.identifier !== "string") {
    report.manual.push(`entity with no identifier (kind: ${old.kind}, name: ${old.name}) - skipped, migrate by hand`);
    return [];
  }
  const label = `"${old.identifier}"`;

  // chunk's own top-level guidelines/useCases shorthand, same fold the
  // 0.14 migration already did - do it here too, before this entity's
  // documentBlocks get walked, so shorthand content isn't lost.
  if (old.kind === "chunk") {
    for (const [prop, blockKind] of [["guidelines", "guidelines"], ["useCases", "use-cases"]]) {
      if (Array.isArray(old[prop]) && old[prop].length) {
        old.documentBlocks = old.documentBlocks || [];
        old.documentBlocks.push({ kind: blockKind, entries: old[prop] });
      }
    }
  }

  const kind = KIND_MAP[old.kind] || old.kind; // component/token/theme pass through; chunk -> entry falls through the map miss below
  const finalKind = kind === "chunk" ? "entry" : kind;

  const entry = { id: old.identifier, kind: finalKind, name: old.name || old.identifier, description: old.description || "" };

  const metaResult = migrateMetadata(old, report, label);
  if (metaResult) {
    entry.metadata = metaResult.clean;
    if (Object.keys(entry.metadata).length === 0) delete entry.metadata;
    // migrateMetadata() computes a `dropped` bucket for the metadata fields
    // with no typed 0.20.0 home (summary/thumbnail/preview/extends) and its
    // report line promises they were "kept in $extensions" — but nothing
    // ever read the bucket, so they were silently lost. Stash them for real,
    // under the same namespace every other unplaceable value in this script
    // uses (see the header comment and the Stability page's own statement
    // that nothing is dropped).
    const carried = Object.fromEntries(
      Object.entries(metaResult.dropped || {}).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(carried).length) {
      entry.$extensions = {
        ...(entry.$extensions || {}),
        "com.dsds.migration": { ...(entry.$extensions?.["com.dsds.migration"] || {}), ...carried },
      };
    }
  }

  const refs = migrateRefs(old, report, label);
  if (refs.length) entry.refs = refs;

  const sections = [];
  const traits = [];
  migrateBlocks(old.documentBlocks || [], "human", sections, traits, entry, report, label);
  migrateBlocks(old.agentDocumentBlocks || [], "agent", sections, traits, entry, report, label);
  if (sections.length) entry.sections = sections;
  if (traits.length) {
    if (finalKind === "component") entry.traits = traits;
    else report.manual.push(`${label}: had variants/states but kind is "${finalKind}", not "component" - traits dropped, migrate by hand`);
  }

  return [entry];
}

// ---------------------------------------------------------------------------
// Whole document
// ---------------------------------------------------------------------------

function systemEntryFrom(systemInfo, report) {
  const id = (systemInfo.name || "system").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "system";
  const entry = {
    id,
    kind: "system",
    name: systemInfo.name || "Design System",
    description: `The design system as a whole.`,
  };
  const metadata = {};
  if (systemInfo.version) metadata.version = systemInfo.version;
  if (systemInfo.organization) metadata.organization = systemInfo.organization;
  if (systemInfo.url) metadata.url = systemInfo.url;
  if (systemInfo.license) metadata.license = systemInfo.license;
  if (Object.keys(metadata).length) entry.metadata = metadata;
  return entry;
}

function migrateDoc(old, report) {
  DISSOLVED_GROUP_IDS = new Set();
  const entries = [];

  // Root-level documentBlocks/agentDocumentBlocks (system-wide docs, not
  // tied to any one entity - an "Overview" sections block, system-wide
  // use-cases/guidelines) have nowhere to live at the 0.20.0 document root
  // at all (base.schema.yaml has no sections field of its own) - they
  // become the synthesized system entry's own `sections`, same as
  // systemInfo's own facts became that entry's `metadata`.
  const hasRootBlocks = (old.documentBlocks || []).length || (old.agentDocumentBlocks || []).length;
  let systemEntry = old.systemInfo ? systemEntryFrom(old.systemInfo, report) : null;
  if (hasRootBlocks) {
    if (!systemEntry) {
      systemEntry = { id: "system", kind: "system", name: "Design System", description: "The design system as a whole." };
      report.manual.push(`root documentBlocks existed with no systemInfo - synthesized a placeholder system entry ("system"/"Design System"), rename it`);
    }
    const sections = [];
    const traits = []; // a root block using variants/states would be unusual; still routed through the same function for consistency
    migrateBlocks(old.documentBlocks || [], "human", sections, traits, systemEntry, report, "root");
    migrateBlocks(old.agentDocumentBlocks || [], "agent", sections, traits, systemEntry, report, "root");
    if (sections.length) systemEntry.sections = sections;
    if (traits.length) report.manual.push(`root documentBlocks produced traits, which don't belong on a system entry - migrate by hand`);
  }
  if (systemEntry) entries.push(systemEntry);

  const oldEntities = [];
  if (old.entity) oldEntities.push(old.entity);
  for (const group of old.entityGroups || []) {
    for (const e of group.entities || []) {
      if (e && e.$ref) {
        report.manual.push(`entityGroups: a $ref-based entity ("${e.$ref}") wasn't followed - migrate the referenced file separately and add it by hand`);
        continue;
      }
      oldEntities.push(e);
    }
  }

  for (const oldEntity of oldEntities) {
    entries.push(...migrateEntity(oldEntity, report));
  }

  if (DISSOLVED_GROUP_IDS.size) {
    for (const entry of entries) {
      for (const ref of entry.refs || []) {
        if (typeof ref.to === "string" && DISSOLVED_GROUP_IDS.has(ref.to)) {
          report.manual.push(`"${entry.id}" ref (rel: ${ref.rel}) points at "${ref.to}", which was a token-group identifier before its children flattened to top-level entries - it no longer exists as one id. Point at a real member token instead, or drop the ref.`);
        }
      }
    }
  }

  return {
    schemaVersion: TARGET_VERSION,
    name: (old.systemInfo && old.systemInfo.name) || "Migrated design system",
    entries,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const out = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.name.endsWith(".dsds.json")) out.push(full);
  }
  return out.sort();
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const targets = args.filter((a) => !a.startsWith("--"));
  if (targets.length === 0) {
    console.error("Usage: node scripts/migrate-to-0.20.js <files-or-dirs…> [--dry-run]");
    process.exit(1);
  }

  let migrated = 0;
  let needsHuman = 0;
  for (const filePath of targets.flatMap(collectFiles)) {
    const old = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const report = { manual: [] };
    const newDoc = migrateDoc(old, report);
    const rel = path.relative(process.cwd(), filePath);
    const outPath = filePath.replace(/\.dsds\.json$/, ".dsds.yaml");

    if (!dryRun) {
      fs.writeFileSync(outPath, yaml.dump(newDoc, { lineWidth: -1, noRefs: true }), "utf-8");
    }
    migrated++;
    console.log(`  ${dryRun ? "would write" : "✓ wrote"} ${path.relative(process.cwd(), outPath)}  ←  ${rel}`);
    for (const m of report.manual) {
      needsHuman++;
      console.log(`      ⚠ ${m}`);
    }
  }
  console.log(
    `\n${migrated} file(s) ${dryRun ? "would be " : ""}migrated, ${needsHuman} item(s) need a human decision (see ⚠ lines above).`,
  );
  console.log(`Run \`npm run validate\` on the output next - this migration is best-effort, not a guarantee of a schema-valid result.`);
}

module.exports = { migrateDoc };
if (require.main === module) main();
