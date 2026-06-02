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
