/**
 * Transforms Archive of Nethys spell data to Lorewright schema
 */

import { createEmptySpell } from '../entities/spell.js';
import { generateUUID } from './uuid.js';
import {
  SCHOOL_NAME_MAP,
  SAVE_TYPE_MAP,
  DAMAGE_TYPE_MAP,
  CASTING_TIME_MAP,
} from '../constants/aon-config.js';

/**
 * Main transformation function
 * @param {Object} aonData - Raw parsed data from Archive of Nethys
 * @returns {Object} Complete Lorewright spell object
 */
export function mapAoNToLorewright(aonData) {
  const spell = createEmptySpell();

  // Generate new meta
  spell.meta.id = generateUUID();
  const now = new Date().toISOString();
  spell.meta.createdAt = now;
  spell.meta.updatedAt = now;

  // Map basic fields
  spell.name = (aonData.name || '').trim();
  spell.level = normalizeLevel(aonData.level || '');
  spell.school = normalizeSchool(aonData.school || '');
  spell.castingTime = normalizeCastingTime(aonData.castingTime || '');
  spell.range = (aonData.range || '').trim();
  spell.duration = (aonData.duration || '').trim();

  // Parse components
  const components = parseComponents(aonData.components || '');
  spell.components = components;

  // Parse saving throw and spell resistance
  spell.savingThrow = parseSavingThrow(aonData.savingThrow || '');
  spell.spellResistance = parseSpellResistance(aonData.spellResistance || '');

  // Extract description
  spell.description = (aonData.description || '').trim();

  // Extract damage information from description
  const damageInfo = extractDamageInfo(spell.description);
  spell.damageType = damageInfo.damageType;
  spell.damageRolls = damageInfo.damageRolls;

  // Extract scaling/upcast information
  spell.scalingInfo = extractScalingInfo(spell.description);

  return spell;
}

/**
 * Normalizes spell level from various formats
 * @param {string} levelText - Level text from AoN (e.g., "Level 3", "Cantrip")
 * @returns {number} Normalized level 0-9
 */
export function normalizeLevel(levelText) {
  if (!levelText) return 1; // Default to mid-range level

  const text = levelText.toLowerCase().trim();

  // Check for cantrip
  if (text.includes('cantrip') || text.includes('0-level')) {
    return 0;
  }

  // Extract numeric level
  const match = text.match(/(\d+)/);
  if (match) {
    const level = parseInt(match[1], 10);
    if (level >= 0 && level <= 9) {
      return level;
    }
  }

  return 1; // Default fallback
}

/**
 * Normalizes spell school from various formats
 * @param {string} schoolText - School text from AoN
 * @returns {string} Normalized school name
 */
export function normalizeSchool(schoolText) {
  if (!schoolText) return 'Evocation'; // Default school

  const text = schoolText.toLowerCase().trim();

  // Remove common suffixes/prefixes
  let cleaned = text
    .replace(/\(.*\)/g, '') // Remove parenthetical info
    .replace(/\[.*\]/g, '') // Remove bracketed info
    .trim();

  // Check mapping
  if (SCHOOL_NAME_MAP[cleaned]) {
    return SCHOOL_NAME_MAP[cleaned];
  }

  // Try partial matching
  for (const [key, value] of Object.entries(SCHOOL_NAME_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }

  return 'Evocation'; // Default fallback
}

/**
 * Normalizes casting time to standard format
 * @param {string} timeText - Casting time from AoN
 * @returns {string} Normalized casting time
 */
export function normalizeCastingTime(timeText) {
  if (!timeText) return '1 standard action'; // Default

  const text = timeText.toLowerCase().trim();

  // Check direct mapping
  if (CASTING_TIME_MAP[text]) {
    return CASTING_TIME_MAP[text];
  }

  // Try partial matching
  for (const [key, value] of Object.entries(CASTING_TIME_MAP)) {
    if (text.includes(key) || key.includes(text)) {
      return value;
    }
  }

  // If nothing matches, return as-is (cleaned)
  return timeText.charAt(0).toUpperCase() + timeText.slice(1).toLowerCase();
}

/**
 * Parses components string into component object
 * @param {string} componentsText - Components text (e.g., "V, S, M (components)")
 * @returns {Object} Components object with boolean flags and descriptions
 */
export function parseComponents(componentsText) {
  const components = {
    verbal: false,
    somatic: false,
    material: false,
    materialDescription: '',
    focus: false,
    divineFocus: false,
  };

  if (!componentsText) return components;

  const text = componentsText.toUpperCase();

  // Check for Verbal
  if (text.includes('V') || text.includes('VERBAL')) {
    components.verbal = true;
  }

  // Check for Somatic
  if (text.includes('S') || text.includes('SOMATIC')) {
    components.somatic = true;
  }

  // Check for Material (M) or Focus (F)
  if (text.includes('M') || text.includes('MATERIAL')) {
    components.material = true;

    // Extract material description from parentheses
    const materialMatch = componentsText.match(/M\s*\(([^)]+)\)/i);
    if (materialMatch) {
      components.materialDescription = materialMatch[1].trim();
    }
  }

  // Check for Focus
  if (text.includes('F') || text.includes('FOCUS')) {
    components.focus = true;
  }

  // Check for Divine Focus
  if (text.includes('DF') || text.includes('DIVINE FOCUS')) {
    components.divineFocus = true;
  }

  return components;
}

/**
 * Parses saving throw from various formats
 * @param {string} throwText - Saving throw text from AoN
 * @returns {string} Normalized saving throw type
 */
export function parseSavingThrow(throwText) {
  if (!throwText) return 'None'; // Default

  const text = throwText.toLowerCase().trim();

  // Check for "none"
  if (text === 'none' || text.includes('none')) {
    return 'None';
  }

  // Extract save type
  for (const [key, value] of Object.entries(SAVE_TYPE_MAP)) {
    if (text.includes(key)) {
      return value;
    }
  }

  // If no match found, try to extract first word
  const words = text.split(/[\s,]+/);
  const saveType = words[0];

  if (saveType === 'fort' || saveType === 'fortitude') return 'Fortitude';
  if (saveType === 'ref' || saveType === 'reflex') return 'Reflex';
  if (saveType === 'will') return 'Will';

  return 'None'; // Default fallback
}

/**
 * Parses spell resistance from various formats
 * @param {string} srText - Spell resistance text from AoN
 * @returns {boolean} Whether spell resistance applies
 */
export function parseSpellResistance(srText) {
  if (!srText) return false; // Default

  const text = srText.toLowerCase().trim();

  if (
    text === 'yes' ||
    text.includes('yes') ||
    text === 'true' ||
    text.includes('applies')
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts damage type and damage rolls from description text
 * @param {string} description - Full spell description
 * @returns {Object} {damageType: string, damageRolls: string}
 */
export function extractDamageInfo(description) {
  const result = {
    damageType: '',
    damageRolls: '',
  };

  if (!description) return result;

  const text = description.toLowerCase();

  // Look for damage roll pattern: "XdY" or "XdY+Z"
  const rollMatch = description.match(/(\d+d\d+(?:[+\-]\d+)?)/i);
  if (rollMatch) {
    result.damageRolls = rollMatch[1];
  }

  // Look for damage type keywords
  const damageTypePatterns = [
    /(\d+d\d+[+\-\d]*)\s+([a-z]+)\s+damage/i,
    /dealing\s+([a-z]+)\s+damage/i,
    /take\s+([a-z]+)\s+damage/i,
  ];

  for (const pattern of damageTypePatterns) {
    const match = description.match(pattern);
    if (match) {
      const damageName = match[match.length - 1].toLowerCase().trim();

      // Normalize damage type
      for (const [key, value] of Object.entries(DAMAGE_TYPE_MAP)) {
        if (damageName.includes(key) || key.includes(damageName)) {
          result.damageType = value;
          break;
        }
      }

      // If still no damage rolls found, try to extract from match
      if (!result.damageRolls && match[1] && match[1].match(/\d+d\d+/)) {
        result.damageRolls = match[1].match(/(\d+d\d+[+\-\d]*)/)[1];
      }

      if (result.damageType) break;
    }
  }

  return result;
}

/**
 * Extracts scaling/upcast information from description
 * @param {string} description - Full spell description
 * @returns {string} Scaling information text
 */
export function extractScalingInfo(description) {
  if (!description) return '';

  // Look for common scaling patterns
  const scalingPatterns = [
    /(?:heightened|upcast|increase[^.]*?caster level)/gi,
    /(?:for every|additional)[^.]*?caster level[^.]*?[.!]/gi,
  ];

  for (const pattern of scalingPatterns) {
    const match = description.match(pattern);
    if (match) {
      // Extract the sentence containing the match
      const matchStart = description.indexOf(match[0]);
      const sentenceStart = description.lastIndexOf('.', matchStart) + 1;
      const sentenceEnd = description.indexOf('.', matchStart + match[0].length);

      if (sentenceStart >= 0 && sentenceEnd > sentenceStart) {
        return description
          .substring(sentenceStart, sentenceEnd + 1)
          .trim();
      }
    }
  }

  return '';
}

/**
 * Validates a transformed spell for required fields
 * @param {Object} spell - The Lorewright spell object
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateSpell(spell) {
  const errors = [];

  if (!spell.name || spell.name.trim() === '') {
    errors.push('Spell name is required');
  }

  if (typeof spell.level !== 'number' || spell.level < 0 || spell.level > 9) {
    errors.push('Spell level must be 0-9');
  }

  if (!spell.school) {
    errors.push('Spell school is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
