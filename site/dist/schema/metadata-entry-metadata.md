# EntryMetadata

Information about a single entry, on top of the fields every metadata object shares.

Source: `metadata/entry-metadata.schema.yaml`

**3 definitions** in this file: `EntryMetadata`, `statusEntry`, `statusValue`

## EntryMetadata {#entrymetadata}

Information about a single entry, on top of the fields every metadata object shares.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `tags` | string[] |  | Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category. (Min items: 1) |
| `owner` | string |  | The owning team, role, or group. |
| `reviewed` | object {date, by, note}[] |  | Independent reviews confirming this item's documentation, each recording who confirmed it and when. (Min items: 1) |
| `context` | string |  | Why this entry was created, and how and why to use it. |
| `updated` | object {date, note} |  | Tools SHOULD treat `updated.date` as the cache key for this item's documentation specifically. `updated.date` is distinct from `metadata.version`/`since` which tracks the design system's own release. Always use `updated.date` as the source of truth for when to re-fetch or re-index. |
| `origin` | object {method, author, note} |  | How this entry's documentation came to exist, and who or what wrote it. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace. |
| `status` | `statusEntry` \| `statusEntry`[] |  | A lifecycle status, optionally scoped to one platform - or a list of them, one per platform, when an entry has reached different maturity on each. |
| `since` | [Since](schema.md#common-since) |  | The version this entry was first introduced. |
| `group` | string |  | A group name this entry belongs to, for example "color.action" on a set of related tokens, or "action" on a family of related components. |
| `aliases` | string[] |  | Other names this entry is also known or searched by, like a past name or a common misspelling. |
| `preview` | [Showcase](schema.md#common-showcase) |  | A visual sample of this entry, either a media file or a link. |

**References:** [Metadata](schema.md#metadata-metadata), `#/$defs/statusEntry`, [Since](schema.md#common-since), [Showcase](schema.md#common-showcase), [Id](schema.md#common-id), `#/$defs/statusValue`, `#/$defs/isoDate`, [Extensions](schema.md#common-extensions)

## statusEntry {#statusentry}

One lifecycle status, optionally scoped to a single platform.

**References:** [Id](schema.md#common-id), `#/$defs/statusValue`, [Since](schema.md#common-since)

## statusValue {#statusvalue}

A lowercase, dash-separated lifecycle word, for example "stable" or "deprecated".

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*$`
