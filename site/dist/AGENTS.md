# AGENTS.md — consuming DSDS as an agent

This is the Design System Doc Spec (DSDS) documentation site: a versioned
schema for design system documentation, plus the human-readable pages that
explain it. This file is a short entry point for an agent working with
either the spec itself or a document written against it.

## Where to start

- **[manifest.json](/manifest.json)** — the typed machine index. Every
  well-known entry kind and section kind, and links to each entry kind's
  page, markdown mirror, and schema. Fetch this first if you're building
  against DSDS programmatically.
- **[llms.txt](/llms.txt)** — a curated index of every page on this site,
  each with a one-line description and a link to its plain-markdown mirror.
  Start here if you're exploring the site.
- **Bundled schema** — every entry kind, section kind, and shared definition
  in one YAML file, at `/v<version>/dsds.bundled.yaml` (the exact,
  current-version link is in llms.txt and manifest.json). Prefer this over
  parsing HTML when you just need field names, types, and requiredness.
- **Every page has a `.md` mirror** at the same path (e.g. `/quickstart.md`,
  `/common-ref.md`) — the full content as plain text, no HTML or JS
  required to read it.
- **MCP server** — `dsds-mcp` on npm wraps the schema and validation as MCP
  tools, but its latest published build (`0.3.0`) bundles the v0.15.2 schema
  and checks for the `dsdsVersion` field that version used, which 0.20.0
  renamed to `schemaVersion` — it currently rejects every valid 0.20.0
  document. Not linked here until a 0.20-compatible build ships; validate
  directly against the bundled schema or `scripts/validate.js` instead.

## The entry envelope

Every entry — a system, a component, a token, a theme, or the generic
`entry` kind (foundations, patterns, guides, and anything else) — shares one
open base:

```
id, kind, name, description, purpose, metadata, related, extends, refs, sections, $extensions
```

Only the kind-specific fields beyond this envelope differ (a token's
`tokenType`/`source`, a component's `sourceFiles`/`imports`/`traits`, a
theme's `colorScheme`, and so on — see `entries/<kind>.schema.yaml` for
exactly which fields each kind adds). Learn this envelope once and you can
generalize across every entry kind without re-deriving its shape from
scratch each time. This is the schema's `ENTRY_ENVELOPE` constant
(`scripts/render-prop-table.js`) — one source of truth, not a convention you
have to infer from examples. `sections/section.schema.yaml` has the same
role one level down: every section kind shares `kind`, `for`, `title`,
`description`, `items`, `metadata`, `$extensions`.

Each well-known entry kind also has a canonical, standalone identifier at
`/id/entry/<kind>` (e.g. `/id/entry/component`) — the same data as that
kind's entry in manifest.json (page, markdown, schema), fetchable on its own
without pulling the whole manifest. `kind` is the identifier; there's no
separate URN scheme to track. A custom kind (a namespaced value like
`acme.icon-library`) has no dedicated page — it's checked against
`entry.schema.yaml`'s open base directly, the same fallback the generic
`entry` kind itself gets.

## JSON-LD

Every HTML page emits a `<script type="application/ld+json">` block:
`TechArticle` for guides, `APIReference` for schema reference pages, with
`name`, `description`, `url`, `version`, `isPartOf` (this site), `sameAs`
(the page's own `.md` mirror), `subjectOf` (the bundled schema, on schema
pages), and `hasPart` (one `DefinedTerm` per definition the page documents,
linked to its anchor). It's schema.org-native — generic crawlers and
structured-data tools already parse it — but it does not encode
DSDS-specific relationships like "which entry kinds this section kind
applies to" (there is no such gating rule to encode — any entry kind may use
any section kind); there's no schema.org vocabulary for DSDS's own domain
model either way, and inventing one would mean a private vocabulary no
generic consumer understands. That's what manifest.json is for instead.
Treat JSON-LD as a standard-format summary of a page's identity and its
representations, and manifest.json as the place for DSDS's own domain model.

## What's normative

Requirement language in DSDS schemas and docs follows RFC 2119: **MUST**,
**MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY**, normative only in
upper case. See [/conformance](/conformance) for the full conformance rule
catalog (`DSDS-01` through `DSDS-07`) and the generated index of every
normative statement in the schema.

A `guidelines` section's items are testable by design: each has a
`requirement-level` (`must`/`should`/`should-not`/`must-not`/`may`), an
optional `checkedBy` (`automated`/`assisted`/`manual`), and — when
`checkedBy: automated` — a `checks` ref (`rel: test` or `lint-rule`)
pointing at what actually runs the check (enforced by `DSDS-03`). If you're
validating a document or an implementation against DSDS, a guideline's
`checks` ref is the mechanism — follow it to the real test before writing
your own.

## If you're consuming (not just reading) a DSDS document

A DSDS document — one describing an actual design system, not this spec
site — puts all of its documentation into one `sections` array per entry.
Each section carries a `for` field naming its audience:

- `for: human` or `for: all` — written for people, and for you. This is the
  default home for everything: definitions, guidelines, steps, freeform
  narrative content.
- `for: agent` — optional, agent-only notes: hard MUST/MUST NOT rules, how
  to tell a component apart from a similar one, checks you can run against
  your own output. Never shown to people, and never a replacement for the
  `for: human`/`for: all` sections on the same entry — read both.

See [Humans and agents on the Overview page](/#humans-and-agents) for the
full explanation of that split.

## Self-checking your work

Where a `steps` section exists on an entry, it's built specifically for
agents (and people) to run through before finishing a task — short,
actionable items, each optionally linked (via `checks`, `rel: depends-on`)
to the guideline it verifies. Prefer it over inferring correctness from
prose alone.
