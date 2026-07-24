# Plan 011 — Exploratory `ds-select` primitive

Status: IN PROGRESS
Scope: A native `<select>` wrapper for the Site Kit workbench.

## Contract

- Preserve native option and optgroup children, selection, keyboard behavior, and events.
- Support `name`, `value`, `required`, `disabled`, `multiple`, and `size` attributes.
- Provide `label`, `description`, and `error` slots with `aria-invalid` state.
- Keep the first implementation experimental and tokenized, not production-stable.

## Done criteria

- Source is registered and documented in the focused Site Kit corpus.
- Workbench includes default, grouped, and validation examples.
- Contract tests and DSDS validation pass.
