// Minimal hash-based client-side router.
// Routes are registered with addRoute() and the router dispatches on hashchange.
// Supports :param segments in route patterns (e.g. '#/creature/:id').
//
// Important: register more-specific routes before general ones.
// e.g. '#/creature/new' must come before '#/creature/:id' so "new" is
// not treated as an ID value.

const routes = [];

/**
 * Registers a route pattern and its handler function.
 * @param {string} pattern  Hash pattern, e.g. '#/creature/:id'
 * @param {function} handler  Called with a params object when the route matches
 */
export function addRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

/**
 * Programmatically navigates to a hash route.
 * @param {string} hash  e.g. '#/creature/new'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Attempts to match the given hash against all registered route patterns.
 * Returns the first match with extracted params, or null.
 * @param {string} hash  Current window.location.hash
 * @returns {{ handler: function, params: object }|null}
 */
function matchRoute(hash) {
  // Normalise: strip leading '#', ensure leading '/'
  const path = hash.replace(/^#/, '') || '/';
  const pathSegments = path.split('/').filter((_, i) => i > 0 || path !== '/');

  for (const route of routes) {
    const patternPath = route.pattern.replace(/^#/, '');
    const patternSegments = patternPath.split('/').filter((_, i) => i > 0 || patternPath !== '/');

    if (patternSegments.length !== pathSegments.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < patternSegments.length; i++) {
      const patternSeg = patternSegments[i];
      const pathSeg    = pathSegments[i];

      if (patternSeg.startsWith(':')) {
        // Dynamic segment — capture the value
        params[patternSeg.slice(1)] = decodeURIComponent(pathSeg);
      } else if (patternSeg !== pathSeg) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { handler: route.handler, params };
    }
  }

  return null;
}

/**
 * Dispatches the current hash to the matching route handler.
 * Falls back to '#/' if no route matches.
 */
function dispatch() {
  const hash = window.location.hash || '#/';
  const match = matchRoute(hash);

  if (match) {
    match.handler(match.params);
  } else {
    // Unknown route — redirect to home
    navigate('#/');
  }
}

/**
 * Starts the router. Call once after all routes are registered.
 * Handles both the initial page load and subsequent hash changes.
 */
export function startRouter() {
  window.addEventListener('hashchange', dispatch);
  // Handle the current URL on initial load
  dispatch();
}
