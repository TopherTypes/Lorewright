// Creature form section renderers.
// Each exported function returns an HTML string for one collapsible section
// of the full PF1e stat block form.
// No DOM manipulation here — pure HTML string generation.

import { STANDARD_SKILLS } from '../utils/pf1e-modifiers.js';
import { formatModifier } from '../utils/formatters.js';
import { getDamageTypeOptions } from '../constants/damage-types.js';
import { hasLinkedSpells } from '../entities/creature.js';
import { getSpellById } from '../storage/spells.js';

// ── Helpers ───────────────────────────────────────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function field(label, inputHtml, id = '') {
  const labelFor = id ? `for="${id}"` : '';
  return `
    <div class="field">
      <label ${labelFor}>${escapeHtml(label)}</label>
      ${inputHtml}
    </div>
  `;
}

function textInput(name, value = '', extra = '') {
  return `<input type="text" data-field="${name}" value="${escapeHtml(value)}" ${extra}>`;
}

function numInput(name, value = 0, extra = '') {
  return `<input type="number" data-field="${name}" value="${escapeHtml(String(value))}" ${extra}>`;
}

function selectInput(name, options, value = '') {
  const opts = options.map(o => {
    // Handle both string values and {label, value} objects
    const optValue = typeof o === 'string' ? o : o.value;
    const optLabel = typeof o === 'string' ? o : o.label;
    return `<option value="${escapeHtml(optValue)}" ${optValue === value ? 'selected' : ''}>${escapeHtml(optLabel)}</option>`;
  }).join('');
  return `<select data-field="${name}">${opts}</select>`;
}

function dynamicList(dataField, items = [], placeholder = 'Add entry…') {
  const rows = items.map((item, i) => `
    <li class="dynamic-list-item">
      <input type="text" data-list-field="${dataField}" data-index="${i}" value="${escapeHtml(item)}" placeholder="${escapeHtml(placeholder)}">
      <button type="button" class="remove-item-btn" data-list-field="${dataField}" data-index="${i}" title="Remove">×</button>
    </li>
  `).join('');
  return `
    <ul class="dynamic-list" data-list="${dataField}">
      ${rows}
    </ul>
    <button type="button" class="btn btn-ghost btn-sm add-item-btn" data-add-list="${dataField}">+ Add</button>
  `;
}

function section(title, body, open = false) {
  return `
    <details class="form-section" ${open ? 'open' : ''}>
      <summary>${escapeHtml(title)}</summary>
      <div class="section-body">
        ${body}
      </div>
    </details>
  `;
}

// ── Helper functions for structured lists ─────────────────

function renderMeleeAttacksList(attacks) {
  const rows = (attacks ?? []).map((attack, i) => {
    // Handle both string attacks (legacy) and object attacks {name, damageType}
    const attackName = typeof attack === 'string' ? attack : (attack.name ?? '');
    const damageType = typeof attack === 'object' ? (attack.damageType ?? '') : '';
    return `
      <div class="attack-row" data-attack-index="${i}">
        <div class="form-grid-2">
          <input type="text" data-attack-field="name" data-attack-index="${i}" value="${escapeHtml(attackName)}" placeholder="e.g. longsword +8 (1d8+4/19-20)" style="flex:2">
          <select data-attack-field="damageType" data-attack-index="${i}" style="flex:1">
            ${getDamageTypeOptions().map(opt => `<option value="${escapeHtml(opt.value)}" ${opt.value === damageType ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
          </select>
        </div>
        <button type="button" class="remove-item-btn" data-remove-melee="${i}" title="Remove">×</button>
      </div>
    `;
  }).join('');
  return `
    <div id="melee-attacks-list">
      ${rows}
    </div>
    <button type="button" class="btn btn-ghost btn-sm add-item-btn" id="add-melee-attack">
      + Add Melee Attack
    </button>
  `;
}

function renderRangedAttacksList(attacks) {
  const rows = (attacks ?? []).map((attack, i) => {
    // Handle both string attacks (legacy) and object attacks {name, damageType}
    const attackName = typeof attack === 'string' ? attack : (attack.name ?? '');
    const damageType = typeof attack === 'object' ? (attack.damageType ?? '') : '';
    return `
      <div class="attack-row" data-attack-index="${i}">
        <div class="form-grid-2">
          <input type="text" data-attack-field="name" data-attack-index="${i}" value="${escapeHtml(attackName)}" placeholder="e.g. longbow +6 (1d8/×3)" style="flex:2">
          <select data-attack-field="damageType" data-attack-index="${i}" style="flex:1">
            ${getDamageTypeOptions().map(opt => `<option value="${escapeHtml(opt.value)}" ${opt.value === damageType ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
          </select>
        </div>
        <button type="button" class="remove-item-btn" data-remove-ranged="${i}" title="Remove">×</button>
      </div>
    `;
  }).join('');
  return `
    <div id="ranged-attacks-list">
      ${rows}
    </div>
    <button type="button" class="btn btn-ghost btn-sm add-item-btn" id="add-ranged-attack">
      + Add Ranged Attack
    </button>
  `;
}

// ── Alignment and size options ────────────────────────────

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const SIZES = [
  'Fine', 'Diminutive', 'Tiny', 'Small', 'Medium',
  'Large', 'Huge', 'Gargantuan', 'Colossal',
];

const ABILITY_TYPES = ['Ex', 'Su', 'Sp'];

// ── Section 1: Identity ───────────────────────────────────

export function renderIdentitySection(c) {
  return section('Identity', `
    <div class="form-grid-2">
      ${field('Name', textInput('name', c.name), 'field-name')}
      ${field('Type', textInput('type', c.type), 'field-type')}
    </div>
    <div class="form-grid-3">
      ${field('CR', textInput('cr', c.cr))}
      ${field('XP', `
        ${numInput('xp', c.xp)}
        <span class="field-suggestion">Suggested: <output class="calculated" id="out-xp-suggested">—</output>
          <button type="button" class="btn btn-ghost btn-xs" id="btn-apply-xp">Apply</button>
        </span>
      `)}
      ${field('Source', textInput('source', c.source))}
    </div>
    <div class="form-grid-2">
      ${field('Alignment', selectInput('alignment', ALIGNMENTS, c.alignment))}
      ${field('Size', selectInput('size', SIZES, c.size))}
    </div>
    ${field('Senses', dynamicList('senses', c.senses, 'e.g. darkvision 60 ft.'))}
    ${field('Aura', textInput('aura', c.aura))}
    ${field('Tags', dynamicList('meta.tags', c.meta.tags, 'Add tag…'))}
    ${field('Notes', `<textarea data-field="meta.notes" rows="3">${escapeHtml(c.meta.notes)}</textarea>`)}
  `, true);
}

// ── Section 2: Initiative ─────────────────────────────────

export function renderInitiativeSection(c) {
  return section('Initiative', `
    <div class="derived-row">
      <span class="derived-item">Initiative <output class="calculated" id="out-initiative">—</output></span>
    </div>
    <div class="form-grid-1">
      ${field('Misc Modifier', numInput('initiative.miscModifier', c.initiative.miscModifier ?? 0))}
    </div>
  `);
}

// ── Section 3: Defence ────────────────────────────────────

export function renderDefenceSection(c) {
  const ac = c.defence.ac;
  const hp = c.defence.hp;
  const saves = c.defence.saves;

  return section('Defence', `
    <div class="derived-row">
      <span class="derived-item">AC <output class="calculated" id="out-ac-total">—</output></span>
      <span class="derived-item">touch <output class="calculated" id="out-ac-touch">—</output></span>
      <span class="derived-item">flat-footed <output class="calculated" id="out-ac-flat">—</output></span>
    </div>
    <div class="form-grid-2">
      ${field('Armour',     numInput('defence.ac.armour',     ac.armour))}
      ${field('Shield',     numInput('defence.ac.shield',     ac.shield))}
      ${field('Natural',    numInput('defence.ac.natural',    ac.natural))}
      ${field('Deflection', numInput('defence.ac.deflection', ac.deflection))}
      ${field('Misc (AC)',  numInput('defence.ac.misc',       ac.misc))}
    </div>

    <div class="form-grid-3">
      ${field('HP', `
        ${numInput('defence.hp.total', hp.total)}
        <span class="field-suggestion">Avg from HD: <output class="calculated" id="out-hp-avg">—</output>
          <button type="button" class="btn btn-ghost btn-xs" id="btn-apply-hp">Apply</button>
        </span>
      `)}
      ${field('Hit Dice',     textInput('defence.hp.hd',  hp.hd,  'placeholder="e.g. 6d8+12"'))}
      ${field('DR',           textInput('defence.hp.dr',  hp.dr,  'placeholder="e.g. 5/magic"'))}
    </div>
    ${field('Regeneration', textInput('defence.hp.regeneration', hp.regeneration, 'placeholder="e.g. 5 (fire)"'))}

    <div class="derived-row">
      <span class="derived-item">Fort <output class="calculated" id="out-save-fort">—</output></span>
      <span class="derived-item">Ref <output class="calculated" id="out-save-ref">—</output></span>
      <span class="derived-item">Will <output class="calculated" id="out-save-will">—</output></span>
    </div>
    <div class="form-grid-3">
      ${field('Fort (base)',   numInput('defence.saves.fort.base',    saves.fort.base))}
      ${field('Ref (base)',    numInput('defence.saves.ref.base',     saves.ref.base))}
      ${field('Will (base)',   numInput('defence.saves.will.base',    saves.will.base))}
    </div>
    ${field('Save Misc Modifier', numInput('defence.saves.miscModifier', saves.miscModifier ?? 0))}

    ${field('Immunities',  dynamicList('defence.immunities',  c.defence.immunities,  'e.g. fire'))}
    ${field('Resistances', dynamicList('defence.resistances', c.defence.resistances, 'e.g. cold 10'))}
    ${field('Weaknesses',  dynamicList('defence.weaknesses',  c.defence.weaknesses,  'e.g. sunlight'))}

    ${field('Spell Resistance', numInput('defence.sr', c.defence.sr ?? 0))}
  `, true);
}

// ── Helper for spell picker ───────────────────────────────

function renderSpellPickerList(spells = [], spellType = 'spellsKnown') {
  const typeLabels = {
    'spellsKnown': 'Spells Known',
    'spellsPrepared': 'Spells Prepared',
    'spellLikeAbilities': 'Spell-Like Abilities',
  };

  // Group spells by level
  const spellsByLevel = {};
  spells.forEach(spellRef => {
    const level = spellRef.level ?? 0;
    if (!spellsByLevel[level]) {
      spellsByLevel[level] = [];
    }
    spellsByLevel[level].push(spellRef);
  });

  // Render grouped spells
  let spellContent = '';
  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

  sortedLevels.forEach(level => {
    const levelSpells = spellsByLevel[level];
    const levelLabel = level === 0 ? 'Cantrips' : `Level ${level}`;

    const spellItems = levelSpells.map((spellRef, i) => {
      const spellName = spellRef.spellName || '(Unknown Spell)';
      return `
        <div class="spell-picker-item" data-spell-list="${spellType}" data-spell-id="${escapeHtml(spellRef.spellId)}" data-level="${level}">
          <span class="spell-name">${escapeHtml(spellName)} - Level ${level}</span>
          <button type="button" class="remove-item-btn" data-remove-spell="${spellType}" data-spell-id="${escapeHtml(spellRef.spellId)}" title="Remove">×</button>
        </div>
      `;
    }).join('');

    spellContent += `
      <div class="spell-level-group">
        <div class="spell-level-header">${levelLabel}</div>
        <div class="spell-level-items">
          ${spellItems}
        </div>
      </div>
    `;
  });

  const typeLabel = typeLabels[spellType] || spellType;
  return `
    <div class="spell-picker-section" data-spell-type="${escapeHtml(spellType)}">
      <div class="spell-picker-list" data-spell-list="${escapeHtml(spellType)}">
        ${spellContent || '<div class="empty-spell-list">No spells added yet</div>'}
      </div>
      <div class="spell-picker-buttons">
        <button type="button" class="btn btn-ghost btn-sm" data-add-spell-single="${escapeHtml(spellType)}">
          + Add One
        </button>
        <button type="button" class="btn btn-ghost btn-sm" data-add-spell-bulk="${escapeHtml(spellType)}">
          + Bulk Add
        </button>
      </div>
    </div>
  `;
}

// ── Section 4: Offence ────────────────────────────────────

// Helper function to resolve a spell name from the database, with fallback to cached name
async function resolveSpellName(spellRef) {
  try {
    const spell = await getSpellById(spellRef.spellId);
    return spell?.name || spellRef.spellName || '(Unknown)';
  } catch (err) {
    return spellRef.spellName || '(Unknown)';
  }
}

export async function renderOffenceSection(c) {
  const speed = c.offence.speed;
  const spellSlots = c.offence.spellSlots ?? {};
  const spellUsage = c.offence.spellUsage ?? {};

  // Render spell slots UI for spells known
  const spellsKnownIds = c.offence.spellsKnownIds ?? [];
  const hasSpellsKnown = spellsKnownIds.length > 0;
  let spellSlotsContent = '';
  if (hasSpellsKnown) {
    spellSlotsContent = `
      <div class="spell-slots-container">
        <div class="form-grid-2">
          ${field('Caster Level', numInput('offence.spellSlots.casterLevel', spellSlots.casterLevel ?? 1, 'min="1" max="20"'))}
        </div>
        <div class="spell-slots-grid">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
            const available = spellSlots.spellsKnownSlots?.[level] ?? 0;
            const used = spellUsage.spellsKnownUsed?.[level] ?? 0;
            const levelLabel = level === 0 ? 'Cantrips' : `Lvl ${level}`;
            return `
              <div class="spell-slot-row">
                <label>${levelLabel}</label>
                <input type="number" data-field="offence.spellSlots.spellsKnownSlots.${level}" value="${available}" min="0" max="9">
                <span class="slot-usage">Used: ${used}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Render spell slots for prepared spells
  const spellsPreparedIds = c.offence.spellsPreparedIds ?? [];
  let preparedSlotsContent = '';
  if (spellsPreparedIds.length > 0) {
    // Resolve all spell names in parallel
    const resolvedPreparedNames = await Promise.all(
      spellsPreparedIds.map(spellRef => resolveSpellName(spellRef))
    );

    preparedSlotsContent = `
      <div class="prepared-spell-slots">
        ${spellsPreparedIds.map((spellRef, index) => {
          const spellId = spellRef.spellId;
          const spellName = resolvedPreparedNames[index];
          const slots = spellSlots.spellsPreparedSlots?.[spellId] ?? 1;
          const used = spellUsage.spellsPreparedUsed?.[spellId] ?? 0;
          return `
            <div class="prepared-spell-slot-row">
              <label>${escapeHtml(spellName)}</label>
              <input type="number" data-field="offence.spellSlots.spellsPreparedSlots.${escapeHtml(spellId)}" value="${slots}" min="1" max="9">
              <span class="slot-usage">Used: ${used}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render spell-like ability uses per day
  const spellLikeAbilityIds = c.offence.spellLikeAbilityIds ?? [];
  let slaUsesContent = '';
  if (spellLikeAbilityIds.length > 0) {
    // Resolve all spell names in parallel
    const resolvedSLANames = await Promise.all(
      spellLikeAbilityIds.map(spellRef => resolveSpellName(spellRef))
    );

    slaUsesContent = `
      <div class="sla-uses-container">
        ${spellLikeAbilityIds.map((spellRef, index) => {
          const spellId = spellRef.spellId;
          const spellName = resolvedSLANames[index];
          const usesPerDay = spellSlots.spellLikeAbilityUsesPerDay?.[spellId] ?? 1;
          const used = spellUsage.spellLikeAbilityUsed?.[spellId] ?? 0;
          return `
            <div class="sla-uses-row">
              <label>${escapeHtml(spellName)}</label>
              <input type="number" data-field="offence.spellSlots.spellLikeAbilityUsesPerDay.${escapeHtml(spellId)}" value="${usesPerDay}" min="1" max="9">
              <span class="slot-usage">Used: ${used}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  return section('Offence', `
    <div class="form-grid-3">
      ${field('Land (ft.)',  numInput('offence.speed.land',   speed.land))}
      ${field('Fly (ft.)',   numInput('offence.speed.fly',    speed.fly))}
      ${field('Fly Maneuv.', textInput('offence.speed.flyManeuverability', speed.flyManeuverability, 'placeholder="e.g. good"'))}
      ${field('Swim (ft.)',  numInput('offence.speed.swim',   speed.swim))}
      ${field('Climb (ft.)', numInput('offence.speed.climb',  speed.climb))}
      ${field('Burrow (ft.)',numInput('offence.speed.burrow', speed.burrow))}
    </div>
    ${field('Melee Attacks',   renderMeleeAttacksList(c.offence.melee))}
    ${field('Ranged Attacks',  renderRangedAttacksList(c.offence.ranged))}
    ${field('Special Attacks', dynamicList('offence.specialAttacks', c.offence.specialAttacks, 'e.g. breath weapon'))}
    <div class="form-grid-2">
      ${field('Space', textInput('offence.space', c.offence.space, 'placeholder="e.g. 10 ft."'))}
      ${field('Reach', textInput('offence.reach', c.offence.reach, 'placeholder="e.g. 5 ft."'))}
    </div>
    ${field('Spells Known',         renderSpellPickerList(c.offence.spellsKnownIds ?? [], 'spellsKnown'))}
    ${hasSpellsKnown ? field('Spell Slots', spellSlotsContent) : ''}
    ${field('Spells Prepared',      renderSpellPickerList(c.offence.spellsPreparedIds ?? [], 'spellsPrepared'))}
    ${spellsPreparedIds.length > 0 ? field('Prepared Spell Slots', preparedSlotsContent) : ''}
    ${field('Spell-Like Abilities', renderSpellPickerList(c.offence.spellLikeAbilityIds ?? [], 'spellLikeAbilities'))}
    ${spellLikeAbilityIds.length > 0 ? field('SLA Uses Per Day', slaUsesContent) : ''}
  `);
}

// ── Section 5: Statistics ─────────────────────────────────

export function renderStatisticsSection(c) {
  const stats = c.statistics;
  const abilities = [
    { key: 'str', label: 'STR' },
    { key: 'dex', label: 'DEX' },
    { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' },
    { key: 'wis', label: 'WIS' },
    { key: 'cha', label: 'CHA' },
  ];

  const abilityBlocks = abilities.map(({ key, label }) => `
    <div class="ability-block">
      <span class="ability-name">${label}</span>
      <input type="number" data-field="statistics.${key}" value="${stats[key] ?? 10}" min="1" max="100">
      <span class="ability-mod" id="out-${key}-mod">—</span>
    </div>
  `).join('');

  const skillRows = renderSkillRows(stats.skills ?? []);

  return section('Statistics', `
    <div class="form-grid-6">
      ${abilityBlocks}
    </div>
    <div class="derived-row">
      <span class="derived-item">CMB <output class="calculated" id="out-cmb">—</output></span>
      <span class="derived-item">CMD <output class="calculated" id="out-cmd">—</output></span>
    </div>
    <div class="form-grid-3">
      ${field('BAB',      numInput('statistics.bab',     stats.bab))}
      ${field('CMB Misc', numInput('statistics.cmbMisc', stats.cmbMisc ?? 0))}
      ${field('CMD Misc', numInput('statistics.cmdMisc', stats.cmdMisc ?? 0))}
    </div>
    ${field('Feats',            dynamicList('statistics.feats',           stats.feats,            'e.g. Power Attack'))}
    ${field('Special Qualities',dynamicList('statistics.specialQualities',stats.specialQualities, 'e.g. low-light vision'))}
    ${field('Languages',        dynamicList('statistics.languages',        stats.languages,        'e.g. Common'))}
    <div class="field">
      <label>Skills</label>
      <div class="skills-header">
        <span>Skill</span>
        <span>Ranks</span>
        <span>Total</span>
        <span></span>
      </div>
      <div class="skills-list" id="skills-list">
        ${skillRows}
      </div>
      <button type="button" class="btn btn-ghost btn-sm skill-toggle-btn" id="skills-toggle">
        Show zero-rank skills
      </button>
      <button type="button" class="btn btn-ghost btn-sm add-item-btn" data-add-list="statistics.skills">
        + Custom skill
      </button>
    </div>
  `, true);
}

function renderSkillRows(skills) {
  return skills.map((skill, i) => {
    const isZero = (skill.ranks ?? 0) === 0;
    return `
      <div class="skill-row ${isZero ? 'zero-rank' : ''}" data-skill-index="${i}">
        <input type="text"   data-skill-field="name"  data-skill-index="${i}" value="${escapeHtml(skill.name)}" placeholder="Skill name">
        <input type="number" data-skill-field="ranks" data-skill-index="${i}" value="${skill.ranks ?? 0}" min="0">
        <span class="skill-total" id="out-skill-${i}">—</span>
        <button type="button" class="btn btn-ghost btn-xs" data-remove-skill="${i}" title="Remove">×</button>
      </div>
    `;
  }).join('');
}

// ── Section 6: Ecology ────────────────────────────────────

export function renderEcologySection(c) {
  const eco = c.ecology;
  return section('Ecology', `
    ${field('Environment',  textInput('ecology.environment',  eco.environment,  'placeholder="e.g. temperate forests"'))}
    ${field('Organisation', textInput('ecology.organisation', eco.organisation, 'placeholder="e.g. solitary, pair, or pack (3–12)"'))}
    ${field('Treasure',     textInput('ecology.treasure',     eco.treasure,     'placeholder="e.g. standard"'))}
  `);
}

// ── Section 7: Special Abilities ──────────────────────────

export function renderSpecialAbilitiesSection(c) {
  const rows = (c.specialAbilities ?? []).map((ability, i) => `
    <div class="special-ability-row" data-sa-index="${i}">
      <div class="form-grid-2">
        <input type="text" data-sa-field="name" data-sa-index="${i}" value="${escapeHtml(ability.name)}" placeholder="Ability name">
        <select data-sa-field="type" data-sa-index="${i}">
          ${ABILITY_TYPES.map(t => `<option value="${t}" ${t === ability.type ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="dynamic-list-item">
        <textarea data-sa-field="description" data-sa-index="${i}" rows="2" style="flex:1">${escapeHtml(ability.description)}</textarea>
        <button type="button" class="remove-item-btn" data-remove-sa="${i}" title="Remove">×</button>
      </div>
    </div>
  `).join('');

  return section('Special Abilities', `
    <div id="special-abilities-list">
      ${rows}
    </div>
    <button type="button" class="btn btn-ghost btn-sm add-item-btn" id="add-special-ability">
      + Add Special Ability
    </button>
  `);
}

// ── Section 8: Description ────────────────────────────────

export function renderDescriptionSection(c) {
  return section('Description', `
    ${field('Description', `<textarea data-field="description" rows="6">${escapeHtml(c.description)}</textarea>`)}
    <div class="form-grid-2">
      ${field('Image URL', textInput('imageUrl', c.imageUrl, 'placeholder="https://example.com/image.jpg"'))}
      ${field('Or Upload Image', `<input type="file" id="image-upload-creature" accept="image/*">`)}
    </div>
  `);
}
