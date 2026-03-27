import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const TYPE_REF_CSS = `
  ${BASE_RESET}
  :host { display: inline; }
  a {
    font-family: ${FONT.mono};
    font-size: var(--ds-font-size-md);
    color: var(--ds-color-accent);
    text-decoration: none;
    border-bottom: 1px dashed var(--ds-color-accent);
    transition: color var(--ds-transition-fast), border-bottom-color var(--ds-transition-fast);
  }
  a:hover {
    color: var(--ds-color-accent-hover);
    border-bottom-style: solid;
  }
`;

export class DsTypeRef extends HTMLElement {
  static get observedAttributes() {
    return ["href"];
  }
  constructor() {
    super();
    this._shadow = createShadow(this, TYPE_REF_CSS);
  }
  connectedCallback() {
    var self = this;
    requestAnimationFrame(function () {
      self._render();
    });
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }
  _render() {
    var href = this.getAttribute("href") || "#";
    var text = this.textContent.trim();
    this._shadow.innerHTML =
      '<a href="' + esc(href) + '" part="link">' + esc(text) + "</a>";
  }
}
