/**
 * Archive of Nethys spell import modal
 */

import { validateAoNURL, extractSpellNameFromUrl } from '../utils/aon-url-validator.js';
import { fetchSpellHTML, parseSpellHTML } from '../utils/aon-scraper.js';
import {
  mapAoNToLorewright,
  validateSpell,
} from '../utils/aon-to-lorewright.js';

let currentModalState = null;

/**
 * Opens the Archive of Nethys import modal
 * @param {Function} onConfirm - Callback when user confirms import (receives spell object)
 * @param {Function} onCancel - Callback when user cancels
 */
export async function openAoNImportModal(onConfirm, onCancel) {
  currentModalState = {
    state: 'url-input', // url-input, loading, preview, error
    url: '',
    parsedSpell: null,
    error: null,
    onConfirm,
    onCancel,
  };

  renderAoNModal();
  attachAoNModalListeners();
}

/**
 * Renders the modal UI
 */
function renderAoNModal() {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'aon-import-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'aon-import-modal';
  modal.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // Render content based on state
  let content = '';

  if (currentModalState.state === 'url-input') {
    content = renderUrlInputForm();
  } else if (currentModalState.state === 'loading') {
    content = renderLoadingState();
  } else if (currentModalState.state === 'preview') {
    content = renderSpellPreview();
  } else if (currentModalState.state === 'error') {
    content = renderErrorState();
  }

  modal.innerHTML = content;
  overlay.appendChild(modal);

  // Remove old modal if exists
  const oldOverlay = document.getElementById('aon-import-modal-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  document.body.appendChild(overlay);
}

/**
 * Renders the initial URL input form
 */
function renderUrlInputForm() {
  return `
    <div style="margin-bottom: 16px;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #333;">Import from Archive of Nethys</h2>
      <p style="margin: 0; font-size: 14px; color: #666;">
        Paste an Archive of Nethys spell URL to automatically import the spell data.
      </p>
    </div>

    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
        Spell URL:
      </label>
      <input
        type="text"
        id="aon-url-input"
        placeholder="https://aonprd.com/SpellDisplay.aspx?ItemName=Magic%20Missile"
        style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        "
      />
      <div style="margin-top: 8px; font-size: 12px; color: #999;">
        Example: https://aonprd.com/SpellDisplay.aspx?ItemName=Magic%20Missile
      </div>
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button
        id="aon-cancel-btn"
        style="
          padding: 8px 16px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Cancel
      </button>
      <button
        id="aon-fetch-btn"
        style="
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Fetch & Parse
      </button>
    </div>
  `;
}

/**
 * Renders the loading state
 */
function renderLoadingState() {
  return `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4CAF50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      "></div>
      <p style="color: #666; margin: 0; font-size: 14px;">
        Fetching and parsing spell data...
      </p>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
}

/**
 * Renders the error state
 */
function renderErrorState() {
  const error = currentModalState.error || 'An unknown error occurred.';

  return `
    <div style="margin-bottom: 16px;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #d32f2f;">Error</h2>
    </div>

    <div style="
      background: #ffebee;
      border: 1px solid #ef5350;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      color: #c62828;
      font-size: 14px;
    ">
      ${escapeHtml(error)}
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button
        id="aon-cancel-btn"
        style="
          padding: 8px 16px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Cancel
      </button>
      <button
        id="aon-retry-btn"
        style="
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Try Again
      </button>
    </div>
  `;
}

/**
 * Renders the spell preview
 */
function renderSpellPreview() {
  const spell = currentModalState.parsedSpell;

  if (!spell) {
    return '<p>Error: No spell data to display</p>';
  }

  return `
    <div style="margin-bottom: 16px;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #333;">Import Preview</h2>
      <p style="margin: 0; font-size: 14px; color: #666;">
        Review the parsed spell data before importing.
      </p>
    </div>

    <div style="
      background: #f5f5f5;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 14px;
    ">
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin-bottom: 12px;">
        <strong>Name:</strong>
        <div>${escapeHtml(spell.name)}</div>

        <strong>Level:</strong>
        <div>${spell.level}</div>

        <strong>School:</strong>
        <div>${escapeHtml(spell.school)}</div>

        <strong>Casting Time:</strong>
        <div>${escapeHtml(spell.castingTime)}</div>

        <strong>Range:</strong>
        <div>${escapeHtml(spell.range)}</div>

        <strong>Duration:</strong>
        <div>${escapeHtml(spell.duration)}</div>

        <strong>Components:</strong>
        <div>${formatComponents(spell.components)}</div>

        <strong>Saving Throw:</strong>
        <div>${escapeHtml(spell.savingThrow)}</div>

        <strong>SR:</strong>
        <div>${spell.spellResistance ? 'Yes' : 'No'}</div>
      </div>

      ${
        spell.description
          ? `
        <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;" />
        <div>
          <strong>Description:</strong>
          <p style="margin: 8px 0 0 0; color: #555; line-height: 1.4;">
            ${escapeHtml(
              spell.description.substring(0, 300) +
                (spell.description.length > 300 ? '...' : '')
            )}
          </p>
        </div>
      `
          : ''
      }
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button
        id="aon-cancel-btn"
        style="
          padding: 8px 16px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Cancel
      </button>
      <button
        id="aon-confirm-btn"
        style="
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Import Spell
      </button>
    </div>
  `;
}

/**
 * Formats components object for display
 */
function formatComponents(components) {
  const parts = [];

  if (components.verbal) parts.push('V');
  if (components.somatic) parts.push('S');
  if (components.material) {
    parts.push('M' + (components.materialDescription ? ` (${components.materialDescription})` : ''));
  }
  if (components.focus) parts.push('F');
  if (components.divineFocus) parts.push('DF');

  return parts.length > 0 ? parts.join(', ') : 'None';
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Attaches event listeners to modal elements
 */
function attachAoNModalListeners() {
  const overlay = document.getElementById('aon-import-modal-overlay');

  // Close on overlay click (but not on modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Handle buttons based on current state
  if (currentModalState.state === 'url-input') {
    const fetchBtn = document.getElementById('aon-fetch-btn');
    const cancelBtn = document.getElementById('aon-cancel-btn');
    const urlInput = document.getElementById('aon-url-input');

    if (fetchBtn) {
      fetchBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();

        // Validate URL
        const validation = validateAoNURL(url);
        if (!validation.valid) {
          currentModalState.state = 'error';
          currentModalState.error = validation.error;
          renderAoNModal();
          attachAoNModalListeners();
          return;
        }

        // Start loading
        currentModalState.state = 'loading';
        currentModalState.url = validation.normalizedUrl;
        renderAoNModal();

        // Fetch and parse
        try {
          const html = await fetchSpellHTML(validation.normalizedUrl);
          const aonData = await parseSpellHTML(html);

          // Transform to Lorewright format
          const spell = mapAoNToLorewright(aonData);

          // Validate
          const spellValidation = validateSpell(spell);
          if (!spellValidation.valid) {
            throw new Error(spellValidation.errors.join(', '));
          }

          // Show preview
          currentModalState.state = 'preview';
          currentModalState.parsedSpell = spell;
          renderAoNModal();
          attachAoNModalListeners();
        } catch (error) {
          currentModalState.state = 'error';
          currentModalState.error =
            error.message || 'Failed to parse spell data.';
          renderAoNModal();
          attachAoNModalListeners();
        }
      });

      if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            fetchBtn.click();
          }
        });

        // Focus on input
        setTimeout(() => urlInput.focus(), 0);
      }
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
  } else if (currentModalState.state === 'error') {
    const retryBtn = document.getElementById('aon-retry-btn');
    const cancelBtn = document.getElementById('aon-cancel-btn');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        currentModalState.state = 'url-input';
        renderAoNModal();
        attachAoNModalListeners();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
  } else if (currentModalState.state === 'preview') {
    const confirmBtn = document.getElementById('aon-confirm-btn');
    const cancelBtn = document.getElementById('aon-cancel-btn');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const spell = currentModalState.parsedSpell;
        const onConfirm = currentModalState.onConfirm;
        closeModal();
        onConfirm(spell);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const onCancel = currentModalState.onCancel;
        closeModal();
        if (onCancel) onCancel();
      });
    }
  }
}

/**
 * Closes the modal
 */
function closeModal() {
  const overlay = document.getElementById('aon-import-modal-overlay');
  if (overlay) {
    overlay.remove();
  }

  if (currentModalState.onCancel) {
    currentModalState.onCancel();
  }

  currentModalState = null;
}
