/**
 * Card Theme System
 *
 * Consolidated theme management for card rendering.
 * Replaces card-styles.js with a more modular, CSS-first approach.
 *
 * Each theme is a collection of CSS custom properties that can be applied
 * to cards for consistent visual styling.
 */

/**
 * Theme definitions
 * Each theme includes color palette, typography, spacing, and sizing
 */
const THEMES = {
  'classic-parchment': {
    name: 'classic-parchment',
    label: 'Classic Parchment',
    description: 'Traditional D&D aesthetic with gold accents',
    colors: {
      bg: '#fdf6e3',
      text: '#1a1208',
      border: '#b8963c',
      accent: '#f5e6c0',
      rule: '#c9a84c',
      sectionBg: '#faf5e8',
      headerBg: '#eee3cd',
    },
    fonts: {
      family: 'Georgia, \'Times New Roman\', serif',
      serif: true,
    },
    spacing: {
      padding: '14px',
      margin: '6px',
      lineHeight: '1.35',
      sectionGap: '8px',
    },
    sizes: {
      title: '18px',
      stat: '10px',
      label: '9px',
      body: '10px',
    },
    borders: {
      width: '1px',
      style: 'solid',
      radius: '2px',
    },
  },

  'modern-dark': {
    name: 'modern-dark',
    label: 'Modern Dark',
    description: 'Modern dark theme with teal accents and high contrast',
    colors: {
      bg: '#1e1e1e',
      text: '#e8e8e8',
      border: '#4db8c4',
      accent: '#2a5a63',
      rule: '#4db8c4',
      sectionBg: '#2a2a2a',
      headerBg: '#3a3a3a',
    },
    fonts: {
      family: 'Helvetica, Arial, sans-serif',
      serif: false,
    },
    spacing: {
      padding: '14px',
      margin: '6px',
      lineHeight: '1.4',
      sectionGap: '8px',
    },
    sizes: {
      title: '18px',
      stat: '10px',
      label: '9px',
      body: '10px',
    },
    borders: {
      width: '2px',
      style: 'solid',
      radius: '4px',
    },
  },

  'minimalist': {
    name: 'minimalist',
    label: 'Minimalist',
    description: 'Simple black and white for clean printing',
    colors: {
      bg: '#ffffff',
      text: '#000000',
      border: '#000000',
      accent: '#f0f0f0',
      rule: '#333333',
      sectionBg: '#f9f9f9',
      headerBg: '#f5f5f5',
    },
    fonts: {
      family: 'Helvetica, Arial, sans-serif',
      serif: false,
    },
    spacing: {
      padding: '12px',
      margin: '5px',
      lineHeight: '1.3',
      sectionGap: '6px',
    },
    sizes: {
      title: '16px',
      stat: '9px',
      label: '8px',
      body: '9px',
    },
    borders: {
      width: '1px',
      style: 'solid',
      radius: '0px',
    },
  },

  'fantasy-gold': {
    name: 'fantasy-gold',
    label: 'Fantasy Gold',
    description: 'Ornate fantasy gold with dark brown background',
    colors: {
      bg: '#3d2817',
      text: '#f5e6d3',
      border: '#d4af37',
      accent: '#6b5d47',
      rule: '#d4af37',
      sectionBg: '#4a3a26',
      headerBg: '#5a4a36',
    },
    fonts: {
      family: 'Georgia, \'Times New Roman\', serif',
      serif: true,
    },
    spacing: {
      padding: '14px',
      margin: '6px',
      lineHeight: '1.35',
      sectionGap: '8px',
    },
    sizes: {
      title: '18px',
      stat: '10px',
      label: '9px',
      body: '10px',
    },
    borders: {
      width: '2px',
      style: 'double',
      radius: '2px',
    },
  },
};

/**
 * CardTheme class
 * Encapsulates theme definition and provides methods for rendering
 */
export class CardTheme {
  constructor(themeName = 'classic-parchment') {
    const themeData = THEMES[themeName] || THEMES['classic-parchment'];
    this.name = themeData.name;
    this.label = themeData.label;
    this.description = themeData.description;
    this.colors = { ...themeData.colors };
    this.fonts = { ...themeData.fonts };
    this.spacing = { ...themeData.spacing };
    this.sizes = { ...themeData.sizes };
    this.borders = { ...themeData.borders };
  }

  /**
   * Get CSS custom properties block for inline styling
   * Returns a string of CSS variable definitions
   *
   * @returns {string} CSS custom properties
   */
  toCSSVariables() {
    return `
      --card-bg: ${this.colors.bg};
      --card-text: ${this.colors.text};
      --card-border: ${this.colors.border};
      --card-accent: ${this.colors.accent};
      --card-rule: ${this.colors.rule};
      --card-section-bg: ${this.colors.sectionBg};
      --card-header-bg: ${this.colors.headerBg};

      --card-font-family: ${this.fonts.family};
      --card-padding: ${this.spacing.padding};
      --card-margin: ${this.spacing.margin};
      --card-line-height: ${this.spacing.lineHeight};
      --card-section-gap: ${this.spacing.sectionGap};

      --card-title-size: ${this.sizes.title};
      --card-stat-size: ${this.sizes.stat};
      --card-label-size: ${this.sizes.label};
      --card-body-size: ${this.sizes.body};

      --card-border-width: ${this.borders.width};
      --card-border-style: ${this.borders.style};
      --card-border-radius: ${this.borders.radius};
    `;
  }

  /**
   * Get CSS variables as a raw object (for inline styles)
   *
   * @returns {Object} CSS variable mapping
   */
  toCSSVariablesObject() {
    return {
      '--card-bg': this.colors.bg,
      '--card-text': this.colors.text,
      '--card-border': this.colors.border,
      '--card-accent': this.colors.accent,
      '--card-rule': this.colors.rule,
      '--card-section-bg': this.colors.sectionBg,
      '--card-header-bg': this.colors.headerBg,
      '--card-font-family': this.fonts.family,
      '--card-padding': this.spacing.padding,
      '--card-margin': this.spacing.margin,
      '--card-line-height': this.spacing.lineHeight,
      '--card-section-gap': this.spacing.sectionGap,
      '--card-title-size': this.sizes.title,
      '--card-stat-size': this.sizes.stat,
      '--card-label-size': this.sizes.label,
      '--card-body-size': this.sizes.body,
      '--card-border-width': this.borders.width,
      '--card-border-style': this.borders.style,
      '--card-border-radius': this.borders.radius,
    };
  }

  /**
   * Get a canvas-compatible color/font object (for canvas rendering fallback)
   *
   * @returns {Object} Canvas-compatible theme object
   */
  toCanvasTheme() {
    return {
      bgColor: this.colors.bg,
      textColor: this.colors.text,
      borderColor: this.colors.border,
      accentColor: this.colors.accent,
      fontFamily: this.fonts.family,
      fontSize: parseInt(this.sizes.stat),
      lineHeight: parseFloat(this.spacing.lineHeight),
    };
  }
}

/**
 * Get a theme by name
 *
 * @param {string} themeName - Theme name
 * @returns {CardTheme} Theme instance
 */
export function getTheme(themeName) {
  return new CardTheme(themeName);
}

/**
 * Get all available theme names
 *
 * @returns {string[]} Array of theme names
 */
export function getThemeNames() {
  return Object.keys(THEMES);
}

/**
 * Get all theme definitions with metadata
 *
 * @returns {Array} Array of theme objects with label and description
 */
export function getAllThemes() {
  return Object.values(THEMES).map(theme => ({
    name: theme.name,
    label: theme.label,
    description: theme.description,
  }));
}

/**
 * Check if a theme exists
 *
 * @param {string} themeName - Theme name to check
 * @returns {boolean} True if theme exists
 */
export function themeExists(themeName) {
  return themeName in THEMES;
}

/**
 * Create custom theme by merging with an existing theme
 *
 * @param {string} baseName - Base theme name
 * @param {Object} overrides - Properties to override
 * @returns {CardTheme} Custom theme
 */
export function createCustomTheme(baseName, overrides = {}) {
  const baseTheme = new CardTheme(baseName);

  // Merge overrides
  if (overrides.colors) {
    baseTheme.colors = { ...baseTheme.colors, ...overrides.colors };
  }
  if (overrides.spacing) {
    baseTheme.spacing = { ...baseTheme.spacing, ...overrides.spacing };
  }
  if (overrides.sizes) {
    baseTheme.sizes = { ...baseTheme.sizes, ...overrides.sizes };
  }

  return baseTheme;
}

/**
 * Get contrast color (for text on background)
 * Simple algorithm: if background is light, use dark text; otherwise use light text
 *
 * @param {string} bgColor - Background color (hex)
 * @returns {string} Recommended text color (light or dark)
 */
export function getContrastColor(bgColor) {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}
