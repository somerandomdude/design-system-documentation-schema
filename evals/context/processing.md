# Processing model — DSDS 0.23.1

The schema says what a document can contain. This page says what a tool works out when it reads one. For example: which item a `#` address points to, where a reused rule gets its text, and what replaces something deprecated. 

This page sets requirements. MUST, MUST NOT, SHOULD, SHOULD NOT and MAY mean what [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) says, and only when written in capitals. The requirements apply to a **conforming consumer**: anything that reads a DSDS document and does something with it. [Conformance](conformance.html) covers the other kinds of tool.

Each MUST ends with what checks it, in parentheses, as the [specification's §1.2](specification.html#12-what-enforces-each-requirement) describes. That's a validator rule, a test vector, or `consumer` when no check on a document can see it. `npm run check` fails if a MUST names nothing. `scripts/resolve/resolve.js` is the reference implementation. The [test vectors](#11-test-vectors) hold the answers it gives, and every implementation has to give the same ones.

## 1. Terms

- A **project** is all the documents a consumer reads together (§3).
- An **address** is the part of a ref's `to` after the `#`. In `shared-a11y#focus-visible`, the address is `focus-visible`.
- An **item** is one member of a section's `items`, or one `freeform` entry.
- A **chain** is a path a consumer follows from one thing to the next, through `uses`, `extends`, `same-as` or `replaced-by` (§9).
- An **inline link** is a link inside a Markdown field whose URL starts with `dsds:`, like `[focus visible](dsds:shared-a11y#focus-visible)` (§2.4).

## 2. Addresses

### 2.1 Entries

A consumer MUST treat `entries` and `shared` as one set of ids, so no two entries in a project can share an id (DSDS-04).

### 2.2 Items

A `to` written as `entryId#address` points at one thing inside an entry. A consumer MUST work out each thing's address with these rules (vector: addresses):

1. **An item with an `id`** uses that `id`.
2. **An item without an `id`** uses an id made from its own text: a guideline's `statement`, a definition's `term`, or a step's or freeform entry's `title`. To make it, lowercase the text, turn each run of characters other than `a`–`z` and `0`–`9` into one dash, and remove any dash at either end. "Name it!" becomes `name-it`. This works for freeform entries at any depth.
3. **An item with neither**, because it only reuses another item with `same-as` (§4), uses the address of the item it reuses. That's the part of its `same-as` target after the `#`.
4. **Anything else inside an item that has its own `id`**, such as an example, uses that `id`.
5. **A component's trait** uses its `id`. **One value of an enum trait** uses `traitId.valueId`, as in `button#variant.primary`. Combos use the same form. It can't be misread, because a trait id can't contain a dot.

### 2.3 When two things share an address

Two things on one entry can end up with the same address. A consumer MUST pick the one whose address has the strongest source, in this order (vector: addresses; DSDS-05):

1. an `id` written in the document (rules 1, 4 and 5);
2. an id made from the text (rule 2);
3. an address taken from a reused item (rule 3).

If two things tie for the strongest source, the address is ambiguous. A consumer MUST NOT choose between them, because it's an error (DSDS-05). The fix is to give one of the two its own `id`.

So when an item and another item reusing it sit on the same entry, their shared address points at the item that states the rule.

### 2.4 Inline links

An inline link names its target the same way a `to` does, so it's found with the same rules.

- A consumer MUST find inline links with a CommonMark parser, not by searching the text (vector: inline-links). A `dsds:` URL in a code span or a fenced code block isn't a link. A reference-style link (`[text][x]`, with `[x]: dsds:button` elsewhere in the field) is.
- A consumer MUST treat the scheme as case-insensitive, so `DSDS:button` is an inline link too (vector: inline-links). The target is everything after the colon, after the parser has decoded escapes such as `%23` for `#`.
- A consumer MUST resolve the target with the rules in §2.1 to §2.3, and report it the way §3 reports a `to` that can't be found (DSDS-08, DSDS-05; vector: inline-links). A target that isn't shaped like a `to` is a problem too.
- For `[text](dsds:target)`, the text to show is the author's. For `<dsds:target>`, a consumer MUST show the first of these the target has (vector: inline-links):
  1. an entry's `name`;
  2. a definition's `term`;
  3. a step's or freeform entry's `title`;
  4. a trait's or trait value's `name`;
  5. otherwise, the target itself, without `dsds:`.

  A reusing item (§4) uses its effective content, so a reused definition shows the `term` of the item it reuses. A guideline has no short name, so an autolink to one shows its target. Write `[text](dsds:…)` for a guideline instead.
- An inline link isn't a relationship. A consumer MUST NOT count it in §5: it isn't a `uses`, and it doesn't appear when relationships are read backwards (vector: inline-links). A consumer MAY offer a separate "mentioned in" list built from inline links.

## 3. Projects

A consumer looks up refs across a whole project.

- A project MUST include every document a consumer can reach by following `rel: file` refs from the documents it was given, then from those, and so on (DSDS-08; vector: cross-file).
- A consumer MUST NOT follow a `rel: file` ref out of the folder that holds the document, or its subfolders (consumer). A document is data from whoever wrote it, and could point anywhere. See [Security](security.html).
- `rel: file` is only for DSDS documents. A code file or a DTCG token file is `rel: source`, and a consumer doesn't read it as part of the project (`DSDS-25`).
- When the project's system entry sets `metadata.sourceRoot`, a consumer MUST read each relative `sourceFiles` path starting from there (`DSDS-11`). Without it, the path starts from the component's own document. A relative `sourceRoot` starts from the document that holds the system entry. If `sourceRoot` points outside that document's folder, the consumer still decides whether to open it.
- A consumer given several documents at once SHOULD treat them as one project. That's how a standalone entry file can point at the files next to it, since it has no field to list them.
- A ref to something not in the project is an error when the project is known to be complete: a base document with no `rel: file` refs, read on its own. Otherwise the target may be in a file the consumer didn't read, so it's a warning (`DSDS-05`, `DSDS-08`).

## 4. Reused content

An item with a `same-as` ref reuses the content of the item it points at.

- A consumer MUST show a reusing item with its **effective content**: each content field the item states itself, plus every other content field from the item it reuses (vector: reuse). The content fields are:
  - for a guideline: `level`, `statement` and `checkedBy`;
  - for a definition: `term`, `definition` and `usage`;
  - for a step: `title` and `description`.
- If the reused item itself reuses another, a consumer MUST follow the chain to the item that states the content (vector: reuse). It SHOULD say which item that is.
- A reusing item MUST point at an item of the same section kind (`DSDS-25`). A guideline can't reuse a definition.
- When both items state a `level`, the two MUST match (`DSDS-10`). An item that means to state a different level is a `refines`, not a `same-as`.
- When the target of a `same-as` ref can't be found, a consumer SHOULD show the reusing item's `level` and the link, rather than nothing (see [sections/guidelines](schema.html#sections-guidelines)).

`refines` works differently. A `for: agent` item uses `refines` to point at the human rule it states more precisely for an agent. A consumer reading for an agent SHOULD apply both rules. The refinement doesn't replace the rule it refines.

## 5. Relationships and their reverse

A relationship is written once, on the thing it starts from. A conforming consumer works out the reverse direction itself, and MUST NOT require it to be written on the other end too (vector: inverse).

A pointer in `refs` says what kind it is with `rel`. A pointer in a field named for one kind of pointer has no `rel`, and a consumer MUST read it as the kind that field stands for (vector: inverse). When an object has a field for a kind of pointer, that kind MUST go in the field, not in `refs` (`DSDS-25`). Eight of the fourteen kinds have their own field, and `refs` holds the other six. `source` also has fields that each hold one: a token's or theme's `source`, and the `file` in each of a component's `sourceFiles`.

Every `rel`, where it's written, and what a consumer does with it:

| `rel` | Where it's written | What it means | Read backwards | What a consumer does |
|---|---|---|---|---|
| `uses` | `uses`, on an entry or a section item | This is built from the target, needs it, or follows it. A dialog uses its button. A button uses a color token, and the pattern it follows. | used by | Follows `uses` backwards to answer "what is affected if this changes?" Follows it as a chain (§9). |
| `same-as` | `refs`, on an item | This item reuses another item's content instead of repeating it. | reused by | Shows the reusing item with its effective content (§4). |
| `replaced-by` | `replacedBy`, in the deprecated `status` of an entry, trait or trait value | The target replaces this. | replaces | Follows it to the successor (§7). |
| `file` | `refs` | Another DSDS document in the same project. A code or token file is `source` instead. | — | Reads the target as part of the project (§3). |
| `source` | `refs`; a token's or theme's `source`; a component's `sourceFiles[].file` | Where this is built: a repository, a source file, a DTCG token file or a package. | — | MAY fetch it. Reads a relative `sourceFiles` path from the system's `sourceRoot` (§3). |
| `design` | `refs` | The design file this comes from. | — | MAY link to it. |
| `demo` | `refs`, or an example's `ref` | A live demo, such as a Storybook story. | — | MAY link to it or embed it. |
| `relates-to` | `refs` | Worth reading alongside this, when no other kind fits. On a guideline item with no `statement` and an `href`, it's where the rule is tracked. | the same both ways | MAY show it as "see also". For an item with no statement, SHOULD show the level and the link (§4). |
| `extends` | an entry's `extends` | This inherits from the target. | extended by | Never merges the target in (§6). Follows it as a chain (§9). |
| `alternative-to` | `alternatives`, on an entry or a guideline item | Use the target instead, in the situation the entry or rule describes. | the same both ways | Offers the target when this one doesn't fit. |
| `cites` | a guideline's `evidence` | The outside standard the rule is based on. | cited by | SHOULD show it, so a reader can tell a requirement from a house preference. |
| `checked-by` | a guideline's `checks` | What checks the rule: a test, lint rule or agent eval (an `href`, with `role` saying which), or a checklist step (a `to`). | checks | Runs it or links to it. `checkedBy: automated` needs one with an `href` (`DSDS-03`). |
| `contract` | a component's `specs` | A machine-readable API contract that was already generated. | — | Reads the component's props, slots and events from it, with whatever parser its format needs. |
| `refines` | a guideline's `refines`, on a `for: agent` item | This states a human rule more precisely, for an agent. | refined by | When reading for an agent, applies both rules (§4). |

A "—" means the pointer leads outside the project, so nothing in the project reads it backwards. Custom namespaced `rel` values are covered in §8.

Only pointers are relationships. An inline link in prose (§2.4) isn't one.

When a consumer shows an entry's relationships, it SHOULD include the ones written on other entries that point at it. A pointer inside an item belongs to that item. So a step that `uses` `button` is a relationship from the step, not from its whole entry.

## 6. `extends`

`extends` says one entry inherits from another: a dark theme from a light one, or an icon button from a button.

A consumer MUST NOT copy the extended entry's fields or sections into the entry that extends it (consumer). The extending entry is complete as written. A consumer that reads it on its own reads all of it. A consumer MAY show the extended entry's content beside it, as long as it's clearly labelled as coming from that entry.

Why not merge them? An entry's meaning would then depend on another document the consumer may not have. And every consumer would need the same rules for merging lists, fields and overrides, or they'd disagree. What a theme changes lives in its DTCG `source`, which has its own rules for that.

## 7. Successors

A successor is what replaces something deprecated. `replaced-by` points from the deprecated thing to its successor.

- The successor is named in `replacedBy`. It sits in the `status` that marks the entry, trait or trait value as deprecated, next to its `deprecationNotice`, where a reader learns the thing is going away. The schema only accepts `replacedBy` in a deprecated status. In one platform's status, it names that platform's successor.
- To find what to use instead, a consumer MUST follow `replaced-by` (vector: successors). If the successor is deprecated too, with its own `replaced-by`, a consumer MUST follow that as well and use where it ends (vector: successors).
- When there's more than one successor, a consumer MUST NOT pick one on its own (vector: successors). The `deprecationNotice` says when to choose which. A consumer that can't apply it MUST leave the choice to whoever it's working for (consumer). For example, an agent replacing `variant="secondary-green"` across a codebase asks, or leaves a note, instead of guessing.

## 8. Unknown values

- When a consumer writes a document back out, it MUST keep any `$extensions` content it doesn't understand (consumer).
- A consumer MAY ignore a custom namespaced `rel` (such as `acme.themes`) or a custom kind it doesn't understand. It MUST NOT report the document as invalid because of one (consumer).
- A field the schema doesn't declare, on a generic `entry` or `section`, is most likely a typo or a leftover. A validator reports it as a warning (`DSDS-24`).

## 9. Chains and loops

A consumer follows four kinds of pointer from one thing to the next. Each one answers a question:

- `uses`: what is affected if this changes?
- `extends`: what does this inherit from?
- `same-as`: where is this content stated?
- `replaced-by`: what replaces this?

A chain MUST NOT lead back to where it started, because then its question has no answer (DSDS-06; vector: cycles). A loop is an error, and a consumer that finds one MUST stop following it instead of going round forever (vector: cycles).

`uses` and `extends` link entries. `same-as` and `replaced-by` link items, traits, trait values and entries. Each kind is checked on its own: a `uses` ref and an `extends` ref pointing at each other don't make a loop.

## 10. Problems

What `scripts/resolve/resolve.js` reports, and the rule that catches each one in a document:

| Problem | What it means | Rule |
|---|---|---|
| `duplicate-entry` | Two entries in the project have the same id. | `DSDS-04` |
| `unresolved-entry` | A ref points at an entry the project doesn't have. | `DSDS-08`, `DSDS-05` |
| `unresolved-item` | A ref points at an address the entry doesn't have. | `DSDS-05` |
| `ambiguous-address` | An address points at two things, and neither one wins (§2.3). | `DSDS-05` |
| `level-mismatch` | A reusing item states a different `level` from the item it reuses. | `DSDS-10` |
| `same-as-kind` | A `same-as` ref points at a different kind of item. | `DSDS-25` |
| `replaced-by-misplaced` | A `replaced-by` pointer is on something that can't be deprecated. | the schema, `DSDS-25` |
| `replaced-by-not-deprecated` | A `replaced-by` pointer is on something that isn't deprecated. | the schema |
| `cycle` | A chain leads back to where it started. | `DSDS-06` |
| `malformed-link` | An inline link's target isn't shaped like a `to`. | `DSDS-08` |
| `inline-links-skipped` | A Markdown field mentions `dsds:`, but the consumer had no Markdown parser to read its links. | — |

`unresolved-entry`, `unresolved-item` and `ambiguous-address` cover inline links too. For a problem in an inline link, `at` is the item or entry whose field holds the link.

## 11. Test vectors

Each folder in [`examples/vectors/`](/examples/vectors/) holds one or more documents and an `expected.json`: what a conforming consumer should work out from them. They cover addresses (§2), inline links (§2.4), a project split across files (§3), reused content (§4), reverse relationships (§5), successors (§7) and loops (§9).

They're published with the conformance suite at [`/v0.23.1/conformance-suite/manifest.json`](/v0.23.1/conformance-suite/manifest.json), next to the broken examples that validators are tested against. The manifest's `consumerContract` explains how to compare results. In short, everything has to match except each problem's `message`, which is text for people to read.

The result has `inlineLinks` only when the project has inline links. Each one says where it is (`from`, `pointer`, `offset`), its `form` and `target`, what it `resolves` to (missing when it doesn't resolve), and its `text`: the author's for `[text](dsds:…)`, the §2.4 text for `<dsds:…>`, and none for a reference definition, whose text is on the link that uses it.

In this repo, `node scripts/resolve/resolve.js <files…>` prints what any project resolves to, and `npm run check` checks every vector.
