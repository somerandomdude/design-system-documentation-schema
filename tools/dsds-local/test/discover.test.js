"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { discoverSources } = require("../src/discover.js");
const { SourceError } = require("../src/errors.js");

function tempDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dsds-local-discover-"));
}

test("discovers an explicit JSON file regardless of suffix", () => {
  const root = tempDirectory();
  const source = path.join(root, "document.json");
  fs.writeFileSync(source, "{}");
  assert.deepEqual(discoverSources(source), [source]);
});

test("recurses, sorts, and ignores node_modules, .git, and symlinks", () => {
  const root = tempDirectory();
  fs.mkdirSync(path.join(root, "nested"));
  fs.mkdirSync(path.join(root, "node_modules"));
  fs.mkdirSync(path.join(root, ".git"));
  fs.writeFileSync(path.join(root, "z.dsds.json"), "{}");
  fs.writeFileSync(path.join(root, "nested", "a.dsds.json"), "{}");
  fs.writeFileSync(path.join(root, "node_modules", "ignored.dsds.json"), "{}");
  fs.writeFileSync(path.join(root, ".git", "ignored.dsds.json"), "{}");
  try {
    fs.symlinkSync(path.join(root, "nested"), path.join(root, "linked"));
  } catch (error) {
    if (error.code !== "EPERM") throw error;
  }

  assert.deepEqual(discoverSources(root), [
    path.join(root, "nested", "a.dsds.json"),
    path.join(root, "z.dsds.json"),
  ]);
});

test("rejects missing and empty source paths with typed errors", () => {
  assert.throws(() => discoverSources("/definitely/missing/dsds-source"), (error) => {
    assert.ok(error instanceof SourceError);
    assert.equal(error.code, "SOURCE_NOT_FOUND");
    return true;
  });

  const empty = tempDirectory();
  assert.throws(() => discoverSources(empty), (error) => {
    assert.ok(error instanceof SourceError);
    assert.equal(error.code, "SOURCE_EMPTY");
    return true;
  });
});
