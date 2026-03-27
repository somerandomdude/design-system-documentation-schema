import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const CROSS_REFS_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    color: var(--ds-color-text-secondary);
    margin-top: var(--ds-space-4);
  }
  ::slotted(a) {
    font-family: ${FONT.mono};
    font-size: var(--ds-font-size-base);
  }
`;

export class DsCrossRefs extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, CROSS_REFS_CSS);
    this._shadow.innerHTML = '<div part="refs"><slot></slot></div>';
  }
}
