/**
 * Illustrative source for examples/entries/button.yaml's `sourceFiles` entry.
 *
 * The point of `sourceFiles` is that a tool extracts the component's real
 * interface from here — props, types, defaults, JSDoc — instead of that
 * interface being hand-retyped into the DSDS document. So this file carries
 * the API surface button.yaml deliberately does NOT restate: the prop names
 * and types below, and the doc comments on them, are the extractable half.
 * button.yaml owns the other half — when to use it, the one-primary-per-
 * surface rule, the loading/disabled combo constraint.
 *
 * Minimal on purpose. It is a fixture for the extraction contract, not a
 * component anyone should ship.
 */

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps {
  /** Visible label. Required — an icon-only control is the IconButton entry. */
  children: React.ReactNode;
  /** Visual emphasis. Defaults to "primary". */
  variant?: ButtonVariant;
  /** Overall scale. Defaults to "medium". */
  size?: ButtonSize;
  /** Dimmed and non-interactive. Must not be combined with `loading`. */
  disabled?: boolean;
  /** Shows a spinner in place of the label and blocks interaction. */
  loading?: boolean;
  /** Stretches to fill the inline axis of its container. */
  fullWidth?: boolean;
  /** Fired on activation. Not called while `disabled` or `loading`. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size}${fullWidth ? " btn--full" : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : children}
    </button>
  );
}
