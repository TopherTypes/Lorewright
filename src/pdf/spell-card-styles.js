// CSS styles for spell cards.
// Optimized for printing and PDF rendering via html2canvas.

export function getSpellCardStyles() {
  return `
    * {
      box-sizing: border-box;
    }

    .spell-card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0.35in;
      background: #f5f1e6;
      font-family: Georgia, serif;
      font-size: 10pt;
      color: #2c2416;
      border: 2px solid #8b8680;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .card-header {
      margin-bottom: 0.2in;
      border-bottom: 3px solid #6b5d4f;
      padding-bottom: 0.15in;
      margin-bottom: 0.2in;
    }

    .card-name {
      font-size: 16pt;
      font-weight: bold;
      color: #1a1410;
      margin-bottom: 0.08in;
      line-height: 1.2;
    }

    .card-level-school {
      font-size: 10pt;
      color: #3d3935;
      font-style: italic;
      font-weight: 500;
    }

    .card-mechanics {
      margin-bottom: 0.18in;
      flex-shrink: 0;
    }

    .card-row {
      display: grid;
      grid-template-columns: 1.2fr 1.8fr;
      gap: 0.08in;
      margin-bottom: 0.1in;
      font-size: 10pt;
      line-height: 1.4;
    }

    .card-label {
      font-weight: 600;
      color: #5c5650;
    }

    .card-value {
      color: #2c2416;
    }

    .card-material-note {
      margin-left: 1.2in;
      font-size: 9pt;
      color: #5c5650;
      margin-bottom: 0.08in;
      line-height: 1.3;
    }

    .card-damage {
      margin-top: 0.1in;
      padding-top: 0.1in;
      border-top: 2px solid #d4cec4;
    }

    .card-damage-label {
      font-weight: 600;
      color: #5c5650;
      display: inline;
    }

    .card-damage-value {
      color: #2c2416;
      display: inline;
      margin-left: 0.05in;
    }

    .card-divider {
      height: 2px;
      background: #d4cec4;
      margin: 0.15in 0;
      flex-shrink: 0;
    }

    .card-description {
      font-size: 10pt;
      line-height: 1.5;
      color: #2c2416;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.08in;
    }

    .card-description br {
      line-height: 1.5;
    }

    /* Additional enhancements for better readability */
    .card-row:first-child {
      margin-top: 0.05in;
    }

    .card-row:last-of-type {
      margin-bottom: 0.05in;
    }

    /* Improve visual separation of sections */
    .card-mechanics .card-row:nth-child(3) {
      padding-bottom: 0.05in;
      border-bottom: 1px solid #e8e3d8;
      margin-bottom: 0.1in;
    }

    /* Better spacing around divider */
    .card-divider {
      margin: 0.2in 0;
    }
  `;
}
