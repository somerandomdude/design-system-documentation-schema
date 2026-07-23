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
  "ds-button",
  "ds-link",
  "ds-text-input",
];
const expectedPlatformStatuses = new Map([
  ["ds-button", "experimental"],
  ["ds-link", "experimental"],
  ["ds-text-input", "experimental"],
]);

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
      expectedPlatformStatuses.get(entity.identifier) || "stable",
      `${entity.identifier} must declare its expected web-component platform status`,
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

test("ds-button keeps its native control contract", () => {
  const source = fs.readFileSync(path.join(root, "site/components/button.js"), "utf8");

  assert.match(source, /<button part="button"><slot><\/slot><\/button>/);
  assert.match(source, /observedAttributes\(\).*variant/s);
  assert.match(source, /const VARIANTS = new Set\(\["primary", "secondary"\]\)/);
  assert.match(source, /button\.disabled = this\.disabled/);
  assert.match(source, /background: var\(--ds-color-bg-accent\)/);
  assert.match(source, /background: var\(--ds-color-text\)/);
  assert.match(source, /text-transform: uppercase/);
});

test("ds-link keeps its native navigation contract", () => {
  const source = fs.readFileSync(path.join(root, "site/components/link.js"), "utf8");

  assert.match(source, /<a part="link"><slot><\/slot><slot name="icon"><\/slot><\/a>/);
  assert.match(source, /observedAttributes\(\).*href/s);
  assert.match(source, /target.*_blank/);
  assert.match(source, /noopener noreferrer/);
  assert.match(source, /slot="icon"/);
  assert.doesNotMatch(source, /text-transform: uppercase/);
});

test("ds-text-input keeps its native form-control contract", () => {
  const source = fs.readFileSync(path.join(root, "site/components/text-input.js"), "utf8");

  assert.match(source, /<input part="input"/);
  assert.match(source, /slot name="label"/);
  assert.match(source, /slot name="description"/);
  assert.match(source, /slot name="error"/);
  assert.match(source, /input\.required = this\.hasAttribute\("required"\)/);
  assert.match(source, /input\.disabled = this\.hasAttribute\("disabled"\)/);
  assert.match(source, /aria-invalid/);
});
