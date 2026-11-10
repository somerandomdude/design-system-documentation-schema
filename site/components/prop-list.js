import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

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

export class DsPropTable extends HTMLElement {
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

    this._scrollToHash();
  }

  // Native #id URL-fragment navigation can't reach into shadow DOM, so a
  // page loaded with a #hash that names a property scrolls to it here, once
  // the table has rendered.
  _scrollToHash() {
    var shadow = this._shadow;
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
export class DsProp extends HTMLElement {
  constructor() {
    super();
  }
}
