# Plan 006: Prove offline operation and flight readiness

> **Executor instructions**: This is the MVP release gate. It must be runnable
> after dependencies and models are preloaded, without cloud services. Update
> Plan 006 in `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 1964319..HEAD -- tools/dsds-local package.json package-lock.json docs/prd-local-context-cli.md`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — environment and benchmark assumptions
- **Depends on**: Plans 004 and 005
- **Category**: tests / DX / security
- **Planned at**: commit `1964319`, 2026-07-22
- **PRD story**: Story 4, “Operate completely offline”

## Why this matters

Offline privacy and flight usability are product requirements, not marketing
claims. This plan creates a versioned benchmark, a diagnostic command, and a
repeatable procedure that proves the runtime uses only local files and a
loopback Ollama process.

## Current state

- `docs/prd-local-context-cli.md:93-102` prohibits runtime network dependence,
  telemetry, cloud fallback, accounts, and remote storage.
- `docs/prd-local-context-cli.md:157-188` requires at least 50 cases for v1.1;
  the MVP roadmap starts with 20.
- The reference machine is a 16 GB M1 Pro. Llama 3.1 8B is primary and Llama
  3.2 3B is fallback.
- Plans 001-005 provide the CLI, corpus, baseline, model path, and Gum adapter.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| All checks | `npm run validate && npm run test:local` | both exit 0 |
| Doctor | `npm run dsds-local -- doctor --source spec/examples/site-kit.dsds.json --model llama3.1:8b --json` | local prerequisites reported |
| Deterministic benchmark | `npm run dsds-local -- benchmark --dataset tools/dsds-local/benchmark/mvp.json --no-model` | report with 20 cases |
| Live benchmark | same command with `--model llama3.1:8b` | scored report when model is present |

## Suggested executor toolkit

The benchmark-data portion is suitable for a local Llama 3.1 8B executor after
the benchmark schema and first four reviewed examples exist. Assign records in
small batches. Davy must approve expected entities, prohibited claims, and
abstention rationales; the model must not grade or approve its own output.

## Scope

**In scope**

- `tools/dsds-local/benchmark/mvp.json`
- `tools/dsds-local/src/benchmark.js`
- `tools/dsds-local/src/doctor.js`
- `tools/dsds-local/src/network-policy.js`
- `tools/dsds-local/bin/dsds-local.js`
- `tools/dsds-local/test/benchmark.test.js`
- `tools/dsds-local/test/doctor.test.js`
- `tools/dsds-local/test/network-policy.test.js`
- `tools/dsds-local/README.md`
- `package.json`

**Out of scope**

- Downloading Ollama/models, Homebrew automation, telemetry, cloud fallback
- The 50-case v1.1 benchmark
- Performance promises for hardware other than the documented reference machine

## Git workflow

- Suggested branch: `local-context/006-offline-flight-readiness`
- Keep benchmark/data changes separate from doctor/docs changes.
- Do not push unless instructed.

## Steps

### Step 1: Create the 20-case MVP benchmark

Use the Site Kit and starter-kit corpora. Each case includes:

```json
{
  "id": "site-kit-warning-page",
  "task": "Build a schema page with warning guidance and JSON source",
  "source": "spec/examples/site-kit.dsds.json",
  "expectedStatus": "supported",
  "allowedEntities": ["ds-callout", "ds-json-view", "ds-code"],
  "requiredEntities": ["ds-callout"],
  "prohibitedClaims": ["React component", "cloud service"]
}
```

Include at least four deliberately unsupported cases. Store reviewer-approved
expected entities and abstention rationales; do not store model prose as truth.

**Verify**: benchmark tests reject duplicate IDs, missing sources, invalid
statuses, nonexistent allowed entities, and unsupported cases without rationale.

### Step 2: Implement deterministic scoring

Report per case and aggregate:

- grounded task success
- citation validity
- correct abstention
- invented/disallowed entity count
- schema validity
- latency percentiles

Exit 0 only when configured thresholds pass; `--report <path>` writes JSON
without overwriting unless `--force`. Model and no-model runs use identical
cases.

**Verify**: fixture reports produce known percentages and correct exit codes.

### Step 3: Add local doctor and network policy

`doctor` checks Node version, Gum presence, source validity, Ollama loopback
reachability, requested model availability, writable output directory, and
free disk space. It reports; it never installs or downloads.

Centralize a policy that rejects non-loopback inference URLs and any future
HTTP destination not explicitly categorized. Tests monkeypatch transport and
prove no external host is contacted by validate, context, benchmark, or doctor.

**Verify**: `npm run test:local -- --test-name-pattern="doctor|network"` passes
with networking unavailable.

### Step 4: Write the flight checklist and offline procedure

Document preflight:

- clone/fetch the working branch;
- run `npm install`, validation, and tests;
- install Gum and Ollama outside this tool;
- preload `llama3.1:8b` and optionally `llama3.2:3b`;
- run doctor and one live benchmark;
- switch off Wi-Fi and repeat validate, context, and benchmark;
- keep at least one deterministic `--no-model` path available;
- make local commits during the flight.

Record measured P50/P95 latency and peak memory on the reference M1 Pro rather
than guessing.

**Verify**: follow the documented procedure with Wi-Fi disabled; all runtime
steps except an intentionally skipped model download succeed.

## Test plan

Validate benchmark data, scoring math, thresholds, JSON reports, doctor checks,
loopback policy, external-host rejection, and no-model operation. Live-model
evaluation remains opt-in and records model ID plus hardware.

## Done criteria

- [ ] The 20-case benchmark is valid and version controlled.
- [ ] At least four unsupported cases test honest abstention.
- [ ] Automated tests require no network, Gum, or Ollama.
- [ ] Doctor performs no installation or download.
- [ ] All configured inference remains loopback-only.
- [ ] The documented workflow succeeds with Wi-Fi disabled.
- [ ] Reference-machine latency/memory results are recorded.
- [ ] Plan 006 is marked `DONE`.

## STOP conditions

- Any runtime path silently falls back to a remote service.
- Offline success depends on uncached npm packages or model downloads.
- The benchmark cannot distinguish retrieval failure from synthesis failure.
- The 8B model causes persistent memory pressure on the reference machine;
  record the result and make 3B the documented flight default instead of
  weakening the benchmark.

## Maintenance notes

Run this gate before releases and model changes. Keep expected facts tied to
DSDS entities rather than exact prose. Expand to 50 independently reviewed
cases in v1.1 without changing the original 20-case IDs.
