/**
 * Base Canvas Renderer
 * Core utilities for drawing text, borders, and sections on canvas
 */

export class CanvasRenderer {
  /**
   * Measure text width on canvas
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} fontSize - in pixels
   * @param {string} fontFamily
   * @returns {number} width in pixels
   */
  static measureText(ctx, text, fontSize, fontFamily) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
  }

  /**
   * Wrap text into lines that fit within maxWidth
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} maxWidth - in pixels
   * @param {number} fontSize
   * @param {string} fontFamily
   * @returns {string[]} array of lines
   */
  static wrapText(ctx, text, maxWidth, fontSize, fontFamily) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = ctx.measureText(testLine).width;

      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Draw text block with word wrapping
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x - starting x position
   * @param {number} y - starting y position
   * @param {number} maxWidth
   * @param {number} lineHeight - in pixels
   * @param {number} fontSize
   * @param {string} fontFamily
   * @param {string} color - text color
   * @returns {number} y position after text block
   */
  static drawTextBlock(ctx, text, x, y, maxWidth, lineHeight, fontSize, fontFamily, color) {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;

    const lines = this.wrapText(ctx, text, maxWidth, fontSize, fontFamily);
    let currentY = y;

    for (const line of lines) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }

    return currentY;
  }

  /**
   * Draw a simple border rectangle
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} thickness - in pixels
   * @param {string} color
   */
  static drawBorder(ctx, x, y, width, height, thickness, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.strokeRect(x + thickness / 2, y + thickness / 2, width - thickness, height - thickness);
  }

  /**
   * Draw a filled rectangle
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {string} color
   */
  static fillRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * Draw a horizontal line (rule/divider)
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x1 - start x
   * @param {number} x2 - end x
   * @param {number} y
   * @param {number} thickness - in pixels
   * @param {string} color
   */
  static drawLine(ctx, x1, x2, y, thickness, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  /**
   * Draw section header with label and optional underline
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} label
   * @param {number} x
   * @param {number} y
   * @param {number} fontSize
   * @param {string} fontFamily
   * @param {string} color
   * @param {boolean} drawLine - draw underline
   * @param {number} lineWidth - width of section area
   * @param {string} lineColor
   * @returns {number} y position after header
   */
  static drawSectionHeader(ctx, label, x, y, fontSize, fontFamily, color, drawLine = true, lineWidth = null, lineColor = null) {
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillText(label, x, y + fontSize);

    let nextY = y + fontSize + 4;

    if (drawLine && lineColor && lineWidth) {
      this.drawLine(ctx, x, x + lineWidth, nextY, 0.5, lineColor);
      nextY += 4;
    }

    return nextY;
  }

  /**
   * Measure text height for a given font size
   * @param {number} fontSize
   * @returns {number} approximate height
   */
  static getTextHeight(fontSize) {
    return fontSize * 1.2; // Approximation for line height
  }

  /**
   * Draw text with specific formatting (bold, italic, etc.)
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {number} fontSize
   * @param {string} fontFamily
   * @param {string} color
   * @param {string} weight - '400', '700', etc.
   * @param {boolean} italic
   */
  static drawText(ctx, text, x, y, fontSize, fontFamily, color, weight = '400', italic = false) {
    const fontStyle = italic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${weight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  /**
   * Escape HTML special characters for safe text rendering
   * (Not needed for canvas, but useful for logging/debugging)
   * @param {string} text
   * @returns {string}
   */
  static escapeText(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Truncate text to fit within maxWidth
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} maxWidth
   * @param {number} fontSize
   * @param {string} fontFamily
   * @param {string} suffix - text to append if truncated (default: '...')
   * @returns {string}
   */
  static truncateText(ctx, text, maxWidth, fontSize, fontFamily, suffix = '...') {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const fullWidth = ctx.measureText(text).width;

    if (fullWidth <= maxWidth) {
      return text;
    }

    const suffixWidth = ctx.measureText(suffix).width;
    const availableWidth = maxWidth - suffixWidth;
    let truncated = text;

    while (truncated.length > 0 && ctx.measureText(truncated).width > availableWidth) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + suffix;
  }
}

export default CanvasRenderer;
