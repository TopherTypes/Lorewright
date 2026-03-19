// Raw IndexedDB abstraction layer.
// All data persistence in Lorewright flows through this module.
// Entity modules must not call IndexedDB directly — use the facade files
// (creatures.js, items.js, settings.js) which call into this module.
//
// Database: "lorewright", version 2
// Object stores created in onupgradeneeded:
//   creatures  — keyPath: 'meta.id'
//   items      — keyPath: 'meta.id'
//   settings   — keyPath: 'id'

const DB_NAME = 'lorewright';
const DB_VERSION = 2;

// Cached database instance — opened once, reused for all operations.
// This is a Promise<IDBDatabase> so concurrent callers all await the same open.
let dbPromise = null;

/**
 * Opens the IndexedDB database and returns the IDBDatabase instance.
 * Result is cached so the database is only opened once per session.
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Called when the database is created or upgraded to a new version.
    // Object store creation must happen here — IDB requires it.
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Creatures store — keyed by the nested meta.id field
      if (!db.objectStoreNames.contains('creatures')) {
        db.createObjectStore('creatures', { keyPath: 'meta.id' });
      }

      // Items store — keyed by the nested meta.id field
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'meta.id' });
      }

      // Settings store — keyed by top-level id field (e.g. 'campaign')
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      // Reset the cached promise so future calls can retry
      dbPromise = null;
      reject(new Error(`Failed to open database: ${event.target.error?.message}`));
    };
  });

  return dbPromise;
}

/**
 * Wraps an IDBRequest in a Promise.
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror  = (event) => reject(new Error(event.target.error?.message));
  });
}

/**
 * Opens a transaction and returns the object store.
 * @param {string} storeName
 * @param {'readonly'|'readwrite'} mode
 * @returns {Promise<IDBObjectStore>}
 */
async function getStore(storeName, mode = 'readonly') {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

// ── Public CRUD functions ──────────────────────────────────

/**
 * Returns all records from the given object store.
 * @param {string} storeName
 * @returns {Promise<any[]>}
 */
export async function getAll(storeName) {
  const store = await getStore(storeName, 'readonly');
  return promisifyRequest(store.getAll());
}

/**
 * Returns a single record by its key, or undefined if not found.
 * @param {string} storeName
 * @param {string} id
 * @returns {Promise<any|undefined>}
 */
export async function getById(storeName, id) {
  const store = await getStore(storeName, 'readonly');
  return promisifyRequest(store.get(id));
}

/**
 * Creates or updates a record in the store.
 * The record must contain the field(s) used as keyPath for the store.
 * @param {string} storeName
 * @param {object} record
 * @returns {Promise<void>}
 */
export async function put(storeName, record) {
  const store = await getStore(storeName, 'readwrite');
  return promisifyRequest(store.put(record));
}

/**
 * Removes a record by its key.
 * @param {string} storeName
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(storeName, id) {
  const store = await getStore(storeName, 'readwrite');
  return promisifyRequest(store.delete(id));
}

/**
 * Deletes all records from a store. Used during import to replace all data.
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  const store = await getStore(storeName, 'readwrite');
  return promisifyRequest(store.clear());
}

/**
 * Writes an array of records into a store in a single transaction.
 * More efficient than calling put() repeatedly for large imports.
 * @param {string} storeName
 * @param {object[]} records
 * @returns {Promise<void>}
 */
export async function putMany(storeName, records) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  // Wrap the transaction completion (not individual requests) in a promise
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(new Error(event.target.error?.message));

    for (const record of records) {
      store.put(record);
    }
  });
}
