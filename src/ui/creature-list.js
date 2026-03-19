// Creature list view.
// Renders a table of all stored creatures with links to edit and print.
// Does not call deriveCreature — only name, CR, type, and alignment are needed here.

import { getAllCreatures, deleteCreature } from '../storage/creatures.js';
import { getViewRoot } from './shell.js';
import { formatCR } from '../utils/formatters.js';
import { globalBatchSelector } from '../export/batch-selector.js';
import { showBatchExportModal } from './batch-export-modal.js';

/**
 * Renders the creature list into the view root.
 * Called by the router when the user navigates to '#/'.
 */
export async function showCreatureList() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let creatures;
  try {
    creatures = await getAllCreatures();
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Failed to load creatures: ${err.message}</div>`;
    return;
  }

  if (creatures.length === 0) {
    root.innerHTML = renderEmptyState();
    return;
  }

  // Sort by name alphabetically
  creatures.sort((a, b) => a.name.localeCompare(b.name));

  root.innerHTML = renderListPage(creatures);
  attachListListeners(root);
}

// ── Render functions ──────────────────────────────────────

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No creatures yet</h2>
      <p>Add your first creature to start building your bestiary.</p>
      <a href="#/creature/new" class="btn btn-primary">+ New Creature</a>
    </div>
  `;
}

function renderListPage(creatures) {
  return `
    <div class="page-header">
      <h1 class="page-title">Bestiary</h1>
      <div class="page-actions">
        <a href="#/creature/new" class="btn btn-primary">+ New Creature</a>
      </div>
    </div>

    <div class="batch-controls" id="batch-controls" style="display: none;">
      <span class="selection-count">
        <span id="selection-count">0</span> selected
      </span>
      <button class="btn btn-secondary" id="batch-select-all">Select All</button>
      <button class="btn btn-secondary" id="batch-clear-selection">Clear</button>
      <button class="btn btn-primary" id="batch-export-btn" disabled>
        Export Selected
      </button>
    </div>

    <table class="creature-table">
      <thead>
        <tr>
          <th class="batch-checkbox-column">
            <input type="checkbox" id="select-all-checkbox" title="Select all creatures">
          </th>
          <th>Name</th>
          <th>CR</th>
          <th>Type</th>
          <th>Alignment</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${creatures.map(renderCreatureRow).join('')}
      </tbody>
    </table>
  `;
}

function renderCreatureRow(creature) {
  const id   = creature.meta.id;
  const name = creature.name || '(unnamed)';
  const cr   = formatCR(creature.cr);
  const type = creature.type || '—';
  const alignment = creature.alignment || '—';

  return `
    <tr data-creature-id="${id}" class="selectable-row">
      <td class="batch-checkbox-column">
        <input type="checkbox" class="row-select" value="${id}" title="Select ${escapeHtml(name)}">
      </td>
      <td class="col-name">
        <a href="#/creature/${id}">${escapeHtml(name)}</a>
      </td>
      <td class="col-cr">${escapeHtml(cr)}</td>
      <td>${escapeHtml(type)}</td>
      <td>${escapeHtml(alignment)}</td>
      <td class="col-actions">
        <a href="#/creature/${id}/print" class="btn btn-ghost btn-sm" title="Print stat card">Print</a>
        <button
          class="btn btn-ghost btn-sm btn-delete"
          data-id="${id}"
          data-name="${escapeHtml(name)}"
          title="Delete creature"
        >Delete</button>
      </td>
    </tr>
  `;
}

// ── Event listeners ───────────────────────────────────────

function attachListListeners(root) {
  // Track which delete button has been clicked once (pending confirmation)
  let pendingDeleteId = null;
  let creaturesList = null;

  // Get creatures for batch operations
  getAllCreatures().then(creatures => {
    creaturesList = creatures;
  });

  // Update batch controls visibility and state
  function updateBatchControls() {
    const count = globalBatchSelector.getCount();
    const controls = root.querySelector('#batch-controls');
    const countEl = root.querySelector('#selection-count');
    const exportBtn = root.querySelector('#batch-export-btn');

    if (count > 0) {
      controls.style.display = 'flex';
      countEl.textContent = count;
      exportBtn.disabled = false;
    } else {
      controls.style.display = 'none';
      exportBtn.disabled = true;
    }

    // Update "select all" checkbox state
    const selectAllCheckbox = root.querySelector('#select-all-checkbox');
    const allCheckboxes = root.querySelectorAll('tbody .row-select');
    const selectedCheckboxes = root.querySelectorAll('tbody .row-select:checked');

    if (selectedCheckboxes.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (selectedCheckboxes.length === allCheckboxes.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  // Handle checkbox changes
  root.addEventListener('change', (event) => {
    // Row checkboxes
    if (event.target.classList.contains('row-select')) {
      const id = event.target.value;
      const row = root.querySelector(`tr[data-creature-id="${id}"]`);
      const creatures = creaturesList || [];
      const creature = creatures.find(c => c.meta.id === id);

      if (creature) {
        globalBatchSelector.toggle(id, creature, 'creature');
        event.target.checked = globalBatchSelector.isSelected(id);
      }
      updateBatchControls();
      return;
    }

    // Select all checkbox
    if (event.target.id === 'select-all-checkbox') {
      if (event.target.checked) {
        globalBatchSelector.selectAll(creaturesList || [], 'creature');
        root.querySelectorAll('tbody .row-select').forEach(cb => {
          cb.checked = true;
        });
      } else {
        globalBatchSelector.clear();
        root.querySelectorAll('tbody .row-select').forEach(cb => {
          cb.checked = false;
        });
      }
      updateBatchControls();
      return;
    }
  });

  // Handle delete button clicks
  root.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('.btn-delete');
    if (deleteBtn) {
      const id   = deleteBtn.dataset.id;
      const name = deleteBtn.dataset.name;

      if (pendingDeleteId === id) {
        // Second click — confirmed, proceed with deletion
        try {
          await deleteCreature(id);
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
          return;
        }
        // Refresh the list after deletion
        showCreatureList();
      } else {
        // First click — ask for confirmation via button text change
        if (pendingDeleteId) {
          // Reset the previous pending button
          const prevBtn = root.querySelector(`[data-id="${pendingDeleteId}"]`);
          if (prevBtn) prevBtn.textContent = 'Delete';
        }
        pendingDeleteId = id;
        deleteBtn.textContent = 'Confirm?';
        deleteBtn.classList.add('btn-delete-confirm', 'btn-danger');

        // Auto-reset after 3 seconds if not confirmed
        setTimeout(() => {
          if (pendingDeleteId === id) {
            pendingDeleteId = null;
            if (deleteBtn.isConnected) {
              deleteBtn.textContent = 'Delete';
              deleteBtn.classList.remove('btn-delete-confirm', 'btn-danger');
            }
          }
        }, 3000);
      }
      return;
    }

    // Select all button
    if (event.target.id === 'batch-select-all') {
      globalBatchSelector.selectAll(creaturesList || [], 'creature');
      root.querySelectorAll('tbody .row-select').forEach(cb => {
        cb.checked = true;
      });
      updateBatchControls();
      return;
    }

    // Clear selection button
    if (event.target.id === 'batch-clear-selection') {
      globalBatchSelector.clear();
      root.querySelectorAll('tbody .row-select').forEach(cb => {
        cb.checked = false;
      });
      updateBatchControls();
      return;
    }

    // Export button
    if (event.target.id === 'batch-export-btn') {
      const entities = globalBatchSelector.getSelectedEntities();
      if (entities.length > 0) {
        showBatchExportModal(entities, 'creature', () => {
          // Close callback - can refresh if needed
        });
      }
      return;
    }
  });
}

// ── Utility ───────────────────────────────────────────────

/**
 * Escapes a string for safe insertion into HTML attribute or text content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
