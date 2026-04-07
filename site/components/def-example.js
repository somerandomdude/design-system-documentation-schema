import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const DEF_EXAMPLE_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    margin-top: var(--ds-space-4);
    margin-bottom: var(--ds-space-4);
  }
`;

export class DsDefExample extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, DEF_EXAMPLE_CSS);
    this._shadow.innerHTML = "<slot></slot>";
  }
}
