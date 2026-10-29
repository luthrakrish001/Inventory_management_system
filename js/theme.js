
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

applyTheme(getSavedTheme());


function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  btn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}
document.addEventListener("DOMContentLoaded", () => {
  updateThemeToggleIcon(getSavedTheme());
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.addEventListener("click", toggleTheme);
});
