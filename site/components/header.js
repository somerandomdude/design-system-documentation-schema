// ═══════════════════════════════════════════════════════════════════════════
// <ds-header>
//
// The page header block, used at the top of every page: a title, an optional
// description, and an optional source path (for schema-reference pages).
//
// Attributes:
//   title       — page title (rendered as the h1)
//   description — optional lead paragraph (supports inline `code`)
//   source      — optional source path shown as "Source: <code>" (schema pages)
//
// Slots:
//   (default) — extra inline content next to the title (e.g. a status badge)
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, escWithCode, BASE_RESET, FONT } from "./_shared.js";

const HEADER_CSS = `
  ${BASE_RESET}
  :host { display: flex; flex-direction: column; margin-bottom: var(--ds-space-8); min-height: 100vh; background: var(--ds-color-bg-accent); justify-content: end; padding-left: var(--ds-width-nav); }

  @media (max-width: 900px) {
  :host {
  padding-left:0;
  }
  }

  h1 {
    font-size: 4em;
    font-family: ${FONT.mono};
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.025em;
    margin: 0 0 var(--ds-space-4);
    color: var(--ds-color-text);
  }
  .header-container {
    max-width: var(--ds-width-content);
    margin: 0 auto;
    padding: var(--ds-space-8) var(--ds-space-8);
    width: 100%;
  }

  .desc {
    color: var(--ds-color-text);
    font-family: ${FONT.body};
    margin: 0 0 var(--ds-space-4);
    max-width: 65ch;
    font-size: 22px;
    line-height: 1.4;
    font-weight: 450;
  }
  .source {
    font-size: var(--ds-font-size-sm);
    margin: 0 0 var(--ds-space-8);
    display: none;
  }
`;

export class DsHeader extends HTMLElement {
  static get observedAttributes() {
    return ["title", "description", "source"];
  }
  constructor() {
    super();
    this._shadow = createShadow(this, HEADER_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }
  _render() {
    var t = this.getAttribute("title") || "";
    var d = this.getAttribute("description") || "";
    var s = this.getAttribute("source") || "";
    var html = `<div class="header-container"><h1>${esc(t)}<slot></slot></h1>`;
    if (s)
      html +=
        '<p class="source">Source: <ds-code inline>' +
        esc(s) +
        "</ds-code></p>";
    // Use escWithCode so backtick inline-code spans in the description
    // render as <ds-code inline> rather than literal `backticks`.
    if (d) html += '<p class="desc">' + escWithCode(d) + "</p>";
    html += "</div>";

    this._shadow.innerHTML = html;
  }
}
