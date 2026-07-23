// ═══════════════════════════════════════════════════════════════════════════
// <ds-button>
//
// A text button for triggering an in-page action. Use ds-link for navigation
// and ds-icon-button when the control has no visible text label.
//
// Attributes:
//   variant  — "primary" | "secondary" (default: "primary")
//   type     — "button" | "submit" | "reset" (default: "button")
//   disabled — disables the native button when present
//
// Slots:
//   (default) — visible button label; may contain a small inline icon
//
// Usage:
//   <ds-button>Save changes</ds-button>
//   <ds-button variant="secondary">Cancel</ds-button>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const BUTTON_CSS = `
  ${BASE_RESET}
  :host { display: inline-flex; }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: 2.5rem;
    padding: var(--ds-space-2) var(--ds-space-4);
    border: var(--ds-border-width) solid transparent;
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-bold);
    line-height: var(--ds-line-height-normal);
    letter-spacing: var(--ds-tracking-wide);
    text-transform: uppercase;
    color: var(--ds-color-text);
    background: var(--ds-color-bg-accent);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--ds-duration-fast) var(--ds-ease-standard),
      color var(--ds-duration-fast) var(--ds-ease-standard),
      opacity var(--ds-duration-fast) var(--ds-ease-standard);
  }

  button:hover:not(:disabled) {
    background: color-mix(in oklch, var(--ds-color-bg-accent) 82%, black);
  }

  button:focus-visible {
    outline: 3px solid var(--ds-color-text);
    outline-offset: 2px;
  }

  button.button--secondary {
    color: var(--ds-color-text-inverse);
    background: var(--ds-color-text);
  }

  button.button--secondary:hover:not(:disabled) {
    background: color-mix(in oklch, var(--ds-color-text) 84%, white);
  }

  button.button--secondary:focus-visible {
    outline-color: var(--ds-color-bg-accent);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ::slotted(*) {
    flex: none;
  }
`;

const VARIANTS = new Set(["primary", "secondary"]);
const TYPES = new Set(["button", "submit", "reset"]);

export class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "type", "disabled"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, BUTTON_CSS);
    this._shadow.innerHTML = '<button part="button"><slot></slot></button>';
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  _render() {
    const button = this._shadow.querySelector("button");
    if (!button) return;

    const requestedVariant = this.getAttribute("variant") || "primary";
    const variant = VARIANTS.has(requestedVariant) ? requestedVariant : "primary";
    const requestedType = this.getAttribute("type") || "button";
    const type = TYPES.has(requestedType) ? requestedType : "button";

    button.className = `button--${variant}`;
    button.type = type;
    button.disabled = this.disabled;
  }
}
