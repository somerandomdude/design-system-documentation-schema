// ═══════════════════════════════════════════════════════════════════════════
// <ds-page-footer>
//
// A footer bar for standalone pages (quickstart, samples, etc.).
// Renders a top-bordered, centered footer with muted text and styled links.
//
// Slots:
//   (default) — footer content (paragraphs, links, etc.)
//
// Usage:
//   <ds-page-footer>
//     <p>Design System Documentation Standard (DSDS) 0.1</p>
//     <p><a href="https://github.com/...">GitHub</a> · <a href="index.html">Full Spec</a></p>
//   </ds-page-footer>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const PAGE_FOOTER_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .page-footer {
    border-top: var(--ds-border-width-sm) solid var(--ds-color-border);
    padding: var(--ds-space-6);
    text-align: center;
    color: var(--ds-color-text-faint);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-sm);
    margin-top: var(--ds-space-12);
  }

  ::slotted(p) {
    margin: 0 0 var(--ds-space-1);
  }

  ::slotted(a) {
    color: var(--ds-color-accent);
  }
`;

export class DsPageFooter extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, PAGE_FOOTER_CSS);
    this._shadow.innerHTML =
      '<div class="page-footer" part="page-footer"><slot></slot></div>';
  }
}
