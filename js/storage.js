/* =========================================================
   storage.js
   -----------------------------------------------------------
   Only this file talks directly to localStorage.
   Every other file must go through these functions instead
   of calling localStorage.getItem/setItem on its own.
   That way, if we ever change HOW we store data, we only
   edit this one file.
========================================================= */

// Keys we use inside localStorage
const PRODUCTS_KEY = "products";
const SALES_KEY = "sales";
const USERS_KEY = "users";
const CURRENT_USER_KEY = "currentUser";
const CATEGORIES_KEY = "categories";
const REORDERS_KEY = "reorders";

/**
 * Safely reads and JSON.parses one localStorage key.
 * If the key is missing, or holds text that isn't valid JSON
 * (which can happen if someone edits localStorage by hand, or
 * an old/corrupted value is left over), this returns fallback
 * instead of throwing — a single bad key should never crash
 * the whole app.
 */
function safeGet(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Corrupted data in localStorage for key "${key}", resetting it.`, err);
    return fallback;
  }
}

/**
 * Turns a base key (e.g. "products") into one that belongs ONLY
 * to the currently logged-in user (e.g. "products_u_172..."),
 * by appending their account id. This is what keeps every
 * account's products/sales/categories completely separate —
 * without it, every user would share one global list.
 *
 * If nobody is logged in yet (shouldn't normally happen on
 * protected pages, but kept safe just in case), it falls back
 * to the plain, unscoped key.
 */
function getScopedKey(baseKey) {
  const user = getCurrentUser();
  if (user) {
    return `${baseKey}_${user.id}`;
} else {
    return baseKey;
}
}

/**
 * Reads the products array from localStorage — scoped to
 * whichever account is currently logged in.
 */
function getProducts() {
  return safeGet(getScopedKey(PRODUCTS_KEY), []);
}

/**
 * Saves the given products array into localStorage, scoped to
 * the current account. JSON.stringify() converts the array of
 * objects into a string, because localStorage can only hold
 * strings.
 */
function saveProducts(products) {
  localStorage.setItem(getScopedKey(PRODUCTS_KEY), JSON.stringify(products));
}

/**
 * Reads the sales array from localStorage — scoped to whichever
 * account is currently logged in.
 */
function getSales() {
  return safeGet(getScopedKey(SALES_KEY), []);
}

/**
 * Saves the given sales array into localStorage, scoped to the
 * current account.
 */
function saveSales(sales) {
  localStorage.setItem(getScopedKey(SALES_KEY), JSON.stringify(sales));
}

/**
 * Reads all registered user accounts. NOT scoped — this is the
 * master list of every account that can log in, so it has to
 * stay global.
 */
function getUsers() {
  return safeGet(USERS_KEY, []);
}

/**
 * Saves the given users array into localStorage.
 */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Reads the list of product categories the owner has defined —
 * scoped to whichever account is currently logged in, so each
 * store owner manages their own category list.
 */
function getCategories() {
  return safeGet(getScopedKey(CATEGORIES_KEY), []);
}

/**
 * Saves the given categories array into localStorage, scoped to
 * the current account.
 */
function saveCategories(categories) {
  localStorage.setItem(getScopedKey(CATEGORIES_KEY), JSON.stringify(categories));
}

/**
 * Reads the reorder history log — scoped to whichever account is
 * currently logged in. Each entry records a reorder that was
 * placed from the Reorder Alerts page (product, quantity, dealer,
 * unit price, expected delivery, notes, date placed).
 */
function getReorders() {
  return safeGet(getScopedKey(REORDERS_KEY), []);
}

/**
 * Saves the given reorders array into localStorage, scoped to
 * the current account.
 */
function saveReorders(reorders) {
  localStorage.setItem(getScopedKey(REORDERS_KEY), JSON.stringify(reorders));
}

/**
 * Returns the currently logged-in user (without a password field),
 * or null if nobody is logged in. This is how every page checks
 * "is someone logged in right now?".
 */
function getCurrentUser() {
  return safeGet(CURRENT_USER_KEY, null);
}

/**
 * Marks a user as the active session by saving them under
 * CURRENT_USER_KEY. Called right after a successful login.
 */
function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

/**
 * Clears the active session. Called on logout.
 */
function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
