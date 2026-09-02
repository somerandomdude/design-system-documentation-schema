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

`npm run check-rule-catalog` fails the build if any of the three exists
without the other two — a rule can't be silently half-removed the way
[`DSDS-011` was during the 0.20.0 rewrite](https://github.com/somerandomdude/design-system-documentation-schema/pull/33).

**A new advisory (documentation-quality) rule** goes in `scripts/lint-docs.js`
plus the same `schema/conformance-rules.yaml` catalog, with `enforcement:
lint`. Advisory rules warn; they never fail `npm run check`.

**A new example** (`examples/`) needs an entry in `manifest.json`'s
`examples` listing, or a link from the page that's supposed to surface it
(Quick start, Extending, or Overview) — an example nothing points at can't
be found, and `npm run check:internal-links` won't catch an example that's
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
npm run check-examples      # run before check — see .github/workflows/ci.yml
npm run check               # schema, fixtures, docs — same as CI's main job
npm run build               # regenerate site/dist/
npm run check:markdown-mirrors
npm run check:internal-links
npm run check:docs-coverage
npm run lint:css
npm run test:a11y           # needs Chromium: npx playwright install chromium
```

All of the above run in CI on every push and PR, and all of them gate it.

Two more run in CI without gating it — the **advisory tier**, meant to be
visible rather than blocking:

```bash
npm run lint:docs           # documentation-quality rules (DSDS-12–DSDS-15)
npm run readability         # prose readability per file, incl. every site page
```

Neither can fail a build. `lint:docs`'s findings are warnings by design, and
a readability score is a judgment metric — no wording is wrong at 47 and
right at 56. Read them as a prompt to look, not a verdict. If you're adding
a page and its score lands well below the others, that usually means long
sentences rather than hard words; splitting them is the fix that moves it.

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
