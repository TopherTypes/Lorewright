# DATA_MODEL.md — Lorewright

Canonical data schemas for all Lorewright entities. All storage, import, and export must conform to these schemas.

When a schema changes in a breaking way, increment the MAJOR version in `CHANGELOG.md` and document the migration path.

---

## Schema Conventions

- All entities have a `meta` block with shared fields
- IDs are UUID v4 strings generated client-side
- Timestamps are ISO 8601 strings
- Optional fields are marked with `?`
- Derived/calculated fields are marked with `[calculated]` — they are never stored, always computed at runtime
- All text fields are plain strings unless otherwise noted

---

## Meta Block (shared by all entities)

```json
{
  "id": "uuid-v4",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "tags": ["string"],
  "notes": "string?"
}
```

---

## Creature

A combatant stat block, fully PF1e-compliant.

```json
{
  "meta": { ...metaBlock },
  "name": "string",
  "cr": "number | string",          // e.g. 0.5, 1, 12, or "1/2"
  "xp": "number",
  "alignment": "string",            // e.g. "Neutral Evil"
  "size": "string",                 // Fine / Diminutive / Tiny / Small / Medium / Large / Huge / Gargantuan / Colossal
  "type": "string",                 // e.g. "Humanoid (human)"
  "initiative": {
    "modifier": "number",
    "miscModifier": "number?"
  },
  "senses": ["string"],             // e.g. ["darkvision 60ft", "low-light vision"]
  "aura": "string?",

  "defence": {
    "ac": {
      "total": "number [calculated]",
      "touch": "number [calculated]",
      "flatFooted": "number [calculated]",
      "armour": "number",
      "shield": "number",
      "dex": "number [calculated]",
      "size": "number",
      "natural": "number",
      "deflection": "number",
      "misc": "number"
    },
    "hp": {
      "total": "number",
      "hd": "string",               // e.g. "6d8+12"
      "dr": "string?",              // e.g. "5/magic"
      "regeneration": "string?"
    },
    "saves": {
      "fort": {
        "base": "number",
        "total": "number [calculated]"
      },
      "ref": {
        "base": "number",
        "total": "number [calculated]"
      },
      "will": {
        "base": "number",
        "total": "number [calculated]"
      },
      "miscModifier": "number?"
    },
    "immunities": ["string"],
    "resistances": ["string"],
    "weaknesses": ["string"],
    "sr": "number?"
  },

  "offence": {
    "speed": {
      "land": "number",
      "fly": "number?",
      "flyManeuverability": "string?",
      "swim": "number?",
      "climb": "number?",
      "burrow": "number?"
    },
    "melee": ["string"],            // e.g. ["longsword +8 (1d8+4/19-20)"]
    "ranged": ["string"],
    "space": "string?",             // e.g. "10 ft."
    "reach": "string?",
    "specialAttacks": ["string"],
    "spellsKnown": "string?",
    "spellsPrepared": "string?",
    "spellLikeAbilities": "string?"
  },

  "statistics": {
    "str": "number",
    "dex": "number",
    "con": "number",
    "int": "number",
    "wis": "number",
    "cha": "number",
    "strMod": "number [calculated]",
    "dexMod": "number [calculated]",
    "conMod": "number [calculated]",
    "intMod": "number [calculated]",
    "wisMod": "number [calculated]",
    "chaMod": "number [calculated]",
    "bab": "number",
    "cmb": "number [calculated]",
    "cmd": "number [calculated]",
    "cmbMisc": "number?",
    "cmdMisc": "number?",
    "feats": ["string"],
    "skills": [
      {
        "name": "string",
        "ranks": "number",
        "total": "number [calculated]"
      }
    ],
    "languages": ["string"],
    "specialQualities": ["string"]
  },

  "ecology": {
    "environment": "string?",
    "organisation": "string?",
    "treasure": "string?"
  },

  "specialAbilities": [
    {
      "name": "string",
      "type": "string",             // Ex / Su / Sp
      "description": "string"
    }
  ],

  "description": "string?",
  "source": "string?"               // e.g. "Homebrew", "Adventure Path Name"
}
```

---

## NPC

A named character in the world. May have a lite stat profile or just narrative fields.

```json
{
  "meta": { ...metaBlock },
  "name": "string",
  "role": "string",                 // e.g. "Innkeeper", "Crime Lord", "Ally"
  "alignment": "string?",
  "race": "string?",
  "class": "string?",
  "level": "number?",
  "affiliation": ["string"],        // faction IDs or names
  "relationships": [
    {
      "targetId": "uuid",           // ID of another NPC or faction
      "targetType": "npc | faction",
      "relationship": "string"      // e.g. "rival", "employer", "sibling"
    }
  ],
  "motivation": "string?",
  "secret": "string?",
  "appearance": "string?",
  "statProfile": {                  // optional lite stat block
    "cr": "number?",
    "hp": "number?",
    "ac": "number?",
    "saves": {
      "fort": "number?",
      "ref": "number?",
      "will": "number?"
    },
    "keyAttack": "string?"          // e.g. "+7 shortsword (1d6+3)"
  },
  "description": "string?"
}
```

---

## Magic Item

```json
{
  "meta": { ...metaBlock },
  "name": "string",
  "slot": "string",                 // None / Belt / Body / Chest / Eyes / Feet / Hands / Head / Headband / Neck / Ring / Shield / Shoulders / Wrist / Weapon / Armour
  "aura": "string",                 // e.g. "Moderate Transmutation"
  "cl": "number",                   // Caster level
  "weight": "string?",              // e.g. "1 lb."
  "price": "string?",               // e.g. "4,000 gp"
  "type": "string",                 // Wondrous Item / Ring / Rod / Staff / Weapon / Armour / Potion / Scroll / Wand
  "effects": "string",
  "requirements": "string?",        // Craft feats and spells required
  "description": "string?"
}
```

---

## Location

```json
{
  "meta": { ...metaBlock },
  "name": "string",
  "type": "string",                 // Region / Settlement / Dungeon / Wilderness / Building / Other
  "region": "string?",              // Parent location name or ID
  "connectedLocations": ["uuid"],
  "notableFeatures": ["string"],
  "inhabitants": ["uuid"],          // NPC IDs
  "factions": ["uuid"],             // Faction IDs present here
  "description": "string?"
}
```

---

## Faction

```json
{
  "meta": { ...metaBlock },
  "name": "string",
  "alignment": "string?",
  "goals": "string",
  "methods": "string?",
  "keyMembers": ["uuid"],           // NPC IDs
  "allies": ["uuid"],               // Other faction IDs
  "enemies": ["uuid"],
  "partyRelationship": "string?",   // e.g. "Hostile", "Neutral", "Allied"
  "description": "string?"
}
```

---

## Session Log

```json
{
  "meta": { ...metaBlock },
  "sessionNumber": "number",
  "date": "ISO 8601 date string",
  "title": "string?",
  "summary": "string",
  "keyEvents": ["string"],
  "npcsEncountered": ["uuid"],
  "locationsVisited": ["uuid"],
  "xpAwarded": "number?",
  "lootDistributed": ["string"],
  "consequences": ["string"],       // World changes triggered this session
  "nextSessionHooks": ["string"]
}
```

---

## Timeline Event

```json
{
  "meta": { ...metaBlock },
  "title": "string",
  "date": "string",                 // In-world date (freeform string, e.g. "15 Rova, 4713 AR")
  "realDate": "ISO 8601?",          // Real-world session date if applicable
  "sessionId": "uuid?",
  "type": "string",                 // World Event / Session / Consequence / Rumour
  "relatedEntities": [
    {
      "id": "uuid",
      "type": "creature | npc | location | faction | item"
    }
  ],
  "description": "string"
}
```

---

## Storage Format

All entities are stored in IndexedDB under named object stores matching their entity type (e.g. `creatures`, `npcs`, `items`).

Full export produces a single JSON object:

```json
{
  "lorew right_version": "semver string",
  "exportedAt": "ISO 8601",
  "creatures": [...],
  "npcs": [...],
  "items": [...],
  "locations": [...],
  "factions": [...],
  "sessionLogs": [...],
  "timelineEvents": [...]
}
```

Imports must validate the `lorewright_version` field and warn the user if the schema version differs from the current app version.
