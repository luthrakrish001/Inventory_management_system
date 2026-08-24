/* =========================================================
   categories.js
   -----------------------------------------------------------
   Business logic for product CATEGORIES. The store owner
   defines categories here (via the "Manage Categories" modal)
   instead of typing a free-text category on every product —
   product.js then requires each product's category to be
   picked from this list. No DOM access lives here, same
   pattern as product.js / sales.js.
========================================================= */

/**
 * Validates a new category name before adding it.
 * Checks: not empty, and not a duplicate of an existing
 * category (case-insensitive, so "electronics" and
 * "Electronics" can't both exist).
 */
function validateCategoryName(name) {
  const trimmed = (name || "").trim();

  if (trimmed === "") {
    return { isValid: false, error: "Category name is required." };
  }

  const duplicate = getCategories().find(
    (category) => category.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { isValid: false, error: "This category already exists." };
  }

  return { isValid: true, error: null };
}

/**
 * Adds a new category (name should already be validated) and
 * returns the updated, alphabetically-sorted list.
 */
function addCategory(name) {
  const categories = getCategories();
  const updated = [...categories, name.trim()];
  updated.sort((a, b) => a.localeCompare(b));
  saveCategories(updated);
  return updated;
}

/**
 * Removes a category from the master list. Products that were
 * already assigned this category KEEP their existing value —
 * deleting a category only stops it from being offered for new
 * selections, it doesn't silently rewrite past product data.
 */
function deleteCategory(name) {
  const updated = getCategories().filter((category) => category !== name);
  saveCategories(updated);
  return updated;
}

/**
 * Returns the category list, alphabetically sorted — used
 * everywhere a dropdown needs to display categories in a
 * predictable order.
 */
function getSortedCategories() {
  return [...getCategories()].sort((a, b) => a.localeCompare(b));
}
