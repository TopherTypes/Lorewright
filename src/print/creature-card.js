// Creature stat card print view.
// Renders a condensed PF1e stat block into a 63×88mm poker card format.
// The card is designed as a table reference during play — not a full data dump.
// Truncation is applied deliberately to fit the card while keeping numbers accurate.

import { getCreatureById } from '../storage/creatures.js';
import { deriveCreature } from '../entities/creature.js';
import { getViewRoot } from '../ui/shell.js';
import { formatModifier, formatCR, formatSpeed, formatXP } from '../utils/formatters.js';
import { navigate } from '../ui/router.js';
import { downloadCreatureCardPDF } from './pdf-export.js';

/**
 * Renders the print preview route (#/creature/:id/print).
 * Displays the stat card at 2.5× screen scale for inspection,
 * and provides a Print button that triggers the browser print dialog.
 * @param {string} id  Creature UUID
 */
export async function showPrintPreview(id) {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let creature;
  try {
    creature = await getCreatureById(id);
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Failed to load creature: ${err.message}</div>`;
    return;
  }

  if (!creature) {
    root.innerHTML = `<div class="alert alert-danger">Creature not found.</div>`;
    return;
  }

  const derived = deriveCreature(creature);
  const cardHtml = renderCreatureCard(derived);

  root.innerHTML = `
    <div class="print-preview-page">
      <div class="page-header">
        <h1 class="page-title">Print Preview — ${escapeHtml(derived.name || 'Unnamed')}</h1>
        <div class="page-actions print-preview-controls">
          <a href="#/creature/${escapeHtml(id)}" class="btn btn-secondary">← Back to Edit</a>
          <button class="btn btn-primary" id="btn-download-pdf">Download PDF</button>
          <button class="btn btn-secondary" id="btn-print-browser">Print…</button>
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
    .addEventListener('click', async () => {
      const btn = root.querySelector('#btn-download-pdf');
      const originalText = btn.textContent;
      btn.textContent = 'Generating PDF…';
      btn.disabled = true;
      try {
        await downloadCreatureCardPDF(derived);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  root.querySelector('#btn-print-browser')
    .addEventListener('click', () => window.print());
}

/**
 * Renders the creature stat card as an HTML string.
 * Applies content prioritisation and truncation to fit the 63×88mm card.
 * This is the single source of truth for card content — used by both
 * screen preview and the @media print stylesheet.
 * @param {object} derived  A fully derived creature (output of deriveCreature())
 * @returns {string} HTML string for the card
 */
export function renderCreatureCard(derived) {
  const stats = derived.statistics;
  const def   = derived.defence;
  const off   = derived.offence;
  const ac    = def.ac;
  const saves = def.saves;

  // ── Header ───────────────────────────────────────────────
  const crFormatted = formatCR(derived.cr);
  const xpFormatted = derived.xp ? formatXP(derived.xp) : '';
  const subtitle    = [derived.alignment, derived.size, derived.type]
    .filter(Boolean).join(' ');

  // ── Initiative ────────────────────────────────────────────
  const initiativeLine = `Init ${formatModifier(derived.initiative.total ?? 0)}`;

  // ── AC line ───────────────────────────────────────────────
  const acLine = `AC ${ac.total}, touch ${ac.touch}, flat-footed ${ac.flatFooted}`;

  // ── HP / DR ───────────────────────────────────────────────
  const drText = def.hp.dr ? `; DR ${def.hp.dr}` : '';
  const hpLine = `hp ${def.hp.total} (${def.hp.hd || '—'})${drText}`;

  // ── Saves ─────────────────────────────────────────────────
  const savesLine = `Fort ${formatModifier(saves.fort.total)}, Ref ${formatModifier(saves.ref.total)}, Will ${formatModifier(saves.will.total)}`;

  // ── Speed ─────────────────────────────────────────────────
  const speedLine = formatSpeed(off.speed);

  // ── Attacks (first melee and first ranged only to save space) ──
  const primaryMelee  = off.melee[0]  || '';
  const primaryRanged = off.ranged[0] || '';

  // ── Ability scores ────────────────────────────────────────
  const abRow = renderAbilityRow(stats);

  // ── Combat stats ──────────────────────────────────────────
  const combatLine = `BAB ${formatModifier(stats.bab)}; CMB ${formatModifier(stats.cmb)}; CMD ${stats.cmd}`;

  // ── Senses and immunities (abbreviated) ──────────────────
  const sensesLine = derived.senses?.length
    ? truncateList(derived.senses, 2, '; ')
    : '';

  const immuneLine = buildImmuneLine(def);

  // ── Perception (most-checked skill in combat) ─────────────
  const perception = (stats.skills ?? []).find(s => s.name === 'Perception');
  const perceptionLine = perception && perception.ranks > 0
    ? `Perception ${formatModifier(perception.total)}`
    : '';

  // ── Top trained skills (excluding Perception) ─────────────
  const trainedSkills = (stats.skills ?? [])
    .filter(s => s.ranks > 0 && s.name !== 'Perception')
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map(s => `${abbreviateSkill(s.name)} ${formatModifier(s.total)}`)
    .join(', ');

  // ── Special attacks (names only) ──────────────────────────
  const specialAttacksLine = off.specialAttacks?.length
    ? truncateList(off.specialAttacks.map(s => s.split('(')[0].trim()), 3, ', ')
    : '';

  // ── SR ────────────────────────────────────────────────────
  const srLine = def.sr > 0 ? `SR ${def.sr}` : '';

  // ── Build card HTML ───────────────────────────────────────
  return `
    <div class="creature-card">
      <div class="card-header">
        <div class="card-name">${escapeHtml(derived.name || 'Unnamed Creature')}</div>
        <div class="card-cr-line">
          <span><b>CR</b> ${escapeHtml(crFormatted)}</span>
          ${xpFormatted ? `<span><b>XP</b> ${escapeHtml(xpFormatted)}</span>` : ''}
        </div>
        ${subtitle ? `<div class="card-subtitle">${escapeHtml(subtitle)}</div>` : ''}
      </div>

      <div class="card-body">
        <div class="card-stat-line">${escapeHtml(initiativeLine)}${sensesLine ? `; <b>Senses</b> ${escapeHtml(sensesLine)}` : ''}</div>

        <hr class="card-rule">
        <div class="card-section-label">Defense</div>
        <div class="card-stat-line">${escapeHtml(acLine)}</div>
        <div class="card-stat-line">${escapeHtml(hpLine)}</div>
        <div class="card-stat-line">${escapeHtml(savesLine)}</div>
        ${immuneLine ? `<div class="card-stat-line">${escapeHtml(immuneLine)}</div>` : ''}
        ${srLine ? `<div class="card-stat-line"><b>SR</b> ${escapeHtml(srLine)}</div>` : ''}

        <hr class="card-rule">
        <div class="card-section-label">Offense</div>
        <div class="card-stat-line"><b>Speed</b> ${escapeHtml(speedLine)}</div>
        ${primaryMelee  ? `<div class="card-stat-line"><b>Melee</b> ${escapeHtml(primaryMelee)}</div>`  : ''}
        ${primaryRanged ? `<div class="card-stat-line"><b>Ranged</b> ${escapeHtml(primaryRanged)}</div>` : ''}
        ${specialAttacksLine ? `<div class="card-stat-line"><b>Special</b> ${escapeHtml(specialAttacksLine)}</div>` : ''}

        <hr class="card-rule">
        <div class="card-section-label">Statistics</div>
        ${abRow}
        <div class="card-stat-line">${escapeHtml(combatLine)}</div>
        ${perceptionLine ? `<div class="card-stat-line">${escapeHtml(perceptionLine)}</div>` : ''}
        ${trainedSkills  ? `<div class="card-stat-line"><b>Skills</b> ${escapeHtml(trainedSkills)}</div>`  : ''}
      </div>
    </div>
  `;
}

// ── Card content helpers ──────────────────────────────────

function renderAbilityRow(stats) {
  const abilities = [
    { label: 'STR', score: stats.str, mod: stats.strMod },
    { label: 'DEX', score: stats.dex, mod: stats.dexMod },
    { label: 'CON', score: stats.con, mod: stats.conMod },
    { label: 'INT', score: stats.int, mod: stats.intMod },
    { label: 'WIS', score: stats.wis, mod: stats.wisMod },
    { label: 'CHA', score: stats.cha, mod: stats.chaMod },
  ];

  const cells = abilities.map(a => `
    <div class="card-ability-cell">
      <span class="ab-label">${a.label}</span>
      <span class="ab-score">${a.score}</span>
      <span class="ab-mod">${formatModifier(a.mod)}</span>
    </div>
  `).join('');

  return `<div class="card-ability-row">${cells}</div>`;
}

/**
 * Builds a compact immunity/resistance line.
 * e.g. "Immune fire; Resist cold 10"
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
 * Truncates a list to maxItems entries and appends "+ N more" if truncated.
 */
function truncateList(list, maxItems, separator = ', ') {
  if (list.length <= maxItems) return list.join(separator);
  const shown = list.slice(0, maxItems).join(separator);
  return `${shown} +${list.length - maxItems} more`;
}

/**
 * Abbreviates common PF1e skill names to save card space.
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

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
