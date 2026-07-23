"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateSources } = require("../src/validate-dsds.js");

const root = path.resolve(__dirname, "../../..");
const validSource = path.join(root, "spec/examples/starter-kit.dsds.json");
const invalidSource = path.join(__dirname, "fixtures/invalid.dsds.json");

test("validates a DSDS source and returns its version", () => {
  const result = validateSources([validSource])[0];
  assert.equal(result.valid, true);
  assert.equal(result.dsdsVersion, "0.15.2");
  assert.deepEqual(result.errors, []);
});

test("returns structured schema errors for an invalid source", () => {
  const result = validateSources([invalidSource])[0];
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors.every((error) => error.keyword && error.message));
});

test("distinguishes malformed JSON and does not mutate source bytes", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dsds-local-validate-"));
  const source = path.join(directory, "malformed.json");
  const bytes = "{not json";
  fs.writeFileSync(source, bytes);

  const result = validateSources([source])[0];
  assert.equal(result.valid, false);
  assert.equal(result.errors[0].keyword, "parse");
  assert.equal(fs.readFileSync(source, "utf8"), bytes);
});
