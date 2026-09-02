## What this changes

<!-- One or two sentences. Link the issue this addresses, if any. -->

## Checklist

- [ ] `npm run check` passes locally
- [ ] If this is a new/changed validator rule: catalog entry
      (`schema/conformance-rules.yaml`) **+** implementation **+** fixture
      in `examples/invalid/`, all three — see
      [CONTRIBUTING.md](../CONTRIBUTING.md#what-a-contribution-needs-by-kind)
- [ ] If this is a new example: referenced from `manifest.json` or a site
      page, not just added to `examples/`
- [ ] If this changes what a previously-valid document looks like: a
      CHANGELOG entry, and I've checked
      [Stability's breaking-change definition](https://designsystemdocspec.org/stability.html#what-counts-as-a-breaking-change)
      (adding a validator rule counts, even with no schema edit)
- [ ] If this changes the document *model* (not just adds to it): I've
      enumerated every guard/fixture/skill/example that pointed at the old
      shape and said, below, what happens to each (port or drop)
- [ ] `site/dist/` is regenerated (`npm run build`) and committed alongside
      the source change, if this touches schema, site content, or examples

## If this changes the model

<!--
List every guard, fixture, skill, or example that referenced the old shape,
and what happens to it. Delete this section if not applicable.
-->
