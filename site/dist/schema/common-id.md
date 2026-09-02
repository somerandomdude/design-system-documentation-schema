# Id

Lowercase, dash-separated segments, optionally chained with dots.

Source: `common/id.schema.yaml`

**3 definitions** in this file: `Id`, `tokenId`, `namespaced`

## Id {#id}

Lowercase, dash-separated segments, optionally chained with dots.

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$`

## tokenId {#tokenid}

The same as the base id format, but a segment can also be separated by a slash.

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*([./][a-z0-9]+(-[a-z0-9]+)*)*$`

## namespaced {#namespaced}

A dotted, namespaced custom value. The open extension point alongside a fixed set of well-known values.

**Pattern:** `^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$`
