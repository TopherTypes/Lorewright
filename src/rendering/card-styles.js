/**
 * Card Styling and Themes
 * Centralized theme definitions for card rendering
 */

/**
 * Classic parchment-inspired theme with traditional D&D aesthetic
 */
export const THEME_CLASSIC = {
  name: 'classic',
  displayName: 'Classic Parchment',
  colors: {
    background: '#fdf6e3', // Cream parchment
    text: '#1a1208', // Dark brown text
    header: '#f5e6c0', // Light parchment header
    headerText: '#5c4a1a', // Dark gold text
    border: '#b8963c', // Gold border
    sectionLabel: '#8b6f47', // Medium gold
    rule: '#c9a84c', // Light gold divider
    stat: '#1a1208', // Dark text for stats
    abilityScore: '#5c4a1a', // Dark gold for ability scores
  },
  fonts: {
    family: 'Georgia, serif',
    fallback: 'serif',
    sizes: {
      title: 18,
      section: 11,
      sectionLabel: 9,
      stat: 10,
      ability: 9,
      note: 8,
    },
    weights: {
      normal: 400,
      bold: 700,
    },
  },
  spacing: {
    padding: 16, // Card padding in pixels
    margin: 8, // Between sections
    lineHeight: 1.3, // Multiplier for line height
    sectionSpacing: 4, // Between rows in sections
  },
  card: {
    width: 744, // 63mm at 300 DPI
    height: 1039, // 88mm at 300 DPI
  },
  borders: {
    outer: {
      thickness: 2,
      color: '#b8963c',
    },
    inner: {
      thickness: 0.5,
      color: '#c9a84c',
    },
  },
};

/**
 * Modern dark theme with high contrast
 */
export const THEME_MODERN_DARK = {
  name: 'modern-dark',
  displayName: 'Modern Dark',
  colors: {
    background: '#1a1a1a', // Dark background
    text: '#e0e0e0', // Light gray text
    header: '#2d2d2d', // Darker section
    headerText: '#4ecdc4', // Teal accent
    border: '#4ecdc4', // Teal borders
    sectionLabel: '#4ecdc4', // Teal labels
    rule: '#404040', // Dark divider
    stat: '#e0e0e0', // Light text
    abilityScore: '#4ecdc4', // Teal accents
  },
  fonts: {
    family: 'Helvetica, Arial, sans-serif',
    fallback: 'sans-serif',
    sizes: {
      title: 18,
      section: 11,
      sectionLabel: 9,
      stat: 10,
      ability: 9,
      note: 8,
    },
    weights: {
      normal: 400,
      bold: 700,
    },
  },
  spacing: {
    padding: 14,
    margin: 6,
    lineHeight: 1.3,
    sectionSpacing: 3,
  },
  card: {
    width: 744,
    height: 1039,
  },
  borders: {
    outer: {
      thickness: 2,
      color: '#4ecdc4',
    },
    inner: {
      thickness: 0.5,
      color: '#404040',
    },
  },
};

/**
 * Minimalist black and white theme for simple, clean printing
 */
export const THEME_MINIMALIST = {
  name: 'minimalist',
  displayName: 'Minimalist',
  colors: {
    background: '#ffffff', // Pure white
    text: '#000000', // Pure black
    header: '#f5f5f5', // Light gray header
    headerText: '#000000', // Black text
    border: '#000000', // Black borders
    sectionLabel: '#333333', // Dark gray
    rule: '#cccccc', // Light gray divider
    stat: '#000000', // Black text
    abilityScore: '#333333', // Dark gray
  },
  fonts: {
    family: 'Georgia, serif',
    fallback: 'serif',
    sizes: {
      title: 16,
      section: 10,
      sectionLabel: 8,
      stat: 9,
      ability: 8,
      note: 7,
    },
    weights: {
      normal: 400,
      bold: 700,
    },
  },
  spacing: {
    padding: 12,
    margin: 6,
    lineHeight: 1.25,
    sectionSpacing: 2,
  },
  card: {
    width: 744,
    height: 1039,
  },
  borders: {
    outer: {
      thickness: 1,
      color: '#000000',
    },
    inner: {
      thickness: 0.5,
      color: '#cccccc',
    },
  },
};

/**
 * Fantasy gold theme with ornate styling
 */
export const THEME_FANTASY_GOLD = {
  name: 'fantasy-gold',
  displayName: 'Fantasy Gold',
  colors: {
    background: '#2a2520', // Dark brown background
    text: '#f5e6d3', // Cream text
    header: '#3d3530', // Darker brown header
    headerText: '#daa520', // Goldenrod
    border: '#daa520', // Gold borders
    sectionLabel: '#daa520', // Gold labels
    rule: '#8b7355', // Brown divider
    stat: '#f5e6d3', // Cream text
    abilityScore: '#daa520', // Gold accents
  },
  fonts: {
    family: 'Georgia, serif',
    fallback: 'serif',
    sizes: {
      title: 19,
      section: 12,
      sectionLabel: 10,
      stat: 10,
      ability: 9,
      note: 8,
    },
    weights: {
      normal: 400,
      bold: 700,
    },
  },
  spacing: {
    padding: 16,
    margin: 8,
    lineHeight: 1.35,
    sectionSpacing: 4,
  },
  card: {
    width: 744,
    height: 1039,
  },
  borders: {
    outer: {
      thickness: 3,
      color: '#daa520',
    },
    inner: {
      thickness: 1,
      color: '#8b7355',
    },
  },
};

/**
 * All available themes
 */
export const THEMES = {
  [THEME_CLASSIC.name]: THEME_CLASSIC,
  [THEME_MODERN_DARK.name]: THEME_MODERN_DARK,
  [THEME_MINIMALIST.name]: THEME_MINIMALIST,
  [THEME_FANTASY_GOLD.name]: THEME_FANTASY_GOLD,
};

/**
 * Get theme by name
 * @param {string} themeName
 * @returns {object} theme object, or THEME_CLASSIC if not found
 */
export function getTheme(themeName = 'classic') {
  return THEMES[themeName] || THEME_CLASSIC;
}

/**
 * Get list of all available theme names and display names
 * @returns {array} [{name, displayName}, ...]
 */
export function getThemeList() {
  return Object.values(THEMES).map(theme => ({
    name: theme.name,
    displayName: theme.displayName,
  }));
}

export default THEME_CLASSIC;
