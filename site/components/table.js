// ═══════════════════════════════════════════════════════════════════════════
// <ds-table>
//
// A styled table wrapper that accepts a slotted <table> element.
// All styling is encapsulated in shadow DOM — the slotted table inherits
// consistent typography, spacing, borders, and responsive overflow.
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

import { createShadow, BASE_RESET, FONT } from "./_shared.js";

const TABLE_CSS = `
  ${BASE_RESET}
  :host { display: block; margin: var(--ds-space-4) 0; }

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
    font-size: var(--ds-font-size-base);
    color: var(--ds-color-text);
  }
`;

/* Supplementary light-DOM styles for table internals (th, td, code)
   that ::slotted cannot reach. Injected once into the document head. */
const TABLE_LIGHT_DOM_ID = "ds-table-light-styles";

export function ensureTableLightStyles() {
  if (document.getElementById(TABLE_LIGHT_DOM_ID)) return;
  var style = document.createElement("style");
  style.id = TABLE_LIGHT_DOM_ID;
  style.textContent = [
    "ds-table table { width: 100%; border-collapse: collapse; font-size: var(--ds-font-size-base); }",
    "ds-table thead { background: transparent; }",
    "ds-table th {",
    "  text-align: left; font-weight: var(--ds-font-weight-bold); font-size: var(--ds-font-size-sm);",
    "  text-transform: none; letter-spacing: var(--ds-tracking-wide);",
    "  color: var(--ds-color-text-secondary);",
    "  padding: var(--ds-space-2) var(--ds-space-2);",
    "  white-space: nowrap;",
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

export class DsTable extends HTMLElement {
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
