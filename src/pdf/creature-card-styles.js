// CSS styles for creature card rendering via html2canvas.
// Supports three variants: basic (poker), complex (index), spellcaster (index).

/**
 * Returns CSS string for creature card styling.
 * Includes styles for all three variants and both orientations.
 */
export function getCreatureCardStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Cinzel, Georgia, serif;
      background: transparent;
    }

    .creature-card {
      background: #f5f1e6;
      border: 2px solid #3a3a3a;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      padding: 12px;
      font-size: 10px;
      line-height: 1.4;
      color: #2a2a2a;
      overflow: hidden;
    }

    /* ── Basic Card Variant (Poker Size) ────────────────────── */
    .creature-card.basic {
      width: 240px;
      height: 336px;
    }

    /* ── Complex/Spellcaster Variants (Index Size) ────────────── */
    .creature-card.complex,
    .creature-card.spellcaster {
      padding: 14px;
    }

    .creature-card.complex.landscape,
    .creature-card.spellcaster.landscape {
      width: 384px;
      height: 576px;
    }

    .creature-card.complex.portrait,
    .creature-card.spellcaster.portrait {
      width: 576px;
      height: 384px;
    }

    /* ── Common Elements ────────────────────────────────────────── */

    .card-image {
      width: 100%;
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

    .creature-card.basic .card-image {
      height: 80px;
    }

    .creature-card.complex .card-image,
    .creature-card.spellcaster .card-image {
      height: 150px;
    }

    .creature-card.spellcaster.portrait .card-image {
      height: 120px;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .creature-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 6px;
      line-height: 1.2;
      color: #1a1a1a;
    }

    .creature-card.basic .creature-name {
      font-size: 12px;
    }

    .creature-meta {
      font-size: 9px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ccc;
      line-height: 1.3;
    }

    .creature-card.basic .creature-meta {
      font-size: 8px;
      margin-bottom: 6px;
      padding-bottom: 4px;
    }

    /* ── Section Headers (Complex/Spellcaster Only) ───────────── */
    .section-header {
      font-size: 9px;
      font-weight: bold;
      margin-top: 8px;
      margin-bottom: 4px;
      letter-spacing: 1px;
      color: #3a3a3a;
    }

    .section-header::before {
      content: '─ ';
      margin-right: 4px;
    }

    .section-header::after {
      content: ' ─';
      margin-left: 4px;
    }

    .creature-card.spellcaster.portrait .section-header {
      font-size: 8px;
      margin-top: 6px;
      margin-bottom: 3px;
    }

    /* ── Combat Stats (Complex Only) ────────────────────────────── */
    .defense-block,
    .offense-block,
    .statistics-block,
    .abilities-block,
    .spellcasting-block {
      font-size: 9px;
      margin-bottom: 6px;
      padding-bottom: 6px;
      line-height: 1.3;
    }

    .creature-card.complex .defense-block,
    .creature-card.complex .offense-block,
    .creature-card.complex .statistics-block,
    .creature-card.complex .abilities-block {
      border-bottom: 1px solid #ccc;
    }

    .creature-card.spellcaster .spellcasting-block,
    .creature-card.spellcaster .abilities-block {
      border-bottom: 1px solid #ccc;
    }

    .stat-line {
      margin: 2px 0;
      line-height: 1.2;
    }

    .stat-label {
      font-weight: bold;
      display: inline-block;
      margin-right: 4px;
      min-width: 50px;
    }

    /* ── List Items ────────────────────────────────────────────── */
    .ability-item,
    .feat-item,
    .skill-item,
    .spell-item {
      margin: 2px 0 2px 12px;
      line-height: 1.2;
    }

    .ability-item::before,
    .feat-item::before,
    .spell-item::before {
      content: '• ';
      margin-left: -8px;
      margin-right: 4px;
    }

    .spell-level {
      font-weight: bold;
      font-size: 8px;
      margin-top: 3px;
      margin-bottom: 2px;
      margin-left: 0;
    }

    .spell-level::before {
      content: '';
    }

    .spell-item {
      font-size: 8px;
      margin-left: 16px;
    }

    .spell-frequency {
      font-size: 8px;
      font-style: italic;
      margin-left: 0;
    }

    .spell-frequency::before {
      content: '';
    }

    /* ── Spellcaster Specific ──────────────────────────────────── */
    .spellcasting-header {
      font-size: 9px;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .spell-dc {
      font-weight: bold;
    }

    .concentration-bonus {
      font-weight: bold;
    }

    /* ── Ability Scores ────────────────────────────────────────── */
    .ability-scores {
      font-size: 8px;
      line-height: 1.3;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 4px;
    }

    .creature-card.basic .ability-scores {
      font-size: 7px;
      margin-top: 4px;
    }

    .creature-card.complex .ability-scores,
    .creature-card.spellcaster .ability-scores {
      grid-template-columns: 1fr 1fr 1fr;
      margin-top: 2px;
    }

    .ability-score {
      white-space: nowrap;
    }

    .ability-abbr {
      font-weight: bold;
      margin-right: 2px;
    }

    /* ── Basic Card Specific Styles ────────────────────────────── */
    .creature-card.basic .content-section {
      font-size: 8px;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ccc;
    }

    .creature-card.basic .combat-stats {
      font-size: 9px;
      font-weight: bold;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ccc;
    }

    .creature-card.basic .special-qualities {
      font-size: 7px;
      line-height: 1.2;
    }

    /* ── Print Optimizations ───────────────────────────────────── */
    @media print {
      .creature-card {
        page-break-inside: avoid;
        box-shadow: none;
      }
    }
  `;
}

/**
 * Creates a style element with creature card CSS.
 * For use when rendering cards in the DOM temporarily.
 */
export function createCreatureCardStyleElement() {
  const style = document.createElement('style');
  style.textContent = getCreatureCardStyles();
  return style;
}
