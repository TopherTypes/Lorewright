// PDF generator for item cards.
// Orchestrates the creation of poker-sized item cards and PDF export.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createIdentifiedCardHTML, createUnidentifiedCardHTML } from './card-templates.js';
import { getCardStyles } from './card-styles.js';
import { getCardDimensionsMm, getCardDimensionsPx, getCardPosition, getCardPageAndPosition } from './card-layout.js';

/**
 * Generates a PDF file with poker-sized item cards.
 * @param {object[]} items Array of item objects to include
 * @param {object} options Export options
 * @param {boolean} options.includeUnidentified Include unidentified card variants
 * @returns {Promise<void>} Resolves when PDF download is initiated
 */
export async function generateItemCardsPDF(items, options = {}) {
  const { includeUnidentified = true } = options;

  if (!items || items.length === 0) {
    throw new Error('No items selected for export');
  }

  try {
    // Build card data: list of {html, isUnidentified}
    const cardDataList = buildCardDataList(items, includeUnidentified);

    if (cardDataList.length === 0) {
      throw new Error('No cards to generate');
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    // Render each card as canvas image and add to PDF
    for (let i = 0; i < cardDataList.length; i++) {
      const { html } = cardDataList[i];
      const { pageNum, indexOnPage } = getCardPageAndPosition(i);

      // Add new page if needed (page 0 is created by jsPDF, add from page 1)
      if (pageNum > 0 && indexOnPage === 0) {
        pdf.addPage();
      }

      // Render card HTML to canvas
      const canvas = await renderCardToCanvas(html);

      // Add canvas image to PDF at correct position
      const { xMm, yMm } = getCardPosition(indexOnPage);
      const { widthMm, heightMm } = getCardDimensionsMm();

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xMm, yMm, widthMm, heightMm);
    }

    // Generate filename
    const itemCount = items.length;
    const unidCount = cardDataList.filter(c => c.isUnidentified).length;
    const totalCards = itemCount + unidCount;
    const countLabel = totalCards === 1 ? 'item' : 'items';
    const filename = `item-cards-${totalCards}-${countLabel}.pdf`;

    // Trigger download
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Builds a list of card HTML and metadata.
 * Includes both identified and unidentified variants if applicable.
 * @param {object[]} items Items to export
 * @param {boolean} includeUnidentified Whether to include unidentified variants
 * @returns {object[]} Array of {html, isUnidentified} objects
 */
function buildCardDataList(items, includeUnidentified) {
  const cards = [];

  for (const item of items) {
    // Identified card
    const identifiedHtml = createIdentifiedCardHTML(item);
    cards.push({
      html: identifiedHtml,
      isUnidentified: false,
    });

    // Unidentified card (if applicable)
    if (includeUnidentified && item.identified && (item.unidentifiedName || item.unidentifiedDescription)) {
      const unidentifiedHtml = createUnidentifiedCardHTML(item);
      cards.push({
        html: unidentifiedHtml,
        isUnidentified: true,
      });
    }
  }

  return cards;
}

/**
 * Renders card HTML to a canvas using html2canvas.
 * @param {string} html HTML string of the card
 * @returns {Promise<Canvas>} Canvas element
 */
async function renderCardToCanvas(html) {
  const { widthPx, heightPx } = getCardDimensionsPx();

  // Create temporary container with card styles
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;

  // Add styles to container
  const style = document.createElement('style');
  style.textContent = getCardStyles();
  container.appendChild(style);

  // Add card HTML
  container.innerHTML += html;

  // Append to DOM temporarily
  document.body.appendChild(container);

  try {
    // Render to canvas
    const canvas = await html2canvas(container, {
      width: widthPx,
      height: heightPx,
      scale: 2, // Higher quality
      backgroundColor: '#f5f1e6',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas;
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
