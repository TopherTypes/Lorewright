# PRD — Lorewright

**Version:** 0.1 (Pre-release)  
**Status:** Active development  
**Owner:** Chris Ramshaw

---

## Problem Statement

Game Masters running in-person Pathfinder 1e campaigns lack a dedicated tool that:
- Manages all campaign data in one place with PF1e rules awareness
- Produces print-ready physical artefacts for use at the table
- Works entirely in the browser without requiring a backend or subscription

Most existing tools are either VTT-dependent (Foundry, Roll20), too generic (Notion, Obsidian), or too narrow (combat trackers only). Lorewright fills the gap between "a folder of PDFs" and "a full VTT."

---

## Target User

A single primary user: a Game Master running a Pathfinder 1e campaign in person, who:
- Wants to prep digitally and play from paper
- Maintains a detailed, evolving campaign world
- Values organisation, modularity, and low friction
- Is comfortable with browser-based tools

---

## Core Principles

1. **Prep digitally, play on paper** — the app produces physical artefacts; it is not a VTT
2. **User-entered data only** — no bundled rulebook content; the GM populates everything
3. **PF1e-aware** — the app understands the rules grammar and automates calculations
4. **Local-first** — data lives in the browser; JSON export/import for portability
5. **Print-first design** — every artefact must be usable straight from the browser print dialogue

---

## Technical Constraints

- Static site — deployable on GitHub Pages with no server
- Client-side only — no external APIs, no authentication, no backend
- Browser storage — IndexedDB for structured data, with JSON export/import
- Print via CSS `@media print` — no third-party PDF libraries unless clearly justified
- Framework: lightweight preferred (vanilla JS or minimal React/Vue) — avoid heavy dependencies

---

## Feature Scope by Phase

### Phase 1 — Foundation (MVP)
*Goal: A working data loop. Enter a creature, print a stat card.*

- [ ] Project scaffold and file structure
- [ ] Storage abstraction layer (IndexedDB wrapper)
- [ ] Creature entity: full PF1e stat block with auto-calculated modifiers
- [ ] Creature list view and detail/edit view
- [ ] Stat card print artefact (poker card format, B&W safe)
- [ ] JSON export and import for full data backup
- [ ] Basic responsive UI shell

### Phase 2 — Entity Expansion
*Goal: Populate the full campaign world.*

- [ ] NPC entity (name, role, stat profile, motivation, relationships, notes)
- [ ] Magic Item entity (name, slot, aura, CL, weight, description, effects)
- [ ] Location entity (name, type, region, description, notable features, connected locations)
- [ ] Faction entity (name, alignment, goals, key members, relationship to party)
- [ ] Print artefacts: NPC index card, item card, location reference sheet

### Phase 3 — Narrative Layer
*Goal: The campaign as a living document.*

- [ ] Session log (date, summary, key events, XP awarded, loot distributed)
- [ ] Campaign timeline (chronological event list, filterable by entity)
- [ ] Relationship map (visual web of NPC/faction connections)
- [ ] Consequence tracker (world changes triggered by player actions)
- [ ] Print artefacts: session summary sheet, timeline printout

### Phase 4 — Print Engine Polish
*Goal: Artefacts good enough to be proud of at the table.*

- [ ] Card layout options (compact, standard, detailed)
- [ ] Batch print (print all creatures in an encounter, all items in a hoard, etc.)
- [ ] Custom handout creator (freeform text/image layout for player-facing documents)
- [ ] Index card format option for all entity types
- [ ] Optional light/dark theme for screen use (print always B&W safe)

---

## Entity Overview

| Entity | Key Fields | Print Artefact |
|---|---|---|
| Creature | Full PF1e stat block | Poker card (stat card) |
| NPC | Profile, stats lite, relationships | Index card |
| Magic Item | Slot, aura, CL, effects | Poker card |
| Location | Type, region, description, connections | Reference sheet |
| Faction | Alignment, goals, members | Reference sheet |
| Session Log | Date, summary, XP, loot | Summary sheet |

Full field-level detail is in `DATA_MODEL.md`.

---

## Out of Scope

- Multiplayer or shared campaigns
- VTT functionality (maps, tokens, fog of war)
- Bundled Pathfinder content (monsters, spells, items from any published source)
- Dice rolling
- Character sheet management (this is a GM tool, not a player tool)
- Mobile-native app

---

## Success Criteria

- A GM can create a full encounter's worth of creatures and print stat cards in under 10 minutes
- All printed artefacts are legible and usable straight from the browser print dialogue
- Data survives a browser refresh and can be fully exported and re-imported without loss
- The app runs correctly on GitHub Pages with no server-side dependencies
