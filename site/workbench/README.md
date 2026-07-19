# DSDS Workbench

A live workspace for redesigning the documentation site — components, tokens,
and page layout — with no build step between the source and the browser.

It loads the **real** source (`site/components/*.js`, `site/tokens.css`,
`site/style.css`) directly, so there is a single source of truth: edit a
component, a token, or a stylesheet, refresh, and see the change everywhere.

## Run it

```bash
npm run dev
```

Then open **http://localhost:4300/workbench/**.

The dev server (`scripts/serve.js`) serves the `site/` source tree with the
correct MIME types so the component ES modules load natively. Options:

```bash
npm run dev -- --port 8080   # different port
npm run dev -- --dist        # serve the built site/dist/ instead of source
```

## The three surfaces

| Page | File | What you redesign |
|---|---|---|
| **Component gallery** | `index.html` | Individual components — every one rendered in isolation with its variants. |
| **Design tokens** | `tokens.html` | The palette and scales, parsed live from `tokens.css`. |
| **Page template** | `templates/doc-page.html` | Page layout — nav, content column, TOC, footer — using the real components and `style.css`. |

### Component gallery (`index.html`)

Every component from the registry, grouped by category, each on a checkerboard
stage with a **show markup** toggle. Click **focus ↗** on any component (or open
`index.html?tag=ds-badge`) to isolate it full-width for tight styling work.

The gallery loads `tokens.css` but **not** `style.css`: components are
shadow-DOM encapsulated and get their look from tokens + their own shadow CSS.
`style.css` is page-layout chrome (nav column, content grid) and is exercised in
the page template instead.

### Design tokens (`tokens.html`)

Reads `tokens.css` and renders color swatches, spacing/type scale bars, radius
samples, and the rest — each with its resolved value. Edit `tokens.css`, refresh,
and both this page and every component update.

### Page template (`templates/doc-page.html`)

A hand-authored, self-contained copy of the real doc-page shell: `ds-spec-nav`,
the `.content` grid, `ds-toc`, `ds-footer`, `ds-back-to-top`, real `style.css`.
This is where you iterate on **layout**. The floating "Workbench" pill is
`position: fixed` so it does not disturb the layout being previewed.

## Adding or changing a component demo

Edit `registry.js`. Each entry:

```js
{
  tag: "ds-badge",
  title: "Badge",
  category: "content",           // content | layout | schema
  notes: "One-line description of the API.",
  demos: [
    { label: "Variants", html: `<ds-badge variant="kind">kind</ds-badge>` },
  ],
}
```

The `html` string is injected verbatim **and** shown as the source, so the demo
can never drift from what it claims to render.

**Fixed / scroll / mobile components** (nav, TOC, scrollspy, back-to-top) can't
render inline — they need their own viewport. Mark the demo `iframe: true` and it
renders in a scoped iframe that loads the real tokens + components:

```js
{ label: "Fixed left nav", iframe: true, height: 340, html: `<ds-spec-nav …>` }
```

Extra demo fields: `height` (iframe px height, default 300) and `frameWidth`
(constrain the iframe width — used to force the mobile breakpoint for
`ds-spec-nav`'s built-in menu toggle).

## Porting a redesign back to production

The workbench edits the real `tokens.css` and `style.css` live, so those changes
are already in place. The two things that are *copies* in the workbench and need
porting when a layout change is final:

- **Page shell** → `pageHtml()` in `scripts/build-site.js`
- **Navigation** → `buildSpecNav()` in `scripts/nav.js`

Then rebuild and verify:

```bash
npm run build
npm run dev -- --dist   # eyeball the built site
```

## Files

```
workbench/
  index.html            component gallery
  gallery.js            renders the gallery from the registry
  registry.js           component demo catalog (edit this to add demos)
  tokens.html           live token reference
  tokens.js             parses tokens.css into swatches/scales
  templates/
    doc-page.html       editable page-shell for layout redesign
  workbench.css         chrome for the workbench UI (not the components)
  README.md             this file
```
