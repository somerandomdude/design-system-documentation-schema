#!/usr/bin/env node
/**
 * migrate-to-0.7.js — Migrate DSDS documents to the v0.7 shape.
 *
 * Accepts v0.5.x and v0.6 documents. Transforms applied (growing as v0.7
 * lands; see v0.7-simplification-plan.md):
 *
 *   D1 — metadata array → metadata object keyed by field name.
 *        Wrapper entries lose their `kind` tag; single-value kinds unwrap
 *        to scalars/arrays; status and lastUpdated collapse to a string
 *        shorthand when they carry only the common-case value.
 *   D2 — the `description` metadata entry hoists to a top-level
 *        `description` property on the entity, beside `identifier`/`name`.
 *   richText — structured `{ "value": "...", "format": "..." }` objects
 *        collapse to the bare value string. Rich text is always markdown
 *        in v0.7; plain text and HTML are both valid markdown, so the
 *        value carries over unchanged regardless of its former format.
 *   D3 — documentation groups merge their six typed entity arrays
 *        (components, tokenGroups, themes, foundations, patterns, guides)
 *        into a single `entities` array, concatenated in authored key
 *        order. Each entity's `kind` already identifies its type.
 *   D4 — `example` (variant values, flag variants) and `preview` (state
 *        entries) rename to `examples`, always an array; a bare object
 *        is wrapped. Applies only to identifier-bearing entries, so the
 *        entity-level `preview` metadata field is untouched.
 *   D3b — the root `documentation` property renames to `entityGroups`,
 *        and `$ref` JSON Pointer fragments targeting `#/documentation`
 *        are rewritten to `#/entityGroups`.
 *   D5 — list-shaped block kinds are plural: `guideline` → `guidelines`,
 *        `section` → `sections`, `import` → `imports`. The `purpose`
 *        block becomes `useCases`: its `useCases` payload renames to
 *        `items`, and the freed `purpose` name becomes an optional
 *        umbrella statement on the block (not written by migration).
 *   D6 — the nested `purpose` block on variant values, flag variants,
 *        and state entries becomes a `rationale` richText string. The
 *        block's use cases fold into markdown bullets (stances and
 *        alternatives preserved textually); a warning flags each
 *        conversion so authors can review the wording.
 *   D7 — the agents block is replaced by `agentDocumentBlocks`: an
 *        agent-only array accepting the same document block kinds as
 *        `documentBlocks`. Old agents content converts to blocks there:
 *        intent + disambiguation → a useCases block (intent as the
 *        umbrella purpose; disambiguations as discouraged items with
 *        alternatives), constraints/antiPatterns → a guidelines block
 *        (anti-patterns become MUST_NOT), examples → a sections block.
 *        keywords merge into metadata.tags. verified/verifiedAgainst
 *        have no v0.7 home and are dropped with a warning. The
 *        agent-collection format is retired in v0.7 — collection files
 *        are flagged; move their content into the relevant entities'
 *        agentDocumentBlocks by hand.
 *   D8 — a guideline entry's polymorphic `criteria` array splits:
 *        kind:"reference" entries move to a `references` array (kind tag
 *        dropped); kind:"criterion" entries stay in `criteria` with the
 *        kind tag dropped and `successCriterion` renamed to `statement`.
 *   Version — root documents get `dsdsVersion: "0.7"`, and a `$schema`
 *        URL pointing at a versioned DSDS bundle is repointed to v0.7.
 *
 * The walk is generic: any object carrying a `metadata` array whose entries
 * all have a string `kind` is treated as an entity and transformed, wherever
 * it sits (root entity, documentation groups, token-group children, keyed
 * per-definition example files). Arrays with unknown kinds are left alone
 * and reported, never silently mangled.
 *
 * Usage:
 *   node scripts/migrate-to-0.7.js <file-or-dir> [...more]
 *   node scripts/migrate-to-0.7.js --check <file-or-dir>   # report only
 */

const fs = require("fs");
const path = require("path");

const KNOWN_KINDS = new Set([
  "description",
  "summary",
  "status",
  "since",
  "last-updated",
  "category",
  "tags",
  "aliases",
  "thumbnail",
  "preview",
  "extends",
  "links",
]);

// Canonical key order for the new metadata object.
const META_KEY_ORDER = [
  "status",
  "since",
  "lastUpdated",
  "category",
  "tags",
  "aliases",
  "summary",
  "thumbnail",
  "preview",
  "extends",
  "links",
];

// Preferred leading key order for entity objects after migration.
const ENTITY_KEY_ORDER = ["kind", "identifier", "name", "description", "metadata"];

const warnings = [];

/**
 * Convert one metadata wrapper entry. Returns { key, value } for the new
 * metadata object, { hoist: value } for the description entry, or null when
 * the entry carries no payload (legal empty wrappers in 0.6).
 */
function convertEntry(entry, file) {
  switch (entry.kind) {
    case "description":
      return { hoist: entry.value };
    case "summary":
      return { key: "summary", value: entry.value };
    case "since":
      return { key: "since", value: entry.value };
    case "category":
      return { key: "category", value: entry.value };
    case "tags":
      return { key: "tags", value: entry.items };
    case "aliases":
      return { key: "aliases", value: entry.items };
    case "links":
      return { key: "links", value: entry.items };
    case "status": {
      // 0.6 uses `overall`; 0.5.x used `status`.
      const overall = entry.overall !== undefined ? entry.overall : entry.status;
      const hasDetail = entry.platforms || entry.deprecationNotice;
      if (!hasDetail) return { key: "status", value: overall };
      const value = { overall };
      if (entry.platforms) value.platforms = entry.platforms;
      if (entry.deprecationNotice) value.deprecationNotice = entry.deprecationNotice;
      return { key: "status", value };
    }
    case "last-updated": {
      if (!entry.description) return { key: "lastUpdated", value: entry.value };
      return { key: "lastUpdated", value: { date: entry.value, note: entry.description } };
    }
    case "thumbnail":
      return { key: "thumbnail", value: { url: entry.url, alt: entry.alt } };
    case "preview":
      if (!entry.presentation) return null; // empty wrapper was legal in 0.6
      return { key: "preview", value: entry.presentation };
    case "extends":
      if (!entry.extends) return null; // empty wrapper was legal in 0.6
      return { key: "extends", value: entry.extends };
    default:
      warnings.push(`${file}: unknown metadata kind "${entry.kind}" left untouched`);
      return { unknown: entry };
  }
}

const GROUP_ARRAY_KEYS = [
  "components",
  "tokenGroups",
  "themes",
  "foundations",
  "patterns",
  "guides",
];

/** A legacy documentation group: a kind-less named object with typed entity arrays. */
function isLegacyGroup(node) {
  return (
    !node.kind &&
    typeof node.name === "string" &&
    GROUP_ARRAY_KEYS.some((k) => Array.isArray(node[k]))
  );
}

/** Merge a group's typed arrays into one `entities` array, in authored key order. */
function migrateGroup(obj) {
  const entities = [];
  const rest = {};
  for (const [key, value] of Object.entries(obj)) {
    if (GROUP_ARRAY_KEYS.includes(key) && Array.isArray(value)) {
      entities.push(...value);
    } else {
      rest[key] = value;
    }
  }
  const next = {};
  for (const key of ["name", "description"]) {
    if (rest[key] !== undefined) next[key] = rest[key];
  }
  next.entities = entities;
  for (const [key, value] of Object.entries(rest)) {
    if (!(key in next)) next[key] = value;
  }
  return next;
}

// D5: document-block kind renames (list-shaped kinds are plural).
const KIND_RENAMES = {
  guideline: "guidelines",
  section: "sections",
  import: "imports",
  purpose: "useCases",
};

const RICH_TEXT_FORMATS = new Set(["plain", "markdown", "html"]);

/** A legacy structured richText object: exactly { value: string, format: enum }. */
function isLegacyRichText(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 2 &&
    typeof value.value === "string" &&
    RICH_TEXT_FORMATS.has(value.format)
  );
}

function isLegacyMetadataArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((e) => e && typeof e === "object" && typeof e.kind === "string")
  );
}

/** Rebuild an entity object with migrated metadata and stable key order. */
function migrateEntity(obj, file) {
  const meta = {};
  const unknown = [];
  let hoistedDescription;

  for (const entry of obj.metadata) {
    const result = convertEntry(entry, file);
    if (!result) continue;
    if (result.unknown) {
      unknown.push(result.unknown);
    } else if ("hoist" in result) {
      hoistedDescription = result.hoist;
    } else {
      if (meta[result.key] !== undefined) {
        warnings.push(`${file}: duplicate metadata kind "${entry.kind}" — keeping the first`);
        continue;
      }
      meta[result.key] = result.value;
    }
  }

  const orderedMeta = {};
  for (const key of META_KEY_ORDER) {
    if (meta[key] !== undefined) orderedMeta[key] = meta[key];
  }
  if (unknown.length > 0) orderedMeta.$legacyEntries = unknown;

  const next = {};
  for (const key of ENTITY_KEY_ORDER) {
    if (key === "description") {
      const desc = hoistedDescription !== undefined ? hoistedDescription : obj.description;
      if (desc !== undefined) next.description = desc;
    } else if (key === "metadata") {
      if (Object.keys(orderedMeta).length > 0) next.metadata = orderedMeta;
    } else if (obj[key] !== undefined) {
      next[key] = obj[key];
    }
  }
  for (const [key, value] of Object.entries(obj)) {
    if (!ENTITY_KEY_ORDER.includes(key)) next[key] = value;
  }
  return next;
}

const ENTITY_KINDS = new Set([
  "component",
  "pattern",
  "foundation",
  "theme",
  "token",
  "token-group",
  "guide",
]);

/** Convert an agents inline code example to the common example model. */
function codeExampleToExample(e) {
  return {
    description: e.description,
    presentation: { kind: "code", code: e.code, language: e.language || "text" },
  };
}

/** Convert an agents constraint to a guideline entry. */
function constraintToRule(c) {
  const rule = { guidance: c.rule };
  if (c.context) rule.rationale = c.context;
  rule.level = c.level;
  if (c.evidence) rule.evidence = c.evidence;
  if (Array.isArray(c.examples)) rule.examples = c.examples.map(codeExampleToExample);
  return rule;
}

/** Convert an agents anti-pattern to a MUST_NOT guideline entry. */
function antiPatternToRule(p) {
  const rule = { guidance: p.description };
  if (p.instead) rule.rationale = `Instead: ${p.instead}`;
  rule.level = "MUST_NOT";
  if (p.evidence) rule.evidence = p.evidence;
  return rule;
}

/** Does this object look like a legacy agents block? */
function isLegacyAgents(a) {
  return (
    a &&
    typeof a === "object" &&
    !Array.isArray(a) &&
    (a.intent !== undefined ||
      a.constraints !== undefined ||
      a.antiPatterns !== undefined ||
      a.disambiguation !== undefined ||
      a.examples !== undefined ||
      a.keywords !== undefined ||
      a.verified !== undefined ||
      a.verifiedAgainst !== undefined)
  );
}

/**
 * Convert a legacy agents block to an array of general document blocks
 * for `agentDocumentBlocks` (or an agent-collection scope).
 */
function agentsToBlocks(a) {
  const blocks = [];
  const disamb = Array.isArray(a.disambiguation) ? a.disambiguation : [];
  if (disamb.length) {
    const block = { kind: "useCases" };
    if (a.intent) block.purpose = a.intent;
    block.items = disamb.map((d) => ({
      description: d.distinction,
      stance: "discouraged",
      alternative: { identifier: d.entity },
    }));
    blocks.push(block);
  } else if (a.intent) {
    blocks.push({ kind: "sections", items: [{ title: "Intent", body: a.intent }] });
  }
  const rules = [
    ...(a.constraints || []).map(constraintToRule),
    ...(a.antiPatterns || []).map(antiPatternToRule),
  ];
  if (rules.length) blocks.push({ kind: "guidelines", items: rules });
  if (Array.isArray(a.examples) && a.examples.length) {
    blocks.push({
      kind: "sections",
      items: [{ title: "Examples", examples: a.examples.map(codeExampleToExample) }],
    });
  }
  return blocks;
}

/** Render a nested useCases/purpose block as markdown bullets for `rationale`. */
function purposeToRationale(block) {
  const asText = (v) => (typeof v === "string" ? v : (v && v.value) || "");
  const STANCE_LABEL = { recommended: "Use when:", discouraged: "Avoid when:" };
  const cases = Array.isArray(block.items)
    ? block.items
    : Array.isArray(block.useCases)
      ? block.useCases
      : [];
  const lines = cases.map((uc) => {
    const label = STANCE_LABEL[uc.stance];
    let line = `- ${label ? `${label} ` : ""}${asText(uc.description)}`;
    if (uc.alternative && uc.alternative.identifier) {
      const why = asText(uc.alternative.rationale);
      line += ` Use \`${uc.alternative.identifier}\` instead${why ? ` — ${why}` : "."}`;
    }
    return line;
  });
  const umbrella = asText(block.purpose);
  if (umbrella) lines.unshift(umbrella);
  return lines.join("\n");
}

/** Rename one key in place, preserving the object's key order. */
function renameKey(obj, from, to, mapValue) {
  const next = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === from) next[to] = mapValue ? mapValue(value) : value;
    else next[key] = value;
  }
  return next;
}

function walk(node, file) {
  if (Array.isArray(node)) return node.map((item) => walk(item, file));
  if (!node || typeof node !== "object") return node;
  if (isLegacyRichText(node)) return node.value;

  let current = node;
  if (isLegacyMetadataArray(node.metadata)) {
    current = migrateEntity(node, file);
  }
  if (isLegacyGroup(current)) {
    current = migrateGroup(current);
  }
  // D3b: root `documentation` → `entityGroups`; rewrite pointer fragments
  if (typeof current.dsdsVersion === "string" && Array.isArray(current.documentation)) {
    current = renameKey(current, "documentation", "entityGroups");
  }
  // Version: stamp root documents as 0.7 and repoint versioned $schema URLs
  if (typeof current.dsdsVersion === "string" && current.dsdsVersion !== "0.7") {
    current = { ...current, dsdsVersion: "0.7" };
    if (
      typeof current.$schema === "string" &&
      /\/v\d+[^/]*\//.test(current.$schema)
    ) {
      current = {
        ...current,
        $schema: current.$schema.replace(/\/v\d+[^/]*\//, "/v0.7/"),
      };
    }
  }
  // D5: plural list-block kinds; purpose block → useCases with items payload
  if (KIND_RENAMES[current.kind]) {
    current = { ...current, kind: KIND_RENAMES[current.kind] };
  }
  if (current.kind === "useCases" && Array.isArray(current.useCases)) {
    current = renameKey(current, "useCases", "items");
  }
  if (current.kind === "useCases" && !Array.isArray(current.items)) {
    warnings.push(`${file}: useCases block has no items — required in v0.7`);
  }
  // Agent collections: the format is retired in v0.7 — flag, don't touch
  if (
    typeof current.schema === "string" &&
    current.schema.includes("agent-collection")
  ) {
    warnings.push(
      `${file}: agent-collection files are retired in v0.7 — move scope content into the relevant entities' agentDocumentBlocks by hand`,
    );
  }
  // D7 (entities): agents → agentDocumentBlocks + metadata tags
  if (ENTITY_KINDS.has(current.kind) && isLegacyAgents(current.agents)) {
    const a = current.agents;
    const blocks = agentsToBlocks(a);
    let next = { ...current };
    if (Array.isArray(a.keywords) && a.keywords.length) {
      const meta = { ...(next.metadata || {}) };
      const tags = Array.isArray(meta.tags) ? [...meta.tags] : [];
      for (const k of a.keywords) if (!tags.includes(k)) tags.push(k);
      meta.tags = tags;
      next.metadata = meta;
    }
    if (a.verified || a.verifiedAgainst) {
      warnings.push(
        `${file}: agents.verified/verifiedAgainst on "${next.identifier}" dropped — no v0.7 home`,
      );
    }
    delete next.agents;
    if (blocks.length) {
      next.agentDocumentBlocks = [...(next.agentDocumentBlocks || []), ...blocks];
    }
    warnings.push(
      `${file}: agents on "${next.identifier}" converted to agentDocumentBlocks/metadata — review wording`,
    );
    current = next;
  }
  if (typeof current.$ref === "string" && current.$ref.includes("#/documentation")) {
    current = {
      ...current,
      $ref: current.$ref.replace("#/documentation", "#/entityGroups"),
    };
  }
  // D6: nested purpose block → rationale richText on identifier-bearing
  // entries (variant values, flag variants, state entries)
  if (
    typeof current.identifier === "string" &&
    current.purpose &&
    typeof current.purpose === "object" &&
    (current.purpose.kind === "useCases" || current.purpose.kind === "purpose")
  ) {
    const rationale = purposeToRationale(current.purpose);
    if (rationale) {
      warnings.push(
        `${file}: nested purpose on "${current.identifier}" folded into rationale — review wording`,
      );
      current = renameKey(current, "purpose", "rationale", () => rationale);
    } else {
      const { purpose, ...rest } = current;
      current = rest;
      warnings.push(
        `${file}: empty nested purpose on "${current.identifier}" dropped`,
      );
    }
  }
  // D8: split a guideline entry's polymorphic criteria into plain
  // criterion (testable condition) and reference (citation) shapes
  if (
    current.guidance !== undefined &&
    Array.isArray(current.criteria) &&
    current.criteria.some((c) => c && (c.kind === "reference" || c.kind === "criterion"))
  ) {
    const criteria = [];
    const references = Array.isArray(current.references) ? [...current.references] : [];
    for (const c of current.criteria) {
      if (c && c.kind === "reference") {
        const { kind, ...rest } = c;
        references.push(rest);
      } else if (c && c.kind === "criterion") {
        const { kind, successCriterion, ...rest } = c;
        const crit = {};
        if (rest.identifier !== undefined) crit.identifier = rest.identifier;
        if (rest.title !== undefined) crit.title = rest.title;
        if (successCriterion !== undefined) crit.statement = successCriterion;
        for (const [key, value] of Object.entries(rest)) {
          if (!(key in crit)) crit[key] = value;
        }
        criteria.push(crit);
      } else {
        criteria.push(c);
      }
    }
    const next = { ...current };
    if (criteria.length) next.criteria = criteria;
    else delete next.criteria;
    if (references.length) next.references = references;
    current = next;
  }
  // D4: example/preview → examples on identifier-bearing doc entries
  // (variant values, flag variants, state entries). The guard on
  // `identifier` keeps the entity-level `preview` metadata field intact.
  if (typeof current.identifier === "string" && current.example !== undefined) {
    current = renameKey(current, "example", "examples", (v) =>
      Array.isArray(v) ? v : [v],
    );
  }
  if (typeof current.identifier === "string" && Array.isArray(current.preview)) {
    current = renameKey(current, "preview", "examples");
  }
  if (current.kind === "anatomy" && Array.isArray(current.preview)) {
    current = renameKey(current, "preview", "examples");
  }
  const result = {};
  for (const [key, value] of Object.entries(current)) {
    result[key] = walk(value, file);
  }
  return result;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".json") ? [target] : [];
  const results = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(fullPath));
    else if (entry.name.endsWith(".json")) results.push(fullPath);
  }
  return results.sort();
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const targets = args.filter((a) => a !== "--check");

  if (targets.length === 0) {
    console.error("Usage: node scripts/migrate-to-0.7.js [--check] <file-or-dir> [...more]");
    process.exit(1);
  }

  let changed = 0;
  let unchanged = 0;

  for (const target of targets) {
    for (const file of collectFiles(path.resolve(target))) {
      const rel = path.relative(process.cwd(), file);
      const original = fs.readFileSync(file, "utf-8");
      let data;
      try {
        data = JSON.parse(original);
      } catch (e) {
        warnings.push(`${rel}: invalid JSON, skipped — ${e.message}`);
        continue;
      }
      const migrated = walk(data, rel);
      const output = JSON.stringify(migrated, null, 2) + "\n";
      const originalNormalized = JSON.stringify(data, null, 2) + "\n";
      if (output === originalNormalized) {
        unchanged++;
        continue;
      }
      changed++;
      if (check) {
        console.log(`  would migrate ${rel}`);
      } else {
        fs.writeFileSync(file, output);
        console.log(`  ✓ migrated ${rel}`);
      }
    }
  }

  console.log(`\n${changed} file(s) ${check ? "need migration" : "migrated"}, ${unchanged} unchanged`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  process.exit(warnings.length > 0 && check ? 1 : 0);
}

main();
