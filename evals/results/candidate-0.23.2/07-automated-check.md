```yaml
$schema: https://designsystemdocspec.org/v0.23.2/dsds.bundled.yaml
kind: component
id: card
name: Card
description: A container that groups related content and actions about a single subject.
sections:
  - kind: guidelines
    for: all
    title: Accessibility
    tags: [accessibility]
    items:
      - level: must
        statement: Show a visible focus indicator on the card when it receives keyboard focus.
        checkedBy: automated
        checks:
          - href: ./tests/card.a11y.test.ts
            role: test
        evidence:
          - href: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
```