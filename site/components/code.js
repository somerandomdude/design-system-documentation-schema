// ═══════════════════════════════════════════════════════════════════════════
// <ds-code>
//
// Attributes:
//   language — optional language label (e.g. "json", "bash")
//   label   — optional label shown in top-right corner
//   inline  — boolean, renders as inline <code> instead of block
//   wrap    — boolean, wraps long lines (white-space: pre-wrap) instead of
//             the default horizontal-scrolling single-line-per-line layout
//
// Content:
//   Text content inside the element is rendered as code.
//   For JSON content, set language="json" for syntax highlighting.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

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
    width: calc(100% + (var(--ds-space-4) * 2));
  }
  .wrapper pre { color: var(--ds-color-text); }
  .wrapper .hl-k { color: var(--ds-syntax-light-key); }
  .wrapper .hl-s { color: var(--ds-syntax-light-string); }
  .wrapper .hl-n { color: var(--ds-syntax-light-number); }
  .wrapper .hl-b { color: var(--ds-syntax-light-bool); }

  /* Styled like <ds-callout>'s .callout__title — a solid, bold tab, not a
     pill — instead of a <ds-badge>. */
  .code__label {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    font-family: ${FONT.body};
    font-weight: var(--ds-font-weight-bold);
    font-size: var(--ds-font-size-sm);
    background: var(--ds-color-text);
    color: var(--ds-color-text-inverse);
    padding: var(--ds-space-2) var(--ds-space-4);
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

  :host([wrap]) pre {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    overflow-x: visible;
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

export class DsCode extends HTMLElement {
  static get observedAttributes() {
    return ["language", "label", "inline", "wrap"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, CODE_CSS);
  }

  connectedCallback() {
    // Defer render to ensure the browser has finished parsing the
    // element's inner text content. When the custom element is
    // defined synchronously, connectedCallback fires as soon as the
    // opening tag is parsed — before child text nodes exist. A single
    // requestAnimationFrame tick isn't a reliable guarantee of that (see
    // the equivalent note in spec-nav.js), so wait for DOMContentLoaded
    // when the document is still loading.
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
      this._render();
    }
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
      ? `<span class="code__label" part="label">${esc(label)}</span>`
      : "";

    // tabindex lets keyboard users reach and scroll this block — `pre`
    // scrolls horizontally (overflow-x: auto) but sits outside the
    // natural tab order otherwise. No role/aria-label here: that would
    // make every instance an identically-named landmark region.
    this._shadow.innerHTML = `
      <div class="wrapper" part="wrapper">
        ${labelHtml}
        <pre part="pre" tabindex="0"><code part="code">${highlighted}</code></pre>
      </div>
    `;
  }
}
