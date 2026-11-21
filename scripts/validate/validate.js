#!/usr/bin/env node
// Validates entry and base document YAML file(s): each entry against its own
// entries/<kind>.schema.yaml (falling back to entry.schema.yaml), each section against its own
// sections/<kind>.schema.yaml, plus the semantic rules below (ref resolution, cycles, etc). A
// file with a `schemaVersion` key is a base document; its inline `entries` are checked the
// same way a standalone entry file's are.
"use strict";

const fs = require("fs");
const path = require("path");
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const { rootDir, schemaDir, loadYaml, walkYamlFiles, defaultTargets, findRefs, entriesIn, escapePointer, declaredProps, itemAddresses, resolveAddress, ownerOf, entryFieldOrder, inlineLinksIn, TO_PATTERN } = require("../lib");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Stable ids for every semantic (hand-written) check this validator enforces, so a fixture or
// an independent implementation can cite which rule failed. Not applied to pure JSON Schema
// errors, which already cite instancePath/schemaPath. Filtered to enforcement: semantic - the
// catalog (schema/conformance-rules.yaml) also carries structural and advisory (lint-docs.js) entries.
const CATALOG = loadYaml(path.join(rootDir, "schema/conformance-rules.yaml"));
const RULES = Object.fromEntries(
  CATALOG.filter((rule) => rule.enforcement === "semantic").map((rule) => [rule.name, rule.id])
);
const RULE_FIX = new Map(CATALOG.map((rule) => [rule.id, rule.fix]));

const SITE_URL = "https://designsystemdocspec.org";

function err(id, message) {
  return `[${id}] ${message}`;
}

// Collects every finding twice. `errors`/`warnings` hold the exact strings validateDoc() has
// always returned - conformance-test.js and other scripts parse those, so they must not change.
// `findings` holds the same thing as data for --json: the rule id, a JSON Pointer into the
// document, a fix hint, and a link to the rule's page.
class Report {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.findings = [];
  }

  error(message, detail) {
    this.add("error", message, detail);
  }

  warn(message, detail) {
    this.add("warning", message, detail);
  }

  // `offset` is only given for a finding inside a Markdown field (an inline link): the
  // character offset of the link within the field the pointer names.
  add(severity, message, { rule = null, pointer = "", fix, offset } = {}) {
    (severity === "error" ? this.errors : this.warnings).push(rule ? err(rule, message) : message);
    this.findings.push({
      rule,
      severity,
      pointer,
      ...(offset !== undefined ? { offset } : {}),
      message,
      fix: fix !== undefined ? fix : (rule && RULE_FIX.get(rule)) || null,
      docs: rule ? `${SITE_URL}/conformance#${rule.toLowerCase()}` : null,
    });
  }

  // An Ajv error. Ajv's instancePath is relative to whatever was validated (an entry, a
  // section), so `base` re-roots it at the document.
  schema(label, base, ajvError) {
    // For an unknown key, Ajv points at the object holding it; point at the key itself.
    const p = ajvError.params || {};
    const key = p.additionalProperty !== undefined ? p.additionalProperty : p.unevaluatedProperty;
    this.error(`${label} schema: ${ajvError.instancePath || "/"} ${ajvError.message}`, {
      pointer: base + ajvError.instancePath + (key !== undefined ? `/${escapePointer(key)}` : ""),
      fix: schemaFix(ajvError),
    });
  }
}

// A one-line hint for the Ajv keywords that have an obvious fix. Anything else (anyOf, if/then)
// gets no hint rather than a vague one.
function schemaFix(ajvError) {
  const p = ajvError.params || {};
  switch (ajvError.keyword) {
    case "additionalProperties":
      return `Remove "${p.additionalProperty}", or check its spelling against the schema.`;
    case "unevaluatedProperties":
      return `Remove "${p.unevaluatedProperty}", or check its spelling against the schema.`;
    case "propertyNames":
      return `Rename the key "${p.propertyName}" so it matches the pattern this field requires.`;
    case "required":
      return `Add the required field "${p.missingProperty}".`;
    case "enum":
      return Array.isArray(p.allowedValues) ? `Use one of: ${p.allowedValues.join(", ")}.` : null;
    case "const":
      return `Set this to ${JSON.stringify(p.allowedValue)}.`;
    case "pattern":
      return `Change the value so it matches ${p.pattern}.`;
    case "type":
      return `Change the value to a ${p.type}.`;
    case "minItems":
      return `Add at least ${p.limit} item(s), or remove the field.`;
    case "minLength":
      return "Give this a non-empty value.";
    case "format":
      return `Use a valid ${p.format}.`;
    default:
      return null;
  }
}

// entriesIn(doc), paired with each entity's JSON Pointer: "" for a standalone entry file,
// /entries/<i> or /shared/<i> inside a base document. A list of pairs, not a Map keyed by
// entity: a YAML alias can put the same object in the list twice, and that must still count twice.
function entitiesWithPointers(doc) {
  if (typeof doc.schemaVersion === "undefined") return [[doc, ""]];
  return [
    ...(doc.entries || []).map((entity, i) => [entity, `/entries/${i}`]),
    ...(doc.shared || []).map((entity, i) => [entity, `/shared/${i}`]),
  ];
}

// Register every schema file by its $id so cross-file $refs resolve. schemaById keeps the raw
// parsed objects around too, so discriminator-aware validation below can inspect them directly.
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

// Optional local profiles: a project can drop a file at profiles/entries/<kind>.schema.yaml or
// profiles/sections/<kind>.schema.yaml that narrows an existing kind (never adds a field) - see
// extending.mdx. profiles/ is a sibling of schema/, so bundle.js's own walk never sees it. A
// profile must declare its own $id, distinct from the schema it profiles, or Ajv crashes on the collision.
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

// Project discovery: follows rel: file links transitively so ref resolution can run against a
// whole multi-file system, not just the one file handed to the validator. Bounded to the
// directory of the file being validated (and its subdirectories) as a real security boundary -
// a hosted validator fed an untrusted document must not follow an href like `../../etc/passwd`.
// This means a sibling in a parent/cousin directory won't be found (unresolved `to:` there is a
// warning, not a confirmed break); an explicit `--root` flag would widen it, not implemented yet.
function resolveHref(href, fromAbsPath) {
  return path.resolve(path.dirname(fromAbsPath), href);
}

function isWithinRoot(absPath, root) {
  const rel = path.relative(root, absPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// Returns every entry/shared entity reachable from entryAbsPath via rel: file, plus siblingCount
// (files actually read) - a missing/unparseable/out-of-bounds sibling is silently skipped, so
// callers can tell "checked, not there" from "nothing else was reachable."
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

// DSDS-11: does a relative sourceFiles[].file/source/rel:file href exist on disk? Reuses the
// same directory boundary as loadProject(). URL-scheme hrefs (https:, npm:) are never checked.
const URL_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

// `baseDir` replaces the document's own folder as the starting point (a system's sourceRoot);
// the boundary stays the document's folder either way.
function checkFileExists(href, filePath, report, label, pointer, { baseDir, hint } = {}) {
  if (!filePath || typeof href !== "string" || URL_SCHEME_RE.test(href)) return;
  // `./tokens.json#color.action` points into a file; only the file part has to exist.
  const file = filePart(href);
  if (!file) return;
  const abs = baseDir ? path.resolve(baseDir, file) : resolveHref(file, filePath);
  const root = path.dirname(filePath);
  if (!isWithinRoot(abs, root)) return; // outside this check's boundary - not evaluated, not assumed broken
  if (!fs.existsSync(abs)) {
    report.warn(`${label} points at "${href}", which doesn't exist on disk (checked ${path.relative(rootDir, abs)})${hint ? ` - ${hint}` : ""}`, {
      rule: RULES.FILE_REF_EXISTS,
      pointer,
    });
  }
}

const filePart = (href) => href.split("#")[0].split("?")[0];

// Where relative sourceFiles paths start from: the folder a system's metadata.sourceRoot names,
// read from the document that holds that system entry. undefined when no system in view sets
// one; null when it's a URL, which this check can't look inside.
function sourceBaseDir(opts) {
  const root = opts.sourceRoot;
  if (!root) return undefined;
  if (URL_SCHEME_RE.test(root.value)) return null;
  return path.resolve(path.dirname(root.from), root.value);
}

// The sourceRoot of the first system entry in `doc` that sets one, with the file it came from.
function sourceRootIn(doc, filePath) {
  for (const entity of entriesIn(doc)) {
    const value = entity && entity.kind === "system" && entity.metadata && entity.metadata.sourceRoot;
    if (typeof value === "string" && filePath) return { value, from: filePath };
  }
  return null;
}

// DSDS-25: `rel: file` is for another DSDS document, which a consumer reads into the project. A
// code or token file there is a `rel: source` written as the wrong kind. Read by extension, and
// for a .json file that's on disk, by whether it looks like a DSDS document.
function notADocument(href, filePath) {
  if (typeof href !== "string" || URL_SCHEME_RE.test(href)) return false;
  const file = filePart(href);
  const ext = path.extname(file).toLowerCase();
  if (!ext || ext === ".yaml" || ext === ".yml") return false;
  if (ext !== ".json") return true;
  if (!filePath) return false;
  const abs = resolveHref(file, filePath);
  if (!isWithinRoot(abs, path.dirname(filePath)) || !fs.existsSync(abs)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(abs, "utf8"));
    return !(data && typeof data === "object" && (data.schemaVersion !== undefined || (data.kind && data.id)));
  } catch (e) {
    return false;
  }
}

function checkFileRefTarget(href, filePath, report, label, pointer) {
  if (!notADocument(href, filePath)) return;
  report.warn(`${label} points at "${href}" with rel: file, which is for another DSDS document - a code or token file is rel: source`, {
    rule: RULES.REF_PLACEMENT,
    pointer: pointer.replace(/\/href$/, "/rel"),
    fix: "Change `rel: file` to `rel: source`. On a token or theme, the DTCG file can go in its `source` field instead.",
  });
}

// Every {href, rel: "file"} or {href, rel: "source"} object anywhere in an entity's tree - the
// same walk findRefs() does for {to, rel}, but keyed on href since a file-pointing ref is never a
// `to:`. A `source` href that's a URL or package (`npm:`) is skipped later by checkFileExists.
function findFileHrefRefs(value, out, pointer = "") {
  if (Array.isArray(value)) {
    value.forEach((item, i) => findFileHrefRefs(item, out, `${pointer}/${i}`));
    return;
  }
  if (value && typeof value === "object") {
    if ((value.rel === "file" || value.rel === "source") && typeof value.href === "string") {
      out.push({ href: value.href, rel: value.rel, pointer: `${pointer}/href` });
    }
    for (const [key, val] of Object.entries(value)) findFileHrefRefs(val, out, `${pointer}/${escapePointer(key)}`);
  }
}

// sourceFiles[].file and source accept a bare string (shorthand for href) or a full {href, ...}
// object - both point at a file regardless of `rel`, unlike a general `refs` entry.
function refHref(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.href === "string") return value.href;
  return undefined;
}

function validateFileRefs(entity, report, opts) {
  if (!opts.filePath) return;
  const base = opts.pointer || "";
  if (entity.kind === "component") {
    const baseDir = sourceBaseDir(opts);
    const hint = baseDir === undefined ? "if the code lives somewhere else, set the system's metadata.sourceRoot and validate this file together with the document that holds it" : undefined;
    if (baseDir !== null) {
      for (const [i, sf] of (entity.sourceFiles || []).entries()) {
        checkFileExists(refHref(sf.file), opts.filePath, report, `"${entity.id}" sourceFiles[${i}].file`, `${base}/sourceFiles/${i}/file`, { baseDir, hint });
      }
    }
  }
  if ((entity.kind === "token" || entity.kind === "theme") && entity.source !== undefined) {
    checkFileExists(refHref(entity.source), opts.filePath, report, `"${entity.id}" source`, `${base}/source`);
  }
  // Exclude sourceFiles/source from this generic walk - already checked
  // explicitly above, regardless of whether they use the bare-string or
  // {href, rel: file} object form. Walking them again here would double
  // up a finding whenever the object form happens to carry rel: file.
  const { sourceFiles, source, ...rest } = entity;
  const fileHrefs = [];
  findFileHrefRefs(rest, fileHrefs, base);
  for (const { href, rel, pointer } of fileHrefs) {
    checkFileExists(href, opts.filePath, report, `"${entity.id}" ref (rel: ${rel})`, pointer);
    if (rel === "file") checkFileRefTarget(href, opts.filePath, report, `"${entity.id}" ref`, pointer);
  }
}

// The current spec version, read back out of any loaded schema's own $id rather than
// hardcoded, so this file never needs touching on a version bump.
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

// A branch is either a plain object schema or one that extends a shared base via allOf; the
// discriminator field can live as a sibling of `allOf` (current form) or inside one of its
// array elements (older form, kept as a fallback). Returns the branch's matching tag values,
// or null if it has no such field.
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

// Brute-forcing all of Ajv's anyOf branches on a typo produces 20+ irrelevant errors. Since each
// branch declares which tag value it's for, read the tag first and validate only that branch.
function validateDiscriminatedItems(items, branches, prop, label, report, base) {
  const fallbackBranch = branches.find((b) => branchDiscriminatorValues(b, prop) === null);
  const knownValues = [...new Set(branches.flatMap((b) => branchDiscriminatorValues(b, prop) || []))];
  const fix = `Set "${prop}" to one of: ${knownValues.join(", ")}.`;

  for (const [i, item] of (items || []).entries()) {
    const itemLabel = `${label}[${i}]`;
    const value = item && item[prop];

    let branch;
    if (value === undefined) {
      branch = fallbackBranch;
      if (!branch) {
        report.error(`${itemLabel} is missing "${prop}" (expected one of [${knownValues.join(", ")}])`, { pointer: `${base}/${i}`, fix });
        continue;
      }
    } else {
      branch = branches.find((b) => (branchDiscriminatorValues(b, prop) || []).includes(value));
      if (!branch) {
        report.error(`${itemLabel} has "${prop}": ${JSON.stringify(value)}, which is not one of [${knownValues.join(", ")}]`, {
          pointer: `${base}/${i}/${escapePointer(prop)}`,
          fix,
        });
        continue;
      }
    }

    const validateBranch = compileBranch(branch);
    if (!validateBranch(item)) {
      const tag = value !== undefined ? value : "(untagged)";
      for (const ajvError of validateBranch.errors) {
        report.schema(`${itemLabel} (${prop}: ${tag})`, `${base}/${i}`, ajvError);
      }
    }
  }
}

function traitsBranches() {
  const schema = schemaById.get(specUrl("entries/component.schema.yaml"));
  return schema.allOf[1].properties.traits.items.anyOf;
}

// Ajv reports a failed `contains` by surfacing every per-item probe error alongside the real
// summary - noise, not signal. Collapses those into one message built from what it found.
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

function validateSections(sections, label, report, base) {
  for (const [i, section] of (sections || []).entries()) {
    const sectionSchemaId = specUrl(`sections/${section.kind}.schema.yaml`);
    const validateSection = schemaFor(sectionSchemaId, specUrl("sections/section.schema.yaml"), profileSectionIdByKind.get(section.kind));
    const sectionLabel = `${label} section[${i}] (${section.kind})`;

    if (!validateSection(section)) {
      for (const ajvError of collapseContainsFailures(validateSection.errors)) {
        report.schema(sectionLabel, `${base}/sections/${i}`, ajvError);
      }
    }
  }
}

// The whole-entry check below already catches a bad section too; skip those since
// validateSections() reports the same problem with a section index/kind instead of a bare instancePath.
const NESTED_SECTION_ERROR = /^\/sections\/\d/;

// opts.standalone: an entry validated as its own file. An entry nested inside a base document is
// already covered by that document's own single validateItemRefs() pass over every sibling at once.
// When any part of an entry fails, Ajv forgets which fields the failing part checked, and then
// reports every one of them as "unevaluated" at the entry's root - `id`, `name`, `sections`. The
// entry is invalid either way, but those errors name fields that are allowed and send a reader
// to fix the wrong thing. Only a field the kind doesn't declare is a real unevaluated error.
// (It started with entry.schema.yaml's if/else on `kind`, which makes Ajv track this at runtime.)
function isFalseUnevaluated(ajvError, kind) {
  if (ajvError.keyword !== "unevaluatedProperties" || ajvError.instancePath !== "") return false;
  const known = typeof kind === "string" ? entryFieldOrder(kind) : [];
  return known.includes(ajvError.params && ajvError.params.unevaluatedProperty);
}

function validateEntry(entry, report, opts = {}) {
  const entrySchemaId = specUrl(`entries/${entry.kind}.schema.yaml`);
  const validate = schemaFor(entrySchemaId, specUrl("entries/entry.schema.yaml"), profileEntryIdByKind.get(entry.kind));
  const isComponent = entry.kind === "component";
  const base = opts.pointer || "";

  if (!validate(entry)) {
    for (const ajvError of validate.errors) {
      // Per-trait structure errors are replaced below with discriminator-aware ones.
      if (isComponent && ajvError.instancePath.startsWith("/traits")) continue;
      if (NESTED_SECTION_ERROR.test(ajvError.instancePath)) continue;
      if (isFalseUnevaluated(ajvError, entry.kind) && validate.errors.length > 1) continue;
      report.schema(`entry "${entry.id}"`, base, ajvError);
    }
    if (isComponent && Array.isArray(entry.traits)) {
      validateDiscriminatedItems(entry.traits, traitsBranches(), "kind", `entry "${entry.id}" traits`, report, `${base}/traits`);
    }
  }
  validateSections(entry.sections, `entry "${entry.id}"`, report, base);
  if (opts.standalone) {
    validateItemRefs(entry, report, opts);
    validateRefPlacement(entry, report, opts);
    validateComboTargets(entry, report, opts);
    validateSameAsLevels(entry, report, opts);
  }
  validateSemanticRules(entry, report, base);
  validateUndeclaredFields(entry, report, base);
  validateFileRefs(entry, report, opts);
}

function validateShared(entry, report, opts = {}) {
  const validate = ajv.getSchema(specUrl("shared.schema.yaml"));
  const base = opts.pointer || "";
  if (!validate(entry)) {
    for (const ajvError of validate.errors) {
      if (NESTED_SECTION_ERROR.test(ajvError.instancePath)) continue;
      report.schema(`shared "${entry.id}"`, base, ajvError);
    }
  }
  validateSections(entry.sections, `shared "${entry.id}"`, report, base);
  validateSemanticRules(entry, report, base);
  validateUndeclaredFields(entry, report, base);
  validateFileRefs(entry, report, opts);
}

// DSDS-24: `kind: entry` and `kind: section` validate against the open base other kinds build
// on, so JSON Schema accepts any extra field there - and on a generic entry's `metadata`, which
// is open for the same reason. Reported as a warning rather than closing the schema, so no
// document that relies on the openness breaks. Namespaced custom kinds stay open on purpose.
const DECLARED = {
  entry: new Set(declaredProps("entries/entry.schema.yaml")),
  section: new Set(declaredProps("sections/section.schema.yaml")),
  metadata: new Set([...declaredProps("metadata/metadata.schema.yaml"), ...declaredProps("metadata/entry-metadata.schema.yaml")]),
};

// The closest declared name, when it's near enough to be a likely typo.
function closest(key, names) {
  let best = null;
  let bestDistance = Infinity;
  for (const name of names) {
    const d = editDistance(key.toLowerCase(), name.toLowerCase());
    if (d < bestDistance) [best, bestDistance] = [name, d];
  }
  return bestDistance <= Math.max(1, Math.floor(key.length / 4)) ? best : null;
}

// Edit distance where swapping two neighbouring letters (`titel`) counts as one edit.
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Fields a release removed, keyed by where they sat, with where their content goes now.
const REMOVED_FIELDS = {
  entry: { purpose: "0.22.0 folded `purpose` into `description`. Move its text there (scripts/tools/migrate-to-0.22.js does this)." },
  metadata: { context: "0.22.0 folded `metadata.context` into the entry's `description`. Move its text there (scripts/tools/migrate-to-0.22.js does this)." },
  section: { metadata: "0.22.0 removed a section's `metadata`. Move it under the section's `$extensions` with a namespaced key (scripts/tools/migrate-to-0.22.js does this)." },
};

function reportUndeclared(obj, where, label, pointer, report) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  const declared = DECLARED[where];
  for (const key of Object.keys(obj)) {
    if (declared.has(key)) continue;
    const removed = REMOVED_FIELDS[where][key];
    const guess = removed ? null : closest(key, declared);
    const why = removed ? ", which 0.22.0 removed" : `, which no DSDS schema declares${guess ? ` (did you mean "${guess}"?)` : ""}`;
    report.warn(`${label} has "${key}"${why}`, {
      rule: RULES.UNDECLARED_FIELD,
      pointer: `${pointer}/${escapePointer(key)}`,
      fix: removed || (guess ? `Rename "${key}" to "${guess}".` : undefined),
    });
  }
}

function validateUndeclaredFields(entry, report, base) {
  if (entry.kind === "entry") {
    reportUndeclared(entry, "entry", `entry "${entry.id}"`, base, report);
    reportUndeclared(entry.metadata, "metadata", `entry "${entry.id}" metadata`, `${base}/metadata`, report);
  }
  for (const [i, section] of (entry.sections || []).entries()) {
    if (section && section.kind === "section") {
      reportUndeclared(section, "section", `entry "${entry.id}" section[${i}] (section)`, `${base}/sections/${i}`, report);
    }
  }
}

// Checks that can't be expressed as a single item's own fields - they need to see across an
// entry's sections (or its own top-level fields) at once.
function validateSemanticRules(entry, report, base) {
  const sections = entry.sections || [];

  // checkedBy: automated needs a `checks` entry pointing at something that runs outside the
  // document - a test, lint rule or agent eval (an `href`). A checklist step (a `to`) is a person
  // checking by hand, so it doesn't count. Doesn't require the target to resolve.
  const runsOutside = (r) => typeof r === "string" || (r && typeof r === "object" && typeof r.href === "string");
  for (const [si, section] of sections.entries()) {
    if (section.kind !== "guidelines") continue;
    for (const [i, item] of (section.items || []).entries()) {
      if (item.checkedBy !== "automated") continue;
      if (!(Array.isArray(item.checks) && item.checks.some(runsOutside))) {
        report.error(
          `entry "${entry.id}" ${section.kind} item[${i}] declares checkedBy: automated but its \`checks\` points at no test, lint rule or agent eval (an \`href\`) that actually runs the check`,
          { rule: RULES.CHECKED_BY_NEEDS_REF, pointer: `${base}/sections/${si}/items/${i}/checkedBy` },
        );
      }
    }
  }

  // One sourceFiles entry per platform (including "no platform given," which share one bucket).
  const sourceFilesByPlatform = new Map(); // platform -> indexes into sourceFiles
  for (const [i, sourceFile] of (entry.sourceFiles || []).entries()) {
    const key = sourceFile.platform || "(unspecified)";
    sourceFilesByPlatform.set(key, [...(sourceFilesByPlatform.get(key) || []), i]);
  }
  for (const [platform, indexes] of sourceFilesByPlatform) {
    if (indexes.length > 1) {
      report.error(`entry "${entry.id}" declares ${indexes.length} sourceFiles entries for platform "${platform}" - only one is allowed per platform`, {
        rule: RULES.ONE_API_PER_PLATFORM,
        pointer: `${base}/sourceFiles/${indexes[1]}`,
      });
    }
  }
}

// base.schema.yaml's entries/shared items dispatch per kind too, so a bad one shows up in Ajv's
// own errors here as well; skip those since the per-entry/per-shared loop below reports it with
// better context. Keep everything else this pass catches (a bogus top-level field, an empty array).
const NESTED_ENTRY_OR_SHARED_ERROR = /^\/(entries|shared)\/\d/;

function validateBase(doc, report, opts = {}) {
  const validate = ajv.getSchema(specUrl("base.schema.yaml"));
  if (!validate(doc)) {
    for (const ajvError of validate.errors) {
      if (NESTED_ENTRY_OR_SHARED_ERROR.test(ajvError.instancePath)) continue;
      report.schema("base", "", ajvError);
    }
  }
  // DSDS-11 for the base document's OWN top-level `refs`. Entry-level refs
  // are covered by validateFileRefs() inside validateEntry/validateShared
  // below; nothing covered these, and they're the likeliest of the three to
  // rot - a base document's `rel: file` refs are the multi-file split the
  // quickstart recommends for a large system, so they're a list of sibling
  // filenames maintained by hand as components come and go. This repo's own
  // test/site-components/index.dsds.yaml carried a ref to a component file
  // that had been deleted, and validated clean.
  //
  // Walk only `doc.refs`, not the whole document: findFileHrefRefs recurses,
  // so passing `doc` would re-find every entry's refs and double-report them.
  if (opts.filePath) {
    const docFileHrefs = [];
    findFileHrefRefs(doc.refs, docFileHrefs, "/refs");
    for (const { href, rel, pointer } of docFileHrefs) {
      checkFileExists(href, opts.filePath, report, `base document ref (rel: ${rel})`, pointer);
      if (rel === "file") checkFileRefTarget(href, opts.filePath, report, "base document ref", pointer);
    }
  }

  for (const [i, entry] of (doc.entries || []).entries()) {
    validateEntry(entry, report, { ...opts, pointer: `/entries/${i}` });
  }
  for (const [i, entry] of (doc.shared || []).entries()) {
    validateShared(entry, report, { ...opts, pointer: `/shared/${i}` });
  }

  // entries and shared entries share one id/addressing space, so a collision between the two arrays is as broken as one within entries alone.
  const seenIds = new Set();
  for (const [entity, pointer] of entitiesWithPointers(doc)) {
    if (seenIds.has(entity.id)) {
      report.error(`id "${entity.id}" is declared more than once in this document (entries and shared entries share one id space)`, {
        rule: RULES.UNIQUE_ENTRY_ID,
        pointer: `${pointer}/id`,
      });
    }
    seenIds.add(entity.id);
  }

  // When a `kind: system` entry declares metadata.platforms, every platform used anywhere must be one of them.
  const declaredPlatforms = (doc.entries || [])
    .filter((e) => e.kind === "system")
    .flatMap((e) => (e.metadata && e.metadata.platforms) || []);
  if (declaredPlatforms.length) {
    const known = new Set(declaredPlatforms);
    const rule = RULES.PLATFORM_VOCABULARY;
    for (const [ei, entry] of (doc.entries || []).entries()) {
      for (const [i, sourceFile] of (entry.sourceFiles || []).entries()) {
        if (sourceFile.platform && !known.has(sourceFile.platform)) {
          report.error(
            `entry "${entry.id}" sourceFiles[${i}] declares platform "${sourceFile.platform}", which is not in the system entry's metadata.platforms [${[...known].join(", ")}]`,
            { rule, pointer: `/entries/${ei}/sourceFiles/${i}/platform` },
          );
        }
      }
      for (const [i, item] of (entry.imports || []).entries()) {
        if (item.platform && !known.has(item.platform)) {
          report.error(
            `entry "${entry.id}" imports[${i}] declares platform "${item.platform}", which is not in the system entry's metadata.platforms [${[...known].join(", ")}]`,
            { rule, pointer: `/entries/${ei}/imports/${i}/platform` },
          );
        }
      }
      // status is either a single object or a list, one entry per platform - normalize to an array and check each.
      const entryStatus = entry.metadata && entry.metadata.status;
      const statusEntries = Array.isArray(entryStatus)
        ? entryStatus
        : entryStatus
          ? [entryStatus]
          : [];
      for (const [i, statusEntry] of statusEntries.entries()) {
        if (!statusEntry || !statusEntry.platform || known.has(statusEntry.platform)) continue;
        const where = Array.isArray(entryStatus) ? `metadata.status[${i}]` : "metadata.status";
        const statusPointer = Array.isArray(entryStatus) ? `/entries/${ei}/metadata/status/${i}` : `/entries/${ei}/metadata/status`;
        report.error(
          `entry "${entry.id}" ${where} declares platform "${statusEntry.platform}", which is not in the system entry's metadata.platforms [${[...known].join(", ")}]`,
          { rule, pointer: `${statusPointer}/platform` },
        );
      }
    }
  }

  validateItemRefs(doc, report, opts);
  validateRefPlacement(doc, report, opts);
  validateComboTargets(doc, report, opts);
  validateSameAsLevels(doc, report, opts);
  validateGraphCycles(doc, report);
}

// Standard 3-color DFS cycle detection over a directed adjacency list. Returns the cycle as an ordered array of ids, or null.
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

// DSDS-06 (processing model §9): a chain a consumer follows must never lead back to where it
// started. `uses` and `extends` chains run between entries, so only a bare `to` is an edge.
// `same-as` and `replaced-by` chains run between items, traits and entries, so each edge runs
// from the thing that owns the ref (`entry#address`, or the entry) to the target as written.
// (DSDS-07 checked `depends-on` separately until 0.22.0 merged it into `uses`; it's retired.)
const CHAINED_RELS = ["uses", "extends", "same-as", "replaced-by"];
const ENTRY_ONLY_RELS = new Set(["uses", "extends"]);

// A chain is followed by location, not by address: an item that only reuses another takes the
// address of the item it reuses, so on one entry the two share an address. A node here is
// `entityId` plus the JSON Pointer of the item, trait or value inside it; `labels` maps each
// node back to its `entity#address` for messages.
function validateGraphCycles(doc, report) {
  const pointers = entitiesWithPointers(doc);
  const books = new Map(entriesIn(doc).map((e) => [e.id, itemAddresses(e)]));
  const labels = new Map();
  const nodeOf = (entityId, candidate, address) => {
    const node = candidate ? `${entityId}${candidate.pointer}` : entityId;
    labels.set(node, candidate ? `${entityId}#${address}` : entityId);
    return node;
  };
  const targetNode = (to) => {
    const hash = to.indexOf("#");
    const entityId = hash === -1 ? to : to.slice(0, hash);
    const book = books.get(entityId);
    if (!book) return null; // unresolved: DSDS-05/DSDS-08's job
    if (hash === -1) return nodeOf(entityId, null);
    const { candidate } = resolveAddress(book, to.slice(hash + 1));
    return candidate ? nodeOf(entityId, candidate, to.slice(hash + 1)) : null;
  };

  for (const rel of CHAINED_RELS) {
    const edges = new Map();
    const edgePointers = new Map(); // "from -> to" -> pointer at the first ref making that edge
    for (const [entity, entityPointer] of pointers) {
      const found = [];
      findRefs(entity, "", found);
      const book = books.get(entity.id);
      for (const { to, rel: foundRel, pointer } of found) {
        if (foundRel !== rel) continue;
        if (ENTRY_ONLY_RELS.has(rel) && to.includes("#")) continue;
        const owner = ENTRY_ONLY_RELS.has(rel) || !book ? null : ownerOf(book, pointer);
        const from = owner ? nodeOf(entity.id, owner.candidate, owner.address) : nodeOf(entity.id, null);
        const target = ENTRY_ONLY_RELS.has(rel) ? nodeOf(to, null) : targetNode(to);
        if (!target) continue;
        if (!edges.has(from)) edges.set(from, new Set());
        edges.get(from).add(target);
        const edgeKey = `${from} -> ${target}`;
        if (!edgePointers.has(edgeKey)) edgePointers.set(edgeKey, `${entityPointer}${pointer}`);
      }
    }
    const cycle = findCycle(edges);
    if (cycle) {
      // Points at the ref that starts the cycle; any ref in it would be just as correct.
      report.error(`"${rel}" ref chain forms a cycle: ${cycle.map((n) => labels.get(n) || n).join(" -> ")}`, {
        rule: RULES.CHAIN_CYCLE,
        pointer: edgePointers.get(`${cycle[0]} -> ${cycle[1]}`) || "",
      });
    }
  }
}

// Every `#address` on each entry (processing model §2 - see lib.js's itemAddresses()).
function addressBook(entities) {
  return new Map(entities.map((e) => [e.id, itemAddresses(e)]));
}

// Every trait-space target a combo could legally name: a bare id for a boolean trait, or
// "traitId.valueId" for each enum value (plus the bare enum trait id itself, permissively).
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

// DSDS-09: resolves each combo's `subject`/`items[]` against three spaces in order - a
// `{braced}` token reference, a trait/`traitId.valueId` on the entity's own traits, or a bare
// entry id in the wider pool. A bare id is only reported once it misses both trait and entry
// space, using the same warning-vs-error split as validateItemRefs.
function validateComboTargets(doc, report, opts = {}) {
  const localEntities = entriesIn(doc);
  const localIds = new Set(localEntities.map((e) => e.id));

  const hasAnyCombos = localEntities.some((e) => Array.isArray(e.combos) && e.combos.length);
  if (!hasAnyCombos) return;

  const { hasWiderScope, widerEntities, treatAsError, scopeNote } = resolveWiderScope(doc, localIds, opts);
  const widerIds = hasWiderScope ? new Set(widerEntities.map((e) => e.id)) : null;
  const widerKindById = hasWiderScope ? new Map(widerEntities.map((e) => [e.id, e.kind])) : null;

  const rule = RULES.COMBO_TARGET_RESOLVES;
  for (const [entity, entityPointer] of entitiesWithPointers(doc)) {
    if (!Array.isArray(entity.combos)) continue;
    const traitTargets = collectTraitTargets(entity);

    for (const [i, combo] of entity.combos.entries()) {
      if (!combo || typeof combo !== "object") continue;
      const targets = [{ value: combo.subject, at: `combos[${i}].subject`, pointer: `${entityPointer}/combos/${i}/subject` }];
      for (const [j, item] of (combo.items || []).entries()) {
        targets.push({ value: item, at: `combos[${i}].items[${j}]`, pointer: `${entityPointer}/combos/${i}/items/${j}` });
      }

      for (const { value, at, pointer } of targets) {
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
          if (treatAsError) report.error(msg, { rule, pointer });
          else report.warn(`${msg} ${scopeNote}`, { rule, pointer });
          continue;
        }

        if (traitTargets.has(value)) continue;

        if (widerIds && widerIds.has(value)) continue;
        if (treatAsError) {
          report.error(`${label} matches no trait on "${entity.id}", and no known entry or shared entry`, { rule, pointer });
        } else {
          report.warn(`${label} matches no trait on "${entity.id}", and no known entry or shared entry ${scopeNote}`, { rule, pointer });
        }
      }
    }
  }
}

// Resolves a ref's `to` (DSDS-05/08) against the document's own entries/shared entries first,
// then widens to this document's `rel: file` project and any CLI sibling files - the latter is
// how a standalone entry file (with no `refs` of its own) can still resolve a pointer to a
// sibling. Shared by validateItemRefs and validateComboTargets (DSDS-09) for that same pool.
// An unresolved target is a hard error only when no wider source was even available to check;
// otherwise it's a warning, since an incomplete search can't assert something is truly broken.
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

  // A base document with no `rel: file` link out declares its entries/shared arrays as
  // complete, so an unresolved target there is a hard error. A standalone entry file can never
  // assert that same completeness (it may be one piece of a larger indexed project), so an
  // unresolved target there is always a warning, even with no wider scope to check at all.
  const treatAsError = !opts.standalone && !hasWiderScope;

  // Claims a search only when one actually happened.
  const scopeNote = foundSiblings
    ? "(checked every file given to this run, and this document's own rel: file project)"
    : "(no other file could be checked against)";

  return { hasWiderScope, widerEntities, treatAsError, scopeNote };
}

// DSDS-10: a guidelines item can borrow another item's text via `rel: same-as` while still
// declaring its own required `level`, so nothing else checks the two agree. Once the same-as
// target resolves and has its own `level`, this compares them and errors on a mismatch -
// always a hard error, since resolution (DSDS-05) already succeeded by this point.
function validateSameAsLevels(doc, report, opts = {}) {
  const localEntities = entriesIn(doc);
  const localIds = new Set(localEntities.map((e) => e.id));
  const localItemsByEntity = addressBook(localEntities);

  const { hasWiderScope, widerEntities } = resolveWiderScope(doc, localIds, opts);
  const widerItemsByEntity = hasWiderScope ? addressBook(widerEntities) : null;

  function findItem(targetId, itemId) {
    const book = localItemsByEntity.get(targetId) || (widerItemsByEntity && widerItemsByEntity.get(targetId));
    const { candidate } = book ? resolveAddress(book, itemId) : {};
    return candidate ? candidate.target : null;
  }

  for (const [entity, entityPointer] of entitiesWithPointers(doc)) {
    for (const [si, section] of (entity.sections || []).entries()) {
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
            report.error(
              `"${entity.id}" guidelines item[${i}] declares level "${item.level}" but its same-as target "${ref.to}" declares level "${targetItem.level}" - the two must agree`,
              { rule: RULES.SAME_AS_LEVEL_MATCHES, pointer: `${entityPointer}/sections/${si}/items/${i}/level` },
            );
          }
        }
      }
    }
  }
}

// DSDS-25 (processing model §4, §7): `same-as` sits on a section item and points at an item of
// the same section kind; `replaced-by` sits on a deprecated entry, trait or trait value. Only
// checked once the target resolves - an unresolved one is DSDS-05/DSDS-08's to report.
function isDeprecated(holder) {
  const status = holder && (holder.metadata ? holder.metadata.status : holder.status);
  const all = Array.isArray(status) ? status : status ? [status] : [];
  return all.some((s) => s && typeof s === "object" && s.status === "deprecated");
}

// A kind of pointer with a field of its own goes in that field, not in `refs`, on the objects
// that have the field. Keyed by rel -> field name.
const ENTRY_FIELDS = { uses: "uses", extends: "extends", "alternative-to": "alternatives", "replaced-by": "metadata.status.replacedBy" };
const COMPONENT_FIELDS = { ...ENTRY_FIELDS, contract: "specs" };
const ITEM_FIELDS = { uses: "uses" };
const GUIDELINE_FIELDS = { ...ITEM_FIELDS, "alternative-to": "alternatives", cites: "evidence", "checked-by": "checks", refines: "refines" };
const TRAIT_FIELDS = { "replaced-by": "status.replacedBy" };

function reportMisfiled(refs, fields, label, pointer, report) {
  (Array.isArray(refs) ? refs : []).forEach((ref, i) => {
    const field = ref && typeof ref === "object" && fields[ref.rel];
    if (!field) return;
    report.error(`${label} has a rel: ${ref.rel} ref in \`refs\` - it goes in \`${field}\``, {
      rule: RULES.REF_PLACEMENT,
      pointer: `${pointer}/refs/${i}/rel`,
      fix: `Move it to \`${field}\`, without its \`rel\`: the field says what kind of pointer it is.`,
    });
  });
}

function validateRefPlacement(doc, report, opts = {}) {
  const localEntities = entriesIn(doc);
  const books = addressBook(localEntities);
  const { hasWiderScope, widerEntities } = resolveWiderScope(doc, new Set(localEntities.map((e) => e.id)), opts);
  const widerBooks = hasWiderScope ? addressBook(widerEntities) : new Map();
  const bookOf = (id) => books.get(id) || widerBooks.get(id);
  const rule = RULES.REF_PLACEMENT;

  for (const [entity, entityPointer] of entitiesWithPointers(doc)) {
    if (typeof entity.id !== "string") continue; // not an entry at all; the schema says so
    if (typeof entity.kind === "string") {
      reportMisfiled(entity.refs, entity.kind === "component" ? COMPONENT_FIELDS : ENTRY_FIELDS, `"${entity.id}"`, entityPointer, report);
    }
    (Array.isArray(entity.sections) ? entity.sections : []).forEach((section, si) => {
      if (!section || !["guidelines", "definitions", "steps"].includes(section.kind)) return;
      const fields = section.kind === "guidelines" ? GUIDELINE_FIELDS : ITEM_FIELDS;
      (Array.isArray(section.items) ? section.items : []).forEach((item, ii) => {
        const at = `${entityPointer}/sections/${si}/items/${ii}`;
        if (item && typeof item === "object") reportMisfiled(item.refs, fields, `"${entity.id}" ${section.kind} item[${ii}]`, at, report);
      });
    });
    (Array.isArray(entity.traits) ? entity.traits : []).forEach((trait, ti) => {
      if (!trait || typeof trait !== "object") return;
      reportMisfiled(trait.refs, TRAIT_FIELDS, `"${entity.id}" trait "${trait.id}"`, `${entityPointer}/traits/${ti}`, report);
      (Array.isArray(trait.values) ? trait.values : []).forEach((value, vi) => {
        if (value && typeof value === "object") {
          reportMisfiled(value.refs, TRAIT_FIELDS, `"${entity.id}" trait value "${trait.id}.${value.id}"`, `${entityPointer}/traits/${ti}/values/${vi}`, report);
        }
      });
    });
    const book = books.get(entity.id);
    const found = [];
    findRefs(entity, "", found);
    for (const { to, rel, pointer: refPointer } of found) {
      if (rel !== "same-as" && rel !== "replaced-by") continue;
      const pointer = `${entityPointer}${refPointer}`;
      const owner = book ? ownerOf(book, refPointer) : null;

      if (rel === "same-as") {
        if (!owner || owner.candidate.type !== "item") {
          report.error(`"${entity.id}" has a same-as ref outside a section item - same-as reuses one item's content in another`, { rule, pointer });
          continue;
        }
        const hash = to.indexOf("#");
        const targetBook = hash === -1 ? null : bookOf(to.slice(0, hash));
        const { candidate } = targetBook ? resolveAddress(targetBook, to.slice(hash + 1)) : {};
        if (hash === -1 && bookOf(to)) {
          report.error(`"${entity.id}" same-as "${to}" names a whole entry - same-as reuses one item, so add #itemId`, { rule, pointer: `${pointer}/to` });
        } else if (candidate && (candidate.type !== "item" || candidate.sectionKind !== owner.candidate.sectionKind)) {
          const what = candidate.type === "item" ? `a ${candidate.sectionKind} item` : `a ${candidate.type}`;
          report.error(`"${entity.id}" ${owner.candidate.sectionKind} item reuses "${to}", which is ${what} - same-as reuses an item of the same kind`, { rule, pointer: `${pointer}/to` });
        }
        continue;
      }

      // replaced-by
      if (owner && owner.candidate.type !== "trait" && owner.candidate.type !== "value") {
        report.error(`"${entity.id}" has a replaced-by pointer inside a ${owner.candidate.type} - it belongs in the status of a deprecated entry, trait or trait value`, { rule, pointer });
      } else if (!isDeprecated(owner ? owner.candidate.target : entity)) {
        const what = owner ? `"${entity.id}#${owner.address}"` : `"${entity.id}"`;
        report.error(`${what} has a replaced-by ref but isn't deprecated - give it status: deprecated and a deprecationNotice, or remove the ref`, { rule, pointer });
      }
    }
  }
}

function validateItemRefs(doc, report, opts = {}) {
  const localEntities = entriesIn(doc);
  const localIds = new Set(localEntities.map((e) => e.id));
  const localItemIdsByEntity = addressBook(localEntities);

  const { hasWiderScope, widerEntities, treatAsError, scopeNote } = resolveWiderScope(doc, localIds, opts);
  const widerIds = hasWiderScope ? new Set(widerEntities.map((e) => e.id)) : null;
  const widerItemIdsByEntity = hasWiderScope ? addressBook(widerEntities) : null;
  // An address that names two things can't be followed, wherever it's found.
  const ambiguity = (book, itemId) => {
    const { ambiguous } = resolveAddress(book, itemId);
    return ambiguous ? ambiguous.map((c) => c.pointer).join(" and ") : null;
  };

  // DSDS-08 for a bare id, DSDS-05 for `entryId#address`. `extra` carries an inline link's
  // offset into the finding; a `to` has none.
  function checkTarget(to, label, pointer, extra = {}) {
    const hashIdx = to.indexOf("#");

    if (hashIdx === -1) {
      if (!to || localIds.has(to)) return;
      const rule = RULES.ENTRY_REF_RESOLVES;
      if (treatAsError) {
        report.error(`${label} targets unknown entry/shared "${to}"`, { rule, pointer, ...extra });
      } else if (!widerIds || !widerIds.has(to)) {
        report.warn(`${label} targets unknown entry/shared "${to}" ${scopeNote}`, { rule, pointer, ...extra });
      }
      return;
    }

    const targetId = to.slice(0, hashIdx);
    const itemId = to.slice(hashIdx + 1);
    if (!targetId || !itemId) return;
    const rule = RULES.ITEM_REF_RESOLVES;

    const localItemIds = localItemIdsByEntity.get(targetId);
    if (localItemIds) {
      const twice = ambiguity(localItemIds, itemId);
      if (twice) {
        report.error(`${label} matches more than one item on "${targetId}" (${twice})`, {
          rule,
          pointer,
          fix: `Give one of the two items its own \`id\`, so "${itemId}" names only one of them.`,
          ...extra,
        });
      } else if (!localItemIds.has(itemId)) {
        report.error(`${label} targets unknown item "${itemId}" on "${targetId}"`, { rule, pointer, ...extra });
      }
      return;
    }

    if (treatAsError) {
      report.error(`${label} targets unknown entry/shared "${targetId}"`, { rule, pointer, ...extra });
      return;
    }

    const widerItemIds = widerItemIdsByEntity && widerItemIdsByEntity.get(targetId);
    if (!widerItemIds) {
      report.warn(`${label} targets unknown entry/shared "${targetId}" ${scopeNote}`, { rule, pointer, ...extra });
    } else if (ambiguity(widerItemIds, itemId)) {
      report.error(`${label} matches more than one item on "${targetId}" (${ambiguity(widerItemIds, itemId)})`, { rule, pointer, ...extra });
    } else if (!widerItemIds.has(itemId)) {
      report.warn(`${label} targets unknown item "${itemId}" on "${targetId}" ${scopeNote}`, { rule, pointer, ...extra });
    }
  }

  const skippedBecause = new Set();
  for (const [entity, entityPointer] of entitiesWithPointers(doc)) {
    const found = [];
    findRefs(entity, "", found);
    for (const { to, rel, at, pointer: refPointer } of found) {
      if (to.includes("://")) continue;
      const label = `"${entity.id}" ref${at ? ` (${at})` : ""} "${to}" (rel: ${rel})`;
      checkTarget(to, label, `${entityPointer}${refPointer}/to`);
    }

    // Inline links in Markdown fields (specification §6.5): the same checks as a `to`, plus
    // the shape check the schema makes on a `to` but can't make inside a string.
    const { links, skipped } = inlineLinksIn(entity);
    if (skipped) skippedBecause.add(skipped);
    for (const { pointer: fieldPointer, offset, target } of links) {
      const pointer = `${entityPointer}${fieldPointer}`;
      const label = `"${entity.id}" inline link (${fieldPointer.slice(1).replace(/\//g, ".")}) "dsds:${target}"`;
      if (!TO_PATTERN.test(target)) {
        report.error(`${label} isn't shaped like a \`to\``, {
          rule: RULES.ENTRY_REF_RESOLVES,
          pointer,
          offset,
          fix: "Write the part after `dsds:` the way a `to` would be: an entry id, optionally followed by `#` and an address, like `dsds:shared-a11y#focus-visible`.",
        });
        continue;
      }
      checkTarget(target, label, pointer, { offset });
    }
  }

  // A validator that can't read the links says so, rather than letting them pass unchecked
  // (specification §8). A warning, so --strict fails: it can't vouch for what it didn't check.
  for (const reason of skippedBecause) {
    report.warn(`inline links weren't checked: ${reason}`, {
      fix: "Install the optional dependency (npm install mdast-util-from-markdown) on Node 20.19 or later, then validate again.",
    });
  }
}


// The reusable core: given an already-parsed document, returns every error and warning as
// strings, with no I/O beyond opts.filePath's project discovery and no process exit -
// tools/conformance-test.js reuses this function so fixtures run against the same logic the
// CLI does. Pass opts.filePath whenever the document came from a real file on disk.
//
// Also returns `findings`: the same results as data (rule, severity, pointer, message, fix,
// docs), in the order they were found. `errors`/`warnings` are kept as they always were.
function validateDoc(doc, opts = {}) {
  const report = new Report();
  // A system entry in this document wins over one found among the other files of this run.
  const ownRoot = doc && typeof doc === "object" ? sourceRootIn(doc, opts.filePath) : null;
  if (ownRoot) opts = { ...opts, sourceRoot: ownRoot };
  const isBase = typeof doc.schemaVersion !== "undefined";
  // A root `dsdsVersion` with no `schemaVersion` is the old base-document marker from before 0.20.0
  // (renamed in 0.20.0); catch it here with a clear message instead of routing into
  // validateEntry() and reporting confusing entry-level errors.
  if (!isBase && doc && typeof doc === "object" && typeof doc.dsdsVersion !== "undefined") {
    report.error(
      `this document targets a DSDS version before 0.20.0; 0.20.0 renamed the root "dsdsVersion" field to "schemaVersion" (see the CHANGELOG's 0.20.0 entry for the rest of what changed). Rename the field, or run an older validator against this document instead.`,
      { pointer: "/dsdsVersion", fix: 'Rename "dsdsVersion" to "schemaVersion".' },
    );
  } else if (isBase) {
    validateBase(doc, report, opts);
  } else {
    validateEntry(doc, report, { ...opts, standalone: true });
  }
  return { errors: report.errors, warnings: report.warnings, findings: report.findings };
}

// Reads and validates one file. A file that can't be parsed, or isn't a YAML mapping at all,
// comes back as a single error instead of throwing, so one bad file doesn't stop the run.
function checkFile(target, opts = {}) {
  let doc;
  let problem = null;
  try {
    doc = loadYaml(target);
    if (!doc || typeof doc !== "object" || Array.isArray(doc)) problem = "the file is empty, or isn't a YAML mapping";
  } catch (e) {
    problem = `could not read or parse the file: ${e.message}`;
  }
  if (problem) {
    const report = new Report();
    report.error(problem, { fix: "Fix the file so it parses as a single YAML (or JSON) object." });
    return { doc: null, errors: report.errors, warnings: report.warnings, findings: report.findings };
  }
  return { doc, ...validateDoc(doc, { filePath: target, cliEntities: opts.cliEntities, sourceRoot: opts.sourceRoot }) };
}

function printText(target, result, strict) {
  const { doc, errors, warnings } = result;
  const rel = path.relative(rootDir, target);
  if (errors.length) {
    console.error(`✗ ${rel} failed validation:\n`);
    for (const e of errors) console.error(`  - ${e}`);
    if (warnings.length) {
      console.error(`\n  ${warnings.length} warning(s):`);
      for (const w of warnings) console.error(`  - ${w}`);
    }
    return;
  }

  if (warnings.length && strict) {
    console.error(`✗ ${rel} failed validation in --strict mode:\n`);
    for (const w of warnings) console.error(`  - ${w}`);
    return;
  }

  console.log(`✓ ${rel}`);
  if (typeof doc.schemaVersion !== "undefined") {
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
}

const HELP = `Usage: dsds-validate [options] [file ...]

Checks DSDS documents against the schema and the semantic rules (DSDS-01 to DSDS-11,
DSDS-24 and DSDS-25).
With no files, checks the examples that ship with DSDS.

Files given in one run are treated as one project, so a ref in one file can
resolve to an entry in another.

Options:
  --strict    Fail on warnings too, not just errors.
  --json      Print one JSON report to stdout instead of text.
  -h, --help  Show this help.

Exit codes:
  0  Every file passed.
  1  At least one file has errors (or warnings, with --strict).
  2  An option wasn't recognized.

In --json output, each finding has:
  rule      The rule id (DSDS-XX), or null for a schema error.
  severity  "error" or "warning".
  pointer   Where the problem is, as a JSON Pointer into the document ("" is the whole document).
  offset    Only for an inline link: its character offset within the Markdown field at pointer.
  message   What's wrong.
  fix       How to fix it, or null when there's no single obvious fix.
  docs      The rule's section on the Conformance page, or null for a schema error.

Rules: ${SITE_URL}/conformance#rule-details
`;

// Only run the CLI when invoked directly - tools/conformance-test.js requires this file for
// validateDoc/RULES and must not trigger a second full run (with its own process.exit).
if (require.main === module) {
  const KNOWN_FLAGS = new Set(["--strict", "--json", "--help", "-h"]);
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a.startsWith("-") && !KNOWN_FLAGS.has(a));
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  if (unknown.length) {
    console.error(`Unknown option: ${unknown.join(", ")}\n`);
    process.stderr.write(HELP);
    process.exit(2);
  }
  const strict = args.includes("--strict");
  const json = args.includes("--json");
  const targets = args.filter((a) => !KNOWN_FLAGS.has(a));
  const resolvedTargets = targets.length ? targets : defaultTargets();

  // Every entity across every file given to this run, gathered up front so files passed
  // together (as `npm run check` does) can resolve refs against each other - the only way a
  // standalone entry file (no `refs` of its own) can see its siblings.
  const cliEntities = [];
  let sourceRoot = null; // the first system sourceRoot among these files, for DSDS-11
  for (const target of resolvedTargets) {
    try {
      const doc = loadYaml(target);
      cliEntities.push(...entriesIn(doc));
      if (!sourceRoot && doc && typeof doc === "object") sourceRoot = sourceRootIn(doc, path.resolve(target));
    } catch (e) {
      // checkFile() below reports the real parse/read error for this file.
    }
  }

  let ok = true;
  const files = [];
  for (const target of resolvedTargets) {
    const result = checkFile(target, { cliEntities, sourceRoot });
    const passed = result.errors.length === 0 && !(strict && result.warnings.length);
    if (!passed) ok = false;
    if (json) {
      files.push({
        file: path.relative(process.cwd(), target),
        ok: passed,
        errors: result.errors.length,
        warnings: result.warnings.length,
        findings: result.findings,
      });
    } else {
      printText(target, result, strict);
    }
  }

  if (json) {
    const report = {
      tool: "dsds-validate",
      schemaVersion: SPEC_VERSION,
      strict,
      ok,
      summary: {
        files: files.length,
        errors: files.reduce((n, f) => n + f.errors, 0),
        warnings: files.reduce((n, f) => n + f.warnings, 0),
      },
      files,
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  process.exit(ok ? 0 : 1);
}

module.exports = { validateDoc, RULES };
