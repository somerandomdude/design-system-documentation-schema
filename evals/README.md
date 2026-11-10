# Agent eval for the DSDS site

A small check that an agent can write a valid DSDS document from the site's pages alone. Run it at release time, not in CI: it's slow, and an agent's answers vary from run to run.

## One version only

`evals/context/` holds the pages of the current version and nothing else. The scorer refuses to run if they're from another version. At each release, after `npm run build`, refresh them:

```
node evals/refresh-context.mjs
```

`evals/context/tokens.dtcg.json` is a fixture, not a page. The refresh keeps it.

## Running a round

1. Bump the version and build. The context has to match the release.
2. Refresh the context (above).
3. Give each task in `tasks.json` to its own agent. Each agent reads only the 16 pages in `evals/context/`, plus `tokens.dtcg.json` for tasks 02 and 03. Tell it not to read the repository, browse, or run commands. Ask for one fenced YAML block and nothing else.
4. Save each answer as `evals/results/<version>-<label>/<task-id>.md`, exactly as the agent returned it.
5. Score it: `node evals/score.mjs <version>-<label>`. This writes `summary.json` and prints one line per task.

A task passes when its answer parses, has no validator errors, and meets every check. Warnings are shown but not counted, because a single-file answer can't always see the entries it points at. Token tasks check that the `source` pointer resolves, in `tokens.dtcg.json`, to a token holding the expected value.

## Decisions

- **`$schema` goes on base documents only.** Entry files don't take it. Editors can map entry files to the schema in their settings instead. Tasks 07 and 11 failed in the first round because the Quick Start showed `$schema` on a component entry. The example now shows a base document, and both tasks pass.
- **The validator doesn't check DTCG pointers.** DSDS doesn't parse what a `source` points at (see Interoperability). The token checks live in this eval only.

## Runs

| Run | Context | Score | Notes |
|---|---|---|---|
| `candidate-0.23.2` | 0.23.2, first round | 9/12 | 07 and 11 added `$schema` to entries. 09 used `relates-to` instead of `alternatives`. |
| `candidate-0.23.2-after-alternatives` | 0.23.2, with the `alternatives` mapping | 10/12 | 09 now passes. 07 and 11 still fail. |
| `candidate-0.23.2-after-schema-fix` | 0.23.2, with the base-document example | 12/12 | 07 and 11 rerun against the corrected context. The other 10 answers came from earlier context. A full run is needed before calling this clean. |

Earlier, for 0.23.1, a baseline run scored 4/12. Its context and results were removed when the eval moved to one version.

## Limits

- One sample per task. Tasks 09, 07 and 11 each changed between runs, so a single change in score isn't proof. Repeat a task several times before you trust a change.
- The default model was used, Claude Haiku 5.5. Scores aren't comparable across models.
- A check is pass or fail. It doesn't judge whether the document says what the author meant.
