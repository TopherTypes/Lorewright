// Creature entity module.
// Owns the creature data structure, empty-object factory, and derived-field calculation.
// No DOM, no storage — pure data logic only.

import { generateUUID } from '../utils/uuid.js';
import {
  abilityModifier,
  calculateAC,
  calculateTouchAC,
  calculateFlatFootedAC,
  calculateFortSave,
  calculateRefSave,
  calculateWillSave,
  calculateCMB,
  calculateCMD,
  SIZE_AC_MODIFIERS,
  SKILL_ABILITY_MAP,
  STANDARD_SKILLS,
  xpFromCR,
  averageHPFromHD,
} from '../utils/pf1e-modifiers.js';

/**
 * Returns a new creature object with all fields at their default/empty values.
 * All required structural fields are present; IDs and timestamps are generated here.
 * @returns {object} A creature conforming to the DATA_MODEL.md schema
 */
export function createEmptyCreature() {
  const now = new Date().toISOString();
  return {
    meta: {
      id:        generateUUID(),
      createdAt: now,
      updatedAt: now,
      tags:      [],
      notes:     '',
    },
    name:      '',
    cr:        1,
    xp:        0,
    alignment: 'True Neutral',
    size:      'Medium',
    type:      '',
    initiative: {
      modifier:     0,
      miscModifier: 0,
    },
    senses: [],
    aura:   '',
    defence: {
      ac: {
        armour:     0,
        shield:     0,
        size:       0,
        natural:    0,
        deflection: 0,
        misc:       0,
      },
      hp: {
        total:        0,
        hd:           '',
        dr:           '',
        regeneration: '',
      },
      saves: {
        fort: { base: 0 },
        ref:  { base: 0 },
        will: { base: 0 },
        miscModifier: 0,
      },
      immunities:  [],
      resistances: [],
      weaknesses:  [],
      sr:          0,
    },
    offence: {
      speed: {
        land:               30,
        fly:                0,
        flyManeuverability: '',
        swim:               0,
        climb:              0,
        burrow:             0,
      },
      melee:             [],
      ranged:            [],
      space:             '',
      reach:             '',
      specialAttacks:    [],
      spellsKnown:       '',
      spellsPrepared:    '',
      spellLikeAbilities:'',
    },
    statistics: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
      bab:     0,
      cmbMisc: 0,
      cmdMisc: 0,
      feats:           [],
      // Pre-populate with all standard PF1e skills at 0 ranks
      skills:          STANDARD_SKILLS.map(name => ({ name, ranks: 0 })),
      languages:       [],
      specialQualities:[],
    },
    ecology: {
      environment:  '',
      organisation: '',
      treasure:     '',
    },
    specialAbilities: [],
    description: '',
    source:      '',
  };
}

/**
 * Takes a stored creature (no calculated fields) and returns a new object
 * with all [calculated] fields populated.
 * Uses structuredClone to avoid mutating the stored object.
 * Call this before rendering a creature in the form or print view.
 * @param {object} creature A stored creature from the database
 * @returns {object} A fully derived creature with all computed fields
 */
export function deriveCreature(creature) {
  // Clone so we never mutate the in-memory stored object
  const c = structuredClone(creature);
  const stats = c.statistics;
  const def   = c.defence;

  // ── Ability score modifiers ──────────────────────────────
  stats.strMod = abilityModifier(stats.str ?? 10);
  stats.dexMod = abilityModifier(stats.dex ?? 10);
  stats.conMod = abilityModifier(stats.con ?? 10);
  stats.intMod = abilityModifier(stats.int ?? 10);
  stats.wisMod = abilityModifier(stats.wis ?? 10);
  stats.chaMod = abilityModifier(stats.cha ?? 10);

  // ── Initiative total ──────────────────────────────────────
  // total = DEX modifier + any misc bonus (e.g. Improved Initiative feat)
  c.initiative.total = stats.dexMod + (c.initiative.miscModifier ?? 0);

  // ── Suggested XP from CR ──────────────────────────────────
  c.suggestedXP = xpFromCR(c.cr);

  // ── Armour Class ─────────────────────────────────────────
  const ac = def.ac;

  // Size AC modifier is always derived from creature size — never stored manually
  ac.size = SIZE_AC_MODIFIERS[c.size] ?? 0;
  ac.dex        = stats.dexMod;
  ac.total      = calculateAC(ac, stats.dexMod);
  ac.touch      = calculateTouchAC(ac, stats.dexMod);
  ac.flatFooted = calculateFlatFootedAC(ac);

  // ── Saving throws ─────────────────────────────────────────
  const saves     = def.saves;
  const saveMisc  = saves.miscModifier ?? 0;
  saves.fort.total = calculateFortSave(saves.fort.base ?? 0, stats.conMod, saveMisc);
  saves.ref.total  = calculateRefSave (saves.ref.base  ?? 0, stats.dexMod, saveMisc);
  saves.will.total = calculateWillSave(saves.will.base ?? 0, stats.wisMod, saveMisc);

  // ── HP average from hit dice expression ───────────────────
  def.hp.avgFromHD = averageHPFromHD(def.hp.hd ?? '');

  // ── CMB / CMD ─────────────────────────────────────────────
  stats.cmb = calculateCMB(stats.bab ?? 0, stats.strMod, c.size, stats.cmbMisc ?? 0);
  stats.cmd = calculateCMD(stats.bab ?? 0, stats.strMod, stats.dexMod, c.size, stats.cmdMisc ?? 0);

  // ── Skill totals ──────────────────────────────────────────
  stats.skills = (stats.skills ?? []).map(skill => {
    const abilityKey = SKILL_ABILITY_MAP[skill.name];
    // abilityKey is e.g. 'dex', so we look up stats.dexMod
    const abilityMod = abilityKey ? (stats[`${abilityKey}Mod`] ?? 0) : 0;
    return { ...skill, total: (skill.ranks ?? 0) + abilityMod };
  });

  return c;
}
