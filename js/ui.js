/* =========================================================
   ui.js
   -----------------------------------------------------------
   Everything that touches the DOM (reading form values aside)
   lives here: building table rows, updating stat cards,
   showing/hiding the empty state, and the reorder alert banner.
   app.js calls renderDashboard() whenever data changes.
========================================================= */

/**
 * Master render function — call this any time products or sales
 * change (after add/edit/delete/sale) so the whole dashboard
 * reflects the latest data in localStorage.
 */
function renderDashboard() {
  const visibleProducts = getFilteredAndSortedProducts();
  renderProductsTable(visibleProducts);
  renderStats();
  renderAlertBanner();
  renderTopSellingProducts();
  renderSoldProductsView();
  renderDailySalesView();
  renderReorderView();
}

/**
 * Reads the search box, filter dropdown and sort dropdown,
 * then returns the products array transformed accordingly.
 * Kept in ui.js (rather than product.js) because it depends
 * directly on the current state of the UI controls.
 */
function getFilteredAndSortedProducts() {
  const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
  const statusFilter = document.getElementById("filterStatus").value;
  const categoryFilterEl = document.getElementById("categoryFilter");
  const categoryFilter = categoryFilterEl ? categoryFilterEl.value : "all";
  const sortBy = document.getElementById("sortBy").value;

  let products = getProducts();


  products = products.map((product) => ({
    ...product,
    forecast: getProductForecast(product),
  }));

  // ----- SEARCH (by name) -----
  if (searchTerm) {
    products = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm)
    );
  }

  // ----- FILTER (by category) -----
  if (categoryFilter && categoryFilter !== "all") {
    products = products.filter((product) => product.category === categoryFilter);
  }

  if (statusFilter !== "all") {
    products = products.filter((product) => product.forecast.status === statusFilter);
  }


  products.sort((a, b) => {
    switch (sortBy) {
      case "stock":
        return a.stock - b.stock;
      case "demand":
        return b.forecast.averageDemand - a.forecast.averageDemand;
      case "reorder":
        return b.forecast.reorderPoint - a.forecast.reorderPoint;
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return products;
}

/**
 * Builds and injects one <tr> per product into the table body.
 */
function renderProductsTable(products) {
  const tbody = document.getElementById("productsTableBody");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = ""; // clear previous render before repainting

  if (products.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  products.forEach((product) => {
    const row = buildProductRow(product);
    tbody.appendChild(row);
  });
}

/**
 * Creates a single table row (as a real DOM element) for one product.
 * We build it with document.createElement + template literals rather
 * than one giant innerHTML string, so event listeners can be attached
 * safely afterwards (avoids re-parsing issues with inline onclick).
 */
function buildProductRow(product) {
  const tr = document.createElement("tr");
  const { averageDemand, reorderPoint, status } = product.forecast;

  const statusBadge =
    status === "reorder"
      ? `<span class="badge badge-danger">🔴 Needs Reorder</span>`
      : `<span class="badge badge-healthy">🟢 Healthy</span>`;

  const thumbHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
    : `<div class="product-thumb-placeholder">${getInitials(product.name)}</div>`;

  tr.innerHTML = `
    <td>
      <div class="product-cell">
        ${thumbHtml}
        <div>
          <div class="product-name">${product.name}</div>
        </div>
      </div>
    </td>
    <td><span class="product-category">${product.category}</span></td>
    <td class="mono">₹${product.costPrice}</td>
    <td class="mono">₹${product.sellingPrice}</td>
    <td class="mono">${product.stock}</td>
    <td class="mono">${averageDemand}</td>
    <td class="mono">${product.leadTime}d</td>
    <td class="mono">${product.safetyStock}</td>
    <td class="mono">${reorderPoint}</td>
    <td>${statusBadge}</td>
    <td>
      <div class="row-actions">
        <button class="btn-icon-sm primary" data-action="edit" data-id="${product.id}" title="Edit">&#9998;</button>
        <button class="btn-icon-sm danger" data-action="delete" data-id="${product.id}" title="Delete">&#128465;</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Creates a single table row for the Reorder Alerts table.
 * Same columns as buildProductRow(), except the "Status" cell
 * swaps the "Needs Reorder" badge for a "Reorder" button that
 * opens the reorder form for that product.
 */
function buildReorderRow(product) {
  const tr = document.createElement("tr");
  const { averageDemand, reorderPoint } = product.forecast;

  const thumbHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
    : `<div class="product-thumb-placeholder">${getInitials(product.name)}</div>`;

  tr.innerHTML = `
    <td>
      <div class="product-cell">
        ${thumbHtml}
        <div>
          <div class="product-name">${product.name}</div>
        </div>
      </div>
    </td>
    <td><span class="product-category">${product.category}</span></td>
    <td class="mono">₹${product.costPrice}</td>
    <td class="mono">₹${product.sellingPrice}</td>
    <td class="mono">${product.stock}</td>
    <td class="mono">${averageDemand}</td>
    <td class="mono">${product.leadTime}d</td>
    <td class="mono">${product.safetyStock}</td>
    <td class="mono">${reorderPoint}</td>
    <td>
      <button class="btn btn-sm btn-primary" data-action="reorder" data-id="${product.id}">Reorder</button>
    </td>
    <td>
      <div class="row-actions">
        <button class="btn-icon-sm primary" data-action="edit" data-id="${product.id}" title="Edit">&#9998;</button>
        <button class="btn-icon-sm danger" data-action="delete" data-id="${product.id}" title="Delete">&#128465;</button>
      </div>
    </td>
  `;

  return tr;
}

/**
 * Updates the 4 stat cards at the top of the dashboard.
 */
function renderStats() {
  const products = getProducts().map((product) => ({
    ...product,
    forecast: getProductForecast(product),
  }));
  const sales = getSales();

  const healthyCount = products.filter((p) => p.forecast.status === "healthy").length;
  const reorderCount = products.filter((p) => p.forecast.status === "reorder").length;

  document.getElementById("statTotalProducts").textContent = products.length;
  document.getElementById("statHealthy").textContent = healthyCount;
  document.getElementById("statReorder").textContent = reorderCount;
  document.getElementById("statTotalSales").textContent = sales.length;

  // Inventory value: ₹ total is synchronous (just a reduce() over
  // products), the $ estimate comes from currency.js's Fetch API
  // call and fills in a moment later once the request resolves.
  const totalInrValue = calculateTotalInventoryValue();
  document.getElementById("statInventoryValue").textContent = `₹${totalInrValue.toLocaleString("en-IN")}`;
  renderInventoryValueInUsd(totalInrValue);
}

/**
 * Shows a banner at the top of the dashboard listing which
 * products need reordering right now. Hides itself if none do.
 */
function renderAlertBanner() {
  const products = getProducts().map((product) => ({
    ...product,
    forecast: getProductForecast(product),
  }));

  const needsReorder = products.filter((p) => p.forecast.status === "reorder");
  const banner = document.getElementById("alertBanner");
  const alertText = document.getElementById("alertText");

  if (needsReorder.length === 0) {
    banner.classList.add("hidden");
    return;
  }

  const names = needsReorder.map((p) => p.name).join(", ");
  alertText.textContent = `${needsReorder.length} product(s) need reordering: ${names}`;
  banner.classList.remove("hidden");
}

/**
 * Renders the "Top Selling Products" panel using the ranked list
 * from analytics.js (getTopSellingProducts). Each row shows a
 * rank badge, the product name, a proportional bar (relative to
 * the #1 seller), and the raw quantity sold.
 */
function renderTopSellingProducts() {
  const container = document.getElementById("topProductsList");
  const emptyState = document.getElementById("topProductsEmpty");
  if (!container) return;

  const topProducts = getTopSellingProducts();

  container.innerHTML = "";

  if (topProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  // The #1 seller's quantity is used as 100% for the bar widths,
  // so every other row is shown relative to the top performer.
  const highestQuantity = topProducts[0].quantitySold;

  topProducts.forEach((entry, index) => {
    container.appendChild(buildTopProductRow(entry, index, highestQuantity));
  });
}

function buildTopProductRow(entry, index, highestQuantity) {
  const { product, quantitySold } = entry;
  const row = document.createElement("div");
  row.className = "top-product-row";

  const barPercent = highestQuantity > 0 ? Math.round((quantitySold / highestQuantity) * 100) : 0;

  row.innerHTML = `
    <span class="top-product-rank">#${index + 1}</span>
    <div class="top-product-info">
      <span class="top-product-name">${product.name}</span>
      <div class="top-product-bar-track">
        <div class="top-product-bar-fill" style="width: ${barPercent}%"></div>
      </div>
    </div>
    <span class="top-product-qty mono">${quantitySold} sold</span>
  `;

  return row;
}

/* =========================================================
   CATEGORIES — dropdowns & management list
========================================================= */

/**
 * Fills a <select> element with the owner's category list.
 * Shared by the product form's category dropdown and the
 * topbar's category filter dropdown (they only differ in
 * whether the first option is "All Categories" or a
 * "-- Select a category --" placeholder).
 */
function populateCategorySelect(selectEl, { includeAllOption = false, selectedValue = "" } = {}) {
  if (!selectEl) return;

  const categories = getSortedCategories();

  selectEl.innerHTML = "";

  const firstOption = document.createElement("option");
  if (includeAllOption) {
    firstOption.value = "all";
    firstOption.textContent = "All Categories";
  } else {
    firstOption.value = "";
    firstOption.textContent = "-- Select a category --";
  }
  selectEl.appendChild(firstOption);

  // Editing a product whose category was later deleted from the
  // master list? Still show it as a selectable option so we don't
  // silently blank out existing data.
  if (!includeAllOption && selectedValue && !categories.includes(selectedValue)) {
    categories.push(selectedValue);
    categories.sort((a, b) => a.localeCompare(b));
  }

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectEl.appendChild(option);
  });

  selectEl.value = includeAllOption ? "all" : selectedValue;
}

/**
 * Refills the product form's category dropdown. Called every
 * time the Add/Edit Product modal opens, and again after a
 * category is added/deleted while that modal is open.
 */
function populateProductCategorySelect(selectedValue = "") {
  populateCategorySelect(document.getElementById("productCategory"), {
    includeAllOption: false,
    selectedValue,
  });
}

/**
 * Refills the topbar's "Filter by Category" dropdown, preserving
 * the current selection if it still exists (falls back to "All
 * Categories" if the selected category was just deleted).
 */
function populateCategoryFilterDropdown() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const previousValue = select.value || "all";
  populateCategorySelect(select, { includeAllOption: true, selectedValue: "all" });

  const stillExists = Array.from(select.options).some((opt) => opt.value === previousValue);
  select.value = stillExists ? previousValue : "all";
}

/**
 * Renders the category list inside the "Manage Categories" modal,
 * one row per category with a delete button.
 */
function renderCategoriesList() {
  const listEl = document.getElementById("categoriesList");
  const emptyEl = document.getElementById("categoriesEmptyState");
  if (!listEl) return;

  const categories = getSortedCategories();
  listEl.innerHTML = "";

  if (categories.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  categories.forEach((category) => {
    const li = document.createElement("li");
    li.className = "category-row";
    li.innerHTML = `
      <span>${category}</span>
      <button type="button" class="btn-icon-sm danger" data-action="delete-category" data-name="${category}" title="Delete category">&#128465;</button>
    `;
    listEl.appendChild(li);
  });
}

/* =========================================================
   SIDEBAR NAVIGATION — switching between the 3 pages
   (Dashboard / Sold Products / Reorder Alerts).
   "Record Sale" is handled separately in app.js since it just
   opens a modal instead of switching a page.
========================================================= */

/**
 * Shows the view matching `section` ("dashboard" | "products" | "alerts")
 * and hides the other two. Also (re)renders that view's content so
 * it's never stale when you switch to it.
 */
function switchDashboardView(section) {
  const views = {
    dashboard: document.getElementById("dashboardView"),
    products: document.getElementById("soldProductsView"),
    alerts: document.getElementById("reorderView"),
  };

  Object.keys(views).forEach((key) => {
    const el = views[key];
    if (!el) return;
    el.classList.toggle("hidden", key !== section);
  });

  if (section === "products") {
    renderSoldProductsView();
    renderDailySalesView();
  }
  if (section === "alerts") renderReorderView();
}

/**
 * Renders the "Sold Products" page: total items sold, total
 * revenue, total profit (from analytics.js's getSoldProductsSummary),
 * plus one row per product that has ever been sold.
 */
function renderSoldProductsView() {
  const tbody = document.getElementById("soldProductsTableBody");
  const emptyState = document.getElementById("soldProductsEmptyState");
  if (!tbody) return;

  const { soldProducts, totalItemsSold, totalRevenue, totalProfit } = getSoldProductsSummary();

  document.getElementById("statSoldTotalItems").textContent = totalItemsSold;
  document.getElementById("statSoldTotalRevenue").textContent =
    `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  document.getElementById("statSoldTotalProfit").textContent =
    `₹${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  tbody.innerHTML = "";

  if (soldProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  soldProducts.forEach((entry) => {
    tbody.appendChild(buildSoldProductRow(entry));
  });
}

function buildSoldProductRow(entry) {
  const { product, quantitySold, revenue, profit } = entry;
  const tr = document.createElement("tr");

  const thumbHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
    : `<div class="product-thumb-placeholder">${getInitials(product.name)}</div>`;

  tr.innerHTML = `
    <td>
      <div class="product-cell">
        ${thumbHtml}
        <div class="product-name">${product.name}</div>
      </div>
    </td>
    <td><span class="product-category">${product.category}</span></td>
    <td class="mono">${quantitySold}</td>
    <td class="mono">₹${revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
    <td class="mono">₹${profit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
  `;

  return tr;
}

/**
 * Renders the "Daily Sales" panel: reads whichever date is
 * selected in the #dailySalesDate input (defaults to today if
 * empty), pulls that date's sales via analytics.js's
 * getDailySalesSummary(), and renders summary chips + a table.
 * Reuses buildSoldProductRow() since the columns are identical
 * to the all-time Sold Products table — just pre-filtered to
 * one day.
 */
function renderDailySalesView() {
  const dateInput = document.getElementById("dailySalesDate");
  const tbody = document.getElementById("dailySalesTableBody");
  const emptyState = document.getElementById("dailySalesEmptyState");
  const summaryEl = document.getElementById("dailySalesSummary");
  if (!dateInput || !tbody) return;

  const selectedDate = dateInput.value || getTodayDate();
  const { dailyProducts, totalItemsSold, totalRevenue, totalProfit } = getDailySalesSummary(selectedDate);

  summaryEl.innerHTML = `
    <div class="daily-summary-chip">
      <span class="daily-summary-label">Items Sold</span>
      <span class="daily-summary-value">${totalItemsSold}</span>
    </div>
    <div class="daily-summary-chip">
      <span class="daily-summary-label">Revenue</span>
      <span class="daily-summary-value">₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
    </div>
    <div class="daily-summary-chip daily-summary-chip-success">
      <span class="daily-summary-label">Profit</span>
      <span class="daily-summary-value">₹${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
    </div>
  `;

  tbody.innerHTML = "";

  if (dailyProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  dailyProducts.forEach((entry) => {
    tbody.appendChild(buildSoldProductRow(entry));
  });
}

/**
 * Renders the "Reorder Alerts" page: ONLY products whose status
 * is "reorder" (current stock <= reorder point), sorted so the
 * most urgent (lowest stock left) shows first. Uses buildReorderRow(),
 * which mirrors the main Inventory table layout but swaps the
 * "Needs Reorder" badge for a "Reorder" button that opens the
 * reorder form for that product.
 */
function renderReorderView() {
  const tbody = document.getElementById("reorderTableBody");
  const emptyState = document.getElementById("reorderEmptyState");
  if (!tbody) return;

  const reorderProducts = getProducts()
    .map((product) => ({ ...product, forecast: getProductForecast(product) }))
    .filter((product) => product.forecast.status === "reorder")
    .sort((a, b) => a.stock - b.stock);

  tbody.innerHTML = "";

  if (reorderProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  reorderProducts.forEach((product) => {
    tbody.appendChild(buildReorderRow(product));
  });
}

/**
 * Refills the "Product" <select> inside the Record Sale modal
 * with the current list of products. Called every time that
 * modal is opened, so it's never stale.
 */
function populateSaleProductDropdown() {
  const select = document.getElementById("saleProduct");
  const products = getProducts();

  select.innerHTML = `<option value="">-- Select a product --</option>`;

  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} (${product.stock} in stock)`;
    select.appendChild(option);
  });
}
