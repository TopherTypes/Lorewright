// Spell picker modal component.
// Provides UI for selecting spells from the library to link to a creature.
// Supports search and filtering by level/school.

import { getAvailableSpells, searchSpells, getAllSpellSchools } from '../utils/spell-linking.js';

/**
 * Opens a spell picker modal and returns selected spell IDs via callback.
 * @param {object} options Configuration:
 *   - existingSpellIds: array of {spellId, level} already selected (pre-checked)
 *   - spellType: 'spellsKnown', 'spellsPrepared', or 'spellLikeAbilities'
 *   - onConfirm: callback function(selectedSpellIds) called when user clicks Add
 *   - onCancel: optional callback when user clicks Cancel
 */
export async function openSpellPickerModal(options = {}) {
  const {
    existingSpellIds = [],
    spellType = 'spellsKnown',
    onConfirm = () => {},
    onCancel = () => {},
  } = options;

  // Fetch all spells and schools for filtering
  const allSpells = await getAvailableSpells();
  console.log('[spell-picker] Fetched spells:', allSpells.length, 'spells', allSpells);
  const schools = await getAllSpellSchools();
  console.log('[spell-picker] Available schools:', schools);

  // Track current state in the modal session
  let selectedIds;
  try {
    selectedIds = new Set(existingSpellIds.map(s => s.spellId));
    console.log('[spell-picker] Selected IDs:', selectedIds);
  } catch (err) {
    console.error('[spell-picker] Error processing existingSpellIds:', err, existingSpellIds);
    selectedIds = new Set();
  }

  const modalState = {
    allSpells,
    schools,
    selectedIds,
    searchTerm: '',
    filteredSpells: allSpells,
    filterLevels: new Set(),
    filterSchools: new Set(),
  };
  console.log('[spell-picker] Initialized modalState with', modalState.filteredSpells.length, 'spells in filteredSpells');

  // Render and show the modal
  const modalHTML = renderSpellPickerModalHTML(modalState, spellType);
  const modalContainer = document.createElement('div');
  modalContainer.id = 'spell-picker-modal-container';
  document.body.appendChild(modalContainer);
  modalContainer.innerHTML = modalHTML;

  // Attach event listeners
  attachSpellPickerListeners(modalContainer, modalState, onConfirm, onCancel);

  // Show modal (focus on search field)
  const searchInput = modalContainer.querySelector('#spell-picker-search');
  if (searchInput) searchInput.focus();
}

/**
 * Renders the HTML for the spell picker modal.
 */
function renderSpellPickerModalHTML(state, spellType) {
  const schoolCheckboxes = state.schools.map(school => `
    <label class="spell-filter-label">
      <input type="checkbox" class="spell-filter-school" value="${escapeHtml(school)}" />
      ${escapeHtml(school)}
    </label>
  `).join('');

  const levelCheckboxes = Array.from({ length: 10 }, (_, i) => `
    <label class="spell-filter-label">
      <input type="checkbox" class="spell-filter-level" value="${i}" />
      ${i === 0 ? 'Cantrip' : `Level ${i}`}
    </label>
  `).join('');

  const spellRows = state.filteredSpells.map(spell => {
    const isSelected = state.selectedIds.has(spell.meta.id);
    const checked = isSelected ? 'checked' : '';
    return `
      <div class="spell-picker-row" data-spell-id="${escapeHtml(spell.meta.id)}">
        <input type="checkbox" class="spell-picker-checkbox" ${checked} />
        <div class="spell-info">
          <div class="spell-name">${escapeHtml(spell.name)}</div>
          <div class="spell-meta">
            Level ${spell.level} • ${escapeHtml(spell.school)} • ${escapeHtml(spell.castingTime)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="modal-overlay" id="spell-picker-overlay">
      <div class="modal spell-picker-modal">
        <div class="modal-header">
          <h2 class="modal-title">Add ${escapeHtml(spellType === 'spellsKnown' ? 'Spells Known' : spellType === 'spellsPrepared' ? 'Spells Prepared' : 'Spell-Like Abilities')}</h2>
          <button type="button" class="modal-close" id="spell-picker-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="spell-picker-search-section">
            <input
              type="text"
              id="spell-picker-search"
              class="spell-picker-search"
              placeholder="Search by spell name..."
              value=""
            />
          </div>

          <div class="spell-picker-filters">
            <div class="filter-group">
              <h4>Spell Level</h4>
              <div class="filter-options">
                ${levelCheckboxes}
              </div>
            </div>
            <div class="filter-group">
              <h4>School</h4>
              <div class="filter-options">
                ${schoolCheckboxes}
              </div>
            </div>
          </div>

          <div class="spell-picker-list">
            <div class="spell-picker-list-content">
              ${spellRows}
            </div>
          </div>

          <div class="spell-picker-selection-info">
            <span id="spell-count">${state.selectedIds.size} spell${state.selectedIds.size !== 1 ? 's' : ''} selected</span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="spell-picker-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="spell-picker-confirm">Add Selected</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attaches event listeners to the spell picker modal.
 */
function attachSpellPickerListeners(container, state, onConfirm, onCancel) {
  const modal = container.querySelector('.spell-picker-modal');
  const overlay = container.querySelector('.modal-overlay');
  const searchInput = container.querySelector('#spell-picker-search');
  const levelCheckboxes = container.querySelectorAll('.spell-filter-level');
  const schoolCheckboxes = container.querySelectorAll('.spell-filter-school');
  const spellCheckboxes = container.querySelectorAll('.spell-picker-checkbox');
  const confirmBtn = container.querySelector('#spell-picker-confirm');
  const cancelBtn = container.querySelector('#spell-picker-cancel');
  const closeBtn = container.querySelector('#spell-picker-close');
  const listContent = container.querySelector('.spell-picker-list-content');

  // Helper: update filtered spells based on current search/filters
  const updateFilteredSpells = async () => {
    let filtered = state.allSpells;

    // Apply search filter
    if (state.searchTerm.trim().length > 0) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(term));
    }

    // Apply level filter
    if (state.filterLevels.size > 0) {
      filtered = filtered.filter(s => state.filterLevels.has(s.level));
    }

    // Apply school filter
    if (state.filterSchools.size > 0) {
      filtered = filtered.filter(s => state.filterSchools.has(s.school));
    }

    state.filteredSpells = filtered;
    updateListDisplay();
  };

  // Helper: re-render the spell list
  const updateListDisplay = () => {
    const rows = state.filteredSpells.map(spell => {
      const isSelected = state.selectedIds.has(spell.meta.id);
      const checked = isSelected ? 'checked' : '';
      return `
        <div class="spell-picker-row" data-spell-id="${escapeHtml(spell.meta.id)}">
          <input type="checkbox" class="spell-picker-checkbox" ${checked} />
          <div class="spell-info">
            <div class="spell-name">${escapeHtml(spell.name)}</div>
            <div class="spell-meta">
              Level ${spell.level} • ${escapeHtml(spell.school)} • ${escapeHtml(spell.castingTime)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    listContent.innerHTML = rows;

    // Re-attach checkbox listeners
    listContent.querySelectorAll('.spell-picker-checkbox').forEach((checkbox, idx) => {
      checkbox.addEventListener('change', (e) => {
        const spellId = e.target.closest('.spell-picker-row').dataset.spellId;
        if (e.target.checked) {
          state.selectedIds.add(spellId);
        } else {
          state.selectedIds.delete(spellId);
        }
        updateSelectionInfo();
      });
    });

    updateSelectionInfo();
  };

  // Helper: update selection counter
  const updateSelectionInfo = () => {
    const counter = container.querySelector('#spell-count');
    const count = state.selectedIds.size;
    counter.textContent = `${count} spell${count !== 1 ? 's' : ''} selected`;
  };

  // Search input
  searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    updateFilteredSpells();
  });

  // Level filter checkboxes
  levelCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const level = parseInt(e.target.value, 10);
      if (e.target.checked) {
        state.filterLevels.add(level);
      } else {
        state.filterLevels.delete(level);
      }
      updateFilteredSpells();
    });
  });

  // School filter checkboxes
  schoolCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const school = e.target.value;
      if (e.target.checked) {
        state.filterSchools.add(school);
      } else {
        state.filterSchools.delete(school);
      }
      updateFilteredSpells();
    });
  });

  // Spell selection checkboxes
  listContent.querySelectorAll('.spell-picker-checkbox').forEach((checkbox, idx) => {
    checkbox.addEventListener('change', (e) => {
      const spellId = e.target.closest('.spell-picker-row').dataset.spellId;
      if (e.target.checked) {
        state.selectedIds.add(spellId);
      } else {
        state.selectedIds.delete(spellId);
      }
      updateSelectionInfo();
    });
  });

  // Confirm button
  confirmBtn.addEventListener('click', () => {
    const selectedSpells = Array.from(state.selectedIds).map(spellId => {
      const spell = state.allSpells.find(s => s.meta.id === spellId);
      return {
        spellId,
        level: spell?.level ?? 0,
        spellName: spell?.name ?? 'Unknown Spell',
      };
    });
    closeModal(container);
    onConfirm(selectedSpells);
  });

  // Cancel button
  cancelBtn.addEventListener('click', () => {
    closeModal(container);
    onCancel();
  });

  // Close button
  closeBtn.addEventListener('click', () => {
    closeModal(container);
    onCancel();
  });

  // Overlay click to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(container);
      onCancel();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(container);
      onCancel();
    }
  }, { once: true });
}

/**
 * Closes and removes the modal from the DOM.
 */
function closeModal(container) {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Utility: escape HTML special characters to prevent XSS.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
