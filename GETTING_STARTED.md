# Getting Started with DSDS

This guide walks you through creating your first DSDS documents. Each example starts with the minimum required fields, then shows how to add more detail.

---

## Document structure

Every DSDS document is a JSON file with three required top-level fields:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "component"
}
```

- **`dsdsVersion`** — The version of the DSDS spec this document conforms to.
- **`documentType`** — The type of artifact: `"component"`, `"token"`, `"tokenGroup"`, `"style"`, `"pattern"`, or `"collection"`.

The `documentType` determines which top-level property holds the artifact data (e.g., `"component"` requires a `component` property).

You can optionally include `metadata` to identify the design system:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "component",
  "metadata": {
    "systemName": "My Design System",
    "systemVersion": "1.0.0",
    "organization": "Acme Corp"
  }
}
```

---

## 1. Component

### Minimal

A component document requires `name`, `displayName`, `description`, and `status`:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "component",
  "component": {
    "name": "button",
    "displayName": "Button",
    "description": "An interactive element that triggers an action when activated.",
    "status": "stable"
  }
}
```

Save this as `button.dsds.json` — you now have a valid DSDS document.

### Adding detail

Add use cases, guidelines, and variants to make the document more useful:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "component",
  "component": {
    "name": "button",
    "displayName": "Button",
    "description": "An interactive element that triggers an action when activated.",
    "status": "stable",
    "since": "1.0.0",
    "category": "action",
    "useCases": {
      "whenToUse": [
        {
          "description": "When the user needs to trigger an action such as submitting a form or opening a dialog."
        }
      ],
      "whenNotToUse": [
        {
          "description": "When the action navigates to a different page.",
          "alternative": {
            "name": "link",
            "rationale": "Links carry native navigation semantics."
          }
        }
      ]
    },
    "guidelines": [
      {
        "guidance": "Limit each surface to one primary button.",
        "rationale": "Multiple primary buttons dilute visual hierarchy.",
        "type": "required",
        "category": "visual-design"
      }
    ],
    "variants": [
      {
        "name": "emphasis",
        "displayName": "Emphasis",
        "description": "Controls the visual weight of the button.",
        "values": [
          {
            "name": "primary",
            "description": "High-emphasis — the main action on the surface."
          },
          {
            "name": "secondary",
            "description": "Medium-emphasis — important but not primary."
          }
        ]
      }
    ],
    "links": [
      {
        "type": "documentation",
        "url": "https://design.example.com/components/button",
        "label": "Documentation site"
      }
    ]
  }
}
```

---

## 2. Token

### Minimal

A token requires `name`, `displayName`, `description`, `status`, and `tokenType`:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "token",
  "token": {
    "name": "color-text-primary",
    "displayName": "Text Primary",
    "description": "The default color for body text and headings.",
    "status": "stable",
    "tokenType": "color"
  }
}
```

### Adding detail

Add a value, platform API mappings, and guidelines:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "token",
  "token": {
    "name": "color-text-primary",
    "displayName": "Text Primary",
    "description": "The default color for body text and headings.",
    "status": "stable",
    "tokenType": "color",
    "category": "semantic",
    "value": {
      "resolved": "#1a1a1a",
      "reference": "color.neutral.900"
    },
    "api": {
      "cssCustomProperty": "--color-text-primary",
      "scssVariable": "$color-text-primary",
      "jsConstant": "colorTextPrimary"
    },
    "guidelines": [
      {
        "guidance": "Use for all body text on default background surfaces.",
        "rationale": "Ensures visual consistency and meets WCAG AA contrast requirements.",
        "type": "encouraged",
        "category": "visual-design"
      }
    ]
  }
}
```

---

## 3. Token Group

### Minimal

A token group collects related tokens:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "tokenGroup",
  "tokenGroup": {
    "name": "color-text",
    "displayName": "Text Colors",
    "description": "Semantic color tokens for text content.",
    "status": "stable",
    "tokens": [
      {
        "name": "color-text-primary",
        "displayName": "Text Primary",
        "description": "The default color for body text.",
        "status": "stable",
        "tokenType": "color"
      },
      {
        "name": "color-text-secondary",
        "displayName": "Text Secondary",
        "description": "A reduced-emphasis color for supporting text.",
        "status": "stable",
        "tokenType": "color"
      }
    ]
  }
}
```

---

## 4. Style

### Minimal

A style documents macro-level visual guidelines. It requires `name`, `displayName`, `description`, `status`, and `category`:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "style",
  "style": {
    "name": "spacing",
    "displayName": "Spacing",
    "description": "A spatial system built on a 4px base unit.",
    "status": "stable",
    "category": "spacing"
  }
}
```

### Adding detail

Add principles, token group references, and a scale:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "style",
  "style": {
    "name": "spacing",
    "displayName": "Spacing",
    "description": "A spatial system built on a 4px base unit.",
    "status": "stable",
    "category": "spacing",
    "principles": [
      {
        "title": "Use the scale",
        "description": "Every spacing value must reference a token from the spacing scale."
      }
    ],
    "tokenGroups": [
      {
        "name": "spacing",
        "role": "Provides all spatial tokens from space-0 through space-12."
      }
    ],
    "scales": [
      {
        "name": "spacing-scale",
        "displayName": "Spacing Scale",
        "description": "A geometric scale based on a 4px unit.",
        "steps": [
          { "token": "space-0", "label": "0", "value": "0px" },
          { "token": "space-1", "label": "4xs", "value": "2px" },
          { "token": "space-2", "label": "3xs", "value": "4px" },
          { "token": "space-3", "label": "2xs", "value": "8px" },
          { "token": "space-4", "label": "xs", "value": "12px" },
          { "token": "space-5", "label": "sm", "value": "16px" },
          { "token": "space-6", "label": "md", "value": "24px" },
          { "token": "space-7", "label": "lg", "value": "32px" },
          { "token": "space-8", "label": "xl", "value": "48px" }
        ]
      }
    ]
  }
}
```

---

## 5. Pattern

### Minimal

A pattern documents how components work together to solve a UX problem. It requires `name`, `displayName`, `description`, `status`, and `category`:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "pattern",
  "pattern": {
    "name": "error-messaging",
    "displayName": "Error Messaging",
    "description": "How errors are surfaced through inline validation, summary banners, and toast notifications.",
    "status": "stable",
    "category": "feedback"
  }
}
```

### Adding detail

Add component references and interaction flow:

```json
{
  "$schema": "https://designsystemdocspec.org/v0.1/dsds.schema.json",
  "dsdsVersion": "0.1",
  "documentType": "pattern",
  "pattern": {
    "name": "error-messaging",
    "displayName": "Error Messaging",
    "description": "How errors are surfaced through inline validation, summary banners, and toast notifications.",
    "status": "stable",
    "category": "feedback",
    "components": [
      {
        "name": "form-field",
        "role": "Displays inline validation messages below the input.",
        "required": true
      },
      {
        "name": "alert",
        "role": "Page-level error summary with anchor links to invalid fields.",
        "required": true
      },
      {
        "name": "toast",
        "role": "Transient notification for server-side errors.",
        "required": false
      }
    ],
    "interactions": [
      {
        "trigger": "User submits the form.",
        "description": "Client-side validation runs. If fields are invalid, submission is prevented and the error state is activated."
      },
      {
        "trigger": "Validation detects invalid fields.",
        "description": "Each invalid field displays an inline error message. An error summary appears at the top of the form."
      },
      {
        "trigger": "User corrects an invalid field.",
        "description": "The inline error is removed. When all errors are resolved, the summary disappears."
      }
    ]
  }
}
```

---

## Validating your documents

Use the bundled schema to validate your documents with any JSON Schema tool:

```bash
# Install the validator
npm install ajv ajv-formats

# Validate a document (using the project's built-in script)
npm run validate

# Or validate a single file with ajv-cli
npx ajv validate -s spec/schema/dsds.bundled.schema.json -d my-button.dsds.json
```

---

## Key concepts

### Guidelines

Every guideline requires `guidance` (what to do) and `rationale` (why). Optional properties:

- **`type`** — Enforcement level: `required`, `encouraged`, `informational`, `discouraged`, `prohibited`
- **`category`** — The discipline: `visual-design`, `interaction`, `accessibility`, `content`, `motion`, `development`
- **`target`** — The anatomy part this applies to (e.g., `"label"`)
- **`criteria`** — URLs to external standards (e.g., WCAG success criteria)
- **`tags`** — Cross-cutting keywords (e.g., `"rtl"`, `"localization"`)

```json
{
  "guidance": "Button label text must meet a minimum 4.5:1 contrast ratio.",
  "rationale": "Ensures readability for users with low vision.",
  "type": "required",
  "category": "accessibility",
  "criteria": ["https://www.w3.org/TR/WCAG22/#contrast-minimum"]
}
```

### Use cases vs. guidelines

- **Use cases** answer: _"When should I use this?"_ — they help you choose the right artifact.
- **Guidelines** answer: _"How should I use this?"_ — they help you implement it correctly.

### Examples

Every example requires a `presentation` — a visual or interactive demonstration:

```json
{
  "title": "Primary button",
  "description": "The default high-emphasis button style.",
  "presentation": {
    "type": "image",
    "url": "https://design.example.com/assets/button-primary.png",
    "alt": "A primary button with blue background and white text reading Save."
  }
}
```

Four presentation types: `image`, `video`, `code`, `url`.

### Links

Links handle both external resources and artifact relationships:

```json
{
  "links": [
    { "type": "source", "url": "https://code.example.com/button.tsx", "label": "Source code" },
    { "type": "design", "url": "https://design-tool.example.com/button", "label": "Design file" },
    { "type": "alternative", "url": "https://design.example.com/components/link", "label": "Link component" }
  ]
}
```

---

## Next steps

- Browse the [full examples](spec/examples/) for complete, realistic documents
- Read the [schema reference](site/dist/index.html) for all available properties
- Run `npm run validate` to check your documents against the schema