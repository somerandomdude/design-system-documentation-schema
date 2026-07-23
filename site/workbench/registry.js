/**
 * registry.js — Component demo catalog for the workbench gallery.
 *
 * Each entry describes one component and one or more demo renderings.
 * The gallery (gallery.js) reads this to build isolated, labelled
 * previews with a "show markup" toggle.
 *
 * To add or adjust a demo, edit an entry's `demos` array. The `html`
 * string is injected verbatim and also shown as the copyable source,
 * so it stays honest — what you see is exactly the markup.
 *
 * category:
 *   "content" — inline/block content components, demoable in isolation
 *   "layout"  — page-structure/nav components; best seen in the
 *               templates/doc-page.html shell (linked, not rendered here)
 *   "schema"  — driven by build-time schema data; shown with static
 *               stand-in markup where it renders standalone
 */

export const COMPONENTS = [
  // ─── Content ──────────────────────────────────────────────────────────
  {
    tag: "ds-logo",
    title: "Logo",
    category: "content",
    notes: "The DSDS mark. Attrs: size, background, fill — all plain CSS values.",
    demos: [
      {
        label: "Default",
        html: `<ds-logo></ds-logo>`,
      },
      {
        label: "Sized and recolored",
        html: `<ds-logo size="24px"></ds-logo>
<ds-logo size="64px" fill="#0055b3"></ds-logo>
<ds-logo size="64px" fill="#fff" background="#0055b3"></ds-logo>`,
      },
    ],
  },
  {
    tag: "ds-badge",
    title: "Badge",
    category: "content",
    notes: "Inline marker. Variant sets the color: kind (type-line badges), experimental (conditional-requirement marker), default neutral.",
    demos: [
      {
        label: "Variants",
        html: `<ds-badge>neutral (default)</ds-badge>
<ds-badge variant="kind">kind</ds-badge>
<ds-badge variant="experimental">experimental</ds-badge>`,
      },
    ],
  },
  {
    tag: "ds-tag",
    title: "Tag",
    category: "content",
    notes: "Keyword / taxonomy pill.",
    demos: [
      {
        label: "Tags",
        html: `<ds-tag>action</ds-tag>
<ds-tag>navigation</ds-tag>
<ds-tag>color</ds-tag>
<ds-tag>spacing</ds-tag>`,
      },
    ],
  },
  {
    tag: "ds-code",
    title: "Code",
    category: "content",
    notes: "Inline code and syntax-highlighted blocks. Attrs: inline (boolean), language, label.",
    demos: [
      {
        label: "Inline",
        html: `Reference a field like <ds-code inline>documentBlocks</ds-code> in prose.`,
      },
      {
        label: "Block with language + label",
        html: `<ds-code language="json" label="button.dsds.json">{
  "kind": "component",
  "identifier": "button",
  "name": "Button"
}</ds-code>`,
      },
      {
        label: "Shell command",
        html: `<ds-code language="bash">npm run validate</ds-code>`,
      },
    ],
  },
  {
    tag: "ds-callout",
    title: "Callout",
    category: "content",
    notes: "Highlighted aside. variant info|tip|warning; title attr sets the bold lead-in; slotted rich content.",
    demos: [
      {
        label: "Info (default)",
        html: `<ds-callout title="Key idea:">
  DSDS documents the how and why, not the token values themselves.
</ds-callout>`,
      },
      {
        label: "Tip",
        html: `<ds-callout variant="tip" title="Tip:">
  Use single-entity files plus a <ds-code inline>$ref</ds-code> manifest for large systems.
</ds-callout>`,
      },
      {
        label: "Warning",
        html: `<ds-callout variant="warning" title="Heads up:">
  Pre-1.0, minor releases can carry breaking changes.
</ds-callout>`,
      },
    ],
  },
  {
    tag: "ds-button",
    title: "Button",
    category: "content",
    notes: "Text-labelled action control. Primary is orange; secondary is black; labels render uppercase. Attrs: variant, type, disabled.",
    demos: [
      {
        label: "Primary and secondary",
        html: `<ds-button>Save changes</ds-button>
<ds-button variant="secondary">Cancel</ds-button>`,
      },
      {
        label: "Disabled states",
        html: `<ds-button disabled>Disabled primary</ds-button>
<ds-button variant="secondary" disabled>Disabled secondary</ds-button>`,
      },
      {
        label: "Native button types",
        html: `<ds-button type="submit">Submit form</ds-button>
<ds-button type="reset" variant="secondary">Reset form</ds-button>`,
      },
    ],
  },
  {
    tag: "ds-link",
    title: "Link",
    category: "content",
    notes: "Text navigation control. Labels stay in sentence case. Attrs: href, external.",
    demos: [
      {
        label: "Same-page navigation",
        html: `<ds-link href="#quickstart">Read the quick start</ds-link>
<ds-link href="#components">Browse components</ds-link>`,
      },
      {
        label: "External destination",
        html: `<ds-link href="https://designsystemdocspec.org" external>Visit the DSDS site</ds-link>`,
      },
    ],
  },
  {
    tag: "ds-text-input",
    title: "Text input",
    category: "content",
    notes: "Native single-line form field. Slots: label, description, error. Attrs: type, name, value, placeholder, required, disabled, readonly, error.",
    demos: [
      {
        label: "Default with description",
        html: `<ds-text-input name="email">
  <span slot="label">Email address</span>
  <span slot="description">We will send a confirmation link.</span>
</ds-text-input>`,
      },
      {
        label: "Required and error",
        html: `<ds-text-input type="email" required error>
  <span slot="label">Work email</span>
  <span slot="error">Enter a valid email address.</span>
</ds-text-input>`,
      },
      {
        label: "Disabled and read-only",
        html: `<ds-text-input value="Locked value" disabled>
  <span slot="label">Disabled</span>
</ds-text-input>
<ds-text-input value="Existing value" readonly>
  <span slot="label">Read-only</span>
</ds-text-input>`,
      },
    ],
  },
  {
    tag: "ds-heading",
    title: "Heading",
    category: "content",
    notes: "Section heading with auto anchor. level 1-6.",
    demos: [
      {
        label: "Levels",
        html: `<ds-heading level="1">Page title</ds-heading>
<ds-heading level="2">Document structure</ds-heading>
<ds-heading level="3">Single-entity files</ds-heading>`,
      },
    ],
  },
  {
    tag: "ds-type-ref",
    title: "Type reference",
    category: "content",
    notes: "Monospace cross-reference link to a schema type. href + slotted type name.",
    demos: [
      {
        label: "Inline type link",
        html: `A field of type <ds-type-ref href="#richtext">richText</ds-type-ref> holds markdown.`,
      },
    ],
  },
  {
    tag: "ds-table",
    title: "Table",
    category: "content",
    notes: "Styled wrapper around a slotted <table>.",
    demos: [
      {
        label: "Basic",
        html: `<ds-table>
  <table>
    <thead><tr><th>Kind</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>component</td><td>A reusable UI element.</td></tr>
      <tr><td>token</td><td>A single design token.</td></tr>
    </tbody>
  </table>
</ds-table>`,
      },
    ],
  },
  {
    tag: "ds-prop-table",
    title: "Property table",
    category: "content",
    notes: "Schema property table built from <ds-prop> children. Columns: Property, Type, Required, Description. Horizontally scrolls on narrow viewports.",
    demos: [
      {
        label: "Property rows",
        html: `<ds-prop-table>
  <ds-prop name="kind" type="string" required>Entity kind discriminator.</ds-prop>
  <ds-prop name="identifier" type="string" required>Machine-readable id.<br><small>Pattern: <ds-code inline>^[a-z][a-z0-9-]*$</ds-code></small></ds-prop>
  <ds-prop name="name" type="string">Human-readable name.</ds-prop>
  <ds-prop name="description" type="richText">What the entity is and does.</ds-prop>
</ds-prop-table>`,
      },
    ],
  },

  // ─── Layout / navigation ──────────────────────────────────────────────
  // Fixed-position, scroll-driven, and mobile-only components render in a
  // scoped iframe (iframe: true) so their positioning and behavior are real.
  {
    tag: "ds-spec-nav",
    title: "Spec navigation",
    category: "layout",
    notes: "The site's fixed left nav. Content model: light-DOM <a slug> links and <ds-nav-group label> groups. In production it's generated by buildSpecNav() in scripts/nav.js. The mobile menu toggle is built in — no separate toggle element.",
    demos: [
      {
        label: "Fixed left nav (scoped viewport)",
        height: 340,
        iframe: true,
        html: `<ds-spec-nav title="DSDS 0.15.1" active="schema-architecture" open>
  <a href="#" slug="index">Overview</a>
  <a href="#" slug="quickstart">Quick Start</a>
  <a href="#" slug="schema-architecture">Schema Architecture</a>
  <ds-nav-group label="Entities">
    <a href="#" slug="entities-component">component</a>
    <a href="#" slug="entities-token">token</a>
  </ds-nav-group>
</ds-spec-nav>
<div style="margin-left:240px;padding:20px">Page content sits to the right of the fixed nav.</div>`,
      },
      {
        label: "Mobile (≤900px): logo swaps for a menu button, links collapse — click it",
        height: 260,
        frameWidth: 360,
        iframe: true,
        html: `<ds-spec-nav title="DSDS 0.15.1" active="schema-architecture">
  <a href="#" slug="index">Overview</a>
  <a href="#" slug="quickstart">Quick Start</a>
  <a href="#" slug="schema-architecture">Schema Architecture</a>
  <ds-nav-group label="Entities">
    <a href="#" slug="entities-component">component</a>
    <a href="#" slug="entities-token">token</a>
  </ds-nav-group>
</ds-spec-nav>`,
      },
    ],
  },
  {
    tag: "ds-back-to-top",
    title: "Back to top",
    category: "layout",
    notes: "Scroll-to-top affordance; appears after scrolling. Scroll down inside the frame — the button appears bottom-right.",
    demos: [
      {
        label: "Appears after scrolling (scroll down)",
        height: 240,
        iframe: true,
        html: `<div style="padding:16px 20px">
  <p>Scroll this frame down — a back-to-top button appears in the corner.</p>
  ${Array.from({ length: 12 }, (_, i) => `<p>Filler paragraph ${i + 1}.</p>`).join("\n  ")}
</div>
<ds-back-to-top></ds-back-to-top>`,
      },
    ],
  },

  // ─── Schema-driven (render from static attributes / slotted content) ───
  {
    tag: "ds-header",
    title: "Header",
    category: "schema",
    notes: "Page header, used at the top of every page. Attrs: title, description, source (schema pages only).",
    demos: [
      {
        label: "Page header",
        html: `<ds-header
  title="Criterion Definitions"
  description="Shared definitions for testable success criteria and external standard references."
  source="common/criterion.schema.json"></ds-header>`,
      },
    ],
  },
  {
    tag: "ds-def-index",
    title: "Definition index",
    category: "schema",
    notes: "Index of the $defs on a schema page. Slotted <p> intro + <ul><li><a>.",
    demos: [
      {
        label: "Definition list",
        html: `<ds-def-index>
  <p><strong>3 definitions</strong> in this file:</p>
  <ul>
    <li><a href="#criterion">criterion</a></li>
    <li><a href="#criterioncheck">criterionCheck</a></li>
    <li><a href="#reference">reference</a></li>
  </ul>
</ds-def-index>`,
      },
    ],
  },
  {
    tag: "ds-def-section",
    title: "Definition section",
    category: "schema",
    notes: "One $def block on a schema page. Attrs: name, anchor, type, description. Slotted body (e.g. a prop table).",
    demos: [
      {
        label: "Definition with property table",
        html: `<ds-def-section name="criterion" anchor="criterion" type="object"
  description="A testable success criterion.">
  <ds-prop-table>
    <ds-prop name="identifier" type="string" required>Stable id.</ds-prop>
    <ds-prop name="statement" type="richText" required>What success looks like.</ds-prop>
  </ds-prop-table>
</ds-def-section>`,
      },
    ],
  },
  {
    tag: "ds-def-example",
    title: "Definition example",
    category: "schema",
    notes: "Example payload for a $def. Wraps slotted example content.",
    demos: [
      {
        label: "Example payload",
        html: `<ds-def-example>
  <ds-code language="json" label="example">{
  "identifier": "touch-target-minimum",
  "statement": "Interactive targets are at least 44x44px.",
  "level": "must"
}</ds-code>
</ds-def-example>`,
      },
    ],
  },
  {
    tag: "ds-cross-refs",
    title: "Cross references",
    category: "schema",
    notes: "Related-type links for a schema page. Wraps slotted links.",
    demos: [
      {
        label: "Related types",
        html: `<ds-cross-refs>
  <ds-type-ref href="#">guideline</ds-type-ref>
  <ds-type-ref href="#">accessibility</ds-type-ref>
  <ds-type-ref href="#">criterion</ds-type-ref>
</ds-cross-refs>`,
      },
    ],
  },
];
