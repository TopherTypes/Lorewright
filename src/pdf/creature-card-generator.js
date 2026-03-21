// PDF generator for creature stat cards.
// Orchestrates creation of creature cards in three variants and two orientations.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createBasicCreatureCardHTML, createComplexCreatureCardHTML, createSpellcasterCardHTML } from './creature-card-templates.js';
import { createSpellCardHTML } from './spell-card-templates.js';
import { getCreatureCardStyles } from './creature-card-styles.js';
import { getSpellCardStyles } from './spell-card-styles.js';
import { getCreatureCardDimensions, getCreatureCardPosition, getCreatureCardPageAndPosition } from './creature-card-layout.js';
import { getCardDimensionsMm, getCardDimensionsPx, getCardPositionMm, getCardPageAndPosition } from './spell-card-layout.js';
import { getSpellById } from '../storage/spells.js';

/**
 * Generates a PDF file with creature stat cards in multiple variants.
 * If creatures have linked spells, includes full spell detail cards.
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

    let cardIndex = 0;
    let currentPage = 0;

    // Render each card as canvas image and add to PDF
    for (let i = 0; i < cardConfigs.length; i++) {
      const config = cardConfigs[i];
      const { pageNumber, indexOnPage, position } = getCreatureCardPageAndPosition(cardIndex, config.variant, config.orientation);

      // Add new page if needed (page 0 is created by jsPDF, add from page 1)
      if (pageNumber > 0 && indexOnPage === 0) {
        pdf.addPage();
        currentPage = pageNumber;
      }

      // Generate card HTML based on variant
      const html = await generateCardHTML(config);

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

      cardIndex++;

      // After creature card: generate spell detail cards if this is a spellcaster with linked spells
      if (config.variant === 'spellcaster' && hasLinkedSpells(config.creature)) {
        const spellCardHtmls = await generateSpellDetailsForCreature(config.creature);

        if (spellCardHtmls.length > 0) {
          // Render spell cards in grid layout and add pages to PDF
          const spellCardPages = await renderSpellDetailCardsToPages(spellCardHtmls);

          for (const pageData of spellCardPages) {
            pdf.addPage();

            // Add each card on the page
            for (const cardInfo of pageData) {
              const { canvas, xMm, yMm, widthMm, heightMm } = cardInfo;
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', xMm, yMm, widthMm, heightMm);
            }
          }
        }
      }
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
 * @returns {Promise<string>} Promise resolving to HTML string
 */
async function generateCardHTML(config) {
  const { creature, variant, orientation, imageUrl } = config;

  if (variant === 'basic') {
    return createBasicCreatureCardHTML(creature, imageUrl);
  } else if (variant === 'complex') {
    return createComplexCreatureCardHTML(creature, imageUrl, orientation);
  } else if (variant === 'spellcaster') {
    return await createSpellcasterCardHTML(creature, imageUrl, orientation);
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

/**
 * Checks if a creature has any linked spells.
 * @param {object} creature The creature to check
 * @returns {boolean} True if creature has spell IDs linked
 */
function hasLinkedSpells(creature) {
  const offence = creature.offence ?? {};
  return (
    (offence.spellsKnownIds?.length ?? 0) > 0 ||
    (offence.spellsPreparedIds?.length ?? 0) > 0 ||
    (offence.spellLikeAbilityIds?.length ?? 0) > 0
  );
}

/**
 * Generates spell detail cards for all linked spells in a creature.
 * @param {object} creature The creature with linked spells
 * @returns {Promise<string[]>} Array of HTML strings for spell detail cards
 */
async function generateSpellDetailsForCreature(creature) {
  const offence = creature.offence ?? {};
  const spellCards = [];

  // Helper to fetch and generate spell cards
  const generateCardsForIds = async (spellIds) => {
    for (const spellRef of (spellIds ?? [])) {
      try {
        const spell = await getSpellById(spellRef.spellId);
        if (spell) {
          spellCards.push(createSpellCardHTML(spell));
        }
      } catch (err) {
        console.warn(`Failed to fetch spell ${spellRef.spellId}:`, err);
      }
    }
  };

  // Generate cards for all spell types
  await generateCardsForIds(offence.spellsKnownIds);
  await generateCardsForIds(offence.spellsPreparedIds);
  await generateCardsForIds(offence.spellLikeAbilityIds);

  return spellCards;
}

/**
 * Renders spell detail cards in grid layout across multiple pages.
 * Mirrors the grid layout used by standalone spell exports.
 * @param {string[]} spellCardHtmls Array of HTML strings for spell cards
 * @returns {Promise<Array>} Array of pages, each containing array of card data {canvas, xMm, yMm, widthMm, heightMm}
 */
async function renderSpellDetailCardsToPages(spellCardHtmls) {
  const { widthPx, heightPx } = getCardDimensionsPx();
  const { widthMm, heightMm } = getCardDimensionsMm();
  const pages = [];

  // Group cards by page (6 cards per page)
  for (let i = 0; i < spellCardHtmls.length; i++) {
    const { pageNum, indexOnPage } = getCardPageAndPosition(i);

    // Create new page if needed
    if (indexOnPage === 0) {
      pages[pageNum] = [];
    }

    // Render individual card to canvas
    const canvas = await renderSpellCardToCanvas(spellCardHtmls[i], widthPx, heightPx);

    // Get position on page
    const { xMm, yMm } = getCardPositionMm(indexOnPage);

    pages[pageNum].push({
      canvas,
      xMm,
      yMm,
      widthMm,
      heightMm,
    });
  }

  return pages;
}

/**
 * Renders a single spell card HTML to canvas using html2canvas.
 * @param {string} html HTML string of the card
 * @param {number} widthPx Card width in pixels
 * @param {number} heightPx Card height in pixels
 * @returns {Promise<Canvas>} Canvas element
 */
async function renderSpellCardToCanvas(html, widthPx, heightPx) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${widthPx}px`;
  container.style.height = `${heightPx}px`;

  // Add styles
  const style = document.createElement('style');
  style.textContent = getSpellCardStyles();
  container.appendChild(style);

  // Add card HTML
  container.innerHTML += html;

  // Append to DOM temporarily
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      width: widthPx,
      height: heightPx,
      scale: 2,
      backgroundColor: '#f5f1e6',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}
