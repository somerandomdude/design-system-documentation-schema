import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const FOOTER_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .footer {
    margin-top: var(--ds-space-16);
    padding-top: var(--ds-space-6);
    border-top: 1px solid var(--ds-color-border-light);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
    color: var(--ds-color-text-faint);
  }

  ::slotted(p) {
    margin: 0 0 var(--ds-space-1);
  }

  ::slotted(a) {
    color: #777;
  }
`;

export class DsFooter extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, FOOTER_CSS);
    this._shadow.innerHTML =
      '<div class="footer" part="footer"><slot></slot></div>';
  }
}
