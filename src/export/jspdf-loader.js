/**
 * jsPDF Loader with Fallback
 * Attempts to load jsPDF as ES module with fallback to window.jsPDF
 * This handles both Vite-bundled and UMD-script scenarios
 */

let jsPDFInstance = null;
let jsPDFPromise = null;

/**
 * Get jsPDF constructor
 * Attempts ES module import first, falls back to window.jsPDF
 * @returns {Promise<function>} jsPDF constructor
 * @throws {Error} If jsPDF cannot be loaded
 */
export async function getjsPDF() {
  // Return cached instance if already loaded
  if (jsPDFInstance) {
    return jsPDFInstance;
  }

  // Return pending promise if already in progress
  if (jsPDFPromise) {
    return jsPDFPromise;
  }

  // Create promise for loading jsPDF
  jsPDFPromise = (async () => {
    try {
      // Try ES module import first (works with Vite bundling)
      const module = await import('jspdf');
      jsPDFInstance = module.jsPDF;
      return jsPDFInstance;
    } catch (importError) {
      // Fallback: Try window.jsPDF (UMD script approach)
      return waitForjsPDF(5000); // 5 second timeout
    }
  })();

  try {
    return await jsPDFPromise;
  } catch (error) {
    // Clear promise on error so next call will retry
    jsPDFPromise = null;
    throw error;
  }
}

/**
 * Wait for jsPDF to be available on window
 * @param {number} timeout - Maximum wait time in milliseconds
 * @returns {Promise<function>} jsPDF constructor
 * @throws {Error} If timeout exceeded or jsPDF not found
 */
function waitForjsPDF(timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 50; // Check every 50ms

    const check = () => {
      // Try both possible locations where jsPDF might be
      const jsPDF = window.jsPDF?.jsPDF || window.jsPDF;

      if (jsPDF) {
        jsPDFInstance = jsPDF;
        resolve(jsPDF);
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        reject(
          new Error(
            `jsPDF failed to load after ${timeout}ms. ` +
            'Make sure jsPDF library is properly loaded in your HTML.'
          )
        );
        return;
      }

      // Check again after interval
      setTimeout(check, checkInterval);
    };

    check();
  });
}
