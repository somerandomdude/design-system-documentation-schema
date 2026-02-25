# DSDS Guidelines Module

**Part of the [Design System Documentation Standard (DSDS) 0.1](../dsds-spec.md)**

This module defines the unified guideline system — the fundamental unit of structured documentation in DSDS. Every piece of documentation attached to an entity is a guideline object with a `type` discriminator. Guidelines are typed containers that hold arrays of atomic items, following the same pattern established by anatomy (which has `parts`) and purpose (which has `whenToUse`/`whenNotToUse`).

---

## 1. Overview

All structured documentation in DSDS lives in the `guidelines` array on each entity. Each guideline is a JSON object with a required `type` property that determines its shape. Different entity types accept different subsets of guideline types through **scoped unions** — this ensures that component-specific documentation (like anatomy or API specs) cannot accidentally be attached to a style or token.

### 1.1 Scoped Guideline Unions

**Schema:** `guidelines/guideline.schema.json`

| Scope | Used by | Accepts |
|---|---|---|
| **Component** | component | anatomy, api, variants, states, design-specifications + general |
| **Style** | style | principles, scale + general |
| **Pattern** | pattern | interactions + general |
| **Token** | token, token-group, theme | general only |

**General** (available on all entity types): best-practices, purpose, accessibility, examples, artifact-references.

### 1.2 Naming Convention

Guideline type values follow two naming patterns based on their structural role:

- **Plural names** for guideline types that wrap a homogeneous list of items in an `items` array: `"best-practices"`, `"variants"`, `"states"`, `"principles"`, `"interactions"`, `"examples"`.
- **Singular names** for guideline types that are self-contained named entities with their own internal structure: `"scale"` (has `name`, `steps`), `"anatomy"` (has `parts`), `"api"` (has `properties`, `events`, etc.), `"accessibility"` (has `keyboardInteraction`, `ariaAttributes`, etc.), `"design-specifications"` (has `tokens`, `spacing`, etc.), `"artifact-reference"` (has `referenceType`, `references`), `"purpose"` (has `whenToUse`, `whenNotToUse`).

The distinction: plural types are containers of interchangeable items where the container itself has no identity beyond its type. Singular types have meaningful internal structure where the properties are named and semantically distinct (not a flat list).

---

## 2. General Guidelines

These guideline types are available on **all** entity types.

### 2.1 Best Practices (`best-practices`)

**Schema:** `guidelines/best-practice.schema.json`
**Type value:** `"best-practices"`
**Container property:** `items`
**Item type:** `bestPracticeEntry`

Documents actionable usage rules for an artifact. Each item is a self-contained rule pairing an actionable guidance statement with a rationale explaining why. Best practices tell the reader _how_ to use the artifact correctly after they have chosen it. For guidance on _whether_ to use the artifact at all, see [purpose](#23-purpose-purpose).

#### Best Practice Entry


#### 2.1.1 Enforcement Levels

The optional `entryType` property classifies how strictly a best practice should be followed. Values align with RFC 2119 requirement levels:


#### 2.1.2 Writing Best Practices (Non-normative)

_This section is non-normative._

- **Be specific.** "Limit each surface to one primary button" is better than "Use primary buttons sparingly."
- **State what to do, not just what not to do.** If a "don't" is necessary, pair it with a "do this instead."
- **Write for action.** The reader is trying to build something right now. Help them do it.
- **Include the why.** Every `rationale` should be a real reason — not a restatement of the guidance.
- **Use simple language.** A junior developer or a non-native English speaker should be able to understand every best practice.
- **Keep it self-contained.** A reader should understand a single best practice without reading the entire document.

---

### 2.2 Examples (`examples`)

**Schema:** `common/example.schema.json` (the `examples` container def)
**Type value:** `"examples"`
**Container property:** `items`
**Item type:** `example` (from common)

Documents visual or interactive demonstrations of an artifact. Each item is a single demonstration — a static image, a video recording, a code snippet, or a URL to a live demo. Multiple items allow different representations: a static screenshot alongside an interactive Storybook embed, code examples in multiple frameworks, or a sequence of annotated diagrams.

See [Common Module §4](common.md#4-examples-example-examples) for the full example and presentation type reference.

---

### 2.3 Purpose (`purpose`)

**Schema:** `guidelines/purpose.schema.json`
**Type value:** `"purpose"`
**Container properties:** `whenToUse`, `whenNotToUse`
**Item type:** `useCase` (from `common/usecase.schema.json`)

Documents what an artifact is used for — the concrete scenarios in which it is the right choice and the scenarios in which a different artifact would be more appropriate. Purpose guidelines help the reader decide _whether_ to reach for this artifact before they start implementing it. For guidance on _how_ to use the artifact correctly after choosing it, see [best-practices](#21-best-practices-best-practices).


See [Common Module §7](common.md#7-use-cases-usecase-usecases) for the full use case and alternative reference.

---

### 2.4 Accessibility (`accessibility`)

**Schema:** `guidelines/accessibility.schema.json`
**Type value:** `"accessibility"`

Documents structured accessibility specifications for an artifact — keyboard interactions, ARIA attributes, screen reader behavior, focus management, color contrast pairs, and motion considerations. This guideline type captures machine-readable a11y data. For actionable accessibility _rules_ with rationale (e.g., "Provide an aria-label for icon-only buttons"), use a best-practice entry with `category: "accessibility"` instead.


---

### 2.5 Artifact Reference (`artifact-reference`)

**Schema:** `guidelines/artifact-reference.schema.json`
**Type value:** `"artifact-reference"`
**Container property:** `references`
**Item type:** `artifactReferenceEntry`

Documents relationships between the current entity and other entities in the system. Used by patterns to list participating components (with their roles), by styles to reference implementing token groups, and by any entity that needs to express typed relationships to other DSDS entities.


---

## 3. Component-Scoped Guidelines

These guideline types are only accepted on **component** entities.

### 3.1 Anatomy (`anatomy`)

**Schema:** `guidelines/anatomy.schema.json`
**Type value:** `"anatomy"`
**Container property:** `parts`
**Item type:** `anatomyEntry`

Documents the visual structure of a component by enumerating its named sub-elements. Each part references the design tokens that style it, creating a bridge between the component's visual design and its token architecture.


#### Anatomy Entry


---

### 3.2 API (`api`)

**Schema:** `guidelines/api.schema.json`
**Type value:** `"api"`

Documents the code-level interface of a component on a single platform. For multi-platform components (e.g., React + Web Component + Vue), include one API guideline per platform and set the `platform` property.


---

### 3.3 Variants (`variants`)

**Schema:** `guidelines/variant.schema.json`
**Type value:** `"variants"`
**Container property:** `items`
**Item type:** `variantEntry`

Documents all dimensions of visual or behavioral variation on a component. Each item represents a single axis of configuration — a Button might have an "emphasis" axis (primary/secondary/ghost/danger), a "size" axis (small/medium/large), and a "full-width" axis (a single boolean value). Multiple axes document orthogonal dimensions that can be combined independently.

#### Variant Entry


---

### 3.4 States (`states`)

**Schema:** `guidelines/state.schema.json`
**Type value:** `"states"`
**Container property:** `items`
**Item type:** `stateEntry`

Documents all interactive states of a component — hover, focus, active, disabled, loading, selected, error, etc. Each item describes what triggers the state, how appearance and behavior change, which design tokens are overridden, and optional visual previews.

#### State Entry


---

### 3.5 Design Specifications (`design-specifications`)

**Schema:** `guidelines/design-specifications.schema.json`
**Type value:** `"design-specifications"`

Documents the measurable visual specifications of a component — the design tokens it consumes, spacing relationships, dimension constraints, typography settings, and responsive behavior. At least one content section (tokens, spacing, sizing, typography, or responsive) must be present.


---

## 4. Style-Scoped Guidelines

These guideline types are only accepted on **style** entities.

### 4.1 Principles (`principles`)

**Schema:** `guidelines/principle.schema.json`
**Type value:** `"principles"`
**Container property:** `items`
**Item type:** `principleEntry`

Documents the high-level guiding principles that shape decision-making for a visual style or design domain. Principles answer "what do we believe?" and "what constraints do we accept?" — they sit above individual best practices and inform the entire approach to a domain.

#### Principle Entry


---

### 4.2 Scale (`scale`)

**Schema:** `guidelines/scale.schema.json`
**Type value:** `"scale"`
**Container property:** `steps`
**Item type:** `scaleStep`

Documents an ordered sequence of values that forms a visual scale — a type scale, spacing scale, elevation scale, or any other progression of design token values. Each step references a design token. The ordering is significant — steps are listed from smallest/lowest to largest/highest.


#### Scale Step


---

## 5. Pattern-Scoped Guidelines

These guideline types are only accepted on **pattern** entities.

### 5.1 Interactions (`interactions`)

**Schema:** `guidelines/interaction.schema.json`
**Type value:** `"interactions"`
**Container property:** `items`
**Item type:** `interactionEntry`

Documents the interaction flow of a pattern as an ordered sequence of steps. Each item describes a single step — what triggers it, what the system does in response, which components are involved, and optional examples. The ordering of items is critical: it represents the chronological flow of the user journey.

Authors _SHOULD_ include steps for:
- The initial trigger (e.g., user action, system event)
- The system's response (what changes on screen)
- Recovery or correction steps (how the user gets back to a good state)
- Completion (what indicates the pattern has concluded)

#### Interaction Entry


---

## 6. Guideline Type Summary

| Type value | Container property | Item type | Scope | Description |
|---|---|---|---|---|
| `"best-practices"` | `items` | bestPracticeEntry | General | Actionable usage rules with rationale and enforcement levels. |
| `"purpose"` | `whenToUse`, `whenNotToUse` | useCase | General | Scenario-driven guidance for when to use and when not to use an artifact. |
| `"accessibility"` | Named arrays | various | General | Structured a11y specs — keyboard, ARIA, screen reader, contrast, motion. |
| `"examples"` | `items` | example | General | Visual/interactive demonstrations — images, videos, code, URLs. |
| `"artifact-reference"` | `references` | artifactReferenceEntry | General | Named references to other DSDS entities with roles. |
| `"anatomy"` | `parts` | anatomyEntry | Component | Visual structure decomposed into named parts with token references. |
| `"api"` | Named arrays | various | Component | Code-level interface — props, events, slots, CSS hooks, methods. |
| `"variants"` | `items` | variantEntry | Component | Dimensions of visual/behavioral variation with enumerated values. |
| `"states"` | `items` | stateEntry | Component | Interactive states with triggers, token overrides, and previews. |
| `"design-specifications"` | Named properties | various | Component | Token inventory, spacing, sizing, typography, responsive behavior. |
| `"principles"` | `items` | principleEntry | Style | High-level guiding beliefs that shape decision-making. |
| `"scale"` | `steps` | scaleStep | Style | Ordered progression of token values (spacing scale, type scale, etc.). |
| `"interactions"` | `items` | interactionEntry | Pattern | Ordered steps in a pattern's interaction flow. |

---

*See [Entities Module](entities.md) for entity type documentation and [Common Module](common.md) for shared primitives (richText, statusObject, link, example, useCase, extensions, metadata).*