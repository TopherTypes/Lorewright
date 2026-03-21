// HTML template renderers for spell cards.
// Generates markup for spell cards optimized for printing.

/**
 * Creates HTML for a spell card.
 * @param {object} spell The spell object from storage
 * @returns {string} HTML string for the card
 */
export function createSpellCardHTML(spell) {
  const name = escapeHtml(spell.name || '(Unnamed)');
  const level = spell.level || 0;
  const school = escapeHtml(spell.school || '');
  const castingTime = escapeHtml(spell.castingTime || '');
  const range = escapeHtml(spell.range || '');
  const duration = escapeHtml(spell.duration || '');
  const savingThrow = escapeHtml(spell.savingThrow || 'None');
  const spellResistance = spell.spellResistance ? 'Yes' : 'No';
  const description = escapeHtml(spell.description || '');
  const scalingInfo = escapeHtml(spell.scalingInfo || '');

  // Build components string with badges
  const components = spell.components || {};
  const componentsList = [];
  if (components.verbal) componentsList.push('V');
  if (components.somatic) componentsList.push('S');
  if (components.material) componentsList.push('M');
  if (components.focus) componentsList.push('F');
  if (components.divineFocus) componentsList.push('DF');
  const componentsStr = componentsList.length > 0 ? componentsList.join(', ') : '—';

  // Build material description if present
  let materialNote = '';
  if (components.material && components.materialDescription) {
    materialNote = `<div class="card-material-note">M: ${escapeHtml(components.materialDescription)}</div>`;
  }

  // Build damage info if present
  let damageHtml = '';
  if (spell.damageType || spell.damageRolls) {
    const damageType = escapeHtml(spell.damageType || '');
    const damageRolls = escapeHtml(spell.damageRolls || '');
    damageHtml = `
      <div class="card-damage">
        <div class="card-damage-label">Damage:</div>
        <div class="card-damage-value">${damageType}${damageType && damageRolls ? ' - ' : ''}${damageRolls}</div>
      </div>
    `;
  }

  // Build scaling info section if present
  let scalingHtml = '';
  if (scalingInfo) {
    scalingHtml = `
      <div class="card-scaling-section">
        <div class="card-scaling-header">At Higher Levels</div>
        <div class="card-scaling-text">${scalingInfo.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }

  // Add continuation indicator if present
  const continuationIndicator = spell._continuation ? `<div style="font-size: 7pt; color: #8b8680; text-align: center; padding-top: 0.02in; border-top: 1px solid #d4cec4;">[continued]</div>` : '';

  // Hide attributes and mechanics on continuation cards
  const isContinuation = spell._continuation;
  const attributesAndMechanics = isContinuation ? '' : `
    <div class="card-attributes-row">
      <div class="card-attribute">
        <span class="card-attribute-icon">⚡</span>
        <span class="card-attribute-value">${castingTime}</span>
      </div>
      <div class="card-attribute">
        <span class="card-attribute-icon">📏</span>
        <span class="card-attribute-value">${range}</span>
      </div>
      <div class="card-attribute">
        <span class="card-attribute-icon">⌛</span>
        <span class="card-attribute-value">${duration}</span>
      </div>
    </div>

    <div class="card-mechanics-box">
      <div class="card-row">
        <div class="card-label">Components:</div>
        <div class="card-value">${componentsStr}</div>
      </div>
      ${materialNote}
      <div class="card-row">
        <div class="card-label">Save:</div>
        <div class="card-value">${savingThrow}</div>
      </div>
      <div class="card-row">
        <div class="card-label">SR:</div>
        <div class="card-value">${spellResistance}</div>
      </div>
      ${damageHtml}
    </div>

    <div class="card-divider"></div>
  `;

  return `
    <div class="spell-card">
      <div class="card-header">
        <div class="card-name">${name}</div>
        <div class="card-level-school">${level === 0 ? 'Cantrip' : `Level ${level}`} ${school ? '• ' + school : ''}${isContinuation ? ' — [continued]' : ''}</div>
      </div>

      ${attributesAndMechanics}

      <div class="card-description">
        ${description.replace(/\n/g, '<br>')}
      </div>

      ${scalingHtml}
      ${continuationIndicator}
    </div>
  `;
}

/**
 * Simple HTML escaping to prevent injection.
 * @param {string} text
 * @returns {string}
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
