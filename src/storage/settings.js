// Settings storage facade.
// Campaign settings are stored as a single record with id: 'campaign'.
// All calls delegate to db.js.

import { getById, put } from './db.js';

const STORE = 'settings';
const SETTINGS_KEY = 'campaign';

/**
 * Returns the campaign settings object.
 * Returns a default object if no settings have been saved yet.
 * @returns {Promise<object>}
 */
export async function getSettings() {
  const settings = await getById(STORE, SETTINGS_KEY);
  return settings ?? { id: SETTINGS_KEY, campaignName: '' };
}

/**
 * Saves the campaign settings object.
 * Automatically sets the required id field.
 * @param {object} settings
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  return put(STORE, { ...settings, id: SETTINGS_KEY });
}
