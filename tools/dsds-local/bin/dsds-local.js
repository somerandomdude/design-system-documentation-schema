#!/usr/bin/env node
"use strict";

const { parseArgs, USAGE } = require("../src/args.js");
const { LocalCliError } = require("../src/errors.js");
const { discoverSources } = require("../src/discover.js");
const { validateSources } = require("../src/validate-dsds.js");

function main(argv) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      process.stdout.write(USAGE);
      return 0;
    }

    const sources = discoverSources(args.source);
    const results = validateSources(sources);
    const passed = results.filter((result) => result.valid).length;
    const failed = results.length - passed;
    const output = {
      command: "validate",
      valid: failed === 0,
      sources: results,
      summary: { total: results.length, passed, failed },
    };

    if (args.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      for (const result of results) {
        const mark = result.valid ? "PASS" : "FAIL";
        process.stdout.write(`${mark} ${result.source}`);
        if (result.dsdsVersion) process.stdout.write(` (DSDS ${result.dsdsVersion})`);
        process.stdout.write("\n");
        for (const error of result.errors) {
          process.stderr.write(`  ${error.path || "/"}: ${error.message}\n`);
        }
      }
      process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
    }
    return output.valid ? 0 : 1;
  } catch (error) {
    const cliError = error instanceof LocalCliError ? error : new LocalCliError(error.message);
    process.stderr.write(`${cliError.message}\n`);
    return cliError.exitCode;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { main };
