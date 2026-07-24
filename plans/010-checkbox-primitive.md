# Plan 010: Add the `ds-checkbox` primitive

> **Exploratory scope**: This is a small Web Component experiment using the
> project-owned authoring skill. It extends the form-control set without
> changing the local-context CLI product scope.

## Status

- **Priority**: exploratory
- **Effort**: S
- **Risk**: MED — introduces checked, indeterminate, and native validation states
- **Depends on**: Plan 002 authoring skill and Plan 009 text-input conventions
- **Executor**: Davy + Codex

## Contract

Create a framework-neutral `<ds-checkbox>` with:

- a native `<input type="checkbox">`;
- named `label`, `description`, and `error` slots;
- `name` and `value` form attributes;
- boolean `checked`, `indeterminate`, `required`, `disabled`, and `error`
  attributes;
- native `input`, `change`, focus, keyboard, and form behavior;
- `aria-invalid="true"` when the error state is present.

Do not invent a custom change event or replace the native checkbox semantics
with a clickable non-form element.

## Done criteria

- [ ] Space-key activation and focus remain native and inspectable.
- [ ] Checked, indeterminate, required, disabled, and error states are shown
  in the Workbench.
- [ ] The DSDS entity, Workbench demos, and contract tests are synchronized.
- [ ] Davy reviews the form behavior before the component is considered stable.
