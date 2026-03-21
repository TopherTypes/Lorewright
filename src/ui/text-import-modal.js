/**
 * Plain text spell import modal
 * Allows users to paste spell descriptions and parse them
 */

import { parseSpellFromText } from '../utils/spell-text-parser.js';

let currentModalState = null;

/**
 * Opens the text import modal
 * @param {Function} onConfirm - Callback when user confirms import (receives spell object)
 * @param {Function} onCancel - Callback when user cancels
 */
export async function openTextImportModal(onConfirm, onCancel) {
  currentModalState = {
    state: 'text-input', // text-input, preview, error
    text: '',
    parsedSpell: null,
    error: null,
    onConfirm,
    onCancel,
  };

  renderTextModal();
  attachTextModalListeners();
}

/**
 * Renders the modal UI
 */
function renderTextModal() {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'text-import-modal-overlay';
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
  modal.id = 'text-import-modal';
  modal.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 700px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  // Render content based on state
  let content = '';

  if (currentModalState.state === 'text-input') {
    content = renderTextInputForm();
  } else if (currentModalState.state === 'preview') {
    content = renderSpellPreview();
  } else if (currentModalState.state === 'error') {
    content = renderErrorState();
  }

  modal.innerHTML = content;
  overlay.appendChild(modal);

  // Remove old modal if exists
  const oldOverlay = document.getElementById('text-import-modal-overlay');
  if (oldOverlay) {
    oldOverlay.remove();
  }

  document.body.appendChild(overlay);
}

/**
 * Renders the initial text input form
 */
function renderTextInputForm() {
  const exampleSpell = `Fireball

Level: 3
School: Evocation
Casting Time: 1 standard action
Range: Long (400 ft. + 40 ft./level)
Duration: Instantaneous
Components: V, S, M (sulfur and bat guano)
Saving Throw: Reflex half
Spell Resistance: Yes

A roaring sphere of flame springs from your pointing finger and travels outward at a speed of 60 feet per round until it reaches the distance you have designated. If a creature is in the path of the sphere, the creature can make a Reflex save to take half damage. The sphere deals 1d6 points of fire damage for every caster level (maximum 10d6). Unattended objects take full damage from the spell.

The explosion creates a bright light that illuminates an area as a torch would. This light lasts for 1 round.

At Higher Levels: When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.`;

  return `
    <div style="margin-bottom: 16px;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #333;">Import from Text</h2>
      <p style="margin: 0; font-size: 14px; color: #666;">
        Paste a spell description to automatically extract the spell data.
      </p>
    </div>

    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
        Spell Description:
      </label>
      <textarea
        id="text-input-area"
        placeholder="Paste your spell description here..."
        style="
          width: 100%;
          min-height: 200px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: monospace;
          box-sizing: border-box;
          resize: vertical;
        "
      ></textarea>
      <div style="margin-top: 8px; font-size: 12px; color: #999;">
        <details>
          <summary style="cursor: pointer; color: #666;">Show example format</summary>
          <pre style="
            background: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
            font-size: 12px;
            overflow-x: auto;
          ">${escapeHtml(exampleSpell)}</pre>
        </details>
      </div>
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button
        id="text-cancel-btn"
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
        id="text-parse-btn"
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
        Parse & Preview
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
        Review the parsed spell data. You can edit fields after importing if needed.
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
        <div>${escapeHtml(spell.name || '(No name found)')}</div>

        <strong>Level:</strong>
        <div>${spell.level}</div>

        <strong>School:</strong>
        <div>${escapeHtml(spell.school)}</div>

        <strong>Casting Time:</strong>
        <div>${escapeHtml(spell.castingTime)}</div>

        <strong>Range:</strong>
        <div>${escapeHtml(spell.range || '(Not found)')}</div>

        <strong>Duration:</strong>
        <div>${escapeHtml(spell.duration || '(Not found)')}</div>

        <strong>Components:</strong>
        <div>${formatComponents(spell.components)}</div>

        <strong>Saving Throw:</strong>
        <div>${escapeHtml(spell.savingThrow)}</div>

        <strong>SR:</strong>
        <div>${spell.spellResistance ? 'Yes' : 'No'}</div>

        ${
          spell.damageType
            ? `
        <strong>Damage Type:</strong>
        <div>${escapeHtml(spell.damageType)}</div>
        `
            : ''
        }

        ${
          spell.damageRolls
            ? `
        <strong>Damage Rolls:</strong>
        <div>${escapeHtml(spell.damageRolls)}</div>
        `
            : ''
        }
      </div>

      ${
        spell.description
          ? `
        <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;" />
        <div>
          <strong>Description:</strong>
          <p style="margin: 8px 0 0 0; color: #555; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;">
            ${escapeHtml(
              spell.description.substring(0, 500) +
                (spell.description.length > 500 ? '...' : '')
            )}
          </p>
        </div>
      `
          : ''
      }
    </div>

    <div style="
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #856404;
    ">
      ℹ️ Missing or incorrect fields? You can edit them after importing.
    </div>

    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button
        id="text-cancel-btn"
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
        id="text-back-btn"
        style="
          padding: 8px 16px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        "
      >
        Back
      </button>
      <button
        id="text-confirm-btn"
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
        id="text-cancel-btn"
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
        id="text-retry-btn"
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
 * Formats components object for display
 */
function formatComponents(components) {
  const parts = [];

  if (components.verbal) parts.push('V');
  if (components.somatic) parts.push('S');
  if (components.material) {
    parts.push(
      'M' +
        (components.materialDescription ? ` (${components.materialDescription})` : '')
    );
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
function attachTextModalListeners() {
  const overlay = document.getElementById('text-import-modal-overlay');

  // Close on overlay click (but not on modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Handle buttons based on current state
  if (currentModalState.state === 'text-input') {
    const parseBtn = document.getElementById('text-parse-btn');
    const cancelBtn = document.getElementById('text-cancel-btn');
    const textArea = document.getElementById('text-input-area');

    if (parseBtn) {
      parseBtn.addEventListener('click', () => {
        const text = textArea.value.trim();

        if (!text) {
          currentModalState.error = 'Please enter spell text to parse.';
          currentModalState.state = 'error';
          renderTextModal();
          attachTextModalListeners();
          return;
        }

        try {
          const parsed = parseSpellFromText(text);

          if (!parsed.name || parsed.name.trim() === '') {
            currentModalState.error =
              'Could not find spell name in the provided text. Please ensure the spell name is in the first line.';
            currentModalState.state = 'error';
            renderTextModal();
            attachTextModalListeners();
            return;
          }

          currentModalState.parsedSpell = parsed;
          currentModalState.state = 'preview';
          renderTextModal();
          attachTextModalListeners();
        } catch (err) {
          currentModalState.error = `Parsing error: ${err.message}`;
          currentModalState.state = 'error';
          renderTextModal();
          attachTextModalListeners();
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
  } else if (currentModalState.state === 'preview') {
    const confirmBtn = document.getElementById('text-confirm-btn');
    const backBtn = document.getElementById('text-back-btn');
    const cancelBtn = document.getElementById('text-cancel-btn');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        closeModal();
        if (currentModalState.onConfirm) {
          currentModalState.onConfirm(currentModalState.parsedSpell);
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        currentModalState.state = 'text-input';
        renderTextModal();
        attachTextModalListeners();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
  } else if (currentModalState.state === 'error') {
    const retryBtn = document.getElementById('text-retry-btn');
    const cancelBtn = document.getElementById('text-cancel-btn');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        currentModalState.state = 'text-input';
        currentModalState.error = null;
        renderTextModal();
        attachTextModalListeners();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
  }
}

/**
 * Closes the modal and calls the onCancel callback
 */
function closeModal() {
  const overlay = document.getElementById('text-import-modal-overlay');
  if (overlay) {
    overlay.remove();
  }

  if (currentModalState && currentModalState.onCancel) {
    currentModalState.onCancel();
  }

  currentModalState = null;
}
