/**
 * tokens.js — Live visual reference for the DSDS design tokens.
 *
 * Fetches the real tokens.css, parses every `--ds-*` custom property, and
 * renders swatches (colors), scale bars (spacing/size), and samples
 * (radius, type). Because it reads the file directly, editing tokens.css
 * and refreshing updates this page — the single source of truth for the
 * palette and scales you're redesigning.
 */

const CSS_URL = "../tokens.css";

// Parse `--name: value;` declarations from the :root block. We only want the
// canonical --ds-* tokens, not the legacy --color-* aliases at the bottom.
function parseTokens(cssText) {
  const tokens = [];
  const re = /(--ds-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(cssText)) !== null) {
    const name = m[1].trim();
    if (seen.has(name)) continue;
    seen.add(name);
    tokens.push({ name, value: m[2].trim() });
  }
  return tokens;
}

// Resolve a token to its final computed value (follows var() references and
// gives real px for rem, etc.) using a probe element.
function resolve(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function categorize(name) {
  const n = name.replace(/^--ds-/, "");
  if (n.startsWith("color-")) return "color";
  if (n.startsWith("space")) return "space";
  if (n.startsWith("font-size")) return "font-size";
  if (n.startsWith("font-weight")) return "font-weight";
  if (n.startsWith("radius")) return "radius";
  if (n.startsWith("border-width")) return "border";
  if (n.startsWith("line-height") || n.startsWith("tracking")) return "type-misc";
  if (n.startsWith("transition") || n.startsWith("shadow") || n.startsWith("z"))
    return "effect";
  return "other";
}

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "style") node.setAttribute("style", v);
    else node.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) node.append(c.nodeType ? c : String(c));
  return node;
}

function pxOf(value) {
  const v = value.trim();
  if (v.endsWith("px")) return parseFloat(v);
  if (v.endsWith("rem")) return parseFloat(v) * 16;
  return null;
}

function renderColorGroup(tokens) {
  const grid = el("div", { class: "wb-swatches" });
  for (const t of tokens) {
    const resolved = resolve(t.name) || t.value;
    grid.append(
      el(
        "div",
        { class: "wb-swatch" },
        el("div", { class: "wb-swatch__chip", style: `background:${resolved}` }),
        el(
          "div",
          { class: "wb-swatch__meta" },
          el("div", { class: "wb-swatch__name" }, t.name),
          el("div", { class: "wb-swatch__value" }, resolved),
        ),
      ),
    );
  }
  return grid;
}

function renderScaleGroup(tokens, { asBar = true, sample = false } = {}) {
  const wrap = el("div", {});
  // Sort by resolved px where possible so scales read in order.
  const withPx = tokens
    .map((t) => ({ ...t, px: pxOf(resolve(t.name) || t.value) }))
    .sort((a, b) => (a.px ?? 0) - (b.px ?? 0));
  for (const t of withPx) {
    const resolved = resolve(t.name) || t.value;
    const row = el(
      "div",
      { class: "wb-scale-row" },
      el("span", { class: "wb-scale-row__name" }, t.name),
    );
    if (sample) {
      row.append(
        el("span", { style: `font-size:${resolved};line-height:1;` }, "Ag"),
      );
    } else if (asBar && t.px != null) {
      row.append(el("span", { class: "wb-scale-row__bar", style: `width:${t.px}px` }));
    }
    row.append(el("span", { class: "wb-scale-row__value" }, resolved));
    wrap.append(row);
  }
  return wrap;
}

function renderRadiusGroup(tokens) {
  const grid = el("div", { class: "wb-swatches" });
  for (const t of tokens) {
    const resolved = resolve(t.name) || t.value;
    grid.append(
      el(
        "div",
        { class: "wb-swatch" },
        el("div", {
          class: "wb-swatch__chip",
          style: `background:var(--ds-color-accent-subtle);border-radius:${resolved};margin:10px;height:40px;`,
        }),
        el(
          "div",
          { class: "wb-swatch__meta" },
          el("div", { class: "wb-swatch__name" }, t.name),
          el("div", { class: "wb-swatch__value" }, resolved),
        ),
      ),
    );
  }
  return grid;
}

function renderGenericGroup(tokens) {
  const wrap = el("div", {});
  for (const t of tokens) {
    wrap.append(
      el(
        "div",
        { class: "wb-scale-row" },
        el("span", { class: "wb-scale-row__name" }, t.name),
        el("span", { class: "wb-scale-row__value" }, resolve(t.name) || t.value),
      ),
    );
  }
  return wrap;
}

const GROUP_ORDER = [
  ["color", "Color"],
  ["space", "Spacing"],
  ["font-size", "Type scale"],
  ["radius", "Radius"],
  ["font-weight", "Font weight"],
  ["type-misc", "Line height & tracking"],
  ["border", "Border width"],
  ["effect", "Transitions, shadow, z-index"],
  ["other", "Other"],
];

async function main() {
  const root = document.getElementById("wb-root");
  const main = el("div", { class: "wb-main wb-main--wide" });

  let cssText;
  try {
    cssText = await (await fetch(CSS_URL)).text();
  } catch (e) {
    main.append(el("p", {}, `Could not load tokens.css: ${e.message}`));
    root.append(main);
    return;
  }

  const tokens = parseTokens(cssText);
  const byCat = {};
  for (const t of tokens) (byCat[categorize(t.name)] ||= []).push(t);

  main.append(
    el(
      "div",
      { class: "wb-intro" },
      el("h1", {}, "Design tokens"),
      el(
        "p",
        {},
        `Parsed live from tokens.css — ${tokens.length} tokens. Edit tokens.css and refresh; every component in the gallery and every page updates from these values.`,
      ),
    ),
  );

  for (const [cat, label] of GROUP_ORDER) {
    const group = byCat[cat];
    if (!group || !group.length) continue;
    main.append(el("h2", { class: "wb-cat" }, label));
    if (cat === "color") main.append(renderColorGroup(group));
    else if (cat === "space") main.append(renderScaleGroup(group, { asBar: true }));
    else if (cat === "font-size") main.append(renderScaleGroup(group, { sample: true }));
    else if (cat === "radius") main.append(renderRadiusGroup(group));
    else main.append(renderGenericGroup(group));
  }

  root.append(main);
}

main();
