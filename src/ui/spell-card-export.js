// Spell card PDF export UI.
// Allows users to select spells and export them as PDF cards for printing.

import { getAllSpells } from '../storage/spells.js';
import { getViewRoot } from './shell.js';
import { generateSpellCardsPDF } from '../pdf/spell-card-generator.js';

/**
 * Renders the spell card export interface.
 * Called by the router when navigating to '#/export-spells'.
 */
export async function showSpellCardExport() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading spells…</div>';

  let spells;
  try {
    spells = await getAllSpells();
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Failed to load spells: ${err.message}</div>`;
    return;
  }

  if (spells.length === 0) {
    root.innerHTML = renderEmptyState();
    return;
  }

  // Sort alphabetically by name
  spells.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  root.innerHTML = renderExportPage(spells);
  attachExportListeners(root, spells);
}

// ── Render functions ───────────────────────────────────────────

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No spells to export</h2>
      <p>Create some spells first, then return here to export them as PDF cards.</p>
      <a href="#/spell/new" class="btn btn-primary">+ New Spell</a>
    </div>
  `;
}

function renderExportPage(spells) {
  const cardCount = spells.length;

  return `
    <div class="page-header">
      <h1 class="page-title">Export Spell Cards</h1>
      <p class="page-subtitle">Select spells to export as PDF cards for printing</p>
    </div>

    <div class="export-container">
      <div class="export-section">
        <div class="export-controls">
          <button class="btn btn-secondary" id="select-all-btn">Select All</button>
          <button class="btn btn-secondary" id="select-none-btn">Select None</button>
          <span class="selection-counter">
            <span id="selected-count">0</span> spells selected
          </span>
        </div>

        <div class="export-items-list">
          <div class="spells-list">
            ${spells.map(spell => renderSpellCheckbox(spell)).join('')}
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

function renderSpellCheckbox(spell) {
  const id = spell.meta.id;
  const name = escapeHtml(spell.name || '(Unnamed)');
  const level = spell.level || 0;
  const school = escapeHtml(spell.school || '');

  return `
    <div class="spell-checkbox-row">
      <input
        type="checkbox"
        class="spell-checkbox"
        id="spell-${id}"
        data-spell-id="${id}"
        value="${id}"
      >
      <label for="spell-${id}" class="spell-label">
        <span class="spell-name">${name}</span>
        <span class="spell-level">Level ${level}</span>
        <span class="spell-school">${school}</span>
      </label>
    </div>
  `;
}

// ── Event handlers ─────────────────────────────────────────────

function attachExportListeners(root, spells) {
  const selectAllBtn = root.querySelector('#select-all-btn');
  const selectNoneBtn = root.querySelector('#select-none-btn');
  const exportBtn = root.querySelector('#export-btn');
  const checkboxes = root.querySelectorAll('.spell-checkbox');

  // Select/deselect all
  selectAllBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectionDisplay(root);
  });

  selectNoneBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectionDisplay(root);
  });

  // Update display on spell checkbox change
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateSelectionDisplay(root);
    });
  });

  // Export button
  exportBtn.addEventListener('click', async () => {
    const selectedIds = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.spellId);

    if (selectedIds.length === 0) {
      alert('Please select at least one spell to export');
      return;
    }

    const selectedSpells = spells.filter(spell => selectedIds.includes(spell.meta.id));

    try {
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ Generating PDF…';

      await generateSpellCardsPDF(selectedSpells);

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

function updateSelectionDisplay(root) {
  const checkboxes = root.querySelectorAll('.spell-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

  root.querySelector('#selected-count').textContent = selectedCount;
  root.querySelector('#card-count').textContent = selectedCount;
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
