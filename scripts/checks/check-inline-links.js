#!/usr/bin/env node
// Unit cases for inline links (specification §6.5, processing model §2.4): that inlineLinksIn()
// finds exactly the `dsds:` links a CommonMark parser sees, and that the validator checks their
// targets with DSDS-05 and DSDS-08. The fixtures in examples/invalid/ cover the rules end to end;
// these cover the parsing edge cases a fixture can't show one at a time.
"use strict";

const assert = require("assert");
const { inlineLinksIn } = require("../lib");
const { validateDoc } = require("../validate/validate");

const entry = (description, extra = {}) => ({ kind: "entry", id: "probe", name: "Probe", description, ...extra });
const links = (description) => {
  const result = inlineLinksIn(entry(description));
  if (result.skipped) {
    console.error(`✗ Inline links can't be checked: ${result.skipped}.`);
    console.error("  The repo's checks need the optional dependency: npm install, on Node 20.19 or later.");
    process.exit(1);
  }
  return result.links.map(({ form, target, text }) => ({ form, target, text }));
};

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message.split("\n").join("\n  ")}`);
    process.exitCode = 1;
  }
}

test("finds an inline link, with the author's text", () =>
  assert.deepStrictEqual(links("See [focus *visible*](dsds:shared-a11y#focus-visible)."), [
    { form: "inline", target: "shared-a11y#focus-visible", text: "focus visible" },
  ]));

test("finds an autolink, with no text of its own", () =>
  assert.deepStrictEqual(links("Use <dsds:button#variant.primary>."), [
    { form: "autolink", target: "button#variant.primary", text: null },
  ]));

test("finds a reference definition once, used or not", () =>
  assert.deepStrictEqual(links("Use [the button][b].\n\n[b]: dsds:button\n[unused]: dsds:link"), [
    { form: "reference", target: "button", text: null },
    { form: "reference", target: "link", text: null },
  ]));

test("ignores a link inside a code span", () => assert.deepStrictEqual(links("Write `[x](dsds:button)` or `<dsds:button>`."), []));

test("ignores a link inside a fenced block", () => assert.deepStrictEqual(links("```md\n[x](dsds:button)\n```"), []));

test("ignores other schemes", () => assert.deepStrictEqual(links("[spec](https://example.com) and <mailto:a@b.c>"), []));

test("reads the scheme in any case", () => assert.deepStrictEqual(links("<DSDS:button>"), [{ form: "autolink", target: "button", text: null }]));

test("decodes percent escapes in the target", () =>
  assert.deepStrictEqual(links("[x](dsds:button%23variant.primary)"), [{ form: "inline", target: "button#variant.primary", text: "x" }]));

test("keeps a token id's own form", () => assert.deepStrictEqual(links("<dsds:Color/Action/Primary>"), [{ form: "autolink", target: "Color/Action/Primary", text: null }]));

test("reports the offset of each link within its field", () => {
  const { links: found } = inlineLinksIn(entry("ab <dsds:button> [c](dsds:link)"));
  assert.deepStrictEqual(found.map((l) => [l.pointer, l.offset]), [["/description", 3], ["/description", 17]]);
});

test("reads every Markdown field, and only Markdown fields", () => {
  const doc = entry("<dsds:a>", {
    sections: [
      {
        kind: "guidelines",
        for: "all",
        description: "<dsds:b>",
        title: "<dsds:not-markdown>",
        items: [{ level: "must", statement: "<dsds:c>", example: { description: "<dsds:c2>" }, examples: [{ description: "<dsds:d>" }] }],
        freeform: [{ title: "T", body: "<dsds:e>", items: [{ title: "U", body: "<dsds:f>" }] }],
      },
    ],
    traits: [{ id: "size", description: "<dsds:g>", values: [{ id: "small", description: "<dsds:h>" }] }],
  });
  assert.deepStrictEqual(
    inlineLinksIn(doc).links.map((l) => `${l.pointer} ${l.target}`),
    [
      "/description a",
      "/sections/0/description b",
      "/sections/0/items/0/statement c",
      "/sections/0/items/0/examples/0/description d",
      "/sections/0/items/0/example/description c2",
      "/sections/0/freeform/0/body e",
      "/sections/0/freeform/0/items/0/body f",
      "/traits/0/description g",
      "/traits/0/values/0/description h",
    ],
  );
});

// The validator: the same messages a `to` gets, with the link's offset in the finding.
const base = (description) => ({
  schemaVersion: "0.23.0",
  name: "Probe",
  entries: [
    { kind: "entry", id: "probe", name: "Probe", description },
    {
      kind: "entry",
      id: "rules",
      name: "Rules",
      description: "Rules.",
      sections: [{ kind: "guidelines", for: "all", items: [{ id: "one", level: "must", statement: "One." }] }],
    },
  ],
});
const findings = (description) => validateDoc(base(description)).findings.filter((f) => f.rule);

test("a broken link in a guideline's `example` is checked too", () => {
  const doc = base("Plain.");
  doc.entries[1].sections[0].items[0].example = { description: "See [this](dsds:no-such-one)." };
  const [f] = validateDoc(doc).findings.filter((x) => x.rule);
  assert.deepStrictEqual([f.rule, f.pointer], ["DSDS-08", "/entries/1/sections/0/items/0/example/description"]);
});

test("a link that resolves passes", () => assert.deepStrictEqual(findings("See <dsds:rules> and [one](dsds:rules#one)."), []));

test("an unknown entry is DSDS-08, with the offset", () => {
  const [f] = findings("See <dsds:nope>.");
  assert.deepStrictEqual([f.rule, f.severity, f.pointer, f.offset], ["DSDS-08", "error", "/entries/0/description", 4]);
});

test("an unknown address is DSDS-05", () => assert.strictEqual(findings("See [x](dsds:rules#two).")[0].rule, "DSDS-05"));

test("a malformed target is DSDS-08", () => {
  const [f] = findings("See [x](dsds:rules#one..two).");
  assert.deepStrictEqual([f.rule, f.severity], ["DSDS-08", "error"]);
  assert.match(f.message, /isn't shaped like a `to`/);
});

// Specification §3.1: a lowercase UUID is a valid id, for an entry and an item, and both a `to`
// and an inline link resolve to it.
test("a UUID id validates and resolves", () => {
  const entryId = "3f9a1c2e-8b4d-4e2a-9c71-5d0e6f8a2b13";
  const itemId = "0b7e2d14-1c3a-4f5e-8d9b-a6c7e8f90123";
  const doc = {
    schemaVersion: "0.23.0",
    name: "UUIDs",
    entries: [
      {
        kind: "component",
        id: entryId,
        name: "Button",
        description: "Triggers an action.",
        sections: [{ kind: "guidelines", for: "all", items: [{ id: itemId, level: "must", statement: "Label it." }] }],
      },
      {
        kind: "component",
        id: "dialog",
        name: "Dialog",
        description: `Confirms with a <dsds:${entryId}>, [labelled](dsds:${entryId}#${itemId}).`,
        uses: [{ to: entryId }],
      },
    ],
  };
  const result = validateDoc(doc);
  assert.deepStrictEqual([result.errors, result.warnings], [[], []]);
  assert.throws(() => assert.deepStrictEqual(validateDoc({ ...doc, entries: [{ ...doc.entries[0], id: entryId.toUpperCase() }] }).errors, []));
});

console.log(`${process.exitCode ? "✗" : "✓"} ${passed} inline-link case(s) passed.`);
