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

  return `
    <div class="spell-card">
      <div class="card-header">
        <div class="card-name">${name}</div>
        <div class="card-level-school">${level === 0 ? 'Cantrip' : `Level ${level}`} ${school ? '• ' + school : ''}</div>
      </div>

      <div class="card-mechanics">
        <div class="card-row">
          <div class="card-label">Casting Time:</div>
          <div class="card-value">${castingTime}</div>
        </div>
        <div class="card-row">
          <div class="card-label">Range:</div>
          <div class="card-value">${range}</div>
        </div>
        <div class="card-row">
          <div class="card-label">Duration:</div>
          <div class="card-value">${duration}</div>
        </div>
        <div class="card-row">
          <div class="card-label">Components:</div>
          <div class="card-value">${componentsStr}</div>
        </div>
        ${materialNote}
        <div class="card-row">
          <div class="card-label">Saving Throw:</div>
          <div class="card-value">${savingThrow}</div>
        </div>
        <div class="card-row">
          <div class="card-label">Spell Resistance:</div>
          <div class="card-value">${spellResistance}</div>
        </div>
        ${damageHtml}
      </div>

      <div class="card-divider"></div>

      <div class="card-description">
        ${description.replace(/\n/g, '<br>')}
      </div>
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
