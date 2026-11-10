```yaml
kind: component
id: toast
name: Toast
description: A brief, temporary message that reports the result of an action without interrupting the task.
sections:
  - kind: guidelines
    for: all
    items:
      - level: must
        statement: A toast must stay on screen long enough for people to read its message.
        checkedBy: manual
        checks:
          - to: toast#set-duration
  - kind: steps
    for: agent
    ordered: false
    items:
      - id: set-duration
        title: Set the duration
      - id: check-contrast
        title: Check the contrast
      - id: test-screen-reader
        title: Test with a screen reader
```