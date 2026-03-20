// Spells storage facade.
// Provides named, semantic functions for spell CRUD operations.
// All calls delegate to db.js — no direct IndexedDB usage here.

import { getAll, getById, put, remove, clearStore, putMany } from './db.js';

const STORE = 'spells';

/**
 * Returns all stored spells.
 * @returns {Promise<object[]>}
 */
export async function getAllSpells() {
  return getAll(STORE);
}

/**
 * Returns a single spell by ID, or undefined if not found.
 * @param {string} id UUID of the spell
 * @returns {Promise<object|undefined>}
 */
export async function getSpellById(id) {
  return getById(STORE, id);
}

/**
 * Creates or updates a spell record.
 * @param {object} spell Must include meta.id field
 * @returns {Promise<void>}
 */
export async function saveSpell(spell) {
  return put(STORE, spell);
}

/**
 * Deletes a spell by ID.
 * @param {string} id UUID of the spell
 * @returns {Promise<void>}
 */
export async function deleteSpell(id) {
  return remove(STORE, id);
}

/**
 * Deletes all spells from the store. Used during data import.
 * @returns {Promise<void>}
 */
export async function clearAllSpells() {
  return clearStore(STORE);
}

/**
 * Writes an array of spells into the store in a single transaction.
 * More efficient than calling saveSpell() repeatedly for large imports.
 * @param {object[]} spells
 * @returns {Promise<void>}
 */
export async function importSpells(spells) {
  return putMany(STORE, spells);
}
