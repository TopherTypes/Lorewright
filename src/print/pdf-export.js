// PDF export module — generates downloadable PDF files for creature and item cards.
// Uses html2pdf.js to convert HTML cards to PDF, ensuring the PDF matches the browser rendering exactly.

import { renderCreatureCard } from './creature-card.js';
import { renderItemCard } from './item-card.js';

// ── Card geometry (mm) ───────────────────────────────────────────────────────

const CARD_W  = 63;
const CARD_H  = 88;
const MARGIN  = 2;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a creature stat card as a PDF and triggers a browser download.
 * @param {object} derived  Output of deriveCreature()
 */
export function downloadCreatureCardPDF(derived) {
  if (!window.html2pdf) {
    alert('PDF generation library not available. Please reload the page.');
    return;
  }

  const cardHtml = renderCreatureCard(derived);
  const container = createCardContainer(cardHtml);

  const filename = sanitiseFilename(derived.name || 'creature') + '-card.pdf';

  const options = {
    margin:       MARGIN,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: [CARD_W, CARD_H], orientation: 'portrait' },
  };

  window.html2pdf().set(options).from(container).save();

  // Cleanup
  document.body.removeChild(container);
}

/**
 * Generates magic item card(s) as a PDF and triggers a browser download.
 * Unidentified items produce two pages: identified (DM copy) + unidentified (player copy).
 * @param {object} item  A stored item object
 */
export function downloadItemCardPDF(item) {
  if (!window.html2pdf) {
    alert('PDF generation library not available. Please reload the page.');
    return;
  }

  const cardHtml = renderItemCard(item);
  const container = createCardContainer(cardHtml);
  const filename = sanitiseFilename(item.name || 'item') + '-card.pdf';

  const options = {
    margin:       MARGIN,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, allowTaint: true },
    jsPDF:        { unit: 'mm', format: [CARD_W, CARD_H], orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'] },
  };

  window.html2pdf().set(options).from(container).save();
  document.body.removeChild(container);
}

// ── Helper functions ─────────────────────────────────────────────────────────

/**
 * Creates a temporary DOM container for the card HTML with proper styling.
 * @param {string} cardHtml  HTML string for the card
 * @returns {HTMLElement}  A div container ready for html2pdf
 */
function createCardContainer(cardHtml) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-10000px';
  container.style.top = '-10000px';
  container.innerHTML = cardHtml;

  // Ensure the card is sized correctly for PDF output
  const card = container.querySelector('.creature-card, .item-card');
  if (card) {
    card.style.width = CARD_W + 'mm';
    card.style.height = CARD_H + 'mm';
  }

  // For item card sets (unidentified items with two cards)
  const itemCardSet = container.querySelector('.item-card-set');
  if (itemCardSet) {
    itemCardSet.style.width = CARD_W + 'mm';
  }

  document.body.appendChild(container);
  return container;
}

/**
 * Sanitizes a filename by removing special characters and replacing spaces with hyphens.
 * @param {string} name
 * @returns {string}
 */
function sanitiseFilename(name) {
  return String(name).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}
