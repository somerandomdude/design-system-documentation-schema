import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const TOC_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    position: sticky;
    top: 0;
    align-self: flex-start;
    width: var(--ds-width-toc, 220px);
    flex-shrink: 0;
    max-height: 100vh;
    overflow-y: auto;
    padding: var(--ds-space-12) var(--ds-space-4) var(--ds-space-12) 0;
    border-left: 1px solid var(--ds-color-border-light);
    font-size: var(--ds-font-size-sm);
    -webkit-overflow-scrolling: touch;
  }

  .toc__title {
    font-size: var(--ds-font-size-xs);
    font-weight: 600;
    letter-spacing: var(--ds-tracking-widest);
    text-transform: none;
    color: var(--ds-color-text-secondary);
    padding: 0 var(--ds-space-4);
    margin: 0 0 var(--ds-space-2);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin: 0;
  }

  a {
    display: block;
    padding: var(--ds-radius-sm) var(--ds-space-4);
    color: var(--ds-color-text-secondary);
    text-decoration: none;
    line-height: 1.4;
    transition: color 0.1s ease, border-left-color 0.1s ease;
    border-left: 2px solid transparent;
    margin-left: -1px;
  }

  a:hover {
    color: var(--ds-color-accent);
    border-left-color: var(--ds-color-accent);
  }

  a.active {
    color: var(--ds-color-accent);
    border-left-color: var(--ds-color-accent);
    font-weight: 500;
  }

  a.sub {
    padding-left: 26px;
    font-size: var(--ds-font-size-xs);
    color: var(--ds-color-text-muted);
  }

  a.sub:hover,
  a.sub.active {
    color: var(--ds-color-accent);
  }
`;

export class DsToc extends HTMLElement {
  static get observedAttributes() {
    return ["target", "selector", "label", "offset"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, TOC_CSS);
    this._observer = null;
    this._activeId = null;
  }

  connectedCallback() {
    // Defer to let headings render (especially <ds-heading> which defers too)
    var self = this;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self._build();
      });
    });
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      var self = this;
      requestAnimationFrame(function () {
        self._build();
      });
    }
  }

  _build() {
    var label = this.getAttribute("label") || "On this page";
    var selector = this.getAttribute("selector") || "h2[id], h3[id]";
    var offset = parseInt(this.getAttribute("offset"), 10) || 80;
    var targetSel = this.getAttribute("target");
    var root = targetSel ? document.querySelector(targetSel) : document;

    if (!root) return;

    // Query both native headings and ds-heading elements
    var headingSet = new Set();
    var headings = [];
    var all = root.querySelectorAll(selector + ", ds-heading[id]");
    all.forEach(function (el) {
      if (!headingSet.has(el)) {
        headingSet.add(el);
        headings.push(el);
      }
    });
    if (headings.length === 0) {
      this._shadow.innerHTML = "";
      return;
    }

    // Build the link list
    var items = [];
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var id = h.id || h.getAttribute("anchor") || "";
      var text = h.textContent.replace(/#\s*$/, "").trim() || id;
      var level = 3; // default to sub
      var tagName = h.tagName.toLowerCase();
      if (tagName === "h1" || tagName === "h2") {
        level = 2;
      } else if (tagName === "ds-heading") {
        var lvl = h.getAttribute("level");
        if (lvl === "1" || lvl === "2") level = 2;
      }
      if (id && text) {
        items.push({ id: id, text: text, level: level });
      }
    }

    if (items.length === 0) {
      this._shadow.innerHTML = "";
      return;
    }

    var lis = items
      .map(function (item) {
        var cls = item.level === 3 ? ' class="sub"' : "";
        return (
          '<li><a href="#' +
          esc(item.id) +
          '"' +
          cls +
          ' data-toc-id="' +
          esc(item.id) +
          '">' +
          esc(item.text) +
          "</a></li>"
        );
      })
      .join("\n");

    this._shadow.innerHTML =
      '<p class="toc__title">' +
      esc(label) +
      "</p>" +
      '<nav aria-label="' +
      esc(label) +
      '"><ul>' +
      lis +
      "</ul></nav>";

    // Set up IntersectionObserver for scroll tracking
    if (this._observer) this._observer.disconnect();

    var self = this;

    this._observer = new IntersectionObserver(
      function (entries) {
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].isIntersecting) {
            self._setActive(entries[j].target.id);
          }
        }
      },
      {
        rootMargin: "-" + offset + "px 0px -60% 0px",
        threshold: 0,
      },
    );

    for (var k = 0; k < headings.length; k++) {
      if (headings[k].id) {
        this._observer.observe(headings[k]);
      }
    }
  }

  _setActive(id) {
    if (id === this._activeId) return;
    this._activeId = id;

    var links = this._shadow.querySelectorAll("a[data-toc-id]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-toc-id") === id) {
        links[i].classList.add("active");
      } else {
        links[i].classList.remove("active");
      }
    }
  }
}
