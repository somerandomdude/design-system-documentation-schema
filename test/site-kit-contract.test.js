"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "site/components/index.js");
const corpusPath = path.join(root, "spec/examples/site-kit.dsds.json");
const extensionKey = "org.designsystemdocspec.site-kit";
const expectedTags = [
  "ds-callout",
  "ds-code",
  "ds-badge",
  "ds-prop-table",
  "ds-prop",
  "ds-spec-nav",
  "ds-cross-refs",
  "ds-json-view",
  "ds-header",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readRegistryTags() {
  const source = fs.readFileSync(registryPath, "utf8");
  const registry = source.match(/const registry = \[([\s\S]*?)\n\];/);

  assert.ok(
    registry,
    "site/components/index.js must retain a literal `const registry = [...]` array",
  );

  const entries = [...registry[1].matchAll(/\[\s*"([^"]+)"\s*,\s*[\w$]+\s*\]/g)];
  const entryLines = registry[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  assert.equal(
    entries.length,
    entryLines.length,
    "Every Site Kit registry entry must remain a literal [tagName, constructor] pair",
  );

  return new Set(entries.map((entry) => entry[1]));
}

function readEntities() {
  const document = readJson(corpusPath);
  return document.entityGroups.flatMap((group) => group.entities);
}

test("the focused Site Kit corpus contains each expected component", () => {
  const identifiers = readEntities().map((entity) => entity.identifier);

  assert.deepEqual(
    [...identifiers].sort(),
    [...expectedTags].sort(),
    "Update expectedTags intentionally when changing the focused Site Kit corpus",
  );
  assert.equal(new Set(identifiers).size, identifiers.length);
});

test("every documented Site Kit component matches the source registry", () => {
  const registryTags = readRegistryTags();

  for (const entity of readEntities()) {
    const extension = entity.$extensions?.[extensionKey];

    assert.ok(extension, `${entity.identifier} must define the Site Kit extension`);
    assert.equal(extension.tagName, entity.identifier);
    assert.ok(
      registryTags.has(extension.tagName),
      `${extension.tagName} must be registered in site/components/index.js`,
    );
    assert.equal(extension.entrypoint, "site/components/index.js");
    assert.ok(
      fs.existsSync(path.join(root, extension.entrypoint)),
      `${entity.identifier} entrypoint must exist`,
    );
    assert.ok(
      fs.existsSync(path.join(root, extension.module)),
      `${entity.identifier} module must exist: ${extension.module}`,
    );

    const platformStatus = entity.metadata?.status?.platforms?.["web-component"];
    assert.equal(
      platformStatus?.status,
      "stable",
      `${entity.identifier} must declare a stable web-component platform status`,
    );

    const examples = entity.documentBlocks
      .filter((block) => block.kind === "imports")
      .flatMap((block) => block.items)
      .map((item) => item.code)
      .join("\n");

    assert.match(
      examples,
      new RegExp(`<${extension.tagName}(?:[\\s>])`),
      `${entity.identifier} must include a plain-HTML usage example`,
    );
  }
});
