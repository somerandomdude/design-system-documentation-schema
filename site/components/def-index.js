import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const DEF_INDEX_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    background: var(--ds-color-bg-subtle);
    border: 1px solid var(--ds-color-border-light);
    border-radius: var(--ds-radius-lg);
    padding: var(--ds-space-4) var(--ds-space-6);
    margin-bottom: var(--ds-space-12);
  }
  ::slotted(p) {
    margin-bottom: var(--ds-space-2);
    font-size: var(--ds-font-size-md);
  }
  ::slotted(ul) {
    list-style: none;
    padding: 0;
    margin: 0;
    column-count: 2;
    column-gap: var(--ds-space-6);
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
    "ds-def-index li { margin-bottom: var(--ds-space-1); font-size: var(--ds-font-size-base); break-inside: avoid; }",
    "ds-def-index li a { font-family: var(--ds-font-mono); }",
  ].join("\n");
  document.head.appendChild(s);
}

export class DsDefIndex extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, DEF_INDEX_CSS);
    this._shadow.innerHTML = '<nav part="nav"><slot></slot></nav>';
  }
  connectedCallback() {
    ensureDefIndexLightStyles();
  }
}
