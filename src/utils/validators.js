// Data validation utilities.
// Used by the import function to validate records against the Lorewright schema
// before writing to storage.

/**
 * Validates a creature object against the required schema fields.
 * Only checks for structural correctness, not PF1e rule legality.
 * @param {any} obj
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCreature(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Creature is not an object'] };
  }

  // Meta block
  if (!obj.meta || typeof obj.meta !== 'object') {
    errors.push('Missing meta block');
  } else {
    if (!obj.meta.id || typeof obj.meta.id !== 'string') {
      errors.push('meta.id must be a non-empty string');
    }
    if (!obj.meta.createdAt) errors.push('meta.createdAt is required');
    if (!obj.meta.updatedAt) errors.push('meta.updatedAt is required');
  }

  // Required top-level fields
  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('name must be a non-empty string');
  }

  // Defence block — must exist with at least basic structure
  if (!obj.defence || typeof obj.defence !== 'object') {
    errors.push('Missing defence block');
  }

  // Statistics block — must exist
  if (!obj.statistics || typeof obj.statistics !== 'object') {
    errors.push('Missing statistics block');
  }

  // Offence block — must exist
  if (!obj.offence || typeof obj.offence !== 'object') {
    errors.push('Missing offence block');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a complete export file object.
 * @param {any} obj
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateExportFile(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['File content is not a valid JSON object'] };
  }

  // Note: DATA_MODEL.md has a typo "lorew right_version" (with a space).
  // The correct key used in implementation is "lorewright_version" (no space).
  if (!obj.lorewright_version) {
    errors.push('Missing lorewright_version field — this may not be a Lorewright export file');
  }

  if (!obj.exportedAt) {
    errors.push('Missing exportedAt field');
  }

  if (obj.creatures !== undefined && !Array.isArray(obj.creatures)) {
    errors.push('creatures must be an array');
  }

  // Validate individual creatures
  const creatures = obj.creatures ?? [];
  creatures.forEach((creature, index) => {
    const result = validateCreature(creature);
    if (!result.valid) {
      errors.push(...result.errors.map(e => `Creature[${index}]: ${e}`));
    }
  });

  return { valid: errors.length === 0, errors };
}
