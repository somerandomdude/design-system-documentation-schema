/**
 * Illustrative source for examples/interop/my-element.dsds.yaml's
 * `sourceFiles` entry, and the input a Custom Elements Manifest analyzer
 * would read to produce the sibling my-element.custom-elements.json.
 *
 * This is the whole interop story in three files: the DSDS entry documents
 * meaning and usage, this file is the raw source (`sourceFiles`), and the
 * CEM manifest is the already-extracted API contract (`specs`). Every member
 * below has a counterpart in that manifest on purpose — the `disabled` field
 * and attribute, the `fire()` method, the `disabled-changed` event — because
 * the pair only demonstrates the contract if the two actually agree.
 *
 * This is the description of the class.
 */
export class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ["disabled"];
  }

  /** Whether the element is non-interactive. Reflected to the attribute. */
  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  attributeChangedCallback(name) {
    if (name === "disabled") {
      this.dispatchEvent(new Event("disabled-changed"));
    }
  }

  /** Dispatches `disabled-changed` without waiting for an attribute change. */
  fire() {
    this.dispatchEvent(new Event("disabled-changed"));
  }
}

customElements.define("my-element", MyElement);
