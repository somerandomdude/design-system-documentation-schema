import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const DEF_SECTION_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    margin-bottom: var(--ds-space-12);
    padding-bottom: var(--ds-space-8);
    border-bottom: 1px solid var(--ds-color-border-light);
  }
  :host(:last-child) { border-bottom: none; }
  h3 {
    font-family: ${FONT.mono};
    font-size: var(--ds-font-size-2xl);
    font-weight: 600;
    color: var(--ds-color-text);
    margin: 0 0 var(--ds-space-2);
  }
  .desc {
    color: var(--ds-color-text-secondary);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-lg);
    line-height: 1.6;
    margin: 0 0 var(--ds-space-4);
  }
  .type-line { margin: 0 0 var(--ds-space-4); }
`;

export class DsDefSection extends HTMLElement {
  static get observedAttributes() {
    return ["name", "anchor", "description", "type"];
  }
  constructor() {
    super();
    this._shadow = createShadow(this, DEF_SECTION_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }
  _render() {
    var name = this.getAttribute("name") || "";
    var anchor =
      this.getAttribute("anchor") ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    var desc = this.getAttribute("description") || "";
    var type = this.getAttribute("type") || "";
    // Set id on host for TOC linking
    if (anchor) this.id = anchor;
    var html = '<h3 id="' + esc(anchor) + '">' + esc(name) + "</h3>";
    if (desc) html += '<p class="desc">' + esc(desc) + "</p>";
    if (type)
      html +=
        '<p class="type-line"><ds-badge variant="kind" size="sm">' +
        esc(type) +
        "</ds-badge></p>";
    html += "<slot></slot>";
    this._shadow.innerHTML = html;
  }
}
