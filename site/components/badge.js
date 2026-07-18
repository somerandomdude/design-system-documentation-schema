// ═══════════════════════════════════════════════════════════════════════════
// <ds-badge>
//
// Attributes:
//   variant — "kind" | "experimental" | (default: neutral)
//
// Content:
//   Text label inside the element.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const BADGE_CSS = `
  ${BASE_RESET}
  :host { display: inline-flex; vertical-align: middle; }

  .badge {
    display: inline-flex;
    font-family: ${FONT.body};
    text-transform: none;
    white-space: nowrap;
    align-items: center;
    height: 24px;
    padding: 0 1em;
    font-size: .75em;
  }

  /* Used by <ds-def-section>'s type badge */
  .badge--kind         { background: var(--ds-color-info-bg); color: var(--ds-color-info-text); }
  /* Used by <ds-prop-table>'s "at least one" conditional marker */
  .badge--experimental { background: var(--ds-color-warning-bg); color: var(--ds-color-warning-text); }

  /* Default / neutral */
  .badge--neutral {
    background: var(--ds-color-inverse);
    color: var(--ds-color-text);
  }
`;

export class DsBadge extends HTMLElement {
  static get observedAttributes() {
    return ["variant"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, BADGE_CSS);
    this._shadow.innerHTML = `<span class="badge" part="badge"><slot></slot></span>`;
  }

  connectedCallback() {
    this._updateClass();
  }

  attributeChangedCallback() {
    this._updateClass();
  }

  _updateClass() {
    const variant = this.getAttribute("variant") || "neutral";
    const el = this._shadow.querySelector(".badge");
    if (el) {
      el.className = "badge badge--" + variant;
    }
  }
}
