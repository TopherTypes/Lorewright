# AGENTS.md

Instructions for AI agents (Claude Code and similar) working on the Lorewright codebase.

---

## Project Summary

Lorewright is a browser-based, static-site GM toolkit for Pathfinder 1e. It manages campaign data and produces print-ready physical artefacts. It runs entirely client-side with no backend. See README.md and PRD.md for full context.

---

## Core Responsibilities

Before beginning any task, an agent must:

1. Read `README.md` for project overview and philosophy
2. Read `PRD.md` for feature scope and requirements
3. Read `DATA_MODEL.md` for entity schemas and relationships
4. Check `CHANGELOG.md` to understand current version and recent changes

---

## Changelog Requirement (MANDATORY)

**Every code change that modifies functionality MUST be reflected in `CHANGELOG.md`.**

- Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format exactly
- Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
  - PATCH: bug fixes, minor copy changes, style tweaks
  - MINOR: new features, new print artefacts, new entity types (backwards compatible)
  - MAJOR: breaking changes to data model, storage format, or core architecture
- Add entries under `[Unreleased]` during development; version is assigned on release
- Do not delete or rewrite existing changelog entries
- Categories to use: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

---

## Code Style

### General
- Write code for **human readability first**
- Every function, class, and module must have a clear comment explaining its purpose
- Inline comments should explain *why*, not just *what*
- Prefer explicit variable names over brevity (`creatureArmourClass` over `ac`)

### Modularity
- Each entity type (Creature, NPC, Item, etc.) must live in its own module file
- The print engine must be entirely separate from data management logic
- Shared utilities (modifier calculation, dice notation, etc.) live in `/src/utils/`
- No file should exceed ~300 lines — split into sub-modules if needed

### File Structure
```
/src
  /entities        # One file per entity type (creature.js, npc.js, etc.)
  /print           # Print engine and artefact templates
  /utils           # Shared logic (modifiers, validators, formatters)
  /ui              # UI components and views
  /storage         # IndexedDB / localStorage abstraction layer
/styles
  /print           # @media print stylesheets, one per artefact type
  /ui              # Application UI styles
/docs              # Any generated or supplementary documentation
index.html
```

### JavaScript
- ES6+ throughout
- Use `const` by default, `let` when mutation is required, never `var`
- Async operations use `async/await`, not raw Promise chains
- All data mutations go through the storage layer — no direct localStorage calls in entity or UI code

### CSS
- Use CSS custom properties (variables) for all colours, spacing, and typography
- Print stylesheets must be in `/styles/print/` and named after their artefact type
- Never mix print and screen styles in the same file

---

## Pathfinder 1e Rules Awareness

The app understands PF1e mechanics. When implementing stat block fields:

- Ability score modifiers = `Math.floor((score - 10) / 2)`
- All saves (Fort, Ref, Will) are derived from base save + relevant ability modifier + misc
- CMB = BAB + STR modifier + special size modifier
- CMD = 10 + BAB + STR modifier + DEX modifier + special size modifier + misc
- AC = 10 + armour + shield + DEX modifier + size + natural + deflection + misc
- Always surface the *modifier* alongside the raw score in the UI

Do not hardcode rules that may vary — use utility functions so rules can be adjusted.

---

## Data Integrity

- Never silently discard user data
- All imports must validate against the schema in `DATA_MODEL.md` before committing
- Export format must always be valid JSON
- If a breaking schema change is made, increment MAJOR version and provide a migration note in the changelog

---

## Print Engine Rules

- Every print artefact must be usable with the browser's native print dialogue
- Cards must fit standard card sizes (poker card: 63×88mm, index card: 76×127mm)
- Use `@page` CSS rules to control margins and page size
- Print output must be legible in black and white — do not rely on colour alone to convey meaning
- Each artefact type has its own print stylesheet — do not share print styles between artefact types

---

## What Agents Must NOT Do

- Do not add default Pathfinder content (monsters, spells, items) — the app is user-data only
- Do not introduce a backend, server, or external API dependency
- Do not use localStorage directly — always go through the storage abstraction layer
- Do not modify `CHANGELOG.md` entries that have already been versioned and released
- Do not refactor working code speculatively — only refactor when directly relevant to the current task
- Do not make changes outside the scope of the current task without flagging them first

---

## When in Doubt

If a task is ambiguous, incomplete, or risks a breaking change:
1. State the ambiguity clearly
2. Propose the safest interpretation
3. Ask for clarification before proceeding
