/**
 * Unified Card Renderer
 *
 * Core rendering engine that produces styled HTML for creature and item cards.
 * Single source of truth for all card rendering logic.
 *
 * Supports:
 * - All 5 creature layout templates (melee, spellcaster, swarm, boss, construct)
 * - All 7 item layout templates (potion, scroll, wand, staff, weapon, armor, wondrous)
 * - All 4 card sizes (small, standard, large, extended)
 * - All 4 built-in themes (classic-parchment, modern-dark, minimalist, fantasy-gold)
 * - Automatic content prioritization and truncation
 * - Responsive typography based on card size
 *
 * Output: Semantic HTML string that can be rendered to screen or PDF
 */

import {
  selectCreatureLayoutAndSize,
  selectItemLayoutAndSize,
  getCreatureLayout,
  getItemLayout,
} from './card-layout-system.js';

import {
  autoDetectCreatureCardSize,
  autoDetectItemCardSize,
  getCardDimensions,
  getCardSizeInMM,
} from './card-size-detector.js';

import { CardTheme, getTheme } from './card-theme-system.js';

/**
 * UnifiedCardRenderer class
 *
 * Main rendering interface for cards
 */
export class UnifiedCardRenderer {
  /**
   * Create a new renderer with optional default options
   *
   * @param {Object} options - Default options
   * @param {string} options.theme - Default theme name
   * @param {boolean} options.autoSize - Auto-detect card size (default: true)
   */
  constructor(options = {}) {
    this.defaultTheme = options.theme || 'classic-parchment';
    this.autoSize = options.autoSize !== false;
  }

  /**
   * Render a creature card to HTML
   *
   * @param {Object} creature - Derived creature entity
   * @param {Object} options - Rendering options
   * @param {string} options.theme - Theme name (default: classic-parchment)
   * @param {string} options.size - Force card size (auto-detect if omitted)
   * @param {string} options.layout - Force layout template (auto-detect if omitted)
   * @returns {string} HTML string (safe for innerHTML)
   */
  renderCreatureCard(creature, options = {}) {
    // Merge with defaults
    const opts = {
      theme: options.theme || this.defaultTheme,
      ...options,
    };

    // Determine layout and size
    const auto = selectCreatureLayoutAndSize(creature);
    let layout = opts.layout || auto.layout;
    let size = opts.size || auto.size;

    // Auto-detect if size would overflow
    if (this.autoSize && !opts.size) {
      size = autoDetectCreatureCardSize(creature, size, layout);
    }

    // Get theme
    const theme = getTheme(opts.theme);

    // Build HTML
    return this._buildCreatureHTML(creature, layout, size, theme);
  }

  /**
   * Render an item card to HTML
   *
   * @param {Object} item - Item entity
   * @param {Object} options - Rendering options
   * @param {boolean} options.identified - For unidentified items, render GM copy (true) or player copy (false)
   * @returns {string|Array} HTML string for single card, or array of [gmCopy, playerCopy] for unidentified
   */
  renderItemCard(item, options = {}) {
    const opts = {
      theme: options.theme || this.defaultTheme,
      ...options,
    };

    // Determine layout and size
    const auto = selectItemLayoutAndSize(item);
    const layout = opts.layout || auto.layout;
    const size = opts.size || 'standard'; // items typically standard

    // Get theme
    const theme = getTheme(opts.theme);

    // Unidentified items: return both GM and player cards
    if (item.identified === false && !opts.forceIdentified) {
      const gmCopy = this._buildItemHTML(item, layout, size, theme, true);
      const playerCopy = this._buildItemHTML(item, layout, size, theme, false);
      return [gmCopy, playerCopy];
    }

    // Identified item: single card
    return this._buildItemHTML(item, layout, size, theme, true);
  }

  /**
   * Internal: Build creature card HTML
   * @private
   */
  _buildCreatureHTML(creature, layout, size, theme) {
    const layoutDef = getCreatureLayout(layout);
    const dim = getCardDimensions(size);

    // CSS classes
    const classes = [
      'card-container',
      `card-size-${size}`,
      `card-layout-${layout}`,
      `card-theme-${theme.name}`,
    ].join(' ');

    // Start building HTML
    const parts = [];

    // CSS variables
    const styleAttr = `style="
      width: ${dim.width}px;
      height: ${dim.height}px;
      ${theme.toCSSVariables()}
    "`;

    parts.push(`<div class="${classes}" ${styleAttr}>`);

    // Header
    parts.push(this._buildHeader(creature));

    // Sections based on layout
    for (const section of layoutDef.sections) {
      const html = this._buildCreatureSection(creature, section, layoutDef);
      if (html) parts.push(html);
    }

    parts.push('</div>');

    return parts.join('\n');
  }

  /**
   * Internal: Build item card HTML
   * @private
   */
  _buildItemHTML(item, layout, size, theme, isIdentified) {
    const layoutDef = getItemLayout(layout);
    const dim = getCardDimensions(size);

    const classes = [
      'card-container',
      `card-size-${size}`,
      `card-layout-${layout}`,
      `card-theme-${theme.name}`,
      isIdentified ? 'card-identified' : 'card-unidentified',
    ].join(' ');

    const styleAttr = `style="
      width: ${dim.width}px;
      height: ${dim.height}px;
      ${theme.toCSSVariables()}
    "`;

    const parts = [];
    parts.push(`<div class="${classes}" ${styleAttr}>`);

    // Header
    parts.push(this._buildItemHeader(item, isIdentified));

    // Item-specific content
    if (isIdentified) {
      parts.push(this._buildItemContent(item, layout, layoutDef));
    } else {
      // Unidentified: show minimal info + GM notes
      parts.push(this._buildUnidentifiedContent(item));
    }

    parts.push('</div>');

    return parts.join('\n');
  }

  /**
   * Build creature header
   * @private
   */
  _buildHeader(creature) {
    const { name, cr, type, size: creatureSize, alignment } = creature;

    return `
      <div class="card-header">
        <div class="card-title">${this._escape(name)}</div>
        <div class="card-subtitle">
          CR ${cr} • ${creatureSize} ${type}
          ${alignment ? ` • ${alignment}` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Build item header
   * @private
   */
  _buildItemHeader(item, isIdentified) {
    const name = isIdentified ? item.name : item.unidentifiedName;
    const aura = item.aura || '—';

    return `
      <div class="card-header">
        <div class="card-title">${this._escape(name)}</div>
        <div class="card-subtitle">
          ${item.type} • Aura ${aura}
          ${item.cl ? ` • CL ${item.cl}` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Build a single section for creatures
   * @private
   */
  _buildCreatureSection(creature, sectionDef, layoutDef) {
    const visibility = layoutDef.visibilityRules || {};
    let html = [];

    switch (sectionDef.type) {
      case 'defense':
        html = this._buildDefenseSection(creature, sectionDef, visibility);
        break;
      case 'spellcasting':
        html = this._buildSpellcastingSection(creature, sectionDef);
        break;
      case 'offense':
        html = this._buildOffenseSection(creature, sectionDef, visibility);
        break;
      case 'statistics':
        html = this._buildStatisticsSection(creature, sectionDef, visibility);
        break;
      case 'abilities':
        html = this._buildAbilitiesSection(creature, sectionDef);
        break;
    }

    return html.join('\n');
  }

  /**
   * Build defense section
   * @private
   */
  _buildDefenseSection(creature, sectionDef, visibility) {
    const parts = [];
    parts.push('<div class="card-section card-section-defense">');
    parts.push('<h3 class="card-section-header">Defense</h3>');
    parts.push('<div class="card-section-content">');

    // AC
    const ac = creature.defensiveAbilities?.ac || {};
    parts.push(`<div class="card-stat-line">
      <span class="card-stat-label">AC</span>
      <span class="card-stat-value">${ac.total || '—'} (Touch ${ac.touch || '—'}, Flat-Footed ${ac.flatFooted || '—'})</span>
    </div>`);

    // HP
    const hp = creature.defensiveAbilities?.hp || {};
    parts.push(`<div class="card-stat-line">
      <span class="card-stat-label">HP</span>
      <span class="card-stat-value">${hp.total || '—'}</span>
    </div>`);

    // Saves
    const saves = creature.defensiveAbilities?.savingThrows || {};
    parts.push(`<div class="card-stat-line">
      <span class="card-stat-label">Saves</span>
      <span class="card-stat-value">Fort ${saves.fortitude || '—'}, Ref ${saves.reflex || '—'}, Will ${saves.will || '—'}</span>
    </div>`);

    if (visibility['defense.immunities'] && creature.defensiveAbilities?.immunities?.length) {
      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Immune</span>
        <span class="card-stat-value">${creature.defensiveAbilities.immunities.join(', ')}</span>
      </div>`);
    }

    if (creature.defensiveAbilities?.spellResistance) {
      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">SR</span>
        <span class="card-stat-value">${creature.defensiveAbilities.spellResistance}</span>
      </div>`);
    }

    parts.push('</div></div>');
    return parts;
  }

  /**
   * Build spellcasting section
   * @private
   */
  _buildSpellcastingSection(creature, sectionDef) {
    if (!creature.spellsKnown?.length && !creature.spellsPrepared?.length && !creature.spellLikeAbilities?.length) {
      return [];
    }

    const parts = [];
    parts.push('<div class="card-section card-section-spellcasting">');
    parts.push('<h3 class="card-section-header">Spellcasting</h3>');
    parts.push('<div class="card-section-content">');
    parts.push('<div class="card-spell-grid">');

    // Show spells (limited to fit)
    const spells = creature.spellsKnown || creature.spellsPrepared || [];
    const toShow = spells.slice(0, 8);

    for (const spell of toShow) {
      const spellName = typeof spell === 'string' ? spell : spell.name;
      parts.push(`<div class="card-spell-item">${this._escape(spellName)}</div>`);
    }

    if (spells.length > 8) {
      parts.push(`<div class="card-spell-item">+${spells.length - 8} more</div>`);
    }

    parts.push('</div></div></div>');
    return parts;
  }

  /**
   * Build offense section
   * @private
   */
  _buildOffenseSection(creature, sectionDef, visibility) {
    const parts = [];
    parts.push('<div class="card-section card-section-offense">');
    parts.push('<h3 class="card-section-header">Offense</h3>');
    parts.push('<div class="card-section-content">');

    // Speed
    const speed = creature.speed || {};
    const speedStr = speed.land ? `${speed.land} ft.` : '—';
    parts.push(`<div class="card-stat-line">
      <span class="card-stat-label">Speed</span>
      <span class="card-stat-value">${speedStr}</span>
    </div>`);

    // Attacks (limited)
    if (creature.offensiveAbilities?.melee?.length) {
      for (const attack of creature.offensiveAbilities.melee.slice(0, 2)) {
        const name = attack.name || 'Attack';
        const bonus = attack.bonus || '—';
        const damage = attack.damage || '—';
        parts.push(`<div class="card-attack">
          <span class="card-attack-name">${this._escape(name)}</span>
          <span class="card-attack-bonus">${bonus}</span> (${damage})
        </div>`);
      }
    }

    if (creature.offensiveAbilities?.melee?.length > 2) {
      parts.push(`<div class="card-stat-line">+${creature.offensiveAbilities.melee.length - 2} more attacks</div>`);
    }

    parts.push('</div></div>');
    return parts;
  }

  /**
   * Build statistics section
   * @private
   */
  _buildStatisticsSection(creature, sectionDef, visibility) {
    const parts = [];
    parts.push('<div class="card-section card-section-statistics">');
    parts.push('<h3 class="card-section-header">Statistics</h3>');
    parts.push('<div class="card-section-content">');

    // Ability Scores
    if (visibility['statistics.abilityScores'] !== false) {
      const abilities = creature.abilities || {};
      parts.push('<div class="card-ability-grid">');
      for (const abbr of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
        const score = abilities[abbr] || 10;
        const mod = Math.floor((score - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        parts.push(`
          <div class="card-ability-score">
            <div class="card-ability-name">${abbr}</div>
            <div class="card-ability-value">${score}</div>
            <div class="card-ability-mod">(${modStr})</div>
          </div>
        `);
      }
      parts.push('</div>');
    }

    // BAB, CMB, CMD
    const combat = creature.combat || {};
    parts.push(`<div class="card-stat-line">
      <span class="card-stat-label">BAB/CMB/CMD</span>
      <span class="card-stat-value">${combat.bab || '—'}/${combat.cmb || '—'}/${combat.cmd || '—'}</span>
    </div>`);

    // Skills (limited)
    if (creature.skills?.length) {
      const toShow = creature.skills.slice(0, 4);
      parts.push('<div class="card-skills-list">');
      for (const skill of toShow) {
        const name = skill.name || skill;
        const bonus = skill.bonus || '—';
        parts.push(`<div class="card-skill-item">${this._escape(name)} ${bonus}</div>`);
      }
      parts.push('</div>');
    }

    parts.push('</div></div>');
    return parts;
  }

  /**
   * Build special abilities section
   * @private
   */
  _buildAbilitiesSection(creature, sectionDef) {
    if (!creature.specialAbilities?.length) return [];

    const parts = [];
    const maxToShow = sectionDef.maxItems || 3;
    const toShow = creature.specialAbilities.slice(0, maxToShow);

    parts.push('<div class="card-section card-section-abilities">');
    parts.push('<h3 class="card-section-header">Abilities</h3>');
    parts.push('<div class="card-section-content">');

    for (const ability of toShow) {
      const name = ability.name || ability;
      const type = ability.type ? ` (${ability.type})` : '';
      const desc = ability.description || '';
      parts.push(`
        <div class="card-ability">
          <div class="card-ability-name">${this._escape(name)}<span class="card-ability-type">${type}</span></div>
          <div class="card-ability-description">${this._escape(desc.substring(0, 100))}</div>
        </div>
      `);
    }

    if (creature.specialAbilities.length > maxToShow) {
      parts.push(`<div class="card-stat-line">+${creature.specialAbilities.length - maxToShow} more abilities</div>`);
    }

    parts.push('</div></div>');
    return parts;
  }

  /**
   * Build item content (identified)
   * @private
   */
  _buildItemContent(item, layout, layoutDef) {
    const parts = [];

    // Item-specific fields based on layout
    switch (layout) {
      case 'potion':
      case 'scroll':
        parts.push(this._buildSpellItemContent(item, layout));
        break;
      case 'wand':
        parts.push(this._buildWandContent(item));
        break;
      case 'staff':
        parts.push(this._buildStaffContent(item));
        break;
      case 'weapon':
      case 'armor':
        parts.push(this._buildEquipmentContent(item, layout));
        break;
      case 'wondrous':
      default:
        parts.push(this._buildWondrousContent(item));
        break;
    }

    return parts.join('\n');
  }

  /**
   * Build unidentified item content
   * @private
   */
  _buildUnidentifiedContent(item) {
    const parts = [];

    parts.push('<div class="card-section">');
    parts.push('<div class="card-section-content">');
    parts.push(`<div class="card-text-block">${this._escape(item.unidentifiedDescription || 'An unknown item.')}</div>`);
    parts.push('</div>');
    parts.push('</div>');

    // GM Notes area
    parts.push(`
      <div class="card-gm-notes">
        <div class="card-gm-notes-title">GM Notes</div>
        <div class="card-gm-notes-lines">
          <div class="card-gm-notes-line"></div>
          <div class="card-gm-notes-line"></div>
          <div class="card-gm-notes-line"></div>
        </div>
      </div>
    `);

    return parts.join('\n');
  }

  /**
   * Build spell item (potion/scroll) content
   * @private
   */
  _buildSpellItemContent(item, layout) {
    const parts = [];
    parts.push('<div class="card-section">');
    parts.push('<div class="card-section-content">');

    if (item.spells?.length) {
      const spell = item.spells[0];
      const spellName = typeof spell === 'string' ? spell : spell.name;
      const spellLevel = typeof spell === 'string' ? '—' : spell.level;

      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Spell</span>
        <span class="card-stat-value">${this._escape(spellName)}</span>
      </div>`);

      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Level</span>
        <span class="card-stat-value">${spellLevel}</span>
      </div>`);
    }

    if (item.price) {
      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Price</span>
        <span class="card-stat-value">${this._escape(item.price)}</span>
      </div>`);
    }

    parts.push('</div></div>');
    return parts.join('\n');
  }

  /**
   * Build wand content
   * @private
   */
  _buildWandContent(item) {
    const parts = [];
    parts.push('<div class="card-section">');
    parts.push('<div class="card-section-content">');

    if (item.spells?.length) {
      const spell = item.spells[0];
      const spellName = typeof spell === 'string' ? spell : spell.name;
      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Spell</span>
        <span class="card-stat-value">${this._escape(spellName)}</span>
      </div>`);
    }

    // Charge tracker
    const charges = item.charges || 50;
    parts.push('<div class="card-charge-tracker">');
    for (let i = 0; i < Math.min(charges, 25); i++) {
      parts.push(`<div class="card-charge-box"></div>`);
    }
    parts.push('</div>');

    if (item.price) {
      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Price</span>
        <span class="card-stat-value">${this._escape(item.price)}</span>
      </div>`);
    }

    parts.push('</div></div>');
    return parts.join('\n');
  }

  /**
   * Build staff content
   * @private
   */
  _buildStaffContent(item) {
    const parts = [];
    parts.push('<div class="card-section">');
    parts.push('<div class="card-section-content">');

    if (item.spells?.length) {
      parts.push('<div class="card-spell-grid">');
      for (const spell of item.spells.slice(0, 6)) {
        const spellName = typeof spell === 'string' ? spell : spell.name;
        parts.push(`<div class="card-spell-item">${this._escape(spellName)}</div>`);
      }
      parts.push('</div>');
    }

    const charges = item.charges || 50;
    parts.push(`<div class="card-stat-line">
      <span class="card-stat-label">Charges</span>
      <span class="card-stat-value">${charges}</span>
    </div>`);

    parts.push('</div></div>');
    return parts.join('\n');
  }

  /**
   * Build equipment (weapon/armor) content
   * @private
   */
  _buildEquipmentContent(item, layout) {
    const parts = [];
    parts.push('<div class="card-section">');
    parts.push('<div class="card-section-content">');

    if (layout === 'weapon') {
      if (item.damageRollExpression) {
        parts.push(`<div class="card-stat-line">
          <span class="card-stat-label">Damage</span>
          <span class="card-stat-value">${this._escape(item.damageRollExpression)}</span>
        </div>`);
      }
      if (item.critRange) {
        parts.push(`<div class="card-stat-line">
          <span class="card-stat-label">Crit</span>
          <span class="card-stat-value">${item.critRange}</span>
        </div>`);
      }
    }

    if (layout === 'armor') {
      if (item.armorBonus) {
        parts.push(`<div class="card-stat-line">
          <span class="card-stat-label">AC Bonus</span>
          <span class="card-stat-value">+${item.armorBonus}</span>
        </div>`);
      }
    }

    if (item.specialAbilities?.length) {
      parts.push('<div class="card-stat-line">');
      parts.push(`<span class="card-stat-label">Special</span>`);
      parts.push(`<span class="card-stat-value">${item.specialAbilities.join(', ')}</span>`);
      parts.push('</div>');
    }

    parts.push('</div></div>');
    return parts.join('\n');
  }

  /**
   * Build wondrous item content
   * @private
   */
  _buildWondrousContent(item) {
    const parts = [];
    parts.push('<div class="card-section">');
    parts.push('<div class="card-section-content">');

    if (item.description) {
      parts.push(`
        <div class="card-text-block max-lines-3">
          ${this._escape(item.description)}
        </div>
      `);
    }

    if (item.effects) {
      parts.push(`<div class="card-stat-line">
        <span class="card-stat-label">Effects</span>
        <span class="card-stat-value">${this._escape(item.effects)}</span>
      </div>`);
    }

    parts.push('</div></div>');
    return parts.join('\n');
  }

  /**
   * Escape HTML special characters
   * @private
   */
  _escape(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * Convenience function: Create a new renderer and render a creature card
 */
export function renderCreatureCard(creature, options = {}) {
  const renderer = new UnifiedCardRenderer(options);
  return renderer.renderCreatureCard(creature, options);
}

/**
 * Convenience function: Create a new renderer and render an item card
 */
export function renderItemCard(item, options = {}) {
  const renderer = new UnifiedCardRenderer(options);
  return renderer.renderItemCard(item, options);
}
