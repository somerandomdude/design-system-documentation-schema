# Design System Doc Spec (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a YAML-based format for documenting a design system as a graph of **entries** and **sections**:

- **System** — The design system as a whole: version, organization, url, license, platforms, plus system-wide documentation.
- **Components** — Reusable UI elements, with their own `sourceFiles`/`imports` (pointing at real source instead of hand-typing an interface), `traits` (variants and states, boolean or enum), and `combos` (pairing rules).
- **Tokens** — Documents the purpose, guidelines, and organization of a design token. Values and types live in the DTCG source file a token entry points at, not in DSDS.
- **Themes** — A named set of token overrides, pointing at its own DTCG source file.
- **Entry** — The generic, open kind for anything else: a foundation, a pattern, a guide, or a namespaced custom kind (e.g. `acme.icon-library`) for a document that wants its own recognizable name.

Every entry's structured documentation lives in one **sections** array. Each section is a typed object with a `kind` tag — `definitions`, `guidelines`, `steps`, or the generic `section` — plus `freeform`, headed nestable prose every section kind can carry alongside its own structured `items`. Any entry kind can use any section kind; there's no placement gate. A section also carries a `for` field (`human`, `agent`, or `all`) naming its audience, so a document serves both readers without a separate parallel structure.

The goal is simple: make design system docs structured, portable, and easy for tools to read. The tool can be a docs site, a linter, a code assistant, or a person reading YAML.

## Why?

Design system documentation today is trapped in tools. It lives in Notion, Storybook, Zeroheight, Confluence, or custom-built sites. Each one has its own structure and its own rules, and none of them work together.

DSDS addresses that with a format that is:

| Quality | What it means |
|---|---|
| **Structured** | Every section has a defined shape. Consumers know what to expect. |
| **Machine-readable** | Tools can parse, generate, validate, and transform documentation. |
| **Portable** | Documentation is decoupled from any specific tool or platform. |
| **Extensible** | Vendor metadata can be added without breaking interoperability. |
| **Complementary** | Works alongside the [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), not against it. |

The W3C Design Tokens Community Group defines a format for trading token **values** between tools. DSDS defines a format for the **documentation** around them. The two are built to work together — DSDS never duplicates a value or platform identifier; a token or theme entry's `source` field links back to its DTCG definition.

> [!NOTE]
> **Credit where due:** DSDS's conformance design follows the trail blazed by the [Adobe Spectrum Design Data specification](https://opensource.adobe.com/spectrum-design-data/spec/) — a layered model of structural schema rules plus a semantic-rule catalog with stable IDs. Prior art this good deserves a shoutout.

## Conformance

What it means for a document to follow the DSDS spec: every rule it enforces, and what might still change before version 1.0. For how the schema itself is organized — the shapes every entry, section, and reference is built from — see [How the schema is organized](https://designsystemdocspec.org/schema.html#how-the-schema-is-organized) at the top of the Schema page.

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** have a specific meaning in this section and inside the DSDS schema files, as defined by [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) (updated by [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)). They only carry that meaning when written in capital letters.

### Where the rules live

DSDS keeps its rules inside the schema's own `description` text, next to the field they apply to — the schema *is* the spec, with no separate rulebook to keep in sync. The index at the bottom of this section regenerates from the schema on every build, so it can't drift out of date. Each rule has a location-based ID (for example, `common/ref§note.1`) — if that ID changes, the schema moved, and the rule should be double-checked wherever it's cited.

### Conformance classes

DSDS defines four ways something can "follow the spec" — a document, and the tools that create, read, and check it. State which one you mean.

#### Conforming document

A document that passes schema validation for the version named in its `schemaVersion`, **and** the extra rules below (`DSDS-01` through `DSDS-10`) that a schema file alone can't check. Passing schema validation on its own isn't enough.

#### Conforming producer

A tool or person that creates DSDS documents. A conforming producer:

- MUST only create documents that follow the spec
- MUST NOT use an outdated field or shape in new documents (old shapes are kept around only so existing documents keep working)
- SHOULD record how a document was created, using `metadata.origin`

#### Conforming consumer

A tool, renderer, or AI agent that reads DSDS documents. A conforming consumer:

- MUST NOT fail just because it sees an optional field it doesn't recognize
- MUST keep `$extensions` data intact even if it doesn't understand it
- MUST treat an unresolvable reference (an `entryId#itemId` pointing nowhere) as an error, not silently ignore it
- MUST take MUST/SHOULD-style guidance as seriously as the spec says to — a `must-not` guideline is a hard stop for an agent writing code, not a suggestion
- SHOULD build its own "what points to what" index when it loads a document, rather than expect the document to store that answer directly
- MUST be able to address every section item, whether or not it was written with an `id` — when one is missing, derive it from the item's own text (lowercase, non-alphanumeric runs collapsed to a dash), the same way every other conforming tool does. See [common/id](https://designsystemdocspec.org/schema.html#common-id).

#### Conforming validator

A tool that checks documents. A conforming validator MUST enforce both the schema itself (with format checks on) and the extra rules below (`DSDS-01`–`DSDS-10`). `scripts/validate.js` is the reference implementation. Its `examples/invalid/` folder holds one broken example per rule, and `scripts/conformance-test.js` confirms each one fails for the exact reason it's supposed to.

### Enforcement tiers

Every rule is enforced one of two ways, or is explicitly advisory (a suggestion, not something checked automatically):

| Tier | How it's checked | What happens if it fails |
|---|---|---|
| Structural | Directly by the schema file (required fields, patterns, and similar built-in checks) | Blocks — validation fails |
| Semantic | By `scripts/validate.js`'s own code (`DSDS-01`–`DSDS-10`: do references resolve, are ids unique, and so on) | Blocks — validation fails |
| Advisory | Nothing automatic — SHOULD/MAY guidance is a judgment call | Nothing — it's a suggestion |

`DSDS-05`, `DSDS-08`, and `DSDS-09` are the one exception: an unresolved reference is reported as a warning, not a blocking error, unless the validator runs with `--strict`. Every other rule always blocks. See the [rule catalog](#rule-catalog) below.

### Rule catalog

The full list lives in `schema/conformance-rules.yaml`. This table is kept in sync with it by hand, but `scripts/conformance-test.js` (run on every `npm run check`) would catch it if the two ever drifted apart.

| ID | Rule |
|---|---|
| `DSDS-01` | At most one `sourceFiles` entry per platform. |
| `DSDS-02` | A system entry's `metadata.platforms` closes the platform vocabulary, once declared. |
| `DSDS-03` | A `checkedBy: automated` rule needs somewhere to actually run. |
| `DSDS-04` | Entry and shared ids are unique within a document. |
| `DSDS-05` | An `entryId#itemId` ref must resolve. |
| `DSDS-06` | A `composes` ref chain must not cycle. |
| `DSDS-07` | A `depends-on` ref chain must not cycle. |
| `DSDS-08` | A bare `to:` ref must resolve to a real entry or shared entry. |
| `DSDS-09` | A `combo`'s `subject`/`items` must resolve to a real trait, token, or entry. |
| `DSDS-10` | A `same-as` item's `level` must match its target's. |

`DSDS-06` and `DSDS-07` restore a cycle check the pre-0.20.0 spec had — nothing should point back at itself through a chain of `composes` or `depends-on` links. The 0.20.0 rewrite dropped it by accident; it's enforced by the validator's own code now, not the schema shape.

`DSDS-05`, `DSDS-08`, and `DSDS-09` check the whole **project**, not just the one document they're given. A `rel: file` link (the way the spec recommends splitting up a large system) joins the resolution pool, and so does every other file passed to the validator in the same run, even without a link between them — the way a standalone entry file, with no field of its own to declare "these are my siblings," still resolves a reference to a component listed alongside it.

The search is bounded to the folder holding the file being validated, and its subfolders — never a parent folder, a sibling folder, or the wider repo. Deliberately narrow: widening it to the nearest `.git` or `package.json` would let a CI job checking one untrusted document read far more of a monorepo than it should. A future `--root` flag could widen it on request; nothing has needed one yet.

An unresolved reference is a **warning**, not a failure, only in this cross-file case — a self-contained document's unresolved `to:` is still a hard error. A standalone entry file is the one exception even then, since it can never assert "this is definitely everything" the way a base document's `entries`/`shared` arrays can. Run with `--strict` to turn these warnings into failures.

Whether a `to:` value even *looks like* a valid id is checked separately, directly by the schema: `common/ref.schema.yaml`'s `to` field only accepts id-shaped values, so a display name or a value with a space in it fails before `DSDS-05`, `DSDS-08`, or `DSDS-09` ever run. See [common/ref](https://designsystemdocspec.org/schema.html#common-ref).

Two related checks remain deliberately unbuilt: whether a relative `href`, a `sourceFiles[].file`, or a `source` actually points at a file that exists on disk (out of scope for now — an explicit, opt-in `DSDS-11` would cover this, not yet implemented), and confirming the exact ids or paths inside another file the way DTCG-path resolution would need. Both would mean reading files the validator has no other reason to open.

### Open conventions

The schema deliberately leaves some questions unanswered — not oversights, but places where a fixed rule would fit some teams and not others.

- **Where does a guideline item's pointer go — `refs`, or a named field?** `alternatives`, `evidence`, `related`, and `checks` each exist for one specific `rel`: `alternative-to`, an external standard, `refines`, and `test`/`lint-rule`. Any other `rel` — `extends`, `depends-on`, `composes`, `part-of`, `replaces`, `implements`, `relates-to`, `pairs-with`, `excludes`, `see-also` — goes in the general-purpose `refs` field instead, alongside `same-as` and `external-link`. See [sections/guidelines](https://designsystemdocspec.org/schema.html#sections-guidelines).
- **Where does an entry's primary source file go?** `refs` with `rel: source` — see [common/ref](https://designsystemdocspec.org/schema.html#common-ref).
- **What does `tags[0]` mean?** The first tag, by convention, is the entry's main category — see [metadata](https://designsystemdocspec.org/schema.html#metadata-metadata).
- **How does a token's `source` point at one key inside a shared DTCG file, not just the whole file?** By convention, a token's own `id` doubles as its path in the DTCG token tree — `color.action.primary` names the same token in both places, which is why `entries/token.id` allows slash separators DSDS ids otherwise don't. When a project's DTCG paths don't line up with its DSDS ids, point `source`'s `href` at the file plus a JSON Pointer fragment instead (`./tokens.dtcg.json#/color/action/primary`) — ordinary URI syntax, no schema change.

### Passing isn't the same as good

A document with zero errors and zero warnings can still be bad documentation — the schema checks structure, not judgment. `examples/anti-patterns/` collects a few small documents that validate cleanly and are still worth avoiding: a definition that only restates its own term, a `checkedBy: manual` claim too vague to actually check, and guideline prose that names a concept (a "token-group" entry) the spec doesn't have. Each file's own leading comment says what's wrong with it and why the schema can't catch it. Deliberately excluded from the default `npm run check` sweep — not meant to be copied.

### Stability and the road to 1.0

DSDS is a **pre-1.0 draft**. Some parts of the schema can grow to cover new cases without a spec change; other parts are locked in.

#### How schema changes get made

Every schema file under `schema/` has comments explaining *why* it's shaped the way it is, and often what it replaced. Reading those comments alongside the schema is the best way to understand how the spec has changed — see the [`CHANGELOG`](CHANGELOG) for exactly how each old field maps to its new one.

#### Designed to grow without a version bump

A handful of fields accept any string matching a pattern, instead of a fixed list of allowed values — so adding a new value never needs a schema change. Safe to build tooling around, but don't treat today's set as complete:

- **`entries/token.tokenType`** — a token's category (`color`, `spacing`, `typography`, ...), checked by pattern, not a fixed list.
- **`common/ref.rel`** — a reference's relationship (`depends-on`, `same-as`, `implements`, ...), open-ended; new values just get documented in the schema's own comments.
- **`metadata.status`'s status value** — `stable`, `experimental`, `deprecated`, and more, open for the same reason.
- **`entry.id` and `common/id`** — a lowercase-dash-dot pattern, not a fixed list of parts, so ids fit whatever hierarchy your system uses.
- **`$extensions`** — vendor or tool-specific data, grouped by namespace; a tool integration can add a field of its own any time, without waiting on a release.

#### More likely to require a spec change

A few fields are locked to a fixed list of values, because the number of possible cases is a fact about how the spec itself works, not an open-ended vocabulary. Be defensive about this list, not the one above:

- **`entry.kind`** — five well-known values (`system`, `component`, `token`, `theme`, `entry`), four with their own `entries/<kind>.schema.yaml` file, plus a custom dot-separated kind name (e.g. `acme.icon-library`) for a document that wants its own recognizable name. Adding a well-known value changes what this spec can describe at all, so that bar stays high.
- **`common/requirement-level`** — five values (`must`, `should`, `should-not`, `must-not`, `may`), taken directly from RFC 2119. This vocabulary belongs to that standard, not DSDS.
- **`sections/*` (the four section kinds)** — `guidelines`, `definitions`, `steps`, `section`. Any entry kind can use any of these. `section` is the generic fallback, the same role `entry` plays for entries; `freeform` isn't a section kind at all, it's a field every section kind can carry. The part of the schema most likely to still change before 1.0.

#### Criteria for declaring 1.0

1.0 is declared when, at minimum:

1. **The kind lists stop changing** — across at least one real pass of merging or splitting them, with no further changes needed.
2. **A second independent tool exists** — at least one tool the spec authors don't maintain reads or writes DSDS documents for real.
3. **The validator's extra rules stop changing** — `scripts/validate.js`'s `DSDS-01`–`DSDS-10` (see [Rule catalog](#rule-catalog)) stop being added or renamed release to release.

Until then, the fixed lists above are the most stable part of the schema. Everything else can still change between minor versions, including the exact shape of any one `sections/*.schema.yaml` file.

### Index of every rule

<!-- dsds:normative-index -->

*Generated from the v0.20.0 schemas by `scripts/extract-normative.mjs` — do not edit by hand. 1 statements: 0 MUST, 1 MUST NOT, 0 SHOULD, 0 SHOULD NOT, 0 MAY.*

### metadata

#### metadata/metadata

- **MUST NOT** — MUST NOT contain markup. <small>`metadata/metadata§note.1`</small>

<!-- /dsds:normative-index -->

## Documentation

The authoritative reference for every schema and field is the **documentation site at [designsystemdocspec.org](https://designsystemdocspec.org/)**. Property tables there come straight from the schema files, so they cannot drift from the code.

- **[Overview](https://designsystemdocspec.org/)** — What DSDS is, the entry/section model, design principles, humans & agents, and interoperability with DTCG/CEM/Storybook. For conformance classes, the `DSDS-01`–`DSDS-10` semantic rule catalog, and stability guarantees, see [Conformance](#conformance) below.
- **[Quick Start](https://designsystemdocspec.org/quickstart.html)** — Document structure, entry kinds, the section system, and minimal examples for every entry kind.
- **[Extending the schema](https://designsystemdocspec.org/extending.html)** — `$extensions`, custom kinds, and profiles: the three ways to go beyond what the spec ships with, and when to reach for each.
- **[Schema](https://designsystemdocspec.org/schema.html)** — Opens with how the schema itself is organized, then every schema definition, each with a real example next to it.

You can also build the site locally with `npm run build` and open `site/dist/index.html`.

This README leaves out schema field listings and example payloads on purpose — those live on the documentation site as a single source of truth.

## Repository layout

- **`schema/`** — The split JSON Schema source (`common/`, `metadata/`, `entries/`, `sections/`), plus the auto-generated `dsds.bundled.yaml` and the `DSDS-01`–`DSDS-07` `conformance-rules.yaml` catalog.
- **`examples/`** — Validated example documents: full base documents, standalone entries per kind, quickstart snippets, interop pairs, and one `invalid/` fixture per semantic rule.
- **`test/site-components/`** — A regression corpus documenting this repo's own `site/components/` web components as DSDS entries (dogfooding), checked on every `npm run check`.
- **`scripts/`** — Bundling, validation, composition, and the static site generator.
- **`site/`** — The spec site source (`content/*.mdx`, `templates/`, `components/`) and its generated output in `site/dist/`, including immutable versioned `v<n>/` archives.

## Quick Start

```bash
npm install
npm run check   # bundles the schema, validates every example/fixture/test corpus file
npm run build   # generates the static site into site/dist/
```

To validate just your own file:

```bash
node scripts/validate.js my-system.dsds.yaml
```

If your system is split across files via `rel: file`, cross-file `to:` refs are resolved automatically, bounded to the directory of the file you validate (and its subdirectories — not a parent or cousin directory). An otherwise-unresolved target reports as a warning, not a hard failure — add `--strict` (`npm run validate:strict`) to promote those to failures once your project is clean.

Reference `https://designsystemdocspec.org/v0.20.0/dsds.bundled.yaml` from your DSDS files via the `$schema` keyword for editor autocompletion and inline validation.

For document structure, composing hand-split fragments (`scripts/compose.js`), and authoring narrative pages with schema-driven property tables, see the **[Quick Start docs page](https://designsystemdocspec.org/quickstart.html)** and [How the schema is organized](https://designsystemdocspec.org/schema.html#how-the-schema-is-organized).

## Cutting a release

There's no single version field — every `schema/**/*.schema.yaml` file's own `$id` independently encodes the version (e.g. `.../v0.20.0/common/ref.schema.yaml`), and everything else (`nav.js`, `compile-mdx.mjs`'s `{{VERSION}}` substitution, the versioned `site/dist/v<n>/` directory) derives the current version by reading it back out of `schema/dsds.bundled.yaml`. MDX content must never hardcode a version — always use `{{VERSION}}`.

`scripts/bump-version.js` automates the mechanical part — every schema file's `$id`, `bundle.js`'s hardcoded `$id`, every example/test fixture's `schemaVersion`, README's one hardcoded URL, and `package.json#version` — then regenerates the bundled schema and syncs `.agents/skills/dsds-*`'s version references:

```bash
# 1. Make schema changes under schema/, add examples/ + examples/invalid/ fixtures as needed.
# 2. Add a CHANGELOG entry.
npm run bump-version 0.20.1     # rewrites every version reference, bundles, syncs skill versions
npm run build                   # publishes a new site/dist/v<new-version>/
npm run check                   # must pass before committing
```

Use `npm run bump-version <version> -- --dry-run` to preview changes first, or `--help` for the rest of the flags.

The versioned dist directories (`site/dist/v<n>/dsds.bundled.schema.{json,yaml}` — the extension depends on which version; see the "Bundle format" note below) are **immutable public contracts** — older `v<n>/` directories must stay untouched. Commit the schema changes, examples, README, CHANGELOG, `package.json`, and the full `site/dist/` tree together.

### Bundle format

`dsds.bundled.yaml` (YAML, matching the hand-authored `schema/**/*.schema.yaml` source it's built from) starting with this version. Versions before this one published `dsds.bundled.schema.json` and keep doing so, frozen, under their own `site/dist/v<n>/` directory — only the *current* version's bundle format changed. "JSON Schema" names the spec both formats conform to (a constraint language for a data model), not a file-syntax requirement — see `scripts/bundle.js`'s own comment.

For a documentation-only edit (no schema/example changes), just run `npm run build` and commit the regenerated HTML — no version bump, no new `/v<n>/` artifact.

## Contributing

This is an early-stage specification (currently DSDS 0.20.0). Feedback is welcome:

- **Open an issue** for questions, suggestions, or problems with the spec.
- **Open a PR** for proposed changes to the spec, schema, or examples.

### Contributors

- [Afyia Smith](https://afyiasmith.co/) — the `owner`/`reviewed` and `origin` metadata schemas.

## License

This project is open source. See [LICENSE](LICENSE) for details.
