# DSDS Site Kit component contract

Use this checklist when creating, updating, or reviewing a component.

## Repository anchors

- `site/components/_shared.js`: shared shadow-root, reset, font, escaping, and
  icon helpers.
- `site/components/index.js`: canonical custom-element registry and entrypoint.
- `site/tokens.css`: design-token source.
- `site/components/callout.js`: slotted content, variants, and CSS parts.
- `site/components/code.js`: interactive behavior and accessible overflow.
- `site/components/json-view.js`: dialog behavior and lifecycle cleanup.
- `spec/examples/site-kit.dsds.json`: DSDS reference corpus.

## Required source contract

At the top of the module, document:

- tag name and one-sentence purpose;
- public attributes and properties;
- emitted events, including detail shape and propagation behavior;
- named and default slots;
- CSS parts and supported CSS custom properties;
- a minimal plain-HTML example.

Keep the comment factual and verify it against the implementation.

## Implementation checklist

- The tag is lowercase, contains a hyphen, and is registered once.
- `observedAttributes` contains only supported attributes.
- Boolean attributes use presence semantics.
- Property defaults and attribute-removal behavior are deliberate.
- Rendering is idempotent and preserves intended consumer content.
- Consumer-controlled text is escaped or assigned with `textContent`.
- Internal controls use native elements where possible.
- Event options are explicit and covered by tests.
- Global listeners, observers, and timers are cleaned up.
- Visual values use existing tokens.
- Public styling hooks are stable, named, and documented.

## Review checklist

Compare source, registration, tests, usage example, and the DSDS entity side by
side. A public fact appearing in only one of those places is drift, not a
complete change.

Do not treat visual snapshots as the only accessibility evidence. Exercise
keyboard interaction, focus behavior, names, roles, states, and cleanup.
