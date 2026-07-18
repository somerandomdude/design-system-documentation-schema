// ═══════════════════════════════════════════════════════════════════════════
// <ds-tag>
//
// A pill-shaped tag for keyword and category labels.
//
// Slots:
//   (default) — tag label text
//
// Usage:
//   <ds-tag>color</ds-tag>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const TAG_CSS = `
  ${BASE_RESET}
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    font-family: ${FONT.body};
    font-weight: var(--ds-font-weight-bold);
    font-size: var(--ds-font-size-sm);
    line-height: 1;
    color: var(--ds-color-text);
    background: var(--ds-color-bg-subtle);
    border: var(--ds-border-width) solid var(--ds-color-border-light);
    padding: 2px var(--ds-space-1);
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export class DsTag extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, TAG_CSS);
    this._shadow.innerHTML =
      '<span class="tag" part="tag"><slot></slot></span>';
  }
}
