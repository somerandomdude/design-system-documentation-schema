// ═══════════════════════════════════════════════════════════════════════════
// <ds-badge>
//
// Attributes:
//   variant — "kind" | "experimental" | (default: neutral)
//
// Content:
//   Text label inside the element.
//
// Design: a white chip with a small color-coded icon block on the left —
// the variant's meaning lives in the block's color + icon, not the chip's
// overall background.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT, loadIcon } from "./_shared.js";

const BADGE_ICON_NAME = {
  kind: "info",
  experimental: "flask",
  neutral: "dot",
};

const BADGE_CSS = `
  ${BASE_RESET}
  :host { display: inline-flex; vertical-align: middle; }

  .badge {
    display: inline-flex;
    align-items: stretch;
    font-family: ${FONT.body};
    text-transform: none;
    white-space: nowrap;
    height: 24px;
    font-size: .75em;
    background: var(--ds-color-bg-inverse);
    color: var(--ds-color-text);
  }

  .badge__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    flex-shrink: 0;
    color: var(--ds-color-bg-inverse);
  }

  .badge__icon svg {
    display: block;
  }

  .badge__label {
    display: inline-flex;
    align-items: center;
    padding: 0 0.75em;
  }

  /* Used by <ds-def-section>'s type badge */
  .badge--kind .badge__icon { background: var(--ds-color-text); }
  /* Used by <ds-prop-table>'s "at least one" conditional marker */
  .badge--experimental .badge__icon { background: var(--ds-color-warning-text); }
  /* Default / neutral */
  .badge--neutral .badge__icon { background: var(--ds-color-accent); }
`;

export class DsBadge extends HTMLElement {
  static get observedAttributes() {
    return ["variant"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, BADGE_CSS);
    this._shadow.innerHTML =
      '<span class="badge" part="badge">' +
      // Decorative — the variant's meaning is redundant with the visible
      // label text next to it, so this is hidden from assistive tech.
      '<span class="badge__icon" part="icon" aria-hidden="true"></span>' +
      '<span class="badge__label" part="label"><slot></slot></span>' +
      "</span>";
  }

  connectedCallback() {
    this._updateVariant();
  }

  attributeChangedCallback() {
    this._updateVariant();
  }

  _updateVariant() {
    const variant = this.getAttribute("variant") || "neutral";
    const el = this._shadow.querySelector(".badge");
    const icon = this._shadow.querySelector(".badge__icon");
    if (el) el.className = "badge badge--" + variant;
    const name = BADGE_ICON_NAME[variant] || "dot";
    loadIcon(name).then((svg) => {
      if (icon) icon.innerHTML = svg;
    });
  }
}
