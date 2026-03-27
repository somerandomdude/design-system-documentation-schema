import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const NOTE_CSS = `
  ${BASE_RESET}
  :host { display: block; }
  .note {
    border-radius: var(--ds-radius-md);
    padding: var(--ds-space-2) var(--ds-space-4);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    margin-bottom: var(--ds-space-4);
    line-height: 1.5;
  }
  .note--warning {
    background: var(--ds-color-note-warning-bg);
    border: 1px solid var(--ds-color-note-warning-border);
  }
  .note--info {
    background: var(--ds-color-accent-subtle);
    border: 1px solid var(--ds-color-border-light);
  }
`;

export class DsNote extends HTMLElement {
  static get observedAttributes() {
    return ["variant"];
  }
  constructor() {
    super();
    this._shadow = createShadow(this, NOTE_CSS);
    this._shadow.innerHTML =
      '<div class="note note--info" part="note"><slot></slot></div>';
  }
  connectedCallback() {
    this._updateVariant();
  }
  attributeChangedCallback() {
    this._updateVariant();
  }
  _updateVariant() {
    var v = this.getAttribute("variant") || "info";
    var el = this._shadow.querySelector(".note");
    if (el) el.className = "note note--" + v;
  }
}
