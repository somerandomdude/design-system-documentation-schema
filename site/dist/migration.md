# Migration — DSDS 0.15.2

# Migration

This page covers moving existing DSDS documents to a newer spec version. Each breaking release gets a section here: what changed, what the migration script does for you, and what it leaves for a human.

The [Stability page](stability.html) explains when breaking changes happen. Short version: they are batched, announced one minor ahead, and shipped with a migration script.

## Migrating to 0.15.0

0.15.0 is a minor release. It renames nothing and adds three constraints, so most documents migrate with only a `dsdsVersion` bump. There is no migration script — the affected spots are few, and the fixes are specific. Fix these if they apply to your documents:

- **Design-spec map keys must be lowercase kebab-case.** In a `design-specifications` block, the keys of `properties`, `spacing.internal`, `spacing.external`, and `typography` must match `^[a-z][a-z0-9-]*$`. Rename camelCase keys — `textColor` becomes `text-color`.
- **`spacing.internal` and `spacing.external` cannot be empty.** Drop an empty map, or give it at least one entry.
- **A deprecated API property needs a notice.** An `apiProperty` with `deprecated: true` must carry a non-empty `deprecationNotice` saying what to use instead.

Then set `dsdsVersion` to `0.15.0` and point any `$schema` URL at the `v0.15.0` bundle.

## Migrating to 0.14.0

0.14.0 is a breaking release. It applies every recorded naming exception and removes both deprecated surfaces. Documents at 0.10 through 0.13 migrate automatically.

### Run the scripts

Run the link converter first if your documents still relate entities through `links`. Then run the 0.14 migrator:

```
node scripts/migrate-relationship-links.js <files-or-dirs>
node scripts/migrate-to-0.14.js <files-or-dirs>
```

Both accept `--dry-run`. The migrator bumps `dsdsVersion`, updates any versioned `$schema` URL, and applies every rename below. It never touches `$extensions` content.

### What changes

| Before (≤ 0.13) | After (0.14.0) |
| --- | --- |
| Block kind `useCases` | Block kind `use-cases` (same rename in `docOrigin.blocks` keys) |
| `stepEntry.title` | `stepEntry.label` (now rich text) |
| `scaleStep.label` | `scaleStep.name` |
| `systemInfo.systemName` / `systemVersion` | `systemInfo.name` / `version` |
| Status object `description` (entity-level and per-platform) | Status object `note` |
| `apiEvent.returns` | `apiEvent.payload` |
| Link `identifier`, `role`, `required` | Removed. A link is `kind` + `url` (+ optional `label`). Entities relate through `relationships` edges |
| Chunk top-level `guidelines` / `useCases` | Removed. Guidance lives in the chunk's `documentBlocks` |

Nothing else changed shape. Documents that used none of these forms migrate with only a version bump.

### What needs a human

- **Links that use an identifier.** A link that pointed at another entity by `identifier` no longer validates. The migrator reports each one instead of guessing. Convert it to a typed `relationships` edge (`composes`, `depends-on`, `alternative-to`, …) or rewrite it as a plain URL link.
- **Chunks that had both forms.** When a chunk carried the shorthand *and* an equivalent block, the block took priority. The migrator merges in any shorthand items the block doesn't already have, and reports the counts. Skim the report to confirm nothing merged that you meant to drop.

### Verify

Validate the migrated documents against the bundled schema for the version you migrated to — every release is served at its own versioned URL on this site. In this repository, `npm run validate` covers every example and fixture.

## Older migrations

Earlier breaking windows have their own scripts: `migrate-to-0.7.js` (from 0.5.x / 0.6), `migrate-to-0.8.js` (from 0.7.x), and `migrate-to-0.10.js` (from 0.8.x / 0.9.x). Run them in order when jumping several versions. The [CHANGELOG](https://github.com/somerandomdude/design-system-documentation-schema/blob/main/CHANGELOG) records what each release changed.
