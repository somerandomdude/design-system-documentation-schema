// ═══════════════════════════════════════════════════════════════════════════
// <ds-sidebar>
//
// Attributes:
//   open      — boolean, whether sidebar is expanded
//   position  — "left" | "right" (default: "left")
//   width     — CSS width (default: "280px")
//   collapsible — boolean, adds a toggle button
//
// Slots:
//   header   — sidebar header content
//   (default) — sidebar body
//   footer   — sidebar footer content
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const SIDEBAR_CSS = `
  ${BASE_RESET}
  :host { display: block; position: relative; }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--ds-color-bg-dark);
    color: var(--ds-color-text-on-dark);
    font-family: ${FONT.body};
    transition: transform var(--ds-transition-slow), width var(--ds-transition-slow);
    z-index: var(--ds-z-nav);
    -webkit-overflow-scrolling: touch;
  }

  :host([position="right"]) .sidebar { right: 0; }
  :host(:not([position="right"])) .sidebar { left: 0; }

  :host(:not([open])) .sidebar { transform: translateX(-100%); }
  :host([position="right"]:not([open])) .sidebar { transform: translateX(100%); }
  :host([open]) .sidebar { transform: translateX(0); }

  .sidebar__header {
    padding: var(--ds-space-5) var(--ds-space-4) var(--ds-space-3);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-bold);
    letter-spacing: 0;
    text-transform: none;
    color: var(--ds-color-text-on-dark-heading);
  }

  .sidebar__body {
    padding: 0;
    flex: 1;
  }

  .sidebar__footer {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-top: var(--ds-border-width-sm) solid rgba(255,255,255,0.1);
    font-size: var(--ds-font-size-sm);
  }

  .toggle-btn {
    position: absolute;
    top: var(--ds-space-3);
    background: var(--ds-color-bg-dark);
    border: var(--ds-border-width-sm) solid rgba(255,255,255,0.15);
    color: var(--ds-color-text-on-dark-heading);
    width: 28px;
    height: 28px;
    border-radius: var(--ds-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: var(--ds-font-size-sm);
    z-index: var(--ds-z-toggle);
    transition: background var(--ds-transition-normal);
  }
  .toggle-btn:hover { background: var(--ds-color-bg-dark-hover); }

  :host(:not([position="right"])) .toggle-btn { right: -14px; }
  :host([position="right"]) .toggle-btn { left: -14px; }
`;

export class DsSidebar extends HTMLElement {
  static get observedAttributes() {
    return ["open", "position", "width", "collapsible"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, SIDEBAR_CSS);
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const width = this.getAttribute("width") || "280px";
    const collapsible = this.hasAttribute("collapsible");
    const open = this.hasAttribute("open");

    var toggleHtml = "";
    if (collapsible) {
      toggleHtml =
        '<button class="toggle-btn" part="toggle">' +
        (open ? "\u2190" : "\u2192") +
        "</button>";
    }

    this._shadow.innerHTML =
      '<div class="sidebar" style="width:' +
      esc(width) +
      '" part="sidebar">' +
      toggleHtml +
      '<div class="sidebar__header" part="header"><slot name="header"></slot></div>' +
      '<div class="sidebar__body" part="body"><slot></slot></div>' +
      '<div class="sidebar__footer" part="footer"><slot name="footer"></slot></div>' +
      "</div>";

    if (collapsible) {
      var self = this;
      var btn = this._shadow.querySelector(".toggle-btn");
      if (btn) {
        btn.addEventListener("click", function () {
          if (self.hasAttribute("open")) {
            self.removeAttribute("open");
          } else {
            self.setAttribute("open", "");
          }
        });
      }
    }

    // Hide empty header/footer
    var self2 = this;
    requestAnimationFrame(function () {
      var hdr = self2._shadow.querySelector(".sidebar__header");
      var ftr = self2._shadow.querySelector(".sidebar__footer");
      if (hdr && !self2.querySelector("[slot=header]"))
        hdr.style.display = "none";
      if (ftr && !self2.querySelector("[slot=footer]"))
        ftr.style.display = "none";
    });
  }
}
