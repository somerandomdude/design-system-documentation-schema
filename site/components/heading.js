// ═══════════════════════════════════════════════════════════════════════════
// <ds-heading>
//
// Attributes:
//   level    — 1–6 (default: 2)
//   anchor   — auto-generated anchor id (default: derived from text content)
//
// Slots:
//   (default) — heading text
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET } from "./_shared.js";

const HEADING_CSS = `
  ${BASE_RESET}
  :host { display: block; }

  .heading {
    display: block;
    color: var(--ds-color-text);
    font-family: var(--ds-font-mono);
    line-height: var(--ds-line-height-snug);
    letter-spacing: -0.0125em;
  }

  .heading--1 { font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-bold); margin: 0 0 var(--ds-space-4); }
  .heading--2 { font-size: var(--ds-font-size-xl); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-8) 0 var(--ds-space-2); }
  .heading--3 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-8) 0 var(--ds-space-2); }
  .heading--4 { font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
  .heading--5 { font-size: var(--ds-font-size-base); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
  .heading--6 { font-size: var(--ds-font-size-sm); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-2) 0 var(--ds-space-2); }

  .anchor-link {
    display: inline;
    opacity: 0;
    margin-inline-start: var(--ds-space-2);
    color: var(--ds-color-text);
    text-decoration: none;
    font-size: 0.75em;
    vertical-align: baseline;
    transition: opacity var(--ds-duration-fast) var(--ds-ease-standard);
  }
  /* :where() zeroes out .heading:hover's contribution to this selector's
     specificity, so .anchor-link:hover (a real, higher-specificity
     selector on its own) naturally outranks it on direct hover - no
     !important needed to break the tie. */
  :where(.heading:hover) .anchor-link { opacity: 0.6; }
  .anchor-link:hover { opacity: 1; }
  /* Keyboard focus must reveal it too: the link is focusable, so with only
     the :hover rules above it was a focus stop with no visible focus
     indicator anywhere on screen (WCAG 2.4.7). Separate rules, not one
     selector list, so a browser that doesn't parse :focus-visible still
     applies the :focus rule instead of discarding both. */
  .anchor-link:focus { opacity: 1; }
  .anchor-link:focus-visible { opacity: 1; }
`;

export class DsHeading extends HTMLElement {
  static get observedAttributes() {
    return ["level", "anchor"];
  }

  connectedCallback() {
    // Shadow-root creation deferred here, not in the constructor - and
    // specifically to DOMContentLoaded, not just "connected." A custom
    // element already defined before the parser reaches it (true here:
    // components.js is a blocking <head> script, same as every other
    // component's own DOMContentLoaded-wait note) gets synchronously
    // upgraded the instant its *opening* tag is parsed - before its own
    // children, including a build-time declarative shadow root
    // (<template shadowrootmode="open">, see build-site.js's
    // injectDeclarativeShadowDom()), have been parsed at all. Calling
    // createShadow() that early finds this.shadowRoot still empty,
    // attaches a fresh one anyway, and the declarative one that was about
    // to attach a moment later fails outright ("a second declarative
    // shadow root cannot be created on a host") - confirmed empirically,
    // not assumed, via a real page load with console errors surfaced.
    // Waiting for DOMContentLoaded guarantees the declarative shadow root
    // (if the build put one there) already exists by the time
    // createShadow() checks for it.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this._init(), {
        once: true,
      });
    } else {
      this._init();
    }
  }

  _init() {
    this._shadow = createShadow(this, HEADING_CSS);
    this._render();
  }

  attributeChangedCallback() {
    // Guard: an attribute set during initial parsing can fire this before
    // _init() has run (no shadow root to render into yet) - _init() will
    // render with final attribute values regardless once it does run.
    if (this.isConnected && this._shadow) this._render();
  }

  _render() {
    const level = Math.min(
      6,
      Math.max(1, parseInt(this.getAttribute("level"), 10) || 2),
    );
    const text = this.textContent.trim();
    const anchor =
      this.getAttribute("anchor") ||
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    // Set id on the host element so document.querySelector and TOC
    // scanning can find this heading by id without reaching into shadow DOM.
    if (anchor) this.id = anchor;

    const tag = "h" + level;
    this._shadow.innerHTML =
      "<" +
      tag +
      ' class="heading heading--' +
      level +
      '" part="heading">' +
      "<slot></slot>" +
      ' <a class="anchor-link" href="#' +
      esc(anchor) +
      '" part="anchor">#</a>' +
      "</" +
      tag +
      ">";
  }
}
