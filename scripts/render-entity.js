"use strict";

/* ── Helpers ─────────────────────────────────────────── */

function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function secStyle(n) {
  return "";
}

var LINK_ICONS = {
  source: "",
  design: "",
  storybook: "",
  package: "",
  alternative: "",
  child: "",
  parent: "",
  documentation: "",
  related: "",
};

/* ── Normalize metadata array into flat properties ──── */
/**
 * Entity JSON files store summary, description, status, since, tags,
 * category, aliases and links inside a `metadata` array.  The renderers
 * expect them as direct top-level properties.  This function copies them
 * out so the rest of the code works unchanged.
 */
function normalizeEntity(data) {
  if (!data || !Array.isArray(data.metadata)) return data;
  data.metadata.forEach(function (m) {
    switch (m.kind) {
      case "description":
        if (data.description == null) data.description = m.value;
        break;
      case "summary":
        if (data.summary == null) data.summary = m.value;
        break;
      case "status":
        if (data.status == null)
          data.status = {
            overall: m.status,
            platforms: m.platformStatus || null,
          };
        break;
      case "since":
        if (data.since == null) data.since = m.value;
        break;
      case "tags":
        if (data.tags == null) data.tags = m.items;
        break;
      case "category":
        if (data.category == null) data.category = m.value;
        break;
      case "aliases":
        if (data.aliases == null) data.aliases = m.items;
        break;
      case "links":
        if (data.links == null) data.links = m.items;
        break;
    }
  });
  return data;
}

/* ── Unique field id counter ────────────────────────── */
var _fid = 0;

function resetFid() {
  _fid = 0;
}

function fid(prefix) {
  return prefix + "-" + ++_fid;
}

/* ── Syntax highlight a JSON string ─────────────────── */
function synHL(json) {
  if (typeof json !== "string") json = JSON.stringify(json, null, 2);
  json = esc(json);
  return json.replace(
    /(&quot;(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\&])*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g,
    function (m) {
      var c = "json-number";
      if (/^&quot;/.test(m)) {
        c = /:$/.test(m) ? "json-key" : "json-string";
      } else if (/true|false/.test(m)) {
        c = "json-bool";
      } else if (/null/.test(m)) {
        c = "json-null";
      }
      return '<span class="' + c + '">' + m + "</span>";
    },
  );
}

/* ── Wrap a JSON fragment with a data-field span ────── */
/* Returns highlighted JSON lines with the specified field id wrapping each line */
function fieldJSON(obj, fieldId) {
  var raw = JSON.stringify(obj, null, 2);
  var lines = raw.split("\n");
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    out.push(
      '<span data-field="' + fieldId + '">' + synHL(lines[i]) + "</span>",
    );
  }
  return out.join("\n");
}

/* ── Wrap a rendered element with a data-field span ─── */
function rf(fieldId, html) {
  return '<span class="rf" data-field="' + fieldId + '">' + html + "</span>";
}

/* Block-level version */
function rfDiv(fieldId, html) {
  return '<div class="rf" data-field="' + fieldId + '">' + html + "</div>";
}

function statusBadge(s) {
  var v = s || "draft";
  return (
    '<ds-badge variant="' + esc(v) + '" size="sm">' + esc(v) + "</ds-badge>"
  );
}

/**
 * Normalize status: can be a string ("stable") or an
 * object ({ overall, platforms }). Always returns
 * { overall: string, platforms: object|null }.
 */
function normalizeStatus(raw) {
  if (!raw) return { overall: "draft", platforms: null };
  if (typeof raw === "string") return { overall: raw, platforms: null };
  return {
    overall: raw.overall || "draft",
    platforms: raw.platforms || null,
  };
}

function renderStatusHTML(status, includePlatformNote) {
  var s = normalizeStatus(status);
  var html = "<div>" + statusBadge(s.overall) + "</div>";
  if (s.platforms) {
    var noteCol = includePlatformNote ? "<th>Note</th>" : "";
    html +=
      '<ds-table><table class="platform-table"><thead><tr><th>Platform</th><th>Status</th><th>Since</th>' +
      noteCol +
      "</tr></thead><tbody>";
    Object.keys(s.platforms).forEach(function (p) {
      var pl = s.platforms[p];
      var noteCell = includePlatformNote
        ? '<td style="font-size:0.78rem;color:#888">' +
          esc(pl.description || "") +
          "</td>"
        : "";
      html +=
        "<tr><td>" +
        esc(p) +
        "</td><td>" +
        statusBadge(pl.status) +
        "</td><td>" +
        esc(pl.since || "\u2014") +
        "</td>" +
        noteCell +
        "</tr>";
    });
    html += "</tbody></table></ds-table>";
  }
  return html;
}

/* ── Build a complete section pair ──────────────────── */
function sectionPair(sectionName, label, codeHTML, renderedHTML) {
  return (
    '<div class="section-pair">' +
    '<div class="col-code-wrap">' +
    '<div class="col-code">' +
    '<div class="section-panel">' +
    '<p class="section-label">' +
    esc(label) +
    "</p>" +
    '<pre class="json-code">' +
    codeHTML +
    "</pre>" +
    "</div>" +
    "</div>" +
    '<div class="offscreen-indicator above" data-dir="above"><span class="arrow">\u2191</span> Highlighted code above</div>' +
    '<div class="offscreen-indicator below" data-dir="below"><span class="arrow">\u2193</span> Highlighted code below</div>' +
    "</div>" +
    '<div class="col-rendered"><div class="section-panel rendered-section">' +
    renderedHTML +
    "</div></div></div>"
  );
}

/**
 * Generate code-column JSON lines for a document-block-level agents object.
 * Returns an array of highlighted lines (empty array if no agents).
 */
function blockAgentsCode(agents) {
  if (!agents) return [];
  return [",\n" + fieldJSON({ agents: agents }, fid("ba"))];
}

/**
 * Generate rendered-column HTML for a document-block-level agents object.
 * Returns an HTML string (empty string if no agents).
 * Reuses the same structure as entity-level agents but rendered more compactly.
 */
function blockAgentsRendered(agents) {
  if (!agents) return "";
  var LEVEL_BADGE = {
    "must": "required",
    "must-not": "prohibited",
    "should": "encouraged",
    "should-not": "discouraged"
  };

  var html = '<div style="margin-top:var(--ds-space-4);padding-top:var(--ds-space-3);border-top:1px dashed var(--ds-color-border-light)">';
  html += '<h3 style="font-size:var(--ds-font-size-sm);color:var(--ds-color-text-muted);letter-spacing:var(--ds-tracking-wide);margin:0 0 var(--ds-space-2)">Agent Context</h3>';

  if (agents.intent) {
    html += '<p style="font-size:var(--ds-font-size-md);color:#666;margin:0 0 var(--ds-space-2)">' + esc(agents.intent) + '</p>';
  }

  if (agents.constraints && agents.constraints.length) {
    html += '<ds-table><table class="data-table"><thead><tr><th>Level</th><th>Rule</th></tr></thead><tbody>';
    agents.constraints.forEach(function(c) {
      html += '<tr><td><ds-badge variant="' + esc(LEVEL_BADGE[c.level] || c.level) + '" size="sm">' +
        esc(c.level) + '</ds-badge></td><td>' + esc(c.rule) +
        (c.context ? ' <span style="color:#999">(' + esc(c.context) + ')</span>' : '') +
        '</td></tr>';
    });
    html += '</tbody></table></ds-table>';
  }

  if (agents.disambiguation && agents.disambiguation.length) {
    html += '<ds-table><table class="data-table"><thead><tr><th>Entity</th><th>Distinction</th></tr></thead><tbody>';
    agents.disambiguation.forEach(function(d) {
      html += '<tr><td><ds-code inline>' + esc(d.entity) + '</ds-code></td><td>' + esc(d.distinction) + '</td></tr>';
    });
    html += '</tbody></table></ds-table>';
  }

  if (agents.antiPatterns && agents.antiPatterns.length) {
    agents.antiPatterns.forEach(function(ap) {
      html += '<div class="use-case negative" style="font-size:var(--ds-font-size-sm)"><div class="use-case-badge">\u2717</div><div>' +
        esc(ap.description) +
        (ap.instead ? '<div class="alternative-note"><strong>Instead:</strong> ' + esc(ap.instead) + '</div>' : '') +
        '</div></div>';
    });
  }

  if (agents.keywords && agents.keywords.length) {
    html += '<div class="tag-list" style="margin-top:var(--ds-space-2)">';
    agents.keywords.forEach(function(kw) {
      html += '<ds-tag size="sm">' + esc(kw) + '</ds-tag>';
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

/* ═══════════════════════════════════════════════════════
   COMPONENT RENDERER
   ═══════════════════════════════════════════════════════ */
function renderComponent(data) {
  normalizeEntity(data);
  var html = "";
  var gMap = {};
  if (data.documentBlocks)
    data.documentBlocks.forEach(function (g) {
      gMap[g.kind] = g;
    });

  /* ── Header ────────────────────────────────────────── */
  (function () {
    var f_dn = fid("h"),
      f_sum = fid("h"),
      f_desc = fid("h"),
      f_status = fid("h"),
      f_since = fid("h"),
      f_tags = fid("h"),
      f_cat = fid("h"),
      f_aliases = fid("h"),
      f_kind = fid("h");

    var code = "{\n";
    code += fieldJSON({ kind: data.kind }, f_kind) + ",\n";
    code += fieldJSON({ displayName: data.displayName }, f_dn) + ",\n";
    code += fieldJSON({ summary: data.summary }, f_sum) + ",\n";
    code += fieldJSON({ description: data.description }, f_desc) + ",\n";
    code += fieldJSON({ status: data.status }, f_status) + ",\n";
    code += fieldJSON({ since: data.since }, f_since) + ",\n";
    code += fieldJSON({ tags: data.tags }, f_tags) + ",\n";
    code += fieldJSON({ category: data.category }, f_cat) + ",\n";
    code += fieldJSON({ aliases: data.aliases }, f_aliases) + "\n}";

    var r =
      '<div class="entity-header">' +
      rfDiv(f_dn, "<h1>" + esc(data.displayName) + "</h1>") +
      rfDiv(f_sum, '<p class="summary">' + esc(data.summary) + "</p>") +
      rfDiv(
        f_desc,
        '<p class="description">' + esc(data.description) + "</p>",
      ) +
      rfDiv(f_status, renderStatusHTML(data.status, true)) +
      rfDiv(
        f_kind,
        '<ds-badge variant="kind" size="sm">' + esc(data.kind) + "</ds-badge>",
      ) +
      rfDiv(
        f_cat,
        '<ds-badge variant="category" size="sm">' +
          esc(data.category) +
          "</ds-badge>",
      ) +
      rfDiv(
        f_since,
        '<div class="meta-row"><strong>Since:</strong> v' +
          esc(data.since) +
          "</div>",
      ) +
      rfDiv(
        f_tags,
        '<div class="tag-list">' +
          (data.tags || [])
            .map(function (t) {
              return '<ds-tag size="sm">' + esc(t) + "</ds-tag>";
            })
            .join("") +
          "</div>",
      ) +
      rfDiv(
        f_aliases,
        '<div style="margin-top:4px;font-size:0.8rem;color:#888"><strong>Aliases:</strong> ' +
          (data.aliases || [])
            .map(function (a) {
              return "<ds-code inline>" + esc(a) + "</ds-code>";
            })
            .join(", ") +
          "</div>",
      ) +
      "</div>";
    html += sectionPair("header", "Entity Header", code, r);
  })();

  /* ── Anatomy ──────────────────────────────────────── */
  if (gMap.anatomy)
    (function () {
      var a = gMap.anatomy;
      var f_desc = fid("an"),
        f_parts = [],
        f_preview = fid("an");

      var codeLines = [
        '<span data-field="' +
          f_desc +
          '">' +
          synHL('"description": ' + JSON.stringify(a.description)) +
          "</span>,",
      ];
      codeLines.push(synHL('"parts": ['));
      (a.parts || []).forEach(function (p, i) {
        var pid = fid("an");
        f_parts.push({ id: pid, part: p });
        codeLines.push(fieldJSON(p, pid) + (i < a.parts.length - 1 ? "," : ""));
      });
      codeLines.push(synHL("]"));
      if (a.preview)
        codeLines.push(",\n" + fieldJSON({ preview: a.preview }, f_preview));

      var r =
        "<h2>Anatomy</h2>" +
        rfDiv(f_desc, "<p>" + esc(a.description) + "</p>") +
        '<ds-table><table class="data-table"><thead><tr><th>Part</th><th>Required</th><th>Description</th></tr></thead><tbody>' +
        f_parts
          .map(function (fp) {
            var p = fp.part;
            var toks = "";
            if (p.tokens) {
              toks =
                '<div style="margin-top:4px">' +
                Object.keys(p.tokens)
                  .map(function (k) {
                    return (
                      "<ds-code inline>" +
                      esc(k) +
                      ": " +
                      esc(p.tokens[k]) +
                      "</ds-code>"
                    );
                  })
                  .join("") +
                "</div>";
            }
            return (
              '<tr class="rf" data-field="' +
              fp.id +
              '"><td><strong>' +
              esc(p.displayName) +
              "</strong><br><ds-code inline>" +
              esc(p.name) +
              "</ds-code></td><td>" +
              (p.required ? "Yes" : "No") +
              "</td><td>" +
              esc(p.description) +
              toks +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></ds-table>";
      if (a.preview && a.preview.length) {
        r += rfDiv(
          f_preview,
          '<div class="preview-placeholder">\uD83D\uDDBC ' +
            esc(a.preview[0].title) +
            "</div>",
        );
      }
      codeLines = codeLines.concat(blockAgentsCode(a.agents));
      r += blockAgentsRendered(a.agents);
      html += sectionPair("anatomy", "Anatomy", codeLines.join("\n"), r);
    })();

  /* ── API ──────────────────────────────────────────── */
  if (gMap.api)
    (function () {
      var api = gMap.api;
      var f_props = [],
        f_events = [],
        f_slots = [],
        f_css = [];

      var codeLines = [synHL('"properties": [')];
      (api.properties || []).forEach(function (p, i) {
        var pid = fid("ap");
        f_props.push({ id: pid, prop: p });
        codeLines.push(
          fieldJSON(p, pid) + (i < api.properties.length - 1 ? "," : ""),
        );
      });
      codeLines.push(synHL("],"));

      if (api.events) {
        codeLines.push(synHL('"events": ['));
        api.events.forEach(function (e, i) {
          var eid = fid("ae");
          f_events.push({ id: eid, ev: e });
          codeLines.push(
            fieldJSON(e, eid) + (i < api.events.length - 1 ? "," : ""),
          );
        });
        codeLines.push(synHL("],"));
      }
      if (api.slots) {
        api.slots.forEach(function (s) {
          var sid = fid("as");
          f_slots.push({ id: sid, slot: s });
          codeLines.push(synHL('"slots": ['));
          codeLines.push(fieldJSON(s, sid));
          codeLines.push(synHL("]"));
        });
      }
      if (api.cssCustomProperties) {
        codeLines.push(synHL('"cssCustomProperties": ['));
        api.cssCustomProperties.forEach(function (c, i) {
          var cid = fid("ac");
          f_css.push({ id: cid, cp: c });
          codeLines.push(
            fieldJSON(c, cid) +
              (i < api.cssCustomProperties.length - 1 ? "," : ""),
          );
        });
        codeLines.push(synHL("]"));
      }

      var r =
        "<h2>API</h2><h3>Properties</h3>" +
        '<ds-table><table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>' +
        f_props
          .map(function (fp) {
            var p = fp.prop;
            return (
              '<tr class="rf" data-field="' +
              fp.id +
              '"><td><ds-code inline>' +
              esc(p.name) +
              "</ds-code></td><td><ds-code inline>" +
              esc(p.type) +
              "</ds-code></td><td>" +
              (p.defaultValue !== undefined
                ? "<ds-code inline>" +
                  esc(String(p.defaultValue)) +
                  "</ds-code>"
                : "\u2014") +
              "</td><td>" +
              esc(p.description) +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></ds-table>";

      if (f_events.length) {
        r +=
          "<h3>Events</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Name</th><th>Payload</th><th>Description</th></tr></thead><tbody>' +
          f_events
            .map(function (fe) {
              var e = fe.ev;
              return (
                '<tr class="rf" data-field="' +
                fe.id +
                '"><td><ds-code inline>' +
                esc(e.name) +
                "</ds-code></td><td><ds-code inline>" +
                esc(e.payload) +
                "</ds-code></td><td>" +
                esc(e.description) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      if (f_slots.length) {
        r +=
          "<h3>Slots</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Name</th><th>Description</th></tr></thead><tbody>' +
          f_slots
            .map(function (fs) {
              var s = fs.slot;
              return (
                '<tr class="rf" data-field="' +
                fs.id +
                '"><td><ds-code inline>' +
                esc(s.name) +
                "</ds-code></td><td>" +
                esc(s.description) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      if (f_css.length) {
        r +=
          "<h3>CSS Custom Properties</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Property</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>' +
          f_css
            .map(function (fc) {
              var c = fc.cp;
              return (
                '<tr class="rf" data-field="' +
                fc.id +
                '"><td><ds-code inline>' +
                esc(c.name) +
                "</ds-code></td><td>" +
                esc(c.type || "") +
                "</td><td><ds-code inline>" +
                esc(c.defaultValue || "") +
                "</ds-code></td><td>" +
                esc(c.description) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      codeLines = codeLines.concat(blockAgentsCode(api.agents));
      r += blockAgentsRendered(api.agents);
      html += sectionPair("api", "API", codeLines.join("\n"), r);
    })();

  /* ── Events ───────────────────────────────────────── */
  if (gMap.events)
    (function () {
      var ev = gMap.events;
      var codeLines = [synHL('"items": [')];
      var rows = [];
      (ev.items || []).forEach(function (e, i) {
        var eid = fid("ev");
        codeLines.push(
          fieldJSON(e, eid) + (i < ev.items.length - 1 ? "," : "")
        );
        var meta = [];
        if (e.bubbles === true) meta.push("bubbles");
        if (e.cancelable === true) meta.push("cancelable");
        if (e.composed === true) meta.push("composed");
        var metaStr = meta.length
          ? ' <span style="font-size:0.75rem;color:#999">(' + meta.join(", ") + ")</span>"
          : "";
        rows.push(
          '<tr class="rf" data-field="' +
            eid +
            '"><td><strong>' +
            esc(e.name) +
            "</strong>" +
            metaStr +
            "</td><td>" +
            esc(e.payload || "\u2014") +
            "</td><td>" +
            esc(e.description) +
            "</td></tr>"
        );
      });
      codeLines.push(synHL("]"));
      var r =
        "<h2>Events</h2>" +
        '<ds-table><table class="data-table"><thead><tr><th>Event</th><th>Payload</th><th>Description</th></tr></thead><tbody>' +
        rows.join("") +
        "</tbody></table></ds-table>";
      codeLines = codeLines.concat(blockAgentsCode(ev.agents));
      r += blockAgentsRendered(ev.agents);
      html += sectionPair("events", "Events", codeLines.join("\n"), r);
    })();

  /* ── Variants ─────────────────────────────────────── */
  if (gMap.variants)
    (function () {
      var v = gMap.variants;
      var codeLines = [synHL('"items": [')];
      var rHtml = "<h2>Variants</h2>";
      (v.items || []).forEach(function (item, ii) {
        var iid = fid("vi");
        codeLines.push(synHL("{"));
        codeLines.push(
          fieldJSON(
            {
              kind: item.kind,
              name: item.name,
              displayName: item.displayName,
              description: item.description,
            },
            iid,
          ) + ",",
        );
        codeLines.push(synHL('"values": ['));

        rHtml += rfDiv(
          iid,
          "<h3>" +
            esc(item.displayName) +
            ' <small style="color:#aaa">(' +
            esc(item.kind) +
            ")</small></h3><p>" +
            esc(item.description) +
            "</p>",
        );

        (item.values || []).forEach(function (val, vi) {
          var vid = fid("vv");
          codeLines.push(
            fieldJSON(val, vid) + (vi < item.values.length - 1 ? "," : ""),
          );
          var ucHtml = "";
          if (val.purpose && val.purpose.useCases) {
            val.purpose.useCases.forEach(function (uc) {
              ucHtml +=
                '<div class="use-case ' +
                (uc.kind || "positive") +
                '"><div class="use-case-badge">' +
                (uc.kind === "positive" ? "\u2713" : "\u2717") +
                "</div><div>" +
                esc(uc.description);
              if (uc.alternative) {
                ucHtml +=
                  '<div class="alternative-note"><strong>Use instead:</strong> <ds-code inline>' +
                  esc(uc.alternative.name) +
                  "</ds-code> \u2014 " +
                  esc(uc.alternative.rationale) +
                  "</div>";
              }
              ucHtml += "</div></div>";
            });
          }
          rHtml += rfDiv(
            vid,
            '<div class="variant-card"><h4>' +
              esc(val.displayName) +
              " <ds-code inline>" +
              esc(val.name) +
              "</ds-code></h4><p>" +
              esc(val.description) +
              "</p>" +
              ucHtml +
              "</div>",
          );
        });
        codeLines.push(synHL("]"));
        codeLines.push(synHL("}" + (ii < v.items.length - 1 ? "," : "")));
      });
      codeLines.push(synHL("]"));
      codeLines = codeLines.concat(blockAgentsCode(v.agents));
      rHtml += blockAgentsRendered(v.agents);
      html += sectionPair("variants", "Variants", codeLines.join("\n"), rHtml);
    })();

  /* ── States ───────────────────────────────────────── */
  if (gMap.states)
    (function () {
      var st = gMap.states;
      var codeLines = [synHL('"items": [')];
      var rows = [];
      (st.items || []).forEach(function (s, i) {
        var sid = fid("st");
        codeLines.push(
          fieldJSON(s, sid) + (i < st.items.length - 1 ? "," : ""),
        );
        var tok = "\u2014";
        if (s.tokens) {
          tok = Object.keys(s.tokens)
            .map(function (k) {
              return (
                "<ds-code inline>" +
                esc(k) +
                " \u2192 " +
                esc(s.tokens[k]) +
                "</ds-code>"
              );
            })
            .join("<br>");
        }
        rows.push(
          '<tr class="rf" data-field="' +
            sid +
            '"><td><strong>' +
            esc(s.displayName) +
            "</strong><br><ds-code inline>" +
            esc(s.name) +
            "</ds-code></td><td>" +
            esc(s.description) +
            "</td><td>" +
            tok +
            "</td></tr>",
        );
      });
      codeLines.push(synHL("]"));
      var r =
        "<h2>States</h2>" +
        '<ds-table><table class="data-table"><thead><tr><th>State</th><th>Description</th><th>Token Overrides</th></tr></thead><tbody>' +
        rows.join("") +
        "</tbody></table></ds-table>";
      codeLines = codeLines.concat(blockAgentsCode(st.agents));
      r += blockAgentsRendered(st.agents);
      html += sectionPair("states", "States", codeLines.join("\n"), r);
    })();

  /* ── Purpose ──────────────────────────────────────── */
  if (gMap.purpose)
    (function () {
      var pur = gMap.purpose;
      var codeLines = [synHL('"useCases": [')];
      var positives = "",
        negatives = "";
      (pur.useCases || []).forEach(function (u, i) {
        var uid = fid("pu");
        codeLines.push(
          fieldJSON(u, uid) + (i < pur.useCases.length - 1 ? "," : ""),
        );
        var card =
          '<div class="use-case ' +
          (u.kind || "positive") +
          '"><div class="use-case-badge">' +
          (u.kind === "positive" ? "\u2713" : "\u2717") +
          "</div><div>" +
          esc(u.description);
        if (u.alternative) {
          card +=
            '<div class="alternative-note"><strong>Use instead:</strong> <ds-code inline>' +
            esc(u.alternative.name) +
            "</ds-code> \u2014 " +
            esc(u.alternative.rationale) +
            "</div>";
        }
        card += "</div></div>";
        if (u.kind === "positive") positives += rfDiv(uid, card);
        else negatives += rfDiv(uid, card);
      });
      codeLines.push(synHL("]"));
      var r =
        "<h2>Purpose</h2><h3>When to Use</h3>" +
        positives +
        "<h3>When Not to Use</h3>" +
        negatives;
      codeLines = codeLines.concat(blockAgentsCode(pur.agents));
      r += blockAgentsRendered(pur.agents);
      html += sectionPair("purpose", "Purpose", codeLines.join("\n"), r);
    })();

  /* ── Guidelines ────────────────────────────────────── */
  if (gMap["guideline"])
    (function () {
      var bp = gMap["guideline"];
      var codeLines = [synHL('"items": [')];
      var rCards = "";
      (bp.items || []).forEach(function (item, i) {
        var bid = fid("bp");
        codeLines.push(
          fieldJSON(item, bid) + (i < bp.items.length - 1 ? "," : ""),
        );
        var card =
          '<div class="bp-card ' +
          (item.kind || "") +
          '"><ds-badge variant="' +
          esc(item.kind || "informational") +
          '" size="sm">' +
          esc(item.kind) +
          '</ds-badge><ds-tag size="sm">' +
          esc(item.category) +
          "</ds-tag>" +
          (item.target
            ? ' <ds-tag size="sm">target: ' + esc(item.target) + "</ds-tag>"
            : "") +
          '<div style="margin-top:6px">' +
          esc(item.guidance) +
          '</div><div class="rationale">' +
          esc(item.rationale) +
          "</div>";
        if (item.criteria && item.criteria.length) {
          card +=
            '<div style="margin-top:4px">' +
            item.criteria
              .map(function (c) {
                return (
                  '<a href="' +
                  esc(c.url) +
                  '" style="font-size:0.72rem;color:#0055b3" target="_blank">' +
                  esc(c.url) +
                  "</a>"
                );
              })
              .join("<br>") +
            "</div>";
        }
        card += "</div>";
        rCards += rfDiv(bid, card);
      });
      codeLines.push(synHL("]"));
      codeLines = codeLines.concat(blockAgentsCode(bp.agents));
      rCards += blockAgentsRendered(bp.agents);
      html += sectionPair(
        "guideline",
        "Guidelines",
        codeLines.join("\n"),
        "<h2>Guidelines</h2>" + rCards,
      );
    })();

  /* ── Accessibility ────────────────────────────────── */
  if (gMap.accessibility)
    (function () {
      var a11y = gMap.accessibility;
      var f_wcag = fid("a1"),
        f_kb = [],
        f_aria = [],
        f_sr = fid("a1"),
        f_cc = [];

      var codeLines = [];
      codeLines.push(fieldJSON({ wcagLevel: a11y.wcagLevel }, f_wcag) + ",");
      if (a11y.keyboardInteraction) {
        codeLines.push(synHL('"keyboardInteraction": ['));
        a11y.keyboardInteraction.forEach(function (k, i) {
          var kid = fid("ak");
          f_kb.push({ id: kid, kb: k });
          codeLines.push(
            fieldJSON(k, kid) +
              (i < a11y.keyboardInteraction.length - 1 ? "," : ""),
          );
        });
        codeLines.push(synHL("],"));
      }
      if (a11y.ariaAttributes) {
        codeLines.push(synHL('"ariaAttributes": ['));
        a11y.ariaAttributes.forEach(function (a, i) {
          var aid = fid("aa");
          f_aria.push({ id: aid, attr: a });
          codeLines.push(
            fieldJSON(a, aid) + (i < a11y.ariaAttributes.length - 1 ? "," : ""),
          );
        });
        codeLines.push(synHL("],"));
      }
      if (a11y.screenReaderBehavior) {
        codeLines.push(
          fieldJSON(
            {
              screenReaderBehavior: a11y.screenReaderBehavior,
            },
            f_sr,
          ) + ",",
        );
      }
      if (a11y.colorContrast) {
        codeLines.push(synHL('"colorContrast": ['));
        a11y.colorContrast.forEach(function (c, i) {
          var cid = fid("acc");
          f_cc.push({ id: cid, cc: c });
          codeLines.push(
            fieldJSON(c, cid) + (i < a11y.colorContrast.length - 1 ? "," : ""),
          );
        });
        codeLines.push(synHL("]"));
      }

      var r =
        "<h2>Accessibility</h2>" +
        rfDiv(
          f_wcag,
          '<ds-badge variant="stable" size="sm">WCAG ' +
            esc(a11y.wcagLevel) +
            "</ds-badge>",
        );
      if (f_kb.length) {
        r +=
          "<h3>Keyboard Interactions</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Key</th><th>Action</th></tr></thead><tbody>' +
          f_kb
            .map(function (fk) {
              return (
                '<tr class="rf" data-field="' +
                fk.id +
                '"><td><kbd style="font-family:var(--font-mono);background:#f0f0f4;padding:2px 8px;border:1px solid #ddd;border-radius:4px;font-size:0.82rem">' +
                esc(fk.kb.key) +
                "</kbd></td><td>" +
                esc(fk.kb.action) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      if (f_aria.length) {
        r +=
          "<h3>ARIA Attributes</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Attribute</th><th>Value</th><th>Description</th></tr></thead><tbody>' +
          f_aria
            .map(function (fa) {
              var a = fa.attr;
              return (
                '<tr class="rf" data-field="' +
                fa.id +
                '"><td><ds-code inline>' +
                esc(a.attribute) +
                "</ds-code></td><td><ds-code inline>" +
                esc(a.value) +
                "</ds-code></td><td>" +
                esc(a.description) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      if (a11y.screenReaderBehavior) {
        r += rfDiv(
          f_sr,
          "<h3>Screen Reader</h3><p>" + esc(a11y.screenReaderBehavior) + "</p>",
        );
      }
      if (f_cc.length) {
        r +=
          "<h3>Color Contrast</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Foreground</th><th>Background</th><th>Ratio</th><th>Level</th><th>Context</th></tr></thead><tbody>' +
          f_cc
            .map(function (fc) {
              var c = fc.cc;
              return (
                '<tr class="rf" data-field="' +
                fc.id +
                '"><td><ds-code inline>' +
                esc(c.foreground) +
                "</ds-code></td><td><ds-code inline>" +
                esc(c.background) +
                "</ds-code></td><td>" +
                c.contrastRatio +
                ':1</td><td><ds-badge variant="stable" size="sm">' +
                esc(c.level) +
                "</ds-badge></td><td>" +
                esc(c.context) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      codeLines = codeLines.concat(blockAgentsCode(a11y.agents));
      r += blockAgentsRendered(a11y.agents);
      html += sectionPair(
        "accessibility",
        "Accessibility",
        codeLines.join("\n"),
        r,
      );
    })();

  /* ── Links ─────────────────────────────────────────── */
  if (data.links && data.links.length)
    (function () {
      var codeLines = [synHL("[")];
      var rGroups = {};
      var linkFields = [];
      data.links.forEach(function (l, i) {
        var lid = fid("lk");
        linkFields.push({ id: lid, link: l });
        codeLines.push(
          fieldJSON(l, lid) + (i < data.links.length - 1 ? "," : ""),
        );
        if (!rGroups[l.kind]) rGroups[l.kind] = [];
        rGroups[l.kind].push({ id: lid, link: l });
      });
      codeLines.push(synHL("]"));

      var r = "<h2>Links</h2>";
      Object.keys(rGroups).forEach(function (kind) {
        r +=
          '<div class="link-group"><div class="link-group-label">' +
          esc(kind) +
          "</div>";
        rGroups[kind].forEach(function (fl) {
          r += rfDiv(
            fl.id,
            '<div class="link-item"><a href="' +
              esc(fl.link.url) +
              '" target="_blank">' +
              esc(fl.link.label) +
              "</a></div>",
          );
        });
        r += "</div>";
      });
      html += sectionPair("links", "Links", codeLines.join("\n"), r);
    })();

  /* ── Agents ─────────────────────────────────────────── */
  if (data.agents)
    (function () {
      var ag = data.agents;
      var LEVEL_BADGE = {
        "must": "required",
        "must-not": "prohibited",
        "should": "encouraged",
        "should-not": "discouraged"
      };

      var codeLines = [synHL("{")];
      if (ag.intent)         codeLines.push(fieldJSON({ intent: ag.intent }, fid("ag")) + ",");
      if (ag.constraints)    codeLines.push(fieldJSON({ constraints: ag.constraints }, fid("ag")) + ",");
      if (ag.disambiguation) codeLines.push(fieldJSON({ disambiguation: ag.disambiguation }, fid("ag")) + ",");
      if (ag.antiPatterns)   codeLines.push(fieldJSON({ antiPatterns: ag.antiPatterns }, fid("ag")) + ",");
      if (ag.examples)       codeLines.push(fieldJSON({ examples: ag.examples }, fid("ag")) + ",");
      if (ag.keywords)       codeLines.push(fieldJSON({ keywords: ag.keywords }, fid("ag")));
      codeLines.push(synHL("}"));

      var r = "<h2>Agent context</h2>";

      if (ag.intent) {
        r += '<p class="summary">' + esc(ag.intent) + "</p>";
      }

      if (ag.constraints && ag.constraints.length) {
        r +=
          "<h3>Constraints</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Level</th><th>Rule</th><th>Context</th></tr></thead><tbody>' +
          ag.constraints.map(function (c) {
            return (
              "<tr><td><ds-badge variant=\"" + esc(LEVEL_BADGE[c.level] || c.level) + "\" size=\"sm\">" +
              esc(c.level) + "</ds-badge></td><td>" + esc(c.rule) + "</td><td>" +
              esc(c.context || "") + "</td></tr>"
            );
          }).join("") +
          "</tbody></table></ds-table>";
      }

      if (ag.disambiguation && ag.disambiguation.length) {
        r +=
          "<h3>Disambiguation</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Entity</th><th>Distinction</th></tr></thead><tbody>' +
          ag.disambiguation.map(function (d) {
            return (
              "<tr><td><ds-code inline>" + esc(d.entity) + "</ds-code></td><td>" +
              esc(d.distinction) + "</td></tr>"
            );
          }).join("") +
          "</tbody></table></ds-table>";
      }

      if (ag.antiPatterns && ag.antiPatterns.length) {
        r += "<h3>Anti-patterns</h3>";
        ag.antiPatterns.forEach(function (ap) {
          r +=
            '<div class="use-case negative"><div class="use-case-badge">\u2717</div><div>' +
            esc(ap.description) +
            (ap.instead
              ? '<div class="alternative-note"><strong>Instead:</strong> ' + esc(ap.instead) + "</div>"
              : "") +
            "</div></div>";
        });
      }

      if (ag.examples && ag.examples.length) {
        r += "<h3>Examples</h3>";
        ag.examples.forEach(function (ex) {
          r +=
            '<p style="font-size:var(--ds-font-size-sm);color:#666;margin:0 0 var(--ds-space-1)">' +
            esc(ex.description) + "</p>" +
            '<ds-code language="' + esc(ex.language || "html") + '">' + esc(ex.code) + "</ds-code>";
        });
      }

      if (ag.keywords && ag.keywords.length) {
        r += '<h3>Keywords</h3><div class="tag-list">';
        ag.keywords.forEach(function (kw) {
          r += '<ds-tag size="sm">' + esc(kw) + "</ds-tag>";
        });
        r += "</div>";
      }

      html += sectionPair("agents", "Agent context", codeLines.join("\n"), r);
    })();

  return html;
}

/* ═══════════════════════════════════════════════════════
   TOKEN RENDERER
   ═══════════════════════════════════════════════════════ */
function renderToken(data) {
  normalizeEntity(data);
  var html = "";
  var gMap = {};
  if (data.documentBlocks)
    data.documentBlocks.forEach(function (g) {
      gMap[g.kind] = g;
    });

  /* ── Header ────────────────────────────────────────── */
  (function () {
    var f_name = fid("th"),
      f_sum = fid("th"),
      f_desc = fid("th"),
      f_status = fid("th"),
      f_since = fid("th"),
      f_tags = fid("th"),
      f_tt = fid("th"),
      f_cat = fid("th"),
      f_aliases = fid("th"),
      f_kind = fid("th");

    var code = "{\n";
    code += fieldJSON({ kind: data.kind }, f_kind) + ",\n";
    code += fieldJSON({ name: data.name }, f_name) + ",\n";
    code += fieldJSON({ summary: data.summary }, f_sum) + ",\n";
    code += fieldJSON({ description: data.description }, f_desc) + ",\n";
    code += fieldJSON({ status: data.status }, f_status) + ",\n";
    code += fieldJSON({ since: data.since }, f_since) + ",\n";
    code += fieldJSON({ tags: data.tags }, f_tags) + ",\n";
    code += fieldJSON({ tokenType: data.tokenType }, f_tt) + ",\n";
    code += fieldJSON({ category: data.category }, f_cat) + ",\n";
    code += fieldJSON({ aliases: data.aliases }, f_aliases) + "\n}";

    var r =
      '<div class="entity-header">' +
      rfDiv(f_name, "<h1>" + esc(data.name) + "</h1>") +
      rfDiv(f_sum, '<p class="summary">' + esc(data.summary) + "</p>") +
      rfDiv(
        f_desc,
        '<p class="description">' + esc(data.description) + "</p>",
      ) +
      rfDiv(f_status, renderStatusHTML(data.status, false)) +
      rfDiv(
        f_kind,
        '<ds-badge variant="kind" size="sm">' + esc(data.kind) + "</ds-badge>",
      ) +
      rfDiv(
        f_tt,
        '<ds-badge variant="token-type" size="sm">' +
          esc(data.tokenType) +
          "</ds-badge>",
      ) +
      rfDiv(
        f_cat,
        '<ds-badge variant="category" size="sm">' +
          esc(data.category) +
          "</ds-badge>",
      ) +
      rfDiv(
        f_since,
        '<div class="meta-row"><strong>Since:</strong> v' +
          esc(data.since) +
          "</div>",
      ) +
      rfDiv(
        f_tags,
        '<div class="tag-list">' +
          (data.tags || [])
            .map(function (t) {
              return '<ds-tag size="sm">' + esc(t) + "</ds-tag>";
            })
            .join("") +
          "</div>",
      ) +
      rfDiv(
        f_aliases,
        '<div style="margin-top:4px;font-size:0.8rem;color:#888"><strong>Aliases:</strong> ' +
          (data.aliases || [])
            .map(function (a) {
              return "<ds-code inline>" + esc(a) + "</ds-code>";
            })
            .join(", ") +
          "</div>",
      ) +
      "</div>";
    html += sectionPair("header", "Entity Header", code, r);
  })();

  /* ── Value ─────────────────────────────────────────── */
  if (data.value)
    (function () {
      var val = data.value;
      var f_resolved = fid("tv"),
        f_ref = fid("tv"),
        f_res = fid("tv"),
        f_dtcg = fid("tv");

      var code = "{\n";
      code += fieldJSON({ resolved: val.resolved }, f_resolved) + ",\n";
      if (val.reference)
        code += fieldJSON({ reference: val.reference }, f_ref) + ",\n";
      if (val.resolution)
        code += fieldJSON({ resolution: val.resolution }, f_res) + ",\n";
      if (val.dtcgFile)
        code += fieldJSON({ dtcgFile: val.dtcgFile }, f_dtcg) + "\n";
      code += "}";

      var isColor = data.tokenType === "color";
      var r = '<h2>Value</h2><div class="value-display">';
      if (isColor)
        r += rf(
          f_resolved,
          '<div class="color-swatch" style="background:' +
            esc(val.resolved) +
            '"></div>',
        );
      r +=
        "<div>" +
        rfDiv(
          f_resolved,
          "<ds-code inline>" + esc(val.resolved) + "</ds-code>",
        );
      if (val.reference)
        r += rfDiv(
          f_ref,
          '<div class="value-meta"><strong>Reference:</strong> <ds-code inline>' +
            esc(val.reference) +
            "</ds-code></div>",
        );
      if (val.resolution)
        r += rfDiv(
          f_res,
          '<div class="value-meta"><strong>Resolution:</strong> ' +
            esc(val.resolution) +
            "</div>",
        );
      if (val.dtcgFile)
        r += rfDiv(
          f_dtcg,
          '<div class="value-meta"><strong>DTCG file:</strong> <ds-code inline>' +
            esc(val.dtcgFile) +
            "</ds-code></div>",
        );
      r += "</div></div>";
      html += sectionPair("value", "Value", code, r);
    })();

  /* ── API (token) ──────────────────────────────────── */
  if (data.api)
    (function () {
      var tapi = data.api;
      var fields = [];
      var codeLines = [synHL("{")];
      Object.keys(tapi).forEach(function (k, i) {
        var tid = fid("ta");
        fields.push({ id: tid, key: k, val: tapi[k] });
        var obj = {};
        obj[k] = tapi[k];
        codeLines.push(
          fieldJSON(obj, tid) + (i < Object.keys(tapi).length - 1 ? "," : ""),
        );
      });
      codeLines.push(synHL("}"));

      var r =
        "<h2>API \u2014 Platform Token Names</h2>" +
        '<ds-table><table class="data-table"><thead><tr><th>Platform</th><th>Token Name</th></tr></thead><tbody>' +
        fields
          .map(function (f) {
            return (
              '<tr class="rf" data-field="' +
              f.id +
              '"><td>' +
              esc(f.key) +
              "</td><td><ds-code inline>" +
              esc(f.val) +
              "</ds-code></td></tr>"
            );
          })
          .join("") +
        "</tbody></table></ds-table>";
      html += sectionPair("token-api", "API (Token)", codeLines.join("\n"), r);
    })();

  /* ── Purpose ──────────────────────────────────────── */
  if (gMap.purpose)
    (function () {
      var pur = gMap.purpose;
      var codeLines = [synHL('"useCases": [')];
      var pos = "",
        neg = "";
      (pur.useCases || []).forEach(function (u, i) {
        var uid = fid("tp");
        codeLines.push(
          fieldJSON(u, uid) + (i < pur.useCases.length - 1 ? "," : ""),
        );
        var card =
          '<div class="use-case ' +
          (u.kind || "positive") +
          '"><div class="use-case-badge">' +
          (u.kind === "positive" ? "\u2713" : "\u2717") +
          "</div><div>" +
          esc(u.description);
        if (u.alternative) {
          card +=
            '<div class="alternative-note"><strong>Use instead:</strong> <ds-code inline>' +
            esc(u.alternative.name) +
            "</ds-code> \u2014 " +
            esc(u.alternative.rationale) +
            "</div>";
        }
        card += "</div></div>";
        if (u.kind === "positive") pos += rfDiv(uid, card);
        else neg += rfDiv(uid, card);
      });
      codeLines.push(synHL("]"));
      codeLines = codeLines.concat(blockAgentsCode(pur.agents));
      html += sectionPair(
        "purpose",
        "Purpose",
        codeLines.join("\n"),
        "<h2>Purpose</h2><h3>When to Use</h3>" +
          pos +
          (neg ? "<h3>When Not to Use</h3>" + neg : "") +
          blockAgentsRendered(pur.agents),
      );
    })();

  /* ── Guidelines ────────────────────────────────────── */
  if (gMap["guideline"])
    (function () {
      var bp = gMap["guideline"];
      var codeLines = [synHL('"items": [')];
      var rCards = "";
      (bp.items || []).forEach(function (item, i) {
        var bid = fid("tb");
        codeLines.push(
          fieldJSON(item, bid) + (i < bp.items.length - 1 ? "," : ""),
        );
        var card =
          '<div class="bp-card ' +
          (item.kind || "") +
          '"><ds-badge variant="' +
          esc(item.kind || "informational") +
          '" size="sm">' +
          esc(item.kind) +
          '</ds-badge><ds-tag size="sm">' +
          esc(item.category) +
          "</ds-tag>" +
          '<div style="margin-top:6px">' +
          esc(item.guidance) +
          '</div><div class="rationale">' +
          esc(item.rationale) +
          "</div></div>";
        rCards += rfDiv(bid, card);
      });
      codeLines.push(synHL("]"));
      codeLines = codeLines.concat(blockAgentsCode(bp.agents));
      rCards += blockAgentsRendered(bp.agents);
      html += sectionPair(
        "guideline",
        "Guidelines",
        codeLines.join("\n"),
        "<h2>Guidelines</h2>" + rCards,
      );
    })();

  /* ── Accessibility ────────────────────────────────── */
  if (gMap.accessibility)
    (function () {
      var a11y = gMap.accessibility;
      var f_wcag = fid("ta1"),
        f_cc = [];
      var codeLines = [fieldJSON({ wcagLevel: a11y.wcagLevel }, f_wcag) + ","];
      if (a11y.colorContrast) {
        codeLines.push(synHL('"colorContrast": ['));
        a11y.colorContrast.forEach(function (c, i) {
          var cid = fid("tac");
          f_cc.push({ id: cid, cc: c });
          codeLines.push(
            fieldJSON(c, cid) + (i < a11y.colorContrast.length - 1 ? "," : ""),
          );
        });
        codeLines.push(synHL("]"));
      }
      var r =
        "<h2>Accessibility</h2>" +
        rfDiv(
          f_wcag,
          '<ds-badge variant="stable" size="sm">WCAG ' +
            esc(a11y.wcagLevel) +
            "</ds-badge>",
        );
      if (f_cc.length) {
        r +=
          "<h3>Color Contrast</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>FG</th><th>BG</th><th>Ratio</th><th>Level</th><th>Context</th></tr></thead><tbody>' +
          f_cc
            .map(function (fc) {
              var c = fc.cc;
              return (
                '<tr class="rf" data-field="' +
                fc.id +
                '"><td><ds-code inline>' +
                esc(c.foreground) +
                "</ds-code></td><td><ds-code inline>" +
                esc(c.background) +
                "</ds-code></td><td>" +
                c.contrastRatio +
                ':1</td><td><ds-badge variant="stable" size="sm">' +
                esc(c.level) +
                "</ds-badge></td><td>" +
                esc(c.context) +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table></ds-table>";
      }
      codeLines = codeLines.concat(blockAgentsCode(a11y.agents));
      r += blockAgentsRendered(a11y.agents);
      html += sectionPair(
        "accessibility",
        "Accessibility",
        codeLines.join("\n"),
        r,
      );
    })();

  /* ── Links ─────────────────────────────────────────── */
  if (data.links && data.links.length)
    (function () {
      var codeLines = [synHL("[")];
      var rGroups = {};
      data.links.forEach(function (l, i) {
        var lid = fid("tl");
        codeLines.push(
          fieldJSON(l, lid) + (i < data.links.length - 1 ? "," : ""),
        );
        if (!rGroups[l.kind]) rGroups[l.kind] = [];
        rGroups[l.kind].push({ id: lid, link: l });
      });
      codeLines.push(synHL("]"));
      var r = "<h2>Links</h2>";
      Object.keys(rGroups).forEach(function (kind) {
        r +=
          '<div class="link-group"><div class="link-group-label">' +
          esc(kind) +
          "</div>";
        rGroups[kind].forEach(function (fl) {
          r += rfDiv(
            fl.id,
            '<div class="link-item"><a href="' +
              esc(fl.link.url) +
              '" target="_blank">' +
              esc(fl.link.label) +
              "</a></div>",
          );
        });
        r += "</div>";
      });
      html += sectionPair("links", "Links", codeLines.join("\n"), r);
    })();

  /* ── Agents ─────────────────────────────────────────── */
  if (data.agents)
    (function () {
      var ag = data.agents;
      var LEVEL_BADGE = {
        "must": "required",
        "must-not": "prohibited",
        "should": "encouraged",
        "should-not": "discouraged"
      };

      var codeLines = [synHL("{")];
      if (ag.intent)         codeLines.push(fieldJSON({ intent: ag.intent }, fid("ag")) + ",");
      if (ag.constraints)    codeLines.push(fieldJSON({ constraints: ag.constraints }, fid("ag")) + ",");
      if (ag.disambiguation) codeLines.push(fieldJSON({ disambiguation: ag.disambiguation }, fid("ag")) + ",");
      if (ag.antiPatterns)   codeLines.push(fieldJSON({ antiPatterns: ag.antiPatterns }, fid("ag")) + ",");
      if (ag.examples)       codeLines.push(fieldJSON({ examples: ag.examples }, fid("ag")) + ",");
      if (ag.keywords)       codeLines.push(fieldJSON({ keywords: ag.keywords }, fid("ag")));
      codeLines.push(synHL("}"));

      var r = "<h2>Agent context</h2>";

      if (ag.intent) {
        r += '<p class="summary">' + esc(ag.intent) + "</p>";
      }

      if (ag.constraints && ag.constraints.length) {
        r +=
          "<h3>Constraints</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Level</th><th>Rule</th><th>Context</th></tr></thead><tbody>' +
          ag.constraints.map(function (c) {
            return (
              "<tr><td><ds-badge variant=\"" + esc(LEVEL_BADGE[c.level] || c.level) + "\" size=\"sm\">" +
              esc(c.level) + "</ds-badge></td><td>" + esc(c.rule) + "</td><td>" +
              esc(c.context || "") + "</td></tr>"
            );
          }).join("") +
          "</tbody></table></ds-table>";
      }

      if (ag.disambiguation && ag.disambiguation.length) {
        r +=
          "<h3>Disambiguation</h3>" +
          '<ds-table><table class="data-table"><thead><tr><th>Entity</th><th>Distinction</th></tr></thead><tbody>' +
          ag.disambiguation.map(function (d) {
            return (
              "<tr><td><ds-code inline>" + esc(d.entity) + "</ds-code></td><td>" +
              esc(d.distinction) + "</td></tr>"
            );
          }).join("") +
          "</tbody></table></ds-table>";
      }

      if (ag.antiPatterns && ag.antiPatterns.length) {
        r += "<h3>Anti-patterns</h3>";
        ag.antiPatterns.forEach(function (ap) {
          r +=
            '<div class="use-case negative"><div class="use-case-badge">\u2717</div><div>' +
            esc(ap.description) +
            (ap.instead
              ? '<div class="alternative-note"><strong>Instead:</strong> ' + esc(ap.instead) + "</div>"
              : "") +
            "</div></div>";
        });
      }

      if (ag.examples && ag.examples.length) {
        r += "<h3>Examples</h3>";
        ag.examples.forEach(function (ex) {
          r +=
            '<p style="font-size:var(--ds-font-size-sm);color:#666;margin:0 0 var(--ds-space-1)">' +
            esc(ex.description) + "</p>" +
            '<ds-code language="' + esc(ex.language || "html") + '">' + esc(ex.code) + "</ds-code>";
        });
      }

      if (ag.keywords && ag.keywords.length) {
        r += '<h3>Keywords</h3><div class="tag-list">';
        ag.keywords.forEach(function (kw) {
          r += '<ds-tag size="sm">' + esc(kw) + "</ds-tag>";
        });
        r += "</div>";
      }

      html += sectionPair("agents", "Agent context", codeLines.join("\n"), r);
    })();

  return html;
}

/* ── Public API ────────────────────────────────────────── */
module.exports = {
  renderComponent: renderComponent,
  renderToken: renderToken,
  esc: esc,
  synHL: synHL,
  resetFid: resetFid,
  /* Also expose internals that callers may find useful */
  LINK_ICONS: LINK_ICONS,
  secStyle: secStyle,
  fid: fid,
  fieldJSON: fieldJSON,
  rf: rf,
  rfDiv: rfDiv,
  statusBadge: statusBadge,
  normalizeStatus: normalizeStatus,
  renderStatusHTML: renderStatusHTML,
  sectionPair: sectionPair,
  normalizeEntity: normalizeEntity,
  blockAgentsCode: blockAgentsCode,
  blockAgentsRendered: blockAgentsRendered,
};
