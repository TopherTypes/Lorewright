// Magic item list view.
// Renders a table of all stored items with links to edit and print.

import { getAllItems, deleteItem } from '../storage/items.js';
import { getViewRoot } from './shell.js';

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
    <table class="creature-table">
      <thead>
        <tr>
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
    <tr data-item-id="${id}">
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

  root.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('.btn-delete');
    if (!deleteBtn) return;

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
