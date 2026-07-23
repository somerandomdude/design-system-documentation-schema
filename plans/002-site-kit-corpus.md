# Plan 002: Document the DSDS Site Kit and codify its authoring contract

> **Executor instructions**: Follow this plan in order and update Plan 002 in
> `plans/README.md` when complete. Do not create or modify Web Components.
> Codify only conventions evidenced by the repository. Stop if source contracts
> are ambiguous; do not invent attributes or accessibility behavior.
>
> **Drift check (run first)**:
> `git diff --stat 1964319..HEAD -- site/components spec/examples tools/dsds-local`
> Reconcile any changed component contracts before writing the corpus.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW — documentation and contract tests only
- **Depends on**: none; use the repository's existing validation scripts
- **Category**: direction / docs / tests
- **Planned at**: commit `1964319`, 2026-07-22
- **PRD story**: Story 6, “Use the DSDS Site Kit as a runnable reference implementation”

## Why this matters

The local assistant needs a real implementation-aware corpus. The site already
contains framework-neutral custom elements, but their contracts live in source
comments and code rather than DSDS entities. Documenting a focused set creates
the runnable demo without building another component library.

## Current state

- `site/components/index.js:31-50` registers 19 `ds-*` elements.
- `site/components/callout.js:2-22` documents variants, title, default slot,
  and plain-HTML usage; lines 94-105 expose three CSS parts.
- `site/components/code.js:2-13` documents `language`, `label`, `inline`, and
  `wrap`; lines 116-181 define behavior and accessible scrolling.
- `site/components/badge.js:2-12` documents `variant` and label content; lines
  66-80 expose `badge`, `icon`, and `label` parts.
- `site/components/spec-nav.js:2-36` documents attributes, child structure,
  responsive behavior, and usage.
- `site/components/json-view.js:2-20` documents `label`, slot content, and use;
  lines 76-108 show dialog behavior and parts.
- `site/components/header.js:2-14` documents title, description, source, and
  its default slot.
- `site/content/interoperability.mdx:101-115` defines the DSDS/CEM boundary:
  API facts may come from CEM while DSDS owns intent, guidance, and provenance.
- `spec/examples/starter-kit.dsds.json:119-159` is the multi-entity example
  shape to follow.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Validate all DSDS | `npm run validate` | exit 0 |
| Editorial warnings | `node scripts/lint-docs.js spec/examples/site-kit.dsds.json` | exit 0; no missing description/use-case/rationale warnings |
| Contract tests | `npm run test:site-kit` | exit 0 |
| Skill validation | `python3 /path/to/skill-creator/scripts/quick_validate.py skills/dsds-web-components-authoring` | `Skill is valid!` |

## Suggested executor toolkit

The corpus mapping portion is suitable for a local Llama 3.1 8B executor
because each component mapping is bounded and mechanically checked. Give it
this plan plus the repository, and require it to work on one entity at a time:

1. read only that component module and `site/components/index.js`;
2. add or update only that entity in the seed corpus;
3. run schema validation, editorial lint, and the site-kit contract test;
4. commit locally only after all three checks pass;
5. stop rather than infer undocumented behavior.

Davy reviews every API block and usage guideline. Codex reviews the aggregate
corpus, drift test, skill instructions, and any schema interpretation. Future
primitive work may use the authoring skill offline, one separately scoped
component story at a time.

## Scope

**In scope**

- `spec/examples/site-kit.dsds.json`
- `test/site-kit-contract.test.js`
- `skills/dsds-web-components-authoring/`
- `.gitignore` and the `test:site-kit` package script

**Out of scope**

- All files in `site/components/`
- New components, styling changes, framework wrappers, TypeScript declarations
- Automatic CEM generation/conversion
- Documentation for the other 11 registered elements

## Git workflow

- Suggested branch: `local-context/002-site-kit-corpus`
- Commit message: `docs: add DSDS Site Kit reference corpus`
- Do not push unless instructed.

## Steps

### Step 1: Create the focused multi-entity DSDS document

Create `spec/examples/site-kit.dsds.json` with one entity group and these
component identifiers:

```text
ds-callout
ds-code
ds-badge
ds-prop-table
ds-spec-nav
ds-cross-refs
ds-json-view
ds-header
```

For every entity, include:

- description, stable Web Component platform status, source link, tags
- `imports` with `site/components/index.js` and a plain-HTML example
- `api` with attributes, slots, CSS parts, and CSS custom properties evidenced
  by that component's source
- at least one recommended `use-cases` item
- guidelines with rationale/evidence
- accessibility content only where the source or rendered semantics supports it
- `$extensions["org.designsystemdocspec.site-kit"]` containing `tagName`,
  `entrypoint`, and the component module path

Document `ds-prop` as the ninth entity because it is the required light-DOM
child contract of `ds-prop-table`. Do not copy implementation prose from
unrelated generic component examples.

**Verify**: `node scripts/validate.js` → exit 0 and
`site-kit.dsds.json` appears in the passing examples.

### Step 2: Add drift-oriented contract tests

Parse `site/components/index.js` and the seed corpus. Assert that all eight
documented tag names are registered, every extension module path exists, and
every plain-HTML example contains its entity's tag. Do not parse JavaScript with
regular expressions beyond the literal registry array; fail with a clear
message if its shape changes.

**Verify**: `npm run test:site-kit` → all site-kit contract tests pass.

### Step 3: Create the Web Components authoring skill

Create a project-owned skill under `skills/dsds-web-components-authoring/`.
It must guide an agent through public API design, tokenized implementation,
accessibility, lifecycle cleanup, registration, testing, and synchronized DSDS
documentation. Keep detailed repository anchors and DSDS mapping rules in
focused reference files.

Do not add component scaffolding or prescribe behavior unsupported by the
existing Site Kit.

**Verify**: run the skill-creator validator and receive `Skill is valid!`.

### Step 4: Check documentation quality

Run the editorial linter and correct only the new corpus. Warnings about
missing descriptions, use cases, or guideline rationale are failures for this
plan even though the linter exits 0.

**Verify**:
`node scripts/lint-docs.js spec/examples/site-kit.dsds.json` → no findings.

## Test plan

Test all nine registrations, extension module paths, example tag names,
unique identifiers, and the `web-component` platform status. The existing
`npm run validate` remains the schema and semantic-reference test.

## Done criteria

- [x] The nine entities validate against DSDS 0.15.2.
- [x] The editorial linter reports no findings for the new corpus.
- [x] Contract tests prove every documented tag and module exists.
- [x] The version-controlled authoring skill passes structural validation.
- [x] No `site/components/` file changed.
- [x] No framework wrapper or invented API appears.
- [x] Plan 002 is marked `DONE`.

## STOP conditions

- A component's public attributes/slots/parts cannot be established from its
  source.
- The DSDS schema cannot represent a required API fact without a vendor
  extension that duplicates a core field.
- A referenced component lacks enough accessibility evidence to document it
  honestly; omit that claim and report the gap.
- Completing the corpus appears to require changing component code.

## Maintenance notes

Reviewers should compare each API block directly with the source comments,
`observedAttributes`, shadow parts, and light-DOM model. If the site later emits
a Custom Elements Manifest, migrate machine-owned API facts while retaining
human-authored guidance and provenance.
