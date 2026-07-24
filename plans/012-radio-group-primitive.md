# Plan 012 — Exploratory `ds-radio-group` primitive

Status: IN PROGRESS
Scope: A fieldset wrapper for native radio inputs in the Site Kit workbench.

## Contract

- Preserve native radio inputs, selection, keyboard behavior, form submission, and events.
- Use a slotted visible label as the fieldset legend and slotted labels containing native radio inputs as options.
- Apply shared `name`, `required`, and `disabled` attributes to slotted radios.
- Provide `description` and `error` slots with grouped validation presentation.

## Done criteria

- Source is registered and documented in the focused Site Kit corpus.
- Workbench includes default, required/error, and disabled examples.
- Contract tests and DSDS validation pass.
