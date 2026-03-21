/**
 * Configuration constants for Archive of Nethys integration
 */

export const AON_BASE_URL = 'https://aonprd.com';
export const AON_SPELL_PATH = 'SpellDisplay.aspx';
export const FETCH_TIMEOUT_MS = 5000;
export const PREVIEW_DESCRIPTION_LENGTH = 200;

// School name mappings for abbreviations and variations
export const SCHOOL_NAME_MAP = {
  'abjur': 'Abjuration',
  'abjuration': 'Abjuration',
  'conj': 'Conjuration',
  'conjuration': 'Conjuration',
  'div': 'Divination',
  'divination': 'Divination',
  'ench': 'Enchantment',
  'enchantment': 'Enchantment',
  'evo': 'Evocation',
  'evocation': 'Evocation',
  'ill': 'Illusion',
  'illusion': 'Illusion',
  'nec': 'Necromancy',
  'necromancy': 'Necromancy',
  'trans': 'Transmutation',
  'transmutation': 'Transmutation',
  'univ': 'Universal',
  'universal': 'Universal',
};

// Saving throw name mappings
export const SAVE_TYPE_MAP = {
  'fort': 'Fortitude',
  'fortitude': 'Fortitude',
  'ref': 'Reflex',
  'reflex': 'Reflex',
  'will': 'Will',
  'will save': 'Will',
  'none': 'None',
};

// Damage type mappings
export const DAMAGE_TYPE_MAP = {
  'acid': 'Acid',
  'cold': 'Cold',
  'electricity': 'Electricity',
  'electric': 'Electricity',
  'fire': 'Fire',
  'force': 'Force',
  'negative': 'Negative Energy',
  'negative energy': 'Negative Energy',
  'positive': 'Positive Energy',
  'positive energy': 'Positive Energy',
  'sonic': 'Sonic',
  'sound': 'Sonic',
  'bludgeoning': 'Bludgeoning',
  'piercing': 'Piercing',
  'slashing': 'Slashing',
  'other': 'Other',
};

// Casting time normalization
export const CASTING_TIME_MAP = {
  '1 standard action': '1 standard action',
  'standard': '1 standard action',
  '1 action': '1 standard action',
  '1 full-round action': '1 full-round action',
  'full-round': '1 full-round action',
  'full round': '1 full-round action',
  '1 swift action': '1 swift action',
  'swift': '1 swift action',
  '1 immediate action': '1 immediate action',
  'immediate': '1 immediate action',
  '1 round': '1 round',
  '10 minutes': '10 minutes',
  '1 minute': '1 minute',
  '10 minutes or longer': '10 minutes or longer',
};

// Spell level keywords
export const LEVEL_KEYWORDS = [
  'cantrip',
  '0-level',
  'level 1',
  'level 2',
  'level 3',
  'level 4',
  'level 5',
  'level 6',
  'level 7',
  'level 8',
  'level 9',
];
