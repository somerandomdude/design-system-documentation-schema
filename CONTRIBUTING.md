# Contributing to DSDS

This is an early-stage, pre-1.0 specification (currently 0.20.0), maintained
by one person. Feedback and contributions are welcome — this file says what
a contribution needs to land and stay landed.

## Before you start

- **Questions, suggestions, or a problem with the spec** — open an issue.
  You don't need a fix in hand.
- **A proposed change to the spec, schema, or examples** — open a PR. For
  anything beyond a small fix, open an issue first describing the change;
  schema changes are easy to make and hard to undo once documents exist
  against them (see [Stability](https://designsystemdocspec.org/stability.html)
  for what "hard to undo" means pre-1.0).

## What a contribution needs, by kind

**A new or changed validator rule** (`scripts/validate.js`'s `DSDS-XX`
catalog) needs all three of:

1. A catalog entry in `schema/conformance-rules.yaml` — id, name,
   `enforcement` tier, title, description.
2. An implementation in `scripts/validate.js` (semantic rules) or the schema
   itself (JSON-Schema-enforced constraints).
3. A fixture in `examples/invalid/` declaring what it expects: a leading
   `# rejectedBy: schema|semantic` comment, plus `# expect: DSDS-XX` or
   `# errorAt: /json/pointer` as applicable. `scripts/conformance-test.js`
   asserts the fixture fails for that exact reason, at that exact layer —
   not just that it fails at all.

`npm run check` fails the build if any of the three exists
without the other two — a rule can't be silently half-removed the way
[`DSDS-011` was during the 0.20.0 rewrite](https://github.com/somerandomdude/design-system-documentation-schema/pull/33).

**A new advisory (documentation-quality) rule** goes in `scripts/lint-docs.js`
plus the same `schema/conformance-rules.yaml` catalog, with `enforcement:
advisory`. Advisory rules warn; they never fail `npm run check`.

**A new example** (`examples/`) needs an entry in `manifest.json`'s
`examples` listing, or a link from the page that's supposed to surface it
(Quick start, Extending, or Overview) — an example nothing points at can't
be found, and `npm run check:docs` won't catch an example that's
simply never linked. If you're adding an example specifically to
demonstrate a schema feature, say which feature in the PR description so it
gets referenced from the right page.

**A schema change** needs a CHANGELOG entry (extreme brevity — see existing
entries for the expected length) and, if it changes what a previously-valid
document looks like, a note in
[Stability](https://designsystemdocspec.org/stability.html)'s version-semantics
table logic: is this additive (patch), a tightening (minor, with a CHANGELOG
list of affected positions), or a rename/removal (batched minor pre-1.0,
with a migration script)? See that page's "What counts as a breaking
change" section — adding a validator rule counts, even with no schema edit.

## When a release changes the model

This is the single question that would have caught most of what went wrong
in the 0.20.0 rewrite: when a release changes how documents are shaped
(not just adds to the existing shape), **enumerate every guard, fixture,
skill, and example that pointed at the old model, and decide, in writing —
in the PR description or a CHANGELOG note — whether each one ports or is
dropped.** A dropped guard is a fine outcome. A guard nobody decided about
is how a negative-test corpus quietly loses most of its coverage.

## Running the checks locally

```bash
npm install
npm run check:all   # the whole gate, same as CI
```

That's the one command to run before pushing. It's three steps —
`check` → `build` → `check:docs` — and the build in the middle is
load-bearing, not a convenience: `site/dist/` is git-ignored, so on a fresh
clone the doc checks would otherwise find no dist to read.

Run the parts on their own for a narrower loop while iterating:

```bash
npm run check       # bundle, $id paths, rule catalog, every example and
                    # fixture, the conformance suite, generated-artifact
                    # freshness. Needs no dist.
npm run build       # regenerate site/dist/
npm run check:docs  # markdown mirrors, internal links, nav/footer page
                    # coverage, the script reference, the edge function's
                    # page list, CSS. Reads site/dist/, so build first.
```

Don't commit generated output. `site/dist/` is git-ignored and rebuilt on
every deploy; the build above is for the checks that read it, not something
to stage. The exception is a release, which adds a new immutable
`site/dist/v<version>/` directory — those stay tracked, because the build
never regenerates an older one.

One more runs in CI without gating it — the **advisory tier**, meant to be
visible rather than blocking:

```bash
npm run lint  # documentation-quality rules (DSDS-12–DSDS-16)
```

It can't fail a build; its findings are warnings by design.

`npm run readability` is a related but separate tool — prose readability per
file, including every site page — that is deliberately **not** run in CI. It
shells out to a `readability` binary this repo doesn't declare as a
dependency or vendor, so it isn't reliably runnable in CI at all; running it
there would just be a permanently-red step. Run it locally when writing
prose. No wording is wrong at 47 and right at 56 — read the score as a
prompt to look, not a verdict. If you're adding a page and its score lands
well below the others, that usually means long sentences rather than hard
words; splitting them is the fix that moves it.

And the accessibility audit, the only thing here that needs a browser (it
installs Chromium itself):

```bash
npm run test:a11y
```

## Every script

`package.json` is the index; this is what each entry is for. Nothing here is
a wrapper for its own sake — if a script isn't listed, it doesn't exist.

### Everyday

| Script | What it does |
| --- | --- |
| `npm run check:all` | The whole gate: `check`, then `build`, then `check:docs`. What CI runs. |
| `npm run check` | Bundle, `$id`-matches-path, rule-catalog drift, every example and fixture, the conformance suite, generated-artifact freshness. Needs no `site/dist/`. |
| `npm run check:docs` | Markdown mirrors, internal links, nav/footer page coverage, this reference, the edge function's page list, CSS. Reads `site/dist/` — build first. |
| `npm run build` | Regenerates every generated artifact, then builds the site into `site/dist/`. Launches no browser. Warns if it changed a *released* (git-tagged) version's published artifacts; add `-- --strict-versions` to make that fatal. |
| `npm run dev` | Local preview server. |
| `npm run validate` | Validate files you name: `npm run validate -- path/to/doc.dsds.yaml`. Add `-- --strict` to promote project-scope warnings to failures. |
| `npm run lint` | Advisory tier (`DSDS-12`+): documentation-quality warnings. Always exits 0. |

### One-off tools

| Script | What it does |
| --- | --- |
| `npm run generate` | Rewrites every generated artifact: example includes, the schema bundle, the normative index, the rule-catalog table, the examples index, the conformance suite. Run it after editing schema `description`/`$comment` text. |
| `npm run generate:check` | Asserts those artifacts are current without rewriting them. Part of `check`; useful alone when a check fails and you want to know whether it's just staleness. |
| `npm run migrate` | Converts a 0.15.2 `.dsds.json` document to 0.20.0 `.dsds.yaml`: `npm run migrate -- <files-or-dirs…> [--dry-run]`. Best-effort — run `validate` on the output. |
| `npm run compose` | Concatenates hand-split `.dsds.yaml` fragments into one document before validation. |
| `npm run bump-version` | The release driver. Rewrites every version reference, regenerates, builds, checks, commits, tags. |
| `npm run og:generate` | Regenerates `site/assets/og-image.png`. Needs Chromium. Run it and commit the result only when the logo or the accent/text tokens change — the build does not do this for you. |
| `npm run readability` | Prose readability per file. Needs a `readability` binary on PATH that this repo neither declares nor vendors, so it currently exits 1 without producing a score. |
| `npm run test:a11y` | axe audit against the built site. Installs its own Chromium — the only thing here that needs a browser. |

### Internal

Called by `scripts/bump-version.js` by name. **Don't rename these without
updating its `runStep` calls** — it shells out to the string, so a rename
fails at release time, not at review time.

| Script | What it does |
| --- | --- |
| `npm run bundle` | Regenerates `schema/dsds.bundled.yaml` and `dsds.bundled.schema.json` from the split schema files. Also the first step of `check`. |
| `npm run sync-skill-versions` | Keeps `.agents/skills/dsds-*`'s version references in lockstep with the spec version. `--check` asserts without writing. |

Each script file also opens with a header comment explaining why it exists
and what it's guarding against, which is usually the faster read when
something fails.

## Style

- Every schema file explains *why* it's shaped the way it is, in `$comment`,
  not just what it is — a future reader (including you, in six months)
  should be able to tell what the file replaced or why an alternative
  shape was rejected.
- README stays brief and current; it is not a place to duplicate content
  that belongs on the site or in the schema's own descriptions.
- MDX content must never hardcode the current version — use `{{VERSION}}`.

## Credit

Contributors are listed in README's Contributors section and, for anything
that becomes a permanent part of the spec (a rule, a schema field), credited
in the relevant CHANGELOG entry or catalog description.
