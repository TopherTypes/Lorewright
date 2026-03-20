// Spell detail card generator for creature PDF exports.
// Generates detailed spell card HTML for inclusion in creature card PDFs.

/**
 * Creates HTML for a spell detail card in creature card format.
 * Similar to spell cards but optimized for embedding in creature PDFs.
 * @param {object} spell The spell object from storage
 * @returns {string} HTML string for the spell detail card
 */
export function createSpellDetailCardHTML(spell) {
  const name = escapeHtml(spell.name || '(Unnamed)');
  const level = spell.level || 0;
  const school = escapeHtml(spell.school || '');
  const castingTime = escapeHtml(spell.castingTime || '');
  const range = escapeHtml(spell.range || '');
  const duration = escapeHtml(spell.duration || '');
  const savingThrow = escapeHtml(spell.savingThrow || 'None');
  const spellResistance = spell.spellResistance ? 'Yes' : 'No';
  const description = escapeHtml(spell.description || '');

  // Build components string
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
    materialNote = `<div class="spell-detail-material-note"><strong>M:</strong> ${escapeHtml(components.materialDescription)}</div>`;
  }

  // Build damage info if present
  let damageHtml = '';
  if (spell.damageType || spell.damageRolls) {
    const damageType = escapeHtml(spell.damageType || '');
    const damageRolls = escapeHtml(spell.damageRolls || '');
    damageHtml = `
      <div class="spell-detail-damage">
        <strong>Damage:</strong> ${damageType}${damageType && damageRolls ? ' — ' : ''}${damageRolls}
      </div>
    `;
  }

  return `
    <div class="spell-detail-card">
      <div class="spell-detail-header">
        <div class="spell-detail-name">${name}</div>
        <div class="spell-detail-meta">Level ${level} ${school} • ${castingTime}</div>
      </div>

      <div class="spell-detail-mechanics">
        <div><strong>Range:</strong> ${range}</div>
        <div><strong>Duration:</strong> ${duration}</div>
        <div><strong>Components:</strong> ${componentsStr}</div>
        ${materialNote}
        <div><strong>Saving Throw:</strong> ${savingThrow}</div>
        <div><strong>Spell Resistance:</strong> ${spellResistance}</div>
        ${damageHtml}
      </div>

      <div class="spell-detail-divider"></div>

      <div class="spell-detail-description">
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
