/**
 * DSDS Site — Web Components Library
 *
 * A set of reusable HTML custom elements for the DSDS specification site.
 * All components read design tokens from CSS custom properties defined in
 * style.css (--color-*, --font-*, --spacing-*), so they stay in sync with
 * the global theme without duplicating values.
 *
 * Components:
 *   <ds-button>       — Button with variants, sizes, and icon support
 *   <ds-code>         — Syntax-highlighted code block with optional label
 *   <ds-badge>        — Inline status / category badge
 *   <ds-table>        — Styled data table from JSON or slotted content
 *   <ds-heading>      — Section heading with anchor link and optional badge
 *   <ds-card>         — Bordered content card with optional header/footer
 *   <ds-tabs>         — Tabbed content switcher
 *   <ds-sidebar>      — Collapsible sidebar panel
 *   <ds-scrollspy>    — Tracks scroll position and highlights TOC links
 *   <ds-toolbar>      — Top toolbar with title, breadcrumbs, and actions
 *   <ds-sidenav>      — Left navigation with collapsible groups
 *
 * Usage:
 *   <script src="components.js"></script>
 *   — or —
 *   <script type="module" src="components.js"></script>
 *
 *   Then use the elements anywhere in HTML:
 *   <ds-button variant="primary" size="md">Save</ds-button>
 *   <ds-badge variant="stable">Stable</ds-badge>
 */

(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  // Shared utilities
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Shorthand to create a shadow root with adopted styles.
   */
  function createShadow(el, css, mode) {
    const shadow = el.attachShadow({ mode: mode || "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
    return shadow;
  }

  /**
   * Escape HTML special characters.
   */
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * CSS custom properties inherited from the host page (style.css).
   * We reference them inside shadow DOM via inherit or explicit var().
   * This base reset is shared by every component.
   */
  const BASE_RESET = `
    :host { display: inline-block; box-sizing: border-box; }
    :host([hidden]) { display: none !important; }
    *, *::before, *::after { box-sizing: border-box; }
  `;

  /**
   * Shared font stacks — reference the page's custom properties.
   */
  const FONT_BODY =
    'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)';
  const FONT_MONO =
    'var(--font-mono, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace)';

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-button>
  //
  // Attributes:
  //   variant  — "primary" | "secondary" | "ghost" | "danger" (default: "secondary")
  //   size     — "sm" | "md" | "lg" (default: "md")
  //   disabled — boolean
  //   href     — if set, renders as <a> instead of <button>
  //
  // Slots:
  //   (default) — button label
  //   icon-start — icon before label
  //   icon-end   — icon after label
  // ═══════════════════════════════════════════════════════════════════════════

  const BUTTON_CSS = `
    ${BASE_RESET}
    :host { display: inline-flex; }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      border-radius: 6px;
      font-family: ${FONT_BODY};
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s;
    }

    /* Sizes */
    :host([size="sm"]) .btn { font-size: 0.75rem; padding: 5px 10px; }
    .btn                     { font-size: 0.8125rem; padding: 7px 14px; }
    :host([size="lg"]) .btn  { font-size: 0.9375rem; padding: 10px 20px; }

    /* Variants */
    .btn--primary {
      background: var(--color-accent, #0055b3);
      color: #fff;
    }
    .btn--primary:hover { background: var(--color-link-hover, #003d82); }

    .btn--secondary {
      background: transparent;
      color: var(--color-accent, #0055b3);
      box-shadow: inset 0 0 0 1px var(--color-border, #d4d4d8);
    }
    .btn--secondary:hover {
      background: var(--color-accent-subtle, #e8f0fe);
    }

    .btn--ghost {
      background: transparent;
      color: var(--color-accent, #0055b3);
    }
    .btn--ghost:hover {
      background: var(--color-accent-subtle, #e8f0fe);
    }

    .btn--danger {
      background: #dc2626;
      color: #fff;
    }
    .btn--danger:hover { background: #b91c1c; }

    /* Disabled */
    :host([disabled]) .btn {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Focus ring */
    .btn:focus-visible {
      outline: 2px solid var(--color-accent, #0055b3);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-code>
  //
  // Attributes:
  //   language — optional language label (e.g. "json", "bash")
  //   label   — optional label shown in top-right corner
  //   theme   — "light" | "dark" (default: "light")
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
      border-radius: 6px;
      overflow: hidden;
    }

    /* Light theme */
    .wrapper--light {
      background: var(--color-bg-subtle, #f7f7f8);
      border: 1px solid var(--color-border-light, #e8e8eb);
    }
    .wrapper--light pre { color: var(--color-text, #1a1a1a); }
    .wrapper--light .hl-k { color: #0451a5; }
    .wrapper--light .hl-s { color: #a31515; }
    .wrapper--light .hl-n { color: #098658; }
    .wrapper--light .hl-b { color: #0000ff; }

    /* Dark theme */
    .wrapper--dark {
      background: #1b1f24;
    }
    .wrapper--dark pre { color: #e6edf3; }
    .wrapper--dark .hl-k { color: #79c0ff; }
    .wrapper--dark .hl-s { color: #a5d6ff; }
    .wrapper--dark .hl-n { color: #56d364; }
    .wrapper--dark .hl-b { color: #ff7b72; }

    .label {
      position: absolute;
      top: 8px;
      right: 12px;
      font-family: ${FONT_MONO};
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .wrapper--light .label { color: #888; background: var(--color-bg-code, #f0f1f3); }
    .wrapper--dark .label  { color: #636c76; background: rgba(255,255,255,0.06); }

    pre {
      margin: 0;
      padding: 16px 20px;
      font-family: ${FONT_MONO};
      font-size: 0.8125rem;
      line-height: 1.6;
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
      font-family: ${FONT_MONO};
      font-size: 0.875em;
      background: var(--color-bg-code, #f0f1f3);
      padding: 1px 5px;
      border-radius: 3px;
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
      font-family: ${FONT_BODY};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-radius: 4px;
      white-space: nowrap;
      line-height: 1;
    }

    /* Sizes */
    :host([size="sm"]) .badge { font-size: 0.625rem; padding: 2px 6px; }
    .badge                     { font-size: 0.6875rem; padding: 3px 8px; }

    /* Variants */
    .badge--stable       { background: #c8e6c9; color: #2e7d32; }
    .badge--experimental { background: #fff9c4; color: #f57f17; }
    .badge--draft        { background: #e0e0e0; color: #616161; }
    .badge--deprecated   { background: #ffcdd2; color: #c62828; }

    .badge--required     { background: #bbdefb; color: #0d47a1; }
    .badge--encouraged   { background: #c8e6c9; color: #1b5e20; }
    .badge--prohibited   { background: #ffcdd2; color: #b71c1c; }
    .badge--informational { background: #e0e0e0; color: #424242; }
    .badge--discouraged  { background: #fff3e0; color: #e65100; }

    .badge--kind         { background: #e3f2fd; color: #1565c0; }
    .badge--category     { background: #f3e5f5; color: #7b1fa2; }
    .badge--token-type   { background: #e8eaf6; color: #283593; }

    .badge--neutral {
      background: var(--color-accent-subtle, #e8f0fe);
      color: var(--color-accent, #0055b3);
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
    :host { display: block; margin-bottom: 24px; }

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
      font-family: ${FONT_BODY};
      font-size: 0.875rem;
      color: var(--color-text, #1a1a1a);
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
      "ds-table table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }",
      "ds-table thead { background: var(--color-bg-subtle, #f7f7f8); }",
      "ds-table th {",
      "  text-align: left; font-weight: 600; font-size: 0.75rem;",
      "  text-transform: uppercase; letter-spacing: 0.04em;",
      "  color: var(--color-text-secondary, #555);",
      "  padding: 8px 16px;",
      "  border-bottom: 2px solid var(--color-border, #d4d4d8);",
      "  white-space: nowrap;",
      "}",
      "ds-table td {",
      "  padding: 8px 16px;",
      "  border-bottom: 1px solid var(--color-border-light, #e8e8eb);",
      "  vertical-align: top; line-height: 1.5;",
      "}",
      "ds-table tr:last-child td { border-bottom: none; }",
      "ds-table a { color: var(--color-link, #0055b3); }",
      "ds-table[striped] tbody tr:nth-child(even) td { background: var(--color-bg-subtle, #f7f7f8); }",
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
      gap: 10px;
      color: var(--color-text, #1a1a1a);
      font-family: ${FONT_BODY};
      line-height: 1.3;
    }

    .heading--1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 16px; }
    .heading--2 { font-size: 1.375rem; font-weight: 700; margin: 48px 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border-light, #e8e8eb); }
    .heading--3 { font-size: 1.125rem; font-weight: 600; margin: 24px 0 12px; }
    .heading--4 { font-size: 1rem; font-weight: 600; margin: 20px 0 8px; }
    .heading--5 { font-size: 0.9375rem; font-weight: 600; margin: 16px 0 8px; }
    .heading--6 { font-size: 0.875rem; font-weight: 600; margin: 12px 0 8px; color: var(--color-text-secondary, #555); }

    .anchor-link {
      opacity: 0;
      color: var(--color-text-secondary, #555);
      text-decoration: none;
      font-size: 0.75em;
      transition: opacity 0.15s;
    }
    .heading:hover .anchor-link { opacity: 0.6; }
    .anchor-link:hover { opacity: 1 !important; }

    .badge {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 3px;
      background: var(--color-accent-subtle, #e8f0fe);
      color: var(--color-accent, #0055b3);
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
      border-radius: 8px;
      font-family: ${FONT_BODY};
      color: var(--color-text, #1a1a1a);
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .card--outlined {
      border: 1px solid var(--color-border, #d4d4d8);
      background: var(--color-bg, #fff);
    }

    .card--elevated {
      border: 1px solid var(--color-border-light, #e8e8eb);
      background: var(--color-bg, #fff);
      box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
    }

    .card--default {
      background: var(--color-bg-subtle, #f7f7f8);
    }

    :host([href]) .card {
      cursor: pointer;
      text-decoration: none;
      display: block;
      color: inherit;
    }
    :host([href]) .card:hover {
      border-color: var(--color-accent, #0055b3);
      box-shadow: 0 2px 8px rgba(0, 85, 179, 0.08);
    }

    /* Padding sizes */
    :host([padding="sm"]) .card__body { padding: 12px; }
    .card__body                        { padding: 20px; }
    :host([padding="lg"]) .card__body  { padding: 28px; }

    .card__header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border-light, #e8e8eb);
      font-weight: 600;
      font-size: 0.9rem;
    }
    :host([padding="sm"]) .card__header { padding: 8px 12px; }
    :host([padding="lg"]) .card__header { padding: 16px 28px; }

    .card__footer {
      padding: 12px 20px;
      border-top: 1px solid var(--color-border-light, #e8e8eb);
      font-size: 0.82rem;
      color: var(--color-text-secondary, #555);
    }
    :host([padding="sm"]) .card__footer { padding: 8px 12px; }
    :host([padding="lg"]) .card__footer { padding: 16px 28px; }

    /* Focus */
    :host([href]) .card:focus-visible {
      outline: 2px solid var(--color-accent, #0055b3);
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
      border-bottom: 2px solid var(--color-border, #d4d4d8);
      overflow-x: auto;
    }

    .tab-btn {
      font-family: ${FONT_BODY};
      padding: 10px 20px;
      border: none;
      background: none;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-secondary, #555);
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .tab-btn:hover { color: var(--color-text, #1a1a1a); }
    .tab-btn--active {
      color: var(--color-accent, #0055b3);
      border-bottom-color: var(--color-accent, #0055b3);
    }
    .tab-btn:focus-visible { outline: 2px solid var(--color-accent, #0055b3); outline-offset: -2px; }

    .tab-panels {
      padding: 16px 0;
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
      background: var(--color-bg-nav, #1b1f24);
      color: var(--color-text-nav, #c9cdd3);
      font-family: ${FONT_BODY};
      transition: transform 0.2s ease, width 0.2s ease;
      z-index: 100;
      -webkit-overflow-scrolling: touch;
    }

    :host([position="right"]) .sidebar { right: 0; }
    :host(:not([position="right"])) .sidebar { left: 0; }

    :host(:not([open])) .sidebar { transform: translateX(-100%); }
    :host([position="right"]:not([open])) .sidebar { transform: translateX(100%); }
    :host([open]) .sidebar { transform: translateX(0); }

    .sidebar__header {
      padding: 20px 16px 12px;
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #fff;
    }

    .sidebar__body {
      padding: 0;
      flex: 1;
    }

    .sidebar__footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 0.75rem;
    }

    .toggle-btn {
      position: absolute;
      top: 12px;
      background: var(--color-bg-nav, #1b1f24);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      z-index: 101;
      transition: background 0.15s;
    }
    .toggle-btn:hover { background: var(--color-bg-nav-hover, #2a2f36); }

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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-scrollspy>
  //
  // Tracks scroll position of headings in a target container and highlights
  // the corresponding link in its slotted navigation list.
  //
  // Attributes:
  //   target   — CSS selector for the scrollable content container (default: document)
  //   selector — CSS selector for headings to observe (default: "h2, h3")
  //   offset   — px offset from top of viewport for activation (default: 80)
  //
  // Usage:
  //   <ds-scrollspy target=".content__main" selector="h2, h3">
  //     <ul>
  //       <li><a href="#section-1">Section 1</a></li>
  //       <li><a href="#section-2">Section 2</a></li>
  //     </ul>
  //   </ds-scrollspy>
  //
  // The component adds an "active" class to the <a> whose href matches
  // the currently visible heading.
  // ═══════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-toolbar>
  //
  // A sticky top toolbar with slots for title, breadcrumbs, and actions.
  //
  // Attributes:
  //   sticky — boolean, sticks to top on scroll (default: true)
  //
  // Slots:
  //   start       — left-aligned content (title, breadcrumbs)
  //   (default)   — center content
  //   end         — right-aligned actions (buttons, links)
  // ═══════════════════════════════════════════════════════════════════════════

  const TOOLBAR_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .toolbar {
      background: var(--color-bg, #ffffff);
      border-bottom: 1px solid var(--color-border, #d4d4d8);
      font-family: ${FONT_BODY};
    }

    :host([sticky]) .toolbar {
      position: sticky;
      top: 0;
      z-index: 90;
    }

    /* Primary row: start / center / end */
    .toolbar__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 20px;
      min-height: 48px;
    }

    .toolbar__start {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .toolbar__center {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .toolbar__end {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    ::slotted([slot="start"]) {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text, #1a1a1a);
    }

    /* Subtitle — sits below the title in the start area */
    .toolbar__subtitle {
      display: none;
      padding: 0 20px 6px;
      font-size: 0.82rem;
      color: var(--color-text-secondary, #555);
      line-height: 1.4;
    }
    .toolbar__subtitle.visible { display: block; }

    /* Nav row — horizontal link strip below the primary row */
    .toolbar__nav {
      display: none;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 14px;
      padding: 4px 20px 8px;
      font-size: 0.82rem;
      border-top: 1px solid var(--color-border-light, #e8e8eb);
    }
    .toolbar__nav.visible { display: flex; }

    ::slotted([slot="nav"]) {
      color: var(--color-link, #0055b3);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-sidenav>
  //
  // A left-side navigation with collapsible groups. Reads its structure from
  // slotted <ds-nav-group> and <ds-nav-link> elements or from a JSON attribute.
  //
  // Attributes:
  //   width — CSS width (default: "240px")
  //
  // Usage (declarative):
  //   <ds-sidenav>
  //     <ds-nav-link href="index.html" active>Overview</ds-nav-link>
  //     <ds-nav-group label="Common" open>
  //       <ds-nav-link href="common-example.html">example</ds-nav-link>
  //       <ds-nav-link href="common-link.html">link</ds-nav-link>
  //     </ds-nav-group>
  //   </ds-sidenav>
  //
  // Usage (JSON):
  //   <ds-sidenav items='[{"label":"Overview","href":"index.html"},...]'></ds-sidenav>
  // ═══════════════════════════════════════════════════════════════════════════

  const SIDENAV_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .sidenav {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      overflow-y: auto;
      background: var(--color-bg-nav, #1b1f24);
      color: var(--color-text-nav, #c9cdd3);
      font-family: ${FONT_BODY};
      z-index: 100;
      -webkit-overflow-scrolling: touch;
      padding: 20px 0;
    }

    .sidenav__title {
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #fff;
      padding: 0 16px;
      margin-bottom: 20px;
    }
    .sidenav__title a { color: inherit; text-decoration: none; }

    /* Nav links */
    .nav-link {
      display: block;
      padding: 5px 16px;
      color: var(--color-text-nav, #c9cdd3);
      text-decoration: none;
      font-size: 0.8125rem;
      line-height: 1.4;
      border-left: 3px solid transparent;
      transition: background 0.1s, color 0.1s;
    }
    .nav-link:hover {
      background: var(--color-bg-nav-hover, #2a2f36);
      color: #fff;
    }
    .nav-link--active {
      background: var(--color-bg-nav-active, #363b44);
      color: #fff;
      border-left-color: var(--color-accent, #0055b3);
      font-weight: 500;
    }
    .nav-link--child {
      padding-left: 26px;
    }

    /* Collapsible group */
    .nav-group { margin-top: 4px; }

    .nav-group__toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 6px 16px;
      background: none;
      border: none;
      border-left: 3px solid transparent;
      color: #808690;
      font-family: ${FONT_BODY};
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      text-align: left;
      transition: color 0.1s;
    }
    .nav-group__toggle:hover { color: var(--color-text-nav, #c9cdd3); }
    .nav-group--open > .nav-group__toggle { color: var(--color-text-nav, #c9cdd3); }

    .nav-group__arrow {
      font-size: 0.75rem;
      transition: transform 0.15s;
      line-height: 1;
    }
    .nav-group--open > .nav-group__toggle .nav-group__arrow { transform: rotate(90deg); }

    .nav-group__children { display: none; padding-bottom: 4px; }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-toc>
  //
  // A table of contents component that auto-builds a navigation list by
  // scanning headings in the page content. Highlights the active heading
  // on scroll using IntersectionObserver.
  //
  // Attributes:
  //   target   — CSS selector for the container to scan (default: scans the
  //              whole document)
  //   selector — CSS selector for headings to include (default: "h2[id], h3[id]")
  //   label    — title text shown above the link list (default: "On this page")
  //   offset   — px from the top of the viewport to trigger activation (default: 80)
  //
  // The component works with:
  //   - Native <h2 id="..."> / <h3 id="..."> elements
  //   - <ds-heading> elements (reads their anchor attribute or text content)
  //
  // Usage:
  //   <ds-toc></ds-toc>
  //   <ds-toc target=".content__main" selector="h2[id], h3[id]" label="On this page"></ds-toc>
  // ═══════════════════════════════════════════════════════════════════════════

  const TOC_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      position: sticky;
      top: 0;
      align-self: flex-start;
      width: var(--toc-width, 220px);
      flex-shrink: 0;
      max-height: 100vh;
      overflow-y: auto;
      padding: 48px 16px 48px 0;
      border-left: 1px solid var(--color-border-light, #e8e8eb);
      font-size: 0.75rem;
      -webkit-overflow-scrolling: touch;
    }

    .toc__title {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-secondary, #555);
      padding: 0 16px;
      margin: 0 0 8px;
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
      padding: 3px 16px;
      color: var(--color-text-secondary, #555);
      text-decoration: none;
      line-height: 1.4;
      transition: color 0.1s ease, border-left-color 0.1s ease;
      border-left: 2px solid transparent;
      margin-left: -1px;
    }

    a:hover {
      color: var(--color-link, #0055b3);
      border-left-color: var(--color-link, #0055b3);
    }

    a.active {
      color: var(--color-link, #0055b3);
      border-left-color: var(--color-link, #0055b3);
      font-weight: 500;
    }

    a.sub {
      padding-left: 26px;
      font-size: 0.6875rem;
      color: #888;
    }

    a.sub:hover,
    a.sub.active {
      color: var(--color-link, #0055b3);
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
      var nativeHeadings = Array.from(root.querySelectorAll(selector));
      var dsHeadings = Array.from(root.querySelectorAll("ds-heading[id]"));
      // Merge and deduplicate, preserving document order
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-schema-header>
  //
  // Page header for schema-driven pages. Wraps the page title, description,
  // and source file reference.
  //
  // Attributes:
  //   title       — page title
  //   description — schema description text
  //   source      — source file path
  //
  // Usage:
  //   <ds-schema-header title="DSDS Component Definitions"
  //     description="Documentation for components."
  //     source="entities/component.schema.json">
  //   </ds-schema-header>
  // ═══════════════════════════════════════════════════════════════════════════

  const SCHEMA_HEADER_CSS = `
    ${BASE_RESET}
    :host { display: block; margin-bottom: 24px; }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.3;
      margin: 0 0 16px;
      color: var(--color-text, #1a1a1a);
    }
    .desc {
      color: var(--color-text-secondary, #555);
      font-family: ${FONT_BODY};
      font-size: 0.9375rem;
      margin: 0 0 16px;
    }
    .source {
      font-size: 0.75rem;
      color: #999;
      margin: 0 0 24px;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-def-section>
  //
  // A definition section container with heading, description, type badge,
  // and bottom separator. Content is slotted.
  //
  // Attributes:
  //   name        — definition name (rendered as monospace h3)
  //   anchor      — anchor id (default: derived from name)
  //   description — definition description text
  //   type        — type string shown as a badge (e.g. "object", "string")
  //
  // Slots:
  //   (default) — section body content (prop tables, examples, etc.)
  //
  // Usage:
  //   <ds-def-section name="component" description="..." type="object">
  //     <ds-prop-table>...</ds-prop-table>
  //   </ds-def-section>
  // ═══════════════════════════════════════════════════════════════════════════

  const DEF_SECTION_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--color-border-light, #e8e8eb);
    }
    :host(:last-child) { border-bottom: none; }
    h3 {
      font-family: ${FONT_MONO};
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text, #1a1a1a);
      margin: 0 0 8px;
    }
    .desc {
      color: var(--color-text-secondary, #555);
      font-family: ${FONT_BODY};
      font-size: 0.9375rem;
      line-height: 1.6;
      margin: 0 0 16px;
    }
    .type-line { margin: 0 0 16px; }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-type-ref>
  //
  // An inline type-reference link with monospace font and dashed underline.
  //
  // Attributes:
  //   href — link target
  //
  // Content:
  //   Text content is the type name.
  //
  // Usage:
  //   <ds-type-ref href="common-rich-text.html#richtext">richText</ds-type-ref>
  // ═══════════════════════════════════════════════════════════════════════════

  const TYPE_REF_CSS = `
    ${BASE_RESET}
    :host { display: inline; }
    a {
      font-family: ${FONT_MONO};
      font-size: 0.875em;
      color: var(--color-link, #0055b3);
      text-decoration: none;
      border-bottom: 1px dashed var(--color-link, #0055b3);
      transition: color 0.1s, border-bottom-color 0.1s;
    }
    a:hover {
      color: var(--color-link-hover, #003d82);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-note>
  //
  // A highlighted note/callout box for constraints, conditionals, and warnings.
  //
  // Attributes:
  //   variant — "warning" (amber) | "info" (blue, default)
  //
  // Content:
  //   innerHTML — rich content (supports <strong>, <ds-code inline>, etc.)
  //
  // Usage:
  //   <ds-note variant="warning">
  //     <strong>Constraint:</strong> At least one of ...
  //   </ds-note>
  // ═══════════════════════════════════════════════════════════════════════════

  const NOTE_CSS = `
    ${BASE_RESET}
    :host { display: block; }
    .note {
      border-radius: 4px;
      padding: 8px 16px;
      font-family: ${FONT_BODY};
      font-size: 0.8125rem;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .note--warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
    }
    .note--info {
      background: var(--color-accent-subtle, #e8f0fe);
      border: 1px solid var(--color-border-light, #e8e8eb);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-cross-refs>
  //
  // A cross-references line listing related type definitions.
  //
  // Content:
  //   innerHTML — list of links/text (supports <a>, <ds-type-ref>, etc.)
  //
  // Usage:
  //   <ds-cross-refs>
  //     <strong>References:</strong>
  //     <a href="...">richText</a>, <a href="...">example</a>
  //   </ds-cross-refs>
  // ═══════════════════════════════════════════════════════════════════════════

  const CROSS_REFS_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      font-family: ${FONT_BODY};
      font-size: 0.8125rem;
      color: var(--color-text-secondary, #555);
      margin-top: 16px;
    }
    ::slotted(a) {
      font-family: ${FONT_MONO};
      font-size: 0.8125em;
    }
  `;

  class DsCrossRefs extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, CROSS_REFS_CSS);
      this._shadow.innerHTML = '<div part="refs"><slot></slot></div>';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-def-index>
  //
  // A page-level definition index showing all definitions in a file.
  //
  // Content:
  //   Slotted content — a <p> count and <ul> of links.
  //
  // Usage:
  //   <ds-def-index>
  //     <p><strong>5 definitions</strong> in this file:</p>
  //     <ul>
  //       <li><a href="#component">component</a></li>
  //     </ul>
  //   </ds-def-index>
  // ═══════════════════════════════════════════════════════════════════════════

  const DEF_INDEX_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      background: var(--color-bg-subtle, #f7f7f8);
      border: 1px solid var(--color-border-light, #e8e8eb);
      border-radius: 6px;
      padding: 16px 24px;
      margin-bottom: 48px;
    }
    ::slotted(p) {
      margin-bottom: 8px;
      font-size: 0.875rem;
    }
    ::slotted(ul) {
      list-style: none;
      padding: 0;
      margin: 0;
      column-count: 2;
      column-gap: 24px;
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
      "ds-def-index li { margin-bottom: 4px; font-size: 0.8125rem; break-inside: avoid; }",
      "ds-def-index li a { font-family: var(--font-mono); }",
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-def-example>
  //
  // A definition example block with a label and slotted code content.
  //
  // Content:
  //   Slotted content — typically a <ds-code> block.
  //
  // Usage:
  //   <ds-def-example>
  //     <ds-code language="json" label="example">{"kind":"component"}</ds-code>
  //   </ds-def-example>
  // ═══════════════════════════════════════════════════════════════════════════

  const DEF_EXAMPLE_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin-top: 16px;
      margin-bottom: 16px;
    }
    .title {
      font-family: ${FONT_BODY};
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-secondary, #555);
      margin: 0 0 8px;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-back-to-top>
  //
  // A "back to top" link that scrolls the page to the top.
  //
  // Attributes:
  //   label — link text (default: "↑ Back to top")
  //   href  — anchor target (default: "#")
  //
  // Usage:
  //   <ds-back-to-top></ds-back-to-top>
  //   <ds-back-to-top label="Top ↑"></ds-back-to-top>
  // ═══════════════════════════════════════════════════════════════════════════

  const BACK_TO_TOP_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    a {
      display: inline-block;
      margin-top: 48px;
      font-family: ${FONT_BODY};
      font-size: 0.8125rem;
      color: var(--color-text-secondary, #555);
      text-decoration: none;
      transition: color 0.15s;
    }

    a:hover {
      color: var(--color-link, #0055b3);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-footer>
  //
  // A page footer with border, muted text, and slotted content.
  //
  // Attributes:
  //   (none)
  //
  // Slots:
  //   (default) — footer content (paragraphs, links, etc.)
  //
  // Usage:
  //   <ds-footer>
  //     <p>Design System Documentation Standard (DSDS) 0.1</p>
  //     <p><a href="https://github.com/...">GitHub</a></p>
  //   </ds-footer>
  // ═══════════════════════════════════════════════════════════════════════════

  const FOOTER_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border-light, #e8e8eb);
      font-family: ${FONT_BODY};
      font-size: 0.8125rem;
      color: #999;
    }

    ::slotted(p) {
      margin: 0 0 4px;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-prop-table>
  //
  // A schema property table that reads <ds-prop> child elements declaratively.
  //
  // Usage:
  //   <ds-prop-table>
  //     <ds-prop name="kind" type='"component"' required>
  //       Identifies this entity as a component.
  //     </ds-prop>
  //     <ds-prop name="status" type="string | object">
  //       <code>"stable"</code>, <code>"experimental"</code>, etc.
  //     </ds-prop>
  //     <ds-prop name="items" type="array" conditional>
  //       At least one collection property must be present.
  //     </ds-prop>
  //   </ds-prop-table>
  //
  // <ds-prop> attributes:
  //   name        — property name (rendered as bold monospace <code>)
  //   type        — type string (rendered as monospace, supports HTML)
  //   required    — boolean, shows a "required" badge
  //   conditional — boolean, shows an "at least one" badge
  //   (neither)   — shows plain "optional" text
  //
  // <ds-prop> content:
  //   innerHTML is used as the description. Supports rich HTML: <code>,
  //   <small>, <br>, <a class="type-ref">, etc.
  // ═══════════════════════════════════════════════════════════════════════════

  const PROP_TABLE_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-family: ${FONT_BODY};
      font-size: 0.8125rem;
    }

    th {
      text-align: left;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-secondary, #555);
      padding: 8px 16px;
      border-bottom: 2px solid var(--color-border, #d4d4d8);
      background: var(--color-bg-subtle, #f7f7f8);
      white-space: nowrap;
    }

    td {
      padding: 8px 16px;
      border-bottom: 1px solid var(--color-border-light, #e8e8eb);
      vertical-align: top;
      line-height: 1.5;
    }

    tr:last-child td {
      border-bottom: none;
    }

    /* Column 1: Property name — monospace, bold */
    td:nth-child(1) code {
      font-family: ${FONT_MONO};
      font-weight: 600;
      color: var(--color-text, #1a1a1a);
      white-space: nowrap;
      font-size: 0.8125rem;
      background: none;
      padding: 0;
    }

    /* Column 2: Type — monospace, muted */
    td:nth-child(2) {
      font-family: ${FONT_MONO};
      font-size: 0.75rem;
      color: #666;
    }

    /* Column 3: Required — narrow */
    td:nth-child(3) {
      white-space: nowrap;
      font-size: 0.75rem;
    }

    /* Column 4: Description — max width, secondary color */
    td:nth-child(4) {
      font-size: 0.8125rem;
      color: var(--color-text-secondary, #555);
      max-width: 420px;
    }

    td:nth-child(4) small {
      display: block;
      margin-top: 4px;
      color: #888;
      font-size: 0.75rem;
    }

    td:nth-child(4) code {
      font-family: ${FONT_MONO};
      font-size: 0.8125rem;
      background: var(--color-bg-code, #f0f1f3);
      padding: 1px 5px;
      border-radius: 3px;
    }

    /* Type reference links inside cells */
    a.type-ref {
      font-family: ${FONT_MONO};
      font-size: 0.875em;
      color: var(--color-link, #0055b3);
      text-decoration: none;
      border-bottom: 1px dashed var(--color-link, #0055b3);
    }

    a.type-ref:hover {
      color: var(--color-link-hover, #003d82);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-step-number> — Numbered step circle for quickstart headings
  // Content: step number text (e.g. "1", "2")
  // ═══════════════════════════════════════════════════════════════════════════

  const STEP_NUMBER_CSS = `
    ${BASE_RESET}
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      position: relative;
      top: -1px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-accent, var(--ds-color-accent));
      color: #fff;
      font-family: ${FONT_BODY};
      font-size: 0.82rem;
      font-weight: 700;
      line-height: 28px;
      text-align: center;
      margin-right: 10px;
      flex-shrink: 0;
    }
  `;

  class DsStepNumber extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, STEP_NUMBER_CSS);
      this._shadow.innerHTML = "<slot></slot>";
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-callout> — Callout / info box with accent left border
  // Attributes: variant — "info" | "tip" | "warning" (default: "info")
  // Content: rich HTML (strong, links, lists, etc.)
  // ═══════════════════════════════════════════════════════════════════════════

  const CALLOUT_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .callout {
      border-left: 4px solid var(--color-accent, var(--ds-color-accent));
      background: var(--color-accent-subtle, var(--ds-color-accent-subtle));
      padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
      border-radius: 0 6px 6px 0;
      margin: var(--spacing-sm, 8px) 0 var(--spacing-lg, 24px);
      font-family: ${FONT_BODY};
      font-size: 0.88rem;
      line-height: 1.6;
      color: var(--color-text, var(--ds-color-text));
    }

    .callout--warning {
      border-left-color: var(--ds-color-warning-text, #f57f17);
      background: var(--ds-color-note-warning-bg, #fffbeb);
    }

    .callout--tip {
      border-left-color: var(--ds-color-encouraged-text, #1b5e20);
      background: var(--ds-color-encouraged-bg, #c8e6c9);
    }

    ::slotted(strong) {
      color: var(--color-accent, var(--ds-color-accent));
    }

    :host([variant="warning"]) ::slotted(strong) {
      color: var(--ds-color-warning-text, #f57f17);
    }

    :host([variant="tip"]) ::slotted(strong) {
      color: var(--ds-color-encouraged-text, #1b5e20);
    }

    ::slotted(ol),
    ::slotted(ul) {
      margin: 8px 0 0;
      padding-left: 20px;
    }

    ::slotted(a) {
      color: var(--color-link, var(--ds-color-accent));
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
      var v = this.getAttribute("variant") || "info";
      var el = this._shadow.querySelector(".callout");
      if (el) el.className = "callout callout--" + v;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-card-grid> — Responsive grid layout for cards
  // Attributes: min-width (default "240px"), gap
  // Content: slotted card elements
  // ═══════════════════════════════════════════════════════════════════════════

  const CARD_GRID_CSS = `
    ${BASE_RESET}
    :host {
      display: block;
      margin: var(--spacing-sm, 8px) 0 var(--spacing-lg, 24px);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--_min-width, 240px), 1fr));
      gap: var(--_gap, var(--spacing-sm, 8px));
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  class DsCardGrid extends HTMLElement {
    static get observedAttributes() {
      return ["min-width", "gap"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, CARD_GRID_CSS);
      this._shadow.innerHTML =
        '<div class="grid" part="grid"><slot></slot></div>';
    }

    connectedCallback() {
      this._applyCustomProps();
    }

    attributeChangedCallback() {
      this._applyCustomProps();
    }

    _applyCustomProps() {
      var minWidth = this.getAttribute("min-width");
      var gap = this.getAttribute("gap");
      var grid = this._shadow.querySelector(".grid");
      if (!grid) return;

      if (minWidth) {
        grid.style.setProperty("--_min-width", minWidth);
      } else {
        grid.style.removeProperty("--_min-width");
      }

      if (gap) {
        grid.style.setProperty("--_gap", gap);
      } else {
        grid.style.removeProperty("--_gap");
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-page-footer> — Footer bar for standalone pages
  // Content: paragraphs, links
  // ═══════════════════════════════════════════════════════════════════════════

  const PAGE_FOOTER_CSS = `
    ${BASE_RESET}
    :host { display: block; }

    .page-footer {
      border-top: 1px solid var(--color-border, var(--ds-color-border));
      padding: var(--spacing-lg, 24px);
      text-align: center;
      color: #999;
      font-family: ${FONT_BODY};
      font-size: 0.82rem;
      margin-top: var(--spacing-2xl, 48px);
    }

    ::slotted(p) {
      margin: 0 0 4px;
    }

    ::slotted(a) {
      color: var(--color-link, var(--ds-color-accent));
    }
  `;

  class DsPageFooter extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, PAGE_FOOTER_CSS);
      this._shadow.innerHTML =
        '<div class="page-footer" part="page-footer"><slot></slot></div>';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Register all custom elements
  // ═══════════════════════════════════════════════════════════════════════════

  const registry = [
    ["ds-button", DsButton],
    ["ds-code", DsCode],
    ["ds-badge", DsBadge],
    ["ds-table", DsTable],
    ["ds-prop-table", DsPropTable],
    ["ds-prop", DsProp],
    ["ds-toc", DsToc],
    ["ds-back-to-top", DsBackToTop],
    ["ds-footer", DsFooter],
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
    ["ds-schema-header", DsSchemaHeader],
    ["ds-def-section", DsDefSection],
    ["ds-type-ref", DsTypeRef],
    ["ds-note", DsNote],
    ["ds-cross-refs", DsCrossRefs],
    ["ds-def-index", DsDefIndex],
    ["ds-def-example", DsDefExample],
    ["ds-step-number", DsStepNumber],
    ["ds-callout", DsCallout],
    ["ds-card-grid", DsCardGrid],
    ["ds-page-footer", DsPageFooter],
  ];

  registry.forEach(function (entry) {
    if (!customElements.get(entry[0])) {
      customElements.define(entry[0], entry[1]);
    }
  });
})();
