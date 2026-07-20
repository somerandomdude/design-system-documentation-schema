# Content document block

Two kinds of content reference data: a dictionary of standard labels ('Add', 'Cancel', 'Delete') with definitions and usage notes, and localization notes (RTL, text expansion, pluralization, and other i18n concerns). At least one of `labels` or `localization` is required. For voice, tone, or capitalization rules, use a `guidelines` block (category 'content') instead.

Source: `document-blocks/content.schema.json`

**3 definitions** in this file: `content`, `contentLabelEntry`, `localizationEntry`

## content {#content}

A label dictionary and localization notes for an artifact or the whole system. Each entry is a fact, not a rule — general content guidance belongs in `guidelines` (category 'content') instead. A guideline says 'Use sentence case' (a rule); a content entry says 'Add: takes an existing object and uses it in a new context' (a definition).

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"content"` | ✓ | Identifies this block as a content spec. |
| `labels` | [contentLabelEntry](document-blocks-content.md#contentlabelentry)[] | at least 1 | The label dictionary. Order matters for display, so tools SHOULD keep it; authors MAY sort alphabetically or by frequency. (Min items: 1) |
| `localization` | [localizationEntry](document-blocks-content.md#localizationentry)[] | at least 1 | The localization notes. Order matters for display, so tools SHOULD keep it; authors SHOULD lead with the highest-impact concerns. (Min items: 1) |
| `description` | [richText](common-rich-text.md#richtext) |  | A short overview of what this block covers. Voice-and-tone philosophy belongs in a `guidelines` block (category 'content'), not here. |
| `$extensions` | [extensions](common-extensions.md#extensions) |  |  |

**Constraint:** At least one of `labels`, `localization` must be present.

**References:** [richText](common-rich-text.md#richtext), [contentLabelEntry](document-blocks-content.md#contentlabelentry), [localizationEntry](document-blocks-content.md#localizationentry), [extensions](common-extensions.md#extensions)

**Example:**

```json
{
  "kind": "content",
  "description": "Standard action labels and localization guidelines for the Acme Design System. All UI labels should use sentence case. Prefer the {verb} + {noun} content formula on buttons except for common actions like Done, Close, Cancel.",
  "labels": [
    {
      "term": "Add",
      "definition": "Takes an existing object and uses it in a new context.",
      "usage": "Combine Add with the object (ex: Add user, Add role).",
      "alternatives": [
        "Create",
        "Insert",
        "New",
        "Upload"
      ],
      "context": "Buttons, menu items"
    },
    {
      "term": "Cancel",
      "definition": "Stops the current action and closes the dialog.",
      "usage": "Warn the user of any possible negative consequences. Compare Reset.",
      "alternatives": [
        "Reset",
        "Close"
      ],
      "context": "Dialog buttons"
    },
    {
      "term": "Create",
      "definition": "Makes a new object from scratch.",
      "usage": "Use New to initiate the action and Create to apply user-supplied settings.",
      "alternatives": [
        "Add",
        "Copy",
        "New"
      ],
      "context": "Primary actions, page-level buttons"
    },
    {
      "term": "Delete",
      "definition": "Destroys an existing object so that it no longer exists.",
      "usage": "Combine Delete with the object (ex: Delete column). Use Move to trash if recoverable.",
      "alternatives": [
        "Clear",
        "Remove"
      ],
      "context": "Destructive actions, danger buttons"
    },
    {
      "term": "Save",
      "definition": "Saves pending modifications. Does not close the window or panel.",
      "usage": "Compare Apply and Save as.",
      "alternatives": [
        "Apply",
        "Save as"
      ],
      "context": "Form actions, editing flows"
    }
  ],
  "localization": [
    {
      "concern": "rtl",
      "description": "For RTL languages, the entire component layout is mirrored horizontally. Directional icons (arrows, chevrons) must be flipped. Non-directional icons (close, checkmark) must not be flipped."
    },
    {
      "concern": "text-expansion",
      "description": "Localization can lengthen text by 20-30%. Avoid truncating labels. Stack buttons vertically when they cannot be displayed side by side."
    },
    {
      "concern": "concatenation",
      "description": "Never construct labels by concatenating strings. Use complete, translatable strings with placeholder tokens for dynamic content."
    }
  ]
}
```

## contentLabelEntry {#contentlabelentry}

One standard label in the dictionary: the label text, what it means, when to use it, and related terms.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `term` | string | ✓ | The label text as it should appear in the UI (ex: 'Add', 'Cancel', 'Delete'). |
| `definition` | [richText](common-rich-text.md#richtext) | ✓ | What the label means — the action it represents. Be concrete (ex: for Delete: 'Destroys an existing object so it no longer exists'). |
| `usage` | [richText](common-rich-text.md#richtext) |  | When and how to use it, with any formatting rules or caveats (ex: 'Combine with the object: Add user, Add role'). |
| `alternatives` | string[] |  | Related terms that are often confused with this one, listed to help authors pick the right label. These SHOULD match other `term` values in this block's `labels` array, so tools can cross-reference them. (Min items: 1) |
| `context` | string |  | Where this label normally appears (ex: 'Buttons in dialogs', 'Toolbar actions'). |
| `examples` | [example](common-example.md#example)[] |  | Examples of the label in context — do/don't pairs, screenshots, or code. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [example](common-example.md#example)

**Example:**

```json
[
  {
    "term": "Add",
    "definition": "Takes an existing object and uses it in a new context (ex: adds an item to the cart, adds a user to a group, or adds a document to a folder).",
    "usage": "Where appropriate, combine Add with the object (ex: Add user, Add role). Compare Create, Insert, New, and Upload.",
    "alternatives": [
      "Create",
      "Insert",
      "New",
      "Upload"
    ],
    "context": "Buttons, menu items, toolbar actions"
  },
  {
    "term": "Cancel",
    "definition": "Stops the current action and closes the dialog.",
    "usage": "Warn the user of any possible negative consequences of stopping an action from progressing, such as data corruption. Compare Reset.",
    "alternatives": [
      "Reset",
      "Close",
      "Done"
    ],
    "context": "Dialog buttons, form actions"
  },
  {
    "term": "Create",
    "definition": "Makes a new object from scratch (ex: creates a calendar event or creates a new document).",
    "usage": "In scenarios where the user needs to supply some details or settings as part of the create process, use New to initiate the action and Create to apply the user-supplied details or settings to the new object.",
    "alternatives": [
      "Add",
      "Copy",
      "Insert",
      "New"
    ],
    "context": "Primary actions, page-level buttons"
  },
  {
    "term": "Delete",
    "definition": "Destroys an existing object so that it no longer exists (ex: deletes a file from a directory or deletes a value from a table cell).",
    "usage": "Where appropriate, combine Delete with the object (ex: Delete column, Delete row). Use Move to trash if the user can recover the object later.",
    "alternatives": [
      "Clear",
      "Remove",
      "Move to trash"
    ],
    "context": "Destructive actions, danger buttons, confirmation dialogs"
  },
  {
    "term": "Edit",
    "definition": "Allows data or values to be changed.",
    "usage": "Use Edit to enter an editing mode. Use Update or Save for the action that applies the changes.",
    "alternatives": [
      "Update"
    ],
    "context": "Inline actions, page headers, card actions"
  },
  {
    "term": "Remove",
    "definition": "Removes an object from the current context but the object is not destroyed as a result of the action (ex: removes a user from a group or removes an item from the cart).",
    "usage": "Where appropriate, combine Remove with the object that will be removed (ex: Remove user, Remove role). Compare Delete which destroys the object entirely.",
    "alternatives": [
      "Clear",
      "Delete"
    ],
    "context": "List items, tags, selection management"
  },
  {
    "term": "Save",
    "definition": "Saves pending modifications made to a file or document. Does not close the window or panel.",
    "usage": "Compare Apply (saves changes without closing) and Save as (creates a new object based on the current state).",
    "alternatives": [
      "Apply",
      "Save as",
      "Update"
    ],
    "context": "Form actions, editing flows, document editing"
  },
  {
    "term": "Close",
    "definition": "Closes the current page or window (ex: closing a secondary window containing online help).",
    "usage": "Do not use Close alongside OK or Cancel actions. Compare Cancel and Done.",
    "alternatives": [
      "Cancel",
      "Done"
    ],
    "context": "Dialogs, panels, modals, secondary windows"
  }
]
```

## localizationEntry {#localizationentry}

One localization concern — something that affects how content is written, translated, or displayed across languages.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `concern` | string | ✓ | Which concern this is: 'rtl' (right-to-left layout), 'text-expansion' (text growing in translation), 'pluralization' (plural forms), 'date-format', 'number-format', 'currency', 'text-direction' (mixed-direction text), 'icon-direction' (icons that imply direction), 'truncation', 'sorting' (locale-specific order), or 'concatenation' (don't build sentences by joining strings). Custom values allowed, in lowercase kebab-case. |
| `description` | [richText](common-rich-text.md#richtext) | ✓ | What to do about this concern — what changes across locales, and what to avoid. |
| `examples` | [example](common-example.md#example)[] |  | Examples showing the concern — before/after screenshots for RTL, or code for pluralization. (Min items: 1) |

**References:** [richText](common-rich-text.md#richtext), [example](common-example.md#example)

**Example:**

```json
[
  {
    "concern": "rtl",
    "description": "For right-to-left (RTL) languages, the entire component is mirrored horizontally. Labels are right-aligned and icons that were on the left move to the right. Icons that indicate directionality (arrows, progress indicators) must also be mirrored. Icons that are not directional (checkmarks, close icons) should NOT be mirrored."
  },
  {
    "concern": "text-expansion",
    "description": "Localization can lengthen text by 20 to 30 percent for Western European languages, and more for languages like German or Finnish. CJK languages may be shorter. Avoid truncating labels whenever possible — stack buttons vertically when they cannot be displayed side by side. Test all layouts at maximum expected expansion."
  },
  {
    "concern": "concatenation",
    "description": "Never construct labels by concatenating strings (ex: `action + ' ' + object`). Sentence structure, word order, and grammatical agreement differ across languages. Use complete, translatable strings with placeholder tokens for dynamic content."
  },
  {
    "concern": "pluralization",
    "description": "Do not assume two plural forms (singular and plural). Some languages have up to six plural forms (ex: Arabic). Use ICU MessageFormat or equivalent pluralization libraries that support CLDR plural rules. Never use conditional logic like `count === 1 ? 'item' : 'items'`."
  }
]
```

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/document-blocks/content.schema.json",
  "title": "Content document block",
  "description": "Two kinds of content reference data: a dictionary of standard labels ('Add', 'Cancel', 'Delete') with definitions and usage notes, and localization notes (RTL, text expansion, pluralization, and other i18n concerns). At least one of `labels` or `localization` is required. For voice, tone, or capitalization rules, use a `guidelines` block (category 'content') instead.",
  "$defs": {
    "contentLabelEntry": {
      "type": "object",
      "description": "One standard label in the dictionary: the label text, what it means, when to use it, and related terms.",
      "required": [
        "term",
        "definition"
      ],
      "properties": {
        "term": {
          "type": "string",
          "description": "The label text as it should appear in the UI (ex: 'Add', 'Cancel', 'Delete')."
        },
        "definition": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What the label means — the action it represents. Be concrete (ex: for Delete: 'Destroys an existing object so it no longer exists')."
        },
        "usage": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "When and how to use it, with any formatting rules or caveats (ex: 'Combine with the object: Add user, Add role')."
        },
        "alternatives": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Related terms that are often confused with this one, listed to help authors pick the right label. These SHOULD match other `term` values in this block's `labels` array, so tools can cross-reference them.",
          "minItems": 1
        },
        "context": {
          "type": "string",
          "description": "Where this label normally appears (ex: 'Buttons in dialogs', 'Toolbar actions')."
        },
        "examples": {
          "type": "array",
          "description": "Examples of the label in context — do/don't pairs, screenshots, or code.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "localizationEntry": {
      "type": "object",
      "description": "One localization concern — something that affects how content is written, translated, or displayed across languages.",
      "required": [
        "concern",
        "description"
      ],
      "properties": {
        "concern": {
          "type": "string",
          "description": "Which concern this is: 'rtl' (right-to-left layout), 'text-expansion' (text growing in translation), 'pluralization' (plural forms), 'date-format', 'number-format', 'currency', 'text-direction' (mixed-direction text), 'icon-direction' (icons that imply direction), 'truncation', 'sorting' (locale-specific order), or 'concatenation' (don't build sentences by joining strings). Custom values allowed, in lowercase kebab-case."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "What to do about this concern — what changes across locales, and what to avoid."
        },
        "examples": {
          "type": "array",
          "description": "Examples showing the concern — before/after screenshots for RTL, or code for pluralization.",
          "items": {
            "$ref": "../common/example.schema.json#/$defs/example"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "content": {
      "type": "object",
      "description": "A label dictionary and localization notes for an artifact or the whole system. Each entry is a fact, not a rule — general content guidance belongs in `guidelines` (category 'content') instead. A guideline says 'Use sentence case' (a rule); a content entry says 'Add: takes an existing object and uses it in a new context' (a definition).",
      "required": [
        "kind"
      ],
      "anyOf": [
        {
          "required": [
            "labels"
          ]
        },
        {
          "required": [
            "localization"
          ]
        }
      ],
      "properties": {
        "kind": {
          "type": "string",
          "const": "content",
          "description": "Identifies this block as a content spec."
        },
        "description": {
          "$ref": "../common/rich-text.schema.json#/$defs/richText",
          "description": "A short overview of what this block covers. Voice-and-tone philosophy belongs in a `guidelines` block (category 'content'), not here."
        },
        "labels": {
          "type": "array",
          "description": "The label dictionary. Order matters for display, so tools SHOULD keep it; authors MAY sort alphabetically or by frequency.",
          "items": {
            "$ref": "#/$defs/contentLabelEntry"
          },
          "minItems": 1
        },
        "localization": {
          "type": "array",
          "description": "The localization notes. Order matters for display, so tools SHOULD keep it; authors SHOULD lead with the highest-impact concerns.",
          "items": {
            "$ref": "#/$defs/localizationEntry"
          },
          "minItems": 1
        },
        "$extensions": {
          "$ref": "../common/extensions.schema.json#/$defs/extensions"
        }
      },
      "additionalProperties": false
    }
  }
}
```
