// Spell list view.
// Renders a table of all stored spells with links to edit and delete.

import { getAllSpells, deleteSpell, saveSpell } from '../storage/spells.js';
import { getViewRoot } from './shell.js';
import { openTextImportModal } from './text-import-modal.js';
import { navigate } from './router.js';

/**
 * Renders the spell list into the view root.
 * Called by the router when the user navigates to '#/spells'.
 */
export async function showSpellList() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

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

  // Sort by name alphabetically, then by level
  spells.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;
    return a.level - b.level;
  });

  root.innerHTML = renderListPage(spells);
  attachListListeners(root);
}

// ── Render functions ──────────────────────────────────────

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No spells yet</h2>
      <p>Add your first spell to start building your spell library.</p>
      <a href="#/spell/new" class="btn btn-primary">+ New Spell</a>
    </div>
  `;
}

function renderListPage(spells) {
  return `
    <div class="page-header">
      <h1 class="page-title">Spell Library</h1>
      <div class="page-actions">
        <button id="btn-import-text" class="btn btn-secondary" title="Import spell from text">
          📝 Import from Text
        </button>
        <a href="#/spell/new" class="btn btn-primary">+ New Spell</a>
      </div>
    </div>

    <table class="spell-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Level</th>
          <th>School</th>
          <th>Casting Time</th>
          <th>Range</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${spells.map(renderSpellRow).join('')}
      </tbody>
    </table>
  `;
}

function renderSpellRow(spell) {
  const id    = spell.meta.id;
  const name  = spell.name || '(unnamed)';
  const level = spell.level || 0;
  const school = spell.school || '—';
  const castingTime = spell.castingTime || '—';
  const range = spell.range || '—';

  return `
    <tr data-spell-id="${id}">
      <td class="col-name">
        <a href="#/spell/${id}">${escapeHtml(name)}</a>
      </td>
      <td class="col-level">${level}</td>
      <td class="col-school">${escapeHtml(school)}</td>
      <td class="col-casting-time">${escapeHtml(castingTime)}</td>
      <td class="col-range">${escapeHtml(range)}</td>
      <td class="col-actions">
        <button
          class="btn btn-ghost btn-sm btn-delete"
          data-id="${id}"
          data-name="${escapeHtml(name)}"
          title="Delete spell"
        >Delete</button>
      </td>
    </tr>
  `;
}

// ── Event listeners ───────────────────────────────────────

function attachListListeners(root) {
  // Track which delete button has been clicked once (pending confirmation)
  let pendingDeleteId = null;

  // Handle import button click
  const importBtn = root.querySelector('#btn-import-text');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      openTextImportModal(
        async (spell) => {
          // User confirmed import
          try {
            await saveSpell(spell);
            // Navigate to spell edit page with all sections expanded
            sessionStorage.setItem('expandAllDetails', 'true');
            navigate('#/spell/' + spell.meta.id);
          } catch (err) {
            alert(`Failed to save spell: ${err.message}`);
          }
        },
        () => {
          // User cancelled - do nothing
        }
      );
    });
  }

  // Handle delete button clicks
  root.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('.btn-delete');
    if (deleteBtn) {
      const id   = deleteBtn.dataset.id;
      const name = deleteBtn.dataset.name;

      if (pendingDeleteId === id) {
        // Second click — confirmed, proceed with deletion
        try {
          await deleteSpell(id);
        } catch (err) {
          alert(`Failed to delete: ${err.message}`);
          return;
        }
        // Refresh the list after deletion
        showSpellList();
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
