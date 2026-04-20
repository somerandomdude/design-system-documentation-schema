#!/usr/bin/env python3
"""Add agents property to all entity objects in spec/examples/.

Entity objects are identified by having both a `kind` matching an entity type
AND at least one entity-specific structural property (name, documentBlocks,
metadata, children, overrides) — this distinguishes them from link objects
which also use `kind` but as a link-type value.
"""

import json
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLES_DIR = os.path.join(ROOT, "spec", "examples")

AGENTS = {
    "component": {
        "intent": "Trigger a user-initiated action within the current view without causing page navigation.",
        "constraints": [
            {"rule": "Do not use for navigating to a different page or URL.", "level": "must-not"},
            {"rule": "Limit each surface to one primary-emphasis button.", "level": "must"},
            {"rule": "Always provide an accessible label via visible text or aria-label.", "level": "must"}
        ],
        "disambiguation": [
            {"entity": "link", "distinction": "Use button for in-page actions; use link for navigation to a URL."},
            {"entity": "icon-button", "distinction": "Use button when a visible text label is present; use icon-button for icon-only affordances."}
        ],
        "antiPatterns": [
            {"description": "Using a button to navigate to another page.", "instead": "Use a link element with href."},
            {"description": "Placing multiple primary buttons on the same surface.", "instead": "Use one primary and one or more secondary or tertiary buttons."}
        ],
        "keywords": ["action", "submit", "click", "CTA", "trigger", "call-to-action", "interactive"]
    },
    "token": {
        "intent": "Apply the primary text color for body content, headings, and labels on default background surfaces.",
        "constraints": [
            {"rule": "Do not use on dark or colored background surfaces.", "level": "must-not"},
            {"rule": "Do not override this token value at the component level.", "level": "must-not"}
        ],
        "disambiguation": [
            {"entity": "color-text-secondary", "distinction": "Use primary for default reading content; use secondary for supporting or reduced-emphasis text."},
            {"entity": "color-text-on-action", "distinction": "Use primary on default surfaces; use on-action inside filled interactive components."}
        ],
        "keywords": ["color", "text", "primary", "body", "heading", "label", "foreground"]
    },
    "token-group": {
        "intent": "Define and organize a set of related design tokens, providing shared defaults for type and category.",
        "constraints": [
            {
                "rule": "Do not reference base palette tokens directly in component code.",
                "level": "must-not",
                "context": "Always reference semantic tokens that point to palette values."
            }
        ],
        "keywords": ["token", "group", "palette", "scale", "family", "collection"]
    },
    "theme": {
        "intent": "Apply a dark color palette for low-light environments and user preference, maintaining WCAG AA contrast throughout.",
        "constraints": [
            {"rule": "Always apply at the application root, not on individual components.", "level": "must"},
            {"rule": "Do not mix dark-mode and light-mode semantic tokens on the same surface.", "level": "must-not"}
        ],
        "disambiguation": [
            {"entity": "high-contrast", "distinction": "Use dark for low-light comfort; use high-contrast for users with low vision requiring maximum contrast."}
        ],
        "antiPatterns": [
            {"description": "Applying dark theme only to part of a page while the rest remains light.", "instead": "Use inline theme switching for isolated components; apply the theme at the root for global coverage."}
        ],
        "keywords": ["dark-mode", "color-mode", "night", "low-light", "theme", "override"]
    },
    "style": {
        "intent": "Document spacing scale tokens and enforce their consistent application across layout, components, and typography.",
        "constraints": [
            {"rule": "Do not substitute spacing tokens with typography or icon-size tokens.", "level": "must-not"},
            {"rule": "Always use the next scale step up or down rather than custom values.", "level": "should"}
        ],
        "disambiguation": [
            {"entity": "typography style", "distinction": "Spacing governs whitespace and layout gaps; typography governs type size, weight, and line height."}
        ],
        "keywords": ["spacing", "scale", "gap", "padding", "margin", "whitespace", "layout", "density"]
    },
    "pattern": {
        "intent": "Guide multi-component composition for surfacing, communicating, and resolving form validation errors.",
        "constraints": [
            {"rule": "Always include both an inline field error and a summary when multiple fields fail.", "level": "must"},
            {"rule": "Do not use toast notifications as the sole error communication for form validation.", "level": "must-not"}
        ],
        "disambiguation": [
            {"entity": "empty-state", "distinction": "Use error-messaging for validation and system errors; use empty-state for the absence of content."},
            {"entity": "alert", "distinction": "Use error-messaging for form validation flows; use alert for non-form system or status messages."}
        ],
        "antiPatterns": [
            {"description": "Showing errors only on submit without inline field feedback.", "instead": "Show inline errors on field blur and in a summary on submit."}
        ],
        "keywords": ["error", "validation", "form", "feedback", "inline-error", "error-summary", "alert"]
    }
}

# Properties that come after agents (used for insertion ordering)
AFTER_AGENTS = {"$extensions"}


# Properties that only appear on entity objects, not link/other objects
ENTITY_MARKER_PROPS = {"documentBlocks", "metadata", "children", "overrides"}

# Properties that only appear on link reference objects — if present, this is NOT an entity
LINK_MARKER_PROPS = {"url", "role", "label"}


def is_entity(obj):
    """Return True only if obj looks like a real entity (not a link reference or other kind-bearing object)."""
    kind = obj.get("kind")
    if kind not in AGENTS:
        return False
    # If it has any link-specific properties, it's a link reference, not an entity
    if LINK_MARKER_PROPS.intersection(obj.keys()):
        return False
    # Must have at least one property that only entity objects carry
    return bool(ENTITY_MARKER_PROPS.intersection(obj.keys()))


def add_agents_to_entity(obj):
    """Return a new dict with agents inserted before $extensions (or at end)."""
    if not is_entity(obj):
        return obj
    if "agents" in obj:
        return obj  # already has agents
    kind = obj.get("kind")

    new_obj = {}
    inserted = False
    for k, v in obj.items():
        if k in AFTER_AGENTS and not inserted:
            new_obj["agents"] = AGENTS[kind]
            inserted = True
        new_obj[k] = v

    if not inserted:
        new_obj["agents"] = AGENTS[kind]

    return new_obj


def walk(val):
    """Recursively walk the value, adding agents to entity objects."""
    if isinstance(val, dict):
        # First recurse into children
        result = {k: walk(v) for k, v in val.items()}
        # Then try to add agents to this object
        return add_agents_to_entity(result)
    elif isinstance(val, list):
        return [walk(item) for item in val]
    return val


def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"  SKIP (invalid JSON): {os.path.relpath(path, ROOT)} — {e}")
            return

    new_data = walk(data)

    if new_data == data:
        print(f"  unchanged : {os.path.relpath(path, ROOT)}")
        return

    with open(path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"  updated   : {os.path.relpath(path, ROOT)}")


def main():
    print("Adding agents to example files...\n")

    pattern = os.path.join(EXAMPLES_DIR, "**", "*.json")
    files = sorted(glob.glob(pattern, recursive=True))

    if not files:
        print(f"No JSON files found under {EXAMPLES_DIR}")
        return

    for path in files:
        process_file(path)

    print("\nDone.")


if __name__ == "__main__":
    main()
