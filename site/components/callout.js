// ═══════════════════════════════════════════════════════════════════════════
// <ds-callout>
//
// A callout / info box: a white background with a small color-coded icon
// block — the variant's meaning lives in the block's color + icon, not a
// tinted background.
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

import { createShadow, BASE_RESET, FONT, ICONS } from "./_shared.js";

const CALLOUT_ICON = {
  info: ICONS.info,
  tip: ICONS.lightbulb,
  warning: ICONS.warning,
};

const CALLOUT_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .callout {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-space-2);
    background: var(--ds-color-bg-inverse);
    padding: var(--ds-space-4);
    margin: var(--ds-space-2) 0 var(--ds-space-8);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-loose);
    color: var(--ds-color-text);
  }

  .callout__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background: var(--ds-color-accent);
    color: var(--ds-color-bg-inverse);
  }

  .callout__icon svg {
    display: block;
  }

  .callout__content {
    flex: 1;
    min-width: 0;
  }

  .callout--warning .callout__icon { background: var(--ds-color-warning-text); }
  .callout--tip .callout__icon { background: var(--ds-color-encouraged-text); }

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
    padding-left: var(--ds-space-4);
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
      '<div class="callout" part="callout">' +
      '<span class="callout__icon" part="icon"></span>' +
      '<div class="callout__content" part="content"><slot></slot></div>' +
      "</div>";
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
    const icon = this._shadow.querySelector(".callout__icon");
    if (el) el.className = "callout callout--" + variant;
    if (icon) icon.innerHTML = CALLOUT_ICON[variant] || ICONS.info;
  }
}
