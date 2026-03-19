/**
 * Item Canvas Renderer
 * Renders magic item cards to canvas with identified/unidentified variants
 */

import { CanvasRenderer } from './canvas-renderer.js';

/**
 * Render item card to canvas
 * For unidentified items, returns the identified card
 * (The application handles showing both cards separately if needed)
 * @param {object} item - Item object from storage
 * @param {object} theme - Theme object from card-styles.js
 * @returns {HTMLCanvasElement}
 */
export function renderItemCard(item, theme) {
  // For unidentified items, render the identified card with passphrase
  if (item.identified === false) {
    return renderIdentifiedCard(item, theme, true);
  }

  // Identified items without passphrase
  return renderIdentifiedCard(item, theme, false);
}

/**
 * Render identified item card
 * @param {object} item
 * @param {object} theme
 * @param {boolean} showPassphrase - Include passphrase in card
 * @returns {HTMLCanvasElement}
 */
export function renderIdentifiedCard(item, theme, showPassphrase = false) {
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

  // Draw decorative inset border (optional subtle frame)
  const insetMargin = Math.round(theme.spacing.padding * 0.6);
  CanvasRenderer.drawBorder(
    ctx,
    insetMargin,
    insetMargin,
    canvas.width - 2 * insetMargin,
    canvas.height - 2 * insetMargin,
    Math.max(0.5, border.thickness * 0.4),
    theme.colors.rule,
  );

  // Start content at padding
  let y = theme.spacing.padding;
  const x = theme.spacing.padding;
  const contentWidth = canvas.width - 2 * theme.spacing.padding;

  // ─── HEADER ───────────────────────────────────
  // Draw header background tint (light wash of header color)
  const headerBg = theme.colors.header || theme.colors.background;
  const headerHeight = theme.fonts.sizes.title + theme.fonts.sizes.sectionLabel + 12;
  CanvasRenderer.fillRect(ctx, x - 2, y - 2, contentWidth + 4, headerHeight + 4, headerBg);

  const titleSize = theme.fonts.sizes.title;

  CanvasRenderer.drawText(
    ctx,
    item.name || 'Unnamed Item',
    x, y + titleSize,
    titleSize,
    theme.fonts.family,
    theme.colors.headerText,
    '700'
  );

  y += titleSize + 2;

  // Type and slot subtitle
  const typeLabel = buildTypeLabel(item);
  if (typeLabel) {
    CanvasRenderer.drawText(
      ctx,
      typeLabel,
      x, y + theme.fonts.sizes.sectionLabel,
      theme.fonts.sizes.sectionLabel,
      theme.fonts.family,
      theme.colors.sectionLabel,
      '400'
    );
    y += theme.fonts.sizes.sectionLabel + 2;
  }

  y += theme.spacing.margin;

  // ─── STAT LINES ───────────────────────────────
  const { identLines, usageLines } = buildStatsLines(item);

  // Draw identification stats
  for (const line of identLines) {
    y = CanvasRenderer.drawTextBlock(
      ctx,
      line,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  // Draw separator if both blocks have content
  if (identLines.length && usageLines.length) {
    CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
    y += theme.spacing.sectionSpacing + 2;
  }

  // Draw usage stats
  for (const line of usageLines) {
    y = CanvasRenderer.drawTextBlock(
      ctx,
      line,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  // ─── EFFECTS ──────────────────────────────────
  if (item.effects) {
    y += theme.spacing.margin - theme.spacing.sectionSpacing;
    CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
    y += theme.spacing.sectionSpacing + 2;

    y = CanvasRenderer.drawTextBlock(
      ctx,
      item.effects,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  // ─── REQUIREMENTS ─────────────────────────────
  if (item.requirements) {
    y += theme.spacing.sectionSpacing;
    y = CanvasRenderer.drawTextBlock(
      ctx,
      `Req: ${item.requirements}`,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  // ─── DESCRIPTION ──────────────────────────────
  if (item.description) {
    y += theme.spacing.margin - theme.spacing.sectionSpacing;
    CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
    y += theme.spacing.sectionSpacing + 2;

    CanvasRenderer.drawTextBlock(
      ctx,
      item.description,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    );
  }

  // ─── PASSPHRASE (at bottom) ──────────────────
  if (showPassphrase && item.passphrase) {
    // Draw passphrase at bottom of card
    const passSize = theme.fonts.sizes.note;
    const passY = canvas.height - theme.spacing.padding - passSize;

    CanvasRenderer.drawText(
      ctx,
      item.passphrase,
      x, passY,
      passSize,
      theme.fonts.family,
      theme.colors.sectionLabel,
      '700',
      false
    );
  }

  return canvas;
}

/**
 * Render unidentified item card
 * @param {object} item
 * @param {object} theme
 * @returns {HTMLCanvasElement}
 */
export function renderUnidentifiedCard(item, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = theme.card.width;
  canvas.height = theme.card.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return canvas;
  }

  // Draw background (slightly different tone for unidentified)
  const bgColor = theme.colors.background;
  CanvasRenderer.fillRect(ctx, 0, 0, canvas.width, canvas.height, bgColor);

  // Draw outer border
  const border = theme.borders.outer;
  CanvasRenderer.drawBorder(ctx, 0, 0, canvas.width, canvas.height, border.thickness, border.color);

  // Draw decorative inset border
  const insetMargin = Math.round(theme.spacing.padding * 0.6);
  CanvasRenderer.drawBorder(
    ctx,
    insetMargin,
    insetMargin,
    canvas.width - 2 * insetMargin,
    canvas.height - 2 * insetMargin,
    Math.max(0.5, border.thickness * 0.4),
    theme.colors.rule,
  );

  // Start content at padding
  let y = theme.spacing.padding;
  const x = theme.spacing.padding;
  const contentWidth = canvas.width - 2 * theme.spacing.padding;

  // ─── HEADER ───────────────────────────────────
  // Draw header background tint
  const headerBg = theme.colors.header || theme.colors.background;
  const titleSize = theme.fonts.sizes.title;
  const headerHeight = titleSize + theme.fonts.sizes.sectionLabel + 8;
  CanvasRenderer.fillRect(ctx, x - 2, y - 2, contentWidth + 4, headerHeight + 4, headerBg);

  const displayName = item.unidentifiedName || `Unidentified ${item.type}`;

  CanvasRenderer.drawText(
    ctx,
    displayName,
    x, y + titleSize,
    titleSize,
    theme.fonts.family,
    theme.colors.headerText,
    '700'
  );

  y += titleSize + 2;

  // "Unidentified" label
  CanvasRenderer.drawText(
    ctx,
    'Unidentified',
    x, y + theme.fonts.sizes.sectionLabel,
    theme.fonts.sizes.sectionLabel,
    theme.fonts.family,
    theme.colors.sectionLabel,
    '400'
  );

  y += theme.fonts.sizes.sectionLabel + 2;
  y += theme.spacing.margin;

  // ─── BASIC INFO ────────────────────────────────
  if (item.aura) {
    y = CanvasRenderer.drawTextBlock(
      ctx,
      `Aura ${item.aura}`,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  if (item.slot && item.slot !== 'None') {
    y = CanvasRenderer.drawTextBlock(
      ctx,
      `Slot ${item.slot}`,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  if (item.weight) {
    y = CanvasRenderer.drawTextBlock(
      ctx,
      `Weight ${item.weight}`,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  // ─── UNIDENTIFIED DESCRIPTION ─────────────────
  if (item.unidentifiedDescription) {
    y += theme.spacing.margin - theme.spacing.sectionSpacing;
    CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
    y += theme.spacing.sectionSpacing + 2;

    y = CanvasRenderer.drawTextBlock(
      ctx,
      item.unidentifiedDescription,
      x, y,
      contentWidth,
      theme.fonts.sizes.stat * theme.spacing.lineHeight,
      theme.fonts.sizes.stat,
      theme.fonts.family,
      theme.colors.stat
    ) + theme.spacing.sectionSpacing;
  }

  // ─── GM NOTES AREA ────────────────────────────
  y += theme.spacing.margin - theme.spacing.sectionSpacing;
  CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, theme.borders.inner.thickness, theme.borders.inner.color);
  y += theme.spacing.sectionSpacing + 2;

  // "GM Notes" label
  CanvasRenderer.drawText(
    ctx,
    'GM Notes',
    x, y + theme.fonts.sizes.sectionLabel,
    theme.fonts.sizes.sectionLabel,
    theme.fonts.family,
    theme.colors.sectionLabel,
    '700'
  );

  y += theme.fonts.sizes.sectionLabel + 4;

  // Draw 3 blank lines for GM notes
  const lineHeight = theme.fonts.sizes.stat * theme.spacing.lineHeight;
  const lineColor = theme.colors.rule;
  for (let i = 0; i < 3; i++) {
    CanvasRenderer.drawLine(ctx, x, x + contentWidth, y, 0.5, lineColor);
    y += lineHeight;
  }

  // ─── PASSPHRASE (at bottom) ──────────────────
  if (item.passphrase) {
    const passSize = theme.fonts.sizes.note;
    const passY = canvas.height - theme.spacing.padding - passSize;

    CanvasRenderer.drawText(
      ctx,
      item.passphrase,
      x, passY,
      passSize,
      theme.fonts.family,
      theme.colors.sectionLabel,
      '700',
      false
    );
  }

  return canvas;
}

// ── Helper functions ───────────────────────────────

function buildTypeLabel(item) {
  const parts = [item.type];
  if (item.slot && item.slot !== 'None') {
    parts.push(`Slot: ${item.slot}`);
  }
  return parts.filter(Boolean).join(' — ');
}

/**
 * Build stat lines for items
 * Returns { identLines, usageLines } for flexible layout
 */
function buildStatsLines(item) {
  const identLines = [];
  const usageLines = [];

  if (item.aura) identLines.push(`Aura ${item.aura}`);
  if (item.cl) identLines.push(`CL ${item.cl}th`);
  if (item.price) identLines.push(`Price ${item.price}`);
  if (item.weight) identLines.push(`Weight ${item.weight}`);

  // Type-specific stats
  switch (item.type) {
    case 'Potion':
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel})` : '';
        usageLines.push(`Spell ${item.spell}${lvl}`);
      }
      break;

    case 'Scroll': {
      const castDC = 5 + (item.cl || 0);
      usageLines.push(`Cast DC ${castDC}`);
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel}, ${item.scrollType})` : '';
        usageLines.push(`Spell ${item.spell}${lvl}`);
      }
      break;
    }

    case 'Wand':
      if (item.spell) {
        usageLines.push(`Spell ${item.spell} (${item.spellLevel ?? 0})`);
      }
      usageLines.push(`Charges ${item.charges ?? 0}/50`);
      break;

    case 'Staff':
      usageLines.push(`Charges ${item.charges ?? 0}/10`);
      if (item.spellList?.length) {
        const spells = item.spellList
          .map(s => `${s.spell} (${s.level})`)
          .join(', ');
        usageLines.push(`Spells ${spells}`);
      }
      break;

    case 'Weapon':
      if (item.weaponType) usageLines.push(`Weapon ${item.weaponType}`);
      if (item.weaponCategory) usageLines.push(`Category ${item.weaponCategory}`);
      if (item.enhBonus) usageLines.push(`Enhancement +${item.enhBonus}`);
      if (item.damageDice) {
        const dtype = item.damageType ? ` ${item.damageType}` : '';
        usageLines.push(`Damage ${item.damageDice}${dtype}`);
      }
      if (item.critRange || item.critMultiplier) {
        usageLines.push(`Crit ${item.critRange || '20'}/×${item.critMultiplier || 2}`);
      }
      if (item.specialAbilities) usageLines.push(`Abilities ${item.specialAbilities}`);
      break;

    case 'Armour':
      if (item.armourType) usageLines.push(`Armour ${item.armourType}`);
      if (item.armorCategory) usageLines.push(`Category ${item.armorCategory}`);
      if (item.acBonus) {
        const enh = item.enhBonus ? ` (+${item.enhBonus} enh)` : '';
        usageLines.push(`AC Bonus +${item.acBonus}${enh}`);
      } else if (item.enhBonus) {
        usageLines.push(`Enhancement +${item.enhBonus}`);
      }
      if (item.maxDexBonus !== '' && item.maxDexBonus != null) {
        usageLines.push(`Max Dex +${item.maxDexBonus}`);
      }
      if (item.arcaneSpellFailure) {
        usageLines.push(`Spell Failure ${item.arcaneSpellFailure}%`);
      }
      if (item.armorCheckPenalty) {
        usageLines.push(`Check Penalty ${item.armorCheckPenalty}`);
      }
      if (item.specialAbilities) usageLines.push(`Abilities ${item.specialAbilities}`);
      break;
  }

  return { identLines, usageLines };
}

export default renderItemCard;
