// HTML template renderers for item cards.
// Generates markup for both identified and unidentified card variants.

/**
 * Creates HTML for an identified item card.
 * @param {object} item The item object from storage
 * @returns {string} HTML string for the card
 */
export function createIdentifiedCardHTML(item) {
  const name = escapeHtml(item.name || '(Unnamed)');
  const type = escapeHtml(item.type || '');
  const weight = escapeHtml(item.weight || '—');
  const cl = item.cl ? `CL ${item.cl}` : '';
  const passphrase = escapeHtml(item.passphrase || '');

  // Build properties line (Slot, School)
  const propLines = [];
  if (item.slot && item.slot !== 'None') {
    propLines.push(`Slot: ${escapeHtml(item.slot)}`);
  }
  if (item.magicSchool) {
    propLines.push(`School: ${escapeHtml(item.magicSchool)}`);
  }

  const propsHtml = propLines.length > 0
    ? propLines.map(p => `<div class="card-properties-line">${p}</div>`).join('')
    : '';

  // Build effects section
  let effectsHtml = '';
  if (item.effects) {
    const effectsText = escapeHtml(item.effects);
    const effectsList = effectsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => `<div class="card-effects-item">• ${line.trim()}</div>`)
      .join('');

    effectsHtml = `
      <div class="card-effects">
        <div class="card-effects-title">Traits/Effects:</div>
        <div class="card-effects-list">${effectsList}</div>
      </div>
    `;
  }

  // Image section
  const imageHtml = item.imageUrl
    ? `<div class="card-image"><img src="${escapeHtml(item.imageUrl)}" alt="Item image" /></div>`
    : '';

  // Charge tracker for wands
  const chargeTrackerHtml = item.type && item.type.toLowerCase() === 'wand' && item.charges > 0
    ? createChargeTrackerHtml(item.charges)
    : '';

  return `
    <div class="card identified">
      ${imageHtml}
      <div class="card-name">${name}</div>
      <div class="card-meta">
        <span class="card-meta-item">${type}</span>
        ${cl ? `<span class="card-meta-item">${cl}</span>` : ''}
        <span class="card-meta-item">Wt: ${weight}</span>
      </div>
      ${propsHtml ? `<div class="card-properties">${propsHtml}</div>` : ''}
      ${effectsHtml}
      <div class="card-description">${escapeHtml(item.description || '').replace(/\n/g, '<br>')}</div>
      ${chargeTrackerHtml}
      <div class="card-passphrase">${passphrase}</div>
    </div>
  `;
}

/**
 * Creates HTML for an unidentified item card.
 * @param {object} item The item object from storage
 * @returns {string} HTML string for the card
 */
export function createUnidentifiedCardHTML(item) {
  // Use unidentified name or auto-generate
  const unidName = item.unidentifiedName || `Unidentified ${item.type}`;
  const name = escapeHtml(unidName);
  const type = escapeHtml(item.type || '');
  const weight = escapeHtml(item.weight || '—');
  const description = escapeHtml(item.unidentifiedDescription || '(No description)');
  const passphrase = escapeHtml(item.passphrase || '');

  return `
    <div class="card unidentified">
      <div class="card-image"></div>
      <div class="card-name unidentified">${name}</div>
      <div class="card-meta">
        <span class="card-meta-item">Type: ${type}</span>
        <span class="card-meta-item">Wt: ${weight}</span>
      </div>
      <div class="card-description">${description.replace(/\n/g, '<br>')}</div>
      <div class="card-passphrase">${passphrase}</div>
    </div>
  `;
}

/**
 * Creates HTML for a wand's charge tracker grid.
 * @param {number} charges Number of remaining charges
 * @returns {string} HTML for the charge tracker
 */
function createChargeTrackerHtml(charges) {
  const chargeCount = Math.min(Math.max(charges, 0), 50);
  let chargeBoxes = '';

  for (let i = 0; i < chargeCount; i++) {
    chargeBoxes += '<div class="charge-box"></div>';
  }

  return `<div class="card-charge-tracker">${chargeBoxes}</div>`;
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
