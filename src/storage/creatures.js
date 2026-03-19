// Creatures storage facade.
// Provides named, semantic functions for creature CRUD operations.
// All calls delegate to db.js — no direct IndexedDB usage here.

import { getAll, getById, put, remove, clearStore, putMany } from './db.js';

const STORE = 'creatures';

/**
 * Returns all stored creatures.
 * @returns {Promise<object[]>}
 */
export async function getAllCreatures() {
  return getAll(STORE);
}

/**
 * Returns a single creature by ID, or undefined if not found.
 * @param {string} id UUID of the creature
 * @returns {Promise<object|undefined>}
 */
export async function getCreatureById(id) {
  return getById(STORE, id);
}

/**
 * Creates or updates a creature record.
 * @param {object} creature Must include meta.id field
 * @returns {Promise<void>}
 */
export async function saveCreature(creature) {
  return put(STORE, creature);
}

/**
 * Deletes a creature by ID.
 * @param {string} id UUID of the creature
 * @returns {Promise<void>}
 */
export async function deleteCreature(id) {
  return remove(STORE, id);
}

/**
 * Deletes all creatures from the store. Used during data import.
 * @returns {Promise<void>}
 */
export async function clearAllCreatures() {
  return clearStore(STORE);
}

/**
 * Writes an array of creature records in a single transaction. Used during import.
 * @param {object[]} creatures
 * @returns {Promise<void>}
 */
export async function importCreatures(creatures) {
  return putMany(STORE, creatures);
}
