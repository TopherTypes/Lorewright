// PDF generator for spell cards.
// Generates spell cards for printing and exports them as a PDF file.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createSpellCardHTML } from './spell-card-templates.js';
import { getSpellCardStyles } from './spell-card-styles.js';
import { getCardDimensionsMm, getCardDimensionsPx, getCardPosition, getCardPageAndPosition } from './card-layout.js';

/**
 * Generates a PDF file with spell cards.
 * @param {object[]} spells Array of spell objects to include
 * @returns {Promise<void>} Resolves when PDF download is initiated
 */
export async function generateSpellCardsPDF(spells) {
  if (!spells || spells.length === 0) {
    throw new Error('No spells selected for export');
  }

  try {
    // Build card data
    const cardDataList = spells.map(spell => ({
      html: createSpellCardHTML(spell),
    }));

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
    const totalCards = cardDataList.length;
    const countLabel = totalCards === 1 ? 'spell' : 'spells';
    const filename = `spell-cards-${totalCards}-${countLabel}.pdf`;

    // Trigger download
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
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
  style.textContent = getSpellCardStyles();
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
