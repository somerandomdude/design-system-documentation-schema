#!/usr/bin/env node
/**
 * Fetches the published site and checks what an agent gets from the machine-readable files:
 *
 *   - every URL in sitemap.xml, in llms.txt, and in manifest.json answers 200;
 *   - a file with a Markdown or JSON or text extension is served as one, not as HTML;
 *   - every HTML page in the sitemap points at a Markdown mirror with rel="alternate", and
 *     that mirror answers 200 as text/markdown.
 *
 * Needs the network, so it's not part of `npm run check`. Run it after a deploy:
 *   npm run check:live                          # https://designsystemdocspec.org
 *   npm run check:live -- --base http://localhost:8000
 */

const args = process.argv.slice(2);
const baseArg = args.indexOf("--base");
const BASE = (baseArg >= 0 ? args[baseArg + 1] : "https://designsystemdocspec.org").replace(/\/$/, "");
const CONCURRENCY = 8;
const MARKDOWN_EXT = /\.(md|txt|json|yaml|yml|xml)$/i;

const origin = new URL(BASE).origin;
// The site's own links are rewritten to the base being checked, so a local run stays local.
const onSite = (url) => url.replace(/^https?:\/\/designsystemdocspec\.org/, BASE);

async function get(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "dsds-live-check" } });
    return { status: res.status, type: res.headers.get("content-type") ?? "", text: res.ok ? await res.text() : "" };
  } catch (err) {
    return { status: 0, type: "", text: "", error: err.message };
  }
}

async function pool(items, worker) {
  const out = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await worker(items[i]);
      }
    }),
  );
  return out;
}

const sitemap = await get(`${BASE}/sitemap.xml`);
if (sitemap.status !== 200) {
  console.error(`✗ ${BASE}/sitemap.xml answered ${sitemap.status}`);
  process.exit(1);
}
const pages = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => onSite(m[1].trim()));

const llms = await get(`${BASE}/llms.txt`);
const llmsLinks = [...llms.text.matchAll(/https?:\/\/[^\s)\]>"']+/g)].map((m) => onSite(m[0].replace(/[.,;]+$/, "")));

const manifestRes = await get(`${BASE}/manifest.json`);
const manifestLinks = [];
try {
  (function walk(v) {
    if (typeof v === "string" && v.startsWith(origin)) manifestLinks.push(onSite(v));
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(JSON.parse(manifestRes.text));
} catch {
  console.error(`✗ ${BASE}/manifest.json isn't valid JSON`);
  process.exit(1);
}

const urls = [...new Set([...pages, ...llmsLinks, ...manifestLinks])].filter((u) => u.startsWith(BASE));
const failures = [];
const fail = (url, why) => failures.push(`${url}: ${why}`);

await pool(urls, async (url) => {
  const res = await get(url);
  if (res.status !== 200) return fail(url, res.error ? `request failed (${res.error})` : `answered ${res.status}`);
  const path = new URL(url).pathname;
  if (MARKDOWN_EXT.test(path) && /text\/html/i.test(res.type)) fail(url, `served as HTML (${res.type}) where a ${path.split(".").pop()} file is expected`);
});

// A page's Markdown mirror: linked from the page, and served as Markdown.
const htmlPages = pages.filter((u) => !MARKDOWN_EXT.test(new URL(u).pathname));
await pool(htmlPages, async (url) => {
  const res = await get(url);
  if (res.status !== 200) return; // already reported above
  if (!/text\/html/i.test(res.type)) return fail(url, `a page is served as ${res.type || "no type"}, not HTML`);
  const alt = res.text.match(/<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]*>/i)?.[0];
  const href = alt?.match(/href="([^"]+)"/)?.[1];
  if (!href) return fail(url, "no rel=\"alternate\" type=\"text/markdown\" link to a Markdown mirror");
  const mirror = await get(new URL(href, url).href);
  if (mirror.status !== 200) return fail(url, `its Markdown mirror (${href}) answers ${mirror.status}`);
  if (!/text\/markdown|text\/plain/i.test(mirror.type)) fail(url, `its Markdown mirror (${href}) is served as ${mirror.type || "no type"}`);
});

if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  console.error(`\n${failures.length} problem(s) on ${BASE}.`);
  process.exit(1);
}
console.log(`✓ ${BASE}: ${urls.length} URL(s) answer 200 with the right type, and ${htmlPages.length} page(s) link a Markdown mirror that answers.`);
