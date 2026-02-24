#!/usr/bin/env python3
"""
Migrate DSDS example JSON files to the new schema structure.

Changes applied:
  1. dspiVersion -> dsdsVersion
  2. Remove "related" arrays — convert entries to links
  3. Flatten guidelines.bestPractices -> guidelines (flat array, add category: "design")
  4. Flatten contentGuidelines -> merge into guidelines (add category: "content", keep target)
  5. Flatten accessibility.guidelines -> use unified guideline with wcagCriteria
  6. Merge apiProperty.default into defaultValue, remove default
  7. tokenApi: rename figmaVariable -> designToolVariable (already done, but ensure)
  8. colorContrast.contrastRatio: convert "N:1" string to number N
  9. componentReference / tokenGroupReference -> artifactReference shape (name, role, required)
 10. example objects without presentation: add a presentationCode/presentationImage wrapper
     for objects that have title+description but no presentation (text-only guideline examples)
 11. Remove purpose field if any remain

Usage:
    python3 scripts/migrate_examples.py

Reads from spec/examples/*.dsds.json and writes back in place.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES_DIR = ROOT / "spec" / "examples"


# ---------------------------------------------------------------------------
# Individual transformers
# ---------------------------------------------------------------------------


def rename_version(doc: dict) -> dict:
    """dspiVersion -> dsdsVersion"""
    if "dspiVersion" in doc:
        doc["dsdsVersion"] = doc.pop("dspiVersion")
    return doc


def remove_purpose(obj: dict) -> dict:
    """Remove 'purpose' field anywhere it appears."""
    obj.pop("purpose", None)
    return obj


def convert_related_to_links(obj: dict) -> dict:
    """Convert 'related' array entries into link-style objects and merge into 'links'."""
    related = obj.pop("related", None)
    if related is None:
        return obj

    links = obj.get("links", [])
    for entry in related:
        name = entry.get("name", "")
        artifact_type = entry.get("type", "")
        relationship = entry.get("relationship", "related")
        link = {
            "type": relationship,
            "url": f"https://design.acme.com/{artifact_type}s/{name}",
            "label": f"{name} ({artifact_type})",
        }
        links.append(link)
    obj["links"] = links
    return obj


def flatten_guidelines(obj: dict) -> dict:
    """Flatten guidelines.bestPractices into a flat guidelines array with category."""
    guidelines_obj = obj.get("guidelines")
    if guidelines_obj is None:
        return obj
    if not isinstance(guidelines_obj, dict):
        return obj

    flat = []
    for g in guidelines_obj.get("bestPractices", []):
        g = dict(g)
        g.setdefault("category", "design")
        flat.append(g)
    for g in guidelines_obj.get("contentGuidelines", []):
        g = dict(g)
        g.setdefault("category", "content")
        flat.append(g)

    obj["guidelines"] = flat
    return obj


def flatten_content_guidelines(obj: dict) -> dict:
    """Move contentGuidelines entries into the guidelines array with category: content."""
    content_guidelines = obj.pop("contentGuidelines", None)
    if content_guidelines is None:
        return obj

    guidelines = obj.get("guidelines", [])
    if isinstance(guidelines, dict):
        # Shouldn't happen after flatten_guidelines, but be safe
        guidelines = []
        obj["guidelines"] = guidelines

    for cg in content_guidelines:
        g = dict(cg)
        g.setdefault("category", "content")
        guidelines.append(g)

    obj["guidelines"] = guidelines
    return obj


def unify_accessibility_guidelines(obj: dict) -> dict:
    """Convert accessibility.guidelines entries to the unified guideline shape."""
    accessibility = obj.get("accessibility")
    if accessibility is None or not isinstance(accessibility, dict):
        return obj

    old_guidelines = accessibility.get("guidelines", [])
    new_guidelines = []
    for ag in old_guidelines:
        g = dict(ag)
        g.setdefault("category", "accessibility")
        # wcagCriteria stays as-is on the unified guideline
        new_guidelines.append(g)
    accessibility["guidelines"] = new_guidelines
    return obj


def merge_api_defaults(obj: dict) -> dict:
    """Merge apiProperty.default into defaultValue and remove default."""
    api = obj.get("api")
    if api is None:
        return obj

    # Handle both single API object and platform-keyed map
    api_objects = []
    if isinstance(api, dict):
        if "properties" in api:
            api_objects.append(api)
        else:
            # Platform-keyed map
            for key, val in api.items():
                if isinstance(val, dict) and "properties" in val:
                    api_objects.append(val)

    for api_obj in api_objects:
        for prop in api_obj.get("properties", []):
            if isinstance(prop, dict):
                old_default = prop.pop("default", None)
                if "defaultValue" not in prop and old_default is not None:
                    prop["defaultValue"] = old_default

    return obj


def convert_contrast_ratio(obj: dict) -> dict:
    """Convert colorContrast.contrastRatio from string "N:1" to number N."""
    accessibility = obj.get("accessibility")
    if accessibility is None or not isinstance(accessibility, dict):
        return obj

    for cc in accessibility.get("colorContrast", []):
        if isinstance(cc, dict) and "contrastRatio" in cc:
            ratio = cc["contrastRatio"]
            if isinstance(ratio, str):
                # Parse "7.2:1" -> 7.2
                match = re.match(r"^([\d.]+):1$", ratio)
                if match:
                    cc["contrastRatio"] = float(match.group(1))

    return obj


def convert_component_references(obj: dict) -> dict:
    """Convert componentReference/tokenGroupReference to artifactReference shape."""
    # Pattern components array: {name, role, required} -> already matches artifactReference
    # Style tokenGroups array: {name, description} -> map description to role
    token_groups = obj.get("tokenGroups")
    if token_groups and isinstance(token_groups, list):
        new_refs = []
        for ref in token_groups:
            if isinstance(ref, dict):
                new_ref = {"name": ref.get("name", "")}
                desc = ref.get("description")
                if desc:
                    new_ref["role"] = desc
                new_refs.append(new_ref)
        obj["tokenGroups"] = new_refs
    return obj


def ensure_example_presentation(obj: dict) -> dict:
    """For guideline example objects that lack a presentation, wrap text content
    into a presentationCode with language 'text' so they satisfy the new
    presentation-required constraint."""
    # This is applied to individual example objects
    if not isinstance(obj, dict):
        return obj
    if "presentation" in obj:
        return obj
    # It's a text-only example (title/description/value without presentation)
    # Convert: if it has a title that looks like code or a short text example,
    # make it a code presentation with language "text"
    title = obj.get("title", "")
    value = obj.get("value")
    if title or value:
        content = title if title else str(value)
        desc = obj.get("description", "")
        new_obj = {}
        if desc:
            new_obj["description"] = desc
        new_obj["presentation"] = {
            "type": "code",
            "code": content,
            "language": "text",
        }
        return new_obj
    return obj


# ---------------------------------------------------------------------------
# Tree walkers
# ---------------------------------------------------------------------------


def walk_and_transform(obj, depth=0):
    """Walk the entire document tree and apply transformations at each level."""
    if not isinstance(obj, dict):
        if isinstance(obj, list):
            return [walk_and_transform(item, depth + 1) for item in obj]
        return obj

    # Apply transformations to this object
    obj = remove_purpose(obj)
    obj = convert_related_to_links(obj)
    obj = flatten_guidelines(obj)
    obj = flatten_content_guidelines(obj)
    obj = unify_accessibility_guidelines(obj)
    obj = merge_api_defaults(obj)
    obj = convert_contrast_ratio(obj)
    obj = convert_component_references(obj)

    # Recurse into children
    result = {}
    for key, val in obj.items():
        if key == "examples" and isinstance(val, list):
            # Transform example items
            result[key] = [ensure_example_presentation(walk_and_transform(item, depth + 1)) for item in val]
        elif key == "guidelines" and isinstance(val, list):
            # Guidelines are already flattened, recurse into each
            new_guidelines = []
            for g in val:
                g = walk_and_transform(g, depth + 1)
                # Ensure guideline examples have presentations
                if isinstance(g, dict) and "examples" in g:
                    g["examples"] = [
                        ensure_example_presentation(walk_and_transform(ex, depth + 1))
                        for ex in g["examples"]
                    ]
                new_guidelines.append(g)
            result[key] = new_guidelines
        else:
            result[key] = walk_and_transform(val, depth + 1)

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def migrate_file(filepath: Path) -> None:
    """Migrate a single example file."""
    data = json.loads(filepath.read_text(encoding="utf-8"))

    # Top-level transformations
    data = rename_version(data)

    # Walk and transform the entire tree
    data = walk_and_transform(data)

    # Write back
    filepath.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"  ✓ {filepath.name}")


def main():
    print("Migrating example files...\n")

    example_files = sorted(EXAMPLES_DIR.glob("*.dsds.json"))
    if not example_files:
        print("  No example files found.")
        sys.exit(1)

    for filepath in example_files:
        migrate_file(filepath)

    # Validate all output
    print("\nValidating...")
    all_ok = True
    for filepath in example_files:
        try:
            data = json.loads(filepath.read_text(encoding="utf-8"))
            # Check key structural properties
            assert "dsdsVersion" in data, "missing dsdsVersion"
            assert "dspiVersion" not in data, "stale dspiVersion"
            print(f"  ✓ {filepath.name}: valid")
        except Exception as e:
            print(f"  ✗ {filepath.name}: {e}")
            all_ok = False

    if not all_ok:
        sys.exit(1)

    print("\nDone.")


if __name__ == "__main__":
    main()
