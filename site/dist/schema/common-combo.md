# Combo

Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.

Source: `common/combo.schema.yaml`

**2 definitions** in this file: `Combo`, `target`

## Combo {#combo}

Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `subject` | `target` | ✓ | The subject of what elements can or cannot be paired with. Can be a trait, token, or entry id. |
| `items` | `target`[] | ✓ | The elements paired with the subject. (Min items: 1) |
| `level` | [RequirementLevel](schema.md#common-requirement-level) | ✓ | Whether the elements in `items` can or cannot be paired with the subject—and how strict the rule is. |
| `note` | string |  | Why this rule holds. |

**References:** `#/$defs/target`, [RequirementLevel](schema.md#common-requirement-level), [Id](schema.md#common-id)

## target {#target}

A bare id, or a token reference wrapped in braces.

**References:** [Id](schema.md#common-id)
