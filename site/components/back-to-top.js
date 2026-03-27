import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const BACK_TO_TOP_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  a {
    display: inline-block;
    margin-top: var(--ds-space-12);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    color: var(--ds-color-text-secondary);
    text-decoration: none;
    transition: color var(--ds-transition-normal);
  }

  a:hover {
    color: var(--ds-color-accent);
  }
`;

export class DsBackToTop extends HTMLElement {
  static get observedAttributes() {
    return ["label", "href"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, BACK_TO_TOP_CSS);
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    var label = this.getAttribute("label") || "\u2191 Back to top";
    var href = this.getAttribute("href") || "#";
    this._shadow.innerHTML =
      '<a href="' + esc(href) + '" part="link">' + esc(label) + "</a>";
  }
}
