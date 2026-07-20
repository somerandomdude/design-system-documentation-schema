# Governance metadata field

Who's accountable for this entity's docs, and when someone last confirmed they're accurate. Answers 'who do I ask when the doc contradicts the code,' and lets tools flag docs nobody has checked in a while. Different from `lastUpdated`: that records when the doc changed; this records when someone confirmed it's still true. A doc untouched for a year but reviewed last month is healthy.

Source: `metadata/governance.schema.json`

**3 definitions** in this file: `governance`, `owner`, `lastReviewed`

## governance {#governance}

Who's accountable for this entity's docs, and their review state. `owner` is required — without one, this field answers nothing it's meant to. `lastReviewed` is optional but SHOULD be set once you have a review process; its object form records who reviewed it and which version, so a tool can answer 'is this verified, against what, and who vouches for it.'

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `owner` | [owner](metadata-governance.md#owner) | ✓ |  |
| `lastReviewed` | [lastReviewed](metadata-governance.md#lastreviewed) |  |  |

**References:** [owner](metadata-governance.md#owner), [lastReviewed](metadata-governance.md#lastreviewed)

**Example:**

```json
[
  {
    "owner": "Design Systems"
  },
  {
    "owner": {
      "name": "@acme/design-system",
      "contact": "design-system@acme.com"
    },
    "lastReviewed": {
      "date": "2026-06-12",
      "reviewedBy": "jane.doe",
      "note": "Verified against v3.1; prop table still accurate.",
      "reviewedAgainst": "@acme/ui@3.1.0"
    }
  }
]
```

## owner {#owner}

Who's accountable for this entity's docs. A bare string names the owner — the common case. Use the object form to add contact info. Owners SHOULD be teams, roles, or group aliases ('Design Systems', '@acme/design-system'), not individuals — a named person goes stale the moment they leave, which is exactly what this field is meant to survive. Tools SHOULD show the owner wherever a reader might need to flag a problem.

One of:

- **string** — Name or alias of the owning team, role, or group (ex: 'Design Systems', '@acme/design-system').
- **object** — The owner's name plus a way to reach them.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✓ | Name or alias of the owning team, role, or group (ex: 'Design Systems'). SHOULD name a team or role, not an individual. |
| `contact` | string |  | How to reach the owner — a URL, email, or channel (ex: 'design-system@acme.com', '#design-system'). Freeform; tools SHOULD link it when it parses as a URL or email. |

## lastReviewed {#lastreviewed}

When a human last confirmed this entity's docs are accurate. A bare date ('2026-06-12') covers the common case. Use the object form to record who reviewed it and what they found. A review doesn't have to change anything: confirming the doc is correct updates `lastReviewed` and leaves `lastUpdated` alone. Tools MAY treat an old or missing `lastReviewed` as a staleness signal; agents SHOULD prefer more recently reviewed docs when sources disagree.

One of:

- [isoDate](common-dated-note.md#isodate)
- **object** — The date plus who reviewed it, what version it was checked against, and an optional note on the outcome.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `date` | [isoDate](common-dated-note.md#isodate) | ✓ | ISO 8601 date (YYYY-MM-DD) of the most recent review of this entity's documentation. |
| `reviewedBy` | string |  | Who did the review — a team, role, or person (ex: 'jane.doe'). Unlike `owner`, naming a person here is fine — it's a record of what happened, not an ongoing responsibility. |
| `note` | [plainNote](common-dated-note.md#plainnote) |  | Plain-text note on the review outcome (ex: 'Verified against v3.1; prop table still accurate', 'Guidelines section needs a rewrite — tracked in DS-412'). MUST NOT contain markup. |
| `reviewedAgainst` | string |  | The version the doc was checked against in this review (ex: '@acme/ui@3.1.0'). Lets tools spot drift — if the code has moved past this version, the doc MAY be stale even if recently reviewed. Lives inside the review record, so it can't exist without one. |

**References:** [isoDate](common-dated-note.md#isodate), [plainNote](common-dated-note.md#plainnote)

## Full schema JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://designsystemdocspec.org/v0.15.2/metadata/governance.schema.json",
  "title": "Governance metadata field",
  "description": "Who's accountable for this entity's docs, and when someone last confirmed they're accurate. Answers 'who do I ask when the doc contradicts the code,' and lets tools flag docs nobody has checked in a while. Different from `lastUpdated`: that records when the doc changed; this records when someone confirmed it's still true. A doc untouched for a year but reviewed last month is healthy.",
  "$defs": {
    "owner": {
      "description": "Who's accountable for this entity's docs. A bare string names the owner — the common case. Use the object form to add contact info. Owners SHOULD be teams, roles, or group aliases ('Design Systems', '@acme/design-system'), not individuals — a named person goes stale the moment they leave, which is exactly what this field is meant to survive. Tools SHOULD show the owner wherever a reader might need to flag a problem.",
      "oneOf": [
        {
          "type": "string",
          "description": "Name or alias of the owning team, role, or group (ex: 'Design Systems', '@acme/design-system').",
          "minLength": 1
        },
        {
          "type": "object",
          "description": "The owner's name plus a way to reach them.",
          "required": [
            "name"
          ],
          "properties": {
            "name": {
              "type": "string",
              "description": "Name or alias of the owning team, role, or group (ex: 'Design Systems'). SHOULD name a team or role, not an individual.",
              "minLength": 1
            },
            "contact": {
              "type": "string",
              "description": "How to reach the owner — a URL, email, or channel (ex: 'design-system@acme.com', '#design-system'). Freeform; tools SHOULD link it when it parses as a URL or email.",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "lastReviewed": {
      "description": "When a human last confirmed this entity's docs are accurate. A bare date ('2026-06-12') covers the common case. Use the object form to record who reviewed it and what they found. A review doesn't have to change anything: confirming the doc is correct updates `lastReviewed` and leaves `lastUpdated` alone. Tools MAY treat an old or missing `lastReviewed` as a staleness signal; agents SHOULD prefer more recently reviewed docs when sources disagree.",
      "oneOf": [
        {
          "$ref": "../common/dated-note.schema.json#/$defs/isoDate",
          "description": "ISO 8601 date (YYYY-MM-DD) of the most recent review of this entity's documentation."
        },
        {
          "type": "object",
          "description": "The date plus who reviewed it, what version it was checked against, and an optional note on the outcome.",
          "required": [
            "date"
          ],
          "properties": {
            "date": {
              "$ref": "../common/dated-note.schema.json#/$defs/isoDate",
              "description": "ISO 8601 date (YYYY-MM-DD) of the most recent review of this entity's documentation."
            },
            "reviewedBy": {
              "type": "string",
              "description": "Who did the review — a team, role, or person (ex: 'jane.doe'). Unlike `owner`, naming a person here is fine — it's a record of what happened, not an ongoing responsibility.",
              "minLength": 1
            },
            "note": {
              "$ref": "../common/dated-note.schema.json#/$defs/plainNote",
              "description": "Plain-text note on the review outcome (ex: 'Verified against v3.1; prop table still accurate', 'Guidelines section needs a rewrite — tracked in DS-412'). MUST NOT contain markup."
            },
            "reviewedAgainst": {
              "type": "string",
              "description": "The version the doc was checked against in this review (ex: '@acme/ui@3.1.0'). Lets tools spot drift — if the code has moved past this version, the doc MAY be stale even if recently reviewed. Lives inside the review record, so it can't exist without one.",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "governance": {
      "type": "object",
      "description": "Who's accountable for this entity's docs, and their review state. `owner` is required — without one, this field answers nothing it's meant to. `lastReviewed` is optional but SHOULD be set once you have a review process; its object form records who reviewed it and which version, so a tool can answer 'is this verified, against what, and who vouches for it.'",
      "required": [
        "owner"
      ],
      "properties": {
        "owner": {
          "$ref": "#/$defs/owner"
        },
        "lastReviewed": {
          "$ref": "#/$defs/lastReviewed"
        }
      },
      "additionalProperties": false
    }
  }
}
```
