// UUID generation utility.
// Uses the Web Crypto API (crypto.randomUUID) which is available in all
// modern browsers and in Node.js 14.17+. No external library required.

/**
 * Generates a random UUID v4 string.
 * @returns {string} e.g. "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateUUID() {
  return crypto.randomUUID();
}
