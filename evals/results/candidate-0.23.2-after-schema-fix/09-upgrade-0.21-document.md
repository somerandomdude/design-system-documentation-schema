```yaml
kind: component
id: tooltip
name: Tooltip
description: Shows extra info on hover. Gives context for an icon without a label.
metadata:
  status: {status: stable}
sections:
  - kind: guidelines
    for: all
    items:
      - level: should
        statement: Show on hover and focus.
  - kind: section
    for: all
    freeform:
      - title: Context
        body: Used in toolbars.
alternatives:
  - to: popover
```
