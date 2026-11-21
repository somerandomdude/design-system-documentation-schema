```yaml
schemaVersion: "0.23.2"

name: Acme Design System

entries:
  - kind: component
    id: button
    name: Button
    description: Triggers an action.
    sections:
      - kind: guidelines
        for: all
        items:
          - refs:
              - to: shared-a11y#focus-visible
                rel: same-as

shared:
  - id: shared-a11y
    name: Shared Accessibility Rules
    description: Cross-cutting accessibility rules, stated once and referenced from every entry they apply to.
    sections:
      - kind: guidelines
        for: all
        items:
          - id: focus-visible
            level: must
            statement: Keep the focus ring visible.
```