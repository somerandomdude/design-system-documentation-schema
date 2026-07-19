#!/usr/bin/env node
/**
 * build-site.js — Schema-driven site generator for the DSDS specification.
 *
 * Auto-discovers JSON Schema files from the schema directory structure and
 * generates one HTML page per schema file. Each page documents the definitions
 * within that file with property tables, type references, and cross-references.
 *
 * Narrative pages (overview, quickstart, schema-architecture) are compiled
 * from MDX content in site/content/ by scripts/compile-mdx.mjs, which can
 * embed schema-driven property tables via the <ds-prop-table /> shortcode.
 *
 * Usage:
 *   node scripts/build-site.js
 *
 * Output:
 *   site/dist/  — The generated static site
 */

const fs = require("fs");
const path = require("path");

const { buildSpecNav, DIR_GROUPS, readSpecVersion } = require("./nav");
const { renderTemplate } = require("./render-template");
const {
  esc,
  slug,
  linkToRef,
  describeType: describeTypeShared,
  renderPropertyTable: renderPropertyTableShared,
} = require("./render-prop-table");

// MDX compiler (ESM) — loaded dynamically in build()
let compileMdxModule = null;
async function loadMdxCompiler() {
  if (!compileMdxModule) {
    compileMdxModule = await import("./compile-mdx.mjs");
  }
  return compileMdxModule;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.join(ROOT, "spec");

// Canonical site origin and the fallback description used by pages that
// don't declare their own (MDX frontmatter `description`, or a schema
// file's top-level `description`).
const SITE_URL = "https://designsystemdocspec.org";
const DEFAULT_DESCRIPTION =
  "A machine-readable format for design system documentation. DSDS structures components, tokens, themes, foundations, patterns, and guides as a single source of truth for humans, parsers, and agents.";
const SCHEMA_DIR = path.join(SPEC_DIR, "schema");
const SITE_DIR = path.join(ROOT, "site");
const DIST_DIR = path.join(SITE_DIR, "dist");
const EXAMPLES_DIR = path.join(SPEC_DIR, "examples");
const TEMPLATES_DIR = path.join(SITE_DIR, "templates");
const PAGE_TEMPLATE_PATH = path.join(TEMPLATES_DIR, "page.template.html");
const SUBTEMPLATES_DIR = path.join(TEMPLATES_DIR, "subtemplates");

/**
 * Render one of the content-block subtemplates in site/templates/subtemplates/.
 * Each subtemplate is a single, self-contained block of markup (a def-section
 * wrapper, a callout, an example, ...) with its own {%placeholders%} — the
 * same substitution model as the page shell, just scoped to one block instead
 * of the whole page. Trimmed so a template file's own trailing newline
 * doesn't introduce stray blank lines when callers join blocks together.
 */
function renderSub(name, vars) {
  return renderTemplate(
    path.join(SUBTEMPLATES_DIR, `${name}.template.html`),
    vars,
  ).trim();
}

/**
 * Auto-discover schema files and build the full page registry.
 * Returns an array of page descriptors:
 *   { slug, title, group, groupLabel, filename, filePath, data }
 */
function discoverPages() {
  const pages = [];

  for (const group of DIR_GROUPS) {
    const dirPath = path.join(SCHEMA_DIR, group.dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".schema.json"))
      .sort();

    for (const filename of files) {
      const filePath = path.join(dirPath, filename);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const baseName = filename.replace(".schema.json", "");
      const pageSlug = `${group.dir}-${baseName}`;

      // Look for a matching example file: spec/examples/{group}/{baseName}.json
      const examplePath = path.join(
        EXAMPLES_DIR,
        group.dir,
        `${baseName}.json`,
      );
      let examples = null;
      if (fs.existsSync(examplePath)) {
        try {
          examples = JSON.parse(fs.readFileSync(examplePath, "utf-8"));
        } catch (e) {
          console.error(
            `  ⚠  Failed to parse example ${examplePath}: ${e.message}`,
          );
        }
      }

      pages.push({
        slug: pageSlug,
        title: data.title || baseName,
        group: group.dir,
        groupLabel: group.label,
        filename,
        filePath,
        data,
        examples,
      });
    }
  }

  // Also include the root schema
  const rootPath = path.join(SCHEMA_DIR, "dsds.schema.json");
  if (fs.existsSync(rootPath)) {
    const rootData = JSON.parse(fs.readFileSync(rootPath, "utf-8"));
    pages.unshift({
      slug: "root",
      title: rootData.title || "Root Schema",
      group: "documentation",
      groupLabel: "Documentation",
      filename: "dsds.schema.json",
      navLabel: "Root schema",
      filePath: rootPath,
      data: rootData,
      examples: null,
    });
  }

  return pages;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/**
 * Build a definition index from the discovered pages.
 * Maps: defName -> { pageSlug, filename }
 *
 * Note: `esc`, `slug`, and `linkToRef` are imported from
 * ./render-prop-table so the MDX shortcode preprocessor and the
 * schema-page generator share one canonical implementation.
 */
function buildDefIndex(pages) {
  const index = {};
  for (const page of pages) {
    for (const defName of Object.keys(page.data.$defs || {})) {
      index[defName] = { pageSlug: page.slug, filename: page.filename };
    }
  }
  return index;
}

// Global definition index for cross-references
let DEF_INDEX = {};

// ---------------------------------------------------------------------------
// Type description rendering
//
// The real implementation lives in ./render-prop-table. We wrap it here so
// callers in this file can continue calling `describeType(prop)` without
// threading DEF_INDEX through every invocation.
// ---------------------------------------------------------------------------

function describeType(prop) {
  return describeTypeShared(prop, DEF_INDEX);
}

// ---------------------------------------------------------------------------
// Property table rendering
// ---------------------------------------------------------------------------

/**
 * Render a property table for a definition's properties.
 *
 * Thin wrapper around ./render-prop-table so MDX preprocessing and the
 * schema-page generator emit identical markup from the same source.
 */
function renderPropertyTable(defSchema) {
  return renderPropertyTableShared(defSchema, DEF_INDEX);
}

// ---------------------------------------------------------------------------
// Definition rendering
// ---------------------------------------------------------------------------

/**
 * Render a single $defs definition as an HTML section.
 * If `exampleData` is provided, it's rendered as a JSON code block after the definition.
 */
function renderDefinition(defName, defSchema, exampleData) {
  const hid = slug(defName);
  const content = [];

  // If it's a simple string (like status), show that and stop — a bare
  // string def has no properties/oneOf/anyOf/example content to add.
  if (defSchema.type === "string" && !defSchema.properties) {
    if (defSchema.enum) {
      const items = defSchema.enum
        .map((val) => `<li><ds-code inline>${esc(String(val))}</ds-code></li>`)
        .join("\n");
      content.push(renderSub("enum-values", { items }));
    }
    return renderSub("def-section", {
      name: esc(defName),
      anchor: hid,
      description_attr: defSchema.description
        ? ` description="${esc(defSchema.description)}"`
        : "",
      type_attr: defSchema.type ? ` type="${esc(defSchema.type)}"` : "",
      content: content.join("\n"),
    });
  }

  // If it's a oneOf (like richText), show the alternatives
  if (defSchema.oneOf) {
    const items = [];
    for (const alt of defSchema.oneOf) {
      if (alt.$ref) {
        const refName = linkToRef(alt.$ref);
        if (refName) {
          const target = DEF_INDEX[refName];
          items.push(
            target
              ? `<li><a href="${target.pageSlug}.html#${slug(refName)}">${esc(refName)}</a></li>`
              : `<li><ds-code inline>${esc(refName)}</ds-code></li>`,
          );
        }
      } else if (alt.type === "string") {
        items.push(
          `<li><strong>string</strong>${alt.description ? ` — ${esc(alt.description)}` : ""}</li>`,
        );
      } else if (alt.type === "object") {
        // The property table must nest inside the <li>, not sit as a
        // sibling of it — a <ul> may only directly contain <li> elements.
        items.push(
          `<li><strong>object</strong>${alt.description ? ` — ${esc(alt.description)}` : ""}` +
            (alt.properties ? renderPropertyTable(alt) : "") +
            "</li>",
        );
      } else {
        items.push(`<li>${describeType(alt)}</li>`);
      }
    }
    content.push(renderSub("oneof-alternatives", { items: items.join("\n") }));
  }

  // Property table
  if (defSchema.properties) {
    content.push(renderPropertyTable(defSchema));
  }

  // additionalProperties (open maps like tokenApi)
  if (
    defSchema.type === "object" &&
    defSchema.additionalProperties &&
    typeof defSchema.additionalProperties === "object" &&
    !defSchema.properties
  ) {
    content.push(
      renderSub("additional-properties", {
        value_type: esc(defSchema.additionalProperties.type || "any"),
      }),
    );
  }

  // anyOf constraints (like presentationStory requiring url or storyId,
  // or collectionDoc requiring at least one of components/tokens/etc.)
  if (defSchema.anyOf) {
    // Check if ALL branches are simple {required: [name]} constraints
    const allSimpleRequired = defSchema.anyOf.every(
      (alt) =>
        alt.required &&
        Array.isArray(alt.required) &&
        Object.keys(alt).length === 1,
    );

    if (allSimpleRequired && defSchema.anyOf.length > 1) {
      // "At least one of" pattern — already shown via conditional-badge in the table
      const propNames = defSchema.anyOf.map((alt) =>
        alt.required
          .map((r) => `<ds-code inline>${esc(r)}</ds-code>`)
          .join(", "),
      );
      content.push(
        renderSub("callout-warning", {
          label: "Constraint",
          message: `At least one of ${propNames.join(", ")} must be present.`,
        }),
      );
    } else {
      // Mixed anyOf — show each branch
      const items = defSchema.anyOf
        .filter((alt) => alt.required)
        .map(
          (alt) =>
            `<li>${alt.required.map((r) => `<ds-code inline>${esc(r)}</ds-code>`).join(", ")} must be present</li>`,
        )
        .join("\n");
      content.push(renderSub("anyof-constraints", { items }));
    }
  }

  // if/then (conditional requirements like deprecation)
  if (defSchema.if && defSchema.then) {
    const ifProps = defSchema.if.properties || {};
    const thenReq = defSchema.then.required || [];
    const conditions = Object.entries(ifProps)
      .map(
        ([k, v]) =>
          `<ds-code inline>${esc(k)}</ds-code> is <ds-code inline>"${esc(String(v.const || ""))}"</ds-code>`,
      )
      .join(" and ");
    const requirements = thenReq
      .map((r) => `<ds-code inline>${esc(r)}</ds-code>`)
      .join(", ");
    if (conditions && requirements) {
      content.push(
        renderSub("callout-warning", {
          label: "Conditional",
          message: `When ${conditions}, then ${requirements} is required.`,
        }),
      );
    }
  }

  // Cross-references: list all $ref targets in this definition
  const refs = collectRefs(defSchema);
  if (refs.length > 0) {
    const refLinks = refs.map((refName) => {
      const target = DEF_INDEX[refName];
      if (target) {
        return `<ds-type-ref href="${target.pageSlug}.html#${slug(refName)}">${esc(refName)}</ds-type-ref>`;
      }
      return `<ds-code inline>${esc(refName)}</ds-code>`;
    });
    content.push(renderSub("cross-refs", { refs: refLinks.join(", ") }));
  }

  // Example — render the matching example if one was provided
  if (exampleData !== undefined && exampleData !== null) {
    content.push(
      renderSub("example", { json: esc(JSON.stringify(exampleData, null, 2)) }),
    );
  }

  return renderSub("def-section", {
    name: esc(defName),
    anchor: hid,
    description_attr: defSchema.description
      ? ` description="${esc(defSchema.description)}"`
      : "",
    type_attr: defSchema.type ? ` type="${esc(defSchema.type)}"` : "",
    content: content.join("\n"),
  });
}

/**
 * Collect all unique $ref definition names from a schema object.
 */
function collectRefs(obj, seen = new Set()) {
  if (Array.isArray(obj)) {
    for (const item of obj) collectRefs(item, seen);
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (key === "$ref" && typeof value === "string") {
        const name = linkToRef(value);
        if (name) seen.add(name);
      } else {
        collectRefs(value, seen);
      }
    }
  }
  return [...seen];
}

// ---------------------------------------------------------------------------
// Page rendering for a single schema file
// ---------------------------------------------------------------------------

/**
 * Collect the names of sibling $defs that `node` references (via any `$ref`
 * pointing at `#/$defs/<name>`). Cross-file refs are ignored by the caller,
 * which filters against the file's own def names.
 */
function collectSiblingRefs(node, out) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSiblingRefs(n, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string") {
        const m = value.match(/\$defs\/(\w+)/);
        if (m) out.add(m[1]);
      } else {
        collectSiblingRefs(value, out);
      }
    }
  }
}

/**
 * Order a file's $defs so a definition appears BEFORE the definitions it
 * references — i.e., the top-level block/entity first, its nested entry shapes
 * (the granular details) after. Implemented as a level-order topological sort
 * over the in-file reference graph; ties and any reference cycles fall back to
 * the original file order for stability.
 */
function orderDefsByReference(defs) {
  const names = Object.keys(defs);
  const nameSet = new Set(names);

  const refs = {}; // def -> Set of sibling defs it references
  const inDegree = {};
  for (const name of names) inDegree[name] = 0;
  for (const name of names) {
    const found = new Set();
    collectSiblingRefs(defs[name], found);
    found.delete(name); // ignore self-reference (recursive defs)
    refs[name] = new Set([...found].filter((r) => nameSet.has(r)));
  }
  for (const a of names) for (const b of refs[a]) inDegree[b]++;

  const ordered = [];
  const emitted = new Set();
  let remaining = names.slice();
  while (remaining.length) {
    const ready = remaining.filter((n) => inDegree[n] === 0); // file order preserved
    if (ready.length === 0) {
      ordered.push(...remaining); // cycle — keep file order
      break;
    }
    for (const n of ready) {
      ordered.push(n);
      emitted.add(n);
      for (const b of refs[n]) inDegree[b]--;
    }
    remaining = remaining.filter((n) => !emitted.has(n));
  }
  return ordered;
}

/**
 * Render a full page body for a single schema file.
 */
/**
 * Render a schema page's header and content as separate strings — the page
 * shell (see pageHtml/main.template.html) keeps the header in its own slot
 * rather than folding it into the page's content.
 */
function renderSchemaPage(page) {
  const parts = [];
  const defs = page.data.$defs || {};
  const defNames = orderDefsByReference(defs);
  const examples = page.examples || {};

  const relPath = page.group ? `${page.group}/${page.filename}` : page.filename;
  const header = renderSub("header", {
    title: esc(page.title),
    description_attr: page.data.description
      ? ` description="${esc(page.data.description)}"`
      : "",
    source_attr: ` source="${esc(relPath)}"`,
    badge: "",
  });

  // The JSON view is a fixed-position toggle (see json-view.js), so its
  // place in the content flow doesn't affect where it renders — pushed
  // first just so it isn't lost if an early return below skips the rest.
  parts.push(
    renderSub("json-view", {
      label: esc(relPath),
      json: esc(JSON.stringify(page.data, null, 2)),
    }),
  );

  // Always render top-level properties when they exist (e.g., the root schema
  // has both its own properties AND $defs like entityGroup)
  if (page.data.properties) {
    parts.push(renderSub("root-properties-heading", {}));
    parts.push(renderPropertyTable(page.data));
  }

  if (defNames.length === 0) {
    // Root-only schemas (no $defs) can still ship an example. By convention
    // the entire example file is treated as one root-level example document.
    if (page.examples !== null && page.examples !== undefined) {
      parts.push(
        renderSub("example", {
          json: esc(JSON.stringify(page.examples, null, 2)),
        }),
      );
    }
    return { header, content: parts.join("\n") };
  }

  // Definition index (if more than one definition)
  if (defNames.length > 1) {
    const items = defNames
      .map(
        (defName) =>
          `<li><a href="#${slug(defName)}"><ds-code inline>${esc(defName)}</ds-code></a></li>`,
      )
      .join("\n");
    parts.push(renderSub("def-index", { count: defNames.length, items }));
  }

  // Render each definition with its matching example (if any)
  for (const defName of defNames) {
    // The example file can have the defName as a key with an example value
    const exampleData =
      examples[defName] !== undefined ? examples[defName] : null;
    parts.push(renderDefinition(defName, defs[defName], exampleData));
  }

  return { header, content: parts.join("\n") };
}

// ---------------------------------------------------------------------------
// Overview page — rendered from markdown
// ---------------------------------------------------------------------------

function pageHtml(
  title,
  activeSlug,
  headerHtml,
  contentHtml,
  pages,
  layout,
  version,
  description,
) {
  const layoutCls = layout === "full" ? " content--full" : "";
  const contentCls = "content" + layoutCls;

  // Derive the spec version from the schema if the caller didn't pass one
  // explicitly. This keeps every `DSDS <v>` string in the rendered HTML
  // tied to dsds.schema.json#/properties/dsdsVersion/const — the same
  // single source of truth that the bundle script and nav use.
  const v = version || readSpecVersion() || "";

  // Skip the `— DSDS <v>` suffix when the title already names the
  // version (e.g., the overview page title is "Design System Documentation
  // Spec 0.2"). Otherwise the tab text reads "… Spec 0.2 — DSDS 0.2".
  // A bare `.includes(v)` check is precise enough — a 2-character version
  // like "0.2" is unlikely to appear coincidentally in a page title.
  const titleHasVersion = v && title.includes(v);
  const titleSuffix = v && !titleHasVersion ? ` — DSDS ${v}` : "";

  // The live server resolves extensionless paths; the root page is the
  // bare origin rather than /index.
  const pageUrl =
    activeSlug === "index" ? `${SITE_URL}/` : `${SITE_URL}/${activeSlug}`;
  const desc = description || DEFAULT_DESCRIPTION;
  const fullTitle = `${title}${titleSuffix}`;

  // Each top-level section of the page (<head>, skip link, main content
  // area) is its own subtemplate, so the page shell below is just the
  // order they're assembled in — reorder or restructure a section by
  // editing its file, not by hunting through the whole page shell.
  const head = renderSub("head", {
    title: esc(fullTitle),
    description: esc(desc),
    canonical: pageUrl,
    version: esc(v),
  });
  const skipLink = renderSub("skip-link", {});
  const main = renderSub("main", {
    content_class: contentCls,
    header: headerHtml,
    content: contentHtml,
    back_to_top: renderSub("back-to-top", {}),
  });

  return renderTemplate(PAGE_TEMPLATE_PATH, {
    head,
    skip_link: skipLink,
    nav: buildSpecNav(activeSlug, pages, v),
    main,
  });
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

async function build() {
  console.log("Building DSDS specification site (schema-driven)...\n");

  // Clean and create dist.
  //
  // Versioned subdirectories (`v<n>/`) hold published schema bundles whose
  // URLs are public contracts — we MUST NOT blow them away on rebuild.
  // Everything else under dist is regenerated each build, so we wipe it
  // and recreate. The versioned subdirectory write step further down is
  // also defensive (refuses to overwrite an existing versioned bundle),
  // but this is the primary safeguard.
  if (fs.existsSync(DIST_DIR)) {
    for (const entry of fs.readdirSync(DIST_DIR, { withFileTypes: true })) {
      // Preserve site/dist/v<version>/ directories. The leading `v`
      // followed by a digit matches v0.1, v0.2, v1.0.0, v1.0.0-beta.2,
      // etc. without touching unrelated directories that happen to
      // start with `v`.
      if (entry.isDirectory() && /^v\d/.test(entry.name)) continue;
      fs.rmSync(path.join(DIST_DIR, entry.name), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Discover all schema pages (with examples attached)
  const pages = discoverPages();
  const withExamples = pages.filter((p) => p.examples !== null).length;
  console.log(
    `  Discovered ${pages.length} schema files across ${DIR_GROUPS.length} directories.`,
  );
  console.log(`  Found ${withExamples} matching example files.\n`);

  // Build the global definition index for cross-references
  DEF_INDEX = buildDefIndex(pages);
  console.log(
    `  Indexed ${Object.keys(DEF_INDEX).length} definitions for cross-referencing.\n`,
  );

  // Copy tokens
  fs.copyFileSync(
    path.join(SITE_DIR, "tokens.css"),
    path.join(DIST_DIR, "tokens.css"),
  );

  // Copy favicon
  fs.copyFileSync(
    path.join(SITE_DIR, "favicon.svg"),
    path.join(DIST_DIR, "favicon.svg"),
  );

  // Copy stylesheets
  fs.copyFileSync(
    path.join(SITE_DIR, "style.css"),
    path.join(DIST_DIR, "style.css"),
  );

  // Copy icon/logo assets — components fetch these by page-relative path
  // ("assets/<file>.svg") at runtime, so they need to exist alongside the
  // built pages, not just in the source tree.
  fs.cpSync(path.join(SITE_DIR, "assets"), path.join(DIST_DIR, "assets"), {
    recursive: true,
  });

  // Copy self-hosted font files — tokens.css references them by
  // page-relative path ("fonts/<file>.ttf").
  fs.cpSync(path.join(SITE_DIR, "fonts"), path.join(DIST_DIR, "fonts"), {
    recursive: true,
  });

  // Bundle web components into a single IIFE for file:// compatibility.
  bundleComponents(SITE_DIR, DIST_DIR);

  // ── MDX content pages ─────────────────────────────────────────────────
  const { compileAllMdx } = await loadMdxCompiler();
  console.log("  Compiling MDX content…");
  const mdxPages = await compileAllMdx();
  for (const mdxPage of mdxPages) {
    const slug = mdxPage.meta.slug || mdxPage.file.replace(".mdx", "");
    const title = mdxPage.meta.title || slug;
    const layout = mdxPage.meta.layout || null;
    const badge = mdxPage.meta.badge || null;

    let body = mdxPage.html;

    // Every page opens with <ds-header> built from frontmatter. The title now
    // lives there, so drop a leading compiled <h1> (its text duplicates the
    // frontmatter title). Pages that open at h2 have no h1 to strip.
    body = body.replace(
      /^\s*<ds-heading\b[^>]*\blevel="1"[^>]*>[\s\S]*?<\/ds-heading>\s*/,
      "",
    );

    const header = renderSub("header", {
      title: esc(title),
      description_attr: mdxPage.meta.description
        ? ` description="${esc(mdxPage.meta.description)}"`
        : "",
      source_attr: "",
      badge: badge ? `<ds-badge>${esc(badge)}</ds-badge>` : "",
    });

    const html = pageHtml(
      title,
      slug,
      header,
      body,
      pages,
      layout,
      undefined,
      mdxPage.meta.description,
    );
    fs.writeFileSync(path.join(DIST_DIR, `${slug}.html`), html, "utf-8");
  }
  console.log(`  ${mdxPages.length} MDX page(s) compiled.\n`);

  // ── Schema-driven pages ───────────────────────────────────────────────
  for (const page of pages) {
    const { header, content } = renderSchemaPage(page);
    const html = pageHtml(
      page.title,
      page.slug,
      header,
      content,
      pages,
      null,
      undefined,
      page.data.description,
    );

    const outPath = path.join(DIST_DIR, `${page.slug}.html`);
    fs.writeFileSync(outPath, html, "utf-8");

    const relSource = page.group
      ? `${page.group}/${page.filename}`
      : page.filename;
    console.log(`  ✓  site/dist/${page.slug}.html  ← ${relSource}`);
  }

  // ── Versioned bundled schema ──────────────────────────────────────
  //
  // Versioned dist directories (site/dist/v<n>/) hold the bundled schema
  // at the URL it's published at — e.g., site/dist/v0.1/dsds.bundled.schema.json
  // is served at https://designsystemdocspec.org/v0.1/dsds.bundled.schema.json.
  //
  // The versioned bundle is the working artifact for the CURRENT version.
  // The build ALWAYS refreshes it so a rebuild is atomic — the published
  // v<current>/ output can never lag the schema source (the desync this
  // guards against). Older v<n>/ archives are never touched here: the build
  // only writes the directory named after the current `const`, and the dist
  // clean step preserves every v*/ directory. Immutability of a *released*
  // version is enforced at release/deploy time (git tag + atomic deploy),
  // not by skipping the write — skipping is what let the site go stale.
  const bundledSchemaPath = path.join(SCHEMA_DIR, "dsds.bundled.schema.json");
  if (fs.existsSync(bundledSchemaPath)) {
    const bundledSchema = JSON.parse(fs.readFileSync(bundledSchemaPath, "utf-8"));
    const version = bundledSchema.properties?.dsdsVersion?.const;
    if (version) {
      const versionDir = path.join(DIST_DIR, `v${version}`);
      const versionedBundle = path.join(versionDir, "dsds.bundled.schema.json");
      const relTarget = `site/dist/v${version}/dsds.bundled.schema.json`;
      const changed =
        !fs.existsSync(versionedBundle) ||
        fs.readFileSync(versionedBundle, "utf-8") !==
          fs.readFileSync(bundledSchemaPath, "utf-8");
      fs.mkdirSync(versionDir, { recursive: true });
      fs.copyFileSync(bundledSchemaPath, versionedBundle);
      console.log(
        `  ✓  ${relTarget}  ← spec/schema/dsds.bundled.schema.json${changed ? " (refreshed)" : ""}\n`,
      );
    }
  }

  console.log(
    `\nDone. ${mdxPages.length + pages.length + 1} pages built to site/dist/\n`,
  );
}

// ---------------------------------------------------------------------------
// Component bundler
// ---------------------------------------------------------------------------

/**
 * Bundle all component ES modules from site/components/ into a single
 * components.js IIFE that works from file:// protocol.
 *
 * Strategy:
 *   1. Read _shared.js — extract its exported symbols as local variables
 *   2. Read each component file — strip `import` and `export` statements
 *   3. Read index.js — extract the registry array and registration loop
 *   4. Wrap everything in an IIFE
 */
function bundleComponents(siteDir, distDir) {
  const componentsDir = path.join(siteDir, "components");
  const indexSrc = fs.readFileSync(
    path.join(componentsDir, "index.js"),
    "utf-8",
  );

  // Parse the barrel file to find all imported file names (in dependency order)
  const importRe = /from\s+["']\.\/([^"']+)["']/g;
  const fileOrder = ["_shared.js"]; // _shared.js MUST come first
  const seen = new Set(["_shared.js"]);
  let m;
  while ((m = importRe.exec(indexSrc)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      fileOrder.push(m[1]);
    }
  }

  // Extract the registry and registration code from index.js
  const registryMatch = indexSrc.match(
    /const registry = \[[\s\S]*?\];\s*\n\s*for \([\s\S]*?\{[\s\S]*?\}\s*\}/,
  );
  const registrationCode = registryMatch ? registryMatch[0] : "";

  // Build the bundle
  const parts = [];
  parts.push("(function () {");
  parts.push('  "use strict";');
  parts.push("");

  for (const file of fileOrder) {
    const filePath = path.join(componentsDir, file);
    if (!fs.existsSync(filePath)) continue;

    let code = fs.readFileSync(filePath, "utf-8");

    // Strip import statements
    code = code.replace(
      /^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];\s*$/gm,
      "",
    );

    // Strip 'export ' keyword from declarations (export class, export function, export const)
    code = code.replace(/^export\s+(class|function|const|let|var)\s/gm, "$1 ");

    // Remove blank lines left by stripping
    code = code.replace(/\n{3,}/g, "\n\n");

    parts.push(`  // ── ${file} ──`);
    // Indent the code
    const indented = code
      .trim()
      .split("\n")
      .map((line) => (line ? "  " + line : ""))
      .join("\n");
    parts.push(indented);
    parts.push("");

    // fetch() of a same-directory file is blocked outright under file://
    // (opening a built page directly, no server), which this bundle
    // otherwise supports. Inline every icon's file contents right after
    // _shared.js defines seedIcons()/loadIcon(), so no runtime fetch is
    // ever needed in the built site. Keep this file list in sync with
    // ICON_FILES in site/components/_shared.js.
    if (file === "_shared.js") {
      const ICON_FILES = {
        menu: "icon-menu.svg",
        close: "icon-close.svg",
        info: "icon-info.svg",
        flask: "icon-flask.svg",
        dot: "icon-dot.svg",
        lightbulb: "icon-lightbulb.svg",
        warning: "icon-warning.svg",
        brackets: "icon-brackets.svg",
        logo: "dsds.svg",
      };
      const assetsDir = path.join(siteDir, "assets");
      const seeded = {};
      for (const [name, iconFile] of Object.entries(ICON_FILES)) {
        const iconPath = path.join(assetsDir, iconFile);
        if (fs.existsSync(iconPath)) {
          seeded[name] = fs.readFileSync(iconPath, "utf-8");
        }
      }
      parts.push("  // ── inlined icon assets (build-time, see above) ──");
      parts.push(`  seedIcons(${JSON.stringify(seeded)});`);
      parts.push("");
    }
  }

  // Add registration code (strip imports already handled)
  if (registrationCode) {
    parts.push("  // ── Registration ──");
    const indented = registrationCode
      .trim()
      .split("\n")
      .map((line) => (line ? "  " + line : ""))
      .join("\n");
    parts.push(indented);
  }

  parts.push("})();");

  const bundle = parts.join("\n") + "\n";
  fs.writeFileSync(path.join(distDir, "components.js"), bundle, "utf-8");

  const kb = (Buffer.byteLength(bundle, "utf-8") / 1024).toFixed(1);
  console.log(
    `  Bundled ${fileOrder.length} component files → components.js (${kb} KB)`,
  );
}

build().catch((err) => {
  console.error("\n✗ Build failed:", err.message);
  process.exit(1);
});
