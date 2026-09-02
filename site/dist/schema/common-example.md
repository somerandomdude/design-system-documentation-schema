# Example

A single example, illustrating something in context.

Source: `common/example.schema.yaml`

**2 definitions** in this file: `Example`, `list`

## Example {#example}

A single example, illustrating something in context.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | at least 1 | A short heading for the example. |
| `description` | string | at least 1 | Describes the example in detail. |
| `showcase` | [Showcase](schema.md#common-showcase) | at least 1 | A visual sample of this example. |
| `ref` | [Ref](schema.md#common-ref) | at least 1 | Where this example lives in code. |

**Constraint:** At least one of `title`, `description`, `showcase`, `ref` must be present.

**References:** [Showcase](schema.md#common-showcase), [Ref](schema.md#common-ref), [Example](schema.md#common-example)

## list {#list}

One or more examples, in order.

**References:** [Example](schema.md#common-example)
