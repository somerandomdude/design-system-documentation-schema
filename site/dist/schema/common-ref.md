# Ref

The one pointer type. "A points to B, and this is what kind of pointer it is."

Source: `common/ref.schema.yaml`

**2 definitions** in this file: `Ref`, `list`

## Ref {#ref}

The one pointer type. "A points to B, and this is what kind of pointer it is."

One of:

- **string** — Shorthand for an external link that doesn't need added definition. Equivalent to `{href: <string>}`.
- **object**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `rel` | `"depends-on"` \| `"composes"` \| `"part-of"` \| `"alternative-to"` \| `"replaces"` \| `"extends"` \| `"implements"` \| `"relates-to"` \| `"same-as"` \| `"refines"` \| `"lint-rule"` \| `"test"` \| `"file"` \| `"source"` \| `"design"` \| `"storybook"` \| `"package"` \| `"external-link"` \| `"contract"` \| `"pairs-with"` \| `"excludes"` \| `"see-also"` \| [namespaced](schema.md#common-id-namespaced) | ✓ | What kind of pointer this is, or a namespaced custom value. |
| `to` | string |  | What this points at, inside this document's own graph. (Pattern: `^[a-z0-9]+(-[a-z0-9]+)*([./][a-z0-9]+(-[a-z0-9]+)*)*(#[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*)?$`) |
| `href` | string (uri-reference) |  | What this points at, outside this document. Such as a file, URL, or package. |
| `role` | string |  | What the thing being pointed at does in this context. |
| `note` | string |  | Additional info related to the connection of the two items. |

**References:** [namespaced](schema.md#common-id-namespaced), [Ref](schema.md#common-ref)

## list {#list}

One or more pointers, in order.

**References:** [Ref](schema.md#common-ref)
