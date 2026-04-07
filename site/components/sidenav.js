import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

const SIDENAV_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .sidenav {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    overflow-y: auto;
    background: var(--ds-color-bg-dark);
    color: var(--ds-color-text-on-dark);
    font-family: ${FONT.body};
    z-index: var(--ds-z-nav);
    -webkit-overflow-scrolling: touch;
    padding: var(--ds-space-5) 0;
  }

  .sidenav__title {
    font-size: var(--ds-font-size-base);
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    color: var(--ds-color-bg);
    padding: 0 var(--ds-space-4);
    margin-bottom: var(--ds-space-5);
  }
  .sidenav__title a { color: inherit; text-decoration: none; }

  /* Nav links */
  .nav-link {
    display: block;
    padding: 5px var(--ds-space-4);
    color: var(--ds-color-text-on-dark);
    text-decoration: none;
    font-size: var(--ds-font-size-base);
    line-height: 1.4;
    border-left: 3px solid transparent;
    transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
  }
  .nav-link:hover {
    background: var(--ds-color-bg-dark-hover);
    color: var(--ds-color-bg);
  }
  .nav-link--active {
    background: var(--ds-color-bg-dark-active);
    color: var(--ds-color-bg);
    border-left-color: var(--ds-color-accent);
    font-weight: 500;
  }
  .nav-link--child {
    padding-left: 26px;
  }

  /* Collapsible group */
  .nav-group { margin-top: var(--ds-space-1); }

  .nav-group__toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px var(--ds-space-4);
    background: none;
    border: none;
    border-left: 3px solid transparent;
    color: var(--ds-color-nav-group);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-xs);
    font-weight: 600;
    letter-spacing: var(--ds-tracking-widest);
    text-transform: none;
    cursor: pointer;
    text-align: left;
    transition: color var(--ds-transition-fast);
  }
  .nav-group__toggle:hover { color: var(--ds-color-text-on-dark); }
  .nav-group--open > .nav-group__toggle { color: var(--ds-color-text-on-dark); }

  .nav-group__arrow {
    font-size: var(--ds-font-size-sm);
    transition: transform var(--ds-transition-normal);
    line-height: 1;
  }
  .nav-group--open > .nav-group__toggle .nav-group__arrow { transform: rotate(90deg); }

  .nav-group__children { display: none; padding-bottom: var(--ds-space-1); }
  .nav-group--open > .nav-group__children { display: block; }

  /* Slotted mode */
  ::slotted(ds-nav-link),
  ::slotted(ds-nav-group) { display: block; }
`;

export class DsSidenav extends HTMLElement {
  static get observedAttributes() {
    return ["width", "items", "title"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, SIDENAV_CSS);
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const width = this.getAttribute("width") || "240px";
    const title = this.getAttribute("title") || "";
    const itemsAttr = this.getAttribute("items");

    let contentHtml = "";

    if (itemsAttr) {
      // JSON-driven mode
      const items = JSON.parse(itemsAttr);
      contentHtml = this._renderItems(items);
    }

    const titleHtml = title
      ? '<div class="sidenav__title" part="title">' + esc(title) + "</div>"
      : "";

    this._shadow.innerHTML =
      '<nav class="sidenav" style="width:' +
      esc(width) +
      '" part="nav">' +
      titleHtml +
      (itemsAttr ? contentHtml : "<slot></slot>") +
      "</nav>";

    // Attach group toggle listeners
    var self = this;
    this._shadow
      .querySelectorAll(".nav-group__toggle")
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var group = btn.parentElement;
          group.classList.toggle("nav-group--open");
        });
      });
  }

  _renderItems(items) {
    var self = this;
    return items
      .map(function (item) {
        if (item.children) {
          const openCls = item.open ? " nav-group--open" : "";
          const childHtml = item.children
            .map(function (child) {
              const activeCls = child.active ? " nav-link--active" : "";
              return (
                '<a class="nav-link nav-link--child' +
                activeCls +
                '" href="' +
                esc(child.href || "#") +
                '">' +
                esc(child.label) +
                "</a>"
              );
            })
            .join("");

          return (
            '<div class="nav-group' +
            openCls +
            '">' +
            '<button class="nav-group__toggle">' +
            esc(item.label) +
            '<span class="nav-group__arrow">\u25B6</span>' +
            "</button>" +
            '<div class="nav-group__children">' +
            childHtml +
            "</div></div>"
          );
        } else {
          const activeCls = item.active ? " nav-link--active" : "";
          return (
            '<a class="nav-link' +
            activeCls +
            '" href="' +
            esc(item.href || "#") +
            '">' +
            esc(item.label) +
            "</a>"
          );
        }
      })
      .join("");
  }
}

// <ds-nav-group> — declarative nav group (used as child of <ds-sidenav>)
// Attributes: label, open
export class DsNavGroup extends HTMLElement {
  constructor() {
    super();
  }
}

// <ds-nav-link> — declarative nav link (used as child of <ds-sidenav> or <ds-nav-group>)
// Attributes: href, active
export class DsNavLink extends HTMLElement {
  constructor() {
    super();
  }
}
