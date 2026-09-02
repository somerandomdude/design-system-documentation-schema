// Netlify Edge Function: Accept-header content negotiation for this site's
// markdown mirrors, plus a markdown-aware 404.
//
// This site already publishes a `.md` mirror at a separate URL for every
// real page (`/quickstart` <-> `/quickstart.md`) - see AGENTS.md and
// llms.txt. That covers an agent that already knows the `.md` URL. It does
// not cover one that does the standard HTTP thing and sends
// `Accept: text/markdown` on the plain page URL, expecting content
// negotiation - which a static `[[headers]]` rule in netlify.toml can't
// provide, because a header rule can only branch on the request PATH, never
// on the request's own Accept header. That takes actual per-request logic,
// which is what this file is for. Two cases:
//
//   1. `Accept: text/markdown` on one of this site's real pages serves that
//      page's own already-published .md mirror instead of the .html - same
//      URL, different representation - and adds `Vary: Accept` to every
//      response on these paths (negotiated or not) so a CDN/browser cache
//      can never serve one representation to a client that asked for the
//      other.
//   2. A path that doesn't exist at all, requested with
//      `Accept: text/markdown`, gets 404.md's content at a real 404 status
//      - not Netlify's static 404.html pushed through a markdown reader.
//
// PAGE_MD_PATH is exactly the set of pages this site publishes as an
// HTML+.md pair: nav.js's TOP_LINKS + FOOTER_LINKS, plus "/" for the
// Overview page itself (nav.js's own "index" slug). Kept as an explicit,
// hand-written list rather than generated at build time, because an edge
// function is committed source Netlify's own deploy step discovers - it
// isn't produced by `npm run build` the way site/dist/ is, so it can't read
// nav.js's exports at request time. scripts/check-edge-function-pages.mjs
// (part of `npm run check`) asserts this list can't silently drift from
// nav.js's TOP_LINKS/FOOTER_LINKS - the same guard shape
// check-docs-coverage.mjs already uses for the nav itself.
const PAGE_MD_PATH = new Map([
  ["/", "/index.md"],
  ["/quickstart", "/quickstart.md"],
  ["/extending", "/extending.md"],
  ["/schema", "/schema.md"],
  ["/conformance", "/conformance.md"],
  ["/stability", "/stability.md"],
  ["/security", "/security.md"],
  ["/examples", "/examples.md"],
]);

const NOT_FOUND_MD_PATH = "/404.md";

// Real RFC 7231 Accept parsing (media range + q value, default q=1), not a
// substring check - a browser's ordinary
// `text/html,application/xhtml+xml,...,*/*;q=0.8` must never match this,
// or every normal page load would silently start receiving markdown.
// `text/markdown` (with or without a q) is the case every real agent
// client sends; `text/*` is honored too since it's a strict match against
// the RFC's media-range grammar. A bare, type-less `*/*` (curl's default)
// is deliberately NOT treated as "wants markdown" - only an Accept header
// that actually names markdown does.
export function prefersMarkdown(acceptHeader) {
  if (!acceptHeader) return false;
  const ranges = acceptHeader
    .split(",")
    .map((part) => {
      const [type, ...params] = part
        .trim()
        .split(";")
        .map((s) => s.trim());
      const qParam = params.find((p) => p.toLowerCase().startsWith("q="));
      const q = qParam ? parseFloat(qParam.slice(2)) : 1;
      return { type: (type || "").toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((r) => r.type);

  const markdown = ranges.find((r) => r.type === "text/markdown" || r.type === "text/*");
  if (!markdown) return false;

  const html = ranges.find((r) => r.type === "text/html" || r.type === "*/*");
  if (!html) return true;

  return markdown.q >= html.q;
}

async function serveMarkdown(baseUrl, mdPath, status) {
  const mdResponse = await fetch(new URL(mdPath, baseUrl));
  const headers = new Headers(mdResponse.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.append("Vary", "Accept");
  return new Response(mdResponse.body, { status, headers });
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname === "" ? "/" : url.pathname;
  const wantsMarkdown = prefersMarkdown(request.headers.get("accept"));
  const knownPageMdPath = PAGE_MD_PATH.get(path);

  if (knownPageMdPath) {
    if (!wantsMarkdown) {
      const response = await context.next();
      const headers = new Headers(response.headers);
      headers.append("Vary", "Accept");
      return new Response(response.body, { status: response.status, headers });
    }
    return serveMarkdown(url, knownPageMdPath, 200);
  }

  // Not one of our own pages (an asset, a versioned schema file, or a path
  // that doesn't exist at all). Let Netlify resolve it normally, and only
  // step in if that resolution is a 404 and the client asked for markdown -
  // an ordinary asset request (css/js/svg/schema files) is untouched.
  const response = await context.next();
  if (response.status !== 404) return response;

  const headers = new Headers(response.headers);
  headers.append("Vary", "Accept");
  if (!wantsMarkdown) {
    return new Response(response.body, { status: 404, headers });
  }
  return serveMarkdown(url, NOT_FOUND_MD_PATH, 404);
};

// Excludes the .md mirrors themselves (already the raw content - and
// excluding them is what stops this function's own `fetch()` calls above
// from re-triggering itself on the same site) plus common static-asset
// extensions, so ordinary asset traffic never invokes this function at all.
export const config = {
  path: "/*",
  excludedPath: [
    "/*.md",
    "/*.css",
    "/*.js",
    "/*.mjs",
    "/*.json",
    "/*.yaml",
    "/*.yml",
    "/*.txt",
    "/*.svg",
    "/*.png",
    "/*.ico",
    "/*.ttf",
    "/*.woff",
    "/*.woff2",
    "/v*",
  ],
};
