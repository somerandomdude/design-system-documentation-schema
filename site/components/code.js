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

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

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

export class DsCode extends HTMLElement {
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
