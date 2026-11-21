# Combo

Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.

Source: `common/combo.schema.yaml`

**4 definitions** in this file: `Combo`, `target`, `traitTarget`, `tokenRef`

## Combo {#common-combo}

Defines what an element can or cannot be paired with. Relates to traits, tokens, and entries.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `subject` | [target](schema.md#common-combo-target) | ✓ | The subject of what elements can or cannot be paired with. Can be a trait, token, or entry id. |
| `level` | [RequirementLevel](schema.md#common-requirement-level) | ✓ | Whether the elements in `items` can or cannot be paired with the subject—and how strict the rule is. |
| `items` | [target](schema.md#common-combo-target)[] | ✓ | The elements paired with the subject. (Min items: 1) |
| `note` | string |  | Why this rule holds. |

**References:** [target](schema.md#common-combo-target), [RequirementLevel](schema.md#common-requirement-level), [Id](schema.md#common-id), [traitTarget](schema.md#common-combo-traittarget), [tokenRef](schema.md#common-combo-tokenref)

**Example:**

```yaml
combos:
  - subject: "{color.action.primary}"
    level: must
    items: ["{color.surface.default}", "{color.surface.raised}"]
    note: Contrast is verified only against these surfaces; on any other background the label ratio is unproven.
```

## target {#common-combo-target}

An entry id, a trait target on this entry, or a token reference wrapped in braces.

**References:** [Id](schema.md#common-id), [traitTarget](schema.md#common-combo-traittarget), [tokenRef](schema.md#common-combo-tokenref)

**Example:**

```yaml
size.large               # a bare id
"{color.action.primary}"  # or a token reference
```

## traitTarget {#common-combo-traittarget}

A boolean trait's id, or `traitId.valueId` for one enum value.

**Pattern:** `^[A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*(\.[A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*)?$`

## tokenRef {#common-combo-tokenref}

A token reference, wrapped in braces.

**Pattern:** `^\{[A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*([./][A-Za-z0-9_$]+(-[A-Za-z0-9_$]+)*)*\}$`
