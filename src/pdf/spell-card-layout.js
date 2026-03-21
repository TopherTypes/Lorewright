// Spell card layout and positioning logic.
// Uses Tarot-style dimensions (2.75" × 4.75") for larger, more readable cards.

const DPI = 96; // Screen DPI for pixel conversion
const INCH_TO_MM = 25.4; // Conversion factor for jsPDF

// ── Spell Card Dimensions (Tarot-style) ──────────────────────────
const SPELL_CARD_WIDTH_IN = 2.75;
const SPELL_CARD_HEIGHT_IN = 4.5;

// ── Page Layout (Letter: 8.5" × 11") ────────────────────────────
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const MARGIN_IN = 0.25;

const USABLE_WIDTH_IN = PAGE_WIDTH_IN - (2 * MARGIN_IN);
const USABLE_HEIGHT_IN = PAGE_HEIGHT_IN - (2 * MARGIN_IN);

// ── Grid Layout ──────────────────────────────────────────────────
const CARDS_PER_ROW = 2;
const CARDS_PER_COL = 2;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

/**
 * Get spell card dimensions in pixels and inches.
 * @returns {object} {width, height, widthIn, heightIn}
 */
export function getSpellCardDimensions() {
  return {
    widthIn: SPELL_CARD_WIDTH_IN,
    heightIn: SPELL_CARD_HEIGHT_IN,
    width: Math.round(SPELL_CARD_WIDTH_IN * DPI),
    height: Math.round(SPELL_CARD_HEIGHT_IN * DPI),
  };
}

/**
 * Get spell card dimensions in pixels only (for backward compatibility).
 * @returns {object} {widthPx, heightPx}
 */
export function getCardDimensionsPx() {
  const dims = getSpellCardDimensions();
  return {
    widthPx: dims.width,
    heightPx: dims.height,
  };
}

/**
 * Get spell card dimensions in millimeters for jsPDF.
 * @returns {object} {widthMm, heightMm}
 */
export function getCardDimensionsMm() {
  return {
    widthMm: SPELL_CARD_WIDTH_IN * INCH_TO_MM,
    heightMm: SPELL_CARD_HEIGHT_IN * INCH_TO_MM,
  };
}

/**
 * Calculate pixel position (x, y) for a card at a given index on a page.
 * @param {number} indexOnPage 0-based index of card on current page (0-5)
 * @returns {object} {x, y} in pixels from page top-left
 */
export function getCardPosition(indexOnPage) {
  if (indexOnPage < 0 || indexOnPage >= CARDS_PER_PAGE) {
    throw new Error(`Card index must be between 0 and ${CARDS_PER_PAGE - 1}`);
  }

  const { width, height } = getSpellCardDimensions();
  const marginPx = Math.round(MARGIN_IN * DPI);

  const col = indexOnPage % CARDS_PER_ROW;
  const row = Math.floor(indexOnPage / CARDS_PER_ROW);

  const x = marginPx + col * (width + marginPx);
  const y = marginPx + row * (height + marginPx);

  return { x, y };
}

/**
 * Calculate position in millimeters for jsPDF.
 * @param {number} indexOnPage 0-based index of card on current page (0-5)
 * @returns {object} {xMm, yMm}
 */
export function getCardPositionMm(indexOnPage) {
  if (indexOnPage < 0 || indexOnPage >= CARDS_PER_PAGE) {
    throw new Error(`Card index must be between 0 and ${CARDS_PER_PAGE - 1}`);
  }

  const { widthMm, heightMm } = getCardDimensionsMm();
  const marginMm = MARGIN_IN * INCH_TO_MM;

  const col = indexOnPage % CARDS_PER_ROW;
  const row = Math.floor(indexOnPage / CARDS_PER_ROW);

  const xMm = marginMm + col * (widthMm + marginMm);
  const yMm = marginMm + row * (heightMm + marginMm);

  return { xMm, yMm };
}

/**
 * Calculates which page a card should be placed on, and its index on that page.
 * @param {number} cardIndex Total index of card across all pages
 * @returns {object} { pageNum, indexOnPage }
 */
export function getCardPageAndPosition(cardIndex) {
  const pageNum = Math.floor(cardIndex / CARDS_PER_PAGE);
  const indexOnPage = cardIndex % CARDS_PER_PAGE;
  return { pageNum, indexOnPage };
}

/**
 * Returns metadata about the spell card grid layout.
 * @returns {object} { cardsPerRow, cardsPerCol, cardsPerPage }
 */
export function getGridLayout() {
  return {
    cardsPerRow: CARDS_PER_ROW,
    cardsPerCol: CARDS_PER_COL,
    cardsPerPage: CARDS_PER_PAGE,
  };
}
