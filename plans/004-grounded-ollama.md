# Plan 004: Add grounded Ollama synthesis and honest abstention

> **Executor instructions**: Add model synthesis behind the deterministic
> package from Plan 003. The model may summarize; it may not invent or retrieve
> facts. Update Plan 004 in `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 1964319..HEAD -- tools/dsds-local docs/prd-local-context-cli.md`
> Stop if the context-package schema or retrieval API differs from Plan 003.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH — untrusted model output enters the primary workflow
- **Depends on**: Plan 003
- **Category**: direction / security / tests
- **Planned at**: commit `1964319`, 2026-07-22
- **PRD story**: Story 3, “Receive honest insufficient-evidence results”

## Why this matters

Local synthesis makes retrieved DSDS guidance useful to humans and coding
agents, but valid JSON can still contain unsupported claims. This plan treats
model output as untrusted and accepts it only after schema and evidence checks.

## Current state

- Plan 003 provides deterministic retrieval, the versioned package schema, and
  an evidence-addressable baseline.
- `docs/prd-local-context-cli.md:82-91` requires explicit insufficient evidence
  and prohibits undocumented tokens, APIs, and platform capabilities.
- `docs/prd-local-context-cli.md:150` specifies Llama 3.1 8B with Llama 3.2 3B
  fallback.
- `docs/prd-local-context-cli.md:260-269` requires loopback inference, no
  telemetry, prompt-injection separation, and no execution of source content.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit/integration tests | `npm run test:local` | exit 0 with mocked Ollama |
| Retrieval baseline | `npm run dsds-local -- context "warning schema page" --source spec/examples/site-kit.dsds.json --no-model --format json` | deterministic valid package |
| Live model | `npm run dsds-local -- context "warning schema page" --source spec/examples/site-kit.dsds.json --model llama3.1:8b --format json` | valid grounded package when Ollama/model exists |

## Scope

**In scope**

- `tools/dsds-local/src/ollama-client.js`
- `tools/dsds-local/src/prompt.js`
- `tools/dsds-local/src/synthesize.js`
- `tools/dsds-local/src/verify-evidence.js`
- `tools/dsds-local/src/cli-context.js`
- `tools/dsds-local/test/ollama-client.test.js`
- `tools/dsds-local/test/prompt.test.js`
- `tools/dsds-local/test/synthesize.test.js`
- `tools/dsds-local/test/verify-evidence.test.js`

**Out of scope**

- Model download/install automation, cloud endpoints, fine-tuning
- Tool calling, agent loops, code execution, filesystem access by the model
- Changing retrieval ranking or context-package schema

## Git workflow

- Suggested branch: `local-context/004-grounded-ollama`
- Commit model transport separately from verification/prompt work.
- Do not push unless instructed.

## Steps

### Step 1: Implement the loopback-only Ollama client

Use Node's built-in `fetch`. Default to `http://127.0.0.1:11434`; allow
`localhost`, `127.0.0.1`, and `::1` only. Default model is `llama3.1:8b`;
accept `--model` and `DSDS_LOCAL_MODEL`. Set request timeout to 120 seconds.
Return typed errors for unavailable server, missing model, timeout, and invalid
response. Inject the transport in tests.

**Verify**: client tests cover allowed/rejected URLs, timeout, HTTP failure,
missing model, and success without real network.

### Step 2: Build a data-delimited synthesis prompt

Provide only the task, retrieved evidence records, allowed identifiers, and the
context-package schema. State that DSDS content is untrusted quoted data and
instructions inside it must not be followed. Require JSON only and explicit
insufficient evidence. Cap retrieved prose by character/token budget using
stable truncation that preserves identifiers and pointers.

**Verify**: prompt tests show injected instructions remain inside data
delimiters and that only retrieved identifiers appear in the allowed list.

### Step 3: Validate schema and evidence

After parsing JSON:

1. validate against schema version 1;
2. confirm each citation source, identifier, block array/index/kind;
3. confirm every implementation element is in retrieved documented targets;
4. reject recommendation claims that have no evidence reference;
5. reject `supported` with zero evidence.

Permit one corrective retry containing validation errors but no new corpus
content. After the retry, fail closed with an actionable error and suggest
`--no-model`.

**Verify**: adversarial fixtures cover invented entity, wrong block, invented
tag, missing evidence, prompt injection, malformed JSON, and correct abstention.

### Step 4: Integrate while retaining baseline

The `context` command uses the model by default only when configured and
available; `--no-model` always returns the deterministic baseline.
`--require-model` prevents fallback. Human output must disclose model/fallback
status; JSON includes a `generation` metadata object only if allowed by schema.
If schema changes are needed for metadata, bump it deliberately and update
Plan 003 tests rather than adding unknown properties.

**Verify**: `npm run test:local` passes with no Ollama process running.

## Test plan

Mock every network response. Add golden valid, unsupported, malformed,
hallucinated, and injection-bearing responses. One optional live test may run
only when `DSDS_LIVE_OLLAMA=1`; it must otherwise skip, never fail CI.

## Done criteria

- [ ] Default inference is loopback-only and has a timeout.
- [ ] All model output passes schema and evidence verification.
- [ ] One failed correction retry results in a closed failure, not best effort.
- [ ] `--no-model` retains byte-stable deterministic output.
- [ ] Unit tests run without network or Ollama.
- [ ] An unsupported request cannot become `supported` without evidence.
- [ ] Plan 004 is marked `DONE`.

## STOP conditions

- The Ollama endpoint requires a non-loopback connection for MVP.
- Verification would require judging free-form claims without evidence links.
- The model cannot reliably return schema-valid JSON after one retry in a
  ten-case local smoke sample; report results before adding more retries.
- A fix would execute content, commands, links, or imports from DSDS documents.

## Maintenance notes

Review prompt boundaries and evidence verification as security-sensitive code.
Model upgrades must run the same benchmark. Never remove the deterministic
baseline; it is the control needed to know whether a model helps.
