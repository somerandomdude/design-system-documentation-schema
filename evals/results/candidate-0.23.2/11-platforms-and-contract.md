```yaml
$schema: https://designsystemdocspec.org/v0.23.2/dsds.bundled.yaml
kind: component
id: avatar
name: Avatar
description: A small visual representation of a person or account, used to show who a piece of content or an action belongs to.
sections:
  - kind: guidelines
    for: all
    items:
      - level: should
        statement: Use an avatar only to represent a person or account, not as decorative imagery.
sourceFiles:
  - platform: react
    file: ./src/Avatar.tsx
  - platform: ios
    file: ./ios/Avatar.swift
specs:
  - href: ./dist/custom-elements.json
    role: Custom Elements Manifest API contract
```