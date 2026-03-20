// Spell linking utilities.
// Functions to resolve spell objects from creature spell ID references,
// validate spell IDs, and support the spell picker UI.

import { getSpellById, getAllSpells } from '../storage/spells.js';

/**
 * Resolves all spell ID references in a creature to full spell objects.
 * Returns organized spell data by type (known, prepared, spell-like).
 * @param {object} creature The creature to resolve spells for
 * @returns {Promise<object>} Object with keys:
 *   - spellsKnown: [{spell, level}, ...]
 *   - spellsPrepared: [{spell, level}, ...]
 *   - spellLikeAbilities: [{spell}, ...]
 */
export async function resolveSpellsForCreature(creature) {
  const offence = creature.offence ?? {};

  const resolveList = async (spellIds, includeLevel = true) => {
    const resolved = [];
    for (const spellRef of (spellIds ?? [])) {
      try {
        const spell = await getSpellById(spellRef.spellId);
        if (spell) {
          const item = { spell };
          if (includeLevel && spellRef.level !== undefined) {
            item.level = spellRef.level;
          }
          resolved.push(item);
        }
      } catch (err) {
        console.warn(`Failed to resolve spell ${spellRef.spellId}:`, err);
      }
    }
    return resolved;
  };

  return {
    spellsKnown: await resolveList(offence.spellsKnownIds, true),
    spellsPrepared: await resolveList(offence.spellsPreparedIds, true),
    spellLikeAbilities: await resolveList(offence.spellLikeAbilityIds, false),
  };
}

/**
 * Validates that all spell IDs referenced in a creature exist in the spell library.
 * @param {object} creature The creature to validate
 * @returns {Promise<object>} Validation result:
 *   - valid: boolean
 *   - errors: array of error messages (empty if valid)
 */
export async function validateCreatureSpells(creature) {
  const offence = creature.offence ?? {};
  const errors = [];

  const validateList = async (spellIds, spellType) => {
    for (const spellRef of (spellIds ?? [])) {
      try {
        const spell = await getSpellById(spellRef.spellId);
        if (!spell) {
          errors.push(`${spellType}: Spell ID ${spellRef.spellId} not found in library`);
        }
      } catch (err) {
        errors.push(`${spellType}: Error validating spell ${spellRef.spellId}`);
      }
    }
  };

  await validateList(offence.spellsKnownIds, 'Spells Known');
  await validateList(offence.spellsPreparedIds, 'Spells Prepared');
  await validateList(offence.spellLikeAbilityIds, 'Spell-Like Abilities');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets all spells in the library, optionally filtered by level or school.
 * Used to populate the spell picker UI.
 * @param {object} options Optional filters:
 *   - levels: array of spell levels to include (0-9)
 *   - schools: array of spell schools to include
 * @returns {Promise<object[]>} Array of spell objects
 */
export async function getAvailableSpells(options = {}) {
  const allSpells = await getAllSpells();

  if (!options.levels && !options.schools) {
    return allSpells;
  }

  return allSpells.filter(spell => {
    if (options.levels && !options.levels.includes(spell.level)) {
      return false;
    }
    if (options.schools && !options.schools.includes(spell.school)) {
      return false;
    }
    return true;
  });
}

/**
 * Searches spells by name (case-insensitive partial match).
 * @param {string} searchTerm The search term
 * @returns {Promise<object[]>} Array of matching spell objects
 */
export async function searchSpells(searchTerm) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return getAllSpells();
  }

  const allSpells = await getAllSpells();
  const term = searchTerm.toLowerCase();
  return allSpells.filter(spell => spell.name.toLowerCase().includes(term));
}

/**
 * Gets all unique schools from spells in the library.
 * Useful for populating filter options in the spell picker.
 * @returns {Promise<string[]>} Array of school names
 */
export async function getAllSpellSchools() {
  const spells = await getAllSpells();
  const schools = new Set(spells.map(s => s.school));
  return Array.from(schools).sort();
}
