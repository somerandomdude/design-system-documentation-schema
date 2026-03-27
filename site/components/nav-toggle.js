import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

/**
 * <ds-nav-toggle>
 *
 * A mobile hamburger menu button that toggles a navigation sidebar open/closed.
 * Hidden by default on desktop viewports; appears at narrow widths.
 *
 * Attributes:
 *   target — CSS selector for the nav element to toggle (default: ".nav")
 *   label  — accessible label text (default: "Toggle navigation")
 *   open   — boolean, reflects whether the nav is currently open
 *
 * Behavior:
 *   - Clicking the button toggles the `open` attribute on itself
 *   - Adds/removes a `nav--open` class on the target element
 *   - Pressing Escape while nav is open closes it
 *   - Renders ☰ when closed, ✕ when open
 *
 * Usage:
 *   <ds-nav-toggle target=".nav"></ds-nav-toggle>
 */

const NAV_TOGGLE_CSS = `
  ${BASE_RESET}
  :host {
    display: none;
    position: fixed;
    bottom: var(--ds-space-4, 16px);
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--ds-z-overlay, 200);
  }

  button {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2, 8px);
    background: var(--ds-color-bg-dark, #1b1f24);
    color: var(--ds-color-text-on-dark-heading, #ffffff);
    border: none;
    border-radius: var(--ds-radius-lg, 6px);
    padding: var(--ds-space-2, 8px) var(--ds-space-4, 16px);
    font-size: var(--ds-font-size-md, 0.875rem);
    font-family: ${FONT.body};
    font-weight: var(--ds-font-weight-medium, 500);
    cursor: pointer;
    box-shadow: var(--ds-shadow-lg, 0 2px 6px rgba(0, 0, 0, 0.2));
    transition: background var(--ds-transition-normal, 0.15s ease);
    -webkit-tap-highlight-color: transparent;
    line-height: 1;
  }

  button:hover {
    background: var(--ds-color-bg-dark-hover, #2a2f36);
  }

  button:focus-visible {
    outline: var(--ds-border-width-md, 2px) solid var(--ds-color-accent, #0055b3);
    outline-offset: 2px;
  }

  .icon {
    font-size: 1.1em;
    line-height: 1;
    width: 1em;
    text-align: center;
  }

  /* Show on narrow viewports */
  @media (max-width: 900px) {
    :host {
      display: block;
    }
  }
`;

export class DsNavToggle extends HTMLElement {
  static get observedAttributes() {
    return ["target", "label", "open"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, NAV_TOGGLE_CSS);
    this._targetEl = null;
    this._onKeydown = this._onKeydown.bind(this);
    this._render();
  }

  connectedCallback() {
    document.addEventListener("keydown", this._onKeydown);
    this._resolveTarget();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }

  attributeChangedCallback(name) {
    if (name === "open") {
      this._syncTarget();
      this._updateIcon();
    } else if (name === "target") {
      this._resolveTarget();
    } else {
      this._render();
    }
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(val) {
    if (val) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
  }

  toggle() {
    this.open = !this.open;
  }

  _render() {
    const label = this.getAttribute("label") || "Toggle navigation";
    const isOpen = this.hasAttribute("open");
    const icon = isOpen ? "\u2715" : "\u2630";

    this._shadow.innerHTML =
      '<button part="button" aria-label="' +
      esc(label) +
      '" aria-expanded="' +
      (isOpen ? "true" : "false") +
      '">' +
      '<span class="icon" part="icon">' +
      icon +
      "</span>" +
      "<span>Menu</span>" +
      "</button>";

    const btn = this._shadow.querySelector("button");
    if (btn) {
      const self = this;
      btn.addEventListener("click", function () {
        self.toggle();
      });
    }
  }

  _updateIcon() {
    const isOpen = this.hasAttribute("open");
    const icon = this._shadow.querySelector(".icon");
    const btn = this._shadow.querySelector("button");
    if (icon) icon.textContent = isOpen ? "\u2715" : "\u2630";
    if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  _resolveTarget() {
    const selector = this.getAttribute("target") || ".nav";
    this._targetEl = document.querySelector(selector);
  }

  _syncTarget() {
    // Lazily resolve the target if it wasn't found at connect time
    // (the toggle is parsed before the nav element in the DOM).
    if (!this._targetEl) this._resolveTarget();
    if (!this._targetEl) return;
    if (this.hasAttribute("open")) {
      this._targetEl.setAttribute("open", "");
    } else {
      this._targetEl.removeAttribute("open");
    }
  }

  _onKeydown(e) {
    if (e.key === "Escape" && this.open) {
      this.open = false;
      const btn = this._shadow.querySelector("button");
      if (btn) btn.focus();
    }
  }
}
