// Magic item list view.
// Renders a table of all stored items with links to edit and print.

import { getAllItems, deleteItem } from '../storage/items.js';
import { getViewRoot } from './shell.js';
import { globalBatchSelector } from '../export/batch-selector.js';
import { showBatchExportModal } from './batch-export-modal.js';

/**
 * Renders the item list into the view root.
 * Called by the router when the user navigates to '#/items'.
 */
export async function showItemList() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let items;
  try {
    items = await getAllItems();
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Failed to load items: ${err.message}</div>`;
    return;
  }

  if (items.length === 0) {
    root.innerHTML = renderEmptyState();
    return;
  }

  // Sort by name alphabetically
  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  root.innerHTML = renderListPage(items);
  attachListListeners(root);
}

// ── Render functions ──────────────────────────────────────

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No items yet</h2>
      <p>Add your first magic item to start building your vault.</p>
      <a href="#/item/new" class="btn btn-primary">+ New Item</a>
    </div>
  `;
}

function renderListPage(items) {
  return `
    <div class="page-header">
      <h1 class="page-title">Magic Items</h1>
      <div class="page-actions">
        <a href="#/item/new" class="btn btn-primary">+ New Item</a>
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
            <input type="checkbox" id="select-all-checkbox" title="Select all items">
          </th>
          <th>Name</th>
          <th>Type</th>
          <th>Slot</th>
          <th>CL</th>
          <th>Status</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(renderItemRow).join('')}
      </tbody>
    </table>
  `;
}

function renderItemRow(item) {
  const id     = item.meta.id;
  const name   = item.name || '(unnamed)';
  const type   = item.type || '—';
  const slot   = item.slot || '—';
  const cl     = item.cl ? `CL ${item.cl}` : '—';
  const status = item.identified !== false ? 'Identified' : 'Unidentified';

  return `
    <tr data-item-id="${id}" class="selectable-row">
      <td class="batch-checkbox-column">
        <input type="checkbox" class="row-select" value="${id}" title="Select ${escapeHtml(name)}">
      </td>
      <td class="col-name">
        <a href="#/item/${id}">${escapeHtml(name)}</a>
      </td>
      <td>${escapeHtml(type)}</td>
      <td>${escapeHtml(slot)}</td>
      <td>${escapeHtml(cl)}</td>
      <td>${escapeHtml(status)}</td>
      <td class="col-actions">
        <a href="#/item/${id}/print" class="btn btn-ghost btn-sm" title="Print item card">Print</a>
        <button
          class="btn btn-ghost btn-sm btn-delete"
          data-id="${id}"
          data-name="${escapeHtml(name)}"
          title="Delete item"
        >Delete</button>
      </td>
    </tr>
  `;
}

// ── Event listeners ───────────────────────────────────────

function attachListListeners(root) {
  let pendingDeleteId = null;
  let itemsList = null;

  // Get items for batch operations
  getAllItems().then(items => {
    itemsList = items;
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
      const items = itemsList || [];
      const item = items.find(i => i.meta.id === id);

      if (item) {
        globalBatchSelector.toggle(id, item, 'item');
        event.target.checked = globalBatchSelector.isSelected(id);
      }
      updateBatchControls();
      return;
    }

    // Select all checkbox
    if (event.target.id === 'select-all-checkbox') {
      if (event.target.checked) {
        globalBatchSelector.selectAll(itemsList || [], 'item');
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
        try {
          await deleteItem(id);
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
          return;
        }
        showItemList();
      } else {
        if (pendingDeleteId) {
          const prevBtn = root.querySelector(`[data-id="${pendingDeleteId}"]`);
          if (prevBtn) prevBtn.textContent = 'Delete';
        }
        pendingDeleteId = id;
        deleteBtn.textContent = 'Confirm?';
        deleteBtn.classList.add('btn-delete-confirm', 'btn-danger');

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
      globalBatchSelector.selectAll(itemsList || [], 'item');
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
        showBatchExportModal(entities, 'item', () => {
          // Close callback - can refresh if needed
        });
      }
      return;
    }
  });
}

// ── Utility ───────────────────────────────────────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
