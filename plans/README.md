# DSDS Local Context CLI Implementation Plans

Generated with the `improve` planning workflow on 2026-07-22. These plans
translate the six user stories in `docs/prd-local-context-cli.md` into
self-contained work units. Execute them in order unless the dependency column
says otherwise.

Each executor must read its plan fully, run every verification gate, honor the
STOP conditions, and update its row when finished.

## Execution order and status

| Plan | PRD story | Title | Priority | Effort | Preferred executor | Depends on | Status |
|---|---:|---|---|---|---|---|---|
| 001 | 5 | Establish the CLI and DSDS validation foundation | P1 | M | Davy + Codex | — | IN PROGRESS |
| 002 | 6 | Document the DSDS Site Kit and codify its authoring contract | P1 | M | Davy + Codex | — | DONE |
| 003 | 1 | Generate deterministic agent context packages | P1 | L | Davy + Codex | 001, 002 | TODO |
| 004 | 3 | Add grounded Ollama synthesis and honest abstention | P1 | L | Davy + Codex | 003 | TODO |
| 005 | 2 | Add the optional Gum-guided workflow | P2 | M | Davy + Codex | 003, 004 | TODO |
| 006 | 4 | Prove offline operation and flight readiness | P1 | M | Davy + Codex; benchmark-data subtask is a local-model candidate | 004, 005 | TODO |
| 007 | — | Add the exploratory `ds-button` primitive | Exploratory | S | Davy + Codex | 002 | IN PROGRESS |
| 008 | — | Add the exploratory `ds-link` primitive | Exploratory | S | Davy + Codex | 002, 007 | IN PROGRESS |
| 009 | — | Add the exploratory `ds-text-input` primitive | Exploratory | S | Davy + Codex | 002, 007, 008 | IN PROGRESS |
| 010 | — | Add the exploratory `ds-checkbox` primitive | Exploratory | S | Davy + Codex | 002, 009 | IN PROGRESS |

Status values: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED: <reason>`, or
`REJECTED: <reason>`.

## Dependency notes

- Plan 001 establishes the command, loader, validation API, and test harness
  used by every later plan.
- Plan 002 creates the first real implementation-aware DSDS corpus and the
  project-owned Web Components authoring skill. Retrieval and benchmark
  assertions in later plans depend on its stable identifiers.
- Plan 003 deliberately ships a retrieval-only baseline before model
  integration, so model value can be measured instead of assumed.
- Plan 004 adds Ollama behind the same context-package contract and makes
  unsupported claims mechanically rejectable.
- Plan 005 remains a presentation layer over the tested non-interactive CLI.
- Plan 006 is the release gate: it packages the benchmark, local prerequisites,
  and a repeatable no-cloud verification procedure.

## Ownership and offline-executor strategy

Davy and Codex are the primary product and engineering team. A local Llama
model is an optional executor for one or two bounded tasks during offline work;
it does not own architecture, security boundaries, model evaluation design, or
integration decisions.

The August 14 flight candidate should be selected shortly before travel based
on actual project progress:

1. **Preferred component candidate:** implement one separately scoped Site Kit
   primitive using the version-controlled authoring skill. Select the primitive
   shortly before travel based on a real product need; do not ask the local
   model to invent the component contract.
2. **Benchmark candidate — part of Plan 006:** author benchmark records from an
   approved template, while Davy reviews expected entities and abstention
   rationales. The local model must not set evaluation policy or approve its own
   answers.

Do not delegate Plans 003 or 004 wholesale to the local model. Retrieval
scoring, evidence boundaries, prompt-injection handling, and fail-closed
behavior require architectural judgment and adversarial review.

“Vector mapping” is only a flight task if it means deterministic mapping of
entities, blocks, tags, or component metadata. Embeddings/vector search remain
out of MVP scope unless the lexical baseline fails a measured benchmark.

## Scope decisions

- MVP source code lives under `tools/dsds-local/` and uses CommonJS, matching
  the root package. Extraction into a published package is deferred.
- Llama 3.1 8B is the primary reference model; Llama 3.2 3B is the fallback.
- The existing Web Components are a reference target, not a requirement of the
  DSDS schema.
- The first release creates context for a downstream coding agent; it does not
  generate or apply production UI code.

## Findings considered and rejected

- **Build a generic UI component kit:** rejected because the repository already
  contains suitable DSDS-native Web Components and the MVP needs a grounded
  reference corpus, not a second design system.
- **Add React, Vue, or Astro wrappers:** rejected for MVP because it expands the
  implementation surface without improving the framework-neutral context
  contract.
- **Add embeddings or a vector database:** rejected until lexical retrieval
  fails a measured benchmark; it adds installation and offline complexity.
- **Adopt TypeScript immediately:** rejected for MVP because the repository is
  CommonJS and has no TypeScript toolchain. Reconsider after the CLI contract
  stabilizes.
- **Fine-tune the model:** rejected until the same benchmark compares
  deterministic retrieval, prompted 8B inference, and the 3B fallback.
