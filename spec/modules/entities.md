# DSDS Entities Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the six entity types that can appear in a DSDS documentation group's `items` array. Every entity carries a `type` discriminator, a common set of identity and metadata properties, and a `guidelines` array for all structured documentation. The `guidelines` array accepts only the guideline types appropriate for that entity type — see the [Guidelines Module](guidelines.md) for the full guideline type reference.

---

> **Property tables** for each entity type are auto-generated from the schema JSON files and available on the corresponding schema reference pages. This module provides prose context, usage guidance, and examples.


## Common Entity Properties

Every entity shares these properties. Entity-specific properties are documented in each entity's section below.


---

## 1. Component

**Schema:** `entities/component.schema.json`
**Type discriminator:** `"component"`
**Guideline scope:** Component-scoped guidelines (anatomy, api, variants, states, design-specifications) and all general guidelines (best-practices, purpose, accessibility, examples, artifact-references).

A component documents a reusable UI element — a button, dialog, form field, data table, or any other discrete piece of interface that designers and engineers implement, compose, and maintain. The component entity captures the element's identity, while all structured documentation (anatomy, API, variants, states, design specs, best practices, accessibility, examples) lives in the `guidelines` array.

### Component-Specific Properties

Components have no additional required properties beyond the common set. The optional `aliases` and `category` properties are shared with all entities.

### Typical Guidelines Order

A well-documented component typically includes guidelines in roughly this order, though authors are free to organize differently:

1. **examples** — Hero previews showing the component in its most common configurations.
2. **anatomy** — The visual structure decomposed into named parts with token references.
3. **api** — The code-level interface (properties, events, slots, CSS hooks, methods). For multi-platform components, one API guideline per platform.
4. **variants** — All dimensions of visual/behavioral variation (emphasis, size, full-width, icon-only, etc.).
5. **states** — All interactive states (default, hover, focus, active, disabled, loading, etc.).
6. **design-specifications** — Token inventory, spacing, sizing, typography, and responsive behavior.
7. **purpose** — When to use this component and when to choose something else.
8. **best-practices** — Actionable rules for correct implementation.
9. **accessibility** — Keyboard interactions, ARIA attributes, screen reader behavior, color contrast, focus management.

### Example

<!-- dsds:include spec/examples/entities/component.json#/component -->
```json
{
  "type": "component",
  "name": "button",
  "displayName": "Button",
  "summary": "An interactive element that triggers an action when activated.",
  "description": "An interactive element that triggers an action when activated. Buttons communicate what will happen when the user interacts with them and are the primary mechanism for initiating actions within a surface.",
  "status": {
    "status": "stable",
    "platformStatus": {
      "react": {
        "status": "stable",
        "since": "1.0.0"
      },
      "web-component": {
        "status": "experimental",
        "since": "3.2.0",
        "description": "Available as a Web Component wrapper. Native shadow DOM implementation planned for v4."
      },
      "ios": {
        "status": "stable",
        "since": "2.1.0"
      },
      "android": {
        "status": "draft",
        "description": "Compose implementation in progress. Expected in v4.0."
      },
      "figma": {
        "status": "stable",
        "since": "1.0.0"
      }
    }
  },
  "since": "1.0.0",
  "tags": [
    "action",
    "form",
    "interactive"
  ],
  "category": "action",
  "aliases": [
    "btn",
    "action-button",
    "CTA"
  ],
  "guidelines": [
    {
      "type": "examples",
      "items": [
        {
          "title": "All button variants",
          "presentation": {
            "type": "image",
            "url": "https://design.acme.com/assets/button-hero.png",
            "alt": "A row of four buttons showing the primary, secondary, ghost, and danger variants side by side, each in their default state."
          }
        },
        {
          "title": "Interactive primary button",
          "presentation": {
            "type": "url",
            "url": "https://storybook.acme.com/?path=/story/components-button--primary"
          }
        }
      ]
    },
    {
      "type": "anatomy",
      "description": "The Button is composed of a container, a text label, and an optional leading or trailing icon.",
      "parts": [
        {
          "name": "container",
          "displayName": "Container",
          "description": "The outer boundary of the button. Receives background color, border, border radius, and padding. Defines the clickable area.",
          "required": true,
          "tokens": {
            "background": "button-background",
            "border-color": "button-border-color",
            "border-width": "button-border-width",
            "border-radius": "button-border-radius",
            "padding-horizontal": "button-padding-horizontal",
            "padding-vertical": "button-padding-vertical"
          }
        },
        {
          "name": "label",
          "displayName": "Label",
          "description": "The text content of the button. Communicates the action that will occur on activation.",
          "required": true,
          "tokens": {
            "font-family": "button-font-family",
            "font-size": "button-font-size",
            "font-weight": "button-font-weight",
            "line-height": "button-line-height",
            "text-color": "button-text-color"
          }
        },
        {
          "name": "icon",
          "displayName": "Icon",
          "description": "An optional icon displayed before (leading) or after (trailing) the label. Reinforces the label's meaning visually.",
          "required": false,
          "tokens": {
            "size": "button-icon-size",
            "color": "button-icon-color",
            "gap": "button-icon-gap"
          }
        },
        {
          "name": "focus-ring",
          "displayName": "Focus Ring",
          "description": "A visible outline rendered when the button receives keyboard focus. Not displayed on mouse interaction.",
          "required": true,
          "tokens": {
            "color": "button-focus-ring-color",
            "width": "button-focus-ring-width",
            "offset": "button-focus-ring-offset"
          }
        }
      ],
      "preview": [
        {
          "title": "Anatomy diagram",
          "presentation": {
            "type": "image",
            "url": "https://design.acme.com/assets/button-anatomy.png",
            "alt": "An annotated diagram of a primary button with numbered callouts: 1. Container, 2. Label, 3. Icon (optional), 4. Focus ring (shown in dashed outline)."
          }
        }
      ]
    },
    {
      "type": "api",
      "properties": [
        {
          "name": "variant",
          "type": "'primary' | 'secondary' | 'ghost' | 'danger'",
          "schema": {
            "type": "string",
            "enum": [
              "primary",
              "secondary",
              "ghost",
              "danger"
            ],
            "default": "primary"
          },
          "description": "The visual style of the button. Determines background color, text color, and border treatment.",
          "required": false,
          "defaultValue": "primary",
          "since": "1.0.0"
        },
        {
          "name": "size",
          "type": "'small' | 'medium' | 'large'",
          "schema": {
            "type": "string",
            "enum": [
              "small",
              "medium",
              "large"
            ],
            "default": "medium"
          },
          "description": "The size of the button. Affects padding, font size, icon size, and minimum target area.",
          "required": false,
          "defaultValue": "medium",
          "since": "1.0.0"
        },
        {
          "name": "disabled",
          "type": "boolean",
          "schema": {
            "type": "boolean",
            "default": false
          },
          "description": "When true, the button is non-interactive. The cursor changes to not-allowed, and the button is visually dimmed to 40% opacity.",
          "required": false,
          "defaultValue": false,
          "since": "1.0.0"
        },
        {
          "name": "loading",
          "type": "boolean",
          "schema": {
            "type": "boolean",
            "default": false
          },
          "description": "When true, the label is replaced with a spinner and the button is non-interactive. The button retains its dimensions to prevent layout shift.",
          "required": false,
          "defaultValue": false,
          "since": "2.1.0"
        },
        {
          "name": "fullWidth",
          "type": "boolean",
          "schema": {
            "type": "boolean",
            "default": false
          },
          "description": "When true, the button expands to fill the width of its parent container.",
          "required": false,
          "defaultValue": false,
          "since": "1.2.0"
        },
        {
          "name": "iconStart",
          "type": "IconComponent",
          "description": "An icon component rendered before the label. When provided without a label, an aria-label is required.",
          "required": false,
          "since": "2.0.0"
        },
        {
          "name": "iconEnd",
          "type": "IconComponent",
          "description": "An icon component rendered after the label.",
          "required": false,
          "since": "2.0.0"
        },
        {
          "name": "type",
          "type": "'button' | 'submit' | 'reset'",
          "schema": {
            "type": "string",
            "enum": [
              "button",
              "submit",
              "reset"
            ],
            "default": "button"
          },
          "description": "The HTML button type attribute. Controls form submission behavior.",
          "required": false,
          "defaultValue": "button",
          "since": "1.0.0"
        }
      ],
      "events": [
        {
          "name": "onClick",
          "description": "Fires when the button is activated via mouse click, touch tap, Enter key, or Space key. Does not fire when the button is disabled or loading.",
          "payload": "(event: MouseEvent) => void",
          "since": "1.0.0"
        },
        {
          "name": "onFocus",
          "description": "Fires when the button receives focus.",
          "payload": "(event: FocusEvent) => void",
          "since": "1.0.0"
        },
        {
          "name": "onBlur",
          "description": "Fires when the button loses focus.",
          "payload": "(event: FocusEvent) => void",
          "since": "1.0.0"
        }
      ],
      "slots": [
        {
          "name": "default",
          "description": "The button's text label.",
          "acceptedContent": "Plain text or a text node. Do not nest interactive elements, headings, or block-level elements."
        }
      ],
      "cssCustomProperties": [
        {
          "name": "--button-background",
          "description": "The background color of the button container.",
          "type": "color",
          "since": "1.0.0",
          "defaultValue": "var(--color-action-primary)"
        },
        {
          "name": "--button-text-color",
          "description": "The color of the label text.",
          "type": "color",
          "since": "1.0.0",
          "defaultValue": "var(--color-text-on-action)"
        },
        {
          "name": "--button-border-radius",
          "description": "The border radius of the button container.",
          "type": "dimension",
          "since": "1.0.0",
          "defaultValue": "var(--radius-medium)"
        }
      ],
      "dataAttributes": [
        {
          "name": "data-state",
          "description": "Reflects the current interactive state of the button. Useful for styling with attribute selectors.",
          "values": [
            "default",
            "hover",
            "active",
            "focus",
            "disabled",
            "loading"
          ]
        },
        {
          "name": "data-variant",
          "description": "Reflects the current variant. Useful for parent-level conditional styling.",
          "values": [
            "primary",
            "secondary",
            "ghost",
            "danger"
          ]
        }
      ]
    },
    {
      "type": "variants",
      "items": [
        {
          "name": "emphasis",
          "displayName": "Emphasis",
          "description": "Controls the visual weight of the button. Determines background fill, border treatment, and text color to establish a visual hierarchy among actions on a surface.",
          "values": [
            {
              "name": "primary",
              "displayName": "Primary",
              "description": "High-emphasis — the main action on the surface. Uses a solid, filled background. Limit to one primary button per surface.",
              "tokens": {
                "button-background": "color-action-primary",
                "button-text-color": "color-text-on-action",
                "button-border-color": "transparent"
              },
              "useCases": {
                "whenToUse": [
                  {
                    "description": "When the action is the most important on the surface — the one the user is most likely to take (e.g., Save, Submit, Confirm)."
                  }
                ],
                "whenNotToUse": [
                  {
                    "description": "When a surface already has a primary button. Adding a second dilutes visual hierarchy.",
                    "alternative": {
                      "name": "secondary",
                      "rationale": "Secondary emphasis maintains importance without competing with the existing primary action."
                    }
                  }
                ]
              }
            },
            {
              "name": "secondary",
              "displayName": "Secondary",
              "description": "Medium-emphasis — important but not the primary action. Uses a visible border and transparent background.",
              "tokens": {
                "button-background": "transparent",
                "button-text-color": "color-action-primary",
                "button-border-color": "color-action-primary"
              },
              "useCases": {
                "whenToUse": [
                  {
                    "description": "When the action is important but secondary to a primary action on the same surface (e.g., Cancel alongside Save)."
                  }
                ]
              }
            },
            {
              "name": "ghost",
              "displayName": "Ghost",
              "description": "Low-emphasis — tertiary actions, toolbar actions, or dense layouts. No background or border in the default state.",
              "tokens": {
                "button-background": "transparent",
                "button-text-color": "color-action-primary",
                "button-border-color": "transparent"
              },
              "useCases": {
                "whenToUse": [
                  {
                    "description": "When the action is tertiary or supplementary — helpful but not essential to the user's primary task."
                  }
                ],
                "whenNotToUse": [
                  {
                    "description": "When the action is the only action on the surface and needs to be clearly discoverable.",
                    "alternative": {
                      "name": "secondary",
                      "rationale": "A ghost button on its own can be overlooked. Secondary emphasis provides enough visual presence to be discoverable."
                    }
                  }
                ]
              }
            },
            {
              "name": "danger",
              "displayName": "Danger",
              "description": "High-emphasis destructive — signals an irreversible action. Uses the danger color. Pair with a confirmation dialog.",
              "tokens": {
                "button-background": "color-action-danger",
                "button-text-color": "color-text-on-action",
                "button-border-color": "transparent"
              },
              "useCases": {
                "whenToUse": [
                  {
                    "description": "When the action is destructive or irreversible — deleting a record, revoking access, removing a team member."
                  }
                ],
                "whenNotToUse": [
                  {
                    "description": "When the action is not destructive, even if it feels important or urgent.",
                    "alternative": {
                      "name": "primary",
                      "rationale": "The danger color is a strong signal reserved for destruction. Using it for non-destructive actions dilutes its meaning."
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "type": "states",
      "items": [
        {
          "name": "default",
          "displayName": "Default",
          "description": "The button's resting state when no interaction is occurring."
        },
        {
          "name": "hover",
          "displayName": "Hover",
          "description": "Triggered when the user's pointer moves over the button. The background darkens by 8% to indicate interactivity. Not applicable on touch devices.",
          "tokens": {
            "button-background": "color-action-primary-hover"
          }
        },
        {
          "name": "active",
          "displayName": "Active / Pressed",
          "description": "Triggered while the button is being pressed (mousedown or touch start). The background darkens by 16% from the default to indicate activation.",
          "tokens": {
            "button-background": "color-action-primary-active"
          }
        },
        {
          "name": "focus",
          "displayName": "Focus",
          "description": "Triggered when the button receives keyboard focus. A 2px focus ring appears with a 2px offset from the container edge.",
          "tokens": {
            "button-focus-ring-color": "color-focus-ring",
            "button-focus-ring-width": "border-width-focus",
            "button-focus-ring-offset": "space-focus-offset"
          }
        },
        {
          "name": "disabled",
          "displayName": "Disabled",
          "description": "The button is non-interactive. Opacity is reduced to 0.4. Pointer events are disabled. The button remains in the tab order when using aria-disabled instead of the HTML disabled attribute."
        },
        {
          "name": "loading",
          "displayName": "Loading",
          "description": "The button label is replaced by a spinner animation. The button is non-interactive. The button maintains its dimensions from the default state to prevent layout shift."
        }
      ]
    },
    {
      "type": "design-specifications",
      "tokens": [
        "button-background",
        "button-text-color",
        "button-border-color",
        "button-border-width",
        "button-border-radius",
        "button-padding-horizontal",
        "button-padding-vertical",
        "button-font-family",
        "button-font-size",
        "button-font-weight",
        "button-line-height",
        "button-icon-size",
        "button-icon-color",
        "button-icon-gap",
        "button-focus-ring-color",
        "button-focus-ring-width",
        "button-focus-ring-offset",
        "button-min-height",
        "button-min-width"
      ],
      "spacing": {
        "internal": {
          "container-horizontal": "button-padding-horizontal",
          "container-vertical": "button-padding-vertical",
          "icon-to-label": "button-icon-gap"
        },
        "external": {
          "button-to-button": "space-3",
          "button-group-gap": "space-3"
        }
      },
      "sizing": {
        "minWidth": "button-min-width",
        "minHeight": "button-min-height"
      },
      "typography": {
        "label": {
          "fontSize": "14px",
          "fontWeight": "400",
          "lineHeight": "20px",
          "typeToken": "$body-compact-01"
        }
      },
      "responsive": [
        {
          "breakpoint": "small",
          "description": "In narrow containers (below 320px), buttons expand to full width automatically to maintain a usable tap target."
        },
        {
          "breakpoint": "medium",
          "description": "Buttons display at their intrinsic width. Button groups display inline."
        }
      ]
    },
    {
      "type": "purpose",
      "useCases": {
        "whenToUse": [
          {
            "description": "When the user needs to trigger an action such as submitting a form, saving data, opening a dialog, or confirming a decision."
          },
          {
            "description": "When a destructive or irreversible action needs to be initiated, such as deleting a record or revoking access. Pair with a confirmation dialog."
          }
        ],
        "whenNotToUse": [
          {
            "description": "When the action navigates the user to a different page or URL.",
            "alternative": {
              "name": "link",
              "rationale": "Links carry native navigation semantics. Screen readers announce them as links, and browsers support standard navigation behaviors such as open-in-new-tab."
            }
          },
          {
            "description": "When the user needs to select one option from a set of mutually exclusive choices.",
            "alternative": {
              "name": "radio-group",
              "rationale": "Radio groups communicate exclusivity through their semantic role. A set of buttons styled to look like a selector does not convey mutual exclusivity to assistive technology."
            }
          },
          {
            "description": "When the only content is an icon with no visible text label.",
            "alternative": {
              "name": "icon-button",
              "rationale": "Icon buttons enforce an aria-label requirement and apply size adjustments for icon-only touch targets. A standard button with its label removed may fail accessibility requirements silently."
            }
          }
        ]
      }
    },
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "Limit each surface to one primary button.",
          "rationale": "Multiple primary buttons dilute visual hierarchy. When everything is emphasized, nothing is. A single primary button directs the user to the most important action.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Place the primary button on the right side of a button group in left-to-right layouts.",
          "rationale": "Users scan in the direction of the layout's reading order. Placing the primary action at the natural endpoint aligns with the completion point of reading.",
          "level": "encouraged",
          "category": "visual-design"
        },
        {
          "guidance": "Do not use a Button when the action navigates the user to a different page or URL. Use a Link component instead.",
          "rationale": "Buttons and links have different semantic roles. Buttons trigger actions (submit, open, close). Links navigate. Screen reader users rely on element role to anticipate behavior.",
          "level": "prohibited",
          "category": "visual-design"
        },
        {
          "guidance": "Use the danger variant exclusively for destructive or irreversible actions. Pair danger buttons with a confirmation dialog.",
          "rationale": "Red is a strong signal. If danger styling is used for non-destructive actions, it dilutes the warning signal and conditions users to ignore it.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Use the loading state instead of disabling the button during asynchronous operations.",
          "rationale": "A disabled button gives no feedback that an action is in progress. The loading state communicates that the action was registered and the system is working.",
          "level": "encouraged",
          "category": "interaction"
        },
        {
          "guidance": "Do not wrap a button's label text across multiple lines.",
          "rationale": "Multi-line button labels are harder to scan and create inconsistent button heights in groups. If the label is too long, rewrite it to be shorter.",
          "level": "prohibited",
          "category": "visual-design"
        },
        {
          "guidance": "Maintain a minimum tap target of 44x44 CSS pixels for all button sizes.",
          "rationale": "The WCAG 2.5.8 target size criterion requires a minimum 24x24px target, with 44x44px recommended. Touch devices require larger targets to prevent mis-taps.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#target-size-minimum"
          ]
        },
        {
          "guidance": "Use a verb or verb phrase that describes the action the button performs. Two words maximum.",
          "rationale": "Action-oriented labels set clear expectations about what will happen on activation. Short labels prevent truncation on narrow viewports.",
          "level": "required",
          "category": "content",
          "target": "label"
        },
        {
          "guidance": "Use sentence case capitalization.",
          "rationale": "Sentence case is easier to read than title case or all caps. It also localizes more predictably across languages where capitalization rules differ.",
          "level": "required",
          "category": "content",
          "target": "label"
        },
        {
          "guidance": "When using an icon-only button (no visible label), provide an aria-label that describes the action.",
          "rationale": "Screen readers announce button content as the accessible name. Without visible text, there is no accessible name. The aria-label provides one.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#name-role-value"
          ]
        },
        {
          "guidance": "Use the native <button> element. Do not recreate button behavior on a <div> or <span>.",
          "rationale": "Native buttons provide built-in keyboard interaction (Enter, Space), focus management, and form submission behavior. Recreating this on a non-semantic element is error-prone.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#name-role-value"
          ]
        },
        {
          "guidance": "Prefer aria-disabled=\"true\" over the HTML disabled attribute when the button should remain discoverable by screen reader users.",
          "rationale": "The HTML disabled attribute removes the button from the tab order, making it invisible to keyboard users. aria-disabled keeps the button focusable and announceable.",
          "level": "encouraged",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#keyboard"
          ]
        },
        {
          "guidance": "The focus ring must be visible in all color modes (light, dark, high contrast).",
          "rationale": "Keyboard users depend on the focus indicator to track their position. If the focus ring is invisible against the background, navigation becomes impossible.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#focus-visible"
          ]
        },
        {
          "guidance": "Button label text must meet a minimum 4.5:1 contrast ratio against the button background.",
          "rationale": "Text contrast ensures readability for users with low vision.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#contrast-minimum"
          ]
        }
      ]
    },
    {
      "type": "accessibility",
      "wcagLevel": "AA",
      "keyboardInteraction": [
        {
          "key": "Enter",
          "action": "Activates the button."
        },
        {
          "key": "Space",
          "action": "Activates the button."
        },
        {
          "key": "Tab",
          "action": "Moves focus to the next focusable element in the tab order."
        },
        {
          "key": "Shift+Tab",
          "action": "Moves focus to the previous focusable element in the tab order."
        }
      ],
      "ariaAttributes": [
        {
          "attribute": "role",
          "value": "button",
          "description": "Applied automatically by the <button> element. Only set explicitly when using the 'as' prop to render a non-button element.",
          "required": false
        },
        {
          "attribute": "aria-disabled",
          "value": "true | false",
          "description": "Set to 'true' when the button is non-interactive. Preferred over the HTML disabled attribute when the button should remain focusable for screen reader discoverability.",
          "required": false
        },
        {
          "attribute": "aria-label",
          "value": "string",
          "description": "Provides an accessible name for icon-only buttons that lack visible text. Not needed when a visible label is present.",
          "required": false
        },
        {
          "attribute": "aria-busy",
          "value": "true | false",
          "description": "Set to 'true' when the button is in the loading state. Communicates to assistive technology that the button's action is in progress.",
          "required": false
        }
      ],
      "screenReaderBehavior": "Announced as '[label], button'. When disabled via aria-disabled, announced as '[label], button, dimmed' (VoiceOver) or '[label], button, unavailable' (NVDA/JAWS). When loading, announced as '[label], button, busy'.",
      "focusManagement": "The button participates in the normal tab order. It does not trap or redirect focus. When the button triggers a modal or popover, focus is moved to the opened element — this is the responsibility of the modal/popover component, not the button.",
      "colorContrast": [
        {
          "foreground": "color-text-on-action",
          "background": "color-action-primary",
          "contrastRatio": 7.2,
          "level": "AAA",
          "context": "Label text on primary button background in light mode."
        },
        {
          "foreground": "color-action-primary",
          "background": "color-background-default",
          "contrastRatio": 4.8,
          "level": "AA",
          "context": "Secondary button border/text against the default page background in light mode."
        },
        {
          "foreground": "color-text-on-action",
          "background": "color-action-danger",
          "contrastRatio": 6.5,
          "level": "AAA",
          "context": "Label text on danger button background in light mode."
        }
      ],
      "motionConsiderations": "The loading spinner animation respects the prefers-reduced-motion media query. When reduced motion is preferred, the spinner is replaced with a static ellipsis indicator."
    }
  ],
  "links": [
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/packages/components/src/button/button.tsx",
      "label": "React component source"
    },
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/packages/components/src/button/button.test.tsx",
      "label": "Unit tests"
    },
    {
      "type": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=1234:5678",
      "label": "Design file — component"
    },
    {
      "type": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=1234:9999",
      "label": "Design file — variants"
    },
    {
      "type": "storybook",
      "url": "https://storybook.acme.com/?path=/docs/components-button--docs",
      "label": "Storybook docs"
    },
    {
      "type": "package",
      "url": "https://www.npmjs.com/package/@acme/components",
      "label": "npm package"
    },
    {
      "type": "alternative",
      "url": "https://design.acme.com/components/link",
      "label": "link (component)"
    },
    {
      "type": "child",
      "url": "https://design.acme.com/components/icon-button",
      "label": "icon-button (component)"
    },
    {
      "type": "parent",
      "url": "https://design.acme.com/components/button-group",
      "label": "button-group (component)"
    }
  ],
  "$extensions": {
    "com.designTool": {
      "componentId": "abc123def456"
    }
  }
}
```
<!-- /dsds:include -->

---

## 2. Token

**Schema:** `entities/token.schema.json`
**Type discriminator:** `"token"`
**Guideline scope:** General guidelines only (best-practices, purpose, accessibility, examples, artifact-references).

A token documents a single design token — a named design decision expressed as a value. Tokens carry their DTCG-aligned type, a displayable value representation, platform-specific API mappings, and optional alias references. Token documentation is complementary to the [W3C Design Tokens Format Module](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) — DSDS documents the _documentation_ around tokens, while the DTCG format defines the interchange format for token _values_.

### Token-Specific Properties


### 2.1 Token Value

The `tokenValue` object provides a human-readable snapshot of the token's value for documentation tools. It is _not_ the authoritative source of truth — the Design Tokens Format file is.


### 2.2 Token API

The `tokenApi` object maps the token to its platform-specific identifiers. It is an open map — keys are platform names and values are the identifier strings for that platform.

Standard keys (non-normative):


Custom keys _SHOULD_ use camelCase and follow the `<platform><Concept>` naming pattern.

### 2.3 Token Name Convention

Token names are intentionally unconstrained by a name pattern (unlike other entity types which enforce `^[a-z][a-z0-9-]*$`). This accommodates the diversity of naming conventions used across DTCG files, design tool variable systems, and existing token architectures:

- Kebab-case: `color-text-primary`
- Dot-notation: `color.text.primary`
- Slash-path: `color/text/primary`
- Mixed: `Color.Text.primary`

Token names _SHOULD_ still be human-readable, but the schema does not enforce a pattern.

### Example

<!-- dsds:include spec/examples/entities/token.json#/token -->
```json
{
  "type": "token",
  "name": "color-text-primary",
  "summary": "Default body text color for light and dark surfaces.",
  "description": "The default color for body text, headings, and labels. Provides the highest-contrast text color for standard reading content on default background surfaces.",
  "status": {
    "status": "stable",
    "platformStatus": {
      "css": {
        "status": "stable",
        "since": "2.0.0"
      },
      "ios": {
        "status": "stable",
        "since": "2.1.0"
      },
      "android": {
        "status": "stable",
        "since": "2.2.0"
      },
      "figma": {
        "status": "stable",
        "since": "2.0.0"
      }
    }
  },
  "since": "2.0.0",
  "tags": [
    "color",
    "text",
    "body"
  ],
  "tokenType": "color",
  "category": "semantic",
  "value": {
    "resolved": "#1a1a1a",
    "reference": "color.neutral.900",
    "dtcgFile": "./tokens/color.tokens.json"
  },
  "aliases": [
    "color.text.default",
    "color.text.body"
  ],
  "api": {
    "cssCustomProperty": "--color-text-primary",
    "scssVariable": "$color-text-primary",
    "jsConstant": "colorTextPrimary",
    "iosToken": "Color.Text.primary",
    "androidToken": "colorTextPrimary",
    "designToolVariable": "color/text/primary"
  },
  "guidelines": [
    {
      "type": "purpose",
      "useCases": {
        "whenToUse": [
          {
            "description": "When applying color to body text, headings, and form labels on default background surfaces."
          },
          {
            "description": "When building components that display primary reading content that must adapt across color modes."
          }
        ],
        "whenNotToUse": [
          {
            "description": "When placing text on dark or colored background surfaces.",
            "alternative": {
              "name": "color-text-inverse",
              "rationale": "This token is optimized for contrast against light backgrounds. Using it on dark or saturated surfaces will fail contrast requirements."
            }
          },
          {
            "description": "When the text is inside a component that supplies its own scoped color tokens (e.g., text on a filled button).",
            "alternative": {
              "name": "color-text-on-action",
              "rationale": "Component-scoped tokens account for the specific background they sit on. Applying a general text token to a scoped context risks contrast failures."
            }
          }
        ]
      }
    },
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "Use for all body text, headings, and form labels on default background surfaces.",
          "rationale": "A single primary text color ensures visual consistency and meets WCAG 2.1 AA contrast requirements against the system's default background.",
          "level": "encouraged",
          "category": "visual-design"
        },
        {
          "guidance": "Do not override this token's value at the component level. Use color-text-secondary or color-text-tertiary for reduced emphasis.",
          "rationale": "Overriding the primary text color creates inconsistency. The system provides lower-emphasis text tokens for visual hierarchy.",
          "level": "prohibited",
          "category": "visual-design"
        },
        {
          "guidance": "This color meets a 15.3:1 contrast ratio against color-background-default in light mode.",
          "rationale": "Exceeds WCAG 2.1 AAA requirements (7:1 for normal text), ensuring readability for users with low vision.",
          "level": "informational",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#contrast-minimum",
            "https://www.w3.org/TR/WCAG22/#contrast-enhanced"
          ]
        }
      ]
    },
    {
      "type": "accessibility",
      "wcagLevel": "AAA",
      "colorContrast": [
        {
          "foreground": "color-text-primary",
          "background": "color-background-default",
          "contrastRatio": 15.3,
          "level": "AAA",
          "context": "Primary text on default background in light mode."
        },
        {
          "foreground": "color-text-primary",
          "background": "color-background-subtle",
          "contrastRatio": 13.8,
          "level": "AAA",
          "context": "Primary text on subtle background (card surface) in light mode."
        }
      ]
    }
  ],
  "links": [
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/tokens/color/text.tokens.json",
      "label": "Token source file"
    },
    {
      "type": "documentation",
      "url": "https://design.acme.com/tokens/color-text-primary",
      "label": "Token documentation"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/tokens/color-text-secondary",
      "label": "color-text-secondary"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/tokens/color-text-tertiary",
      "label": "color-text-tertiary"
    }
  ]
}
```
<!-- /dsds:include -->

---

## 3. Token Group

**Schema:** `entities/token.schema.json`
**Type discriminator:** `"token-group"`
**Guideline scope:** General guidelines only (best-practices, purpose, accessibility, examples, artifact-references).

A token group is a flexible organizational unit for collecting related tokens into a named, documented hierarchy. Token groups can represent structures at any level of granularity:

- A **full token collection** — all tokens in the system, organized by family
- A **token family** — all color tokens, all spacing tokens, all typography tokens
- A **token sub-family** — a single color hue with its grade scale (e.g., "Red — Pushpin" with grades 0–900)
- A **component token set** — tokens scoped to a single component (e.g., all button tokens)

### Token Group-Specific Properties


### 3.1 Children

The `children` array is the core mechanism for building token hierarchies. Each item in the array _MUST_ be one of:

- A **token** entity — with `"type": "token"` and its full documentation
- A **token group** entity — with `"type": "token-group"` and its own `children`

The ordering of items in `children` is **significant**. Tools _SHOULD_ preserve the order for display, as it often represents a meaningful progression — a color grade scale from lightest to darkest, a spacing scale from smallest to largest, or a type scale from body to display.

### 3.2 Inherited Properties

When a token group declares `tokenType` or `category`, these values serve as defaults for all token children (direct and deeply nested). A child token _MAY_ override either value by declaring its own.

This inheritance is a documentation convenience — it reduces repetition in groups where all tokens share the same type or category. Tools that flatten a token group hierarchy _SHOULD_ resolve inherited values onto each leaf token.

### Example

<!-- dsds:include spec/examples/entities/token-group.json#/tokenGroup -->
```json
{
  "type": "token-group",
  "name": "color-palette",
  "description": "The full range of color options in the system. Colors are organized into named hue families, each with a grade scale from 0 (lightest) to 900 (darkest). The 450 grades are reserved for brand usage.",
  "status": {
    "status": "stable"
  },
  "since": "1.0.0",
  "tokenType": "color",
  "category": "base",
  "tags": [
    "color",
    "palette",
    "base"
  ],
  "children": [
    {
      "type": "token-group",
      "name": "color-red-pushpin",
      "description": "The red hue family. Pushpin 450 is the system's primary hero color, used for brand moments and primary product actions.",
      "status": {
        "status": "stable"
      },
      "since": "1.0.0",
      "tags": [
        "red",
        "brand",
        "hero"
      ],
      "children": [
        {
          "type": "token",
          "name": "color-red-pushpin-0",
          "description": "Lightest tint of the Pushpin red family. Suitable for large background surfaces and subtle error-state backgrounds.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#FFF7F7"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-0",
            "scssVariable": "$color-red-pushpin-0",
            "designToolVariable": "color/red/pushpin/0"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-50",
          "description": "Very light tint of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#FFEBEB"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-50",
            "scssVariable": "$color-red-pushpin-50",
            "designToolVariable": "color/red/pushpin/50"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-100",
          "description": "Light tint of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#FFE0E0"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-100",
            "scssVariable": "$color-red-pushpin-100",
            "designToolVariable": "color/red/pushpin/100"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-200",
          "description": "Light-medium tint of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#FCBBBB"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-200",
            "scssVariable": "$color-red-pushpin-200",
            "designToolVariable": "color/red/pushpin/200"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-300",
          "description": "Medium tint of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#F47171"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-300",
            "scssVariable": "$color-red-pushpin-300",
            "designToolVariable": "color/red/pushpin/300"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-400",
          "description": "Medium shade of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#EB4242"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-400",
            "scssVariable": "$color-red-pushpin-400",
            "designToolVariable": "color/red/pushpin/400"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-450",
          "description": "The system's primary hero color. Reserved for brand usage and primary product actions. Among the least accessible colors in the palette — do not use for functional color pairings without explicit contrast verification.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "tags": [
            "hero",
            "brand",
            "primary",
            "reserved"
          ],
          "value": {
            "resolved": "#E60023"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-450",
            "scssVariable": "$color-red-pushpin-450",
            "designToolVariable": "color/red/pushpin/450"
          },
          "guidelines": [
            {
              "type": "best-practices",
              "items": [
                {
                  "guidance": "Reserve this color for brand moments and the primary product action. Do not use for general UI elements.",
                  "rationale": "Pushpin 450 is the system's hero color. Overusing it dilutes its impact and creates accessibility challenges, as the 450 grades have limited contrast pairing options.",
                  "level": "required",
                  "category": "visual-design"
                }
              ]
            }
          ]
        },
        {
          "type": "token",
          "name": "color-red-pushpin-500",
          "description": "Core red used for error states and critical status indicators.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#CC0000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-500",
            "scssVariable": "$color-red-pushpin-500",
            "designToolVariable": "color/red/pushpin/500"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-600",
          "description": "Dark shade of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#B60000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-600",
            "scssVariable": "$color-red-pushpin-600",
            "designToolVariable": "color/red/pushpin/600"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-700",
          "description": "Deep shade of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#9B0000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-700",
            "scssVariable": "$color-red-pushpin-700",
            "designToolVariable": "color/red/pushpin/700"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-800",
          "description": "Very dark shade of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#800000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-800",
            "scssVariable": "$color-red-pushpin-800",
            "designToolVariable": "color/red/pushpin/800"
          }
        },
        {
          "type": "token",
          "name": "color-red-pushpin-900",
          "description": "Darkest shade of the Pushpin red family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#660000"
          },
          "api": {
            "cssCustomProperty": "--color-red-pushpin-900",
            "scssVariable": "$color-red-pushpin-900",
            "designToolVariable": "color/red/pushpin/900"
          }
        }
      ]
    },
    {
      "type": "token-group",
      "name": "color-blue-skycicle",
      "description": "The blue hue family. Used for interactive elements, education surfaces, informational indicators, and shopping experiences.",
      "status": {
        "status": "stable"
      },
      "since": "1.0.0",
      "tags": [
        "blue",
        "interactive",
        "info"
      ],
      "children": [
        {
          "type": "token",
          "name": "color-blue-skycicle-0",
          "description": "Lightest tint of the Skycicle blue family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#F7FBFF"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-0",
            "scssVariable": "$color-blue-skycicle-0",
            "designToolVariable": "color/blue/skycicle/0"
          }
        },
        {
          "type": "token",
          "name": "color-blue-skycicle-100",
          "description": "Light tint of the Skycicle blue family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#D7EDFF"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-100",
            "scssVariable": "$color-blue-skycicle-100",
            "designToolVariable": "color/blue/skycicle/100"
          }
        },
        {
          "type": "token",
          "name": "color-blue-skycicle-300",
          "description": "Medium tint of the Skycicle blue family. Used as the interactive element color in dark mode.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#75BFFF"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-300",
            "scssVariable": "$color-blue-skycicle-300",
            "designToolVariable": "color/blue/skycicle/300"
          }
        },
        {
          "type": "token",
          "name": "color-blue-skycicle-500",
          "description": "Core blue used for interactive elements, education surfaces, and shopping experiences in light mode.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#0074E8"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-500",
            "scssVariable": "$color-blue-skycicle-500",
            "designToolVariable": "color/blue/skycicle/500"
          }
        },
        {
          "type": "token",
          "name": "color-blue-skycicle-700",
          "description": "Deep shade of the Skycicle blue family. Used for link text in light mode.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#004BA9"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-700",
            "scssVariable": "$color-blue-skycicle-700",
            "designToolVariable": "color/blue/skycicle/700"
          }
        },
        {
          "type": "token",
          "name": "color-blue-skycicle-900",
          "description": "Darkest shade of the Skycicle blue family.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#002966"
          },
          "api": {
            "cssCustomProperty": "--color-blue-skycicle-900",
            "scssVariable": "$color-blue-skycicle-900",
            "designToolVariable": "color/blue/skycicle/900"
          }
        }
      ]
    },
    {
      "type": "token-group",
      "name": "color-gray-roboflow",
      "description": "The neutral gray family. The foundation of the system's layering model and the most commonly used color family in both light and dark modes.",
      "status": {
        "status": "stable"
      },
      "since": "1.0.0",
      "tags": [
        "gray",
        "neutral"
      ],
      "children": [
        {
          "type": "token",
          "name": "color-gray-roboflow-50",
          "description": "Near-white neutral. Used for subtle background differentiation.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#F9F9F9"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-50",
            "scssVariable": "$color-gray-roboflow-50",
            "designToolVariable": "color/gray/roboflow/50"
          }
        },
        {
          "type": "token",
          "name": "color-gray-roboflow-200",
          "description": "Light gray. Used for secondary backgrounds and borders.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#E9E9E9"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-200",
            "scssVariable": "$color-gray-roboflow-200",
            "designToolVariable": "color/gray/roboflow/200"
          }
        },
        {
          "type": "token",
          "name": "color-gray-roboflow-500",
          "description": "Mid-gray. Used for subtle text, default borders, and disabled states in light mode. The minimum gray that meets WCAG AA contrast on white for large text.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#767676"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-500",
            "scssVariable": "$color-gray-roboflow-500",
            "designToolVariable": "color/gray/roboflow/500"
          }
        },
        {
          "type": "token",
          "name": "color-gray-roboflow-700",
          "description": "Dark gray.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#2B2B2B"
          },
          "api": {
            "cssCustomProperty": "--color-gray-roboflow-700",
            "scssVariable": "$color-gray-roboflow-700",
            "designToolVariable": "color/gray/roboflow/700"
          }
        }
      ]
    },
    {
      "type": "token-group",
      "name": "color-white-mochimalist",
      "description": "The white value. Used as the default background surface in light mode and as inverse text in dark mode.",
      "status": {
        "status": "stable"
      },
      "since": "1.0.0",
      "children": [
        {
          "type": "token",
          "name": "color-white-mochimalist-0",
          "description": "Pure white.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#FFFFFF"
          },
          "api": {
            "cssCustomProperty": "--color-white-mochimalist-0",
            "scssVariable": "$color-white-mochimalist-0",
            "designToolVariable": "color/white/mochimalist/0"
          }
        }
      ]
    },
    {
      "type": "token-group",
      "name": "color-black-cosmicore",
      "description": "The near-black value. Used as the default text color and background surface in dark mode.",
      "status": {
        "status": "stable"
      },
      "since": "1.0.0",
      "children": [
        {
          "type": "token",
          "name": "color-black-cosmicore-900",
          "description": "Near-black. The darkest color in the system — used for default text in light mode and the default background in dark mode.",
          "status": {
            "status": "stable"
          },
          "tokenType": "color",
          "value": {
            "resolved": "#111111"
          },
          "api": {
            "cssCustomProperty": "--color-black-cosmicore-900",
            "scssVariable": "$color-black-cosmicore-900",
            "designToolVariable": "color/black/cosmicore/900"
          }
        }
      ]
    }
  ],
  "guidelines": [
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "The 450 colors are reserved for brand usage. Do not use 450 grades for functional UI elements without explicit accessibility verification.",
          "rationale": "The 450 grades are among the least accessible colors in the palette. They work best within larger brand moments and are not suitable for functional color pairings.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Use the darkGray text color on any background color at grade 400 or below. Use white text on grade 500 and above.",
          "rationale": "Ensures WCAG 2.1 AA contrast compliance for text placed on palette colors.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#contrast-minimum"
          ]
        },
        {
          "guidance": "Do not use base palette tokens directly in product code. Use semantic tokens that reference these base values instead.",
          "rationale": "Semantic tokens adapt automatically across color modes. Direct use of base palette tokens bypasses the theming system and will produce incorrect results in dark mode.",
          "level": "prohibited",
          "category": "engineering"
        }
      ]
    }
  ],
  "links": [
    {
      "type": "design",
      "url": "https://www.figma.com/file/abc123/color-palette",
      "label": "Figma — Extended Color Palette"
    },
    {
      "type": "documentation",
      "url": "https://gestalt.pinterest.systems/v1/foundations/color/palette",
      "label": "Color Palette documentation"
    }
  ]
}
```
<!-- /dsds:include -->

---

## 4. Theme

**Schema:** `entities/theme.schema.json`
**Type discriminator:** `"theme"`
**Guideline scope:** General guidelines only (best-practices, purpose, accessibility, examples, artifact-references).

A theme provides alternative token values for a **named context** — such as a color mode (light, dark, high-contrast), a density setting (compact, comfortable, spacious), a brand variant, or a product-specific customization.

Themes are a separate entity type because they do not redefine tokens — they reference existing tokens and supply override values. The token catalog remains the single source of truth for what a token _is_ (its name, type, semantic purpose, API mappings, and documentation), while themes describe how token _values_ change across contexts.

### Theme-Specific Properties


### 4.1 Token Overrides

Each entry in the `overrides` array is a simple mapping of a token name to its theme-specific value:


Only tokens whose values differ from the default need to be listed. Unlisted tokens retain their default values. This keeps theme documents focused — a dark mode theme only needs to list the tokens that change, not the entire token catalog.

### 4.2 Theme Category

The optional `category` property classifies the type of adaptation the theme represents. Common values:

| Value | Description |
|---|---|
| `"color-mode"` | A color scheme variant such as light, dark, or high-contrast. |
| `"density"` | A spatial density variant such as compact, comfortable, or spacious. |
| `"brand"` | A brand or sub-brand variant that adjusts colors, typography, or other visual attributes. |
| `"product"` | Product-specific overrides within a shared design system. |

### Example

<!-- dsds:include spec/examples/entities/theme.json#/theme -->
```json
{
  "type": "theme",
  "name": "dark",
  "displayName": "Dark Mode",
  "summary": "A dark color mode theme for low-light environments and user preference.",
  "description": "The dark color mode theme. Inverts the default light surface/text relationship, using light text on dark backgrounds. Designed for low-light environments, user preference, and reduced eye strain. All override values have been validated to maintain WCAG AA contrast ratios against the dark background surfaces.",
  "status": {
    "status": "stable",
    "platformStatus": {
      "react": {
        "status": "stable",
        "since": "2.0.0"
      },
      "web-component": {
        "status": "stable",
        "since": "2.1.0"
      },
      "ios": {
        "status": "stable",
        "since": "2.0.0",
        "description": "Automatically applied when the device is set to dark appearance."
      },
      "android": {
        "status": "stable",
        "since": "2.2.0",
        "description": "Follows the system-level dark theme setting via AppCompat.DayNight."
      },
      "figma": {
        "status": "stable",
        "since": "2.0.0",
        "description": "Available as a dedicated mode in the Figma variable collection."
      }
    }
  },
  "since": "2.0.0",
  "tags": [
    "dark-mode",
    "color-mode",
    "accessibility"
  ],
  "category": "color-mode",
  "overrides": [
    {
      "token": "color-background-default",
      "value": {
        "resolved": "#111111",
        "reference": "color.black.cosmicore.900"
      }
    },
    {
      "token": "color-background-elevation-accent",
      "value": {
        "resolved": "#191919",
        "reference": "color.gray.roboflow.800"
      }
    },
    {
      "token": "color-background-elevation-floating",
      "value": {
        "resolved": "#2B2B2B",
        "reference": "color.gray.roboflow.700"
      }
    },
    {
      "token": "color-background-elevation-raised",
      "value": {
        "resolved": "#4A4A4A",
        "reference": "color.gray.roboflow.600"
      }
    },
    {
      "token": "color-background-secondary-base",
      "value": {
        "resolved": "#767676",
        "reference": "color.gray.roboflow.500"
      }
    },
    {
      "token": "color-background-inverse-base",
      "value": {
        "resolved": "#F9F9F9",
        "reference": "color.gray.roboflow.50"
      }
    },
    {
      "token": "color-background-error-base",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "color-background-error-weak",
      "value": {
        "resolved": "#660000",
        "reference": "color.red.pushpin.900"
      }
    },
    {
      "token": "color-background-success-base",
      "value": {
        "resolved": "#6BEC8C",
        "reference": "color.green.matchacado.300"
      }
    },
    {
      "token": "color-background-success-weak",
      "value": {
        "resolved": "#00422C",
        "reference": "color.green.matchacado.700"
      }
    },
    {
      "token": "color-background-info-base",
      "value": {
        "resolved": "#75BFFF",
        "reference": "color.blue.skycicle.300"
      }
    },
    {
      "token": "color-background-info-weak",
      "value": {
        "resolved": "#003C96",
        "reference": "color.blue.skycicle.800"
      }
    },
    {
      "token": "color-background-warning-base",
      "value": {
        "resolved": "#FDC900",
        "reference": "color.yellow.caramellow.300"
      }
    },
    {
      "token": "color-background-warning-weak",
      "value": {
        "resolved": "#7C2D00",
        "reference": "color.yellow.caramellow.800"
      }
    },
    {
      "token": "color-background-selected-base",
      "value": {
        "resolved": "#E9E9E9",
        "reference": "color.gray.roboflow.200"
      }
    },
    {
      "token": "color-text-default",
      "value": {
        "resolved": "#FFFFFF",
        "reference": "color.white.mochimalist.0"
      }
    },
    {
      "token": "color-text-subtle",
      "value": {
        "resolved": "#A5A5A5",
        "reference": "color.gray.roboflow.400"
      }
    },
    {
      "token": "color-text-disabled",
      "value": {
        "resolved": "#4A4A4A",
        "reference": "color.gray.roboflow.600"
      }
    },
    {
      "token": "color-text-inverse",
      "value": {
        "resolved": "#111111",
        "reference": "color.black.cosmicore.900"
      }
    },
    {
      "token": "color-text-error",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "color-text-success",
      "value": {
        "resolved": "#39D377",
        "reference": "color.green.matchacado.400"
      }
    },
    {
      "token": "color-text-warning",
      "value": {
        "resolved": "#E18D00",
        "reference": "color.yellow.caramellow.400"
      }
    },
    {
      "token": "color-text-link",
      "value": {
        "resolved": "#45A3FE",
        "reference": "color.blue.skycicle.400"
      }
    },
    {
      "token": "color-icon-default",
      "value": {
        "resolved": "#FFFFFF",
        "reference": "color.white.mochimalist.0"
      }
    },
    {
      "token": "color-icon-subtle",
      "value": {
        "resolved": "#A5A5A5",
        "reference": "color.gray.roboflow.400"
      }
    },
    {
      "token": "color-icon-inverse",
      "value": {
        "resolved": "#111111",
        "reference": "color.black.cosmicore.900"
      }
    },
    {
      "token": "color-icon-disabled",
      "value": {
        "resolved": "#4A4A4A",
        "reference": "color.gray.roboflow.600"
      }
    },
    {
      "token": "color-icon-error",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "color-icon-success",
      "value": {
        "resolved": "#39D377",
        "reference": "color.green.matchacado.400"
      }
    },
    {
      "token": "color-icon-info",
      "value": {
        "resolved": "#75BFFF",
        "reference": "color.blue.skycicle.300"
      }
    },
    {
      "token": "color-icon-warning",
      "value": {
        "resolved": "#E18D00",
        "reference": "color.yellow.caramellow.400"
      }
    },
    {
      "token": "color-icon-recommendation",
      "value": {
        "resolved": "#B190FF",
        "reference": "color.purple.mysticool.300"
      }
    },
    {
      "token": "color-border-default",
      "value": {
        "resolved": "#CDCDCD",
        "reference": "color.gray.roboflow.300"
      }
    },
    {
      "token": "color-border-container",
      "value": {
        "resolved": "#767676",
        "reference": "color.gray.roboflow.500"
      }
    },
    {
      "token": "color-border-error",
      "value": {
        "resolved": "#F47171",
        "reference": "color.red.pushpin.300"
      }
    },
    {
      "token": "elevation-floating",
      "value": {
        "resolved": "none"
      }
    },
    {
      "token": "elevation-raised-top",
      "value": {
        "resolved": "0px 0.5px 0px 0px rgba(249, 249, 249, 0)"
      }
    },
    {
      "token": "elevation-raised-bottom",
      "value": {
        "resolved": "0px -0.5px 0px 0px rgba(249, 249, 249, 0)"
      }
    }
  ],
  "guidelines": [
    {
      "type": "purpose",
      "useCases": {
        "whenToUse": [
          {
            "description": "When the user's system preference is `prefers-color-scheme: dark` or they have explicitly selected dark mode in the application settings."
          },
          {
            "description": "When the application is used in low-light environments where a bright screen causes eye strain or discomfort."
          },
          {
            "description": "When embedding content in a context that is already dark (e.g., a media player, a code editor, or a presentation tool in dark mode)."
          }
        ],
        "whenNotToUse": [
          {
            "description": "When the user has not expressed a preference for dark mode. Default to the light theme.",
            "alternative": {
              "name": "light",
              "rationale": "Dark mode can reduce readability for users with certain visual impairments such as astigmatism, where light text on dark backgrounds causes halation. Defaulting to light ensures the broadest accessibility baseline."
            }
          },
          {
            "description": "When high-contrast accessibility is the primary concern rather than a dark aesthetic.",
            "alternative": {
              "name": "high-contrast",
              "rationale": "The dark theme is optimized for comfort in low-light environments, not maximum contrast. The high-contrast theme provides stronger contrast ratios that better serve users with low vision."
            }
          },
          {
            "description": "When the content is primarily photographic or illustrative and the surrounding chrome should not compete visually.",
            "alternative": {
              "name": "light",
              "rationale": "Photographic content often assumes a neutral white surround for accurate color perception. A dark surround shifts the viewer's perception of brightness and color in the images."
            }
          }
        ]
      }
    },
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "Apply the dark theme at the application root when the user's system preference is `prefers-color-scheme: dark` or when they explicitly select dark mode in the application settings.",
          "rationale": "Respecting the user's color scheme preference improves comfort in low-light environments and can reduce eye strain. Forcing a color mode against the user's preference creates friction.",
          "level": "required",
          "category": "development"
        },
        {
          "guidance": "In dark mode, layers become one step lighter with each added layer. Do not apply components that are darker than their background surface.",
          "rationale": "The dark theme's layering model uses increasing lightness to communicate depth. Reversing this — placing darker elements on lighter surfaces — breaks the spatial hierarchy and confuses the visual relationship between layers.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Do not mix light-mode and dark-mode semantic tokens on the same surface. Use inline theme switching if a component must appear in the opposite mode.",
          "rationale": "Mixing tokens from different themes produces unpredictable contrast pairings. Semantic tokens are only validated for contrast within their own theme context.",
          "level": "prohibited",
          "category": "visual-design"
        },
        {
          "guidance": "Shadows (elevation tokens) are replaced with surface color differentiation in dark mode. Do not add custom box-shadow values to create depth.",
          "rationale": "Dark backgrounds absorb shadow, making traditional drop shadows invisible or visually muddy. The dark theme communicates depth through lighter surface values instead.",
          "level": "discouraged",
          "category": "visual-design"
        },
        {
          "guidance": "Ensure all custom illustrations, charts, and images remain legible in dark mode. Provide dark-mode variants of images that use light backgrounds or thin strokes.",
          "rationale": "Illustrations designed for light backgrounds may become invisible or illegible on dark surfaces. Custom visual content requires the same level of dark-mode adaptation as UI components.",
          "level": "encouraged",
          "category": "visual-design"
        }
      ]
    },
    {
      "type": "accessibility",
      "wcagLevel": "AA",
      "colorContrast": [
        {
          "foreground": "color-text-default",
          "background": "color-background-default",
          "contrastRatio": 15.9,
          "level": "AAA",
          "context": "Primary text (#FFFFFF) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-subtle",
          "background": "color-background-default",
          "contrastRatio": 4.6,
          "level": "AA",
          "context": "Secondary/subtle text (#A5A5A5) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-link",
          "background": "color-background-default",
          "contrastRatio": 5.7,
          "level": "AA",
          "context": "Link text (#45A3FE) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-error",
          "background": "color-background-default",
          "contrastRatio": 5.1,
          "level": "AA",
          "context": "Error text (#F47171) on default dark background (#111111)."
        },
        {
          "foreground": "color-text-default",
          "background": "color-background-elevation-accent",
          "contrastRatio": 14.4,
          "level": "AAA",
          "context": "Primary text (#FFFFFF) on accent surface (#191919)."
        },
        {
          "foreground": "color-text-default",
          "background": "color-background-elevation-floating",
          "contrastRatio": 11.3,
          "level": "AAA",
          "context": "Primary text (#FFFFFF) on floating surface (#2B2B2B)."
        }
      ]
    }
  ],
  "links": [
    {
      "type": "design",
      "url": "https://www.figma.com/file/abc123/color-system?node-id=100:200",
      "label": "Figma — Dark mode variable collection"
    },
    {
      "type": "documentation",
      "url": "https://design.example.com/foundations/color/dark-mode",
      "label": "Dark mode usage guidelines"
    },
    {
      "type": "source",
      "url": "https://github.com/example/design-system/blob/main/tokens/themes/dark.tokens.json",
      "label": "Dark theme token source (DTCG format)"
    }
  ],
  "$extensions": {
    "com.designTool": {
      "variableCollectionId": "VariableCollectionId:dark-mode"
    }
  }
}
```
<!-- /dsds:include -->

---

## 5. Style

**Schema:** `entities/style.schema.json`
**Type discriminator:** `"style"`
**Guideline scope:** Style-scoped guidelines (principles, scale) and all general guidelines (best-practices, purpose, accessibility, examples, artifact-references).

A style documents a macro-level visual attribute domain — color, typography, spacing, elevation, motion, shape, or any other visual system that spans the entire design system. Where token entities document individual values and token groups organize them, style entities document the _principles_, _guidelines_, _scales_, and _usage rules_ that govern how those values are applied.

### Style-Specific Properties

Styles have no additional required properties beyond the common set. The `category` property classifies the visual attribute domain:

| Value | Description |
|---|---|
| `"color"` | Color system, palettes, semantic color usage, and color modes. |
| `"typography"` | Type hierarchy, font families, type scales, and typographic rules. |
| `"spacing"` | Spatial system, spacing scale, and layout rhythm. |
| `"elevation"` | Shadows, layering, z-index strategy, and depth. |
| `"motion"` | Animation timing, easing curves, transition patterns, and reduced-motion considerations. |
| `"shape"` | Border radius, corner treatments, and geometric conventions. |

Custom categories are permitted and _SHOULD_ be lowercase kebab-case.

### Typical Guidelines Order

1. **examples** — Hero previews showing the style system in action.
2. **principles** — High-level guiding beliefs that shape decision-making.
3. **artifact-references** — References to the token groups that implement this style.
4. **scale** — Ordered scales defining the progression of values (spacing scale, type scale, elevation levels).
5. **purpose** — When to use this style vs. raw tokens or a different style category.
6. **best-practices** — Actionable rules for applying the style correctly.
7. **accessibility** — Accessibility considerations specific to this visual domain.

### Styles vs. Token Groups

| Concern | Belongs in Style | Belongs in Token Group |
|---|---|---|
| Why three levels of text emphasis? | ✓ | |
| What is the hex value of `color-text-primary`? | | ✓ |
| How does the spacing scale progress? | ✓ | |
| What CSS custom property maps to `space-4`? | | ✓ |
| When should I use the type scale vs. a custom size? | ✓ | |
| Which tokens alias `color-text-primary`? | | ✓ |

### Example

<!-- dsds:include spec/examples/entities/style.json#/style -->
```json
{
  "type": "style",
  "name": "spacing",
  "displayName": "Spacing",
  "description": "A spatial system built on a 4px base unit. Defines the scale and rules for all whitespace, padding, margin, and gap values across the system. Eliminates ad hoc pixel values and reduces visual inconsistency caused by individual interpretation of spatial relationships.",
  "status": {
    "status": "stable"
  },
  "since": "1.0.0",
  "category": "spacing",
  "summary": "A constrained spacing scale built on a 4px base unit.",
  "tags": [
    "layout",
    "spatial",
    "whitespace",
    "padding",
    "margin",
    "gap"
  ],
  "guidelines": [
    {
      "type": "principles",
      "items": [
        {
          "title": "Use the scale",
          "description": "Every spacing value must reference a token from the spacing scale. No hard-coded values."
        },
        {
          "title": "Density over decoration",
          "description": "Spacing exists to create clear relationships between elements, not to fill empty areas."
        },
        {
          "title": "Consistent internal, flexible external",
          "description": "Internal spacing within a component is fixed by the component's design specification. External spacing between components is determined by the layout context."
        }
      ]
    },
    {
      "type": "scale",
      "name": "spacing-scale",
      "displayName": "Spacing Scale",
      "description": "A geometric spacing scale based on a 4px unit.",
      "steps": [
        {
          "token": "space-0",
          "label": "0",
          "value": "0px"
        },
        {
          "token": "space-1",
          "label": "4xs",
          "value": "2px"
        },
        {
          "token": "space-2",
          "label": "3xs",
          "value": "4px"
        },
        {
          "token": "space-3",
          "label": "2xs",
          "value": "8px"
        },
        {
          "token": "space-4",
          "label": "xs",
          "value": "12px"
        },
        {
          "token": "space-5",
          "label": "sm",
          "value": "16px"
        },
        {
          "token": "space-6",
          "label": "md",
          "value": "24px"
        },
        {
          "token": "space-7",
          "label": "lg",
          "value": "32px"
        },
        {
          "token": "space-8",
          "label": "xl",
          "value": "48px"
        }
      ]
    },
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "Use the spacing scale tokens for all padding, margin, and gap properties. Do not use hard-coded values.",
          "rationale": "Hard-coded values create visual inconsistency and are not responsive to system-wide spacing changes. Tokens enable global adjustment of spatial density from a single source of truth.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Components must not apply external margin. Margin between components is the responsibility of the parent layout.",
          "rationale": "Components that own their margins create unpredictable spacing when composed. A button with built-in margin-bottom behaves differently depending on what follows it. Delegating margin to layout makes spacing composable and predictable.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Select spacing based on the relationship between elements, not their size. Related elements use smaller spacing. Unrelated elements use larger spacing.",
          "rationale": "Gestalt proximity principle: objects that are closer together are perceived as related. Spacing encodes information hierarchy. A label 4px from its input is clearly associated with it. A label 32px from an input appears disconnected.",
          "level": "encouraged",
          "category": "visual-design"
        },
        {
          "guidance": "Do not use spacing tokens for non-spatial properties such as border-width, font-size, or icon-size. Use the tokens designated for those properties.",
          "rationale": "Spacing tokens are tuned for whitespace. A spacing scale step that works well as padding produces incorrect results as a border-width or icon-size. Using the wrong token category couples unrelated visual properties.",
          "level": "prohibited",
          "category": "development"
        },
        {
          "guidance": "Use CSS gap (in Flexbox or Grid) as the primary mechanism for spacing between sibling elements. Reserve margin for spacing between non-sibling elements or layout-level offset.",
          "rationale": "Gap applies spacing uniformly between children without affecting the first or last child. Margin requires :first-child/:last-child overrides to prevent unwanted space at container edges.",
          "level": "encouraged",
          "category": "development"
        },
        {
          "guidance": "For responsive layouts, reduce spacing density at smaller breakpoints by stepping down the scale. Do not introduce arbitrary breakpoint-specific values.",
          "rationale": "Stepping down the scale (e.g., space-7 at desktop becoming space-5 at mobile) maintains proportional relationships while conserving space. Arbitrary values break out of the scale and undermine system consistency.",
          "level": "encouraged",
          "category": "visual-design"
        },
        {
          "guidance": "Ensure all interactive elements maintain a minimum 44x44 CSS pixel touch target, inclusive of padding.",
          "rationale": "Users with motor impairments and touch device users require a minimum target size to interact reliably. WCAG 2.5.8 requires 24x24px minimum and recommends 44x44px. The spacing system's role is to ensure padding contributes to meeting this target.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#target-size-minimum"
          ]
        },
        {
          "guidance": "When users increase text size to 200% via browser settings, spacing must not collapse to zero or cause content to overlap.",
          "rationale": "Users with low vision enlarge text. If spacing is defined in fixed pixel units that do not scale, text enlargement causes overlap and loss of content. Use rem-based spacing tokens where possible, and test all layouts at 200% text zoom.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#resize-text"
          ]
        }
      ]
    },
    {
      "type": "purpose",
      "useCases": {
        "whenToUse": [
          {
            "description": "When defining padding, margin, or gap values for any layout or component. All spatial values in production code must reference the spacing scale."
          },
          {
            "description": "When establishing vertical rhythm between content sections, form groups, or card layouts."
          },
          {
            "description": "When setting internal padding for containers such as cards, dialogs, panels, and page regions."
          },
          {
            "description": "When controlling the gap between sibling elements in Flexbox or Grid layouts."
          }
        ],
        "whenNotToUse": [
          {
            "description": "When defining border widths, outline offsets, or stroke values.",
            "alternative": {
              "name": "border-width",
              "rationale": "Border tokens are tuned for visual weight at sub-pixel and single-pixel sizes. Spacing tokens start at 0px and jump to values optimized for whitespace, which produce incorrect visual results when applied to borders."
            }
          },
          {
            "description": "When setting font sizes or line heights.",
            "alternative": {
              "name": "typography",
              "rationale": "Typographic tokens follow a modular scale designed for readability and vertical rhythm. Spacing tokens follow a geometric scale designed for whitespace. The two scales serve different purposes and should not be interchanged."
            }
          },
          {
            "description": "When sizing icons or illustration containers.",
            "alternative": {
              "name": "icon-size",
              "rationale": "Icon size tokens are calibrated to optical alignment with adjacent text at each type scale step. Spacing tokens do not account for optical sizing and produce misaligned icons."
            }
          }
        ]
      }
    }
  ],
  "links": [
    {
      "type": "token-group",
      "name": "spacing",
      "role": "Provides all spatial tokens from space-0 (0px) through space-8 (48px), built on a 4px base unit."
    },
    {
      "type": "source",
      "url": "https://code.acme.com/design-system/src/tokens/spacing.tokens.json",
      "label": "Token source file"
    },
    {
      "type": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=200:1",
      "label": "Design file — spacing variables"
    },
    {
      "type": "documentation",
      "url": "https://design.acme.com/style/spacing",
      "label": "Documentation site"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/style/typography",
      "label": "Typography style"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/components/stack",
      "label": "Stack component"
    }
  ]
}
```
<!-- /dsds:include -->

---

## 6. Pattern

**Schema:** `entities/pattern.schema.json`
**Type discriminator:** `"pattern"`
**Guideline scope:** Pattern-scoped guidelines (interactions) and all general guidelines (best-practices, purpose, accessibility, examples, artifact-references).

A pattern documents a broad interaction pattern — a recurring, multi-component solution to a common UX problem such as error messaging, navigation, form validation, empty states, loading sequences, or onboarding flows. Where component entities document individual UI elements, pattern entities document how those elements are composed to address a user need.

### Pattern-Specific Properties

Patterns have no additional required properties beyond the common set. The `category` property classifies the interaction problem:

| Value | Description |
|---|---|
| `"feedback"` | Communicating system status, errors, success, and warnings to the user. |
| `"navigation"` | Moving between views, sections, or pages within an application. |
| `"data-entry"` | Collecting input from the user — forms, search, filters, inline editing. |
| `"disclosure"` | Revealing and hiding content — accordions, drawers, modals, tooltips. |
| `"onboarding"` | Introducing the user to features, flows, or concepts on first use. |
| `"layout"` | Organizing content across screen sizes and contexts — responsive patterns, master-detail, dashboards. |
| `"selection"` | Choosing one or more items from a set — single select, multi-select, transfer lists. |
| `"loading"` | Communicating progress and managing user expectations during asynchronous operations. |

Custom categories are permitted and _SHOULD_ be lowercase kebab-case.

### Typical Guidelines Order

1. **examples** — Hero demonstrations showing the complete pattern in context (videos and interactive demos are particularly effective).
2. **artifact-references** — The components that participate in this pattern, with their roles (e.g., form-field, alert, toast, button for an error messaging pattern).
3. **interactions** — The ordered flow of the pattern from trigger through resolution.
4. **purpose** — When to use this pattern and when to choose a different one.
5. **best-practices** — Actionable rules for implementing the pattern correctly.
6. **accessibility** — Keyboard interactions, screen reader behavior, focus management, and other a11y considerations specific to the pattern's flow.

### Patterns vs. Components

| Concern | Belongs in Pattern | Belongs in Component |
|---|---|---|
| How do these components work together to handle errors? | ✓ | |
| What are the props of the Alert component? | | ✓ |
| What triggers the error summary to appear? | ✓ | |
| What ARIA attributes does a form field need? | | ✓ |
| What order should error recovery steps happen in? | ✓ | |
| What visual variants does the Toast component have? | | ✓ |
| Which components are required vs. optional for this flow? | ✓ | |
| How does focus move when the error summary appears? | ✓ | |

### Example

<!-- dsds:include spec/examples/entities/pattern.json#/pattern -->
```json
{
  "type": "pattern",
  "name": "error-messaging",
  "displayName": "Error Messaging",
  "summary": "A pattern for communicating errors through inline validation, summary banners, and toast notifications.",
  "description": "Defines how errors are surfaced across the system — from inline field validation on forms to page-level error summaries and transient toast notifications. The pattern covers the lifecycle of an error from detection through resolution, ensuring that errors are perceivable, understandable, and actionable for all users including those relying on assistive technology.",
  "status": {
    "status": "stable",
    "platformStatus": {
      "react": {
        "status": "stable",
        "since": "2.0.0"
      },
      "web-component": {
        "status": "experimental",
        "since": "3.0.0",
        "description": "Partial implementation — inline validation works, error summary not yet available."
      },
      "figma": {
        "status": "stable",
        "since": "2.0.0"
      }
    }
  },
  "since": "2.0.0",
  "tags": [
    "feedback",
    "validation",
    "forms",
    "errors",
    "accessibility"
  ],
  "category": "feedback",
  "guidelines": [
    {
      "type": "examples",
      "items": [
        {
          "title": "Complete form validation flow",
          "description": "Demonstrates the full error messaging pattern from form submission through error correction and re-submission.",
          "presentation": {
            "type": "video",
            "url": "https://design.acme.com/assets/patterns/error-messaging-full-flow.mp4",
            "alt": "A user fills out a registration form and clicks Submit. Three fields highlight in red with inline error messages. An error summary appears at the top listing all three errors. The user clicks the first error link and focus moves to the email field. They correct the value, the inline error disappears, and the summary updates to show two remaining errors. After correcting all fields, the summary disappears and the form submits successfully."
          }
        },
        {
          "title": "Error summary with anchor links",
          "presentation": {
            "type": "url",
            "url": "https://storybook.acme.com/?path=/story/patterns-error-messaging--summary"
          }
        },
        {
          "title": "Inline validation on blur",
          "presentation": {
            "type": "url",
            "url": "https://storybook.acme.com/?path=/story/patterns-error-messaging--inline-validation"
          }
        }
      ]
    },
    {
      "type": "interactions",
      "items": [
        {
          "trigger": "User submits the form by activating the submit button.",
          "description": "Client-side validation runs on all required fields. If one or more fields are invalid, submission is prevented and the error state is activated.",
          "components": [
            "button",
            "form-field"
          ]
        },
        {
          "trigger": "Client-side validation detects one or more invalid fields.",
          "description": "Each invalid field displays an inline error message directly below the input. The message describes what is wrong and, where possible, how to fix it. The field's border changes to the error color and an error icon appears to the left of the message text.",
          "components": [
            "form-field",
            "icon"
          ],
          "examples": [
            {
              "title": "Inline validation on a required email field",
              "presentation": {
                "type": "image",
                "url": "https://design.acme.com/assets/patterns/error-inline-email.png",
                "alt": "An email input field with a red border. Below the field, a red error icon followed by the text 'Enter a valid email address' in the error text color."
              }
            },
            {
              "title": "JSX — form field with error state",
              "presentation": {
                "type": "code",
                "language": "jsx",
                "code": "<FormField\n  label=\"Email address\"\n  error=\"Enter a valid email address.\"\n  required\n>\n  <Input type=\"email\" value={email} onChange={setEmail} />\n</FormField>"
              }
            }
          ]
        },
        {
          "trigger": "Two or more fields fail validation simultaneously.",
          "description": "An error summary alert appears at the top of the form. The summary lists every current error as an anchor link. Each link, when activated, moves focus to the corresponding invalid field. Focus is programmatically moved to the error summary so screen reader users are immediately aware of it.",
          "components": [
            "alert",
            "link",
            "form-field"
          ],
          "examples": [
            {
              "title": "Error summary banner with anchor links",
              "presentation": {
                "type": "image",
                "url": "https://design.acme.com/assets/patterns/error-summary-banner.png",
                "alt": "A red-bordered alert at the top of a form titled 'There are 3 errors in this form'. Below the title are three bulleted links: 'Enter a valid email address', 'Password must be at least 8 characters', and 'Agree to the terms of service'. Each link text matches the inline error on the corresponding field."
              }
            }
          ]
        },
        {
          "trigger": "User corrects an invalid field and moves focus away (blur) or types a valid value.",
          "description": "The inline error message for that field is removed. The field border returns to its default color. If an error summary is visible, the corresponding entry is removed from the summary. When all errors are resolved, the summary is removed entirely.",
          "components": [
            "form-field",
            "alert"
          ]
        },
        {
          "trigger": "Form submission succeeds on the client but fails on the server (e.g., 422, 500, network timeout).",
          "description": "A toast notification appears communicating the server error. The toast uses the error variant and includes a brief description of the problem and, if actionable, a retry button. If the server returns field-level validation errors (422), those are mapped back to inline field errors using the same pattern as client-side validation.",
          "components": [
            "toast",
            "form-field",
            "button"
          ],
          "examples": [
            {
              "title": "Toast for a network timeout",
              "presentation": {
                "type": "image",
                "url": "https://design.acme.com/assets/patterns/error-toast-timeout.png",
                "alt": "A toast notification in the bottom-right corner of the screen with a red left border. The text reads 'Unable to save. Check your connection and try again.' A 'Retry' button appears to the right of the text."
              }
            }
          ]
        }
      ]
    },
    {
      "type": "purpose",
      "useCases": {
        "whenToUse": [
          {
            "description": "When a user submits a form and one or more fields fail validation — whether client-side or server-side."
          },
          {
            "description": "When an asynchronous operation fails and the user needs to be informed (e.g., save failed, API error, network timeout)."
          },
          {
            "description": "When the user needs to correct input before proceeding, such as during account creation, checkout, or settings changes."
          }
        ],
        "whenNotToUse": [
          {
            "description": "When the feedback is a successful outcome (e.g., 'Changes saved', 'Account created').",
            "alternative": {
              "name": "success-messaging",
              "rationale": "Success feedback uses the success color and icon. Reusing the error pattern for positive outcomes confuses the visual language and dilutes the urgency of actual errors."
            }
          },
          {
            "description": "When the feedback is an informational or warning message that does not block the user from proceeding.",
            "alternative": {
              "name": "notification-messaging",
              "rationale": "Informational messages use a neutral or warning color. Treating them as errors creates false urgency and trains users to ignore error styling."
            }
          },
          {
            "description": "When the entire page or view fails to load (e.g., 404, 503).",
            "alternative": {
              "name": "empty-state",
              "rationale": "Full-page failures are better handled by empty state patterns that replace the entire content area with an explanation and recovery action, rather than overlaying error messages on a non-functional page."
            }
          }
        ]
      }
    },
    {
      "type": "best-practices",
      "items": [
        {
          "guidance": "Always display inline errors directly below the invalid field, not in a separate location or only in the summary.",
          "rationale": "Users scan forms top-to-bottom. An error placed away from its field forces the user to map the message to the field mentally. Proximity eliminates that cognitive load.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Error messages must describe the problem and, when possible, suggest how to fix it.",
          "rationale": "A message like 'Invalid input' forces the user to guess what went wrong. A message like 'Enter a date in MM/DD/YYYY format' removes ambiguity and speeds correction.",
          "level": "required",
          "category": "content"
        },
        {
          "guidance": "When two or more fields have errors, display an error summary at the top of the form in addition to inline messages.",
          "rationale": "Users on long forms may not see all inline errors, especially those below the fold. The summary provides a single scannable list of everything that needs attention.",
          "level": "required",
          "category": "visual-design"
        },
        {
          "guidance": "Each entry in the error summary must link to the corresponding invalid field.",
          "rationale": "Keyboard and screen reader users need a way to navigate directly from the summary to the problematic field without tabbing through the entire form.",
          "level": "required",
          "category": "interaction"
        },
        {
          "guidance": "Move focus to the error summary when it appears.",
          "rationale": "Screen reader users will not discover the summary unless focus is moved to it. Sighted keyboard users benefit from the same behavior — their next Tab press lands them in the summary's link list.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#error-identification"
          ]
        },
        {
          "guidance": "Do not clear the form or reset field values when validation fails.",
          "rationale": "Clearing the form destroys the user's work. They must re-enter all data, including fields that were valid. This is hostile to all users and catastrophic for users with motor impairments who rely on slow, deliberate input.",
          "level": "prohibited",
          "category": "interaction"
        },
        {
          "guidance": "Use real-time inline validation only for fields where the constraint is unambiguous and immediate feedback is helpful (e.g., password strength, email format). Do not validate on every keystroke for fields that require the user to finish typing.",
          "rationale": "Premature validation interrupts the user. Showing 'Invalid email' while the user is still typing 'j' is noise. Wait for a blur event or a pause in typing.",
          "level": "encouraged",
          "category": "interaction"
        },
        {
          "guidance": "Pair every inline error message with an error icon. Do not rely on color alone.",
          "rationale": "Approximately 8% of men have some form of color vision deficiency. An icon provides a second, non-color signal that the field is in an error state. WCAG 1.4.1 requires that color is not the sole means of conveying information.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#use-of-color"
          ]
        },
        {
          "guidance": "Each inline error message must be programmatically associated with its field using aria-describedby.",
          "rationale": "Screen readers announce aria-describedby content when the field receives focus. Without it, the user hears the field label but not the error, and has no way to know the field is invalid.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#error-identification",
            "https://www.w3.org/TR/WCAG22/#info-and-relationships"
          ]
        },
        {
          "guidance": "Invalid fields must be marked with aria-invalid=\"true\".",
          "rationale": "The aria-invalid attribute allows screen readers to announce that a field's value is not accepted. It is the standard mechanism for communicating validation state in ARIA.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#error-identification"
          ]
        },
        {
          "guidance": "The error summary must use role=\"alert\" or be injected into an aria-live=\"assertive\" region so that screen readers announce it immediately when it appears.",
          "rationale": "Without a live region, screen readers will not announce dynamically injected content. The user will not know the summary exists unless they navigate to it manually.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#status-messages"
          ]
        },
        {
          "guidance": "Error summary anchor links must move focus to the corresponding field, not just scroll to it.",
          "rationale": "Keyboard users rely on focus position to interact. Scrolling without moving focus leaves the keyboard cursor at the summary, requiring the user to Tab through potentially many elements to reach the field.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#focus-order"
          ]
        },
        {
          "guidance": "Toast notifications for errors must persist until the user dismisses them or the error is resolved. Do not auto-dismiss error toasts.",
          "rationale": "Users with cognitive disabilities or screen reader users may need more time to read and understand the error. Auto-dismissing the toast removes the information before they can act on it.",
          "level": "required",
          "category": "accessibility",
          "criteria": [
            "https://www.w3.org/TR/WCAG22/#timing-adjustable"
          ]
        }
      ]
    },
    {
      "type": "accessibility",
      "wcagLevel": "AA",
      "keyboardInteraction": [
        {
          "key": "Tab",
          "action": "Moves focus to the next focusable element. When the error summary is visible, focus moves into the summary's link list."
        },
        {
          "key": "Enter",
          "action": "Activates a link in the error summary, moving focus to the corresponding invalid field."
        },
        {
          "key": "Escape",
          "action": "Dismisses the toast notification, if one is visible."
        }
      ],
      "screenReaderBehavior": "When validation fails, the error summary is announced immediately via aria-live='assertive'. Each summary link is announced as 'link, [error text]'. When an invalid field receives focus, the screen reader announces '[label], edit text, invalid entry, [error message]'.",
      "focusManagement": "On validation failure, focus moves to the error summary. Activating a summary link moves focus to the corresponding field. When a field error is resolved, focus remains on the field. When all errors are resolved and the summary is removed, focus is not moved — the user continues from their current position."
    }
  ],
  "links": [
    {
      "type": "component",
      "name": "form-field",
      "role": "Container for individual inputs. Displays inline validation messages directly below the field when validation fails.",
      "required": true
    },
    {
      "type": "component",
      "name": "alert",
      "role": "Page-level error summary. Appears at the top of the form or page listing all current errors with anchor links to each invalid field.",
      "required": true
    },
    {
      "type": "component",
      "name": "toast",
      "role": "Transient notification for server-side or asynchronous errors that cannot be tied to a specific field (e.g., network failure, timeout)"
    },
    {
      "type": "component",
      "name": "icon",
      "role": "Visual error indicator displayed alongside inline validation text and inside the error summary. Provides a non-color signal that reinforces the error state.",
      "required": true
    },
    {
      "type": "component",
      "name": "button",
      "role": "Submit trigger for the form. Initiates client-side validation before submission.",
      "required": true
    },
    {
      "type": "component",
      "name": "link",
      "role": "Anchor links within the error summary that navigate the user to the corresponding invalid field.",
      "required": true
    },
    {
      "type": "design",
      "url": "https://design-tool.acme.com/file/abc123?node-id=3000:1",
      "label": "Design file — error messaging pattern"
    },
    {
      "type": "storybook",
      "url": "https://storybook.acme.com/?path=/docs/patterns-error-messaging--docs",
      "label": "Storybook pattern docs"
    },
    {
      "type": "documentation",
      "url": "https://design.acme.com/patterns/error-messaging",
      "label": "Documentation site"
    },
    {
      "type": "alternative",
      "url": "https://design.acme.com/patterns/success-messaging",
      "label": "success-messaging (pattern)"
    },
    {
      "type": "alternative",
      "url": "https://design.acme.com/patterns/notification-messaging",
      "label": "notification-messaging (pattern)"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/patterns/empty-state",
      "label": "empty-state (pattern)"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/components/form-field",
      "label": "form-field (component)"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/components/alert",
      "label": "alert (component)"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/components/toast",
      "label": "toast (component)"
    },
    {
      "type": "related",
      "url": "https://design.acme.com/tokens/color-text-error",
      "label": "color-text-error (token)"
    }
  ],
  "$extensions": {
    "com.designTool": {
      "patternId": "pattern-error-messaging-001"
    }
  }
}
```
<!-- /dsds:include -->

---

*See [Guidelines Module](guidelines.md) for the full reference of guideline types available on each entity, and [Common Module](common.md) for shared primitives used across all entities.*