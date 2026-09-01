#!/usr/bin/env node
// Composes many hand-authored *.dsds.yaml fragment files in one directory
// into a single, in-memory base document - the same "concatenate many
// files, then validate the merged result" pattern bundle.js already uses
// on the schema itself (see
// notes/2026-08-17-graph-rigor-and-composition-prd.md, Design D). No
// $ref/JSON Pointer resolution step exists here by design: flat
// concatenation structurally can't cycle or dangle the way a
// pointer-resolution mechanism could.
//
// Directory convention (this tool's own answer to the PRD's Open Question
// #1): every *.dsds.yaml file directly inside the given directory
// contributes - no separate manifest file to keep in sync, and no
// recursion into subdirectories. Exactly one of those fragments must
// declare `schemaVersion` - that's the composition root, and its `name`
// (and `$extensions`, if present) become the composed document's own.
// Every fragment (root included) may contribute `entries`, `shared`,
// and/or `refs`, concatenated onto the composed document in filename sort
// order. This keeps the rule simple and explicit (name a file so it sorts
// where it belongs) without a second file whose only job is listing the
// first file's contents.
//
// Usage:
//   node scripts/v0.20/compose.js <dir> [--out <file>]
//
// With no --out, the composed document is written to stdout as YAML.
"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { loadYaml } = require("./lib");

function parseArgs(argv) {
  const args = { dir: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") {
      args.out = argv[++i];
    } else if (!args.dir) {
      args.dir = argv[i];
    }
  }
  return args;
}

function compose(dir) {
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".dsds.yaml"))
    .map((e) => e.name)
    .sort();

  if (files.length === 0) {
    throw new Error(`No *.dsds.yaml fragment files found in ${dir}`);
  }

  const fragments = files.map((name) => ({
    name,
    doc: loadYaml(path.join(dir, name)),
  }));

  const roots = fragments.filter((f) => typeof f.doc.schemaVersion !== "undefined");
  if (roots.length === 0) {
    throw new Error(
      `No fragment declares "schemaVersion" - exactly one fragment must be the composition root (checked: ${files.join(", ")})`
    );
  }
  if (roots.length > 1) {
    throw new Error(
      `${roots.length} fragments declare "schemaVersion" (${roots.map((f) => f.name).join(", ")}) - exactly one composition root is allowed`
    );
  }

  const root = roots[0].doc;
  const composed = { schemaVersion: root.schemaVersion, name: root.name };

  const entries = [];
  const shared = [];
  const refs = [];
  for (const { doc } of fragments) {
    if (doc.entries) entries.push(...doc.entries);
    if (doc.shared) shared.push(...doc.shared);
    if (doc.refs) refs.push(...doc.refs);
  }

  if (entries.length) composed.entries = entries;
  if (shared.length) composed.shared = shared;
  if (refs.length) composed.refs = refs;
  if (root.$extensions) composed.$extensions = root.$extensions;

  return { composed, fragmentNames: files };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dir) {
    console.error("Usage: node scripts/v0.20/compose.js <dir> [--out <file>]");
    process.exit(1);
  }

  const dir = path.resolve(args.dir);
  const { composed, fragmentNames } = compose(dir);
  const output = yaml.dump(composed, { lineWidth: -1 });

  if (args.out) {
    fs.writeFileSync(args.out, output);
    console.error(`Composed ${fragmentNames.length} fragment(s) from ${path.relative(process.cwd(), dir)} -> ${args.out}`);
  } else {
    process.stdout.write(output);
  }
}

if (require.main === module) {
  main();
}

module.exports = { compose };
