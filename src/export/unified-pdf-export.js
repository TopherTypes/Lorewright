/**
 * Unified PDF Export
 *
 * Handles PDF generation for cards using HTML2PDF.
 * Provides both single-card and batch export with intelligent page layout.
 *
 * Integration with UnifiedCardRenderer for perfect screen-to-PDF fidelity.
 */

import { renderCreatureCard, renderItemCard } from '../rendering/unified-card-renderer.js';
import { calculatePageLayout, getCardSizeInMM } from '../rendering/card-size-detector.js';

/**
 * Export a single creature card to PDF
 *
 * @param {Object} creature - Derived creature entity
 * @param {Object} options - Export options
 * @param {string} options.theme - Theme name
 * @param {string} options.size - Card size
 * @param {string} options.filename - Output filename (default: creature name)
 * @returns {Promise} Resolves when PDF is downloaded
 */
export async function downloadCreatureCardPDF(creature, options = {}) {
  const filename = options.filename || `${creature.name || 'creature'}.pdf`;
  const cardHTML = renderCreatureCard(creature, options);

  return downloadCardPDF(cardHTML, { filename }, options);
}

/**
 * Export a single item card to PDF
 *
 * @param {Object} item - Item entity
 * @param {Object} options - Export options
 * @param {string} options.theme - Theme name
 * @param {boolean} options.identified - For unidentified items, export identified (true) or unidentified (false)
 * @param {string} options.filename - Output filename
 * @returns {Promise} Resolves when PDF is downloaded
 */
export async function downloadItemCardPDF(item, options = {}) {
  const filename = options.filename || `${item.name || 'item'}.pdf`;
  let cardHTML = renderItemCard(item, options);

  // If unidentified, renderItemCard returns [gmCopy, playerCopy]
  if (Array.isArray(cardHTML)) {
    cardHTML = options.playerCopy ? cardHTML[1] : cardHTML[0];
  }

  return downloadCardPDF(cardHTML, { filename }, options);
}

/**
 * Export multiple cards as a batch PDF with intelligent layout
 *
 * @param {Array} cards - Array of { entity, type: 'creature'|'item', options?: {...} }
 * @param {Object} exportOptions - Export options
 * @param {string} exportOptions.theme - Default theme
 * @param {boolean} exportOptions.autoLayout - Auto-optimize layout by size (default: true)
 * @param {string} exportOptions.filename - Output filename
 * @returns {Promise} Resolves when PDF is downloaded
 */
export async function downloadBatchCardsPDF(cards, exportOptions = {}) {
  const theme = exportOptions.theme || 'classic-parchment';
  const autoLayout = exportOptions.autoLayout !== false;
  const filename = exportOptions.filename || 'cards.pdf';

  // Render all cards to HTML with size/layout detection
  const renderedCards = [];

  for (const card of cards) {
    let html, size, layout;

    if (card.type === 'creature') {
      html = renderCreatureCard(card.entity, { theme, ...card.options });
      renderedCards.push({ html, size: 'standard', layout: 'creature' });
    } else if (card.type === 'item') {
      const cardHTMLs = renderItemCard(card.entity, { theme, ...card.options });

      // Handle unidentified items (returns array)
      if (Array.isArray(cardHTMLs)) {
        renderedCards.push({ html: cardHTMLs[0], size: 'standard', layout: 'item-identified' });
        renderedCards.push({ html: cardHTMLs[1], size: 'standard', layout: 'item-unidentified' });
      } else {
        renderedCards.push({ html: cardHTMLs, size: 'standard', layout: 'item' });
      }
    }
  }

  // Calculate page layout
  const pageBlocks = autoLayout
    ? calculatePageLayout(renderedCards)
    : [{ cards: renderedCards, layout: { columns: 2, rows: 2 } }];

  // Generate multi-page PDF
  return downloadMultiPagePDF(pageBlocks, { filename }, theme);
}

/**
 * Internal: Download a single card as PDF
 * @private
 */
async function downloadCardPDF(htmlString, fileOptions, cardOptions) {
  // Load html2pdf if not already loaded
  const html2pdf = await loadHTML2PDF();

  // Create temporary element
  const element = document.createElement('div');
  element.innerHTML = htmlString;
  element.style.margin = '0';
  element.style.padding = '0';

  // Calculate dimensions from card size class
  const sizeMatch = htmlString.match(/card-size-(\w+)/);
  const size = sizeMatch ? sizeMatch[1] : 'standard';
  const sizeMM = getCardSizeInMM(size);

  // HTML2PDF options
  const opt = {
    margin: 0,
    filename: fileOptions.filename || 'card.pdf',
    image: { type: 'png', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    },
    jsPDF: {
      unit: 'mm',
      format: [sizeMM.width, sizeMM.height],
      orientation: sizeMM.width > sizeMM.height ? 'landscape' : 'portrait',
    },
    pagebreak: { avoid: '.card-container', mode: ['css', 'legacy'] },
  };

  // Generate and download
  return new Promise((resolve, reject) => {
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

/**
 * Internal: Download multi-page PDF with page layout
 * @private
 */
async function downloadMultiPagePDF(pageBlocks, fileOptions, theme) {
  const html2pdf = await loadHTML2PDF();

  // Create container for all pages
  const container = document.createElement('div');

  let pageNum = 1;
  for (const block of pageBlocks) {
    const pageDiv = document.createElement('div');
    pageDiv.style.pageBreakBefore = pageNum > 1 ? 'always' : 'avoid';
    pageDiv.style.position = 'relative';
    pageDiv.style.width = '210mm';
    pageDiv.style.height = '297mm';
    pageDiv.style.padding = '5mm';
    pageDiv.style.boxSizing = 'border-box';
    pageDiv.style.backgroundColor = '#fff';

    // Create grid for this page
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${block.layout.columns}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${block.layout.rows}, 1fr)`;
    grid.style.gap = '3mm';
    grid.style.width = '100%';
    grid.style.height = '100%';

    // Add card HTMLs to grid
    for (const card of block.cards) {
      const cardDiv = document.createElement('div');
      cardDiv.innerHTML = card.html;
      cardDiv.style.display = 'flex';
      cardDiv.style.alignItems = 'flex-start';
      grid.appendChild(cardDiv);
    }

    pageDiv.appendChild(grid);
    container.appendChild(pageDiv);
    pageNum++;
  }

  // Generate PDF from container
  const opt = {
    margin: [0, 0],
    filename: fileOptions.filename || 'cards.pdf',
    image: { type: 'png', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  return new Promise((resolve, reject) => {
    html2pdf()
      .set(opt)
      .from(container)
      .save()
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

/**
 * Load HTML2PDF library dynamically
 * Returns the html2pdf global function
 * @private
 */
async function loadHTML2PDF() {
  // Check if already loaded
  if (window.html2pdf) {
    return window.html2pdf;
  }

  // Load from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
      } else {
        reject(new Error('html2pdf failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load html2pdf library'));
    document.head.appendChild(script);
  });
}

/**
 * Render preview of PDF layout without downloading
 * Returns array of page previews (HTML strings)
 *
 * @param {Array} cards - Array of card objects
 * @param {Object} options - Layout options
 * @returns {Array} Array of page HTML strings
 */
export function previewBatchLayout(cards, options = {}) {
  const theme = options.theme || 'classic-parchment';
  const autoLayout = options.autoLayout !== false;

  // Render all cards
  const renderedCards = [];
  for (const card of cards) {
    let html;
    if (card.type === 'creature') {
      html = renderCreatureCard(card.entity, { theme, ...card.options });
    } else if (card.type === 'item') {
      const htmls = renderItemCard(card.entity, { theme, ...card.options });
      html = Array.isArray(htmls) ? htmls[0] : htmls;
    }
    renderedCards.push({ html, size: 'standard' });
  }

  // Calculate layout
  const pageBlocks = autoLayout ? calculatePageLayout(renderedCards) : [renderedCards];

  // Generate preview HTML for each page
  return pageBlocks.map(block => {
    const pageHTML = `
      <div style="
        width: 210mm;
        height: 297mm;
        padding: 5mm;
        border: 1px solid #ccc;
        display: grid;
        grid-template-columns: repeat(${block.layout.columns}, 1fr);
        gap: 3mm;
        page-break-after: always;
      ">
        ${block.cards.map(c => c.html).join('\n')}
      </div>
    `;
    return pageHTML;
  });
}

/**
 * Export to Canvas (fallback/legacy support)
 *
 * @param {Object} creature - Creature to render
 * @param {Object} options - Canvas options
 * @returns {HTMLCanvasElement} Canvas element
 */
export function renderCreatureToCanvas(creature, options = {}) {
  // This is a placeholder for legacy canvas rendering support
  // The actual canvas rendering code would be in the old creature-renderer.js
  // For now, we render to HTML but could add canvas fallback here
  const html = renderCreatureCard(creature, options);

  // Would need to implement HTML-to-canvas conversion
  // For MVP, we just return a note that canvas is deprecated
  console.warn('Canvas rendering is deprecated. Use HTML2PDF instead.');

  return null;
}

export default {
  downloadCreatureCardPDF,
  downloadItemCardPDF,
  downloadBatchCardsPDF,
  previewBatchLayout,
  renderCreatureToCanvas,
};
