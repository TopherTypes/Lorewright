// Magic item form section renderers.
// Each exported function returns an HTML string for one collapsible section
// of the item edit form.
// No DOM manipulation here — pure HTML string generation.

import { ITEM_TYPES, ITEM_SLOTS } from '../entities/item.js';

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
  return section('Magical Properties', `
    <div class="form-grid-2">
      ${field('Aura', textInput('aura', item.aura, 'placeholder="e.g. Moderate Transmutation"'))}
      ${field('Caster Level', numInput('cl', item.cl, 'min="0"'))}
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
          ${field('Charges', numInput('charges', item.charges, 'min="0" max="50"'))}
        </div>
      `);

    case 'Scroll':
      return section('Scroll Details', `
        <div class="form-grid-3">
          ${field('Spell', textInput('spell', item.spell, 'placeholder="e.g. Fireball"'))}
          ${field('Spell Level', numInput('spellLevel', item.spellLevel, 'min="0" max="9"'))}
          ${field('Type', selectInput('scrollType', ['Arcane', 'Divine'], item.scrollType))}
        </div>
      `);

    case 'Staff':
      return section('Staff Details', `
        ${field('Charges', numInput('charges', item.charges, 'min="0" max="50"'))}
        ${field('Spells', renderStaffSpellList(item.spellList ?? []))}
      `);

    case 'Weapon':
      return section('Weapon Details', `
        <div class="form-grid-2">
          ${field('Weapon Type', textInput('weaponType', item.weaponType, 'placeholder="e.g. Longsword"'))}
          ${field('Enhancement Bonus', numInput('enhBonus', item.enhBonus, 'min="0" max="10"'))}
        </div>
        ${field('Special Abilities', `<textarea data-field="specialAbilities" rows="3" placeholder="e.g. Flaming, Speed">${escapeHtml(item.specialAbilities)}</textarea>`)}
      `);

    case 'Armour':
      return section('Armour Details', `
        <div class="form-grid-2">
          ${field('Armour Type', textInput('armourType', item.armourType, 'placeholder="e.g. Full Plate"'))}
          ${field('Enhancement Bonus', numInput('enhBonus', item.enhBonus, 'min="0" max="10"'))}
        </div>
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
  const isIdentified = item.identified !== false;
  const unidentBody  = isIdentified ? 'style="display:none"' : '';
  const autoName     = `Unidentified ${item.type}`;

  return section('Identification', `
    <div class="field">
      <label>
        <input type="checkbox" id="item-identified-toggle" ${isIdentified ? 'checked' : ''}>
        Item is identified
      </label>
    </div>
    <div id="unidentified-fields" ${unidentBody}>
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
