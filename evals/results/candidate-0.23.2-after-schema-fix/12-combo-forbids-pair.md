```yaml
kind: component
id: button
name: Button
description: A control that triggers an action when the user activates it.
traits:
  - traitType: variant
    kind: enum
    id: size
    name: Size
    description: The size of the button.
    values:
      - id: small
        description: A compact button for dense layouts.
      - id: large
        description: A larger button for prominent actions.
  - traitType: state
    kind: boolean
    id: loading
    name: Loading
    description: An async operation triggered by the button is in progress.
combos:
  - subject: size.small
    level: must-not
    items: [loading]
```