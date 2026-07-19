// ═══════════════════════════════════════════════════════════════════════════
// <ds-spec-nav>
//
// The specification site's left sidebar navigation. Reads its structure
// from declarative light-DOM children instead of a JSON attribute.
//
// Attributes:
//   title       — title text shown at the top (e.g. "DSDS 0.1")
//   title-href  — link for the title (default: "index.html")
//   active      — slug of the currently active page
//   open        — boolean, whether the mobile links section is expanded
//
// Content model (light DOM):
//   Top-level <a> elements become nav links.
//   <ds-nav-group label="…"> elements become collapsible groups.
//   Inside a group, <a> elements become child links.
//
//   Every <a> may carry a `slug` attribute used to match against the
//   `active` attribute for highlighting.
//
// Mobile behavior:
//   The nav itself never hides — at ≤900px the links section (.nav__items)
//   collapses to 0 height by default, and the logo in the title bar is
//   replaced by a menu button in the same spot. Clicking it (or setting the
//   `open` attribute) expands the links section back to its normal,
//   desktop-style height.
//
// Usage:
//   <ds-spec-nav title="DSDS 0.1" title-href="index.html" active="index">
//     <a href="index.html" slug="index">Overview</a>
//     <a href="quickstart.html" slug="quickstart">Quick Start</a>
//     <ds-nav-group label="Entities">
//       <a href="entities-component.html" slug="entities-component">component</a>
//       <a href="entities-pattern.html" slug="entities-pattern">pattern</a>
//     </ds-nav-group>
//   </ds-spec-nav>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT, loadIcon } from "./_shared.js";

const SPEC_NAV_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    inset-block-end: 0;
    width: var(--ds-width-nav, 240px);
    z-index: var(--ds-z-nav, 100);
  }

  .nav {
    position: absolute;
    inset: 1em;
    color: var(--ds-color-text);
    padding: 0;
    font-family: ${FONT.body};
    display: flex;
    flex-direction: column;
    outline: 4px solid transparent;
    transition: outline var(--ds-duration-base) var(--ds-ease-standard);
  }

  /* ── Title ──────────────────────────────────────────── */
  .nav__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-bold);
    letter-spacing: 0;
    text-transform: none;
    background: var(--ds-color-text);
    color: var(--ds-color-bg-inverse);
    padding: var(--ds-space-4);
  }

  .nav__title a {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
    color: inherit;
    text-decoration: none;
    line-height: 1.2;
  }

  .nav__logo {
    flex-shrink: 0;
  }

  /* Menu toggle — takes over the logo's spot at mobile widths. */
  .nav__menu-btn {
    display: none;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: none;
    border: none;
    color: inherit;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .nav__menu-icon {
    display: flex;
  }

  .nav__menu-icon svg {
    display: block;
  }

  /* ── Items container ────────────────────────────────── */
  .nav__items {
    padding: var(--ds-space-4) 0;
    overflow-y: auto;
    max-height: 100%;
    background: var(--ds-color-bg-inverse);
    transition: max-height var(--ds-duration-base) var(--ds-ease-standard);
  }

  /* ── Top-level links ────────────────────────────────── */
  .nav__link {
    display: block;
    margin: 0 4px;
    padding: 6px calc(var(--ds-space-4) - 4px);
    color: var(--ds-color-text);
    text-decoration: none;
    font-size: var(--ds-font-size-base);
    font-weight: 500;
    line-height: var(--ds-line-height-normal);
    border-inline-start: var(--ds-border-width) solid transparent;
    transition: background-color var(--ds-duration-base) var(--ds-ease-standard),
      color var(--ds-duration-base) var(--ds-ease-standard);
  }

  .nav__link:hover {
    background: #1a1a1a;
    color: #fff;
  }

  .nav__link--active {
    background: #1a1a1a;
    color: #fff;
  }

  /* ── Group toggle ───────────────────────────────────── */
  .nav__group {
    margin-top: var(--ds-space-4);
  }

  .nav__group-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px var(--ds-space-4);
    background: none;
    border: none;
    border-inline-start: var(--ds-border-width) solid transparent;
    color: var(--ds-color-text);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-bold);
    letter-spacing: 0;
    text-transform: none;
    cursor: default;
    text-align: start;
  }

  .nav__group-arrow {
    display: none;
  }

  /* ── Group children — always visible ────────────────── */
  .nav__group-children {
    display: block;
    padding-bottom: var(--ds-space-1);
  }

  .nav__link--child {
    font-size: var(--ds-font-size-base);
  }

  /* ── Mobile: nav stays put; only the links section collapses ───────── */
  @media (max-width: 900px) {
    .nav__menu-btn {
      display: flex;
    }

    .nav__logo {
      display: none;
    }

    .nav__items {
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      overflow: hidden;
    }

    :host([open]) .nav {
      outline: 4px solid color-mix(#1a1a1a 30%, transparent);
    }

    :host([open]) .nav__items {
      max-height: 100%;
      padding: var(--ds-space-4) 0;
      overflow-y: auto;
    }
  }

  /* ── Print: hide nav ────────────────────────────────── */
  @media print {
    :host {
      display: none;
    }
  }
`;

export class DsSpecNav extends HTMLElement {
  static get observedAttributes() {
    return ["title", "title-href", "active", "open"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, SPEC_NAV_CSS);
    this._onKeydown = this._onKeydown.bind(this);
  }

  connectedCallback() {
    document.addEventListener("keydown", this._onKeydown);

    // Light-DOM children (<a>, <ds-nav-group>) may not be parsed yet when
    // a blocking <script> in <head> registers the element — the parser
    // upgrades the element the instant it sees the opening tag, before it
    // has parsed any children.
    //
    // We must wait for DOMContentLoaded to guarantee ALL children have
    // been parsed.  A MutationObserver fires too early (after the first
    // child, before the rest are added).
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this._render(), {
        once: true,
      });
    } else {
      // Document already parsed (dynamic insertion, deferred script, etc.)
      this._render();
    }
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }

  attributeChangedCallback(name) {
    if (name === "open") {
      this._syncMenuButton();
      return;
    }
    // Only re-render after the initial render has happened.
    if (this._rendered && this.isConnected) this._render();
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

  _render() {
    this._rendered = true;
    const title = this.getAttribute("title") || "";
    const titleHref = this.getAttribute("title-href") || "index.html";
    const active = this.getAttribute("active") || "";
    const isOpen = this.open;

    const titleHtml = title
      ? '<div class="nav__title">' +
        '<button class="nav__menu-btn" part="menu-btn" type="button" aria-label="Toggle navigation" aria-expanded="' +
        (isOpen ? "true" : "false") +
        // The button's aria-label already names the control; its icon is
        // decorative and filled in async once loadIcon() resolves below.
        '"><span class="nav__menu-icon" aria-hidden="true"></span></button>' +
        '<a href="' +
        esc(titleHref) +
        '"><ds-logo class="nav__logo" size="2rem" fill="#fff" aria-hidden="true"></ds-logo><span>' +
        esc(title) +
        "</span></a>" +
        "</div>"
      : "";

    const itemsHtml = this._buildFromChildren(active);

    this._shadow.innerHTML =
      '<nav class="nav" role="navigation" aria-label="Specification navigation" part="nav">' +
      titleHtml +
      '<div class="nav__items" part="items">' +
      itemsHtml +
      "</div>" +
      "</nav>";

    const btn = this._shadow.querySelector(".nav__menu-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        this.open = !this.open;
      });
    }

    this._updateMenuIcon(isOpen);
  }

  _syncMenuButton() {
    const isOpen = this.open;
    const btn = this._shadow.querySelector(".nav__menu-btn");
    if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    this._updateMenuIcon(isOpen);
  }

  _updateMenuIcon(isOpen) {
    const icon = this._shadow.querySelector(".nav__menu-icon");
    loadIcon(isOpen ? "close" : "menu").then((svg) => {
      if (icon) icon.innerHTML = svg;
    });
  }

  _onKeydown(e) {
    if (e.key === "Escape" && this.open) {
      this.open = false;
      const btn = this._shadow.querySelector(".nav__menu-btn");
      if (btn) btn.focus();
    }
  }

  /**
   * Walk the light-DOM children and build shadow-DOM navigation HTML.
   *
   * Recognised children:
   *   <a href="…" slug="…">Label</a>           → top-level link
   *   <ds-nav-group label="…">                  → collapsible group
   *     <a href="…" slug="…">Label</a>          → child link
   *   </ds-nav-group>
   */
  _buildFromChildren(active) {
    const parts = [];

    for (const child of this.children) {
      const tag = child.tagName.toLowerCase();

      if (tag === "a") {
        const slug = child.getAttribute("slug") || "";
        const href = child.getAttribute("href") || "#";
        const label = child.textContent.trim();
        const activeCls = slug && slug === active ? " nav__link--active" : "";
        parts.push(
          '<a class="nav__link' +
            activeCls +
            '" href="' +
            esc(href) +
            '">' +
            esc(label) +
            "</a>",
        );
      } else if (tag === "ds-nav-group") {
        parts.push(this._buildGroup(child, active));
      }
      // Silently skip unrecognised elements
    }

    return parts.join("\n");
  }

  /**
   * Build shadow HTML for a single <ds-nav-group>.
   */
  _buildGroup(groupEl, active) {
    const label = groupEl.getAttribute("label") || "";
    const childLinks = groupEl.querySelectorAll(":scope > a");

    const childHtml = Array.from(childLinks)
      .map(function (a) {
        const slug = a.getAttribute("slug") || "";
        const href = a.getAttribute("href") || "#";
        const text = a.textContent.trim();
        const activeCls = slug && slug === active ? " nav__link--active" : "";
        return (
          '<a class="nav__link nav__link--child' +
          activeCls +
          '" href="' +
          esc(href) +
          '">' +
          esc(text) +
          "</a>"
        );
      })
      .join("\n");

    return (
      '<div class="nav__group">' +
      '<div class="nav__group-toggle">' +
      "<span>" +
      esc(label) +
      "</span>" +
      "</div>" +
      '<div class="nav__group-children">' +
      childHtml +
      "</div>" +
      "</div>"
    );
  }
}
