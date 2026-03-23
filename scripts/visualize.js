#!/usr/bin/env node
/**
 * visualize.js — Generate a visual diagram of the DSDS schema architecture.
 *
 * Reads every .schema.json file from the split schema directories, extracts
 * all $defs and $ref relationships, and produces:
 *
 *   1. A Mermaid diagram file (.mmd) — for GitHub / mermaid.live rendering
 *   2. A clean SVG image built from basic primitives — Figma-compatible,
 *      no CSS, no <foreignObject>, no <style> blocks. Every visual property
 *      is expressed as an inline SVG attribute.
 *
 * Usage:
 *   node scripts/visualize.js                  # Generate all outputs (mmd + svg)
 *   node scripts/visualize.js --format=mmd     # Mermaid source only
 *   node scripts/visualize.js --format=svg     # SVG only
 *   node scripts/visualize.js --format=all     # All formats (default)
 *   node scripts/visualize.js --layout=root+common,entities,guidelines
 *                                              # Custom column order (left → right)
 *                                              # Use + to stack groups in one column
 *   node scripts/visualize.js --no-edges       # Hide dependency edges
 *   node scripts/visualize.js --help           # Show usage
 *
 * Output (default):
 *   site/dist/schema-architecture.mmd
 *   site/dist/schema-architecture.svg
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_DIR = path.join(ROOT, "spec", "schema");
const OUTPUT_DIR = path.join(ROOT, "site", "dist");
const ROOT_SCHEMA = path.join(SCHEMA_DIR, "dsds.schema.json");

const SPLIT_DIRS = [
  path.join(SCHEMA_DIR, "common"),
  path.join(SCHEMA_DIR, "guidelines"),
  path.join(SCHEMA_DIR, "entities"),
];

const OUTPUT_BASE = "schema-architecture";

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const THEME = {
  root: { fill: "#4A4A4A", stroke: "#333333", text: "#FFFFFF" },
  common: { fill: "#6C8EBF", stroke: "#5A7DAE", text: "#FFFFFF" },
  entities: { fill: "#82B366", stroke: "#71A255", text: "#FFFFFF" },
  guidelines: { fill: "#D4A843", stroke: "#C39732", text: "#FFFFFF" },
};

const GROUP_BG = {
  common: { fill: "#EBF0F7", stroke: "#B0C4DE", label: "#5A7DAE" },
  entities: { fill: "#EDF5E8", stroke: "#A3C68C", label: "#71A255" },
  guidelines: { fill: "#FBF4E4", stroke: "#D4B872", label: "#B8922E" },
};

const EDGE_COLOR = "#999999";
const CANVAS_BG = "#FFFFFF";
const FONT_FAMILY = "Inter, Helvetica, Arial, sans-serif";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const NODE_PAD_X = 16;
const NODE_PAD_Y = 10;
const NODE_LINE_HEIGHT = 16;
const NODE_GAP_Y = 14;
const NODE_FONT_SIZE = 12;
const NODE_FONT_SIZE_SMALL = 10;
const NODE_RADIUS = 6;
const NODE_STROKE_WIDTH = 1.5;
const NODE_MIN_WIDTH = 120;

const GROUP_PAD_X = 24;
const GROUP_PAD_Y = 36;
const GROUP_GAP = 60;
const GROUP_LABEL_FONT_SIZE = 13;
const GROUP_RADIUS = 10;
const GROUP_STROKE_WIDTH = 1;

const COLUMN_GAP = 200;
const CANVAS_PAD = 40;

const ARROW_SIZE = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listSchemaFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".schema.json"))
    .sort()
    .map((f) => path.join(dir, f));
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function classifyFile(filePath) {
  const rel = path.relative(SCHEMA_DIR, filePath);
  if (rel.startsWith("common")) return "common";
  if (rel.startsWith("entities")) return "entities";
  if (rel.startsWith("guidelines")) return "guidelines";
  return "root";
}

function fileLabel(filePath) {
  return path.basename(filePath, ".schema.json");
}

function nodeId(filePath) {
  const group = classifyFile(filePath);
  const label = fileLabel(filePath);
  return `${group}_${label}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Approximate the rendered width of a string in pixels.
 * Uses a rough per-character estimate — accurate enough for layout.
 */
function measureText(str, fontSize) {
  const avg = fontSize * 0.58;
  return str.length * avg;
}

// ---------------------------------------------------------------------------
// Graph extraction
// ---------------------------------------------------------------------------

function findRefs(obj, results) {
  if (Array.isArray(obj)) {
    for (const item of obj) findRefs(item, results);
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      if (key === "$ref" && typeof value === "string") {
        results.push(value);
      } else {
        findRefs(value, results);
      }
    }
  }
  return results;
}

function resolveRef(ref, fromFile) {
  if (ref.startsWith("https://") || ref.startsWith("http://")) return null;
  if (ref.startsWith("#/")) return fromFile;
  const hashIndex = ref.indexOf("#");
  const filePart = hashIndex !== -1 ? ref.slice(0, hashIndex) : ref;
  const fromDir = path.dirname(fromFile);
  return path.resolve(fromDir, filePart);
}

function buildGraph() {
  const files = new Map();
  const edges = new Set();

  const allFiles = [ROOT_SCHEMA];
  for (const dir of SPLIT_DIRS) {
    allFiles.push(...listSchemaFiles(dir));
  }

  for (const filePath of allFiles) {
    const data = readJSON(filePath);
    const defs = data.$defs ? Object.keys(data.$defs) : [];
    files.set(filePath, {
      group: classifyFile(filePath),
      label: fileLabel(filePath),
      defs,
      id: nodeId(filePath),
    });
  }

  for (const filePath of allFiles) {
    const data = readJSON(filePath);
    const refs = findRefs(data, []);
    const sourceId = files.get(filePath).id;

    for (const ref of refs) {
      const targetPath = resolveRef(ref, filePath);
      if (!targetPath || targetPath === filePath) continue;
      const targetInfo = files.get(targetPath);
      if (!targetInfo) continue;
      const edgeKey = `${sourceId}-->${targetInfo.id}`;
      edges.add(edgeKey);
    }
  }

  return { files, edges };
}

// ---------------------------------------------------------------------------
// Mermaid generation (unchanged)
// ---------------------------------------------------------------------------

function generateMermaid() {
  const { files, edges } = buildGraph();
  const lines = [];
  lines.push("graph LR");
  lines.push("");
  lines.push("  %% Style classes");
  lines.push(
    `  classDef root fill:${THEME.root.fill},stroke:${THEME.root.stroke},color:${THEME.root.text},stroke-width:2px,font-weight:bold`,
  );
  lines.push(
    `  classDef common fill:${THEME.common.fill},stroke:${THEME.common.stroke},color:${THEME.common.text},stroke-width:1.5px`,
  );
  lines.push(
    `  classDef entities fill:${THEME.entities.fill},stroke:${THEME.entities.stroke},color:${THEME.entities.text},stroke-width:1.5px`,
  );
  lines.push(
    `  classDef guidelines fill:${THEME.guidelines.fill},stroke:${THEME.guidelines.stroke},color:${THEME.guidelines.text},stroke-width:1.5px`,
  );
  lines.push("");

  const groups = { root: [], common: [], entities: [], guidelines: [] };
  for (const [, info] of files) {
    groups[info.group].push(info);
  }

  if (groups.root.length > 0) {
    lines.push("  %% Root");
    for (const info of groups.root) {
      const defsLabel =
        info.defs.length > 0 ? `<br/><i>${info.defs.join(", ")}</i>` : "";
      lines.push(`  ${info.id}["<b>${info.label}</b>${defsLabel}"]`);
      lines.push(`  class ${info.id} root`);
    }
    lines.push("");
  }

  const groupMeta = [
    { key: "entities", title: "Entities" },
    { key: "guidelines", title: "Guidelines" },
    { key: "common", title: "Common" },
  ];

  for (const { key, title } of groupMeta) {
    const items = groups[key];
    if (items.length === 0) continue;
    lines.push(`  subgraph ${key}["${title}"]`);
    lines.push(`    direction TB`);
    for (const info of items) {
      const defsStr = info.defs.length > 0 ? info.defs.join(", ") : "";
      const defsLabel = defsStr ? `<br/><i>${defsStr}</i>` : "";
      lines.push(`    ${info.id}["<b>${info.label}</b>${defsLabel}"]`);
    }
    lines.push("  end");
    lines.push("");
  }

  for (const { key } of groupMeta) {
    const items = groups[key];
    if (items.length === 0) continue;
    const ids = items.map((i) => i.id).join(",");
    lines.push(`  class ${ids} ${key}`);
  }
  lines.push("");
  lines.push("  %% Dependencies");
  for (const edge of edges) {
    lines.push(`  ${edge}`);
  }
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// SVG layout engine
// ---------------------------------------------------------------------------

/**
 * Measure a single node and return its dimensions.
 * Each node shows: bold label + italic defs list (word-wrapped).
 */
function measureNode(info) {
  const titleWidth = measureText(info.label, NODE_FONT_SIZE);
  const defsStr = info.defs.join(", ");

  // Word-wrap defs into lines of ~28 chars max
  const maxLineChars = 28;
  const defsLines = [];
  if (defsStr.length > 0) {
    const words = defsStr.split(/,\s*/);
    let current = "";
    for (const word of words) {
      const candidate = current.length === 0 ? word : current + ", " + word;
      if (candidate.length > maxLineChars && current.length > 0) {
        defsLines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current.length > 0) defsLines.push(current);
  }

  const defsWidths = defsLines.map((l) => measureText(l, NODE_FONT_SIZE_SMALL));
  const maxDefsWidth = defsWidths.length > 0 ? Math.max(...defsWidths) : 0;
  const contentWidth = Math.max(titleWidth, maxDefsWidth);
  const w = Math.max(NODE_MIN_WIDTH, contentWidth + NODE_PAD_X * 2);

  const titleLineCount = 1;
  const totalLines = titleLineCount + defsLines.length;
  const lineSpacing = defsLines.length > 0 ? 4 : 0;
  const h = NODE_PAD_Y * 2 + totalLines * NODE_LINE_HEIGHT + lineSpacing;

  return { w, h, defsLines };
}

/**
 * Layout all nodes in a left-to-right column arrangement.
 *
 * Each entry in `columnOrder` is an array of group keys that share one column.
 * Groups within the same column are stacked vertically with GROUP_GAP between
 * them. This lets you write `--layout=root+common,entities,guidelines` to put
 * root and common in the first column.
 *
 * Returns positioned node map + group boxes + canvas size.
 */
const DEFAULT_COLUMN_ORDER = [["root"], ["entities", "common"], ["guidelines"]];

function layoutGraph(options = {}) {
  const columnOrder = options.columnOrder || DEFAULT_COLUMN_ORDER;
  const showEdges = options.showEdges !== false;

  const { files, edges } = buildGraph();

  // Group nodes
  const groups = { root: [], entities: [], guidelines: [], common: [] };
  for (const [, info] of files) {
    groups[info.group].push(info);
  }

  // Measure all nodes
  const nodeMeasures = new Map();
  for (const [, info] of files) {
    const m = measureNode(info);
    nodeMeasures.set(info.id, { ...info, ...m, x: 0, y: 0, cx: 0, cy: 0 });
  }

  const columnData = []; // { group, x, y, w, h, nodes[] }

  let cursorX = CANVAS_PAD;

  for (const columnGroups of columnOrder) {
    // Collect all segments (one per group key) that will share this column
    const segments = []; // { groupKey, items[], padX, padY, maxNodeW, totalH }

    for (const groupKey of columnGroups) {
      const items = groups[groupKey];
      if (items.length === 0) continue;

      const isRoot = groupKey === "root";
      const padX = isRoot ? 0 : GROUP_PAD_X;
      const padY = isRoot ? 0 : GROUP_PAD_Y;

      let maxNodeW = 0;
      let totalH = 0;
      for (let i = 0; i < items.length; i++) {
        const nm = nodeMeasures.get(items[i].id);
        if (nm.w > maxNodeW) maxNodeW = nm.w;
        totalH += nm.h;
        if (i > 0) totalH += NODE_GAP_Y;
      }

      segments.push({ groupKey, items, padX, padY, maxNodeW, totalH });
    }

    if (segments.length === 0) continue;

    // The column is as wide as the widest segment (including its padding)
    let colInnerW = 0;
    for (const seg of segments) {
      const segW = seg.maxNodeW + seg.padX * 2;
      if (segW > colInnerW) colInnerW = segW;
    }

    // Position each segment vertically within the column
    const groupX = cursorX;
    let cursorY = CANVAS_PAD;

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      const uniformW = colInnerW - seg.padX * 2;
      const groupH = seg.totalH + seg.padY * 2;
      const groupY = cursorY;

      let nodeY = groupY + seg.padY;
      for (const info of seg.items) {
        const nm = nodeMeasures.get(info.id);
        const nodeX = groupX + seg.padX;
        nm.x = nodeX;
        nm.y = nodeY;
        nm.w = uniformW;
        nm.cx = nodeX + uniformW / 2;
        nm.cy = nodeY + nm.h / 2;
        nodeY += nm.h + NODE_GAP_Y;
      }

      columnData.push({
        group: seg.groupKey,
        x: groupX,
        y: groupY,
        w: colInnerW,
        h: groupH,
        nodes: seg.items.map((i) => nodeMeasures.get(i.id)),
      });

      cursorY += groupH + GROUP_GAP;
    }

    cursorX += colInnerW + COLUMN_GAP;
  }

  // Vertically center columns relative to the tallest one.
  // Columns that share the same x are part of the same visual column —
  // group them and center them together.
  const columnsByX = new Map();
  for (const col of columnData) {
    if (!columnsByX.has(col.x)) columnsByX.set(col.x, []);
    columnsByX.get(col.x).push(col);
  }

  let maxColH = 0;
  for (const [, cols] of columnsByX) {
    const last = cols[cols.length - 1];
    const h = last.y + last.h - cols[0].y;
    if (h > maxColH) maxColH = h;
  }

  for (const [, cols] of columnsByX) {
    const last = cols[cols.length - 1];
    const h = last.y + last.h - cols[0].y;
    const offsetY = (maxColH - h) / 2;
    if (offsetY > 0) {
      for (const col of cols) {
        col.y += offsetY;
        for (const nm of col.nodes) {
          nm.y += offsetY;
          nm.cy += offsetY;
        }
      }
    }
  }

  const canvasW = cursorX - COLUMN_GAP + CANVAS_PAD;
  const canvasH = maxColH + CANVAS_PAD * 2;

  // Parse edges into source/target pairs
  const edgeList = [];
  if (showEdges) {
    for (const edgeStr of edges) {
      const [srcId, tgtId] = edgeStr.split("-->");
      const src = nodeMeasures.get(srcId);
      const tgt = nodeMeasures.get(tgtId);
      if (src && tgt) {
        edgeList.push({ src, tgt });
      }
    }
  }

  return { columnData, edgeList, canvasW, canvasH, nodeMeasures };
}

// ---------------------------------------------------------------------------
// SVG rendering — pure inline attributes, no CSS
// ---------------------------------------------------------------------------

function renderSvg(options = {}) {
  const { columnData, edgeList, canvasW, canvasH } = layoutGraph(options);

  const parts = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">`,
  );

  // White background
  parts.push(
    `  <rect x="0" y="0" width="${canvasW}" height="${canvasH}" fill="${CANVAS_BG}" />`,
  );

  // Arrow marker definition — inline, no CSS
  parts.push("  <defs>");
  parts.push(
    `    <marker id="arrowhead" markerWidth="${ARROW_SIZE * 2}" markerHeight="${ARROW_SIZE * 2}" refX="${ARROW_SIZE}" refY="${ARROW_SIZE / 2}" orient="auto" markerUnits="userSpaceOnUse">`,
  );
  parts.push(
    `      <polygon points="0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}" fill="${EDGE_COLOR}" />`,
  );
  parts.push("    </marker>");
  parts.push("  </defs>");

  // -- Edges (drawn first, behind nodes) ------------------------------------
  parts.push("  <!-- Edges -->");
  parts.push(`  <g>`);

  for (const { src, tgt } of edgeList) {
    // Candidate anchors — left and right sides only
    const srcAnchors = [
      { x: src.x + src.w, y: src.cy, sign: 1 }, // right
      { x: src.x, y: src.cy, sign: -1 }, // left
    ];
    const tgtAnchors = [
      { x: tgt.x + tgt.w, y: tgt.cy, sign: 1 }, // right
      { x: tgt.x, y: tgt.cy, sign: -1 }, // left
    ];

    // Pick the pair with the shortest distance
    let bestDist = Infinity;
    let bestSrc = srcAnchors[0];
    let bestTgt = tgtAnchors[1];
    for (const sa of srcAnchors) {
      for (const ta of tgtAnchors) {
        const dx = ta.x - sa.x;
        const dy = ta.y - sa.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestSrc = sa;
          bestTgt = ta;
        }
      }
    }

    const x1 = bestSrc.x;
    const y1 = bestSrc.y;
    const x2 = bestTgt.x;
    const y2 = bestTgt.y;

    // Control points extend horizontally outward from the chosen side
    const dist = Math.sqrt(bestDist);
    const cpLen = Math.max(20, Math.min(dist * 0.4, 80));
    const cx1 = x1 + bestSrc.sign * cpLen;
    const cy1 = y1;
    const cx2 = x2 + bestTgt.sign * cpLen;
    const cy2 = y2;

    parts.push(
      `    <path d="M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}" fill="none" stroke="${EDGE_COLOR}" stroke-width="1" opacity="0.4" marker-end="url(#arrowhead)" />`,
    );
  }
  parts.push("  </g>");

  // -- Group labels ---------------------------------------------------------
  parts.push("  <!-- Group labels -->");
  for (const col of columnData) {
    if (col.group === "root") continue; // no label for root

    const gb = GROUP_BG[col.group];
    if (!gb) continue;

    const labelX = col.x + col.w / 2;
    const labelY = col.y + 20;
    const label = col.group.charAt(0).toUpperCase() + col.group.slice(1);
    parts.push(
      `  <text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="${GROUP_LABEL_FONT_SIZE}" font-weight="600" fill="${gb.label}" letter-spacing="0.5">${escXml(label)}</text>`,
    );
  }

  // -- Nodes ----------------------------------------------------------------
  parts.push("  <!-- Nodes -->");
  for (const col of columnData) {
    const theme = THEME[col.group];

    for (const nm of col.nodes) {
      // Rectangle
      parts.push(
        `  <rect x="${nm.x}" y="${nm.y}" width="${nm.w}" height="${nm.h}" rx="${NODE_RADIUS}" ry="${NODE_RADIUS}" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="${NODE_STROKE_WIDTH}" />`,
      );

      // Title text (bold)
      const titleX = nm.x + nm.w / 2;
      const titleY = nm.y + NODE_PAD_Y + NODE_LINE_HEIGHT * 0.8;
      parts.push(
        `  <text x="${titleX}" y="${titleY}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="${NODE_FONT_SIZE}" font-weight="700" fill="${theme.text}">${escXml(nm.label)}</text>`,
      );

      // Defs lines (italic, slightly smaller)
      for (let i = 0; i < nm.defsLines.length; i++) {
        const lineY = titleY + (i + 1) * NODE_LINE_HEIGHT + 4;
        parts.push(
          `  <text x="${titleX}" y="${lineY}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="${NODE_FONT_SIZE_SMALL}" font-style="italic" fill="${theme.text}" opacity="0.85">${escXml(nm.defsLines[i])}</text>`,
        );
      }
    }
  }

  parts.push("</svg>");
  return parts.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
Usage: node scripts/visualize.js [options]

Options:
  --format=FORMAT   Output format(s): mmd, svg, or all (default: all)
  --layout=ORDER    Comma-separated column order, left to right.
                    Use + to stack groups in the same column.
                    Valid groups: root, entities, guidelines, common
                    (default: root+common,entities,guidelines)
  --no-edges        Hide dependency edges (show only nodes and groups)
  --output=DIR      Output directory (default: site/dist)
  --help            Show this help message

Examples:
  node scripts/visualize.js                  # Generate .mmd and .svg
  node scripts/visualize.js --format=svg     # SVG only
  node scripts/visualize.js --format=mmd     # Mermaid source only
  node scripts/visualize.js --layout=root+common,entities,guidelines
  node scripts/visualize.js --layout=entities,guidelines,common --no-edges
  node scripts/visualize.js --layout=root,entities,guidelines,common
`);
}

function parseArgs(argv) {
  const args = {
    format: "all",
    outputDir: OUTPUT_DIR,
    columnOrder: DEFAULT_COLUMN_ORDER,
    showEdges: true,
  };

  for (const arg of argv.slice(2)) {
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    if (arg.startsWith("--format=")) {
      args.format = arg.split("=")[1].toLowerCase();
    }
    if (arg.startsWith("--output=")) {
      args.outputDir = path.resolve(ROOT, arg.split("=")[1]);
    }
    if (arg.startsWith("--layout=")) {
      const validGroups = new Set(["root", "entities", "guidelines", "common"]);
      const columns = arg
        .split("=")[1]
        .split(",")
        .map((col) => col.split("+").map((s) => s.trim().toLowerCase()));
      for (const col of columns) {
        for (const g of col) {
          if (!validGroups.has(g)) {
            console.error(
              `Unknown group "${g}" in --layout. Valid groups: ${[...validGroups].join(", ")}`,
            );
            process.exit(1);
          }
        }
      }
      args.columnOrder = columns;
    }
    if (arg === "--no-edges") {
      args.showEdges = false;
    }
  }

  const valid = ["mmd", "svg", "all"];
  if (!valid.includes(args.format)) {
    console.error(
      `Unknown format "${args.format}". Valid formats: ${valid.join(", ")}`,
    );
    process.exit(1);
  }

  return args;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  console.log("Visualizing DSDS schema architecture...\n");

  if (!fs.existsSync(args.outputDir)) {
    fs.mkdirSync(args.outputDir, { recursive: true });
  }

  const svgOptions = {
    columnOrder: args.columnOrder,
    showEdges: args.showEdges,
  };

  const wantMmd = args.format === "all" || args.format === "mmd";
  const wantSvg = args.format === "all" || args.format === "svg";

  if (wantMmd) {
    const mermaidSource = generateMermaid();
    const mmdPath = path.join(args.outputDir, `${OUTPUT_BASE}.mmd`);
    fs.writeFileSync(mmdPath, mermaidSource, "utf-8");
    console.log(`  ✓  ${path.relative(ROOT, mmdPath)}`);
  }

  if (wantSvg) {
    const svgSource = renderSvg(svgOptions);
    const svgPath = path.join(args.outputDir, `${OUTPUT_BASE}.svg`);
    fs.writeFileSync(svgPath, svgSource, "utf-8");
    const kb = (Buffer.byteLength(svgSource, "utf-8") / 1024).toFixed(1);
    console.log(`  ✓  ${path.relative(ROOT, svgPath)} (${kb} KB)`);
  }

  console.log("\nDone.");
}

main();
