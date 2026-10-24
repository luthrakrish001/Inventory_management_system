/* =========================================================
   categories.js
   -----------------------------------------------------------
   CRUD Operations for Product Categories.
   All operations read and write directly to MongoDB Atlas
   via Mongoose Category model REST endpoints.
========================================================= */

let _categories = [];

/**
 * Loads all categories directly from MongoDB Atlas Category model.
 */
async function loadCategoriesFromDB() {
  if (typeof CategoryAPI === "undefined") return _categories;
  try {
    const res = await CategoryAPI.getAll();
    if (res && res.data) {
      const cats = res.data.map((c) => (typeof c === "string" ? c : c.name));
      _categories = Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b));
    }
  } catch (err) {
    console.error("Failed to load categories from MongoDB Atlas:", err);
  }
  return _categories;
}

/**
 * Returns currently loaded categories.
 */
function getCategories() {
  return _categories;
}

/**
 * Returns the category list, alphabetically sorted.
 */
function getSortedCategories() {
  return [..._categories].sort((a, b) => a.localeCompare(b));
}

/**
 * Validates a new category name before adding it.
 */
function validateCategoryName(name) {
  const trimmed = (name || "").trim();

  if (trimmed === "") {
    return { isValid: false, error: "Category name is required." };
  }

  const duplicate = _categories.find(
    (category) => category.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { isValid: false, error: "This category already exists." };
  }

  return { isValid: true, error: null };
}

/**
 * CREATE: Adds a new category directly into MongoDB Atlas Category model.
 */
async function addCategory(name) {
  const trimmed = name.trim();
  const res = await CategoryAPI.create(trimmed);

  if (!res || !res.data) {
    throw new Error(res?.error || "Failed to create category in MongoDB Atlas");
  }

  // Refresh directly from MongoDB Atlas
  await loadCategoriesFromDB();
  return _categories;
}

/**
 * DELETE: Removes a category directly from MongoDB Atlas Category model.
 */
async function deleteCategory(name) {
  const res = await CategoryAPI.delete(name);

  if (!res || !res.success) {
    throw new Error(res?.error || "Failed to delete category from MongoDB Atlas");
  }

  // Refresh directly from MongoDB Atlas
  await loadCategoriesFromDB();
  return _categories;
}