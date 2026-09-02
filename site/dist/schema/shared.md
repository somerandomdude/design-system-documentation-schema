# Shared

Reusable content other entries point at instead of restating. Not a design-system artifact in its own right.

Source: `shared.schema.yaml`

## Shared {#shared}

Reusable content other entries point at instead of restating. Not a design-system artifact in its own right.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [Id](schema.md#common-id) | ✓ | This entry's unique id. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this shared entry is for. |
| `metadata` | object |  |  |
| `refs` | [list](schema.md#common-ref-list) |  | Pointers from this entry to other things. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | The reusable content itself, in the same section structure an entry uses. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data or an outside id, the same structure as an entry's own $extensions. |

**References:** [Id](schema.md#common-id), [Metadata](schema.md#metadata-metadata), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)
