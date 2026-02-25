#!/usr/bin/env node
/**
 * sync-examples.js — Synchronize JSON examples from source files into markdown.
 *
 * Scans all markdown files in spec/modules/ for include directives of the form:
 *
 *   <!-- dsds:include path/to/file.json#/key -->
 *
 * and replaces the fenced JSON code block that immediately follows with the
 * content from the referenced file and key path. If no code block follows the
 * directive, one is inserted.
 *
 * Directive syntax:
 *
 *   <!-- dsds:include <path> -->
 *     Includes the entire file content.
 *
 *   <!-- dsds:include <path>#/<key> -->
 *     Includes the value at the given top-level key.
 *
 *   <!-- dsds:include <path>#/<key>/<nested>/<path> -->
 *     Navigates a dot-like path of keys into the JSON structure.
 *     Array indices are supported (e.g., #/tokenApi/0).
 *
 * Paths are resolved relative to the project root (the parent of scripts/).
 *
 * The directive comment and its closing marker are preserved as HTML comments
 * that are invisible when the markdown is rendered:
 *
 *   <!-- dsds:include spec/examples/tokens/token.json#/tokenDoc -->
 *   ```json
 *   { ... auto-generated ... }
 *   ```
 *   <!-- /dsds:include -->
 *
 * Usage:
 *   node scripts/sync-examples.js           # update all markdown files
 *   node scripts/sync-examples.js --check   # check only, exit 1 if out of date
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const MODULES_DIR = path.join(ROOT, "spec", "modules");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an include directive line.
 * Returns { filePath, keyPath } or null if not a directive.
 *
 * Examples:
 *   "<!-- dsds:include spec/examples/tokens/token.json#/tokenDoc -->"
 *   → { filePath: "spec/examples/tokens/token.json", keyPath: ["tokenDoc"] }
 *
 *   "<!-- dsds:include spec/examples/tokens/token.json -->"
 *   → { filePath: "spec/examples/tokens/token.json", keyPath: [] }
 *
 *   "<!-- dsds:include spec/examples/common/accessibility.json#/accessibilityObject/colorContrast/0 -->"
 *   → { filePath: "...", keyPath: ["accessibilityObject", "colorContrast", "0"] }
 */
function parseDirective(line) {
  const trimmed = line.trim();
  const match = trimmed.match(/^<!--\s*dsds:include\s+(\S+)\s*-->$/);
  if (!match) return null;

  const raw = match[1];
  const hashIndex = raw.indexOf("#");

  if (hashIndex === -1) {
    return { filePath: raw, keyPath: [] };
  }

  const filePath = raw.slice(0, hashIndex);
  const fragment = raw.slice(hashIndex + 1);
  // Fragment is like /tokenDoc or /tokenApi/0
  const keyPath = fragment
    .replace(/^\//, "")
    .split("/")
    .filter((s) => s.length > 0);

  return { filePath, keyPath };
}

/**
 * Test if a line is a closing include marker.
 */
function isClosingMarker(line) {
  return /^\s*<!--\s*\/dsds:include\s*-->\s*$/.test(line);
}

/**
 * Resolve a key path into a JSON value.
 * Supports object keys and array indices.
 */
function resolveKeyPath(data, keyPath) {
  let current = data;
  for (const segment of keyPath) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const idx = parseInt(segment, 10);
      if (isNaN(idx)) return undefined;
      current = current[idx];
    } else if (typeof current === "object") {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Read a JSON file and optionally navigate to a key path.
 * Returns the pretty-printed JSON string.
 */
function readExample(filePath, keyPath) {
  const absPath = path.resolve(ROOT, filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${filePath} (resolved to ${absPath})`);
  }

  const raw = fs.readFileSync(absPath, "utf-8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${e.message}`);
  }

  if (keyPath.length === 0) {
    return JSON.stringify(data, null, 2);
  }

  const value = resolveKeyPath(data, keyPath);
  if (value === undefined) {
    throw new Error(
      `Key path /${keyPath.join("/")} not found in ${filePath}. ` +
        `Available top-level keys: ${Object.keys(data).join(", ")}`,
    );
  }

  return JSON.stringify(value, null, 2);
}

// ---------------------------------------------------------------------------
// Process a single markdown file
// ---------------------------------------------------------------------------

/**
 * Process a markdown file, replacing include directives with JSON content.
 * Returns { content, updated, includes } where:
 *   - content is the new file content
 *   - updated is true if any changes were made
 *   - includes is an array of { line, filePath, keyPath, ok, error }
 */
function processMarkdown(mdPath) {
  const text = fs.readFileSync(mdPath, "utf-8");
  const lines = text.split("\n");
  const output = [];
  const includes = [];
  let updated = false;
  let i = 0;

  while (i < lines.length) {
    const directive = parseDirective(lines[i]);

    if (!directive) {
      output.push(lines[i]);
      i++;
      continue;
    }

    // Found an include directive
    const directiveLine = i + 1; // 1-based for reporting
    output.push(lines[i]); // keep the directive comment
    i++;

    // Try to read the example content
    let jsonContent;
    let error = null;
    try {
      jsonContent = readExample(directive.filePath, directive.keyPath);
    } catch (e) {
      error = e.message;
      includes.push({
        line: directiveLine,
        filePath: directive.filePath,
        keyPath: directive.keyPath,
        ok: false,
        error,
      });
      // Skip past existing code block and closing marker if present
      i = skipExistingBlock(lines, i);
      // Re-emit what was there (leave it untouched on error)
      continue;
    }

    const newBlock = "```json\n" + jsonContent + "\n```";

    // Check if the next non-empty content is an existing fenced code block
    const existingEnd = findExistingCodeBlock(lines, i);

    if (existingEnd !== null) {
      // There's an existing code block — compare and replace
      const existingBlock = lines.slice(i, existingEnd + 1).join("\n");

      if (existingBlock === newBlock) {
        // No change needed — copy as-is
        for (let j = i; j <= existingEnd; j++) {
          output.push(lines[j]);
        }
        i = existingEnd + 1;
      } else {
        // Replace the block
        output.push(...newBlock.split("\n"));
        i = existingEnd + 1;
        updated = true;
      }
    } else {
      // No existing code block — insert one
      output.push(...newBlock.split("\n"));
      updated = true;
    }

    // Handle closing marker
    if (i < lines.length && isClosingMarker(lines[i])) {
      output.push(lines[i]);
      i++;
    } else {
      // Insert closing marker if missing
      output.push("<!-- /dsds:include -->");
      updated = true;
    }

    includes.push({
      line: directiveLine,
      filePath: directive.filePath,
      keyPath: directive.keyPath,
      ok: true,
      error: null,
    });
  }

  return {
    content: output.join("\n"),
    updated,
    includes,
  };
}

/**
 * Starting at line index `start`, check if the next content is a fenced
 * JSON code block. Returns the index of the closing ``` line, or null.
 */
function findExistingCodeBlock(lines, start) {
  let i = start;

  // The very next line should be the opening fence
  if (i >= lines.length) return null;
  if (!/^\s*```json\s*$/i.test(lines[i])) return null;

  // Find the closing fence
  i++;
  while (i < lines.length) {
    if (/^\s*```\s*$/.test(lines[i])) {
      return i;
    }
    i++;
  }

  return null; // unclosed block
}

/**
 * Skip past an existing code block and optional closing marker.
 * Used when an error occurs reading the source file — we leave
 * the existing content untouched.
 */
function skipExistingBlock(lines, start) {
  let i = start;

  // Skip code block if present
  if (i < lines.length && /^\s*```json\s*$/i.test(lines[i])) {
    i++;
    while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
      i++;
    }
    if (i < lines.length) i++; // skip closing ```
  }

  // Skip closing marker if present
  if (i < lines.length && isClosingMarker(lines[i])) {
    i++;
  }

  return i;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");

  console.log(
    checkOnly
      ? "Checking markdown include directives...\n"
      : "Syncing markdown include directives...\n",
  );

  if (!fs.existsSync(MODULES_DIR)) {
    console.log("  No modules directory found — nothing to sync.\n");
    console.log("Done.\n");
    return;
  }

  const mdFiles = fs
    .readdirSync(MODULES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => path.join(MODULES_DIR, f));

  let totalIncludes = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let filesWithChanges = 0;

  for (const mdPath of mdFiles) {
    const relPath = path.relative(ROOT, mdPath);
    const result = processMarkdown(mdPath);

    if (result.includes.length === 0) continue;

    const label = checkOnly && result.updated ? "⚠" : "✓";
    console.log(`  ${label} ${relPath}`);

    for (const inc of result.includes) {
      const ref =
        inc.keyPath.length > 0
          ? `${inc.filePath}#/${inc.keyPath.join("/")}`
          : inc.filePath;

      if (inc.ok) {
        console.log(`      Line ${inc.line}: ${ref}`);
      } else {
        console.error(`    ✗ Line ${inc.line}: ${ref}`);
        console.error(`      Error: ${inc.error}`);
        totalErrors++;
      }
    }

    totalIncludes += result.includes.length;

    if (result.updated) {
      filesWithChanges++;
      totalUpdated += result.includes.filter((i) => i.ok).length;

      if (!checkOnly) {
        fs.writeFileSync(mdPath, result.content, "utf-8");
      }
    }
  }

  console.log(
    `\n  ${totalIncludes} include${totalIncludes === 1 ? "" : "s"} found`,
  );

  if (checkOnly) {
    if (filesWithChanges > 0) {
      console.log(
        `  ${filesWithChanges} file${filesWithChanges === 1 ? "" : "s"} out of date`,
      );
      console.log("\n  Run `node scripts/sync-examples.js` to update.\n");
      process.exit(1);
    } else if (totalErrors > 0) {
      console.log(`  ${totalErrors} error${totalErrors === 1 ? "" : "s"}`);
      process.exit(1);
    } else {
      console.log("  All includes are up to date.\n");
      process.exit(0);
    }
  } else {
    if (totalUpdated > 0) {
      console.log(
        `  ${totalUpdated} block${totalUpdated === 1 ? "" : "s"} updated across ${filesWithChanges} file${filesWithChanges === 1 ? "" : "s"}`,
      );
    } else {
      console.log("  All includes already up to date.");
    }

    if (totalErrors > 0) {
      console.log(`  ${totalErrors} error${totalErrors === 1 ? "" : "s"}`);
      process.exit(1);
    }

    console.log("\nDone.\n");
    process.exit(0);
  }
}

main();
