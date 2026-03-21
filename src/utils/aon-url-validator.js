/**
 * Validates and normalizes Archive of Nethys URLs
 */

import { AON_BASE_URL, AON_SPELL_PATH } from '../constants/aon-config.js';

/**
 * Validates if a URL is a valid Archive of Nethys spell page
 * @param {string} url - The URL to validate
 * @returns {Object} {valid: boolean, error?: string, normalizedUrl?: string}
 */
export function validateAoNURL(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must not be empty' };
  }

  const trimmedUrl = url.trim();

  // Check if URL contains the AON domain
  if (!trimmedUrl.includes('aonprd.com')) {
    return {
      valid: false,
      error: 'URL must be from aonprd.com',
    };
  }

  // Check if URL contains SpellDisplay.aspx
  if (!trimmedUrl.includes('SpellDisplay.aspx')) {
    return {
      valid: false,
      error: 'URL must be a spell page from Archive of Nethys',
    };
  }

  // Check if URL has ItemName parameter
  if (!trimmedUrl.includes('ItemName=')) {
    return {
      valid: false,
      error: 'URL must contain a spell name parameter',
    };
  }

  // Try to parse and validate as proper URL
  try {
    const urlObj = new URL(trimmedUrl);

    // Ensure https
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return {
        valid: false,
        error: 'URL must use HTTPS protocol',
      };
    }

    // Ensure aonprd.com domain
    if (!urlObj.hostname.includes('aonprd.com')) {
      return {
        valid: false,
        error: 'URL must be from aonprd.com',
      };
    }

    // Ensure SpellDisplay.aspx path
    if (!urlObj.pathname.includes('SpellDisplay.aspx')) {
      return {
        valid: false,
        error: 'URL must link to a spell page',
      };
    }

    // Ensure ItemName parameter
    const itemName = urlObj.searchParams.get('ItemName');
    if (!itemName || itemName.trim() === '') {
      return {
        valid: false,
        error: 'URL must contain a spell name',
      };
    }

    return {
      valid: true,
      normalizedUrl: urlObj.toString(),
    };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Extracts the spell name from a validated AoN URL
 * @param {string} url - The validated AoN spell URL
 * @returns {string} The spell name from the ItemName parameter
 */
export function extractSpellNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const itemName = urlObj.searchParams.get('ItemName');
    // URL decode the item name
    return decodeURIComponent(itemName || '').trim();
  } catch (e) {
    return '';
  }
}

/**
 * Normalizes a URL to have consistent formatting
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL
 */
export function normalizeURL(url) {
  try {
    const urlObj = new URL(url);

    // Ensure https
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }

    // Decode and re-encode ItemName to normalize encoding
    const itemName = urlObj.searchParams.get('ItemName');
    if (itemName) {
      urlObj.searchParams.set('ItemName', decodeURIComponent(itemName));
    }

    return urlObj.toString();
  } catch (e) {
    // If parsing fails, return original URL
    return url;
  }
}
