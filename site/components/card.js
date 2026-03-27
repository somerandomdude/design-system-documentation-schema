// ═══════════════════════════════════════════════════════════════════════════
// <ds-card>
//
// Attributes:
//   href     — if set, the card is clickable and navigates
//   variant  — "default" | "outlined" | "elevated" (default: "outlined")
//   padding  — "sm" | "md" | "lg" (default: "md")
//
// Slots:
//   header  — card header area
//   (default) — card body
//   footer  — card footer area
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const CARD_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .card {
    border-radius: var(--ds-radius-xl);
    font-family: ${FONT.body};
    color: var(--ds-color-text);
    transition: border-color var(--ds-transition-normal), box-shadow var(--ds-transition-normal);
  }

  .card--outlined {
    border: var(--ds-border-width-sm) solid var(--ds-color-border);
    background: var(--ds-color-bg);
  }

  .card--elevated {
    border: var(--ds-border-width-sm) solid var(--ds-color-border-light);
    background: var(--ds-color-bg);
    box-shadow: var(--ds-shadow-sm);
  }

  .card--default {
    background: var(--ds-color-bg-subtle);
  }

  :host([href]) .card {
    cursor: pointer;
    text-decoration: none;
    display: block;
    color: inherit;
  }
  :host([href]) .card:hover {
    border-color: var(--ds-color-accent);
    box-shadow: var(--ds-shadow-md);
  }

  /* Padding sizes */
  :host([padding="sm"]) .card__body { padding: var(--ds-space-3); }
  .card__body                        { padding: var(--ds-space-5); }
  :host([padding="lg"]) .card__body  { padding: 28px; }

  .card__header {
    padding: var(--ds-space-3) var(--ds-space-5);
    border-bottom: var(--ds-border-width-sm) solid var(--ds-color-border-light);
    font-weight: var(--ds-font-weight-semibold);
    font-size: 0.9rem;
  }
  :host([padding="sm"]) .card__header { padding: var(--ds-space-2) var(--ds-space-3); }
  :host([padding="lg"]) .card__header { padding: var(--ds-space-4) 28px; }

  .card__footer {
    padding: var(--ds-space-3) var(--ds-space-5);
    border-top: var(--ds-border-width-sm) solid var(--ds-color-border-light);
    font-size: 0.82rem;
    color: var(--ds-color-text-secondary);
  }
  :host([padding="sm"]) .card__footer { padding: var(--ds-space-2) var(--ds-space-3); }
  :host([padding="lg"]) .card__footer { padding: var(--ds-space-4) 28px; }

  /* Focus */
  :host([href]) .card:focus-visible {
    outline: var(--ds-border-width-md) solid var(--ds-color-accent);
    outline-offset: 2px;
  }
`;

export class DsCard extends HTMLElement {
  static get observedAttributes() {
    return ["href", "variant", "padding"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, CARD_CSS);
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const variant = this.getAttribute("variant") || "outlined";
    const href = this.getAttribute("href");
    const tag = href ? "a" : "div";
    const hrefAttr = href ? ' href="' + esc(href) + '"' : "";
    const tabindex = href ? ' tabindex="0"' : "";

    this._shadow.innerHTML =
      "<" +
      tag +
      ' class="card card--' +
      esc(variant) +
      '"' +
      hrefAttr +
      tabindex +
      ' part="card">' +
      '<div class="card__header" part="header"><slot name="header"></slot></div>' +
      '<div class="card__body" part="body"><slot></slot></div>' +
      '<div class="card__footer" part="footer"><slot name="footer"></slot></div>' +
      "</" +
      tag +
      ">";

    // Hide header/footer slots if empty
    var self = this;
    requestAnimationFrame(function () {
      var header = self._shadow.querySelector(".card__header");
      var footer = self._shadow.querySelector(".card__footer");
      if (header && !self.querySelector("[slot=header]"))
        header.style.display = "none";
      if (footer && !self.querySelector("[slot=footer]"))
        footer.style.display = "none";
    });
  }
}
