// Creature list view.
// Renders a table of all stored creatures with links to edit and print.
// Does not call deriveCreature — only name, CR, type, and alignment are needed here.

import { getAllCreatures, deleteCreature } from '../storage/creatures.js';
import { getViewRoot } from './shell.js';
import { formatCR } from '../utils/formatters.js';

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

    <table class="creature-table">
      <thead>
        <tr>
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
    <tr data-creature-id="${id}">
      <td class="col-name">
        <a href="#/creature/${id}">${escapeHtml(name)}</a>
      </td>
      <td class="col-cr">${escapeHtml(cr)}</td>
      <td>${escapeHtml(type)}</td>
      <td>${escapeHtml(alignment)}</td>
      <td class="col-actions">
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
