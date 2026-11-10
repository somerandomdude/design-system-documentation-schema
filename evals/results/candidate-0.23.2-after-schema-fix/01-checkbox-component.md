```yaml
kind: component
id: checkbox
name: Checkbox
description: A control that lets a person select or deselect an option, independently of other options.
sections:
  - kind: guidelines
    for: all
    items:
      - level: must
        statement: Give every checkbox a visible label, or an accessible name when no visible label fits the layout.
      - level: should
        statement: Use checkboxes for independent choices and radio buttons for choices where only one option can be selected.
traits:
  - traitType: variant
    kind: enum
    id: size
    description: The physical size of the checkbox control.
    values:
      - id: small
        description: Compact checkbox for dense layouts such as tables and filter panels.
      - id: medium
        description: Default size for most forms and settings.
      - id: large
        description: Larger target for touch-first interfaces and emphasis.
```