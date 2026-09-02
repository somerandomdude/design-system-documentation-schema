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
  /* min-height set twice on purpose - 100dvh (mobile-chrome-aware) as a
     cascading enhancement over 100vh, not a replacement; see style.css's
     body rule for the same pattern and why. */
  :host { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; background: var(--ds-color-bg-accent); justify-content: end; padding-block-start: var(--ds-height-nav, 64px); }

  h1 {
    font-size: clamp(2em, 4vw, 4em);
    font-family: ${FONT.mono};
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.025em;
    word-spacing: -0.25em;
    margin: 0 0 var(--ds-space-4);
    color: var(--ds-color-text);
    word-break: break-word;
  }
  .header-container {
    max-width: var(--ds-width-content);
    margin: 0 auto;
    padding: var(--ds-space-8) var(--ds-space-8);
    width: 100%;
    padding-block-end: 64px;
    padding-block-start: 128px;
  }

  .desc {
    color: var(--ds-color-text);
    font-family: ${FONT.body};
    margin: 0 0 var(--ds-space-4);
    max-width: 65ch;
    font-size: clamp(1.05em, 1.7vw, 1.375em);
    font-weight: 500;
    line-height: 1.4;
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
  connectedCallback() {
    // Shadow-root creation deferred to DOMContentLoaded, not the
    // constructor - see heading.js's own connectedCallback for the full
    // reasoning (a build-time declarative shadow root, from
    // build-site.js's injectDeclarativeShadowDom(), isn't parsed yet at
    // constructor time for an already-defined custom element, so
    // createShadow() would attach a second, conflicting shadow root if
    // called that early).
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this._init(), {
        once: true,
      });
    } else {
      this._init();
    }
  }
  _init() {
    this._shadow = createShadow(this, HEADER_CSS);
    this._render();
  }
  attributeChangedCallback() {
    if (this.isConnected && this._shadow) this._render();
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
