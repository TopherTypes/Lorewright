// PDF export module — generates downloadable PDF files for creature and item cards.
// Uses jsPDF to draw cards directly with vector text and graphics.
// Produces consistent 63×88mm poker-card-format PDFs across all browsers and devices,
// bypassing the browser print dialog entirely.

import { jsPDF } from 'jspdf';
import { formatModifier, formatCR, formatSpeed, formatXP } from '../utils/formatters.js';

// ── Card geometry (mm) ───────────────────────────────────────────────────────

const CARD_W  = 63;
const CARD_H  = 88;
const MARGIN  = 2;
const INNER_W = CARD_W - MARGIN * 2;   // 59mm usable width
const X       = MARGIN;                 // left text edge
const BOTTOM  = CARD_H - MARGIN;        // 86mm — lowest usable y

// ── Vertical rhythm constants (mm) ──────────────────────────────────────────

const LINE_H    = 2.5;   // height of a normal stat line
const RULE_H    = 1.5;   // space consumed by a section divider
const SECTION_H = 2.0;   // height of a section label line

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a creature stat card as a PDF and triggers a browser download.
 * @param {object} derived  Output of deriveCreature()
 */
export function downloadCreatureCardPDF(derived) {
  const doc = newCardDoc();
  drawCreaturePage(doc, derived);
  const filename = sanitiseFilename(derived.name || 'creature') + '-card.pdf';
  doc.save(filename);
}

/**
 * Generates magic item card(s) as a PDF and triggers a browser download.
 * Unidentified items produce two pages: identified (DM copy) + unidentified (player copy).
 * @param {object} item  A stored item object
 */
export function downloadItemCardPDF(item) {
  const doc = newCardDoc();

  if (item.identified !== false) {
    drawItemIdentifiedPage(doc, item, false);
  } else {
    drawItemIdentifiedPage(doc, item, true);
    doc.addPage([CARD_W, CARD_H]);
    drawItemUnidentifiedPage(doc, item);
  }

  const filename = sanitiseFilename(item.name || 'item') + '-card.pdf';
  doc.save(filename);
}

// ── Document factory ─────────────────────────────────────────────────────────

function newCardDoc() {
  return new jsPDF({
    orientation: 'portrait',
    unit:        'mm',
    format:      [CARD_W, CARD_H],
  });
}

// ── Creature page ─────────────────────────────────────────────────────────────

function drawCreaturePage(doc, derived) {
  const stats = derived.statistics;
  const def   = derived.defence;
  const off   = derived.offence;
  const ac    = def.ac;
  const saves = def.saves;

  let y = MARGIN;

  // ── Header ──────────────────────────────────────────────────────────────
  setFont(doc, 'bold', 9);
  doc.text(clip(derived.name || 'Unnamed Creature', doc, INNER_W), X, y + 4);
  y += 5;

  // CR / XP on one line
  const crFormatted = formatCR(derived.cr);
  const xpFormatted = derived.xp ? formatXP(derived.xp) : '';
  const crXpLine    = xpFormatted ? `CR ${crFormatted}   XP ${xpFormatted}` : `CR ${crFormatted}`;
  setFont(doc, 'normal', 7);
  doc.text(crXpLine, X, y);
  y += LINE_H;

  // Subtitle
  const subtitle = [derived.alignment, derived.size, derived.type].filter(Boolean).join(' ');
  if (subtitle) {
    setFont(doc, 'italic', 6.5);
    doc.text(clip(subtitle, doc, INNER_W), X, y);
    y += LINE_H;
  }

  // Header rule
  y += 0.5;
  drawRule(doc, y, 0.4);
  y += RULE_H;

  // ── Init + Senses ────────────────────────────────────────────────────────
  const initiativeLine = `Init ${formatModifier(derived.initiative?.total ?? 0)}`;
  const sensesLine = derived.senses?.length
    ? truncateList(derived.senses, 2, '; ')
    : '';
  const initSenses = sensesLine ? `${initiativeLine}; Senses ${sensesLine}` : initiativeLine;
  setFont(doc, 'normal', 6.5);
  y = drawWrappedLine(doc, initSenses, y);

  // ── Defense section ──────────────────────────────────────────────────────
  drawRule(doc, y, 0.25);
  y += RULE_H;
  y = drawSectionLabel(doc, 'Defense', y);

  const acLine    = `AC ${ac.total}, touch ${ac.touch}, flat-footed ${ac.flatFooted}`;
  const drText    = def.hp.dr ? `; DR ${def.hp.dr}` : '';
  const hpLine    = `hp ${def.hp.total} (${def.hp.hd || '—'})${drText}`;
  const savesLine = `Fort ${formatModifier(saves.fort.total)}, Ref ${formatModifier(saves.ref.total)}, Will ${formatModifier(saves.will.total)}`;
  const immuneLine = buildImmuneLine(def);
  const srLine    = def.sr > 0 ? `SR ${def.sr}` : '';

  setFont(doc, 'normal', 6.5);
  y = drawWrappedLine(doc, acLine, y);
  y = drawWrappedLine(doc, hpLine, y);
  y = drawWrappedLine(doc, savesLine, y);
  if (immuneLine) y = drawWrappedLine(doc, immuneLine, y);
  if (srLine)     y = drawWrappedLine(doc, srLine, y);

  // ── Offense section ──────────────────────────────────────────────────────
  if (y > BOTTOM - SECTION_H * 4) return; // bail if almost out of space
  drawRule(doc, y, 0.25);
  y += RULE_H;
  y = drawSectionLabel(doc, 'Offense', y);

  const speedLine          = formatSpeed(off.speed);
  const primaryMelee       = off.melee?.[0]  || '';
  const primaryRanged      = off.ranged?.[0] || '';
  const specialAttacksLine = off.specialAttacks?.length
    ? truncateList(off.specialAttacks.map(s => s.split('(')[0].trim()), 3, ', ')
    : '';

  setFont(doc, 'normal', 6.5);
  y = drawBoldPrefixLine(doc, 'Speed', speedLine, y);
  if (primaryMelee)       y = drawBoldPrefixLine(doc, 'Melee',   primaryMelee,       y);
  if (primaryRanged)      y = drawBoldPrefixLine(doc, 'Ranged',  primaryRanged,      y);
  if (specialAttacksLine) y = drawBoldPrefixLine(doc, 'Special', specialAttacksLine, y);

  // ── Statistics section ───────────────────────────────────────────────────
  if (y > BOTTOM - SECTION_H * 4) return;
  drawRule(doc, y, 0.25);
  y += RULE_H;
  y = drawSectionLabel(doc, 'Statistics', y);

  y = drawAbilityRow(doc, stats, y);

  const combatLine = `BAB ${formatModifier(stats.bab)}; CMB ${formatModifier(stats.cmb)}; CMD ${stats.cmd}`;
  const perception = (stats.skills ?? []).find(s => s.name === 'Perception');
  const perceptionLine = perception && perception.ranks > 0
    ? `Perception ${formatModifier(perception.total)}`
    : '';
  const trainedSkills = (stats.skills ?? [])
    .filter(s => s.ranks > 0 && s.name !== 'Perception')
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map(s => `${abbreviateSkill(s.name)} ${formatModifier(s.total)}`)
    .join(', ');

  setFont(doc, 'normal', 6.5);
  y = drawWrappedLine(doc, combatLine, y);
  if (perceptionLine) y = drawWrappedLine(doc, perceptionLine, y);
  if (trainedSkills)  y = drawBoldPrefixLine(doc, 'Skills', trainedSkills, y);
}

// ── Item pages ────────────────────────────────────────────────────────────────

function drawItemIdentifiedPage(doc, item, showPassphrase) {
  let y = MARGIN;

  // ── Header ──────────────────────────────────────────────────────────────
  setFont(doc, 'bold', 9);
  doc.text(clip(item.name || 'Unnamed Item', doc, INNER_W), X, y + 4);
  y += 5;

  const typeLabel = buildTypeLabel(item);
  if (typeLabel) {
    setFont(doc, 'italic', 6.5);
    doc.text(clip(typeLabel, doc, INNER_W), X, y);
    y += LINE_H;
  }

  y += 0.5;
  drawRule(doc, y, 0.4);
  y += RULE_H;

  // ── Core stats ───────────────────────────────────────────────────────────
  setFont(doc, 'normal', 6.5);
  if (item.aura)   y = drawBoldPrefixLine(doc, 'Aura',   item.aura,           y);
  if (item.cl)     y = drawBoldPrefixLine(doc, 'CL',     `${item.cl}th`,      y);
  if (item.price)  y = drawBoldPrefixLine(doc, 'Price',  item.price,          y);
  if (item.weight) y = drawBoldPrefixLine(doc, 'Weight', item.weight,         y);

  // ── Type-specific stats ──────────────────────────────────────────────────
  y = drawTypeSpecificStats(doc, item, y);

  // ── Effects ──────────────────────────────────────────────────────────────
  if (item.effects) {
    if (y < BOTTOM - RULE_H - LINE_H) {
      drawRule(doc, y, 0.25);
      y += RULE_H;
    }
    setFont(doc, 'normal', 6.5);
    y = drawWrappedLine(doc, item.effects, y);
  }

  // ── Requirements ─────────────────────────────────────────────────────────
  if (item.requirements) {
    setFont(doc, 'normal', 5.5);
    doc.setTextColor(70);
    y = drawBoldPrefixLine(doc, 'Req', item.requirements, y);
    doc.setTextColor(0);
    setFont(doc, 'normal', 6.5);
  }

  // ── Description ──────────────────────────────────────────────────────────
  if (item.description) {
    if (y < BOTTOM - RULE_H - LINE_H) {
      drawRule(doc, y, 0.25);
      y += RULE_H;
    }
    setFont(doc, 'italic', 6.5);
    doc.setTextColor(30);
    y = drawWrappedLine(doc, item.description, y);
    doc.setTextColor(0);
  }

  // ── Passphrase (DM copy only) ────────────────────────────────────────────
  if (showPassphrase && item.passphrase) {
    drawPassphrase(doc, item.passphrase);
  }
}

function drawItemUnidentifiedPage(doc, item) {
  let y = MARGIN;

  const displayName = item.unidentifiedName || `Unidentified ${item.type}`;

  setFont(doc, 'bolditalic', 9);
  doc.text(clip(displayName, doc, INNER_W), X, y + 4);
  y += 5;

  setFont(doc, 'normal', 6.5);
  doc.setTextColor(70);
  // Small-caps approximation: uppercase + reduced size
  setFont(doc, 'bold', 5.5);
  doc.text('UNIDENTIFIED', X, y);
  doc.setTextColor(0);
  y += LINE_H;

  y += 0.5;
  drawRule(doc, y, 0.4);
  y += RULE_H;

  setFont(doc, 'normal', 6.5);
  if (item.aura)                       y = drawBoldPrefixLine(doc, 'Aura',   item.aura,   y);
  if (item.slot && item.slot !== 'None') y = drawBoldPrefixLine(doc, 'Slot',   item.slot,   y);
  if (item.weight)                     y = drawBoldPrefixLine(doc, 'Weight', item.weight, y);

  if (item.unidentifiedDescription) {
    drawRule(doc, y, 0.25);
    y += RULE_H;
    setFont(doc, 'italic', 6.5);
    doc.setTextColor(30);
    y = drawWrappedLine(doc, item.unidentifiedDescription, y);
    doc.setTextColor(0);
  }

  drawPassphrase(doc, item.passphrase || '');
}

// ── Type-specific item stats ──────────────────────────────────────────────────

function drawTypeSpecificStats(doc, item, y) {
  setFont(doc, 'normal', 6.5);

  switch (item.type) {
    case 'Potion':
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel})` : '';
        y = drawBoldPrefixLine(doc, 'Spell', `${item.spell}${lvl}`, y);
      }
      break;

    case 'Scroll': {
      const castDC = 5 + (item.cl || 0);
      y = drawBoldPrefixLine(doc, 'Cast DC', String(castDC), y);
      if (item.spell) {
        const lvl = item.spellLevel != null ? ` (${item.spellLevel}, ${item.scrollType})` : '';
        y = drawBoldPrefixLine(doc, 'Spell', `${item.spell}${lvl}`, y);
      }
      break;
    }

    case 'Wand': {
      if (item.spell) {
        const lvl = item.spellLevel ?? 0;
        y = drawBoldPrefixLine(doc, 'Spell', `${item.spell} (${lvl})`, y);
      }
      const total = 50;
      const charges = Math.min(Math.max(item.charges ?? 0, 0), total);
      y = drawBoldPrefixLine(doc, 'Charges', `${charges}/50`, y);
      y = drawChargeBoxes(doc, total, total - charges, y);
      break;
    }

    case 'Staff':
      y = drawBoldPrefixLine(doc, 'Charges', `${item.charges ?? 0}/10`, y);
      if (item.spellList?.length) {
        const spells = item.spellList
          .map(s => `${s.spell} (${s.level})`)
          .join(', ');
        y = drawBoldPrefixLine(doc, 'Spells', spells, y);
      }
      break;

    case 'Weapon':
      if (item.weaponType)     y = drawBoldPrefixLine(doc, 'Weapon',      item.weaponType,      y);
      if (item.weaponCategory) y = drawBoldPrefixLine(doc, 'Category',    item.weaponCategory,  y);
      if (item.enhBonus)       y = drawBoldPrefixLine(doc, 'Enhancement', `+${item.enhBonus}`,  y);
      if (item.damageDice) {
        const dtype = item.damageType ? ` ${item.damageType}` : '';
        y = drawBoldPrefixLine(doc, 'Damage', `${item.damageDice}${dtype}`, y);
      }
      if (item.critRange || item.critMultiplier) {
        y = drawBoldPrefixLine(doc, 'Crit', `${item.critRange || '20'}/\xd7${item.critMultiplier || 2}`, y);
      }
      if (item.specialAbilities) y = drawBoldPrefixLine(doc, 'Abilities', item.specialAbilities, y);
      break;

    case 'Armour':
      if (item.armourType)    y = drawBoldPrefixLine(doc, 'Armour',   item.armourType,   y);
      if (item.armorCategory) y = drawBoldPrefixLine(doc, 'Category', item.armorCategory, y);
      if (item.acBonus) {
        const enh = item.enhBonus ? ` (+${item.enhBonus} enh)` : '';
        y = drawBoldPrefixLine(doc, 'AC Bonus', `+${item.acBonus}${enh}`, y);
      } else if (item.enhBonus) {
        y = drawBoldPrefixLine(doc, 'Enhancement', `+${item.enhBonus}`, y);
      }
      if (item.maxDexBonus !== '' && item.maxDexBonus != null)
        y = drawBoldPrefixLine(doc, 'Max Dex',      `+${item.maxDexBonus}`,       y);
      if (item.arcaneSpellFailure)
        y = drawBoldPrefixLine(doc, 'Spell Failure', `${item.arcaneSpellFailure}%`, y);
      if (item.armorCheckPenalty)
        y = drawBoldPrefixLine(doc, 'Check Penalty', String(item.armorCheckPenalty), y);
      if (item.specialAbilities) y = drawBoldPrefixLine(doc, 'Abilities', item.specialAbilities, y);
      break;
  }

  return y;
}

// ── Drawing primitives ────────────────────────────────────────────────────────

/**
 * Sets font to Times (serif) with the given style and size (pt).
 * @param {jsPDF} doc
 * @param {'normal'|'bold'|'italic'|'bolditalic'} style
 * @param {number} size  Point size
 */
function setFont(doc, style, size) {
  doc.setFont('times', style);
  doc.setFontSize(size);
}

/**
 * Draws a horizontal rule at the given y position.
 * @param {jsPDF} doc
 * @param {number} y  Y position in mm
 * @param {number} weight  Line weight in mm (default 0.25)
 */
function drawRule(doc, y, weight = 0.25) {
  doc.setLineWidth(weight);
  doc.setDrawColor(0);
  doc.line(X, y, X + INNER_W, y);
}

/**
 * Draws a section label (e.g. "Defense") in uppercase with small letter-spacing.
 * Returns the new y after the label.
 * @param {jsPDF} doc
 * @param {string} label
 * @param {number} y
 */
function drawSectionLabel(doc, label, y) {
  setFont(doc, 'bold', 5.5);
  doc.setTextColor(60);
  doc.text(label.toUpperCase(), X, y + 1.5);
  doc.setTextColor(0);
  return y + SECTION_H;
}

/**
 * Draws a plain text line with optional wrapping.
 * Returns the new y after the text.
 */
function drawWrappedLine(doc, text, y) {
  if (y >= BOTTOM) return y;
  setFont(doc, doc.getFont().fontStyle, doc.getFontSize());
  const lines = doc.splitTextToSize(String(text ?? ''), INNER_W);
  for (const line of lines) {
    if (y >= BOTTOM) break;
    doc.text(line, X, y + 1.8);
    y += LINE_H;
  }
  return y;
}

/**
 * Draws a "Label: value" line where the label is bold and the value is normal weight.
 * Handles wrapping of the value text.
 * Returns the new y after the line(s).
 */
function drawBoldPrefixLine(doc, label, value, y) {
  if (y >= BOTTOM) return y;

  const fontSize = doc.getFontSize();

  // Measure the bold label portion
  setFont(doc, 'bold', fontSize);
  const labelText   = `${label} `;
  const labelWidth  = doc.getTextWidth(labelText);

  // Split the value to fit in the remaining width after the label
  setFont(doc, 'normal', fontSize);
  const valueWidth  = INNER_W - labelWidth;
  const valueLines  = doc.splitTextToSize(String(value ?? ''), valueWidth);

  // First line: bold label + first value chunk
  if (y < BOTTOM) {
    setFont(doc, 'bold', fontSize);
    doc.text(labelText, X, y + 1.8);
    setFont(doc, 'normal', fontSize);
    doc.text(valueLines[0] ?? '', X + labelWidth, y + 1.8);
    y += LINE_H;
  }

  // Subsequent wrapped lines: indented to match value start
  for (let i = 1; i < valueLines.length; i++) {
    if (y >= BOTTOM) break;
    doc.text(valueLines[i], X + labelWidth, y + 1.8);
    y += LINE_H;
  }

  return y;
}

/**
 * Draws the 6-column ability score grid (STR DEX CON INT WIS CHA).
 * Each column shows: abbreviated label (bold), score (bold), modifier (normal).
 * Returns the new y after the grid.
 */
function drawAbilityRow(doc, stats, y) {
  if (y >= BOTTOM - LINE_H * 3) return y;

  const abilities = [
    { label: 'STR', score: stats.str, mod: stats.strMod },
    { label: 'DEX', score: stats.dex, mod: stats.dexMod },
    { label: 'CON', score: stats.con, mod: stats.conMod },
    { label: 'INT', score: stats.int, mod: stats.intMod },
    { label: 'WIS', score: stats.wis, mod: stats.wisMod },
    { label: 'CHA', score: stats.cha, mod: stats.chaMod },
  ];

  const colW  = INNER_W / 6;
  const baseX = X;

  // Row 1: labels (5pt bold, grey)
  setFont(doc, 'bold', 5);
  doc.setTextColor(60);
  abilities.forEach((a, i) => {
    const cx = baseX + i * colW + colW / 2;
    doc.text(a.label, cx, y + 1.5, { align: 'center' });
  });
  doc.setTextColor(0);
  y += 2.0;

  // Row 2: scores (6.5pt bold)
  setFont(doc, 'bold', 6.5);
  abilities.forEach((a, i) => {
    const cx = baseX + i * colW + colW / 2;
    doc.text(String(a.score ?? '—'), cx, y + 1.8, { align: 'center' });
  });
  y += LINE_H;

  // Row 3: modifiers (5.5pt normal)
  setFont(doc, 'normal', 5.5);
  abilities.forEach((a, i) => {
    const cx = baseX + i * colW + colW / 2;
    doc.text(formatModifier(a.mod ?? 0), cx, y + 1.5, { align: 'center' });
  });
  y += 2.0;

  return y;
}

/**
 * Draws a grid of charge boxes for wand charge tracking.
 * Filled boxes = used charges; empty boxes = remaining charges.
 * Returns the new y after the grid.
 * @param {jsPDF} doc
 * @param {number} total   Total boxes (50 for wands)
 * @param {number} used    Number of filled (used) boxes
 * @param {number} y       Starting y
 */
function drawChargeBoxes(doc, total, used, y) {
  if (y >= BOTTOM - LINE_H) return y;

  const boxSize = 2.5;
  const gap     = 0.5;
  const perRow  = Math.floor(INNER_W / (boxSize + gap));

  let bx = X;
  let by = y;
  let col = 0;

  for (let i = 0; i < total; i++) {
    if (by >= BOTTOM) break;
    if (i > 0 && col % perRow === 0) {
      bx = X;
      by += boxSize + gap;
    }

    doc.setLineWidth(0.15);
    if (i < used) {
      doc.setFillColor(0);
      doc.rect(bx, by, boxSize, boxSize, 'FD');
    } else {
      doc.setFillColor(255);
      doc.setDrawColor(0);
      doc.rect(bx, by, boxSize, boxSize, 'S');
    }
    bx += boxSize + gap;
    col++;
  }

  const rows = Math.ceil(total / perRow);
  return y + rows * (boxSize + gap) + 0.5;
}

/**
 * Draws the passphrase section at the bottom of the card.
 * Separated by a dotted rule. Text is right-aligned in small, grey type.
 * @param {jsPDF} doc
 * @param {string} passphrase
 */
function drawPassphrase(doc, passphrase) {
  const ruleY = BOTTOM - 5;
  doc.setLineDash([0.3, 0.5]);
  doc.setLineWidth(0.15);
  doc.setDrawColor(150);
  doc.line(X, ruleY, X + INNER_W, ruleY);
  doc.setLineDash([]);
  doc.setDrawColor(0);

  setFont(doc, 'normal', 5.5);
  doc.setTextColor(100);
  const lines = doc.splitTextToSize(String(passphrase ?? ''), INNER_W);
  const textY = ruleY + 2;
  doc.text(lines[0] ?? '', X + INNER_W, textY, { align: 'right' });
  doc.setTextColor(0);
}

// ── Content helpers ───────────────────────────────────────────────────────────

function buildTypeLabel(item) {
  const parts = [item.type];
  if (item.slot && item.slot !== 'None') parts.push(`Slot: ${item.slot}`);
  return parts.filter(Boolean).join(' — ');
}

function buildImmuneLine(def) {
  const parts = [];
  if (def.immunities?.length)  parts.push(`Immune ${def.immunities.slice(0, 3).join(', ')}`);
  if (def.resistances?.length) parts.push(`Resist ${def.resistances.slice(0, 2).join(', ')}`);
  return parts.join('; ');
}

function truncateList(list, maxItems, separator = ', ') {
  if (list.length <= maxItems) return list.join(separator);
  return `${list.slice(0, maxItems).join(separator)} +${list.length - maxItems} more`;
}

/**
 * Clips a string to fit within maxWidth mm using jsPDF text measurement.
 * Appends '…' if truncated.
 */
function clip(text, doc, maxWidth) {
  let s = String(text ?? '');
  while (s.length > 1 && doc.getTextWidth(s) > maxWidth) {
    s = s.slice(0, -2) + '…';
  }
  return s;
}

function abbreviateSkill(name) {
  const abbr = {
    'Acrobatics': 'Acr', 'Bluff': 'Blff', 'Climb': 'Clmb',
    'Diplomacy': 'Dipl', 'Disable Device': 'DD', 'Disguise': 'Disg',
    'Escape Artist': 'EA', 'Handle Animal': 'HA', 'Intimidate': 'Intim',
    'Knowledge (arcana)': 'K(arc)', 'Knowledge (dungeoneering)': 'K(dng)',
    'Knowledge (engineering)': 'K(eng)', 'Knowledge (geography)': 'K(geo)',
    'Knowledge (history)': 'K(his)', 'Knowledge (local)': 'K(loc)',
    'Knowledge (nature)': 'K(nat)', 'Knowledge (nobility)': 'K(nob)',
    'Knowledge (planes)': 'K(pln)', 'Knowledge (religion)': 'K(rel)',
    'Linguistics': 'Ling', 'Perception': 'Perc', 'Sense Motive': 'SM',
    'Sleight of Hand': 'SoH', 'Spellcraft': 'Spcrft', 'Stealth': 'Stlth',
    'Survival': 'Surv', 'Swim': 'Swim', 'Use Magic Device': 'UMD',
  };
  return abbr[name] ?? name;
}

function sanitiseFilename(name) {
  return String(name).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}
