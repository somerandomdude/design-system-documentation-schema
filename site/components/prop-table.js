import { createShadow, esc, BASE_RESET, FONT } from './_shared.js';

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
