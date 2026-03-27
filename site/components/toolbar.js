import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const TOOLBAR_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .toolbar {
    background: var(--ds-color-bg);
    border-bottom: 1px solid var(--ds-color-border);
    font-family: ${FONT.body};
  }

  :host([sticky]) .toolbar {
    position: sticky;
    top: 0;
    z-index: var(--ds-z-toolbar);
  }

  /* Primary row: start / center / end */
  .toolbar__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-4);
    padding: var(--ds-space-2) var(--ds-space-5);
    min-height: var(--ds-space-12);
  }

  .toolbar__start {
    display: flex;
    align-items: center;
    gap: var(--ds-space-3);
    min-width: 0;
  }

  .toolbar__center {
    display: flex;
    align-items: center;
    gap: var(--ds-space-3);
    flex: 1;
    min-width: 0;
  }

  .toolbar__end {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    flex-shrink: 0;
  }

  ::slotted([slot="start"]) {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ds-color-text);
  }

  /* Subtitle — sits below the title in the start area */
  .toolbar__subtitle {
    display: none;
    padding: 0 var(--ds-space-5) 6px;
    font-size: 0.82rem;
    color: var(--ds-color-text-secondary);
    line-height: 1.4;
  }
  .toolbar__subtitle.visible { display: block; }

  /* Nav row — horizontal link strip below the primary row */
  .toolbar__nav {
    display: none;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ds-space-1) 14px;
    padding: var(--ds-space-1) var(--ds-space-5) var(--ds-space-2);
    font-size: 0.82rem;
    border-top: 1px solid var(--ds-color-border-light);
  }
  .toolbar__nav.visible { display: flex; }

  ::slotted([slot="nav"]) {
    color: var(--ds-color-accent);
    text-decoration: none;
    padding: 2px 0;
    font-size: 0.82rem;
  }
`;

export class DsToolbar extends HTMLElement {
  static get observedAttributes() {
    return ["sticky"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, TOOLBAR_CSS);
    // Default to sticky
    if (!this.hasAttribute("sticky")) this.setAttribute("sticky", "");
    this._shadow.innerHTML =
      '<div class="toolbar" part="toolbar">' +
      '<div class="toolbar__row">' +
      '<div class="toolbar__start" part="start"><slot name="start"></slot></div>' +
      '<div class="toolbar__center" part="center"><slot></slot></div>' +
      '<div class="toolbar__end" part="end"><slot name="end"></slot></div>' +
      "</div>" +
      '<div class="toolbar__subtitle" part="subtitle"><slot name="subtitle"></slot></div>' +
      '<div class="toolbar__nav" part="nav"><slot name="nav"></slot></div>' +
      "</div>";
  }

  connectedCallback() {
    // Show subtitle and nav rows only when their slots are populated
    var self = this;
    requestAnimationFrame(function () {
      var subtitleSlot = self._shadow.querySelector('slot[name="subtitle"]');
      var navSlot = self._shadow.querySelector('slot[name="nav"]');
      if (subtitleSlot) {
        var subAssigned = subtitleSlot.assignedNodes({ flatten: true });
        if (subAssigned.length > 0) {
          subtitleSlot.parentElement.classList.add("visible");
        }
      }
      if (navSlot) {
        var navAssigned = navSlot.assignedNodes({ flatten: true });
        if (navAssigned.length > 0) {
          navSlot.parentElement.classList.add("visible");
        }
      }
    });
  }
}
