/* =========================================================
   app.js
   -----------------------------------------------------------
   The "conductor" of the whole app. This file:
     - Runs once when the page loads (init)
     - Listens for every click / submit / input event
     - Decides WHEN to call product.js / sales.js / forecast.js
     - Tells ui.js to re-render after anything changes
   No calculation logic and no direct localStorage access lives
   here — this file only coordinates the other files.
========================================================= */

// Tracks whether the product modal is currently in "add" or "edit"
// mode, and which product is being edited (null = adding new).
let editingProductId = null;

// Holds the base64 image string picked in the product modal,
// before the form is actually submitted.
let selectedImageData = null;

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  renderLoggedInUser();
  populateCategoryFilterDropdown();
  document.getElementById("dailySalesDate").value = getTodayDate();
  renderDashboard();
  attachEventListeners();
}

/**
 * Displays the current user's name/email in the sidebar.
 * requireAuth() (called in dashboard.html's <head>) already guarantees
 * someone is logged in by the time this runs, but we guard anyway
 * in case this file is ever reused on a page without that check.
 */
function renderLoggedInUser() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById("topbarUserName").textContent = user.name;
  document.getElementById("topbarUserEmail").textContent = user.email;
  document.getElementById("topbarAvatar").textContent = getInitials(user.name);
}

function attachEventListeners() {
  // ---------- Sidebar nav ----------
  // "Record Sale" just opens the modal — it doesn't switch pages,
  // so the currently active view/highlight is left untouched.
  // Dashboard / Sold Products / Reorder Alerts each swap which
  // <div> is visible via switchDashboardView() in ui.js.
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = e.currentTarget.dataset.section;

      if (section === "sales") {
        openSaleModal();
        return;
      }

      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
      e.currentTarget.classList.add("active");
      switchDashboardView(section);
    });
  });

  // ---------- Search / Filter / Sort ----------
  document.getElementById("searchInput").addEventListener("input", renderDashboard);
  document.getElementById("filterStatus").addEventListener("change", renderDashboard);
  document.getElementById("categoryFilter").addEventListener("change", renderDashboard);
  document.getElementById("sortBy").addEventListener("change", renderDashboard);
  document.getElementById("dailySalesDate").addEventListener("change", renderDailySalesView);

  // ---------- Categories (manage modal) ----------
  document.getElementById("manageCategoriesBtn").addEventListener("click", openCategoriesModal);
  document.getElementById("manageCategoriesFromProductBtn").addEventListener("click", openCategoriesModal);
  document.getElementById("closeCategoriesModal").addEventListener("click", closeCategoriesModal);
  document.getElementById("categoryForm").addEventListener("submit", handleCategoryFormSubmit);
  document.getElementById("categoriesList").addEventListener("click", handleCategoryListClick);

  // ---------- Logout ----------
  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Log out of InventoryPilot?")) {
      logoutUser();
    }
  });

  // ---------- Add Product modal open/close ----------
  document.getElementById("openAddProductBtn").addEventListener("click", openAddProductModal);
  document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
  document.getElementById("cancelProductBtn").addEventListener("click", closeProductModal);

  // ---------- Photo upload ----------
  document.getElementById("photoUploadBox").addEventListener("click", () => {
    document.getElementById("productImage").click();
  });
  document.getElementById("productImage").addEventListener("change", handleImageSelect);

  // ---------- Product form submit (handles both Add and Edit) ----------
  document.getElementById("productForm").addEventListener("submit", handleProductFormSubmit);

  // ---------- Record Sale modal open/close ----------
  document.getElementById("closeSaleModal").addEventListener("click", closeSaleModal);
  document.getElementById("cancelSaleBtn").addEventListener("click", closeSaleModal);

  // ---------- Sale form submit ----------
  document.getElementById("saleForm").addEventListener("submit", handleSaleFormSubmit);

  // ---------- Reorder modal open/close ----------
  document.getElementById("closeReorderModal").addEventListener("click", closeReorderModal);
  document.getElementById("cancelReorderBtn").addEventListener("click", closeReorderModal);

  // ---------- Reorder form submit ----------
  document.getElementById("reorderForm").addEventListener("submit", handleReorderFormSubmit);

  // Recalculate the total bill live as the owner adjusts quantity
  // (unit price itself is fixed, so quantity is the only input to it).
  document.getElementById("reorderQuantity").addEventListener("input", updateReorderTotalBill);

  // ---------- Edit / Delete buttons (event delegation) ----------
  // Shared by BOTH the main Inventory table (Dashboard view) and
  // the Reorder Alerts table — rows are re-created every render,
  // so delegation means we never have to re-attach listeners after
  // each re-render, on either table.
  document.getElementById("productsTableBody").addEventListener("click", handleProductRowActionClick);
  document.getElementById("reorderTableBody").addEventListener("click", handleProductRowActionClick);
}

function handleProductRowActionClick(e) {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const productId = button.dataset.id;
  if (button.dataset.action === "edit") {
    openEditProductModal(productId);
  } else if (button.dataset.action === "delete") {
    handleDeleteProduct(productId);
  } else if (button.dataset.action === "reorder") {
    openReorderModal(productId);
  }
}

/* =========================================================
   PRODUCT MODAL — ADD / EDIT
========================================================= */

function openAddProductModal() {
  editingProductId = null;
  selectedImageData = null;
  document.getElementById("productModalTitle").textContent = "Add Product";
  document.getElementById("saveProductBtn").textContent = "Save Product";
  clearProductForm();
  populateProductCategorySelect("");
  document.getElementById("productModal").classList.remove("hidden");
}

function openEditProductModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  editingProductId = productId;
  selectedImageData = null; // null = "no new image chosen", keep existing one

  document.getElementById("productModalTitle").textContent = "Edit Product";
  document.getElementById("saveProductBtn").textContent = "Update Product";

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  populateProductCategorySelect(product.category);
  document.getElementById("productCP").value = product.costPrice;
  document.getElementById("productSP").value = product.sellingPrice;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productLeadTime").value = product.leadTime;
  document.getElementById("productSafetyStock").value = product.safetyStock;

  // Show existing photo preview, if any
  const preview = document.getElementById("photoPreview");
  const placeholder = document.getElementById("photoPlaceholder");
  if (product.image) {
    preview.src = product.image;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } else {
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }

  clearProductFormErrors();
  document.getElementById("productModal").classList.remove("hidden");
}

function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

function clearProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("photoPreview").classList.add("hidden");
  document.getElementById("photoPlaceholder").classList.remove("hidden");
  clearProductFormErrors();
}

function clearProductFormErrors() {
  document.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".form-group input, .form-group select").forEach((el) => el.classList.remove("input-error"));
}

/**
 * Reads the chosen file, converts it to base64 (utils.js),
 * and shows a live preview inside the upload box.
 */
async function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const base64 = await readImageAsBase64(file);
    selectedImageData = base64;

    const preview = document.getElementById("photoPreview");
    const placeholder = document.getElementById("photoPlaceholder");
    preview.src = base64;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } catch (err) {
    showToast("Could not read that image. Try a different file.", "error");
  }
}

/**
 * Handles submit for BOTH add and edit, since they share one form.
 * We branch on `editingProductId` to decide which product.js
 * function to call.
 */
function handleProductFormSubmit(e) {
  e.preventDefault();

  const values = {
    name: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    costPrice: document.getElementById("productCP").value,
    sellingPrice: document.getElementById("productSP").value,
    stock: document.getElementById("productStock").value,
    leadTime: document.getElementById("productLeadTime").value,
    safetyStock: document.getElementById("productSafetyStock").value,
  };

  const { isValid, errors } = validateProduct(values, editingProductId);

  clearProductFormErrors();

  if (!isValid) {
    displayProductErrors(errors);
    return;
  }

  if (editingProductId) {
    updateProduct(editingProductId, values, selectedImageData);
    showToast("Product updated successfully.", "success");
  } else {
    addProduct(values, selectedImageData);
    showToast("Product added successfully.", "success");
  }

  closeProductModal();
  renderDashboard();
}

/**
 * Maps each validation error onto its matching <span class="error-text">
 * and highlights the offending input field.
 */
function displayProductErrors(errors) {
  const fieldMap = {
    name: "productName",
    category: "productCategory",
    costPrice: "productCP",
    sellingPrice: "productSP",
    stock: "productStock",
    leadTime: "productLeadTime",
    safetyStock: "productSafetyStock",
  };

  Object.keys(errors).forEach((key) => {
    const inputId = fieldMap[key];
    const errorSpan = document.getElementById(`err-${inputId}`);
    const input = document.getElementById(inputId);
    if (errorSpan) errorSpan.textContent = errors[key];
    if (input) input.classList.add("input-error");
  });
}

function handleDeleteProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const confirmed = confirm(`Delete "${product.name}"? This will also remove its sales history.`);
  if (!confirmed) return;

  deleteProduct(productId);
  showToast("Product deleted.", "success");
  renderDashboard();
}

/* =========================================================
   SALE MODAL
========================================================= */

function openSaleModal() {
  populateSaleProductDropdown();
  document.getElementById("saleForm").reset();
  document.getElementById("saleDate").value = getTodayDate();
  document.querySelectorAll("#saleForm .error-text").forEach((el) => (el.textContent = ""));
  document.getElementById("saleModal").classList.remove("hidden");
}

function closeSaleModal() {
  document.getElementById("saleModal").classList.add("hidden");
}

function handleSaleFormSubmit(e) {
  e.preventDefault();

  const values = {
    productId: document.getElementById("saleProduct").value,
    quantity: document.getElementById("saleQuantity").value,
    date: document.getElementById("saleDate").value,
  };

  const { isValid, errors } = validateSale(values);

  document.getElementById("err-saleProduct").textContent = "";
  document.getElementById("err-saleQuantity").textContent = "";

  if (!isValid) {
    if (errors.productId) document.getElementById("err-saleProduct").textContent = errors.productId;
    if (errors.quantity) document.getElementById("err-saleQuantity").textContent = errors.quantity;
    return;
  }

  recordSale(values);
  showToast("Sale recorded — stock updated.", "success");
  closeSaleModal();
  renderDashboard();
}

/* =========================================================
   MANAGE CATEGORIES MODAL
========================================================= */

function openCategoriesModal() {
  renderCategoriesList();
  document.getElementById("categoryForm").reset();
  document.getElementById("err-newCategoryName").textContent = "";
  document.getElementById("categoriesModal").classList.remove("hidden");
}

function closeCategoriesModal() {
  document.getElementById("categoriesModal").classList.add("hidden");

  // Refresh dropdowns elsewhere in case categories were
  // added/deleted while this modal was open.
  populateCategoryFilterDropdown();
  if (!document.getElementById("productModal").classList.contains("hidden")) {
    populateProductCategorySelect(document.getElementById("productCategory").value);
  }
  renderDashboard();
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const input = document.getElementById("newCategoryName");
  const errorSpan = document.getElementById("err-newCategoryName");
  const { isValid, error } = validateCategoryName(input.value);

  errorSpan.textContent = "";

  if (!isValid) {
    errorSpan.textContent = error;
    return;
  }

  addCategory(input.value);
  input.value = "";

  renderCategoriesList();
  populateCategoryFilterDropdown();

  // If the product modal is open behind this one, keep its
  // dropdown in sync too (e.g. owner clicked "+" mid-form).
  if (!document.getElementById("productModal").classList.contains("hidden")) {
    populateProductCategorySelect(document.getElementById("productCategory").value);
  }

  showToast("Category added.", "success");
}

/* =========================================================
   REORDER MODAL
   -----------------------------------------------------------
   Opened from the "Reorder" button on the Reorder Alerts page.
   Lets the owner fill in everything needed to restock a product
   that has dropped to/below its reorder point: quantity, unit
   price, dealer/supplier, expected delivery date, and notes.
========================================================= */

function openReorderModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const forecast = getProductForecast(product);
  // Suggests enough stock to climb back above the reorder point
  // plus a safety-stock buffer — the owner can always change it.
  const suggestedQuantity = Math.max(
    Math.ceil(forecast.reorderPoint - product.stock + product.safetyStock),
    1
  );

  // Unit price is fixed to the product's current cost price — the
  // owner can't edit it from this form.
  const fixedUnitPrice = product.costPrice;

  // Expected delivery date is randomized (1-7 days out from today)
  // and calculated automatically the moment the order is placed —
  // it isn't something the owner picks manually.
  const expectedDate = addDaysToDate(getTodayDate(), randomInt(1, 7));

  document.getElementById("reorderProductId").value = product.id;
  document.getElementById("reorderProductName").value = product.name;
  document.getElementById("reorderCurrentStock").value = `${product.stock} unit(s)`;
  document.getElementById("reorderQuantity").value = suggestedQuantity;
  document.getElementById("reorderUnitPrice").value = fixedUnitPrice;
  document.getElementById("reorderUnitPrice").dataset.fixedPrice = fixedUnitPrice;
  document.getElementById("reorderExpectedDate").value = formatDateForDisplay(expectedDate);
  document.getElementById("reorderExpectedDate").dataset.isoDate = expectedDate;
  document.getElementById("reorderNotes").value = "";

  document.querySelectorAll("#reorderForm .error-text").forEach((el) => (el.textContent = ""));
  updateReorderTotalBill();
  document.getElementById("reorderModal").classList.remove("hidden");
}

/**
 * Recomputes and displays the total bill (quantity × fixed unit
 * price) shown below the reorder form. Called whenever the modal
 * opens and whenever the owner changes the quantity.
 */
function updateReorderTotalBill() {
  const quantity = Number(document.getElementById("reorderQuantity").value) || 0;
  const unitPrice = Number(document.getElementById("reorderUnitPrice").dataset.fixedPrice) || 0;
  const total = quantity * unitPrice;
  document.getElementById("reorderTotalBill").textContent =
    `₹${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function closeReorderModal() {
  document.getElementById("reorderModal").classList.add("hidden");
}

function handleReorderFormSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById("reorderProductId").value;
  const product = getProductById(productId);
  const values = {
    quantity: document.getElementById("reorderQuantity").value,
    unitPrice: document.getElementById("reorderUnitPrice").dataset.fixedPrice,
    dealer: (product && product.dealer) || "",
    expectedDate: document.getElementById("reorderExpectedDate").dataset.isoDate || "",
    notes: document.getElementById("reorderNotes").value,
  };

  const { isValid, errors } = validateReorder(values);

  document.querySelectorAll("#reorderForm .error-text").forEach((el) => (el.textContent = ""));

  if (!isValid) {
    if (errors.quantity) document.getElementById("err-reorderQuantity").textContent = errors.quantity;
    if (errors.unitPrice) document.getElementById("err-reorderUnitPrice").textContent = errors.unitPrice;
    return;
  }

  const reorder = placeReorder(productId, values);
  const totalBill = reorder.quantity * reorder.unitPrice;
  showToast(
    `Reorder placed: ${reorder.quantity} unit(s), total bill ₹${totalBill.toLocaleString("en-IN", { maximumFractionDigits: 2 })}.`,
    "success"
  );
  closeReorderModal();
  renderDashboard();
}

function handleCategoryListClick(e) {
  const button = e.target.closest("button[data-action='delete-category']");
  if (!button) return;

  const name = button.dataset.name;
  const confirmed = confirm(
    `Delete category "${name}"? Products already using it will keep their existing value.`
  );
  if (!confirmed) return;

  deleteCategory(name);
  renderCategoriesList();
  populateCategoryFilterDropdown();

  if (!document.getElementById("productModal").classList.contains("hidden")) {
    populateProductCategorySelect(document.getElementById("productCategory").value);
  }

  renderDashboard(); // in case the deleted category was the active filter
  showToast("Category deleted.", "success");
}
