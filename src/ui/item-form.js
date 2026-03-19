// Magic item form — coordinator for the item edit view.
// Handles: loading/initialising the item, rendering section HTML,
// toggling identified/unidentified state, auto-save with debounce,
// and navigation between new/existing item routes.

import { getItemById, saveItem } from '../storage/items.js';
import { createEmptyItem, generatePassphrase } from '../entities/item.js';
import { getViewRoot } from './shell.js';
import {
  renderItemIdentitySection,
  renderMagicalPropertiesSection,
  renderTypeSpecificSection,
  renderTypeSpecificBody,
  renderEffectsSection,
  renderItemDescriptionSection,
  renderIdentificationSection,
} from './item-form-sections.js';

// Auto-save debounce delay in milliseconds
const AUTOSAVE_DELAY = 1000;

// Module-level state for the active form session
let activeItem     = null;
let autosaveTimer  = null;
let isDirty        = false;

/**
 * Renders the item edit form.
 * If id is null, creates a new empty item.
 * @param {string|null} id  Item UUID, or null for a new item
 */
export async function showItemForm(id) {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let item;
  if (id) {
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
  } else {
    item = createEmptyItem();
  }

  activeItem = item;
  isDirty    = false;

  root.innerHTML = renderFormPage(item);
  attachFormListeners(root);
}

// ── Render ────────────────────────────────────────────────

function renderFormPage(item) {
  const title = item.name || 'New Item';

  return `
    <div class="page-header">
      <h1 class="page-title" id="item-form-title">${escapeHtml(title)}</h1>
      <div class="page-actions">
        <a href="#/items" class="btn btn-secondary">← All Items</a>
        <span class="save-indicator" id="save-indicator"></span>
        <button class="btn btn-secondary" id="btn-print" ${item.name ? '' : 'disabled'}>Print Card</button>
        <button class="btn btn-primary" id="btn-save">Save</button>
      </div>
    </div>
    <form id="item-form" autocomplete="off">
      ${renderItemIdentitySection(item)}
      ${renderMagicalPropertiesSection(item)}
      ${renderTypeSpecificSection(item)}
      ${renderEffectsSection(item)}
      ${renderItemDescriptionSection(item)}
      ${renderIdentificationSection(item)}
    </form>
  `;
}

// ── Event listeners ───────────────────────────────────────

function attachFormListeners(root) {
  const form = root.querySelector('#item-form');

  // Single delegated input listener — auto-saves on every change
  form.addEventListener('input', (event) => {
    scheduleAutosave(root);

    // Update the page title live when name changes
    if (event.target.dataset.field === 'name') {
      const titleEl = root.querySelector('#item-form-title');
      if (titleEl) titleEl.textContent = event.target.value || 'New Item';
      const printBtn = root.querySelector('#btn-print');
      if (printBtn) printBtn.disabled = !event.target.value;
    }

    // Rebuild type-specific section when type changes
    if (event.target.dataset.field === 'type') {
      const updated = readFormData(form, activeItem);
      activeItem = updated;
      const tsContainer = form.querySelector('[data-section="type-specific"]');
      if (tsContainer) {
        tsContainer.innerHTML = renderTypeSpecificBody(activeItem);
        attachSpellListListeners(form, root);
      }
      // Update unidentified name placeholder
      const unidentInput = form.querySelector('[data-field="unidentifiedName"]');
      if (unidentInput) {
        unidentInput.placeholder = `Unidentified ${activeItem.type}`;
      }
      return; // readFormData already called above
    }

    const updated = readFormData(form, activeItem);
    activeItem = updated;
  });

  // Identified toggle — show/hide unidentified fields and generate passphrase
  const identToggle = root.querySelector('#item-identified-toggle');
  if (identToggle) {
    identToggle.addEventListener('change', () => {
      const unidentFields = root.querySelector('#unidentified-fields');
      if (identToggle.checked) {
        activeItem.identified = true;
        if (unidentFields) unidentFields.style.display = 'none';
      } else {
        activeItem.identified = false;
        // Generate passphrase on first toggle to unidentified
        if (!activeItem.passphrase) {
          activeItem.passphrase = generatePassphrase();
          const passphraseDisplay = root.querySelector('#passphrase-display');
          if (passphraseDisplay) passphraseDisplay.value = activeItem.passphrase;
        }
        if (unidentFields) unidentFields.style.display = '';
      }
      scheduleAutosave(root);
    });
  }

  // Passphrase regenerate button
  root.querySelector('#btn-regen-passphrase')?.addEventListener('click', () => {
    activeItem.passphrase = generatePassphrase();
    const display = root.querySelector('#passphrase-display');
    if (display) display.value = activeItem.passphrase;
    scheduleAutosave(root);
  });

  // Dynamic list: add item
  form.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-add-list]');
    if (addBtn) {
      handleAddListItem(form, addBtn.dataset.addList, root);
      return;
    }

    // Dynamic list: remove item
    const removeBtn = event.target.closest('.remove-item-btn[data-list-field]');
    if (removeBtn) {
      handleRemoveListItem(form, removeBtn, root);
      return;
    }

    // Staff spell: remove
    const removeSpellBtn = event.target.closest('[data-remove-spell]');
    if (removeSpellBtn) {
      handleRemoveSpell(form, parseInt(removeSpellBtn.dataset.removeSpell, 10), root);
      return;
    }
  });

  // Add spell button (Staff)
  attachSpellListListeners(form, root);

  // Save button
  root.querySelector('#btn-save')?.addEventListener('click', () => {
    saveNow(root);
  });

  // Print button
  root.querySelector('#btn-print')?.addEventListener('click', () => {
    if (activeItem?.meta?.id) {
      window.location.hash = `#/item/${activeItem.meta.id}/print`;
    }
  });
}

function attachSpellListListeners(form, root) {
  root.querySelector('#add-spell-btn')?.addEventListener('click', () => {
    handleAddSpell(form, root);
  });
}

// ── Read form data ────────────────────────────────────────

/**
 * Reads all form inputs and reconstructs the item object.
 * Uses data-field attributes (dot-notation paths) to map values to the object.
 * @param {HTMLFormElement} form
 * @param {object} base  The current item (for fields not represented in the form)
 * @returns {object} Updated item
 */
function readFormData(form, base) {
  const item = structuredClone(base);

  // ── Standard data-field inputs ──────────────────────────
  form.querySelectorAll('[data-field]').forEach(input => {
    const path  = input.dataset.field;
    // Skip passphrase — managed directly, not via this path
    if (path === 'passphrase') return;
    const value = coerceInputValue(input);
    setNestedValue(item, path, value);
  });

  // ── Dynamic list fields (data-list-field) ───────────────
  const listFields = new Set();
  form.querySelectorAll('[data-list-field]').forEach(input => {
    listFields.add(input.dataset.listField);
  });
  listFields.forEach(listField => {
    const inputs = form.querySelectorAll(`[data-list-field="${listField}"]`);
    const values = Array.from(inputs).map(i => i.value);
    setNestedValue(item, listField, values);
  });

  // ── Staff spell list (structured) ───────────────────────
  const spellNameInputs  = form.querySelectorAll('[data-spell-field="spell"]');
  const spellLevelInputs = form.querySelectorAll('[data-spell-field="level"]');
  if (spellNameInputs.length > 0) {
    const spellList = [];
    spellNameInputs.forEach((nameInput, i) => {
      spellList.push({
        spell: nameInput.value,
        level: parseInt(spellLevelInputs[i]?.value ?? '0', 10) || 0,
      });
    });
    item.spellList = spellList;
  }

  // ── Identification toggle ────────────────────────────────
  const toggle = form.querySelector('#item-identified-toggle');
  if (toggle) {
    item.identified = toggle.checked;
  }

  return item;
}

function coerceInputValue(input) {
  if (input.type === 'number') {
    const n = parseFloat(input.value);
    return isNaN(n) ? 0 : n;
  }
  return input.value ?? '';
}

function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// ── Dynamic list management ───────────────────────────────

function handleAddListItem(form, listField, root) {
  const updated = readFormData(form, activeItem);
  activeItem = updated;
  const currentList = getNestedValue(activeItem, listField) ?? [];
  setNestedValue(activeItem, listField, [...currentList, '']);
  refreshForm(root);
}

function handleRemoveListItem(form, removeBtn, root) {
  const listField = removeBtn.dataset.listField;
  const index     = parseInt(removeBtn.dataset.index, 10);
  const updated   = readFormData(form, activeItem);
  activeItem      = updated;
  const currentList = getNestedValue(activeItem, listField) ?? [];
  currentList.splice(index, 1);
  setNestedValue(activeItem, listField, currentList);
  refreshForm(root);
}

function handleAddSpell(form, root) {
  const updated = readFormData(form, activeItem);
  activeItem = updated;
  activeItem.spellList = [...(activeItem.spellList ?? []), { spell: '', level: 0 }];
  refreshForm(root);
}

function handleRemoveSpell(form, index, root) {
  const updated = readFormData(form, activeItem);
  activeItem = updated;
  activeItem.spellList.splice(index, 1);
  refreshForm(root);
}

function refreshForm(root) {
  root.innerHTML = renderFormPage(activeItem);
  attachFormListeners(root);
  markDirty(root);
}

// ── Save logic ────────────────────────────────────────────

function markDirty(root) {
  isDirty = true;
  const indicator = root.querySelector('#save-indicator');
  if (indicator) {
    indicator.textContent = 'Unsaved changes';
    indicator.className   = 'save-indicator unsaved';
  }
}

function scheduleAutosave(root) {
  markDirty(root);
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveNow(root), AUTOSAVE_DELAY);
}

async function saveNow(root) {
  if (!activeItem) return;

  // Flush the latest form values before saving
  const form = root.querySelector('#item-form');
  if (form) activeItem = readFormData(form, activeItem);

  clearTimeout(autosaveTimer);
  activeItem.meta.updatedAt = new Date().toISOString();

  try {
    await saveItem(activeItem);
  } catch (err) {
    const indicator = root?.querySelector('#save-indicator');
    if (indicator) {
      indicator.textContent = `Save failed: ${err.message}`;
      indicator.className   = 'save-indicator unsaved';
    }
    return;
  }

  isDirty = false;

  // After saving a new item, update the URL so the route reflects the ID.
  const currentHash  = window.location.hash;
  const expectedHash = `#/item/${activeItem.meta.id}`;
  if (currentHash !== expectedHash) {
    history.replaceState(null, '', expectedHash);
    const printBtn = root?.querySelector('#btn-print');
    if (printBtn) printBtn.disabled = false;
  }

  const indicator = root?.querySelector('#save-indicator');
  if (indicator) {
    indicator.textContent = 'Saved';
    indicator.className   = 'save-indicator saved';
    setTimeout(() => {
      if (indicator.isConnected && !isDirty) {
        indicator.textContent = '';
        indicator.className   = 'save-indicator';
      }
    }, 2000);
  }
}

// ── Utility ───────────────────────────────────────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
