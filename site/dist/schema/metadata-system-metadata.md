# SystemMetadata

Information about the design system as a whole, on top of the fields every metadata object shares.

Source: `metadata/system-metadata.schema.yaml`

## SystemMetadata {#systemmetadata}

Information about the design system as a whole, on top of the fields every metadata object shares.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `tags` | string[] |  | Keywords for grouping, search, and filtering. By convention, the first tag, if any, is the main category. (Min items: 1) |
| `owner` | string |  | The owning team, role, or group. |
| `reviewed` | object {date, by, note}[] |  | Independent reviews confirming this item's documentation, each recording who confirmed it and when. (Min items: 1) |
| `context` | string |  | Why this entry was created, and how and why to use it. |
| `updated` | object {date, note} |  | Tools SHOULD treat `updated.date` as the cache key for this item's documentation specifically. `updated.date` is distinct from `metadata.version`/`since` which tracks the design system's own release. Always use `updated.date` as the source of truth for when to re-fetch or re-index. |
| `origin` | object {method, author, note} |  | How this entry's documentation came to exist, and who or what wrote it. |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data scoped to just this entry's metadata, keyed by namespace. |
| `version` | [Since](schema.md#common-since) |  | The current version of the design system. |
| `organization` | string |  | The team or company that owns the design system. |
| `url` | string (uri) |  | The main home page or repository for the design system. |
| `license` | string |  | The license this design system is published under. |
| `platforms` | [Id](schema.md#common-id)[] |  | The platforms this system ships on, for example "react" or "web-component". (Min items: 1) |

**References:** [Metadata](schema.md#metadata-metadata), [Since](schema.md#common-since), [Id](schema.md#common-id), `#/$defs/isoDate`, [Extensions](schema.md#common-extensions)
