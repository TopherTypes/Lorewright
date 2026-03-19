// Display formatter functions.
// Pure functions that convert stored values to display strings.

/**
 * Formats a numeric modifier with an explicit sign.
 * e.g. 3 → "+3", -2 → "-2", 0 → "+0"
 * @param {number} value
 * @returns {string}
 */
export function formatModifier(value) {
  const n = Number(value) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

/**
 * Formats a Challenge Rating value.
 * Converts 0.5 → "1/2", 0.333... → "1/3", 0.25 → "1/4".
 * Integers are returned as-is (as strings).
 * @param {number|string} cr
 * @returns {string}
 */
export function formatCR(cr) {
  if (cr === null || cr === undefined || cr === '') return '—';
  // If already a fraction string, return it
  if (typeof cr === 'string' && cr.includes('/')) return cr;
  const n = Number(cr);
  if (isNaN(n)) return String(cr);
  if (n === 0.5 || Math.abs(n - 0.5) < 0.01)  return '1/2';
  if (n === 0.333 || Math.abs(n - 1/3) < 0.01) return '1/3';
  if (n === 0.25 || Math.abs(n - 0.25) < 0.01) return '1/4';
  return String(n);
}

/**
 * Formats the speed object into a compact string.
 * e.g. { land: 30, fly: 60, flyManeuverability: 'good' } → "30 ft., fly 60 ft. (good)"
 * @param {object} speed
 * @returns {string}
 */
export function formatSpeed(speed) {
  if (!speed) return '—';
  const parts = [];
  if (speed.land)   parts.push(`${speed.land} ft.`);
  if (speed.fly) {
    const maneuver = speed.flyManeuverability ? ` (${speed.flyManeuverability})` : '';
    parts.push(`fly ${speed.fly} ft.${maneuver}`);
  }
  if (speed.swim)   parts.push(`swim ${speed.swim} ft.`);
  if (speed.climb)  parts.push(`climb ${speed.climb} ft.`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`);
  return parts.length > 0 ? parts.join(', ') : '—';
}

/**
 * Formats a date string for use in filenames.
 * e.g. new Date() → "2024-01-15"
 * @param {Date} date
 * @returns {string}
 */
export function formatDateForFilename(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Formats XP as a comma-separated number.
 * e.g. 4800 → "4,800"
 * @param {number} xp
 * @returns {string}
 */
export function formatXP(xp) {
  if (!xp && xp !== 0) return '—';
  return Number(xp).toLocaleString();
}
