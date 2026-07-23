// ═══════════════════════════════════════════════════════════════════════════
// <ds-text-input>
//
// A labelled single-line text field. The native input remains the interaction
// surface; this component supplies tokenized label, description, and error
// presentation around it.
//
// Attributes:
//   type        — text | email | password | search | url | number (default: text)
//   name        — native form field name
//   value       — initial value
//   placeholder — native placeholder text
//   required    — marks the native input required
//   disabled    — disables the native input
//   readonly    — makes the native input read-only
//   error       — marks the field invalid and reveals the error slot
//
// Slots:
//   label       — visible field label (required)
//   description — optional supporting text
//   error       — optional validation message shown for the error state
//
// Usage:
//   <ds-text-input>
//     <span slot="label">Email address</span>
//     <span slot="description">We will send a confirmation link.</span>
//   </ds-text-input>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const TEXT_INPUT_CSS = `
  ${BASE_RESET}
  :host { display: inline-block; min-inline-size: 16rem; }

  .field {
    display: grid;
    gap: var(--ds-space-1);
    font-family: ${FONT.body};
    color: var(--ds-color-text);
  }

  .label {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-bold);
    line-height: var(--ds-line-height-snug);
  }

  input {
    min-block-size: 2.5rem;
    inline-size: 100%;
    padding: var(--ds-space-2) var(--ds-space-4);
    border: var(--ds-border-width) solid var(--ds-color-border);
    border-radius: 0;
    background: var(--ds-color-bg-inverse);
    color: var(--ds-color-text);
    font: inherit;
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-normal);
  }

  input::placeholder {
    color: color-mix(in oklch, var(--ds-color-text) 58%, var(--ds-color-bg-inverse));
  }

  input:hover:not(:disabled) {
    border-color: var(--ds-color-text);
  }

  input:focus-visible {
    border-color: var(--ds-color-accent);
    outline: 3px solid var(--ds-color-accent-seed);
    outline-offset: 2px;
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

const TYPES = new Set(["text", "email", "password", "search", "url", "number"]);

export class DsTextInput extends HTMLElement {
  static get observedAttributes() {
    return [
      "type",
      "name",
      "value",
      "placeholder",
      "required",
      "disabled",
      "readonly",
      "error",
    ];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, TEXT_INPUT_CSS);
    this._shadow.innerHTML = `
      <label class="field" part="field">
        <span class="label" part="label"><slot name="label"></slot></span>
        <input part="input" aria-describedby="description error">
        <span class="description" id="description" part="description"><slot name="description"></slot></span>
        <span class="error" id="error" part="error"><slot name="error"></slot></span>
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

    const requestedType = this.getAttribute("type") || "text";
    input.type = TYPES.has(requestedType) ? requestedType : "text";
    this._syncStringAttribute(input, "name");
    this._syncStringAttribute(input, "placeholder");

    if (this.hasAttribute("value") && input.value !== this.getAttribute("value")) {
      input.value = this.getAttribute("value") || "";
    }
    input.required = this.hasAttribute("required");
    input.disabled = this.hasAttribute("disabled");
    input.readOnly = this.hasAttribute("readonly");
    input.setAttribute("aria-invalid", this.hasAttribute("error") ? "true" : "false");
  }

  _syncStringAttribute(input, name) {
    const value = this.getAttribute(name);
    if (value == null) input.removeAttribute(name);
    else input.setAttribute(name, value);
  }
}
