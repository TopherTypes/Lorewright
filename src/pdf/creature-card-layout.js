// Creature card layout and positioning logic.
// Handles sizing for poker cards (basic), index cards (complex/spellcaster).
// Supports both landscape and portrait orientations for index cards.

const DPI = 96; // Screen DPI for pixel conversion

// ── Poker Card Dimensions (Basic Creatures) ────────────────────
const POKER_WIDTH_IN = 2.5;
const POKER_HEIGHT_IN = 3.5;

// ── Index Card Dimensions (Complex/Spellcaster) ─────────────────
const INDEX_WIDTH_IN = 4;  // Landscape
const INDEX_HEIGHT_IN = 6; // Landscape

const INDEX_WIDTH_PORTRAIT_IN = 6;  // Portrait
const INDEX_HEIGHT_PORTRAIT_IN = 4; // Portrait

// ── Page Layout (Letter: 8.5" × 11") ────────────────────────────
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const MARGIN_IN = 0.25;

const USABLE_WIDTH_IN = PAGE_WIDTH_IN - (2 * MARGIN_IN);
const USABLE_HEIGHT_IN = PAGE_HEIGHT_IN - (2 * MARGIN_IN);

/**
 * Get card dimensions in pixels for a given variant and orientation.
 * @param {string} variant 'basic' | 'complex' | 'spellcaster'
 * @param {string} orientation 'landscape' | 'portrait' (ignored for basic)
 * @returns {object} {width, height, widthIn, heightIn}
 */
export function getCreatureCardDimensions(variant, orientation = 'landscape') {
  let widthIn, heightIn;

  if (variant === 'basic') {
    widthIn = POKER_WIDTH_IN;
    heightIn = POKER_HEIGHT_IN;
  } else if (variant === 'complex' || variant === 'spellcaster') {
    if (orientation === 'portrait') {
      widthIn = INDEX_WIDTH_PORTRAIT_IN;
      heightIn = INDEX_HEIGHT_PORTRAIT_IN;
    } else {
      widthIn = INDEX_WIDTH_IN;
      heightIn = INDEX_HEIGHT_IN;
    }
  } else {
    throw new Error(`Unknown variant: ${variant}`);
  }

  return {
    widthIn,
    heightIn,
    width: Math.round(widthIn * DPI),
    height: Math.round(heightIn * DPI),
  };
}

/**
 * Get grid layout for a variant and orientation.
 * Returns number of columns, rows, and total cards per page.
 * @param {string} variant 'basic' | 'complex' | 'spellcaster'
 * @param {string} orientation 'landscape' | 'portrait'
 * @returns {object} {cols, rows, cardsPerPage}
 */
export function getCreatureCardGridLayout(variant, orientation = 'landscape') {
  if (variant === 'basic') {
    return {
      cols: 2,
      rows: 3,
      cardsPerPage: 6,
    };
  }

  // Index cards (complex/spellcaster)
  if (orientation === 'portrait') {
    return {
      cols: 2,
      rows: 3,
      cardsPerPage: 6,
    };
  } else {
    return {
      cols: 2,
      rows: 2,
      cardsPerPage: 4,
    };
  }
}

/**
 * Calculate pixel position (x, y) for a card at a given index on a page.
 * @param {number} indexOnPage 0-based index of card on current page
 * @param {string} variant 'basic' | 'complex' | 'spellcaster'
 * @param {string} orientation 'landscape' | 'portrait'
 * @returns {object} {x, y} in pixels from page top-left
 */
export function getCreatureCardPosition(indexOnPage, variant, orientation = 'landscape') {
  const dims = getCreatureCardDimensions(variant, orientation);
  const grid = getCreatureCardGridLayout(variant, orientation);

  const marginPx = MARGIN_IN * DPI;

  // Calculate spacing between cards
  const totalHorizSpace = (USABLE_WIDTH_IN * DPI) - (dims.width * grid.cols);
  const spacingX = grid.cols > 1 ? totalHorizSpace / (grid.cols - 1) : 0;

  const totalVertSpace = (USABLE_HEIGHT_IN * DPI) - (dims.height * grid.rows);
  const spacingY = grid.rows > 1 ? totalVertSpace / (grid.rows - 1) : 0;

  const col = indexOnPage % grid.cols;
  const row = Math.floor(indexOnPage / grid.cols);

  const x = marginPx + (col * (dims.width + spacingX));
  const y = marginPx + (row * (dims.height + spacingY));

  return { x, y };
}

/**
 * Get page number and position on page for a card at a given global index.
 * @param {number} cardIndex 0-based global index
 * @param {string} variant 'basic' | 'complex' | 'spellcaster'
 * @param {string} orientation 'landscape' | 'portrait'
 * @returns {object} {pageNumber, indexOnPage, position: {x, y}}
 */
export function getCreatureCardPageAndPosition(cardIndex, variant, orientation = 'landscape') {
  const grid = getCreatureCardGridLayout(variant, orientation);
  const pageNumber = Math.floor(cardIndex / grid.cardsPerPage);
  const indexOnPage = cardIndex % grid.cardsPerPage;
  const position = getCreatureCardPosition(indexOnPage, variant, orientation);

  return { pageNumber, indexOnPage, position };
}

/**
 * Calculate total number of pages needed for a set of cards with mixed variants.
 * @param {array} cardConfigs Array of {variant, orientation}
 * @returns {number} Total pages needed
 */
export function calculateTotalPages(cardConfigs) {
  let pages = new Map(); // pageNumber -> cardsOnPage

  cardConfigs.forEach((config, idx) => {
    const { pageNumber } = getCreatureCardPageAndPosition(idx, config.variant, config.orientation);
    pages.set(pageNumber, (pages.get(pageNumber) || 0) + 1);
  });

  return pages.size;
}

/**
 * Format dimensions for printing/display.
 * @param {string} variant 'basic' | 'complex' | 'spellcaster'
 * @param {string} orientation 'landscape' | 'portrait'
 * @returns {string} Human-readable size (e.g. "2.5\" × 3.5\"")
 */
export function formatCardDimensions(variant, orientation = 'landscape') {
  const dims = getCreatureCardDimensions(variant, orientation);
  return `${dims.widthIn}" × ${dims.heightIn}"`;
}
