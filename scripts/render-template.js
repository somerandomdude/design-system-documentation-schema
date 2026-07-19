/**
 * render-template.js — Tiny, dependency-free template renderer.
 *
 * Templates are plain HTML files with {%key%} placeholders. Rendering is a
 * single pass of string substitution: no loops, conditionals, includes, or
 * escaping rules, and no dependency (Nunjucks, Handlebars, etc.). Content
 * that needs looping or branching (nav trees, schema-driven property
 * tables, ...) is built in JS ahead of time and passed in as an
 * already-rendered HTML string value.
 *
 * Usage:
 *   const { renderTemplate } = require("./render-template");
 *   const html = renderTemplate("site/templates/page.template.html", {
 *     title: "My Page",
 *     body: "<p>...</p>",
 *   });
 *
 * A placeholder with no matching key throws, so a typo'd {%key%} fails the
 * build loudly instead of silently leaving a gap in the page.
 */

const fs = require("fs");

const PLACEHOLDER_RE = /\{%\s*([a-zA-Z0-9_]+)\s*%\}/g;

function renderTemplateString(template, vars, sourceLabel) {
  return template.replace(PLACEHOLDER_RE, (match, key) => {
    if (!(key in vars)) {
      throw new Error(
        `Template placeholder {%${key}%} has no matching value` +
          (sourceLabel ? ` (in ${sourceLabel})` : ""),
      );
    }
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function renderTemplate(templatePath, vars) {
  const template = fs.readFileSync(templatePath, "utf-8");
  return renderTemplateString(template, vars, templatePath);
}

module.exports = { renderTemplate, renderTemplateString };
