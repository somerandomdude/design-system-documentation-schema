import { createShadow, esc, escWithCode, BASE_RESET, FONT } from "./_shared.js";

const DEF_SECTION_CSS = `
  ${BASE_RESET}
  /* Padding, not margin - an outer margin would open a gap back to the
     page background between one section and the next, breaking the
     right-hand column's continuous white panel (layout="split" sections
     zero this out entirely below, since .start/.end carry their own
     padding instead - this rule only actually spaces out plain,
     non-split sections, which have no such inner wrapper of their own). */
  :host {
    display: block;
    padding-block: 128px;
  }
  :host(:first-of-type) {
    padding-block-start: 0;
  }
  /* Sticks to the top of the viewport (just under the fixed nav bar)
     while you scroll through this section's own content - property
     tables can run long, so the title stays in view instead of
     scrolling away with the first few lines. The eyebrow (the directory
     a definition's schema file lives in, e.g. "common/") sticks as part
     of the same block, not separately - it's the title's own kicker, so
     it docks and releases together with it rather than scrolling away
     on its own the moment the title starts floating. Works the same
     whether this is a layout="split" section or not: the containing
     block is always this section's own :host, so the block releases
     once this section's content has fully scrolled past, same as any
     sticky header. A solid background keeps scrolled-past text from
     showing through while it's stuck; z-index just needs to clear
     ordinary content, not the nav bar itself (--ds-z-nav, higher). The
     title is sized and weighted large/light on purpose - one definition
     per screenful of scrolling reads better as a real heading than a
     small subhead repeated 36 times down one page. */
  .heading-block {
    position: sticky;
    top: var(--ds-height-nav, 64px);
    z-index: 1;
    background: var(--ds-color-bg);
    padding-block: var(--ds-space-2);
    margin: 0 0 var(--ds-space-2);
    container-type: scroll-state;
  }
  .eyebrow {
    font-family: ${FONT.mono};
    font-size: var(--ds-font-size-sm);
    font-weight: 550;
    color: var(--ds-color-text);
    margin: 0;
  }
  h2 {
    font-family: ${FONT.mono};
    font-size: 2em;
    font-weight: 400;
    color: var(--ds-color-text);
    line-height: 1.2;
    margin: 0;
  }
  /* Docked-state styling: Chrome/Edge only (no @supports fallback, same
     stance as the CSS Custom Highlight API in code.js) - a border only
     appears once the block has actually stuck to the nav bar, not for
     the whole time it's merely sticky-capable, so it reads as "now
     floating over content" rather than a permanent underline. The
     border lives on ::after, not .heading-block itself: a scroll-state
     container query can restyle a *descendant* of its container, but
     not the container element itself (confirmed empirically -
     self-targeting silently never matches, despite being valid,
     parseable syntax) - a pseudo-element still counts as a descendant,
     so it's the smallest fix that doesn't need an extra wrapper div.
     Absolutely positioned so the 1px line doesn't add to the block's
     own flow height when it's not stuck. */
  .heading-block::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    height: 1px;
    background: transparent;
    transition: background-color var(--ds-duration-fast) var(--ds-ease-standard);
  }
  @container scroll-state(stuck: top) {
    .heading-block::after {
      background: var(--ds-color-border);
    }
  }
  /* type-line and desc share one wrapper so the reading-width cap and
     the gap before whatever comes next (a prop table, the slotted
     content) are each stated once, on .meta, instead of repeated on
     both children. */
  .meta {
    margin: 0 0 48px;
    max-width: 65ch;
  }
  .desc {
    color: var(--ds-color-text);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-md);
    line-height: var(--ds-line-height-loose);
    margin: 0;
  }
  /* Plain text, not a badge/pill - "type" and "source" are facts about
     this definition, not a tag someone would filter or click on, so
     they don't get tag-shaped treatment. */
  .type-line {
    font-size: var(--ds-font-size-sm);
    margin: 0 0 var(--ds-space-4);
  }
  .type-line .type {
    font-family: ${FONT.body};
  }

  /* .cols/.start apply to every section, split or not - not just the
     ones with a worked example. A def with no example still needs its
     content (and in particular its own sticky <h2>, below) confined to
     the left half: without this, a plain section's <h2> spans the
     section's full width, and while it's stuck under the nav bar its own
     opaque background (needed so scrolled-past text doesn't show through
     it) paints straight across the right-hand column too, breaking the
     white panel every time a no-example definition's title comes to
     rest. Reserving the right-hand grid track here - even when nothing
     ever renders into it - is what keeps that track clear for
     content__inner's own background (see style.css) to show through. */
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--ds-space-8);
    align-items: start;
  }
  .cols .start,
  .cols .end {
    min-width: 0;
  }

  /* ── layout="split": def content and its worked example side by side ──
     Only the Schema page uses this (one page, every definition, each with
     a real example next to it - see build-site.js's renderDefinition()).
     .end (the example) is the one that stays sticky, not .start (the
     name/description/props) - .start is usually the taller, more-you-
     scroll-the-more-there-is column (a long property table), so pinning
     the shorter example lets it stay in view while you read past it,
     instead of the other way around. align-self: start (not the grid's
     default stretch) keeps .end sized to its own content - height: auto,
     not stretched to match .start's height, which is what sticky
     positioning needs room to stick within in the first place. */
  /* No :host-level padding for split sections - .start/.end below carry
     their own vertical padding instead, so consecutive definitions'
     .end panels touch with zero gap between them (see .end's own
     comment for why that's what makes the right side read as one
     continuous panel instead of a stack of separate boxes). */
  :host([layout="split"]) {
    padding-block: 0;
  }
  :host([layout="split"]) .cols .start,
  :host([layout="split"]) .cols .end {
    height: 100%;
  }
  :host([layout="split"]) .start {
    padding-block: var(--ds-space-16);
  }
  /* Adjacent .end panels sit flush against each other (:host's own
     margin is zeroed above) - each one's background paints all the way
     through its own padding, so the seam between one definition's
     example and the next is just padding, not an actual gap back to the
     page background. That's what makes the whole right-hand column read
     as one continuous panel while still being one <ds-def-section> per
     definition, not a single page-wide element. .end itself doesn't need
     position: sticky - it's already stretched to match .start's height
     (height: 100%, above), leaving no room within its own box to stick
     within. The sticky pin now happens one level deeper, on the <pre>
     inside the slotted <ds-code> (see code.js) - which is why the slot
     below is stretched too: <pre>'s sticky "room to move" comes from its
     containing block being as tall as .end, not from .end itself. */
  :host([layout="split"]) .end {
    background: var(--ds-color-bg-inverse);
    padding: var(--ds-space-16) var(--ds-space-4);
  }
  :host([layout="split"]) ::slotted(ds-code[slot="example"]) {
    display: block;
    height: 100%;
  }

  @media (max-width: 900px) {
    .cols {
      grid-template-columns: 1fr;
    }
    :host([layout="split"]) {
      padding-block: 96px;
    }
    :host([layout="split"]) .end {
      margin-top: var(--ds-space-4);
    }
  }
`;

export class DsDefSection extends HTMLElement {
  static get observedAttributes() {
    return ["name", "anchor", "description", "type", "source", "layout", "eyebrow"];
  }
  constructor() {
    super();
    this._shadow = createShadow(this, DEF_SECTION_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }
  _render() {
    var name = this.getAttribute("name") || "";
    var anchor =
      this.getAttribute("anchor") ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    var desc = this.getAttribute("description") || "";
    var type = this.getAttribute("type") || "";
    var source = this.getAttribute("source") || "";
    var layout = this.getAttribute("layout") || "";
    var eyebrow = this.getAttribute("eyebrow") || "";
    // Set id on host for TOC linking
    if (anchor) this.id = anchor;

    // Eyebrow and title dock together as one sticky block - see
    // .heading-block's own CSS comment.
    var headingBlock = eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + "</p>" : "";
    headingBlock += '<h2 id="' + esc(anchor) + '">' + esc(name) + "</h2>";
    var start = '<div class="heading-block">' + headingBlock + "</div>";
    // type and source share one line, separated by a middle dot, instead of
    // type living here and source living in a separate "References:"-labeled
    // line further down. type-line and desc then share one wrapping div -
    // see .meta's own CSS comment.
    var metaHtml = "";
    if (type || source) {
      metaHtml += '<p class="type-line">';
      if (type) metaHtml += '<span class="type">' + esc(type) + "</span>";
      if (type && source) metaHtml += " · ";
      if (source) metaHtml += "<ds-code inline>" + esc(source) + "</ds-code>";
      metaHtml += "</p>";
    }
    // Use escWithCode so CommonMark-style `inline code` spans in the
    // description render as <ds-code inline> rather than literal
    // backtick characters.
    if (desc) metaHtml += '<p class="desc">' + escWithCode(desc) + "</p>";
    if (metaHtml) start += '<div class="meta">' + metaHtml + "</div>";
    start += "<slot></slot>";

    // .cols/.start wrap every section, not just layout="split" ones - see
    // .cols's own CSS comment for why a def with no example still needs
    // its content (in particular its sticky <h2>) confined to the left
    // half instead of spanning the full width.
    var html =
      '<div class="cols">' +
      '<div class="start">' +
      start +
      "</div>" +
      (layout === "split"
        ? '<div class="end"><slot name="example"></slot></div>'
        : "") +
      "</div>";
    this._shadow.innerHTML = html;
  }
}
