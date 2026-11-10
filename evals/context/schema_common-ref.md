# Ref

A pointer from one thing to another, with `rel` saying what kind of pointer it is.

Source: `common/ref.schema.yaml`

**9 definitions** in this file: `Ref`, `list`, `targets`, `rel`, `target`, `to`, `href`, `role`, `note`

## Ref {#common-ref}

A pointer from one thing to another, with `rel` saying what kind of pointer it is.

**Accepts one of:**

- **string** — A plain outside link, short for `{href: <string>}`.
- **object**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `rel` | [rel](schema.md#common-ref-rel) | ✓ | What kind of pointer this is, or a namespaced custom value. A relationship is written once, on the thing it starts from. A conforming consumer works out the reverse direction itself, and MUST NOT require it to be written on the target as well. Where an object has a field named for a kind of pointer, that kind MUST go in the field, not in `refs` (DSDS-25). |
| `to` | [to](schema.md#common-ref-to) |  | What this points at, inside the project. |
| `href` | [href](schema.md#common-ref-href) |  | What this points at, outside the project. A file, a URL or a package. |
| `role` | [role](schema.md#common-ref-role) |  | What the target does here. |
| `note` | [note](schema.md#common-ref-note) |  | Anything else worth saying about this link. |

**References:** [to](schema.md#common-ref-to), [href](schema.md#common-ref-href), [rel](schema.md#common-ref-rel), [role](schema.md#common-ref-role), [note](schema.md#common-ref-note), [namespaced](schema.md#common-id-namespaced), [Ref](schema.md#common-ref), [target](schema.md#common-ref-target)

**Example:**

```yaml
- href: https://example.atlassian.net/browse/DS-482
  rel: relates-to
  role: Tracks the two-primary-buttons issue
  note: Filed after a usability test surfaced the ambiguity.
# or, pointing inside this document instead of outside it:
- to: shared-a11y#touch-target
  rel: same-as
```

## list {#common-ref-list}

One or more pointers, in order, each with its own `rel`.

**References:** [Ref](schema.md#common-ref)

**Example:**

```yaml
- to: getting-started
  rel: relates-to
- href: https://storybook.acme.example
  rel: demo
```

## targets {#common-ref-targets}

One or more pointers of the kind the field is named for, in order.

**References:** [target](schema.md#common-ref-target)

**Example:**

```yaml
checks:
  - href: ./tests/button.a11y.test.ts
    role: test
  - to: release-checklist#focus-visible-check
```

## rel {#common-ref-rel}

What kind of pointer this is, or a namespaced custom value. A relationship is written once, on the thing it starts from. A conforming consumer works out the reverse direction itself, and MUST NOT require it to be written on the target as well. Where an object has a field named for a kind of pointer, that kind MUST go in the field, not in `refs` (DSDS-25).

**Accepts one of:**

- **string**
- [namespaced](schema.md#common-id-namespaced)

**References:** [namespaced](schema.md#common-id-namespaced)

## target {#common-ref-target}

A pointer in a field named for one kind of pointer. It has no `rel`, because the field name says the kind. A plain string means `{href: <string>}`.

**Accepts one of:**

- **string** — A plain outside link, short for `{href: <string>}`.
- **object**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `to` | [to](schema.md#common-ref-to) |  | What this points at, inside the project. |
| `href` | [href](schema.md#common-ref-href) |  | What this points at, outside the project. A file, a URL or a package. |
| `role` | [role](schema.md#common-ref-role) |  | What the target does here. |
| `note` | [note](schema.md#common-ref-note) |  | Anything else worth saying about this link. |

**References:** [to](schema.md#common-ref-to), [href](schema.md#common-ref-href), [role](schema.md#common-ref-role), [note](schema.md#common-ref-note)

**Example:**

```yaml
# In a field named for one kind of pointer, like a guideline's evidence:
- href: https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html
  role: WCAG 2.2 SC 2.4.4 (A)
# or, the shorthand for an outside link:
- https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html
```

## to {#common-ref-to}

What this points at, inside the project.

**Pattern:** `^[A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*([./][A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*)*(#[A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*(\.[A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*)*)?$`

## href {#common-ref-href}

What this points at, outside the project. A file, a URL or a package.

## role {#common-ref-role}

What the target does here.

## note {#common-ref-note}

Anything else worth saying about this link.
