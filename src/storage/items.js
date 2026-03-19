// Items storage facade.
// Provides named, semantic functions for item CRUD operations.
// All calls delegate to db.js — no direct IndexedDB usage here.

import { getAll, getById, put, remove, clearStore, putMany } from './db.js';

const STORE = 'items';

/**
 * Returns all stored items.
 * @returns {Promise<object[]>}
 */
export async function getAllItems() {
  return getAll(STORE);
}

/**
 * Returns a single item by ID, or undefined if not found.
 * @param {string} id UUID of the item
 * @returns {Promise<object|undefined>}
 */
export async function getItemById(id) {
  return getById(STORE, id);
}

/**
 * Creates or updates an item record.
 * @param {object} item Must include meta.id field
 * @returns {Promise<void>}
 */
export async function saveItem(item) {
  return put(STORE, item);
}

/**
 * Deletes an item by ID.
 * @param {string} id UUID of the item
 * @returns {Promise<void>}
 */
export async function deleteItem(id) {
  return remove(STORE, id);
}

/**
 * Deletes all items from the store. Used during data import.
 * @returns {Promise<void>}
 */
export async function clearAllItems() {
  return clearStore(STORE);
}

/**
 * Writes an array of item records in a single transaction. Used during import.
 * @param {object[]} items
 * @returns {Promise<void>}
 */
export async function importItems(items) {
  return putMany(STORE, items);
}
