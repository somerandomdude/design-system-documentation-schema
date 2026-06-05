import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const PROP_TABLE_CSS = `
  ${BASE_RESET}
  :host { display: block; margin: var(--ds-space-4) 0; max-width: 100%; overflow: hidden; }

  table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--ds-space-6);
    font-family: ${FONT.body};
    font-size: var(--ds-font-size-base);
  }

  th {
    text-align: left;
    font-weight: 600;
    font-size: var(--ds-font-size-sm);
    text-transform: none;
    letter-spacing: var(--ds-tracking-wide);
    color: var(--ds-color-text-secondary);
    padding: var(--ds-space-2) var(--ds-space-4);
    border-bottom: 2px solid var(--ds-color-border);
    background: transparent;
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
    font-size: var(--ds-font-size-sm);
  }

  /* Column 4: Description — gets all remaining space */
  td:nth-child(4) {
    font-size: var(--ds-font-size-base);
    color: var(--ds-color-text-secondary);
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

export class DsPropTable extends HTMLElement {
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
export class DsProp extends HTMLElement {
  constructor() {
    super();
  }
}
