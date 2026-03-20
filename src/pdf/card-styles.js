// CSS styles for card rendering via html2canvas.
// These styles ensure poker cards render correctly for PDF export.

/**
 * Returns CSS string for card styling.
 * Includes both identified and unidentified card styles.
 */
export function getCardStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Cinzel, Georgia, serif;
      font-size: 10px;
      background: transparent;
    }

    .card {
      width: 240px;
      height: 336px;
      background: #f5f1e6;
      border: 2px solid #3a3a3a;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-size: 10px;
      line-height: 1.4;
      color: #2a2a2a;
      overflow: hidden;
    }

    .card-image {
      width: 100%;
      height: 135px;
      background: #e8e4d8;
      border: 1px solid #999;
      border-radius: 2px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-name {
      font-size: 14px;
      font-weight: bold;
      font-family: Cinzel, Georgia, serif;
      margin-bottom: 6px;
      line-height: 1.2;
      color: #1a1a1a;
    }

    .card-name.unidentified {
      font-style: italic;
      font-weight: normal;
    }

    .card-meta {
      font-size: 9px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
      display: flex;
      justify-content: space-between;
      gap: 4px;
      flex-wrap: wrap;
    }

    .card-meta-item {
      display: inline-block;
      white-space: nowrap;
    }

    .card-properties {
      font-size: 9px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
    }

    .card-properties-line {
      margin: 2px 0;
      line-height: 1.2;
    }

    .card-effects {
      font-size: 8px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
      flex-shrink: 0;
    }

    .card-effects-title {
      font-weight: bold;
      font-size: 9px;
      margin-bottom: 2px;
    }

    .card-effects-list {
      margin-left: 8px;
      line-height: 1.3;
    }

    .card-effects-item {
      margin: 1px 0;
    }

    .card-description {
      font-size: 8px;
      flex: 1;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
      line-height: 1.4;
      overflow: hidden;
      text-align: justify;
    }

    .card-passphrase {
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      color: #5a4a2a;
      letter-spacing: 1px;
      flex-shrink: 0;
    }

    .card-passphrase::before,
    .card-passphrase::after {
      content: '✦';
      margin: 0 6px;
    }

    .card-charge-tracker {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 2px;
      margin-top: 4px;
      flex-shrink: 0;
    }

    .charge-box {
      width: 100%;
      aspect-ratio: 1;
      border: 1px solid #3a3a3a;
      background: #ffffff;
      border-radius: 1px;
    }

    /* Unidentified card specific */
    .card.unidentified .card-image {
      background: linear-gradient(135deg, #d8d4c8 0%, #e8e4d8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card.unidentified .card-image::after {
      content: '?';
      font-size: 60px;
      color: #999;
      font-weight: bold;
    }

    /* Print optimizations */
    @media print {
      .card {
        page-break-inside: avoid;
        box-shadow: none;
      }
    }
  `;
}

/**
 * Creates a style element with card CSS.
 * For use when rendering cards in the DOM temporarily.
 */
export function createCardStyleElement() {
  const style = document.createElement('style');
  style.textContent = getCardStyles();
  return style;
}
