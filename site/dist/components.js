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

  const BASE_RESET = `
    :host { display: inline-block; box-sizing: border-box; }
    :host([hidden]) { display: none !important; }
    *, *::before, *::after { box-sizing: border-box; }
  `;

  const FONT = {
    body: "var(--ds-font-body)",
    mono: "var(--ds-font-mono)",
  };

  // ── button.js ──
  const BUTTON_CSS = `
    ${BASE_RESET}
    :host { display: inline-flex; }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ds-space-1);
      border: none;
      border-radius: var(--ds-radius-lg);
      font-family: ${FONT.body};
      font-weight: var(--ds-font-weight-semibold);
      line-height: 1;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
      transition: background var(--ds-transition-normal), color var(--ds-transition-normal), border-color var(--ds-transition-normal), opacity var(--ds-transition-normal);
    }

    /* Sizes */
    :host([size="sm"]) .btn { font-size: var(--ds-font-size-sm); padding: 5px 10px; }
    .btn                     { font-size: var(--ds-font-size-base); padding: 7px 14px; }
    :host([size="lg"]) .btn  { font-size: var(--ds-font-size-lg); padding: 10px var(--ds-space-5); }

    /* Variants */
    .btn--primary {
      background: var(--ds-color-accent);
      color: #fff;
    }
    .btn--primary:hover { background: var(--ds-color-accent-hover); }

    .btn--secondary {
      background: transparent;
      color: var(--ds-color-accent);
      box-shadow: inset 0 0 0 var(--ds-border-width-sm) var(--ds-color-border);
    }
    .btn--secondary:hover {
      background: var(--ds-color-accent-subtle);
    }

    .btn--ghost {
      background: transparent;
      color: var(--ds-color-accent);
    }
    .btn--ghost:hover {
      background: var(--ds-color-accent-subtle);
    }

    .btn--danger {
      background: var(--ds-color-danger-btn);
      color: #fff;
    }
    .btn--danger:hover { background: var(--ds-color-danger-btn-hover); }

    /* Disabled */
    :host([disabled]) .btn {
      opacity: var(--ds-opacity-disabled);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Focus ring */
    .btn:focus-visible {
      outline: var(--ds-border-width-md) solid var(--ds-color-accent);
      outline-offset: 2px;
    }

    ::slotted([slot="icon-start"]),
    ::slotted([slot="icon-end"]) {
      display: inline-flex;
      width: 1em;
      height: 1em;
    }
  `;

  class DsButton extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "size", "disabled", "href"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, BUTTON_CSS);
      this._render();
    }

    attributeChangedCallback() {
      this._render();
    }

    _render() {
      const variant = this.getAttribute("variant") || "secondary";
      const href = this.getAttribute("href");
      const disabled = this.hasAttribute("disabled");
      const tag = href && !disabled ? "a" : "button";
      const hrefAttr = tag === "a" ? ` href="${esc(href)}"` : "";
      const disabledAttr = tag === "button" && disabled ? " disabled" : "";
      const role = tag === "a" ? ' role="button"' : "";

      this._shadow.innerHTML = `
        <${tag} class="btn btn--${esc(variant)}"${hrefAttr}${disabledAttr}${role} part="button">
          <slot name="icon-start"></slot>
          <slot></slot>
          <slot name="icon-end"></slot>
        </${tag}>
      `;
    }
  }

  // ── code.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-code>
  //
  // Attributes:
  //   language — optional language label (e.g. "json", "bash")
  //   label   — optional label shown in top-right corner
  //   theme   — "light" | "dark" (default: "light")
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
      border-radius: var(--ds-radius-lg);
      overflow: hidden;
    }

    /* Light theme */
    .wrapper--light {
      background: var(--ds-color-bg-subtle);
      border: var(--ds-border-width-sm) solid var(--ds-color-border-light);
    }
    .wrapper--light pre { color: var(--ds-color-text); }
    .wrapper--light .hl-k { color: var(--ds-syntax-light-key); }
    .wrapper--light .hl-s { color: var(--ds-syntax-light-string); }
    .wrapper--light .hl-n { color: var(--ds-syntax-light-number); }
    .wrapper--light .hl-b { color: var(--ds-syntax-light-bool); }

    /* Dark theme */
    .wrapper--dark {
      background: var(--ds-color-bg-dark);
    }
    .wrapper--dark pre { color: var(--ds-syntax-dark-text); }
    .wrapper--dark .hl-k { color: var(--ds-syntax-dark-key); }
    .wrapper--dark .hl-s { color: var(--ds-syntax-dark-string); }
    .wrapper--dark .hl-n { color: var(--ds-syntax-dark-number); }
    .wrapper--dark .hl-b { color: var(--ds-syntax-dark-bool); }

    .label {
      position: absolute;
      top: var(--ds-space-2);
      right: var(--ds-space-3);
      font-family: ${FONT.mono};
      font-size: 0.65rem;
      font-weight: var(--ds-font-weight-bold);
      text-transform: uppercase;
      letter-spacing: var(--ds-tracking-wider);
      padding: 2px var(--ds-space-2);
      border-radius: var(--ds-radius-md);
    }
    .wrapper--light .label { color: var(--ds-color-text-muted); background: var(--ds-color-bg-muted); }
    .wrapper--dark .label  { color: var(--ds-syntax-dark-label); background: rgba(255,255,255, var(--ds-opacity-overlay)); }

    pre {
      margin: 0;
      padding: var(--ds-space-4) var(--ds-space-5);
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
      background: var(--ds-color-bg-muted);
      padding: 1px 5px;
      border-radius: var(--ds-radius-sm);
      color: inherit;
    }
  `;

  class DsCode extends HTMLElement {
    static get observedAttributes() {
      return ["language", "label", "theme", "inline"];
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
      const theme = this.getAttribute("theme") || "light";
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

      const labelHtml = label ? `<span class="label">${esc(label)}</span>` : "";

      this._shadow.innerHTML = `
        <div class="wrapper wrapper--${esc(theme)}" part="wrapper">
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
  //   variant — "stable" | "experimental" | "draft" | "deprecated" |
  //             "required" | "encouraged" | "prohibited" | "informational" |
  //             "kind" | "category" | "token-type" | (default: neutral)
  //   size    — "sm" | "md" (default: "md")
  //
  // Content:
  //   Text label inside the element.
  // ═══════════════════════════════════════════════════════════════════════════

  const BADGE_CSS = `
    ${BASE_RESET}
    :host { display: inline-flex; vertical-align: middle; }

    .badge {
      display: inline-block;
      font-family: ${FONT.body};
      font-weight: var(--ds-font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--ds-tracking-normal);
      border-radius: var(--ds-radius-md);
      white-space: nowrap;
      line-height: 1;
    }

    /* Sizes */
    :host([size="sm"]) .badge { font-size: var(--ds-font-size-2xs); padding: 2px var(--ds-space-1); }
    .badge                     { font-size: var(--ds-font-size-xs); padding: 3px var(--ds-space-2); }

    /* Variants — Status */
    .badge--stable       { background: var(--ds-color-success-bg); color: var(--ds-color-success-text); }
    .badge--experimental { background: var(--ds-color-warning-bg); color: var(--ds-color-warning-text); }
    .badge--draft        { background: var(--ds-color-neutral-bg); color: var(--ds-color-neutral-text); }
    .badge--deprecated   { background: var(--ds-color-danger-bg); color: var(--ds-color-danger-text); }

    /* Variants — Requirement */
    .badge--required     { background: var(--ds-color-required-bg); color: var(--ds-color-required-text); }
    .badge--encouraged   { background: var(--ds-color-encouraged-bg); color: var(--ds-color-encouraged-text); }
    .badge--prohibited   { background: var(--ds-color-prohibited-bg); color: var(--ds-color-prohibited-text); }
    .badge--informational { background: var(--ds-color-neutral-bg); color: #424242; }
    .badge--discouraged  { background: var(--ds-color-discouraged-bg); color: var(--ds-color-discouraged-text); }

    /* Variants — Taxonomy */
    .badge--kind         { background: var(--ds-color-info-bg); color: var(--ds-color-info-text); }
    .badge--category     { background: var(--ds-color-purple-bg); color: var(--ds-color-purple-text); }
    .badge--token-type   { background: var(--ds-color-indigo-bg); color: var(--ds-color-indigo-text); }

    /* Default / neutral */
    .badge--neutral {
      background: var(--ds-color-accent-subtle);
      color: var(--ds-color-accent);
    }
  `;

  class DsBadge extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "size"];
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
  // Attributes:
  //   striped   — boolean, alternating row backgrounds
  //   compact   — boolean, tighter padding
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
  //
  //   <ds-table striped compact>
  //     <table>...</table>
  //   </ds-table>
  // ═══════════════════════════════════════════════════════════════════════════

  const TABLE_CSS = `
    ${BASE_RESET}
    :host { display: block; margin-bottom: var(--ds-space-6); }

    .table-wrap {
      overflow-x: auto;
    }

    /* Style the slotted <table> and its descendants via ::slotted
       and CSS inheritance. Since ::slotted only targets direct children
       of <slot>, we use the table itself as the styling hook and rely
       on inheritance + the component's font/color context for cells. */
    ::slotted(table) {
      width: 100%;
      border-collapse: collapse;
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-md);
      color: var(--ds-color-text);
    }

    /* Striped — applied via a class toggled onto the slotted table */
    :host([striped]) ::slotted(table) {
      --ds-table-striped: 1;
    }

    /* Compact — applied via a class toggled onto the slotted table */
    :host([compact]) ::slotted(table) {
      --ds-table-compact: 1;
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
      "ds-table table { width: 100%; border-collapse: collapse; font-size: var(--ds-font-size-md); }",
      "ds-table thead { background: var(--ds-color-bg-subtle); }",
      "ds-table th {",
      "  text-align: left; font-weight: var(--ds-font-weight-semibold); font-size: var(--ds-font-size-sm);",
      "  text-transform: uppercase; letter-spacing: var(--ds-tracking-wide);",
      "  color: var(--ds-color-text-secondary);",
      "  padding: var(--ds-space-2) var(--ds-space-4);",
      "  border-bottom: var(--ds-border-width-md) solid var(--ds-color-border);",
      "  white-space: nowrap;",
      "}",
      "ds-table td {",
      "  padding: var(--ds-space-2) var(--ds-space-4);",
      "  border-bottom: var(--ds-border-width-sm) solid var(--ds-color-border-light);",
      "  vertical-align: top; line-height: var(--ds-line-height-relaxed);",
      "}",
      "ds-table tr:last-child td { border-bottom: none; }",
      "ds-table a { color: var(--ds-color-accent); }",
      "ds-table[striped] tbody tr:nth-child(even) td { background: var(--ds-color-bg-subtle); }",
      "ds-table[compact] th, ds-table[compact] td { padding: 5px 10px; font-size: 0.8rem; }",
    ].join("\n");
    document.head.appendChild(style);
  }

  class DsTable extends HTMLElement {
    static get observedAttributes() {
      return ["striped", "compact"];
    }

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
  //   badge    — optional badge text shown after the heading
  //   badge-variant — variant for the badge
  //
  // Slots:
  //   (default) — heading text
  // ═══════════════════════════════════════════════════════════════════════════

  const HEADING_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .heading {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      color: var(--ds-color-text);
      font-family: ${FONT.body};
      line-height: var(--ds-line-height-snug);
    }

    .heading--1 { font-size: var(--ds-font-size-4xl); font-weight: var(--ds-font-weight-bold); margin: 0 0 var(--ds-space-4); }
    .heading--2 { font-size: var(--ds-font-size-3xl); font-weight: var(--ds-font-weight-bold); margin: var(--ds-space-12) 0 var(--ds-space-3); padding-bottom: var(--ds-space-2); border-bottom: var(--ds-border-width-sm) solid var(--ds-color-border-light); }
    .heading--3 { font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-6) 0 var(--ds-space-3); }
    .heading--4 { font-size: var(--ds-font-size-xl); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-5) 0 var(--ds-space-2); }
    .heading--5 { font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-4) 0 var(--ds-space-2); }
    .heading--6 { font-size: var(--ds-font-size-md); font-weight: var(--ds-font-weight-semibold); margin: var(--ds-space-3) 0 var(--ds-space-2); color: var(--ds-color-text-secondary); }

    .anchor-link {
      opacity: 0;
      color: var(--ds-color-text-secondary);
      text-decoration: none;
      font-size: 0.75em;
      transition: opacity var(--ds-transition-normal);
    }
    .heading:hover .anchor-link { opacity: 0.6; }
    .anchor-link:hover { opacity: 1 !important; }

    .badge {
      display: inline-block;
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-semibold);
      letter-spacing: var(--ds-tracking-normal);
      text-transform: uppercase;
      padding: 2px var(--ds-space-2);
      border-radius: var(--ds-radius-sm);
      background: var(--ds-color-accent-subtle);
      color: var(--ds-color-accent);
      vertical-align: middle;
    }
  `;

  class DsHeading extends HTMLElement {
    static get observedAttributes() {
      return ["level", "anchor", "badge", "badge-variant"];
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
      const badge = this.getAttribute("badge");

      // Set id on the host element so document.querySelector and TOC
      // scanning can find this heading by id without reaching into shadow DOM.
      if (anchor) this.id = anchor;

      let badgeHtml = "";
      if (badge) {
        badgeHtml = ' <span class="badge">' + esc(badge) + "</span>";
      }

      this._shadow.innerHTML =
        '<div class="heading heading--' +
        level +
        '" part="heading">' +
        "<slot></slot>" +
        badgeHtml +
        ' <a class="anchor-link" href="#' +
        esc(anchor) +
        '" part="anchor">#</a>' +
        "</div>";
    }
  }

  // ── card.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-card>
  //
  // Attributes:
  //   href     — if set, the card is clickable and navigates
  //   variant  — "default" | "outlined" | "elevated" (default: "outlined")
  //   padding  — "sm" | "md" | "lg" (default: "md")
  //
  // Slots:
  //   header  — card header area
  //   (default) — card body
  //   footer  — card footer area
  // ═══════════════════════════════════════════════════════════════════════════

  const CARD_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .card {
      border-radius: var(--ds-radius-xl);
      font-family: ${FONT.body};
      color: var(--ds-color-text);
      transition: border-color var(--ds-transition-normal), box-shadow var(--ds-transition-normal);
    }

    .card--outlined {
      border: var(--ds-border-width-sm) solid var(--ds-color-border);
      background: var(--ds-color-bg);
    }

    .card--elevated {
      border: var(--ds-border-width-sm) solid var(--ds-color-border-light);
      background: var(--ds-color-bg);
      box-shadow: var(--ds-shadow-sm);
    }

    .card--default {
      background: var(--ds-color-bg-subtle);
    }

    :host([href]) .card {
      cursor: pointer;
      text-decoration: none;
      display: block;
      color: inherit;
    }
    :host([href]) .card:hover {
      border-color: var(--ds-color-accent);
      box-shadow: var(--ds-shadow-md);
    }

    /* Padding sizes */
    :host([padding="sm"]) .card__body { padding: var(--ds-space-3); }
    .card__body                        { padding: var(--ds-space-5); }
    :host([padding="lg"]) .card__body  { padding: 28px; }

    .card__header {
      padding: var(--ds-space-3) var(--ds-space-5);
      border-bottom: var(--ds-border-width-sm) solid var(--ds-color-border-light);
      font-weight: var(--ds-font-weight-semibold);
      font-size: 0.9rem;
    }
    :host([padding="sm"]) .card__header { padding: var(--ds-space-2) var(--ds-space-3); }
    :host([padding="lg"]) .card__header { padding: var(--ds-space-4) 28px; }

    .card__footer {
      padding: var(--ds-space-3) var(--ds-space-5);
      border-top: var(--ds-border-width-sm) solid var(--ds-color-border-light);
      font-size: 0.82rem;
      color: var(--ds-color-text-secondary);
    }
    :host([padding="sm"]) .card__footer { padding: var(--ds-space-2) var(--ds-space-3); }
    :host([padding="lg"]) .card__footer { padding: var(--ds-space-4) 28px; }

    /* Focus */
    :host([href]) .card:focus-visible {
      outline: var(--ds-border-width-md) solid var(--ds-color-accent);
      outline-offset: 2px;
    }
  `;

  class DsCard extends HTMLElement {
    static get observedAttributes() {
      return ["href", "variant", "padding"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, CARD_CSS);
      this._render();
    }

    attributeChangedCallback() {
      this._render();
    }

    _render() {
      const variant = this.getAttribute("variant") || "outlined";
      const href = this.getAttribute("href");
      const tag = href ? "a" : "div";
      const hrefAttr = href ? ' href="' + esc(href) + '"' : "";
      const tabindex = href ? ' tabindex="0"' : "";

      this._shadow.innerHTML =
        "<" +
        tag +
        ' class="card card--' +
        esc(variant) +
        '"' +
        hrefAttr +
        tabindex +
        ' part="card">' +
        '<div class="card__header" part="header"><slot name="header"></slot></div>' +
        '<div class="card__body" part="body"><slot></slot></div>' +
        '<div class="card__footer" part="footer"><slot name="footer"></slot></div>' +
        "</" +
        tag +
        ">";

      // Hide header/footer slots if empty
      var self = this;
      requestAnimationFrame(function () {
        var header = self._shadow.querySelector(".card__header");
        var footer = self._shadow.querySelector(".card__footer");
        if (header && !self.querySelector("[slot=header]"))
          header.style.display = "none";
        if (footer && !self.querySelector("[slot=footer]"))
          footer.style.display = "none";
      });
    }
  }

  // ── tabs.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-tabs>
  //
  // Attributes:
  //   active — id of the active tab (or the first tab by default)
  //
  // Usage:
  //   <ds-tabs>
  //     <ds-tab label="First" id="t1">Content 1</ds-tab>
  //     <ds-tab label="Second" id="t2">Content 2</ds-tab>
  //   </ds-tabs>
  //
  // Child element: <ds-tab label="..." id="...">content</ds-tab>
  // ═══════════════════════════════════════════════════════════════════════════

  const TABS_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .tab-bar {
      display: flex;
      gap: 0;
      border-bottom: var(--ds-border-width-md) solid var(--ds-color-border);
      overflow-x: auto;
    }

    .tab-btn {
      font-family: ${FONT.body};
      padding: var(--ds-space-3) var(--ds-space-5);
      border: none;
      background: none;
      font-size: var(--ds-font-size-md);
      font-weight: var(--ds-font-weight-semibold);
      color: var(--ds-color-text-secondary);
      cursor: pointer;
      border-bottom: var(--ds-border-width-lg) solid transparent;
      margin-bottom: calc(-1 * var(--ds-border-width-md));
      transition: color var(--ds-transition-normal), border-color var(--ds-transition-normal);
      white-space: nowrap;
    }
    .tab-btn:hover { color: var(--ds-color-text); }
    .tab-btn--active {
      color: var(--ds-color-accent);
      border-bottom-color: var(--ds-color-accent);
    }
    .tab-btn:focus-visible {
      outline: var(--ds-border-width-md) solid var(--ds-color-accent);
      outline-offset: -2px;
    }

    .tab-panels {
      padding: var(--ds-space-4) 0;
    }

    ::slotted(ds-tab) { display: none; }
    ::slotted(ds-tab[active]) { display: block; }
  `;

  class DsTabs extends HTMLElement {
    static get observedAttributes() {
      return ["active"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, TABS_CSS);
    }

    connectedCallback() {
      this._buildBar();
      this._activate(this.getAttribute("active") || null);
    }

    attributeChangedCallback(name) {
      if (name === "active" && this.isConnected) {
        this._activate(this.getAttribute("active"));
      }
    }

    _buildBar() {
      const tabs = Array.from(this.querySelectorAll("ds-tab"));
      const bar = document.createElement("div");
      bar.className = "tab-bar";
      bar.setAttribute("role", "tablist");
      bar.setAttribute("part", "bar");

      var self = this;
      tabs.forEach(function (tab) {
        const btn = document.createElement("button");
        btn.className = "tab-btn";
        btn.textContent = tab.getAttribute("label") || tab.id || "Tab";
        btn.setAttribute("role", "tab");
        btn.setAttribute("data-tab", tab.id);
        btn.addEventListener("click", function () {
          self._activate(tab.id);
        });
        bar.appendChild(btn);
      });

      this._shadow.innerHTML = "";
      this._shadow.appendChild(bar);

      const panels = document.createElement("div");
      panels.className = "tab-panels";
      panels.innerHTML = "<slot></slot>";
      this._shadow.appendChild(panels);
    }

    _activate(id) {
      const tabs = Array.from(this.querySelectorAll("ds-tab"));
      if (!id && tabs.length > 0) id = tabs[0].id;

      tabs.forEach(function (tab) {
        if (tab.id === id) {
          tab.setAttribute("active", "");
        } else {
          tab.removeAttribute("active");
        }
      });

      this._shadow.querySelectorAll(".tab-btn").forEach(function (btn) {
        if (btn.getAttribute("data-tab") === id) {
          btn.classList.add("tab-btn--active");
          btn.setAttribute("aria-selected", "true");
        } else {
          btn.classList.remove("tab-btn--active");
          btn.setAttribute("aria-selected", "false");
        }
      });
    }
  }

  // <ds-tab> — individual tab panel (used as child of <ds-tabs>)
  class DsTab extends HTMLElement {
    constructor() {
      super();
    }
  }

  // ── sidebar.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-sidebar>
  //
  // Attributes:
  //   open      — boolean, whether sidebar is expanded
  //   position  — "left" | "right" (default: "left")
  //   width     — CSS width (default: "280px")
  //   collapsible — boolean, adds a toggle button
  //
  // Slots:
  //   header   — sidebar header content
  //   (default) — sidebar body
  //   footer   — sidebar footer content
  // ═══════════════════════════════════════════════════════════════════════════

  const SIDEBAR_CSS = `
    ${BASE_RESET}
    :host { display: block; position: relative; }

    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--ds-color-bg-dark);
      color: var(--ds-color-text-on-dark);
      font-family: ${FONT.body};
      transition: transform var(--ds-transition-slow), width var(--ds-transition-slow);
      z-index: var(--ds-z-nav);
      -webkit-overflow-scrolling: touch;
    }

    :host([position="right"]) .sidebar { right: 0; }
    :host(:not([position="right"])) .sidebar { left: 0; }

    :host(:not([open])) .sidebar { transform: translateX(-100%); }
    :host([position="right"]:not([open])) .sidebar { transform: translateX(100%); }
    :host([open]) .sidebar { transform: translateX(0); }

    .sidebar__header {
      padding: var(--ds-space-5) var(--ds-space-4) var(--ds-space-3);
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-bold);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ds-color-text-on-dark-heading);
    }

    .sidebar__body {
      padding: 0;
      flex: 1;
    }

    .sidebar__footer {
      padding: var(--ds-space-3) var(--ds-space-4);
      border-top: var(--ds-border-width-sm) solid rgba(255,255,255,0.1);
      font-size: var(--ds-font-size-sm);
    }

    .toggle-btn {
      position: absolute;
      top: var(--ds-space-3);
      background: var(--ds-color-bg-dark);
      border: var(--ds-border-width-sm) solid rgba(255,255,255,0.15);
      color: var(--ds-color-text-on-dark-heading);
      width: 28px;
      height: 28px;
      border-radius: var(--ds-radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: var(--ds-font-size-sm);
      z-index: var(--ds-z-toggle);
      transition: background var(--ds-transition-normal);
    }
    .toggle-btn:hover { background: var(--ds-color-bg-dark-hover); }

    :host(:not([position="right"])) .toggle-btn { right: -14px; }
    :host([position="right"]) .toggle-btn { left: -14px; }
  `;

  class DsSidebar extends HTMLElement {
    static get observedAttributes() {
      return ["open", "position", "width", "collapsible"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, SIDEBAR_CSS);
      this._render();
    }

    attributeChangedCallback() {
      this._render();
    }

    _render() {
      const width = this.getAttribute("width") || "280px";
      const collapsible = this.hasAttribute("collapsible");
      const open = this.hasAttribute("open");

      var toggleHtml = "";
      if (collapsible) {
        toggleHtml =
          '<button class="toggle-btn" part="toggle">' +
          (open ? "\u2190" : "\u2192") +
          "</button>";
      }

      this._shadow.innerHTML =
        '<div class="sidebar" style="width:' +
        esc(width) +
        '" part="sidebar">' +
        toggleHtml +
        '<div class="sidebar__header" part="header"><slot name="header"></slot></div>' +
        '<div class="sidebar__body" part="body"><slot></slot></div>' +
        '<div class="sidebar__footer" part="footer"><slot name="footer"></slot></div>' +
        "</div>";

      if (collapsible) {
        var self = this;
        var btn = this._shadow.querySelector(".toggle-btn");
        if (btn) {
          btn.addEventListener("click", function () {
            if (self.hasAttribute("open")) {
              self.removeAttribute("open");
            } else {
              self.setAttribute("open", "");
            }
          });
        }
      }

      // Hide empty header/footer
      var self2 = this;
      requestAnimationFrame(function () {
        var hdr = self2._shadow.querySelector(".sidebar__header");
        var ftr = self2._shadow.querySelector(".sidebar__footer");
        if (hdr && !self2.querySelector("[slot=header]"))
          hdr.style.display = "none";
        if (ftr && !self2.querySelector("[slot=footer]"))
          ftr.style.display = "none";
      });
    }
  }

  // ── scrollspy.js ──
  const SCROLLSPY_CSS = `
    ${BASE_RESET}
    :host { display: block; }
  `;

  class DsScrollspy extends HTMLElement {
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

  // ── toolbar.js ──
  const TOOLBAR_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .toolbar {
      background: var(--ds-color-bg);
      border-bottom: 1px solid var(--ds-color-border);
      font-family: ${FONT.body};
    }

    :host([sticky]) .toolbar {
      position: sticky;
      top: 0;
      z-index: var(--ds-z-toolbar);
    }

    /* Primary row: start / center / end */
    .toolbar__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-space-4);
      padding: var(--ds-space-2) var(--ds-space-5);
      min-height: var(--ds-space-12);
    }

    .toolbar__start {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      min-width: 0;
    }

    .toolbar__center {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      flex: 1;
      min-width: 0;
    }

    .toolbar__end {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      flex-shrink: 0;
    }

    ::slotted([slot="start"]) {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--ds-color-text);
    }

    /* Subtitle — sits below the title in the start area */
    .toolbar__subtitle {
      display: none;
      padding: 0 var(--ds-space-5) 6px;
      font-size: 0.82rem;
      color: var(--ds-color-text-secondary);
      line-height: 1.4;
    }
    .toolbar__subtitle.visible { display: block; }

    /* Nav row — horizontal link strip below the primary row */
    .toolbar__nav {
      display: none;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--ds-space-1) 14px;
      padding: var(--ds-space-1) var(--ds-space-5) var(--ds-space-2);
      font-size: 0.82rem;
      border-top: 1px solid var(--ds-color-border-light);
    }
    .toolbar__nav.visible { display: flex; }

    ::slotted([slot="nav"]) {
      color: var(--ds-color-accent);
      text-decoration: none;
      padding: 2px 0;
      font-size: 0.82rem;
    }
  `;

  class DsToolbar extends HTMLElement {
    static get observedAttributes() {
      return ["sticky"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, TOOLBAR_CSS);
      // Default to sticky
      if (!this.hasAttribute("sticky")) this.setAttribute("sticky", "");
      this._shadow.innerHTML =
        '<div class="toolbar" part="toolbar">' +
        '<div class="toolbar__row">' +
        '<div class="toolbar__start" part="start"><slot name="start"></slot></div>' +
        '<div class="toolbar__center" part="center"><slot></slot></div>' +
        '<div class="toolbar__end" part="end"><slot name="end"></slot></div>' +
        "</div>" +
        '<div class="toolbar__subtitle" part="subtitle"><slot name="subtitle"></slot></div>' +
        '<div class="toolbar__nav" part="nav"><slot name="nav"></slot></div>' +
        "</div>";
    }

    connectedCallback() {
      // Show subtitle and nav rows only when their slots are populated
      var self = this;
      requestAnimationFrame(function () {
        var subtitleSlot = self._shadow.querySelector('slot[name="subtitle"]');
        var navSlot = self._shadow.querySelector('slot[name="nav"]');
        if (subtitleSlot) {
          var subAssigned = subtitleSlot.assignedNodes({ flatten: true });
          if (subAssigned.length > 0) {
            subtitleSlot.parentElement.classList.add("visible");
          }
        }
        if (navSlot) {
          var navAssigned = navSlot.assignedNodes({ flatten: true });
          if (navAssigned.length > 0) {
            navSlot.parentElement.classList.add("visible");
          }
        }
      });
    }
  }

  // ── sidenav.js ──
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
      letter-spacing: 0.05em;
      text-transform: uppercase;
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
      text-transform: uppercase;
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

  class DsSidenav extends HTMLElement {
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
  class DsNavGroup extends HTMLElement {
    constructor() {
      super();
    }
  }

  // <ds-nav-link> — declarative nav link (used as child of <ds-sidenav> or <ds-nav-group>)
  // Attributes: href, active
  class DsNavLink extends HTMLElement {
    constructor() {
      super();
    }
  }

  // ── toc.js ──
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
      text-transform: uppercase;
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

  class DsToc extends HTMLElement {
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

  // ── back-to-top.js ──
  const BACK_TO_TOP_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    a {
      display: inline-block;
      margin-top: var(--ds-space-12);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text-secondary);
      text-decoration: none;
      transition: color var(--ds-transition-normal);
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

  // ── footer.js ──
  const FOOTER_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .footer {
      margin-top: var(--ds-space-16);
      padding-top: var(--ds-space-6);
      border-top: 1px solid var(--ds-color-border-light);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text-faint);
    }

    ::slotted(p) {
      margin: 0 0 var(--ds-space-1);
    }

    ::slotted(a) {
      color: #777;
    }
  `;

  class DsFooter extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, FOOTER_CSS);
      this._shadow.innerHTML =
        '<div class="footer" part="footer"><slot></slot></div>';
    }
  }

  // ── schema-header.js ──
  const SCHEMA_HEADER_CSS = `
    ${BASE_RESET}
    :host { display: block; margin-bottom: var(--ds-space-6); }
    h1 {
      font-size: var(--ds-font-size-4xl);
      font-weight: 700;
      line-height: 1.3;
      margin: 0 0 var(--ds-space-4);
      color: var(--ds-color-text);
    }
    .desc {
      color: var(--ds-color-text-secondary);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-lg);
      margin: 0 0 var(--ds-space-4);
    }
    .source {
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text-faint);
      margin: 0 0 var(--ds-space-6);
    }
  `;

  class DsSchemaHeader extends HTMLElement {
    static get observedAttributes() {
      return ["title", "description", "source"];
    }
    constructor() {
      super();
      this._shadow = createShadow(this, SCHEMA_HEADER_CSS);
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
      var html = "<h1>" + esc(t) + " <slot></slot></h1>";
      if (d) html += '<p class="desc">' + esc(d) + "</p>";
      if (s)
        html +=
          '<p class="source">Source: <ds-code inline>' +
          esc(s) +
          "</ds-code></p>";
      this._shadow.innerHTML = html;
    }
  }

  // ── def-section.js ──
  const DEF_SECTION_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin-bottom: var(--ds-space-12);
      padding-bottom: var(--ds-space-8);
      border-bottom: 1px solid var(--ds-color-border-light);
    }
    :host(:last-child) { border-bottom: none; }
    h3 {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-2xl);
      font-weight: 600;
      color: var(--ds-color-text);
      margin: 0 0 var(--ds-space-2);
    }
    .desc {
      color: var(--ds-color-text-secondary);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-lg);
      line-height: 1.6;
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
      if (desc) html += '<p class="desc">' + esc(desc) + "</p>";
      if (type)
        html +=
          '<p class="type-line"><ds-badge variant="kind" size="sm">' +
          esc(type) +
          "</ds-badge></p>";
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
      font-size: var(--ds-font-size-md);
      color: var(--ds-color-accent);
      text-decoration: none;
      border-bottom: 1px dashed var(--ds-color-accent);
      transition: color var(--ds-transition-fast), border-bottom-color var(--ds-transition-fast);
    }
    a:hover {
      color: var(--ds-color-accent-hover);
      border-bottom-style: solid;
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

  // ── note.js ──
  const NOTE_CSS = `
    ${BASE_RESET}
    :host { display: block; }
    .note {
      border-radius: var(--ds-radius-md);
      padding: var(--ds-space-2) var(--ds-space-4);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      margin-bottom: var(--ds-space-4);
      line-height: 1.5;
    }
    .note--warning {
      background: var(--ds-color-note-warning-bg);
      border: 1px solid var(--ds-color-note-warning-border);
    }
    .note--info {
      background: var(--ds-color-accent-subtle);
      border: 1px solid var(--ds-color-border-light);
    }
  `;

  class DsNote extends HTMLElement {
    static get observedAttributes() {
      return ["variant"];
    }
    constructor() {
      super();
      this._shadow = createShadow(this, NOTE_CSS);
      this._shadow.innerHTML =
        '<div class="note note--info" part="note"><slot></slot></div>';
    }
    connectedCallback() {
      this._updateVariant();
    }
    attributeChangedCallback() {
      this._updateVariant();
    }
    _updateVariant() {
      var v = this.getAttribute("variant") || "info";
      var el = this._shadow.querySelector(".note");
      if (el) el.className = "note note--" + v;
    }
  }

  // ── cross-refs.js ──
  const CROSS_REFS_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text-secondary);
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
      background: var(--ds-color-bg-subtle);
      border: 1px solid var(--ds-color-border-light);
      border-radius: var(--ds-radius-lg);
      padding: var(--ds-space-4) var(--ds-space-6);
      margin-bottom: var(--ds-space-12);
    }
    ::slotted(p) {
      margin-bottom: var(--ds-space-2);
      font-size: var(--ds-font-size-md);
    }
    ::slotted(ul) {
      list-style: none;
      padding: 0;
      margin: 0;
      column-count: 2;
      column-gap: var(--ds-space-6);
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
      "ds-def-index li { margin-bottom: var(--ds-space-1); font-size: var(--ds-font-size-base); break-inside: avoid; }",
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
    .title {
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-sm);
      font-weight: 600;
      letter-spacing: var(--ds-tracking-wide);
      text-transform: uppercase;
      color: var(--ds-color-text-secondary);
      margin: 0 0 var(--ds-space-2);
    }
  `;

  class DsDefExample extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, DEF_EXAMPLE_CSS);
      this._shadow.innerHTML =
        '<p class="title" part="title"><strong>Example</strong></p><slot></slot>';
    }
  }

  // ── prop-table.js ──
  const PROP_TABLE_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: var(--ds-space-6);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
    }

    th {
      text-align: left;
      font-weight: 600;
      font-size: var(--ds-font-size-sm);
      text-transform: uppercase;
      letter-spacing: var(--ds-tracking-wide);
      color: var(--ds-color-text-secondary);
      padding: var(--ds-space-2) var(--ds-space-4);
      border-bottom: 2px solid var(--ds-color-border);
      background: var(--ds-color-bg-subtle);
      white-space: nowrap;
    }

    td {
      padding: var(--ds-space-2) var(--ds-space-4);
      border-bottom: 1px solid var(--ds-color-border-light);
      vertical-align: top;
      line-height: 1.5;
    }

    tr:last-child td {
      border-bottom: none;
    }

    /* Column 1: Property name — monospace, bold */
    td:nth-child(1) code {
      font-family: ${FONT.mono};
      font-weight: 600;
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
      color: #666;
    }

    /* Column 3: Required — narrow */
    td:nth-child(3) {
      white-space: nowrap;
      font-size: var(--ds-font-size-sm);
    }

    /* Column 4: Description — max width, secondary color */
    td:nth-child(4) {
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text-secondary);
      max-width: 420px;
    }

    td:nth-child(4) small {
      display: block;
      margin-top: var(--ds-space-1);
      color: var(--ds-color-text-muted);
      font-size: var(--ds-font-size-sm);
    }

    td:nth-child(4) code {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-base);
      background: var(--ds-color-bg-muted);
      padding: 1px 5px;
      border-radius: var(--ds-radius-sm);
    }

    /* Type reference links inside cells */
    a.type-ref {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-md);
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
              '<ds-badge variant="required" size="sm">required</ds-badge>';
          } else if (prop.hasAttribute("conditional")) {
            statusCell =
              '<ds-badge variant="experimental" size="sm">at least one</ds-badge>';
          } else {
            statusCell = "optional";
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
        '<table part="table">' +
        "<thead><tr><th>Property</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>" +
        "<tbody>" +
        trs +
        "</tbody></table>";
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

  // ── nav-toggle.js ──
  /**
   * <ds-nav-toggle>
   *
   * A mobile hamburger menu button that toggles a navigation sidebar open/closed.
   * Hidden by default on desktop viewports; appears at narrow widths.
   *
   * Attributes:
   *   target — CSS selector for the nav element to toggle (default: ".nav")
   *   label  — accessible label text (default: "Toggle navigation")
   *   open   — boolean, reflects whether the nav is currently open
   *
   * Behavior:
   *   - Clicking the button toggles the `open` attribute on itself
   *   - Adds/removes a `nav--open` class on the target element
   *   - Pressing Escape while nav is open closes it
   *   - Renders ☰ when closed, ✕ when open
   *
   * Usage:
   *   <ds-nav-toggle target=".nav"></ds-nav-toggle>
   */

  const NAV_TOGGLE_CSS = `
    ${BASE_RESET}
    :host {
      display: none;
      position: fixed;
      bottom: var(--ds-space-4, 16px);
      left: 50%;
      transform: translateX(-50%);
      z-index: var(--ds-z-overlay, 200);
    }

    button {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2, 8px);
      background: var(--ds-color-bg-dark, #1b1f24);
      color: var(--ds-color-text-on-dark-heading, #ffffff);
      border: none;
      border-radius: var(--ds-radius-lg, 6px);
      padding: var(--ds-space-2, 8px) var(--ds-space-4, 16px);
      font-size: var(--ds-font-size-md, 0.875rem);
      font-family: ${FONT.body};
      font-weight: var(--ds-font-weight-medium, 500);
      cursor: pointer;
      box-shadow: var(--ds-shadow-lg, 0 2px 6px rgba(0, 0, 0, 0.2));
      transition: background var(--ds-transition-normal, 0.15s ease);
      -webkit-tap-highlight-color: transparent;
      line-height: 1;
    }

    button:hover {
      background: var(--ds-color-bg-dark-hover, #2a2f36);
    }

    button:focus-visible {
      outline: var(--ds-border-width-md, 2px) solid var(--ds-color-accent, #0055b3);
      outline-offset: 2px;
    }

    .icon {
      font-size: 1.1em;
      line-height: 1;
      width: 1em;
      text-align: center;
    }

    /* Show on narrow viewports */
    @media (max-width: 900px) {
      :host {
        display: block;
      }
    }
  `;

  class DsNavToggle extends HTMLElement {
    static get observedAttributes() {
      return ["target", "label", "open"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, NAV_TOGGLE_CSS);
      this._targetEl = null;
      this._onKeydown = this._onKeydown.bind(this);
      this._render();
    }

    connectedCallback() {
      document.addEventListener("keydown", this._onKeydown);
      this._resolveTarget();
    }

    disconnectedCallback() {
      document.removeEventListener("keydown", this._onKeydown);
    }

    attributeChangedCallback(name) {
      if (name === "open") {
        this._syncTarget();
        this._updateIcon();
      } else if (name === "target") {
        this._resolveTarget();
      } else {
        this._render();
      }
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

    toggle() {
      this.open = !this.open;
    }

    _render() {
      const label = this.getAttribute("label") || "Toggle navigation";
      const isOpen = this.hasAttribute("open");
      const icon = isOpen ? "\u2715" : "\u2630";

      this._shadow.innerHTML =
        '<button part="button" aria-label="' +
        esc(label) +
        '" aria-expanded="' +
        (isOpen ? "true" : "false") +
        '">' +
        '<span class="icon" part="icon">' +
        icon +
        "</span>" +
        "<span>Menu</span>" +
        "</button>";

      const btn = this._shadow.querySelector("button");
      if (btn) {
        const self = this;
        btn.addEventListener("click", function () {
          self.toggle();
        });
      }
    }

    _updateIcon() {
      const isOpen = this.hasAttribute("open");
      const icon = this._shadow.querySelector(".icon");
      const btn = this._shadow.querySelector("button");
      if (icon) icon.textContent = isOpen ? "\u2715" : "\u2630";
      if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    _resolveTarget() {
      const selector = this.getAttribute("target") || ".nav";
      this._targetEl = document.querySelector(selector);
    }

    _syncTarget() {
      // Lazily resolve the target if it wasn't found at connect time
      // (the toggle is parsed before the nav element in the DOM).
      if (!this._targetEl) this._resolveTarget();
      if (!this._targetEl) return;
      if (this.hasAttribute("open")) {
        this._targetEl.setAttribute("open", "");
      } else {
        this._targetEl.removeAttribute("open");
      }
    }

    _onKeydown(e) {
      if (e.key === "Escape" && this.open) {
        this.open = false;
        const btn = this._shadow.querySelector("button");
        if (btn) btn.focus();
      }
    }
  }

  // ── spec-nav.js ──
  /**
   * <ds-spec-nav>
   *
   * The specification site's left sidebar navigation. Encapsulates all
   * navigation styling (previously .nav, .nav__title, .nav__link,
   * .nav__group, etc.) into a single web component with shadow DOM.
   *
   * Attributes:
   *   title       — title text shown at the top (e.g. "DSDS 0.1")
   *   title-href  — link for the title (default: "index.html")
   *   active      — slug of the currently active page
   *   open        — boolean, reflects mobile open/closed state
   *
   * Content model:
   *   The navigation structure is provided via a JSON `items` attribute
   *   OR via slotted light-DOM content.
   *
   *   JSON items format:
   *     [
   *       { "label": "Overview", "href": "index.html", "slug": "index" },
   *       { "label": "Quick Start", "href": "quickstart.html" },
   *       {
   *         "label": "Common",
   *         "children": [
   *           { "label": "example", "href": "common-example.html", "slug": "common-example" },
   *           { "label": "link", "href": "common-link.html", "slug": "common-link" }
   *         ]
   *       }
   *     ]
   *
   * Mobile behavior:
   *   At ≤900px the nav is off-screen by default (translateX(-100%)).
   *   Setting the `open` attribute slides it into view.
   *   <ds-nav-toggle> controls the `open` attribute externally by
   *   targeting this element with its `target` attribute.
   *
   * Usage:
   *   <ds-spec-nav
   *     title="DSDS 0.1"
   *     title-href="index.html"
   *     active="entities-component"
   *     items='[...]'>
   *   </ds-spec-nav>
   */

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
      letter-spacing: 0.05em;
      text-transform: uppercase;
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
      margin-top: var(--ds-space-1, 4px);
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
      letter-spacing: var(--ds-tracking-widest, 0.08em);
      text-transform: uppercase;
      cursor: pointer;
      text-align: left;
      transition: color var(--ds-transition-fast, 0.1s ease);
    }

    .nav__group-toggle:hover {
      color: var(--ds-color-text-on-dark, #c9cdd3);
    }

    .nav__group--open > .nav__group-toggle {
      color: var(--ds-color-text-on-dark, #c9cdd3);
    }

    .nav__group-arrow {
      font-size: var(--ds-font-size-sm, 0.75rem);
      transition: transform var(--ds-transition-normal, 0.15s ease);
      line-height: 1;
    }

    .nav__group--open > .nav__group-toggle .nav__group-arrow {
      transform: rotate(90deg);
    }

    /* ── Group children — collapsed by default ──────────── */
    .nav__group-children {
      display: none;
      padding-bottom: var(--ds-space-1, 4px);
    }

    .nav__group--open > .nav__group-children {
      display: block;
    }

    .nav__link--child {
      padding-left: calc(var(--ds-space-4, 16px) + 10px);
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

  class DsSpecNav extends HTMLElement {
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
      var self = this;
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          function () {
            self._render();
          },
          { once: true },
        );
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
      var title = this.getAttribute("title") || "";
      var titleHref = this.getAttribute("title-href") || "index.html";
      var active = this.getAttribute("active") || "";

      var titleHtml = title
        ? '<div class="nav__title"><a href="' +
          esc(titleHref) +
          '">' +
          esc(title) +
          "</a></div>"
        : "";

      var itemsHtml = this._buildFromChildren(active);

      this._shadow.innerHTML =
        '<nav class="nav" role="navigation" aria-label="Specification navigation" part="nav">' +
        titleHtml +
        '<div class="nav__items" part="items">' +
        itemsHtml +
        "</div>" +
        "</nav>";

      // Attach group toggle listeners
      this._shadow
        .querySelectorAll(".nav__group-toggle")
        .forEach(function (btn) {
          btn.addEventListener("click", function () {
            var group = btn.closest(".nav__group");
            if (group) {
              group.classList.toggle("nav__group--open");
              var expanded = group.classList.contains("nav__group--open");
              btn.setAttribute("aria-expanded", String(expanded));
            }
          });
        });
    }

    /**
     * Walk light-DOM children and build shadow-DOM navigation HTML.
     *
     * Recognised children:
     *   <a href="…" slug="…">Label</a>         → top-level link
     *   <ds-nav-group label="…">                → collapsible group
     *     <a href="…" slug="…">Label</a>        → child link
     *   </ds-nav-group>
     */
    _buildFromChildren(active) {
      var parts = [];
      var children = this.children;

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var tag = child.tagName.toLowerCase();

        if (tag === "a") {
          var slug = child.getAttribute("slug") || "";
          var href = child.getAttribute("href") || "#";
          var label = child.textContent.trim();
          var activeCls = slug && slug === active ? " nav__link--active" : "";
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
      }

      return parts.join("\n");
    }

    /**
     * Build shadow HTML for a single <ds-nav-group>.
     */
    _buildGroup(groupEl, active) {
      var label = groupEl.getAttribute("label") || "";
      var childLinks = groupEl.querySelectorAll(":scope > a");
      var hasActive = false;

      var childHtml = Array.prototype.map
        .call(childLinks, function (a) {
          var slug = a.getAttribute("slug") || "";
          var href = a.getAttribute("href") || "#";
          var text = a.textContent.trim();
          var isActive = slug && slug === active;
          if (isActive) hasActive = true;
          var activeCls = isActive ? " nav__link--active" : "";
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

      var openCls = hasActive ? " nav__group--open" : "";
      var ariaExpanded = hasActive ? "true" : "false";

      return (
        '<div class="nav__group' +
        openCls +
        '">' +
        '<button class="nav__group-toggle" aria-expanded="' +
        ariaExpanded +
        '">' +
        "<span>" +
        esc(label) +
        "</span>" +
        '<span class="nav__group-arrow">\u203A</span>' +
        "</button>" +
        '<div class="nav__group-children">' +
        childHtml +
        "</div>" +
        "</div>"
      );
    }
  }

  // ── Registration ──
  const registry = [
    ["ds-button", DsButton],
    ["ds-code", DsCode],
    ["ds-badge", DsBadge],
    ["ds-table", DsTable],
    ["ds-heading", DsHeading],
    ["ds-card", DsCard],
    ["ds-tabs", DsTabs],
    ["ds-tab", DsTab],
    ["ds-sidebar", DsSidebar],
    ["ds-scrollspy", DsScrollspy],
    ["ds-toolbar", DsToolbar],
    ["ds-sidenav", DsSidenav],
    ["ds-nav-group", DsNavGroup],
    ["ds-nav-link", DsNavLink],
    ["ds-toc", DsToc],
    ["ds-back-to-top", DsBackToTop],
    ["ds-footer", DsFooter],
    ["ds-schema-header", DsSchemaHeader],
    ["ds-def-section", DsDefSection],
    ["ds-type-ref", DsTypeRef],
    ["ds-note", DsNote],
    ["ds-cross-refs", DsCrossRefs],
    ["ds-def-index", DsDefIndex],
    ["ds-def-example", DsDefExample],
    ["ds-prop-table", DsPropTable],
    ["ds-prop", DsProp],
    ["ds-nav-toggle", DsNavToggle],
    ["ds-spec-nav", DsSpecNav],
  ];

  for (const [name, ctor] of registry) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  }
})();
