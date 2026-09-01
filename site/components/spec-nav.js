// ═══════════════════════════════════════════════════════════════════════════
// <ds-spec-nav>
//
// The specification site's top bar navigation. Reads its structure from
// declarative light-DOM children instead of a JSON attribute.
//
// A flat top bar, not a sidebar: with every schema definition living on one
// Schema page instead of its own, there's nothing left to group into
// collapsible sections — just a handful of top-level pages, so a horizontal
// bar fits, and frees the sidebar's reserved column width for pages (like
// Schema) that want the full viewport width.
//
// Attributes:
//   title       — title text shown at the left of the bar (e.g. "DSDS 0.1")
//   title-href  — link for the title (default: "index.html")
//   active      — slug of the currently active page
//   open        — boolean, whether the mobile links dropdown is expanded
//
// Content model (light DOM):
//   <a> elements become nav links. Every <a> may carry a `slug` attribute
//   used to match against the `active` attribute for highlighting.
//
// Mobile behavior:
//   The bar itself never hides — at ≤900px the links row (.nav__items)
//   becomes a native popover instead of an always-visible flex row, and the
//   logo in the title area is replaced by a menu button that opens it
//   (popovertarget, not a click handler). Escape, clicking outside, and
//   opening a second popover elsewhere on the page all close it for free —
//   the browser's own popover="auto" behavior, not code this component has
//   to implement or maintain. Above 900px the popover machinery is present
//   but inert: author CSS forces the row visible and back into normal flow
//   regardless of open state, since author styles always win over the
//   user-agent's own popover defaults.
//
// Usage:
//   <ds-spec-nav title="DSDS 0.1" title-href="index.html" active="index">
//     <a href="index.html" slug="index">Overview</a>
//     <a href="quickstart.html" slug="quickstart">Quick start</a>
//   </ds-spec-nav>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT, loadIcon } from "./_shared.js";

const SPEC_NAV_CSS = `
  ${BASE_RESET}
  :host {
    display: block;
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: var(--ds-z-nav, 100);
  }

  .nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    color: var(--ds-color-text);
    background: color-mix(in oklch, var(--ds-color-bg-accent) 90%, transparent);
    font-family: var(--ds-font-body);
    min-height: var(--ds-height-nav, 64px);
    padding-inline: calc(var(--ds-space-4) * 2);
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
    flex-shrink: 0;
  }

  .nav__title a {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
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

  /* ── Links row ──────────────────────────────────────────────────────
     popover="auto" on this element always (see .nav__items:popover-open
     below and the @media block) - the popover machinery only actually
     does anything below 900px. Above that, this block resets every
     user-agent popover default (position, inset, margin, border,
     background, display) back to an ordinary in-flow flex row - author
     styles always win over UA styles, regardless of :popover-open state,
     so this is enough to make popover-ness a no-op at desktop widths
     without a media-query-driven attribute toggle in JS. */
  .nav__items {
    position: static;
    inset: auto;
    margin: 0;
    border: none;
    padding: 0;
    background: none;
    color: inherit;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    overflow: visible;
  }

  .nav__link {
    display: block;
    padding: 6px calc(var(--ds-space-4) - 4px);
    color: var(--ds-color-text);
    text-decoration: none;
    font-size: var(--ds-font-size-base);
    font-weight: 500;
    line-height: var(--ds-line-height-normal);
    border-block-end: var(--ds-border-width) solid transparent;
    transition: background-color var(--ds-duration-base) var(--ds-ease-standard),
      color var(--ds-duration-base) var(--ds-ease-standard),
      border-color var(--ds-duration-base) var(--ds-ease-standard);
  }

  .nav__link:hover {
    background: #1a1a1a;
    color: #fff;
  }

  .nav__link--active {
    background: #1a1a1a;
    color: #fff;
    border-block-end-color: var(--ds-color-accent);
  }

  /* ── Mobile: bar stays put; the links row becomes a real popover ────── */
  @media (max-width: 900px) {

    .nav__menu-btn {
      display: flex;
    }

    .nav__logo {
      display: none;
    }

    .nav {
      min-height: 64px;
      /* Matches .content__inner's own mobile padding-inline (see
         style.css's max-width: 900px block) - both var(--ds-space-4), so
         the bar's edges line up with the content's instead of the wider
         desktop inset (calc(var(--ds-space-4) * 2)) above. */
      padding-inline: var(--ds-space-4);
    }

    /* Positioned to sit directly under the (inset, floating) bar itself -
       matches its own margin/height rather than the old in-flow "second
       row of the same flex box" approach, since a popover is promoted out
       of normal flow into the top layer regardless of what position we
       give it otherwise. */
    .nav__items {
      position: fixed;
      top: calc(var(--ds-height-nav, 64px) + 1em);
      left: 1em;
      right: 1em;
      margin: 0;
      padding: var(--ds-space-4) 0;
      background: color-mix(in oklch, var(--ds-color-bg-accent) 90%, transparent);
      flex-direction: column;
      align-items: stretch;
      max-height: 60vh;
      overflow-y: auto;
      /* display: none is the popover-closed UA default; only overridden
         by :popover-open below. Opacity/transform are this component's
         own open/close animation - display and overlay need
         transition-behavior: allow-discrete since neither is normally
         interpolable, and both need to outlast the opacity/transform
         transition on the way out (that's what the overlay property is
         for) or the panel would vanish instantly instead of fading. */
      display: none;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity var(--ds-duration-base) var(--ds-ease-standard),
        transform var(--ds-duration-base) var(--ds-ease-standard),
        display var(--ds-duration-base) allow-discrete,
        overlay var(--ds-duration-base) allow-discrete;
    }

    .nav__items:popover-open {
      display: flex;
      opacity: 1;
      transform: translateY(0);
    }

    /* The state a newly-opened popover transitions *from* - without this,
       display/opacity/transform would already be at their :popover-open
       values the instant it enters the top layer, and there'd be nothing
       for the transition to animate from. */
    @starting-style {
      .nav__items:popover-open {
        opacity: 0;
        transform: translateY(-8px);
      }
    }

    .nav__link {
      border-block-end: none;
      border-inline-start: var(--ds-border-width) solid transparent;
    }

    .nav__link--active {
      border-block-end-color: transparent;
      border-inline-start-color: var(--ds-color-accent);
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
    // Light-DOM children (<a>) may not be parsed yet when a blocking
    // <script> in <head> registers the element — the parser upgrades the
    // element the instant it sees the opening tag, before it has parsed any
    // children.
    //
    // We must wait for DOMContentLoaded to guarantee ALL children have
    // been parsed. A MutationObserver fires too early (after the first
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
    if (name === "open") {
      this._syncPopoverToAttribute();
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

  // Keeps the public `open` attribute/property in sync with the popover's
  // real state, in whichever direction changed first: setting `.open` (or
  // the attribute directly) calls show/hidePopover() here; the popover's
  // own native `toggle` event (wired in _render() - fires for every
  // dismissal path, the button, Escape, or clicking outside) sets the
  // attribute to match from the other direction. The equality check stops
  // the two from calling each other in a loop.
  _syncPopoverToAttribute() {
    const items = this._shadow.querySelector(".nav__items");
    if (!items) return;
    const isOpen = this.open;
    if (items.matches(":popover-open") === isOpen) return;
    if (isOpen) {
      items.showPopover();
    } else {
      items.hidePopover();
    }
  }

  _render() {
    this._rendered = true;
    const title = this.getAttribute("title") || "";
    const titleHref = this.getAttribute("title-href") || "index.html";
    const active = this.getAttribute("active") || "";

    const titleHtml = title
      ? '<div class="nav__title">' +
        '<button class="nav__menu-btn" part="menu-btn" type="button" popovertarget="nav-items" popovertargetaction="toggle" aria-label="Toggle navigation" aria-expanded="false">' +
        // The button's aria-label already names the control; its icon is
        // decorative and filled in async once loadIcon() resolves below.
        '<span class="nav__menu-icon" aria-hidden="true"></span></button>' +
        '<a href="' +
        esc(titleHref) +
        '"><ds-logo class="nav__logo" size="2rem" fill="#000" aria-hidden="true"></ds-logo><span>' +
        esc(title) +
        "</span></a>" +
        "</div>"
      : "";

    const itemsHtml = this._buildFromChildren(active);

    this._shadow.innerHTML =
      '<nav class="nav" role="navigation" aria-label="Specification navigation" part="nav">' +
      titleHtml +
      '<div class="nav__items" part="items" id="nav-items" popover="auto">' +
      itemsHtml +
      "</div>" +
      "</nav>";

    const itemsEl = this._shadow.querySelector(".nav__items");
    if (itemsEl) {
      // ToggleEvent, not click - this fires for every way the popover can
      // open or close (the button, Escape, light-dismiss), so it's the one
      // place aria-expanded, the icon, and the public `open` attribute all
      // need to react, instead of duplicating that logic per dismissal path.
      itemsEl.addEventListener("toggle", (e) => {
        const isOpen = e.newState === "open";
        const btn = this._shadow.querySelector(".nav__menu-btn");
        if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        this._updateMenuIcon(isOpen);
        if (isOpen) {
          this.setAttribute("open", "");
        } else {
          this.removeAttribute("open");
        }
      });
      // A re-render (title/active changed) rebuilds .nav__items from
      // scratch, which would otherwise silently drop an already-open
      // state - restore it from the host's own `open` attribute, the
      // single source of truth that survives the rebuild.
      if (this.open) itemsEl.showPopover();
    }

    this._updateMenuIcon(this.open);
  }

  _updateMenuIcon(isOpen) {
    const icon = this._shadow.querySelector(".nav__menu-icon");
    loadIcon(isOpen ? "close" : "menu").then((svg) => {
      if (icon) icon.innerHTML = svg;
    });
  }

  /**
   * Walk the light-DOM children and build shadow-DOM navigation HTML.
   *
   * Recognised children:
   *   <a href="…" slug="…">Label</a> → a nav link
   */
  _buildFromChildren(active) {
    const parts = [];

    for (const child of this.children) {
      if (child.tagName.toLowerCase() !== "a") continue; // silently skip unrecognised elements
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
    }

    return parts.join("\n");
  }
}
