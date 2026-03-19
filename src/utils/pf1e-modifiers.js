// Pathfinder 1e rules utility functions.
// All PF1e mechanical calculations live here as pure functions.
// No DOM, no storage — only rules logic.
// Keep formulas here (not in entity or UI code) so they can be corrected
// in one place if a rules interpretation changes.

// ── Ability scores ────────────────────────────────────────

/**
 * Converts an ability score to its modifier.
 * PF1e formula: floor((score - 10) / 2)
 * @param {number} score
 * @returns {number}
 */
export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

// ── Size modifier tables ──────────────────────────────────
// These two tables use opposite signs:
//   SIZE_AC_MODIFIERS  — larger creatures are easier to hit (negative for Large+)
//   SIZE_CMB_MODIFIERS — larger creatures have more leverage (positive for Large+)

/**
 * Size modifier applied to AC, touch AC, flat-footed AC, CMD, and Stealth.
 * Fine: +8, Diminutive: +4, Tiny: +2, Small: +1, Medium: 0,
 * Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8
 */
export const SIZE_AC_MODIFIERS = {
  Fine:        8,
  Diminutive:  4,
  Tiny:        2,
  Small:       1,
  Medium:      0,
  Large:      -1,
  Huge:       -2,
  Gargantuan: -4,
  Colossal:   -8,
};

/**
 * Size modifier applied to CMB and CMD attack rolls.
 * Opposite sign to SIZE_AC_MODIFIERS.
 * Fine: -8, ..., Medium: 0, Large: +1, Huge: +2, Gargantuan: +4, Colossal: +8
 */
export const SIZE_CMB_MODIFIERS = {
  Fine:       -8,
  Diminutive: -4,
  Tiny:       -2,
  Small:      -1,
  Medium:      0,
  Large:       1,
  Huge:        2,
  Gargantuan:  4,
  Colossal:    8,
};

// ── Armour Class ──────────────────────────────────────────

/**
 * Total AC = 10 + armour + shield + dexMod + size + natural + deflection + misc
 * @param {object} ac  AC component fields from creature.defence.ac
 * @param {number} dexMod
 * @returns {number}
 */
export function calculateAC(ac, dexMod) {
  return (
    10 +
    (ac.armour     ?? 0) +
    (ac.shield     ?? 0) +
    dexMod +
    (ac.size       ?? 0) +
    (ac.natural    ?? 0) +
    (ac.deflection ?? 0) +
    (ac.misc       ?? 0)
  );
}

/**
 * Touch AC = 10 + dexMod + size + deflection + misc
 * (Armour, shield, and natural armour do not apply to touch.)
 * @param {object} ac
 * @param {number} dexMod
 * @returns {number}
 */
export function calculateTouchAC(ac, dexMod) {
  return (
    10 +
    dexMod +
    (ac.size       ?? 0) +
    (ac.deflection ?? 0) +
    (ac.misc       ?? 0)
  );
}

/**
 * Flat-footed AC = 10 + armour + shield + size + natural + deflection + misc
 * (DEX bonus does not apply when flat-footed.)
 * @param {object} ac
 * @returns {number}
 */
export function calculateFlatFootedAC(ac) {
  return (
    10 +
    (ac.armour     ?? 0) +
    (ac.shield     ?? 0) +
    (ac.size       ?? 0) +
    (ac.natural    ?? 0) +
    (ac.deflection ?? 0) +
    (ac.misc       ?? 0)
  );
}

// ── Saving throws ─────────────────────────────────────────

/**
 * Fortitude save = base + CON modifier + misc modifier
 * @param {number} base
 * @param {number} conMod
 * @param {number} miscModifier
 * @returns {number}
 */
export function calculateFortSave(base, conMod, miscModifier = 0) {
  return base + conMod + miscModifier;
}

/**
 * Reflex save = base + DEX modifier + misc modifier
 * @param {number} base
 * @param {number} dexMod
 * @param {number} miscModifier
 * @returns {number}
 */
export function calculateRefSave(base, dexMod, miscModifier = 0) {
  return base + dexMod + miscModifier;
}

/**
 * Will save = base + WIS modifier + misc modifier
 * @param {number} base
 * @param {number} wisMod
 * @param {number} miscModifier
 * @returns {number}
 */
export function calculateWillSave(base, wisMod, miscModifier = 0) {
  return base + wisMod + miscModifier;
}

// ── Combat Manoeuvre Bonus / Defence ──────────────────────

/**
 * CMB = BAB + STR modifier + size modifier (CMB table) + misc
 * @param {number} bab Base attack bonus
 * @param {number} strMod
 * @param {string} sizeName  e.g. "Large"
 * @param {number} cmbMisc   Optional misc modifier
 * @returns {number}
 */
export function calculateCMB(bab, strMod, sizeName, cmbMisc = 0) {
  const sizeModifier = SIZE_CMB_MODIFIERS[sizeName] ?? 0;
  return bab + strMod + sizeModifier + cmbMisc;
}

/**
 * CMD = 10 + BAB + STR modifier + DEX modifier + size modifier + misc
 * @param {number} bab
 * @param {number} strMod
 * @param {number} dexMod
 * @param {string} sizeName
 * @param {number} cmdMisc   Optional misc modifier
 * @returns {number}
 */
export function calculateCMD(bab, strMod, dexMod, sizeName, cmdMisc = 0) {
  const sizeModifier = SIZE_CMB_MODIFIERS[sizeName] ?? 0;
  return 10 + bab + strMod + dexMod + sizeModifier + cmdMisc;
}

// ── Skill mapping ─────────────────────────────────────────

/**
 * Maps each standard PF1e skill to its governing ability score key.
 * Used to compute skill totals: total = ranks + abilityMod
 * Skills not in this map (custom skills) default to 0 for the ability modifier.
 */
export const SKILL_ABILITY_MAP = {
  'Acrobatics':              'dex',
  'Appraise':                'int',
  'Bluff':                   'cha',
  'Climb':                   'str',
  'Craft':                   'int',
  'Diplomacy':               'cha',
  'Disable Device':          'dex',
  'Disguise':                'cha',
  'Escape Artist':           'dex',
  'Fly':                     'dex',
  'Handle Animal':           'cha',
  'Heal':                    'wis',
  'Intimidate':              'cha',
  'Knowledge (arcana)':      'int',
  'Knowledge (dungeoneering)': 'int',
  'Knowledge (engineering)': 'int',
  'Knowledge (geography)':   'int',
  'Knowledge (history)':     'int',
  'Knowledge (local)':       'int',
  'Knowledge (nature)':      'int',
  'Knowledge (nobility)':    'int',
  'Knowledge (planes)':      'int',
  'Knowledge (religion)':    'int',
  'Linguistics':             'int',
  'Perception':              'wis',
  'Perform':                 'cha',
  'Profession':              'wis',
  'Ride':                    'dex',
  'Sense Motive':            'wis',
  'Sleight of Hand':         'dex',
  'Spellcraft':              'int',
  'Stealth':                 'dex',
  'Survival':                'wis',
  'Swim':                    'str',
  'Use Magic Device':        'cha',
};

// Ordered list of all standard skills (for pre-populating the form)
export const STANDARD_SKILLS = Object.keys(SKILL_ABILITY_MAP);
