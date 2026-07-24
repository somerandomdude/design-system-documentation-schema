// ═══════════════════════════════════════════════════════════════════════════
// <ds-checkbox>
//
// A labelled native checkbox with optional supporting and validation content.
// The native input remains the interaction surface and emits its normal input
// and change events.
//
// Attributes:
//   name          — native form field name
//   value         — native submitted value (default: on)
//   checked       — initially checks the native input
//   indeterminate — initially shows the native mixed state
//   required      — marks the native input required
//   disabled      — disables the native input
//   error         — marks the field invalid and reveals the error slot
//
// Slots:
//   label       — visible checkbox label (required)
//   description — optional supporting text
//   error       — optional validation message shown for the error state
//
// Usage:
//   <ds-checkbox name="terms" required>
//     <span slot="label">I agree to the terms</span>
//   </ds-checkbox>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const CHECKBOX_CSS = `
  ${BASE_RESET}
  :host { display: inline-block; min-inline-size: 16rem; }

  .field {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--ds-space-2);
    align-items: start;
    font-family: ${FONT.body};
    color: var(--ds-color-text);
  }

  input {
    appearance: none;
    display: grid;
    place-content: center;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    margin: 0;
    border: var(--ds-border-width) solid var(--ds-color-border);
    background: var(--ds-color-bg-inverse);
    color: var(--ds-color-text);
    cursor: pointer;
  }

  input::before {
    content: "";
    inline-size: 0.7rem;
    block-size: 0.7rem;
    transform: scale(0);
    box-shadow: inset 1rem 1rem var(--ds-color-text-inverse);
    clip-path: polygon(14% 44%, 0 59%, 39% 100%, 100% 17%, 85% 3%, 39% 70%);
  }

  input:checked {
    border-color: var(--ds-color-accent);
    background: var(--ds-color-accent);
  }

  input:checked::before,
  input:indeterminate::before {
    transform: scale(1);
  }

  input:indeterminate {
    border-color: var(--ds-color-accent);
    background: var(--ds-color-accent);
  }

  input:indeterminate::before {
    inline-size: 0.65rem;
    block-size: 0.12rem;
    clip-path: none;
  }

  input:hover:not(:disabled) {
    border-color: var(--ds-color-text);
  }

  input:focus-visible {
    outline: 3px solid var(--ds-color-accent-seed);
    outline-offset: 2px;
  }

  .content {
    display: grid;
    gap: var(--ds-space-1);
    min-inline-size: 0;
  }

  .label {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-bold);
    line-height: var(--ds-line-height-normal);
  }

  .description,
  .error {
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-line-height-normal);
  }

  .description { color: var(--ds-color-text); }

  .error {
    display: none;
    color: var(--ds-color-warning-text);
  }

  :host([error]) .error { display: block; }

  :host([error]) input {
    border-color: var(--ds-color-warning-text);
  }

  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ::slotted(*) { display: inline; }
`;

export class DsCheckbox extends HTMLElement {
  static get observedAttributes() {
    return ["name", "value", "checked", "indeterminate", "required", "disabled", "error"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, CHECKBOX_CSS);
    this._shadow.innerHTML = `
      <label class="field" part="field">
        <input type="checkbox" part="control" aria-describedby="description error">
        <span class="content">
          <span class="label" part="label"><slot name="label"></slot></span>
          <span class="description" id="description" part="description"><slot name="description"></slot></span>
          <span class="error" id="error" part="error"><slot name="error"></slot></span>
        </span>
      </label>`;
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const input = this._shadow.querySelector("input");
    if (!input) return;

    this._syncStringAttribute(input, "name");
    this._syncStringAttribute(input, "value", "on");
    input.checked = this.hasAttribute("checked");
    input.indeterminate = this.hasAttribute("indeterminate");
    input.required = this.hasAttribute("required");
    input.disabled = this.hasAttribute("disabled");
    input.setAttribute("aria-invalid", this.hasAttribute("error") ? "true" : "false");
  }

  _syncStringAttribute(input, name, fallback) {
    const value = this.getAttribute(name) || fallback;
    if (value == null) input.removeAttribute(name);
    else input.setAttribute(name, value);
  }
}
