/**
 * Fetches and parses Archive of Nethys spell pages
 */

import { FETCH_TIMEOUT_MS, CORS_PROXY } from '../constants/aon-config.js';

/**
 * Fetches HTML from an Archive of Nethys URL
 * @param {string} url - The AoN spell URL
 * @returns {Promise<string>} The HTML content
 * @throws {Error} If fetch fails
 */
export async function fetchSpellHTML(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const proxiedUrl = CORS_PROXY + url;
    const response = await fetch(proxiedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    return html;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server may be unavailable.');
    }
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        'Unable to access this URL. Archive of Nethys may block this request.'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parses HTML from Archive of Nethys and extracts spell data
 * @param {string} htmlString - The HTML content to parse
 * @returns {Promise<Object>} Parsed spell data with AoN field names
 */
export async function parseSpellHTML(htmlString) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Check for parsing errors
    if (doc.documentElement.tagName === 'parsererror') {
      throw new Error('Failed to parse HTML');
    }

    const spellData = {
      name: '',
      level: '',
      school: '',
      castingTime: '',
      range: '',
      duration: '',
      components: '',
      savingThrow: '',
      spellResistance: '',
      description: '',
      rawText: '',
    };

    // Extract spell name from h1 or h3 title
    const titleElement =
      doc.querySelector('h1.title') ||
      doc.querySelector('h1') ||
      doc.querySelector('h3');
    if (titleElement) {
      spellData.name = titleElement.textContent.trim();
    }

    // Extract metadata from definition list (dl/dt/dd pattern)
    const definitionList = doc.querySelector('dl');
    if (definitionList) {
      const dts = definitionList.querySelectorAll('dt');
      const dds = definitionList.querySelectorAll('dd');

      for (let i = 0; i < dts.length; i++) {
        const dt = dts[i].textContent.trim().toLowerCase();
        const dd = dds[i] ? dds[i].textContent.trim() : '';

        if (dt.includes('level')) {
          spellData.level = dd;
        } else if (dt.includes('school')) {
          spellData.school = dd;
        } else if (dt.includes('casting time')) {
          spellData.castingTime = dd;
        } else if (dt.includes('range')) {
          spellData.range = dd;
        } else if (dt.includes('duration')) {
          spellData.duration = dd;
        } else if (dt.includes('component')) {
          spellData.components = dd;
        } else if (dt.includes('saving throw')) {
          spellData.savingThrow = dd;
        } else if (dt.includes('spell resistance')) {
          spellData.spellResistance = dd;
        }
      }
    }

    // Extract description/full text - only content after "Description" heading
    const bodyText = doc.body.textContent;
    const descriptionIndex = bodyText.toLowerCase().indexOf('description');

    if (descriptionIndex !== -1) {
      // Get everything after the "Description" word/heading
      let descriptionText = bodyText.substring(descriptionIndex + 'description'.length);

      // Remove common section headers that may follow
      // to avoid including content from other sections
      const nextSectionMatch = descriptionText.match(/(?:See Also|External Links|References|Special|Revisions|Advanced)/i);
      if (nextSectionMatch) {
        descriptionText = descriptionText.substring(0, nextSectionMatch.index);
      }

      // Clean up and format
      spellData.description = descriptionText
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
    }

    // Store raw text content for fallback extraction
    spellData.rawText = doc.body.textContent;

    return spellData;
  } catch (error) {
    throw new Error(`Failed to parse spell data: ${error.message}`);
  }
}

/**
 * Extracts text content safely from a DOM element selector
 * @param {Document} doc - The parsed document
 * @param {string} selector - CSS selector
 * @returns {string} The extracted text content, trimmed
 */
export function extractTextFromSelector(doc, selector) {
  try {
    const element = doc.querySelector(selector);
    return element ? element.textContent.trim() : '';
  } catch (e) {
    return '';
  }
}

/**
 * Attempts fallback extraction of spell data using regex patterns
 * Useful if DOM parsing yields incomplete results
 * @param {string} text - The raw text content
 * @returns {Object} Partially extracted spell data
 */
export function extractSpellDataFromText(text) {
  const data = {
    level: '',
    school: '',
    castingTime: '',
    range: '',
    duration: '',
    components: '',
    savingThrow: '',
    spellResistance: '',
  };

  // Extract level (Pattern: "Level X" or "Cantrip")
  const levelMatch = text.match(/Level\s*(\d+)|Cantrip/i);
  if (levelMatch) {
    data.level = levelMatch[0];
  }

  // Extract school (Pattern: "School: Evocation" or similar)
  const schoolMatch = text.match(/School[^A-Z]*?:\s*([A-Za-z]+)/i);
  if (schoolMatch) {
    data.school = schoolMatch[1];
  }

  // Extract casting time
  const castingMatch = text.match(
    /Casting Time[^A-Z]*?:\s*([^\n]+?)(?=\n|Range)/i
  );
  if (castingMatch) {
    data.castingTime = castingMatch[1].trim();
  }

  // Extract range
  const rangeMatch = text.match(/Range[^A-Z]*?:\s*([^\n]+?)(?=\n|Duration)/i);
  if (rangeMatch) {
    data.range = rangeMatch[1].trim();
  }

  // Extract duration
  const durationMatch = text.match(
    /Duration[^A-Z]*?:\s*([^\n]+?)(?=\n|Components)/i
  );
  if (durationMatch) {
    data.duration = durationMatch[1].trim();
  }

  // Extract components
  const componentMatch = text.match(
    /Components[^A-Z]*?:\s*([^\n]+?)(?=\n|Saving)/i
  );
  if (componentMatch) {
    data.components = componentMatch[1].trim();
  }

  // Extract saving throw
  const saveMatch = text.match(/Saving Throw[^A-Z]*?:\s*([^\n]+?)(?=\n|SR)/i);
  if (saveMatch) {
    data.savingThrow = saveMatch[1].trim();
  }

  // Extract spell resistance
  const srMatch = text.match(/Spell Resistance[^A-Z]*?:\s*([^\n]+?)(?=\n|Description)/i);
  if (srMatch) {
    data.spellResistance = srMatch[1].trim();
  }

  return data;
}
