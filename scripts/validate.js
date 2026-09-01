#!/usr/bin/env node
// Validates entry and base document YAML file(s) against the proposed
// structure:
//   - JSON Schema shape: each entry is checked against its own
//     entries/<kind>.schema.yaml, falling back to the generic
//     entry.schema.yaml for a kind with no dedicated file (either a
//     custom kind, or the well-known generic `entry` kind, which has
//     no fields of its own). Each section is checked against its own
//     sections/<kind>.schema.yaml, falling back to the generic
//     section.schema.yaml for a custom kind or the well-known generic
//     `section` kind. Any entry kind may use any section kind - there
//     is no placement gate.
//   - A ref's `to` (see common/ref.schema.yaml) resolves within the
//     document: a bare id names a real entry or shared entry, and
//     entryId#itemId also resolves the item half. Document-wide - only
//     checked for base documents, since a standalone entry file can't see
//     any entry but itself. Doesn't follow `rel: file` to a sibling
//     document - a corpus split across files needs project scope, which
//     this validator doesn't have yet.
// A file with a `schemaVersion` key is a base document (base.schema.yaml);
// its inline `entries` are checked the same way a standalone entry file's
// are - one validator, no special-casing. System-wide facts and
// documentation live on that list's own `kind: system` entry, not on the
// base document directly.
"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const { rootDir, schemaDir, loadYaml, walkYamlFiles, defaultTargets, findRefs, entriesIn } = require("./lib");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Stable ids for every semantic (hand-written, not pure-schema) check this
// validator enforces - so a bug report, a fixture, or an independent
// validator reimplementation can cite exactly which rule failed instead of
// matching on free-text message wording. Deliberately NOT applied to pure
// JSON Schema errors (from ajv's own `.errors`) - those are already tied to
// the schema itself via instancePath/schemaPath, which is its own stable
// citation. See examples/invalid/ for one fixture per id, and
// tools/conformance-test.js for the runner that checks each fixture
// actually trips the id it claims to.
//
// The catalog itself lives in schema/conformance-rules.yaml, not here -
// that's the single source both this lookup and the Conformance page's
// rule list are generated from, so the two can't drift apart.
const RULES = Object.fromEntries(
  loadYaml(path.join(rootDir, "schema/conformance-rules.yaml")).map((rule) => [rule.name, rule.id])
);

function err(id, message) {
  return `[${id}] ${message}`;
}

// Register every schema file under schema/ by its $id, so $refs
// between common/, sections/, entries/, and base all resolve. Also keep the
// raw parsed schema objects around (schemaById), so discriminator-aware
// validation below can reach into component's own `traits.items.anyOf`
// list instead of only having compiled validate functions to work with.
const schemaById = new Map();
for (const file of walkYamlFiles(schemaDir)) {
  const schema = loadYaml(file);
  ajv.addSchema(schema, schema.$id);
  schemaById.set(schema.$id, schema);
}

function schemaFor(id, fallbackId, profileId) {
  if (profileId) {
    const profileValidate = ajv.getSchema(profileId);
    if (profileValidate) return profileValidate;
  }
  return ajv.getSchema(id) || ajv.getSchema(fallbackId);
}

// Optional local profiles: a project can drop a file at
// profiles/entries/<kind>.schema.yaml or profiles/sections/<kind>.schema.yaml
// that narrows an existing kind (built-in or custom) by $ref-ing its real
// schema.yaml file via allOf and adding `required`/`if`-`then` on top -
// never a new field. See site/content/extending.mdx for the one rule
// (a profile may narrow, must not extend) and why that's what makes this
// safe to build on.
//
// Read here, and only here - profiles/ is a sibling of schema/, not
// nested inside it, so bundle.js's own walk of schema/ never sees it and
// a private profile can never leak into the published schema.
//
// A profile MUST declare its own $id, distinct from the schema it's
// profiling: adding two schemas under the same $id crashes Ajv outright
// (`schema with key or id "..." already exists`), which is exactly the
// failure mode that made profiling a built-in kind look impossible before
// this dispatch-level fix - the schema files themselves already supported
// $ref + allOf narrowing (see B1 in dsds-0.20.0-recommendations.md); only
// wiring a profile in *alongside* the built-in schema instead of *as* it
// was missing.
const PROFILES_DIR = path.join(rootDir, "profiles");
const profileEntryIdByKind = new Map(); // kind -> profile's own $id
const profileSectionIdByKind = new Map();

function loadProfiles(subdir, targetMap) {
  const dir = path.join(PROFILES_DIR, subdir);
  if (!fs.existsSync(dir)) return;
  for (const file of walkYamlFiles(dir)) {
    const schema = loadYaml(file);
    if (!schema.$id) {
      throw new Error(`Profile ${path.relative(rootDir, file)} has no $id of its own.`);
    }
    ajv.addSchema(schema, schema.$id);
    const kind = path.basename(file).replace(/\.schema\.yaml$/, "");
    targetMap.set(kind, schema.$id);
  }
}
loadProfiles("entries", profileEntryIdByKind);
loadProfiles("sections", profileSectionIdByKind);

// ---------------------------------------------------------------------------
// Project discovery: following rel: file across sibling documents
// ---------------------------------------------------------------------------
//
// A large system's documentation is meant to be split across files (see
// base.schema.yaml's own $comment), each pointing at the others via an
// ordinary `refs` entry (rel: file). A validator handed just one of those
// files can't tell a genuinely broken `to:` from one that resolves in a
// sibling it hasn't read - see C1 in notes/recommendations.md. This follows
// that same rel: file link transitively, so resolution can run against the
// whole project instead of just the one file it was handed.
//
// Bounded to the directory of the file actually being validated (and its
// subdirectories) - an href resolving outside that is never read. This is
// a real security boundary, not just tidiness: a hosted validator fed an
// attacker-controlled document must not follow an href like
// `../../../etc/passwd` onto the host's own filesystem.
//
// LIMITATION, by design, not oversight: this only reaches a sibling at or
// below the entry file's own directory. A split where a target lives in a
// *parent* or cousin directory (`../shared/badge.dsds.yaml`, one level up
// from the file that references it) won't be found, and any `to:` it
// can't resolve there reports as a warning, not a false "confirmed
// broken." A boundary derived by walking upward to find a `.git` or
// `package.json` was considered and rejected: in a monorepo, `.git`
// commonly lives well above the actual docs project, which would widen
// the boundary to "the whole monorepo" for exactly the case this exists
// to protect (a CI job or hosted validator checking a document it
// doesn't fully trust). A directory-of-the-target boundary is strictly
// safer, and deterministic - the same file gets the same result
// regardless of what else happens to exist on disk around it - at the
// cost of that narrower reach. An explicit `--root` flag is the right
// way to widen it for a layout that actually needs more; not implemented
// yet because nothing has needed it.
function resolveHref(href, fromAbsPath) {
  return path.resolve(path.dirname(fromAbsPath), href);
}

function isWithinRoot(absPath, root) {
  const rel = path.relative(root, absPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// Returns every entry/shared entity reachable from entryAbsPath by
// following rel: file transitively, including entryAbsPath's own, plus
// how many *other* files were actually read (siblingCount) - a sibling
// that doesn't exist, fails to parse, or resolves outside the root is
// silently skipped, so the caller needs to know whether "not found" means
// "checked and it's not there" or "nothing else was reachable at all"
// (see validateItemRefs's scopeNote). An unresolved target after this is
// always a warning, never a hard error - this search is inherently best-
// effort, per the limitation above.
function loadProject(entryAbsPath) {
  const root = path.dirname(entryAbsPath);
  const visited = new Map(); // absPath -> doc
  const queue = [entryAbsPath];

  while (queue.length) {
    const absPath = queue.shift();
    if (visited.has(absPath)) continue;
    if (!isWithinRoot(absPath, root) || !fs.existsSync(absPath)) continue;
    let doc;
    try {
      doc = loadYaml(absPath);
    } catch (e) {
      continue;
    }
    visited.set(absPath, doc);
    for (const fileRef of doc.refs || []) {
      if (fileRef && fileRef.rel === "file" && typeof fileRef.href === "string") {
        queue.push(resolveHref(fileRef.href, absPath));
      }
    }
  }

  return {
    entities: [...visited.values()].flatMap((d) => entriesIn(d)),
    siblingCount: Math.max(0, visited.size - 1),
  };
}

// The current spec version, read back out of any loaded schema's own
// $id (they all encode the same version) rather than hardcoded — so this
// file never needs touching on a version bump. See scripts/bump-version.js,
// which rewrites every schema file's own $id but has no reason to know
// this file exists.
const SPEC_VERSION = (() => {
  for (const id of schemaById.keys()) {
    const m = /\/v([^/]+)\//.exec(id);
    if (m) return m[1];
  }
  throw new Error("Could not determine the spec version from any loaded schema's $id.");
})();

function specUrl(relPath) {
  return `https://designsystemdocspec.org/v${SPEC_VERSION}/${relPath}`;
}

// A branch is either a plain object schema, or one that extends a shared
// base via allOf (a component's own trait branches do) - the discriminator
// field can live on either shape: as a sibling of the branch's own `allOf`
// (the current open-base + closing-leaf pattern - see
// docs-new/content/architecture.mdx #3, unevaluatedProperties needs `properties` there
// too), or inside one of the allOf's own array elements (older shape, kept
// as a fallback so this doesn't silently break again if that ever comes
// back). Returns the set of tag values this branch matches, or null if the
// branch has no such field at all.
function branchDiscriminatorValues(branch, prop) {
  const candidates = [branch, ...(branch.allOf || [])];
  for (const candidate of candidates) {
    const propSchema = candidate.properties && candidate.properties[prop];
    if (!propSchema) continue;
    if (propSchema.const !== undefined) return [propSchema.const];
    if (Array.isArray(propSchema.enum)) return propSchema.enum;
  }
  return null;
}

const branchValidatorCache = new Map();
function compileBranch(branch) {
  let validate = branchValidatorCache.get(branch);
  if (!validate) {
    validate = ajv.compile(branch);
    branchValidatorCache.set(branch, validate);
  }
  return validate;
}

// Brute-forcing all of AJV's anyOf branches on a typo produces one error
// per branch per required/additional-properties check - 20+ irrelevant
// lines for a single missing field. Since every branch already declares
// which tag value it's for (`const`/`enum` on this field), we can read the
// tag first and validate only against the one matching branch instead.
// Generic over where the discriminated array actually lives - a
// component's own `traits` today, a section's `items` in the past - the
// caller passes in the already-resolved branch list.
function validateDiscriminatedItems(items, branches, prop, label, errors) {
  const fallbackBranch = branches.find((b) => branchDiscriminatorValues(b, prop) === null);
  const knownValues = [...new Set(branches.flatMap((b) => branchDiscriminatorValues(b, prop) || []))];

  for (const [i, item] of (items || []).entries()) {
    const itemLabel = `${label}[${i}]`;
    const value = item && item[prop];

    let branch;
    if (value === undefined) {
      branch = fallbackBranch;
      if (!branch) {
        errors.push(`${itemLabel} is missing "${prop}" (expected one of [${knownValues.join(", ")}])`);
        continue;
      }
    } else {
      branch = branches.find((b) => (branchDiscriminatorValues(b, prop) || []).includes(value));
      if (!branch) {
        errors.push(`${itemLabel} has "${prop}": ${JSON.stringify(value)}, which is not one of [${knownValues.join(", ")}]`);
        continue;
      }
    }

    const validateBranch = compileBranch(branch);
    if (!validateBranch(item)) {
      const tag = value !== undefined ? value : "(untagged)";
      for (const err of validateBranch.errors) {
        errors.push(`${itemLabel} (${prop}: ${tag}) schema: ${err.instancePath || "/"} ${err.message}`);
      }
    }
  }
}

function traitsBranches() {
  const schema = schemaById.get(specUrl("entries/component.schema.yaml"));
  return schema.allOf[1].properties.traits.items.anyOf;
}

// Ajv reports a failed `contains` (ex: guidelines.schema.yaml's "refs
// must include a same-as or external-link entry") by testing every array
// item against the contains sub-schema and surfacing each item's own
// sub-errors right alongside the actual summary - "/refs/0/rel must be
// equal to one of the allowed values" before "/refs must contain at
// least 1 valid item(s)". Noise, not signal: nobody needs "here's why
// item 0 specifically didn't match," only "here's what would have
// matched." This collapses a `contains` failure and the per-item probe
// errors Ajv generated finding it into one message built from whatever
// `enum`/`required` sub-errors it found along the way.
function collapseContainsFailures(ajvErrors) {
  const containsErrors = ajvErrors.filter((e) => e.keyword === "contains");
  if (!containsErrors.length) return ajvErrors;

  const prefixes = containsErrors.map((e) => `${e.schemaPath}/`);

  return ajvErrors
    .map((e) => {
      if (e.keyword !== "contains") return e;
      const prefix = `${e.schemaPath}/`;
      const needs = ajvErrors
        .filter((n) => n !== e && n.schemaPath.startsWith(prefix))
        .map((n) => {
          if (n.keyword === "enum" && n.params && Array.isArray(n.params.allowedValues)) {
            const parts = n.schemaPath.slice(prefix.length).split("/");
            const field = parts[0] === "properties" ? parts[1] : parts[0];
            return `\`${field}\` in [${n.params.allowedValues.join(", ")}]`;
          }
          if (n.keyword === "required" && n.params) return `\`${n.params.missingProperty}\``;
          return null;
        })
        .filter(Boolean);
      const need = needs.length ? [...new Set(needs)].join(" or ") : "a matching item";
      return { ...e, message: `must contain at least one item with ${need}` };
    })
    .filter((e) => e.keyword === "contains" || !prefixes.some((p) => e.schemaPath.startsWith(p)));
}

function validateSections(sections, label, errors) {
  for (const [i, section] of (sections || []).entries()) {
    const sectionSchemaId = specUrl(`sections/${section.kind}.schema.yaml`);
    const validateSection = schemaFor(sectionSchemaId, specUrl("section.schema.yaml"), profileSectionIdByKind.get(section.kind));
    const sectionLabel = `${label} section[${i}] (${section.kind})`;

    if (!validateSection(section)) {
      for (const err of collapseContainsFailures(validateSection.errors)) {
        errors.push(`${sectionLabel} schema: ${err.instancePath || "/"} ${err.message}`);
      }
    }
  }
}

// `sections` now dispatches per kind too (entry.schema.yaml#/$defs/sections
// -> section.schema.yaml#/$defs/dispatch), so the same-shape whole-entry
// check below already reports a bad section - skip those here, since
// validateSections() below reports the identical problem with a section
// index and kind in the label instead of a bare instancePath.
const NESTED_SECTION_ERROR = /^\/sections\/\d/;

// opts.standalone marks an entry validated as its own file (not wrapped
// in a base document's `entries`), the only case validateItemRefs() runs
// here - an entry nested inside a base document is already covered by
// that base document's own single validateItemRefs() pass, which sees
// every sibling entry/shared entity at once; running it again per-entry
// would just duplicate every finding.
function validateEntry(entry, errors, warnings, opts = {}) {
  const entrySchemaId = specUrl(`entries/${entry.kind}.schema.yaml`);
  const validate = schemaFor(entrySchemaId, specUrl("entry.schema.yaml"), profileEntryIdByKind.get(entry.kind));
  const isComponent = entry.kind === "component";

  if (!validate(entry)) {
    for (const err of validate.errors) {
      // Per-trait shape errors are replaced below with discriminator-aware
      // ones; everything else still gets reported straight from AJV.
      if (isComponent && err.instancePath.startsWith("/traits")) continue;
      if (NESTED_SECTION_ERROR.test(err.instancePath)) continue;
      errors.push(`entry "${entry.id}" schema: ${err.instancePath || "/"} ${err.message}`);
    }
    if (isComponent && Array.isArray(entry.traits)) {
      validateDiscriminatedItems(entry.traits, traitsBranches(), "kind", `entry "${entry.id}" traits`, errors);
    }
  }
  validateSections(entry.sections, `entry "${entry.id}"`, errors);
  if (opts.standalone) {
    validateItemRefs(entry, errors, warnings, opts);
    validateComboTargets(entry, errors, warnings, opts);
    validateSameAsLevels(entry, errors, warnings, opts);
  }
  validateSemanticRules(entry, errors);
}

function validateShared(entry, errors) {
  const validate = ajv.getSchema(specUrl("shared.schema.yaml"));
  if (!validate(entry)) {
    for (const err of validate.errors) {
      if (NESTED_SECTION_ERROR.test(err.instancePath)) continue;
      errors.push(`shared "${entry.id}" schema: ${err.instancePath || "/"} ${err.message}`);
    }
  }
  validateSections(entry.sections, `shared "${entry.id}"`, errors);
  validateSemanticRules(entry, errors);
}

// Checks that can't be expressed as a single item's shape - they need to
// see across an entry's sections (or its own top-level fields) at once.
function validateSemanticRules(entry, errors) {
  const sections = entry.sections || [];

  // A rule claiming checkedBy: automated needs somewhere to actually run -
  // a refs (or the more specific checks) entry pointing at the real
  // test/lint-rule that does it, so "automated" isn't just an unverifiable
  // label. Doesn't require the ref to resolve to a real file
  // (tools/validate.js has no filesystem access to every referenced
  // test), just that a check-shaped pointer exists.
  for (const section of sections) {
    if (section.kind !== "guidelines") continue;
    for (const [i, item] of (section.items || []).entries()) {
      if (item.checkedBy !== "automated") continue;
      const hasCheckRef = [...(item.refs || []), ...(item.checks || [])].some((r) => r.rel === "test" || r.rel === "lint-rule");
      if (!hasCheckRef) {
        errors.push(
          err(RULES.CHECKED_BY_NEEDS_REF, `entry "${entry.id}" ${section.kind} item[${i}] declares checkedBy: automated but has no refs/checks entry (rel: test, lint-rule) pointing at what actually runs the check`)
        );
      }
    }
  }

  // One sourceFiles entry per platform (including "no platform given",
  // which all share the same bucket) - a component can't point a tool at
  // two different source files for the same platform's interface.
  const sourceFilesByPlatform = new Map();
  for (const sourceFile of entry.sourceFiles || []) {
    const key = sourceFile.platform || "(unspecified)";
    sourceFilesByPlatform.set(key, (sourceFilesByPlatform.get(key) || 0) + 1);
  }
  for (const [platform, count] of sourceFilesByPlatform) {
    if (count > 1) {
      errors.push(err(RULES.ONE_API_PER_PLATFORM, `entry "${entry.id}" declares ${count} sourceFiles entries for platform "${platform}" - only one is allowed per platform`));
    }
  }
}

// base.schema.yaml's own `entries`/`shared` items now dispatch per kind
// (see entry.schema.yaml#/$defs/dispatch), the same shape the loop below
// checks in JS - needed so the bundled schema an editor's $schema points
// at is exactly as strict as this CLI (see C2). That means a bad entry or
// shared item shows up in `validate`'s own Ajv errors here too; skip those
// - the per-entry/per-shared loop below reports the identical problem
// with better context (an id, kind-aware messages, discriminated `traits`
// errors). Keep everything else this Ajv pass catches (a bogus top-level
// base document field, an empty `entries`/`shared` array).
const NESTED_ENTRY_OR_SHARED_ERROR = /^\/(entries|shared)\/\d/;

function validateBase(doc, errors, warnings, opts = {}) {
  const validate = ajv.getSchema(specUrl("base.schema.yaml"));
  if (!validate(doc)) {
    for (const err of validate.errors) {
      if (NESTED_ENTRY_OR_SHARED_ERROR.test(err.instancePath)) continue;
      errors.push(`base schema: ${err.instancePath || "/"} ${err.message}`);
    }
  }
  for (const entry of doc.entries || []) {
    validateEntry(entry, errors, warnings, opts);
  }
  for (const entry of doc.shared || []) {
    validateShared(entry, errors);
  }

  // entries and shared entries share one id/addressing space (an
  // entryId#itemId ref can't tell which array its entryId half came from),
  // so a collision between the two is exactly as broken as a collision
  // within `entries` alone.
  const seenIds = new Set();
  for (const entity of entriesIn(doc)) {
    if (seenIds.has(entity.id)) {
      errors.push(err(RULES.UNIQUE_ENTRY_ID, `id "${entity.id}" is declared more than once in this document (entries and shared entries share one id space)`));
    }
    seenIds.add(entity.id);
  }

  // When a `kind: system` entry declares `metadata.platforms`, every
  // `platform` value used anywhere in the document must be one of its
  // entries - one declaration, checked everywhere, instead of free
  // strings that can silently drift apart. Platforms aren't a bespoke
  // base-level field; they live on a system entry's own metadata, the
  // same shape every entry's metadata uses.
  const declaredPlatforms = (doc.entries || [])
    .filter((e) => e.kind === "system")
    .flatMap((e) => (e.metadata && e.metadata.platforms) || []);
  if (declaredPlatforms.length) {
    const known = new Set(declaredPlatforms);
    for (const entry of doc.entries || []) {
      for (const [i, sourceFile] of (entry.sourceFiles || []).entries()) {
        if (sourceFile.platform && !known.has(sourceFile.platform)) {
          errors.push(
            err(RULES.PLATFORM_VOCABULARY, `entry "${entry.id}" sourceFiles[${i}] declares platform "${sourceFile.platform}", which is not in the system entry's metadata.platforms [${[...known].join(", ")}]`)
          );
        }
      }
      for (const [i, item] of (entry.imports || []).entries()) {
        if (item.platform && !known.has(item.platform)) {
          errors.push(
            err(RULES.PLATFORM_VOCABULARY, `entry "${entry.id}" imports[${i}] declares platform "${item.platform}", which is not in the system entry's metadata.platforms [${[...known].join(", ")}]`)
          );
        }
      }
      const entryStatus = entry.metadata && entry.metadata.status;
      if (entryStatus && entryStatus.platform && !known.has(entryStatus.platform)) {
        errors.push(
          err(RULES.PLATFORM_VOCABULARY, `entry "${entry.id}" metadata.status declares platform "${entryStatus.platform}", which is not in the system entry's metadata.platforms [${[...known].join(", ")}]`)
        );
      }
    }
  }

  validateItemRefs(doc, errors, warnings, opts);
  validateComboTargets(doc, errors, warnings, opts);
  validateSameAsLevels(doc, errors, warnings, opts);
  validateGraphCycles(doc, errors);
}

// DFS-based cycle detection over a directed adjacency list (Map<string,
// Set<string>>). Standard 3-color (white/gray/black) walk: a gray node
// reached again while still on the current path is the cycle. Returns the
// cycle as an ordered array of ids, or null if the graph is acyclic.
function findCycle(edges) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  const stack = [];
  let cycle = null;

  function visit(node) {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of edges.get(node) || []) {
      if (cycle) return;
      const state = color.get(next) || WHITE;
      if (state === WHITE) {
        visit(next);
      } else if (state === GRAY) {
        const start = stack.indexOf(next);
        cycle = stack.slice(start).concat(next);
      }
      if (cycle) return;
    }
    stack.pop();
    color.set(node, BLACK);
  }

  for (const node of edges.keys()) {
    if (cycle) break;
    if ((color.get(node) || WHITE) === WHITE) visit(node);
  }
  return cycle;
}

// DSDS-06/DSDS-07: a `composes` or `depends-on` ref chain must not lead
// back to an entry already in the chain (see
// notes/2026-08-17-graph-rigor-and-composition-prd.md, Design A). Built
// from every {to, rel} pair anywhere in the document (findRefs already
// walks an entity's full nested shape for DSDS-05's item-ref resolution) -
// only the bare-entry form of `to` forms a graph edge here; an
// `entryId#itemId` ref points at content inside an entry, not at another
// node in the composition/dependency graph. Each rel is checked as its own
// independent graph - a `composes` cycle and a `depends-on` cycle are two
// different rules, not one merged graph, since mixing the two relations
// would report a "cycle" that isn't really one chain of the same kind of
// edge.
function validateGraphCycles(doc, errors) {
  const entities = entriesIn(doc);
  const relsToCheck = [
    { rel: "composes", ruleId: RULES.COMPOSES_CYCLE },
    { rel: "depends-on", ruleId: RULES.DEPENDS_ON_CYCLE },
  ];

  for (const { rel, ruleId } of relsToCheck) {
    const edges = new Map();
    for (const entity of entities) {
      const found = [];
      findRefs(entity, "", found);
      for (const { to, rel: foundRel } of found) {
        if (foundRel !== rel || to.includes("#")) continue;
        if (!edges.has(entity.id)) edges.set(entity.id, new Set());
        edges.get(entity.id).add(to);
      }
    }
    const cycle = findCycle(edges);
    if (cycle) {
      errors.push(err(ruleId, `"${rel}" ref chain forms a cycle: ${cycle.join(" -> ")}`));
    }
  }
}

// Every item id declared anywhere on an entry - the resolution target for
// an entryId#itemId ref (see common/ref.schema.yaml's `to`). Walks into
// any nested array of objects (a component's own trait `values`, a
// freeform entry's own nested `items`), not just a section's top-level
// `items` array, so an id is addressable no matter how deep it sits. Not
// every item shape carries an `id`; this only indexes the ones that do, so
// a ref at an entry that exists but an item that doesn't reports the same
// "unknown item" error a typo would.
// Same walk as collectItemIds, but keeps the actual item object per id
// instead of just the id - needed wherever a check has to read a field
// off the *target* item (see validateSameAsLevels's own level lookup),
// not just confirm it exists.
function collectItemsById(entry) {
  const byId = new Map();
  function walk(item) {
    if (!item || typeof item !== "object") return;
    if (typeof item.id === "string") byId.set(item.id, item);
    for (const value of Object.values(item)) {
      if (Array.isArray(value)) {
        for (const child of value) walk(child);
      }
    }
  }
  for (const section of entry.sections || []) {
    for (const item of section.items || []) walk(item);
    for (const item of section.freeform || []) walk(item);
  }
  for (const trait of entry.traits || []) walk(trait);
  return byId;
}

function collectItemIds(entry) {
  const ids = new Set();
  function walk(item) {
    if (!item || typeof item !== "object") return;
    if (typeof item.id === "string") ids.add(item.id);
    for (const value of Object.values(item)) {
      if (Array.isArray(value)) {
        for (const child of value) walk(child);
      }
    }
  }
  for (const section of entry.sections || []) {
    for (const item of section.items || []) walk(item);
    for (const item of section.freeform || []) walk(item);
  }
  for (const trait of entry.traits || []) walk(trait);
  return ids;
}

// Every trait-space target a combo on this entry could legally name: a
// bare id for a boolean trait ("loading"), or "traitId.valueId" for each
// value of an enum trait ("size.small"). Bare enum trait ids are
// included too (permissive on purpose - "any value of this trait" is a
// plausible reading nothing in the schema rules out).
function collectTraitTargets(entry) {
  const targets = new Set();
  for (const trait of entry.traits || []) {
    if (!trait || typeof trait.id !== "string") continue;
    targets.add(trait.id);
    if (trait.kind === "enum") {
      for (const value of trait.values || []) {
        if (value && typeof value.id === "string") targets.add(`${trait.id}.${value.id}`);
      }
    }
  }
  return targets;
}

// DSDS-09: resolves every combo's `subject` and `items[]` on each local
// entity. Three target spaces:
//   1. Token space - a `{braced}` target, against every token entity in
//      the wider pool (see resolveWiderScope - the same local/project/
//      CLI-sibling merge validateItemRefs uses). Checked first, since a
//      braced target can never mean anything else.
//   2. Trait space - a bare id or `traitId.valueId` against this same
//      entity's own `traits`. Always fully visible (an entity's own
//      traits can't live in another file) - but a bare id is also
//      legal as an entry id (see space 3 below), so a trait-space miss
//      alone doesn't fail anything by itself; it just falls through.
//   3. Entry space - a bare id that didn't match a local trait, against
//      every entity in the wider pool (common/combo.schema.yaml's own
//      description: "Can be a trait, token, or entry id").
// A bare id only ends up reported once it's failed *both* 2 and 3, and
// that combined failure follows the same warning-vs-error split
// validateItemRefs uses, for the same reason: a search that couldn't
// see the whole project can't assert a target is broken with full
// confidence.
function validateComboTargets(doc, errors, warnings, opts = {}) {
  const localEntities = entriesIn(doc);
  const localIds = new Set(localEntities.map((e) => e.id));

  const hasAnyCombos = localEntities.some((e) => Array.isArray(e.combos) && e.combos.length);
  if (!hasAnyCombos) return;

  const { hasWiderScope, widerEntities, treatAsError, scopeNote } = resolveWiderScope(doc, localIds, opts);
  const widerIds = hasWiderScope ? new Set(widerEntities.map((e) => e.id)) : null;
  const widerKindById = hasWiderScope ? new Map(widerEntities.map((e) => [e.id, e.kind])) : null;

  for (const entity of localEntities) {
    if (!Array.isArray(entity.combos)) continue;
    const traitTargets = collectTraitTargets(entity);

    for (const [i, combo] of entity.combos.entries()) {
      if (!combo || typeof combo !== "object") continue;
      const targets = [{ value: combo.subject, at: `combos[${i}].subject` }];
      for (const [j, item] of (combo.items || []).entries()) {
        targets.push({ value: item, at: `combos[${i}].items[${j}]` });
      }

      for (const { value, at } of targets) {
        if (typeof value !== "string") continue;
        const label = `"${entity.id}" ${at} "${value}"`;
        const braced = /^\{(.+)\}$/.exec(value);

        if (braced) {
          const tokenId = braced[1];
          const kind = widerIds && widerIds.has(tokenId) ? widerKindById.get(tokenId) : undefined;
          if (kind === "token") continue;
          const msg = kind
            ? `${label} names "${tokenId}", which exists but is a ${kind}, not a token`
            : `${label} targets unknown token "${tokenId}"`;
          if (treatAsError) errors.push(err(RULES.COMBO_TARGET_RESOLVES, msg));
          else warnings.push(err(RULES.COMBO_TARGET_RESOLVES, `${msg} ${scopeNote}`));
          continue;
        }

        if (traitTargets.has(value)) continue;

        if (widerIds && widerIds.has(value)) continue;
        if (treatAsError) {
          errors.push(err(RULES.COMBO_TARGET_RESOLVES, `${label} matches no trait on "${entity.id}", and no known entry or shared entry`));
        } else {
          warnings.push(err(RULES.COMBO_TARGET_RESOLVES, `${label} matches no trait on "${entity.id}", and no known entry or shared entry ${scopeNote}`));
        }
      }
    }
  }
}

// Resolves a ref's `to` against the document's actual entries/shared
// entries and their items - only meaningful for a base document, since a
// standalone entry file has no other entries to point at. A `same-as` ref
// most often targets a `base.shared` entry (that's the whole point of
// `shared` - one canonical statement, pointed at from many entries), so
// both arrays share this one id space via entriesIn(doc). Skips anything
// that isn't a real internal pointer at all ("://" anywhere in `to` marks
// an ordinary URL fragment, not an id or entryId#itemId).
//
// Two distinct checks:
//   - Bare `to` (DSDS-08): does the named entry/shared entry exist.
//   - `to: entryId#itemId` (DSDS-05): does the entry exist, and does the
//     named item exist somewhere in its sections.
//
// A target found among this document's own entities is always checked -
// that's a space this validator can fully see, whatever else is true.
// When it isn't found here, this looks wider, from two sources:
//   - This document's own `rel: file` project, if it declares one -
//     loadProject() follows that link transitively, bounded to the
//     target file's own directory (see the limitation documented above
//     it).
//   - Every entity in every file passed to this one CLI run
//     (opts.cliEntities - see the call site in the CLI entry point
//     below). A standalone entry file has no field of its own like a
//     base document's `refs` to declare "these are my siblings," so
//     without this it could never resolve a reference to a sibling
//     component at all - exactly the test/site-components/ shape,
//     where the index declares rel: file to every component but no
//     component declares anything back.
//
// If neither source finds it either:
//   - No wider source was even available (no rel: file, and this file
//     was validated alone) - nowhere else the target could be.
//     Unresolved here means genuinely broken - a hard error.
//   - A wider source was available but still came up empty. That's
//     reported, but only as a warning: a `rel: file` sibling that
//     couldn't be read (missing, unparsable, outside the root), or a
//     CLI run that only included some of a larger project's files,
//     makes the search incomplete, and a validator that can't see the
//     whole project MUST NOT assert a pointer is broken with the same
//     confidence as one it fully resolved. `--strict` promotes these to
//     failures once a project is clean.
// Shared by validateItemRefs (DSDS-05/08) and validateComboTargets
// (DSDS-09): builds the "wider than this one document" resolution pool
// both draw on, and decides whether an unresolved target there is a hard
// error or a warning. See validateItemRefs's own comment for the full
// reasoning; this is just the part both checks need identically.
function resolveWiderScope(doc, localIds, opts) {
  const isSplitAcrossFiles = (doc.refs || []).some((r) => r && r.rel === "file");
  const hasCliSiblings =
    Array.isArray(opts.cliEntities) && opts.cliEntities.some((e) => !localIds.has(e.id));
  const hasWiderScope = isSplitAcrossFiles || hasCliSiblings;

  let widerEntities = [];
  let foundSiblings = false;
  if (hasWiderScope) {
    if (hasCliSiblings) widerEntities = widerEntities.concat(opts.cliEntities);
    if (isSplitAcrossFiles && opts.filePath) {
      const { entities: projectEntities, siblingCount } = loadProject(path.resolve(opts.filePath));
      widerEntities = widerEntities.concat(projectEntities);
      foundSiblings = foundSiblings || siblingCount > 0;
    }
    foundSiblings = foundSiblings || hasCliSiblings;
  }

  // A base document's `entries`/`shared` arrays are an explicit, complete
  // declaration of "this is everything" when it has no `rel: file` link
  // out - so an unresolved target there really is broken (a hard error).
  // A standalone entry file has no equivalent way to assert completeness
  // - it's always potentially one piece of a larger indexed project (see
  // test/site-components/, where the index alone declares the shape),
  // so it can never earn that same confidence. An unresolved target on
  // a standalone entry is always a warning, even with no wider scope to
  // check at all - matching the report this validator's own bug was
  // filed against: "a standalone file genuinely cannot resolve a target
  // on its own, so an error would be wrong."
  const treatAsError = !opts.standalone && !hasWiderScope;

  // What actually got checked, honestly - claims a search only when one
  // actually happened.
  const scopeNote = foundSiblings
    ? "(checked every file given to this run, and this document's own rel: file project)"
    : "(no other file could be checked against)";

  return { hasWiderScope, widerEntities, treatAsError, scopeNote };
}

// DSDS-10: a guidelines item can borrow another item's text via a
// `rel: same-as` ref (see guidelines.schema.yaml's own $comment) while
// still declaring its own `level` - `level` is required unconditionally,
// same-as or not, so the borrowing site and the shared rule each carry
// their own copy with nothing checking the two agree. Whenever the
// same-as target actually resolves and it has its own `level`, this
// checks they match. Doesn't touch whether the target resolves at all
// (DSDS-05 already owns that) - only compares levels once resolution
// already succeeded, so this is a hard error whenever it fires: a
// mismatch found between two items the validator can both see is a
// real, confirmed drift, not a "might exist elsewhere" scope question.
function validateSameAsLevels(doc, errors, warnings, opts = {}) {
  const localEntities = entriesIn(doc);
  const localIds = new Set(localEntities.map((e) => e.id));
  const localItemsByEntity = new Map(localEntities.map((e) => [e.id, collectItemsById(e)]));

  const { hasWiderScope, widerEntities } = resolveWiderScope(doc, localIds, opts);
  const widerItemsByEntity = hasWiderScope
    ? new Map(widerEntities.map((e) => [e.id, collectItemsById(e)]))
    : null;

  function findItem(targetId, itemId) {
    const local = localItemsByEntity.get(targetId);
    if (local && local.has(itemId)) return local.get(itemId);
    const wider = widerItemsByEntity && widerItemsByEntity.get(targetId);
    return wider && wider.has(itemId) ? wider.get(itemId) : null;
  }

  for (const entity of localEntities) {
    for (const section of entity.sections || []) {
      if (section.kind !== "guidelines") continue;
      for (const [i, item] of (section.items || []).entries()) {
        if (!item || typeof item.level !== "string") continue;
        for (const ref of item.refs || []) {
          if (!ref || ref.rel !== "same-as" || typeof ref.to !== "string") continue;
          const hashIdx = ref.to.indexOf("#");
          if (hashIdx === -1) continue;
          const targetItem = findItem(ref.to.slice(0, hashIdx), ref.to.slice(hashIdx + 1));
          if (!targetItem || typeof targetItem.level !== "string") continue;
          if (targetItem.level !== item.level) {
            errors.push(
              err(
                RULES.SAME_AS_LEVEL_MATCHES,
                `"${entity.id}" guidelines item[${i}] declares level "${item.level}" but its same-as target "${ref.to}" declares level "${targetItem.level}" - the two must agree`,
              ),
            );
          }
        }
      }
    }
  }
}

function validateItemRefs(doc, errors, warnings, opts = {}) {
  const localEntities = entriesIn(doc);
  const localIds = new Set(localEntities.map((e) => e.id));
  const localItemIdsByEntity = new Map(localEntities.map((e) => [e.id, collectItemIds(e)]));

  const { hasWiderScope, widerEntities, treatAsError, scopeNote } = resolveWiderScope(doc, localIds, opts);
  const widerIds = hasWiderScope ? new Set(widerEntities.map((e) => e.id)) : null;
  const widerItemIdsByEntity = hasWiderScope
    ? new Map(widerEntities.map((e) => [e.id, collectItemIds(e)]))
    : null;

  for (const entity of localEntities) {
    const found = [];
    findRefs(entity, "", found);
    for (const { to, rel, at } of found) {
      if (to.includes("://")) continue;
      const label = `"${entity.id}" ref${at ? ` (${at})` : ""} "${to}" (rel: ${rel})`;
      const hashIdx = to.indexOf("#");

      if (hashIdx === -1) {
        if (!to || localIds.has(to)) continue;
        if (treatAsError) {
          errors.push(err(RULES.ENTRY_REF_RESOLVES, `${label} targets unknown entry/shared "${to}"`));
        } else if (!widerIds || !widerIds.has(to)) {
          warnings.push(err(RULES.ENTRY_REF_RESOLVES, `${label} targets unknown entry/shared "${to}" ${scopeNote}`));
        }
        continue;
      }

      const targetId = to.slice(0, hashIdx);
      const itemId = to.slice(hashIdx + 1);
      if (!targetId || !itemId) continue;

      const localItemIds = localItemIdsByEntity.get(targetId);
      if (localItemIds) {
        if (!localItemIds.has(itemId)) {
          errors.push(err(RULES.ITEM_REF_RESOLVES, `${label} targets unknown item "${itemId}" on "${targetId}"`));
        }
        continue;
      }

      if (treatAsError) {
        errors.push(err(RULES.ITEM_REF_RESOLVES, `${label} targets unknown entry/shared "${targetId}"`));
        continue;
      }

      const widerItemIds = widerItemIdsByEntity && widerItemIdsByEntity.get(targetId);
      if (!widerItemIds) {
        warnings.push(err(RULES.ITEM_REF_RESOLVES, `${label} targets unknown entry/shared "${targetId}" ${scopeNote}`));
      } else if (!widerItemIds.has(itemId)) {
        warnings.push(err(RULES.ITEM_REF_RESOLVES, `${label} targets unknown item "${itemId}" on "${targetId}" ${scopeNote}`));
      }
    }
  }
}

// The reusable core: given an already-parsed document, returns every
// error (both pure-schema and RULES-tagged semantic ones) and every
// warning (a project-scope finding this validator couldn't confirm with
// full confidence - see validateItemRefs) as strings. No I/O beyond what
// opts.filePath's project discovery does, no process exit -
// tools/conformance-test.js reuses this exact function so a fixture is
// checked against the same logic validate.js's own CLI runs, not a
// second copy of it.
//
// opts.filePath is only needed to resolve a rel: file project - pass it
// whenever the document being validated came from a real file on disk.
function validateDoc(doc, opts = {}) {
  const errors = [];
  const warnings = [];
  const isBase = typeof doc.schemaVersion !== "undefined";
  if (isBase) {
    validateBase(doc, errors, warnings, opts);
  } else {
    validateEntry(doc, errors, warnings, { ...opts, standalone: true });
  }
  return { errors, warnings };
}

function validateFile(target, opts = {}) {
  const doc = loadYaml(target);
  const isBase = typeof doc.schemaVersion !== "undefined";
  const { errors, warnings } = validateDoc(doc, { filePath: target, cliEntities: opts.cliEntities });

  const rel = path.relative(rootDir, target);
  if (errors.length) {
    console.error(`✗ ${rel} failed validation:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    if (warnings.length) {
      console.error(`\n  ${warnings.length} warning(s):`);
      for (const w of warnings) console.error(`  - ${w}`);
    }
    return false;
  }

  if (warnings.length && opts.strict) {
    console.error(`✗ ${rel} failed validation in --strict mode:\n`);
    for (const w of warnings) console.error(`  - ${w}`);
    return false;
  }

  console.log(`✓ ${rel}`);
  if (isBase) {
    const sharedCount = (doc.shared || []).length;
    console.log(`  base document  schemaVersion: ${doc.schemaVersion}  ${(doc.entries || []).length} entry(ies)${sharedCount ? `, ${sharedCount} shared` : ""}, ${(doc.refs || []).length} ref(s)`);
  } else {
    console.log(`  ${doc.kind} "${doc.id}"  status: ${JSON.stringify(doc.metadata && doc.metadata.status)}`);
    console.log(`  ${(doc.sections || []).length} section(s), ${(doc.refs || []).length} ref(s)`);
  }
  if (warnings.length) {
    console.log(`  ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  return true;
}

// Only run the CLI when invoked directly - tools/conformance-test.js
// requires this file for validateDoc/RULES and must not trigger a second
// full validate run (with its own process.exit) as a side effect.
if (require.main === module) {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const targets = args.filter((a) => a !== "--strict");
  const resolvedTargets = targets.length ? targets : defaultTargets();

  // Every entry/shared entity across every file given to this one run,
  // gathered up front. A standalone entry file has no way to declare
  // "here are my siblings" the way a base document's own `refs` can (see
  // validateItemRefs) - the real-world layout it needs that for is an
  // index file listing many standalone entries via rel: file, with none
  // of the entries themselves pointing back (test/site-components/ is
  // exactly this shape). Treating every file handed to one CLI
  // invocation as one project fills that gap for the common case: run
  // together, as `npm run check` already does, they resolve against
  // each other; run alone, a standalone file still only sees itself.
  const cliEntities = [];
  for (const target of resolvedTargets) {
    try {
      cliEntities.push(...entriesIn(loadYaml(target)));
    } catch (e) {
      // Let validateFile() below report the real parse/read error for
      // this file; it just contributes nothing to the shared pool.
    }
  }

  let ok = true;
  for (const target of resolvedTargets) {
    if (!validateFile(target, { strict, cliEntities })) ok = false;
  }
  process.exit(ok ? 0 : 1);
}

module.exports = { validateDoc, RULES };
