// Spell form section renderers.
// Each exported function returns an HTML string for one collapsible section
// of the spell form.
// No DOM manipulation here — pure HTML string generation.

import { SPELL_SCHOOLS, SPELL_LEVELS, SAVING_THROW_TYPES, DAMAGE_TYPES } from '../entities/spell.js';

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

function checkboxInput(name, checked = false, label = '') {
  return `
    <div class="checkbox-field">
      <input type="checkbox" data-field="${name}" id="field-${name}" ${checked ? 'checked' : ''}>
      <label for="field-${name}">${escapeHtml(label)}</label>
    </div>
  `;
}

function textareaInput(name, value = '', placeholder = '', extra = '') {
  return `<textarea data-field="${name}" placeholder="${escapeHtml(placeholder)}" ${extra}>${escapeHtml(value)}</textarea>`;
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

// ── Section 1: Identity ────────────────────────────────────

export function renderIdentitySection(spell) {
  return section('Identity', `
    <div class="form-grid-2">
      ${field('Name', textInput('name', spell.name), 'field-name')}
      ${field('Level', selectInput('level', SPELL_LEVELS.map(l => String(l)), String(spell.level)))}
      ${field('School', selectInput('school', SPELL_SCHOOLS, spell.school))}
    </div>
  `, true);
}

// ── Section 2: Casting ─────────────────────────────────────

export function renderCastingSection(spell) {
  return section('Casting', `
    <div class="form-grid-2">
      ${field('Casting Time', textInput('castingTime', spell.castingTime))}
      ${field('Range', textInput('range', spell.range))}
      ${field('Duration', textInput('duration', spell.duration))}
    </div>
  `);
}

// ── Section 3: Components ──────────────────────────────────

export function renderComponentsSection(spell) {
  const components = spell.components || {};
  return section('Components', `
    <div class="form-grid-2">
      ${checkboxInput('components.verbal', components.verbal, 'Verbal')}
      ${checkboxInput('components.somatic', components.somatic, 'Somatic')}
      ${checkboxInput('components.material', components.material, 'Material')}
      ${checkboxInput('components.focus', components.focus, 'Focus')}
      ${checkboxInput('components.divineFocus', components.divineFocus, 'Divine Focus')}
    </div>
    ${components.material ? field('Material Description', textInput('components.materialDescription', components.materialDescription, 'placeholder="(optional)"')) : ''}
  `);
}

// ── Section 4: Saving Throws & SR ──────────────────────────

export function renderSaveSection(spell) {
  return section('Saving Throw & Spell Resistance', `
    <div class="form-grid-2">
      ${field('Saving Throw', selectInput('savingThrow', SAVING_THROW_TYPES, spell.savingThrow))}
      ${checkboxInput('spellResistance', spell.spellResistance, 'Spell Resistance Applies')}
    </div>
  `);
}

// ── Section 5: Damage (Optional) ───────────────────────────

export function renderDamageSection(spell) {
  return section('Damage (Optional)', `
    <div class="form-grid-2">
      ${field('Damage Type', selectInput('damageType', ['', ...DAMAGE_TYPES], spell.damageType || ''))}
      ${field('Damage Rolls', textInput('damageRolls', spell.damageRolls, 'placeholder="e.g. 1d4, 2d6+2 per level"'))}
    </div>
  `);
}

// ── Section 6: Description ────────────────────────────────

export function renderDescriptionSection(spell) {
  return section('Description', `
    ${field('Rules Text', textareaInput('description', spell.description, 'Enter the full spell text and mechanics…'))}
  `);
}

// ── Section 7: Metadata ────────────────────────────────────

export function renderMetadataSection(spell) {
  return section('Metadata', `
    ${field('Notes', textareaInput('meta.notes', spell.meta?.notes ?? '', 'Optional notes…'))}
  `);
}
