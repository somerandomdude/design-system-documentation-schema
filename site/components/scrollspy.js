import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const SCROLLSPY_CSS = `
  ${BASE_RESET}
  :host { display: block; }
`;

export class DsScrollspy extends HTMLElement {
  static get observedAttributes() {
    return ["target", "selector", "offset"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, SCROLLSPY_CSS);
    this._shadow.innerHTML = "<slot></slot>";
    this._observer = null;
    this._activeId = null;
  }

  connectedCallback() {
    this._setup();
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._setup();
  }

  _setup() {
    if (this._observer) this._observer.disconnect();

    const selector = this.getAttribute("selector") || "h2, h3";
    const offset = parseInt(this.getAttribute("offset"), 10) || 80;
    const targetSel = this.getAttribute("target");
    const root = targetSel ? document.querySelector(targetSel) : null;

    const headings = (root || document).querySelectorAll(selector);
    if (!headings.length) return;

    var self = this;

    this._observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            self._setActive(entry.target.id);
          }
        });
      },
      {
        root: root,
        rootMargin: "-" + offset + "px 0px -60% 0px",
        threshold: 0,
      },
    );

    headings.forEach(function (h) {
      if (h.id) self._observer.observe(h);
    });
  }

  _setActive(id) {
    if (id === this._activeId) return;
    this._activeId = id;

    var links = this.querySelectorAll("a");
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });

    this.dispatchEvent(
      new CustomEvent("scrollspy-change", {
        detail: { id: id },
        bubbles: true,
      }),
    );
  }
}
