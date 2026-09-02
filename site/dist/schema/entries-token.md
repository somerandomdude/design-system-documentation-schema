# TokenEntry

A single design token, from the Design Tokens Community Group (DTCG) format.

Source: `entries/token.schema.yaml`

## TokenEntry {#tokenentry}

A single design token, from the Design Tokens Community Group (DTCG) format.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | [tokenId](schema.md#common-id-tokenid) | ✓ | This token's unique id. |
| `kind` | `"token"` | ✓ | Marks this entry as a token. |
| `name` | string | ✓ | The human-readable display name. |
| `description` | string | ✓ | A one-line statement of what this entry is or is for. |
| `purpose` | string |  | Explains the entry's reason for existing. |
| `metadata` | object |  |  |
| `related` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one is similar to in usage or purpose. |
| `extends` | [list](schema.md#common-ref-list) |  | Pointers to another entry this one inherits from (rel: extends). |
| `refs` | [list](schema.md#common-ref-list) |  | This entry's other pointers to entries and outside resources, not covered by `related` or `extends`. |
| `sections` | [dispatch](schema.md#sections-section-dispatch)[] |  | Every documentation section for this entry. (Min items: 1) |
| `$extensions` | [Extensions](schema.md#common-extensions) |  | Escape hatch for tool data, or for an outside id that doesn't fit this schema's own id pattern. |
| `source` | [Ref](schema.md#common-ref) |  | Path to the token's DTCG source file's token reference. |
| `tokenType` | string |  | The token's type, from DTCG. (Pattern: `^[a-z][a-zA-Z0-9]*$`) |
| `combos` | [Combo](schema.md#common-combo)[] |  | Rules about which other tokens this one must or must never be paired with. (Min items: 1) |

**References:** [Entry](schema.md#entries-entry), [EntryMetadata](schema.md#metadata-entry-metadata), [tokenId](schema.md#common-id-tokenid), [Ref](schema.md#common-ref), [Combo](schema.md#common-combo), [list](schema.md#common-ref-list), [dispatch](schema.md#sections-section-dispatch), [Extensions](schema.md#common-extensions)
