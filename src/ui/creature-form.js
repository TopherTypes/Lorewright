// Creature form — coordinator for the full stat block edit view.
// Handles: loading/initialising the creature, rendering section HTML,
// live recalculation of derived fields, auto-save with debounce,
// and navigation between new/existing creature routes.

import { getCreatureById, saveCreature } from '../storage/creatures.js';
import { createEmptyCreature, deriveCreature } from '../entities/creature.js';
import { getViewRoot } from './shell.js';
import { formatModifier, formatCR, formatXP } from '../utils/formatters.js';
import { STANDARD_SKILLS } from '../utils/pf1e-modifiers.js';
import {
  renderIdentitySection,
  renderInitiativeSection,
  renderDefenceSection,
  renderOffenceSection,
  renderStatisticsSection,
  renderEcologySection,
  renderSpecialAbilitiesSection,
  renderDescriptionSection,
} from './creature-form-sections.js';

// Auto-save debounce delay in milliseconds
const AUTOSAVE_DELAY = 1000;

// Module-level state for the active form session
let activeCreature = null;
let autosaveTimer  = null;
let isDirty        = false;

/**
 * Renders the creature edit form.
 * If id is null, creates a new empty creature.
 * @param {string|null} id  Creature UUID, or null for a new creature
 */
export async function showCreatureForm(id) {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let creature;
  if (id) {
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
  } else {
    creature = createEmptyCreature();
  }

  activeCreature = creature;
  isDirty = false;

  root.innerHTML = renderFormPage(creature);
  attachFormListeners(root, creature);
  updateAllOutputs(root, deriveCreature(creature));
  updateSkillVisibility(root, false);
}

// ── Render ────────────────────────────────────────────────

function renderFormPage(creature) {
  const isNew  = !creature.meta.id || creature.name === '';
  const title  = isNew ? 'New Creature' : creature.name;
  const crText = isNew ? '' : ` — CR ${formatCR(creature.cr)}`;

  return `
    <div class="page-header">
      <h1 class="page-title">${escapeHtml(title)}${escapeHtml(crText)}</h1>
      <div class="page-actions">
        <span class="save-indicator" id="save-indicator"></span>
        <button class="btn btn-primary" id="btn-save">Save</button>
      </div>
    </div>
    <form id="creature-form" autocomplete="off">
      ${renderIdentitySection(creature)}
      ${renderInitiativeSection(creature)}
      ${renderDefenceSection(creature)}
      ${renderOffenceSection(creature)}
      ${renderStatisticsSection(creature)}
      ${renderEcologySection(creature)}
      ${renderSpecialAbilitiesSection(creature)}
      ${renderDescriptionSection(creature)}
    </form>
  `;
}

// ── Event listeners ───────────────────────────────────────

function attachFormListeners(root, creature) {
  const form = root.querySelector('#creature-form');

  // Single delegated input listener — recalculates on every change
  form.addEventListener('input', () => {
    scheduleAutosave(root);
    const updated = readFormData(form, activeCreature);
    activeCreature = updated;
    updateAllOutputs(root, deriveCreature(updated));
    updateSkillTotals(root, deriveCreature(updated));
  });

  // Dynamic list: add item
  form.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-add-list]');
    if (addBtn) {
      handleAddListItem(form, addBtn.dataset.addList, root);
      return;
    }

    // Dynamic list: remove item
    const removeBtn = event.target.closest('.remove-item-btn');
    if (removeBtn) {
      handleRemoveListItem(form, removeBtn, root);
      return;
    }

    // Special ability: remove
    const removeSaBtn = event.target.closest('[data-remove-sa]');
    if (removeSaBtn) {
      handleRemoveSpecialAbility(form, parseInt(removeSaBtn.dataset.removeSa, 10), root);
      return;
    }
  });

  // Add special ability button
  root.querySelector('#add-special-ability')?.addEventListener('click', () => {
    handleAddSpecialAbility(form, root);
  });

  // Skills toggle
  root.querySelector('#skills-toggle')?.addEventListener('click', (event) => {
    const btn = event.currentTarget;
    const showAll = btn.dataset.showAll === 'true';
    btn.dataset.showAll = showAll ? 'false' : 'true';
    btn.textContent = showAll ? 'Show zero-rank skills' : 'Hide zero-rank skills';
    updateSkillVisibility(root, !showAll);
  });

  // Apply suggested XP from CR
  root.querySelector('#btn-apply-xp')?.addEventListener('click', () => {
    const derived = deriveCreature(activeCreature);
    if (derived.suggestedXP == null) return;
    const xpInput = form.querySelector('[data-field="xp"]');
    if (xpInput) {
      xpInput.value = derived.suggestedXP;
      xpInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Apply HP average from hit dice
  root.querySelector('#btn-apply-hp')?.addEventListener('click', () => {
    const derived = deriveCreature(activeCreature);
    if (derived.defence.hp.avgFromHD == null) return;
    const hpInput = form.querySelector('[data-field="defence.hp.total"]');
    if (hpInput) {
      hpInput.value = derived.defence.hp.avgFromHD;
      hpInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Save button
  root.querySelector('#btn-save')?.addEventListener('click', () => {
    saveNow(root);
  });
}

// ── Read form data ────────────────────────────────────────

/**
 * Reads all form inputs and reconstructs the creature object.
 * Uses data-field attributes (dot-notation paths) to map values to the object.
 * @param {HTMLFormElement} form
 * @param {object} base  The current creature (for fields not represented in the form)
 * @returns {object} Updated creature
 */
function readFormData(form, base) {
  // Deep-clone the base so we don't mutate the stored object
  const creature = structuredClone(base);

  // ── Standard data-field inputs ──────────────────────────
  form.querySelectorAll('[data-field]').forEach(input => {
    const path  = input.dataset.field;
    const value = coerceInputValue(input);
    setNestedValue(creature, path, value);
  });

  // ── Dynamic list fields (data-list-field) ───────────────
  // Collect all unique list field names
  const listFields = new Set();
  form.querySelectorAll('[data-list-field]').forEach(input => {
    listFields.add(input.dataset.listField);
  });

  listFields.forEach(listField => {
    const inputs = form.querySelectorAll(`[data-list-field="${listField}"]`);
    const values = Array.from(inputs).map(i => i.value);
    setNestedValue(creature, listField, values);
  });

  // ── Skills (special structured list) ────────────────────
  const skillNameInputs  = form.querySelectorAll('[data-skill-field="name"]');
  const skillRankInputs  = form.querySelectorAll('[data-skill-field="ranks"]');
  const skills = [];
  skillNameInputs.forEach((nameInput, i) => {
    const ranksInput = skillRankInputs[i];
    skills.push({
      name:  nameInput.value,
      ranks: parseInt(ranksInput?.value ?? '0', 10) || 0,
    });
  });
  creature.statistics.skills = skills;

  // ── Special abilities (structured list) ─────────────────
  const saNameInputs = form.querySelectorAll('[data-sa-field="name"]');
  const saTypeInputs = form.querySelectorAll('[data-sa-field="type"]');
  const saDescInputs = form.querySelectorAll('[data-sa-field="description"]');
  const specialAbilities = [];
  saNameInputs.forEach((nameInput, i) => {
    specialAbilities.push({
      name:        nameInput.value,
      type:        saTypeInputs[i]?.value ?? 'Ex',
      description: saDescInputs[i]?.value ?? '',
    });
  });
  creature.specialAbilities = specialAbilities;

  return creature;
}

/**
 * Returns the correctly-typed value from a form input.
 */
function coerceInputValue(input) {
  if (input.type === 'number') {
    const n = parseFloat(input.value);
    return isNaN(n) ? 0 : n;
  }
  return input.value ?? '';
}

/**
 * Sets a value at a dot-notation path in an object.
 * e.g. setNestedValue(obj, 'defence.ac.armour', 3)
 */
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

// ── Update calculated outputs ─────────────────────────────

/**
 * Updates all <output> and .ability-mod elements with derived values.
 * @param {Element} root  The view root
 * @param {object} derived  A fully derived creature object
 */
function updateAllOutputs(root, derived) {
  setOutput(root, 'out-ac-total', derived.defence.ac.total);
  setOutput(root, 'out-ac-touch', derived.defence.ac.touch);
  setOutput(root, 'out-ac-flat',  derived.defence.ac.flatFooted);

  const saves = derived.defence.saves;
  setOutput(root, 'out-save-fort', formatModifier(saves.fort.total));
  setOutput(root, 'out-save-ref',  formatModifier(saves.ref.total));
  setOutput(root, 'out-save-will', formatModifier(saves.will.total));

  setOutput(root, 'out-cmb', formatModifier(derived.statistics.cmb));
  setOutput(root, 'out-cmd', derived.statistics.cmd);

  // Initiative total (DEX mod + misc)
  setOutput(root, 'out-initiative', formatModifier(derived.initiative.total ?? 0));

  // XP suggestion from CR
  const suggestedXP = derived.suggestedXP;
  setOutput(root, 'out-xp-suggested', suggestedXP != null ? formatXP(suggestedXP) : '—');

  // HP average from hit dice expression
  const avgHP = derived.defence.hp.avgFromHD;
  setOutput(root, 'out-hp-avg', avgHP != null ? String(avgHP) : '—');

  // Ability modifier displays
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  abilities.forEach(ab => {
    const el = root.querySelector(`#out-${ab}-mod`);
    if (el) el.textContent = formatModifier(derived.statistics[`${ab}Mod`]);
  });

  updateSkillTotals(root, derived);

  // Update page title with current name and CR
  const titleEl = root.querySelector('.page-title');
  if (titleEl) {
    const name = derived.name || 'New Creature';
    const cr   = derived.cr   ? ` — CR ${formatCR(derived.cr)}` : '';
    titleEl.textContent = name + cr;
  }
}

function setOutput(root, id, value) {
  const el = root.querySelector(`#${id}`);
  if (el) el.textContent = value ?? '—';
}

function updateSkillTotals(root, derived) {
  (derived.statistics.skills ?? []).forEach((skill, i) => {
    const el = root.querySelector(`#out-skill-${i}`);
    if (el) el.textContent = formatModifier(skill.total ?? 0);
  });
}

function updateSkillVisibility(root, showAll) {
  root.querySelectorAll('.skill-row').forEach(row => {
    const ranksInput = row.querySelector('[data-skill-field="ranks"]');
    const ranks = parseInt(ranksInput?.value ?? '0', 10) || 0;
    if (showAll) {
      row.style.display = '';
    } else {
      row.style.display = ranks === 0 ? 'none' : '';
    }
  });
}

// ── Dynamic list management ───────────────────────────────

function handleAddListItem(form, listField, root) {
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;

  // Add empty string to the list
  const currentList = getNestedValue(activeCreature, listField) ?? [];
  setNestedValue(activeCreature, listField, [...currentList, '']);

  refreshForm(root);
}

function handleRemoveListItem(form, removeBtn, root) {
  const listField = removeBtn.dataset.listField;
  const index     = parseInt(removeBtn.dataset.index, 10);
  const updated   = readFormData(form, activeCreature);
  activeCreature  = updated;

  const currentList = getNestedValue(activeCreature, listField) ?? [];
  currentList.splice(index, 1);
  setNestedValue(activeCreature, listField, currentList);

  refreshForm(root);
}

function handleAddSpecialAbility(form, root) {
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  activeCreature.specialAbilities.push({ name: '', type: 'Ex', description: '' });
  refreshForm(root);
}

function handleRemoveSpecialAbility(form, index, root) {
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  activeCreature.specialAbilities.splice(index, 1);
  refreshForm(root);
}

/**
 * Re-renders the form page with the current activeCreature state.
 * Used after adding/removing dynamic list items.
 */
function refreshForm(root) {
  const showAll = root.querySelector('#skills-toggle')?.dataset?.showAll === 'true';
  root.innerHTML = renderFormPage(activeCreature);
  attachFormListeners(root, activeCreature);
  updateAllOutputs(root, deriveCreature(activeCreature));
  updateSkillVisibility(root, showAll);
  markDirty(root);
}

/**
 * Retrieves a value at a dot-notation path from an object.
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
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
  if (!activeCreature) return;

  clearTimeout(autosaveTimer);
  activeCreature.meta.updatedAt = new Date().toISOString();

  try {
    await saveCreature(activeCreature);
  } catch (err) {
    const indicator = root?.querySelector('#save-indicator');
    if (indicator) {
      indicator.textContent = `Save failed: ${err.message}`;
      indicator.className   = 'save-indicator unsaved';
    }
    return;
  }

  isDirty = false;

  // After saving a new creature, update the URL so the route reflects the ID.
  // history.replaceState changes the URL without triggering hashchange.
  const currentHash = window.location.hash;
  const expectedHash = `#/creature/${activeCreature.meta.id}`;
  if (currentHash !== expectedHash) {
    history.replaceState(null, '', expectedHash);
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
