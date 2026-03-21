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
      padding: 0.2in;
      background: #f5f1e6;
      font-family: Georgia, serif;
      font-size: 10pt;
      color: #2c2416;
      border: 2px solid #8b8680;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .card-header {
      margin-bottom: 0.08in;
      border-bottom: 3px solid #6b5d4f;
      padding-bottom: 0.06in;
    }

    .card-name {
      font-size: 14pt;
      font-weight: bold;
      color: #1a1410;
      margin-bottom: 0.02in;
      line-height: 1.2;
    }

    .card-level-school {
      font-size: 9pt;
      color: #3d3935;
      font-style: italic;
      font-weight: 500;
    }

    /* Icon-based attributes row */
    .card-attributes-row {
      display: flex;
      justify-content: space-between;
      gap: 0.05in;
      margin-bottom: 0.08in;
      flex-shrink: 0;
    }

    .card-attribute {
      display: flex;
      align-items: center;
      gap: 0.04in;
      flex: 1;
      font-size: 8pt;
      min-width: 0;
    }

    .card-attribute-icon {
      font-size: 10pt;
      flex-shrink: 0;
    }

    .card-attribute-value {
      color: #2c2416;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Boxed mechanics section */
    .card-mechanics-box {
      background: #faf8f4;
      border: 1px solid #e8e3d8;
      border-radius: 2px;
      padding: 0.08in;
      margin-bottom: 0.08in;
      flex-shrink: 0;
    }

    .card-mechanics {
      margin-bottom: 0.08in;
      flex-shrink: 0;
    }

    .card-row {
      display: grid;
      grid-template-columns: 0.95fr 1.55fr;
      gap: 0.06in;
      margin-bottom: 0.05in;
      font-size: 8.5pt;
      line-height: 1.3;
    }

    .card-label {
      font-weight: 600;
      color: #5c5650;
    }

    .card-value {
      color: #2c2416;
    }

    .card-material-note {
      margin-left: 0.95in;
      font-size: 7.5pt;
      color: #5c5650;
      margin-bottom: 0.05in;
      line-height: 1.2;
    }

    .card-damage {
      margin-top: 0.06in;
      padding-top: 0.06in;
      border-top: 1px solid #e8e3d8;
    }

    .card-damage-label {
      font-weight: 600;
      color: #5c5650;
      display: inline;
      font-size: 8.5pt;
    }

    .card-damage-value {
      color: #2c2416;
      display: inline;
      margin-left: 0.03in;
      font-size: 8.5pt;
    }

    .card-divider {
      height: 1px;
      background: #d4cec4;
      margin: 0.06in 0;
      flex-shrink: 0;
    }

    .card-description {
      font-size: 8pt;
      line-height: 1.35;
      color: #2c2416;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.06in;
      margin-bottom: 0.02in;
    }

    .card-description br {
      line-height: 1.35;
    }

    /* Scaling/heightened section */
    .card-scaling-section {
      background: #f0e8dc;
      border: 1px solid #d4cec4;
      border-radius: 2px;
      padding: 0.06in;
      margin-top: 0.06in;
      flex-shrink: 0;
    }

    .card-scaling-header {
      font-size: 7pt;
      font-weight: 700;
      color: #5c5650;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.03in;
    }

    .card-scaling-text {
      font-size: 7.5pt;
      line-height: 1.3;
      color: #2c2416;
    }

    .card-scaling-text br {
      line-height: 1.3;
    }

    /* Tight spacing for density */
    .card-row:last-of-type {
      margin-bottom: 0;
    }
  `;
}
