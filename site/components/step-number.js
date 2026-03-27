// ═══════════════════════════════════════════════════════════════════════════
// <ds-step-number>
//
// A numbered step circle used in quickstart-style section headings.
//
// Attributes:
//   (none — uses slotted text content for the number)
//
// Content:
//   The step number (e.g., "1", "2", "3")
//
// Usage:
//   <ds-step-number>1</ds-step-number> What is DSDS?
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const STEP_NUMBER_CSS = `
  ${BASE_RESET}
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    position: relative;
    top: -1px;
    width: 28px;
    height: 28px;
    border-radius: var(--ds-radius-full);
    background: var(--ds-color-accent);
    color: #fff;
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-bold);
    line-height: 28px;
    text-align: center;
    margin-right: var(--ds-space-2);
    flex-shrink: 0;
  }
`;

export class DsStepNumber extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, STEP_NUMBER_CSS);
    this._shadow.innerHTML = '<slot></slot>';
  }
}
