// ═══════════════════════════════════════════════════════════════════════════
// <ds-logo>
//
// The DSDS mark, fetched from site/assets/dsds.svg and inlined so its fill
// can be recolored at runtime. Edit site/assets/dsds.svg directly to change
// the mark — this component just loads and colors whatever's there.
//
// Attributes:
//   size       — width/height, any CSS length (default: 40px)
//   background — host background color (default: transparent)
//   fill       — SVG fill color (default: var(--ds-color-text))
//   label      — accessible label. Omit when the logo sits next to visible
//                text that already names it (the default: decorative,
//                aria-hidden). Set it when the logo is used standalone.
//
// Usage:
//   <ds-logo></ds-logo>
//   <ds-logo size="24px" fill="#fff" background="#0055b3"></ds-logo>
//   <ds-logo label="DSDS home"></ds-logo>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, loadIcon } from "./_shared.js";

const LOGO_CSS = `
  ${BASE_RESET}
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--logo-size, 40px);
    height: var(--logo-size, 40px);
    background: var(--logo-bg, transparent);
    line-height: 0;
    aspect-ratio: 1/1;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  svg path {
    fill: var(--logo-fill, var(--ds-color-text));
  }
`;

export class DsLogo extends HTMLElement {
  static get observedAttributes() {
    return ["size", "background", "fill", "label"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, LOGO_CSS);
    loadIcon("logo").then((svg) => {
      this._shadow.innerHTML = svg;
      this._syncA11y();
    });
  }

  connectedCallback() {
    this._sync();
  }

  attributeChangedCallback(name) {
    if (name === "label") {
      this._syncA11y();
      return;
    }
    if (this.isConnected) this._sync();
  }

  _sync() {
    const size = this.getAttribute("size");
    const background = this.getAttribute("background");
    const fill = this.getAttribute("fill");

    if (size) this.style.setProperty("--logo-size", size);
    else this.style.removeProperty("--logo-size");

    if (background) this.style.setProperty("--logo-bg", background);
    else this.style.removeProperty("--logo-bg");

    if (fill) this.style.setProperty("--logo-fill", fill);
    else this.style.removeProperty("--logo-fill");

    this._syncA11y();
  }

  _syncA11y() {
    const svg = this._shadow.querySelector("svg");
    if (!svg) return;
    const label = this.getAttribute("label");
    if (label) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", esc(label));
      svg.removeAttribute("aria-hidden");
    } else {
      // Decorative by default — used next to visible text (e.g. the nav
      // title) that already names it.
      svg.setAttribute("aria-hidden", "true");
      svg.removeAttribute("role");
      svg.removeAttribute("aria-label");
    }
  }
}
