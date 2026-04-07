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

export function ensureTableLightStyles() {
  if (document.getElementById(TABLE_LIGHT_DOM_ID)) return;
  var style = document.createElement("style");
  style.id = TABLE_LIGHT_DOM_ID;
  style.textContent = [
    "ds-table table { width: 100%; border-collapse: collapse; font-size: var(--ds-font-size-md); }",
    "ds-table thead { background: transparent; }",
    "ds-table th {",
    "  text-align: left; font-weight: var(--ds-font-weight-semibold); font-size: var(--ds-font-size-sm);",
    "  text-transform: none; letter-spacing: var(--ds-tracking-wide);",
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

export class DsTable extends HTMLElement {
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
