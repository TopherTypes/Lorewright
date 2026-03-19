/**
 * Canvas to PDF Bridge
 * Converts canvas elements to jsPDF with proper DPI scaling
 */

import { getjsPDF } from './jspdf-loader.js';

// DPI scale factor: canvas is rendered at 300 DPI equivalent, but jsPDF uses 72 DPI
// To display the high-detail canvas at correct screen size, we multiply dimensions by 300/72
const DPI_SCALE = 300 / 72;

/**
 * Convert canvas to jsPDF document
 * @param {HTMLCanvasElement} canvas - Canvas element to convert
 * @param {object} options - Conversion options
 *   @param {string} options.filename - PDF filename (without extension)
 *   @param {number} options.cardWidth - Card width in mm (default: 63)
 *   @param {number} options.cardHeight - Card height in mm (default: 88)
 *   @param {number} options.margins - Margin around card in mm (default: 2)
 * @returns {Promise<jsPDF>} jsPDF instance
 */
export async function canvasToPDF(canvas, options = {}) {
  const {
    filename = 'card',
    cardWidth = 63,
    cardHeight = 88,
    margins = 2,
  } = options;

  // Get jsPDF constructor
  const jsPDF = await getjsPDF();

  // Create PDF with custom page size (card dimensions scaled for 300 DPI content)
  const pdf = new jsPDF({
    unit: 'mm',
    format: [
      (cardWidth + margins * 2) * DPI_SCALE,
      (cardHeight + margins * 2) * DPI_SCALE
    ],
    compress: true,
  });

  // Convert canvas to image
  const imgData = canvas.toDataURL('image/png', 0.95);

  // Add image to PDF (full page)
  // Scale dimensions by DPI_SCALE to account for 300 DPI canvas on 72 DPI PDF viewer
  pdf.addImage(
    imgData,
    'PNG',
    margins * DPI_SCALE,
    margins * DPI_SCALE,
    cardWidth * DPI_SCALE,
    cardHeight * DPI_SCALE
  );

  return pdf;
}

/**
 * Download single canvas as PDF
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename - PDF filename without .pdf extension
 * @param {object} options - Additional options
 */
export async function downloadCanvasPDF(canvas, filename = 'card', options = {}) {
  const pdf = await canvasToPDF(canvas, { ...options, filename });
  pdf.save(`${filename}.pdf`);
}

/**
 * Convert multiple canvases to single PDF with layout options
 * @param {HTMLCanvasElement[]} canvases - Array of canvas elements
 * @param {object} options
 *   @param {string} options.filename - PDF filename
 *   @param {number} options.cardWidth - Card width in mm
 *   @param {number} options.cardHeight - Card height in mm
 *   @param {'1x1'|'2x2'|'3x3'} options.layout - Cards per page (default: '2x2')
 *   @param {number} options.margin - Page margin in mm (default: 5)
 * @returns {Promise<jsPDF>}
 */
export async function canvasesToPDF(canvases, options = {}) {
  const {
    filename = 'cards',
    cardWidth = 63,
    cardHeight = 88,
    layout = '2x2',
    margin = 5,
  } = options;

  const jsPDF = await getjsPDF();

  // Parse layout
  const [cols, rows] = layout === '3x3' ? [3, 3] : layout === '1x1' ? [1, 1] : [2, 2];
  const cardsPerPage = cols * rows;

  // A4 dimensions
  const pageWidth = 210;
  const pageHeight = 297;

  // Calculate card dimensions on page
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - 2 * margin;

  // Calculate gaps to distribute space evenly
  const totalCardWidth = cols * cardWidth;
  const totalCardHeight = rows * cardHeight;

  const gapX = (availableWidth - totalCardWidth) / (cols + 1);
  const gapY = (availableHeight - totalCardHeight) / (rows + 1);

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

    const x = margin + gapX + col * (cardWidth + gapX);
    const y = margin + gapY + row * (cardHeight + gapY);

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 0.95);

    // Add to PDF (keep original dimensions for batch layout on A4)
    pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);

    cardIndex++;
  }

  return pdf;
}

/**
 * Download multiple canvases as single PDF
 * @param {HTMLCanvasElement[]} canvases
 * @param {string} filename
 * @param {object} options
 */
export async function downloadCanvasesPDF(canvases, filename = 'cards', options = {}) {
  const pdf = await canvasesToPDF(canvases, { ...options, filename });
  pdf.save(`${filename}.pdf`);
}

export default {
  canvasToPDF,
  downloadCanvasPDF,
  canvasesToPDF,
  downloadCanvasesPDF,
};
