// Item card PDF export UI.
// Allows users to select items and export them as poker-sized PDF cards.

import { getAllItems, saveItem } from '../storage/items.js';
import { getViewRoot } from './shell.js';
import { generateItemCardsPDF } from '../pdf/item-card-generator.js';

/**
 * Renders the item card export interface.
 * Called by the router when navigating to '#/export-items'.
 */
export async function showItemCardExport() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading items…</div>';

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

  // Sort alphabetically by name
  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  root.innerHTML = renderExportPage(items);
  attachExportListeners(root, items);
}

// ── Render functions ───────────────────────────────────────────

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No items to export</h2>
      <p>Create some magic items first, then return here to export them as PDF cards.</p>
      <a href="#/item/new" class="btn btn-primary">+ New Item</a>
    </div>
  `;
}

function renderExportPage(items) {
  const cardCount = countSelectedCards(items);

  return `
    <div class="page-header">
      <h1 class="page-title">Export Item Cards</h1>
      <p class="page-subtitle">Select items to export as poker-sized PDF cards</p>
    </div>

    <div class="export-container">
      <div class="export-section">
        <div class="export-controls">
          <button class="btn btn-secondary" id="select-all-btn">Select All</button>
          <button class="btn btn-secondary" id="select-none-btn">Select None</button>
          <span class="selection-counter">
            <span id="selected-count">0</span> items selected
          </span>
        </div>

        <div class="export-items-list">
          <div class="items-list">
            ${items.map(item => renderItemCheckbox(item)).join('')}
          </div>
        </div>
      </div>

      <div class="export-section export-options">
        <h2>Export Summary</h2>

        <div class="card-count-preview">
          <strong>Cards to export:</strong>
          <span id="card-count">${cardCount}</span>
        </div>

        <button class="btn btn-primary btn-large" id="export-btn">
          <span>📥 Download PDF</span>
        </button>
      </div>
    </div>
  `;
}

function renderItemCheckbox(item) {
  const id = item.meta.id;
  const name = escapeHtml(item.name || '(Unnamed)');
  const type = escapeHtml(item.type || '');
  const status = item.identified !== false ? '✓ Identified' : '✗ Unidentified';
  const hasUnidData = item.identified && (item.unidentifiedName || item.unidentifiedDescription);
  const includeVariant = item.includeUnidentifiedVariant !== false; // Default to true

  let variantRow = '';
  if (hasUnidData) {
    const variantChecked = includeVariant ? 'checked' : '';
    variantRow = `
      <div class="item-variant-row">
        <input
          type="checkbox"
          class="item-variant-checkbox"
          id="variant-${id}"
          data-item-id="${id}"
          ${variantChecked}
        >
        <label for="variant-${id}" class="variant-label">
          <span class="variant-hint">Include unidentified variant</span>
        </label>
      </div>
    `;
  }

  return `
    <div class="item-checkbox-row">
      <input
        type="checkbox"
        class="item-checkbox"
        id="item-${id}"
        data-item-id="${id}"
        value="${id}"
      >
      <label for="item-${id}" class="item-label">
        <span class="item-name">${name}</span>
        <span class="item-type">${type}</span>
        <span class="item-status">${status}</span>
      </label>
      ${variantRow}
    </div>
  `;
}

// ── Event handlers ─────────────────────────────────────────────

function attachExportListeners(root, items) {
  const selectAllBtn = root.querySelector('#select-all-btn');
  const selectNoneBtn = root.querySelector('#select-none-btn');
  const exportBtn = root.querySelector('#export-btn');
  const checkboxes = root.querySelectorAll('.item-checkbox');
  const variantCheckboxes = root.querySelectorAll('.item-variant-checkbox');

  // Select/deselect all
  selectAllBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectionDisplay(root, items);
  });

  selectNoneBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectionDisplay(root, items);
  });

  // Update display on item checkbox change
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateSelectionDisplay(root, items);
    });
  });

  // Handle per-item variant checkbox changes
  variantCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const itemId = checkbox.dataset.itemId;
      const item = items.find(i => i.meta.id === itemId);
      if (item) {
        item.includeUnidentifiedVariant = checkbox.checked;
        await saveItem(item);
      }
      updateSelectionDisplay(root, items);
    });
  });

  // Export button
  exportBtn.addEventListener('click', async () => {
    const selectedIds = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.itemId);

    if (selectedIds.length === 0) {
      alert('Please select at least one item to export');
      return;
    }

    const selectedItems = items.filter(item => selectedIds.includes(item.meta.id));

    try {
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ Generating PDF…';

      await generateItemCardsPDF(selectedItems);

      exportBtn.disabled = false;
      exportBtn.innerHTML = '<span>📥 Download PDF</span>';
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);

      exportBtn.disabled = false;
      exportBtn.innerHTML = '<span>📥 Download PDF</span>';
    }
  });
}

function updateSelectionDisplay(root, items) {
  const checkboxes = root.querySelectorAll('.item-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

  root.querySelector('#selected-count').textContent = selectedCount;

  // Calculate total card count
  const selectedItems = items.filter(item =>
    Array.from(checkboxes).some(cb => cb.checked && cb.dataset.itemId === item.meta.id)
  );
  const cardCount = countSelectedCards(selectedItems);
  root.querySelector('#card-count').textContent = cardCount;
}

function countSelectedCards(items) {
  let count = items.length; // All identified cards

  // Count unidentified variants based on per-item flag
  count += items.filter(item =>
    item.includeUnidentifiedVariant !== false && // Default to true
    item.identified &&
    (item.unidentifiedName || item.unidentifiedDescription)
  ).length;

  return count;
}

/**
 * Simple HTML escaping.
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, char => map[char]);
}
