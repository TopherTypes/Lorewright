// App shell — renders the persistent navigation bar and the view container.
// Called once at startup before the router starts. All views render into
// the #view-root element returned by getViewRoot().

/**
 * Renders the nav bar and main content wrapper into the #app element.
 * Must be called before any routes are dispatched.
 */
export function renderShell() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <nav class="nav-bar">
      <a class="nav-brand" href="#/">Lorewright</a>
      <ul class="nav-links">
        <li><a href="#/" data-nav="bestiary">Bestiary</a></li>
        <li><a href="#/items" data-nav="items">Items</a></li>
        <li><a href="#/settings" data-nav="settings">Settings</a></li>
      </ul>
    </nav>
    <main id="view-root" class="view-root"></main>
  `;

  // Highlight the active nav link on hash changes
  updateNavHighlight();
  window.addEventListener('hashchange', updateNavHighlight);
}

/**
 * Returns the view container element.
 * All route handlers render their content into this element.
 * @returns {HTMLElement}
 */
export function getViewRoot() {
  return document.getElementById('view-root');
}

/**
 * Adds the 'active' class to the nav link that matches the current hash.
 */
function updateNavHighlight() {
  const hash = window.location.hash || '#/';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    const isActive = hash === href || (href !== '#/' && hash.startsWith(href));
    link.classList.toggle('active', isActive);
  });
}
