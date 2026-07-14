# Negative fixtures

Every `.dsds.json` file in this directory MUST fail validation — by the
schema or by the semantic checks in `scripts/validate.js` (Part 4 of
`npm run validate` asserts this). A fixture that validates cleanly means
the guard it pins has stopped working.

Each fixture pins one guard:

| Fixture | Guard |
| --- | --- |
| `accessibility-empty-keyboard-interactions` | accessibility content arrays require at least one item |
| `accessibility-prose-field` | accessibility blocks carry structured data only — prose fields were removed in 0.9 |
| `anatomy-token-unresolved` | semantic: anatomy token overrides must resolve against the documented token layer |
| `api-block-on-token` | block scoping: tokens accept general kinds only |
| `api-empty-content-arrays` | api content arrays require at least one item |
| `api-event-returns` | the pre-0.14 `returns` field on events is rejected — events document what a listener receives via `payload` |
| `api-property-deprecated-without-notice` | `deprecated: true` on an API property requires a `deprecationNotice` |
| `block-kind-camelcase-use-cases` | the pre-0.14 camelCase `useCases` block kind is rejected — the kind is `use-cases` |
| `both-entity-and-entity-groups` | `entity` and `entityGroups` are mutually exclusive |
| `chunk-code-both-forms` | chunk `code` is exactly one of inline (`code` + `language`) or referenced (`src` + `language`), never both |
| `chunk-top-level-guidelines` | chunk's pre-0.14 top-level `guidelines`/`useCases` shorthand is rejected — guidance lives in `documentBlocks` |
| `component-missing-identifier` | components require `identifier` |
| `component-uppercase-identifier` | component identifiers are lowercase kebab-case |
| `criterion-automated-without-check` | `verification: automated` requires a `check` |
| `criterion-check-without-verification` | a `check` requires an explicit `verification` mode |
| `criterion-duplicate-identifier` | semantic: criterion identifiers unique within an entity (DSDS-002) |
| `criterion-fixture-without-outcome` | criterion fixtures require a declared `outcome` |
| `criterion-manual-with-check` | `verification: manual` forbids a `check` |
| `criterion-unknown-verification-mode` | `verification` is a closed enum: automated, assisted, manual |
| `deprecated-as-bare-string` | deprecated status must use the object form |
| `deprecated-overall-without-notice` | overall deprecation requires `deprecationNotice` |
| `deprecated-platform-without-notice` | platform deprecation requires `deprecationNotice` |
| `design-specifications-camelcase-key` | design-spec map keys must be lowercase kebab-case |
| `design-specifications-empty-objects` | design-specifications sub-objects (`spacing` here) require at least one property |
| `design-specifications-spacing-internal-empty` | `spacing.internal`/`external` require at least one property |
| `doc-origin-blocks-unknown-kind` | semantic: `docOrigin.blocks` keys must match a block kind on the entity |
| `doc-origin-generated-human` | `overall: generated` restricts `authorship` to machine-generated / ai-generated |
| `duplicate-identifiers-in-group` | semantic: identifiers unique within an entity group |
| `empty-accessibility-block` | accessibility block requires at least one content field |
| `empty-api-block` | api block requires at least one content field |
| `empty-content-block` | content block requires at least one content field |
| `empty-design-specifications-block` | design-specifications block requires at least one content field |
| `entity-group-empty` | entity groups require a non-empty `entities` array |
| `enum-variant-missing-values` | enum variants require `values` |
| `example-no-presentation-no-value` | an example requires a `presentation` or a `value` (or both) |
| `extensions-unnamespaced-key` | `$extensions` keys must be vendor-namespaced (schema `propertyNames` pattern) |
| `fileref-absolute-uri` | `$ref` fileRefs must be relative paths — absolute URIs are rejected |
| `fileref-with-extra-properties` | `$ref` objects accept no other properties |
| `governance-empty-owner` | governance `owner` must not be an empty string |
| `governance-reviewed-against-orphaned` | `reviewedAgainst` lives inside the `lastReviewed` object, not on governance |
| `guideline-missing-level` | guideline entries require `level` |
| `guideline-uppercase-level` | conformance levels are lowercase kebab-case ('must', not 'MUST') |
| `interaction-component-unknown-identifier` | semantic: entity references must resolve to a documented entity |
| `interaction-components-as-strings` | interaction `components` are entity references, not strings |
| `link-kind-invalid` | link `kind` must be lowercase kebab-case |
| `link-no-url-no-identifier` | `url` is required on every link — `kind` alone is not enough (the pre-0.14 identifier anyOf is gone) |
| `link-with-identifier` | the pre-0.14 inter-entity link surface (`identifier`, `role`, `required`) is rejected — a link is `kind` + `url` (+ `label`) |
| `motion-bezier-out-of-range` | cubic-bezier control points P1x and P2x must be in [0, 1] |
| `motion-duration-empty` | a duration object needs `min`, `max`, or `description` |
| `neither-entity-nor-entity-groups` | a document needs `entity` or `entityGroups` |
| `relationship-cycle` | semantic: composes/depends-on edges must stay acyclic |
| `relationship-target-unresolved` | semantic: relationship targets must resolve to a documented entity |
| `scale-step-label` | the pre-0.14 `label` field on scale steps is rejected — the display name is `name` |
| `scale-step-no-token-no-value` | a scale step requires a `token` or a `value` (or both) |
| `scale-step-token-unresolved` | semantic: scale step token references must resolve against the documented token layer |
| `section-duplicate-anchor` | two section entries share an `anchor` — anchors MUST be unique within the parent block (semantic check) |
| `state-token-override-unresolved` | semantic: state token overrides must resolve against the documented token layer |
| `status-description` | the pre-0.14 `description` field on status objects is rejected — the field is `note` |
| `step-entry-title` | the pre-0.14 `title` field on step entries is rejected — the actionable line is `label` |
| `system-info-system-name` | the pre-0.14 `systemName`/`systemVersion` fields are rejected — systemInfo uses `name`/`version` |
| `theme-override-unresolved` | semantic: theme override tokens must resolve against the documented token layer |
| `thumbnail-alt-empty` | thumbnail `alt` must not be empty |
| `token-missing-token-type` | semantic: a bare token with no `tokenType` and no ancestor token group to inherit one from is rejected |
| `token-source-empty` | token `source` requires `file` |
| `token-tokentype-uninherited` | semantic: `tokenType` must be present or inherited — a group without one cannot cover its children |
| `unknown-block-kind` | block `kind` must be a known value |
| `unknown-entity-kind` | entity `kind` must be a known value |
| `use-case-missing-stance` | use case items require `stance` |
| `wrong-dsds-version` | `dsdsVersion` must be the spec version string (numeric here so bump-version cannot rewrite it) |

When adding a guard to the schema or to the semantic checks, add a fixture
here that fails because of it, plus an entry in `expectations.json` declaring
how it fails: the rejection layer (`schema` or `semantic`), and for schema
rejections the `errorAt` instance path of the violation. The validator
enforces both — a fixture that fails at the wrong layer or path is treated
as a broken guard, not a pass.
