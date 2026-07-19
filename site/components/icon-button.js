// ═══════════════════════════════════════════════════════════════════════════
// <ds-icon-button>
//
// A minimal icon-only button: a slotted icon plus a required accessible
// label. No built-in positioning, color variants, or sizes — that's left to
// whatever's using it (e.g. wrap it and set :host on the wrapper to make a
// fixed floating button).
//
// Attributes:
//   label — accessible name (required — this button has no visible text)
//
// Slots:
//   (default) — icon markup (e.g. an inline <svg>)
//
// Usage:
//   <ds-icon-button label="Toggle JSON view">
//     <svg>...</svg>
//   </ds-icon-button>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET } from "./_shared.js";

const ICON_BUTTON_CSS = `
  ${BASE_RESET}
  :host { display: inline-flex; }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    background: var(--ds-color-text);
    color: var(--ds-color-bg-inverse);
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  button:hover {
    background: var(--ds-color-accent);
  }

  ::slotted(*) {
    display: block;
  }
`;

export class DsIconButton extends HTMLElement {
  static get observedAttributes() {
    return ["label"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, ICON_BUTTON_CSS);
    this._shadow.innerHTML =
      '<button type="button" part="button"><slot></slot></button>';
  }

  connectedCallback() {
    this._syncLabel();
  }

  attributeChangedCallback() {
    this._syncLabel();
  }

  _syncLabel() {
    const btn = this._shadow.querySelector("button");
    if (btn) btn.setAttribute("aria-label", this.getAttribute("label") || "");
  }
}
