/**
 * Batch PDF Export
 * Aggregate multiple creature/item cards into a single PDF
 */

import { renderCreatureCard } from '../rendering/creature-renderer.js';
import { renderItemCard, renderUnidentifiedCard } from '../rendering/item-renderer.js';
import { deriveCreature } from '../entities/creature.js';
import { getTheme } from '../rendering/card-styles.js';
import { ensureCanvasFonts } from '../rendering/canvas-font-manager.js';
import { getjsPDF } from './jspdf-loader.js';

/**
 * Batch export entities to PDF
 * @param {object[]} entities - Array of creature or item entities
 * @param {object} options
 *   @param {string} options.entityType - 'creature' or 'item'
 *   @param {string} options.theme - Theme name (default: 'classic')
 *   @param {'1x1'|'2x2'|'3x3'} options.layout - Cards per page (default: '2x2')
 *   @param {string} options.filename - PDF filename without extension
 * @returns {Promise<jsPDF>}
 */
export async function batchExportAsPDF(entities, options = {}) {
  const {
    entityType = 'creature',
    theme: themeName = 'classic',
    layout = '2x2',
    filename = 'batch-export',
  } = options;

  // Ensure fonts are loaded
  await ensureCanvasFonts();

  const theme = getTheme(themeName);

  // Render all entities to canvases
  const canvases = [];

  for (const entity of entities) {
    let canvas;

    if (entityType === 'creature') {
      const derived = deriveCreature(entity);
      canvas = renderCreatureCard(derived, theme);
    } else if (entityType === 'item') {
      // For unidentified items, render identified variant (for batch export)
      canvas = renderItemCard(entity, theme);
    } else {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    canvases.push(canvas);
  }

  // Aggregate canvases to PDF
  return aggregateCanvasToPDF(canvases, {
    layout,
    filename,
  });
}

/**
 * Aggregate canvas array to single PDF
 * @param {HTMLCanvasElement[]} canvases
 * @param {object} options
 *   @param {'1x1'|'2x2'|'3x3'} options.layout
 *   @param {string} options.filename
 *   @param {number} options.cardWidth - in mm (default: 63)
 *   @param {number} options.cardHeight - in mm (default: 88)
 *   @param {number} options.pageMargin - in mm (default: 5)
 * @returns {Promise<jsPDF>}
 */
export async function aggregateCanvasToPDF(canvases, options = {}) {
  const {
    layout = '2x2',
    filename = 'cards',
    cardWidth = 63,
    cardHeight = 88,
    pageMargin = 5,
  } = options;

  const jsPDF = await getjsPDF();

  // Parse layout
  const layoutMap = {
    '1x1': { cols: 1, rows: 1 },
    '2x2': { cols: 2, rows: 2 },
    '3x3': { cols: 3, rows: 3 },
  };

  const { cols = 2, rows = 2 } = layoutMap[layout] || layoutMap['2x2'];
  const cardsPerPage = cols * rows;

  // A4 dimensions
  const pageWidth = 210;
  const pageHeight = 297;

  // Calculate available space
  const availableWidth = pageWidth - 2 * pageMargin;
  const availableHeight = pageHeight - 2 * pageMargin;

  // Calculate gaps
  const gapX = (availableWidth - cols * cardWidth) / (cols + 1);
  const gapY = (availableHeight - rows * cardHeight) / (rows + 1);

  // Create PDF
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Add cards
  let cardIndex = 0;

  for (const canvas of canvases) {
    // Add new page if needed
    if (cardIndex > 0 && cardIndex % cardsPerPage === 0) {
      pdf.addPage();
    }

    // Calculate position on page
    const posOnPage = cardIndex % cardsPerPage;
    const col = posOnPage % cols;
    const row = Math.floor(posOnPage / cols);

    const x = pageMargin + gapX + col * (cardWidth + gapX);
    const y = pageMargin + gapY + row * (cardHeight + gapY);

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 0.95);

    // Add to PDF
    pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);

    cardIndex++;
  }

  return pdf;
}

/**
 * Download batch export PDF
 * @param {object[]} entities
 * @param {object} options - Same as batchExportAsPDF
 */
export async function downloadBatchPDF(entities, options = {}) {
  const pdf = await batchExportAsPDF(entities, options);
  pdf.save(`${options.filename || 'batch-export'}.pdf`);
}

export default batchExportAsPDF;
