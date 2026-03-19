/**
 * Creature Canvas Renderer
 * Renders creature stat cards to canvas with configurable theme
 */

import { CanvasRenderer } from './canvas-renderer.js';
import { formatModifier, formatCR, formatSpeed, formatXP } from '../utils/formatters.js';

/**
 * Render creature stat card to canvas
 * @param {object} derived - Derived creature (output of deriveCreature())
 * @param {object} theme - Theme object from card-styles.js
 * @returns {HTMLCanvasElement}
 */
export function renderCreatureCard(derived, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = theme.card.width;
  canvas.height = theme.card.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return canvas;
  }

  // Draw background
  CanvasRenderer.fillRect(ctx, 0, 0, canvas.width, canvas.height, theme.colors.background);

  // Draw outer border
  const border = theme.borders.outer;
  CanvasRenderer.drawBorder(ctx, 0, 0, canvas.width, canvas.height, border.thickness, border.color);

  // Start content at padding
  let y = theme.spacing.padding;
  const x = theme.spacing.padding;
  const contentWidth = canvas.width - 2 * theme.spacing.padding;

  // ─── HEADER ───────────────────────────────────
  const titleSize = theme.fonts.sizes.title;
  const titleHeight = CanvasRenderer.getTextHeight(titleSize);

  CanvasRenderer.drawText(
    ctx,
    derived.name || 'Unnamed Creature',
    x, y + titleSize,
    titleSize,
    theme.fonts.family,
    theme.colors.headerText,
    '700'
  );

  y += titleHeight + 2;

  // CR and XP line
  const crFormatted = formatCR(derived.cr);
  const xpFormatted = derived.xp ? formatXP(derived.xp) : '';
  const crLine = `CR ${crFormatted}${xpFormatted ? ` XP ${xpFormatted}` : ''}`;

  CanvasRenderer.drawText(
    ctx,
    crLine,
    x, y + theme.fonts.sizes.stat,
    theme.fonts.sizes.stat,
    theme.fonts.family,
    theme.colors.stat,
    '400'
  );

  y += theme.fonts.sizes.stat + 2;

  // Subtitle: alignment, size, type
  const subtitle = [derived.alignment, derived.size, derived.type]
    .filter(Boolean)
    .join(', ');

  if (subtitle) {
    CanvasRenderer.drawText(
      ctx,
      subtitle,
      x, y + theme.fonts.sizes.sectionLabel,
      theme.fonts.sizes.sectionLabel,
      theme.fonts.family,
      theme.colors.sectionLabel,
      '400'
    );
    y += theme.fonts.sizes.sectionLabel + 2;
  }

  y += theme.spacing.margin;

  // ─── INITIATIVE & SENSES ───────────────────────
  const initiativeLine = `Init ${formatModifier(derived.initiative.total ?? 0)}`;
  const sensesLine = derived.senses?.length ? truncateList(derived.senses, 2, '; ') : '';

  let initSensesText = initiativeLine;
  if (sensesLine) {
    initSensesText += `; Senses ${sensesLine}`;
  }

  y = CanvasRenderer.drawTextBlock(
    ctx,
    initSensesText,
    x, y,
    contentWidth,
    theme.fonts.sizes.stat * theme.spacing.lineHeight,
    theme.fonts.sizes.stat,
    theme.fonts.family,
    theme.colors.stat
  ) + theme.spacing.margin;

  // Divider
  CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
  y += theme.spacing.sectionSpacing + 2;

  // ─── DEFENSE SECTION ──────────────────────────
  y = drawSectionLabel(ctx, 'DEFENSE', x, y, theme);

  const def = derived.defence;
  const ac = def.ac;
  const saves = def.saves;

  // AC line
  const acLine = `AC ${ac.total}, touch ${ac.touch}, flat-footed ${ac.flatFooted}`;
  y = CanvasRenderer.drawTextBlock(ctx, acLine, x, y, contentWidth,
    theme.fonts.sizes.stat * theme.spacing.lineHeight,
    theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;

  // HP line
  const drText = def.hp.dr ? `; DR ${def.hp.dr}` : '';
  const hpLine = `hp ${def.hp.total} (${def.hp.hd || '—'})${drText}`;
  y = CanvasRenderer.drawTextBlock(ctx, hpLine, x, y, contentWidth,
    theme.fonts.sizes.stat * theme.spacing.lineHeight,
    theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;

  // Saves line
  const savesLine = `Fort ${formatModifier(saves.fort.total)}, Ref ${formatModifier(saves.ref.total)}, Will ${formatModifier(saves.will.total)}`;
  y = CanvasRenderer.drawTextBlock(ctx, savesLine, x, y, contentWidth,
    theme.fonts.sizes.stat * theme.spacing.lineHeight,
    theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;

  // Immunities line
  const immuneLine = buildImmuneLine(def);
  if (immuneLine) {
    y = CanvasRenderer.drawTextBlock(ctx, immuneLine, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;
  }

  // SR line
  if (def.sr > 0) {
    const srLine = `SR ${def.sr}`;
    y = CanvasRenderer.drawTextBlock(ctx, srLine, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;
  }

  y += theme.spacing.margin - theme.spacing.sectionSpacing;

  // Divider
  CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
  y += theme.spacing.sectionSpacing + 2;

  // ─── OFFENSE SECTION ──────────────────────────
  y = drawSectionLabel(ctx, 'OFFENSE', x, y, theme);

  const off = derived.offence;
  const speedLine = formatSpeed(off.speed);

  y = CanvasRenderer.drawTextBlock(ctx, `Speed ${speedLine}`, x, y, contentWidth,
    theme.fonts.sizes.stat * theme.spacing.lineHeight,
    theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;

  // Melee
  if (off.melee && off.melee[0]) {
    y = CanvasRenderer.drawTextBlock(ctx, `Melee ${off.melee[0]}`, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;
  }

  // Ranged
  if (off.ranged && off.ranged[0]) {
    y = CanvasRenderer.drawTextBlock(ctx, `Ranged ${off.ranged[0]}`, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;
  }

  // Special attacks
  const specialAttacksLine = off.specialAttacks?.length
    ? truncateList(off.specialAttacks.map(s => s.split('(')[0].trim()), 3, ', ')
    : '';

  if (specialAttacksLine) {
    y = CanvasRenderer.drawTextBlock(ctx, `Special ${specialAttacksLine}`, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;
  }

  y += theme.spacing.margin - theme.spacing.sectionSpacing;

  // Divider
  CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
  y += theme.spacing.sectionSpacing + 2;

  // ─── STATISTICS SECTION ──────────────────────
  y = drawSectionLabel(ctx, 'STATISTICS', x, y, theme);

  const stats = derived.statistics;

  // Ability scores
  y = drawAbilityRow(ctx, stats, x, y, theme, contentWidth) + theme.spacing.sectionSpacing;

  // Combat line
  const combatLine = `BAB ${formatModifier(stats.bab)}; CMB ${formatModifier(stats.cmb)}; CMD ${stats.cmd}`;
  y = CanvasRenderer.drawTextBlock(ctx, combatLine, x, y, contentWidth,
    theme.fonts.sizes.stat * theme.spacing.lineHeight,
    theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;

  // Perception
  const perception = (stats.skills ?? []).find(s => s.name === 'Perception');
  if (perception && perception.ranks > 0) {
    const perceptionLine = `Perception ${formatModifier(perception.total)}`;
    y = CanvasRenderer.drawTextBlock(ctx, perceptionLine, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat) + theme.spacing.sectionSpacing;
  }

  // Top trained skills
  const trainedSkills = (stats.skills ?? [])
    .filter(s => s.ranks > 0 && s.name !== 'Perception')
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map(s => `${abbreviateSkill(s.name)} ${formatModifier(s.total)}`)
    .join(', ');

  if (trainedSkills) {
    CanvasRenderer.drawTextBlock(ctx, `Skills ${trainedSkills}`, x, y, contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat, theme.fonts.family, theme.colors.stat);
  }

  return canvas;
}

/**
 * Draw section label (DEFENSE, OFFENSE, STATISTICS)
 * Returns y position after label
 */
function drawSectionLabel(ctx, label, x, y, theme) {
  return CanvasRenderer.drawSectionHeader(
    ctx,
    label,
    x, y,
    theme.fonts.sizes.sectionLabel,
    theme.fonts.family,
    theme.colors.sectionLabel,
    true,
    null,
    theme.colors.rule
  ) + theme.spacing.margin;
}

/**
 * Draw ability score row (STR, DEX, CON, INT, WIS, CHA)
 * Returns y position after ability row
 */
function drawAbilityRow(ctx, stats, x, y, theme, contentWidth) {
  const abilities = [
    { label: 'STR', score: stats.str, mod: stats.strMod },
    { label: 'DEX', score: stats.dex, mod: stats.dexMod },
    { label: 'CON', score: stats.con, mod: stats.conMod },
    { label: 'INT', score: stats.int, mod: stats.intMod },
    { label: 'WIS', score: stats.wis, mod: stats.wisMod },
    { label: 'CHA', score: stats.cha, mod: stats.chaMod },
  ];

  const cellWidth = contentWidth / 3;
  const abilitySize = theme.fonts.sizes.ability;
  const rowHeight = abilitySize * 1.2 * 3; // 3 lines per cell

  // Draw 3 abilities per row, 2 rows
  for (let i = 0; i < abilities.length; i += 3) {
    let cellY = y;

    for (let j = 0; j < 3 && i + j < abilities.length; j++) {
      const ability = abilities[i + j];
      const cellX = x + j * cellWidth;

      // Label
      CanvasRenderer.drawText(
        ctx,
        ability.label,
        cellX, cellY + abilitySize,
        abilitySize,
        theme.fonts.family,
        theme.colors.sectionLabel,
        '700'
      );
      cellY += abilitySize * 1.2;

      // Score
      CanvasRenderer.drawText(
        ctx,
        String(ability.score),
        cellX, cellY + abilitySize,
        abilitySize,
        theme.fonts.family,
        theme.colors.stat,
        '700'
      );
      cellY += abilitySize * 1.2;

      // Modifier
      CanvasRenderer.drawText(
        ctx,
        formatModifier(ability.mod),
        cellX, cellY + abilitySize,
        abilitySize,
        theme.fonts.family,
        theme.colors.abilityScore,
        '400'
      );
    }

    y += rowHeight;
  }

  return y;
}

/**
 * Build immunity/resistance line
 */
function buildImmuneLine(def) {
  const parts = [];
  if (def.immunities?.length) {
    parts.push(`Immune ${def.immunities.slice(0, 3).join(', ')}`);
  }
  if (def.resistances?.length) {
    parts.push(`Resist ${def.resistances.slice(0, 2).join(', ')}`);
  }
  return parts.join('; ');
}

/**
 * Truncate list to max items
 */
function truncateList(list, maxItems, separator = ', ') {
  if (list.length <= maxItems) return list.join(separator);
  const shown = list.slice(0, maxItems).join(separator);
  return `${shown} +${list.length - maxItems} more`;
}

/**
 * Abbreviate skill names
 */
function abbreviateSkill(name) {
  const abbreviations = {
    'Acrobatics': 'Acr',
    'Bluff': 'Blff',
    'Climb': 'Clmb',
    'Diplomacy': 'Dipl',
    'Disable Device': 'DD',
    'Disguise': 'Disg',
    'Escape Artist': 'EA',
    'Handle Animal': 'HA',
    'Intimidate': 'Intim',
    'Knowledge (arcana)': 'K(arc)',
    'Knowledge (dungeoneering)': 'K(dng)',
    'Knowledge (engineering)': 'K(eng)',
    'Knowledge (geography)': 'K(geo)',
    'Knowledge (history)': 'K(his)',
    'Knowledge (local)': 'K(loc)',
    'Knowledge (nature)': 'K(nat)',
    'Knowledge (nobility)': 'K(nob)',
    'Knowledge (planes)': 'K(pln)',
    'Knowledge (religion)': 'K(rel)',
    'Linguistics': 'Ling',
    'Perception': 'Perc',
    'Sense Motive': 'SM',
    'Sleight of Hand': 'SoH',
    'Spellcraft': 'Spcrft',
    'Stealth': 'Stlth',
    'Survival': 'Surv',
    'Swim': 'Swim',
    'Use Magic Device': 'UMD',
  };
  return abbreviations[name] ?? name;
}

export default renderCreatureCard;
