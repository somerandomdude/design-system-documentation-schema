(function () {
  "use strict";

  // ── _shared.js ──
  function createShadow(el, css, mode) {
    const shadow = el.attachShadow({ mode: mode || "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
    return shadow;
  }

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * HTML-escape `s`, but also convert CommonMark-style backtick inline-code
   * spans (`like-this`) into <ds-code inline> elements. The full markdown
   * grammar is out of scope; we only handle the one construct that
   * appears in DSDS schema descriptions, where contributors refer to
   * field names and code fragments inline.
   *
   * Closing backticks must appear on the same line as the opening one; an
   * unmatched ` falls through as a literal character.
   */
  function escWithCode(s) {
    if (s == null) return "";
    const parts = String(s).split(/(`[^`\n]+`)/g);
    return parts
      .map((p) => {
        if (p.length >= 2 && p.startsWith("`") && p.endsWith("`")) {
          return `<ds-code inline>${esc(p.slice(1, -1))}</ds-code>`;
        }
        return esc(p);
      })
      .join("");
  }

  const BASE_RESET = `
    :host { display: inline-block; box-sizing: border-box; }
    :host([hidden]) { display: none !important; }
    *, *::before, *::after { box-sizing: border-box; }
  `;

  const FONT = {
    body: "var(--ds-font-body)",
    mono: "var(--ds-font-mono)",
  };

  // ── code.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-code>
  //
  // Attributes:
  //   language — optional language label (e.g. "json", "bash")
  //   label   — optional label shown in top-right corner
  //   inline  — boolean, renders as inline <code> instead of block
  //
  // Content:
  //   Text content inside the element is rendered as code.
  //   For JSON content, set language="json" for syntax highlighting.
  // ═══════════════════════════════════════════════════════════════════════════

  const CODE_CSS = `
    ${BASE_RESET}
    :host { display: block; }
    :host([inline]) { display: inline; }

    /* ── Block mode ──────────────────────────────────────── */
    .wrapper {
      position: relative;
      overflow: hidden;
      background: var(--ds-color-bg-raised);
      inset: calc(var(--ds-space-4) * -1);
      top: 0;
      width: calc( 100% + (var(--ds-space-4) * 2));
    }
    .wrapper pre { color: var(--ds-color-text); }
    .wrapper .hl-k { color: var(--ds-syntax-light-key); }
    .wrapper .hl-s { color: var(--ds-syntax-light-string); }
    .wrapper .hl-n { color: var(--ds-syntax-light-number); }
    .wrapper .hl-b { color: var(--ds-syntax-light-bool); }

    ds-badge[part="label"] {
      position: absolute;
      top: var(--ds-space-2);
      right: var(--ds-space-2);
    }

    pre {
      margin: 0;
      padding: var(--ds-space-4) var(--ds-space-4);
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-base);
      line-height: var(--ds-line-height-loose);
      overflow-x: auto;
      white-space: pre;
    }

    code {
      font-family: inherit;
      font-size: inherit;
      background: none;
      padding: 0;
    }

    /* ── Inline mode ─────────────────────────────────────── */
    .inline-code {
      font-family: ${FONT.mono};
      font-size: 0.875em;
      background: var(--ds-color-bg-raised);
      color: var(--ds-color-text);
      padding: 1px 5px;
    }
  `;

  class DsCode extends HTMLElement {
    static get observedAttributes() {
      return ["language", "label", "inline"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, CODE_CSS);
    }

    connectedCallback() {
      // Defer render to ensure the browser has finished parsing the
      // element's inner text content. When the custom element is
      // defined synchronously, connectedCallback fires as soon as the
      // opening tag is parsed — before child text nodes exist.
      var self = this;
      requestAnimationFrame(function () {
        self._render();
      });
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }

    _render() {
      // ── Inline mode: render as a styled <code> span ──────────
      if (this.hasAttribute("inline")) {
        var raw = this.textContent || "";
        this._shadow.innerHTML =
          '<code class="inline-code" part="code">' + esc(raw) + "</code>";
        return;
      }

      // ── Block mode: render as <pre><code> with syntax highlighting ──
      const label =
        this.getAttribute("label") || this.getAttribute("language") || "";
      const lang = this.getAttribute("language") || "";
      const rawBlock = this.textContent || "";

      let highlighted = esc(rawBlock.trim());

      if (lang === "json") {
        highlighted = highlighted.replace(
          /(&quot;(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\&])*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g,
          function (m) {
            let cls = "hl-n";
            if (/^&quot;/.test(m)) {
              cls = /:$/.test(m) ? "hl-k" : "hl-s";
            } else if (/true|false/.test(m)) {
              cls = "hl-b";
            } else if (/null/.test(m)) {
              cls = "hl-b";
            }
            return '<span class="' + cls + '">' + m + "</span>";
          },
        );
      }

      const labelHtml = label
        ? `<ds-badge size="sm" part="label">${esc(label)}</ds-badge>`
        : "";

      this._shadow.innerHTML = `
        <div class="wrapper" part="wrapper">
          ${labelHtml}
          <pre part="pre"><code part="code">${highlighted}</code></pre>
        </div>
      `;
    }
  }

  // ── badge.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-badge>
  //
  // Attributes:
  //   variant — "kind" | "experimental" | (default: neutral)
  //
  // Content:
  //   Text label inside the element.
  // ═══════════════════════════════════════════════════════════════════════════

  const BADGE_CSS = `
    ${BASE_RESET}
    :host { display: inline-flex; vertical-align: middle; }

    .badge {
      display: inline-flex;
      font-family: ${FONT.body};
      text-transform: none;
      white-space: nowrap;
      align-items: center;
      height: 24px;
      padding: 0 1em;
      font-size: .75em;
    }

    /* Used by <ds-def-section>'s type badge */
    .badge--kind         { background: var(--ds-color-info-bg); color: var(--ds-color-info-text); }
    /* Used by <ds-prop-table>'s "at least one" conditional marker */
    .badge--experimental { background: var(--ds-color-warning-bg); color: var(--ds-color-warning-text); }

    /* Default / neutral */
    .badge--neutral {
      background: var(--ds-color-inverse);
      color: var(--ds-color-text);
    }
  `;

  class DsBadge extends HTMLElement {
    static get observedAttributes() {
      return ["variant"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, BADGE_CSS);
      this._shadow.innerHTML = `<span class="badge" part="badge"><slot></slot></span>`;
    }

    connectedCallback() {
      this._updateClass();
    }

    attributeChangedCallback() {
      this._updateClass();
    }

    _updateClass() {
      const variant = this.getAttribute("variant") || "neutral";
      const el = this._shadow.querySelector(".badge");
      if (el) {
        el.className = "badge badge--" + variant;
      }
    }
  }

  // ── table.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-table>
  //
  // A styled table wrapper that accepts a slotted <table> element.
  // All styling is encapsulated in shadow DOM — the slotted table inherits
  // consistent typography, spacing, borders, and responsive overflow.
  //
  // The header row sticks to the top of the viewport as the page scrolls past
  // a tall table. Below 900px wide, wide tables get a horizontal scrollbar
  // instead — a wrapper that scrolls horizontally unavoidably captures the
  // vertical axis too (browsers force overflow-y to "auto" the moment
  // overflow-x isn't "visible"), which re-scopes position:sticky to that
  // wrapper's own scrolling instead of the page's, so the two features can't
  // both apply to the same table at the same time. Page-scroll stickiness is
  // the more useful default; the horizontal-scroll fallback only kicks in
  // where a wide table would otherwise clip content.
  //
  // Usage:
  //   <ds-table>
  //     <table>
  //       <thead><tr><th>Name</th><th>Type</th></tr></thead>
  //       <tbody>
  //         <tr><td>kind</td><td>string</td></tr>
  //       </tbody>
  //     </table>
  //   </ds-table>
  // ═══════════════════════════════════════════════════════════════════════════

  const TABLE_CSS = `
    ${BASE_RESET}
    :host { display: block; margin: var(--ds-space-4) 0; }

    /* No overflow set here by default: leaving both axes "visible" means this
       wrapper is NOT a scroll container, so the th's position:sticky (below)
       sticks relative to the page as it scrolls — see the file header comment
       for why that's mutually exclusive with a horizontal-scroll wrapper.
       Below 900px, wide tables get a horizontal scrollbar instead (sacrificing
       the sticky header there) so content doesn't clip on narrow screens. */
    @media (max-width: 900px) {
      .table-wrap {
        overflow-x: auto;
      }
    }

    /* Style the slotted <table> and its descendants via ::slotted
       and CSS inheritance. Since ::slotted only targets direct children
       of <slot>, we use the table itself as the styling hook and rely
       on inheritance + the component's font/color context for cells. */
    ::slotted(table) {
      width: 100%;
      /* separate + zero spacing (not collapse) so the sticky header's cells
         keep their background/position correctly in Safari, which has long-
         standing bugs with position:sticky inside a border-collapsed table. */
      border-collapse: separate;
      border-spacing: 0;
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text);
    }
  `;

  /* Supplementary light-DOM styles for table internals (th, td, code)
     that ::slotted cannot reach. Injected once into the document head. */
  const TABLE_LIGHT_DOM_ID = "ds-table-light-styles";

  function ensureTableLightStyles() {
    if (document.getElementById(TABLE_LIGHT_DOM_ID)) return;
    var style = document.createElement("style");
    style.id = TABLE_LIGHT_DOM_ID;
    style.textContent = [
      "ds-table table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--ds-font-size-base); }",
      "ds-table thead { background: var(--ds-color-bg); }",
      "ds-table th {",
      "  text-align: left; font-weight: var(--ds-font-weight-bold); font-size: var(--ds-font-size-sm);",
      "  text-transform: none; letter-spacing: var(--ds-tracking-wide);",
      "  color: var(--ds-color-text);",
      "  padding: var(--ds-space-2) var(--ds-space-2);",
      "  white-space: nowrap;",
      "  position: sticky;",
      "  top: 0;",
      "  z-index: var(--ds-z-base, 1);",
      "  background: var(--ds-color-bg);",
      "}",
      "ds-table td {",
      "  padding: var(--ds-space-4) var(--ds-space-2);",
      "  vertical-align: top; line-height: var(--ds-line-height-relaxed);",
      "}",
      "ds-table tr:last-child td { border-bottom: none; }",
      "ds-table a { color: var(--ds-color-accent); }",
      "ds-table td:first-child { white-space: nowrap; }",
      "ds-table td:first-child ds-code[inline] { white-space: nowrap; }",
    ].join("\n");
    document.head.appendChild(style);
  }

  class DsTable extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, TABLE_CSS);
      this._shadow.innerHTML =
        '<div class="table-wrap" part="wrapper"><slot></slot></div>';
    }

    connectedCallback() {
      ensureTableLightStyles();
    }
  }

  // ── heading.js ──
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

  const HEADING_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .heading {
      display: block;
      color: var(--ds-color-text);
      font-family: var(--ds-font-mono);
      line-height: var(--ds-line-height-snug);
    }

    .heading--1 { font-size: var(--ds-font-size-xl); font-weight: var(--ds-font-weight-bold); margin: 0 0 var(--ds-space-4); }
    .heading--2 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-8) 0 var(--ds-space-2); }
    .heading--3 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-8) 0 var(--ds-space-2); }
    .heading--4 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
    .heading--5 { font-size: var(--ds-font-size-base); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
    .heading--6 { font-size: var(--ds-font-size-base); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-2) 0 var(--ds-space-2); color: var(--ds-color-text); }

    .anchor-link {
      display: inline;
      opacity: 0;
      margin-left: var(--ds-space-2);
      color: var(--ds-color-text);
      text-decoration: none;
      font-size: 0.75em;
      vertical-align: baseline;
    }
    .heading:hover .anchor-link { opacity: 0.6; }
    .anchor-link:hover { opacity: 1 !important; }
  `;

  class DsHeading extends HTMLElement {
    static get observedAttributes() {
      return ["level", "anchor"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, HEADING_CSS);
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
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

  // ── back-to-top.js ──
  const BACK_TO_TOP_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    a {
      display: inline-block;
      margin-top: var(--ds-space-8);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text);
      text-decoration: none;
    }

    a:hover {
      color: var(--ds-color-accent);
    }
  `;

  class DsBackToTop extends HTMLElement {
    static get observedAttributes() {
      return ["label", "href"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, BACK_TO_TOP_CSS);
      this._render();
    }

    attributeChangedCallback() {
      this._render();
    }

    _render() {
      var label = this.getAttribute("label") || "\u2191 Back to top";
      var href = this.getAttribute("href") || "#";
      this._shadow.innerHTML =
        '<a href="' + esc(href) + '" part="link">' + esc(label) + "</a>";
    }
  }

  // ── header.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-header>
  //
  // The page header block, used at the top of every page: a title, an optional
  // description, and an optional source path (for schema-reference pages).
  //
  // Attributes:
  //   title       — page title (rendered as the h1)
  //   description — optional lead paragraph (supports inline `code`)
  //   source      — optional source path shown as "Source: <code>" (schema pages)
  //
  // Slots:
  //   (default) — extra inline content next to the title (e.g. a status badge)
  // ═══════════════════════════════════════════════════════════════════════════

  const HEADER_CSS = `
    ${BASE_RESET}
    :host { display: flex; flex-direction: column; margin-bottom: var(--ds-space-8); min-height: 100vh; background: var(--ds-color-bg-accent); justify-content: end; padding-left: var(--ds-width-nav); }

    @media (max-width: 900px) {
    :host {
    padding-left:0;
    }
    }

    h1 {
      font-size: 4em;
      font-family: ${FONT.mono};
      font-weight: 500;
      line-height: 1.1;
      letter-spacing: -0.025em;
      margin: 0 0 var(--ds-space-4);
      color: var(--ds-color-text);
    }
    .header-container {
      max-width: var(--ds-width-content);
      margin: 0 auto;
      padding: var(--ds-space-8) var(--ds-space-8);
      width: 100%;
    }

    .desc {
      color: var(--ds-color-text);
      font-family: ${FONT.body};
      margin: 0 0 var(--ds-space-4);
      max-width: 65ch;
      font-size: 22px;
      line-height: 1.4;
      font-weight: 450;
    }
    .source {
      font-size: var(--ds-font-size-sm);
      margin: 0 0 var(--ds-space-8);
      display: none;
    }
  `;

  class DsHeader extends HTMLElement {
    static get observedAttributes() {
      return ["title", "description", "source"];
    }
    constructor() {
      super();
      this._shadow = createShadow(this, HEADER_CSS);
    }
    connectedCallback() {
      this._render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }
    _render() {
      var t = this.getAttribute("title") || "";
      var d = this.getAttribute("description") || "";
      var s = this.getAttribute("source") || "";
      var html = `<div class="header-container"><h1>${esc(t)}<slot></slot></h1>`;
      if (s)
        html +=
          '<p class="source">Source: <ds-code inline>' +
          esc(s) +
          "</ds-code></p>";
      // Use escWithCode so backtick inline-code spans in the description
      // render as <ds-code inline> rather than literal `backticks`.
      if (d) html += '<p class="desc">' + escWithCode(d) + "</p>";
      html += "</div>";

      this._shadow.innerHTML = html;
    }
  }

  // ── def-section.js ──
  const DEF_SECTION_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin: 64px 0 64px;
    }
    :host(:first-of-type) {
      margin-top: 0;
    }
    h3 {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-lg);
      font-weight: var(--ds-font-weight-bold);
      color: var(--ds-color-text);
      margin: 0 0 var(--ds-space-2);
    }
    .desc {
      color: var(--ds-color-text);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      line-height: var(--ds-line-height-loose);
      margin: 0 0 var(--ds-space-4);
    }
    .type-line { margin: 0 0 var(--ds-space-4); }
  `;

  class DsDefSection extends HTMLElement {
    static get observedAttributes() {
      return ["name", "anchor", "description", "type"];
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
      // Set id on host for TOC linking
      if (anchor) this.id = anchor;
      var html = '<h3 id="' + esc(anchor) + '">' + esc(name) + "</h3>";
      if (type)
        html +=
          '<p class="type-line"><ds-badge variant="kind" size="sm">' +
          esc(type) +
          "</ds-badge></p>";
      // Use escWithCode so CommonMark-style `inline code` spans in the
      // description render as <ds-code inline> rather than literal
      // backtick characters.
      if (desc) html += '<p class="desc">' + escWithCode(desc) + "</p>";
      html += "<slot></slot>";
      this._shadow.innerHTML = html;
    }
  }

  // ── type-ref.js ──
  const TYPE_REF_CSS = `
    ${BASE_RESET}
    :host { display: inline; }
    a {
      font-family: ${FONT.mono};
      font-size: inherit;
      color: inherit;
      text-decoration-style: dashed;
      text-decoration-thickness: .125em;
      text-underline-offset: .25rem;
    }

  `;

  class DsTypeRef extends HTMLElement {
    static get observedAttributes() {
      return ["href"];
    }
    constructor() {
      super();
      this._shadow = createShadow(this, TYPE_REF_CSS);
    }
    connectedCallback() {
      var self = this;
      requestAnimationFrame(function () {
        self._render();
      });
    }
    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }
    _render() {
      var href = this.getAttribute("href") || "#";
      var text = this.textContent.trim();
      this._shadow.innerHTML =
        '<a href="' + esc(href) + '" part="link">' + esc(text) + "</a>";
    }
  }

  // ── cross-refs.js ──
  const CROSS_REFS_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text);
      margin-top: var(--ds-space-4);
    }
    ::slotted(a) {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-base);
    }
  `;

  class DsCrossRefs extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, CROSS_REFS_CSS);
      this._shadow.innerHTML = '<div part="refs"><slot></slot></div>';
    }
  }

  // ── def-index.js ──
  const DEF_INDEX_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin-bottom: var(--ds-space-8);
    }
    nav {
      background: var(--ds-color-bg-subtle);
      padding: var(--ds-space-4) var(--ds-space-4);
    }
    ::slotted(p) {
      margin-bottom: var(--ds-space-2);
      font-size: var(--ds-font-size-base);
    }
    ::slotted(ul) {
      list-style: none;
      list-style-type: none;
      padding: 0;
      margin: 0;
      column-count: 2;
      column-gap: var(--ds-space-8);
    }

    @media (max-width: 600px) {
      ::slotted(ul) {
        column-count: 1;
      }
    }
  `;

  /* Light-DOM styles for list items and links inside <ds-def-index>,
     because ::slotted only reaches direct children, not nested <li>/<a>. */
  const DEF_INDEX_LIGHT_ID = "ds-def-index-light-styles";
  function ensureDefIndexLightStyles() {
    if (document.getElementById(DEF_INDEX_LIGHT_ID)) return;
    var s = document.createElement("style");
    s.id = DEF_INDEX_LIGHT_ID;
    s.textContent = [
      "ds-def-index ul { padding-left: 0 !important; margin-left: 0 !important; list-style: none !important; }",
      "ds-def-index li { margin-bottom: var(--ds-space-1); font-size: var(--ds-font-size-base); break-inside: avoid; padding-left: 0; }",
      "ds-def-index li a { font-family: var(--ds-font-mono); }",
    ].join("\n");
    document.head.appendChild(s);
  }

  class DsDefIndex extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, DEF_INDEX_CSS);
      this._shadow.innerHTML = '<nav part="nav"><slot></slot></nav>';
    }
    connectedCallback() {
      ensureDefIndexLightStyles();
    }
  }

  // ── def-example.js ──
  const DEF_EXAMPLE_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin-top: var(--ds-space-4);
      margin-bottom: var(--ds-space-4);
    }
  `;

  class DsDefExample extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, DEF_EXAMPLE_CSS);
      this._shadow.innerHTML = "<slot></slot>";
    }
  }

  // ── prop-table.js ──
  const PROP_TABLE_CSS = `
    ${BASE_RESET}
    :host { display: block; margin: var(--ds-space-4) 0; max-width: 100%; }

    /* Horizontal-scroll wrapper. The property/type/required columns are
       shrink-to-fit with nowrap content, so the table has a hard minimum
       width (~500px). On narrow viewports that minimum exceeds the host,
       and without a scroller the rightmost column (Description) is clipped
       off-screen with no way to reach it. overflow-x: auto lets the table
       scroll instead of losing its Description column. Mirrors <ds-table>.

       No overflow is set by default (only below 900px, see the media query
       near the bottom): leaving both axes visible means this wrapper isn't a
       scroll container, so the sticky header below sticks relative to the
       PAGE as it scrolls. A wrapper that scrolls horizontally unavoidably
       captures the vertical axis too (browsers force overflow-y to "auto" the
       moment overflow-x isn't "visible"), which re-scopes position:sticky to
       the wrapper's own scrolling instead of the page's — the two can't both
       apply to the same table at once. Page-scroll stickiness is the more
       useful default; the horizontal-scroll fallback only kicks in on narrow
       viewports, where a wide table would otherwise clip content. */
    .table-scroll { max-width: 100%; }

    table {
      width: 100%;
      max-width: 100%;
      /* separate + zero spacing (not collapse) so the sticky header's cells
         keep their background/position correctly in Safari, which has long-
         standing bugs with position:sticky inside a border-collapsed table. */
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: var(--ds-space-8);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      position: relative;
      inset: calc(var(--ds-space-2) * -1);
      width: calc(100% + (var(--ds-space-2) * 2));
      max-width: calc(100% + (var(--ds-space-2) * 2));
      top: 0;
      bottom: 0;
    }

    th {
      text-align: left;
      font-weight: var(--ds-font-weight-bold);
      font-size: var(--ds-font-size-sm);
      text-transform: none;
      letter-spacing: var(--ds-tracking-wide);
      color: var(--ds-color-text);
      padding: var(--ds-space-2) var(--ds-space-2);
      background: var(--ds-color-bg-raised);
      white-space: nowrap;
      position: sticky;
      top: 0;
      z-index: var(--ds-z-base, 1);
    }

    @media (max-width: 900px) {
      .table-scroll { overflow-x: auto; }
    }
  /*
    th:first-child, td:first-child {
    padding-left:0
    }

    th:last-child, td:last-child {
    padding-right:0
    }
    */

    td {
      padding: var(--ds-space-4) var(--ds-space-2);
      vertical-align: top;
      line-height: 1.5;
    }

    tr:first-child td {
    padding-top: var(--ds-space-2);
    }

    tr:last-child td {
      border-bottom: none;
    }

    /* Column sizing: cols 1, 3 shrink to fit; col 2 (Type) shrinks to fit but is allowed
       to wrap when its content is a long union (e.g., the kind enum on guidelineEntry).
       Col 4 (Description) gets the remaining space.

       Property names (col 1) MUST never truncate — 'white-space: nowrap' plus the
       'width: 1%' shrink-to-fit trick lets the column grow to fit the longest
       property name without clipping. Required (col 3) is also nowrap since its
       content is always a single short word.

       Type (col 2) is intentionally NOT nowrap. Some kind-enum types render as a
       long pipe-separated list of inline code values (e.g., "required" |
       "encouraged" | "informational" | "discouraged" | "prohibited"). Forcing
       nowrap on that pushed Description down to ~0 width and made each row very
       tall. Allowing the type to wrap at its natural space-pipe-space boundaries
       keeps the Description column wide enough to read. Short types like
       'boolean' and 'string' still render on one line because the column shrinks
       to fit. */
    th:nth-child(1), td:nth-child(1) { width: 1%; white-space: nowrap; }
    th:nth-child(2), td:nth-child(2) { width: 1%; }
    th:nth-child(3), td:nth-child(3) { width: 1%; white-space: nowrap; }
    th:nth-child(4), td:nth-child(4) { width: auto; overflow-wrap: break-word; word-break: break-word; }

    /* The 'th' selector earlier sets 'white-space: nowrap' on every header cell.
       For column 2 specifically, override that so the "Type" header still reads
       naturally (it's one word, but be explicit about the policy). */
    th:nth-child(2) { white-space: normal; }

    /* Column 1: Property name — monospace, bold */
    td:nth-child(1) code {
      font-family: ${FONT.mono};
      font-weight: var(--ds-font-weight-bold);
      color: var(--ds-color-text);
      white-space: nowrap;
      font-size: var(--ds-font-size-base);
      background: none;
      padding: 0;
    }

    /* Column 2: Type — monospace, muted */
    td:nth-child(2) {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-sm);
    }

    /* Column 3: Required — narrow, a checkmark when required */
    td:nth-child(3) {
      font-size: var(--ds-font-size-sm);
    }
    td:nth-child(3) .req {
      font-weight: var(--ds-font-weight-bold);
    }

    /* Column 4: Description — gets all remaining space */
    td:nth-child(4) {
      font-size: var(--ds-font-size-base);
    }

    td:nth-child(4) small {
      display: block;
      margin-top: var(--ds-space-1);
      color: var(--ds-color-text);
      font-size: var(--ds-font-size-sm);
    }

    td:nth-child(4) code {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-base);
      background: var(--ds-color-bg-muted);
      padding: 1px 5px;
    }

    /* Type reference links inside cells */
    a.type-ref {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-accent);
      text-decoration: none;
      border-bottom: 1px dashed var(--ds-color-accent);
    }

    a.type-ref:hover {
      color: var(--ds-color-accent-hover);
      border-bottom-style: solid;
    }
  `;

  class DsPropTable extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, PROP_TABLE_CSS);
    }

    connectedCallback() {
      // Defer to let child <ds-prop> elements parse
      var self = this;
      requestAnimationFrame(function () {
        self._render();
      });
    }

    _render() {
      var props = Array.from(this.querySelectorAll("ds-prop"));
      if (props.length === 0) {
        this._shadow.innerHTML = "";
        return;
      }

      // Sort: required (0) → conditional (1) → optional (2)
      props.sort(function (a, b) {
        var oa = a.hasAttribute("required")
          ? 0
          : a.hasAttribute("conditional")
            ? 1
            : 2;
        var ob = b.hasAttribute("required")
          ? 0
          : b.hasAttribute("conditional")
            ? 1
            : 2;
        return oa - ob;
      });

      var trs = props
        .map(function (prop) {
          var name = prop.getAttribute("name") || "";
          var type = prop.getAttribute("type") || "";
          var desc = prop.innerHTML.trim();

          var statusCell;
          if (prop.hasAttribute("required")) {
            statusCell =
              '<span class="req" title="Required" aria-label="Required">✓</span>';
          } else if (prop.hasAttribute("conditional")) {
            statusCell =
              '<ds-badge variant="experimental">at least one</ds-badge>';
          } else {
            statusCell = "";
          }

          return (
            "<tr>" +
            "<td><code>" +
            esc(name) +
            "</code></td>" +
            "<td>" +
            type +
            "</td>" +
            "<td>" +
            statusCell +
            "</td>" +
            "<td>" +
            desc +
            "</td>" +
            "</tr>"
          );
        })
        .join("\n");

      this._shadow.innerHTML =
        '<div class="table-scroll" part="wrapper">' +
        '<table part="table">' +
        "<thead><tr><th>Property</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>" +
        "<tbody>" +
        trs +
        "</tbody></table>" +
        "</div>";
    }
  }

  // <ds-prop> — declarative property row (child of <ds-prop-table>)
  // Attributes: name, type, required (boolean), conditional (boolean)
  // Content: description (innerHTML, supports rich HTML)
  class DsProp extends HTMLElement {
    constructor() {
      super();
    }
  }

  // ── spec-nav.js ──
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

  const ICON_MENU =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  const ICON_CLOSE =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';

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
      inset: 1em;
      color: var(--ds-color-text);
      padding: 0;
      font-family: ${FONT.body};
      -webkit-overflow-scrolling: touch;
      display: flex;
      flex-direction: column;
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
      gap: 8px;
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
      border-left: var(--ds-border-width) solid transparent;
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
      border-left: var(--ds-border-width) solid transparent;
      color: var(--ds-color-nav-group);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-bold);
      letter-spacing: 0;
      text-transform: none;
      cursor: default;
      text-align: left;
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
      padding-left: var(--ds-space-4);
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

  class DsSpecNav extends HTMLElement {
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
          '"><span class="nav__menu-icon">' +
          (isOpen ? ICON_CLOSE : ICON_MENU) +
          "</span></button>" +
          '<a href="' +
          esc(titleHref) +
          '"><ds-logo class="nav__logo" size="2rem" fill="#fff"></ds-logo><span>' +
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
    }

    _syncMenuButton() {
      const isOpen = this.open;
      const btn = this._shadow.querySelector(".nav__menu-btn");
      const icon = this._shadow.querySelector(".nav__menu-icon");
      if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (icon) icon.innerHTML = isOpen ? ICON_CLOSE : ICON_MENU;
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

  // ── callout.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-callout>
  //
  // A callout / info box: an accent left border with a subtle tinted background.
  //
  // Attributes:
  //   variant — "info" | "tip" | "warning" (default: "info")
  //
  // Slots:
  //   (default) — callout content (may include <strong>, links, lists, etc.)
  //
  // Usage:
  //   <ds-callout>
  //     <strong>Key idea:</strong> Some important information here.
  //   </ds-callout>
  //
  //   <ds-callout variant="tip">
  //     <strong>Tip:</strong> A helpful suggestion.
  //   </ds-callout>
  // ═══════════════════════════════════════════════════════════════════════════

  const CALLOUT_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .callout {
      border-left: var(--ds-border-width) solid var(--ds-color-accent);
      background: var(--ds-color-accent-subtle);
      padding: var(--ds-space-2) var(--ds-space-4);
      margin: var(--ds-space-2) 0 var(--ds-space-8);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      line-height: var(--ds-line-height-loose);
      color: var(--ds-color-text);
    }

    .callout--warning {
      border-left-color: var(--ds-color-warning-text);
      background: var(--ds-color-note-warning-bg);
    }

    .callout--tip {
      border-left-color: var(--ds-color-encouraged-text);
      background: var(--ds-color-encouraged-bg);
    }

    ::slotted(strong) {
      color: var(--ds-color-accent);
    }

    :host([variant="warning"]) ::slotted(strong) {
      color: var(--ds-color-warning-text);
    }

    :host([variant="tip"]) ::slotted(strong) {
      color: var(--ds-color-encouraged-text);
    }

    ::slotted(ol),
    ::slotted(ul) {
      margin: var(--ds-space-2) 0 0;
      padding-left: var(--ds-space-4);
    }

    ::slotted(a) {
      color: var(--ds-color-accent);
      text-decoration-thickness: 1px;
      text-underline-offset: 2px;
    }
  `;

  class DsCallout extends HTMLElement {
    static get observedAttributes() {
      return ["variant"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, CALLOUT_CSS);
      this._shadow.innerHTML =
        '<div class="callout" part="callout"><slot></slot></div>';
    }

    connectedCallback() {
      this._updateVariant();
    }

    attributeChangedCallback() {
      this._updateVariant();
    }

    _updateVariant() {
      const variant = this.getAttribute("variant") || "info";
      const el = this._shadow.querySelector(".callout");
      if (el) {
        el.className = "callout callout--" + variant;
      }
    }
  }

  // ── tag.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-tag>
  //
  // A pill-shaped tag for keyword and category labels.
  //
  // Slots:
  //   (default) — tag label text
  //
  // Usage:
  //   <ds-tag>color</ds-tag>
  // ═══════════════════════════════════════════════════════════════════════════

  const TAG_CSS = `
    ${BASE_RESET}
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      font-family: ${FONT.body};
      font-weight: var(--ds-font-weight-bold);
      font-size: var(--ds-font-size-sm);
      line-height: 1;
      color: var(--ds-color-text);
      background: var(--ds-color-bg-subtle);
      border: var(--ds-border-width) solid var(--ds-color-border-light);
      padding: 2px var(--ds-space-1);
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  class DsTag extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, TAG_CSS);
      this._shadow.innerHTML =
        '<span class="tag" part="tag"><slot></slot></span>';
    }
  }

  // ── logo.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-logo>
  //
  // The DSDS mark, inlined as SVG so its fill can be recolored at runtime.
  //
  // Attributes:
  //   size       — width/height, any CSS length (default: 40px)
  //   background — host background color (default: transparent)
  //   fill       — SVG fill color (default: var(--ds-color-text))
  //
  // Usage:
  //   <ds-logo></ds-logo>
  //   <ds-logo size="24px" fill="#fff" background="#0055b3"></ds-logo>
  // ═══════════════════════════════════════════════════════════════════════════

  const LOGO_SVG = `
    <svg viewBox="0 0 1550 1550" fill="none" xmlns="http://www.w3.org/2000/svg" part="svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H1550V1550H0V0ZM75 75V1475H1475V75H75Z"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M575 300H300V650H575C616.421 650 650 616.421 650 575V375C650 333.579 616.421 300 575 300ZM225 225V725H575C657.843 725 725 657.843 725 575V375C725 292.157 657.843 225 575 225H225Z"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M825 368.75C825 289.359 889.359 225 968.75 225H1181.25C1260.64 225 1325 289.359 1325 368.75H1250C1250 330.78 1219.22 300 1181.25 300H968.75C930.78 300 900 330.78 900 368.75C900 406.72 930.78 437.5 968.75 437.5H1181.25C1260.64 437.5 1325 501.859 1325 581.25C1325 660.641 1260.64 725 1181.25 725H968.75C889.359 725 825 660.641 825 581.25H900C900 619.22 930.78 650 968.75 650H1181.25C1219.22 650 1250 619.22 1250 581.25C1250 543.28 1219.22 512.5 1181.25 512.5H968.75C889.359 512.5 825 448.141 825 368.75Z"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M575 900H300V1250H575C616.421 1250 650 1216.42 650 1175V975C650 933.579 616.421 900 575 900ZM225 825V1325H575C657.843 1325 725 1257.84 725 1175V975C725 892.157 657.843 825 575 825H225Z"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M825 968.75C825 889.359 889.359 825 968.75 825H1181.25C1260.64 825 1325 889.359 1325 968.75H1250C1250 930.78 1219.22 900 1181.25 900H968.75C930.78 900 900 930.78 900 968.75C900 1006.72 930.78 1037.5 968.75 1037.5H1181.25C1260.64 1037.5 1325 1101.86 1325 1181.25C1325 1260.64 1260.64 1325 1181.25 1325H968.75C889.359 1325 825 1260.64 825 1181.25H900C900 1219.22 930.78 1250 968.75 1250H1181.25C1219.22 1250 1250 1219.22 1250 1181.25C1250 1143.28 1219.22 1112.5 1181.25 1112.5H968.75C889.359 1112.5 825 1048.14 825 968.75Z"/>
    </svg>
  `;

  const LOGO_CSS = `
    ${BASE_RESET}
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--logo-size, 40px);
      height: var(--logo-size, 40px);
      background: var(--logo-bg, transparent);
      line-height: 0;
      aspect-ratio: 1/1;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    svg path {
      fill: var(--logo-fill, var(--ds-color-text));
    }
  `;

  class DsLogo extends HTMLElement {
    static get observedAttributes() {
      return ["size", "background", "fill"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, LOGO_CSS);
      this._shadow.innerHTML = LOGO_SVG;
    }

    connectedCallback() {
      this._sync();
    }

    attributeChangedCallback() {
      if (this.isConnected) this._sync();
    }

    _sync() {
      const size = this.getAttribute("size");
      const background = this.getAttribute("background");
      const fill = this.getAttribute("fill");

      if (size) this.style.setProperty("--logo-size", size);
      else this.style.removeProperty("--logo-size");

      if (background) this.style.setProperty("--logo-bg", background);
      else this.style.removeProperty("--logo-bg");

      if (fill) this.style.setProperty("--logo-fill", fill);
      else this.style.removeProperty("--logo-fill");
    }
  }

  // ── Registration ──
  const registry = [
    ["ds-code", DsCode],
    ["ds-badge", DsBadge],
    ["ds-table", DsTable],
    ["ds-heading", DsHeading],
    ["ds-back-to-top", DsBackToTop],
    ["ds-header", DsHeader],
    ["ds-def-section", DsDefSection],
    ["ds-type-ref", DsTypeRef],
    ["ds-cross-refs", DsCrossRefs],
    ["ds-def-index", DsDefIndex],
    ["ds-def-example", DsDefExample],
    ["ds-prop-table", DsPropTable],
    ["ds-prop", DsProp],
    ["ds-spec-nav", DsSpecNav],
    ["ds-callout", DsCallout],
    ["ds-tag", DsTag],
    ["ds-logo", DsLogo],
  ];

  for (const [name, ctor] of registry) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  }
})();
