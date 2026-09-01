// ═══════════════════════════════════════════════════════════════════════════
// <ds-code>
//
// Attributes:
//   language — optional language label (e.g. "json", "yaml", "bash")
//   label   — optional label shown in top-right corner
//   inline  — boolean, renders as inline <code> instead of block
//   wrap    — boolean, wraps long lines (white-space: pre-wrap) instead of
//             the default horizontal-scrolling single-line-per-line layout
//
// Content:
//   Text content inside the element is rendered as code.
//   For JSON or YAML content, set language="json"/"yaml" for syntax
//   highlighting.
//
// Syntax highlighting uses the CSS Custom Highlight API
// (https://www.bram.us/2024/02/18/custom-highlight-api-for-syntax-highlighting/)
// instead of wrapping tokens in <span>s: the code text stays a single,
// untouched Text node (set via textContent, never innerHTML), and
// highlighted ranges are registered separately via CSS.highlights and
// painted with ::highlight() in CODE_CSS below. This sidesteps a whole
// class of escape-order bug the previous span-wrapping approach was prone
// to (there's no HTML to mis-escape at all — textContent handles safety
// for every token, not just the ones this file's regex anticipates).
// Requires a browser with the API (Chrome 105+, Safari 17.2+, Firefox
// 140+ as of this writing) - no fallback path for older browsers; this is
// this site's only syntax-highlighting mechanism, deliberately, not one of
// two to keep in sync.
// ═══════════════════════════════════════════════════════════════════════════

import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const JSON_TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

// Tokenizes a JSON string into {start, end, cls} character-offset ranges,
// for the Custom Highlight API to paint — no HTML, no escaping, since the
// source text itself is never touched. A quoted token followed by `:` is a
// key; otherwise a string value. The colon itself is never part of a
// token's range, matching how the old span-based version left it unstyled.
function tokenizeJson(raw) {
  const tokens = [];
  JSON_TOKEN_RE.lastIndex = 0;
  let match;
  while ((match = JSON_TOKEN_RE.exec(raw))) {
    const [full, str, colon] = match;
    if (str !== undefined) {
      const start = match.index;
      tokens.push({ start, end: start + str.length, cls: colon ? "hl-k" : "hl-s" });
    } else {
      const cls = full === "true" || full === "false" || full === "null" ? "hl-b" : "hl-n";
      tokens.push({ start: match.index, end: match.index + full.length, cls });
    }
  }
  return tokens;
}

// ── YAML tokenizer ──────────────────────────────────────────────────────
// Line-based, not a real YAML parser - this only ever needs to highlight
// this site's own example files, not arbitrary YAML. Tracks one piece of
// state across lines (whether we're inside a block scalar opened by `>-`
// or `|`), since everything more-indented than the key that opened one is
// that scalar's literal text, not new structure to tokenize.

// A plain (unquoted) scalar counts as a boolean/null only when the ENTIRE
// value is exactly one of these words - "Turn the toggle on" never
// qualifies just because it contains "on".
const YAML_BOOL_RE = /^(?:true|false|null)$/;
// Likewise a number only when the entire value is numeric - "48px" and
// "2.5.5" stay strings, matching how YAML itself resolves scalar types
// (a value that's only partly numeric was never a number to begin with).
const YAML_NUMBER_RE = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
// Where a YAML key ends: identifier characters immediately followed by `:`
// and then whitespace or end of line. Doesn't match a quoted key
// ("my key": ...) - none of this site's own examples use one.
const YAML_KEY_RE = /^([A-Za-z0-9_.$-]+):(?=\s|$)/;
const YAML_BLOCK_SCALAR_RE = /^[|>][+-]?\d*$/;

// The first '#' that starts a real comment: preceded by whitespace or the
// start of the line, and not inside an open quote. -1 if there isn't one.
function findYamlCommentIndex(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return i;
    }
  }
  return -1;
}

// Splits a flow collection's inner text ("a, {b: c}, [d]") on its
// top-level commas only - a comma nested inside another [...]/{...} or a
// quoted string doesn't split. Offsets are relative to `text`.
function splitFlowSegments(text) {
  const segments = [];
  let depth = 0;
  let quote = null;
  let segStart = 0;
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (i === text.length || (ch === "," && depth === 0)) {
      segments.push({ text: text.slice(segStart, i), start: segStart });
      segStart = i + 1;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") depth--;
  }
  return segments;
}

// Tokenizes one YAML "value" position - the text after a key's `:`, a bare
// list item, or one segment of a flow collection - and pushes any tokens
// found onto `tokens`. Handles a quoted string, a flow sequence/mapping
// (recursing into its own segments), or a bare scalar.
function tokenizeYamlValue(text, offset, tokens) {
  const leading = text.match(/^\s*/)[0].length;
  const trailing = text.match(/\s*$/)[0].length;
  const value = text.slice(leading, text.length - trailing);
  if (!value) return;
  const valueOffset = offset + leading;

  if (value[0] === '"' || value[0] === "'") {
    const closeAt = value.lastIndexOf(value[0]);
    const end = closeAt > 0 ? closeAt + 1 : value.length;
    tokens.push({ start: valueOffset, end: valueOffset + end, cls: "hl-s" });
    return;
  }

  if (
    (value[0] === "[" && value[value.length - 1] === "]") ||
    (value[0] === "{" && value[value.length - 1] === "}")
  ) {
    const inner = value.slice(1, -1);
    const innerOffset = valueOffset + 1;
    for (const seg of splitFlowSegments(inner)) {
      tokenizeYamlSegment(seg.text, innerOffset + seg.start, tokens);
    }
    return;
  }

  const cls = YAML_BOOL_RE.test(value) ? "hl-b" : YAML_NUMBER_RE.test(value) ? "hl-n" : "hl-s";
  tokens.push({ start: valueOffset, end: valueOffset + value.length, cls });
}

// One segment inside a flow collection - either a bare value ([a, b]'s
// "a") or its own key: value pair ({status: stable}'s "status: stable").
function tokenizeYamlSegment(text, offset, tokens) {
  const leading = text.match(/^\s*/)[0].length;
  const rest = text.slice(leading);
  const keyMatch = rest.match(YAML_KEY_RE);
  if (keyMatch) {
    const keyStart = offset + leading;
    tokens.push({ start: keyStart, end: keyStart + keyMatch[1].length, cls: "hl-k" });
    tokenizeYamlValue(rest.slice(keyMatch[0].length), keyStart + keyMatch[0].length, tokens);
  } else {
    tokenizeYamlValue(text, offset, tokens);
  }
}

function tokenizeYaml(raw) {
  const tokens = [];
  let offset = 0;
  let blockScalarIndent = null;

  for (const line of raw.split("\n")) {
    const lineStart = offset;
    offset += line.length + 1;
    if (!line.trim()) continue;

    if (blockScalarIndent !== null) {
      const indent = line.match(/^\s*/)[0].length;
      if (indent > blockScalarIndent) continue; // still inside the scalar's own text
      blockScalarIndent = null; // dedented back out - parse this line normally below
    }

    const commentIndex = findYamlCommentIndex(line);
    const content = commentIndex === -1 ? line : line.slice(0, commentIndex);
    if (!content.trim()) continue;

    // Leading indentation plus any "- " list markers (more than one for a
    // list nested directly under another list, on one line).
    const prefixLen = content.match(/^(\s*(?:-\s+)*)/)[0].length;
    const rest = content.slice(prefixLen);
    if (!rest) continue;

    const keyMatch = rest.match(YAML_KEY_RE);
    if (!keyMatch) {
      tokenizeYamlValue(rest, lineStart + prefixLen, tokens);
      continue;
    }

    const keyStart = lineStart + prefixLen;
    tokens.push({ start: keyStart, end: keyStart + keyMatch[1].length, cls: "hl-k" });
    const valueText = rest.slice(keyMatch[0].length);
    if (YAML_BLOCK_SCALAR_RE.test(valueText.trim())) {
      blockScalarIndent = prefixLen; // opens a block scalar at this key's own indent
    } else {
      tokenizeYamlValue(valueText, keyStart + keyMatch[0].length, tokens);
    }
  }
  return tokens;
}

const TOKENIZERS = { json: tokenizeJson, yaml: tokenizeYaml, yml: tokenizeYaml };

const HIGHLIGHT_NAMES = ["hl-k", "hl-s", "hl-n", "hl-b"];

// One shared Highlight per token class, reused by every <ds-code> instance
// on the page. CSS.highlights is a single global registry, not scoped per
// shadow root, so a second instance calling CSS.highlights.set('hl-k', ...)
// would silently replace the first instance's highlight instead of adding
// to it. Each instance instead adds its own Ranges into these shared
// objects, and removes exactly those Ranges again on re-render or
// disconnect (see DsCode._clearRanges below). ::highlight() matching is
// itself scoped per shadow tree, so this sharing is safe: a rule defined in
// one <ds-code>'s shadow root only paints Ranges whose nodes live inside
// that same tree, even though the Highlight object backing it is shared.
const sharedHighlights = Object.fromEntries(
  HIGHLIGHT_NAMES.map((name) => {
    const highlight = new Highlight();
    CSS.highlights.set(name, highlight);
    return [name, highlight];
  }),
);

const CODE_CSS = `
  ${BASE_RESET}
  :host { display: block; }
  :host([inline]) { display: inline; }

  /* ── Block mode ──────────────────────────────────────── */
  /* No overflow: hidden - it used to pair with a border-radius this no
     longer has (nothing left to clip), and left in place it's actively
     harmful: an ancestor with any overflow other than visible becomes
     position: sticky's positioning reference for descendants (pre,
     below), so a sticky pre inside an overflow: hidden .wrapper sticks
     relative to .wrapper's own (always-static) box instead of the
     viewport - it just scrolls away with the page, never visibly
     pinning. */
  .wrapper {
    position: relative;
    background: var(--ds-color-bg-raised);
    inset: calc(var(--ds-space-4) * -1);
    top: 0;
    width: calc(100% + (var(--ds-space-4) * 2));
    height: calc(100% + (var(--ds-space-4) * 2));
  }
  .wrapper pre { color: var(--ds-color-text); }

  /* JSON/YAML syntax highlighting, painted via the CSS Custom Highlight API
     (registered in CSS.highlights by tokenizeJson()/tokenizeYaml()/_render()
     below). ::highlight() can't be nested under .wrapper the way the old
     span-based .wrapper .hl-k selectors were - it's a tree-scoped
     pseudo-element, not a descendant combinator target - but scoping still
     holds: only Ranges whose nodes live inside this shadow root paint here,
     even though the underlying Highlight objects are shared across every
     ds-code instance on the page. Note: no backticks in this comment - it
     lives inside CODE_CSS's own template literal, and a literal backtick
     here would terminate that string early. */
  ::highlight(hl-k) { color: var(--ds-syntax-light-key); }
  ::highlight(hl-s) { color: var(--ds-syntax-light-string); }
  ::highlight(hl-n) { color: var(--ds-syntax-light-number); }
  ::highlight(hl-b) { color: var(--ds-syntax-light-bool); }

  /* Styled like <ds-callout>'s .callout__title — a solid, bold tab, not a
     pill — instead of a <ds-badge>. */
  .code__label {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    font-family: ${FONT.body};
    font-weight: 520;
    font-size: var(--ds-font-size-sm);
    background: var(--ds-color-text);
    color: var(--ds-color-text-inverse);
    padding: var(--ds-space-2) var(--ds-space-4);
  }

  /* Sticky, not just .wrapper - when a code block sits in a stretched
     container taller than its own content (the schema page's split-layout
     .end column, stretched to match its row's .start column - see
     def-section.js), pre is the thing that visually pins near the top of
     the viewport as you scroll, same top offset as this site's other
     sticky elements (the def-section <h2> title, the nav bar itself). In
     any normal (unstretched) container this is a no-op: pre's containing
     block is exactly as tall as pre already is, so there's no room to
     stick within and nothing visibly changes. */
  pre {
    position: sticky;
    top: var(--ds-height-nav, 64px);
    margin: 0;
    padding: var(--ds-space-4) var(--ds-space-4);
    font-family: ${FONT.mono};
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-loose);
    overflow-x: auto;
    white-space: pre;
    container-type: scroll-state;
  }
  /* Docked-state styling: Chrome/Edge only (no @supports fallback, same
     stance as the CSS Custom Highlight API above) - a border only appears
     once pre has actually stuck, so it reads as "now floating over
     content" rather than a permanent line under every code block. On
     ::after, not pre itself: a scroll-state container query can restyle
     a *descendant* of its container, but not the container element
     itself (confirmed empirically - self-targeting is valid syntax that
     silently never matches). Also keeps pre's own text content a single,
     untouched node - no wrapping span that CSS.highlights' Range offsets
     would need to account for. Absolutely positioned so the 1px line
     doesn't add to pre's own scrollable content. */
  pre::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    height: 1px;
    background: transparent;
    transition: background-color var(--ds-duration-fast) var(--ds-ease-standard);
  }
  @container scroll-state(stuck: top) {
    pre::after {
      background: var(--ds-color-border);
    }
  }

  :host([wrap]) pre {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    overflow-x: visible;
  }

  /* For a fixed-width block (ASCII art, a diagram) where every line is the
     same length by construction - text-align centers each line
     individually, but since they're all equal width that lands on the
     same offset every time, so the block centers as a whole without
     distorting it. Opt-in: centering arbitrary code/prose whose lines
     vary in length would just look ragged. line-height: 1 and a heavier
     weight read better for art built from repeated characters (box-
     drawing, "#") than the site's normal loose reading line-height and
     regular weight, which were tuned for actual code. */
  :host([center]) pre {
    text-align: center;
    line-height: 1;
    font-weight: 700;
  }
  /* Vertically centers the block within .wrapper's own box - relevant
     specifically when a stretched container (the schema-page intro's
     .end column, matched to a tall .start) gives .wrapper more height
     than the art itself needs; in an unstretched container .wrapper is
     already exactly as tall as its content, so this is a no-op there. */
  :host([center]) .wrapper {
    display: grid;
    place-items: center;
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
    this._ranges = [];
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

  disconnectedCallback() {
    // Ranges hold live references to this instance's own text node. Once
    // this element is gone, leaving them in the shared Highlight objects
    // would both leak memory and paint stale, detached-node ranges if a
    // future document position ever coincided with their old offsets.
    this._clearRanges();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  // Removes exactly the Ranges this instance previously added, from
  // whichever shared Highlight objects they belong to — never touches
  // another instance's ranges.
  _clearRanges() {
    for (const { cls, range } of this._ranges) {
      sharedHighlights[cls].delete(range);
    }
    this._ranges = [];
  }

  _render() {
    this._clearRanges();

    // ── Inline mode: render as a styled <code> span ──────────
    if (this.hasAttribute("inline")) {
      var raw = this.textContent || "";
      this._shadow.innerHTML =
        '<code class="inline-code" part="code">' + esc(raw) + "</code>";
      return;
    }

    // ── Block mode: render as <pre><code> with syntax highlighting ──
    // label defaults to the language name (e.g. language="yaml" alone
    // shows a "yaml" tab) - but an explicit label="" opts out of that
    // default rather than being treated as "no label given".
    const label = this.hasAttribute("label")
      ? this.getAttribute("label")
      : this.getAttribute("language") || "";
    const lang = this.getAttribute("language") || "";
    const rawBlock = (this.textContent || "").trim();

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
        <pre part="pre" tabindex="0"><code part="code"></code></pre>
      </div>
    `;

    // Plain text, not innerHTML — the code stays one untouched Text node,
    // so Range offsets below line up exactly with `rawBlock`'s own indices,
    // and unhighlighted content needs no escaping at all (textContent is
    // always HTML-safe).
    const codeEl = this._shadow.querySelector("code");
    codeEl.textContent = rawBlock;

    const tokenize = TOKENIZERS[lang];
    if (tokenize && codeEl.firstChild) {
      for (const { start, end, cls } of tokenize(rawBlock)) {
        const range = new Range();
        range.setStart(codeEl.firstChild, start);
        range.setEnd(codeEl.firstChild, end);
        sharedHighlights[cls].add(range);
        this._ranges.push({ cls, range });
      }
    }
  }
}
