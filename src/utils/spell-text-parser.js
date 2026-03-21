/**
 * Plain text spell parser
 * Extracts spell data from unstructured spell descriptions
 */

import { createEmptySpell } from '../entities/spell.js';
import { generateUUID } from './uuid.js';
import {
  normalizeLevel,
  normalizeSchool,
  normalizeCastingTime,
  parseComponents,
  parseSavingThrow,
  parseSpellResistance,
  extractDamageInfo,
  extractScalingInfo,
} from './aon-to-lorewright.js';

/**
 * Main parsing function - parses unstructured spell text
 * @param {string} rawText - Raw spell description text
 * @returns {Object} Parsed spell object
 */
export function parseSpellFromText(rawText) {
  const spell = createEmptySpell();

  if (!rawText || typeof rawText !== 'string') {
    return spell;
  }

  const text = rawText.trim();
  if (text.length === 0) {
    return spell;
  }

  // Generate new meta
  spell.meta.id = generateUUID();
  const now = new Date().toISOString();
  spell.meta.createdAt = now;
  spell.meta.updatedAt = now;

  // Extract fields in order
  spell.name = extractSpellName(text);
  spell.level = extractLevel(text);
  spell.school = extractSchool(text);
  spell.castingTime = extractCastingTime(text);
  spell.range = extractRange(text);
  spell.duration = extractDuration(text);

  // Parse components
  const componentsText = extractComponentsText(text);
  spell.components = parseComponents(componentsText);

  // Parse saving throw and spell resistance
  spell.savingThrow = extractSavingThrow(text);
  spell.spellResistance = extractSpellResistance(text);

  // Extract description (remaining text)
  spell.description = extractDescription(text, {
    name: spell.name,
    level: spell.level,
    school: spell.school,
  });

  // Extract damage information from description
  const damageInfo = extractDamageInfo(spell.description);
  spell.damageType = damageInfo.damageType;
  spell.damageRolls = damageInfo.damageRolls;

  // Extract scaling information
  spell.scalingInfo = extractScalingInfo(spell.description);

  return spell;
}

/**
 * Extracts spell name from text
 * Returns first substantial line (before level/colon patterns)
 */
function extractSpellName(text) {
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed || trimmed.length === 0) {
      continue;
    }

    // Skip lines that are clearly mechanics (contain level, school, etc.)
    if (
      trimmed.toLowerCase().includes('level') ||
      trimmed.toLowerCase().includes('school') ||
      trimmed.toLowerCase().includes('casting time')
    ) {
      continue;
    }

    // Remove trailing colons
    const name = trimmed.replace(/:+$/, '').trim();

    // Must be substantial (not just single word typically for a spell name)
    if (name.length > 0 && name.length < 100) {
      return name;
    }
  }

  return '';
}

/**
 * Extracts spell level from text
 */
function extractLevel(text) {
  const levelMatch = text.match(
    /(?:level\s+)?(\d+)(?:-level)?|(?:cantrip|0-level)/i
  );

  if (levelMatch) {
    const levelNum = levelMatch[1];
    if (levelNum !== undefined) {
      const level = parseInt(levelNum, 10);
      if (level >= 0 && level <= 9) {
        return level;
      }
    }
  }

  // Check for cantrip
  if (text.toLowerCase().includes('cantrip')) {
    return 0;
  }

  return normalizeLevel('');
}

/**
 * Extracts spell school from text
 */
function extractSchool(text) {
  const schools = [
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

  const lowerText = text.toLowerCase();

  for (const school of schools) {
    if (lowerText.includes(school.toLowerCase())) {
      return school;
    }
  }

  return normalizeSchool('');
}

/**
 * Extracts casting time from text
 */
function extractCastingTime(text) {
  const castingTimePatterns = [
    /casting time[:\s]+([^\n]+)/i,
    /cast(?:ing)?\s+(?:as\s+)?(?:a\s+)?(\d+\s+(?:standard|full-round|swift|immediate|bonus|reaction)\s+action)/i,
    /(\d+\s+(?:standard|full-round|swift|immediate|bonus|reaction)\s+action)/i,
    /(\d+\s+(?:standard|full-round|swift|immediate|minute|round|hour))/i,
  ];

  for (const pattern of castingTimePatterns) {
    const match = text.match(pattern);
    if (match) {
      const timeText = match[1] || match[0];
      return normalizeCastingTime(timeText.trim());
    }
  }

  return normalizeCastingTime('');
}

/**
 * Extracts range from text
 */
function extractRange(text) {
  const rangePatterns = [
    /range[:\s]+(.+?)(?:\n\s*(?:duration|component|saving|casting|spell resistance|level|school))/i,
    /range[:\s]+([^\n]+)/i,
  ];

  for (const pattern of rangePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extracts duration from text
 */
function extractDuration(text) {
  const durationPatterns = [
    /duration[:\s]+(.+?)(?:\n\s*(?:component|saving|casting|spell resistance|level|school|range))/i,
    /duration[:\s]+([^\n]+)/i,
  ];

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extracts components text from spell description
 */
function extractComponentsText(text) {
  const componentPatterns = [
    /components?[:\s]+([^\n]+?)(?:(?=saving throw|range|duration|spell resistance|level|school)|\.|\n|;)/i,
    /components?[:\s]+([^\n]+)/i,
    /\(([VSD]+(?:\s+[^)]*)?)\)/i, // Parenthetical components
  ];

  for (const pattern of componentPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extracts saving throw type from text
 */
function extractSavingThrow(text) {
  const savePatterns = [
    /saving throw[:\s]+([^\n]+?)(?:\.|\n|;)/i,
    /save[:\s]+([^\n]+?)(?:\.|\n|;)/i,
  ];

  for (const pattern of savePatterns) {
    const match = text.match(pattern);
    if (match) {
      const saveText = match[1].trim();
      return parseSavingThrow(saveText);
    }
  }

  // Look for common save mentions in text
  if (/\b(fortitude|fort)\b/i.test(text)) {
    return parseSavingThrow('Fortitude');
  }
  if (/\b(reflex|ref)\b/i.test(text)) {
    return parseSavingThrow('Reflex');
  }
  if (/\bwill\b/i.test(text)) {
    return parseSavingThrow('Will');
  }

  return parseSavingThrow('None');
}

/**
 * Extracts spell resistance from text
 */
function extractSpellResistance(text) {
  const srPatterns = [
    /spell resistance[:\s]+([^\n]+?)(?:\.|\n|;)/i,
    /sr[:\s]+([^\n]+?)(?:\.|\n|;)/i,
  ];

  for (const pattern of srPatterns) {
    const match = text.match(pattern);
    if (match) {
      const srText = match[1].trim();
      return parseSpellResistance(srText);
    }
  }

  // Look for "yes" or "no" mentions with SR
  if (/spell resistance\s+yes/i.test(text)) {
    return true;
  }
  if (/sr\s+yes/i.test(text)) {
    return true;
  }

  return false;
}

/**
 * Extracts description (remaining spell text)
 * Removes extracted fields to get clean description
 */
function extractDescription(text, extractedFields) {
  let description = text;

  // Remove spell name from beginning
  if (extractedFields.name) {
    // Try to remove the name from the start
    const nameIndex = description.indexOf(extractedFields.name);
    if (nameIndex !== -1) {
      // Remove until end of that line
      const lineEnd = description.indexOf('\n', nameIndex);
      if (lineEnd !== -1) {
        description = description.substring(lineEnd + 1);
      } else {
        description = description.substring(
          nameIndex + extractedFields.name.length
        );
      }
    }
  }

  // Remove structured fields (level, school, casting time, etc.)
  description = description.replace(
    /(?:level|school|casting time|range|duration|components?|saving throw|sr|spell resistance)[:\s][^\n]*/gi,
    ''
  );

  // Clean up extra whitespace
  description = description
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .join('\n')
    .trim();

  return description;
}
