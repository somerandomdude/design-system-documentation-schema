import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const TYPE_REF_CSS = `
  ${BASE_RESET}
  :host { display: inline; }
  a {
    font-family: ${FONT.mono};
    font-size: inherit;
    color: inherit;
    text-decoration-style: dashed;
    text-decoration-thickness: .125em;
    text-underline-offset: .25rem;
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
