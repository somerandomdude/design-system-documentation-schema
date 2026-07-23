"use strict";

const { UsageError } = require("./errors.js");

const USAGE = `Usage:
  dsds-local validate --source <file-or-directory> [--json]
  dsds-local --help

Commands:
  validate  Validate one DSDS JSON file or a directory of .dsds.json files.

Options:
  --source <path>  File or directory to validate.
  --json           Write machine-readable results to stdout.
  --help           Show this help text.
`;

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes("--help")) {
    return { help: true };
  }

  const command = argv[0];
  if (command !== "validate") {
    throw new UsageError(`Unknown command: ${command}`);
  }

  let source;
  let json = false;
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--source") {
      source = argv[index + 1];
      if (!source || source.startsWith("--")) {
        throw new UsageError("--source requires a file or directory path");
      }
      index += 1;
      continue;
    }
    throw new UsageError(`Unknown option: ${argument}`);
  }

  if (!source) {
    throw new UsageError("validate requires --source <file-or-directory>");
  }

  return { command, source, json, help: false };
}

module.exports = { USAGE, parseArgs };
