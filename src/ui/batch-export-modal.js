/**
 * Batch Export Modal
 * UI for selecting theme, layout, and exporting multiple cards as PDF
 * Also supports the new unified renderer with layout preview
 */

import { getThemeList } from '../rendering/card-styles.js';
import { getAllThemes } from '../rendering/card-theme-system.js';
import { downloadBatchPDF } from '../export/pdf-batch.js';
import { previewBatchLayout } from '../export/unified-pdf-export.js';

/**
 * Show batch export modal
 * @param {object[]} entities - Selected entities to export
 * @param {string} entityType - 'creature' or 'item'
 * @param {function} onClose - Callback when modal closes
 */
export async function showBatchExportModal(entities, entityType, onClose = null) {
  // Create modal HTML
  const themes = getThemeList();
  const themeOptions = themes
    .map(t => `<option value="${t.name}">${t.displayName}</option>`)
    .join('');

  const layoutOptions = `
    <option value="1x1">1 card per page</option>
    <option value="2x2" selected>4 cards per page (2×2)</option>
    <option value="3x3">9 cards per page (3×3)</option>
  `;

  const modal = document.createElement('div');
  modal.className = 'batch-export-modal';
  modal.id = 'batch-export-modal';
  modal.innerHTML = `
    <div class="modal-overlay" id="modal-overlay"></div>
    <div class="modal-content batch-export-content">
      <div class="modal-header">
        <h2>Export ${entities.length} ${entityType}${entities.length !== 1 ? 's' : ''}</h2>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Card previews -->
        <div class="batch-preview-section">
          <h3>Cards to Export</h3>
          <div class="batch-preview-list" id="batch-preview-list">
            ${entities.slice(0, 6).map(e => `
              <div class="batch-preview-item" title="${e.name}">
                <div class="batch-preview-name">${escapeHtml(e.name).substring(0, 20)}</div>
              </div>
            `).join('')}
            ${entities.length > 6 ? `
              <div class="batch-preview-item batch-preview-more">
                <div class="batch-preview-name">+${entities.length - 6} more</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Renderer selector -->
        <div class="batch-option-group">
          <label for="batch-renderer">Renderer:</label>
          <select id="batch-renderer" class="batch-select">
            <option value="classic" selected>Classic Renderer</option>
            <option value="unified">New Unified Renderer</option>
          </select>
        </div>

        <!-- Theme selector -->
        <div class="batch-option-group">
          <label for="batch-theme">Theme:</label>
          <select id="batch-theme" class="batch-select">
            ${themeOptions}
          </select>
        </div>

        <!-- Layout selector (classic renderer) -->
        <div class="batch-option-group" id="batch-layout-group">
          <label for="batch-layout">Layout:</label>
          <select id="batch-layout" class="batch-select">
            ${layoutOptions}
          </select>
        </div>

        <!-- Auto-layout option (new renderer) -->
        <div class="batch-option-group" id="batch-auto-layout-group" style="display: none;">
          <label>
            <input type="checkbox" id="batch-auto-layout" checked>
            Auto-optimize layout (group cards by size)
          </label>
        </div>

        <!-- Layout preview (new renderer) -->
        <div class="batch-layout-preview" id="batch-layout-preview" style="display: none;">
          <p><strong>Page Layout Preview:</strong></p>
          <div class="batch-preview-pages" id="batch-preview-pages"></div>
        </div>

        <!-- Info message -->
        <div class="batch-info-message">
          <p id="batch-info-text">Cards will be arranged on standard A4 (Letter) pages and ready to print.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-export-btn">Export PDF</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Wire up event listeners
  const overlay = modal.querySelector('#modal-overlay');
  const closeBtn = modal.querySelector('#modal-close-btn');
  const cancelBtn = modal.querySelector('#modal-cancel-btn');
  const exportBtn = modal.querySelector('#modal-export-btn');

  const closeModal = () => {
    modal.remove();
    if (onClose) onClose();
  };

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Renderer toggle
  const rendererSelect = modal.querySelector('#batch-renderer');
  const layoutGroup = modal.querySelector('#batch-layout-group');
  const autoLayoutGroup = modal.querySelector('#batch-auto-layout-group');
  const layoutPreview = modal.querySelector('#batch-layout-preview');
  const infoText = modal.querySelector('#batch-info-text');

  rendererSelect.addEventListener('change', (e) => {
    const isUnified = e.target.value === 'unified';
    layoutGroup.style.display = isUnified ? 'none' : 'block';
    autoLayoutGroup.style.display = isUnified ? 'block' : 'none';
    layoutPreview.style.display = isUnified ? 'block' : 'none';
    infoText.textContent = isUnified
      ? 'Cards will be auto-sized and optimally arranged on A4 pages.'
      : 'Cards will be arranged on standard A4 (Letter) pages and ready to print.';

    // Generate layout preview if unified renderer
    if (isUnified) {
      updateLayoutPreview(entities, entityType, modal);
    }
  });

  exportBtn.addEventListener('click', async () => {
    const renderer = modal.querySelector('#batch-renderer').value;
    const theme = modal.querySelector('#batch-theme').value;
    const layout = modal.querySelector('#batch-layout').value;
    const autoLayout = modal.querySelector('#batch-auto-layout')?.checked ?? true;

    exportBtn.disabled = true;
    exportBtn.textContent = 'Generating PDF…';

    try {
      await downloadBatchPDF(entities, {
        entityType,
        renderer,
        theme,
        layout,
        autoLayout,
        filename: `${entityType}s-export`,
      });
    } catch (error) {
      console.error('Error exporting batch PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export PDF';
      closeModal();
    }
  });

  // Return close function for external control
  return { modal, closeModal };
}

/**
 * Update layout preview for new unified renderer
 * @private
 */
function updateLayoutPreview(entities, entityType, modal) {
  const autoLayout = modal.querySelector('#batch-auto-layout')?.checked ?? true;
  const previewContainer = modal.querySelector('#batch-preview-pages');

  // Convert entities to card format for preview
  const cards = entities.map(entity => ({
    entity,
    type: entityType,
  }));

  try {
    const pages = previewBatchLayout(cards, { autoLayout });
    previewContainer.innerHTML = `
      <div class="batch-page-count">
        <strong>${pages.length} page(s)</strong> — ${entities.length} card(s)
      </div>
    `;
  } catch (error) {
    previewContainer.innerHTML = `<p style="color: var(--color-danger);">Error calculating layout: ${error.message}</p>`;
  }
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default showBatchExportModal;
