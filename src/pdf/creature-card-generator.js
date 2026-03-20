// PDF generator for creature stat cards.
// Orchestrates creation of creature cards in three variants and two orientations.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createBasicCreatureCardHTML, createComplexCreatureCardHTML, createSpellcasterCardHTML } from './creature-card-templates.js';
import { getCreatureCardStyles } from './creature-card-styles.js';
import { getCreatureCardDimensions, getCreatureCardPosition, getCreatureCardPageAndPosition } from './creature-card-layout.js';

/**
 * Generates a PDF file with creature stat cards in multiple variants.
 * @param {array} cardConfigs Array of {creature, variant, orientation, imageUrl}
 *   - creature: creature object (should be derived with deriveCreature())
 *   - variant: 'basic' | 'complex' | 'spellcaster'
 *   - orientation: 'landscape' | 'portrait' (ignored for basic)
 *   - imageUrl: optional image URL
 * @returns {Promise<void>} Resolves when PDF download is initiated
 */
export async function generateCreatureCardsPDF(cardConfigs) {
  if (!cardConfigs || cardConfigs.length === 0) {
    throw new Error('No creatures selected for export');
  }

  try {
    // Create PDF (letter size, portrait orientation)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    // Render each card as canvas image and add to PDF
    for (let i = 0; i < cardConfigs.length; i++) {
      const config = cardConfigs[i];
      const { pageNumber, indexOnPage, position } = getCreatureCardPageAndPosition(i, config.variant, config.orientation);

      // Add new page if needed (page 0 is created by jsPDF, add from page 1)
      if (pageNumber > 0 && indexOnPage === 0) {
        pdf.addPage();
      }

      // Generate card HTML based on variant
      const html = generateCardHTML(config);

      // Render card HTML to canvas
      const canvas = await renderCardToCanvas(html, config.variant, config.orientation);

      // Add canvas image to PDF at correct position
      const dims = getCreatureCardDimensions(config.variant, config.orientation);
      const widthMm = dims.widthIn * 25.4;
      const heightMm = dims.heightIn * 25.4;
      const xMm = position.x / 96 * 25.4;
      const yMm = position.y / 96 * 25.4;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xMm, yMm, widthMm, heightMm);
    }

    // Generate filename
    const creatureCount = new Set(cardConfigs.map(c => c.creature.meta.id)).size;
    const totalCards = cardConfigs.length;
    const countLabel = creatureCount === 1 ? 'creature' : 'creatures';
    const filename = `creature-cards-${totalCards}-${countLabel}.pdf`;

    // Trigger download
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generate HTML for a card based on its configuration.
 * @param {object} config {creature, variant, orientation, imageUrl}
 * @returns {string} HTML string
 */
function generateCardHTML(config) {
  const { creature, variant, orientation, imageUrl } = config;

  if (variant === 'basic') {
    return createBasicCreatureCardHTML(creature, imageUrl);
  } else if (variant === 'complex') {
    return createComplexCreatureCardHTML(creature, imageUrl, orientation);
  } else if (variant === 'spellcaster') {
    return createSpellcasterCardHTML(creature, imageUrl, orientation);
  } else {
    throw new Error(`Unknown variant: ${variant}`);
  }
}

/**
 * Renders card HTML to a canvas using html2canvas.
 * @param {string} html HTML string of the card
 * @param {string} variant Card variant (for sizing)
 * @param {string} orientation Orientation for index cards
 * @returns {Promise<Canvas>} Canvas element
 */
async function renderCardToCanvas(html, variant, orientation) {
  const dims = getCreatureCardDimensions(variant, orientation);
  const { width: widthPx, height: heightPx } = dims;

  // Create temporary container with card styles
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;

  // Add styles to container
  const style = document.createElement('style');
  style.textContent = getCreatureCardStyles();
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
