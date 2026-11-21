```yaml
kind: component
id: button
name: Button
description: A control that triggers an action when the person activates it.
traits:
  - traitType: variant
    kind: enum
    id: variant
    description: The visual emphasis of the button.
    values:
      - id: primary
        description: The main action on a surface. Use for the one action the person is most likely to take.
      - id: secondary
        description: A lower-emphasis action that supports the primary action.
      - id: primary-blue
        description: The earlier name of the primary variant.
        status:
          status: deprecated
          deprecationNotice: Renamed to primary. Use variant primary instead.
          replacedBy:
            - to: button#variant.primary
```