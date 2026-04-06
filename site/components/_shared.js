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

export const BASE_RESET = `
  :host { display: inline-block; box-sizing: border-box; }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
`;

export const FONT = {
  body: "var(--ds-font-body)",
  mono: "var(--ds-font-mono)",
};
