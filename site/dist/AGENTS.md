# AGENTS.md — consuming DSDS as an agent

This is the Design System Doc Spec (DSDS) documentation site: a versioned
JSON Schema for design system documentation, plus the human-readable pages
that explain it. This file is a short entry point for an agent working with
either the spec itself or a document written against it.

## Where to start

- **[llms.txt](/llms.txt)** — a curated index of every page on this site,
  each with a one-line description and a link to its plain-markdown mirror.
  Start here if you're exploring the site.
- **Bundled schema** — every entity, document block, and shared definition
  in one JSON file, at `/v<version>/dsds.bundled.schema.json` (the exact,
  current-version link is in llms.txt). Prefer this over parsing HTML when
  you just need field names, types, and requiredness.
- **Every page has a `.md` mirror** at the same path (e.g. `/quickstart.md`,
  `/common-criterion.md`) — the full content as plain text, no HTML or JS
  required to read it.

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
