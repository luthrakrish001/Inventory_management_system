
let editingProductId = null;


let selectedImageData = null;

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  renderLoggedInUser();
  await Promise.all([
    loadCategoriesFromDB(),
    loadProductsFromDB(),
    loadSalesFromDB(),
    loadReordersFromDB(),
  ]);
  populateCategoryFilterDropdown();
  document.getElementById("dailySalesDate").value = getTodayDate();
  renderDashboard();
  attachEventListeners();
}


function renderLoggedInUser() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById("topbarUserName").textContent = user.name;
  document.getElementById("topbarUserEmail").textContent = user.email;
  document.getElementById("topbarAvatar").textContent = getInitials(user.name);
}

function attachEventListeners() {

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


  document.getElementById("searchInput").addEventListener("input", renderDashboard);
  document.getElementById("filterStatus").addEventListener("change", renderDashboard);
  document.getElementById("categoryFilter").addEventListener("change", renderDashboard);
  document.getElementById("sortBy").addEventListener("change", renderDashboard);
  document.getElementById("dailySalesDate").addEventListener("change", renderDailySalesView);


  document.getElementById("manageCategoriesBtn").addEventListener("click", openCategoriesModal);
  document.getElementById("manageCategoriesFromProductBtn").addEventListener("click", openCategoriesModal);
  document.getElementById("closeCategoriesModal").addEventListener("click", closeCategoriesModal);
  document.getElementById("categoryForm").addEventListener("submit", handleCategoryFormSubmit);
  document.getElementById("categoriesList").addEventListener("click", handleCategoryListClick);


  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Log out of InventoryPilot?")) {
      logoutUser();
    }
  });


  document.getElementById("openAddProductBtn").addEventListener("click", openAddProductModal);
  document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
  document.getElementById("cancelProductBtn").addEventListener("click", closeProductModal);


  document.getElementById("photoUploadBox").addEventListener("click", () => {
    document.getElementById("productImage").click();
  });
  document.getElementById("productImage").addEventListener("change", handleImageSelect);

  document.getElementById("productForm").addEventListener("submit", handleProductFormSubmit);


  document.getElementById("closeSaleModal").addEventListener("click", closeSaleModal);
  document.getElementById("cancelSaleBtn").addEventListener("click", closeSaleModal);


  document.getElementById("saleForm").addEventListener("submit", handleSaleFormSubmit);


  document.getElementById("closeReorderModal").addEventListener("click", closeReorderModal);
  document.getElementById("cancelReorderBtn").addEventListener("click", closeReorderModal);


  document.getElementById("reorderForm").addEventListener("submit", handleReorderFormSubmit);


  document.getElementById("reorderQuantity").addEventListener("input", updateReorderTotalBill);


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


async function handleProductFormSubmit(e) {
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

  const saveBtn = document.getElementById("saveProductBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {
    if (editingProductId) {
      await updateProduct(editingProductId, values, selectedImageData);
      showToast("Product updated in MongoDB Atlas.", "success");
    } else {
      await addProduct(values, selectedImageData);
      showToast("Product saved to MongoDB Atlas.", "success");
    }
    closeProductModal();
    renderDashboard();
  } catch (err) {
    showToast(err.message || "Failed to save product in MongoDB Atlas.", "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = editingProductId ? "Update Product" : "Save Product";
    }
  }
}


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

async function handleDeleteProduct(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const confirmed = confirm(`Delete "${product.name}"? This will permanently remove it from MongoDB Atlas.`);
  if (!confirmed) return;

  try {
    await deleteProduct(productId);
    showToast("Product deleted from MongoDB Atlas.", "success");
    renderDashboard();
  } catch (err) {
    showToast(err.message || "Failed to delete product from MongoDB Atlas.", "error");
  }
}



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

async function handleSaleFormSubmit(e) {
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

  try {
    await recordSale(values);
    showToast("Sale recorded in MongoDB Atlas — stock updated.", "success");
    closeSaleModal();
    renderDashboard();
  } catch (err) {
    showToast(err.message || "Failed to record sale in MongoDB Atlas.", "error");
  }
}



function openCategoriesModal() {
  renderCategoriesList();
  document.getElementById("categoryForm").reset();
  document.getElementById("err-newCategoryName").textContent = "";
  document.getElementById("categoriesModal").classList.remove("hidden");
}

function closeCategoriesModal() {
  document.getElementById("categoriesModal").classList.add("hidden");


  populateCategoryFilterDropdown();
  if (!document.getElementById("productModal").classList.contains("hidden")) {
    populateProductCategorySelect(document.getElementById("productCategory").value);
  }
  renderDashboard();
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const input = document.getElementById("newCategoryName");
  const errorSpan = document.getElementById("err-newCategoryName");
  const { isValid, error } = validateCategoryName(input.value);

  errorSpan.textContent = "";

  if (!isValid) {
    errorSpan.textContent = error;
    return;
  }

  try {
    await addCategory(input.value);
    input.value = "";

    renderCategoriesList();
    populateCategoryFilterDropdown();

    if (!document.getElementById("productModal").classList.contains("hidden")) {
      populateProductCategorySelect(document.getElementById("productCategory").value);
    }

    showToast("Category created in MongoDB Atlas.", "success");
  } catch (err) {
    errorSpan.textContent = err.message || "Failed to add category to MongoDB";
  }
}


function openReorderModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const forecast = getProductForecast(product);

  const suggestedQuantity = Math.max(
    Math.ceil(forecast.reorderPoint - product.stock + product.safetyStock),
    1
  );


  const fixedUnitPrice = product.costPrice;


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

async function handleReorderFormSubmit(e) {
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

  try {
    const reorder = await placeReorder(productId, values);
    const totalBill = reorder.quantity * reorder.unitPrice;
    showToast(
      `Reorder placed in MongoDB Atlas: ${reorder.quantity} unit(s) restocked, total bill ₹${totalBill.toLocaleString("en-IN", { maximumFractionDigits: 2 })}.`,
      "success"
    );
    closeReorderModal();
    renderDashboard();
  } catch (err) {
    showToast(err.message || "Failed to place reorder in MongoDB Atlas.", "error");
  }
}

async function handleCategoryListClick(e) {
  const button = e.target.closest("button[data-action='delete-category']");
  if (!button) return;

  const name = button.dataset.name;
  const confirmed = confirm(
    `Delete category "${name}"? Products already using it will keep their existing value.`
  );
  if (!confirmed) return;

  try {
    await deleteCategory(name);
    renderCategoriesList();
    populateCategoryFilterDropdown();

    if (!document.getElementById("productModal").classList.contains("hidden")) {
      populateProductCategorySelect(document.getElementById("productCategory").value);
    }

    renderDashboard();
    showToast("Category deleted from MongoDB Atlas.", "success");
  } catch (err) {
    showToast(err.message || "Failed to delete category from MongoDB Atlas.", "error");
  }
}
