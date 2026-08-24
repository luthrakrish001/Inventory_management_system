/* =========================================================
   utils.js
   -----------------------------------------------------------
   Small, generic helper functions that don't belong to any
   single feature (products/sales/forecast). Kept here so we
   are not repeating the same logic in multiple files.
========================================================= */

/**
 * Generates a short, reasonably unique ID.
 * We combine the current timestamp with a random string so two
 * IDs created in the same millisecond still don't collide.
 * (Good enough for a client-only demo app — a real backend
 * would use a database-generated ID instead.)
 */
function generateId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

/**
 * Returns today's date as a "YYYY-MM-DD" string,
 * which is exactly the format the <input type="date"> expects.
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a random whole number between min and max, inclusive.
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Adds the given number of days to a "YYYY-MM-DD" date string and
 * returns the result in the same format.
 */
function addDaysToDate(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a "YYYY-MM-DD" date string for display, e.g. "24 Aug 2026".
 */
function formatDateForDisplay(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Shows a small toast message at the bottom of the screen.
 * type can be "success", "error" or left blank for neutral.
 */
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast"; // reset classes first
  if (type) toast.classList.add(`toast-${type}`);
  toast.classList.remove("hidden");

  // Hide it again automatically after 2.5 seconds
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/**
 * Returns the initials of a product name (e.g. "Wireless Mouse" -> "WM").
 * Used as a placeholder avatar when no photo was uploaded.
 */
function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * Reads a File object (from an <input type="file">) and converts
 * it into a base64 Data URL string using the FileReader API.
 * We store this base64 string directly inside the product object,
 * since localStorage can only hold text — there is no separate
 * file system available to us on the client side.
 * Returns a Promise so app.js can simply `await` the result.
 */
function readImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
