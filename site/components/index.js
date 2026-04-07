/**
 * DSDS Web Components — Barrel file
 *
 * Imports all component modules from individual files and registers
 * them as custom elements. This is the single entry point that pages
 * include via <script type="module" src="components/index.js">.
 *
 * Each component file exports its class(es). This barrel handles
 * registration so individual files stay focused on their component logic.
 */

import { DsButton } from "./button.js";
import { DsCode } from "./code.js";
import { DsBadge } from "./badge.js";
import { DsTable } from "./table.js";
import { DsHeading } from "./heading.js";
import { DsCard } from "./card.js";
import { DsTabs, DsTab } from "./tabs.js";
import { DsSidebar } from "./sidebar.js";
import { DsScrollspy } from "./scrollspy.js";
import { DsToolbar } from "./toolbar.js";
import { DsSidenav, DsNavGroup, DsNavLink } from "./sidenav.js";
import { DsToc } from "./toc.js";
import { DsBackToTop } from "./back-to-top.js";
import { DsFooter } from "./footer.js";
import { DsSchemaHeader } from "./schema-header.js";
import { DsDefSection } from "./def-section.js";
import { DsTypeRef } from "./type-ref.js";
import { DsNote } from "./note.js";
import { DsCrossRefs } from "./cross-refs.js";
import { DsDefIndex } from "./def-index.js";
import { DsDefExample } from "./def-example.js";
import { DsPropTable, DsProp } from "./prop-table.js";
import { DsNavToggle } from "./nav-toggle.js";
import { DsSpecNav } from "./spec-nav.js";
import { DsStepNumber } from "./step-number.js";
import { DsCallout } from "./callout.js";
import { DsCardGrid } from "./card-grid.js";
import { DsPageFooter } from "./page-footer.js";
import { DsTag } from "./tag.js";

const registry = [
  ["ds-button", DsButton],
  ["ds-code", DsCode],
  ["ds-badge", DsBadge],
  ["ds-table", DsTable],
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
  ["ds-toc", DsToc],
  ["ds-back-to-top", DsBackToTop],
  ["ds-footer", DsFooter],
  ["ds-schema-header", DsSchemaHeader],
  ["ds-def-section", DsDefSection],
  ["ds-type-ref", DsTypeRef],
  ["ds-note", DsNote],
  ["ds-cross-refs", DsCrossRefs],
  ["ds-def-index", DsDefIndex],
  ["ds-def-example", DsDefExample],
  ["ds-prop-table", DsPropTable],
  ["ds-prop", DsProp],
  ["ds-nav-toggle", DsNavToggle],
  ["ds-spec-nav", DsSpecNav],
  ["ds-step-number", DsStepNumber],
  ["ds-callout", DsCallout],
  ["ds-card-grid", DsCardGrid],
  ["ds-page-footer", DsPageFooter],
  ["ds-tag", DsTag],
];

for (const [name, ctor] of registry) {
  if (!customElements.get(name)) {
    customElements.define(name, ctor);
  }
}
