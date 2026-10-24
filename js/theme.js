/* =========================================================
   theme.js
   -----------------------------------------------------------
   Site-wide Dark / Light theme toggle. Loaded FIRST, at the
   very top of <head>, on EVERY page (landing, login, signup,
   dashboard) — so the saved theme is applied immediately,
   before the page paints, avoiding a flash of the wrong theme.

   How it works: all colors across style.css are defined as CSS
   custom properties on :root. This file just sets a
   data-theme="dark" (or "light") attribute on <html>, and
   style.css has a matching [data-theme="dark"] block that
   overrides those same variables. Because EVERY component
   already reads color from var(--bg), var(--text), etc., one
   attribute change re-themes the entire site — no per-page or
   per-component work needed.

   The chosen theme is saved in sessionStorage under "theme" and
   is a device/browser-level preference, not inventory data.
========================================================= */

const THEME_KEY = "theme";

function getSavedTheme() {
  try {
    return sessionStorage.getItem(THEME_KEY) || "light";
  } catch (e) {
    return "light";
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme) {
  try {
    sessionStorage.setItem(THEME_KEY, theme);
    localStorage.removeItem(THEME_KEY);
  } catch (e) {}
  applyTheme(theme);
  updateThemeToggleIcon(theme);
}

function toggleTheme() {
  const next = getSavedTheme() === "dark" ? "light" : "dark";
  setTheme(next);
}

// Apply immediately — this runs synchronously while <head> is
// still being parsed, well before <body> renders.
applyTheme(getSavedTheme());

/**
 * Swaps the toggle button's icon/label to reflect the CURRENT
 * theme (i.e. shows what you'd switch TO, which is the usual
 * convention for these toggles — a moon while in light mode,
 * a sun while in dark mode).
 */

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  btn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}
// Wire up whichever theme toggle button exists on this page
// (every page has at most one, with id="themeToggleBtn").
document.addEventListener("DOMContentLoaded", () => {
  updateThemeToggleIcon(getSavedTheme());
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.addEventListener("click", toggleTheme);
});