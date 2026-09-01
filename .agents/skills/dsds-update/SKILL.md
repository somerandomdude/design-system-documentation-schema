---
name: dsds-update
description: Update an existing DSDS spec based on implementation changes, Figma updates, or written instructions. Triggers on "update spec", "modify spec", "add prop to spec", "sync spec", "spec drift".
metadata:
  version: 0.20.0
---

# Update a DSDS Spec

Modify an existing `.dsds.yaml` file in `packages/specs/`.

## Procedure

1. Read the existing spec file.
2. Identify what changed — compare against the source (code diff, Figma update, user instructions).
3. Apply edits to the spec, preserving structure and existing content.
4. Run `npm run validate -w packages/specs` — fix errors until it passes.
5. Run `npm run build -w packages/specs` to regenerate the index, if applicable.

## Common Updates

| Change | Location in spec |
| --- | --- |
| New prop | `sourceFiles` already points at the real file — no spec edit needed, unless there's no source file, in which case update the `definitions` section titled "Props" |
| New variant value | Top-level `traits` item with `kind: enum`, in its `values` array |
| New state | Top-level `traits` item with `kind: boolean` |
| Anatomy change | The `definitions` section titled "Anatomy" |
| New accessibility requirement | A `guidelines` item (`context: how-to-use`), or a `definitions` section titled "Keyboard interactions" |
| Status change | `metadata.status` (always an object: `{status: "..."}`) |
| New agent rule | A section with `for: agent` |

## Rules

- Never remove existing content unless explicitly instructed — specs are additive by default.
- Preserve the existing order of `sections` and `traits` items.
- When adding trait values, place them in logical order (not necessarily alphabetical) — the first value is implied as the default.
- Update `metadata.status` if the change constitutes a breaking API modification.
- If adding a new relationship, use `common/ref`'s one shape: `{to: "<id>", rel: "<depends-on|extends|alternative-to|composes|...>"}` for something in this document's own graph, or `{href: "<url>", rel: "..."}` for something outside it.

## Schema References

When adding new sections or fields, verify the exact shape:

- **Bundled schema** (in-repo): `packages/specs/schema/dsds.bundled.schema.json`
- **Section reference**: `https://designsystemdocspec.org/sections-{kind}`
- **Entry reference**: `https://designsystemdocspec.org/entries-{kind}`
- **Full architecture**: https://designsystemdocspec.org/schema.html#how-the-schema-is-organized

## Gotchas

- Modifying `id` or `kind` is a breaking change — confirm with the user.
- DSDS doesn't track which props are "required" as a schema fact — that lives in the real source file `sourceFiles` points at. A new required prop is still a breaking change worth calling out in a `guidelines` item, just not a field to flip in the spec itself.
- Token references (in `traits`, `combos`, or prose) must match `id`s of tokens actually documented in `tokens/`.
