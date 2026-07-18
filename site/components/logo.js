// ═══════════════════════════════════════════════════════════════════════════
// <ds-logo>
//
// The DSDS mark, inlined as SVG so its fill can be recolored at runtime.
//
// Attributes:
//   size       — width/height, any CSS length (default: 40px)
//   background — host background color (default: transparent)
//   fill       — SVG fill color (default: var(--ds-color-text))
//
// Usage:
//   <ds-logo></ds-logo>
//   <ds-logo size="24px" fill="#fff" background="#0055b3"></ds-logo>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET } from "./_shared.js";

const LOGO_SVG = `
  <svg viewBox="0 0 1550 1550" fill="none" xmlns="http://www.w3.org/2000/svg" part="svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H1550V1550H0V0ZM75 75V1475H1475V75H75Z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M575 300H300V650H575C616.421 650 650 616.421 650 575V375C650 333.579 616.421 300 575 300ZM225 225V725H575C657.843 725 725 657.843 725 575V375C725 292.157 657.843 225 575 225H225Z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M825 368.75C825 289.359 889.359 225 968.75 225H1181.25C1260.64 225 1325 289.359 1325 368.75H1250C1250 330.78 1219.22 300 1181.25 300H968.75C930.78 300 900 330.78 900 368.75C900 406.72 930.78 437.5 968.75 437.5H1181.25C1260.64 437.5 1325 501.859 1325 581.25C1325 660.641 1260.64 725 1181.25 725H968.75C889.359 725 825 660.641 825 581.25H900C900 619.22 930.78 650 968.75 650H1181.25C1219.22 650 1250 619.22 1250 581.25C1250 543.28 1219.22 512.5 1181.25 512.5H968.75C889.359 512.5 825 448.141 825 368.75Z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M575 900H300V1250H575C616.421 1250 650 1216.42 650 1175V975C650 933.579 616.421 900 575 900ZM225 825V1325H575C657.843 1325 725 1257.84 725 1175V975C725 892.157 657.843 825 575 825H225Z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M825 968.75C825 889.359 889.359 825 968.75 825H1181.25C1260.64 825 1325 889.359 1325 968.75H1250C1250 930.78 1219.22 900 1181.25 900H968.75C930.78 900 900 930.78 900 968.75C900 1006.72 930.78 1037.5 968.75 1037.5H1181.25C1260.64 1037.5 1325 1101.86 1325 1181.25C1325 1260.64 1260.64 1325 1181.25 1325H968.75C889.359 1325 825 1260.64 825 1181.25H900C900 1219.22 930.78 1250 968.75 1250H1181.25C1219.22 1250 1250 1219.22 1250 1181.25C1250 1143.28 1219.22 1112.5 1181.25 1112.5H968.75C889.359 1112.5 825 1048.14 825 968.75Z"/>
  </svg>
`;

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
    return ["size", "background", "fill"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, LOGO_CSS);
    this._shadow.innerHTML = LOGO_SVG;
  }

  connectedCallback() {
    this._sync();
  }

  attributeChangedCallback() {
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
  }
}
