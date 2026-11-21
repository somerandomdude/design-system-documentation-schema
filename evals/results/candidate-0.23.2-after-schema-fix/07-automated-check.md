```yaml
kind: component
id: card
name: Card
description: A container that groups related content and actions around a single subject.
sections:
  - kind: guidelines
    for: all
    title: Accessibility
    tags: [accessibility]
    items:
      - level: must
        statement: A card that receives keyboard focus shows a visible focus indicator.
        checkedBy: automated
        checks:
          - href: ./tests/card.a11y.test.ts
            role: test
        evidence:
          - href: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
```
