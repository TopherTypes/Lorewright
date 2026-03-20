// Spell entity module.
// Owns the spell data structure and empty-object factory.
// No DOM, no storage — pure data logic only.

import { generateUUID } from '../utils/uuid.js';

// ── Spell constants ────────────────────────────────────

export const SPELL_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
  'Universal',
];

export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const SAVING_THROW_TYPES = [
  'None',
  'Fortitude',
  'Reflex',
  'Will',
];

export const DAMAGE_TYPES = [
  'Acid',
  'Cold',
  'Electricity',
  'Fire',
  'Force',
  'Negative Energy',
  'Positive Energy',
  'Sonic',
  'Bludgeoning',
  'Piercing',
  'Slashing',
  'Other',
];

/**
 * Returns a new spell object with all fields at their default/empty values.
 * All required structural fields are present; IDs and timestamps are generated here.
 * @returns {object} A spell object conforming to the spell schema
 */
export function createEmptySpell() {
  const now = new Date().toISOString();
  return {
    meta: {
      id:        generateUUID(),
      createdAt: now,
      updatedAt: now,
      tags:      [],
      notes:     '',
    },

    // Basic info
    name:            '',
    level:           0,       // 0 (cantrip) through 9
    school:          'Evocation',

    // Mechanics
    castingTime:     '1 standard action',
    range:           'Personal',
    duration:        'Instantaneous',
    savingThrow:     'None',  // None, Fortitude, Reflex, Will
    spellResistance: false,

    // Components
    components: {
      verbal:     false,
      somatic:    false,
      material:   false,
      materialDescription: '',
      focus:      false,
      divineFocus: false,
    },

    // Effects and damage
    description:     '',      // Full spell text/mechanics
    damageType:      '',      // Acid, Cold, Fire, etc. (optional)
    damageRolls:     '',      // Flexible notation: "1d4" or "2d6+2 per 2 levels", etc.
  };
}
