"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { SourceError } = require("./errors.js");

const IGNORED_DIRECTORIES = new Set([".git", "node_modules"]);

function discoverSources(inputPath) {
  const root = path.resolve(inputPath);
  let stat;
  try {
    stat = fs.lstatSync(root);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new SourceError(`Source path does not exist: ${root}`, "SOURCE_NOT_FOUND");
    }
    throw new SourceError(`Cannot inspect source path ${root}: ${error.message}`);
  }

  if (stat.isSymbolicLink()) {
    throw new SourceError(`Symlink sources are not supported: ${root}`, "SOURCE_SYMLINK");
  }
  if (stat.isFile()) return [root];
  if (!stat.isDirectory()) {
    throw new SourceError(`Source path is not a regular file or directory: ${root}`);
  }

  const sources = [];
  walkDirectory(root, sources);
  sources.sort((left, right) => left.localeCompare(right));
  if (sources.length === 0) {
    throw new SourceError(
      `No .dsds.json files found under source directory: ${root}`,
      "SOURCE_EMPTY",
    );
  }
  return sources;
}

function walkDirectory(directory, sources) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    throw new SourceError(`Cannot read source directory ${directory}: ${error.message}`);
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(entryPath, sources);
    } else if (entry.isFile() && entry.name.endsWith(".dsds.json")) {
      sources.push(entryPath);
    }
  }
}

module.exports = { discoverSources };
