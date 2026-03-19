# Lorewright

> A GM's production studio for Pathfinder 1e tabletop campaigns.

Lorewright is a browser-based campaign management and print production tool designed for Game Masters who want to run rich, organised, in-person Pathfinder 1e sessions. It serves as the single source of truth for your campaign world — creatures, NPCs, items, locations, factions, timelines — and produces physical artefacts (stat cards, item cards, handouts, reference sheets) ready for the table.

---

## Philosophy

- **Prep in the app. Play on paper.** Lorewright is a production environment, not a VTT. Everything it produces is designed to be printed and used at the table.
- **User-owned data.** No default content is included. Your campaign is yours — entered, shaped, and exported by you.
- **Pathfinder-aware, not Pathfinder-dependent.** The app understands the grammar of PF1e (ability scores, modifiers, saves, CMB/CMD, etc.) but does not include any licensed or OGL content by default.
- **Local-first.** All data lives in your browser's local storage, with full JSON export/import for backup and portability.

---

## Features

- **Bestiary** — Create and manage creature stat blocks with automatic modifier calculation
- **NPC Registry** — Track named characters, their relationships, motivations, and stat profiles
- **Item Vault** — Magic items, mundane equipment, and treasure with printable cards
- **Location Atlas** — Regions, settlements, dungeons, and points of interest
- **Faction Tracker** — Groups, allegiances, and relationship webs
- **Campaign Timeline** — Chronicle events, session logs, and world consequences
- **Print Engine** — Export any entity as a print-ready card, index card, or reference sheet

---

## Tech Stack

- Vanilla JavaScript (ES6+) or lightweight framework (React/Vue — see PRD)
- CSS with `@media print` for print layout
- IndexedDB / localStorage for persistence
- JSON import/export for data portability
- Deployable as a static site via GitHub Pages

---

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/lorewright.git
cd lorewright
# Open index.html in a browser, or serve locally:
npx serve .
```

For GitHub Pages deployment, push to the `gh-pages` branch or configure Pages to serve from `main/docs`.

---

## Project Status

See [ROADMAP.md](ROADMAP.md) for planned features and current phase.  
See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Licence

MIT
