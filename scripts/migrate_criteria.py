#!/usr/bin/env python3
"""
Migrate DSDS example JSON files for the criteria/category/defaultValue changes.

Changes applied:
  1. guideline.wcagCriteria (string[]) -> guideline.criteria (URL[])
     Maps WCAG criterion numbers to full URLs, e.g.:
       "1.4.3" -> "https://www.w3.org/TR/WCAG22/#contrast-minimum"
  2. Adds category: "accessibility" to guidelines inside accessibility objects
     that don't already have a category
  3. Adds category: "visual-design" to top-level guidelines that don't already
     have a category (excluding those already marked)
  4. apiCssCustomProperty.default -> apiCssCustomProperty.defaultValue
  5. Removes any lingering "default" keys on apiProperty objects (already migrated
     in prior round, but this catches any stragglers)

Usage:
    python3 scripts/migrate_criteria.py

Reads from spec/examples/*.dsds.json and writes back in place.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES_DIR = ROOT / "spec" / "examples"

# ---------------------------------------------------------------------------
# WCAG 2.2 criterion number -> fragment ID mapping
# Source: https://www.w3.org/TR/WCAG22/
# ---------------------------------------------------------------------------

WCAG_FRAGMENTS = {
    "1.1.1": "non-text-content",
    "1.2.1": "audio-only-and-video-only-prerecorded",
    "1.2.2": "captions-prerecorded",
    "1.2.3": "audio-description-or-media-alternative-prerecorded",
    "1.2.4": "captions-live",
    "1.2.5": "audio-description-prerecorded",
    "1.3.1": "info-and-relationships",
    "1.3.2": "meaningful-sequence",
    "1.3.3": "sensory-characteristics",
    "1.3.4": "orientation",
    "1.3.5": "identify-input-purpose",
    "1.4.1": "use-of-color",
    "1.4.2": "audio-control",
    "1.4.3": "contrast-minimum",
    "1.4.4": "resize-text",
    "1.4.5": "images-of-text",
    "1.4.6": "contrast-enhanced",
    "1.4.7": "low-or-no-background-audio",
    "1.4.8": "visual-presentation",
    "1.4.9": "images-of-text-no-exception",
    "1.4.10": "reflow",
    "1.4.11": "non-text-contrast",
    "1.4.12": "text-spacing",
    "1.4.13": "content-on-hover-or-focus",
    "2.1.1": "keyboard",
    "2.1.2": "no-keyboard-trap",
    "2.1.4": "character-key-shortcuts",
    "2.2.1": "timing-adjustable",
    "2.2.2": "pause-stop-hide",
    "2.3.1": "three-flashes-or-below-threshold",
    "2.4.1": "bypass-blocks",
    "2.4.2": "page-titled",
    "2.4.3": "focus-order",
    "2.4.4": "link-purpose-in-context",
    "2.4.5": "multiple-ways",
    "2.4.6": "headings-and-labels",
    "2.4.7": "focus-visible",
    "2.4.11": "focus-not-obscured-minimum",
    "2.4.12": "focus-not-obscured-enhanced",
    "2.4.13": "focus-appearance",
    "2.5.1": "pointer-gestures",
    "2.5.2": "pointer-cancellation",
    "2.5.3": "label-in-name",
    "2.5.4": "motion-actuation",
    "2.5.7": "dragging-movements",
    "2.5.8": "target-size-minimum",
    "3.1.1": "language-of-page",
    "3.1.2": "language-of-parts",
    "3.2.1": "on-focus",
    "3.2.2": "on-input",
    "3.2.6": "consistent-help",
    "3.3.1": "error-identification",
    "3.3.2": "labels-or-instructions",
    "3.3.3": "error-suggestion",
    "3.3.4": "error-prevention-legal-financial-data",
    "3.3.7": "redundant-entry",
    "3.3.8": "accessible-authentication-minimum",
    "4.1.2": "name-role-value",
    "4.1.3": "status-messages",
}

WCAG_BASE = "https://www.w3.org/TR/WCAG22/#"


def wcag_to_url(criterion: str) -> str:
    """Convert a WCAG criterion number like '1.4.3' to a full URL."""
    fragment = WCAG_FRAGMENTS.get(criterion)
    if fragment:
        return f"{WCAG_BASE}{fragment}"
    # Fallback: use the criterion number as a fragment
    return f"{WCAG_BASE}{criterion}"


# ---------------------------------------------------------------------------
# Transformers
# ---------------------------------------------------------------------------


def migrate_wcag_criteria(obj: dict) -> dict:
    """Rename wcagCriteria -> criteria and convert values to URLs."""
    if "wcagCriteria" in obj:
        old_values = obj.pop("wcagCriteria")
        if isinstance(old_values, list):
            obj["criteria"] = [wcag_to_url(v) for v in old_values]
    return obj


def add_accessibility_category(obj: dict) -> dict:
    """Add category: accessibility to guidelines inside accessibility objects."""
    if not isinstance(obj, dict):
        return obj
    if "category" not in obj and "guidance" in obj and "rationale" in obj:
        # This is a guideline without a category — we'll set it based on context
        # (the caller handles context)
        pass
    return obj


def rename_css_default(obj: dict) -> dict:
    """Rename 'default' to 'defaultValue' on CSS custom property objects."""
    if "default" in obj and "name" in obj:
        name = obj.get("name", "")
        if isinstance(name, str) and name.startswith("--"):
            obj["defaultValue"] = obj.pop("default")
    return obj


# ---------------------------------------------------------------------------
# Tree walker
# ---------------------------------------------------------------------------


def walk(obj, in_accessibility=False, in_guidelines=False):
    """Walk the document tree, applying transformations with context awareness."""
    if isinstance(obj, list):
        return [walk(item, in_accessibility, in_guidelines) for item in obj]

    if not isinstance(obj, dict):
        return obj

    result = {}
    for key, val in obj.items():
        if key == "accessibility" and isinstance(val, dict):
            # Recurse into accessibility with context flag
            result[key] = walk(val, in_accessibility=True, in_guidelines=False)
        elif key == "guidelines" and isinstance(val, list):
            # Process guidelines array
            new_guidelines = []
            for g in val:
                if isinstance(g, dict):
                    g = dict(g)  # shallow copy
                    g = migrate_wcag_criteria(g)
                    # Add category based on context if not already set
                    if "category" not in g:
                        if in_accessibility:
                            g["category"] = "accessibility"
                        else:
                            g["category"] = g.get("category", "visual-design")
                    # Recurse into nested structures (examples, etc.)
                    g = walk(g, in_accessibility, in_guidelines=True)
                new_guidelines.append(g)
            result[key] = new_guidelines
        elif key == "cssCustomProperties" and isinstance(val, list):
            # Rename default -> defaultValue on CSS custom properties
            new_props = []
            for prop in val:
                if isinstance(prop, dict):
                    prop = dict(prop)
                    prop = rename_css_default(prop)
                new_props.append(prop)
            result[key] = new_props
        elif key == "properties" and isinstance(val, list):
            # Handle apiProperty objects — remove stale 'default' if defaultValue exists
            new_props = []
            for prop in val:
                if isinstance(prop, dict):
                    prop = dict(prop)
                    if "default" in prop and "defaultValue" in prop:
                        del prop["default"]
                    elif "default" in prop and "defaultValue" not in prop:
                        # Check if this looks like an API property (has 'name', 'type', 'required')
                        if "type" in prop and "required" in prop and "name" in prop:
                            name = prop.get("name", "")
                            if not (isinstance(name, str) and name.startswith("--")):
                                prop["defaultValue"] = prop.pop("default")
                    prop = walk(prop, in_accessibility, in_guidelines)
                new_props.append(prop)
            result[key] = new_props
        else:
            result[key] = walk(val, in_accessibility, in_guidelines)

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def migrate_file(filepath: Path) -> None:
    """Migrate a single example file."""
    data = json.loads(filepath.read_text(encoding="utf-8"))
    data = walk(data)
    filepath.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"  ✓ {filepath.name}")


def validate_no_stale(filepath: Path) -> list[str]:
    """Check for any remaining stale properties."""
    text = filepath.read_text(encoding="utf-8")
    issues = []
    if '"wcagCriteria"' in text:
        issues.append("stale wcagCriteria")
    return issues


def main():
    print("Migrating criteria/category/defaultValue...\n")

    example_files = sorted(EXAMPLES_DIR.glob("*.dsds.json"))
    if not example_files:
        print("  No example files found.")
        sys.exit(1)

    for filepath in example_files:
        migrate_file(filepath)

    # Validate
    print("\nValidating...")
    all_ok = True
    for filepath in example_files:
        try:
            json.loads(filepath.read_text(encoding="utf-8"))
            issues = validate_no_stale(filepath)
            if issues:
                print(f"  ✗ {filepath.name}: {', '.join(issues)}")
                all_ok = False
            else:
                print(f"  ✓ {filepath.name}: valid, clean")
        except Exception as e:
            print(f"  ✗ {filepath.name}: {e}")
            all_ok = False

    if not all_ok:
        sys.exit(1)

    print("\nDone.")


if __name__ == "__main__":
    main()
