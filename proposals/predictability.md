# Proposal: Predictability fixes

**Status:** Draft — awaiting approval. **Do not implement until this spec is final.**
**Provenance:** Agent-authoring feedback (June 2026): a component took four validation attempts, every failure a schema-convention trap. Each item below was verified against the 0.8.0 schema before acceptance. Design discussion resolved in session 2026-06-10.
**Companion:** DSDS-009 (RFC-keyword capitalization in prose) ships immediately as a lint rule — see rules/rules.yaml — because it holds regardless of this proposal's data-value changes.

## Theme

An author's first guess should be right — or the error should say why it isn't. The fixes split into loosenings (the schema legislated against legitimate states), error-message work (right design, undiscoverable), and one unification (five shapes for "point at an entity").

## Batch 1 — 0.8.x, non-breaking

1. **`enumVariant.values` minItems 2 → 1.** Single-value enums are real mid-migration states (a `tone` dimension introduced one value at a time). A documentation format documents reality, including transitional reality. Description drops "model a single-value dimension as a flag variant instead."
2. **`scaleStep` requires `token` OR `value`** (anyOf), not `token` alone. Pre-tokenization systems and non-token scales (column counts, icon grids) currently must fabricate token identifiers — the spec incentivizing fiction. The token-lint already catches raw values in token-bearing documents, so drift protection survives.
3. **`anatomyEntry.tokens` discoverability.** Shape unchanged (the purpose-keyed map is right). Add an `examples` keyword to the property, and a shape-hint to the friendly-error layer: "a purpose-keyed map, not an array — keys say what the token controls, values name the token."
4. **`status` shorthand trap gets a real error.** Shapes unchanged (bare string | object with `overall`; a third shape makes the concept worse). Friendly-error for the status position: "status is a bare string or an object with `overall` — there is no `value` property."
5. **Quickstart "Conventions and traps" section** covering the four traps from the field report: purpose-keyed token maps, `identifier` never `name`, the two status shapes, flag-vs-enum variants.
6. **MCP author context updated to 0.8** so agents receive these conventions before writing, not from the validator after.

## Batch 2 — 0.9, breaking (one migration event)

7. **`entityRef` common def — share the leaves, not the envelope.** New `common/entity-ref.schema.json` with leaf defs `entityIdentifier` and `entityRole`, plus the `entityRef` object (`identifier` required, `role` optional). `link` keeps its flat author-facing shape but its `identifier`/`role` properties `$ref` the shared leaves — link cannot structurally compose `entityRef` because url-only links exist and closed schemas block allOf extension (the criterionFixture precedent). Spec prose states: a link with an `identifier` is an entity reference and follows entityRef resolution rules. The semantic checks extend to validate every `entityIdentifier` position against the document's entity catalog.
8. **`interactionEntry.components` → array of `entityRef`.** The worst reference outlier: bare display-name strings, matched by `name`, unverifiable, untraversable. Becomes `[{ "identifier": "form-field", "role": "Carries the inline error" }]`. Codemod: name → identifier lookup against the document catalog, flagging non-matches for human decision.
9. **`conformanceLevel` values lowercase: `must`, `must-not`, `should`, `should-not`.** Resolved after challenge: RFC 8174's only-in-capitals rule governs prose, not data tokens — an enum value's meaning comes from the schema description either way, and `SHOULD_NOT` is the spec's only underscore-delimited value (a third casing system). Capitals stay in prose (see DSDS-009); WCAG `A`/`AA`/`AAA` stays uppercase (no natural lowercase form). Taxonomy rule narrows to: uppercase enum values only where the external token has no lowercase form. Migration: four-entry lookup codemod; `level` is required on every guideline entry, so this is the broad half of the 0.9 migration — batch it with #8 so documents migrate once.
10. **Optional `name` on token and token-group.** Kills the consumer special-case: the display rule becomes `name ?? identifier` uniformly (name required on the other five kinds, so it's always present there). Terseness-at-scale preserved — name stays omittable.

## Already shipped (companion)

- **DSDS-009 `rfc-keywords-lowercase-in-normative-prose`** (lint): in `guidance` and criterion `statement` fields — the two unambiguously normative prose positions — RFC 2119 keywords must be capitalized to carry conformance weight. Lowercase "must"/"should" there reads as a requirement but isn't marked as one. `may` is excluded: too common as ordinary English to flag without noise. Rationale for shipping ahead of batch 2: the rule concerns prose and is correct under either data casing.

## Out of scope, noted

- `unevaluatedProperties`-based composition (would let link structurally compose entityRef): a legitimate 1.0-era question; changes nothing about authored documents, so it can wait.
- Metadata placement: unchanged by all of the above. Metadata attaches to entities only — top-level, in groups, and nested token children. Group-level or block-level metadata, if ever wanted, should be a deliberate subset, not a reuse of `entityMetadata`.

## Sizing

Batch 1: **S**. Batch 2: **M** (schema + codemod + fixtures + docs + taxonomy update). One CHANGELOG entry each.
