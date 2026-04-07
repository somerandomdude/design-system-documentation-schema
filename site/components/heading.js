// ═══════════════════════════════════════════════════════════════════════════
// <ds-heading>
//
// Attributes:
//   level    — 1–6 (default: 2)
//   anchor   — auto-generated anchor id (default: derived from text content)
//   badge    — optional badge text shown after the heading
//   badge-variant — variant for the badge
//
// Slots:
//   (default) — heading text
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const HEADING_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .heading {
    display: block;
    color: var(--ds-color-text);
    font-family: ${FONT.body};
    line-height: var(--ds-line-height-snug);
  }

  .heading--1 { font-size: var(--ds-font-size-4xl); font-weight: var(--ds-font-weight-semibold); margin: 0 0 var(--ds-space-4); }
  .heading--2 { font-size: var(--ds-font-size-3xl); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-12) 0 var(--ds-space-3); }
  .heading--3 { font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-6) 0 var(--ds-space-3); }
  .heading--4 { font-size: var(--ds-font-size-xl); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-5) 0 var(--ds-space-2); }
  .heading--5 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
  .heading--6 { font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-3) 0 var(--ds-space-2); color: var(--ds-color-text-secondary); }

  .anchor-link {
    display: inline;
    opacity: 0;
    margin-left: var(--ds-space-2);
    color: var(--ds-color-text-secondary);
    text-decoration: none;
    font-size: 0.75em;
    vertical-align: baseline;
    transition: opacity var(--ds-transition-normal);
  }
  .heading:hover .anchor-link { opacity: 0.6; }
  .anchor-link:hover { opacity: 1 !important; }

  .badge {
    display: inline-block;
    margin-left: var(--ds-space-2);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    letter-spacing: var(--ds-tracking-normal);
    text-transform: none;
    padding: 2px var(--ds-space-2);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-color-accent-subtle);
    color: var(--ds-color-accent);
    vertical-align: middle;
  }
`;

export class DsHeading extends HTMLElement {
  static get observedAttributes() {
    return ["level", "anchor", "badge", "badge-variant"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, HEADING_CSS);
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const level = Math.min(
      6,
      Math.max(1, parseInt(this.getAttribute("level"), 10) || 2),
    );
    const text = this.textContent.trim();
    const anchor =
      this.getAttribute("anchor") ||
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const badge = this.getAttribute("badge");

    // Set id on the host element so document.querySelector and TOC
    // scanning can find this heading by id without reaching into shadow DOM.
    if (anchor) this.id = anchor;

    let badgeHtml = "";
    if (badge) {
      badgeHtml = ' <span class="badge">' + esc(badge) + "</span>";
    }

    const tag = "h" + level;
    this._shadow.innerHTML =
      "<" +
      tag +
      ' class="heading heading--' +
      level +
      '" part="heading">' +
      "<slot></slot>" +
      badgeHtml +
      ' <a class="anchor-link" href="#' +
      esc(anchor) +
      '" part="anchor">#</a>' +
      "</" +
      tag +
      ">";
  }
}
