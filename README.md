# Design System Doc Spec (DSDS)

A standard, machine-readable format for design system documentation.

---

## What is DSDS?

DSDS defines a YAML-based format for documenting a design system as a graph of **entries** and **sections**:

- **System:** The design system as a whole.
- **Tokens:** Documents the purpose, guidelines, and organization of a design token. Values and types live in the DTCG source file each token entry points at.
- **Themes:** A named set of token overrides, pointing at its own DTCG source file.
- **Components:** Reusable UI elements, with their own `sourceFiles`/`imports` (pointing at real source instead of hand-typing an interface), `traits` (variants and states, each tagged `traitType`), and `combos` (pairing rules).
- **Entries:** An open kind for anything else. Link a foundation, pattern, or guide. Custom kinds can also be namespaced (ex: `acme.icon-library`) for teams that want recognizable custom entries.

Every entry's structured documentation lives in a **sections** array. Each section is a typed object with a `kind` tag (`definitions`, `guidelines`, `steps`, or the generic `section`). Sections also include `freeform` for nestable content that sits alongside its own structured `items`. Any entry kind can use any section kind. A section also carries a `for` field (`human`, `agent`, or `all`) naming its audience, so audience-specific content can be displayed when appropriate.

## Why?

Design system documentation today is trapped in tools. It lives in Notion, Storybook, Zeroheight, Confluence, or custom-built sites. Each one has its own structure and its own rules, and none of them work together.

DSDS addresses that with a format that is:

| Quality | What it means |
|---|---|
| **Structured** | Every section has a defined structure. Consumers know what to expect. |
| **Machine-readable** | Tools can parse, generate, validate, and transform documentation. |
| **Portable** | Documentation is decoupled from any specific tool or platform. |
| **Extensible** | Vendor metadata can be added without breaking interoperability. |
| **Complementary** | Works alongside the [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), not against it. |

The W3C Design Tokens Community Group defines a format for trading token **values** between tools. DSDS defines a format for the **documentation** around them. The two are built to work together — DSDS never duplicates a value or platform identifier; a token or theme entry's `source` field links back to its DTCG definition.

## Interoperability

DSDS is built to sit alongside the formats that already own a layer. **If another format owns a fact, DSDS points at it rather than restating it**. A token entry has a `source` and no `value`; a component entry has `sourceFiles` and `specs` and no property table.

<!-- dsds:interop-map -->

| Format | Layer it owns | The DSDS field |
|---|---|---|
| [DTCG](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) (W3C Design Tokens) | Token values, types, aliases | A token entry's `source`; a theme's `source` |
| [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM), or any standard contract document | Component API contract, already generated | A component's `specs` (`rel: contract`) |
| `.tsx`, `.vue`, `.swift`, framework typings — whatever a generator reads | Component source, per platform | A component's `sourceFiles` |
| [Component Story Format](https://storybook.js.org/docs/api/csf) (CSF), Storybook, or an equivalent | Stories and live demos | A `refs`/`examples` entry with `rel: storybook` |
| A test or lint rule — vitest, axe-core, stylelint, ESLint | Whether a guideline actually holds | A guideline's `checks` (`rel: test`, `rel: lint-rule`) |
| WCAG, ARIA APG, MDN, an internal RFC | Why a guideline exists | A guideline's `evidence` (`rel: external-link`) |
| Figma or another design tool | Design artifacts | A `refs` entry with `rel: design`, or `metadata.preview` |
| npm, or any package registry | Distribution | A component's `imports[].package`, or `rel: package` |
| [JSON Schema](https://json-schema.org/) draft 2020-12 | Editor validation of the DSDS file itself | The document's own `$schema` key |
| Any vendor or tool | Anything not listed | `$extensions`, keyed by namespace |

<!-- /dsds:interop-map -->

Full detail, with a worked example for each, is on the site's **[Interoperability](https://designsystemdocspec.org/interoperability)** page. Validated example pairs live in [`examples/interop/`](examples/interop/).

## Conformance

Two pages on the site cover what it takes to follow the spec:

- **[Conformance](https://designsystemdocspec.org/conformance)** — the four conformance classes, the three enforcement tiers, all 23 rules, how a project's scope gets worked out, and how a component's status works when it ships on more than one platform.
- **[Stability](https://designsystemdocspec.org/stability)** — what's safe to build tooling on, what can still change before 1.0, how to bring a 0.15.2 document up to date, and what has to be true before 1.0 ships.

If you're writing a tool, read the rules from [`schema/conformance-rules.yaml`](schema/conformance-rules.yaml) rather than from a page. `npm run check` keeps that file honest: for the semantic rules, every rule in the file has to exist in `scripts/validate/validate.js`, and every rule in the validator has to exist in the file.

The last seven rules are focused on style/organization. `DSDS-17` through `DSDS-23` are suggestions on the ordering conventions in the **[Style guide](https://designsystemdocspec.org/style-guide)**, or [STYLE_GUIDE.md](STYLE_GUIDE.md) if you'd rather read it in the repo. What order an object's fields go in, and what order entries, sections, and guideline items come in. These seven rules only warn. `npm run lint` prints them and still exits 0. Ignore all seven and your document still conforms.

> [!NOTE]
> **Credit where due:** DSDS's conformance design follows thinking from the [Adobe Spectrum Design Data specification](https://opensource.adobe.com/spectrum-design-data/spec/). Props to them.

### The words this spec uses

One term per concept, so a reader and a generator mean the same thing by it. The right-hand column is what a reviewer should flag. The full table, with where each term is defined, is on the [Conformance](https://designsystemdocspec.org/conformance) page.

<!-- dsds:terms -->

| Use | For | Not |
|---|---|---|
| **entry** | One documented thing in the design system graph - a component, token, theme, or anything else. | entity, record, item, node |
| **document** | One `.dsds.yaml` or `.dsds.json` file, whether it holds a whole system or a single entry. | spec, spec file, doc |
| **spec** | The DSDS specification itself - this repo, the schema files, and the site that publishes them. | (never a document) |
| **section** | One member of an entry's `sections[]`. | block, documentBlock, chunk |
| **field** | A named slot on an object. | property, key, attribute |
| **kind** | The discriminator value that says which shape an entry or section is. | type, variant |
| **item** | One member of a section's `items[]`. | entry, rule, criterion |
| **conforming consumer** | Anything that reads a document - a renderer, an agent, a site generator. | tool, reader, client, parser, renderer |
| **conforming producer** | Anything that writes a document. | generator, author tool, writer |
| **conforming validator** | Anything that checks a document against the schema and the rule catalog. | linter, checker |

<!-- /dsds:terms -->

## Documentation

Every schema and field is described in the **documentation site at [designsystemdocspec.org](https://designsystemdocspec.org/)**. But all schema docs are generated directly from the schema—so read the YAML files directly if that's your kind of thing.

- **[Overview](https://designsystemdocspec.org/)** — What DSDS is, the entry/section model, design principles, humans & agents, and interoperability with DTCG/CEM/Storybook. For conformance classes, the `DSDS-01`–`DSDS-11` semantic rule catalog, and stability guarantees, see [Conformance](#conformance) below.
- **[Quick Start](https://designsystemdocspec.org/quickstart.html)** — Document structure, entry kinds, the section system, and minimal examples for every entry kind.
- **[Extending the schema](https://designsystemdocspec.org/extending.html)** — `$extensions`, custom kinds, and profiles: the three ways to go beyond what the spec ships with, and when to reach for each.
- **[Interoperability](https://designsystemdocspec.org/interoperability)** — every format DSDS points at instead of restating: DTCG, CEM, CSF/Storybook, tests, standards, design tools.
- **[Schema](https://designsystemdocspec.org/schema.html)** — Opens with how the schema itself is organized, then every schema definition, each with a real example next to it.
- **[Style guide](https://designsystemdocspec.org/style-guide)** — What order to write things in: an object's fields, and the entries, sections, and guideline items inside a list.

You can also build the site locally with `npm run build` and open `site/dist/index.html`.

Writing a DSDS document yourself? The **[Style guide](https://designsystemdocspec.org/style-guide)** covers field order and list order — a consistent, non-normative convention every example in this repo follows, not something the schema enforces. See [Conformance](#conformance) for which rules report it.

That page is generated from [STYLE_GUIDE.md](STYLE_GUIDE.md), so edit the root file and run `npm run generate`; `npm run check` fails if the two drift.

## Repository layout

- **`schema/`** — The split JSON Schema source (`common/`, `metadata/`, `entries/`, `sections/`), plus the auto-generated `dsds.bundled.yaml` / `dsds.bundled.schema.json` and the `DSDS-01`–`DSDS-23` `conformance-rules.yaml` catalog.
- **`examples/`** — Validated example documents: full base documents, standalone entries per kind, quickstart snippets, interop pairs, and one `invalid/` fixture per semantic rule.
- **`test/site-components/`** — A regression corpus documenting this repo's own `site/components/` web components as DSDS entries (dogfooding), checked on every `npm run check`.
- **`scripts/`** — Bundling, validation, composition, and the static site generator.
- **`site/`** — The spec site source (`content/*.mdx`, `templates/`, `components/`). Its build output lands in `site/dist/`, which is git-ignored apart from the immutable versioned `v<n>/` archives.

## Quick Start

```bash
npm install
npm run check:all   # the whole gate: check, build, then the doc checks
```

`check:all` is what CI runs. [CONTRIBUTING.md](CONTRIBUTING.md#every-script)
documents every npm script and what it's for.


To validate just your own file:

```bash
node scripts/validate/validate.js my-system.dsds.yaml
```

If your system is split across files via `rel: file`, cross-file `to:` refs are resolved automatically, bounded to the directory of the file you validate (and its subdirectories — not a parent or cousin directory). An otherwise-unresolved target reports as a warning, not a hard failure — add `--strict` (`npm run validate -- --strict`) to promote those to failures once your project is clean.

Reference `https://designsystemdocspec.org/v0.21.2/dsds.bundled.yaml` from your DSDS files via the `$schema` keyword for editor autocompletion and inline validation.

For document structure, composing hand-split fragments (`scripts/tools/compose.js`), and authoring narrative pages with schema-driven property tables, see the **[Quick Start docs page](https://designsystemdocspec.org/quickstart.html)** and [How the schema is organized](https://designsystemdocspec.org/schema.html#how-the-schema-is-organized).

## Cutting a release

There's no single version field — every `schema/**/*.schema.yaml` file's own `$id` independently encodes the version (e.g. `.../v<version>/common/ref.schema.yaml`), and everything else (`nav.js`, `compile-mdx.mjs`'s `{{VERSION}}` substitution, the versioned `site/dist/v<n>/` directory) derives the current version by reading it back out of `schema/dsds.bundled.yaml`. MDX content must never hardcode a version — always use `{{VERSION}}`.

`scripts/tools/bump-version.js` automates the mechanical part — every schema file's `$id`, `bundle.js`'s hardcoded `$id`, every example/test fixture's `schemaVersion`, README's one hardcoded URL, and `package.json#version` — then regenerates the bundled schema and syncs `.agents/skills/dsds-*`'s version references. Pass `--tag` to have it run the rest of the sequence too — build, check, commit, and an annotated tag — in one go:

```bash
# 1. Make schema changes under schema/, add examples/ + examples/invalid/ fixtures as needed.
# 2. Add a CHANGELOG entry.
# 3. Commit both — --tag below requires a clean working tree.
npm run bump-version 0.21.1 -- --tag   # rewrite, bundle, sync skills, build, check, commit, tag
git push && git push origin v0.21.1     # review first, then push
```

Without `--tag`, the same steps run one at a time, manually:

```bash
npm run bump-version 0.21.1     # rewrites every version reference, bundles, syncs skill versions
npm run build                   # publishes a new site/dist/v<new-version>/
npm run check                   # must pass before committing
git add -A && git commit -m "v0.21.1"
git tag -a v0.21.1 -m "v0.21.1"
git push && git push origin v0.21.1
```

Use `npm run bump-version <version> -- --dry-run` to preview changes first, or `--help` for the rest of the flags.

The versioned dist directories (`site/dist/v<n>/dsds.bundled.schema.json` and `dsds.bundled.yaml`) are **immutable public contracts**. Older `v<n>/` directories must stay untouched, and they are the one part of `site/dist/` that is tracked in git. `scripts/site/build-site.js` preserves them across rebuilds and never regenerates an older one, so nothing else would put them back.

Tag every release (`vX.Y.Z`, pushed to the remote) once its commit is merged — a released version with no tag is indistinguishable from a work-in-progress one to anything that resolves "latest" by walking tags (`dsds-mcp`'s staleness check is one real example). Releases through v0.15.2 did this consistently; if the working tree is currently untagged past that point, tag it before cutting anything new so tag history stops having a gap.

### Bundle format

Both `dsds.bundled.yaml` (matching the hand-authored `schema/**/*.schema.yaml` source it's built from) and `dsds.bundled.schema.json` (the same document, as JSON) are published for every version, generated together by `scripts/generate/bundle.js` from the one parsed schema tree. "JSON Schema" names the spec both formats conform to (a constraint language for a data model), not a file-syntax requirement — see `scripts/generate/bundle.js`'s own comment for why YAML is the source format either way.

For a documentation-only edit (no schema/example changes), just commit the `site/content/` change — no version bump, no new `/v<n>/` artifact, and nothing to commit from `site/dist/`. Run `npm run build` locally when you want to check the result before pushing; the deploy rebuilds it either way.

## Contributing

This is an early-stage specification (currently DSDS 0.21.2). Feedback and contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for what a rule, example, or schema change needs to land, and [SECURITY.md](SECURITY.md) to report a vulnerability.

### Contributors

Everyone who has landed a PR here, with what it added:

- **[Cody Clark](https://github.com/codysue)** — the CEM interop example
  ([#31](https://github.com/somerandomdude/design-system-documentation-schema/pull/31)),
  the nested/aliased DTCG interop example
  ([#32](https://github.com/somerandomdude/design-system-documentation-schema/pull/32)),
  the token-description lint rule
  ([#33](https://github.com/somerandomdude/design-system-documentation-schema/pull/33)) —
  which is `DSDS-13` in today's catalog — and its companion for descriptions that
  only restate a scale position
  ([#37](https://github.com/somerandomdude/design-system-documentation-schema/pull/37)),
  now `DSDS-16`.
- **[Suleiman Ali Shakir](https://iamsuleiman.com/)** — the README validation
  one-liner and lockfile
  ([#34](https://github.com/somerandomdude/design-system-documentation-schema/pull/34)),
  and a stale version string in Contributing
  ([#20](https://github.com/somerandomdude/design-system-documentation-schema/pull/20)).
- **[Mykhaylo Ryechkin](https://github.com/mryechkin)** — the agent skills
  (`.agents/skills/`) and `scripts/generate/sync-skill-versions.js`
  ([#29](https://github.com/somerandomdude/design-system-documentation-schema/pull/29)),
  and updating those skills for the 0.21 schema
  ([#46](https://github.com/somerandomdude/design-system-documentation-schema/pull/46)).
- **[Mark Toadvine](https://github.com/marktoadvine)** — the `shared-a11y` WCAG 2.2
  accessibility guidelines in the starter kit
  ([#38](https://github.com/somerandomdude/design-system-documentation-schema/pull/38)).
- **[Chris Strahl](https://github.com/chrisstrahl)** — real API identifier shapes on a
  trait `id` and the widened `combo` target
  ([#42](https://github.com/somerandomdude/design-system-documentation-schema/pull/42)),
  and resolving a `same-as` target before flagging a missing `checkedBy`, fixing a
  `DSDS-14` false positive
  ([#43](https://github.com/somerandomdude/design-system-documentation-schema/pull/43)).
- **[isabelthedesigner](https://www.isabelthedesigner.com)** — the anti-pattern for bare
  WCAG conformance claims
  ([#44](https://github.com/somerandomdude/design-system-documentation-schema/pull/44)).

And with thanks for contributions that didn't arrive as a PR:

- **[Afyia Smith](https://afyiasmith.co/)** — the `owner`/`reviewed` and `origin` metadata schemas.

## License

This project is open source. See [LICENSE](LICENSE) for details.
