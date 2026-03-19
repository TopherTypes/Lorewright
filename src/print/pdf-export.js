// PDF export module — generates downloadable PDF files for creature and item cards.
// Uses canvas rendering + jsPDF for pixel-perfect card generation.

import { renderCreatureCard as renderCreatureCardCanvas } from '../rendering/creature-renderer.js';
import { renderItemCard as renderItemCardCanvas } from '../rendering/item-renderer.js';
import { getTheme } from '../rendering/card-styles.js';
import { downloadCanvasPDF } from '../export/canvas-to-pdf.js';
import { ensureCanvasFonts } from '../rendering/canvas-font-manager.js';

// ── Card geometry (mm) ───────────────────────────────────────────────────────

const CARD_W = 63;
const CARD_H = 88;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a creature stat card as a PDF and triggers a browser download.
 * Uses canvas rendering for pixel-perfect output.
 * @param {object} derived - Output of deriveCreature()
 * @param {string} themeName - Theme name (default: 'classic')
 */
export async function downloadCreatureCardPDF(derived, themeName = 'classic') {
  try {
    // Ensure fonts are loaded
    await ensureCanvasFonts();

    const theme = getTheme(themeName);
    const canvas = renderCreatureCardCanvas(derived, theme);

    const filename = sanitiseFilename(derived.name || 'creature') + '-card';
    await downloadCanvasPDF(canvas, filename, {
      cardWidth: CARD_W,
      cardHeight: CARD_H,
    });
  } catch (error) {
    console.error('Error generating creature PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

/**
 * Generates magic item card(s) as a PDF and triggers a browser download.
 * @param {object} item - A stored item object
 * @param {string} themeName - Theme name (default: 'classic')
 */
export async function downloadItemCardPDF(item, themeName = 'classic') {
  try {
    // Ensure fonts are loaded
    await ensureCanvasFonts();

    const theme = getTheme(themeName);
    const canvas = renderItemCardCanvas(item, theme);

    const filename = sanitiseFilename(item.name || 'item') + '-card';
    await downloadCanvasPDF(canvas, filename, {
      cardWidth: CARD_W,
      cardHeight: CARD_H,
    });
  } catch (error) {
    console.error('Error generating item PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

// ── Helper functions ─────────────────────────────────────────────────────────

/**
 * Sanitizes a filename by removing special characters and replacing spaces with hyphens.
 * @param {string} name
 * @returns {string}
 */
function sanitiseFilename(name) {
  return String(name).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}
