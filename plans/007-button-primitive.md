# Plan 007: Add the `ds-button` primitive

> **Exploratory scope**: This is a small Web Component experiment using the
> project-owned authoring skill. It is intentionally independent of the
> unapproved local-context CLI PRD. Do not expand it into a component library
> or infer requirements for other primitives.

## Status

- **Priority**: exploratory
- **Effort**: S
- **Risk**: LOW — one component, one registry entry, and one DSDS entity
- **Depends on**: Plan 002 authoring skill
- **Executor**: Davy + Codex

## Contract

Create a framework-neutral `<ds-button>` with:

- `variant="primary|secondary"`, defaulting to `primary`;
- an orange primary treatment using `--ds-color-bg-accent`;
- a black secondary treatment using `--ds-color-text` with inverse text;
- `type="button|submit|reset"`, defaulting to `button`;
- a reflected `disabled` state;
- a default slot for a visible text label and optional small inline icon;
- native button keyboard and click behavior;
- a visible focus indicator and a disabled state;
- no custom event and no navigation behavior.

The component must not be used for navigation, and it must not add loading,
size, icon-position, or form-association APIs until a concrete use case exists.

## Steps

1. Implement `site/components/button.js` using the authoring skill and existing
   tokens.
2. Register `ds-button` in `site/components/index.js`.
3. Add the component entity and plain-HTML example to
   `spec/examples/site-kit.dsds.json`.
4. Extend the Site Kit contract test to include the new tag and module.
5. Run the focused contract test, DSDS validation, documentation lint, and CSS
   lint. Review the rendered control manually before considering it stable.

## Done criteria

- [ ] The button uses only existing Site Kit tokens.
- [ ] Primary and secondary treatments are distinguishable from headings and
  labels through control geometry, spacing, and interaction states.
- [ ] Native keyboard behavior and focus visibility are preserved.
- [ ] The DSDS entity documents the API, usage, accessibility, and limitation
  to in-page actions.
- [ ] All focused validation checks pass.
- [ ] Davy and PJ agree whether this exploratory component belongs in the
  product direction after the PRD review.

## Stop conditions

- The visual direction requires new tokens or a broader color-system decision.
- Form-associated custom-element behavior becomes a requirement.
- The component needs loading, icon-only, or navigation semantics.
- PJ's PRD review changes the project's component scope.
