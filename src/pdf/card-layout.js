// Card layout utilities for poker-sized item cards.
// Provides measurements, positioning, and pagination calculations.

// ── Card dimensions (inches) ────────────────────────────────────
const CARD_WIDTH_IN = 2.5;
const CARD_HEIGHT_IN = 3.5;

// ── Page dimensions (Letter: 8.5" × 11") ────────────────────────
const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const PAGE_MARGIN_IN = 0.25;

// ── Conversion factors ──────────────────────────────────────────
const INCH_TO_MM = 25.4;
const INCH_TO_PT = 72;
const INCH_TO_PX = 96; // Standard screen DPI

// ── Grid layout ─────────────────────────────────────────────────
const CARDS_PER_ROW = 2;
const CARDS_PER_COL = 3;
const CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL;

/**
 * Calculates the width and height of a poker card in pixels.
 * Used for rendering HTML templates with html2canvas.
 * @returns {object} { widthPx, heightPx }
 */
export function getCardDimensionsPx() {
  return {
    widthPx: CARD_WIDTH_IN * INCH_TO_PX,
    heightPx: CARD_HEIGHT_IN * INCH_TO_PX,
  };
}

/**
 * Calculates card dimensions in millimeters for jsPDF.
 * @returns {object} { widthMm, heightMm }
 */
export function getCardDimensionsMm() {
  return {
    widthMm: CARD_WIDTH_IN * INCH_TO_MM,
    heightMm: CARD_HEIGHT_IN * INCH_TO_MM,
  };
}

/**
 * Calculates the position (x, y) for a card at a given index on a page.
 * Returns coordinates in jsPDF units (mm).
 * @param {number} indexOnPage Index of card on current page (0-5 for 6 cards/page)
 * @returns {object} { xMm, yMm }
 */
export function getCardPosition(indexOnPage) {
  if (indexOnPage < 0 || indexOnPage >= CARDS_PER_PAGE) {
    throw new Error(`Card index must be between 0 and ${CARDS_PER_PAGE - 1}`);
  }

  const { widthMm, heightMm } = getCardDimensionsMm();
  const marginMm = PAGE_MARGIN_IN * INCH_TO_MM;

  // 2 columns, 3 rows
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
 * Returns metadata about the card grid layout.
 * @returns {object} { cardsPerRow, cardsPerCol, cardsPerPage }
 */
export function getGridLayout() {
  return {
    cardsPerRow: CARDS_PER_ROW,
    cardsPerCol: CARDS_PER_COL,
    cardsPerPage: CARDS_PER_PAGE,
  };
}
