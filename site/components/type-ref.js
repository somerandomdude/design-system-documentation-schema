import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const TYPE_REF_CSS = `
  ${BASE_RESET}
  :host { display: inline; }
  a {
    font-family: ${FONT.mono};
    font-size: inherit;
    color: inherit;
    text-decoration: underline;
    background: var(--ds-color-bg-inverse);
    padding: 0 0.25em;
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
    // A single requestAnimationFrame tick isn't a reliable guarantee that
    // this element's light-DOM children (read via textContent below) have
    // finished parsing — see the equivalent note in spec-nav.js. Waiting
    // for DOMContentLoaded when the document is still loading avoids an
    // intermittent empty-link-text race.
    var self = this;
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          self._render();
        },
        { once: true },
      );
    } else {
      this._render();
    }
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
