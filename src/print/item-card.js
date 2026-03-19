// Magic item card print view.
// Renders a magic item into a 63×88mm poker card format.
// When an item is unidentified, two cards are output:
//   1. The identified card (DM copy) — full details + passphrase
//   2. The unidentified card (player copy) — vague info + passphrase
// Both cards are printed in one browser print job.

import { getItemById } from '../storage/items.js';
import { getViewRoot } from '../ui/shell.js';
import { navigate } from '../ui/router.js';

/**
 * Renders the print preview route (#/item/:id/print).
 * @param {string} id  Item UUID
 */
export async function showItemPrint(id) {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let item;
  try {
    item = await getItemById(id);
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Failed to load item: ${err.message}</div>`;
    return;
  }

  if (!item) {
    root.innerHTML = `<div class="alert alert-danger">Item not found.</div>`;
    return;
  }

  const cardHtml = renderItemCard(item);

  root.innerHTML = `
    <div class="print-preview-page">
      <div class="page-header">
        <h1 class="page-title">Print Preview — ${escapeHtml(item.name || 'Unnamed')}</h1>
        <div class="page-actions print-preview-controls">
          <a href="#/item/${escapeHtml(id)}" class="btn btn-secondary">← Back to Edit</a>
          <button class="btn btn-primary" onclick="window.print()">Print Card${item.identified !== false ? '' : 's'}</button>
        </div>
      </div>
      <div class="card-print-wrapper">
        ${cardHtml}
      </div>
    </div>
  `;
}

/**
 * Renders the magic item card(s) as an HTML string.
 * If the item is identified (or has no passphrase), returns a single card.
 * If the item is unidentified, returns two cards — the identified DM copy
 * followed by the unidentified player copy — separated by a page break.
 * @param {object} item  A stored item object
 * @returns {string} HTML string for the card(s)
 */
export function renderItemCard(item) {
  if (item.identified !== false) {
    return renderIdentifiedCard(item, false);
  }

  // Two cards: identified (DM) then unidentified (player)
  return `
    <div class="item-card-set">
      ${renderIdentifiedCard(item, true)}
      ${renderUnidentifiedCard(item)}
    </div>
  `;
}

// ── Identified card ───────────────────────────────────────

function renderIdentifiedCard(item, showPassphrase) {
  const typeLabel  = buildTypeLabel(item);
  const statsLines = buildStatsLines(item);
  const passLine   = showPassphrase && item.passphrase
    ? `<div class="card-passphrase">${escapeHtml(item.passphrase)}</div>`
    : '';

  return `
    <div class="item-card item-card--identified">
      <div class="card-header">
        <div class="card-name">${escapeHtml(item.name || 'Unnamed Item')}</div>
        ${typeLabel ? `<div class="card-subtitle">${escapeHtml(typeLabel)}</div>` : ''}
      </div>
      <div class="card-body">
        ${statsLines}
        ${item.effects ? `<hr class="card-rule"><div class="card-stat-line">${escapeHtml(item.effects)}</div>` : ''}
        ${item.requirements ? `<div class="card-stat-line item-requirements"><b>Req:</b> ${escapeHtml(item.requirements)}</div>` : ''}
        ${item.description ? `<hr class="card-rule"><div class="card-stat-line card-description">${escapeHtml(item.description)}</div>` : ''}
      </div>
      ${passLine}
    </div>
  `;
}

function buildTypeLabel(item) {
  const parts = [item.type];
  if (item.slot && item.slot !== 'None') parts.push(`Slot: ${item.slot}`);
  return parts.filter(Boolean).join(' — ');
}

function buildStatsLines(item) {
  const lines = [];

  if (item.aura)  lines.push(`<b>Aura</b> ${escapeHtml(item.aura)}`);
  if (item.cl)    lines.push(`<b>CL</b> ${escapeHtml(String(item.cl))}th`);
  if (item.price) lines.push(`<b>Price</b> ${escapeHtml(item.price)}`);
  if (item.weight) lines.push(`<b>Weight</b> ${escapeHtml(item.weight)}`);

  // Type-specific stats
  switch (item.type) {
    case 'Potion':
    case 'Scroll':
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel}${item.type === 'Scroll' ? `, ${item.scrollType}` : ''})` : '';
        lines.push(`<b>Spell</b> ${escapeHtml(item.spell)}${lvl}`);
      }
      break;
    case 'Wand':
      if (item.spell) {
        lines.push(`<b>Spell</b> ${escapeHtml(item.spell)} (${item.spellLevel ?? 0})`);
      }
      lines.push(`<b>Charges</b> ${item.charges ?? 0}/50`);
      break;
    case 'Staff':
      lines.push(`<b>Charges</b> ${item.charges ?? 0}/10`);
      if (item.spellList?.length) {
        const spells = item.spellList
          .map(s => `${escapeHtml(s.spell)} (${s.level})`)
          .join(', ');
        lines.push(`<b>Spells</b> ${spells}`);
      }
      break;
    case 'Weapon':
      if (item.weaponType) lines.push(`<b>Weapon</b> ${escapeHtml(item.weaponType)}`);
      if (item.enhBonus)   lines.push(`<b>Enhancement</b> +${item.enhBonus}`);
      if (item.specialAbilities) lines.push(`<b>Abilities</b> ${escapeHtml(item.specialAbilities)}`);
      break;
    case 'Armour':
      if (item.armourType) lines.push(`<b>Armour</b> ${escapeHtml(item.armourType)}`);
      if (item.enhBonus)   lines.push(`<b>Enhancement</b> +${item.enhBonus}`);
      if (item.specialAbilities) lines.push(`<b>Abilities</b> ${escapeHtml(item.specialAbilities)}`);
      break;
  }

  return lines.map(l => `<div class="card-stat-line">${l}</div>`).join('');
}

// ── Unidentified card ─────────────────────────────────────

function renderUnidentifiedCard(item) {
  const displayName = item.unidentifiedName || `Unidentified ${item.type}`;
  const auraLine    = item.aura   ? `<div class="card-stat-line"><b>Aura</b> ${escapeHtml(item.aura)}</div>` : '';
  const slotLine    = item.slot && item.slot !== 'None'
    ? `<div class="card-stat-line"><b>Slot</b> ${escapeHtml(item.slot)}</div>` : '';
  const weightLine  = item.weight ? `<div class="card-stat-line"><b>Weight</b> ${escapeHtml(item.weight)}</div>` : '';

  const descLine = item.unidentifiedDescription
    ? `<hr class="card-rule"><div class="card-stat-line card-description">${escapeHtml(item.unidentifiedDescription)}</div>`
    : '';

  return `
    <div class="item-card item-card--unidentified">
      <div class="card-header">
        <div class="card-name">${escapeHtml(displayName)}</div>
        <div class="card-subtitle item-unident-label">Unidentified</div>
      </div>
      <div class="card-body">
        ${auraLine}
        ${slotLine}
        ${weightLine}
        ${descLine}
      </div>
      <div class="card-passphrase">${escapeHtml(item.passphrase)}</div>
    </div>
  `;
}

// ── Utility ───────────────────────────────────────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
