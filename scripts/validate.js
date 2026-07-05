#!/usr/bin/env node
/**
 * validate.js — Validate DSDS example files against the bundled schema.
 *
 * Validates:
 *   1. All .dsds.json files in spec/examples/ (recursively) against the bundled schema
 *   2. All per-definition example files in spec/examples/{common,document-blocks,entities}/
 *      against their matching $defs in the bundled schema
 *   3. Bare entity files (e.g. spec/examples/minimal/*.json) against their
 *      entity $def, detected via the top-level `kind` property
 *
 * Usage:
 *   node scripts/validate.js
 *
 * Requires:
 *   npm install ajv ajv-formats
 */

const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const BUNDLED_SCHEMA_PATH = path.join(
  ROOT,
  "spec/schema/dsds.bundled.schema.json",
);
const EXAMPLES_DIR = path.join(ROOT, "spec/examples");
const SCHEMA_DIR = path.join(ROOT, "spec/schema");

// Directories containing keyed per-definition example files ({ defName: value })
const KEYED_EXAMPLE_DIRS = ["common", "document-blocks", "entities", "metadata"];


// Directories containing bare entity example files ({ type: "component", ... })
const BARE_ENTITY_DIRS = ["minimal"];

// ---------------------------------------------------------------------------
// Setup Ajv
// ---------------------------------------------------------------------------

function createValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: true,
  });
  addFormats(ajv);
  return ajv;
}

// ---------------------------------------------------------------------------
// Friendly errors — discriminator-aware reporting
//
// A `oneOf` union over 16+ block kinds makes raw Ajv output useless: one
// typo'd `kind` yields hundreds of errors, one per branch the object failed
// to match. Instead of dumping those, walk each error up to the nearest
// object carrying a `kind` discriminator and report against that:
//   - unknown kind        → "unknown kind 'x' — did you mean 'y'?"
//   - known kind          → validate against that kind's schema only
//   - valid in isolation  → the problem is placement (kind not allowed here)
// ---------------------------------------------------------------------------

/** Map of kind const → $defs name, built from the bundled schema. */
function buildKindIndex(schema) {
  const index = {};
  for (const [name, def] of Object.entries(schema.$defs || {})) {
    const kindConst =
      def && def.properties && def.properties.kind && def.properties.kind.const;
    if (typeof kindConst === "string") index[kindConst] = name;
  }
  return index;
}

function getAtPointer(doc, pointer) {
  if (!pointer) return doc;
  let node = doc;
  for (const raw of pointer.split("/").slice(1)) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (node == null) return undefined;
    node = Array.isArray(node) ? node[Number(key)] : node[key];
  }
  return node;
}

function editDistance(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return m[a.length][b.length];
}

function closestKind(kind, knownKinds) {
  let best = null;
  let bestDist = Infinity;
  for (const k of knownKinds) {
    const d = editDistance(kind, k);
    if (d < bestDist) {
      bestDist = d;
      best = k;
    }
  }
  // Only suggest when plausibly a typo (small edit distance).
  return bestDist <= Math.max(2, Math.floor(kind.length / 3)) ? best : null;
}

/**
 * Translate raw Ajv errors into a short, actionable list. Returns an array
 * of "path: message" strings; empty if no kind-bearing context was found
 * (caller should fall back to raw errors).
 */
// Shape hints for known convention traps — positions where the intuitive
// wrong guess produces an unhelpful raw error. Each hint claims its path so
// the generic machinery doesn't pile on.
function shapeHints(doc, rawErrors) {
  const hints = new Map(); // path -> message
  for (const err of rawErrors) {
    const p = err.instancePath || "";
    if (/\/metadata\/status$/.test(p) && !hints.has(p)) {
      const node = getAtPointer(doc, p);
      if (node && typeof node === "object" && !("overall" in node)) {
        hints.set(
          p,
          `${p}: status is a bare string ("stable") or an object with \`overall\` — there is no other shape`,
        );
      }
    }
    if (/\/tokens$/.test(p) && err.message === "must be object" && !hints.has(p)) {
      hints.set(
        p,
        `${p}: \`tokens\` is a purpose-keyed map, not an array — keys say what the token controls, values name the token, e.g. { "text-color": "color-button-fg" }`,
      );
    }
  }
  return hints;
}

function friendlyErrors(doc, rawErrors, schema, ajv) {
  const kindIndex = buildKindIndex(schema);
  const knownKinds = Object.keys(kindIndex);
  const defValidators = {};
  const compileDef = (name) => {
    if (!(name in defValidators)) {
      try {
        defValidators[name] = ajv.compile({
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $defs: schema.$defs,
          ...schema.$defs[name],
        });
      } catch {
        defValidators[name] = null;
      }
    }
    return defValidators[name];
  };

  // Convention-trap hints claim their paths first.
  const hints = shapeHints(doc, rawErrors);

  // Group every raw error under the nearest ancestor that carries `kind`.
  const contexts = new Map(); // pointer -> node
  for (const err of rawErrors) {
    let p = err.instancePath || "";
    if (hints.has(p)) continue;
    let found = null;
    while (true) {
      const node = getAtPointer(doc, p);
      if (
        node &&
        typeof node === "object" &&
        !Array.isArray(node) &&
        typeof node.kind === "string"
      ) {
        found = p;
        break;
      }
      if (!p) break;
      p = p.slice(0, p.lastIndexOf("/"));
    }
    if (found !== null) contexts.set(found, getAtPointer(doc, found));
  }
  if (contexts.size === 0 && hints.size === 0) return [];

  // Deepest contexts first: a parent context (e.g. the entity) re-validates
  // its whole subtree, so any of its errors that fall inside a child context
  // (e.g. a block) are noise already explained at the child. Track reported
  // pointers and filter parent errors that land inside them.
  const ordered = Array.from(contexts.keys()).sort(
    (a, b) => b.split("/").length - a.split("/").length,
  );
  const reported = Array.from(hints.keys());
  const inReported = (absPath) =>
    reported.some((r) => absPath === r || absPath.startsWith(`${r}/`));

  const messages = new Set();
  for (const pointer of ordered) {
    const node = contexts.get(pointer);
    const where = pointer || "(root)";
    if (!knownKinds.includes(node.kind)) {
      const suggestion = closestKind(node.kind, knownKinds);
      messages.add(
        `${where}: unknown kind '${node.kind}'` +
          (suggestion ? ` — did you mean '${suggestion}'?` : ""),
      );
      reported.push(pointer);
      continue;
    }
    const validateDef = compileDef(kindIndex[node.kind]);
    if (!validateDef) continue;
    if (validateDef(node)) {
      if (!inReported(pointer)) {
        messages.add(
          `${where}: '${node.kind}' is valid on its own but not allowed here — check which kinds this position accepts`,
        );
        reported.push(pointer);
      }
    } else {
      let emitted = 0;
      for (const e of validateDef.errors) {
        const abs = `${pointer}${e.instancePath}`;
        if (inReported(abs)) continue;
        messages.add(`${abs || "(root)"}: ${e.message}`);
        if (++emitted >= 5) break;
      }
      if (emitted > 0) reported.push(pointer);
    }
  }
  return [...hints.values(), ...Array.from(messages)];
}

// ---------------------------------------------------------------------------
// Part 1: Validate example .dsds.json files against the bundled schema
// ---------------------------------------------------------------------------

/**
 * Recursively find all files matching a suffix under a directory.
 */
function findFilesRecursive(dir, suffix) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, suffix));
    } else if (entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function validateExamples(ajv) {
  console.log("━━━ Validating example files ━━━\n");

  const schemaText = fs.readFileSync(BUNDLED_SCHEMA_PATH, "utf-8");
  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (e) {
    console.error(`  ✗ Failed to parse bundled schema: ${e.message}`);
    return { passed: 0, failed: 1, errors: [] };
  }

  const validate = ajv.compile(schema);

  // Examples plus the real-world documents in test/ (test/invalid/ has its
  // own must-fail pass in Part 4).
  const files = findFilesRecursive(EXAMPLES_DIR, ".dsds.json").concat(
    findFilesRecursive(path.join(ROOT, "test"), ".dsds.json").filter(
      (f) => !f.includes(`${path.sep}invalid${path.sep}`),
    ),
  );

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const filePath of files) {
    const file = path.relative(EXAMPLES_DIR, filePath);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error(`  ✗ ${file}: Invalid JSON — ${e.message}`);
      failed++;
      errors.push({ file, error: `Invalid JSON: ${e.message}` });
      continue;
    }

    const valid = validate(data);
    if (valid) {
      console.log(`  ✓ ${file}`);
      passed++;
    } else {
      console.error(`  ✗ ${file}`);
      const friendly = friendlyErrors(data, validate.errors, schema, ajv);
      if (friendly.length > 0) {
        for (const msg of friendly) {
          console.error(`      ${msg}`);
          errors.push({ file, message: msg });
        }
      } else {
        for (const err of validate.errors.slice(0, 8)) {
          const loc = err.instancePath || "(root)";
          const msg = err.message || JSON.stringify(err.params);
          console.error(`      ${loc}: ${msg}`);
          errors.push({ file, path: loc, message: msg });
        }
        if (validate.errors.length > 8) {
          console.error(
            `      … ${validate.errors.length - 8} more (raw validator output)`,
          );
        }
      }
      failed++;
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}

// ---------------------------------------------------------------------------
// Part 2: Validate per-definition example files against their schema defs
// ---------------------------------------------------------------------------

function validateDefinitionExamples(ajv) {
  console.log("━━━ Validating per-definition example files ━━━\n");

  const schema = JSON.parse(fs.readFileSync(BUNDLED_SCHEMA_PATH, "utf-8"));
  const defs = schema.$defs || {};

  // Pre-compile validators for each definition
  const defValidators = {};
  for (const [name, defSchema] of Object.entries(defs)) {
    try {
      const standalone = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: schema.$defs,
        ...defSchema,
      };
      defValidators[name] = ajv.compile(standalone);
    } catch (e) {
      // Some defs may not compile standalone — skip
    }
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const errors = [];

  // --- Keyed example files: { defName: value | value[] } ---

  for (const dir of KEYED_EXAMPLE_DIRS) {
    const exampleDir = path.join(EXAMPLES_DIR, dir);
    if (!fs.existsSync(exampleDir)) continue;

    const files = fs
      .readdirSync(exampleDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const file of files) {
      const filePath = path.join(exampleDir, file);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.error(`  ✗ ${dir}/${file}: Invalid JSON — ${e.message}`);
        failed++;
        errors.push({
          file: `${dir}/${file}`,
          error: `Invalid JSON: ${e.message}`,
        });
        continue;
      }

      const defNames = Object.keys(data);
      let fileOk = true;

      for (const defName of defNames) {
        const exampleValue = data[defName];
        const validator = defValidators[defName];

        if (!validator) {
          console.log(
            `  ~ ${dir}/${file} → ${defName}: no standalone validator (skipped)`,
          );
          skipped++;
          continue;
        }

        // The example value can be a single instance or an array of instances
        const instances = Array.isArray(exampleValue)
          ? exampleValue
          : [exampleValue];

        for (let idx = 0; idx < instances.length; idx++) {
          const instance = instances[idx];
          const label = Array.isArray(exampleValue)
            ? `${defName}[${idx}]`
            : defName;

          const valid = validator(instance);
          if (valid) {
            passed++;
          } else {
            fileOk = false;
            console.error(`  ✗ ${dir}/${file} → ${label}`);
            for (const err of validator.errors.slice(0, 3)) {
              const loc = err.instancePath || "(root)";
              const msg = err.message || JSON.stringify(err.params);
              console.error(`      ${loc}: ${msg}`);
              errors.push({
                file: `${dir}/${file}`,
                def: label,
                path: loc,
                message: msg,
              });
            }
            failed++;
          }
        }
      }

      if (fileOk) {
        console.log(
          `  ✓ ${dir}/${file} (${defNames.length} definition${defNames.length === 1 ? "" : "s"})`,
        );
      }
    }
  }

  // --- Bare entity files: { type: "component", name: "...", ... } ---
  // Detected by a top-level `type` property whose value matches a known $def.

  for (const dir of BARE_ENTITY_DIRS) {
    const exampleDir = path.join(EXAMPLES_DIR, dir);
    if (!fs.existsSync(exampleDir)) continue;

    const files = fs
      .readdirSync(exampleDir)
      .filter((f) => f.endsWith(".json") && !f.endsWith(".dsds.json"))
      .sort();

    for (const file of files) {
      const filePath = path.join(exampleDir, file);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.error(`  ✗ ${dir}/${file}: Invalid JSON — ${e.message}`);
        failed++;
        errors.push({
          file: `${dir}/${file}`,
          error: `Invalid JSON: ${e.message}`,
        });
        continue;
      }

      // Determine the def name from the kind property
      const typeName = data.kind;
      const defName = typeName === "token-group" ? "tokenGroup" : typeName;
      const validator = defValidators[defName];

      if (!validator) {
        console.log(
          `  ~ ${dir}/${file}: kind "${typeName}" has no standalone validator (skipped)`,
        );
        skipped++;
        continue;
      }

      const valid = validator(data);
      if (valid) {
        console.log(`  ✓ ${dir}/${file} (${defName})`);
        passed++;
      } else {
        console.error(`  ✗ ${dir}/${file} → ${defName}`);
        for (const err of validator.errors.slice(0, 3)) {
          const loc = err.instancePath || "(root)";
          const msg = err.message || JSON.stringify(err.params);
          console.error(`      ${loc}: ${msg}`);
          errors.push({
            file: `${dir}/${file}`,
            def: defName,
            path: loc,
            message: msg,
          });
        }
        failed++;
      }
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  return { passed, failed, skipped, errors };
}

// ---------------------------------------------------------------------------
// Part 3: Semantic checks — normative rules JSON Schema cannot express
// ---------------------------------------------------------------------------

// Extension keys MUST use vendor-specific namespaces (reverse domain name
// notation recommended) — enforced as "contains at least one dot separator",
// e.g. 'com.figma', 'acme.tooling'.
const EXTENSION_KEY_REGEX = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)+$/;

/**
 * Walk a parsed DSDS document and apply the semantic rules:
 *   1. Entity identifiers MUST be unique within their entity group (and
 *      token/token-group identifiers within their parent's `children`).
 *   2. `$extensions` keys MUST be vendor-namespaced.
 *   3. Criterion identifiers MUST be unique within their entity
 *      (rules/rules.yaml DSDS-002 — test runs report against them).
 *   4. Relationship edges MUST resolve, not self-reference, not duplicate,
 *      and stay acyclic across composes/depends-on.
 *   5. Token-override references (anatomy, states, variants) MUST resolve
 *      against the documented token layer when one is present.
 *   6. `docOrigin.blocks` keys MUST match a block kind on the entity.
 *   7. String token references (theme overrides, scale steps, motion entries)
 *      MUST resolve; token `tokenType` MUST be present or group-inherited;
 *      section anchors MUST be unique within their parent block.
 * Returns an array of { path, message } findings.
 */
const ENTITY_KIND_SET = new Set([
  "component",
  "pattern",
  "foundation",
  "guide",
  "theme",
  "token",
  "token-group",
  "chunk",
]);

/** Collect every entity identifier in the document (including nested token children). */
function collectEntityIdentifiers(doc) {
  const ids = new Set();
  function scan(node) {
    if (Array.isArray(node)) return node.forEach(scan);
    if (!node || typeof node !== "object") return;
    if (ENTITY_KIND_SET.has(node.kind) && typeof node.identifier === "string") {
      ids.add(node.identifier);
    }
    Object.values(node).forEach(scan);
  }
  scan(doc);
  return ids;
}

/** Collect identifiers of token-layer entities (token, token-group). Used to
 * decide whether a document documents its token layer — anatomy token
 * references are only resolvable when it does. */
const TOKEN_KINDS = new Set(["token", "token-group"]);
function collectTokenIdentifiers(doc) {
  const ids = new Set();
  (function scan(node) {
    if (Array.isArray(node)) return node.forEach(scan);
    if (!node || typeof node !== "object") return;
    if (TOKEN_KINDS.has(node.kind) && typeof node.identifier === "string") {
      ids.add(node.identifier);
    }
    Object.values(node).forEach(scan);
  })(doc);
  return ids;
}

/** True when the document contains unresolved fileRefs ({$ref: …}). */
function hasFileRefs(doc) {
  let found = false;
  function scan(node) {
    if (found) return;
    if (Array.isArray(node)) return node.forEach(scan);
    if (!node || typeof node !== "object") return;
    if (typeof node.$ref === "string") { found = true; return; }
    Object.values(node).forEach(scan);
  }
  scan(doc);
  return found;
}

function semanticFindings(doc) {
  const findings = [];

  // Entity-reference resolution: every entityRef in a pattern's interaction
  // `components` must name an entity documented in this document. Skipped
  // when the document carries unresolved $refs — the full catalog isn't
  // visible until a resolver joins the files.
  const refsResolvable = !hasFileRefs(doc);
  const catalog = refsResolvable ? collectEntityIdentifiers(doc) : null;
  // Token layer — present only when the document itself documents tokens.
  // Anatomy token references resolve against it; when absent (tokens live in
  // an external DTCG layer) anatomy token resolution is skipped.
  const tokenLayer = refsResolvable ? collectTokenIdentifiers(doc) : null;

  function checkComponentRefs(node, nodePath) {
    if (!catalog || !Array.isArray(node.components)) return;
    node.components.forEach((ref, i) => {
      if (ref && typeof ref === "object" && typeof ref.identifier === "string") {
        if (!catalog.has(ref.identifier)) {
          findings.push({
            path: `${nodePath}/components/${i}/identifier`,
            message: `entity reference '${ref.identifier}' resolves to no entity documented in this file — a reference that resolves to nothing is a defect (entityRef resolution)`,
          });
        }
      }
    });
  }

  // DSDS-002 (static half): within one entity, no two criteria share an
  // identifier. Nested token-group children are their own entity scopes.
  function checkCriterionScope(entity, entityPath) {
    const seen = new Map();
    function scan(node, p) {
      if (Array.isArray(node)) {
        node.forEach((v, i) => scan(v, `${p}/${i}`));
        return;
      }
      if (!node || typeof node !== "object") return;
      if (node !== entity && ENTITY_KIND_SET.has(node.kind)) return; // child entity = own scope
      if (Array.isArray(node.criteria)) {
        node.criteria.forEach((c, i) => {
          const id = c && c.identifier;
          if (typeof id !== "string") return;
          if (seen.has(id)) {
            findings.push({
              path: `${p}/criteria/${i}/identifier`,
              message: `criterion identifier '${id}' is reused within the same entity (first used at ${seen.get(id)}) — test results report against this identifier (DSDS-002)`,
            });
          } else {
            seen.set(id, `${p}/criteria/${i}`);
          }
        });
      }
      for (const [k, v] of Object.entries(node)) {
        if (k === "criteria") continue;
        scan(v, `${p}/${k}`);
      }
    }
    scan(entity, entityPath);
  }

  function checkIdentifierScope(items, pathPrefix) {
    const seen = new Map();
    items.forEach((item, i) => {
      if (!item || typeof item !== "object" || item.$ref) return;
      const id = item.identifier;
      if (typeof id !== "string") return;
      if (seen.has(id)) {
        findings.push({
          path: `${pathPrefix}/${i}/identifier`,
          message: `duplicate identifier '${id}' in the same scope (first used at ${pathPrefix}/${seen.get(id)})`,
        });
      } else {
        seen.set(id, i);
      }
    });
  }

  // Relationship-graph integrity: every relationships[].target MUST resolve to
  // a documented entity; an edge MUST NOT point at its own entity; and an
  // entity MUST NOT declare the same (relation, target) edge twice. Resolution
  // is skipped when unresolved $refs hide part of the catalog.
  function checkRelationships(entity, entityPath) {
    if (!Array.isArray(entity.relationships)) return;
    const seen = new Set();
    entity.relationships.forEach((edge, i) => {
      if (!edge || typeof edge !== "object") return;
      const { relation, target } = edge;
      if (typeof target !== "string" || typeof relation !== "string") return;
      const p = `${entityPath}/relationships/${i}`;
      if (catalog && !catalog.has(target)) {
        findings.push({
          path: `${p}/target`,
          message: `relationship target '${target}' resolves to no entity documented in this file — a reference that resolves to nothing is a defect (entityRef resolution)`,
        });
      }
      if (target === entity.identifier) {
        findings.push({
          path: `${p}/target`,
          message: `entity '${entity.identifier}' declares a '${relation}' relationship to itself — an edge must point at another entity`,
        });
      }
      const key = `${relation} ${target}`;
      if (seen.has(key)) {
        findings.push({
          path: p,
          message: `duplicate relationship edge '${relation}' → '${target}' on entity '${entity.identifier}'`,
        });
      } else {
        seen.add(key);
      }
    });
  }

  // Cycle detection for the acyclic relations ('composes', 'depends-on'). A
  // cycle means an entity is, transitively, composed of or dependent on itself.
  // Needs the full catalog to follow edges, so it is skipped under unresolved
  // $refs. Only edges whose target resolves are followed.
  function checkRelationshipCycles() {
    if (!catalog) return;
    const DAG_RELATIONS = new Set(["composes", "depends-on"]);
    const adj = new Map();
    (function collect(node) {
      if (Array.isArray(node)) return node.forEach(collect);
      if (!node || typeof node !== "object") return;
      if (
        ENTITY_KIND_SET.has(node.kind) &&
        typeof node.identifier === "string" &&
        Array.isArray(node.relationships)
      ) {
        const outs = node.relationships
          .filter(
            (e) =>
              e &&
              DAG_RELATIONS.has(e.relation) &&
              typeof e.target === "string" &&
              catalog.has(e.target),
          )
          .map((e) => e.target);
        if (outs.length) {
          adj.set(node.identifier, (adj.get(node.identifier) || []).concat(outs));
        }
      }
      Object.values(node).forEach(collect);
    })(doc);

    const GRAY = 1;
    const BLACK = 2;
    const color = new Map();
    const stack = [];
    let reported = false;
    function dfs(id) {
      if (reported) return;
      color.set(id, GRAY);
      stack.push(id);
      for (const next of adj.get(id) || []) {
        const c = color.get(next) || 0;
        if (c === GRAY) {
          const cycle = stack.slice(stack.indexOf(next)).concat(next).join(" → ");
          findings.push({
            path: "",
            message: `relationship cycle across 'composes'/'depends-on' edges: ${cycle} — these relations must form an acyclic graph`,
          });
          reported = true;
          return;
        }
        if (c === 0) dfs(next);
      }
      stack.pop();
      color.set(id, BLACK);
    }
    for (const id of adj.keys()) {
      if (!reported && (color.get(id) || 0) === 0) dfs(id);
    }
  }

  // Token-override references resolve against the documented token layer. The
  // shared tokenOverrides map appears on anatomy parts, states, and variant
  // values/flags — every position resolves under the same rule. When the
  // document documents no tokens (external DTCG layer), this is skipped —
  // matching the schema's "in a system that documents its token layer" rule.
  function checkTokenOverrides(node, nodePath) {
    if (!tokenLayer || tokenLayer.size === 0) return;
    const tokens = node.tokens;
    if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) return;
    for (const [purpose, id] of Object.entries(tokens)) {
      if (typeof id === "string" && !tokenLayer.has(id)) {
        findings.push({
          path: `${nodePath}/tokens/${purpose}`,
          message: `token override '${id}' resolves to no documented token — with a token layer present, token-override references MUST name a documented token (entityRef resolution)`,
        });
      }
    }
  }

  // Section anchors MUST be unique within their parent block — same rule as
  // checkIdentifierScope, keyed on `anchor` (sections deep-link by anchor,
  // not identifier).
  function checkAnchorScope(items, pathPrefix) {
    const seen = new Map();
    items.forEach((item, i) => {
      if (!item || typeof item !== "object") return;
      const a = item.anchor;
      if (typeof a !== "string") return;
      if (seen.has(a)) {
        findings.push({
          path: `${pathPrefix}/${i}/anchor`,
          message: `duplicate section anchor '${a}' in the same block (first used at ${pathPrefix}/${seen.get(a)}) — anchors MUST be unique within the parent block`,
        });
      } else {
        seen.set(a, i);
      }
    });
  }

  // String token references — theme override entries, scale steps, and motion
  // entries each carry a `token` property that MUST name a documented token.
  // Same token-layer gate as the tokenOverrides maps.
  function checkTokenRefString(node, nodePath) {
    if (!tokenLayer || tokenLayer.size === 0) return;
    if (typeof node.token !== "string") return;
    if (ENTITY_KIND_SET.has(node.kind)) return; // entities never carry a token ref property
    if (!tokenLayer.has(node.token)) {
      findings.push({
        path: `${nodePath}/token`,
        message: `token reference '${node.token}' resolves to no documented token — with a token layer present, token references MUST name a documented token (entityRef resolution)`,
      });
    }
  }

  // Token tokenType inheritance: a token may omit `tokenType` only when an
  // ancestor token group declares it (children inherit the group's value).
  function checkTokenTypeInheritance() {
    (function scan(node, inherited, p) {
      if (Array.isArray(node)) return node.forEach((v, i) => scan(v, inherited, `${p}/${i}`));
      if (!node || typeof node !== "object") return;
      let next = inherited;
      if (node.kind === "token-group") {
        next = typeof node.tokenType === "string" ? node.tokenType : inherited;
      } else if (node.kind === "token") {
        if (typeof node.tokenType !== "string" && !next) {
          findings.push({
            path: `${p}/tokenType`,
            message: `token '${node.identifier}' has no tokenType and no ancestor token group declares one — tokenType MUST be present or inherited`,
          });
        }
      }
      for (const [k, v] of Object.entries(node)) scan(v, next, `${p}/${k}`);
    })(doc, null, "");
  }

  // docOrigin per-block overrides: every key in metadata.docOrigin.blocks MUST
  // match the `kind` of a block in the entity's documentBlocks or
  // agentDocumentBlocks — a key that matches no block is a defect.
  function checkDocOriginBlocks(entity, entityPath) {
    const docOrigin = entity.metadata && entity.metadata.docOrigin;
    if (!docOrigin || typeof docOrigin !== "object") return;
    const blocks = docOrigin.blocks;
    if (!blocks || typeof blocks !== "object") return;
    const kinds = new Set(
      [].concat(entity.documentBlocks || [], entity.agentDocumentBlocks || [])
        .map((b) => b && b.kind)
        .filter(Boolean),
    );
    for (const key of Object.keys(blocks)) {
      if (!kinds.has(key)) {
        findings.push({
          path: `${entityPath}/metadata/docOrigin/blocks/${key}`,
          message: `docOrigin block key '${key}' matches no block kind in this entity's documentBlocks or agentDocumentBlocks — a key that matches no block is a defect`,
        });
      }
    }
  }

  function walk(node, nodePath) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${nodePath}/${i}`));
      return;
    }
    if (ENTITY_KIND_SET.has(node.kind) && typeof node.identifier === "string") {
      checkCriterionScope(node, nodePath);
      checkRelationships(node, nodePath);
      checkDocOriginBlocks(node, nodePath);
    }
    if (node.$extensions && typeof node.$extensions === "object") {
      for (const key of Object.keys(node.$extensions)) {
        if (!EXTENSION_KEY_REGEX.test(key)) {
          findings.push({
            path: `${nodePath}/$extensions`,
            message: `extension key '${key}' is not vendor-namespaced (expected reverse-domain style, e.g. 'com.acme.tool')`,
          });
        }
      }
    }
    checkComponentRefs(node, nodePath);
    checkTokenOverrides(node, nodePath);
    checkTokenRefString(node, nodePath);
    if (node.kind === "sections" && Array.isArray(node.items)) {
      checkAnchorScope(node.items, `${nodePath}/items`);
    }
    if (Array.isArray(node.sections)) {
      checkAnchorScope(node.sections, `${nodePath}/sections`);
    }
    if (Array.isArray(node.entities)) {
      checkIdentifierScope(node.entities, `${nodePath}/entities`);
    }
    if (Array.isArray(node.children)) {
      checkIdentifierScope(node.children, `${nodePath}/children`);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "$extensions") continue;
      walk(value, `${nodePath}/${key}`);
    }
  }

  walk(doc, "");
  checkRelationshipCycles();
  checkTokenTypeInheritance();
  return findings;
}

function validateSemantics() {
  console.log("━━━ Semantic checks (uniqueness, extension namespaces) ━━━\n");

  const files = findFilesRecursive(EXAMPLES_DIR, ".dsds.json").concat(
    findFilesRecursive(path.join(ROOT, "test"), ".dsds.json").filter(
      (f) => !f.includes(`${path.sep}invalid${path.sep}`),
    ),
  );
  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const filePath of files) {
    const file = path.relative(EXAMPLES_DIR, filePath);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      continue; // Part 1 already reports JSON parse failures
    }
    const findings = semanticFindings(data);
    if (findings.length === 0) {
      console.log(`  ✓ ${file}`);
      passed++;
    } else {
      console.error(`  ✗ ${file}`);
      for (const f of findings) {
        console.error(`      ${f.path || "(root)"}: ${f.message}`);
        errors.push({ file, path: f.path, message: f.message });
      }
      failed++;
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}

// ---------------------------------------------------------------------------
// Part 4: Negative fixtures — documents that MUST fail validation
// ---------------------------------------------------------------------------

const INVALID_FIXTURES_DIR = path.join(ROOT, "test", "invalid");

/**
 * Every .dsds.json file in test/invalid/ must be rejected — either by schema
 * validation or by the semantic checks. A fixture that validates cleanly is
 * a regression: the guard it pins has stopped working.
 */
function validateNegativeFixtures(ajv) {
  console.log("━━━ Negative fixtures (must fail) ━━━\n");

  const schema = JSON.parse(fs.readFileSync(BUNDLED_SCHEMA_PATH, "utf-8"));
  const validate = ajv.compile(schema);

  const files = findFilesRecursive(INVALID_FIXTURES_DIR, ".dsds.json");
  let passed = 0;
  let failed = 0;
  const errors = [];

  if (files.length === 0) {
    console.log("  (no fixtures found)\n");
    return { passed, failed, errors };
  }

  for (const filePath of files) {
    const file = path.relative(INVALID_FIXTURES_DIR, filePath);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error(`  ✗ ${file}: fixture is not valid JSON — ${e.message}`);
      failed++;
      errors.push({ file, error: `Invalid JSON: ${e.message}` });
      continue;
    }

    const schemaValid = validate(data);
    const semantics = schemaValid ? semanticFindings(data) : [];
    const rejected = !schemaValid || semantics.length > 0;

    if (rejected) {
      const via = !schemaValid ? "schema" : "semantic check";
      console.log(`  ✓ ${file} (rejected by ${via})`);
      passed++;
    } else {
      console.error(
        `  ✗ ${file}: validated cleanly — the guard this fixture pins is broken`,
      );
      failed++;
      errors.push({ file, error: "fixture unexpectedly valid" });
    }
  }

  console.log(`\n  ${passed} correctly rejected, ${failed} failed\n`);
  return { passed, failed, errors };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("\nDSDS Schema Validation\n");
  console.log(`Schema: ${path.relative(ROOT, BUNDLED_SCHEMA_PATH)}`);
  console.log(`Examples: ${path.relative(ROOT, EXAMPLES_DIR)}/\n`);

  const ajv = createValidator();

  // Part 1: Validate full document example files
  const exampleResults = validateExamples(ajv);

  // Part 2: Validate per-definition example files
  const defAjv = createValidator();
  const defResults = validateDefinitionExamples(defAjv);

  // Part 3: Semantic checks on example documents
  const semanticResults = validateSemantics();

  // Part 4: Negative fixtures must fail
  const negativeAjv = createValidator();
  const negativeResults = validateNegativeFixtures(negativeAjv);

  // Summary
  console.log("━━━ Summary ━━━\n");

  const totalPassed =
    exampleResults.passed +
    defResults.passed +
    semanticResults.passed +
    negativeResults.passed;
  const totalFailed =
    exampleResults.failed +
    defResults.failed +
    semanticResults.failed +
    negativeResults.failed;

  console.log(
    `  Documents: ${exampleResults.passed} passed, ${exampleResults.failed} failed`,
  );
  console.log(
    `  Defs:      ${defResults.passed} passed, ${defResults.failed} failed, ${defResults.skipped} skipped`,
  );
  console.log(
    `  Semantics: ${semanticResults.passed} passed, ${semanticResults.failed} failed`,
  );
  console.log(
    `  Negative:  ${negativeResults.passed} correctly rejected, ${negativeResults.failed} failed`,
  );
  console.log(`  Total:     ${totalPassed} passed, ${totalFailed} failed\n`);

  if (totalFailed > 0) {
    console.error("Validation failed.\n");
    process.exit(1);
  } else {
    console.log("All validations passed.\n");
    process.exit(0);
  }
}

main();
