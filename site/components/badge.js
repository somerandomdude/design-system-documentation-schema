// ═══════════════════════════════════════════════════════════════════════════
// <ds-badge>
//
// Attributes:
//   variant — "stable" | "experimental" | "draft" | "deprecated" |
//             "required" | "encouraged" | "prohibited" | "informational" |
//             "kind" | "category" | "token-type" | (default: neutral)
//   size    — "sm" | "md" (default: "md")
//
// Content:
//   Text label inside the element.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const BADGE_CSS = `
  ${BASE_RESET}
  :host { display: inline-flex; vertical-align: middle; }

  .badge {
    display: inline-block;
    font-family: ${FONT.body};
    font-weight: var(--ds-font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--ds-tracking-normal);
    border-radius: var(--ds-radius-md);
    white-space: nowrap;
    line-height: 1;
  }

  /* Sizes */
  :host([size="sm"]) .badge { font-size: var(--ds-font-size-2xs); padding: 2px var(--ds-space-1); }
  .badge                     { font-size: var(--ds-font-size-xs); padding: 3px var(--ds-space-2); }

  /* Variants — Status */
  .badge--stable       { background: var(--ds-color-success-bg); color: var(--ds-color-success-text); }
  .badge--experimental { background: var(--ds-color-warning-bg); color: var(--ds-color-warning-text); }
  .badge--draft        { background: var(--ds-color-neutral-bg); color: var(--ds-color-neutral-text); }
  .badge--deprecated   { background: var(--ds-color-danger-bg); color: var(--ds-color-danger-text); }

  /* Variants — Requirement */
  .badge--required     { background: var(--ds-color-required-bg); color: var(--ds-color-required-text); }
  .badge--encouraged   { background: var(--ds-color-encouraged-bg); color: var(--ds-color-encouraged-text); }
  .badge--prohibited   { background: var(--ds-color-prohibited-bg); color: var(--ds-color-prohibited-text); }
  .badge--informational { background: var(--ds-color-neutral-bg); color: #424242; }
  .badge--discouraged  { background: var(--ds-color-discouraged-bg); color: var(--ds-color-discouraged-text); }

  /* Variants — Taxonomy */
  .badge--kind         { background: var(--ds-color-info-bg); color: var(--ds-color-info-text); }
  .badge--category     { background: var(--ds-color-purple-bg); color: var(--ds-color-purple-text); }
  .badge--token-type   { background: var(--ds-color-indigo-bg); color: var(--ds-color-indigo-text); }

  /* Default / neutral */
  .badge--neutral {
    background: var(--ds-color-accent-subtle);
    color: var(--ds-color-accent);
  }
`;

export class DsBadge extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, BADGE_CSS);
    this._shadow.innerHTML = `<span class="badge" part="badge"><slot></slot></span>`;
  }

  connectedCallback() {
    this._updateClass();
  }

  attributeChangedCallback() {
    this._updateClass();
  }

  _updateClass() {
    const variant = this.getAttribute("variant") || "neutral";
    const el = this._shadow.querySelector(".badge");
    if (el) {
      el.className = "badge badge--" + variant;
    }
  }
}
