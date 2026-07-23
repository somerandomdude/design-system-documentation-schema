# Plan 008: Add the `ds-link` primitive

> **Exploratory scope**: This is a small Web Component experiment using the
> project-owned authoring skill. It complements `ds-button` but remains
> independent of the unapproved local-context CLI PRD.

## Status

- **Priority**: exploratory
- **Effort**: S
- **Risk**: LOW — one native anchor wrapper and documented examples
- **Depends on**: Plan 002 authoring skill and Plan 007 button conventions
- **Executor**: Davy + Codex

## Contract

Create a framework-neutral `<ds-link>` with:

- required `href` for native link semantics;
- an optional boolean `external` attribute that opens a new tab and adds
  `rel="noopener noreferrer"`;
- a default slot for a visible sentence-case link label;
- a named `icon` slot for a trailing decorative arrow or inline icon;
- tokenized accent color, underline, hover, and focus styles;
- no uppercase transformation and no custom event.

Use `ds-link` for navigation and `ds-button` for in-page actions.

## Done criteria

- [ ] The component preserves native anchor behavior.
- [ ] External links use safe `target` and `rel` attributes.
- [ ] Link labels remain visually distinct from uppercase buttons.
- [ ] The DSDS entity, Workbench demos, and contract tests are synchronized.
- [ ] Focus and hover states use existing Site Kit tokens.
- [ ] Davy reviews the visual direction before the component is considered
  stable.
