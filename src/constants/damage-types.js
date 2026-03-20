/**
 * Standardized damage types for weapons and creature attacks
 */

export const DAMAGE_TYPES = {
  // Physical damage
  SLASHING: 'Slashing',
  PIERCING: 'Piercing',
  BLUDGEONING: 'Bludgeoning',

  // Elemental damage
  FIRE: 'Fire',
  COLD: 'Cold',
  ELECTRIC: 'Electric',
  ACID: 'Acid',
  SONIC: 'Sonic',
  FORCE: 'Force',

  // Special damage
  NEGATIVE: 'Negative',
  POSITIVE: 'Positive',
  SUBDUAL: 'Subdual',
};

export const DAMAGE_TYPE_CATEGORIES = {
  Physical: [
    DAMAGE_TYPES.SLASHING,
    DAMAGE_TYPES.PIERCING,
    DAMAGE_TYPES.BLUDGEONING,
  ],
  Elemental: [
    DAMAGE_TYPES.FIRE,
    DAMAGE_TYPES.COLD,
    DAMAGE_TYPES.ELECTRIC,
    DAMAGE_TYPES.ACID,
    DAMAGE_TYPES.SONIC,
    DAMAGE_TYPES.FORCE,
  ],
  Special: [
    DAMAGE_TYPES.NEGATIVE,
    DAMAGE_TYPES.POSITIVE,
    DAMAGE_TYPES.SUBDUAL,
  ],
};

/**
 * Get all damage types as an array
 */
export function getAllDamageTypes() {
  return Object.values(DAMAGE_TYPES);
}

/**
 * Get damage types grouped by category for form display
 */
export function getDamageTypesForDisplay() {
  const types = [];
  for (const [category, values] of Object.entries(DAMAGE_TYPE_CATEGORIES)) {
    types.push({ category, values });
  }
  return types;
}

/**
 * Get damage type options for select input (with "Custom" option)
 */
export function getDamageTypeOptions() {
  const allTypes = getAllDamageTypes();
  return allTypes.map(type => ({
    label: type,
    value: type,
  })).concat({
    label: 'Custom',
    value: 'Custom',
  });
}
