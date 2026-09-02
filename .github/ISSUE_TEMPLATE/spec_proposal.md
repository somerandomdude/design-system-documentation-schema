---
name: Spec proposal
about: Propose a new field, rule, or change to the schema
title: ""
labels: spec-proposal
assignees: ""
---

**What's missing or wrong**
What can't be expressed today, or what's expressed in a way that causes
real problems — with a concrete example of a document that needs this.

**Proposed shape**
A sketch of the field/rule, even a rough one. If it's a new field, which
entry or section kind does it belong to, and why there rather than
`$extensions`?

**Is this breaking?**
Read [Stability's "What counts as a breaking change"](https://designsystemdocspec.org/stability.html#what-counts-as-a-breaking-change)
first. Does this proposal add (safe), tighten (needs a minor + CHANGELOG
note), or rename/remove (needs a migration script)?

**Alternatives considered**
Why `$extensions`, a namespaced custom kind, or an existing field doesn't
already cover this (see [Extending the schema](https://designsystemdocspec.org/extending.html)).
