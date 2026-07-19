import { createShadow, BASE_RESET } from "./_shared.js";

const DEF_INDEX_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    margin-bottom: var(--ds-space-8);
  }
  nav {
    /*background: var(--ds-color-bg-subtle);
    padding: var(--ds-space-4) var(--ds-space-4);
    */
  }
  /*
  ::slotted(p) {
    margin-bottom: var(--ds-space-2);
    font-size: var(--ds-font-size-base);
  }
  */
  .defindex__title {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-bold);
    /* Default ("info") variant. */
    background: var(--ds-color-text);
    color: var(--ds-color-text-inverse);
    display: inline-block;
    padding: var(--ds-space-2) var(--ds-space-4);
    padding-inline-end: calc(var(--ds-space-4) + var(--ds-space-2));
  }

  .defindex__title:empty {
    display: none;
  }

  .defindex__content {
    background: var(--ds-color-bg-inverse);
    padding: var(--ds-space-4);
  }

  ::slotted(ul) {
    list-style: none;
    list-style-type: none;
    padding: 0;
    margin: 0;
    column-count: 3;
    column-gap: var(--ds-space-8);
  }

  @media (max-width: 600px) {
    ::slotted(ul) {
      column-count: 1;
    }
  }
`;

/* Light-DOM styles for list items and links inside <ds-def-index>,
   because ::slotted only reaches direct children, not nested <li>/<a>. */
const DEF_INDEX_LIGHT_ID = "ds-def-index-light-styles";
export function ensureDefIndexLightStyles() {
  if (document.getElementById(DEF_INDEX_LIGHT_ID)) return;
  var s = document.createElement("style");
  s.id = DEF_INDEX_LIGHT_ID;
  s.textContent = [
    "ds-def-index ul { padding-inline-start: 0 !important; margin-inline-start: 0 !important; margin-block-end: 0 !important; list-style: none !important; }",
    "ds-def-index li { margin-bottom: var(--ds-space-1); font-size: var(--ds-font-size-base); break-inside: avoid; padding-inline-start: 0; }",
    "ds-def-index li a { font-family: var(--ds-font-mono); }",
  ].join("\n");
  document.head.appendChild(s);
}

export class DsDefIndex extends HTMLElement {
  static get observedAttributes() {
    return ["title"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, DEF_INDEX_CSS);
    this._shadow.innerHTML = '<nav part="nav"><span class="defindex__title" part="title"></span><div class="defindex__content" part="content"><slot></slot></div></nav>';
  }


  connectedCallback() {
    ensureDefIndexLightStyles();
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const title = this.getAttribute("title") || "";
    const titleEl = this._shadow.querySelector(".defindex__title");
    if (titleEl) titleEl.textContent = title;
  }
}
