(function () {
  "use strict";

  // ── _shared.js ──
  // Reuses `el.shadowRoot` if one already exists instead of always calling
  // attachShadow() - which throws ("already has a shadow root") the moment
  // any element in the built HTML carries a declarative shadow root
  // (<template shadowrootmode="open">, parsed and attached by the browser
  // itself before this constructor ever runs, no JS required). That's what
  // makes it safe for build-site.js/compile-mdx.mjs to emit real, semantic,
  // no-JS-visible markup (an actual <h1>, not just an inert custom element
  // only JS ever turns into one) for the handful of components worth that
  // treatment, without every other component's own createShadow() call
  // needing to know or care whether it was declared that way.
  function createShadow(el, css, mode) {
    const shadow = el.shadowRoot || el.attachShadow({ mode: mode || "open" });
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

  // Icons live as real .svg files in site/assets/ (edit them directly there)
  // instead of inline markup, so ICON_NAMES is just the name → file map.
  // loadIcon() fetches + caches each file's markup on first use; every icon
  // is monoline with stroke/fill="currentColor" so the containing element's
  // `color` recolors it once inlined into the DOM.
  const ICON_FILES = {
    menu: "icon-menu.svg",
    close: "icon-close.svg",
    info: "icon-info.svg",
    flask: "icon-flask.svg",
    dot: "icon-dot.svg",
    lightbulb: "icon-lightbulb.svg",
    warning: "icon-warning.svg",
    brackets: "icon-brackets.svg",
    logo: "dsds.svg",
  };

  const _iconCache = new Map();

  /**
   * Fetch (and cache) the raw markup of a named icon from site/assets/.
   * Returns a Promise<string> — always resolves, with "" on failure so a
   * missing/renamed file degrades to no icon rather than a thrown error.
   *
   * In the built site, scripts/build-site.js's bundler inlines every icon
   * file's contents at build time via seedIcons() below, so this fetch never
   * actually runs there — only in dev mode (served, never file://), where a
   * live fetch means editing an .svg under site/assets/ shows up on refresh
   * with no rebuild needed. The build-time inlining exists because fetch()
   * of a same-directory file is blocked outright under file:// (opening
   * site/dist/*.html directly, no server), which the bundle otherwise
   * supports.
   */
  function loadIcon(name) {
    if (_iconCache.has(name)) return _iconCache.get(name);
    const file = ICON_FILES[name];
    const promise = file
      ? fetch("assets/" + file)
          .then((res) => (res.ok ? res.text() : ""))
          .catch(() => "")
      : Promise.resolve("");
    _iconCache.set(name, promise);
    return promise;
  }

  /**
   * Pre-populate the icon cache with already-known markup, so loadIcon()
   * resolves instantly without a network request. Called once by the
   * bundled components.js (injected by scripts/build-site.js) with every
   * icon file's contents read at build time.
   */
  function seedIcons(map) {
    for (const name of Object.keys(map)) {
      _iconCache.set(name, Promise.resolve(map[name]));
    }
  }

  // ── inlined icon assets (build-time, see above) ──
  seedIcons({"menu":"<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"/>\n  <line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"/>\n  <line x1=\"3\" y1=\"18\" x2=\"21\" y2=\"18\"/>\n</svg>\n","close":"<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <line x1=\"5\" y1=\"5\" x2=\"19\" y2=\"19\"/>\n  <line x1=\"19\" y1=\"5\" x2=\"5\" y2=\"19\"/>\n</svg>\n","info":"<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"12\" cy=\"12\" r=\"9\"/>\n  <line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"16\"/>\n  <circle cx=\"12\" cy=\"7.5\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/>\n</svg>\n","flask":"<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M9 3h6\"/>\n  <path d=\"M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3\"/>\n  <line x1=\"6.5\" y1=\"15\" x2=\"17.5\" y2=\"15\"/>\n</svg>\n","dot":"<svg viewBox=\"0 0 24 24\" width=\"8\" height=\"8\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"12\" cy=\"12\" r=\"10\"/>\n</svg>\n","lightbulb":"<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M9 18h6\"/>\n  <path d=\"M10 22h4\"/>\n  <path d=\"M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.05V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-.25c0-.85.4-1.55 1-2.05A7 7 0 0 0 12 2z\"/>\n</svg>\n","warning":"<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M12 2 1 21h22L12 2z\"/>\n  <line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"14\"/>\n  <circle cx=\"12\" cy=\"17.5\" r=\"0.7\" fill=\"currentColor\" stroke=\"none\"/>\n</svg>\n","brackets":"<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M8 5c-1.5 0-2 .8-2 2v3c0 1.4-.6 2-2 2 1.4 0 2 .6 2 2v3c0 1.2.5 2 2 2\"/>\n  <path d=\"M16 5c1.5 0 2 .8 2 2v3c0 1.4.6 2 2 2-1.4 0-2 .6-2 2v3c0 1.2-.5 2-2 2\"/>\n</svg>\n","logo":"<svg width=\"1550\" height=\"1550\" viewBox=\"0 0 1550 1550\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M0 0H1550V1550H0V0ZM75 75V1475H1475V75H75Z\" fill=\"black\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M575 300H300V650H575C616.421 650 650 616.421 650 575V375C650 333.579 616.421 300 575 300ZM225 225V725H575C657.843 725 725 657.843 725 575V375C725 292.157 657.843 225 575 225H225Z\" fill=\"black\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M825 368.75C825 289.359 889.359 225 968.75 225H1181.25C1260.64 225 1325 289.359 1325 368.75H1250C1250 330.78 1219.22 300 1181.25 300H968.75C930.78 300 900 330.78 900 368.75C900 406.72 930.78 437.5 968.75 437.5H1181.25C1260.64 437.5 1325 501.859 1325 581.25C1325 660.641 1260.64 725 1181.25 725H968.75C889.359 725 825 660.641 825 581.25H900C900 619.22 930.78 650 968.75 650H1181.25C1219.22 650 1250 619.22 1250 581.25C1250 543.28 1219.22 512.5 1181.25 512.5H968.75C889.359 512.5 825 448.141 825 368.75Z\" fill=\"black\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M575 900H300V1250H575C616.421 1250 650 1216.42 650 1175V975C650 933.579 616.421 900 575 900ZM225 825V1325H575C657.843 1325 725 1257.84 725 1175V975C725 892.157 657.843 825 575 825H225Z\" fill=\"black\"/>\n<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M825 968.75C825 889.359 889.359 825 968.75 825H1181.25C1260.64 825 1325 889.359 1325 968.75H1250C1250 930.78 1219.22 900 1181.25 900H968.75C930.78 900 900 930.78 900 968.75C900 1006.72 930.78 1037.5 968.75 1037.5H1181.25C1260.64 1037.5 1325 1101.86 1325 1181.25C1325 1260.64 1260.64 1325 1181.25 1325H968.75C889.359 1325 825 1260.64 825 1181.25H900C900 1219.22 930.78 1250 968.75 1250H1181.25C1219.22 1250 1250 1219.22 1250 1181.25C1250 1143.28 1219.22 1112.5 1181.25 1112.5H968.75C889.359 1112.5 825 1048.14 825 968.75Z\" fill=\"black\"/>\n</svg>\n"});

  // ── code.js ──
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

  class DsCode extends HTMLElement {
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

  // ── badge.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-badge>
  //
  // Attributes:
  //   variant — "kind" | "experimental" | (default: neutral)
  //
  // Content:
  //   Text label inside the element.
  //
  // Design: a white chip with a small color-coded icon block on the left —
  // the variant's meaning lives in the block's color + icon, not the chip's
  // overall background.
  // ═══════════════════════════════════════════════════════════════════════════

  const BADGE_ICON_NAME = {
    kind: "info",
    experimental: "flask",
    neutral: "dot",
  };

  const BADGE_CSS = `
    ${BASE_RESET}
    :host { display: inline-flex; vertical-align: middle; }

    .badge {
      display: inline-flex;
      align-items: stretch;
      font-family: ${FONT.body};
      text-transform: none;
      white-space: nowrap;
      height: 24px;
      font-size: .75em;
      background: var(--ds-color-bg-inverse);
      color: var(--ds-color-text);
    }

    .badge__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      flex-shrink: 0;
      color: var(--ds-color-bg-inverse);
    }

    .badge__icon svg {
      display: block;
    }

    .badge__label {
      display: inline-flex;
      align-items: center;
      padding: 0 0.75em;
    }

    /* Used by <ds-def-section>'s type badge */
    .badge--kind .badge__icon { background: var(--ds-color-text); }
    /* Used by <ds-prop-table>'s "at least one" conditional marker */
    .badge--experimental .badge__icon { background: var(--ds-color-warning-text); }
    /* Default / neutral */
    .badge--neutral .badge__icon { background: var(--ds-color-accent); }
  `;

  class DsBadge extends HTMLElement {
    static get observedAttributes() {
      return ["variant"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, BADGE_CSS);
      this._shadow.innerHTML =
        '<span class="badge" part="badge">' +
        // Decorative — the variant's meaning is redundant with the visible
        // label text next to it, so this is hidden from assistive tech.
        '<span class="badge__icon" part="icon" aria-hidden="true"></span>' +
        '<span class="badge__label" part="label"><slot></slot></span>' +
        "</span>";
    }

    connectedCallback() {
      this._updateVariant();
    }

    attributeChangedCallback() {
      this._updateVariant();
    }

    _updateVariant() {
      const variant = this.getAttribute("variant") || "neutral";
      const el = this._shadow.querySelector(".badge");
      const icon = this._shadow.querySelector(".badge__icon");
      if (el) el.className = "badge badge--" + variant;
      const name = BADGE_ICON_NAME[variant] || "dot";
      loadIcon(name).then((svg) => {
        if (icon) icon.innerHTML = svg;
      });
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
      max-width: 100%;
      /* separate + zero spacing (not collapse) so the sticky header's cells
         keep their background/position correctly in Safari, which has long-
         standing bugs with position:sticky inside a border-collapsed table. */
      border-collapse: separate;
      border-spacing: 0;
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      color: var(--ds-color-text);
      /* Same bleed treatment as <ds-prop-table>: nudge the table out to the
         edges of its container by --ds-space-2 on each side. */
      position: relative;
      inset: calc(var(--ds-space-4) * -1);
      width: calc(100% + (var(--ds-space-4) * 2));
      max-width: calc(100% + (var(--ds-space-4) * 2));
      top: 0;
      bottom: 0;
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
      "ds-table table {",
      "  width: calc(100% + (var(--ds-space-4) * 2)); max-width: calc(100% + (var(--ds-space-4) * 2));",
      "  border-collapse: separate; border-spacing: 0; font-size: var(--ds-font-size-base);",
      "  position: relative; inset: calc(var(--ds-space-4) * -1); top: 0; bottom: 0;",
      "}",
      "ds-table th {",
      "  text-align: start; font-weight: var(--ds-font-weight-bold); font-size: var(--ds-font-size-sm);",
      "  text-transform: none; letter-spacing: var(--ds-tracking-wide);",
      "  color: var(--ds-color-text);",
      "  padding: var(--ds-space-2) var(--ds-space-2);",
      "  white-space: nowrap;",
      "  position: sticky;",
      "  top: 0;",
      "  z-index: var(--ds-z-base, 1);",
      "  background: var(--ds-color-bg-raised);",
      "}",
      "ds-table td {",
      "  padding: var(--ds-space-4) var(--ds-space-2);",
      "  vertical-align: top; line-height: var(--ds-line-height-relaxed);",
      "}",
      "ds-table tr:last-child td { border-bottom: none; }",
      "ds-table a { color: var(--ds-color-accent); }",
      "ds-table td:first-child { white-space: nowrap; }",
      "ds-table td:first-child ds-code[inline] { white-space: nowrap; }",
      "th:first-child, td:first-child { padding-inline-start: var(--ds-space-4); }",
      "th:last-child, td:last-child { padding-inline-end: var(--ds-space-4); }"
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

  class DsHeading extends HTMLElement {
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
      transition: color var(--ds-duration-fast) var(--ds-ease-standard);
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
    /* min-height set twice on purpose - 100dvh (mobile-chrome-aware) as a
       cascading enhancement over 100vh, not a replacement; see style.css's
       body rule for the same pattern and why. */
    :host { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; background: var(--ds-color-bg-accent); justify-content: end; padding-block-start: var(--ds-height-nav, 64px); }

    h1 {
      font-size: clamp(2em, 4vw, 4em);
      font-family: ${FONT.mono};
      font-weight: 500;
      line-height: 1.1;
      letter-spacing: -0.025em;
      word-spacing: -0.25em;
      margin: 0 0 var(--ds-space-4);
      color: var(--ds-color-text);
      word-break: break-word;
    }
    .header-container {
      max-width: var(--ds-width-content);
      margin: 0 auto;
      padding: var(--ds-space-8) var(--ds-space-8);
      width: 100%;
      padding-block-end: 64px;
      padding-block-start: 128px;
    }

    .desc {
      color: var(--ds-color-text);
      font-family: ${FONT.body};
      margin: 0 0 var(--ds-space-4);
      max-width: 65ch;
      font-size: clamp(1.05em, 1.7vw, 1.375em);
      font-weight: 500;
      line-height: 1.4;
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
    connectedCallback() {
      // Shadow-root creation deferred to DOMContentLoaded, not the
      // constructor - see heading.js's own connectedCallback for the full
      // reasoning (a build-time declarative shadow root, from
      // build-site.js's injectDeclarativeShadowDom(), isn't parsed yet at
      // constructor time for an already-defined custom element, so
      // createShadow() would attach a second, conflicting shadow root if
      // called that early).
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this._init(), {
          once: true,
        });
      } else {
        this._init();
      }
    }
    _init() {
      this._shadow = createShadow(this, HEADER_CSS);
      this._render();
    }
    attributeChangedCallback() {
      if (this.isConnected && this._shadow) this._render();
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

  class DsDefSection extends HTMLElement {
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

  // ── guide-section.js ──
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

  class DsGuideSection extends HTMLElement {
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

  // ── type-ref.js ──
  const TYPE_REF_CSS = `
    ${BASE_RESET}
    :host { display: inline; }
    a {
      font-family: ${FONT.mono};
      font-size: inherit;
      color: inherit;
      text-decoration: underline;
      background: var(--ds-color-bg-inverse);
      padding: 0 0.25em;
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
      // A single requestAnimationFrame tick isn't a reliable guarantee that
      // this element's light-DOM children (read via textContent below) have
      // finished parsing — see the equivalent note in spec-nav.js. Waiting
      // for DOMContentLoaded when the document is still loading avoids an
      // intermittent empty-link-text race.
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
      max-width: 65ch;
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

  // ── prop-list.js ──
  const PROP_TABLE_CSS = `
    ${BASE_RESET}
    :host { display: block; margin: var(--ds-space-4) 0 var(--ds-space-8); }

    .prop-list {
      display: flex;
      flex-direction: column;
    }

    .prop {
      padding: var(--ds-space-4) 0;
    }

    .prop:first-child { padding-top: 0; }
    .prop:last-child { padding-bottom: 0; }

    .prop-head {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      column-gap: var(--ds-space-2);
      row-gap: var(--ds-space-1);
      margin: 0 0 var(--ds-space-1);
      font-weight: var(--ds-font-weight-bold);
    }

    /* Reset the <h3> this renders into — it must look like the rest of the
       row, not an independent page heading. It's a real heading element (not
       a styled div) so each property shows up in the accessibility tree's
       heading outline and is reachable by AT heading navigation, matching
       <ds-heading>'s anchor pattern below. h3, not h4: every <ds-prop-table>
       on the schema pages this renders on sits directly inside a
       <ds-def-section>'s own <h2>, with nothing at h3 in between — jumping to
       h4 would skip a level. */
    h3.prop-head {
      font-size: var(--ds-font-size-base);
      line-height: var(--ds-line-height-snug);
    }

    .prop-name {
      font-family: ${FONT.mono};
      font-weight: var(--ds-font-weight-bold);
      color: var(--ds-color-text);
      font-size: var(--ds-font-size-base);
      background: none;
      padding: 0;
    }

    .prop-type {
      font-family: ${FONT.mono};
      font-weight: var(--ds-font-weight-regular);
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text);
      white-space: normal;
      overflow-wrap: break-word;
    }

    .prop-status {
      font-family: ${FONT.body};
      font-weight: var(--ds-font-weight-regular);
      font-size: var(--ds-font-size-sm);
      color: var(--ds-color-text);
    }

    /* Deep-link, revealed on row hover — mirrors <ds-heading>'s anchor-link
       (after the text, not before - order: 1 moves it past prop-name/
       prop-type/prop-status, all still default order: 0, regardless of
       which of them wrap onto their own line). */
    .prop-anchor {
      order: 1;
      display: inline;
      opacity: 0;
      margin-inline-start: var(--ds-space-1);
      color: var(--ds-color-text);
      text-decoration: none;
      font-size: 0.85em;
      transition: opacity var(--ds-duration-fast) var(--ds-ease-standard);
    }
    /* :where() zeroes out .prop:hover's contribution to specificity here,
       so .prop-anchor:hover naturally outranks it on direct hover - same
       fix as <ds-heading>'s own anchor-link, no !important needed. */
    :where(.prop:hover) .prop-anchor { opacity: 0.5; }
    .prop-anchor:hover { opacity: 1; }

    .prop-desc {
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      line-height: 1.5;
      color: var(--ds-color-text);
      max-width: 70ch;
    }

    .prop-desc small {
      display: block;
      margin-top: var(--ds-space-1);
      color: var(--ds-color-text);
      font-size: var(--ds-font-size-sm);
    }

    .prop-desc code {
      font-family: ${FONT.mono};
      font-size: var(--ds-font-size-base);
      background: var(--ds-color-bg-muted);
      padding: 1px 5px;
    }
  `;

  // Property names are unique within one <ds-prop-table> (they come from a
  // schema's own `properties` map, whose keys can't repeat), so collisions
  // can only happen across *different* tables on the same page — e.g. two
  // $defs that both document a "name" field. Scoping each anchor under the
  // id of the nearest ancestor that has one (a <ds-def-section>, in every
  // page this renders on) keeps ids stable and predictable instead of
  // falling back to an arbitrary "-2" suffix in the common case.
  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  class DsPropTable extends HTMLElement {
    constructor() {
      super();
      this._shadow = createShadow(this, PROP_TABLE_CSS);
    }

    connectedCallback() {
      // Defer to let child <ds-prop> elements parse. A single
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

      var scopeEl = this.closest("[id]");
      var scope = scopeEl ? scopeEl.id : "";
      var usedIds = {};

      var blocks = props
        .map(function (prop) {
          var name = prop.getAttribute("name") || "";
          var type = prop.getAttribute("type") || "";
          var desc = prop.innerHTML.trim();

          var base = (scope ? scope + "-" : "") + slugify(name);
          var anchor = base;
          var n = 2;
          while (usedIds[anchor] || document.getElementById(anchor)) {
            anchor = base + "-" + n++;
          }
          usedIds[anchor] = true;

          // Plain text, not a badge/pill - required-ness is a fact about
          // the field, not a tag.
          var status = "";
          if (prop.hasAttribute("required")) {
            status = '<span class="prop-status" part="status">required</span>';
          } else if (prop.hasAttribute("conditional")) {
            status = '<span class="prop-status" part="status">at least 1 required</span>';
          }

          return (
            '<div class="prop" id="' +
            esc(anchor) +
            '" part="prop">' +
            '<h3 class="prop-head" part="prop-head">' +
            '<a class="prop-anchor" href="#' +
            esc(anchor) +
            '" part="anchor" aria-label="Link to ' +
            esc(name) +
            '">#</a>' +
            '<code class="prop-name" part="name">' +
            esc(name) +
            "</code>" +
            '<span class="prop-type" part="type">' +
            type +
            "</span>" +
            status +
            "</h3>" +
            '<div class="prop-desc" part="desc">' +
            desc +
            "</div>" +
            "</div>"
          );
        })
        .join("\n");

      this._shadow.innerHTML =
        '<div class="prop-list" part="list">' + blocks + "</div>";

      this._wireAnchors();
    }

    // Native #id URL-fragment navigation can't reach into shadow DOM — the
    // browser's scroll-to-fragment lookup only ever checks the top-level
    // document, and every anchor this renders lives inside this element's own
    // shadow root. So deep links here need their own scroll handling: on
    // click (intercepting the default same-page navigation), and once on
    // render (in case the page loaded with a matching #hash already in the
    // URL, before this table existed to be scrolled to).
    _wireAnchors() {
      var shadow = this._shadow;

      shadow.querySelectorAll(".prop-anchor").forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          var id = link.getAttribute("href").slice(1);
          var target = shadow.querySelector('[id="' + CSS.escape(id) + '"]');
          if (!target) return;
          history.pushState(null, "", "#" + id);
          target.scrollIntoView({ block: "start" });
        });
      });

      var currentHash = location.hash.slice(1);
      if (!currentHash) return;
      var target = shadow.querySelector('[id="' + CSS.escape(currentHash) + '"]');
      if (!target) return;
      // rAF, not a same-tick call: the shadow DOM was just written and needs
      // a layout pass before scrollIntoView() has a box to scroll to.
      requestAnimationFrame(function () {
        target.scrollIntoView({ block: "start" });
      });
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

  class DsSpecNav extends HTMLElement {
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

  // ── callout.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-callout>
  //
  // A callout / info box: a bold title above a plain white content box —
  // the variant's meaning lives in the title's color, not an icon.
  //
  // Attributes:
  //   variant — "info" | "tip" | "warning" (default: "info")
  //   title   — bold lead-in text shown above the content (e.g. "Tip:").
  //             Omit for no title.
  //
  // Slots:
  //   (default) — callout content (may include links, lists, etc.)
  //
  // Usage:
  //   <ds-callout title="Key idea:">
  //     Some important information here.
  //   </ds-callout>
  //
  //   <ds-callout variant="tip" title="Tip:">
  //     A helpful suggestion.
  //   </ds-callout>
  // ═══════════════════════════════════════════════════════════════════════════

  const CALLOUT_CSS = `
    ${BASE_RESET}
    :host { display: block; max-width: 65ch; }

    .callout {
      margin: var(--ds-space-2) 0 var(--ds-space-8);
      font-family: ${FONT.body};
      font-size: var(--ds-font-size-base);
      line-height: var(--ds-line-height-loose);
      color: var(--ds-color-text);
    }

    .callout__title {
      font-weight: var(--ds-font-weight-bold);
      /* Default ("info") variant. */
      background: var(--ds-color-text);
      color: var(--ds-color-text-inverse);
      display: inline-block;
      padding: var(--ds-space-2) var(--ds-space-4);
      padding-inline-end: calc(var(--ds-space-4) + var(--ds-space-2));
    }

    .callout__title:empty {
      display: none;
    }

    .callout--warning .callout__title { background: var(--ds-color-warning-text); }
    .callout--tip .callout__title { background: var(--ds-color-encouraged-text); }

    .callout__content {
      background: var(--ds-color-bg-inverse);
      padding: var(--ds-space-4);
    }

    ::slotted(strong) {
      background: var(--ds-color-accent);
    }

    :host([variant="warning"]) ::slotted(strong) {
      background: var(--ds-color-warning-text);
    }

    :host([variant="tip"]) ::slotted(strong) {
      background: var(--ds-color-encouraged-text);
    }

    ::slotted(ol),
    ::slotted(ul) {
      margin: var(--ds-space-2) 0 0;
      padding-inline-start: var(--ds-space-4);
    }

    ::slotted(a) {
      color: var(--ds-color-accent);
      text-decoration-thickness: 1px;
      text-underline-offset: 2px;
    }

    ::slotted(p:first-child) {
      margin-top: 0;
    }

    ::slotted(p:last-child) {
      margin-bottom: 0 !important;
    }
  `;

  class DsCallout extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "title"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, CALLOUT_CSS);
      this._shadow.innerHTML =
        '<div class="callout" part="callout">' +
        '<span class="callout__title" part="title"></span>' +
        '<div class="callout__content" part="content"><slot></slot></div>' +
        "</div>";
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      this._render();
    }

    _render() {
      const variant = this.getAttribute("variant") || "info";
      const title = this.getAttribute("title") || "";
      const el = this._shadow.querySelector(".callout");
      const titleEl = this._shadow.querySelector(".callout__title");
      if (el) el.className = "callout callout--" + variant;
      if (titleEl) titleEl.textContent = title;
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
  // The DSDS mark, fetched from site/assets/dsds.svg and inlined so its fill
  // can be recolored at runtime. Edit site/assets/dsds.svg directly to change
  // the mark — this component just loads and colors whatever's there.
  //
  // Attributes:
  //   size       — width/height, any CSS length (default: 40px)
  //   background — host background color (default: transparent)
  //   fill       — SVG fill color (default: var(--ds-color-text))
  //   label      — accessible label. Omit when the logo sits next to visible
  //                text that already names it (the default: decorative,
  //                aria-hidden). Set it when the logo is used standalone.
  //
  // Usage:
  //   <ds-logo></ds-logo>
  //   <ds-logo size="24px" fill="#fff" background="#0055b3"></ds-logo>
  //   <ds-logo label="DSDS home"></ds-logo>
  // ═══════════════════════════════════════════════════════════════════════════

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
      return ["size", "background", "fill", "label"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, LOGO_CSS);
      loadIcon("logo").then((svg) => {
        this._shadow.innerHTML = svg;
        this._syncA11y();
      });
    }

    connectedCallback() {
      this._sync();
    }

    attributeChangedCallback(name) {
      if (name === "label") {
        this._syncA11y();
        return;
      }
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

      this._syncA11y();
    }

    _syncA11y() {
      const svg = this._shadow.querySelector("svg");
      if (!svg) return;
      const label = this.getAttribute("label");
      if (label) {
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", esc(label));
        svg.removeAttribute("aria-hidden");
      } else {
        // Decorative by default — used next to visible text (e.g. the nav
        // title) that already names it.
        svg.setAttribute("aria-hidden", "true");
        svg.removeAttribute("role");
        svg.removeAttribute("aria-label");
      }
    }
  }

  // ── icon-button.js ──
  // ═══════════════════════════════════════════════════════════════════════════
  // <ds-icon-button>
  //
  // A minimal icon-only button: a slotted icon plus a required accessible
  // label. No built-in positioning, color variants, or sizes — that's left to
  // whatever's using it (e.g. wrap it and set :host on the wrapper to make a
  // fixed floating button).
  //
  // Attributes:
  //   label — accessible name (required — this button has no visible text)
  //
  // Slots:
  //   (default) — icon markup (e.g. an inline <svg>)
  //
  // Usage:
  //   <ds-icon-button label="Toggle JSON view">
  //     <svg>...</svg>
  //   </ds-icon-button>
  // ═══════════════════════════════════════════════════════════════════════════

  const ICON_BUTTON_CSS = `
    ${BASE_RESET}
    :host { display: inline-flex; }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      background: var(--ds-color-text);
      color: var(--ds-color-bg-inverse);
      border: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background-color var(--ds-duration-fast) var(--ds-ease-standard);
    }

    button:hover {
      background: var(--ds-color-accent);
    }

    ::slotted(*) {
      display: block;
    }
  `;

  class DsIconButton extends HTMLElement {
    static get observedAttributes() {
      return ["label"];
    }

    constructor() {
      super();
      this._shadow = createShadow(this, ICON_BUTTON_CSS);
      this._shadow.innerHTML =
        '<button type="button" part="button"><slot></slot></button>';
    }

    connectedCallback() {
      this._syncLabel();
    }

    attributeChangedCallback() {
      this._syncLabel();
    }

    _syncLabel() {
      const btn = this._shadow.querySelector("button");
      if (btn) btn.setAttribute("aria-label", this.getAttribute("label") || "");
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
    ["ds-guide-section", DsGuideSection],
    ["ds-type-ref", DsTypeRef],
    ["ds-cross-refs", DsCrossRefs],
    ["ds-prop-table", DsPropTable],
    ["ds-prop", DsProp],
    ["ds-spec-nav", DsSpecNav],
    ["ds-callout", DsCallout],
    ["ds-tag", DsTag],
    ["ds-logo", DsLogo],
    ["ds-icon-button", DsIconButton],
  ];

  for (const [name, ctor] of registry) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  }
})();
