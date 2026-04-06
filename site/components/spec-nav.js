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
//   open        — boolean, reflects mobile open/closed state
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
//   At ≤900px the nav is off-screen by default (translateX(-100%)).
//   Setting the `open` attribute slides it into view.
//   <ds-nav-toggle> controls the `open` attribute externally.
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

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const SPEC_NAV_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--ds-width-nav, 240px);
    z-index: var(--ds-z-nav, 100);
  }

  .nav {
    position: absolute;
    inset: 0;
    background: var(--ds-color-bg-dark, #1b1f24);
    color: var(--ds-color-text-on-dark, #c9cdd3);
    overflow-y: auto;
    padding: var(--ds-space-6, 24px) 0;
    font-family: ${FONT.body};
    -webkit-overflow-scrolling: touch;
  }

  /* ── Title ──────────────────────────────────────────── */
  .nav__title {
    font-size: var(--ds-font-size-base, 0.8125rem);
    font-weight: var(--ds-font-weight-bold, 700);
    letter-spacing: 0;
    text-transform: none;
    color: var(--ds-color-text-on-dark-heading, #ffffff);
    padding: 0 var(--ds-space-4, 16px);
    margin-bottom: var(--ds-space-6, 24px);
  }

  .nav__title a {
    color: inherit;
    text-decoration: none;
  }

  /* ── Items container ────────────────────────────────── */
  .nav__items {
    margin-bottom: var(--ds-space-4, 16px);
  }

  /* ── Top-level links ────────────────────────────────── */
  .nav__link {
    display: block;
    padding: 5px var(--ds-space-4, 16px);
    color: var(--ds-color-text-on-dark, #c9cdd3);
    text-decoration: none;
    font-size: var(--ds-font-size-base, 0.8125rem);
    line-height: var(--ds-line-height-normal, 1.4);
    transition: background var(--ds-transition-fast, 0.1s ease),
                color var(--ds-transition-fast, 0.1s ease);
    border-left: var(--ds-border-width-lg, 3px) solid transparent;
  }

  .nav__link:hover {
    background: var(--ds-color-bg-dark-hover, #2a2f36);
    color: var(--ds-color-text-on-dark-heading, #ffffff);
  }

  .nav__link--active {
    background: var(--ds-color-bg-dark-active, #363b44);
    color: var(--ds-color-text-on-dark-heading, #ffffff);
    border-left-color: var(--ds-color-accent, #0055b3);
    font-weight: var(--ds-font-weight-medium, 500);
  }

  /* ── Group toggle ───────────────────────────────────── */
  .nav__group {
    margin-top: var(--ds-space-4, 16px);
  }

  .nav__group-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px var(--ds-space-4, 16px);
    background: none;
    border: none;
    border-left: var(--ds-border-width-lg, 3px) solid transparent;
    color: var(--ds-color-nav-group, #808690);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-xs, 0.6875rem);
    font-weight: var(--ds-font-weight-semibold, 600);
    letter-spacing: 0;
    text-transform: none;
    cursor: default;
    text-align: left;
    transition: color var(--ds-transition-fast, 0.1s ease);
  }

  .nav__group-arrow {
    display: none;
  }

  /* ── Group children — always visible ────────────────── */
  .nav__group-children {
    display: block;
    padding-bottom: var(--ds-space-1, 4px);
  }

  .nav__link--child {
    padding-left: var(--ds-space-4, 16px);
    font-size: var(--ds-font-size-base, 0.8125rem);
  }

  /* ── Mobile: slide off-screen by default ────────────── */
  @media (max-width: 900px) {
    :host {
      transform: translateX(-100%);
      transition: transform var(--ds-transition-slow, 0.2s ease);
    }

    :host([open]) {
      transform: translateX(0);
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
  }

  connectedCallback() {
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

  attributeChangedCallback(name) {
    // The `open` attribute is handled purely by CSS (:host([open])).
    if (name === "open") return;
    // Only re-render after the initial render has happened.
    if (this._rendered && this.isConnected) this._render();
  }

  _render() {
    this._rendered = true;
    const title = this.getAttribute("title") || "";
    const titleHref = this.getAttribute("title-href") || "index.html";
    const active = this.getAttribute("active") || "";

    const titleHtml = title
      ? '<div class="nav__title"><a href="' +
        esc(titleHref) +
        '">' +
        esc(title) +
        "</a></div>"
      : "";

    const itemsHtml = this._buildFromChildren(active);

    this._shadow.innerHTML =
      '<nav class="nav" role="navigation" aria-label="Specification navigation" part="nav">' +
      titleHtml +
      '<div class="nav__items" part="items">' +
      itemsHtml +
      "</div>" +
      "</nav>";
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
