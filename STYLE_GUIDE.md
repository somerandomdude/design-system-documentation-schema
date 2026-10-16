# DSDS authoring style guide

How to order things inside a DSDS document, so every document reads the same way no matter who wrote it.

None of this changes whether a document is valid. The schema accepts any order. Most of this guide you never have to apply by hand: `dsds-format` puts every field in its place and groups combos. The orders that are a reading choice — entries, sections, guideline items — are only advice, and `dsds-lint` points out where a document departs from them. See [Tooling](#tooling) for which is which.

## The schema is the style guide

**Write in the order the schema lists them.** The order of fields and options in the schema reflects this guide's recommendation for how to organize a document. When in doubt, copy how the schema does it.

## The patterns behind these rules

Everything below is one of a few ideas, applied to a different part of a document. Learn these and you can usually work out the specific rule.

**Field order comes from the schema. List order comes from this guide.** Each schema follows the style guide for field order. Which entry, section, or item comes first in a list is something a schema can't express, so this guide describes it.

**Broad to specific.** The widest thing leads: `guidelines` before `steps`, `when-to-use` before `how-to-use`, `for: all` before `for: agent`.

**Nothing comes before the thing it's built on.** Tokens before the themes that override them, themes before the components that use them. Read top to bottom and you meet every idea before anything that depends on it.

**Shared fields before specific ones.** The fields every kind has come first, then the fields one kind adds. A `metadata` block works the same way.

**Catch-alls go last.** `$extensions` after every real field, the plain `section` kind after the three specific ones, custom kinds after the five known ones. Anything that exists because nothing else fit goes at the end.

**Where no rule decides, keep the order you wrote.** Don't alphabetize. Items sharing a `level`, entries sharing a kind — leave them in whatever order reads best.

---

## 1. Base documents and `shared` entries

A base document is the outermost object. Its fields go in the order seen in [`base.schema.yaml`](schema/base.schema.yaml). `shared` entries follow [`shared.schema.yaml`](schema/shared.schema.yaml).

`dsds-format` applies both, falling back to `shared.schema.yaml` for an object with no `kind`.

### Entry order, inside `entries[]`

When a base document holds several entries, order the entries themselves by `kind` (the order [`entries/entry.schema.yaml`](schema/entries/entry.schema.yaml) lists its `kind` values). This order intends to reflect the "food chain" of systems' elements.

1. **`system`:** Always first since it contextualizes everything contained within.
2. **`token`:** Defines the attributes that themes and components are created from.
3. **`theme`:** Built from tokens, so only makes sense to come after.
4. **`component`:** Built from tokens and themes.
5. **`entry`:** Always last since it can cover a broad set of topics. Onboarding and overview content that wants to be read first belongs in the `system` entry's own sections — putting an `entry` ahead of the tokens and components is what `DSDS-21` reports.

This follows the same idea as [§4](#4-sections): Broadest first, and follow the dependency chain. This _theoretically_ means that all prerequisite information is provided up front for an entry.

Within one kind, use whatever order reads best. Avoid arbitrary ordering, such as alphabetical when another order is better for comprehension. For example, a scale reads better as `compact`, `regular`, `loose` than as `compact`, `loose`, `regular`.

```yaml
entries:
  - kind: system      # id: acme-design-system   — what the document is about
  - kind: token       # id: color.action.primary
  - kind: theme       # id: light                — overrides the tokens above
  - kind: theme       # id: dark
  - kind: component   # id: button
  - kind: entry       # id: form-layout          — a pattern built from components
```

---

## 2. Entries

Follow the high-level order:

1. **Shared entry fields _except_ `$extensions`** defined in [`entries/entry.schema.yaml`](schema/entries/entry.schema.yaml).
2. **Then that kind's own fields**, defined in `entries/<kind>.schema.yaml`. A custom kind has no file of its own, so should follow the high-level guidance.
3. **Then `$extensions`.** All information that adds to the schema goes last.

`dsds-format` puts an entry's fields in this order. A field the schema doesn't declare stays right after the field it followed.

### A trait's own fields

A component's `traits` lead with `traitType`, then `kind`, then the rest of the order [`entries/component.schema.yaml`](schema/entries/component.schema.yaml) declares. `traitType` goes first because it answers the question a reader has: is this a variant the caller configures, or a state the component can be in? `kind` follows, saying whether the value is a `boolean` toggle or an `enum` with named `values`. The two are independent — `hover` is a boolean state, `size` an enum variant.

`dsds-format` applies this, along with the field order of each value inside an `enum` trait. It reads both orders out of `entries/component.schema.yaml` at runtime, so this guide holds no second copy of either.

---

## 3. `metadata`

A `metadata` block joins two lists the same way an entry does: the fields every entry's metadata shares, from [`metadata/metadata.schema.yaml`](schema/metadata/metadata.schema.yaml), then the ones for that kind of entry, from [`metadata/entry-metadata.schema.yaml`](schema/metadata/entry-metadata.schema.yaml) or [`metadata/system-metadata.schema.yaml`](schema/metadata/system-metadata.schema.yaml), then `$extensions` last. All `metadata` types work the same way.

---

## 4. Sections

### A section's own fields

A section leads with the fields that say what it is: `kind`, then `for`, then the one field its kind adds — `framing` for `guidelines`, `ordered` for `steps`. The rest follow in the order [`sections/section.schema.yaml`](schema/sections/section.schema.yaml) lists them.

That's the same reason the identifying field leads everywhere. On an entry or a section that field is `kind`. On a component trait it's `traitType`, because there `kind` only says whether the value is a boolean or an enum, not what sort of trait you're reading. Either way the field tells a reader what they're looking at before they read any of it, so it sits at the top where the reader already is.

### Keep each kind together

If an entry has more than one section, **put all the sections of the same kind side by side** — every `guidelines` section in a row, then every `definitions` section, then every `steps` section, then any plain `section`. Don't mix them up: `guidelines`, `definitions`, `guidelines` is wrong, even if that's the order you thought of them in.

### Kind order: broadest first

Order section kinds like this:

1. **`guidelines`** — the broadest question. Should I use this at all, and how do I use it properly?
2. **`definitions`** — reference material: parts, terms, a glossary. Narrower than guidelines, because it's about this entry's own parts and words. Wider than a set of steps.
3. **`steps`** — one procedure or checklist. The narrowest of the three, because it's one exact sequence rather than general advice.
4. **`section`** (the plain kind) — prose that didn't fit the other three. Last, because it's the fallback.

That's the order [`sections/section.schema.yaml`](schema/sections/section.schema.yaml) lists its `kind` values in. A namespaced custom kind like `acme.custom-section` isn't in that list, so it sorts after all four. A section with no `kind` at all is read as `section`, the default that file declares.

### Within `guidelines`: how broad, then who it's for

Guidelines sorts content by: **how broad first, who it's for second.** `for: agent`, `framing: when-to-use` still comes before a `for: all` `framing: how-to-use`, because breadth is settled first. Audience only sorts within one breadth tier — the two below.

Guidelines should lead with when to use, then describe how to use it. That's the order [`sections/guidelines.schema.yaml`](schema/sections/guidelines.schema.yaml) lists its `framing` values in:

1. **`framing: when-to-use`:** Does it make sense to use?
2. **`framing: how-to-use`:** If so, how do you use it? Leaving `framing` out means this — it's the default that file declares.

A section's `tags` say what it's about — the accessibility rules, say, or the mobile-only ones. They don't change where it sits. Within a tier, put narrow sections after general ones if that reads better; no rule checks it.

Sections in the same breadth tier are then ordered by how broad the audience is. The order [`sections/section.schema.yaml`](schema/sections/section.schema.yaml) lists its `for` values in:

1. **`for: all`** — also what you get by leaving `for` out, since it's the default that file declares. So an omitted `for` sorts first, not last.
2. **`for: human`**
3. **`for: agent`**


```yaml
sections:
  - kind: guidelines
    for: all
    framing: when-to-use
    items: [...]

  - kind: guidelines
    for: all
    items: [...]                    # framing: how-to-use (default)

  - kind: guidelines
    for: all
    title: Accessibility
    tags: [accessibility]           # says what it's about; doesn't move it
    items:                          # same tier and audience as the section
      - level: must                 # above, so it can go here, after the
        statement: Give it a name.  # general rules
        checkedBy: assisted
        tags: [accessibility]
      - level: must
        statement: Keep focus visible.
        checkedBy: assisted
        tags: [accessibility]

  - kind: guidelines
    for: agent
    items: [...]                    # same framing as above, narrower
                                    # audience — so audience breaks the tie

  - kind: definitions
    context: anatomy
    items: [...]

  - kind: steps
    title: Migration
    items: [...]
```

---

## 5. Section items

### An item's own fields

Order an item's fields the way its own schema file lists them.

| Shape | Its schema file |
|---|---|
| A `guidelines` item | [`sections/guidelines.schema.yaml`](schema/sections/guidelines.schema.yaml) |
| A `definitions` item | [`sections/definitions.schema.yaml`](schema/sections/definitions.schema.yaml) |
| A `steps` item | [`sections/steps.schema.yaml`](schema/sections/steps.schema.yaml) |

### Guideline item order, by `level`

Order items by `level`, in the order [`common/requirement-level.schema.yaml`](schema/common/requirement-level.schema.yaml) lists its values in:

```
must
should
may
should-not
must-not
```

Order items at the same level in whatever way aids comprehension. Ideally, group subject matter of the same level together. Don't alphabetize items that share a level — that's an arbitrary order dressed up as a rule.

```yaml
items:
  - level: must
    statement: Use semantic tokens instead of raw values.
  - level: should
    statement: Prefer the `primary` variant for the page's one main action.
  - level: may
    statement: Add a leading icon when it disambiguates the action.
  - level: should-not
    statement: Should not pair `loading` with `disabled` in the same interaction.
  - level: must-not
    statement: Never stack two primary-variant buttons in the same view.
```

---

## 6. Refs and combos

### Combos: by subject, then level

Combos group by: **subject first, level second.** Keep every combo for one subject together, so a reader checking one trait or token finds all of its rules in one place. Within a subject, order them by `level`, as [§5](#5-section-items) does for guideline items.

Which subject goes first is up to you — put the one that matters most where a reader will look first. Don't alphabetize, same as everywhere else.

A combo reads as one sentence: this subject, at this strength, with these things. That's the order [`common/combo.schema.yaml`](schema/common/combo.schema.yaml) lists its fields in:

1. **`subject`:** What is the rule about? A trait, a token, or an entry.
2. **`level`:** Does it permit or forbid and how strictly?
3. **`items`:** What does the rule apply to?
4. **`note`:** Why does it hold?

### Refs: what it points at, then what kind of pointer

A ref answers what it points at before what kind of pointer it is. That's the order [`common/ref.schema.yaml`](schema/common/ref.schema.yaml) lists its fields in:

1. **`to` or `href`:** What does this point at? `to` for something in this document, `href` for anything outside it. Exactly one of the two.
2. **`rel`:** What kind of pointer is it? Left out in a field named for one kind of pointer (`uses`, `extends`, `alternatives`, `evidence`, `checks`, `refines`, `replacedBy`, `specs`), where the field says it.
3. **`role`:** What does the thing being pointed at do here?
4. **`note`:** Anything else worth saying about the connection.

### Inline links: a pointer for a relationship, a link for a mention

When prose mentions another part of the system, link to it instead of writing its id in backticks. A validator checks a `dsds:` link; it can't check `` `button#variant.primary` ``.

- **`<dsds:button>`** for a named thing: an entry, a definition, a step, or a trait or value with a `name`. The text comes from the target, so it stays right after a rename.
- **`[keep the focus ring visible](dsds:shared-a11y#focus-visible)`** for a guideline, which has no short name, and anywhere the sentence needs its own words.
- **Give a link's target its own readable `id`, and don't change it.** An item without one is addressed by a slug of its text, so rewording the rule breaks every link to it. Rename by changing `name`, never `id`. A lowercase UUID remains valid as an `id`, including for item addresses. For an entry that needs a stable key alongside readable refs, prefer a readable `id` plus `metadata.uuid`; `<dsds:…>` still shows the target's `name`.
- **A link isn't a relationship.** If the entry depends on the thing it mentions, say so in `uses` too. A tool answering "what does changing this affect?" reads pointers, not prose.

This is about reading order, not field order, so `dsds-format` doesn't apply it.

---

## 7. A complete example

```yaml
kind: component
id: badge
name: Badge
description: A small status indicator, attached to another element. Draws attention to a count, state, or category without interrupting the layout it's attached to.
metadata:
  tags: [status, indicator, count]
  since: 1.2.0
  status: {status: stable}
sections:
  - kind: guidelines
    for: all
    framing: when-to-use
    items:
      - level: should
        statement: Use to surface a count or state on another element (a notification count, an unread indicator).
      - level: should-not
        statement: Do not use as a replacement for a full status message a user needs to act on.

  - kind: guidelines
    for: all
    items:
      - level: must
        statement: Keep label text to a single word or number.
        checkedBy: manual
      - level: must
        statement: Pair with an accessible label when the badge conveys meaning color alone cannot.
        checkedBy: assisted
      - level: should
        statement: Prefer the `dot` variant when the exact count isn't meaningful to the user.

  - kind: guidelines
    for: all
    title: Accessibility
    items:
      - level: must
        statement: Expose the badge's content to assistive technology even when visually decorative.
        checkedBy: assisted

  - kind: definitions
    for: all
    context: anatomy
    items:
      - term: Dot
        definition: The minimal variant with no visible label, just a colored indicator.

alternatives:
  - to: tag
refs:
  - href: https://github.com/org/ds/react/badge
    rel: source
sourceFiles:
  - platform: react
    file: ./src/Badge.tsx
specs:
  - href: ./contracts/badge.contract.json
traits:
  - traitType: variant
    kind: enum
    id: variant
    description: Which visual form the badge takes.
    values:
      - id: count
        description: Shows a numeric value.
      - id: dot
        description: Shows no value, just presence.
combos:
  - subject: variant.dot
    level: must-not
    items: [variant.count]
    note: A badge is either a dot or a count, never both at once.
```

---

## Tooling

Two tools cover this guide, split by whether the order is a fact or a choice.

- **`dsds-format` applies the orders that have one right answer.** Every field order comes from a schema file, and combos are an unordered set of rules. It moves lines and nothing else: text, comments and wrapping stay as they are, a comment moves with the field below it, and the result has to hold exactly the same data as before. `dsds-format --check` changes nothing and exits 1 if a file needs formatting, for CI. In this repo, `npm run format` runs it and `npm run check` runs the check.
- **`dsds-lint` reports the orders that are a reading choice** — entries, sections, guideline items. An author can have a reason to break them, so they stay advice: three warning-only rules in `schema/conformance-rules.yaml`, run with `npm run lint`.

Until 0.22.0, four more lint rules (`DSDS-17`, `DSDS-20`, `DSDS-22`, `DSDS-23`) reported the field and combo orders. `dsds-format` replaced them.

### What's covered

Every rule in this guide is covered except one, and that one can't be.

| Rule | Where | Covered by |
|---|---|---|
| A base document's own fields | [§1](#1-base-documents-and-shared-entries) | `dsds-format` |
| A `shared` entry's own fields | [§1](#1-base-documents-and-shared-entries) | `dsds-format` |
| Entry order inside `entries[]` | [§1](#1-base-documents-and-shared-entries) | `DSDS-21` |
| An entry's own fields | [§2](#2-entries) | `dsds-format` |
| A trait's own fields | [§2](#2-entries) | `dsds-format` |
| A trait value's own fields | [§2](#2-entries) | `dsds-format` |
| A `metadata` block's fields | [§3](#3-metadata) | `dsds-format` |
| A section's own fields | [§4](#4-sections) | `dsds-format` |
| Same-kind sections kept together | [§4](#4-sections) | `DSDS-18` |
| Section kind order | [§4](#4-sections) | `DSDS-18` |
| Breadth, then audience, among `guidelines` | [§4](#4-sections) | `DSDS-18` |
| An item's own fields | [§5](#5-section-items) | `dsds-format` |
| Guideline items by `level` | [§5](#5-section-items) | `DSDS-19` |
| A combo's own fields | [§6](#6-refs-and-combos) | `dsds-format` |
| Combos for one subject kept together, then by level | [§6](#6-refs-and-combos) | `dsds-format` |
| A ref's own fields | [§6](#6-refs-and-combos) | `dsds-format` |
| Order within one entry kind, or one `level` | [§1](#1-base-documents-and-shared-entries), [§5](#5-section-items) | can't be — it's a judgment call |

**Every sort reads a field, and classification never sorts.** `DSDS-18` used to put a section declaring `tags` in its own, narrowest tier. That gave `tags` two jobs, so tagging a section to classify it could also make it out of order. Since 0.22.0 `tags` only classifies, and `DSDS-18` sorts on `framing` and `for` alone.

**Field order has one source: the schema files.** The tables on the [Schema page](https://designsystemdocspec.org/schema) are generated from each schema file's own order, `dsds-format` reads that same order when it runs, and [§2](#2-entries) tells you to follow it. So you can read the authoring order off a property table, and the other way round.
