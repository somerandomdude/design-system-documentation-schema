#!/usr/bin/env python3
"""
Build script for the DSDS specification site.

Converts Markdown spec modules into a static HTML site with
consistent navigation, styling, and cross-linking.

Usage:
    python3 site/build.py

Output:
    site/dist/  — The generated static site
"""

import os
import re
import html
import shutil
import textwrap
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
SPEC_DIR = ROOT / "spec"
MODULES_DIR = SPEC_DIR / "modules"
SITE_DIR = ROOT / "site"
DIST_DIR = SITE_DIR / "dist"

# ---------------------------------------------------------------------------
# Module registry — defines the order, slugs, and labels for nav / pages
# ---------------------------------------------------------------------------

MODULES = [
    {
        "slug": "index",
        "source": SPEC_DIR / "dsds-spec.md",
        "title": "Overview",
        "nav_label": "Overview",
        "section": "Specification",
    },
    {
        "slug": "core",
        "source": MODULES_DIR / "core.md",
        "title": "Core Module",
        "nav_label": "Core",
        "section": "Modules",
    },
    {
        "slug": "components",
        "source": MODULES_DIR / "components.md",
        "title": "Components Module",
        "nav_label": "Components",
        "section": "Modules",
    },
    {
        "slug": "tokens",
        "source": MODULES_DIR / "tokens.md",
        "title": "Tokens Module",
        "nav_label": "Tokens",
        "section": "Modules",
    },
    {
        "slug": "styles",
        "source": MODULES_DIR / "styles.md",
        "title": "Styles Module",
        "nav_label": "Styles",
        "section": "Modules",
    },
    {
        "slug": "patterns",
        "source": MODULES_DIR / "patterns.md",
        "title": "Patterns Module",
        "nav_label": "Patterns",
        "section": "Modules",
    },
    {
        "slug": "usecases",
        "source": MODULES_DIR / "usecases.md",
        "title": "Use Cases Module",
        "nav_label": "Use Cases",
        "section": "Modules",
    },
    {
        "slug": "examples",
        "source": MODULES_DIR / "examples.md",
        "title": "Examples Module",
        "nav_label": "Examples",
        "section": "Modules",
    },
    {
        "slug": "guidelines",
        "source": MODULES_DIR / "guidelines.md",
        "title": "Guidelines Module",
        "nav_label": "Guidelines",
        "section": "Modules",
    },
    {
        "slug": "accessibility",
        "source": MODULES_DIR / "accessibility.md",
        "title": "Accessibility Module",
        "nav_label": "Accessibility",
        "section": "Modules",
    },
    {
        "slug": "links",
        "source": MODULES_DIR / "links.md",
        "title": "Links Module",
        "nav_label": "Links",
        "section": "Modules",
    },
]


# ---------------------------------------------------------------------------
# Minimal Markdown → HTML converter
#
# Supports: headings, paragraphs, bold, italic, inline code, code blocks,
# links, images, unordered lists, ordered lists, tables, blockquotes, hrs.
# Good enough for the spec content without pulling in a dependency.
# ---------------------------------------------------------------------------


def md_to_html(md_text: str) -> str:
    """Convert a Markdown string to HTML."""
    lines = md_text.split("\n")
    out: list[str] = []
    i = 0

    def _inline(text: str) -> str:
        """Process inline formatting."""
        # Images (before links so ![...](...) isn't caught by link regex)
        text = re.sub(
            r"!\[([^\]]*)\]\(([^)]+)\)",
            r'<img src="\2" alt="\1">',
            text,
        )
        # Links
        text = re.sub(
            r"\[([^\]]+)\]\(([^)]+)\)",
            r'<a href="\2">\1</a>',
            text,
        )
        # Bold + italic
        text = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", text)
        text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
        text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", text)
        # Underscored bold / italic
        text = re.sub(r"___(.+?)___", r"<strong><em>\1</em></strong>", text)
        text = re.sub(r"__(.+?)__", r"<strong>\1</strong>", text)
        text = re.sub(r"(?<!_)_(?!_)(.+?)(?<!_)_(?!_)", r"<em>\1</em>", text)
        # Inline code (must come after bold/italic to avoid conflicts)
        text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
        return text

    def _heading_id(text: str) -> str:
        """Generate an id slug from heading text."""
        plain = re.sub(r"<[^>]+>", "", text)
        plain = re.sub(r"[^\w\s-]", "", plain)
        return re.sub(r"[\s]+", "-", plain.strip()).lower()

    while i < len(lines):
        line = lines[i]

        # Blank line
        if line.strip() == "":
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^---+\s*$", line):
            out.append("<hr>")
            i += 1
            continue

        # Fenced code block
        m = re.match(r"^```(\w*)", line)
        if m:
            lang = m.group(1)
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1  # skip closing ```
            code_text = html.escape("\n".join(code_lines))
            lang_attr = f' class="language-{lang}"' if lang else ""
            out.append(f"<pre><code{lang_attr}>{code_text}</code></pre>")
            continue

        # Heading
        m = re.match(r"^(#{1,6})\s+(.+)$", line)
        if m:
            level = len(m.group(1))
            text = _inline(m.group(2))
            hid = _heading_id(text)
            out.append(f'<h{level} id="{hid}">{text}</h{level}>')
            i += 1
            continue

        # Table
        if "|" in line and i + 1 < len(lines) and re.match(r"^\|[\s\-:|]+\|", lines[i + 1]):
            # Parse header
            headers = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2  # skip header and separator
            rows = []
            while i < len(lines) and "|" in lines[i] and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                rows.append(cells)
                i += 1
            out.append("<table>")
            out.append("<thead><tr>")
            for h in headers:
                out.append(f"<th>{_inline(h)}</th>")
            out.append("</tr></thead>")
            out.append("<tbody>")
            for row in rows:
                out.append("<tr>")
                for ci, cell in enumerate(row):
                    out.append(f"<td>{_inline(cell)}</td>")
                # Pad if row is short
                for _ in range(len(headers) - len(row)):
                    out.append("<td></td>")
                out.append("</tr>")
            out.append("</tbody></table>")
            continue

        # Blockquote
        if line.startswith(">"):
            bq_lines = []
            while i < len(lines) and (lines[i].startswith(">") or (lines[i].strip() != "" and bq_lines)):
                bq_lines.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
                if i < len(lines) and lines[i].strip() == "":
                    break
            bq_html = md_to_html("\n".join(bq_lines))
            out.append(f"<blockquote>{bq_html}</blockquote>")
            continue

        # Unordered list
        if re.match(r"^[-*+]\s", line):
            items = []
            while i < len(lines) and (re.match(r"^[-*+]\s", lines[i]) or (lines[i].startswith("  ") and items)):
                if re.match(r"^[-*+]\s", lines[i]):
                    items.append(re.sub(r"^[-*+]\s", "", lines[i]))
                else:
                    items[-1] += " " + lines[i].strip()
                i += 1
            out.append("<ul>")
            for item in items:
                out.append(f"<li>{_inline(item)}</li>")
            out.append("</ul>")
            continue

        # Ordered list
        if re.match(r"^\d+\.\s", line):
            items = []
            while i < len(lines) and (re.match(r"^\d+\.\s", lines[i]) or (lines[i].startswith("  ") and items)):
                if re.match(r"^\d+\.\s", lines[i]):
                    items.append(re.sub(r"^\d+\.\s", "", lines[i]))
                else:
                    items[-1] += " " + lines[i].strip()
                i += 1
            out.append("<ol>")
            for item in items:
                out.append(f"<li>{_inline(item)}</li>")
            out.append("</ol>")
            continue

        # Paragraph (default)
        para_lines = []
        while i < len(lines) and lines[i].strip() != "" and not re.match(r"^(#{1,6}\s|```|---|\||[-*+]\s|\d+\.\s|>)", lines[i]):
            para_lines.append(lines[i])
            i += 1
        if para_lines:
            text = _inline(" ".join(para_lines))
            out.append(f"<p>{text}</p>")
            continue

        # Fallback: skip
        i += 1

    return "\n".join(out)


# ---------------------------------------------------------------------------
# Navigation builder
# ---------------------------------------------------------------------------


def build_nav(active_slug: str) -> str:
    """Build the sidebar navigation HTML."""
    parts = []
    current_section = None

    for mod in MODULES:
        if mod["section"] != current_section:
            current_section = mod["section"]
            parts.append(f'<span class="nav__section-label">{html.escape(current_section)}</span>')

        href = f'{mod["slug"]}.html'
        active_cls = " nav__link--active" if mod["slug"] == active_slug else ""
        parts.append(
            f'<a class="nav__link{active_cls}" href="{href}">'
            f'{html.escape(mod["nav_label"])}</a>'
        )

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Page template
# ---------------------------------------------------------------------------


def page_html(title: str, slug: str, body_html: str) -> str:
    nav = build_nav(slug)
    return textwrap.dedent(f"""\
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>{html.escape(title)} — DSDS 0.1</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <button class="nav-toggle" onclick="document.querySelector('.nav').classList.toggle('nav--open')" aria-label="Toggle navigation">☰ Menu</button>
      <nav class="nav" role="navigation" aria-label="Specification navigation">
        <div class="nav__title"><a href="index.html">DSDS 0.1</a></div>
        <div class="nav__section">
          {nav}
        </div>
      </nav>
      <main class="content" role="main">
        <div class="content__inner">
          {body_html}

          <a href="#" class="back-to-top">↑ Back to top</a>

          <div class="footer">
            <p>Design System Documentation Standard (DSDS) 1.0 — Draft Specification</p>
            <p><a href="https://github.com/pjonori/design-system-documentation-schema">GitHub</a></p>
          </div>
        </div>
      </main>
    </body>
    </html>
    """)


# ---------------------------------------------------------------------------
# Index page — custom layout with module cards
# ---------------------------------------------------------------------------


def build_index_page(md_text: str) -> str:
    """Build the index page, converting module links to cards."""
    # We'll build this with a custom approach — parse the overview md
    # but inject module cards for the module listing section

    body = md_to_html(md_text)

    # Wrap the hero section
    body = body.replace(
        "<h1",
        '<div class="spec-header"><h1 class="spec-header__title"',
        1,
    )

    # Add a badge after the first h1 closing
    body = body.replace(
        "</h1>",
        ' <span class="badge">Draft</span></h1>',
        1,
    )

    return body


# ---------------------------------------------------------------------------
# Heading map — maps heading IDs to the slug of the page they live on
# ---------------------------------------------------------------------------


def build_heading_map() -> dict[str, str]:
    """Scan all module source files and build a map of heading ID → page slug."""
    heading_map: dict[str, str] = {}

    def _heading_id_simple(text: str) -> str:
        """Generate an id slug from raw markdown heading text (no inline HTML)."""
        # Strip backtick code spans
        text = re.sub(r"`([^`]+)`", r"\1", text)
        # Strip bold/italic markers
        text = re.sub(r"[*_]+", "", text)
        # Remove non-word, non-space, non-hyphen characters (dots, parens, etc.)
        text = re.sub(r"[^\w\s-]", "", text)
        # Collapse whitespace to hyphens
        return re.sub(r"[\s]+", "-", text.strip()).lower()

    for mod in MODULES:
        source = mod["source"]
        if not source.exists():
            continue
        slug = mod["slug"]
        md_text = source.read_text(encoding="utf-8")
        for m in re.finditer(r"^#{1,6}\s+(.+)$", md_text, re.MULTILINE):
            hid = _heading_id_simple(m.group(1))
            # First occurrence wins — if two pages define the same heading,
            # the earlier module in MODULES takes priority
            if hid not in heading_map:
                heading_map[hid] = slug

    return heading_map


# Global heading map — built once before page generation
_HEADING_MAP: dict[str, str] = {}


# ---------------------------------------------------------------------------
# Rewrite relative links between modules
# ---------------------------------------------------------------------------


def rewrite_links(body_html: str, current_slug: str) -> str:
    """Rewrite relative .md links to .html and fix cross-page anchor links."""
    # 1. Rewrite .md file links to .html
    body_html = re.sub(r'href="\.\./(dsds-spec\.md)"', r'href="index.html"', body_html)
    body_html = re.sub(r'href="(modules/)?(\w+)\.md"', r'href="\2.html"', body_html)
    body_html = re.sub(r'href="\.\./modules/(\w+)\.md"', r'href="\1.html"', body_html)

    # 2. Fix cross-page anchor links: #some-id → otherpage.html#some-id
    def _fix_anchor(m):
        anchor = m.group(1)
        target_slug = _HEADING_MAP.get(anchor)
        if target_slug and target_slug != current_slug:
            return f'href="{target_slug}.html#{anchor}"'
        # Same page or unknown — leave as-is
        return m.group(0)

    body_html = re.sub(r'href="#([^"]+)"', _fix_anchor, body_html)

    return body_html


# ---------------------------------------------------------------------------
# Main build
# ---------------------------------------------------------------------------


def build():
    global _HEADING_MAP

    # Clean and create dist
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)

    # Build the heading map for cross-page anchor resolution
    _HEADING_MAP = build_heading_map()
    print(f"  Indexed {len(_HEADING_MAP)} headings across {len(MODULES)} modules.\n")

    # Copy stylesheet
    shutil.copy2(SITE_DIR / "style.css", DIST_DIR / "style.css")

    # Build each page
    for mod in MODULES:
        source = mod["source"]
        if not source.exists():
            print(f"  ⚠  Skipping {mod['slug']} — source not found: {source}")
            continue

        md_text = source.read_text(encoding="utf-8")

        if mod["slug"] == "index":
            body_html = build_index_page(md_text)
        else:
            body_html = md_to_html(md_text)

        body_html = rewrite_links(body_html, mod["slug"])
        full_html = page_html(mod["title"], mod["slug"], body_html)

        out_path = DIST_DIR / f'{mod["slug"]}.html'
        out_path.write_text(full_html, encoding="utf-8")
        print(f"  ✓  {out_path.relative_to(ROOT)}")

    print(f"\nDone. Site built to {DIST_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    print("Building DSDS specification site...\n")
    build()
