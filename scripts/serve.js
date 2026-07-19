#!/usr/bin/env node
/**
 * serve.js — Zero-dependency static file server for local development.
 *
 * Serves the `site/` source tree (not `site/dist/`) so the redesign
 * workbench can load the *real* component ES modules and stylesheets
 * directly — edit a component or token, refresh, see the change. No
 * build step sits between the source and the browser.
 *
 * Usage:
 *   npm run dev                 # serves site/ on http://localhost:4300
 *   npm run dev -- --port 8080  # custom port
 *   npm run dev -- --dist       # serve the built site/dist/ instead
 *
 * The workbench lives at /workbench/ once the server is running.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const PORT = Number(argValue("--port", process.env.PORT || 4300));
const SERVE_DIST = args.includes("--dist");
const SERVE_DIR = path.join(ROOT, "site", SERVE_DIST ? "dist" : "");

// ---------------------------------------------------------------------------
// MIME types — enough to serve HTML, ES modules, CSS, JSON, and images.
// .js and .mjs MUST be a JavaScript type or the browser refuses to run them
// as modules.
// ---------------------------------------------------------------------------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Request handling
// ---------------------------------------------------------------------------

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ "Cache-Control": "no-store" }, headers));
  res.end(body);
}

function resolvePath(urlPath) {
  // Strip query string and decode, then normalize to prevent directory
  // traversal outside SERVE_DIR.
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const resolved = path.normalize(path.join(SERVE_DIR, clean));
  if (!resolved.startsWith(SERVE_DIR)) return null; // traversal attempt
  return resolved;
}

const server = http.createServer((req, res) => {
  let target = resolvePath(req.url);
  if (target === null) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(target, (err, stat) => {
    // Directory → serve its index.html
    if (!err && stat.isDirectory()) {
      target = path.join(target, "index.html");
    }

    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        // Components fetch icons with a page-relative "assets/<file>.svg"
        // path, which only resolves correctly for top-level pages (the
        // real site is flat). Nested dev-only pages (e.g. /workbench/)
        // request "workbench/assets/<file>.svg" instead — fall back to
        // the real top-level assets/ dir before giving up.
        const nestedAsset = req.url.split("?")[0].match(/\/assets\/([^/]+)$/);
        if (nestedAsset) {
          const fallback = path.join(
            SERVE_DIR,
            "assets",
            decodeURIComponent(nestedAsset[1]),
          );
          if (fallback.startsWith(SERVE_DIR) && fallback !== target) {
            fs.readFile(fallback, (fallbackErr, fallbackData) => {
              if (fallbackErr) {
                send(res, 404, `Not found: ${req.url}`, {
                  "Content-Type": "text/plain; charset=utf-8",
                });
                return;
              }
              send(res, 200, fallbackData, {
                "Content-Type": contentType(fallback),
              });
            });
            return;
          }
        }
        send(res, 404, `Not found: ${req.url}`, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        return;
      }
      send(res, 200, data, { "Content-Type": contentType(target) });
    });
  });
});

server.listen(PORT, () => {
  const base = `http://localhost:${PORT}`;
  const label = SERVE_DIST ? "site/dist" : "site";
  console.log(`\n  DSDS dev server\n`);
  console.log(`  Serving   ${label}/`);
  console.log(`  Local     ${base}/`);
  console.log(`  Workbench ${base}/workbench/`);
  console.log(`\n  Ctrl+C to stop.\n`);
});
