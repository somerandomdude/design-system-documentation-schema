// ═══════════════════════════════════════════════════════════════════════════
// <ds-guide-section>
//
// A two-column split wrapper for narrative guide pages (Quick start): help
// text on the left, its code example on the right - the same visual
// language as the Schema page's own <ds-def-section layout="split">, minus
// everything there that's specific to documenting a schema definition
// (a title it renders itself, an eyebrow, a type/source line). This
// component renders nothing of its own; both columns are plain slots, so
// the caller's own markdown-compiled heading levels, paragraphs, lists,
// and callouts pass through unchanged.
//
// Slots:
//   (default) — left column: heading, prose, whatever the step needs
//   example   — right column: the step's <ds-code>, if it has one
//
// .end (the right column) only renders when something is actually slotted
// into "example" - checked once, at connect time, since a step with no
// code has nothing to put there. Rendering it anyway, empty, would still
// look right at desktop widths (content__inner's own continuous background
// - see style.css's .content--full rule - paints white behind it either
// way, the same reasoning def-section.js's non-split defs rely on for the
// Schema page), but at the mobile breakpoint .cols collapses to a single
// column and .end stacks below .start in normal flow - there, an empty
// .end is not invisible, it's a blank padded white box with nothing in
// it. Omitting the element itself avoids that regardless of viewport,
// rather than trying to hide it with a mobile-only media query rule.
//
// Usage:
//   <ds-guide-section>
//     <h3>Adding more entries</h3>
//     <p>Any entry can sit alongside the system entry...</p>
//     <ds-code slot="example" language="yaml">...</ds-code>
//   </ds-guide-section>
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, BASE_RESET } from "./_shared.js";

const GUIDE_SECTION_CSS = `
  ${BASE_RESET}
  /* No :host-level margin/padding by default - .start/.end below carry
     their own vertical padding instead, so consecutive sections' .end
     panels touch with zero gap between them (same mechanism, same
     reasoning, as def-section.js's own .end: that's what makes the
     right-hand column read as one continuous panel instead of a stack of
     separate boxes). */
  :host {
    display: block;
  }

  /* grid-template-columns still reserves both tracks even when .end
     doesn't exist for a given section - .start stays confined to the
     left half either way, which is what keeps text width consistent
     across every section regardless of whether that one has an example. */
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ds-space-8);
    align-items: start;
  }
  .cols .start,
  .cols .end {
    min-width: 0;
    height: 100%;
  }

  .start {
    padding-block: 128px;
  }

  .start  {
    max-width: 65ch;
  }

  .end {
    background: var(--ds-color-bg-inverse);
    padding: 128px var(--ds-space-4);
  }

  /* Stretches the slotted <ds-code> to match .end's own height, which is
     what gives its inner <pre> (position: sticky, see code.js) room to
     actually stick within instead of just sitting at its own natural,
     short height with nowhere to move. Only the last one: a step can slot
     more than one <ds-code> (stacked examples), and stretching every one
     of them to 100% would stack N full-height copies instead of N natural-
     height blocks plus one that fills the leftover space - doubling (or
     worse) .end's real height and bleeding into the next section. */
  ::slotted(ds-code[slot="example"]) {
    display: block;
  }
  ::slotted(ds-code[slot="example"]:last-of-type) {
    height: 100%;
  }

  @media (max-width: 900px) {
    .cols {
      grid-template-columns: 1fr;
    }
    :host {
      padding-block: 96px;
    }
    .end {
      margin-top: var(--ds-space-4);
    }
  }
`;

export class DsGuideSection extends HTMLElement {
  constructor() {
    super();
    this._shadow = createShadow(this, GUIDE_SECTION_CSS);
  }

  connectedCallback() {
    // Mirrors code.js/prop-list.js/spec-nav.js's own note: a blocking
    // <script> in <head> upgrades this element the instant the parser
    // sees its opening tag, before any of its children (in particular,
    // whatever might carry slot="example") have been parsed yet. Waiting
    // for DOMContentLoaded guarantees they're all there before this
    // checks for one.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this._render(), {
        once: true,
      });
    } else {
      this._render();
    }
  }

  _render() {
    const hasExample = this.querySelector('[slot="example"]') !== null;
    this._shadow.innerHTML =
      '<div class="cols">' +
      '<div class="start"><slot></slot></div>' +
      (hasExample ? '<div class="end"><slot name="example"></slot></div>' : "") +
      "</div>";
  }
}
