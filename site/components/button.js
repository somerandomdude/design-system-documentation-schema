import { createShadow, esc, BASE_RESET, FONT } from "./_shared.js";

const BUTTON_CSS = `
  ${BASE_RESET}
  :host { display: inline-flex; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ds-space-1);
    border: none;
    border-radius: var(--ds-radius-lg);
    font-family: ${FONT.body};
    font-weight: var(--ds-font-weight-semibold);
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
    transition: background var(--ds-transition-normal), color var(--ds-transition-normal), border-color var(--ds-transition-normal), opacity var(--ds-transition-normal);
  }

  /* Sizes */
  :host([size="sm"]) .btn { font-size: var(--ds-font-size-sm); padding: 5px 10px; }
  .btn                     { font-size: var(--ds-font-size-base); padding: 7px 14px; }
  :host([size="lg"]) .btn  { font-size: var(--ds-font-size-lg); padding: 10px var(--ds-space-5); }

  /* Variants */
  .btn--primary {
    background: var(--ds-color-accent);
    color: #fff;
  }
  .btn--primary:hover { background: var(--ds-color-accent-hover); }

  .btn--secondary {
    background: transparent;
    color: var(--ds-color-accent);
    box-shadow: inset 0 0 0 var(--ds-border-width-sm) var(--ds-color-border);
  }
  .btn--secondary:hover {
    background: var(--ds-color-accent-subtle);
  }

  .btn--ghost {
    background: transparent;
    color: var(--ds-color-accent);
  }
  .btn--ghost:hover {
    background: var(--ds-color-accent-subtle);
  }

  .btn--danger {
    background: var(--ds-color-danger-btn);
    color: #fff;
  }
  .btn--danger:hover { background: var(--ds-color-danger-btn-hover); }

  /* Disabled */
  :host([disabled]) .btn {
    opacity: var(--ds-opacity-disabled);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Focus ring */
  .btn:focus-visible {
    outline: var(--ds-border-width-md) solid var(--ds-color-accent);
    outline-offset: 2px;
  }

  ::slotted([slot="icon-start"]),
  ::slotted([slot="icon-end"]) {
    display: inline-flex;
    width: 1em;
    height: 1em;
  }
`;

export class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "href"];
  }

  constructor() {
    super();
    this._shadow = createShadow(this, BUTTON_CSS);
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const variant = this.getAttribute("variant") || "secondary";
    const href = this.getAttribute("href");
    const disabled = this.hasAttribute("disabled");
    const tag = href && !disabled ? "a" : "button";
    const hrefAttr = tag === "a" ? ` href="${esc(href)}"` : "";
    const disabledAttr = tag === "button" && disabled ? " disabled" : "";
    const role = tag === "a" ? ' role="button"' : "";

    this._shadow.innerHTML = `
      <${tag} class="btn btn--${esc(variant)}"${hrefAttr}${disabledAttr}${role} part="button">
        <slot name="icon-start"></slot>
        <slot></slot>
        <slot name="icon-end"></slot>
      </${tag}>
    `;
  }
}
