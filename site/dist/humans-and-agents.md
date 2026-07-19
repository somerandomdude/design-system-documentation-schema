# DSDS for humans and agents

# DSDS for humans and agents

A DSDS document has two readers: people and AI agents. The same file serves both. Most of what you write is for people. A small, optional part is just for agents.

This page explains the split, and when to use each.

## Two readers, one document

People read docs to learn a component: what it is, when to use it, how it behaves. Agents read docs to build with it correctly. They look for which rules are firm, what not to confuse it with, and how to check their own work.

Most documentation works for both. A clear usage rule helps a person and an agent alike. So you write it once, in the normal place, and both readers benefit.

## documentBlocks — the docs everyone reads

`documentBlocks` holds the main documentation. You write it for a person to read and act on: anatomy, API, variants, states, guidelines, accessibility, and the rest. Agents read it too. This is the default home for everything.

## agentDocumentBlocks — extra notes, for agents only

`agentDocumentBlocks` is an optional, separate space for notes meant only for agents. Tools never show it to people. It accepts the same block kinds as `documentBlocks`.

Use it for guidance that would be clutter in the human docs but helps an agent get the code right.

### What belongs here

Put a block here when a tool can act on it directly — no person needed to interpret it. For example:

- **Hard rules.** Do-this and never-do-that rules marked MUST or MUST NOT, so an agent treats them as firm limits.
- **Telling look-alikes apart.** Notes that keep an agent from mixing this up with a similar entity. For example: "use a link to navigate, not this button."
- **Limits backed by proof.** A rule backed by test evidence. For example: "agents broke the touch target 9 times out of 10 when they shrank the height — don't."
- **Checks an agent can run.** Pass-or-fail criteria the agent can test its own output against.

### What stays in documentBlocks

Anything a person needs to read and understand stays in `documentBlocks`. If a human reader would want it, it is not agent-only.

A quick test: would a person reading the docs need this? If yes, it goes in `documentBlocks`. If no, and only a tool or agent would act on it, it can go in `agentDocumentBlocks`.

## How the two work together

Agents read both arrays — the human docs first, then the agent-only notes. So `agentDocumentBlocks` adds to the human docs; it does not replace them.

Two rules keep the split clean:

- Do not move human-facing content into `agentDocumentBlocks`. People would never see it.
- Do not repeat the human docs there. Agent notes should extend the docs, never echo them.

## In short

- Write for people by default. That serves agents too.
- Use `agentDocumentBlocks` only for firm, ready-to-act notes a person would not need.
- Keep the two in sync: agent notes extend the human docs, and never contradict them.
