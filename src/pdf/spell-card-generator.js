// PDF generator for spell cards.
// Generates spell cards for printing and exports them as a PDF file.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createSpellCardHTML } from './spell-card-templates.js';
import { getSpellCardStyles } from './spell-card-styles.js';
import { getCardDimensionsMm, getCardDimensionsPx, getCardPositionMm, getCardPageAndPosition } from './spell-card-layout.js';

/**
 * Generates a PDF file with spell cards, with automatic overflow handling.
 * @param {object[]} spells Array of spell objects to include
 * @returns {Promise<void>} Resolves when PDF download is initiated
 */
export async function generateSpellCardsPDF(spells) {
  if (!spells || spells.length === 0) {
    throw new Error('No spells selected for export');
  }

  try {
    // Build card data with overflow handling
    const cardDataList = [];
    for (const spell of spells) {
      const cards = await generateSpellCards(spell);
      cardDataList.push(...cards);
    }

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
      const { xMm, yMm } = getCardPositionMm(indexOnPage);
      const { widthMm, heightMm } = getCardDimensionsMm();

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xMm, yMm, widthMm, heightMm);
    }

    // Generate filename
    const totalCards = cardDataList.length;
    const countLabel = totalCards === 1 ? 'card' : 'cards';
    const filename = `spell-cards-${spells.length}-spells-${totalCards}-${countLabel}.pdf`;

    // Trigger download
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generates one or more spell cards for a spell, handling overflow.
 * If description overflows, creates continuation cards.
 * @param {object} spell The spell object from storage
 * @returns {Promise<object[]>} Array of card data objects with html property
 */
async function generateSpellCards(spell) {
  const html = createSpellCardHTML(spell);

  // Create temporary container to check for overflow
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  const { widthPx, heightPx } = getCardDimensionsPx();
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;

  // Add styles and HTML
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; }
    .spell-card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0.1in;
      background: #f5f1e6;
      font-family: Georgia, serif;
      font-size: 10pt;
      color: #2c2416;
      border: 2px solid #8b8680;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .card-description { flex: 1; overflow: hidden; }
  `;
  container.appendChild(style);
  container.innerHTML += html;
  document.body.appendChild(container);

  try {
    // Check if content overflows
    const descriptionElement = container.querySelector('.card-description');
    const hasOverflow = descriptionElement && descriptionElement.scrollHeight > descriptionElement.clientHeight;

    if (!hasOverflow) {
      // Single card is sufficient
      return [{ html }];
    }

    // Content overflows - create continuation cards
    const description = spell.description || '';
    const { mainDescription, continuation } = splitSpellDescription(description);

    // Create modified spell objects for continuation
    const cards = [];

    // First card with truncated description
    const firstSpell = { ...spell, description: mainDescription };
    cards.push({ html: createSpellCardHTML(firstSpell) });

    // Add continuation cards
    let remainingText = continuation;
    let cardNum = 2;
    while (remainingText.trim()) {
      const { mainDescription: contDesc, continuation: contNext } = splitSpellDescription(remainingText);
      const contSpell = { ...spell, description: contDesc, _continuation: cardNum };
      cards.push({ html: createSpellCardHTML(contSpell) });
      remainingText = contNext;
      cardNum++;
    }

    return cards;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Intelligently splits a spell description for multi-card handling.
 * Attempts to split at sentence boundaries to maintain readability.
 * @param {string} description The full description text
 * @param {number} targetLength Target length for first part (approximate)
 * @returns {object} { mainDescription, continuation }
 */
function splitSpellDescription(description, targetLength = 400) {
  if (!description || description.length <= targetLength) {
    return { mainDescription: description, continuation: '' };
  }

  // Find the last sentence boundary before targetLength
  let splitPoint = targetLength;
  const lastPeriod = description.lastIndexOf('.', targetLength);
  const lastNewline = description.lastIndexOf('\n', targetLength);

  // Prefer sentence boundary
  if (lastPeriod > targetLength * 0.6) {
    splitPoint = lastPeriod + 1;
  } else if (lastNewline > targetLength * 0.6) {
    splitPoint = lastNewline;
  }

  const mainDescription = description.substring(0, splitPoint).trim();
  const continuation = description.substring(splitPoint).trim();

  return { mainDescription, continuation };
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
