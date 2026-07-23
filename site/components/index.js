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

import { DsCode } from "./code.js";
import { DsBadge } from "./badge.js";
import { DsTable } from "./table.js";
import { DsHeading } from "./heading.js";
import { DsBackToTop } from "./back-to-top.js";
import { DsHeader } from "./header.js";
import { DsDefSection } from "./def-section.js";
import { DsTypeRef } from "./type-ref.js";
import { DsCrossRefs } from "./cross-refs.js";
import { DsDefIndex } from "./def-index.js";
import { DsDefExample } from "./def-example.js";
import { DsPropTable, DsProp } from "./prop-table.js";
import { DsSpecNav } from "./spec-nav.js";
import { DsCallout } from "./callout.js";
import { DsTag } from "./tag.js";
import { DsLogo } from "./logo.js";
import { DsIconButton } from "./icon-button.js";
import { DsButton } from "./button.js";
import { DsLink } from "./link.js";
import { DsJsonView } from "./json-view.js";

const registry = [
  ["ds-code", DsCode],
  ["ds-badge", DsBadge],
  ["ds-table", DsTable],
  ["ds-heading", DsHeading],
  ["ds-back-to-top", DsBackToTop],
  ["ds-header", DsHeader],
  ["ds-def-section", DsDefSection],
  ["ds-type-ref", DsTypeRef],
  ["ds-cross-refs", DsCrossRefs],
  ["ds-def-index", DsDefIndex],
  ["ds-def-example", DsDefExample],
  ["ds-prop-table", DsPropTable],
  ["ds-prop", DsProp],
  ["ds-spec-nav", DsSpecNav],
  ["ds-callout", DsCallout],
  ["ds-tag", DsTag],
  ["ds-logo", DsLogo],
  ["ds-icon-button", DsIconButton],
  ["ds-button", DsButton],
  ["ds-link", DsLink],
  ["ds-json-view", DsJsonView],
];

for (const [name, ctor] of registry) {
  if (!customElements.get(name)) {
    customElements.define(name, ctor);
  }
}
