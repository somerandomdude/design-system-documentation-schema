"use strict";

class LocalCliError extends Error {
  constructor(message, code, exitCode = 1) {
    super(message);
    this.name = "LocalCliError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

class UsageError extends LocalCliError {
  constructor(message) {
    super(message, "USAGE_ERROR", 2);
    this.name = "UsageError";
  }
}

class SourceError extends LocalCliError {
  constructor(message, code = "SOURCE_ERROR") {
    super(message, code, 1);
    this.name = "SourceError";
  }
}

module.exports = { LocalCliError, UsageError, SourceError };
