/**
 * Card Size Detector
 *
 * Analyzes entity content to determine optimal card size.
 * Supports auto-detection of text overflow and automatic upsizing to larger
 * cards when content would be too cramped.
 */

/**
 * Card dimensions at 300 DPI (standard print resolution)
 * Includes padding, so these are actual usable areas
 */
const CARD_DIMENSIONS = {
  small: {
    name: 'small',
    width: 602,    // 51mm
    height: 894,   // 76mm
    aspectRatio: '2:3',
    padding: 20,
    maxContentHeight: 854,  // height - top/bottom padding
  },
  standard: {
    name: 'standard',
    width: 744,    // 63mm
    height: 1039,  // 88mm
    aspectRatio: '3:4',
    padding: 28,
    maxContentHeight: 983,  // height - top/bottom padding
  },
  large: {
    name: 'large',
    width: 1039,   // 88mm
    height: 1497,  // 127mm
    aspectRatio: '2:3',
    padding: 32,
    maxContentHeight: 1433, // height - top/bottom padding
  },
  extended: {
    name: 'extended',
    width: 894,    // 76mm
    height: 1794,  // 152mm
    aspectRatio: '1:2',
    padding: 32,
    maxContentHeight: 1730, // height - top/bottom padding
  },
};

/**
 * Estimate content height for a creature card
 * Used to detect if content would overflow
 *
 * @param {Object} creature - Derived creature entity
 * @param {string} layout - Layout name (melee, spellcaster, etc.)
 * @returns {number} Estimated height in pixels at 300 DPI
 */
export function estimateCreatureContentHeight(creature, layout) {
  let height = 0;

  // Header (always present)
  height += 60; // name, CR, type line

  // Defense section
  height += 12; // section header
  height += 14; // AC line
  height += 14; // HP line
  height += 14; // Saves line
  if (creature.savingThrows?.immunities?.length) height += 12;
  if (creature.savingThrows?.resistances?.length) height += 12;
  if (creature.spellResistance) height += 12;

  // Spellcasting section (if spellcaster)
  if (layout === 'spellcaster') {
    height += 12; // section header
    if (creature.spellsKnown?.length) {
      height += Math.ceil(creature.spellsKnown.length / 2) * 16;
    }
    if (creature.spellsPrepared?.length) {
      height += Math.ceil(creature.spellsPrepared.length / 2) * 16;
    }
  }

  // Offense section
  if (layout !== 'swarm') {
    height += 12; // section header
    height += 14; // Speed
    if (creature.offensiveAbilities?.melee?.length) {
      height += creature.offensiveAbilities.melee.length * 14;
    }
    if (creature.offensiveAbilities?.ranged?.length) {
      height += creature.offensiveAbilities.ranged.length * 14;
    }
    if (creature.offensiveAbilities?.specialAttacks?.length) {
      height += 14;
    }
  }

  // Statistics section
  if (layout !== 'swarm' && layout !== 'construct') {
    height += 12; // section header
    height += 60; // ability scores grid
    height += 28; // BAB, CMB, CMD
    if (creature.skills?.length) {
      const skillLines = Math.ceil(Math.min(creature.skills.length, 5) / 2);
      height += skillLines * 14;
    }
  }

  // Special abilities
  const specialCount = creature.specialAbilities?.length || 0;
  if (specialCount > 0) {
    height += 12; // section header
    const abilitiesToShow = Math.min(specialCount, layout === 'boss' ? 99 : 3);
    height += abilitiesToShow * 30; // approximate per ability
  }

  // Special cases
  if (layout === 'swarm') {
    height -= 80; // swarm is more compact
  }
  if (layout === 'construct') {
    height -= 60;
  }

  return height;
}

/**
 * Estimate content height for an item card
 *
 * @param {Object} item - Item entity
 * @param {string} layout - Layout name (potion, wand, etc.)
 * @returns {number} Estimated height in pixels at 300 DPI
 */
export function estimateItemContentHeight(item, layout) {
  let height = 0;

  // Header
  height += 40; // name

  // Item properties (aura, CL, slot, etc.)
  height += 40; // property lines

  // Core info based on type
  switch (layout) {
    case 'potion':
    case 'scroll':
      height += 60; // spell info
      break;

    case 'wand':
      height += 30; // spell info
      height += 40; // charge tracker
      break;

    case 'staff':
      height += 50; // spells list
      height += 40; // charge tracker
      break;

    case 'weapon':
      height += 60; // weapon stats
      break;

    case 'armor':
      height += 50; // armor stats
      break;

    case 'wondrous':
    default:
      height += 40; // effects
      height += (item.description?.length || 0) / 100 * 30; // description
      break;
  }

  // Special abilities or requirements
  if (item.specialAbilities?.length || item.requirements?.length) {
    height += 30 * Math.min((item.specialAbilities?.length || 0), 2);
  }

  return height;
}

/**
 * Auto-detect if a creature needs a larger card based on content
 *
 * @param {Object} creature - Derived creature entity
 * @param {string} currentSize - Current size (small, standard, large, extended)
 * @param {string} layout - Layout name
 * @returns {string} Recommended size
 */
export function autoDetectCreatureCardSize(creature, currentSize, layout) {
  const estimatedHeight = estimateCreatureContentHeight(creature, layout);
  const currentDimension = CARD_DIMENSIONS[currentSize];
  const maxHeight = currentDimension.maxContentHeight;

  // If content takes up more than 90% of available height, upsize
  const utilization = estimatedHeight / maxHeight;

  if (utilization > 0.9) {
    // Upsize strategy: small → standard → large → extended
    const sizes = ['small', 'standard', 'large', 'extended'];
    const currentIndex = sizes.indexOf(currentSize);
    if (currentIndex < sizes.length - 1) {
      return sizes[currentIndex + 1];
    }
  }

  return currentSize;
}

/**
 * Auto-detect if an item needs a larger card based on content
 *
 * @param {Object} item - Item entity
 * @param {string} currentSize - Current size
 * @param {string} layout - Layout name
 * @returns {string} Recommended size
 */
export function autoDetectItemCardSize(item, currentSize, layout) {
  const estimatedHeight = estimateItemContentHeight(item, layout);
  const currentDimension = CARD_DIMENSIONS[currentSize];
  const maxHeight = currentDimension.maxContentHeight;

  const utilization = estimatedHeight / maxHeight;

  if (utilization > 0.9) {
    const sizes = ['small', 'standard', 'large', 'extended'];
    const currentIndex = sizes.indexOf(currentSize);
    if (currentIndex < sizes.length - 1) {
      return sizes[currentIndex + 1];
    }
  }

  return currentSize;
}

/**
 * Get card dimensions for a given size
 *
 * @param {string} size - Size name (small, standard, large, extended)
 * @returns {Object} Dimension object with width, height, padding, etc.
 */
export function getCardDimensions(size) {
  return CARD_DIMENSIONS[size] || CARD_DIMENSIONS.standard;
}

/**
 * Get all available card sizes
 * @returns {Array} Array of size objects
 */
export function getAllCardSizes() {
  return Object.values(CARD_DIMENSIONS);
}

/**
 * Get card size in millimeters
 *
 * @param {string} size - Size name
 * @returns {Object} { width: mm, height: mm }
 */
export function getCardSizeInMM(size) {
  const dim = CARD_DIMENSIONS[size];
  if (!dim) return null;

  // Convert pixels at 300 DPI to millimeters
  // 300 DPI = 300 pixels per 25.4mm
  // So: mm = pixels * 25.4 / 300
  return {
    width: (dim.width * 25.4 / 300),
    height: (dim.height * 25.4 / 300),
  };
}

/**
 * Calculate how many cards of a given size fit on an A4 page
 *
 * @param {string} size - Size name
 * @returns {Object} { columns, rows, total }
 */
export function cardsPerPage(size) {
  const A4 = { width: 210, height: 297 }; // mm
  const margin = 5;
  const available = {
    width: A4.width - (2 * margin),
    height: A4.height - (2 * margin),
  };

  const cardMM = getCardSizeInMM(size);
  const cols = Math.floor(available.width / cardMM.width);
  const rows = Math.floor(available.height / cardMM.height);

  return {
    columns: cols,
    rows: rows,
    total: cols * rows,
    cardSize: size,
  };
}

/**
 * Calculate page layout for a batch of cards
 * Groups cards by size and calculates optimal page layout
 *
 * @param {Array} cards - Array of { entity, size, layout }
 * @returns {Array} Array of page blocks
 */
export function calculatePageLayout(cards) {
  // Group by size
  const grouped = {};
  cards.forEach(card => {
    if (!grouped[card.size]) {
      grouped[card.size] = [];
    }
    grouped[card.size].push(card);
  });

  // Order by size (large to small for efficiency)
  const order = ['extended', 'large', 'standard', 'small'];
  const pageBlocks = [];

  order.forEach(size => {
    const cardsOfSize = grouped[size];
    if (!cardsOfSize) return;

    const perPage = cardsPerPage(size);
    const cardsPerPageCount = perPage.total;

    for (let i = 0; i < cardsOfSize.length; i += cardsPerPageCount) {
      pageBlocks.push({
        size: size,
        cards: cardsOfSize.slice(i, i + cardsPerPageCount),
        layout: {
          columns: perPage.columns,
          rows: perPage.rows,
        },
      });
    }
  });

  return pageBlocks;
}

/**
 * Check if card content would overflow at a given size
 * Used for validation before rendering
 *
 * @param {Object} entity - Creature or Item
 * @param {string} entityType - 'creature' or 'item'
 * @param {string} size - Card size
 * @param {string} layout - Layout name
 * @returns {Object} { overflows: boolean, utilization: number }
 */
export function checkCardOverflow(entity, entityType, size, layout) {
  const estimatedHeight = entityType === 'creature'
    ? estimateCreatureContentHeight(entity, layout)
    : estimateItemContentHeight(entity, layout);

  const dimension = CARD_DIMENSIONS[size];
  const utilization = estimatedHeight / dimension.maxContentHeight;

  return {
    overflows: utilization > 1.0,
    utilization: Math.min(utilization, 1.0),
    estimatedHeight,
    maxHeight: dimension.maxContentHeight,
  };
}
