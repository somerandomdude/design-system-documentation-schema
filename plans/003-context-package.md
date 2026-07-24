# Plan 003: Adopt `dsds-tools` as the grounded agent context layer

> **Executor instructions**: Integrate and verify the existing `dsds-tools`
> MCP and CLI surfaces. Do not recreate document loading, validation, lexical
> retrieval, context rendering, a context-package schema, or a second CLI.
> Record the exact reviewed upstream revision before configuring the tool.

## Status

- **Priority**: P1
- **Effort**: M (one focused side-project week; approximately 3–5 human hours)
- **Risk**: MED — an external tool becomes part of the local development and
  offline workflow
- **Depends on**: Plan 002's Site Kit corpus; resolve Plan 001's remaining
  repository-validation dependency before MVP release
- **Category**: integration / DX / architecture
- **Planned rewrite**: 2026-07-23
- **PRD story**: Story 1, “Generate an agent context package”

## Why this plan changed

The original plan proposed a custom normalizer, lexical retrieval engine,
context-package schema, exporters, and `dsds-local context` command.
`somerandomdude/dsds-tools` already provides those grounding capabilities as
one shared core with two transports:

- `dsds-mcp` exposes structured agent tools including entity search, complete
  entity retrieval, agent-optimized context, relationship queries, validation,
  and component-building guidance.
- `dsds-cli` exposes the same catalog for shell-only agents, people, and CI,
  with stable JSON envelopes, separate diagnostics, and useful exit codes.

The project should prove that its DSDS Site Kit works through those established
surfaces, then only add project-specific constraints where the upstream tool
cannot express them.

## Desired outcome

With the Site Kit corpus configured, a coding agent can:

1. Discover the documented components.
2. Search for an appropriate component for a task.
3. Retrieve agent-oriented rules and exact documented implementation targets.
4. Validate the corpus and diagnose configuration failures.
5. Run the same workflow through MCP or a local CLI without network access
   after the dependencies are prepared.

## Scope

**In scope**

- A version-controlled integration record with the upstream repository URL,
  reviewed commit SHA, supported package versions, and local setup steps.
- A project-local `dsds.config.*` configuration pointing at
  `spec/examples/site-kit.dsds.json`.
- A shareable MCP configuration example for `dsds-mcp` that reads the same
  project-local configuration.
- A reproducible local-checkout workflow for the unpublished `dsds-cli`.
- Smoke tests or documented verification commands covering `list`, `search`,
  `get`, `context`, `doctor`, and schema validation against the Site Kit.
- An integration assertion that `dsds context ds-button` and the MCP
  `dsds_get_agent_context` response expose documented properties, slots,
  guidelines, and source-module links without inventing components.
- A concise agent-facing usage note: MCP for interactive agent lookup; CLI for
  terminal, CI, and local-model workflows.

**Out of scope**

- A new document loader, entity normalizer, lexical scorer, context-package
  JSON Schema, Markdown exporter, or `dsds-local context` command.
- A new MCP server, a duplicate tool registry, or a Gum wrapper.
- Ollama prompts, model synthesis, embeddings, SQLite, and evaluation policy.
- Publishing, forking, or modifying `dsds-tools`.

## Upstream contract to verify

The reviewed upstream revision must provide:

- MCP: `dsds_context_brief`, `dsds_search_entities`, `dsds_get_entity`,
  `dsds_get_document_block`, and `dsds_get_agent_context`.
- CLI: `dsds list`, `dsds search`, `dsds get`, `dsds context`, `dsds validate`,
  and `dsds doctor`.
- Project-local configuration discovery through `dsds.config.mjs`,
  `dsds.config.js`, or `dsds.config.json`, with `paths` as the document list.
- A stable machine-readable CLI mode with payload on stdout, diagnostics on
  stderr, and nonzero exit codes for invalid configuration or documents.

If an upstream revision changes this contract, update this plan and the
integration record before adopting it.

## Steps

### Step 1: Review and pin the upstream toolchain

1. Review the `dsds-tools` release notes, license, package metadata, and the
   MCP/CLI commands above.
2. Record the canonical repository URL and an immutable commit SHA in a
   project-owned integration record. Do not pin a moving branch name alone.
3. Record whether `dsds-mcp` is installed from npm or a local checkout. The
   CLI is not yet published to npm, so its offline path must use a prepared,
   pinned local checkout with dependencies installed before travel.

**Verify**: the integration record names one exact upstream commit and gives a
working command for both the MCP server and CLI checkout.

### Step 2: Configure the Site Kit as a real tool input

1. Add project-local `dsds.config.mjs` with
   `paths: ["./spec/examples/site-kit.dsds.json"]`.
2. Add a documented MCP configuration example that starts `dsds-mcp` with this
   repository as its working directory, so MCP and CLI resolve the same config.
3. Keep any machine-local checkout paths, package-manager caches, and model
   locations out of committed configuration.

**Verify**: from the repository root, the CLI can list the Site Kit entities
without setting `DSDS_PATHS` manually.

### Step 3: Prove the query and grounding workflow

Run and capture stable, reviewable examples using the pinned CLI checkout:

```text
dsds list --kind component --json
dsds search "warning" --json
dsds get ds-callout --block api --json
dsds context ds-button --json
dsds validate spec/examples/site-kit.dsds.json --json
dsds doctor --json
```

Verify equivalent MCP calls in an MCP-capable client:

```text
dsds_context_brief(useCase="build")
dsds_search_entities(query="warning")
dsds_get_agent_context(identifier="ds-button")
```

Assertions:

- Searching `warning` finds the documented callout rather than an invented
  component.
- Button context includes its documented primary/secondary variants, native
  button contract, and source-module link.
- The tool can retrieve Site Kit form components, including the exploratory
  components, only because they exist in the corpus.
- Validation and doctor fail with an actionable diagnostic if the configured
  document is invalid or missing.

**Verify**: add a small automated integration test where the upstream CLI is
available; otherwise provide a versioned manual acceptance script and mark the
automation gap explicitly.

### Step 4: Document the agent and shell workflows

Document two intentional paths:

- **MCP-capable coding agent:** start with `dsds_context_brief`, search the
  corpus, then retrieve agent context for the selected component.
- **Shell-only or local-model workflow:** run `dsds search` and `dsds context`
  with `--json`, then pass the returned, cited information to the model or
  human. The model must not be asked to discover components independently.

Include the command for the project's existing validation CLI only where it
still adds value; do not present it as a competing context system.

**Verify**: a new contributor can follow either path from the documentation
without needing to inspect source code first.

### Step 5: Rehearse the offline prerequisite

Before travel, while online:

1. Clone or update the pinned `dsds-tools` checkout.
2. Install its declared dependencies and confirm Node can run both surfaces.
3. Install or cache `dsds-mcp` if using the published MCP package.
4. Run the Step 3 CLI workflow with the network disabled or unavailable.
5. Record the exact preparation command and a short failure-recovery checklist.

**Verify**: the CLI `list`, `search`, `context`, `validate`, and `doctor`
commands work against the local Site Kit corpus without a network request.

## Test plan

- Configuration discovery uses `dsds.config.*` from the repository root.
- CLI stdout is parseable JSON and stderr contains only diagnostics.
- `dsds search "warning"` finds `ds-callout`; `dsds context ds-button` returns
  documented constraints and source references.
- Missing configuration and invalid source documents return nonzero exit codes.
- MCP and CLI see the same entities from the same Site Kit file.
- The offline rehearsal exercises the prepared local CLI, not a first-time
  `npx` download.

## Done criteria

- [ ] The upstream toolchain is pinned to a reviewed immutable revision.
- [ ] The Site Kit is discoverable through both CLI and MCP configuration.
- [ ] Grounded component context is demonstrated for at least `ds-callout`,
  `ds-button`, and one form component.
- [ ] Configuration and schema failures have tested actionable diagnostics.
- [ ] The shell-only workflow has no dependency on live network access after
  preparation.
- [ ] No duplicate retrieval, context-package, MCP, CLI, or Gum implementation
  was added to this repository.
- [ ] Plan 003 is marked `DONE`.

## Follow-on plan consequences

- **Plan 004:** rewrite as an optional local-model consumption and evaluation
  plan. It may call the prepared CLI, but must not recreate retrieval.
- **Plan 005:** remove from the MVP unless a later user study proves a Gum UI
  adds value beyond `dsds-cli`.
- **Plan 006:** retain as the release gate, rewritten around pinned installs,
  cached dependencies, and an offline rehearsal.

## STOP conditions

- The upstream MCP or CLI no longer provides the documented query/context
  contract at the reviewed revision.
- A required workflow needs parsing arbitrary source code rather than consuming
  documented DSDS entities and extensions.
- MCP and CLI resolve different Site Kit inputs from the same repository config.
- Offline operation requires a first-time registry download or a network-only
  service.
