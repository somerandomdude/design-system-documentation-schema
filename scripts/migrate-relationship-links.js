#!/usr/bin/env node
/**
 * migrate-relationship-links.js — Move relationship-flavored `links` into the
 * typed `relationships` array (DSDS-010).
 *
 * External-resource links (a `url`, kinds like 'source'/'design'/'docs') stay
 * in `links`. Inter-entity references move to `relationships`:
 *
 *   alternative                          -> alternative-to
 *   parent                               -> part-of
 *   component/token/token-group/         -> composes   (on patterns & chunks)
 *     foundation/pattern/theme + id      -> depends-on (on everything else)
 *
 * Two link kinds cannot be migrated automatically and are REPORTED for a human:
 *   child    — the canonical edge belongs on the child entity ('part-of'),
 *              not here; direction inverts.
 *   related  — too vague; a person must pick a typed relation.
 *
 * Usage:
 *   node scripts/migrate-relationship-links.js <files...>           # dry run
 *   node scripts/migrate-relationship-links.js <files...> --write   # apply
 */

const fs = require("fs");

const ARTIFACT_KINDS = new Set([
  "component",
  "token",
  "token-group",
  "foundation",
  "pattern",
  "theme",
]);
const COMPOSE_SOURCES = new Set(["pattern", "chunk"]);

function relationFor(link, entityKind) {
  if (link.kind === "alternative") return "alternative-to";
  if (link.kind === "parent") return "part-of";
  if (typeof link.identifier === "string" && (ARTIFACT_KINDS.has(link.kind) || !link.url)) {
    return COMPOSE_SOURCES.has(entityKind) ? "composes" : "depends-on";
  }
  return null; // not migratable here
}

/** Migrate one entity in place. Returns { converted, flagged }. */
function migrateEntity(entity, report) {
  if (!entity || typeof entity !== "object") return;
  const links = entity.metadata && entity.metadata.links;
  if (Array.isArray(links)) {
    const keep = [];
    for (const link of links) {
      if (!link || typeof link !== "object" || !link.identifier) {
        keep.push(link); // external resource — leave it
        continue;
      }
      if (link.kind === "child" || link.kind === "related") {
        report.flagged.push(`${entity.identifier}: link kind '${link.kind}' → needs manual reclassification`);
        keep.push(link);
        continue;
      }
      const relation = relationFor(link, entity.kind);
      if (!relation) {
        keep.push(link);
        continue;
      }
      const edge = { relation, target: link.identifier };
      if (link.role) edge.role = link.role;
      if (link.required) edge.required = true;
      entity.relationships = entity.relationships || [];
      entity.relationships.push(edge);
      report.converted.push(`${entity.identifier}: ${relation} → ${link.identifier}`);
    }
    if (keep.length) entity.metadata.links = keep;
    else delete entity.metadata.links;
    if (entity.metadata && Object.keys(entity.metadata).length === 0) delete entity.metadata;
  }
  if (Array.isArray(entity.children)) entity.children.forEach((c) => migrateEntity(c, report));
}

function migrateDoc(doc, report) {
  if (doc.entity) migrateEntity(doc.entity, report);
  for (const group of doc.entityGroups || []) {
    for (const e of group.entities || []) if (e && !e.$ref) migrateEntity(e, report);
  }
  // Bare, def-keyed single-entity fixtures: { "pattern": { kind: "pattern", … } }
  if (!doc.entity && !doc.entityGroups) {
    for (const v of Object.values(doc)) {
      if (v && typeof v === "object" && typeof v.kind === "string") migrateEntity(v, report);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const files = args.filter((a) => !a.startsWith("--"));
  if (!files.length) {
    console.error("Usage: node scripts/migrate-relationship-links.js <files...> [--write]");
    process.exit(1);
  }
  let totalConverted = 0;
  let totalFlagged = 0;
  for (const file of files) {
    const report = { converted: [], flagged: [] };
    const doc = JSON.parse(fs.readFileSync(file, "utf-8"));
    migrateDoc(doc, report);
    totalConverted += report.converted.length;
    totalFlagged += report.flagged.length;
    if (report.converted.length || report.flagged.length) {
      console.log(`\n${file}`);
      report.converted.forEach((m) => console.log(`  ✓ ${m}`));
      report.flagged.forEach((m) => console.log(`  ⚠ ${m}`));
    }
    if (write && report.converted.length) {
      fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
    }
  }
  console.log(
    `\n${write ? "Wrote" : "Would convert"} ${totalConverted} edge(s); ${totalFlagged} need manual review.${write ? "" : " Re-run with --write to apply."}`,
  );
}

main();
