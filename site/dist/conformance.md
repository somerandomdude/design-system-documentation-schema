# Conformance — DSDS 0.20.0

What it means for a document to follow the DSDS spec: every rule it enforces, and how each one is checked. For what might still change before 1.0, see [Stability](stability.html). For how the schema itself is organized — the shapes every entry, section, and reference is built from — see [How the schema is organized](schema.html#how-the-schema-is-organized).

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** have a specific meaning on this page and inside the DSDS schema files, as defined by [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) (updated by [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)). They only carry that meaning when written in capital letters.

## Where the rules live

DSDS keeps its rules inside the schema's own `description` text, next to the field they apply to — the schema *is* the spec, with no separate rulebook to keep in sync. The [index of every normative statement](https://github.com/somerandomdude/design-system-documentation-schema#index-of-every-rule) regenerates from the schema on every build, so it can't drift out of date. Each rule has a location-based ID (for example, `common/ref§note.1`) — if that ID changes, the schema moved, and the rule should be double-checked wherever it's cited.

## Conformance classes

DSDS defines four ways something can "follow the spec" — a document, and the tools that create, read, and check it. State which one you mean.

### Conforming document

A document that passes schema validation for the version named in its `schemaVersion`, **and** the extra rules below (`DSDS-01` through `DSDS-11`) that a schema file alone can't check. Passing schema validation on its own isn't enough.

### Conforming producer

A tool or person that creates DSDS documents. A conforming producer:

- MUST only create documents that follow the spec
- MUST NOT use an outdated field or shape in new documents (old shapes are kept around only so existing documents keep working)
- SHOULD record how a document was created, using `metadata.origin`

### Conforming consumer

A tool, renderer, or AI agent that reads DSDS documents. A conforming consumer:

- MUST NOT fail just because it sees an optional field it doesn't recognize
- MUST keep `$extensions` data intact even if it doesn't understand it
- MUST treat an unresolvable reference (an `entryId#itemId` pointing nowhere) as an error, not silently ignore it
- MUST take MUST/SHOULD-style guidance as seriously as the spec says to — a `must-not` guideline is a hard stop for an agent writing code, not a suggestion
- SHOULD build its own "what points to what" index when it loads a document, rather than expect the document to store that answer directly
- MUST be able to address every section item, whether or not it was written with an `id` — when one is missing, derive it from the item's own text (lowercase, non-alphanumeric runs collapsed to a dash), the same way every other conforming tool does. See [common/id](schema.html#common-id).

### Conforming validator

A tool that checks documents. A conforming validator MUST enforce both the schema itself (with format checks on) and the extra rules below (`DSDS-01`–`DSDS-11`). `scripts/validate.js` is the reference implementation. Its `examples/invalid/` folder holds one broken example per semantic rule (`DSDS-XX-*.yaml`) plus a set of schema-shape fixtures (`schema-*.yaml`, no rule id — a pure JSON Schema rejection) pinning constraints like enum casing, empty arrays, and `$extensions` namespacing. Every fixture declares its own contract in a leading comment — `# rejectedBy: schema|semantic`, plus `# expect: DSDS-XX` or `# errorAt: /json/pointer` as applicable — and `scripts/conformance-test.js` confirms each one fails for the exact reason and at the exact layer it claims to, not just that it fails at all.

## Enforcement tiers

Every rule is enforced one of three ways:

| Tier | How it's checked | What happens if it fails |
|---|---|---|
| Structural | Directly by the schema file (required fields, patterns, and similar built-in checks) | Blocks — validation fails |
| Semantic | By `scripts/validate.js`'s own code (`DSDS-01`–`DSDS-11`: do references resolve, are ids unique, and so on) | Blocks — validation fails |
| Advisory | By `scripts/lint-docs.js` (`npm run lint:docs`, `DSDS-12`+: RFC 2119 casing, a token description that just restates its id, and similar documentation-quality checks) where a check exists — otherwise a judgment call | Never blocks — always exits 0, warnings only |

Advisory is the newest tier and doesn't cover every SHOULD/MAY in this spec yet — it's additive, so a gap here is a missing check, not a passing one.

`DSDS-05`, `DSDS-08`, `DSDS-09`, and `DSDS-11` are the exception: they report a warning, not a blocking error, unless the validator runs with `--strict`. Every other rule always blocks.

Every catalog entry declares its own tier explicitly, as `enforcement: structural|semantic|advisory|none` — not just implied by which row of this table it's listed in. `scripts/check-rule-catalog.js` (run on every `npm run check`) enforces two things: every entry's `enforcement` is one of those four values, and — for the semantic tier specifically — that the catalog and `scripts/validate.js` agree exactly on which rules exist in both directions. A catalog entry with no matching `RULES.<NAME>` reference in validate.js, or a `RULES.<NAME>` reference with no catalog entry, fails the build instead of silently producing an untraceable `[undefined]` finding.

## Rule catalog

The machine-readable list is [`schema/conformance-rules.yaml`](https://github.com/somerandomdude/design-system-documentation-schema/blob/main/schema/conformance-rules.yaml). This table is kept in sync with it by hand, but `scripts/conformance-test.js` and `scripts/check-rule-catalog.js` (both run on every `npm run check`) would catch it if the two ever drifted apart.

<ds-callout variant="warning" title="DSDS-01–DSDS-15 is a reset id space, not a continuation of pre-0.20.0's:">

Versions through 0.15.2 used a three-digit catalog (`DSDS-001`–`DSDS-006` and similar, in `rules/rules.yaml`) covering a different rewrite of the model entirely. 0.20.0 restarted numbering at `DSDS-01` for a genuinely different rule set — `DSDS-02` here has nothing to do with whatever `DSDS-002` meant before. (0.15.2's own `DSDS-002` was, fittingly, the rule against reusing an identifier — a reminder this reset itself is worth naming explicitly rather than leaving implicit.) If you're citing a rule id from before 0.15.2, say which catalog it's from; a bare `DSDS-0N` is ambiguous across the two.

</ds-callout>

| ID | Rule |
|---|---|
| `DSDS-01` | At most one `sourceFiles` entry per platform. |
| `DSDS-02` | A system entry's `metadata.platforms` closes the platform vocabulary, once declared. |
| `DSDS-03` | A `checkedBy: automated` rule needs somewhere to actually run. |
| `DSDS-04` | Entry and shared ids are unique within a document. |
| `DSDS-05` | An `entryId#itemId` ref must resolve. |
| `DSDS-06` | A `composes` ref chain must not cycle. |
| `DSDS-07` | A `depends-on` ref chain must not cycle. |
| `DSDS-08` | A bare `to:` ref must resolve to a real entry or shared entry. |
| `DSDS-09` | A `combo`'s `subject`/`items` must resolve to a real trait, token, or entry. |
| `DSDS-10` | A `same-as` item's `level` must match its target's. |
| `DSDS-11` | A relative `sourceFiles[].file`/`source`/`rel: file` `href` actually exists on disk. |
| `DSDS-12` | Advisory: capitalize RFC 2119 keywords (MUST/SHOULD) in a guideline's own statement. |
| `DSDS-13` | Advisory: a token `description` shouldn't just restate its id/name or repeat a raw value. |
| `DSDS-14` | Advisory: a hard-requirement guideline (must/must-not) with no `checkedBy` at all. |
| `DSDS-15` | Advisory: a component entry with no `guidelines` section framed `when-to-use`. |

`DSDS-06` and `DSDS-07` restore a cycle check the pre-0.20.0 spec had — nothing should point back at itself through a chain of `composes` or `depends-on` links. The 0.20.0 rewrite dropped it by accident; it's enforced by the validator's own code now, not the schema shape.

### Project-scope resolution

`DSDS-05`, `DSDS-08`, and `DSDS-09` check the whole **project**, not just the one document they're given. A `rel: file` link (the way the spec recommends splitting up a large system) joins the resolution pool, and so does every other file passed to the validator in the same run, even without a link between them — the way a standalone entry file, with no field of its own to declare "these are my siblings," still resolves a reference to a component listed alongside it.

The search is bounded to the folder holding the file being validated, and its subfolders — never a parent folder, a sibling folder, or the wider repo. Deliberately narrow: widening it to the nearest `.git` or `package.json` would let a CI job checking one untrusted document read far more of a monorepo than it should. A future `--root` flag could widen it on request; nothing has needed one yet.

An unresolved reference is a **warning**, not a failure, only in this cross-file case — a self-contained document's unresolved `to:` is still a hard error. A standalone entry file is the one exception even then, since it can never assert "this is definitely everything" the way a base document's `entries`/`shared` arrays can. Run with `--strict` to turn these warnings into failures.

Whether a `to:` value even *looks like* a valid id is checked separately, directly by the schema: `common/ref.schema.yaml`'s `to` field only accepts id-shaped values, so a display name or a value with a space in it fails before `DSDS-05`, `DSDS-08`, or `DSDS-09` ever run. See [common/ref](schema.html#common-ref).

**`DSDS-11`** covers one of these: whether a relative `sourceFiles[].file`, `source`, or `rel: file` `href` actually points at a file that exists on disk, checked relative to the file being validated and bounded to the same directory-of-the-target boundary as `DSDS-05`/`DSDS-08`/`DSDS-09`. It applies to a base document's own top-level `refs` as well as to each entry's. Warning-only, promoted to a failure under `--strict`, same tier and same reason — it's opt-in because it's the one rule that reads the filesystem beyond the document being validated. A related check remains deliberately unbuilt: confirming the exact ids or paths *inside* another file the way DTCG-path resolution would need — that would mean actually reading and parsing the target's contents, not just confirming it exists.

## Open conventions

The schema deliberately leaves some questions unanswered — not oversights, but places where a fixed rule would fit some teams and not others.

- **Where does a guideline item's pointer go — `refs`, or a named field?** `alternatives`, `evidence`, `related`, and `checks` each exist for one specific `rel`: `alternative-to`, an external standard, `refines`, and `test`/`lint-rule`. Any other `rel` — `extends`, `depends-on`, `composes`, `part-of`, `replaces`, `implements`, `relates-to`, `pairs-with`, `excludes`, `see-also` — goes in the general-purpose `refs` field instead, alongside `same-as` and `external-link`. See [sections/guidelines](schema.html#sections-guidelines).
- **Where does an entry's primary source file go?** `refs` with `rel: source` — see [common/ref](schema.html#common-ref).
- **What does `tags[0]` mean?** The first tag, by convention, is the entry's main category — see [metadata](schema.html#metadata-metadata).
- **How does a token's `source` point at one key inside a shared DTCG file, not just the whole file?** By convention, a token's own `id` doubles as its path in the DTCG token tree — `color.action.primary` names the same token in both places, which is why `entries/token.id` allows slash separators DSDS ids otherwise don't. When a project's DTCG paths don't line up with its DSDS ids, point `source`'s `href` at the file plus a JSON Pointer fragment instead (`./tokens.dtcg.json#/color/action/primary`) — ordinary URI syntax, no schema change.
- **What is a component's status when it ships on more than one platform?** Author one `metadata.status` entry per platform and let the overall status be *inferred* from them, rather than stating a separate overall value that can silently disagree. See [Status across platforms](#status-across-platforms) below.

## Status across platforms

A component rarely reaches the same maturity everywhere at once: stable on web, beta on iOS, not started on Android. `metadata.status` accepts either a single object or a list of them, each optionally naming its own `platform`.

```yaml
metadata:
  status:
    - platform: react
      status: stable
      since: "1.0.0"
    - platform: ios
      status: beta
      since: "2.0.0"
```

**A consumer SHOULD derive a component's overall status from the aggregate of its per-platform entries, rather than expect a separately authored overall value.** There is no `overall` field, deliberately: a stated overall status is a second source of truth that drifts the moment one platform moves, and every consumer that needs one can compute it consistently from the entries that are already there.

How to aggregate is the consumer's decision, because it depends on the question being asked. Two conventions cover most cases:

- **Least-mature wins** — the honest answer to "can I depend on this everywhere?" A component that is `stable` on web and `beta` on iOS is `beta` overall.
- **Per-platform, unaggregated** — the honest answer to "can I depend on this *here*?" A renderer showing a React developer the React status shouldn't dim it because iOS lags.

A producer SHOULD declare `metadata.platforms` on the system entry when a document uses per-platform statuses, so a consumer can tell the difference between a platform that is deliberately unsupported and one that simply has no status entry yet (`DSDS-02` then closes that vocabulary). A single status object with no `platform` still means exactly what it always did: this entry's status, everywhere.

## Passing isn't the same as good

A document with zero errors and zero warnings can still be bad documentation — the schema checks structure, not judgment. `examples/anti-patterns/` collects a few small documents that validate cleanly and are still worth avoiding: a definition that only restates its own term, a `checkedBy: manual` claim too vague to actually check, and guideline prose that names a concept (a "token-group" entry) the spec doesn't have. Each file's own leading comment says what's wrong with it and why the schema can't catch it. Deliberately excluded from the default `npm run check` sweep — not meant to be copied.
