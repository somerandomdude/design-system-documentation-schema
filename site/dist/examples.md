# Examples — DSDS 0.20.0

Every file below lives in the repo's `examples/` directory and is validated on every `npm run check` — nothing here is aspirational or out of date with the schema it demonstrates. `npm run check-examples` additionally confirms any example built from hand-split fragments (`scripts/compose.js`) still matches what those fragments say.

For the example most directly relevant to a specific schema feature, see that feature's own description on the [Schema](schema.html) page or its mention on [Quick start](quickstart.html) — this page is the full index, not a curated tour.

{/* dsds:examples-index */}

## anti-patterns/

Documents that validate cleanly and are still worth avoiding — the schema checks structure, not judgment. See each file's own leading comment.

- [`anti-patterns/circular-definition.yaml`](/examples/anti-patterns/circular-definition.yaml)
- [`anti-patterns/stale-terminology.yaml`](/examples/anti-patterns/stale-terminology.yaml)
- [`anti-patterns/unfalsifiable-manual-check.yaml`](/examples/anti-patterns/unfalsifiable-manual-check.yaml)

## base/

Full base documents — a system with multiple entries, split across files via `rel: file`.

- [`base/react-extension.dsds.yaml`](/examples/base/react-extension.dsds.yaml)
- [`base/starter-kit-fragments/00-system.dsds.yaml`](/examples/base/starter-kit-fragments/00-system.dsds.yaml)
- [`base/starter-kit-fragments/01-tokens-and-themes.dsds.yaml`](/examples/base/starter-kit-fragments/01-tokens-and-themes.dsds.yaml)
- [`base/starter-kit-fragments/02-components.dsds.yaml`](/examples/base/starter-kit-fragments/02-components.dsds.yaml)
- [`base/starter-kit.dsds.yaml`](/examples/base/starter-kit.dsds.yaml)
- [`base/tokens/dark.tokens.json`](/examples/base/tokens/dark.tokens.json)
- [`base/tokens/light.tokens.json`](/examples/base/tokens/light.tokens.json)

## entries/

Standalone entry files, one per kind, plus the source/manifest/story files a couple of them point at.

- [`entries/button-group.yaml`](/examples/entries/button-group.yaml)
- [`entries/button.yaml`](/examples/entries/button.yaml)
- [`entries/chunks/confirmation-dialog.tsx`](/examples/entries/chunks/confirmation-dialog.tsx)
- [`entries/color-action-primary-hover.yaml`](/examples/entries/color-action-primary-hover.yaml)
- [`entries/color-action-primary.yaml`](/examples/entries/color-action-primary.yaml)
- [`entries/color-surface-default.yaml`](/examples/entries/color-surface-default.yaml)
- [`entries/color-surface-raised.yaml`](/examples/entries/color-surface-raised.yaml)
- [`entries/confirmation-dialog.yaml`](/examples/entries/confirmation-dialog.yaml)
- [`entries/dark.yaml`](/examples/entries/dark.yaml)
- [`entries/dialog.yaml`](/examples/entries/dialog.yaml)
- [`entries/empty-state.yaml`](/examples/entries/empty-state.yaml)
- [`entries/error-state.yaml`](/examples/entries/error-state.yaml)
- [`entries/getting-started.yaml`](/examples/entries/getting-started.yaml)
- [`entries/icon-button.yaml`](/examples/entries/icon-button.yaml)
- [`entries/icon.yaml`](/examples/entries/icon.yaml)
- [`entries/link.yaml`](/examples/entries/link.yaml)
- [`entries/manifests/button.cem.json`](/examples/entries/manifests/button.cem.json)
- [`entries/space-4.yaml`](/examples/entries/space-4.yaml)
- [`entries/spacing-scale.yaml`](/examples/entries/spacing-scale.yaml)
- [`entries/src/Button.tsx`](/examples/entries/src/Button.tsx)
- [`entries/stories/button.stories.tsx`](/examples/entries/stories/button.stories.tsx)
- [`entries/tokens/dark.tokens.json`](/examples/entries/tokens/dark.tokens.json)
- [`entries/tokens.dtcg.json`](/examples/entries/tokens.dtcg.json)

## interop/

Worked pairs showing a DSDS entry pointing at a real DTCG token file or CEM manifest, instead of restating it.

- [`interop/color-action-primary.dsds.yaml`](/examples/interop/color-action-primary.dsds.yaml)
- [`interop/color-action-primary.tokens.json`](/examples/interop/color-action-primary.tokens.json)
- [`interop/my-element.custom-elements.json`](/examples/interop/my-element.custom-elements.json)
- [`interop/my-element.dsds.yaml`](/examples/interop/my-element.dsds.yaml)
- [`interop/my-element.js`](/examples/interop/my-element.js)
- [`interop/nested-color.dsds.yaml`](/examples/interop/nested-color.dsds.yaml)
- [`interop/nested-color.tokens.json`](/examples/interop/nested-color.tokens.json)

## invalid/

One broken example per semantic rule (`DSDS-XX-*.yaml`) plus schema-shape fixtures (`schema-*.yaml`) — the negative-test corpus `scripts/conformance-test.js` runs against.

- [`invalid/DSDS-01-one-api-per-platform.yaml`](/examples/invalid/DSDS-01-one-api-per-platform.yaml)
- [`invalid/DSDS-02-platform-vocabulary-status-list.yaml`](/examples/invalid/DSDS-02-platform-vocabulary-status-list.yaml)
- [`invalid/DSDS-02-platform-vocabulary.yaml`](/examples/invalid/DSDS-02-platform-vocabulary.yaml)
- [`invalid/DSDS-03-checked-by-needs-ref.yaml`](/examples/invalid/DSDS-03-checked-by-needs-ref.yaml)
- [`invalid/DSDS-04-unique-entry-id.yaml`](/examples/invalid/DSDS-04-unique-entry-id.yaml)
- [`invalid/DSDS-05-item-ref-resolves.yaml`](/examples/invalid/DSDS-05-item-ref-resolves.yaml)
- [`invalid/DSDS-06-composes-cycle.yaml`](/examples/invalid/DSDS-06-composes-cycle.yaml)
- [`invalid/DSDS-07-depends-on-cycle.yaml`](/examples/invalid/DSDS-07-depends-on-cycle.yaml)
- [`invalid/DSDS-08-entry-ref-resolves.yaml`](/examples/invalid/DSDS-08-entry-ref-resolves.yaml)
- [`invalid/DSDS-09-combo-target-resolves.yaml`](/examples/invalid/DSDS-09-combo-target-resolves.yaml)
- [`invalid/DSDS-10-same-as-level-matches.yaml`](/examples/invalid/DSDS-10-same-as-level-matches.yaml)
- [`invalid/DSDS-11-base-document-file-ref.yaml`](/examples/invalid/DSDS-11-base-document-file-ref.yaml)
- [`invalid/DSDS-11-file-ref-exists.yaml`](/examples/invalid/DSDS-11-file-ref-exists.yaml)
- [`invalid/schema-combo-target-pattern.yaml`](/examples/invalid/schema-combo-target-pattern.yaml)
- [`invalid/schema-component-unknown-field.yaml`](/examples/invalid/schema-component-unknown-field.yaml)
- [`invalid/schema-empty-entries-array.yaml`](/examples/invalid/schema-empty-entries-array.yaml)
- [`invalid/schema-extensions-unnamespaced-key.yaml`](/examples/invalid/schema-extensions-unnamespaced-key.yaml)
- [`invalid/schema-kind-enum-invalid.yaml`](/examples/invalid/schema-kind-enum-invalid.yaml)
- [`invalid/schema-legacy-documentblocks-field.yaml`](/examples/invalid/schema-legacy-documentblocks-field.yaml)
- [`invalid/schema-legacy-dsdsversion-field.yaml`](/examples/invalid/schema-legacy-dsdsversion-field.yaml)
- [`invalid/schema-legacy-identifier-field.yaml`](/examples/invalid/schema-legacy-identifier-field.yaml)
- [`invalid/schema-ref-mutually-exclusive-to-href.yaml`](/examples/invalid/schema-ref-mutually-exclusive-to-href.yaml)
- [`invalid/schema-requirement-level-casing.yaml`](/examples/invalid/schema-requirement-level-casing.yaml)
- [`invalid/schema-sourcefile-platform-pattern.yaml`](/examples/invalid/schema-sourcefile-platform-pattern.yaml)
- [`invalid/schema-sourcefiles-empty-array.yaml`](/examples/invalid/schema-sourcefiles-empty-array.yaml)
- [`invalid/schema-trait-missing-kind.yaml`](/examples/invalid/schema-trait-missing-kind.yaml)

## quickstart/

The Quick Start guide's own snippets, one per step, building up from a bare base document to a described, related entry.

- [`quickstart/01-base-document.yaml`](/examples/quickstart/01-base-document.yaml)
- [`quickstart/02-base-document-described.yaml`](/examples/quickstart/02-base-document-described.yaml)
- [`quickstart/03-base-document-entries.yaml`](/examples/quickstart/03-base-document-entries.yaml)
- [`quickstart/04-base-document-refs.yaml`](/examples/quickstart/04-base-document-refs.yaml)
- [`quickstart/05-button-entry.yaml`](/examples/quickstart/05-button-entry.yaml)
- [`quickstart/06-button-described.yaml`](/examples/quickstart/06-button-described.yaml)
- [`quickstart/07-button-custom.yaml`](/examples/quickstart/07-button-custom.yaml)
- [`quickstart/08-token-entry.yaml`](/examples/quickstart/08-token-entry.yaml)
- [`quickstart/09-token-described.yaml`](/examples/quickstart/09-token-described.yaml)
- [`quickstart/10-pattern-entry.yaml`](/examples/quickstart/10-pattern-entry.yaml)
- [`quickstart/11-custom-entry.yaml`](/examples/quickstart/11-custom-entry.yaml)
- [`quickstart/12-shared-sections.yaml`](/examples/quickstart/12-shared-sections.yaml)
- [`quickstart/components/button.dsds.yaml`](/examples/quickstart/components/button.dsds.yaml)
- [`quickstart/tokens.dtcg.json`](/examples/quickstart/tokens.dtcg.json)

*80 files across 6 categories, generated from the `examples/` directory by `scripts/generate-examples-index.mjs` — do not edit by hand.*

{/* /dsds:examples-index */}
