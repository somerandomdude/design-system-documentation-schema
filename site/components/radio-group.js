// ═══════════════════════════════════════════════════════════════════════════
// <ds-radio-group>
//
// A fieldset wrapper for native radio inputs supplied as light-DOM children.
// The browser owns radio selection, keyboard behavior, and form submission.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const RADIO_GROUP_CSS = `
  ${BASE_RESET}
  :host { display: block; min-inline-size: 16rem; }
  fieldset { display: grid; gap: var(--ds-space-2); margin: 0; padding: 0; border: 0; font-family: ${FONT.body}; color: var(--ds-color-text); }
  legend { padding: 0; font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-bold); line-height: var(--ds-line-height-snug); }
  .options { display: grid; gap: var(--ds-space-2); }
  .description, .error { font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-normal); }
  .error { display: none; color: var(--ds-color-warning-text); }
  :host([error]) .error { display: block; }
  :host([error]) .options { outline: 2px solid var(--ds-color-warning-text); outline-offset: var(--ds-space-1); }
  ::slotted(label) { display: inline-flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-font-size-base); line-height: var(--ds-line-height-normal); }
  ::slotted(input[type="radio"]) { accent-color: var(--ds-color-accent); }
  ::slotted(label:has(input:disabled)) { cursor: not-allowed; opacity: 0.5; }
`;

export class DsRadioGroup extends HTMLElement {
  static get observedAttributes() { return ["name", "required", "disabled", "error"]; }

  constructor() {
    super();
    this._shadow = createShadow(this, RADIO_GROUP_CSS);
    this._shadow.innerHTML = `<fieldset part="group" aria-describedby="description error">
      <legend part="legend"><slot name="label"></slot></legend>
      <div class="options" part="options"><slot></slot></div>
      <span class="description" id="description" part="description"><slot name="description"></slot></span>
      <span class="error" id="error" part="error"><slot name="error"></slot></span>
    </fieldset>`;
    this._shadow.querySelector("slot:not([name])").addEventListener("slotchange", () => this._render());
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  _render() {
    const slot = this._shadow.querySelector("slot:not([name])");
    const radios = slot ? slot.assignedElements({ flatten: true }).flatMap((el) => el.matches?.('input[type="radio"]') ? [el] : [...(el.querySelectorAll?.('input[type="radio"]') || [])]) : [];
    for (const radio of radios) {
      if (this.hasAttribute("name")) radio.name = this.getAttribute("name");
      radio.required = this.hasAttribute("required");
      radio.disabled = this.hasAttribute("disabled") || radio.hasAttribute("disabled");
    }
  }
}
