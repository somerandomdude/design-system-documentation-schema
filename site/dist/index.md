# Design system doc spec 0.20.0

**Draft Specification:**
This is a draft. It can still change—and has done so in dramatic fashion. No standards body has endorsed it. We welcome feedback and contributions on GitHub.

* **Latest version:** [GitHub repo](https://github.com/somerandomdude/design-system-documentation-schema)
* **Feedback:** [GitHub Issues](https://github.com/somerandomdude/design-system-documentation-schema/issues)

---

## A machine-readable format for design system documentation

DSDS puts design-system docs in one format any tool can read. A document is a [**base**](schema.html#base) — `schemaVersion`, `name`, and a list of [**entries**](schema.html#entries-entry): a [system](schema.html#entries-system), any number of [components](schema.html#entries-component), [tokens](schema.html#entries-token), [themes](schema.html#entries-theme), or the generic `entry` for anything else. One source of truth that feeds your docs, trains your agents, and shows up everywhere your design system does.

---

## Principles

1. **Documentation only.** This schema is focused on the how, when, and why of a design system. That's it. If a better source of truth exists elsewhere, the schema links rather than restating.
2. **A consistent schema pattern.** Each part of the schema follows the same structure, so writing one part teaches you the rest.
3. **No learning cliffs.** It's designed to have a low barrier of entry. But it can grow with you. DSDS' `$extensions` let you add on to the schema when you actually need it.
4. **Everything can link to everything else.** A design system is a network of connections; the documentation reflects that.
5. **There's always a way out.** The schema has opinions, but always a way to step outside them.

---

## Flexible and modular

Design systems have different documentation needs. This schema can be as simple or as detailed as needed. Every entry's structured docs live in one `sections` array, and each section has a `kind`. The spec defines three kinds — `guidelines`, `definitions`, `steps`, plus the generic `section`. Any section can also carry `freeform`: headed, nestable prose alongside its own `items`. A component also carries `sourceFiles`, `specs`, `traits`, `combos`, and `imports` as fields of its own, not sections.

Any entry kind can use any section kind — nothing restricts which goes with which.

---

## Humans and agents

A DSDS document has two readers: people and AI agents. Both are served by the same file. Every section carries a `for` field naming its audience:

- **`for: human` or `for: all`**: Everything a person needs—definitions, guidelines, steps, freeform narrative. Agents read these too.
- **`for: agent`**: Agent-only notes—for the times when basic documentation can't get through those thick titanium skulls. This allows you to write documentation specifically for agent misunderstandings, hallucinations, or agent-specific tasks.

Write for people by default. It serves agents too. Use `for: agent` when all else fails.

---

## Interoperability

No open standard covers design-system documentation end to end. The formats that do exist each cover one layer well. DSDS sits above them, documenting meaning and usage instead of restating what they already own.

| Concern | Source of truth | How DSDS points at it |
|---|---|---|
| Token values and platform mappings | [W3C Design Tokens](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) (DTCG) files | A token or theme entry's `source` |
| Component source code, per platform | A source file or framework typings | A component's `sourceFiles` — pointing a tool at the real file to extract from, instead of hand-typing an interface |
| Component API contract, already generated | [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM), or another standard contract format | A component's `specs` — pointing at the generated document itself, not re-deriving it from source |
| Live component demos | Storybook or equivalent | A `refs`/`examples` entry with `rel: storybook` |
| Design artifacts | Design tool files | A `refs` entry with `rel: design`, or `metadata.preview` |
| Source code | The repository | A `refs` entry with `rel: source`, or a component's own `sourceFiles` |

DTCG owns token *values*; DSDS owns their *meaning and usage*, so the two can never disagree. CEM (and similar manifests) own a component's generated API details — `specs` points at the manifest itself, `sourceFiles` at the raw source a step earlier in the same pipeline; a component can use either, both, or neither. See [`examples/interop/`](examples.html#interop) for worked examples.

---

## Next steps

New to DSDS? Start with the [Quick Start Guide](quickstart.html) — document structure, entry kinds, the section system, and examples you can copy.

For the full schema reference, see [Schema](schema.html). For the JSON Schema source, see `schema/`; for working examples, see [Examples](examples.html).

## Contributors
- [PJ Onori](https://pjonori.com): Current maintainer
- [Afyia Smith](https://afyiasmith.co/): the `owner`/`reviewed` and `origin` metadata schemas.
- [Suleiman Ali Shakir](https://iamsuleiman.com/): Documentation copy-edits.
