import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const DEF_EXAMPLE_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    margin-top: var(--ds-space-4);
    margin-bottom: var(--ds-space-4);
  }
  .title {
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-sm);
    font-weight: 600;
    letter-spacing: var(--ds-tracking-wide);
    text-transform: uppercase;
    color: var(--ds-color-text-secondary);
    margin: 0 0 var(--ds-space-2);
  }
`;

export class DsDefExample extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, DEF_EXAMPLE_CSS);
    this._shadow.innerHTML =
      '<p class="title" part="title"><strong>Example</strong></p><slot></slot>';
  }
}
