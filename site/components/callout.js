// ═══════════════════════════════════════════════════════════════════════════
// <ds-callout>
//
// A callout / info box with an accent left border and subtle background.
// Replaces the `.callout` CSS class with an encapsulated web component.
//
// Attributes:
//   variant — "info" | "tip" | "warning" (default: "info")
//
// Slots:
//   (default) — callout content (may include <strong>, links, lists, etc.)
//
// Usage:
//   <ds-callout>
//     <strong>Key idea:</strong> Some important information here.
//   </ds-callout>
//
//   <ds-callout variant="tip">
//     <strong>Tip:</strong> A helpful suggestion.
//   </ds-callout>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const CALLOUT_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .callout {
    border-left: var(--ds-border-width-xl) solid var(--ds-color-accent);
    background: var(--ds-color-accent-subtle);
    padding: var(--ds-space-2) var(--ds-space-4);
    border-radius: 0 var(--ds-radius-lg) var(--ds-radius-lg) 0;
    margin: var(--ds-space-2) 0 var(--ds-space-6);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-md);
    line-height: var(--ds-line-height-loose);
    color: var(--ds-color-text);
  }

  .callout--warning {
    border-left-color: var(--ds-color-warning-text);
    background: var(--ds-color-note-warning-bg);
  }

  .callout--tip {
    border-left-color: var(--ds-color-encouraged-text);
    background: var(--ds-color-encouraged-bg);
  }

  ::slotted(strong) {
    color: var(--ds-color-accent);
  }

  :host([variant="warning"]) ::slotted(strong) {
    color: var(--ds-color-warning-text);
  }

  :host([variant="tip"]) ::slotted(strong) {
    color: var(--ds-color-encouraged-text);
  }

  ::slotted(ol),
  ::slotted(ul) {
    margin: var(--ds-space-2) 0 0;
    padding-left: var(--ds-space-5);
  }

  ::slotted(a) {
    color: var(--ds-color-accent);
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }
`;

export class DsCallout extends HTMLElement {
  static get observedAttributes() {
    return ["variant"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, CALLOUT_CSS);
    this._shadow.innerHTML =
      '<div class="callout" part="callout"><slot></slot></div>';
  }

  connectedCallback() {
    this._updateVariant();
  }

  attributeChangedCallback() {
    this._updateVariant();
  }

  _updateVariant() {
    const variant = this.getAttribute("variant") || "info";
    const el = this._shadow.querySelector(".callout");
    if (el) {
      el.className = "callout callout--" + variant;
    }
  }
}
