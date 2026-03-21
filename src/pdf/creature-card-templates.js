// HTML template generators for creature stat cards.
// Supports three variants: basic (poker), complex (index), spellcaster (index).

/**
 * Safely escape HTML to prevent injection.
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format ability modifier (e.g., "+2" or "-1").
 */
function formatModifier(mod) {
  if (mod > 0) return `+${mod}`;
  if (mod < 0) return `${mod}`;
  return '+0';
}

/**
 * Generate basic creature card (poker sized).
 * @param {object} creature Derived creature object
 * @param {string} imageUrl Optional image URL
 * @returns {string} HTML string
 */
export function createBasicCreatureCardHTML(creature, imageUrl) {
  const name = escapeHtml(creature.name || 'Unknown Creature');
  const type = escapeHtml(creature.type || '');
  const size = escapeHtml(creature.size || 'Medium');
  const cr = creature.cr || 1;
  const ac = creature.defence?.ac?.total || 10;
  const hp = creature.defence?.hp?.total || 1;
  const init = creature.initiative?.total || 0;
  const stats = creature.statistics || {};

  // Get primary melee attack
  const meleeAttacks = creature.offence?.melee || [];
  const meleeName = meleeAttacks.length > 0 ? escapeHtml(meleeAttacks[0].name || 'Attack') : 'None';

  // Get primary speed
  const speed = creature.offence?.speed?.land || 30;

  // Get special qualities (first 3)
  const qualities = (creature.statistics?.specialQualities || []).slice(0, 3);

  const imageHtml = imageUrl
    ? `<div class="card-image"><img src="${escapeHtml(imageUrl)}" alt="creature"></div>`
    : '';

  return `
    <div class="creature-card basic">
      ${imageHtml}
      <div class="creature-name">${name}</div>
      <div class="creature-meta">${type} | ${size} | CR ${cr}</div>
      <div class="combat-stats">AC ${ac} | HP ${hp} | Init ${formatModifier(init)}</div>
      <div class="content-section">
        <div class="stat-line"><span class="stat-label">Speed:</span> ${speed} ft</div>
        <div class="stat-line"><span class="stat-label">Melee:</span> ${meleeName}</div>
      </div>
      <div class="ability-scores">
        <div class="ability-score"><span class="ability-abbr">Str</span> ${stats.str || 10} (${formatModifier(stats.strMod || 0)})</div>
        <div class="ability-score"><span class="ability-abbr">Dex</span> ${stats.dex || 10} (${formatModifier(stats.dexMod || 0)})</div>
        <div class="ability-score"><span class="ability-abbr">Con</span> ${stats.con || 10} (${formatModifier(stats.conMod || 0)})</div>
        <div class="ability-score"><span class="ability-abbr">Int</span> ${stats.int || 10} (${formatModifier(stats.intMod || 0)})</div>
        <div class="ability-score"><span class="ability-abbr">Wis</span> ${stats.wis || 10} (${formatModifier(stats.wisMod || 0)})</div>
        <div class="ability-score"><span class="ability-abbr">Cha</span> ${stats.cha || 10} (${formatModifier(stats.chaMod || 0)})</div>
      </div>
      ${qualities.length > 0 ? `
        <div class="special-qualities">
          ${qualities.map(q => `<div class="ability-item">${escapeHtml(q)}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate complex creature card (index card sized).
 * Full stat block with Defense/Offense/Statistics sections.
 * @param {object} creature Derived creature object
 * @param {string} imageUrl Optional image URL
 * @param {string} orientation 'landscape' | 'portrait'
 * @returns {string} HTML string
 */
export function createComplexCreatureCardHTML(creature, imageUrl, orientation = 'landscape') {
  const name = escapeHtml(creature.name || 'Unknown Creature');
  const type = escapeHtml(creature.type || '');
  const size = escapeHtml(creature.size || 'Medium');
  const cr = creature.cr || 1;
  const xp = creature.xp || 0;
  const stats = creature.statistics || {};
  const defence = creature.defence || {};
  const offence = creature.offence || {};

  // Defense section
  const ac = defence.ac?.total || 10;
  const acTouch = defence.ac?.touch || ac;
  const acFlatFooted = defence.ac?.flatFooted || ac;
  const hp = defence.hp?.total || 1;
  const dr = escapeHtml(defence.hp?.dr || '');
  const regen = escapeHtml(defence.hp?.regeneration || '');
  const fortSave = defence.saves?.fort?.total || 0;
  const refSave = defence.saves?.ref?.total || 0;
  const willSave = defence.saves?.will?.total || 0;

  // Immunities, resistances, weaknesses
  const immunities = (defence.immunities || []).map(escapeHtml).join(', ');
  const resistances = (defence.resistances || []).map(escapeHtml).join(', ');
  const weaknesses = (defence.weaknesses || []).map(escapeHtml).join(', ');

  // Offense section
  const initiative = creature.initiative?.total || 0;
  const speed = offence.speed?.land || 30;
  const meleeAttacks = offence.melee || [];
  const rangedAttacks = offence.ranged || [];
  const specialAttacks = (offence.specialAttacks || []).map(escapeHtml).join(', ');

  // Statistics
  const bab = stats.bab || 0;
  const cmb = stats.cmb || 0;
  const cmd = stats.cmd || 0;
  const feats = (stats.feats || []).slice(0, 6).map(escapeHtml).join(', ');

  // Skills (only with positive bonuses, max 8)
  const skills = (stats.skills || [])
    .filter(s => (s.total || 0) > 0)
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 8)
    .map(s => `${escapeHtml(s.name)} +${s.total}`)
    .join(', ');

  // Senses and languages
  const senses = escapeHtml(offence.senses?.join(', ') || '');
  const languages = (stats.languages || []).map(escapeHtml).join(', ');

  // Special abilities (first 3-4)
  const abilities = (creature.specialAbilities || []).slice(0, 3);

  const imageHtml = imageUrl
    ? `<div class="card-image"><img src="${escapeHtml(imageUrl)}" alt="creature"></div>`
    : '';

  return `
    <div class="creature-card complex ${orientation}">
      ${imageHtml}
      <div class="creature-name">${name}</div>
      <div class="creature-meta">${type} | ${size} | CR ${cr} (${xp} XP)</div>

      <div class="defense-block">
        <div class="section-header">DEFENSE</div>
        <div class="stat-line">AC ${ac} (touch ${acTouch}, flat-footed ${acFlatFooted})</div>
        <div class="stat-line">HP ${hp}${dr ? ` (DR ${dr})` : ''}${regen ? ` (Regeneration ${regen})` : ''}</div>
        <div class="stat-line">Saves: Fort +${fortSave}, Ref +${refSave}, Will +${willSave}</div>
        ${immunities ? `<div class="stat-line">Immunities: ${immunities}</div>` : ''}
        ${resistances ? `<div class="stat-line">Resistances: ${resistances}</div>` : ''}
        ${weaknesses ? `<div class="stat-line">Weakness: ${weaknesses}</div>` : ''}
      </div>

      <div class="offense-block">
        <div class="section-header">OFFENSE</div>
        <div class="stat-line">Init ${formatModifier(initiative)} | Speed ${speed} ft</div>
        ${meleeAttacks.map(a => {
          const name = escapeHtml(a.name || 'Attack');
          const bonus = a.bonus || 0;
          const damage = escapeHtml(a.damage || '1d4');
          return `<div class="stat-line">Melee: ${name} ${formatModifier(bonus)} (${damage})</div>`;
        }).join('')}
        ${rangedAttacks.map(a => {
          const name = escapeHtml(a.name || 'Attack');
          const bonus = a.bonus || 0;
          const damage = escapeHtml(a.damage || '1d4');
          return `<div class="stat-line">Ranged: ${name} ${formatModifier(bonus)} (${damage})</div>`;
        }).join('')}
        ${specialAttacks ? `<div class="stat-line">Special Attacks: ${specialAttacks}</div>` : ''}
      </div>

      <div class="statistics-block">
        <div class="section-header">STATISTICS</div>
        <div class="stat-line">
          <span class="stat-label">Str</span> ${stats.str || 10} (${formatModifier(stats.strMod || 0)})
          <span class="stat-label" style="margin-left: 12px;">Dex</span> ${stats.dex || 10} (${formatModifier(stats.dexMod || 0)})
          <span class="stat-label" style="margin-left: 12px;">Con</span> ${stats.con || 10} (${formatModifier(stats.conMod || 0)})
        </div>
        <div class="stat-line">
          <span class="stat-label">Int</span> ${stats.int || 10} (${formatModifier(stats.intMod || 0)})
          <span class="stat-label" style="margin-left: 12px;">Wis</span> ${stats.wis || 10} (${formatModifier(stats.wisMod || 0)})
          <span class="stat-label" style="margin-left: 12px;">Cha</span> ${stats.cha || 10} (${formatModifier(stats.chaMod || 0)})
        </div>
        <div class="stat-line">BAB ${bab} | CMB ${cmb} | CMD ${cmd}</div>
        ${feats ? `<div class="stat-line">Feats: ${feats}</div>` : ''}
        ${skills ? `<div class="stat-line">Skills: ${skills}</div>` : ''}
      </div>

      ${abilities.length > 0 ? `
        <div class="abilities-block">
          <div class="section-header">SPECIAL ABILITIES</div>
          ${abilities.map(a => `<div class="ability-item">${escapeHtml(a.name || '')}: ${escapeHtml(a.description || '')}</div>`).join('')}
        </div>
      ` : ''}

      <div style="font-size: 8px; line-height: 1.2; padding-top: 4px;">
        ${senses ? `<div>Senses: ${senses}</div>` : ''}
        ${languages ? `<div>Languages: ${languages}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate spellcaster creature card (index card sized).
 * Optimized for spell-focused creatures with adaptive spell list.
 * @param {object} creature Derived creature object
 * @param {string} imageUrl Optional image URL
 * @param {string} orientation 'landscape' | 'portrait'
 * @returns {string} HTML string
 */
export function createSpellcasterCardHTML(creature, imageUrl, orientation = 'landscape') {
  const name = escapeHtml(creature.name || 'Unknown Creature');
  const type = escapeHtml(creature.type || '');
  const size = escapeHtml(creature.size || 'Medium');
  const cr = creature.cr || 1;
  const xp = creature.xp || 0;
  const stats = creature.statistics || {};
  const defence = creature.defence || {};
  const offence = creature.offence || {};

  // Quick stats
  const ac = defence.ac?.total || 10;
  const hp = defence.hp?.total || 1;
  const initiative = creature.initiative?.total || 0;
  const fortSave = defence.saves?.fort?.total || 0;
  const refSave = defence.saves?.ref?.total || 0;
  const willSave = defence.saves?.will?.total || 0;

  // Melee/Ranged (minimal)
  const meleeAttacks = offence.melee || [];
  const rangedAttacks = offence.ranged || [];
  const primaryMelee = meleeAttacks.length > 0 ? meleeAttacks[0] : null;
  const primaryRanged = rangedAttacks.length > 0 ? rangedAttacks[0] : null;

  // Spellcasting
  const spellSlots = offence.spellSlots || {};
  const clevel = spellSlots.casterLevel || offence.clevel || stats.clevel || 1;
  const spellSaveDc = stats.spellSaveDc || 10 + (stats.intMod || stats.wisMod || 0);
  const concentration = stats.concentration || 0;

  // Spell list parsing - adaptive to what's present
  const spellsPrepared = offence.spellsPrepared || '';
  const spellsKnown = offence.spellsKnown || '';
  const spellLikeAbilities = offence.spellLikeAbilities || '';

  // Check if creature has linked spells (new format)
  const hasPreparedIds = (offence.spellsPreparedIds?.length ?? 0) > 0;
  const hasKnownIds = (offence.spellsKnownIds?.length ?? 0) > 0;
  const hasLikeAbilityIds = (offence.spellLikeAbilityIds?.length ?? 0) > 0;

  // Parse spell list into levels
  const parseSpellList = (spellText) => {
    const lines = spellText.split('\n').filter(l => l.trim());
    const levels = {};
    let currentLevel = null;

    lines.forEach(line => {
      const levelMatch = line.match(/^\s*(\d+):/);
      if (levelMatch) {
        currentLevel = parseInt(levelMatch[1]);
        levels[currentLevel] = [];
        const spells = line.split(':')[1]?.trim() || '';
        if (spells) levels[currentLevel].push(escapeHtml(spells));
      } else if (currentLevel !== null && line.trim()) {
        levels[currentLevel].push(escapeHtml(line.trim()));
      }
    });
    return levels;
  };

  // Group spell IDs by level
  const groupSpellIdsByLevel = (spellIds = []) => {
    const levels = {};
    spellIds.forEach(spellRef => {
      const level = spellRef.level ?? 0;
      if (!levels[level]) levels[level] = [];
      // Use spell name if available, fallback to spell ID
      const displayName = spellRef.spellName || `Spell ID: ${spellRef.spellId.substring(0, 8)}`;
      levels[level].push(escapeHtml(displayName));
    });
    return levels;
  };

  // Use linked spells if available, otherwise fall back to text
  const preparedLevels = hasPreparedIds ? groupSpellIdsByLevel(offence.spellsPreparedIds) : (spellsPrepared ? parseSpellList(spellsPrepared) : {});
  const knownLevels = hasKnownIds ? groupSpellIdsByLevel(offence.spellsKnownIds) : (spellsKnown ? parseSpellList(spellsKnown) : {});

  // Special abilities (first 2)
  const abilities = (creature.specialAbilities || []).slice(0, 2);

  // Senses and languages
  const senses = escapeHtml(offence.senses?.join(', ') || '');
  const languages = (stats.languages || []).map(escapeHtml).join(', ');

  const imageHtml = imageUrl
    ? `<div class="card-image"><img src="${escapeHtml(imageUrl)}" alt="creature"></div>`
    : '';

  return `
    <div class="creature-card spellcaster ${orientation}">
      ${imageHtml}
      <div class="creature-name">${name}</div>
      <div class="creature-meta">${type} | ${size} | CR ${cr} (${xp} XP)</div>

      <div class="spellcasting-block">
        <div class="section-header">QUICK STATS</div>
        <div class="stat-line">AC ${ac} | HP ${hp} | Init ${formatModifier(initiative)}</div>
        <div class="stat-line">Fort +${fortSave}, Ref +${refSave}, Will +${willSave}</div>
      </div>

      ${primaryMelee || primaryRanged ? `
        <div class="spellcasting-block">
          <div class="section-header">ATTACKS</div>
          ${primaryMelee ? `<div class="stat-line">Melee: ${escapeHtml(primaryMelee.name || 'Attack')} ${formatModifier(primaryMelee.bonus || 0)} (${escapeHtml(primaryMelee.damage || '1d4')})</div>` : ''}
          ${primaryRanged ? `<div class="stat-line">Ranged: ${escapeHtml(primaryRanged.name || 'Attack')} ${formatModifier(primaryRanged.bonus || 0)} (${escapeHtml(primaryRanged.damage || '1d4')})</div>` : ''}
        </div>
      ` : ''}

      <div class="spellcasting-block">
        <div class="section-header">SPELLCASTING</div>
        <div class="stat-line"><span class="spell-dc">CL ${clevel}</span> | <span class="spell-dc">Save DC ${spellSaveDc}</span></div>
        <div class="stat-line"><span class="concentration-bonus">Concentration ${formatModifier(concentration)}</span></div>

        ${Object.keys(preparedLevels).length > 0 ? `
          <div style="margin-top: 4px;">
            <div style="font-weight: bold; font-size: 8px; margin-bottom: 2px;">Spells Prepared:</div>
            ${hasPreparedIds ?
              offence.spellsPreparedIds.map(spellRef => {
                const spellId = spellRef.spellId;
                const slots = spellSlots.spellsPreparedSlots?.[spellId] ?? 1;
                const slotBoxes = Array(slots).fill('☐').join('');
                return `<div class="spell-item">${escapeHtml(spellRef.spellName || 'Unknown')} ${slotBoxes}</div>`;
              }).join('')
            :
              Object.keys(preparedLevels).sort((a, b) => parseInt(a) - parseInt(b)).map(level => `
                <div class="spell-level">${level === '0' ? 'Cantrips' : `${level}`}:</div>
                ${preparedLevels[level].map(spell => `<div class="spell-item">${spell}</div>`).join('')}
              `).join('')
            }
          </div>
        ` : ''}

        ${Object.keys(knownLevels).length > 0 ? `
          <div style="margin-top: 4px;">
            <div style="font-weight: bold; font-size: 8px; margin-bottom: 2px;">Spells Known:</div>
            ${hasKnownIds ? `
              ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(level => {
                const hasSpellsAtLevel = (offence.spellsKnownIds || []).some(s => s.level === level);
                return hasSpellsAtLevel;
              }).map(level => {
                const slots = spellSlots.spellsKnownSlots?.[level] ?? 0;
                const slotBoxes = Array(slots).fill('☐').join('');
                const levelLabel = level === 0 ? 'Cantrips' : `Lvl ${level}`;
                return `<div class="spell-item">${levelLabel} ${slotBoxes}</div>`;
              }).join('')}
            ` : `
              ${Object.keys(knownLevels).sort((a, b) => parseInt(a) - parseInt(b)).map(level => `
                <div class="spell-level">${level === '0' ? 'Cantrips' : `${level}`}:</div>
                ${knownLevels[level].map(spell => `<div class="spell-item">${spell}</div>`).join('')}
              `).join('')}
            `}
          </div>
        ` : ''}

        ${hasLikeAbilityIds || spellLikeAbilities ? `
          <div style="margin-top: 4px;">
            <div style="font-weight: bold; font-size: 8px; margin-bottom: 2px;">Spell-Like Abilities:</div>
            ${hasLikeAbilityIds ? `
              <div style="font-size: 8px; line-height: 1.2;">
                ${offence.spellLikeAbilityIds.map(spellRef => {
                  const spellId = spellRef.spellId;
                  const usesPerDay = spellSlots.spellLikeAbilityUsesPerDay?.[spellId] ?? 1;
                  const slotBoxes = Array(usesPerDay).fill('☐').join('');
                  return `<div>${escapeHtml(spellRef.spellName || 'Unknown')} ${slotBoxes}</div>`;
                }).join('')}
              </div>
            ` : `
              <div style="font-size: 8px; white-space: pre-wrap; line-height: 1.2;">${escapeHtml(spellLikeAbilities)}</div>
            `}
          </div>
        ` : ''}
      </div>

      <div class="statistics-block">
        <div class="section-header">ABILITY SCORES</div>
        <div class="stat-line">
          <span style="display: inline-block; width: 45px;">Str ${stats.str || 10}</span>
          <span style="display: inline-block; width: 45px;">Dex ${stats.dex || 10}</span>
          <span style="display: inline-block; width: 45px;">Con ${stats.con || 10}</span>
        </div>
        <div class="stat-line">
          <span style="display: inline-block; width: 45px;">Int ${stats.int || 10}</span>
          <span style="display: inline-block; width: 45px;">Wis ${stats.wis || 10}</span>
          <span style="display: inline-block; width: 45px;">Cha ${stats.cha || 10}</span>
        </div>
      </div>

      ${abilities.length > 0 ? `
        <div class="abilities-block">
          <div class="section-header">SPECIAL ABILITIES</div>
          ${abilities.map(a => `<div class="ability-item">${escapeHtml(a.name || '')}</div>`).join('')}
        </div>
      ` : ''}

      <div style="font-size: 8px; line-height: 1.2; padding-top: 4px;">
        ${senses ? `<div>Senses: ${senses}</div>` : ''}
        ${languages ? `<div>Languages: ${languages}</div>` : ''}
      </div>
    </div>
  `;
}
