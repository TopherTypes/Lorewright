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
      padding: 0.25in;
      background: #f5f1e6;
      font-family: Georgia, serif;
      font-size: 9pt;
      color: #2c2416;
      border: 1px solid #8b8680;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .card-header {
      margin-bottom: 0.15in;
      border-bottom: 2px solid #8b8680;
      padding-bottom: 0.1in;
    }

    .card-name {
      font-size: 13pt;
      font-weight: bold;
      color: #1a1410;
      margin-bottom: 0.05in;
    }

    .card-level-school {
      font-size: 8pt;
      color: #5c5650;
      font-style: italic;
    }

    .card-mechanics {
      margin-bottom: 0.15in;
      flex-shrink: 0;
    }

    .card-row {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 0.1in;
      margin-bottom: 0.08in;
      font-size: 8.5pt;
    }

    .card-label {
      font-weight: bold;
      color: #3d3935;
    }

    .card-value {
      color: #2c2416;
    }

    .card-material-note {
      margin-left: 1.5in;
      font-size: 8pt;
      color: #5c5650;
      margin-bottom: 0.08in;
    }

    .card-damage {
      margin-top: 0.08in;
      padding-top: 0.08in;
      border-top: 1px solid #d4cec4;
    }

    .card-damage-label {
      font-weight: bold;
      color: #3d3935;
      display: inline;
    }

    .card-damage-value {
      color: #2c2416;
      display: inline;
      margin-left: 0.05in;
    }

    .card-divider {
      height: 1px;
      background: #d4cec4;
      margin: 0.12in 0;
      flex-shrink: 0;
    }

    .card-description {
      font-size: 8pt;
      line-height: 1.3;
      color: #2c2416;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.05in;
    }

    .card-description br {
      line-height: 1.2;
    }
  `;
}
