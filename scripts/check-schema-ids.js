#!/usr/bin/env node
// Every schema/**/*.schema.yaml file's own $id is a promise that it's
// servable at that exact published URL (see netlify.toml and build-site.js's
// versioned split-schema mirror). This asserts $id always equals
// https://designsystemdocspec.org/v<version>/<path relative to schema/>, so
// the "$id declares a directory segment the file isn't actually under"
// mismatch (fixed once already, for entry/section/metadata) can't recur
// silently. Excludes dsds.bundled.yaml - it's generated output, checked by
// its own path separately since it isn't part of the schema/ source tree walk.
"use strict";

const path = require("path");
const { schemaDir, loadYaml, walkYamlFiles } = require("./lib");
const { readSpecVersion } = require("./nav");

const version = readSpecVersion();
if (!version) {
  console.error("✗ check-schema-ids: could not determine the spec version.");
  process.exit(1);
}

let ok = true;
for (const file of walkYamlFiles(schemaDir)) {
  const relPath = path.relative(schemaDir, file).replace(/\\/g, "/");
  const expected = `https://designsystemdocspec.org/v${version}/${relPath}`;
  const actual = loadYaml(file).$id;
  if (actual !== expected) {
    console.error(`✗ ${relPath}: $id is "${actual}", expected "${expected}"`);
    ok = false;
  }
}

if (ok) console.log(`✓ every schema file's $id matches its published path (v${version})`);
process.exit(ok ? 0 : 1);
