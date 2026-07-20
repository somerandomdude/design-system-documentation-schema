# AGENTS.md — consuming DSDS as an agent

This is the Design System Doc Spec (DSDS) documentation site: a versioned
JSON Schema for design system documentation, plus the human-readable pages
that explain it. This file is a short entry point for an agent working with
either the spec itself or a document written against it.

## Where to start

- **[manifest.json](/manifest.json)** — the typed machine index. Every entity
  kind, the block kinds it accepts, and links to its page, markdown mirror,
  schema, and a standalone example document. Fetch this first if you're
  building against DSDS programmatically.
- **[llms.txt](/llms.txt)** — a curated index of every page on this site,
  each with a one-line description and a link to its plain-markdown mirror.
  Start here if you're exploring the site.
- **Bundled schema** — every entity, document block, and shared definition
  in one JSON file, at `/v<version>/dsds.bundled.schema.json` (the exact,
  current-version link is in llms.txt and manifest.json). Prefer this over
  parsing HTML when you just need field names, types, and requiredness.
- **Every page has a `.md` mirror** at the same path (e.g. `/quickstart.md`,
  `/common-criterion.md`) — the full content as plain text, no HTML or JS
  required to read it.
- **[MCP server](https://github.com/somerandomdude/dsds-mcp)** — if your agent
  can use tools instead of fetching URLs directly, this wraps the schema and
  validation as MCP tools. Also linked from manifest.json's `mcp` field.

## The entity envelope

Every entity — component, token, token-group, theme, foundation, pattern,
guide, chunk — shares one invariant shape:

```
kind, identifier, name, metadata, documentBlocks, agents, $extensions
```

Only the entity-specific fields beyond this envelope differ (a token's
`tokenType`/`source`, a component's anatomy/API blocks, and so on — see each
kind's entry in manifest.json for exactly which document-block kinds it
accepts). Learn this envelope once and you can generalize across every
entity kind without re-deriving its shape from scratch each time. This is
the schema's `ENTITY_ENVELOPE` constant (`scripts/render-prop-table.js`) —
one source of truth, not a convention you have to infer from examples.

Each entity kind also has a canonical, standalone identifier at
`/id/entity/<kind>` (e.g. `/id/entity/component`) — the same data as that
kind's entry in manifest.json (page, markdown, schema, example,
`acceptsBlocks`), fetchable on its own without pulling the whole manifest.
`kind` is the identifier; there's no separate URN scheme to track.

## JSON-LD

Every HTML page emits a `<script type="application/ld+json">` block:
`TechArticle` for guides, `APIReference` for schema reference pages, with
`name`, `description`, `url`, `version`, `isPartOf` (this site), `sameAs`
(the page's own `.md` mirror), `subjectOf` (the bundled schema, on schema
pages), and `hasPart` (one `DefinedTerm` per `$defs` entry the page
documents, linked to its anchor). It's schema.org-native — generic
crawlers and structured-data tools already parse it — but it does not
encode DSDS-specific relationships like "component accepts these block
kinds"; there's no schema.org vocabulary for that, and inventing one would
mean a private vocabulary no generic consumer understands. That
relationship graph lives in manifest.json instead. Treat JSON-LD as a
standard-format summary of a page's identity and its representations, and
manifest.json as the place for DSDS's own domain model.

## What's normative

Requirement language in DSDS schemas and docs follows RFC 2119: **MUST**,
**MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY**, normative only in
upper case. See [/conformance](/conformance) for the full conformance
classes and the generated index of every normative statement in the schema.

Conformance criteria (`common/criterion.schema.json`) are testable by
design: each has an objectively verifiable `statement`, an optional
`verification` mode, and test cases with declared pass/fail `outcome`s. If
you're validating a document or an implementation against DSDS, criteria
are the mechanism — check a criterion's test cases before writing your own.

## If you're consuming (not just reading) a DSDS document

A DSDS document — one describing an actual design system, not this spec
site — splits its documentation into two arrays:

- `documentBlocks` — written for people, and for you. This is the default
  home for everything: anatomy, API, variants, guidelines, accessibility.
- `agentDocumentBlocks` — optional, agent-only notes: hard MUST/MUST NOT
  rules, how to tell a component apart from a similar one, checks you can
  run against your own output. Never shown to people, and never a
  replacement for `documentBlocks` — read both.

See [/humans-and-agents](/humans-and-agents) for the full explanation of
that split.

## Self-checking your work

Where a `document-blocks/checklist` block exists on an entity, it's built
specifically for agents to run through before finishing a task — short,
actionable items, each optionally linked to the conformance criterion that
proves it. Prefer it over inferring correctness from prose alone.
