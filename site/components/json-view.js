// ═══════════════════════════════════════════════════════════════════════════
// <ds-json-view>
//
// A "View as JSON" toggle for spec definition pages: a fixed floating
// button in the bottom-right corner. Closed, it shows a curly-braces icon;
// clicking it opens a full-viewport overlay (above the nav and content)
// showing the page's raw schema JSON in a <ds-code> block, and the same
// button swaps to a close icon to return to the documentation view.
//
// Attributes:
//   label — the source file path, used only for the overlay's accessible
//           name (e.g. "Raw JSON: common/criterion.schema.json")
//
// Slots:
//   (default) — the JSON content, typically a single <ds-code language="json">
//
// Usage:
//   <ds-json-view label="common/criterion.schema.json">
//     <ds-code language="json">{ ... }</ds-code>
//   </ds-json-view>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, loadIcon } from "./_shared.js";

const JSON_VIEW_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    position: fixed;
    inset-inline-end: var(--ds-space-4);
    bottom: var(--ds-space-4);
    z-index: calc(var(--ds-z-overlay, 200) + 1);
  }

  /* Positioned + given a higher z-index than the overlay below — without
     this, the button is a plain static-flow box, and a fixed+z-indexed
     sibling (the overlay) paints above static content regardless of DOM
     order, so the button would vanish behind the overlay once it's open. */
  .json-view__btn {
    position: relative;
    z-index: calc(var(--ds-z-overlay, 200) + 1);
  }

  .json-view__icon svg {
    display: block;
  }

  /* Sits above everything else on the page — including the fixed nav —
     while open. Hidden entirely (not just visually) when closed so its
     content isn't reachable by keyboard/AT. */
  .json-view__overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: var(--ds-z-overlay, 200);
    background: var(--ds-color-bg-inverse);
    overflow-y: auto;
    padding: var(--ds-space-8) var(--ds-space-4) var(--ds-space-4);
  }

  .json-view__overlay--open {
    display: block;
  }

  ::slotted(ds-code) {
    display: block;
  }
`;

export class DsJsonView extends HTMLElement {
  static get observedAttributes() {
    return ["label"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, JSON_VIEW_CSS);
    this._open = false;
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    document.addEventListener("keydown", this._onKeydown);
    this._render();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }

  _render() {
    const label = this.getAttribute("label") || "";
    const dialogLabel = label ? `Raw JSON: ${label}` : "Raw JSON";

    this._shadow.innerHTML =
      '<ds-icon-button class="json-view__btn" part="button" label="View as JSON">' +
      '<span class="json-view__icon" part="icon"></span>' +
      "</ds-icon-button>" +
      '<div class="json-view__overlay" part="overlay" role="dialog" aria-modal="true" tabindex="-1" aria-label="' +
      esc(dialogLabel) +
      '">' +
      '<div class="json-view__body" part="body"><slot></slot></div>' +
      "</div>";

    const btn = this._shadow.querySelector(".json-view__btn");
    if (btn) btn.addEventListener("click", () => this._setOpen(!this._open));

    this._updateIcon();
  }

  _setOpen(open) {
    this._open = open;
    const overlay = this._shadow.querySelector(".json-view__overlay");
    if (overlay) {
      overlay.classList.toggle("json-view__overlay--open", open);
      if (open) overlay.focus();
    }
    this._updateIcon();
  }

  _updateIcon() {
    const btn = this._shadow.querySelector(".json-view__btn");
    const icon = this._shadow.querySelector(".json-view__icon");
    if (btn) btn.setAttribute("label", this._open ? "Close JSON view" : "View as JSON");
    loadIcon(this._open ? "close" : "brackets").then((svg) => {
      if (icon) icon.innerHTML = svg;
    });
  }

  _onKeydown(e) {
    if (e.key === "Escape" && this._open) this._setOpen(false);
  }
}
