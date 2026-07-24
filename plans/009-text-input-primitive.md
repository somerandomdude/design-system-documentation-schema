# Plan 009: Add the `ds-text-input` primitive

> **Exploratory scope**: This is a small Web Component experiment using the
> project-owned authoring skill. It complements `ds-button` and `ds-link` but
> remains independent of the unapproved local-context CLI PRD.

## Status

- **Priority**: exploratory
- **Effort**: S
- **Risk**: MED — introduces form labels, validation state, and native input behavior
- **Depends on**: Plan 002 authoring skill and Plans 007–008 conventions
- **Executor**: Davy + Codex

## Contract

Create a framework-neutral `<ds-text-input>` with:

- a native single-line `<input>`;
- named `label`, `description`, and `error` slots;
- `type`, `name`, `value`, and `placeholder` attributes;
- boolean `required`, `disabled`, `readonly`, and `error` attributes;
- native `input`, `change`, focus, keyboard, and form behavior;
- `aria-describedby` for supporting and error content;
- `aria-invalid="true"` when the error state is present.

Do not invent a custom value-change event or form-associated custom-element
API in this first pass.

## Done criteria

- [ ] The field has an accessible visible label in every recommended example.
- [ ] Required, disabled, read-only, and error states remain native and
  inspectable.
- [ ] The DSDS entity, Workbench demos, and contract tests are synchronized.
- [ ] Focus, invalid, and disabled states use existing Site Kit tokens.
- [ ] Davy reviews the form behavior before the component is considered stable.
