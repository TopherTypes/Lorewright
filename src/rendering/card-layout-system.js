/**
 * Card Layout System
 *
 * Defines layout templates for creatures and items, with content visibility rules
 * and section prioritization. Each layout determines what information appears on
 * a card and in what order.
 *
 * Layouts are automatically selected based on entity properties via
 * selectLayoutAndSize() function.
 */

/**
 * Creature card layout templates
 * Keyed by layout name, each template defines:
 * - name: template identifier
 * - label: human-readable name
 * - description: when this layout is used
 * - sections: array of sections in order
 * - visibilityRules: field-level visibility control
 * - contentRules: how to render specific fields
 */
export const CREATURE_LAYOUTS = {
  melee: {
    name: 'melee',
    label: 'Melee Combatant',
    description: 'Humanoids, beasts, and ground-based creatures',
    sections: [
      { type: 'header', fields: ['name', 'cr', 'type', 'size'] },
      { type: 'defense', fields: ['ac', 'hp', 'saves', 'immunities', 'sr'], priority: 'high' },
      { type: 'offense', fields: ['speed', 'melee', 'ranged', 'specialAttacks'], priority: 'high' },
      { type: 'statistics', fields: ['bab', 'cmb', 'cmd', 'skills', 'perception'], priority: 'medium' },
      { type: 'abilities', fields: ['specialAbilities'], priority: 'low', maxItems: 2 },
    ],
    visibilityRules: {
      'defense.immunities': true,
      'defense.resistances': 'abbreviated',
      'offense.fullAttacks': true,
      'offense.ranged': true,
      'statistics.abilityScores': 'abbreviated',
      'statistics.languages': false,
      'abilities.fullDescriptions': false,
    },
    contentRules: {
      skillsShown: ['Perception', 'Acrobatics', 'Climb', 'Stealth', 'Survival'],
      maxSkills: 5,
      truncateDescription: true,
      descriptionLines: 2,
    },
  },

  spellcaster: {
    name: 'spellcaster',
    label: 'Spellcaster',
    description: 'Wizards, clerics, druids, and other spellcasting creatures',
    sections: [
      { type: 'header', fields: ['name', 'cr', 'type', 'size'] },
      { type: 'defense', fields: ['ac', 'hp', 'saves'], priority: 'high' },
      { type: 'spellcasting', fields: ['spells'], priority: 'high' },
      { type: 'offense', fields: ['speed', 'specialAttacks'], priority: 'medium' },
      { type: 'statistics', fields: ['abilityScores', 'skills'], priority: 'medium' },
    ],
    visibilityRules: {
      'defense.immunities': false,
      'defense.resistances': false,
      'offense.melee': false,
      'offense.ranged': 'abbreviated',
      'statistics.abilityScores': true,
      'statistics.languages': 'abbreviated',
      'abilities.full': false,
    },
    contentRules: {
      skillsShown: ['Knowledge', 'Spellcraft', 'Perception'],
      maxSkills: 3,
      spellFormat: 'grid', // grid layout for multiple spells
      spellsPerRow: 2,
    },
  },

  swarm: {
    name: 'swarm',
    label: 'Swarm',
    description: 'Swarm creatures with collective damage',
    sections: [
      { type: 'header', fields: ['name', 'cr', 'type', 'size'] },
      { type: 'defense', fields: ['ac', 'hp', 'immunities'], priority: 'high' },
      { type: 'offense', fields: ['speed', 'swarmDamage'], priority: 'high' },
      { type: 'abilities', fields: ['specialAbilities'], priority: 'medium', maxItems: 3 },
    ],
    visibilityRules: {
      'defense.saves': false,
      'defense.resistances': false,
      'statistics.abilityScores': false,
      'statistics.bab': false,
      'statistics.cmb': false,
      'offense.melee': false,
      'offense.ranged': false,
      'languages': false,
      'ecology': false,
    },
    contentRules: {
      compactHeader: true,
      swarmDamageEmphasis: true,
      immunityFormat: 'list',
    },
  },

  boss: {
    name: 'boss',
    label: 'Boss / Unique',
    description: 'Powerful unique creatures with comprehensive information',
    sections: [
      { type: 'header', fields: ['name', 'cr', 'type', 'size', 'alignment'] },
      { type: 'defense', fields: ['ac', 'hp', 'saves', 'immunities', 'resistances', 'sr'], priority: 'high' },
      { type: 'offense', fields: ['speed', 'melee', 'ranged', 'specialAttacks', 'spells'], priority: 'high' },
      { type: 'statistics', fields: ['abilityScores', 'bab', 'cmb', 'cmd', 'skills'], priority: 'high' },
      { type: 'abilities', fields: ['specialAbilities'], priority: 'high', maxItems: 99 },
      { type: 'ecology', fields: ['ecology', 'treasure'], priority: 'low' },
    ],
    visibilityRules: {
      'defense.allFields': true,
      'offense.allFields': true,
      'statistics.allFields': true,
      'abilities.fullDescriptions': true,
      'ecology.show': true,
    },
    contentRules: {
      truncateDescription: false,
      maxAbilitiesShown: 99,
      abilityDescriptionLength: 'full',
      expandedLayout: true,
    },
  },

  construct: {
    name: 'construct',
    label: 'Construct / Undead',
    description: 'Constructs, golems, and undead with emphasis on immunities and hardness',
    sections: [
      { type: 'header', fields: ['name', 'cr', 'type', 'size'] },
      { type: 'defense', fields: ['ac', 'hp', 'immunities', 'hardness'], priority: 'high' },
      { type: 'offense', fields: ['speed', 'melee', 'specialAttacks'], priority: 'high' },
      { type: 'abilities', fields: ['specialAbilities'], priority: 'medium', maxItems: 4 },
      { type: 'statistics', fields: ['bab', 'cmb', 'cmd'], priority: 'low' },
    ],
    visibilityRules: {
      'defense.saves': false,
      'defense.resistances': false,
      'defense.weaknesses': true,
      'statistics.abilityScores': false,
      'statistics.skills': false,
      'offense.ranged': false,
      'languages': false,
    },
    contentRules: {
      immunityEmphasis: true,
      hardnessDisplay: true,
      minimizeAbilityScores: true,
    },
  },
};

/**
 * Item card layout templates
 * Keyed by item type, each defines:
 * - fields: what to display and in what order
 * - compactFormat: whether to use condensed layout
 * - contentRules: special rendering rules
 */
export const ITEM_LAYOUTS = {
  potion: {
    name: 'potion',
    label: 'Potion',
    description: 'Healing and utility potions',
    fields: ['name', 'spell', 'spellLevel', 'cl', 'price', 'description'],
    compactFormat: true,
    contentRules: {
      spellInfo: true,
      identifyDC: true,
      truncateDescription: true,
      descriptionLines: 2,
    },
  },

  scroll: {
    name: 'scroll',
    label: 'Scroll',
    description: 'Spell scrolls and scroll-like items',
    fields: ['name', 'spell', 'spellLevel', 'cl', 'castDC', 'scrollType', 'price'],
    compactFormat: true,
    contentRules: {
      spellInfo: true,
      castDCCalculation: true,
      handlingDC: true,
    },
  },

  wand: {
    name: 'wand',
    label: 'Wand',
    description: 'Wands with spell charges',
    fields: ['name', 'spell', 'spellLevel', 'cl', 'charges', 'chargeTracker', 'price', 'weight'],
    compactFormat: false,
    contentRules: {
      spellInfo: true,
      chargeTrackerFormat: 'checkboxes',
      chargesVisible: true,
      chargeBoxSize: '3mm',
    },
  },

  staff: {
    name: 'staff',
    label: 'Staff',
    description: 'Staves with multiple spells',
    fields: ['name', 'spells', 'charges', 'cl', 'price', 'weight', 'description'],
    compactFormat: false,
    contentRules: {
      spellGridFormat: true,
      spellsPerRow: 3,
      chargeTrackerFormat: 'checkboxes',
      maxSpellsPerGrid: 99,
    },
  },

  weapon: {
    name: 'weapon',
    label: 'Weapon',
    description: 'Magical and mundane weapons',
    fields: ['name', 'weaponType', 'category', 'enhancement', 'damage', 'critRange', 'specialAbilities', 'price', 'weight'],
    compactFormat: true,
    contentRules: {
      damageFormat: 'dice',
      abbreviateAbilities: true,
      maxAbilities: 3,
    },
  },

  armor: {
    name: 'armor',
    label: 'Armor',
    description: 'Magical and mundane armor',
    fields: ['name', 'armorType', 'category', 'acBonus', 'maxDex', 'asf', 'acp', 'specialAbilities', 'price', 'weight'],
    compactFormat: true,
    contentRules: {
      abbreviateAbilities: true,
      maxAbilities: 2,
      statsOnSingleLine: true,
    },
  },

  wondrous: {
    name: 'wondrous',
    label: 'Wondrous Item',
    description: 'Generic wondrous items',
    fields: ['name', 'slot', 'aura', 'cl', 'price', 'weight', 'effects', 'requirements', 'description'],
    compactFormat: false,
    contentRules: {
      descriptionLength: 'adaptive',
      effectsFormat: 'block',
      requirementsFormat: 'list',
    },
  },
};

/**
 * Determine the appropriate layout and size for a creature card
 *
 * @param {Object} creature - The creature entity
 * @returns {Object} { layout: string, size: string }
 */
export function selectCreatureLayoutAndSize(creature) {
  let layout = 'melee'; // default
  let size = 'standard'; // default

  const hasSpells = creature.spellsKnown?.length > 0 ||
                   creature.spellsPrepared?.length > 0 ||
                   creature.spellLikeAbilities?.length > 0;

  const isSwarm = creature.type?.toLowerCase().includes('swarm');
  const isConstruct = creature.type?.toLowerCase() === 'construct';
  const isUndead = creature.type?.toLowerCase() === 'undead';
  const specialAbilitiesCount = creature.specialAbilities?.length || 0;
  const cr = parseFloat(creature.cr) || 0;

  // Determine layout
  if (isSwarm) {
    layout = 'swarm';
    size = 'small';
  } else if (isConstruct || isUndead) {
    layout = 'construct';
    size = 'small';
  } else if (hasSpells) {
    layout = 'spellcaster';
    size = 'large';
  } else if (cr >= 5 || specialAbilitiesCount >= 5) {
    layout = 'boss';
    size = 'large';
  } else if (specialAbilitiesCount >= 3) {
    layout = 'melee';
    size = 'large';
  } else {
    layout = 'melee';
    size = 'standard';
  }

  return { layout, size };
}

/**
 * Determine the appropriate layout and size for an item card
 *
 * @param {Object} item - The item entity
 * @returns {Object} { layout: string, size: string, cardCount: number }
 */
export function selectItemLayoutAndSize(item) {
  let layout = 'wondrous'; // default
  let size = 'standard';
  let cardCount = 1;

  // Unidentified items render as two cards
  if (item.identified === false) {
    cardCount = 2;
    // Unidentified cards are always standard size
    return { layout, size: 'standard', cardCount };
  }

  // Identified item sizing based on type and complexity
  switch (item.type) {
    case 'Potion':
      layout = 'potion';
      size = 'small';
      break;

    case 'Scroll':
      layout = 'scroll';
      size = 'small';
      break;

    case 'Wand':
      layout = 'wand';
      // Wand size depends on spell and charge tracking needs
      size = item.spells?.length > 1 ? 'large' : 'standard';
      break;

    case 'Staff':
      layout = 'staff';
      // Staff size depends on number of spells
      size = item.spells?.length > 6 ? 'extended' : 'large';
      break;

    case 'Weapon':
      layout = 'weapon';
      // Weapon size depends on special abilities
      const weaponAbilities = item.specialAbilities?.length || 0;
      size = weaponAbilities > 2 ? 'large' : 'standard';
      break;

    case 'Armor':
      layout = 'armor';
      // Armor size depends on special abilities
      const armorAbilities = item.specialAbilities?.length || 0;
      size = armorAbilities > 2 ? 'large' : 'standard';
      break;

    case 'Wondrous Item':
    case 'Ring':
    case 'Rod':
    default:
      layout = 'wondrous';
      // Size based on description length
      const descLength = (item.description?.length || 0) + (item.effects?.length || 0);
      size = descLength > 300 ? 'large' : 'standard';
      break;
  }

  return { layout, size, cardCount };
}

/**
 * Get the layout definition for a creature
 *
 * @param {string} layoutName - Name of the layout
 * @returns {Object} Layout definition
 */
export function getCreatureLayout(layoutName) {
  return CREATURE_LAYOUTS[layoutName] || CREATURE_LAYOUTS.melee;
}

/**
 * Get the layout definition for an item
 *
 * @param {string} layoutName - Name of the layout
 * @returns {Object} Layout definition
 */
export function getItemLayout(layoutName) {
  return ITEM_LAYOUTS[layoutName] || ITEM_LAYOUTS.wondrous;
}

/**
 * Get all available creature layout names
 * @returns {string[]} Array of layout names
 */
export function getCreatureLayoutNames() {
  return Object.keys(CREATURE_LAYOUTS);
}

/**
 * Get all available item layout names
 * @returns {string[]} Array of layout names
 */
export function getItemLayoutNames() {
  return Object.keys(ITEM_LAYOUTS);
}
