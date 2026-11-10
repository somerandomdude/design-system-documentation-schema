```yaml
kind: component
id: avatar
name: Avatar
description: A visual stand-in for a person or account, shown as a photo, initials, or placeholder so they can be recognized at a glance.
sections:
  - kind: guidelines
    for: all
    title: Accessibility
    tags: [accessibility]
    items:
      - level: must
        statement: Give an avatar that stands alone an accessible name; when a visible name sits beside it, hide the avatar from assistive technology.
sourceFiles:
  - platform: react
    file: ./src/Avatar.tsx
  - platform: ios
    file: ./ios/Avatar.swift
# imports omitted: no package names were provided for either platform.
specs:
  - href: ./dist/custom-elements.json
    role: Custom Elements Manifest with the component's generated API
```
