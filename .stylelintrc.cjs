module.exports = {
  extends: "stylelint-config-standard",
  rules: {
    // The codebase uses BEM (__element, --modifier) throughout components
    // and workbench.css — not kebab-case-only class names.
    "selector-class-pattern": null,

    // Modifier-then-base override order (e.g. ".content--wide .content__inner"
    // declared after ".content__inner") is intentional cascade layering, not
    // an accidental specificity bug.
    "no-descending-specificity": null,

    // Enforce (max-width: …) / (min-width: …) prefix notation — the modern
    // range syntax (width <= 900px) has materially worse browser support
    // and isn't what this codebase uses anywhere.
    "media-feature-range-notation": "prefix",

    // style.css intentionally keeps the h1–h6 scale as one compact,
    // scannable rule per line rather than exploding each into multi-line.
    "declaration-block-single-line-max-declarations": null,

    // -webkit-text-size-adjust has no unprefixed equivalent with reliable
    // support (iOS Safari text-zoom fix) — it's required, not a mistake.
    "property-no-vendor-prefix": null,
  },
};
