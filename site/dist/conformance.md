# Conformance — DSDS 0.15.2

# Conformance

This page defines what it means to conform to the Design System Doc Spec {{VERSION}}, and indexes every normative statement the spec makes.

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** in the DSDS schemas and on this page are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) (as clarified by [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)): they are normative only when they appear in upper case.

## Where the normative text lives

DSDS keeps its normative language inside the schema `description` strings, next to the structures that enforce it. The schema *is* the specification — not a picture of one. The index at the bottom of this page is **generated from the schemas** on every build, so it can't drift from them. Cite statements by their location-based ID (e.g. `common/link§link.kind.1`). An ID only changes when the schema path it points to changes — that's the signal that a citation needs a re-check.

## Conformance classes

DSDS defines four conformance classes. A claim of conformance names the class it applies to.

### Conforming document

A JSON document that validates against the DSDS schema for the version its `dsdsVersion` declares, **and** satisfies the semantic rules that JSON Schema alone can't express:

- identifier uniqueness
- reference resolution
- relationship-graph integrity
- token-layer resolution
- `tokenType` inheritance
- `docOrigin` block-key resolution
- extension-key namespacing

Schema validity alone is necessary, but not sufficient.

### Conforming producer

A tool or person that emits DSDS documents. A conforming producer:

- MUST emit conforming documents
- MUST NOT emit deprecated forms in new output (a deprecated form exists only for reading old documents, never for writing new ones — as of 0.14.0, nothing is deprecated)
- SHOULD record how the documentation was produced, via the `docOrigin` metadata field

### Conforming consumer

A tool, renderer, or agent that reads DSDS documents. A conforming consumer:

- MUST NOT fail on optional fields it doesn't recognize
- MUST preserve `$extensions` data it doesn't understand
- MUST treat unresolvable references as defects, not silently drop them
- MUST respect RFC 2119 levels on guidance it acts on (a `must-not` guideline is a hard gate for an agent writing code)

### Conforming validator

A tool that checks documents. A conforming validator MUST enforce both the structural layer (the JSON Schema, with format assertion enabled) and the semantic layer. It SHOULD also surface the lint layer (the rules catalog in `rules/rules.yaml`) as non-blocking diagnostics. The reference implementation is `scripts/validate.js`. Its negative-fixture suite in `test/invalid/` pins every guard, and doubles as a conformance test suite for independent validators.

## Enforcement tiers

Every normative statement is enforced at one of three tiers, or is explicitly advisory:

| Tier | Mechanism | Failure mode |
|---|---|---|
| Structural | JSON Schema (patterns, required, minItems, conditionals) | Validation error — blocking |
| Semantic | Reference implementation checks (resolution, uniqueness, inheritance, cycles) | Validation error — blocking |
| Lint | Rules catalog (`rules/rules.yaml`, DSDS-001…) | Warning — never blocking |
| Advisory | SHOULD/MAY statements consumed by judgment | None |

## Normative statements index

{/* dsds:normative-index */}

*Generated from the v{{VERSION}} schemas by `scripts/extract-normative.mjs` — do not edit by hand. 148 statements: 54 MUST, 23 MUST NOT, 55 SHOULD, 2 SHOULD NOT, 14 MAY.*

### common

#### common/criterion

- **MUST** — 'automated': a fully objective test checked programmatically; a `check` MUST be present. <small>`common/criterion§verificationMode.1`</small>
- **MUST NOT** — When omitted, tools MUST NOT assume the criterion is automatable. <small>`common/criterion§verificationMode.2`</small>
- **MUST** — Any process that doesn't recognize the tool MUST report the criterion as skipped, never as passing. <small>`common/criterion§criterionCheck.1`</small>
- **MUST** — MUST be lowercase; dots permitted for namespacing (e.g. 'com.acme.contract-tests'). <small>`common/criterion§criterionCheck.scheme.1`</small>
- **SHOULD** — Test cases make criteria self-verifying: a conformance runner SHOULD execute the criterion's `check` (when present) against each test case and confirm the declared outcome is reproduced — a 'fail' test case that passes means the check no longer detects what it claims to. <small>`common/criterion§criterionTestCase.1`</small>
- **MAY** — When omitted, tools MAY build a label from the URL. <small>`common/criterion§reference.label.1`</small>
- **MUST** — MUST be lowercase kebab-case. <small>`common/criterion§criterion.identifier.1`</small>
- **SHOULD NOT** — Test runs report pass/fail against this identifier, so it SHOULD NOT change once checks depend on it. <small>`common/criterion§criterion.identifier.2`</small>
- **SHOULD** — Tools SHOULD render it in docs and test reports beside the identifier. <small>`common/criterion§criterion.title.1`</small>
- **MUST** — MUST be objectively verifiable by inspection, static analysis, or runtime measurement. <small>`common/criterion§criterion.statement.1`</small>
- **SHOULD** — A criterion referenced by a guideline SHOULD inherit the guideline's `level` when omitted; a standalone criterion SHOULD declare its own. <small>`common/criterion§criterion.level.1`</small>
- **MUST NOT** — Criterion identifiers are stable: once published, an identifier MUST NOT be reused for a different requirement — retire the identifier and make a new one instead. <small>`common/criterion§criterion.since.1`</small>

#### common/dated-note

- **MUST NOT** — MUST NOT contain markup and MUST NOT be empty. <small>`common/dated-note§plainNote.1`</small>

#### common/entity-ref

- **MUST** — Every identifier MUST match a documented entity. <small>`common/entity-ref§(root).1`</small>
- **MUST** — MUST match that entity's `identifier`. <small>`common/entity-ref§entityIdentifier.1`</small>
- **SHOULD** — Tools SHOULD resolve it to build cross-references. <small>`common/entity-ref§entityIdentifier.2`</small>

#### common/example

- **SHOULD** — Tools SHOULD render value-only examples as table rows or inline displays. <small>`common/example§example.1`</small>

#### common/extends

- **MAY** — Tools MAY fetch it for merge, validation, or docs. <small>`common/extends§documentExtends.url.1`</small>
- **SHOULD** — When omitted, tools SHOULD use the latest. <small>`common/extends§documentExtends.version.1`</small>
- **MUST** — MUST match the base entity's `identifier` in the parent system. <small>`common/extends§entityExtends.identifier.1`</small>
- **MAY** — Tools MAY use them for changelogs, diffs, or migration guides; when omitted, tools must diff the entities. <small>`common/extends§entityExtends.modifications.1`</small>

#### common/extensions

- **MUST** — Keys MUST use vendor namespaces. <small>`common/extensions§(root).1`</small>
- **MUST** — Keys MUST use a namespace of at least two dot-separated segments (reverse domain recommended), Example: 'com.figma', 'acme.tooling'; the pattern is case-tolerant. <small>`common/extensions§extensions.1`</small>
- **MUST** — Tools that don't recognize an extension MUST keep it. <small>`common/extensions§extensions.2`</small>
- **SHOULD NOT** — Extension data SHOULD NOT duplicate core schema fields. <small>`common/extensions§extensions.3`</small>

#### common/link

- **MUST** — Custom values MUST match ^[a-z][a-z0-9-]*$. <small>`common/link§link.kind.1`</small>
- **MUST** — MUST be a valid absolute URI. <small>`common/link§link.url.1`</small>
- **MAY** — When omitted, tools MAY build one from the URL. <small>`common/link§link.label.1`</small>

#### common/presentation

- **MUST NOT** — MUST NOT be empty. <small>`common/presentation§mediaAlt.1`</small>
- **MUST NOT** — MUST NOT be empty. <small>`common/presentation§presentationImage.alt.1`</small>
- **MUST NOT** — MUST NOT be empty. <small>`common/presentation§presentationVideo.alt.1`</small>

#### common/relationship

- **MUST** — A relationship's target MUST be a documented entity. <small>`common/relationship§(root).1`</small>
- **MUST NOT** — Tools work out the reverse relationship direction direction (target → source) and MUST NOT require them to be manually authored. <small>`common/relationship§relationType.1`</small>
- **MUST** — Custom relations MUST be vendor-namespaced (e.g. 'acme.themes'). <small>`common/relationship§relationType.2`</small>
- **MUST** — MUST match a documented entity. <small>`common/relationship§relationship.target.1`</small>

#### common/rich-text

- **MUST** — Tools MUST render the value as markdown. <small>`common/rich-text§richText.1`</small>

#### common/status

- **MUST** — MUST be lowercase kebab-case. <small>`common/status§statusValue.1`</small>
- **MUST** — Custom values (ex: 'sunset', 'beta') are allowed and MUST follow the same pattern. <small>`common/status§statusValue.2`</small>
- **MUST** — MUST say what to use instead and, where one exists, give a migration path. <small>`common/status§deprecationNotice.1`</small>

#### common/system-info

- **SHOULD** — SHOULD follow semver so tools can compare it against `extends.version` and `reviewedAgainst`. <small>`common/system-info§systemInfo.version.1`</small>

#### common/token-overrides

- **MUST** — Token references MUST name a documented token, never a raw value. <small>`common/token-overrides§(root).1`</small>
- **MUST** — When the system documents a token layer, each value MUST resolve to a documented token. <small>`common/token-overrides§tokenOverrides.1`</small>

#### common/use-cases

- **SHOULD** — Order matters: tools SHOULD keep it for display, and authors SHOULD lead with recommended scenarios. <small>`common/use-cases§useCases.items.1`</small>

### document-blocks

#### document-blocks/api

- **MUST NOT** — When `schema` is present it is authoritative; `type` is its display summary and MUST NOT disagree with it. <small>`document-blocks/api§apiProperty.type.1`</small>
- **MUST NOT** — When `schema` is present it is authoritative; `values` is its display summary and MUST NOT disagree with it. <small>`document-blocks/api§apiProperty.values.1`</small>
- **MUST NOT** — When present, `schema` is the authoritative type definition; `type` and `values` are display summaries of it and MUST NOT disagree. <small>`document-blocks/api§apiProperty.schema.1`</small>
- **MUST** — MUST say what to use instead (non-empty) and SHOULD give a migration path. <small>`document-blocks/api§apiProperty.deprecationNotice.1`</small>

#### document-blocks/checklist

- **MUST** — MUST be specific — not 'check accessibility'. <small>`document-blocks/checklist§checklistItem.label.1`</small>
- **MUST** — MUST be lowercase kebab-case. <small>`document-blocks/checklist§checklistItem.criterion.1`</small>
- **MAY** — Tools MAY mark optional items differently. <small>`document-blocks/checklist§checklistItem.optional.1`</small>
- **SHOULD** — Tools SHOULD show unordered checklists as checkboxes and ordered ones as a numbered list. <small>`document-blocks/checklist§checklist.ordered.1`</small>
- **MUST** — Order matters when `ordered` is true, so tools MUST preserve it. <small>`document-blocks/checklist§checklist.items.1`</small>

#### document-blocks/content

- **SHOULD** — These SHOULD match other `term` values in this block's `labels` array, so tools can cross-reference them. <small>`document-blocks/content§contentLabelEntry.alternatives.1`</small>
- **SHOULD** — Order matters for display, so tools SHOULD keep it; authors MAY sort alphabetically or by frequency. <small>`document-blocks/content§content.labels.1`</small>
- **SHOULD** — Order matters for display, so tools SHOULD keep it; authors SHOULD lead with the highest-impact concerns. <small>`document-blocks/content§content.localization.1`</small>

#### document-blocks/design-specifications

- **MUST** — If the system has tokens, this MUST be a token identifier (e.g., 'color-action-primary', 'space-4'), not a raw value — that keeps it from drifting out of sync with the token system. <small>`document-blocks/design-specifications§designValue.1`</small>
- **MUST** — Keys say what the value controls (e.g., 'background', 'min-height') and MUST be lowercase kebab-case. <small>`document-blocks/design-specifications§designProperties.1`</small>
- **MUST** — Keys name the relationship (e.g., 'icon-to-label') and MUST be lowercase kebab-case. <small>`document-blocks/design-specifications§spacingSpec.internal.1`</small>
- **MUST** — Keys name the relationship (e.g., 'button-to-button') and MUST be lowercase kebab-case. <small>`document-blocks/design-specifications§spacingSpec.external.1`</small>
- **MUST** — Keys name the element (e.g., 'label', 'helper-text') and MUST be lowercase kebab-case. <small>`document-blocks/design-specifications§typographySpec.1`</small>

#### document-blocks/guidelines

- **MUST** — MUST be concrete and clear — not 'use sparingly' or 'when possible'. <small>`document-blocks/guidelines§guidelineEntry.guidance.1`</small>
- **MUST NOT** — MUST NOT just repeat the guidance. <small>`document-blocks/guidelines§guidelineEntry.rationale.1`</small>
- **SHOULD** — Tools SHOULD keep this order; authors SHOULD lead with the most important or group by category. <small>`document-blocks/guidelines§guidelines.items.1`</small>

#### document-blocks/imports

- **SHOULD** — SHOULD be copy-paste ready. <small>`document-blocks/imports§importEntry.code.1`</small>

#### document-blocks/interactions

- **MUST** — Each `identifier` MUST match a documented component; the optional `role` says what it does here. <small>`document-blocks/interactions§interactionEntry.components.1`</small>
- **SHOULD** — Authors SHOULD cover the trigger, the response, any recovery steps, and completion. <small>`document-blocks/interactions§interactions.1`</small>
- **SHOULD** — Tools SHOULD keep this order so the sequence stays clear. <small>`document-blocks/interactions§interactions.items.1`</small>

#### document-blocks/motion

- **MUST** — P1x and P2x MUST be between 0 and 1; P1y and P2y can be any number (values outside 0–1 give a bounce/overshoot). <small>`document-blocks/motion§motionEntry.function.1`</small>
- **MUST** — P1x — MUST be in [0, 1]. <small>`document-blocks/motion§motionEntry.function[prefixItems][0].1`</small>
- **MUST** — P2x — MUST be in [0, 1]. <small>`document-blocks/motion§motionEntry.function[prefixItems][2].1`</small>
- **SHOULD** — List the most common ones first; tools SHOULD keep this order. <small>`document-blocks/motion§motion.1`</small>
- **SHOULD** — Tools SHOULD keep this order for display. <small>`document-blocks/motion§motion.items.1`</small>

#### document-blocks/principles

- **SHOULD** — Tools SHOULD keep this order; authors SHOULD lead with the most important. <small>`document-blocks/principles§principles.items.1`</small>

#### document-blocks/scale

- **MUST** — MUST match a token defined elsewhere in the system. <small>`document-blocks/scale§scaleStep.token.1`</small>
- **MAY** — Tools MAY fill this in automatically. <small>`document-blocks/scale§scaleStep.value.1`</small>
- **SHOULD** — Steps run smallest to largest; tools SHOULD keep this order. <small>`document-blocks/scale§scale.1`</small>
- **SHOULD** — Tools SHOULD keep this order. <small>`document-blocks/scale§scale.steps.1`</small>
- **SHOULD** — When adjusting a value, consumers SHOULD move to the adjacent step. <small>`document-blocks/scale§scale.steps.2`</small>

#### document-blocks/sections

- **MUST** — MUST be lowercase kebab-case and unique in the block. <small>`document-blocks/sections§sectionEntry.anchor.1`</small>
- **MAY** — Left out, tools MAY derive one from the title. <small>`document-blocks/sections§sectionEntry.anchor.2`</small>
- **SHOULD** — Tools SHOULD keep this order. <small>`document-blocks/sections§sectionEntry.sections.1`</small>
- **SHOULD** — Tools SHOULD keep this order. <small>`document-blocks/sections§sections.items.1`</small>

#### document-blocks/states

- **SHOULD** — Tools SHOULD keep this order for display. <small>`document-blocks/states§states.items.1`</small>

#### document-blocks/steps

- **MUST** — MUST be concrete and actionable: describe the action, not the goal. <small>`document-blocks/steps§stepEntry.instruction.1`</small>
- **MAY** — Tools MAY render optional steps distinctly (e.g., an 'optional' label). <small>`document-blocks/steps§stepEntry.optional.1`</small>
- **SHOULD** — Tools SHOULD show ordered steps as a numbered list, unordered ones as a checklist. <small>`document-blocks/steps§steps.ordered.1`</small>
- **MUST** — Tools MUST preserve this order when `ordered` is true. <small>`document-blocks/steps§steps.items.1`</small>

#### document-blocks/variants

- **SHOULD** — Tools SHOULD keep this order. <small>`document-blocks/variants§enumVariant.values.1`</small>
- **SHOULD** — Tools SHOULD keep this order. <small>`document-blocks/variants§variants.items.1`</small>

### Root schema

#### dsds

- **MUST** — MUST be relative — no absolute paths, protocol-relative paths, or scheme URIs (http:, file:, …). <small>`dsds§fileRef.$ref.1`</small>
- **MUST** — Resolvers MUST catch cycles, MUST treat a broken file, pointer, or shape mismatch as a fatal error, and MUST only fetch remote files from an allow-list (see the spec's security rules). <small>`dsds§fileRef.$ref.2`</small>
- **MUST** — A group MUST hold at least one entity. <small>`dsds§entityGroup.1`</small>
- **SHOULD** — Order matters; tools SHOULD keep it. <small>`dsds§entityGroup.entities.1`</small>

### entities

#### entities/chunk

- **MUST** — MUST be lowercase kebab-case and unique within its entity group. <small>`entities/chunk§chunk.identifier.1`</small>
- **MUST** — MUST be relative — no absolute paths, protocol-relative paths, or scheme URIs (http:, file:, …). <small>`entities/chunk§chunk.code[oneOf][1].src.1`</small>
- **SHOULD** — Resolvers SHOULD only fetch from an allow-list, the same rule a `$ref` fileRef follows. <small>`entities/chunk§chunk.code[oneOf][1].src.2`</small>

#### entities/component

- **MUST** — MUST be unique within its entity group. <small>`entities/component§component.identifier.1`</small>
- **SHOULD** — Tools SHOULD keep this order for display. <small>`entities/component§component.documentBlocks.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/component§component.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/component§component.agentDocumentBlocks.2`</small>

#### entities/foundation

- **MUST** — MUST be unique within its entity group. <small>`entities/foundation§foundation.identifier.1`</small>
- **SHOULD** — Tools SHOULD keep this order for display. <small>`entities/foundation§foundation.documentBlocks.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/foundation§foundation.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/foundation§foundation.agentDocumentBlocks.2`</small>

#### entities/guide

- **MUST** — MUST be lowercase kebab-case and unique within its entity group. <small>`entities/guide§guide.identifier.1`</small>
- **SHOULD** — A guide reads top to bottom, so tools SHOULD keep this order. <small>`entities/guide§guide.documentBlocks.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/guide§guide.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/guide§guide.agentDocumentBlocks.2`</small>

#### entities/pattern

- **MUST** — MUST be unique within its entity group. <small>`entities/pattern§pattern.identifier.1`</small>
- **SHOULD** — Order matters — `interactions` uses it to show the flow over time, and tools SHOULD keep it. <small>`entities/pattern§pattern.documentBlocks.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/pattern§pattern.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/pattern§pattern.agentDocumentBlocks.2`</small>

#### entities/theme

- **MUST** — MUST match a token's `identifier` defined elsewhere in the system. <small>`entities/theme§tokenOverride.token.1`</small>
- **SHOULD** — Tools SHOULD keep this order for display. <small>`entities/theme§theme.documentBlocks.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/theme§theme.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/theme§theme.agentDocumentBlocks.2`</small>

#### entities/token

- **MUST** — MUST be set here unless a parent group already declares it — a token inherits the group's value if it skips its own. <small>`entities/token§token.tokenType.1`</small>
- **SHOULD** — Tools SHOULD keep this order for display. <small>`entities/token§token.documentBlocks.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/token§token.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/token§token.agentDocumentBlocks.2`</small>
- **MAY** — A child MAY override it. <small>`entities/token§tokenGroup.tokenType.1`</small>
- **SHOULD** — Order often shows a real progression (lightest to darkest, smallest to largest), so tools SHOULD keep it. <small>`entities/token§tokenGroup.children.1`</small>
- **MUST NOT** — Tools MUST NOT show these blocks to humans. <small>`entities/token§tokenGroup.agentDocumentBlocks.1`</small>
- **SHOULD** — Agents SHOULD read both arrays, human docs first. <small>`entities/token§tokenGroup.agentDocumentBlocks.2`</small>

### metadata

#### metadata/category

- **MUST** — MUST be lowercase kebab-case. <small>`metadata/category§category.1`</small>

#### metadata/doc-origin

- **SHOULD** — 'ai-generated': mostly written by an AI with little to no human review — it MAY contain plausible-sounding mistakes and SHOULD be checked before an agent trusts it as fact. <small>`metadata/doc-origin§authorshipValue.1`</small>
- **MAY** — Best for intent, but MAY be behind the shipped API. <small>`metadata/doc-origin§docOriginValue.1`</small>
- **SHOULD** — 'reconstructed': written from memory or institutional knowledge, without checking the code — the least reliable for API facts, and SHOULD be verified before an agent relies on it. <small>`metadata/doc-origin§docOriginValue.2`</small>
- **SHOULD** — For API accuracy, agents SHOULD prefer 'generated' or 'extracted'; for design intent, prefer 'authored'. <small>`metadata/doc-origin§docOriginValue.3`</small>
- **MAY** — A document MAY be 'authored' overall while some blocks were 'extracted' or 'generated'. <small>`metadata/doc-origin§docOrigin[oneOf][1].1`</small>
- **MUST NOT** — MUST NOT contain markup. <small>`metadata/doc-origin§docOrigin[oneOf][1].note.1`</small>

#### metadata/governance

- **SHOULD** — Owners SHOULD be teams, roles, or group aliases ('Design Systems', '@acme/design-system'), not individuals — a named person goes stale the moment they leave, which is exactly what this field is meant to survive. <small>`metadata/governance§owner.1`</small>
- **SHOULD** — Tools SHOULD show the owner wherever a reader might need to flag a problem. <small>`metadata/governance§owner.2`</small>
- **SHOULD** — SHOULD name a team or role, not an individual. <small>`metadata/governance§owner[oneOf][1].name.1`</small>
- **SHOULD** — Freeform; tools SHOULD link it when it parses as a URL or email. <small>`metadata/governance§owner[oneOf][1].contact.1`</small>
- **SHOULD** — Tools MAY treat an old or missing `lastReviewed` as a staleness signal; agents SHOULD prefer more recently reviewed docs when sources disagree. <small>`metadata/governance§lastReviewed.1`</small>
- **MUST NOT** — MUST NOT contain markup. <small>`metadata/governance§lastReviewed[oneOf][1].note.1`</small>
- **MAY** — Lets tools spot drift — if the code has moved past this version, the doc MAY be stale even if recently reviewed. <small>`metadata/governance§lastReviewed[oneOf][1].reviewedAgainst.1`</small>
- **SHOULD** — `lastReviewed` is optional but SHOULD be set once you have a review process; its object form records who reviewed it and which version, so a tool can answer 'is this verified, against what, and who vouches for it.' <small>`metadata/governance§governance.1`</small>

#### metadata/last-updated

- **MUST NOT** — MUST NOT contain markup. <small>`metadata/last-updated§lastUpdated[oneOf][1].note.1`</small>

#### metadata/status

- **MUST** — A deprecated entity MUST use the object form, because deprecation needs a deprecationNotice that says what to use instead. <small>`metadata/status§status.1`</small>
- **MAY** — An entity MAY be 'stable' overall while some platforms are still 'experimental' or 'draft'. <small>`metadata/status§status[oneOf][1].1`</small>
- **SHOULD** — Tools SHOULD show this as the main status indicator. <small>`metadata/status§status[oneOf][1].overall.1`</small>
- **MAY** — Tools MAY surface this alongside the status indicator. <small>`metadata/status§status[oneOf][1].note.1`</small>
- **MUST** — MUST say what to use instead (non-empty) and give a migration path. <small>`metadata/status§status[oneOf][1].deprecationNotice.1`</small>
- **SHOULD** — Tools SHOULD display this prominently next to the status indicator. <small>`metadata/status§status[oneOf][1].deprecationNotice.2`</small>

#### metadata/summary

- **MUST NOT** — MUST NOT contain markup. <small>`metadata/summary§summary.1`</small>

#### metadata/thumbnail

- **MUST NOT** — MUST NOT be empty. <small>`metadata/thumbnail§thumbnail.alt.1`</small>

{/* /dsds:normative-index */}
