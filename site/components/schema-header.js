import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const SCHEMA_HEADER_CSS = `
  ${BASE_RESET}
  :host { display: block; margin-bottom: var(--ds-space-6); }
  h1 {
    font-size: var(--ds-font-size-4xl);
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 var(--ds-space-4);
    color: var(--ds-color-text);
  }
  .desc {
    color: var(--ds-color-text-secondary);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-lg);
    margin: 0 0 var(--ds-space-4);
  }
  .source {
    font-size: var(--ds-font-size-sm);
    color: var(--ds-color-text-faint);
    margin: 0 0 var(--ds-space-6);
  }
`;

export class DsSchemaHeader extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description', 'source'];
  }
  constructor() {
    super();
    this._shadow = createShadow(this, SCHEMA_HEADER_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }
  _render() {
    var t = this.getAttribute('title') || '';
    var d = this.getAttribute('description') || '';
    var s = this.getAttribute('source') || '';
    var html = '<h1>' + esc(t) + ' <slot></slot></h1>';
    if (d) html += '<p class="desc">' + esc(d) + '</p>';
    if (s)
      html +=
        '<p class="source">Source: <ds-code inline>' +
        esc(s) +
        '</ds-code></p>';
    this._shadow.innerHTML = html;
  }
}
