// Magic item entity module.
// Owns the item data structure, empty-object factory, and passphrase generation.
// No DOM, no storage — pure data logic only.

import { generateUUID } from '../utils/uuid.js';

// ── Item type constants ────────────────────────────────────

export const ITEM_TYPES = [
  'Potion',
  'Wand',
  'Scroll',
  'Wondrous Item',
  'Ring',
  'Rod',
  'Staff',
  'Weapon',
  'Armour',
  'Other',
];

export const MAGIC_SCHOOLS = [
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

/**
 * Returns the Pathfinder 1e aura strength label for a given caster level.
 * @param {number} cl
 * @returns {string}
 */
export function computeAuraStrength(cl) {
  if (!cl || cl <= 0) return '';
  if (cl <= 5)  return 'Faint';
  if (cl <= 11) return 'Moderate';
  if (cl <= 17) return 'Strong';
  return 'Overwhelming';
}

export const ITEM_SLOTS = [
  'None',
  'Belt',
  'Body',
  'Chest',
  'Eyes',
  'Feet',
  'Hands',
  'Head',
  'Headband',
  'Neck',
  'Ring',
  'Shield',
  'Shoulders',
  'Wrist',
  'Weapon',
  'Armour',
];

// ── Passphrase word lists ──────────────────────────────────

const ADJECTIVES = [
  'amber', 'ashen', 'azure', 'bitter', 'bronze', 'carved', 'cinder',
  'clouded', 'cobalt', 'coiled', 'copper', 'crimson', 'cracked', 'dark',
  'dim', 'dusk', 'dusty', 'ember', 'faded', 'faint', 'fell', 'frozen',
  'gilded', 'glass', 'grim', 'hollow', 'hoary', 'hushed', 'iron',
  'jade', 'leaden', 'lunar', 'mossy', 'muted', 'oak', 'obsidian',
  'pale', 'pewter', 'runed', 'rust', 'salt', 'scarlet', 'sealed',
  'shadow', 'silver', 'slate', 'smoke', 'star', 'stone', 'storm',
];

const NOUNS = [
  'anvil', 'arrow', 'ash', 'bell', 'bone', 'brand', 'candle',
  'chain', 'chalice', 'cipher', 'clasp', 'claw', 'coin', 'crown',
  'dagger', 'dawn', 'door', 'dust', 'edge', 'eye', 'fang', 'flame',
  'forge', 'gate', 'gem', 'glyph', 'hand', 'helm', 'hook', 'horn',
  'key', 'knot', 'lantern', 'leaf', 'lock', 'mantle', 'mark', 'mist',
  'moon', 'needle', 'omen', 'path', 'ring', 'root', 'rune', 'seal',
  'shard', 'sigil', 'spine', 'star', 'thorn', 'tide', 'veil', 'ward',
];

/**
 * Generates a memorable two-word passphrase for matching item cards at the table.
 * e.g. "oak-ember", "frost-veil", "ember-thorn"
 * @returns {string}
 */
export function generatePassphrase() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}`;
}

/**
 * Returns a new magic item object with all fields at their default/empty values.
 * All required structural fields are present; ID and timestamps are generated here.
 * @returns {object} An item conforming to the item schema
 */
export function createEmptyItem() {
  const now = new Date().toISOString();
  return {
    meta: {
      id:        generateUUID(),
      createdAt: now,
      updatedAt: now,
      tags:      [],
      notes:     '',
    },

    // Core (all types)
    name:         '',
    type:         'Potion',
    slot:         'None',
    aura:         '',         // auto-computed from cl + magicSchool; stored for print/legacy
    magicSchool:  '',         // Abjuration … Universal
    cl:           0,
    weight:       '',
    price:        '',
    effects:      '',
    requirements: '',
    description:  '',

    // Type-specific fields (only relevant ones used per type)
    spell:            '',       // Potion, Wand, Scroll
    spellLevel:       0,        // Potion, Wand, Scroll
    charges:          0,        // Wand (50 max), Staff
    scrollType:       'Arcane', // Scroll: Arcane | Divine
    spellList:        [],       // Staff: [{ spell, level }]
    enhBonus:         0,        // Weapon, Armour
    weaponType:       '',       // Weapon
    armourType:       '',       // Armour
    specialAbilities: '',       // Weapon, Armour

    // Weapon-specific
    weaponCategory:  'One-Handed', // Light / One-Handed / Two-Handed / Ranged
    damageDice:      '',           // e.g. "1d8"
    damageType:      '',           // e.g. "Slashing, Piercing"
    critRange:       '20',         // e.g. "19-20"
    critMultiplier:  2,            // 2, 3, or 4

    // Armour-specific
    armorCategory:       'Light', // Light / Medium / Heavy / Shield
    acBonus:             0,       // base AC bonus (before enhancement)
    maxDexBonus:         '',      // number as string, or '' for no limit
    arcaneSpellFailure:  0,       // percent, e.g. 15 for 15%
    armorCheckPenalty:   0,       // usually negative, e.g. -6

    // Identification
    identified:              true,
    passphrase:              '',   // auto-generated two-word, e.g. "oak-ember"
    unidentifiedName:        '',   // blank = auto "Unidentified [Type]"
    unidentifiedDescription: '',   // DM-authored flavour text

    // Card display
    imageUrl:                '',   // optional external image URL for cards
  };
}
