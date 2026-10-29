
let _categories = [];


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


function getCategories() {
  return _categories;
}


function getSortedCategories() {
  return [..._categories].sort((a, b) => a.localeCompare(b));
}


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


async function addCategory(name) {
  const trimmed = name.trim();
  const res = await CategoryAPI.create(trimmed);

  if (!res || !res.data) {
    throw new Error(res?.error || "Failed to create category in MongoDB Atlas");
  }

  await loadCategoriesFromDB();
  return _categories;
}

async function deleteCategory(name) {
  const res = await CategoryAPI.delete(name);

  if (!res || !res.success) {
    throw new Error(res?.error || "Failed to delete category from MongoDB Atlas");
  }

  await loadCategoriesFromDB();
  return _categories;
}
