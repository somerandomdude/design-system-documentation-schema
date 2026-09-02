---
name: Bug report
about: Something in the schema, validator, or site doesn't work as documented
title: ""
labels: bug
assignees: ""
---

**What's wrong**
A clear description of the incorrect behavior.

**Where**
- [ ] Schema (`schema/**/*.schema.yaml`)
- [ ] Validator (`scripts/validate.js` / a `DSDS-XX` rule)
- [ ] Advisory lint (`scripts/lint-docs.js`)
- [ ] Site (a rendered page, `site/components/*.js`)
- [ ] Documentation (README, AGENTS.md, a site page's content)
- [ ] Something else:

**To reproduce**
A minimal `.dsds.yaml` snippet or command that shows the problem, if
applicable.

**Expected**
What you expected to happen instead, and why (a link to the relevant
schema description or conformance rule, if you have one).

**DSDS version**
The `schemaVersion` you're validating against, or the commit/tag if you're
working against `main`.
