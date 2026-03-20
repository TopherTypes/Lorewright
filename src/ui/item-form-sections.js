// Magic item form section renderers.
// Each exported function returns an HTML string for one collapsible section
// of the item edit form.
// No DOM manipulation here — pure HTML string generation.

import { ITEM_TYPES, ITEM_SLOTS, MAGIC_SCHOOLS, computeAuraStrength } from '../entities/item.js';

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
  const opts = options.map(o =>
    `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`
  ).join('');
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

// ── Section 1: Identity ───────────────────────────────────

export function renderItemIdentitySection(item) {
  return section('Identity', `
    <div class="form-grid-2">
      ${field('Name', textInput('name', item.name), 'field-item-name')}
      ${field('Type', selectInput('type', ITEM_TYPES, item.type))}
    </div>
    <div class="form-grid-2">
      ${field('Slot', selectInput('slot', ITEM_SLOTS, item.slot))}
      ${field('Price', textInput('price', item.price, 'placeholder="e.g. 4,000 gp"'))}
    </div>
    ${field('Weight', textInput('weight', item.weight, 'placeholder="e.g. 1 lb."'))}
    ${field('Tags', dynamicList('meta.tags', item.meta.tags, 'Add tag…'))}
    ${field('Notes', `<textarea data-field="meta.notes" rows="2">${escapeHtml(item.meta.notes)}</textarea>`)}
  `, true);
}

// ── Section 2: Magical Properties ─────────────────────────

export function renderMagicalPropertiesSection(item) {
  const strength = computeAuraStrength(item.cl);
  const auraText = strength && item.magicSchool
    ? `${strength} ${item.magicSchool}`
    : (strength || item.magicSchool || item.aura || '—');

  return section('Magical Properties', `
    <div class="form-grid-2">
      ${field('Caster Level', numInput('cl', item.cl, 'min="0"'))}
      ${field('Magic School', selectInput('magicSchool', ['', ...MAGIC_SCHOOLS], item.magicSchool))}
    </div>
    <div class="field">
      <label>Aura <small class="field-hint">(auto-calculated)</small></label>
      <div class="computed-field-display" id="aura-display">${escapeHtml(auraText)}</div>
      <input type="hidden" data-field="aura" value="${escapeHtml(strength && item.magicSchool ? `${strength} ${item.magicSchool}` : item.aura)}">
    </div>
  `);
}

// ── Section 3: Type-Specific ──────────────────────────────

export function renderTypeSpecificSection(item) {
  return `<div data-section="type-specific">${renderTypeSpecificBody(item)}</div>`;
}

export function renderTypeSpecificBody(item) {
  switch (item.type) {
    case 'Potion':
      return section('Potion Details', `
        <div class="form-grid-2">
          ${field('Spell', textInput('spell', item.spell, 'placeholder="e.g. Cure Light Wounds"'))}
          ${field('Spell Level', numInput('spellLevel', item.spellLevel, 'min="0" max="9"'))}
        </div>
      `);

    case 'Wand':
      return section('Wand Details', `
        <div class="form-grid-3">
          ${field('Spell', textInput('spell', item.spell, 'placeholder="e.g. Magic Missile"'))}
          ${field('Spell Level', numInput('spellLevel', item.spellLevel, 'min="0" max="4"'))}
          ${field('Charges Remaining', numInput('charges', item.charges, 'min="0" max="50"'))}
        </div>
        <p class="field-hint">Charges will be shown as mark-off boxes on the printed card (50 total, filled boxes = used).</p>
      `);

    case 'Scroll': {
      const castDC = 5 + (item.cl || 0);
      return section('Scroll Details', `
        <div class="form-grid-3">
          ${field('Spell', textInput('spell', item.spell, 'placeholder="e.g. Fireball"'))}
          ${field('Spell Level', numInput('spellLevel', item.spellLevel, 'min="0" max="9"'))}
          ${field('Type', selectInput('scrollType', ['Arcane', 'Divine'], item.scrollType))}
        </div>
        <div class="field">
          <label>Cast DC <small class="field-hint">(5 + Caster Level, auto-calculated)</small></label>
          <div class="computed-field-display" id="scroll-castdc">${castDC}</div>
        </div>
      `);
    }

    case 'Staff':
      return section('Staff Details', `
        ${field('Charges', numInput('charges', item.charges, 'min="0" max="50"'))}
        ${field('Spells', renderStaffSpellList(item.spellList ?? []))}
      `);

    case 'Weapon':
      return section('Weapon Details', `
        <div class="form-grid-2">
          ${field('Weapon Type', textInput('weaponType', item.weaponType, 'placeholder="e.g. Longsword"'))}
          ${field('Weapon Category', selectInput('weaponCategory', ['Light', 'One-Handed', 'Two-Handed', 'Ranged'], item.weaponCategory || 'One-Handed'))}
        </div>
        <div class="form-grid-2">
          ${field('Enhancement Bonus', numInput('enhBonus', item.enhBonus, 'min="0" max="10"'))}
          ${field('Damage Dice', textInput('damageDice', item.damageDice, 'placeholder="e.g. 1d8"'))}
        </div>
        <div class="form-grid-2">
          ${field('Damage Type', textInput('damageType', item.damageType, 'placeholder="e.g. Slashing, Piercing"'))}
          ${field('Critical Range', textInput('critRange', item.critRange || '20', 'placeholder="e.g. 19-20"'))}
        </div>
        <div class="form-grid-2">
          ${field('Critical Multiplier', numInput('critMultiplier', item.critMultiplier ?? 2, 'min="2" max="4"'))}
          <div></div>
        </div>
        ${field('Special Abilities', `<textarea data-field="specialAbilities" rows="3" placeholder="e.g. Flaming, Speed">${escapeHtml(item.specialAbilities)}</textarea>`)}
      `);

    case 'Armour':
      return section('Armour Details', `
        <div class="form-grid-2">
          ${field('Armour Type', textInput('armourType', item.armourType, 'placeholder="e.g. Full Plate"'))}
          ${field('Armour Category', selectInput('armorCategory', ['Light', 'Medium', 'Heavy', 'Shield'], item.armorCategory || 'Light'))}
        </div>
        <div class="form-grid-2">
          ${field('Enhancement Bonus', numInput('enhBonus', item.enhBonus, 'min="0" max="10"'))}
          ${field('AC Bonus (base)', numInput('acBonus', item.acBonus ?? 0, 'min="0"'))}
        </div>
        <div class="form-grid-2">
          ${field('Max Dex Bonus', textInput('maxDexBonus', item.maxDexBonus, 'placeholder="e.g. 6, blank = no limit"'))}
          ${field('Arcane Spell Failure (%)', numInput('arcaneSpellFailure', item.arcaneSpellFailure ?? 0, 'min="0" max="100"'))}
        </div>
        ${field('Armour Check Penalty', numInput('armorCheckPenalty', item.armorCheckPenalty ?? 0, 'min="-20" max="0"'))}
        ${field('Special Abilities', `<textarea data-field="specialAbilities" rows="3" placeholder="e.g. Fortification, Shadow">${escapeHtml(item.specialAbilities)}</textarea>`)}
      `);

    default:
      // Wondrous Item, Ring, Rod, Other — no extra type-specific fields
      return '';
  }
}

function renderStaffSpellList(spellList) {
  const rows = spellList.map((entry, i) => `
    <li class="dynamic-list-item">
      <input type="text" data-spell-field="spell" data-spell-index="${i}" value="${escapeHtml(entry.spell ?? '')}" placeholder="Spell name" style="flex:2">
      <input type="number" data-spell-field="level" data-spell-index="${i}" value="${entry.level ?? 0}" min="0" max="9" style="flex:0 0 3rem" title="Spell level">
      <button type="button" class="remove-item-btn" data-remove-spell="${i}" title="Remove">×</button>
    </li>
  `).join('');
  return `
    <ul class="dynamic-list" id="spell-list">
      ${rows}
    </ul>
    <button type="button" class="btn btn-ghost btn-sm" id="add-spell-btn">+ Add Spell</button>
  `;
}

// ── Section 4: Effects & Requirements ─────────────────────

export function renderEffectsSection(item) {
  return section('Effects & Requirements', `
    ${field('Effects', `<textarea data-field="effects" rows="4" placeholder="Describe what this item does…">${escapeHtml(item.effects)}</textarea>`)}
    ${field('Requirements', `<textarea data-field="requirements" rows="2" placeholder="e.g. Craft Wondrous Item, wish">${escapeHtml(item.requirements)}</textarea>`)}
  `);
}

// ── Section 5: Description ────────────────────────────────

export function renderItemDescriptionSection(item) {
  return section('Description', `
    ${field('Description', `<textarea data-field="description" rows="4" placeholder="Physical description, history, lore…">${escapeHtml(item.description)}</textarea>`)}
  `);
}

// ── Section 6: Identification ─────────────────────────────

export function renderIdentificationSection(item) {
  const autoName     = `Unidentified ${item.type}`;

  return section('Identification', `
    <div id="unidentified-fields">
      ${field('Unidentified Name',
        textInput('unidentifiedName', item.unidentifiedName,
          `placeholder="${escapeHtml(autoName)}"`),
        'field-unident-name'
      )}
      ${field('Unidentified Description (flavour text)',
        `<textarea data-field="unidentifiedDescription" rows="4" placeholder="What the players perceive before identification…">${escapeHtml(item.unidentifiedDescription)}</textarea>`
      )}
      <div class="field">
        <label>Passphrase</label>
        <div class="passphrase-row">
          <input type="text" id="passphrase-display" data-field="passphrase" value="${escapeHtml(item.passphrase)}" readonly>
          <button type="button" class="btn btn-ghost btn-sm" id="btn-regen-passphrase">Regenerate</button>
        </div>
        <small class="field-hint">Appears on both cards — use to match them during a session.</small>
      </div>
    </div>
  `, true);
}
