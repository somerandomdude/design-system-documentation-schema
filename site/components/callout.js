// ═══════════════════════════════════════════════════════════════════════════
// <ds-callout>
//
// A callout / info box: a bold title above a plain white content box —
// the variant's meaning lives in the title's color, not an icon.
//
// Attributes:
//   variant — "info" | "tip" | "warning" (default: "info")
//   title   — bold lead-in text shown above the content (e.g. "Tip:").
//             Omit for no title.
//
// Slots:
//   (default) — callout content (may include links, lists, etc.)
//
// Usage:
//   <ds-callout title="Key idea:">
//     Some important information here.
//   </ds-callout>
//
//   <ds-callout variant="tip" title="Tip:">
//     A helpful suggestion.
//   </ds-callout>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const CALLOUT_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .callout {
    margin: var(--ds-space-2) 0 var(--ds-space-8);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-loose);
    color: var(--ds-color-text);
  }

  .callout__title {
    font-weight: var(--ds-font-weight-bold);
    /* Default ("info") variant. */
    background: var(--ds-color-text);
    color: var(--ds-color-text-inverse);
    display: inline-block;
    padding: var(--ds-space-2) var(--ds-space-4);
    padding-right: calc(var(--ds-space-4) + var(--ds-space-2));
  }

  .callout__title:empty {
    display: none;
  }

  .callout--warning .callout__title { background: var(--ds-color-warning-text); }
  .callout--tip .callout__title { background: var(--ds-color-encouraged-text); }

  .callout__content {
    background: var(--ds-color-bg-inverse);
    padding: var(--ds-space-4);
  }

  ::slotted(strong) {
    background: var(--ds-color-accent);
  }

  :host([variant="warning"]) ::slotted(strong) {
    background: var(--ds-color-warning-text);
  }

  :host([variant="tip"]) ::slotted(strong) {
    background: var(--ds-color-encouraged-text);
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

  ::slotted(p:first-child) {
    margin-top: 0;
  }

  ::slotted(p:last-child) {
    margin-bottom: 0 !important;
  }
`;

export class DsCallout extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "title"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, CALLOUT_CSS);
    this._shadow.innerHTML =
      '<div class="callout" part="callout">' +
      '<span class="callout__title" part="title"></span>' +
      '<div class="callout__content" part="content"><slot></slot></div>' +
      "</div>";
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const variant = this.getAttribute("variant") || "info";
    const title = this.getAttribute("title") || "";
    const el = this._shadow.querySelector(".callout");
    const titleEl = this._shadow.querySelector(".callout__title");
    if (el) el.className = "callout callout--" + variant;
    if (titleEl) titleEl.textContent = title;
  }
}
