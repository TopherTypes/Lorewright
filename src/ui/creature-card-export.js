// Creature card PDF export UI.
// Allows users to select creatures and export them as PDF stat cards.

import { getAllCreatures, saveCreature } from '../storage/creatures.js';
import { deriveCreature } from '../entities/creature.js';
import { getViewRoot } from './shell.js';
import { generateCreatureCardsPDF } from '../pdf/creature-card-generator.js';

/**
 * Renders the creature card export interface.
 * Called by the router when navigating to '#/export-creatures'.
 */
export async function showCreatureCardExport() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading creatures…</div>';

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

  // Sort alphabetically by name
  creatures.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  root.innerHTML = renderExportPage(creatures);
  attachExportListeners(root, creatures);
}

// ── Render functions ───────────────────────────────────────────

function renderEmptyState() {
  return `
    <div class="empty-state">
      <h2>No creatures to export</h2>
      <p>Create some creatures first, then return here to export them as PDF stat cards.</p>
      <a href="#/creature/new" class="btn btn-primary">+ New Creature</a>
    </div>
  `;
}

function renderExportPage(creatures) {
  const cardCount = countSelectedCards(creatures);

  return `
    <div class="page-header">
      <h1 class="page-title">Export Creature Cards</h1>
      <p class="page-subtitle">Select creatures to export as PDF stat cards</p>
    </div>

    <div class="export-container">
      <div class="export-section">
        <div class="export-controls">
          <button class="btn btn-secondary" id="select-all-btn">Select All</button>
          <button class="btn btn-secondary" id="select-none-btn">Select None</button>
          <span class="selection-counter">
            <span id="selected-count">0</span> creatures selected
          </span>
        </div>

        <div class="variant-filters">
          <button class="btn btn-small" id="filter-all-basic" title="Select all as Basic variant">All Basic</button>
          <button class="btn btn-small" id="filter-all-complex" title="Select all as Complex variant">All Complex</button>
          <button class="btn btn-small" id="filter-all-spellcaster" title="Select all as Spellcaster variant">All Spellcaster</button>
        </div>

        <div class="export-items-list">
          <div class="creatures-list">
            ${creatures.map(creature => renderCreatureRow(creature)).join('')}
          </div>
        </div>
      </div>

      <div class="export-section export-options">
        <h2>Export Summary</h2>

        <div class="card-count-preview">
          <div><strong>Creatures:</strong> <span id="creature-count">0</span></div>
          <div><strong>Cards:</strong> <span id="card-count">${cardCount}</span></div>
          <div><strong>Pages:</strong> <span id="page-count">-</span></div>
        </div>

        <button class="btn btn-primary btn-large" id="export-btn">
          <span>📥 Download PDF</span>
        </button>
      </div>
    </div>
  `;
}

function renderCreatureRow(creature) {
  const id = creature.meta.id;
  const name = escapeHtml(creature.name || '(Unnamed)');
  const type = escapeHtml(creature.type || '');
  const cr = creature.cr || 1;
  const currentVariant = creature.cardVariant || 'basic';
  const currentOrientation = creature.cardOrientation || 'landscape';

  return `
    <div class="creature-row">
      <div class="creature-checkbox-wrapper">
        <input
          type="checkbox"
          class="creature-checkbox"
          id="creature-${id}"
          data-creature-id="${id}"
          value="${id}"
        >
        <label for="creature-${id}" class="creature-label">
          <span class="creature-name">${name}</span>
          <span class="creature-meta">${type} • CR ${cr}</span>
        </label>
      </div>

      <div class="creature-controls">
        <select class="variant-select" data-creature-id="${id}" style="display: none;">
          <option value="basic">Basic (Poker)</option>
          <option value="complex">Complex (Index)</option>
          <option value="spellcaster">Spellcaster (Index)</option>
        </select>

        <select class="orientation-select" data-creature-id="${id}" style="display: none;">
          <option value="landscape">Landscape (6"×4")</option>
          <option value="portrait">Portrait (4"×6")</option>
        </select>

        <div class="variant-display" data-creature-id="${id}">
          <span class="variant-badge">${currentVariant}</span>
          <span class="orientation-badge" style="${currentVariant === 'basic' ? 'display: none;' : ''}">${currentOrientation}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Event handlers ─────────────────────────────────────────────

function attachExportListeners(root, creatures) {
  const selectAllBtn = root.querySelector('#select-all-btn');
  const selectNoneBtn = root.querySelector('#select-none-btn');
  const exportBtn = root.querySelector('#export-btn');
  const filterBasicBtn = root.querySelector('#filter-all-basic');
  const filterComplexBtn = root.querySelector('#filter-all-complex');
  const filterSpellcasterBtn = root.querySelector('#filter-all-spellcaster');
  const checkboxes = root.querySelectorAll('.creature-checkbox');

  // Select/deselect all
  selectAllBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectionDisplay(root, creatures);
  });

  selectNoneBtn.addEventListener('click', () => {
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectionDisplay(root, creatures);
  });

  // Variant filters
  filterBasicBtn.addEventListener('click', async () => {
    checkboxes.forEach(cb => cb.checked = true);
    for (const creature of creatures) {
      creature.cardVariant = 'basic';
      creature.cardOrientation = 'landscape';
      await saveCreature(creature);
    }
    reRenderVariants(root, creatures);
    updateSelectionDisplay(root, creatures);
  });

  filterComplexBtn.addEventListener('click', async () => {
    checkboxes.forEach(cb => cb.checked = true);
    for (const creature of creatures) {
      creature.cardVariant = 'complex';
      creature.cardOrientation = 'landscape';
      await saveCreature(creature);
    }
    reRenderVariants(root, creatures);
    updateSelectionDisplay(root, creatures);
  });

  filterSpellcasterBtn.addEventListener('click', async () => {
    checkboxes.forEach(cb => cb.checked = true);
    for (const creature of creatures) {
      creature.cardVariant = 'spellcaster';
      creature.cardOrientation = 'landscape';
      await saveCreature(creature);
    }
    reRenderVariants(root, creatures);
    updateSelectionDisplay(root, creatures);
  });

  // Update display on creature checkbox change
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateSelectionDisplay(root, creatures);
    });
  });

  // Variant selection
  root.querySelectorAll('.variant-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const creatureId = select.dataset.creatureId;
      const creature = creatures.find(c => c.meta.id === creatureId);
      if (creature) {
        creature.cardVariant = e.target.value;
        if (creature.cardVariant === 'basic') {
          creature.cardOrientation = 'landscape';
        } else if (!creature.cardOrientation) {
          creature.cardOrientation = 'landscape';
        }
        await saveCreature(creature);
        updateVariantDisplay(root, creature);
        updateSelectionDisplay(root, creatures);
      }
    });
  });

  // Orientation selection
  root.querySelectorAll('.orientation-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const creatureId = select.dataset.creatureId;
      const creature = creatures.find(c => c.meta.id === creatureId);
      if (creature && creature.cardVariant !== 'basic') {
        creature.cardOrientation = e.target.value;
        await saveCreature(creature);
        updateOrientationDisplay(root, creature);
        updateSelectionDisplay(root, creatures);
      }
    });
  });

  // Toggle edit mode on variant badge click
  root.querySelectorAll('.variant-display').forEach(display => {
    display.addEventListener('click', () => {
      const creatureId = display.dataset.creatureId;
      const variantSelect = root.querySelector(`.variant-select[data-creature-id="${creatureId}"]`);
      const orientationSelect = root.querySelector(`.orientation-select[data-creature-id="${creatureId}"]`);
      const creature = creatures.find(c => c.meta.id === creatureId);

      if (variantSelect.style.display === 'none') {
        // Enter edit mode
        variantSelect.value = creature.cardVariant || 'basic';
        orientationSelect.value = creature.cardOrientation || 'landscape';
        display.style.display = 'none';
        variantSelect.style.display = 'inline-block';
        orientationSelect.style.display = creature.cardVariant === 'basic' ? 'none' : 'inline-block';
      } else {
        // Exit edit mode
        display.style.display = 'flex';
        variantSelect.style.display = 'none';
        orientationSelect.style.display = 'none';
      }
    });
  });

  // Export button
  exportBtn.addEventListener('click', async () => {
    const selectedIds = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.creatureId);

    if (selectedIds.length === 0) {
      alert('Please select at least one creature to export');
      return;
    }

    const selectedCreatures = creatures.filter(creature => selectedIds.includes(creature.meta.id));

    try {
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ Generating PDF…';

      // Build card configs with derived creatures
      const cardConfigs = selectedCreatures.map(creature => ({
        creature: deriveCreature(creature),
        variant: creature.cardVariant || 'basic',
        orientation: creature.cardOrientation || 'landscape',
        imageUrl: creature.imageUrl || null,
      }));

      await generateCreatureCardsPDF(cardConfigs);

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

function updateSelectionDisplay(root, creatures) {
  const checkboxes = root.querySelectorAll('.creature-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

  root.querySelector('#selected-count').textContent = selectedCount;
  root.querySelector('#creature-count').textContent = selectedCount;

  // Calculate total card count
  const selectedCreatures = creatures.filter(creature =>
    Array.from(checkboxes).some(cb => cb.checked && cb.dataset.creatureId === creature.meta.id)
  );
  const cardCount = countSelectedCards(selectedCreatures);
  const pageCount = calculatePageCount(selectedCreatures);

  root.querySelector('#card-count').textContent = cardCount;
  root.querySelector('#page-count').textContent = pageCount;
}

function updateVariantDisplay(root, creature) {
  const display = root.querySelector(`.variant-display[data-creature-id="${creature.meta.id}"]`);
  const variantBadge = display.querySelector('.variant-badge');
  const orientationBadge = display.querySelector('.orientation-badge');

  variantBadge.textContent = creature.cardVariant || 'basic';
  orientationBadge.style.display = creature.cardVariant === 'basic' ? 'none' : 'inline-block';
  orientationBadge.textContent = creature.cardOrientation || 'landscape';
}

function updateOrientationDisplay(root, creature) {
  const display = root.querySelector(`.variant-display[data-creature-id="${creature.meta.id}"]`);
  const orientationBadge = display.querySelector('.orientation-badge');
  orientationBadge.textContent = creature.cardOrientation || 'landscape';
}

function reRenderVariants(root, creatures) {
  creatures.forEach(creature => {
    updateVariantDisplay(root, creature);
  });
}

function countSelectedCards(creatures) {
  // Each creature = 1 card (no multiple variants per creature like items)
  return creatures.length;
}

function calculatePageCount(creatures) {
  if (creatures.length === 0) return 0;

  let pages = new Map();
  let cardIndex = 0;

  creatures.forEach(creature => {
    const variant = creature.cardVariant || 'basic';
    const orientation = creature.cardOrientation || 'landscape';

    // Calculate cards per page based on variant
    let cardsPerPage;
    if (variant === 'basic') {
      cardsPerPage = 6; // 2×3 grid for poker cards
    } else if (orientation === 'portrait') {
      cardsPerPage = 6; // 2×3 grid for portrait
    } else {
      cardsPerPage = 4; // 2×2 grid for landscape
    }

    // Get page for this card
    const pageNum = Math.floor(cardIndex / cardsPerPage);
    pages.set(pageNum, true);
    cardIndex++;
  });

  return pages.size;
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
