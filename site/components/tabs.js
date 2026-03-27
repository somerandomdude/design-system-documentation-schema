// ═══════════════════════════════════════════════════════════════════════════
// <ds-tabs>
//
// Attributes:
//   active — id of the active tab (or the first tab by default)
//
// Usage:
//   <ds-tabs>
//     <ds-tab label="First" id="t1">Content 1</ds-tab>
//     <ds-tab label="Second" id="t2">Content 2</ds-tab>
//   </ds-tabs>
//
// Child element: <ds-tab label="..." id="...">content</ds-tab>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const TABS_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: var(--ds-border-width-md) solid var(--ds-color-border);
    overflow-x: auto;
  }

  .tab-btn {
    font-family: ${FONT.body};
    padding: var(--ds-space-3) var(--ds-space-5);
    border: none;
    background: none;
    font-size: var(--ds-font-size-md);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-secondary);
    cursor: pointer;
    border-bottom: var(--ds-border-width-lg) solid transparent;
    margin-bottom: calc(-1 * var(--ds-border-width-md));
    transition: color var(--ds-transition-normal), border-color var(--ds-transition-normal);
    white-space: nowrap;
  }
  .tab-btn:hover { color: var(--ds-color-text); }
  .tab-btn--active {
    color: var(--ds-color-accent);
    border-bottom-color: var(--ds-color-accent);
  }
  .tab-btn:focus-visible {
    outline: var(--ds-border-width-md) solid var(--ds-color-accent);
    outline-offset: -2px;
  }

  .tab-panels {
    padding: var(--ds-space-4) 0;
  }

  ::slotted(ds-tab) { display: none; }
  ::slotted(ds-tab[active]) { display: block; }
`;

export class DsTabs extends HTMLElement {
  static get observedAttributes() {
    return ["active"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, TABS_CSS);
  }

  connectedCallback() {
    this._buildBar();
    this._activate(this.getAttribute("active") || null);
  }

  attributeChangedCallback(name) {
    if (name === "active" && this.isConnected) {
      this._activate(this.getAttribute("active"));
    }
  }

  _buildBar() {
    const tabs = Array.from(this.querySelectorAll("ds-tab"));
    const bar = document.createElement("div");
    bar.className = "tab-bar";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("part", "bar");

    var self = this;
    tabs.forEach(function (tab) {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.textContent = tab.getAttribute("label") || tab.id || "Tab";
      btn.setAttribute("role", "tab");
      btn.setAttribute("data-tab", tab.id);
      btn.addEventListener("click", function () {
        self._activate(tab.id);
      });
      bar.appendChild(btn);
    });

    this._shadow.innerHTML = "";
    this._shadow.appendChild(bar);

    const panels = document.createElement("div");
    panels.className = "tab-panels";
    panels.innerHTML = "<slot></slot>";
    this._shadow.appendChild(panels);
  }

  _activate(id) {
    const tabs = Array.from(this.querySelectorAll("ds-tab"));
    if (!id && tabs.length > 0) id = tabs[0].id;

    tabs.forEach(function (tab) {
      if (tab.id === id) {
        tab.setAttribute("active", "");
      } else {
        tab.removeAttribute("active");
      }
    });

    this._shadow.querySelectorAll(".tab-btn").forEach(function (btn) {
      if (btn.getAttribute("data-tab") === id) {
        btn.classList.add("tab-btn--active");
        btn.setAttribute("aria-selected", "true");
      } else {
        btn.classList.remove("tab-btn--active");
        btn.setAttribute("aria-selected", "false");
      }
    });
  }
}

// <ds-tab> — individual tab panel (used as child of <ds-tabs>)
export class DsTab extends HTMLElement {
  constructor() {
    super();
  }
}
