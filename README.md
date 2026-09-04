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

## Interoperability

DSDS is built to sit alongside the formats that already own a layer, not to
replace them. **If another format owns a fact, DSDS points at it rather than
restating it** — a token entry has a `source` and no `value`; a component
entry has `sourceFiles` and `specs` and no property table.

| Format | What it owns | The DSDS field |
|---|---|---|
| [DTCG](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) | Token values, types, aliases | A token or theme entry's `source` |
| [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) and other contract formats | A component's generated API | A component's `specs` (`rel: contract`) |
| [CSF](https://storybook.js.org/docs/api/csf) / Storybook | Stories and live demos | A `refs`/`examples` entry with `rel: storybook` |
| Source files, framework typings | The real interface | A component's `sourceFiles` |
| vitest, axe-core, stylelint, ESLint | Whether a guideline actually holds | A guideline's `checks` (`rel: test`, `rel: lint-rule`) |
| WCAG, ARIA APG, MDN | Why a guideline exists | A guideline's `evidence` |
| Figma, npm, anything else | Design artifacts, distribution, vendor data | `rel: design`, `imports[].package`, `$extensions` |

Full detail, with a worked example for each, is on the site's
**[Interoperability](https://designsystemdocspec.org/interoperability)** page.
Validated example pairs live in [`examples/interop/`](examples/interop/).

> [!NOTE]
> **Credit where due:** DSDS's conformance design follows the trail blazed by the [Adobe Spectrum Design Data specification](https://opensource.adobe.com/spectrum-design-data/spec/) — a layered model of structural schema rules plus a semantic-rule catalog with stable IDs. Prior art this good deserves a shoutout.

## Conformance

What it means for a document to follow the DSDS spec — the four conformance
classes, the three enforcement tiers, and the full `DSDS-01`–`DSDS-16` rule
catalog — is documented on the site:

- **[Conformance](https://designsystemdocspec.org/conformance)** — the rule
  catalog, conformance classes, enforcement tiers, project-scope resolution,
  and how a component's status works across platforms.
- **[Stability](https://designsystemdocspec.org/stability)** — what's safe to
  build tooling around, what can still change before 1.0, how to migrate a
  0.15.2 document, and the criteria for declaring 1.0.

The machine-readable catalog is
[`schema/conformance-rules.yaml`](schema/conformance-rules.yaml); `npm run
check` asserts it matches `scripts/validate.js` in both directions.

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY**
carry their [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) meaning
inside the DSDS schema files, and only when written in capital letters. The
full index of every such statement in the schema — regenerated from those
schemas on every build, so it can't drift — is on the site's
[Conformance](https://designsystemdocspec.org/conformance#index-of-every-normative-statement)
page, not duplicated here.

## Documentation

The authoritative reference for every schema and field is the **documentation site at [designsystemdocspec.org](https://designsystemdocspec.org/)**. Property tables there come straight from the schema files, so they cannot drift from the code.

- **[Overview](https://designsystemdocspec.org/)** — What DSDS is, the entry/section model, design principles, humans & agents, and interoperability with DTCG/CEM/Storybook. For conformance classes, the `DSDS-01`–`DSDS-11` semantic rule catalog, and stability guarantees, see [Conformance](#conformance) below.
- **[Quick Start](https://designsystemdocspec.org/quickstart.html)** — Document structure, entry kinds, the section system, and minimal examples for every entry kind.
- **[Extending the schema](https://designsystemdocspec.org/extending.html)** — `$extensions`, custom kinds, and profiles: the three ways to go beyond what the spec ships with, and when to reach for each.
- **[Interoperability](https://designsystemdocspec.org/interoperability)** — every format DSDS points at instead of restating: DTCG, CEM, CSF/Storybook, tests, standards, design tools.
- **[Schema](https://designsystemdocspec.org/schema.html)** — Opens with how the schema itself is organized, then every schema definition, each with a real example next to it.

You can also build the site locally with `npm run build` and open `site/dist/index.html`.

This README leaves out schema field listings and example payloads on purpose — those live on the documentation site as a single source of truth.

## Repository layout

- **`schema/`** — The split JSON Schema source (`common/`, `metadata/`, `entries/`, `sections/`), plus the auto-generated `dsds.bundled.yaml` / `dsds.bundled.schema.json` and the `DSDS-01`–`DSDS-16` `conformance-rules.yaml` catalog.
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
node scripts/validate.js my-system.dsds.yaml
```

If your system is split across files via `rel: file`, cross-file `to:` refs are resolved automatically, bounded to the directory of the file you validate (and its subdirectories — not a parent or cousin directory). An otherwise-unresolved target reports as a warning, not a hard failure — add `--strict` (`npm run validate -- --strict`) to promote those to failures once your project is clean.

Reference `https://designsystemdocspec.org/v0.20.0/dsds.bundled.yaml` from your DSDS files via the `$schema` keyword for editor autocompletion and inline validation.

For document structure, composing hand-split fragments (`scripts/compose.js`), and authoring narrative pages with schema-driven property tables, see the **[Quick Start docs page](https://designsystemdocspec.org/quickstart.html)** and [How the schema is organized](https://designsystemdocspec.org/schema.html#how-the-schema-is-organized).

## Cutting a release

There's no single version field — every `schema/**/*.schema.yaml` file's own `$id` independently encodes the version (e.g. `.../v0.20.0/common/ref.schema.yaml`), and everything else (`nav.js`, `compile-mdx.mjs`'s `{{VERSION}}` substitution, the versioned `site/dist/v<n>/` directory) derives the current version by reading it back out of `schema/dsds.bundled.yaml`. MDX content must never hardcode a version — always use `{{VERSION}}`.

`scripts/bump-version.js` automates the mechanical part — every schema file's `$id`, `bundle.js`'s hardcoded `$id`, every example/test fixture's `schemaVersion`, README's one hardcoded URL, and `package.json#version` — then regenerates the bundled schema and syncs `.agents/skills/dsds-*`'s version references. Pass `--tag` to have it run the rest of the sequence too — build, check, commit, and an annotated tag — in one go:

```bash
# 1. Make schema changes under schema/, add examples/ + examples/invalid/ fixtures as needed.
# 2. Add a CHANGELOG entry.
# 3. Commit both — --tag below requires a clean working tree.
npm run bump-version 0.20.1 -- --tag   # rewrite, bundle, sync skills, build, check, commit, tag
git push && git push origin v0.20.1     # review first, then push
```

Without `--tag`, the same steps run one at a time, manually:

```bash
npm run bump-version 0.20.1     # rewrites every version reference, bundles, syncs skill versions
npm run build                   # publishes a new site/dist/v<new-version>/
npm run check                   # must pass before committing
git add -A && git commit -m "v0.20.1"
git tag -a v0.20.1 -m "v0.20.1"
git push && git push origin v0.20.1
```

The build launches no browser. `site/assets/og-image.png` is a committed
source asset, copied into `site/dist/assets/` like any other; run
`npm run og:generate` and commit the result only when the logo
(`site/assets/dsds.svg`) or the accent/text tokens in `site/tokens.css`
change. Playwright is a devDependency for `npm run test:a11y` alone.

Use `npm run bump-version <version> -- --dry-run` to preview changes first, or `--help` for the rest of the flags.

The versioned dist directories (`site/dist/v<n>/dsds.bundled.schema.json` and `dsds.bundled.yaml`) are **immutable public contracts** — older `v<n>/` directories must stay untouched, and they are the one part of `site/dist/` that is tracked in git. `scripts/build-site.js` preserves them across rebuilds and never regenerates an older one, so nothing else would put them back.

The rest of `site/dist/` is git-ignored generated output: Netlify runs `npm run check && npm run build` on every deploy, so the served site is always built from the source that produced it. Commit the schema changes, examples, README, CHANGELOG, `package.json`, and the new `site/dist/v<new-version>/` directory together — but not the regenerated HTML, markdown mirrors, or component bundle.

Tag every release (`vX.Y.Z`, pushed to the remote) once its commit is merged — a released version with no tag is indistinguishable from a work-in-progress one to anything that resolves "latest" by walking tags (`dsds-mcp`'s staleness check is one real example). Releases through v0.15.2 did this consistently; if the working tree is currently untagged past that point, tag it before cutting anything new so tag history stops having a gap.

### Bundle format

Both `dsds.bundled.yaml` (matching the hand-authored `schema/**/*.schema.yaml` source it's built from) and `dsds.bundled.schema.json` (the same document, as JSON) are published for every version, generated together by `scripts/bundle.js` from the one parsed schema tree. "JSON Schema" names the spec both formats conform to (a constraint language for a data model), not a file-syntax requirement — see `scripts/bundle.js`'s own comment for why YAML is the source format either way.

For a documentation-only edit (no schema/example changes), just commit the `site/content/` change — no version bump, no new `/v<n>/` artifact, and nothing to commit from `site/dist/`. Run `npm run build` locally when you want to check the result before pushing; the deploy rebuilds it either way.

## Contributing

This is an early-stage specification (currently DSDS 0.20.0). Feedback and
contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for what
a rule, example, or schema change needs to land, and
[SECURITY.md](SECURITY.md) to report a vulnerability.

### Contributors

Everyone who has landed a PR here, with what it added:

- **[Cody Clark](https://github.com/codysue)** — the CEM interop example
  ([#31](https://github.com/somerandomdude/design-system-documentation-schema/pull/31)),
  the nested/aliased DTCG interop example
  ([#32](https://github.com/somerandomdude/design-system-documentation-schema/pull/32)),
  and the token-description lint rule
  ([#33](https://github.com/somerandomdude/design-system-documentation-schema/pull/33)) —
  which is `DSDS-13` in today's catalog.
- **[Suleiman Ali Shakir](https://iamsuleiman.com/)** — the README validation
  one-liner and lockfile
  ([#34](https://github.com/somerandomdude/design-system-documentation-schema/pull/34)),
  and a stale version string in Contributing
  ([#20](https://github.com/somerandomdude/design-system-documentation-schema/pull/20)).
- **[Mykhaylo Ryechkin](https://github.com/mryechkin)** — the agent skills
  (`.agents/skills/`) and `scripts/sync-skill-versions.js`
  ([#29](https://github.com/somerandomdude/design-system-documentation-schema/pull/29)).

And with thanks for contributions that didn't arrive as a PR:

- **[Afyia Smith](https://afyiasmith.co/)** — the `owner`/`reviewed` and
  `origin` metadata schemas.

## License

This project is open source. See [LICENSE](LICENSE) for details.
