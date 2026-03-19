/**
 * Canvas Font Manager
 * Ensures fonts are loaded before canvas rendering
 */

export class CanvasFontManager {
  constructor() {
    this.loadedFonts = new Set();
    this.isLoading = false;
  }

  /**
   * Check if a font is available for use
   * @param {string} fontFamily
   * @returns {boolean}
   */
  isFontLoaded(fontFamily) {
    return this.loadedFonts.has(fontFamily);
  }

  /**
   * Ensure all required fonts are loaded
   * Uses FontFaceSet API if available, falls back to simple timeout
   * @returns {Promise<void>}
   */
  async ensureFonts() {
    // If already loading or loaded, return
    if (this.isLoading || (this.loadedFonts.size > 0 && document.fonts.size === 0)) {
      return;
    }

    this.isLoading = true;

    try {
      // Required fonts for themes
      const fontFamilies = [
        'Georgia',
        'Helvetica',
        'Arial',
      ];

      // Use FontFaceSet API if available
      if (document.fonts && document.fonts.load) {
        const fontPromises = fontFamilies.map(fontFamily => {
          // Try to load font at different sizes
          return Promise.allSettled([
            document.fonts.load(`400 16px "${fontFamily}"`),
            document.fonts.load(`700 16px "${fontFamily}"`),
          ]).then(() => {
            this.loadedFonts.add(fontFamily);
          });
        });

        await Promise.allSettled(fontPromises);
      }

      // Fallback: wait for fonts to be available (system fonts are usually instant)
      // This also catches fallback fonts
      await this.waitForFonts(fontFamilies);

      this.isLoading = false;
    } catch (error) {
      console.warn('Error loading fonts:', error);
      // Continue anyway - system fonts will be used
      this.isLoading = false;
    }
  }

  /**
   * Wait for fonts to be available with timeout
   * @param {string[]} fontFamilies
   * @param {number} timeout - milliseconds
   * @returns {Promise<void>}
   */
  async waitForFonts(fontFamilies, timeout = 2000) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkFonts = () => {
        if (document.fonts.ready) {
          fontFamilies.forEach(font => this.loadedFonts.add(font));
          resolve();
        } else if (Date.now() - startTime > timeout) {
          // Timeout - assume fonts are available (fallback to system fonts)
          fontFamilies.forEach(font => this.loadedFonts.add(font));
          resolve();
        } else {
          requestAnimationFrame(checkFonts);
        }
      };

      checkFonts();
    });
  }

  /**
   * Check if document fonts are ready
   * @returns {Promise<void>}
   */
  async waitForDocumentFonts() {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  }
}

// Global instance
export const fontManager = new CanvasFontManager();

/**
 * Ensure fonts are loaded (wrapper for easy use)
 * @returns {Promise<void>}
 */
export async function ensureCanvasFonts() {
  return fontManager.ensureFonts();
}

export default fontManager;
