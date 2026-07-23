# Map a Web Component contract into DSDS

Use the component source as evidence and map each public fact to the narrowest
DSDS field that represents it.

| Web Component fact | DSDS destination |
|---|---|
| Tag name | Entity `identifier` and Site Kit extension `tagName` |
| Purpose | Entity `description` |
| Source module | Metadata source link and Site Kit extension `module` |
| Registry entrypoint | Import package and Site Kit extension `entrypoint` |
| Plain-HTML use | `imports[].example` |
| Attributes and properties | API property items |
| Custom events | API event items |
| Default and named slots | API slot items |
| CSS parts | API CSS-part items |
| CSS custom properties | API CSS-custom-property items |
| Appropriate scenarios | Recommended `use-cases` |
| Usage constraints | Guidelines with rationale or evidence |
| Supported accessibility behavior | Accessibility guidance |
| Composition between elements | Entity relationships |

## Mapping rules

1. Use the actual custom-element tag as the stable entity identifier.
2. Document only facts established by source, tests, or rendered behavior.
3. Keep a plain-HTML example small enough to verify by inspection.
4. Use guidance for human intent; do not restate every API field as prose.
5. Mark accessibility limits or unknowns honestly.
6. Use the Site Kit extension only for implementation metadata that has no
   core DSDS field. Do not duplicate core API data there.
7. Keep relationships directional: a container `composes` its child; a child
   may be `part-of` its container.

## DSDS and Custom Elements Manifest boundary

A Custom Elements Manifest may later generate objective API facts such as
attributes, events, slots, and CSS parts. DSDS remains authoritative for use
cases, guidance, rationale, cross-component relationships, accessibility
intent, and provenance. Until that pipeline exists, maintain both the source
contract and DSDS entity in the same reviewed change.
