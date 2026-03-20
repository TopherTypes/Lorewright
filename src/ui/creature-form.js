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

/**
 * Handle input events: recalculate on every change
 */
function formInputHandler() {
  scheduleAutosave(getViewRoot());
  const form = document.querySelector('#creature-form');
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  const root = getViewRoot();
  updateAllOutputs(root, deriveCreature(updated));
  updateSkillTotals(root, deriveCreature(updated));
}

/**
 * Handle click events: delegated handlers for add/remove and special buttons
 */
function formClickHandler(event) {
  const form = document.querySelector('#creature-form');
  const root = getViewRoot();
  const target = event.target;

  console.log('[formClickHandler] Click event target:', target, 'Classes:', target.className);

  // Dynamic list: add item
  const addBtn = target.closest('[data-add-list]');
  if (addBtn) {
    console.log('[formClickHandler] Add button triggered for:', addBtn.dataset.addList);
    handleAddListItem(form, addBtn.dataset.addList, root);
    return;
  }

  // Special ability: remove (check before generic .remove-item-btn)
  const removeSaBtn = target.closest('[data-remove-sa]');
  if (removeSaBtn) {
    console.log('[formClickHandler] Remove special ability button triggered, index:', removeSaBtn.dataset.removeSa);
    handleRemoveSpecialAbility(form, parseInt(removeSaBtn.dataset.removeSa, 10), root);
    return;
  }

  // Skill: remove (check before generic .remove-item-btn)
  const removeSkillBtn = target.closest('[data-remove-skill]');
  if (removeSkillBtn) {
    console.log('[formClickHandler] Remove skill button triggered, index:', removeSkillBtn.dataset.removeSkill);
    handleRemoveSkill(form, parseInt(removeSkillBtn.dataset.removeSkill, 10), root);
    return;
  }

  // Dynamic list: remove item
  const removeBtn = target.closest('.remove-item-btn');
  if (removeBtn) {
    console.log('[formClickHandler] Remove dynamic list item triggered, data:', { listField: removeBtn.dataset.listField, index: removeBtn.dataset.index });
    handleRemoveListItem(form, removeBtn, root);
    return;
  }

  // Add special ability button
  const addSaBtn = target.closest('#add-special-ability');
  if (addSaBtn) {
    handleAddSpecialAbility(form, root);
    return;
  }

  // Skills toggle
  const skillsToggle = target.closest('#skills-toggle');
  if (skillsToggle) {
    const showAll = skillsToggle.dataset.showAll === 'true';
    skillsToggle.dataset.showAll = showAll ? 'false' : 'true';
    skillsToggle.textContent = showAll ? 'Show zero-rank skills' : 'Hide zero-rank skills';
    updateSkillVisibility(root, !showAll);
    return;
  }

  // Apply suggested XP from CR
  const applyXpBtn = target.closest('#btn-apply-xp');
  if (applyXpBtn) {
    const derived = deriveCreature(activeCreature);
    if (derived.suggestedXP == null) return;
    const xpInput = form.querySelector('[data-field="xp"]');
    if (xpInput) {
      xpInput.value = derived.suggestedXP;
      xpInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  // Apply HP average from hit dice
  const applyHpBtn = target.closest('#btn-apply-hp');
  if (applyHpBtn) {
    const derived = deriveCreature(activeCreature);
    if (derived.defence.hp.avgFromHD == null) return;
    const hpInput = form.querySelector('[data-field="defence.hp.total"]');
    if (hpInput) {
      hpInput.value = derived.defence.hp.avgFromHD;
      hpInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  // Melee attack: add
  const addMeleeBtn = target.closest('#add-melee-attack');
  if (addMeleeBtn) {
    handleAddMeleeAttack(form, root);
    return;
  }

  // Melee attack: remove
  const removeMeleeBtn = target.closest('[data-remove-melee]');
  if (removeMeleeBtn) {
    handleRemoveMeleeAttack(form, parseInt(removeMeleeBtn.dataset.removeMelee, 10), root);
    return;
  }

  // Ranged attack: add
  const addRangedBtn = target.closest('#add-ranged-attack');
  if (addRangedBtn) {
    handleAddRangedAttack(form, root);
    return;
  }

  // Ranged attack: remove
  const removeRangedBtn = target.closest('[data-remove-ranged]');
  if (removeRangedBtn) {
    handleRemoveRangedAttack(form, parseInt(removeRangedBtn.dataset.removeRanged, 10), root);
    return;
  }

  // Save button
  const saveBtn = target.closest('#btn-save');
  if (saveBtn) {
    saveNow(root);
    return;
  }
}

function attachFormListeners(root, creature) {
  const form = root.querySelector('#creature-form');

  console.log('[attachFormListeners] Attaching listeners to form');

  // Remove old listeners if they exist (defensive cleanup)
  if (form._inputHandler) {
    console.log('[attachFormListeners] Removing old input handler');
    form.removeEventListener('input', form._inputHandler);
    form._inputHandler = null;
  }
  if (form._clickHandler) {
    console.log('[attachFormListeners] Removing old click handler');
    form.removeEventListener('click', form._clickHandler);
    form._clickHandler = null;
  }

  // Only attach if not already attached (prevent duplicates)
  if (!form._inputHandler) {
    form.addEventListener('input', formInputHandler);
    form._inputHandler = formInputHandler;
  }

  if (!form._clickHandler) {
    form.addEventListener('click', formClickHandler);
    form._clickHandler = formClickHandler;
  }

  console.log('[attachFormListeners] Listeners attached');
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
  console.log('[readFormData] Starting to read form data from base creature');
  // Deep-clone the base so we don't mutate the stored object
  const creature = structuredClone(base);

  // ── Standard data-field inputs ──────────────────────────
  form.querySelectorAll('[data-field]').forEach(input => {
    const path  = input.dataset.field;
    const value = coerceInputValue(input);
    setNestedValue(creature, path, value);
  });

  // ── Dynamic list fields (data-list-field) ───────────────
  // Collect all unique list field names (only from input elements, not buttons)
  const listFields = new Set();
  form.querySelectorAll('input[data-list-field]').forEach(input => {
    listFields.add(input.dataset.listField);
  });

  listFields.forEach(listField => {
    const inputs = form.querySelectorAll(`input[data-list-field="${listField}"]`);
    const values = Array.from(inputs).map(i => i.value);
    console.log(`[readFormData] List field "${listField}": ${inputs.length} inputs, values:`, values);
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

  // ── Melee attacks (structured list with damage type) ────
  const meleeListEl = form.querySelector('#melee-attacks-list');
  if (meleeListEl) {
    const meleeAttacks = [];
    meleeListEl.querySelectorAll('.attack-row').forEach((row) => {
      const nameInput = row.querySelector('[data-attack-field="name"]');
      const damageInput = row.querySelector('[data-attack-field="damageType"]');
      const name = nameInput?.value.trim() ?? '';
      if (name) {  // Only add non-empty attacks
        meleeAttacks.push({
          name: name,
          damageType: damageInput?.value ?? '',
        });
      }
    });
    creature.offence.melee = meleeAttacks;
  }

  // ── Ranged attacks (structured list with damage type) ───
  const rangedListEl = form.querySelector('#ranged-attacks-list');
  if (rangedListEl) {
    const rangedAttacks = [];
    rangedListEl.querySelectorAll('.attack-row').forEach((row) => {
      const nameInput = row.querySelector('[data-attack-field="name"]');
      const damageInput = row.querySelector('[data-attack-field="damageType"]');
      const name = nameInput?.value.trim() ?? '';
      if (name) {  // Only add non-empty attacks
        rangedAttacks.push({
          name: name,
          damageType: damageInput?.value ?? '',
        });
      }
    });
    creature.offence.ranged = rangedAttacks;
  }

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
  // Create a new array to avoid mutation issues
  const newList = [...currentList, ''];
  setNestedValue(activeCreature, listField, newList);

  refreshForm(root);
}

function handleRemoveListItem(form, removeBtn, root) {
  const listField = removeBtn.dataset.listField;
  const index     = parseInt(removeBtn.dataset.index, 10);
  console.log('[handleRemoveListItem] Removing from', listField, 'at index', index);

  const updated   = readFormData(form, activeCreature);
  activeCreature  = updated;

  const currentList = getNestedValue(activeCreature, listField) ?? [];
  console.log('[handleRemoveListItem] Current list before splice:', currentList);

  // Ensure we have a valid index before splicing
  if (index >= 0 && index < currentList.length) {
    currentList.splice(index, 1);
    console.log('[handleRemoveListItem] Current list after splice:', currentList);

    // Create a new array reference to avoid mutation issues
    const newList = Array.from(currentList);
    setNestedValue(activeCreature, listField, newList);
  } else {
    console.warn('[handleRemoveListItem] Invalid index:', index, 'for list length:', currentList.length);
  }

  console.log('[handleRemoveListItem] Updated activeCreature:', activeCreature);
  refreshForm(root);
}

function handleAddSpecialAbility(form, root) {
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  activeCreature.specialAbilities.push({ name: '', type: 'Ex', description: '' });
  refreshForm(root);
}

function handleRemoveSpecialAbility(form, index, root) {
  console.log('[handleRemoveSpecialAbility] Removing special ability at index', index);
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  console.log('[handleRemoveSpecialAbility] Special abilities before splice:', activeCreature.specialAbilities);

  if (index >= 0 && index < activeCreature.specialAbilities.length) {
    activeCreature.specialAbilities.splice(index, 1);
  } else {
    console.warn('[handleRemoveSpecialAbility] Invalid index:', index, 'for list length:', activeCreature.specialAbilities.length);
  }

  console.log('[handleRemoveSpecialAbility] Special abilities after splice:', activeCreature.specialAbilities);
  refreshForm(root);
}

function handleRemoveSkill(form, index, root) {
  console.log('[handleRemoveSkill] Removing skill at index', index);
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  console.log('[handleRemoveSkill] Skills before splice:', activeCreature.statistics.skills);

  if (index >= 0 && index < activeCreature.statistics.skills.length) {
    activeCreature.statistics.skills.splice(index, 1);
  } else {
    console.warn('[handleRemoveSkill] Invalid index:', index, 'for list length:', activeCreature.statistics.skills.length);
  }

  console.log('[handleRemoveSkill] Skills after splice:', activeCreature.statistics.skills);
  refreshForm(root);
}

function handleAddMeleeAttack(form, root) {
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  if (!Array.isArray(activeCreature.offence.melee)) {
    activeCreature.offence.melee = [];
  }
  activeCreature.offence.melee.push({ name: '', damageType: '' });
  refreshForm(root);
}

function handleRemoveMeleeAttack(form, index, root) {
  console.log('[handleRemoveMeleeAttack] Removing melee attack at index', index);
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  console.log('[handleRemoveMeleeAttack] Melee attacks before splice:', activeCreature.offence.melee);

  if (Array.isArray(activeCreature.offence.melee) && index >= 0 && index < activeCreature.offence.melee.length) {
    activeCreature.offence.melee.splice(index, 1);
  } else {
    console.warn('[handleRemoveMeleeAttack] Invalid index:', index, 'for list length:', activeCreature.offence.melee?.length);
  }

  console.log('[handleRemoveMeleeAttack] Melee attacks after splice:', activeCreature.offence.melee);
  refreshForm(root);
}

function handleAddRangedAttack(form, root) {
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  if (!Array.isArray(activeCreature.offence.ranged)) {
    activeCreature.offence.ranged = [];
  }
  activeCreature.offence.ranged.push({ name: '', damageType: '' });
  refreshForm(root);
}

function handleRemoveRangedAttack(form, index, root) {
  console.log('[handleRemoveRangedAttack] Removing ranged attack at index', index);
  const updated = readFormData(form, activeCreature);
  activeCreature = updated;
  console.log('[handleRemoveRangedAttack] Ranged attacks before splice:', activeCreature.offence.ranged);

  if (Array.isArray(activeCreature.offence.ranged) && index >= 0 && index < activeCreature.offence.ranged.length) {
    activeCreature.offence.ranged.splice(index, 1);
  } else {
    console.warn('[handleRemoveRangedAttack] Invalid index:', index, 'for list length:', activeCreature.offence.ranged?.length);
  }

  console.log('[handleRemoveRangedAttack] Ranged attacks after splice:', activeCreature.offence.ranged);
  refreshForm(root);
}

/**
 * Saves the open/closed state of all collapsible sections (<details> elements).
 * Returns a map of section title -> open state.
 */
function saveDetailsState(root) {
  const state = {};
  root.querySelectorAll('details.form-section').forEach(details => {
    const summary = details.querySelector('summary');
    if (summary) {
      const title = summary.textContent.trim();
      state[title] = details.hasAttribute('open');
    }
  });
  return state;
}

/**
 * Restores the open/closed state of collapsible sections based on saved state.
 */
function restoreDetailsState(root, savedState) {
  root.querySelectorAll('details.form-section').forEach(details => {
    const summary = details.querySelector('summary');
    if (summary) {
      const title = summary.textContent.trim();
      if (savedState[title] !== undefined) {
        if (savedState[title]) {
          details.setAttribute('open', '');
        } else {
          details.removeAttribute('open');
        }
      }
    }
  });
}

/**
 * Re-renders the form page with the current activeCreature state.
 * Used after adding/removing dynamic list items.
 */
function refreshForm(root) {
  console.log('[refreshForm] Starting form refresh with activeCreature:', activeCreature);
  const showAll = root.querySelector('#skills-toggle')?.dataset?.showAll === 'true';

  // Save the open/closed state of details elements before re-rendering
  const savedDetailsState = saveDetailsState(root);

  // Remove old listeners from the current form BEFORE replacing HTML
  const oldForm = root.querySelector('#creature-form');
  if (oldForm) {
    if (oldForm._inputHandler) {
      oldForm.removeEventListener('input', oldForm._inputHandler);
      oldForm._inputHandler = null;
    }
    if (oldForm._clickHandler) {
      oldForm.removeEventListener('click', oldForm._clickHandler);
      oldForm._clickHandler = null;
    }
  }

  // Clear the root and render new form
  // (innerHTML replacement should clear everything, but being explicit)
  root.textContent = '';
  root.innerHTML = renderFormPage(activeCreature);

  attachFormListeners(root, activeCreature);
  updateAllOutputs(root, deriveCreature(activeCreature));
  updateSkillVisibility(root, showAll);

  // Restore the open/closed state of details elements
  restoreDetailsState(root, savedDetailsState);

  markDirty(root);
  console.log('[refreshForm] Form refresh complete');
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
  if (!activeCreature) {
    console.warn('[saveNow] No active creature set');
    return;
  }

  clearTimeout(autosaveTimer);

  // Read latest form data before saving to capture any unsaved changes
  const form = root?.querySelector('#creature-form');
  if (form) {
    const updated = readFormData(form, activeCreature);
    activeCreature = updated;
    console.log('[saveNow] Form data read and creature updated');
  }

  activeCreature.meta.updatedAt = new Date().toISOString();

  try {
    console.log('[saveNow] Saving creature:', activeCreature.meta.id);
    await saveCreature(activeCreature);
    console.log('[saveNow] Save successful');
  } catch (err) {
    console.error('[saveNow] Save failed:', err);
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
  } else {
    console.warn('[saveNow] Save indicator element not found');
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
