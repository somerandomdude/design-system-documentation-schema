---
name: dsds-web-components-authoring
description: Author, update, or review accessible standards-based Web Components for the DSDS Site Kit. Use for custom-element implementation, public API design, attributes and properties, events, slots, CSS parts and custom properties, tokenized styling, lifecycle cleanup, component registration, accessibility checks, tests, and mapping a component contract into a DSDS entity. Retrieve documented DSDS context through dsds-tools before changing a public component contract.
---

# DSDS Web Components Authoring

Build small, framework-neutral custom elements whose implementation and DSDS
documentation remain one reviewable contract.

## Establish the contract

1. Read repository instructions and the task before editing.
2. Retrieve grounded DSDS context before interpreting or changing a public
   contract:
   - In an MCP-capable agent, call `dsds_context_brief`, then
     `dsds_search_entities` and `dsds_get_agent_context` for the relevant
     component.
   - In a shell-only workflow, run `dsds search <task-or-component> --json`
     and `dsds context <component-id> --json`.
   - If `dsds-tools` is not configured, report that gap and inspect the checked-
     in corpus directly; do not invent a replacement retrieval system.
3. Inspect `site/components/_shared.js`, `site/components/index.js`,
   `site/tokens.css`, and the nearest comparable component.
4. Cross-check the component's DSDS entity in
   `spec/examples/site-kit.dsds.json`, if it exists.
5. Read [component-contract.md](references/component-contract.md).
6. Read [dsds-mapping.md](references/dsds-mapping.md) when creating or changing
   public API, documentation, or provenance.
7. State whether the work creates a component, changes an existing contract,
   or only changes internals. Treat any attribute, property, event, slot, CSS
   part, or CSS custom property change as a public contract change.

Do not infer undocumented behavior. Ask or stop when product intent, semantics,
or compatibility requirements materially affect the API.

## Design the public API first

- Prefer native HTML semantics and composition over a custom abstraction.
- Keep the API minimal. Add only capabilities required by a concrete use case.
- Choose one canonical name for each concept and use it consistently in source,
  examples, tests, and DSDS.
- Define attribute-to-property behavior explicitly. Reflect values only when
  consumers benefit from serialized state.
- Define custom event names, payloads, and `bubbles`, `composed`, and
  `cancelable` behavior before implementation.
- Use slots for consumer-owned content. Use attributes or properties for
  component state and configuration.
- Expose CSS parts or custom properties only as intentional styling contracts.

## Implement the component

- Use standards-based Custom Elements without adding a framework dependency.
- Reuse helpers from `site/components/_shared.js` and patterns from nearby
  components.
- Use design tokens from `site/tokens.css`. Do not introduce unexplained raw
  color, spacing, type, radius, or shadow values.
- Keep `observedAttributes`, properties, rendering, source comments, tests, and
  the DSDS API block synchronized.
- Escape consumer-controlled strings before inserting HTML. Prefer DOM APIs or
  `textContent` when markup is unnecessary.
- Pair every global listener, observer, timer, or subscription created during
  connection with cleanup during disconnection.
- Preserve light-DOM children unless the component contract intentionally
  consumes or relocates them.
- Register the tag once in `site/components/index.js`.

## Meet the accessibility baseline

- Start with native interactive elements and landmarks.
- Ensure keyboard behavior, focus visibility, accessible names, and state
  announcements match the chosen semantic pattern.
- Do not communicate meaning through color alone.
- Respect reduced-motion preferences when animation is present.
- For overlays, define initial focus, focus containment where appropriate,
  Escape behavior, and focus restoration.
- Test the rendered component, not only its shadow-root markup.
- Record only accessibility behavior supported by source or observed output.
  Record gaps honestly instead of inventing assurances.

## Keep DSDS synchronized

Update `spec/examples/site-kit.dsds.json` in the same change when a public
contract changes:

- identify the custom element and source module;
- provide a plain-HTML usage example;
- document evidenced attributes, properties, events, slots, CSS parts, and CSS
  custom properties;
- describe recommended use cases and guidance with rationale;
- include accessibility guidance supported by the implementation;
- preserve the Site Kit extension containing `tagName`, `entrypoint`, and
  `module`.

DSDS owns intent, guidance, and provenance. `dsds-tools` is the project's
grounded discovery and verification surface; this skill owns only the
project-specific authoring workflow. A future Custom Elements Manifest may own
generated API facts, but do not add or assume that automation unless the task
explicitly includes it.

## Verify the change

Run the narrowest relevant checks first, then the repository gates:

```sh
dsds validate spec/examples/site-kit.dsds.json --json
dsds doctor --json
node --test test/site-kit-contract.test.js
node scripts/lint-docs.js spec/examples/site-kit.dsds.json
npm run lint:css
npm run build
npm run test:a11y
```

Treat editorial warnings about the changed entity as failures even when a
command exits successfully. If `dsds` is unavailable, report the configuration
gap, run the remaining project checks, and do not add a competing CLI command.

## Guardrails

- Do not change the DSDS schema merely to make one component easier to express.
- Do not invent public API to make documentation appear complete.
- Do not add framework wrappers, build tooling, or runtime dependencies without
  explicit scope.
- Do not silently break a documented tag, attribute, event, slot, part, custom
  property, or example.
- Stop if correct behavior depends on an unresolved product or accessibility
  decision.
