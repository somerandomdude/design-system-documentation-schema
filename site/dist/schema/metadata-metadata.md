# Metadata

Optional information about an element.

Source: `metadata/metadata.schema.yaml`

**3 definitions** in this file: `Metadata`, `note`, `isoDate`

## Metadata {#metadata}

Optional information about an element.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `tags` | string[] |  | Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category. (Min items: 1) |
| `owner` | string |  | The owning team, role, or group. |
| `reviewed` | object {date, by, note}[] |  | Independent reviews confirming this item's documentation, each recording who confirmed it and when. (Min items: 1) |
| `context` | string |  | Why this entry was created, and how and why to use it. |
| `updated` | object {date, note} |  | Tools SHOULD treat `updated.date` as the cache key for this item's documentation specifically. `updated.date` is distinct from `metadata.version`/`since` which tracks the design system's own release. Always use `updated.date` as the source of truth for when to re-fetch or re-index. |
| `origin` | object {method, author, note} |  | How this entry's documentation came to exist, and who or what wrote it. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace. |

**References:** `#/$defs/isoDate`, [Extensions](schema.md#common-extensions)

## note {#note}

A plain-text note. MUST NOT contain markup.

## isoDate {#isodate}

An ISO 8601 date (YYYY-MM-DD).

**Pattern:** `^\d{4}-\d{2}-\d{2}$`
