```yaml
kind: component
id: dialog
name: Dialog
description: A window that asks for a decision before the person goes on. It is built from <dsds:button> for its confirm and dismiss actions.
sections:
  - kind: guidelines
    for: all
    title: Accessibility
    tags: [accessibility]
    items:
      - level: must
        statement: Keep the [focus ring visible](dsds:shared-a11y#focus-visible) on every control in the dialog.
uses:
  - to: button
```