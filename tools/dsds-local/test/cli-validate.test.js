"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../../..");
const bin = path.join(root, "tools/dsds-local/bin/dsds-local.js");
const validSource = path.join(root, "spec/examples/starter-kit.dsds.json");
const invalidSource = path.join(__dirname, "fixtures/invalid.dsds.json");

function run(args) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("prints help with exit code zero", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /validate --source/);
  assert.equal(result.stderr, "");
});

test("validates a source in JSON mode without mixing diagnostics", () => {
  const result = run(["validate", "--source", validSource, "--json"]);
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "validate");
  assert.equal(output.valid, true);
  assert.equal(output.summary.failed, 0);
  assert.equal(result.stderr, "");
});

test("returns exit one and a source path for invalid input", () => {
  const result = run(["validate", "--source", invalidSource]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /FAIL/);
  assert.match(result.stdout, /invalid\.dsds\.json/);
  assert.match(result.stderr, /entityGroups/);
});

test("returns exit two for usage errors", () => {
  const result = run(["validate"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires --source/);
});
