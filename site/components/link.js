// ═══════════════════════════════════════════════════════════════════════════
// <ds-link>
//
// A text link for navigating to a URL. Use ds-button for an in-page action.
// Link labels stay in sentence case so navigation remains distinct from the
// uppercase action treatment used by ds-button.
//
// Attributes:
//   href     — destination URL (required for link semantics)
//   external — opens the destination in a new tab with safe rel attributes
//
// Slots:
//   (default) — visible link label
//   icon      — optional trailing icon, such as an arrow
//
// Usage:
//   <ds-link href="/quickstart">Read the quick start</ds-link>
//   <ds-link href="/components">
//     Browse components <span slot="icon" aria-hidden="true">→</span>
//   </ds-link>
//   <ds-link href="https://example.com" external>Visit the project site</ds-link>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const LINK_CSS = `
  ${BASE_RESET}
  :host { display: inline; }

  a {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1);
    color: var(--ds-color-accent);
    font-family: ${FONT.body};
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    transition: color var(--ds-duration-fast) var(--ds-ease-standard);
  }

  ::slotted([slot="icon"]) {
    display: inline-block;
    flex: none;
    line-height: 1;
  }

  a:hover {
    color: color-mix(in oklch, var(--ds-color-accent) 80%, black);
  }

  a:focus-visible {
    outline: 3px solid var(--ds-color-accent-seed);
    outline-offset: 2px;
  }
`;

export class DsLink extends HTMLElement {
  static get observedAttributes() {
    return ["href", "external"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, LINK_CSS);
    this._shadow.innerHTML = '<a part="link"><slot></slot><slot name="icon"></slot></a>';
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const link = this._shadow.querySelector("a");
    if (!link) return;

    const href = this.getAttribute("href");
    if (href) link.setAttribute("href", href);
    else link.removeAttribute("href");

    if (this.hasAttribute("external")) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
  }
}
