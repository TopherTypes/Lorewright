// JSON export and import for full campaign data backup and portability.
// Export produces a single JSON file containing all entity data.
// Import validates the file structure before overwriting stored data.

import { getAllCreatures, clearAllCreatures, importCreatures } from '../storage/creatures.js';
import { getAllItems, clearAllItems, importItems } from '../storage/items.js';
import { validateExportFile } from './validators.js';
import { formatDateForFilename } from './formatters.js';

// App version constant — increment on breaking schema changes (see CHANGELOG.md)
export const APP_VERSION = '0.1.0';

/**
 * Exports all campaign data to a JSON file and triggers a browser download.
 * The export format includes a version field so future imports can detect
 * schema mismatches.
 * @returns {Promise<void>}
 */
export async function exportAllData() {
  const [creatures, items] = await Promise.all([getAllCreatures(), getAllItems()]);

  const exportObj = {
    // Note: DATA_MODEL.md has a typo "lorew right_version" (space). Correct key is below.
    lorewright_version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    creatures,
    items,
    // Phase 2+ entities (empty arrays for forward-compatibility)
    npcs: [],
    locations: [],
    factions: [],
    sessionLogs: [],
    timelineEvents: [],
  };

  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Append to DOM before clicking — required in Firefox for the download to work
  const link = document.createElement('a');
  link.href = url;
  link.download = `lorewright-export-${formatDateForFilename(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports campaign data from a JSON File object.
 * Validates the file structure, asks for user confirmation, then replaces
 * all stored data with the imported data.
 * @param {File} file
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function importData(file) {
  let text;
  try {
    text = await file.text();
  } catch {
    return { success: false, message: 'Could not read the file.' };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, message: 'File is not valid JSON.' };
  }

  const validation = validateExportFile(data);
  if (!validation.valid) {
    return {
      success: false,
      message: `Validation failed:\n• ${validation.errors.join('\n• ')}`,
    };
  }

  // Warn if the version differs — not a hard block, just a notice
  const versionMismatch = data.lorewright_version !== APP_VERSION;
  const versionWarning = versionMismatch
    ? `\n\nNote: this file was created with version ${data.lorewright_version} (current: ${APP_VERSION}).`
    : '';

  const creatureCount = (data.creatures ?? []).length;
  const itemCount     = (data.items ?? []).length;
  const confirmed = window.confirm(
    `This will replace all existing data with ${creatureCount} creature(s) and ${itemCount} item(s) from the import file.${versionWarning}\n\nContinue?`
  );

  if (!confirmed) {
    return { success: false, message: 'Import cancelled.' };
  }

  await Promise.all([clearAllCreatures(), clearAllItems()]);
  if (creatureCount > 0) await importCreatures(data.creatures);
  if (itemCount > 0)     await importItems(data.items);

  return {
    success: true,
    message: `Imported ${creatureCount} creature(s) and ${itemCount} item(s) successfully.`,
  };
}
