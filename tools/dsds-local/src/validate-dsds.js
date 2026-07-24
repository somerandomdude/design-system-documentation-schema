"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const { SourceError } = require("./errors.js");

const schemaPath = path.resolve(__dirname, "../../../spec/schema/dsds.bundled.schema.json");
let compiledValidator;

function getValidator() {
  if (!compiledValidator) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    compiledValidator = ajv.compile(schema);
  }
  return compiledValidator;
}

function validateSource(source) {
  let bytes;
  try {
    bytes = fs.readFileSync(source);
  } catch (error) {
    return {
      valid: false,
      source,
      dsdsVersion: null,
      errors: [{ path: "", keyword: "read", message: error.message }],
    };
  }

  let document;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    return {
      valid: false,
      source,
      dsdsVersion: null,
      errors: [{ path: "", keyword: "parse", message: error.message }],
    };
  }

  const valid = getValidator()(document);
  return {
    valid: Boolean(valid),
    source,
    dsdsVersion: document.dsdsVersion || null,
    errors: valid
      ? []
      : getValidator().errors.map((error) => ({
          path: error.instancePath || error.schemaPath || "",
          keyword: error.keyword,
          message: error.message || "validation failed",
        })),
  };
}

function validateSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new SourceError("At least one source is required", "SOURCE_EMPTY");
  }
  return sources.map(validateSource);
}

module.exports = { validateSource, validateSources };
