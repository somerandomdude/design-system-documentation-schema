/**
 * gallery.js — Renders the component gallery from registry.js.
 *
 * Loads the *real* components via ../components/index.js (see index.html),
 * then builds an isolated, labelled preview for every entry. Each demo shows
 * the live render plus a toggleable, copy-honest markup source.
 *
 * Two modes:
 *   - Full gallery (default): every component, grouped by category.
 *   - Focus mode (?tag=ds-badge): a single component, full width, for tight
 *     styling iteration.
 */

import { COMPONENTS } from "./registry.js";

const CATEGORY_LABELS = {
  content: ["Content components", "rendered live below"],
  layout: ["Layout & navigation", "structural — open the doc-page template to see these in context"],
  schema: ["Schema-driven", "populated from build-time data on generated pages"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

// A demo whose markup contains block-level elements (p, table,
// ds-prop-table, ds-code blocks) reads better stacked than inline-flowed.
function isBlockDemo(html) {
  return /<(p|table|ds-table|ds-prop-table|ds-heading|ds-code(?![^>]*\binline\b))\b/.test(
    html,
  );
}

// Fixed-position, scroll-driven, or mobile-only components (nav,
// back-to-top) can't render meaningfully inline — they need their
// own viewport. An iframe gives each a scoped page that loads the real
// tokens.css + components, so fixed positioning and scroll behavior work
// exactly as on a real page. Set `iframe: true` on a demo to use this.
function makeFrame(demo) {
  const tokensUrl = new URL("../tokens.css", location.href).href;
  const compUrl = new URL("../components/index.js", location.href).href;
  const doc = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${tokensUrl}">
<script type="module" src="${compUrl}"></script>
<style>
  html,body { margin:0; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         color:var(--ds-color-text); background:var(--ds-color-bg);
         font-size:14px; line-height:1.5; }
</style>
</head><body>${demo.html}</body></html>`;

  const frame = el("iframe", {
    class: "wb-frame",
    title: demo.label || "demo",
    style: `height:${demo.height || 300}px;` + (demo.frameWidth ? `width:${demo.frameWidth}px;` : ""),
    loading: "lazy",
  });
  frame.srcdoc = doc;
  return frame;
}

function renderVariant(demo) {
  const stage = demo.iframe
    ? el("div", { class: "wb-stage wb-stage--frame" }, makeFrame(demo))
    : el("div", {
        class: "wb-stage" + (isBlockDemo(demo.html) ? " wb-stage--block" : ""),
        html: demo.html,
      });

  const code = el("pre", { class: "wb-code", hidden: "" }, demo.html);

  const toggle = el(
    "button",
    {
      class: "wb-variant__toggle",
      type: "button",
      onClick: () => {
        const showing = code.hasAttribute("hidden");
        if (showing) code.removeAttribute("hidden");
        else code.setAttribute("hidden", "");
        toggle.textContent = showing ? "hide markup" : "show markup";
      },
    },
    "show markup",
  );

  return el(
    "div",
    { class: "wb-variant" },
    el(
      "div",
      { class: "wb-variant__label" },
      el("span", {}, demo.label || "Example"),
      toggle,
    ),
    stage,
    code,
  );
}

function renderComponent(entry, { focus = false } = {}) {
  const card = el("section", { class: "wb-demo", id: entry.tag });

  const head = el(
    "div",
    { class: "wb-demo__head" },
    el("h3", { class: "wb-demo__title" }, entry.title),
    el("code", { class: "wb-demo__tag" }, `<${entry.tag}>`),
  );
  if (!focus) {
    head.append(
      el(
        "a",
        { class: "wb-demo__focus", href: `?tag=${entry.tag}`, title: "Isolate this component" },
        "focus ↗",
      ),
    );
  }
  card.append(head);

  if (entry.notes) {
    card.append(el("p", { class: "wb-demo__notes" }, entry.notes));
  }

  if (entry.demos && entry.demos.length) {
    for (const demo of entry.demos) card.append(renderVariant(demo));
  } else {
    card.append(
      el(
        "div",
        { class: "wb-variant" },
        el(
          "p",
          { class: "wb-demo__notes", style: "margin:0" },
          "No standalone demo — see the ",
          el("a", { href: "templates/doc-page.html" }, "doc-page template"),
          ".",
        ),
      ),
    );
  }
  return card;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function renderSidebar(groups) {
  const nav = el("nav", { class: "wb-sidebar", "aria-label": "Components" });
  for (const [cat, entries] of groups) {
    if (!entries.length) continue;
    nav.append(el("div", { class: "wb-sidebar__group-label" }, CATEGORY_LABELS[cat][0]));
    for (const entry of entries) {
      nav.append(el("a", { href: `#${entry.tag}` }, entry.title));
    }
  }
  return nav;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function groupByCategory(list) {
  const order = ["content", "layout", "schema"];
  return order.map((cat) => [cat, list.filter((c) => c.category === cat)]);
}

function main() {
  const root = document.getElementById("wb-root");
  const params = new URLSearchParams(location.search);
  const focusTag = params.get("tag");

  if (focusTag) {
    const entry = COMPONENTS.find((c) => c.tag === focusTag);
    const main = el("div", { class: "wb-main wb-main--wide" });
    main.append(
      el(
        "div",
        { class: "wb-focusbar" },
        el("a", { href: "index.html" }, "← all components"),
      ),
    );
    if (entry) {
      main.append(renderComponent(entry, { focus: true }));
    } else {
      main.append(el("p", {}, `Unknown component: ${focusTag}`));
    }
    root.append(main);
    document.title = `${entry ? entry.title : focusTag} — DSDS Workbench`;
    return;
  }

  const groups = groupByCategory(COMPONENTS);

  const layout = el("div", { class: "wb-layout" });
  layout.append(renderSidebar(groups));

  const main = el("div", { class: "wb-main" });
  main.append(
    el(
      "div",
      { class: "wb-intro" },
      el("h1", {}, "Component gallery"),
      el(
        "p",
        {},
        "Every DSDS component, rendered live from the real source in ",
        el("code", {}, "site/components/"),
        ", reading the real ",
        el("code", {}, "tokens.css"),
        ". Edit a component or a token and refresh — no build step. Page layout (",
        el("code", {}, "style.css"),
        ") is exercised in the ",
        el("a", { href: "templates/doc-page.html" }, "doc-page template"),
        " instead. Use ",
        el("strong", {}, "focus ↗"),
        " to isolate a single component.",
      ),
    ),
  );

  for (const [cat, entries] of groups) {
    if (!entries.length) continue;
    const [label, hint] = CATEGORY_LABELS[cat];
    main.append(
      el(
        "h2",
        { class: "wb-cat" },
        label,
        el("span", { class: "wb-cat__hint" }, hint),
      ),
    );
    for (const entry of entries) main.append(renderComponent(entry));
  }

  layout.append(main);
  root.append(layout);
}

main();
