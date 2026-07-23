// ═══════════════════════════════════════════════════════════════════════════
// <ds-select>
//
// A labelled native select with tokenized supporting and validation content.
// Option and optgroup children stay in light DOM so the browser owns their
// native selection, keyboard, and form behavior.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const SELECT_CSS = `
  ${BASE_RESET}
  :host { display: inline-block; min-inline-size: 16rem; }
  .field { display: grid; gap: var(--ds-space-1); font-family: ${FONT.body}; color: var(--ds-color-text); }
  .label { font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-bold); line-height: var(--ds-line-height-snug); }
  select { min-block-size: 2.5rem; inline-size: 100%; padding: var(--ds-space-2) var(--ds-space-4); border: var(--ds-border-width) solid var(--ds-color-border); border-radius: 0; background: var(--ds-color-bg-inverse); color: var(--ds-color-text); font: inherit; font-size: var(--ds-font-size-base); }
  select:hover:not(:disabled) { border-color: var(--ds-color-text); }
  select:focus-visible { border-color: var(--ds-color-accent); outline: 3px solid var(--ds-color-accent-seed); outline-offset: 2px; }
  .description, .error { font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-normal); }
  .error { display: none; color: var(--ds-color-warning-text); }
  :host([error]) .error { display: block; }
  :host([error]) select { border-color: var(--ds-color-warning-text); }
  select:disabled { cursor: not-allowed; opacity: 0.5; }
  ::slotted(*) { display: revert; }
`;

export class DsSelect extends HTMLElement {
  static get observedAttributes() { return ["name", "value", "required", "disabled", "multiple", "size", "error"]; }

  constructor() {
    super();
    this._shadow = createShadow(this, SELECT_CSS);
    this._shadow.innerHTML = `<label class="field" part="field">
      <span class="label" part="label"><slot name="label"></slot></span>
      <select part="select" aria-describedby="description error"><slot></slot></select>
      <span class="description" id="description" part="description"><slot name="description"></slot></span>
      <span class="error" id="error" part="error"><slot name="error"></slot></span>
    </label>`;
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  _render() {
    const select = this._shadow.querySelector("select");
    if (!select) return;
    this._syncStringAttribute(select, "name");
    select.required = this.hasAttribute("required");
    select.disabled = this.hasAttribute("disabled");
    select.multiple = this.hasAttribute("multiple");
    if (this.hasAttribute("size")) select.setAttribute("size", this.getAttribute("size"));
    else select.removeAttribute("size");
    if (this.hasAttribute("value") && select.value !== this.getAttribute("value")) select.value = this.getAttribute("value") || "";
    select.setAttribute("aria-invalid", this.hasAttribute("error") ? "true" : "false");
  }

  _syncStringAttribute(control, name) {
    const value = this.getAttribute(name);
    if (value == null) control.removeAttribute(name);
    else control.setAttribute(name, value);
  }
}
