/**
 * theme.js — Theme management (light/dark toggle with localStorage persistence)
 */

const Theme = (() => {
  const STORAGE_KEY = 'skilllens-theme';
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');

  function get() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  function set(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function flip() {
    const current = html.getAttribute('data-theme');
    set(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    set(get());
    if (toggle) {
      toggle.addEventListener('click', flip);
    }
  }

  return { init, get, set, flip };
})();

// Initialize on load
Theme.init();
