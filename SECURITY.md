# Security Policy

This repository holds two different things a report might concern —
handled differently:

## Reporting a vulnerability in this repo's own code

That's the validator (`scripts/validate.js`), the build/site-generation
scripts, or the site itself (`site/components/*.js`) — for example, a path-
traversal in the validator's file resolution, or an XSS in the rendered
site.

**Please don't open a public issue for this.** Use GitHub's private
reporting instead: [Report a vulnerability](https://github.com/somerandomdude/design-system-documentation-schema/security/advisories/new).
Include what you found, how to reproduce it, and its impact if you can.
This is a one-person, pre-1.0 project — there's no SLA, but reports are
read and a fix or mitigation is the priority the moment one lands.

## The spec's own trust model

If your concern is about how a DSDS *document* should be trusted — whether
`for: agent` directives, `href`/`checks` pointers, or `$extensions` content
from a third-party design system can be trusted or safely acted on by a
consuming tool — that's not a vulnerability in this repository, it's a
question the spec itself answers. See
[Security considerations](https://designsystemdocspec.org/security.html):
a DSDS document is data, not instruction, and the page states what that
means in practice for anyone building a consumer.

If you find a place where the schema, a script, or the documentation
contradicts that trust model — grants a document more authority than
"data, not instruction" implies, or a conforming-consumer rule reads as an
obedience mandate with no trust caveat — that **is** worth a report; use
the same private reporting link above.

## Supported versions

DSDS is pre-1.0. Only the latest published version receives fixes; there is
no back-patching of older `/v<n>/` schema releases (those are immutable
published artifacts by design — see
[Stability](https://designsystemdocspec.org/stability.html)). A schema or
validator fix ships as a new version, same as any other change.
