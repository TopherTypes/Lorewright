// Magic item card print view.
// Renders a magic item into a 63×88mm poker card format.
// When an item is unidentified, two cards are output:
//   1. The identified card (DM copy) — full details + passphrase
//   2. The unidentified card (player copy) — vague info + passphrase
// Both cards are printed in one browser print job.

import { getItemById } from '../storage/items.js';
import { getViewRoot } from '../ui/shell.js';
import { navigate } from '../ui/router.js';
import { downloadItemCardPDF } from './pdf-export.js';

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

  const cardCount = item.identified !== false ? '' : 's';

  root.innerHTML = `
    <div class="print-preview-page">
      <div class="page-header">
        <h1 class="page-title">Print Preview — ${escapeHtml(item.name || 'Unnamed')}</h1>
        <div class="page-actions print-preview-controls">
          <a href="#/item/${escapeHtml(id)}" class="btn btn-secondary">← Back to Edit</a>
          <button class="btn btn-primary" id="btn-download-pdf">Download PDF</button>
          <button class="btn btn-secondary" id="btn-print-browser">Print Card${cardCount}…</button>
        </div>
      </div>
      <div class="card-preview-outer">
        <div class="card-print-wrapper">
          ${cardHtml}
        </div>
      </div>
    </div>
  `;

  root.querySelector('#btn-download-pdf')
    .addEventListener('click', () => downloadItemCardPDF(item));
  root.querySelector('#btn-print-browser')
    .addEventListener('click', () => window.print());
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
  const typeLabel   = buildTypeLabel(item);
  const schoolGlyph = item.magicSchool ? getSchoolGlyph(item.magicSchool) : '';
  const statsLines  = buildStatsLines(item);
  const passLine    = showPassphrase && item.passphrase
    ? `<div class="card-passphrase">${escapeHtml(item.passphrase)}</div>`
    : '';

  return `
    <div class="item-card item-card--identified">
      <div class="card-header">
        <div class="card-name">${escapeHtml(item.name || 'Unnamed Item')}${schoolGlyph}</div>
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

/**
 * Builds stat lines grouped into two blocks:
 *   1. Identification stats: Aura, CL, Price, Weight
 *   2. Usage stats: type-specific (spell, charges, weapon stats, etc.)
 * Separated by a double-line group rule when both blocks have content.
 */
function buildStatsLines(item) {
  const identLines = [];
  const usageLines = [];

  if (item.aura)   identLines.push(`<b>Aura</b> ${escapeHtml(item.aura)}`);
  if (item.cl)     identLines.push(`<b>CL</b> ${escapeHtml(String(item.cl))}th`);
  if (item.price)  identLines.push(`<b>Price</b> ${escapeHtml(item.price)}`);
  if (item.weight) identLines.push(`<b>Weight</b> ${escapeHtml(item.weight)}`);

  // Type-specific stats → usageLines
  switch (item.type) {
    case 'Potion':
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel})` : '';
        usageLines.push(`<b>Spell</b> ${escapeHtml(item.spell)}${lvl}`);
      }
      break;
    case 'Scroll': {
      const castDC = 5 + (item.cl || 0);
      usageLines.push(`<b>Cast DC</b> ${castDC}`);
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel}, ${item.scrollType})` : '';
        usageLines.push(`<b>Spell</b> ${escapeHtml(item.spell)}${lvl}`);
      }
      break;
    }
    case 'Wand': {
      if (item.spell) {
        usageLines.push(`<b>Spell</b> ${escapeHtml(item.spell)} (${item.spellLevel ?? 0})`);
      }
      usageLines.push(buildWandChargeTracker(item.charges));
      break;
    }
    case 'Staff':
      usageLines.push(`<b>Charges</b> ${item.charges ?? 0}/10`);
      if (item.spellList?.length) {
        const spells = item.spellList
          .map(s => `${escapeHtml(s.spell)} (${s.level})`)
          .join(', ');
        usageLines.push(`<b>Spells</b> ${spells}`);
      }
      break;
    case 'Weapon':
      if (item.weaponType)     usageLines.push(`<b>Weapon</b> ${escapeHtml(item.weaponType)}`);
      if (item.weaponCategory) usageLines.push(`<b>Category</b> ${escapeHtml(item.weaponCategory)}`);
      if (item.enhBonus)       usageLines.push(`<b>Enhancement</b> +${item.enhBonus}`);
      if (item.damageDice) {
        const dtype = item.damageType ? ` ${escapeHtml(item.damageType)}` : '';
        usageLines.push(`<b>Damage</b> ${escapeHtml(item.damageDice)}${dtype}`);
      }
      if (item.critRange || item.critMultiplier) {
        usageLines.push(`<b>Crit</b> ${escapeHtml(item.critRange || '20')}/\xd7${item.critMultiplier || 2}`);
      }
      if (item.specialAbilities) usageLines.push(`<b>Abilities</b> ${escapeHtml(item.specialAbilities)}`);
      break;
    case 'Armour':
      if (item.armourType)    usageLines.push(`<b>Armour</b> ${escapeHtml(item.armourType)}`);
      if (item.armorCategory) usageLines.push(`<b>Category</b> ${escapeHtml(item.armorCategory)}`);
      if (item.acBonus) {
        const enh = item.enhBonus ? ` (+${item.enhBonus} enh)` : '';
        usageLines.push(`<b>AC Bonus</b> +${item.acBonus}${enh}`);
      } else if (item.enhBonus) {
        usageLines.push(`<b>Enhancement</b> +${item.enhBonus}`);
      }
      if (item.maxDexBonus !== '' && item.maxDexBonus != null)
        usageLines.push(`<b>Max Dex</b> +${escapeHtml(String(item.maxDexBonus))}`);
      if (item.arcaneSpellFailure)
        usageLines.push(`<b>Spell Failure</b> ${item.arcaneSpellFailure}%`);
      if (item.armorCheckPenalty)
        usageLines.push(`<b>Check Penalty</b> ${item.armorCheckPenalty}`);
      if (item.specialAbilities) usageLines.push(`<b>Abilities</b> ${escapeHtml(item.specialAbilities)}`);
      break;
  }

  const identHtml = identLines.map(l => `<div class="card-stat-line">${l}</div>`).join('');
  const usageHtml = usageLines.map(l => `<div class="card-stat-line">${l}</div>`).join('');
  const separator = (identLines.length && usageLines.length)
    ? '<hr class="card-rule card-rule--group">'
    : '';

  return identHtml + separator + usageHtml;
}

/**
 * Builds the wand charge tracker: a labelled header + two rows of 25 boxes.
 * Boxes are 2mm × 2mm; 25 per row × 2mm + 24 × 0.35mm gap ≈ 58.4mm (fits 59mm).
 * @param {number|null} charges  Remaining charges (0–50)
 * @returns {string} HTML string for the charge section
 */
function buildWandChargeTracker(charges) {
  const total     = 50;
  const remaining = Math.min(Math.max(charges ?? 0, 0), total);
  const used      = total - remaining;

  const makeRow = (startIdx, count) =>
    Array.from({ length: count }, (_, i) => {
      const boxIdx = startIdx + i;
      return `<span class="charge-box${boxIdx < used ? ' charge-box--used' : ''}"></span>`;
    }).join('');

  return `
    <div class="charge-section">
      <span class="charge-label">Charges</span><span class="charge-count">(${remaining}/50)</span>
      <div class="charge-row">${makeRow(0, 25)}</div>
      <div class="charge-row">${makeRow(25, 25)}</div>
    </div>
  `;
}

// ── School glyph ──────────────────────────────────────────

const SCHOOL_ABBREV = {
  'Abjuration':    'ABJ',
  'Conjuration':   'CON',
  'Divination':    'DIV',
  'Enchantment':   'ENC',
  'Evocation':     'EVO',
  'Illusion':      'ILL',
  'Necromancy':    'NEC',
  'Transmutation': 'TRN',
  'Universal':     'UNV',
};

function getSchoolGlyph(school) {
  const abbr = SCHOOL_ABBREV[school];
  if (!abbr) return '';
  return `<span class="school-glyph">${abbr}</span>`;
}

// ── Unidentified card ─────────────────────────────────────

function renderUnidentifiedCard(item) {
  const displayName = item.unidentifiedName || `Unidentified ${item.type}`;
  const auraLine    = item.aura
    ? `<div class="card-stat-line"><b>Aura</b> ${escapeHtml(item.aura)}</div>` : '';
  const slotLine    = item.slot && item.slot !== 'None'
    ? `<div class="card-stat-line"><b>Slot</b> ${escapeHtml(item.slot)}</div>` : '';
  const weightLine  = item.weight
    ? `<div class="card-stat-line"><b>Weight</b> ${escapeHtml(item.weight)}</div>` : '';

  const descLine = item.unidentifiedDescription
    ? `<div class="card-stat-line card-description">${escapeHtml(item.unidentifiedDescription)}</div>`
    : '';

  const gmNotes = `
    <div class="gm-notes-area">
      <div class="gm-notes-label">GM Notes</div>
      <div class="gm-notes-lines">
        <div class="gm-notes-line"></div>
        <div class="gm-notes-line"></div>
        <div class="gm-notes-line"></div>
      </div>
    </div>
  `;

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
      ${gmNotes}
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
