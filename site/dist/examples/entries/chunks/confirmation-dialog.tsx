/**
 * Illustrative React implementation for examples/entries/confirmation-dialog.yaml
 * (referenced from it via refs, rel: file, role "React implementation").
 *
 * confirmation-dialog.yaml is a `kind: entry` pattern, not a component: it
 * documents a recurring *composition* — Dialog + Button + Icon — rather than
 * a new primitive. This file is what that composition looks like assembled,
 * which is why the entry points at it with `rel: file` instead of declaring
 * `sourceFiles`: there is no new API surface to extract, only three existing
 * components wired together in the order the pattern prescribes.
 *
 * Minimal on purpose — a fixture for the pointer, not shippable code.
 */

import { Button } from "../src/Button";

export interface ConfirmationDialogProps {
  /** Question the dialog asks. Phrased as the consequence, not "Are you sure?". */
  title: string;
  /** Optional detail: what will change, and whether it can be undone. */
  detail?: string;
  /** Label for the confirming action. A verb naming the action, never "OK". */
  confirmLabel: string;
  /** True when the confirmed action is destructive — renders the danger variant. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  title,
  detail,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="confirm">
      <h2 className="confirm__title">{title}</h2>
      {detail ? <p className="confirm__detail">{detail}</p> : null}
      <div className="confirm__actions">
        {/* Cancel first in DOM order so it takes initial focus: the
            non-destructive choice should be the one a stray Enter hits. */}
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
