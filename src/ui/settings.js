// Settings view.
// Provides: campaign name, JSON export/import, and data clear.

import { getSettings, saveSettings } from '../storage/settings.js';
import { exportAllData, importData } from '../utils/export-import.js';
import { getViewRoot } from './shell.js';

/**
 * Renders the settings page into the view root.
 */
export async function showSettings() {
  const root = getViewRoot();
  root.innerHTML = '<div class="loading-state">Loading…</div>';

  let settings;
  try {
    settings = await getSettings();
  } catch (err) {
    root.innerHTML = `<div class="alert alert-danger">Failed to load settings: ${err.message}</div>`;
    return;
  }

  root.innerHTML = renderSettingsPage(settings);
  attachSettingsListeners(root);
}

// ── Render ────────────────────────────────────────────────

function renderSettingsPage(settings) {
  return `
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
    </div>

    <div class="settings-section">
      <h2>Campaign</h2>
      <p>Give your campaign a name to identify your data exports.</p>
      <div class="field">
        <label for="campaign-name">Campaign Name</label>
        <input
          type="text"
          id="campaign-name"
          class="field-input"
          value="${escapeHtml(settings.campaignName ?? '')}"
          placeholder="e.g. Curse of the Crimson Throne"
        >
      </div>
      <button class="btn btn-primary" id="btn-save-campaign" style="margin-top: 12px;">
        Save
      </button>
      <span class="save-indicator" id="campaign-save-indicator"></span>
    </div>

    <div class="settings-section">
      <h2>Export</h2>
      <p>Download all your campaign data as a JSON file for backup or transfer to another device.</p>
      <button class="btn btn-secondary" id="btn-export">Export All Data</button>
    </div>

    <div class="settings-section">
      <h2>Import</h2>
      <p>Restore campaign data from a previously exported Lorewright JSON file.
         This will replace all existing data.</p>
      <div style="display: flex; gap: 12px; align-items: center;">
        <input type="file" id="import-file" accept=".json" style="display:none;">
        <button class="btn btn-secondary" id="btn-import-trigger">Choose File…</button>
        <span id="import-filename" style="color: var(--color-text-muted); font-size: 0.875rem;"></span>
      </div>
      <div id="import-result" style="margin-top: 12px;"></div>
    </div>

    <div class="settings-section danger-zone">
      <h2>Danger Zone</h2>
      <p>Permanently delete all creatures and campaign data from this browser.
         This cannot be undone. Export your data first.</p>
      <button class="btn btn-danger" id="btn-clear-data">Clear All Data</button>
    </div>
  `;
}

// ── Event listeners ───────────────────────────────────────

function attachSettingsListeners(root) {
  // Campaign name save
  root.querySelector('#btn-save-campaign')?.addEventListener('click', async () => {
    const nameInput = root.querySelector('#campaign-name');
    const indicator = root.querySelector('#campaign-save-indicator');
    const name = nameInput?.value ?? '';

    try {
      await saveSettings({ campaignName: name });
      if (indicator) {
        indicator.textContent = 'Saved';
        indicator.className   = 'save-indicator saved';
        setTimeout(() => {
          indicator.textContent = '';
          indicator.className   = 'save-indicator';
        }, 2000);
      }
    } catch (err) {
      if (indicator) {
        indicator.textContent = `Failed: ${err.message}`;
        indicator.className   = 'save-indicator unsaved';
      }
    }
  });

  // Export
  root.querySelector('#btn-export')?.addEventListener('click', async () => {
    try {
      await exportAllData();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  });

  // Import — open file picker
  root.querySelector('#btn-import-trigger')?.addEventListener('click', () => {
    root.querySelector('#import-file')?.click();
  });

  // Import — file selected
  root.querySelector('#import-file')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filenameEl = root.querySelector('#import-filename');
    if (filenameEl) filenameEl.textContent = file.name;

    const resultEl = root.querySelector('#import-result');

    try {
      const result = await importData(file);
      if (resultEl) {
        resultEl.innerHTML = `<div class="alert ${result.success ? 'alert-success' : 'alert-danger'}">
          ${escapeHtml(result.message)}
        </div>`;
      }
    } catch (err) {
      if (resultEl) {
        resultEl.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
      }
    }

    // Reset file input so the same file can be selected again if needed
    event.target.value = '';
  });

  // Clear all data
  let clearClickCount = 0;
  root.querySelector('#btn-clear-data')?.addEventListener('click', async (event) => {
    const btn = event.currentTarget;
    clearClickCount++;

    if (clearClickCount === 1) {
      btn.textContent = 'Click again to confirm deletion';
      btn.style.background = 'var(--color-danger-dim)';
      setTimeout(() => {
        clearClickCount = 0;
        if (btn.isConnected) {
          btn.textContent = 'Clear All Data';
          btn.style.background = '';
        }
      }, 3000);
      return;
    }

    // Second click — confirmed
    const { clearAllCreatures } = await import('../storage/creatures.js');
    const { clearAllItems }     = await import('../storage/items.js');
    try {
      await Promise.all([clearAllCreatures(), clearAllItems()]);
      alert('All data cleared.');
      window.location.hash = '#/';
    } catch (err) {
      alert(`Failed to clear data: ${err.message}`);
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
