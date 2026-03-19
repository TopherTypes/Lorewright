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

// ── Challenge Rating → XP ──────────────────────────────────

/**
 * Standard PF1e XP awards by CR (Bestiary, Table 1-1).
 * Keys are numeric CR values; fractional CRs use decimals (0.5, 0.25, etc.).
 */
export const CR_XP_TABLE = {
  0.125: 50,
  0.167: 65,
  0.25:  100,
  0.333: 135,
  0.5:   200,
  1:     400,
  2:     600,
  3:     800,
  4:     1200,
  5:     1600,
  6:     2400,
  7:     3200,
  8:     4800,
  9:     6400,
  10:    9600,
  11:    12800,
  12:    19200,
  13:    25600,
  14:    38400,
  15:    51200,
  16:    76800,
  17:    102400,
  18:    153600,
  19:    204800,
  20:    307200,
  21:    409600,
  22:    614400,
  23:    819200,
  24:    1228800,
  25:    1638400,
  26:    2457600,
  27:    3276800,
  28:    4915200,
  29:    6553600,
  30:    9830400,
};

/**
 * Returns the standard XP award for the given CR.
 * Accepts numbers or fractional strings ("1/2", "1/4", "1/3", "1/6", "1/8").
 * Returns null if CR cannot be resolved to a known value.
 * @param {number|string} cr
 * @returns {number|null}
 */
export function xpFromCR(cr) {
  // Normalise fractional string representations to numeric
  const FRACTION_MAP = {
    '1/2': 0.5,
    '1/3': 0.333,
    '1/4': 0.25,
    '1/6': 0.167,
    '1/8': 0.125,
  };

  let numeric;
  if (typeof cr === 'string') {
    if (FRACTION_MAP[cr.trim()] !== undefined) {
      numeric = FRACTION_MAP[cr.trim()];
    } else {
      numeric = parseFloat(cr);
    }
  } else {
    numeric = cr;
  }

  if (isNaN(numeric) || numeric === null || numeric === undefined) return null;

  // Direct table lookup — round to avoid floating-point key misses
  const rounded = Math.round(numeric);
  if (Number.isInteger(numeric) && CR_XP_TABLE[rounded] !== undefined) {
    return CR_XP_TABLE[rounded];
  }

  // For fractional CRs, find the closest key
  const keys = Object.keys(CR_XP_TABLE).map(Number);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - numeric) < Math.abs(prev - numeric) ? curr : prev
  );
  if (Math.abs(closest - numeric) < 0.05) {
    return CR_XP_TABLE[closest];
  }

  return null;
}

// ── Hit Dice → Average HP ──────────────────────────────────

/**
 * Parses a PF1e hit dice expression ("NdM+K" or "NdM-K" or "NdM")
 * and returns the average HP (floored), as used in stat blocks.
 * Average of NdM = N × (M/2 + 0.5), then add/subtract the constant.
 * Returns null for unrecognised expressions.
 * @param {string} hdStr  e.g. "6d8+12", "3d6", "2d12-2"
 * @returns {number|null}
 */
export function averageHPFromHD(hdStr) {
  if (!hdStr || typeof hdStr !== 'string') return null;
  const match = hdStr.trim().match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/i);
  if (!match) return null;

  const numDice    = parseInt(match[1], 10);
  const dieSize    = parseInt(match[2], 10);
  const modifier   = match[3] ? parseInt(match[3].replace(/\s/g, ''), 10) : 0;

  const average = numDice * (dieSize / 2 + 0.5) + modifier;
  return Math.floor(average);
}
