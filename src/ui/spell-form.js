// Spell form — coordinator for the spell edit view.
// Handles: loading/initialising the spell, rendering section HTML,
// auto-save with debounce, and navigation between new/existing spell routes.

import { getSpellById, saveSpell } from '../storage/spells.js';
import { createEmptySpell } from '../entities/spell.js';
import { getViewRoot } from './shell.js';
import {
  renderIdentitySection,
  renderCastingSection,
  renderComponentsSection,
  renderSaveSection,
  renderDamageSection,
  renderDescriptionSection,
  renderMetadataSection,
} from './spell-form-sections.js';

// Auto-save debounce delay in milliseconds
const AUTOSAVE_DELAY = 1000;

// Module-level state for the active form session
let activeSpell = null;
let autosaveTimer = null;
let isDirty = false;

/**
 * Renders the spell edit form.
 * If id is null, creates a new empty spell.
 * @param {string|null} id  Spell UUID, or null for a new spell
 */
export async function showSpellForm(id) {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let spell;
  if (id) {
    try {
      spell = await getSpellById(id);
    } catch (err) {
      root.innerHTML = `<div class="alert alert-danger">Failed to load spell: ${err.message}</div>`;
      return;
    }
    if (!spell) {
      root.innerHTML = `<div class="alert alert-danger">Spell not found.</div>`;
      return;
    }
  } else {
    spell = createEmptySpell();
  }

  activeSpell = spell;
  isDirty = false;

  // Check if we should expand all sections (e.g., after import)
  const shouldExpandAll = sessionStorage.getItem('expandAllDetails') === 'true';
  sessionStorage.removeItem('expandAllDetails');

  root.innerHTML = renderFormPage(spell);
  attachFormListeners(root);

  // Expand all sections if flag was set
  if (shouldExpandAll) {
    document.querySelectorAll('.form-section').forEach(details => {
      details.setAttribute('open', '');
    });
  }
}

// ── Render ────────────────────────────────────────────────

function renderFormPage(spell) {
  const isNew = !spell.name || spell.name === '';
  const title = isNew ? 'New Spell' : spell.name;
  const levelText = isNew ? '' : ` — Level ${spell.level}`;

  return `
    <div class="page-header">
      <h1 class="page-title">${escapeHtml(title)}${escapeHtml(levelText)}</h1>
      <div class="page-actions">
        <span class="save-indicator" id="save-indicator"></span>
        <button class="btn btn-primary" id="btn-save">Save</button>
      </div>
    </div>
    <form id="spell-form" autocomplete="off">
      ${renderIdentitySection(spell)}
      ${renderCastingSection(spell)}
      ${renderComponentsSection(spell)}
      ${renderSaveSection(spell)}
      ${renderDamageSection(spell)}
      ${renderDescriptionSection(spell)}
      ${renderMetadataSection(spell)}
    </form>
  `;
}

// ── Event listeners ───────────────────────────────────────

/**
 * Handle input events: save and recalculate on change
 */
function formInputHandler() {
  scheduleAutosave(getViewRoot());
  const form = document.querySelector('#spell-form');
  activeSpell = readFormData(form, activeSpell);
  updatePageTitle(getViewRoot(), activeSpell);
}

/**
 * Handle click events: delegated handlers for special buttons
 */
function formClickHandler(event) {
  const target = event.target;

  // Save button
  const saveBtn = target.closest('#btn-save');
  if (saveBtn) {
    saveNow(getViewRoot());
    return;
  }
}

function attachFormListeners(root) {
  const form = root.querySelector('#spell-form');

  // Remove old listeners if they exist (defensive cleanup)
  if (form._inputHandler) {
    form.removeEventListener('input', form._inputHandler);
    form._inputHandler = null;
  }
  if (form._clickHandler) {
    form.removeEventListener('click', form._clickHandler);
    form._clickHandler = null;
  }

  // Attach new listeners
  form.addEventListener('input', formInputHandler);
  form._inputHandler = formInputHandler;

  form.addEventListener('click', formClickHandler);
  form._clickHandler = formClickHandler;
}

// ── Form data reading ──────────────────────────────────────

/**
 * Reads all form input values back into the spell object.
 * Handles text, number, checkbox inputs, and nested fields (e.g., "components.verbal").
 * @param {HTMLFormElement} form
 * @param {object} spell
 * @returns {object} Updated spell object
 */
function readFormData(form, spell) {
  const updated = JSON.parse(JSON.stringify(spell)); // Deep copy

  // Read all inputs in the form
  const inputs = form.querySelectorAll('input, select, textarea');
  for (const input of inputs) {
    const fieldName = input.dataset.field;
    if (!fieldName) continue;

    let value;
    if (input.type === 'checkbox') {
      value = input.checked;
    } else if (input.type === 'number') {
      value = input.value === '' ? 0 : parseFloat(input.value);
    } else {
      value = input.value;
    }

    setNestedValue(updated, fieldName, value);
  }

  updated.meta.updatedAt = new Date().toISOString();
  return updated;
}

/**
 * Sets a nested property in an object using dot notation.
 * @param {object} obj
 * @param {string} path Dot-separated path, e.g. "components.verbal"
 * @param {any} value
 */
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

// ── Auto-save ──────────────────────────────────────────────

/**
 * Schedules an auto-save after a debounce delay.
 * @param {HTMLElement} root
 */
function scheduleAutosave(root) {
  isDirty = true;

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(() => {
    saveNow(root);
  }, AUTOSAVE_DELAY);
}

/**
 * Saves the spell immediately and shows feedback.
 * @param {HTMLElement} root
 */
async function saveNow(root) {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }

  if (!isDirty || !activeSpell) return;

  const indicator = root.querySelector('#save-indicator');
  if (indicator) {
    indicator.textContent = 'Saving…';
    indicator.classList.remove('success', 'error');
  }

  try {
    await saveSpell(activeSpell);
    isDirty = false;

    if (indicator) {
      indicator.textContent = '✓ Saved';
      indicator.classList.add('success');
      setTimeout(() => {
        indicator.textContent = '';
        indicator.classList.remove('success');
      }, 2000);
    }
  } catch (err) {
    if (indicator) {
      indicator.textContent = '✗ Error';
      indicator.classList.add('error');
    }
    console.error('Failed to save spell:', err);
  }
}

// ── UI Updates ─────────────────────────────────────────────

/**
 * Updates the page title when the spell name changes.
 * @param {HTMLElement} root
 * @param {object} spell
 */
function updatePageTitle(root, spell) {
  const header = root.querySelector('.page-title');
  if (header) {
    const title = spell.name || 'New Spell';
    const levelText = spell.name ? ` — Level ${spell.level}` : '';
    header.textContent = title + levelText;
  }
}

// ── Utility ────────────────────────────────────────────────

/**
 * Escapes a string for safe insertion into HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
