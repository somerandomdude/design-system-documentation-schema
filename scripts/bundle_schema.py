#!/usr/bin/env python3
"""
Bundle all split DSDS schema files into a single dsds.bundled.schema.json.

Reads every .schema.json file from the split schema directories, collects all
$defs into a single flat namespace, rewrites all $ref paths to use internal
#/$defs/name references, and writes the bundled output.

Usage:
    python3 scripts/bundle_schema.py

Output:
    spec/schema/dsds.bundled.schema.json
"""

import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_DIR = ROOT / "spec" / "schema"
ROOT_SCHEMA = SCHEMA_DIR / "dsds.schema.json"
OUTPUT = SCHEMA_DIR / "dsds.bundled.schema.json"

# Directories containing split schema files (order doesn't matter for correctness,
# but a stable order makes the output deterministic and diffable)
SPLIT_DIRS = [
    SCHEMA_DIR / "common",
    SCHEMA_DIR / "components",
    SCHEMA_DIR / "tokens",
    SCHEMA_DIR / "style",
    SCHEMA_DIR / "patterns",
]

# ---------------------------------------------------------------------------
# Collect all $defs from split files
# ---------------------------------------------------------------------------


def collect_defs() -> dict:
    """Read every split schema file and collect all $defs into a flat dict."""
    all_defs: dict = {}
    seen_files: list[str] = []

    for directory in SPLIT_DIRS:
        if not directory.exists():
            continue
        for schema_file in sorted(directory.glob("*.schema.json")):
            data = json.loads(schema_file.read_text(encoding="utf-8"))
            defs = data.get("$defs", {})
            for def_name, def_body in defs.items():
                if def_name in all_defs:
                    source_file = schema_file.relative_to(SCHEMA_DIR)
                    print(
                        f"  ⚠  Duplicate $def '{def_name}' in {source_file} "
                        f"(already collected). Using latest.",
                        file=sys.stderr,
                    )
                all_defs[def_name] = def_body
            seen_files.append(str(schema_file.relative_to(SCHEMA_DIR)))

    # Also collect $defs from the root schema itself (e.g., collectionDoc)
    root_data = json.loads(ROOT_SCHEMA.read_text(encoding="utf-8"))
    for def_name, def_body in root_data.get("$defs", {}).items():
        if def_name in all_defs:
            print(
                f"  ⚠  Duplicate $def '{def_name}' in root schema "
                f"(already collected). Using latest.",
                file=sys.stderr,
            )
        all_defs[def_name] = def_body

    print(f"  Collected {len(all_defs)} definitions from {len(seen_files) + 1} files:")
    for f in seen_files:
        print(f"    {f}")
    print(f"    dsds.schema.json (root)")

    return all_defs


# ---------------------------------------------------------------------------
# Rewrite $ref paths to internal #/$defs/name
# ---------------------------------------------------------------------------


def rewrite_refs(obj):
    """Recursively rewrite all $ref values to use #/$defs/name format."""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if key == "$ref" and isinstance(value, str):
                result[key] = resolve_ref(value)
            else:
                result[key] = rewrite_refs(value)
        return result
    elif isinstance(obj, list):
        return [rewrite_refs(item) for item in obj]
    else:
        return obj


def resolve_ref(ref: str) -> str:
    """Convert a file-relative $ref to an internal #/$defs/name reference.

    Examples:
        "../common/common.schema.json#/$defs/richText"  -> "#/$defs/richText"
        "common.schema.json#/$defs/richText"             -> "#/$defs/richText"
        "variant.schema.json#/$defs/variant"             -> "#/$defs/variant"
        "#/$defs/someLocal"                              -> "#/$defs/someLocal"
        "common/common.schema.json#/$defs/metadata"      -> "#/$defs/metadata"
    """
    # Already an internal ref
    if ref.startswith("#/"):
        return ref

    # Split off the fragment
    if "#" in ref:
        _file_part, fragment = ref.split("#", 1)
        # The fragment is like /$defs/richText — extract the def name
        parts = fragment.strip("/").split("/")
        if len(parts) == 2 and parts[0] == "$defs":
            return f"#/$defs/{parts[1]}"

    # If we can't parse it, return as-is (shouldn't happen in valid schemas)
    return ref


# ---------------------------------------------------------------------------
# Build the bundled schema
# ---------------------------------------------------------------------------


def build_bundled() -> dict:
    """Build the complete bundled schema document."""
    # Read the root schema as the base
    root = json.loads(ROOT_SCHEMA.read_text(encoding="utf-8"))

    # Collect all definitions
    all_defs = collect_defs()

    # Rewrite all $ref paths in every definition
    rewritten_defs = {}
    for name, body in all_defs.items():
        rewritten_defs[name] = rewrite_refs(body)

    # Build the bundled document
    bundled = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://designsystemdocspec.org/v1/dsds.bundled.schema.json",
        "title": "Design System Documentation Standard (DSDS) v1.0 — Bundled",
        "description": (
            "Single-file bundled version of the DSDS schema. "
            "Auto-generated from the split schema files by scripts/bundle_schema.py. "
            "Use the split files for development; use this file for tools that require "
            "a single schema document."
        ),
    }

    # Copy top-level structural properties from root, rewriting refs
    for key in ("type", "required"):
        if key in root:
            bundled[key] = root[key]

    # Rewrite properties
    if "properties" in root:
        bundled["properties"] = rewrite_refs(root["properties"])

    # Rewrite allOf (the conditional document type requirements)
    if "allOf" in root:
        bundled["allOf"] = rewrite_refs(root["allOf"])

    # Attach all definitions
    bundled["$defs"] = rewritten_defs

    return bundled


# ---------------------------------------------------------------------------
# Validate the output
# ---------------------------------------------------------------------------


def validate_internal_refs(bundled: dict) -> list[str]:
    """Check that every #/$defs/X reference points to an existing definition."""
    available = set(bundled.get("$defs", {}).keys())
    issues = []

    def check(obj, path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == "$ref" and isinstance(value, str) and value.startswith("#/$defs/"):
                    def_name = value.split("/")[-1]
                    if def_name not in available:
                        issues.append(f"{path}.$ref -> {value} (not found)")
                else:
                    check(value, f"{path}.{key}")
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                check(item, f"{path}[{i}]")

    check(bundled)
    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    print("Bundling DSDS schemas...\n")

    bundled = build_bundled()

    # Validate internal references
    print("\n  Validating internal references...")
    issues = validate_internal_refs(bundled)
    if issues:
        print(f"\n  ✗ {len(issues)} broken reference(s):")
        for issue in issues:
            print(f"    {issue}")
        sys.exit(1)
    else:
        def_count = len(bundled.get("$defs", {}))
        print(f"  ✓ All references resolve ({def_count} definitions)")

    # Write output
    OUTPUT.write_text(
        json.dumps(bundled, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    rel_path = OUTPUT.relative_to(ROOT)
    print(f"\n  Written to {rel_path}")

    # Final JSON parse check
    json.loads(OUTPUT.read_text(encoding="utf-8"))
    print("  ✓ Output is valid JSON")

    print("\nDone.")


if __name__ == "__main__":
    main()
