// ═══════════════════════════════════════════════════════════════════════════
// <ds-tabs>
//
// A tab bar that toggles visibility of <ds-tab> panels. Panels can live
// inside the component (default) or in a remote container via the `target`
// attribute. This split layout lets the tab bar sit in a fixed header
// while panels scroll independently below.
//
// Attributes:
//   target  — CSS selector for a remote container holding <ds-tab> children.
//             When set, the component renders only the tab bar and controls
//             panels found in the target container. When omitted, panels are
//             expected as direct children (slotted).
//   active  — id of the initially active tab. Defaults to the first tab.
//
// Usage (remote panels):
//   <div class="header">
//     <ds-tabs target="#panels" active="tab-one"></ds-tabs>
//   </div>
//   <div id="panels">
//     <ds-tab label="First" id="tab-one">Content 1</ds-tab>
//     <ds-tab label="Second" id="tab-two">Content 2</ds-tab>
//   </div>
//
// Usage (local panels):
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
    color: var(--ds-color-text);
    border-bottom-color: var(--ds-color-text);
  }
  .tab-btn:focus-visible {
    outline: var(--ds-border-width-md) solid var(--ds-color-accent);
    outline-offset: -2px;
  }

  /* Only used in local (non-target) mode */
  .tab-panels {
    padding: var(--ds-space-4) 0;
  }

  ::slotted(ds-tab) { display: none; }
  ::slotted(ds-tab[active]) { display: block; }
`;

/* Light-DOM styles for remote <ds-tab> panels (not slotted, so shadow
   CSS can't reach them). Injected once into the document head. */
const TAB_LIGHT_STYLE_ID = "ds-tab-light-styles";

function ensureTabLightStyles() {
  if (document.getElementById(TAB_LIGHT_STYLE_ID)) return;
  var style = document.createElement("style");
  style.id = TAB_LIGHT_STYLE_ID;
  style.textContent =
    "ds-tab { display: none; }\nds-tab[active] { display: block; }";
  document.head.appendChild(style);
}

export class DsTabs extends HTMLElement {
  static get observedAttributes() {
    return ["active", "target"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, TABS_CSS);
    this._built = false;
  }

  connectedCallback() {
    // Children (local or remote) may not be parsed yet when a blocking
    // <script> in <head> registers the element. Wait for the parser to
    // finish before reading them.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this._init(), {
        once: true,
      });
    } else {
      this._init();
    }
  }

  attributeChangedCallback(name) {
    if (!this._built || !this.isConnected) return;
    if (name === "active") {
      this._activate(this.getAttribute("active"));
    } else if (name === "target") {
      this._init();
    }
  }

  /* ── Internal ────────────────────────────────────────── */

  /**
   * Resolve the <ds-tab> panels — either from a remote target container
   * or from direct children.
   */
  _getTabs() {
    var targetSel = this.getAttribute("target");
    if (targetSel) {
      var container = document.querySelector(targetSel);
      if (container) {
        return Array.from(container.querySelectorAll(":scope > ds-tab"));
      }
      return [];
    }
    return Array.from(this.querySelectorAll(":scope > ds-tab"));
  }

  /**
   * Returns true when the component is operating in remote-target mode.
   */
  _isRemote() {
    return !!this.getAttribute("target");
  }

  /**
   * Build the tab bar and set initial active state.
   */
  _init() {
    if (this._isRemote()) {
      ensureTabLightStyles();
    }
    this._buildBar();
    this._activate(this.getAttribute("active") || null);
    this._built = true;
  }

  /**
   * Build the tab bar from <ds-tab> labels.
   */
  _buildBar() {
    var tabs = this._getTabs();
    var bar = document.createElement("div");
    bar.className = "tab-bar";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("part", "bar");

    var self = this;
    tabs.forEach(function (tab) {
      var btn = document.createElement("button");
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

    // In local mode, add a slot for the panel content
    if (!this._isRemote()) {
      var panels = document.createElement("div");
      panels.className = "tab-panels";
      panels.innerHTML = "<slot></slot>";
      this._shadow.appendChild(panels);
    }
  }

  /**
   * Activate a tab by id — toggles the `active` attribute on <ds-tab>
   * elements and updates the bar button states.
   */
  _activate(id) {
    var tabs = this._getTabs();
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

// <ds-tab> — individual tab panel (used as child of <ds-tabs> or a remote container)
// Attributes: label, id, active
export class DsTab extends HTMLElement {
  constructor() {
    super();
  }
}
