// ═══════════════════════════════════════════════════════════════════════════
// <ds-card-grid>
//
// A responsive grid layout for cards. Replaces the `.card-grid` CSS class.
//
// Attributes:
//   min-width — minimum column width for auto-fill (default: "240px")
//   gap       — gap between grid items (default: uses --ds-space-2)
//
// Slots:
//   (default) — card elements to lay out in the grid
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const CARD_GRID_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    margin: var(--ds-space-2) 0 var(--ds-space-6);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--_gap, var(--ds-space-2));
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`;

export class DsCardGrid extends HTMLElement {
  static get observedAttributes() {
    return ["min-width", "gap"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, CARD_GRID_CSS);
    this._shadow.innerHTML =
      '<div class="grid" part="grid"><slot></slot></div>';
  }

  connectedCallback() {
    this._applyCustomProps();
  }

  attributeChangedCallback() {
    this._applyCustomProps();
  }

  _applyCustomProps() {
    const minWidth = this.getAttribute("min-width");
    const gap = this.getAttribute("gap");
    const grid = this._shadow.querySelector(".grid");
    if (!grid) return;

    if (minWidth) {
      grid.style.setProperty("--_min-width", minWidth);
    } else {
      grid.style.removeProperty("--_min-width");
    }

    if (gap) {
      grid.style.setProperty("--_gap", gap);
    } else {
      grid.style.removeProperty("--_gap");
    }
  }
}
