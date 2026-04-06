// ═══════════════════════════════════════════════════════════════════════════
// <ds-tag>
//
// A pill-shaped tag for keyword and category labels.
//
// Attributes:
//   size    — "sm" | "md" (default: "md")
//   removable — boolean, shows a remove button
//
// Events:
//   ds-tag-remove — fired when the remove button is clicked
//
// Slots:
//   (default) — tag label text
//
// Usage:
//   <ds-tag>action</ds-tag>
//   <ds-tag size="sm">color</ds-tag>
//   <ds-tag removable>draft</ds-tag>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const TAG_CSS = `
  ${BASE_RESET}
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1, 4px);
    font-family: ${FONT.body};
    font-weight: var(--ds-font-weight-medium, 500);
    font-size: var(--ds-font-size-xs, 0.6875rem);
    line-height: 1;
    color: var(--ds-color-text-secondary, #555);
    background: var(--ds-color-bg-subtle, #f0f0f4);
    border: var(--ds-border-width-sm, 1px) solid var(--ds-color-border-light, #e0e0e4);
    border-radius: var(--ds-radius-full, 9999px);
    padding: 3px var(--ds-space-2, 8px);
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :host([size="sm"]) .tag {
    font-size: var(--ds-font-size-2xs, 0.625rem);
    padding: 2px var(--ds-space-1, 4px);
  }

  .remove {
    display: none;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
    margin: 0 -2px 0 0;
    cursor: pointer;
    color: var(--ds-color-text-faint, #999);
    font-size: 0.75em;
    line-height: 1;
    width: 14px;
    height: 14px;
    border-radius: var(--ds-radius-full, 9999px);
    transition: color var(--ds-transition-fast, 0.1s ease),
                background var(--ds-transition-fast, 0.1s ease);
  }

  .remove:hover {
    color: var(--ds-color-text, #1b1f24);
    background: rgba(0, 0, 0, 0.08);
  }

  :host([removable]) .remove {
    display: inline-flex;
  }
`;

export class DsTag extends HTMLElement {
  static get observedAttributes() {
    return ["size", "removable"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, TAG_CSS);
    this._shadow.innerHTML =
      '<span class="tag" part="tag">' +
      "<slot></slot>" +
      '<button class="remove" part="remove" aria-label="Remove">\u00d7</button>' +
      "</span>";

    const btn = this._shadow.querySelector(".remove");
    if (btn) {
      const self = this;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        self.dispatchEvent(
          new CustomEvent("ds-tag-remove", {
            bubbles: true,
            detail: { label: self.textContent.trim() },
          }),
        );
      });
    }
  }
}
