```yaml
$schema: https://designsystemdocspec.org/v0.23.2/dsds.bundled.yaml
kind: component
id: tooltip
name: Tooltip
description: Shows extra info on hover.
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
      - title: Purpose
        body: Gives context for an icon without a label.
      - title: Context
        body: Used in toolbars.
refs:
  - to: popover
    rel: relates-to
```