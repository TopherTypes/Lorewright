# Changelog

All notable changes to Lorewright will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project documentation: README, AGENTS, PRD, DATA_MODEL, ROADMAP, CHANGELOG
- Vite project scaffold with ES module structure and `base: './'` for GitHub Pages deployment
- `.gitignore` excluding `node_modules/` and `dist/`
- IndexedDB storage abstraction layer (`src/storage/db.js`) with generic CRUD: `getAll`, `getById`, `put`, `remove`, `clearStore`, `putMany`
- Creatures storage facade (`src/storage/creatures.js`) with named semantic functions
- Settings storage facade (`src/storage/settings.js`) for single campaign settings record
- PF1e rules utility module (`src/utils/pf1e-modifiers.js`): `abilityModifier`, `calculateAC/TouchAC/FlatFootedAC`, `calculateFortSave/RefSave/WillSave`, `calculateCMB/CMD`, size modifier tables (`SIZE_AC_MODIFIERS`, `SIZE_CMB_MODIFIERS`), and full `SKILL_ABILITY_MAP` for all 35 standard PF1e skills
- UUID generation utility using `crypto.randomUUID()` (`src/utils/uuid.js`)
- Display formatters (`src/utils/formatters.js`): `formatModifier`, `formatCR` (fraction support), `formatSpeed`, `formatDateForFilename`, `formatXP`
- Schema validators (`src/utils/validators.js`): `validateCreature` and `validateExportFile`
- JSON export/import utility (`src/utils/export-import.js`): full campaign data download, file validation, and confirmed import with version checking
- Creature entity module (`src/entities/creature.js`): `createEmptyCreature` factory (all DATA_MODEL.md fields, pre-populated with standard skills) and `deriveCreature` function computing all `[calculated]` fields (ability mods, AC totals, save totals, CMB, CMD, skill totals)
- Hash-based client-side router (`src/ui/router.js`) with `:param` segment support
- App shell (`src/ui/shell.js`) with sticky nav bar and active link highlighting
- Application entry point (`src/main.js`) wiring shell, routes, and router
- Creature list view (`src/ui/creature-list.js`) with sortable table, print links, and two-click delete confirmation
- Full creature stat block edit form across 8 collapsible sections: Identity, Initiative, Defence, Offence, Statistics, Ecology, Special Abilities, Description (`src/ui/creature-form.js`, `src/ui/creature-form-sections.js`)
- Live recalculation of all derived PF1e fields (AC, saves, CMB, CMD, ability mods, skill totals) on every input event
- Auto-save with 1-second debounce and "Unsaved / Saved" indicator
- Skills section with all 35 standard PF1e skills pre-populated, zero-rank hide/show toggle, and custom skill support
- URL update via `history.replaceState` when a new creature is first saved
- Stat card print artifact (`src/print/creature-card.js`): condensed 63×88mm poker card with prioritised content (AC, HP, saves, ability scores, BAB/CMB/CMD, Perception, top skills, speed, primary attacks)
- Print preview route (`#/creature/:id/print`) with 2.5× screen scale for inspection
- Print stylesheet (`styles/print/creature-card.css`) with `@page { size: 63mm 88mm; margin: 2mm }` and B&W safe layout
- Settings page (`src/ui/settings.js`): campaign name, JSON export, JSON import with validation, and double-confirm data clear
- Dark UI design system with CSS custom properties (`styles/ui/tokens.css`, `layout.css`, `components.css`, `main.css`)
