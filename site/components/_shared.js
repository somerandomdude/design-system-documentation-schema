export function createShadow(el, css, mode) {
  const shadow = el.attachShadow({ mode: mode || "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  shadow.adoptedStyleSheets = [sheet];
  return shadow;
}

export function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML-escape `s`, but also convert CommonMark-style backtick inline-code
 * spans (`like-this`) into <ds-code inline> elements. The full markdown
 * grammar is out of scope; we only handle the one construct that
 * appears in DSDS schema descriptions, where contributors refer to
 * field names and code fragments inline.
 *
 * Closing backticks must appear on the same line as the opening one; an
 * unmatched ` falls through as a literal character.
 */
export function escWithCode(s) {
  if (s == null) return "";
  const parts = String(s).split(/(`[^`\n]+`)/g);
  return parts
    .map((p) => {
      if (p.length >= 2 && p.startsWith("`") && p.endsWith("`")) {
        return `<ds-code inline>${esc(p.slice(1, -1))}</ds-code>`;
      }
      return esc(p);
    })
    .join("");
}

export const BASE_RESET = `
  :host { display: inline-block; box-sizing: border-box; }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
`;

export const FONT = {
  body: "var(--ds-font-body)",
  mono: "var(--ds-font-mono)",
};

// Icons live as real .svg files in site/assets/ (edit them directly there)
// instead of inline markup, so ICON_NAMES is just the name → file map.
// loadIcon() fetches + caches each file's markup on first use; every icon
// is monoline with stroke/fill="currentColor" so the containing element's
// `color` recolors it once inlined into the DOM.
const ICON_FILES = {
  menu: "icon-menu.svg",
  close: "icon-close.svg",
  info: "icon-info.svg",
  flask: "icon-flask.svg",
  dot: "icon-dot.svg",
  lightbulb: "icon-lightbulb.svg",
  warning: "icon-warning.svg",
  brackets: "icon-brackets.svg",
  logo: "dsds.svg",
};

const _iconCache = new Map();

/**
 * Fetch (and cache) the raw markup of a named icon from site/assets/.
 * Returns a Promise<string> — always resolves, with "" on failure so a
 * missing/renamed file degrades to no icon rather than a thrown error.
 *
 * In the built site, scripts/build-site.js's bundler inlines every icon
 * file's contents at build time via seedIcons() below, so this fetch never
 * actually runs there — only in dev mode (served, never file://), where a
 * live fetch means editing an .svg under site/assets/ shows up on refresh
 * with no rebuild needed. The build-time inlining exists because fetch()
 * of a same-directory file is blocked outright under file:// (opening
 * site/dist/*.html directly, no server), which the bundle otherwise
 * supports.
 */
export function loadIcon(name) {
  if (_iconCache.has(name)) return _iconCache.get(name);
  const file = ICON_FILES[name];
  const promise = file
    ? fetch("assets/" + file)
        .then((res) => (res.ok ? res.text() : ""))
        .catch(() => "")
    : Promise.resolve("");
  _iconCache.set(name, promise);
  return promise;
}

/**
 * Pre-populate the icon cache with already-known markup, so loadIcon()
 * resolves instantly without a network request. Called once by the
 * bundled components.js (injected by scripts/build-site.js) with every
 * icon file's contents read at build time.
 */
export function seedIcons(map) {
  for (const name of Object.keys(map)) {
    _iconCache.set(name, Promise.resolve(map[name]));
  }
}
